import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDaysIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { useParams, Link } from 'react-router-dom';
import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Header from '../Header';
import { db } from '../firebaseDb';
import { fetchMeydanSpotlight } from '../service/meydanSpotlightService';
import { fetchMeydanWeather, toWeatherErrorMessage } from '../service/weatherService';
import { normalizeMeydanInput } from '../utils/meydanNormalization';
import { getWeekDates, isShiftActive, toDateKey } from '../utils/date';

function isLeaveShift(type) {
  return type === 'Izinli' || type === 'İzinli' || type === 'HAFTA TATILI' || type === 'HAFTA TATİLİ';
}

function normalizeDateKey(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const ymdMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${String(Number(year)).padStart(4, '0')}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
  }

  const dmyMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${String(Number(year)).padStart(4, '0')}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
  }

  const monthMap = {
    oca: 1,
    ocak: 1,
    sub: 2,
    subat: 2,
    mar: 3,
    mart: 3,
    nis: 4,
    nisan: 4,
    may: 5,
    mayis: 5,
    haz: 6,
    haziran: 6,
    tem: 7,
    temmuz: 7,
    agu: 8,
    agustos: 8,
    eyl: 9,
    eylul: 9,
    eki: 10,
    ekim: 10,
    kas: 11,
    kasim: 11,
    ara: 12,
    aralik: 12,
  };

  const normalized = raw
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    const day = Number(parts[0].replace(/\D/g, ''));
    const month = monthMap[parts[1]];
    const year = Number((parts[2] || '').replace(/\D/g, '')) || new Date().getFullYear();

    if (day && month) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return raw;
}

function formatTemp(value) {
  if (!Number.isFinite(Number(value))) {
    return '--';
  }

  return `${Math.round(Number(value))}°`;
}

