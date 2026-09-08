import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDaysIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, startAfter, where } from 'firebase/firestore';
import { useParams, Link } from 'react-router-dom';
import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Header from '../Header';
import { db } from '../firebaseDb';
import { fetchMeydanSpotlight } from '../service/meydanSpotlightService';
import { fetchMeydanWeather, toWeatherErrorMessage } from '../service/weatherService';
import { normalizeMeydanInput } from '../utils/meydanNormalization';
import { getMeydanYaka, getYakaLabel } from '../utils/meydanYaka';
import DateRangePicker from '../components/shared/DateRangePicker';
import { getCanonicalMeydanById, ALL_CANONICAL_MEYDANLAR } from '../data/canonicalMeydanData.js';
import { SAHA_PERSONELI } from '../utils/sahaPersoneli';
import { getWeekDates, isShiftActive, toDateKey } from '../utils/date';

const MEYDAN_GUNLUK_PAGE_SIZE = 80;
const NOTE_PREVIEW_MAX_LENGTH = 180;

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

function getTimestampMs(rawValue) {
  if (!rawValue) {
    return 0;
  }

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue?.toMillis === 'function') {
    const millis = rawValue.toMillis();
    return Number.isFinite(millis) ? millis : 0;
  }

  return 0;
}

function formatDateTime(valueMs) {
  if (!Number.isFinite(Number(valueMs)) || Number(valueMs) <= 0) {
    return '-';
  }

  return new Date(Number(valueMs)).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

  const closedCount = useMemo(() => {
    if (!stats?.durumDagilimi) return 0;
    return (stats.durumDagilimi['Kapandı'] || 0) + (stats.durumDagilimi['Çözüldü'] || 0);
  }, [stats]);

  const openCount = useMemo(() => {
    if (!stats?.toplamBasvuru) return 0;
    return Math.max(0, stats.toplamBasvuru - closedCount);
  }, [stats, closedCount]);

  const resolutionRate = useMemo(() => {
    if (!stats?.toplamBasvuru || stats.toplamBasvuru === 0) return 0;
    return Math.round((closedCount / stats.toplamBasvuru) * 100);
  }, [closedCount, stats]);

  const toggleExpand = useCallback((basvuruNo) => {
    setExpanded((prev) => (prev === basvuruNo ? null : basvuruNo));
  }, []);

  return (
    <section className="basvuru-gundem-section">
      <div className="basvuru-gundem-panel">
        {/* Header */}
        <div className="basvuru-gundem-panel__top">
          <div className="basvuru-gundem-panel__title-group">
            <span className="section-kicker">Başvuru ve Saha Gündemi</span>
            <h2>Kaydedilen Vatandaş Başvuruları</h2>
            <p>İBB Beyaz Masa ve saha ekipleri üzerinden iletilen tüm bildirim, talep ve şikayetlerin analizi.</p>
          </div>
          <div className="basvuru-gundem-panel__icon-wrap" aria-hidden="true">
            <ChatBubbleLeftRightIcon className="basvuru-gundem-panel__icon" />
          </div>
        </div>

        {/* 4'lü KPI İstatistik Kartları */}
        {stats ? (
          <div className="basvuru-kpi-grid">
            <div className="basvuru-kpi-card basvuru-kpi-card--total">
              <div className="basvuru-kpi-card__head">
                <span>Toplam Kayıt</span>
                <span className="basvuru-kpi-card__badge">153 Beyazmasa</span>
              </div>
              <strong>{stats.toplamBasvuru?.toLocaleString('tr-TR')}</strong>
              <small>Meydana ait tüm arşiv</small>
            </div>

            <div className="basvuru-kpi-card basvuru-kpi-card--green">
              <div className="basvuru-kpi-card__head">
                <span>Çözülen / Kapanan</span>
                <span className="basvuru-kpi-card__badge basvuru-kpi-card__badge--success">%{resolutionRate} Çözüm</span>
              </div>
              <strong>{closedCount.toLocaleString('tr-TR')}</strong>
              <small>Tamamlanan saha işlemleri</small>
            </div>

            <div className="basvuru-kpi-card basvuru-kpi-card--orange">
              <div className="basvuru-kpi-card__head">
                <span>Beklemede / Açık</span>
                <span className="basvuru-kpi-card__badge basvuru-kpi-card__badge--warning">{openCount} Kayıt</span>
              </div>
              <strong>{openCount.toLocaleString('tr-TR')}</strong>
              <small>İşlem ve inceleme bekleyen</small>
            </div>

            <div className="basvuru-kpi-card basvuru-kpi-card--blue">
              <div className="basvuru-kpi-card__head">
                <span>Konu Çeşitliliği</span>
                <span className="basvuru-kpi-card__badge basvuru-kpi-card__badge--info">11 Kategori</span>
              </div>
              <strong>{chartData.length} Farklı Konu</strong>
              <small>En çok: {chartData[0]?.name || 'Bakım Onarım'}</small>
            </div>
          </div>
        ) : null}

        {/* Filtre ve Arama Çubuğu */}
        <div className="basvuru-filter-toolbar" role="group" aria-label="Başvuru filtreleri">
          <div className="basvuru-filter-toolbar__selects">
            <label className="basvuru-filter-field">
              <span>Dönem (Ay)</span>
              <select value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)}>
                <option value="all">Tüm Aylar</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </label>

            <label className="basvuru-filter-field">
              <span>Çözüm Durumu</span>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <option value="all">Tüm Durumlar</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="basvuru-filter-field">
              <span>Ana Kategori</span>
              <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
                <option value="all">Tüm Kategoriler</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="basvuru-filter-field basvuru-filter-field--search">
            <span>Konu veya Açıklama Ara</span>
            <div className="basvuru-search-input-wrap">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Örn: aydınlatma, bank, asfalt, temizlik..."
              />
              {searchTerm ? (
                <button type="button" className="basvuru-search-clear" onClick={() => setSearchTerm('')}>×</button>
              ) : null}
            </div>
          </label>
        </div>

        {hasActiveFilters ? (
          <div className="basvuru-active-filter-banner">
            <span>🔍 Filtre aktif ({filteredList.length} kayıt eşleşti)</span>
            <button
              type="button"
              className="btn btn-ghost btn-inline"
              onClick={() => {
                setFilterMonth('all');
                setFilterStatus('all');
                setFilterCategory('all');
                setSearchTerm('');
                setChartTopicFilter('');
              }}
            >
              Filtreleri Sıfırla
            </button>
          </div>
        ) : null}

        {/* 2 Sütunlu Analitik Grafikler Grid'i */}
        <div className="basvuru-charts-grid">
          {/* Sol Grafik Kolonu: Trend ve Bekleme Süreleri */}
          <div className="basvuru-chart-card">
            <div className="basvuru-chart-card__header">
              <div>
                <span className="section-kicker">Zaman Analitiği</span>
                <h3 className="basvuru-chart-title">Aylık Başvuru Trendi</h3>
              </div>
            </div>

            {trendData.length > 1 ? (
              <div className="basvuru-chart-body">
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={trendData} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} width={34} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,73,142,0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                      formatter={(value) => [value.toLocaleString('tr-TR'), 'Başvuru']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.month || ''}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#00498E"
                      strokeWidth={2.8}
                      dot={{ r: 3.5, fill: '#00498E', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#0080CC' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="basvuru-chart-empty">Trend verisi yeterli değil.</div>
            )}

            {agingBuckets ? (
              <div className="basvuru-aging-block">
                <h4 className="basvuru-subchart-title">Açık Kayıtların Bekleme Süresi Dağılımı</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart
                    data={waitingTimeChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={70}
                      tick={{ fontSize: 11, fill: '#475569' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)' }}
                      formatter={(value) => [value.toLocaleString('tr-TR'), 'Açık Kayıt']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16} fill="#E07B39" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="basvuru-aging-footer">
                  <small>Toplam Açık Kayıt: <strong>{agingBuckets.totalOpen}</strong></small>
                </div>
              </div>
            ) : (
              <div className="basvuru-aging-hint">
                Açık kayıt yaş dağılımı için "Tüm Kayıtlar" görünümüne geçebilirsiniz.
              </div>
            )}
          </div>

          {/* Sağ Grafik Kolonu: Konu ve Kategori Dağılımı */}
          <div className="basvuru-chart-card">
            <div className="basvuru-chart-card__header">
              <div>
                <span className="section-kicker">Konu ve Kategori</span>
                <h3 className="basvuru-chart-title">En Çok Bildirilen Konular</h3>
              </div>
              {chartTopicFilter ? (
                <button type="button" className="basvuru-topic-filter-chip" onClick={() => setChartTopicFilter('')}>
                  {chartTopicFilter} ×
                </button>
              ) : null}
            </div>

            {chartData.length > 0 ? (
              <div className="basvuru-chart-body">
                <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 32)}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 35, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={<ChartYTick />}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,73,142,0.15)' }}
                      cursor={{ fill: 'rgba(0,73,142,0.06)' }}
                      formatter={(value) => [value.toLocaleString('tr-TR'), 'Başvuru']}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 6, 6, 0]}
                      barSize={16}
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
            ) : (
              <div className="basvuru-chart-empty">Konu verisi bulunamadı.</div>
            )}

            {categoryChartData.length > 0 ? (
              <div className="basvuru-category-block">
                <h4 className="basvuru-subchart-title">Standart Kategori Dağılımı (NLP Normalized)</h4>
                <ResponsiveContainer width="100%" height={Math.max(140, Math.min(220, categoryChartData.length * 28))}>
                  <BarChart
                    data={categoryChartData.slice(0, 6)}
                    layout="vertical"
                    margin={{ top: 2, right: 35, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px' }}
                      cursor={{ fill: 'rgba(0,73,142,0.05)' }}
                      formatter={(value) => [value.toLocaleString('tr-TR'), 'Kayıt']}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 4, 4, 0]}
                      barSize={13}
                      fill="#00498E"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>
        </div>

        {/* Kayıt Listesi Bölümü */}
        <div className="basvuru-records-card">
          <div className="basvuru-records-card__header">
            <div>
              <span className="section-kicker">Detaylı Kayıtlar</span>
              <h3 className="basvuru-list-title">
                {showAll ? `Tüm Başvuru Kayıtları (${filteredList.length} / ${stats?.toplamBasvuru?.toLocaleString('tr-TR')})` : `Son Başvurular (${filteredList.length} gösteriliyor)`}
              </h3>
            </div>
            {stats?.toplamBasvuru > 15 && !showAll ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm basvuru-show-all-top-btn"
                onClick={openAll}
                disabled={allLoading}
              >
                {allLoading ? 'Yükleniyor…' : `Tüm ${stats.toplamBasvuru.toLocaleString('tr-TR')} Kaydı Aç →`}
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="basvuru-list-loading">Başvurular yükleniyor…</div>
          ) : filteredList.length > 0 ? (
            <>
              <div className="basvuru-table-wrap">
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
                          <span className="basvuru-list__konu">
                            <strong>{toKonuDisplay(item.konu) || '—'}</strong>
                            {item.altKonu ? <small className="basvuru-list__subkonu">{toKonuDisplay(item.altKonu)}</small> : null}
                          </span>
                          {item.category ? (
                            <span className="basvuru-list__category-tag">
                              {item.category}
                            </span>
                          ) : null}
                          <DurumBadge durum={item.durum} />
                          <span className="basvuru-list__chevron" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
                        </button>

                        {isOpen ? (
                          <div className="basvuru-list__detail">
                            <div className="basvuru-detail-grid">
                              <div className="basvuru-detail-col">
                                {item.altKonu ? <p><strong>Alt Konu:</strong> {toKonuDisplay(item.altKonu)}</p> : null}
                                {item.category ? (
                                  <p>
                                    <strong>Standart Kategori:</strong> <code>{item.category}</code>{' '}
                                    {item.konuGuveni ? <small>({(item.konuGuveni * 100).toFixed(0)}% güven)</small> : null}
                                  </p>
                                ) : null}
                                {item.normalizedKonu ? <p><strong>Normalize Konu:</strong> {item.normalizedKonu}</p> : null}
                                {item.basvuruSahibi ? <p><strong>Başvuru Sahibi:</strong> {item.basvuruSahibi}</p> : null}
                              </div>
                              <div className="basvuru-detail-col">
                                {item.ilgiliOlduguBirim ? <p><strong>İlgili Birim:</strong> {item.ilgiliOlduguBirim}</p> : null}
                                <p className="basvuru-list__no"><strong>Başvuru No:</strong> <code>{item.basvuruNo}</code></p>
                              </div>
                            </div>
                            {item.aciklama ? (
                              <div className="basvuru-detail-desc">
                                <strong>Açıklama:</strong>
                                <p>{item.aciklama}</p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Pagination footer */}
              {showAll ? (
                hasMore ? (
                  <div className="basvuru-load-more-wrap">
                    <button
                      type="button"
                      className="btn btn-ghost basvuru-load-more-btn"
                      onClick={loadMore}
                      disabled={allLoading}
                    >
                      {allLoading ? 'Daha Fazla Yükleniyor…' : `Daha Fazla Kayıt Yükle (+50)`}
                    </button>
                  </div>
                ) : (
                  <p className="basvuru-list-end">✅ Bu meydan için tüm kayıtlar listelendi.</p>
                )
              ) : stats?.toplamBasvuru > 15 ? (
                <div className="basvuru-load-more-wrap">
                  <button
                    type="button"
                    className="btn btn-ghost basvuru-show-all-btn"
                    onClick={openAll}
                    disabled={allLoading}
                  >
                    {allLoading ? 'Yükleniyor…' : `Tüm ${stats.toplamBasvuru.toLocaleString('tr-TR')} kaydı incele →`}
                  </button>
                </div>
              ) : null}
            </>
          ) : !stats ? (
            <div className="basvuru-gundem-panel__empty">
              Bu meydan için henüz başvuru verisi yüklenmemiş.
            </div>
          ) : (
            <div className="basvuru-gundem-panel__empty">
              Seçili filtre kriterlerine uyan kayıt bulunamadı.
            </div>
          )}
        </div>
      </div>
    </section>
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
  const [isGunlukOpen, setIsGunlukOpen] = useState(false);
  const [gunlukNotlar, setGunlukNotlar] = useState([]);
  const [gunlukLoading, setGunlukLoading] = useState(false);
  const [gunlukError, setGunlukError] = useState('');
  const [selectedPersonel, setSelectedPersonel] = useState('');
  const [personelSearch, setPersonelSearch] = useState('');
  const [gunlukText, setGunlukText] = useState('');
  const [savingGunluk, setSavingGunluk] = useState(false);
  const [expandedGunlukNotlar, setExpandedGunlukNotlar] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [id]);

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
        const fallbackCanonical = getCanonicalMeydanById(id) || (canonicalMeydan.valid ? getCanonicalMeydanById(canonicalMeydan.id) : null) || ALL_CANONICAL_MEYDANLAR.find(m => m.id === id || m.id === canonicalMeydan.id) || null;

        if (!canonicalMeydan.valid && !fallbackCanonical) {
          setError('Belirtilen alan geçerli bir meydan değildir. "Diğer", ofis veya genel görev kayıtları bağımsız bir meydan sayfası olarak listelenmez. Lütfen Ana Sayfadan geçerli bir meydan seçiniz.');
          setLoading(false);
          return;
        }

        const resolvedId = canonicalMeydan.valid ? canonicalMeydan.id : (fallbackCanonical?.id || id);
        const meydanSnapshot = await getDoc(doc(db, 'meydanlar', resolvedId));
        const meydanData = meydanSnapshot.exists() ? meydanSnapshot.data() : {};

        setMeydan({
          id: resolvedId,
          sira: meydanData?.sira || fallbackCanonical?.sira || 0,
          isim: meydanData?.isim || fallbackCanonical?.name || canonicalMeydan.isim,
          tamAd: meydanData?.tamAd || fallbackCanonical?.name || canonicalMeydan.tamAd,
          name: meydanData?.name || fallbackCanonical?.name || canonicalMeydan.isim,
          district: meydanData?.district || fallbackCanonical?.district || canonicalMeydan.district || '',
          yaka: meydanData?.yaka || fallbackCanonical?.yaka || canonicalMeydan.yaka || '',
          kategori: meydanData?.kategori || fallbackCanonical?.kategori || canonicalMeydan.kategori || 'DOĞRUDAN YÖNETİM',
          yonetimNotu: meydanData?.yonetimNotu || fallbackCanonical?.yonetimNotu || canonicalMeydan.yonetimNotu || 'Meydan Yönetimi Doğrudan Sorumluluğunda',
          subtitle: meydanData?.subtitle || fallbackCanonical?.subtitle || `${meydanData?.district || fallbackCanonical?.district || ''}, İstanbul`,
          yapimYili: meydanData?.yapimYili || fallbackCanonical?.yapimYili || '',
          alanM2: meydanData?.alanM2 || fallbackCanonical?.alanM2 || '',
          fonksiyonlar: (meydanData?.fonksiyonlar && meydanData.fonksiyonlar.length) ? meydanData.fonksiyonlar : (fallbackCanonical?.fonksiyonlar || []),
          aciklama: meydanData?.aciklama || fallbackCanonical?.aciklama || '',
          heroImage: meydanData?.heroImage || fallbackCanonical?.heroImage || '/assets/dashboard/taksim-square.jpg',
          images: (meydanData?.images && meydanData.images.length) ? meydanData.images : (fallbackCanonical?.images || []),
          landmarks: (meydanData?.landmarks && meydanData.landmarks.length) ? meydanData.landmarks : (fallbackCanonical?.landmarks || []),
          lat: Number(meydanData?.lat),
          lon: Number(meydanData?.lon),
        });

        const vardiyaQuery = query(
          collection(db, 'vardiyalar'),
          where('meydanId', '==', resolvedId),
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

  const gunlukPersonelOptions = useMemo(() => {
    const vardiyaNames = allVardiyalar
      .map((item) => String(item?.personelAdi || '').trim())
      .filter(Boolean);
    const staticNames = SAHA_PERSONELI.map((item) => String(item?.ad || '').trim()).filter(Boolean);

    return Array.from(new Set([...vardiyaNames, ...staticNames]))
      .sort((left, right) => left.localeCompare(right, 'tr'));
  }, [allVardiyalar]);

  const filteredGunlukPersoneller = useMemo(() => {
    const needle = String(personelSearch || '').trim().toLocaleLowerCase('tr-TR');
    if (!needle) {
      return gunlukPersonelOptions.slice(0, 18);
    }

    return gunlukPersonelOptions
      .filter((name) => name.toLocaleLowerCase('tr-TR').includes(needle))
      .slice(0, 18);
  }, [gunlukPersonelOptions, personelSearch]);

  const loadGunlukNotlar = useCallback(async () => {
    if (!id) {
      return;
    }

    setGunlukLoading(true);
    setGunlukError('');

    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'meydanlar', id, 'gunlukNotlar'),
          orderBy('createdAtMs', 'desc'),
          limit(MEYDAN_GUNLUK_PAGE_SIZE),
        ),
      );

      const items = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((left, right) => {
          const leftMs = Number(left?.createdAtMs || getTimestampMs(left?.createdAt));
          const rightMs = Number(right?.createdAtMs || getTimestampMs(right?.createdAt));
          return rightMs - leftMs;
        });

      setGunlukNotlar(items);
    } catch (requestError) {
      setGunlukError(requestError?.message || 'Meydan günlüğü yüklenemedi.');
    } finally {
      setGunlukLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isGunlukOpen) {
      return;
    }

    loadGunlukNotlar();
  }, [isGunlukOpen, loadGunlukNotlar]);

  const handleAddGunlukNot = useCallback(async () => {
    const personelAdi = String(selectedPersonel || '').trim();
    const notIcerik = String(gunlukText || '').trim();

    if (!personelAdi || !notIcerik || !id) {
      return;
    }

    setSavingGunluk(true);
    setGunlukError('');

    try {
      const nowMs = Date.now();
      const ref = await addDoc(collection(db, 'meydanlar', id, 'gunlukNotlar'), {
        meydanId: id,
        meydanIsim: meydan?.isim || '',
        meydanTamAd: meydan?.tamAd || meydan?.isim || '',
        personelAdi,
        icerik: notIcerik,
        createdAt: serverTimestamp(),
        createdAtMs: nowMs,
      });

      setGunlukNotlar((current) => [{
        id: ref.id,
        meydanId: id,
        meydanIsim: meydan?.isim || '',
        meydanTamAd: meydan?.tamAd || meydan?.isim || '',
        personelAdi,
        icerik: notIcerik,
        createdAtMs: nowMs,
      }, ...current]);

      setGunlukText('');
    } catch (requestError) {
      setGunlukError(requestError?.message || 'Not kaydedilemedi.');
    } finally {
      setSavingGunluk(false);
    }
  }, [gunlukText, id, meydan?.isim, meydan?.tamAd, selectedPersonel]);

  const toggleGunlukNot = useCallback((noteId) => {
    setExpandedGunlukNotlar((current) => ({
      ...current,
      [noteId]: !current[noteId],
    }));
  }, []);

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

  const [filterRange, setFilterRange] = useState({ from: '', to: '', preset: 'all' });

  const filteredVardiyalar = useMemo(() => {
    return allVardiyalar.filter((item) => {
      if (isLeaveShift(item.vardiyaTipi) || !item.tarih) return false;
      if (filterRange.from && item.tarih < filterRange.from) return false;
      if (filterRange.to && item.tarih > filterRange.to) return false;
      return true;
    });
  }, [allVardiyalar, filterRange]);

  const topPeople = useMemo(() => {
    const counts = new Map();

    filteredVardiyalar.forEach((item) => {
      if (!item.personelAdi) return;
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
        description: `${count} görev`,
        link: `/personel/${encodeURIComponent(name)}`,
      }));
  }, [filteredVardiyalar]);

  const lastThirtyDaysShiftCount = filteredVardiyalar.length;

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

  const yaka = useMemo(() => getMeydanYaka(meydan), [meydan]);
  const yakaLabel = useMemo(() => getYakaLabel(yaka), [yaka]);

  return (
    <div className="app-shell">
      <Header onLogout={onLogout} />

      <main className="page page-detail">
        <section className="detail-hero">
          {/* Sol Kolon: Başlık, Yaka Rozeti, Yönetim Modeli, Rota & Günlük Butonları, Açıklama */}
          <div className="detail-hero__left">
            <div className="detail-hero__eyebrow">
              <span className="section-kicker">Meydan Görünümü</span>
              <span className={`detail-hero__yaka-badge detail-hero__yaka-badge--${yaka}`}>
                {yakaLabel}
              </span>
              {meydan?.kategori === 'ORTAK ÇALIŞMA' ? (
                <span className="detail-hero__mgmt-badge detail-hero__mgmt-badge--shared" title={meydan?.yonetimNotu}>
                  🤝 Ortak Çalışma {meydan?.yonetimNotu ? `• ${meydan.yonetimNotu}` : ''}
                </span>
              ) : (
                <span className="detail-hero__mgmt-badge detail-hero__mgmt-badge--direct">
                  🏛️ İBB Meydan Yönetimi Doğrudan Sorumluluğunda
                </span>
              )}
            </div>
            <div className="detail-hero__title-row">
              <h1>{meydan?.isim || 'Meydan'}</h1>
              {meydan ? (
                <div className="detail-hero__actions">
                  <a
                    className="map-nav-btn map-nav-btn--icon-only"
                    href={Number.isFinite(meydan?.lat) && Number.isFinite(meydan?.lon)
                      ? `https://www.google.com/maps/dir/?api=1&destination=${meydan.lat},${meydan.lon}&travelmode=driving`
                      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((meydan.tamAd || meydan.isim) + ' İstanbul')}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Google Maps ile rota oluştur"
                    aria-label={`${meydan.isim} için Google Maps'te rota oluştur`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </a>

                  <button
                    className="map-nav-btn map-nav-btn--secondary"
                    type="button"
                    title="Meydan günlüğünü aç"
                    aria-label={`${meydan.isim} için Meydan Günlüğünü aç`}
                    onClick={() => setIsGunlukOpen(true)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 3.5h11.5a2 2 0 0 1 2 2V19a1.5 1.5 0 0 1-2.4 1.2L12 17.2l-4.1 3A1.5 1.5 0 0 1 5.5 19V3.5z" />
                    </svg>
                    Meydan Günlüğü
                  </button>
                </div>
              ) : null}
            </div>

            {/* Quick Specs Chips */}
            <div className="detail-hero__specs-row">
              {meydan?.alanM2 ? (
                <span className="detail-hero__spec-chip">
                  <strong>📐 Alan:</strong> {meydan.alanM2}
                </span>
              ) : null}
              {meydan?.yapimYili ? (
                <span className="detail-hero__spec-chip">
                  <strong>🏗️ Yapım / Düzenleme:</strong> {meydan.yapimYili}
                </span>
              ) : null}
              {meydan?.sira ? (
                <span className="detail-hero__spec-chip detail-hero__spec-chip--accent">
                  <strong>📋 Sıra:</strong> #{meydan.sira} / 95
                </span>
              ) : null}
              {meydan?.district ? (
                <span className="detail-hero__spec-chip">
                  <strong>📍 İlçe:</strong> {meydan.district}
                </span>
              ) : null}
            </div>

            <p className="detail-hero__desc">
              {meydan?.aciklama ? `${meydan.aciklama.slice(0, 240)}...` : (meydan?.tamAd || 'Seçili meydan için ekip ve plan görünümü.')}
            </p>
          </div>

          {/* Sağ Kolon: 4'lü Operasyon Kartı Grid'i */}
          <div className="detail-hero__stats" aria-label="Meydan özet istatistikleri">
            <article className="detail-hero__stat detail-hero__stat--primary">
              <div className="detail-hero__stat-head">
                <span>Planlı Ekip</span>
                <span className="detail-hero__stat-icon" aria-hidden="true">📋</span>
              </div>
              <strong>{todayPlannedCount}</strong>
              <small>Bugün görevli personel</small>
            </article>

            <article className="detail-hero__stat detail-hero__stat--success">
              <div className="detail-hero__stat-head">
                <span>Sahadaki Ekip</span>
                <span className="pulse-live-dot" title="Canlı Görevde"></span>
              </div>
              <strong>{todayActiveCount}</strong>
              <small>{todayActiveCount > 0 ? 'Şu an sahada aktif' : 'Aktif vardiya yok'}</small>
            </article>

            <article className="detail-hero__stat detail-hero__stat--weather">
              <div className="detail-hero__stat-head">
                <span>Hava Durumu</span>
                {weather?.current?.icon ? (
                  <img
                    className="detail-hero__weather-icon-mini"
                    src={`https://openweathermap.org/img/wn/${weather.current.icon}.png`}
                    alt={weather?.current?.description || 'Hava'}
                    loading="lazy"
                  />
                ) : null}
              </div>

              {weatherLoading ? <strong>Yükleniyor…</strong> : null}
              {!weatherLoading && weatherError ? <strong>Veri yok</strong> : null}
              {!weatherLoading && !weatherError && !weather ? <strong>Veri bekleniyor</strong> : null}

              {!weatherLoading && !weatherError && weather ? (
                <>
                  <div className="detail-hero__weather-main">
                    <div className="detail-hero__weather-current">
                      <strong>{formatTemp(weather?.current?.temp)}</strong>
                      <small>Hissedilen {formatTemp(weather?.current?.feelsLike)}</small>
                    </div>
                  </div>
                  <div className="detail-hero__weather-meta">
                    <small>{weather?.current?.description || 'Açık'}</small>
                    <small>Nem %{weather?.current?.humidity ?? '--'}</small>
                    <small>Rüzgar {formatWind(weather?.current?.windSpeed)}</small>
                  </div>
                  {weather?.hourly?.length ? (
                    <div className="detail-hero__hourly-strip" aria-label="Saatlik hava tahmini">
                      {weather.hourly.map((item) => (
                        <div key={`hour-${item.dt}`} className="detail-hero__hourly-item">
                          <small>{formatHour(item.dt)}</small>
                          <strong>{formatTemp(item.temp)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </article>

            {spotlight?.readPath ? (
              <Link className="detail-hero__stat detail-hero__stat--spotlight" to={spotlight.readPath}>
                <div className="detail-hero__stat-head">
                  <span>Meydan Notu</span>
                  <span className="detail-hero__stat-icon" aria-hidden="true">📖</span>
                </div>
                {spotlightLoading ? (
                  <div className="detail-hero__spotlight-copy">
                    <strong>Özet hazırlanıyor</strong>
                    <small>Kaynaklar taranıyor...</small>
                  </div>
                ) : (
                  <>
                    <div className="detail-hero__spotlight-copy">
                      <strong>{spotlight?.title || (meydan?.isim || 'Meydan')}</strong>
                      <small>{spotlight?.summary || 'Meydan hakkında kısa operasyon özeti.'}</small>
                    </div>
                    <div className="detail-hero__spotlight-footer">
                      <small>{spotlight?.badge || 'Detaylı oku'}</small>
                      <span aria-hidden="true">→</span>
                    </div>
                  </>
                )}
              </Link>
            ) : (
              <a
                className="detail-hero__stat detail-hero__stat--spotlight"
                href={spotlight?.searchUrl || `https://www.google.com/search?q=${encodeURIComponent(`${meydan?.isim || meydan?.tamAd || 'meydan'} hakkında bilgi`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="detail-hero__stat-head">
                  <span>Meydan Notu</span>
                  <span className="detail-hero__stat-icon" aria-hidden="true">↗</span>
                </div>
                <div className="detail-hero__spotlight-copy">
                  <strong>{spotlight?.title || (meydan?.isim || 'Meydan')}</strong>
                  <small>{spotlight?.summary || 'Meydan bilgileri.'}</small>
                </div>
                <div className="detail-hero__spotlight-footer">
                  <small>Google'da incele</small>
                  <span aria-hidden="true">↗</span>
                </div>
              </a>
            )}
          </div>
        </section>

        {loading ? <div className="message message-loading">Veriler yükleniyor...</div> : null}
        {error ? <div className="message message-error">{error}</div> : null}

        {!loading && !error ? (
          <div className="detail-page-content">
            {/* ─── MEYDAN TANITIM VE GERÇEK FOTOĞRAF GALERİSİ VİTRİNİ ─── */}
            {meydan && (meydan.images?.length > 0 || meydan.heroImage || meydan.aciklama) ? (
              <section className="detail-showcase-card" aria-label="Meydan Tanıtım ve Gerçek Görselleri">
                <div className="detail-showcase-grid">
                  {/* Sol: Büyük Gerçek Fotoğraf ve Küçük Görsel Seçici */}
                  <div className="detail-showcase-gallery">
                    <div className="detail-showcase-main-img-wrap">
                      <img
                        src={meydan.images?.[selectedImageIndex] || meydan.heroImage || '/assets/dashboard/taksim-square.jpg'}
                        alt={`${meydan.isim} Görseli ${selectedImageIndex + 1}`}
                        className="detail-showcase-main-img"
                        loading="eager"
                      />
                      <div className="detail-showcase-img-badge">
                        <span>{meydan.isim} • Fotoğraf {selectedImageIndex + 1} / {Math.max(1, (meydan.images?.length || 1))}</span>
                      </div>
                    </div>

                    {meydan.images && meydan.images.length > 1 && (
                      <div className="detail-showcase-thumbs">
                        {meydan.images.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`detail-showcase-thumb-btn ${idx === selectedImageIndex ? 'is-active' : ''}`}
                            onClick={() => setSelectedImageIndex(idx)}
                            title={`${meydan.isim} Görsel ${idx + 1}`}
                          >
                            <img src={imgUrl} alt="" className="detail-showcase-thumb-img" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sağ: Meydan Künyesi, Resmi Sunum Açıklaması ve Fonksiyonlar */}
                  <div className="detail-showcase-info">
                    <div className="detail-showcase-info__header">
                      <div className="detail-showcase-kicker-row">
                        <span className="section-kicker">Meydan Künyesi & Donatılar</span>
                        <span className={`detail-showcase-status-badge ${meydan.kategori === 'ORTAK ÇALIŞMA' ? 'is-shared' : 'is-direct'}`}>
                          {meydan.kategori === 'ORTAK ÇALIŞMA' ? '🤝 Ortak Çalışma' : '🏛️ Doğrudan Yönetim'}
                        </span>
                      </div>
                      <h3>{meydan.name || meydan.isim}</h3>
                      {meydan.yonetimNotu && (
                        <p className="detail-showcase-yonetim-note">
                          <strong>Sorumluluk Bilgisi:</strong> {meydan.yonetimNotu}
                        </p>
                      )}
                    </div>

                    {/* 3'lü Mini Metrik Kartı */}
                    <div className="detail-showcase-metrics">
                      <div className="detail-showcase-metric-box">
                        <span className="metric-box__label">Toplam Alan</span>
                        <strong className="metric-box__val">{meydan.alanM2 || 'Belirtilmedi'}</strong>
                      </div>
                      <div className="detail-showcase-metric-box">
                        <span className="metric-box__label">Yapım / Yenileme</span>
                        <strong className="metric-box__val">{meydan.yapimYili || 'Mevcut'}</strong>
                      </div>
                      <div className="detail-showcase-metric-box">
                        <span className="metric-box__label">Bölge & Yaka</span>
                        <strong className="metric-box__val">{meydan.district} • {meydan.yaka === 'avrupa' ? 'Avrupa' : 'Anadolu'}</strong>
                      </div>
                    </div>

                    {/* Sunum Dosyası Açıklaması */}
                    {meydan.aciklama && (
                      <div className="detail-showcase-desc-block">
                        <h4>Meydan Tanıtımı & Saha Bilgisi</h4>
                        <p>{meydan.aciklama}</p>
                      </div>
                    )}

                    {/* Fonksiyonlar / Donatılar */}
                    {meydan.fonksiyonlar && meydan.fonksiyonlar.length > 0 && (
                      <div className="detail-showcase-functions-block">
                        <h4>Mevcut Fonksiyonlar ve Sosyal Donatılar</h4>
                        <div className="detail-showcase-tag-list">
                          {meydan.fonksiyonlar.map((fn, idx) => (
                            <span key={idx} className="detail-showcase-tag">
                              ✓ {fn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            {/* Tarih Aralığı Filtre Çubuğu */}
            <div className="detail-filter-bar">
              <DateRangePicker value={filterRange} onChange={setFilterRange} />
            </div>

            {/* Kademe 1: Saha & Personel Operasyon Grid'i (2 Sütun) */}
            <div className="detail-operations-grid">
              {/* Sol Kolon: Bugün Meydanda Görevli Personeller & Haftalık Plan */}
              <div className="detail-operations-col">
                <section className="panel-section detail-schedule">
                  <div className={`detail-schedule-summary ${isScheduleOpen ? 'is-open' : ''}`}>
                    <div className="detail-schedule-summary__top">
                      <div>
                        <span className="section-kicker">Günlük Ekip Görünümü</span>
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
                        <div className="week-nav detail-schedule-panel__nav" role="group" aria-label="Hafta seçimi">
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

                <InsightPanel
                  kicker="Personel İstatistiği"
                  title="Bu Meydanda En Çok Görev Yapan Personeller"
                  description="Seçili dönemde en sık nöbet tutan saha personelleri."
                  items={topPeople}
                  variant="people"
                  icon={UserGroupIcon}
                  badge={`Seçilen dönem: ${lastThirtyDaysShiftCount} görev kaydı analiz edildi`}
                  emptyMessage="Bu meydan için sıralanabilecek personel verisi henüz bulunmuyor."
                />
              </div>

              {/* Sağ Kolon: Personel Tarih Aralığı Sorgulama */}
              <div className="detail-operations-col">
                <section className="panel-section meydan-range-panel">
                  <div className="panel-section__header">
                    <div>
                      <span className="section-kicker">Özel Aralık Analizi</span>
                      <h2>Personel Sorgulama</h2>
                      <p>Seçili tarih aralığında bu meydanda görev yapan personeller ve vardiya sayıları.</p>
                    </div>
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
              </div>
            </div>

            {/* Kademe 2: Tam Genişlik Başvuru ve Gündem Analitiği */}
            <BasvuruGundemPanel meydanId={id} />
          </div>
        ) : null}

        {isGunlukOpen ? (
          <div className="gunluk-modal" role="dialog" aria-modal="true" aria-label="Meydan Günlüğü">
            <div className="gunluk-modal__panel">
              <div className="gunluk-modal__drag-handle" aria-hidden="true" />
              <div className="gunluk-modal__header">
                <div>
                  <span className="section-kicker">Meydan Günlüğü</span>
                  <h3>{meydan?.isim || 'Meydan'} Günlük Notları</h3>
                  <p>Vardiya devrinde ekiplerin birbirine not bırakması için kullanılır.</p>
                </div>
                <button
                  type="button"
                  className="gunluk-modal__close-btn"
                  onClick={() => setIsGunlukOpen(false)}
                  aria-label="Kapat"
                >
                  <XMarkIcon width={18} height={18} />
                </button>
              </div>

              <div className="gunluk-modal__composer">
                <label className="gunluk-field">
                  <span>Günlüğe Yazan Personel</span>
                  <input
                    type="search"
                    value={personelSearch}
                    onChange={(event) => setPersonelSearch(event.target.value)}
                    placeholder="Personel adı ara"
                  />
                  <div className="gunluk-personel-picks" role="listbox" aria-label="Personel seçimi">
                    {filteredGunlukPersoneller.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className={`gunluk-personel-pick${selectedPersonel === name ? ' is-selected' : ''}`}
                        onClick={() => {
                          setSelectedPersonel(name);
                          setPersonelSearch(name);
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="gunluk-field gunluk-field--note">
                  <span>Günlüğe Ekle</span>
                  <textarea
                    value={gunlukText}
                    onChange={(event) => setGunlukText(event.target.value)}
                    maxLength={2000}
                    placeholder="Bir sonraki vardiya için gerekli notu yazın..."
                  />
                  <div className="gunluk-field__footer">
                    <small>{gunlukText.length}/2000</small>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddGunlukNot}
                      disabled={savingGunluk || !selectedPersonel || !gunlukText.trim()}
                    >
                      {savingGunluk ? 'Kaydediliyor...' : 'Günlüğe Ekle'}
                    </button>
                  </div>
                </label>
              </div>

              {gunlukError ? <div className="message message-error">{gunlukError}</div> : null}

              <div className="gunluk-modal__list-wrap">
                <h4>Önceki Notlar</h4>
                {gunlukLoading ? <div className="message message-loading">Notlar yükleniyor...</div> : null}

                {!gunlukLoading && gunlukNotlar.length ? (
                  <ul className="gunluk-note-list">
                    {gunlukNotlar.map((note) => {
                      const fullText = String(note?.icerik || '').trim();
                      const isLong = fullText.length > NOTE_PREVIEW_MAX_LENGTH;
                      const isExpanded = Boolean(expandedGunlukNotlar[note.id]);
                      const shownText = isLong && !isExpanded
                        ? `${fullText.slice(0, NOTE_PREVIEW_MAX_LENGTH).trim()}...`
                        : fullText;

                      return (
                        <li key={note.id} className="gunluk-note-item">
                          <div className="gunluk-note-item__top">
                            <strong>{note.personelAdi || 'Personel bilgisi yok'}</strong>
                            <span>{formatDateTime(Number(note?.createdAtMs || getTimestampMs(note?.createdAt)))}</span>
                          </div>
                          <p>{shownText || 'Not içeriği yok'}</p>
                          {isLong ? (
                            <button
                              type="button"
                              className="gunluk-note-item__toggle"
                              onClick={() => toggleGunlukNot(note.id)}
                            >
                              {isExpanded ? 'Daha az göster' : 'Devamını gör'}
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {!gunlukLoading && !gunlukNotlar.length ? (
                  <div className="gunluk-modal__empty">Bu meydan için henüz günlük notu bulunmuyor.</div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}