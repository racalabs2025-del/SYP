import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import Header from '../Header';
import { db } from '../firebaseDb';
import { normalizeMeydanInput } from '../utils/meydanNormalization';
import { compareShiftDatesDesc } from '../utils/date';
import {
  getPersonelBasvuruDocId,
  PERSONEL_BASVURU_PERIOD_LABEL,
} from '../utils/personelBasvuru';
import { SAHA_PERSONELI, normalizePhone } from '../utils/sahaPersoneli';

const LEAVE_TYPES = new Set(['Izinli', 'İzinli', 'HAFTA TATILI', 'HAFTA TATİLİ']);
const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MEYDAN_COLORS = ['#00498E', '#1F6CB6', '#0080CC', '#4D94D0', '#006699', '#3380AA', '#0055AA', '#2266BB', '#1177CC'];

function isLeave(type) {
  return LEAVE_TYPES.has(type);
}

function resolveMeydanBilgisi(meydanId, meydanMap = {}) {
  if (!meydanId) return '-';
  const source = meydanMap[meydanId] || {};
  const result = normalizeMeydanInput({
    meydanId,
    isim: source.isim,
    kisaAd: source.isim,
    tamAd: source.tamAd,
  });

  if (!result.valid) {
    return {
      isim: String(source.isim || meydanId || '-'),
      tamAd: String(source.tamAd || source.isim || meydanId || '-'),
    };
  }

  return {
    isim: source.isim || result.isim || String(meydanId || '-'),
    tamAd: source.tamAd || result.tamAd || result.isim || String(meydanId || '-'),
  };
}