function formatHour(unixSeconds) {
  if (!Number.isFinite(Number(unixSeconds))) {
    return '--:--';
  }

  return new Date(Number(unixSeconds) * 1000).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatWind(speedMs) {
  if (!Number.isFinite(Number(speedMs))) {
    return '--';
  }

  const kmh = Number(speedMs) * 3.6;
  return `${Math.round(kmh)} km/sa`;
}

function ShiftBadge({ vardiya, isToday }) {
  if (!vardiya) {
    return <span className="shift-badge shift-badge--empty">-</span>;
  }

  if (isLeaveShift(vardiya.vardiyaTipi)) {
    return <span className="shift-badge shift-badge--off">Izinli</span>;
  }

  const active = isToday && isShiftActive(vardiya.saatAraligi);

  return (
    <span className={`shift-badge ${active ? 'shift-badge--active' : 'shift-badge--scheduled'}`}>
      {isToday ? <span className="shift-badge__dot" aria-hidden="true" /> : null}
      {vardiya.saatAraligi || '-'}
    </span>
  );
}

function InsightPanel({ kicker, title, description, items, variant, icon: Icon, badge, emptyMessage }) {
  return (
    <aside className={`detail-insight detail-insight--${variant}`}>
      <div className="detail-insight__top">
        <div>
          {kicker ? <span className="section-kicker">{kicker}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>

        <div className="detail-insight__icon-wrap" aria-hidden="true">
          <Icon className="detail-insight__icon" />
        </div>
      </div>

      {badge ? <div className="detail-insight__badge">{badge}</div> : null}

      {items.length ? (
        <ol className="detail-insight__list">
          {items.map((item, index) => (
            <li key={`${variant}-${index}-${item.title}`} className="detail-insight__item">
              <span className="detail-insight__rank">{index + 1}</span>
              <div>
                {item.link ? (
                  <Link to={item.link} className="detail-insight__link"><strong>{item.title}</strong></Link>
                ) : (
                  <strong>{item.title}</strong>
                )}
                {item.description ? <small>{item.description}</small> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="detail-insight__empty">{emptyMessage}</div>
      )}
    </aside>
  );
}

// ─── Başvuru Gündemi bileşenleri ──────────────────────────────────────────────

const KONU_COLORS = [
  '#00498E', '#0071BC', '#3B9EE0', '#6BB8ED',
  '#F4A823', '#E07B39', '#E05C6B', '#8B5CF6',
];

function ChartYTick({ x, y, payload }) {
  const label = String(payload?.value || '');
  const truncated = label.length > 17 ? label.slice(0, 16) + '…' : label;
  return (
    <text x={x} y={y} textAnchor="end" fill="#666" fontSize={11} dy="0.35em">
      {truncated}
    </text>
  );
}

function formatTarih(tarihStr) {
  if (!tarihStr) return '—';
  const parts = tarihStr.split('-');
  if (parts.length !== 3) return tarihStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function toKonuDisplay(str) {
  if (!str) return str;
  return str
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .trim();
}

function DurumBadge({ durum }) {
  const closed = durum === 'Kapandı' || durum === 'Çözüldü';
  const cls = closed
    ? 'bg-chip bg-chip--green'
    : durum === 'Beklemede' || durum === 'Planlama' || durum === 'Atama Bekliyor'
      ? 'bg-chip bg-chip--orange'
      : 'bg-chip bg-chip--gray';
  return <span className={cls}>{durum || '—'}</span>;
}

function isClosedStatus(value) {
  const status = String(value || '').trim().toLocaleLowerCase('tr-TR');
  return status === 'kapandı' || status === 'çözüldü';
}

const ALL_PAGE_SIZE = 50;

function BasvuruGundemPanel({ meydanId }) {
  const [stats, setStats]           = useState(null);
  const [recent, setRecent]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAll, setShowAll]       = useState(false);
  const [allDocs, setAllDocs]       = useState([]);
  const [lastDoc, setLastDoc]       = useState(null);
  const [allLoading, setAllLoading] = useState(false);
  const [hasMore, setHasMore]       = useState(false);
  const [expanded, setExpanded]     = useState(null); // basvuruNo of expanded row
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all'); // Normalized category filter
  const [searchTerm, setSearchTerm] = useState('');
  const [chartTopicFilter, setChartTopicFilter] = useState('');

  // Load stats + recent
  useEffect(() => {
    let active = true;
    setLoading(true);
    setStats(null);
    setRecent([]);
    setShowAll(false);
    setAllDocs([]);
    setLastDoc(null);
    setFilterMonth('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setSearchTerm('');
    setChartTopicFilter('');

    async function load() {
      try {
        const [statsSnap, recentSnap] = await Promise.all([
          getDoc(doc(db, 'meydanBasvuruStats', meydanId)),
          getDocs(
            query(
              collection(db, 'meydanBasvurulari'),
              where('meydanId', '==', meydanId),
              orderBy('tarih', 'desc'),
              limit(15),
            ),
          ),
        ]);

        if (!active) return;

        if (statsSnap.exists()) setStats(statsSnap.data());

        setRecent(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // Non-critical; fail silently
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [meydanId]);

  // Load first page of all records
  const openAll = useCallback(async () => {
    setShowAll(true);
    if (allDocs.length > 0) return; // already loaded
    setAllLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'meydanBasvurulari'),
          where('meydanId', '==', meydanId),
          orderBy('tarih', 'desc'),
          limit(ALL_PAGE_SIZE),
        ),
      );
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllDocs(docs);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === ALL_PAGE_SIZE);
    } catch {
      // ignore
    } finally {
      setAllLoading(false);
    }
  }, [meydanId, allDocs.length]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (!lastDoc || allLoading) return;
    setAllLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'meydanBasvurulari'),
          where('meydanId', '==', meydanId),
          orderBy('tarih', 'desc'),
          limit(ALL_PAGE_SIZE),
          startAfter(lastDoc),
        ),
      );
      const newDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllDocs((prev) => [...prev, ...newDocs]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === ALL_PAGE_SIZE);
    } catch {
      // ignore
    } finally {
      setAllLoading(false);
    }
  }, [meydanId, lastDoc, allLoading]);

  const displayList = showAll ? allDocs : recent;

  const statusOptions = useMemo(() => {
    const list = Array.from(new Set(displayList.map((item) => String(item?.durum || '').trim()).filter(Boolean)));
    return list.sort((left, right) => left.localeCompare(right, 'tr'));
  }, [displayList]);

  const monthOptions = useMemo(() => {
    const list = Array.from(new Set(displayList.map((item) => String(item?.ay || '').trim()).filter(Boolean)));
    return list.sort((left, right) => right.localeCompare(left, 'tr'));
  }, [displayList]);

  const categoryOptions = useMemo(() => {
    const list = Array.from(new Set(displayList.map((item) => String(item?.category || '').trim()).filter(Boolean)));
    return list.sort((left, right) => left.localeCompare(right, 'tr'));
  }, [displayList]);

  const hasActiveFilters = filterMonth !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || searchTerm.trim() !== '' || chartTopicFilter;

  const baseFilteredList = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchTerm);

    return displayList.filter((item) => {
      if (filterMonth !== 'all' && String(item?.ay || '') !== filterMonth) {
        return false;
      }

      if (filterStatus !== 'all' && String(item?.durum || '') !== filterStatus) {
        return false;
      }

      if (filterCategory !== 'all' && String(item?.category || '') !== filterCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = normalizeSearchText([
        item?.konu,
        item?.altKonu,
        item?.aciklama,
        item?.ilgiliOlduguBirim,
        item?.basvuruNo,
      ].join(' '));

      return haystack.includes(normalizedSearch);
    });
  }, [displayList, filterMonth, filterStatus, filterCategory, searchTerm]);

  const filteredList = useMemo(() => {
    if (!chartTopicFilter) {
      return baseFilteredList;
    }

    return baseFilteredList.filter((item) => toKonuDisplay(item?.konu) === chartTopicFilter);
  }, [baseFilteredList, chartTopicFilter]);

  // Konu chart data (top 8)
  const chartData = useMemo(() => {
    const source = baseFilteredList;
    if (!source.length) return [];

    const map = new Map();
    source.forEach((item) => {
      const key = String(item?.konu || '').trim();
      if (!key) {
        return;
      }

      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name: toKonuDisplay(name), value }));
  }, [baseFilteredList]);

  // Kategori chart data (normalized categories)
  const categoryChartData = useMemo(() => {
    const source = baseFilteredList;
    if (!source.length) return [];

    const map = new Map();
    source.forEach((item) => {
      const key = String(item?.category || 'DIGER').trim();
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [baseFilteredList]);

  const trendData = useMemo(() => {
    const source = showAll || hasActiveFilters ? filteredList : null;

    if (!source && stats?.aylikDagilim) {
      return Object.entries(stats.aylikDagilim)
        .sort((left, right) => left[0].localeCompare(right[0], 'tr'))
        .map(([month, count]) => ({ month, count, monthLabel: month.slice(5, 7) }));
    }

    const map = new Map();
    (source || filteredList).forEach((item) => {
      const month = String(item?.ay || '').trim();
      if (!month) {
        return;
      }

      map.set(month, (map.get(month) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((left, right) => left[0].localeCompare(right[0], 'tr'))
      .map(([month, count]) => ({ month, count, monthLabel: month.slice(5, 7) }));
  }, [filteredList, hasActiveFilters, showAll, stats]);

  const agingBuckets = useMemo(() => {
    if (!showAll) {
      return null;
    }

    const today = new Date();
    const openRows = filteredList.filter((item) => !isClosedStatus(item?.durum));
    const buckets = { b0_3: 0, b4_7: 0, b8_14: 0, b15_plus: 0 };

    openRows.forEach((item) => {
      const raw = String(item?.tarih || '').trim();
      if (!raw) {
        buckets.b15_plus += 1;
        return;
      }

      const createdAt = new Date(raw);
      if (Number.isNaN(createdAt.getTime())) {
        buckets.b15_plus += 1;
        return;
      }

      const days = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (days <= 3) {
        buckets.b0_3 += 1;
      } else if (days <= 7) {
        buckets.b4_7 += 1;
      } else if (days <= 14) {
        buckets.b8_14 += 1;
      } else {
        buckets.b15_plus += 1;
      }
    });

    return {
      ...buckets,
      totalOpen: openRows.length,
    };
  }, [filteredList, showAll]);

  const waitingTimeChartData = useMemo(() => {
    if (!agingBuckets) {
      return [];
    }

    return [
      { label: '0-3 gün', value: agingBuckets.b0_3 },
      { label: '4-7 gün', value: agingBuckets.b4_7 },
      { label: '8-14 gün', value: agingBuckets.b8_14 },
      { label: '15+ gün', value: agingBuckets.b15_plus },
    ];
  }, [agingBuckets]);

  const openCount = useMemo(() => {
    if (!stats?.durumDagilimi) return 0;
    const closed = (stats.durumDagilimi['Kapandı'] || 0) + (stats.durumDagilimi['Çözüldü'] || 0);
    return stats.toplamBasvuru - closed;
  }, [stats]);

  const toggleExpand = useCallback((basvuruNo) => {
    setExpanded((prev) => (prev === basvuruNo ? null : basvuruNo));
  }, []);

  return (
    <aside className="basvuru-gundem-panel">
      {/* Header */}
      <div className="basvuru-gundem-panel__top">
        <div>
          <span className="section-kicker">Başvuru gündemi</span>
          <h2>Kaydedilen Başvurular</h2>
          <p>İBB Meydan Yönetimi bildirimleri ve şikayet kayıtları.</p>
        </div>
        <div className="basvuru-gundem-panel__icon-wrap" aria-hidden="true">
          <ChatBubbleLeftRightIcon className="basvuru-gundem-panel__icon" />
        </div>
      </div>

      {/* Özet istatistik kartları */}
      {stats ? (
        <div className="basvuru-ozet-row">
          <div className="basvuru-ozet-card">
            <span>Toplam Kayıt</span>
            <strong>{stats.toplamBasvuru?.toLocaleString('tr-TR')}</strong>
          </div>
          <div className="basvuru-ozet-card basvuru-ozet-card--green">
            <span>Kapandı</span>
            <strong>{((stats.durumDagilimi?.['Kapandı'] ?? 0) + (stats.durumDagilimi?.['Çözüldü'] ?? 0)).toLocaleString('tr-TR')}</strong>
          </div>
          <div className="basvuru-ozet-card basvuru-ozet-card--orange">
            <span>Beklemede / Diğer</span>
            <strong>{openCount.toLocaleString('tr-TR')}</strong>
          </div>
        </div>
      ) : null}

      <div className="basvuru-filter-row" role="group" aria-label="Başvuru filtreleri">
        <label className="basvuru-filter-field">
          <span>Ay</span>
          <select value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)}>
            <option value="all">Tümü</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </label>

        <label className="basvuru-filter-field">
          <span>Durum</span>
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="all">Tümü</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="basvuru-filter-field">
          <span>Kategori</span>
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
            <option value="all">Tümü</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="basvuru-filter-field basvuru-filter-field--search">
          <span>Konu/Açıklama ara</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="örn. aydınlatma"
          />
        </label>
      </div>

      {hasActiveFilters ? (
        <div className="basvuru-filter-note">Filtre aktif: liste ve konu dağılımı filtreye göre gösteriliyor.</div>
      ) : null}

      {trendData.length > 1 ? (
        <div className="basvuru-trend-wrap">
          <h3 className="basvuru-chart-title">Aylık trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 8, right: 10, left: 6, bottom: 0 }}>
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip
                formatter={(value) => [value.toLocaleString('tr-TR'), 'Başvuru']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.month || ''}
              />
              <Line type="monotone" dataKey="count" stroke="#0f5ca8" strokeWidth={2.2} dot={{ r: 2.8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {agingBuckets ? (
        <div className="basvuru-aging-wrap">
          <h3 className="basvuru-chart-title">Açık kayıt bekleme süresi</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={waitingTimeChartData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={70}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={(value) => [value.toLocaleString('tr-TR'), 'Açık kayıt']} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16} fill="#0f5ca8" />
            </BarChart>
          </ResponsiveContainer>
          <p className="basvuru-aging-note">Bu grafik, kapanmamış kayıtların kaç gündür beklediğini gösterir.</p>
          <p className="basvuru-aging-total">Toplam açık kayıt: {agingBuckets.totalOpen}</p>
        </div>
      ) : (
        <div className="basvuru-aging-hint">Açık kayıt bekleme süresini görmek için "Tüm kayıtlar" görünümünü aç.</div>
      )}

      {/* Konu dağılımı grafiği */}
      {chartData.length > 0 ? (
        <div className="basvuru-chart-wrap">
          <div className="basvuru-chart-title-row">
            <h3 className="basvuru-chart-title">Konu dağılımı</h3>
            {chartTopicFilter ? (
              <button type="button" className="basvuru-topic-filter-chip" onClick={() => setChartTopicFilter('')}>
                {chartTopicFilter} ×
              </button>
            ) : null}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 34)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={<ChartYTick />}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,73,142,0.06)' }}
                formatter={(value) => [value.toLocaleString('tr-TR'), 'Başvuru']}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                barSize={18}
                onClick={(data) => setChartTopicFilter(data?.name || '')}
              >
                {chartData.map((item, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={KONU_COLORS[index % KONU_COLORS.length]}
                    fillOpacity={chartTopicFilter && chartTopicFilter !== item.name ? 0.35 : 1}
                    cursor="pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Kategori dağılımı grafiği */}
      {categoryChartData.length > 0 ? (
        <div className="basvuru-chart-wrap">
          <h3 className="basvuru-chart-title">Kategori dağılımı (Normalized)</h3>
          <ResponsiveContainer width="100%" height={Math.max(160, categoryChartData.length * 34)}>
            <BarChart
              data={categoryChartData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,73,142,0.06)' }}
                formatter={(value) => [value.toLocaleString('tr-TR'), 'Başvuru']}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                barSize={18}
                fill="#0049 8E"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Kayıt listesi */}
      {loading ? (
        <div className="basvuru-list-loading">Yükleniyor…</div>
      ) : filteredList.length > 0 ? (
        <>
          <h3 className="basvuru-list-title">
            {showAll ? `Tüm Kayıtlar (${stats?.toplamBasvuru?.toLocaleString('tr-TR')})` : 'Son başvurular'}
          </h3>
          <ol className="basvuru-list">
            {filteredList.map((item) => {
              const isOpen = expanded === item.basvuruNo;
              return (
                <li key={item.id} className={`basvuru-list__item ${isOpen ? 'is-expanded' : ''}`}>
                  <button
                    type="button"
                    className="basvuru-list__row"
                    onClick={() => toggleExpand(item.basvuruNo)}
                    aria-expanded={isOpen}
                  >
                    <span className="basvuru-list__tarih">{formatTarih(item.tarih)}</span>
                    <span className="basvuru-list__konu">{toKonuDisplay(item.konu) || '—'}</span>
                    <DurumBadge durum={item.durum} />
                    <span className="basvuru-list__chevron" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen ? (
                    <div className="basvuru-list__detail">
                      {item.altKonu ? <p><strong>Alt Konu:</strong> {toKonuDisplay(item.altKonu)}</p> : null}
                      {item.category ? <p><strong>Kategori:</strong> <span style={{ fontWeight: 'normal', fontFamily: 'monospace' }}>{item.category}</span> {item.konuGuveni ? `(${(item.konuGuveni * 100).toFixed(0)}%)` : null}</p> : null}
                      {item.normalizedKonu ? <p><strong>Normalized:</strong> {item.normalizedKonu}</p> : null}
                      {item.basvuruSahibi ? <p><strong>Başvuru Sahibi:</strong> {item.basvuruSahibi}</p> : null}
                      {item.aciklama ? <p><strong>Açıklama:</strong> {item.aciklama}</p> : null}
                      {item.ilgiliOlduguBirim ? <p><strong>İlgili Birim:</strong> {item.ilgiliOlduguBirim}</p> : null}
                      <p className="basvuru-list__no"><strong>Başvuru No:</strong> {item.basvuruNo}</p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>

          {/* Pagination / show all */}
          {showAll ? (
            hasMore ? (
              <button
                type="button"
                className="btn btn-ghost basvuru-load-more-btn"
                onClick={loadMore}
                disabled={allLoading}
              >
                {allLoading ? 'Yükleniyor…' : `Daha Fazla Yükle`}
              </button>
            ) : (
              <p className="basvuru-list-end">Tüm kayıtlar gösteriliyor.</p>
            )
          ) : stats?.toplamBasvuru > 15 ? (
            <button
              type="button"
              className="btn btn-ghost basvuru-show-all-btn"
              onClick={openAll}
              disabled={allLoading}
            >
              {allLoading ? 'Yükleniyor…' : `Tüm ${stats.toplamBasvuru.toLocaleString('tr-TR')} kaydı gör →`}
            </button>
          ) : null}
        </>
      ) : !stats ? (
        <div className="basvuru-gundem-panel__empty">
          Bu meydan için henüz başvuru verisi yüklenmemiş.
        </div>
      ) : (
        <div className="basvuru-gundem-panel__empty">
          Filtreye uyan kayıt bulunamadı.
        </div>
      )}
    </aside>
  );
}

export default function MeydanDetail({ onLogout }) {
  const { id } = useParams();
  const [meydan, setMeydan] = useState(null);
  const [spotlight, setSpotlight] = useState(null);
  const [spotlightLoading, setSpotlightLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [allVardiyalar, setAllVardiyalar] = useState([]);
  const [vardiyalar, setVardiyalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const visibleWeekDates = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    return getWeekDates(baseDate);
  }, [weekOffset]);

  const visibleWeekKeys = useMemo(() => visibleWeekDates.map((date) => toDateKey(date)), [visibleWeekDates]);

  const startDateKey = visibleWeekKeys[0];
  const endDateKey = visibleWeekKeys[visibleWeekKeys.length - 1];
  const todayDateKey = toDateKey(new Date());
  const thirtyDaysAgoDateKey = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 29);
    return toDateKey(baseDate);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMeydan() {
      try {
        const canonicalMeydan = normalizeMeydanInput({ meydanId: id, isim: id, kisaAd: id, tamAd: id });

        if (!canonicalMeydan.valid) {
          setError('Meydan bulunamadı.');
          setLoading(false);
          return;
        }

        const meydanSnapshot = await getDoc(doc(db, 'meydanlar', id));
        const meydanData = meydanSnapshot.exists() ? meydanSnapshot.data() : {};

        setMeydan({
          id,
          isim: meydanData?.isim || canonicalMeydan.isim,
          tamAd: meydanData?.tamAd || canonicalMeydan.tamAd,
          lat: Number(meydanData?.lat),
          lon: Number(meydanData?.lon),
        });

        const vardiyaQuery = query(
          collection(db, 'vardiyalar'),
          where('meydanId', '==', id),
        );
        const vardiyaSnapshot = await getDocs(vardiyaQuery);

        if (!active) {
          return;
        }

        const allMeydanVardiyalar = vardiyaSnapshot.docs
          .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
          .map((item) => ({
            ...item,
            tarih: normalizeDateKey(item.tarih),
          }));

        const weekVardiyalar = allMeydanVardiyalar
          .filter((item) => item.tarih >= startDateKey && item.tarih <= endDateKey);

        setAllVardiyalar(allMeydanVardiyalar);
        setVardiyalar(weekVardiyalar);
        setError('');
      } catch (requestError) {
        console.error('Meydan detail load failed.', requestError);
        if (active) {
          setError(`Meydan verileri yüklenemedi: ${requestError?.code || requestError?.message || 'bilinmeyen hata'}`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMeydan();

    return () => {
      active = false;
    };
  }, [endDateKey, id, startDateKey]);

  useEffect(() => {
    if (!meydan) {
      setWeather(null);
      setWeatherError('');
      setWeatherLoading(false);
      return;
    }

    const controller = new AbortController();
    setWeatherLoading(true);
    setWeatherError('');

    const weatherQueryText = `${meydan.tamAd || meydan.isim || ''} Istanbul`;

    fetchMeydanWeather({
      lat: meydan.lat,
      lon: meydan.lon,
      queryText: weatherQueryText,
      signal: controller.signal,
    })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setWeather(payload);
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setWeather(null);
          setWeatherError(toWeatherErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setWeatherLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [meydan]);

  useEffect(() => {
    if (!meydan) {
      setSpotlight(null);
      setSpotlightLoading(false);
      return;
    }

    const controller = new AbortController();
    setSpotlightLoading(true);

    fetchMeydanSpotlight({ meydan, signal: controller.signal })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setSpotlight(payload);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSpotlight(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSpotlightLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [meydan]);

  const shiftByPersonDate = useMemo(() => {
    const map = new Map();

    vardiyalar.forEach((item) => {
      map.set(`${item.personelAdi}|${item.tarih}`, item);
    });

    return map;
  }, [vardiyalar]);

  const personeller = useMemo(
    () => Array.from(new Set(vardiyalar.map((item) => item.personelAdi))).sort((left, right) => left.localeCompare(right, 'tr')),
    [vardiyalar],
  );

  const todayPersonnel = useMemo(() => {
    return allVardiyalar
      .filter((item) => item.tarih === todayDateKey && !isLeaveShift(item.vardiyaTipi))
      .sort((left, right) => {
        const leftActive = isShiftActive(left.saatAraligi);
        const rightActive = isShiftActive(right.saatAraligi);

        if (leftActive !== rightActive) {
          return Number(rightActive) - Number(leftActive);
        }

        return left.personelAdi.localeCompare(right.personelAdi, 'tr');
      });
  }, [allVardiyalar, todayDateKey]);

  const todayPlannedCount = todayPersonnel.length;

  const todayActiveCount = useMemo(
    () => todayPersonnel.filter((item) => isShiftActive(item.saatAraligi)).length,
    [todayPersonnel],
  );

  const topPeople = useMemo(() => {
    const counts = new Map();

    allVardiyalar.forEach((item) => {
      if (
        !item.personelAdi
        || isLeaveShift(item.vardiyaTipi)
        || !item.tarih
        || item.tarih < thirtyDaysAgoDateKey
        || item.tarih > todayDateKey
      ) {
        return;
      }

      counts.set(item.personelAdi, (counts.get(item.personelAdi) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0], 'tr');
      })
      .slice(0, 3)
      .map(([name, count]) => ({
        title: name,
        description: '',
        link: `/personel/${encodeURIComponent(name)}`,
      }));
  }, [allVardiyalar, thirtyDaysAgoDateKey, todayDateKey]);

  const lastThirtyDaysShiftCount = useMemo(
    () => allVardiyalar.filter((item) => {
      if (isLeaveShift(item.vardiyaTipi) || !item.tarih) {
        return false;
      }

      return item.tarih >= thirtyDaysAgoDateKey && item.tarih <= todayDateKey;
    }).length,
    [allVardiyalar, thirtyDaysAgoDateKey, todayDateKey],
  );

  const [meydanRangeFrom, setMeydanRangeFrom] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [meydanRangeTo, setMeydanRangeTo] = useState(() => toDateKey(new Date()));

  const meydanRangePersonelSummary = useMemo(() => {
    if (!meydanRangeFrom || !meydanRangeTo || meydanRangeFrom > meydanRangeTo) return [];
    const counts = new Map();
    allVardiyalar
      .filter((v) => !isLeaveShift(v.vardiyaTipi) && v.tarih >= meydanRangeFrom && v.tarih <= meydanRangeTo && v.personelAdi)
      .forEach((v) => {
        counts.set(v.personelAdi, (counts.get(v.personelAdi) || 0) + 1);
      });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allVardiyalar, meydanRangeFrom, meydanRangeTo]);

  return (
    <div className="app-shell">
      <Header onLogout={onLogout} />

      <main className="page page-detail">
        <section className="detail-hero">
          <div>
            <span className="section-kicker">Meydan görünümü</span>
            <div className="detail-hero__title-row">
              <h1>{meydan?.isim || 'Meydan'}</h1>
              {meydan ? (
                <a
                  className="map-nav-btn"
                  href={Number.isFinite(meydan?.lat) && Number.isFinite(meydan?.lon)
                    ? `https://www.google.com/maps/dir/?api=1&destination=${meydan.lat},${meydan.lon}&travelmode=driving`
                    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((meydan.tamAd || meydan.isim) + ' İstanbul')}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Rota oluştur"
                  aria-label={`${meydan.isim} için Google Maps'te rota oluştur`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Rota
                </a>
              ) : null}
            </div>
            <p>{meydan?.tamAd || 'Seçili meydan için ekip ve plan görünümü.'}</p>

            <div className="detail-hero__stats" aria-label="Meydan özet istatistikleri">
              <article className="detail-hero__stat detail-hero__stat--primary">
                <span>Planlı Ekip</span>
                <strong>{todayPlannedCount}</strong>
              </article>
              <article className="detail-hero__stat detail-hero__stat--success">
                <span>Sahadaki Ekip</span>
                <strong>{todayActiveCount}</strong>
              </article>
              <article className="detail-hero__stat detail-hero__stat--weather">
                <span>Hava</span>
                {weatherLoading ? <strong>Yukleniyor</strong> : null}
                {!weatherLoading && weatherError ? <strong>Veri yok</strong> : null}
                {!weatherLoading && !weatherError && !weather ? <strong>Veri bekleniyor</strong> : null}

                {!weatherLoading && !weatherError && weather ? (
                  <div className="detail-hero__weather-main">
                    <div className="detail-hero__weather-current">
                      <strong>{formatTemp(weather?.current?.temp)}</strong>
                      <small>Hissedilen {formatTemp(weather?.current?.feelsLike)}</small>
                    </div>
                    {weather?.current?.icon ? (
                      <img
                        className="detail-hero__weather-icon"
                        src={`https://openweathermap.org/img/wn/${weather.current.icon}@2x.png`}
                        alt={weather?.current?.description || 'Hava durumu'}
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                ) : null}

                {!weatherLoading && !weatherError && weather ? (
                  <div className="detail-hero__weather-meta">
                    <small>{weather?.current?.description || 'Durum bilgisi yok'}</small>
                    <small>Nem %{weather?.current?.humidity ?? '--'}</small>
                    <small>Ruzgar {formatWind(weather?.current?.windSpeed)}</small>
                  </div>
                ) : null}

                {!weatherLoading && !weatherError && weather?.hourly?.length ? (
                  <div className="detail-hero__hourly-strip" aria-label="12 saatlik hava tahmini">
                    {weather.hourly.map((item) => (
                      <div key={`hour-${item.dt}`} className="detail-hero__hourly-item">
                        <small>{formatHour(item.dt)}</small>
                        {item.icon ? (
                          <img
                            src={`https://openweathermap.org/img/wn/${item.icon}.png`}
                            alt={item.description || 'Saatlik durum'}
                            loading="lazy"
                          />
                        ) : null}
                        <strong>{formatTemp(item.temp)}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>

              <a
                className="detail-hero__stat detail-hero__stat--spotlight"
                href={spotlight?.searchUrl || `https://www.google.com/search?q=${encodeURIComponent(`${meydan?.isim || meydan?.tamAd || 'meydan'} hakkında bilgi`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Meydan Notu</span>
                {spotlightLoading ? (
                  <div className="detail-hero__spotlight-copy">
                    <strong>Özet hazırlanıyor</strong>
                    <small>Kaynaklar taranıyor...</small>
                  </div>
                ) : (
                  <>
                    <div className="detail-hero__spotlight-head">
                      <div className="detail-hero__spotlight-copy">
                        <strong>{spotlight?.title || (meydan?.isim || 'Meydan')}</strong>
                        <small>{spotlight?.summary || 'Meydan hakkında kısa bir bilgi özeti için Google aramasına geçin.'}</small>
                      </div>
                    </div>
                    <div className="detail-hero__spotlight-footer">
                      <small>{spotlight?.badge || 'Google’da incele'}</small>
                      <span aria-hidden="true">↗</span>
                    </div>
                  </>
                )}
              </a>
            </div>
          </div>
        </section>

        {loading ? <div className="message message-loading">Veriler yükleniyor...</div> : null}
        {error ? <div className="message message-error">{error}</div> : null}

        {!loading && !error ? (
          <section className="detail-layout">
            <InsightPanel
              kicker=""
              title="Bu meydanda en çok görev yapan personeller"
              description=""
              items={topPeople}
              variant="people"
              icon={UserGroupIcon}
              badge={`Son 30 gün: ${lastThirtyDaysShiftCount} görev kaydı analiz edildi`}
              emptyMessage="Bu meydan için sıralanabilecek personel verisi henüz bulunmuyor."
            />

            <section className="panel-section detail-schedule">
              <div className={`detail-schedule-summary ${isScheduleOpen ? 'is-open' : ''}`}>
                <div className="detail-schedule-summary__top">
                  <div>
                    <span className="section-kicker">Günlük ekip görünümü</span>
                    <h2>Bugün Meydanda Görevli Personeller</h2>
                  </div>

                  <div className="detail-schedule-summary__icon-wrap" aria-hidden="true">
                    <CalendarDaysIcon className="detail-schedule-summary__icon" />
                  </div>
                </div>

                <div className="detail-schedule-summary__badge">
                  {todayPersonnel.length ? `${todayPersonnel.length} personel bugün bu meydanda planlı` : 'Bugün için planlı personel bulunmuyor'}
                </div>

                {todayPersonnel.length ? (
                  <ul className="today-team-list">
                    {todayPersonnel.map((item) => {
                      const isActive = isShiftActive(item.saatAraligi);

                      return (
                        <li key={`${item.personelAdi}-${item.tarih}-${item.saatAraligi}`} className="today-team-list__item">
                          <div>
                            <Link to={`/personel/${encodeURIComponent(item.personelAdi)}`} className="personel-name-link">
                              <strong>{item.personelAdi}</strong>
                            </Link>
                            <small>{item.saatAraligi || 'Saat bilgisi eklenmedi'}</small>
                          </div>
                          <span className={`today-team-list__status ${isActive ? 'is-active' : ''}`}>
                            {isActive ? 'Şu an görevde' : 'Bugün planlı'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="detail-schedule-summary__empty">
                    Bu meydan için bugün atanmış aktif vardiya kaydı bulunmamaktadır.
                  </div>
                )}

                <button
                  type="button"
                  className="detail-schedule-summary__toggle"
                  onClick={() => setIsScheduleOpen((current) => !current)}
                  aria-expanded={isScheduleOpen}
                >
                  <span>{isScheduleOpen ? 'Haftalık programı kapat' : 'Haftalık planı aç'}</span>
                  <ChevronDownIcon className="detail-schedule-summary__chevron" aria-hidden="true" />
                </button>

                <div className={`detail-schedule-panel ${isScheduleOpen ? 'is-open' : ''}`}>
                  <div className="detail-schedule-panel__inner">
                    <div className="week-nav detail-schedule-panel__nav" role="group" aria-label="Hafta secimi">
                      <button type="button" className="btn btn-ghost" onClick={() => setWeekOffset((current) => current - 1)}>
                        <span className="label-full">Geçen hafta</span>
                        <span className="label-short" aria-hidden="true">←</span>
                      </button>
                      <button type="button" className={`btn ${weekOffset === 0 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setWeekOffset(0)}>
                        Bu hafta
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setWeekOffset((current) => current + 1)}>
                        <span className="label-full">Gelecek hafta</span>
                        <span className="label-short" aria-hidden="true">→</span>
                      </button>
                    </div>

                    <div className="schedule-day-grid">
                      {visibleWeekDates.map((date, idx) => {
                        const dateKey = visibleWeekKeys[idx];
                        const isToday = dateKey === todayDateKey;
                        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' }).toLocaleUpperCase('tr-TR');
                        const dayDate = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                        const dayRows = personeller
                          .map((personelAdi) => ({ personelAdi, vardiya: shiftByPersonDate.get(`${personelAdi}|${dateKey}`) }))
                          .filter((r) => r.vardiya);

                        return (
                          <div key={dateKey} className={`schedule-day-card${isToday ? ' is-today' : ''}`}>
                            <div className="schedule-day-card__header">
                              <div className="schedule-day-card__header-left">
                                <span className="schedule-day-card__weekday">{dayName}</span>
                                <span className="schedule-day-card__date">{dayDate}</span>
                              </div>
                              <div className="schedule-day-card__header-right">
                                {isToday && <span className="schedule-day-card__today-tag">Bugün</span>}
                                {dayRows.length > 0 && (
                                  <span className="schedule-day-card__count">{dayRows.length} kişi</span>
                                )}
                              </div>
                            </div>
                            {dayRows.length > 0 ? (
                              <div className="schedule-day-card__rows">
                                {dayRows.map(({ personelAdi, vardiya }) => (
                                  <div key={personelAdi} className="schedule-day-card__row">
                                    <Link to={`/personel/${encodeURIComponent(personelAdi)}`} className="schedule-day-card__name personel-name-link">{personelAdi}</Link>
                                    <ShiftBadge vardiya={vardiya} isToday={isToday} />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="schedule-day-card__empty">Bu gün için planlı personel bulunmuyor</div>
                            )}
                          </div>
                        );
                      })}
                      {!personeller.length && (
                        <div className="schedule-day-grid__empty">Seçili hafta için kayıt bulunmamaktadır.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel-section meydan-range-panel">
              <div className="panel-section__header">
                <h2>Personel Sorgulama</h2>
                <p>Seçili tarih aralığında bu meydanda görev yapan personeller</p>
              </div>
              <div className="basvuru-filter-row meydan-range-filters">
                <label className="basvuru-filter-field">
                  <span>Başlangıç</span>
                  <input
                    type="date"
                    value={meydanRangeFrom}
                    max={meydanRangeTo || undefined}
                    onChange={(e) => setMeydanRangeFrom(e.target.value)}
                  />
                </label>
                <label className="basvuru-filter-field">
                  <span>Bitiş</span>
                  <input
                    type="date"
                    value={meydanRangeTo}
                    min={meydanRangeFrom || undefined}
                    onChange={(e) => setMeydanRangeTo(e.target.value)}
                  />
                </label>
              </div>
              {meydanRangePersonelSummary.length > 0 ? (
                <>
                  <p className="personel-range-meta">{meydanRangePersonelSummary.length} personel · {meydanRangePersonelSummary.reduce((s, p) => s + p.count, 0)} vardiya kaydı</p>
                  <ol className="meydan-range-list">
                    {meydanRangePersonelSummary.map(({ name, count }, idx) => (
                      <li key={name} className="meydan-range-list__item">
                        <span className="meydan-range-list__rank">{idx + 1}</span>
                        <Link to={`/personel/${encodeURIComponent(name)}`} className="meydan-range-list__name personel-name-link">
                          {name}
                        </Link>
                        <span className="meydan-range-list__count">{count} vardiya</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <div className="detail-insight__empty">
                  {meydanRangeFrom && meydanRangeTo
                    ? 'Seçili tarih aralığında vardiya kaydı bulunamadı.'
                    : 'Tarih aralığı seçin.'}
                </div>
              )}
            </section>

            <BasvuruGundemPanel meydanId={id} />
          </section>
        ) : null}
      </main>
    </div>
  );
}