function formatDate(dateKey) {
  if (!dateKey) return '-';

  const rawValue = String(dateKey).trim();
  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${Number(day)} ${TR_MONTHS[Number(month) - 1]} ${year}`;
  }

  const localMatch = rawValue.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (localMatch) {
    const [, day, month, year] = localMatch;
    return `${Number(day)} ${TR_MONTHS[Number(month) - 1]} ${year}`;
  }

  return rawValue;
}

function formatShiftType(vardiyaTipi, saatAraligi) {
  if (isLeave(vardiyaTipi)) return vardiyaTipi;
  return saatAraligi || '-';
}

export default function PersonelDetail({ onLogout }) {
  const { personelAdi } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(personelAdi || '');

  const profil = useMemo(() => {
    const nameLower = decodedName.toLocaleLowerCase('tr-TR');
    return SAHA_PERSONELI.find((p) => p.ad.toLocaleLowerCase('tr-TR') === nameLower) || null;
  }, [decodedName]);

  const [vardiyalar, setVardiyalar] = useState([]);
  const [meydanMap, setMeydanMap] = useState({});
  const [basvuruSummary, setBasvuruSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!decodedName) return;

    let active = true;

    async function loadVardiyalar() {
      try {
        const q = query(
          collection(db, 'vardiyalar'),
          where('personelAdi', '==', decodedName),
        );
        const basvuruDocRef = doc(db, 'personelBasvuruOzetleri', getPersonelBasvuruDocId(decodedName));
        const [snapshot, meydanSnapshot, basvuruSnapshot] = await Promise.all([
          getDocs(q),
          getDocs(collection(db, 'meydanlar')).catch(() => null),
          getDoc(basvuruDocRef).catch(() => null),
        ]);

        if (!active) return;

        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const nextMeydanMap = Object.fromEntries(
          (meydanSnapshot?.docs || []).map((item) => [item.id, { id: item.id, ...item.data() }]),
        );

        setVardiyalar(items);
        setMeydanMap(nextMeydanMap);
        setBasvuruSummary(basvuruSnapshot?.exists() ? basvuruSnapshot.data() : null);
        setError('');
      } catch (err) {
        if (active) {
          setError(`Veriler yüklenemedi: ${err?.code || err?.message || 'bilinmeyen hata'}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVardiyalar();

    return () => { active = false; };
  }, [decodedName]);

  const stats = useMemo(() => {
    const activeShifts = vardiyalar.filter((v) => !isLeave(v.vardiyaTipi));
    const total = vardiyalar.length;
    const sorted = [...activeShifts].sort(compareShiftDatesDesc);
    const lastShift = sorted[0] || null;

    return {
      totalRecords: total,
      basvuruCount: typeof basvuruSummary?.toplamKayit === 'number' ? basvuruSummary.toplamKayit : null,
      basvuruPeriodLabel: basvuruSummary?.periodLabel || PERSONEL_BASVURU_PERIOD_LABEL,
      lastShift,
    };
  }, [basvuruSummary, vardiyalar]);

  const topMeydan = useMemo(() => {
    const counts = new Map();

    vardiyalar.forEach((item) => {
      if (!isLeave(item.vardiyaTipi) && item.meydanId) {
        counts.set(item.meydanId, (counts.get(item.meydanId) || 0) + 1);
      }
    });

    const [topMeydanId] = Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] || [];
    return topMeydanId ? resolveMeydanBilgisi(topMeydanId, meydanMap) : null;
  }, [meydanMap, vardiyalar]);

  const meydanDistribution = useMemo(() => {
    const counts = new Map();
    vardiyalar.forEach((v) => {
      if (!isLeave(v.vardiyaTipi) && v.meydanId) {
        counts.set(v.meydanId, (counts.get(v.meydanId) || 0) + 1);
      }
    });
    const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({
        id,
        name: resolveMeydanBilgisi(id, meydanMap).isim,
        value: count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }, [meydanMap, vardiyalar]);

  return (
    <div className="app-shell">
      <Header onLogout={onLogout} />

      <main className="page page-detail">
        <button
          type="button"
          className="personel-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="personel-back-btn__icon" aria-hidden="true" />
          Geri Dön
        </button>

        <section className="personel-hero">
          <div className="personel-hero__avatar" aria-hidden="true">
            <UserCircleIcon className="personel-hero__avatar-icon" />
          </div>
          <div className="personel-hero__info">
            <span className="section-kicker">Personel Profili</span>
            <h1 className="personel-hero__name">{decodedName || 'Personel'}</h1>
            {topMeydan ? (
              <p className="personel-hero__sub">
                En çok görev yaptığı meydan: <strong>{topMeydan.isim}</strong>
              </p>
            ) : null}
          </div>
        </section>

        {profil ? (
          <div className="personel-contact-card">
            <div className="personel-contact-card__info">
              <span className="personel-contact-card__gorev">{profil.gorev}</span>
              <span className="personel-contact-card__phone">{profil.telefon}</span>
            </div>
            <div className="personel-contact-card__actions">
              <a
                href={`tel:0${normalizePhone(profil.telefon)}`}
                className="saha-contact-btn saha-contact-btn--call saha-contact-btn--lg"
                aria-label="Ara"
                title="Ara"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                <span>Ara</span>
              </a>
              <a
                href={`https://wa.me/90${normalizePhone(profil.telefon)}`}
                className="saha-contact-btn saha-contact-btn--wa saha-contact-btn--lg"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        ) : null}

        {loading ? <div className="message message-loading">Personel verileri yükleniyor...</div> : null}
        {error ? <div className="message message-error">{error}</div> : null}

        {!loading && !error ? (
          <>
            <div className="personel-stats-row">
              <div className="personel-stat-card">
                <span className="personel-stat-card__label">Toplam Kayıt Sayısı</span>
                <strong className="personel-stat-card__value">{stats.basvuruCount ?? stats.totalRecords}</strong>
                <span className="personel-stat-card__meta">
                  {stats.basvuruCount !== null ? stats.basvuruPeriodLabel : 'Mevcut vardiya kayıt sayısı'}
                </span>
              </div>
              <div className="personel-stat-card">
                <span className="personel-stat-card__label">Son Görev</span>
                <strong className="personel-stat-card__value personel-stat-card__value--sm">
                  {stats.lastShift ? resolveMeydanBilgisi(stats.lastShift.meydanId, meydanMap).tamAd : '-'}
                </strong>
                {stats.lastShift ? (
                  <span className="personel-stat-card__meta">
                    {formatDate(stats.lastShift.tarih)}
                    {stats.lastShift.saatAraligi && stats.lastShift.saatAraligi !== '-'
                      ? ` • ${formatShiftType(stats.lastShift.vardiyaTipi, stats.lastShift.saatAraligi)}`
                      : ''}
                  </span>
                ) : null}
              </div>
            </div>

            {meydanDistribution.length > 0 && (
              <section className="panel-section personel-chart-panel">
                <div className="panel-section__header">
                  <h2>Meydan Dağılımı</h2>
                  <p>Hangi meydanda kaç gün görev yapıldı</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={meydanDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {meydanDistribution.map((entry, index) => (
                        <Cell key={entry.id} fill={MEYDAN_COLORS[index % MEYDAN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} gün`, name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="personel-pie-legend">
                  {meydanDistribution.map((entry, index) => (
                    <li key={entry.id} className="personel-pie-legend__item">
                      <span
                        className="personel-pie-legend__dot"
                        style={{ background: MEYDAN_COLORS[index % MEYDAN_COLORS.length] }}
                      />
                      <span className="personel-pie-legend__name">{entry.name}</span>
                      <span className="personel-pie-legend__count">%{entry.percent} · {entry.value} gün</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
