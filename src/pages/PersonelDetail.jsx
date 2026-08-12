import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import DateRangePicker from '../components/shared/DateRangePicker';
import { normalizeMeydanInput } from '../utils/meydanNormalization';
import { compareShiftDatesDesc, getWeekDates, toDateKey } from '../utils/date';
import {
  getPersonelBasvuruDocId,
  PERSONEL_BASVURU_PERIOD_LABEL,
  toPlannedWorkDays,
} from '../utils/personelBasvuru';
import { SAHA_PERSONELI, normalizePhone } from '../utils/sahaPersoneli';

const LEAVE_TYPES = new Set(['Izinli', 'İzinli', 'HAFTA TATILI', 'HAFTA TATİLİ']);
const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MEYDAN_COLORS = ['#00498E', '#1F6CB6', '#0080CC', '#4D94D0', '#006699', '#3380AA', '#0055AA', '#2266BB', '#1177CC'];

const SUB_LOCATION_ALIASES = [
  { key: 'kozyatagi', label: 'Kozyatağı' },
  { key: 'bostanci', label: 'Bostancı' },
  { key: 'suadiye', label: 'Suadiye' },
  { key: 'caddebostan', label: 'Caddebostan' },
  { key: 'goztepe', label: 'Göztepe' },
  { key: 'fikirtepe', label: 'Fikirtepe' },
  { key: 'yogurtcu', label: 'Yoğurtçu' },
  { key: 'fenerbahce', label: 'Fenerbahçe' },
  { key: 'kalamis', label: 'Kalamış' },
  { key: 'sirinevler', label: 'Şirinevler' },
  { key: 'mecidiyekoy', label: 'Mecidiyeköy' },
  { key: 'sarachane', label: 'Saraçhane' },
  { key: 'aksaray', label: 'Aksaray' },
];

const PERIOD_LABEL_Q1_2026 = '01 Oca – 31 Mar 2026';

// Toplam açılan kayıt sayıları — 01 Oca – 31 Mar 2026 dönemi
const ACILAN_KAYIT_Q1_2026 = {
  'AHMET KOCABIYIK': 32,
  'AHMET KOCABIYİK': 32,
  'AYKUT ARMAĞAN': 50,
  'BERKAY DEDE': 12,
  'ENES DURAN': 53,
  'HAKAN HAN': 66,
  'HAYDAR ÇOBAN': 85,
  'HELİN ÖZDEMİR': 96,
  'İSMAİL ÇOBAN': 33,
  'KAMİLE ÇELİK': 103,
  'KEMAL GÖNÜLTAŞ': 31,
  'MUSTAFA KAYA': 38,
  'OKTAY ARSLAN': 14,
  'OZAN YUSUF AKBAŞ': 34,
  'SEZAYİ KARAKOÇ': 2,
  'ŞABAN ETİRİLİ': 49,
  'ŞABAN ETİRLİ': 49,
  'TUNCAY ÇATAL': 2,
  'UĞUR AKIN': 42,
  'VEDAT VARLIK': 46,
  'YUSUF GÜNDOĞDU': 4,
  'HALİL İBRAHİM BULUT': 1,
  'HAKAN BEĞENMİŞ': 2,
  'BEKİR GÖRMEK': 9,
  'UMUT EMRE': 0,
  'ZEYNEP AYDEMİR': 176,
  'ERHAN EKİNCİ': 88,
  'ESRA ŞEKER': 66,
  'EMİN ERDOĞAN': 40,
  'HÜSEYİN TÜRKAY': 42,
  'HATİCE ADSAN': 38,
  'ONUR ARMAĞAN': 29,
  'HASAN BİLİCİ': 39,
  'NİYAZİ BOL': 7,
  'ERDEM ARABACI': 26,
  'KADER SALMAN': 19,
  'BURAK ÖZÇELİK': 0,
  'ŞÜKRÜ KIDIL': 19,
  'ŞÜKRÜ KİDİL': 19,
  'İBRAHİM SİREK': 13,
  'UĞUR BEYHATUN': 35,
  'ÇAĞATAY BEYOĞLU': 24,
  'FATİH GÜNEŞ': 24,
  'CANER DİŞLİ': 10,
  'KEMAL EVREN DARMAN': 11,
};

function lookupStaticCount(map, name) {
  if (!name) return null;
  const norm = String(name).toLocaleLowerCase('tr-TR').trim();
  for (const [key, value] of Object.entries(map)) {
    if (key.toLocaleLowerCase('tr-TR') === norm) return value;
  }
  return null;
}

function isLeave(type) {
  return LEAVE_TYPES.has(type);
}

function toMeydanDisplayName(value, meydanId = '') {
  const label = String(value || '').trim();
  const id = String(meydanId || '').trim().toLocaleLowerCase('tr-TR');
  const lower = label.toLocaleLowerCase('tr-TR');

  if (id.includes('calistay') || lower.includes('calistay') || lower.includes('çalıştay')) {
    return 'Çalıştay Programı';
  }

  return label || '-';
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

function normalizePersonelKey(value) {
  return normalizeSearchText(value).replace(/\s+/g, ' ').trim();
}

function extractSubLocationLabel(...values) {
  const normalized = normalizeSearchText(values.filter(Boolean).join(' '));
  if (!normalized) {
    return '';
  }

  const found = SUB_LOCATION_ALIASES.find((item) => normalized.includes(item.key));
  return found?.label || '';
}

function withSubLocationLabel(baseLabel, subLocationLabel) {
  const label = String(baseLabel || '').trim();
  const sub = String(subLocationLabel || '').trim();

  if (!label || !sub) {
    return label;
  }

  if (normalizeSearchText(label).includes(normalizeSearchText(sub))) {
    return label;
  }

  return `${label} (${sub})`;
}

function resolveMeydanBilgisi(meydanId, meydanMap = {}, rowData = {}) {
  if (!meydanId) return '-';
  const source = meydanMap[meydanId] || {};
  const subLocationLabel = extractSubLocationLabel(
    rowData?.tamAd,
    rowData?.kisaAd,
    rowData?.meydanAdi,
    rowData?.meydan,
    rowData?.meydanId,
    source.tamAd,
    source.isim,
  );
  const result = normalizeMeydanInput({
    meydanId,
    isim: source.isim,
    kisaAd: source.isim,
    tamAd: source.tamAd,
  });

  if (!result.valid) {
    return {
      isim: withSubLocationLabel(toMeydanDisplayName(source.isim || meydanId || '-', meydanId), subLocationLabel),
      tamAd: withSubLocationLabel(toMeydanDisplayName(source.tamAd || source.isim || meydanId || '-', meydanId), subLocationLabel),
    };
  }

  return {
    isim: withSubLocationLabel(toMeydanDisplayName(source.isim || result.isim || String(meydanId || '-'), meydanId), subLocationLabel),
    tamAd: withSubLocationLabel(toMeydanDisplayName(source.tamAd || result.tamAd || result.isim || String(meydanId || '-'), meydanId), subLocationLabel),
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

function normalizeShiftTimeRange(value) {
  const raw = String(value || '').trim();
  if (!raw) return raw;

  const compact = raw.replace(/\s+/g, '').replace(/[.]/g, ':');
  const match = compact.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) {
    return raw;
  }

  const [, startHour, startMinute, endHour, endMinute] = match;
  const normalized = `${String(Number(startHour)).padStart(2, '0')}:${String(Number(startMinute)).padStart(2, '0')}-${String(Number(endHour)).padStart(2, '0')}:${String(Number(endMinute)).padStart(2, '0')}`;

  if (normalized === '08:30-16:00') {
    return '08:30-17:00';
  }

  return normalized;
}

function buildDutyDedupeKey(item) {
  const tarih = String(item?.tarih || '').trim();
  const meydan = String(item?.meydanId || item?.meydanAdi || item?.meydan || '').trim().toLocaleLowerCase('tr-TR');
  const saat = normalizeShiftTimeRange(item?.saatAraligi);
  if (!tarih || !meydan || !saat) {
    return '';
  }

  return `${tarih}|${meydan}|${saat}`;
}

function normalizeAndDedupeVardiyalar(items = []) {
  const seenDutyKeys = new Set();
  const cleaned = [];

  items.forEach((item) => {
    const normalizedItem = {
      ...item,
      saatAraligi: normalizeShiftTimeRange(item?.saatAraligi),
    };

    if (isLeave(normalizedItem?.vardiyaTipi)) {
      cleaned.push(normalizedItem);
      return;
    }

    const dedupeKey = buildDutyDedupeKey(normalizedItem);
    if (dedupeKey && seenDutyKeys.has(dedupeKey)) {
      return;
    }

    if (dedupeKey) {
      seenDutyKeys.add(dedupeKey);
    }

    cleaned.push(normalizedItem);
  });

  return cleaned;
}

function toDateFromKey(dateKey) {
  const raw = String(dateKey || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isValidLeaveDateKey(dateKey, { minYear = 2020, maxYear = 2040 } = {}) {
  const raw = String(dateKey || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || year < minYear || year > maxYear) {
    return false;
  }

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function getInclusiveDayCount(fromDateKey, toDateKey) {
  const from = toDateFromKey(fromDateKey);
  const to = toDateFromKey(toDateKey);
  if (!from || !to) {
    return 1;
  }

  const safeTo = to < from ? from : to;
  const diff = Math.round((safeTo.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function shiftMonthKey(monthKey, delta) {
  const match = String(monthKey || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return toDateKey(new Date()).slice(0, 7);
  }

  const [, year, month] = match;
  const shifted = new Date(Number(year), Number(month) - 1 + Number(delta || 0), 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`;
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
  const [izinKayitlari, setIzinKayitlari] = useState([]);
  const [invalidIzinKayitlari, setInvalidIzinKayitlari] = useState([]);
  const [meydanMap, setMeydanMap] = useState({});
  const [basvuruSummary, setBasvuruSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isIzinPopoverOpen, setIsIzinPopoverOpen] = useState(false);
  const [filterRange, setFilterRange] = useState({ from: '', to: '', preset: 'all' });

  useEffect(() => {
    if (!decodedName) return;

    let active = true;

    async function loadVardiyalar() {
      try {
        const q = query(
          collection(db, 'vardiyalar'),
          where('personelAdi', '==', decodedName),
        );
        const personelKey = normalizePersonelKey(decodedName);
        const izinByNormQuery = query(
          collection(db, 'personelIzinler'),
          where('personelAdiNorm', '==', personelKey),
        );
        const izinByNameQuery = query(
          collection(db, 'personelIzinler'),
          where('personelAdi', '==', decodedName),
        );
        const basvuruDocRef = doc(db, 'personelBasvuruOzetleri', getPersonelBasvuruDocId(decodedName));
        const [snapshot, izinByNormSnapshot, izinByNameSnapshot, meydanSnapshot, basvuruSnapshot] = await Promise.all([
          getDocs(q),
          getDocs(izinByNormQuery).catch(() => null),
          getDocs(izinByNameQuery).catch(() => null),
          getDocs(collection(db, 'meydanlar')).catch(() => null),
          getDoc(basvuruDocRef).catch(() => null),
        ]);

        if (!active) return;

        const rawItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const items = normalizeAndDedupeVardiyalar(rawItems);
        const izinMap = new Map();
        [...(izinByNormSnapshot?.docs || []), ...(izinByNameSnapshot?.docs || [])].forEach((item) => {
          izinMap.set(item.id, { id: item.id, ...item.data() });
        });
        const rawIzinItems = Array.from(izinMap.values()).sort((left, right) => {
          const leftDate = String(left?.baslangicTarihi || '');
          const rightDate = String(right?.baslangicTarihi || '');
          return rightDate.localeCompare(leftDate, 'tr');
        });
        const normalizedIzinItems = [];
        const invalidItems = [];

        rawIzinItems.forEach((item) => {
          const baslangicTarihi = String(item?.baslangicTarihi || '').trim();
          const bitisRaw = String(item?.bitisTarihi || item?.baslangicTarihi || '').trim();

          if (!isValidLeaveDateKey(baslangicTarihi) || !isValidLeaveDateKey(bitisRaw)) {
            invalidItems.push({
              ...item,
              invalidReason: 'Tarih formatı veya yıl aralığı geçersiz',
            });
            return;
          }

          const from = baslangicTarihi <= bitisRaw ? baslangicTarihi : bitisRaw;
          const to = baslangicTarihi <= bitisRaw ? bitisRaw : baslangicTarihi;
          const parsedGunSayisi = Number(item?.gunSayisi);
          const autoDayCount = getInclusiveDayCount(from, to);

          normalizedIzinItems.push({
            ...item,
            baslangicTarihi: from,
            bitisTarihi: to,
            gunSayisi: Number.isFinite(parsedGunSayisi) && parsedGunSayisi > 0 ? Math.floor(parsedGunSayisi) : autoDayCount,
          });
        });

        const nextMeydanMap = Object.fromEntries(
          (meydanSnapshot?.docs || []).map((item) => [item.id, { id: item.id, ...item.data() }]),
        );

        setVardiyalar(items);
        setIzinKayitlari(normalizedIzinItems);
        setInvalidIzinKayitlari(invalidItems);
        setMeydanMap(nextMeydanMap);
        setBasvuruSummary(basvuruSnapshot?.exists() ? basvuruSnapshot.data() : null);
        setIsIzinPopoverOpen(false);
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
    const plannedWorkDays = toPlannedWorkDays(total);

    return {
      totalRecords: total,
      plannedWorkDays,
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
    if (!topMeydanId) {
      return null;
    }

    const subLocationCounts = new Map();
    vardiyalar
      .filter((item) => !isLeave(item.vardiyaTipi) && item.meydanId === topMeydanId)
      .forEach((item) => {
        const subLocation = extractSubLocationLabel(item?.tamAd, item?.kisaAd, item?.meydanAdi, item?.meydan, item?.meydanId);
        if (subLocation) {
          subLocationCounts.set(subLocation, (subLocationCounts.get(subLocation) || 0) + 1);
        }
      });

    const [topSubLocation = ''] = Array.from(subLocationCounts.entries()).sort((a, b) => b[1] - a[1])[0] || [];
    const resolved = resolveMeydanBilgisi(topMeydanId, meydanMap, { tamAd: topSubLocation, kisaAd: topSubLocation, meydanId: topMeydanId });
    return {
      ...resolved,
      meydanId: topMeydanId,
    };
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

  const weeklySchedule = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const weekDates = getWeekDates(new Date());

    return weekDates.map((date) => {
      const dateKey = toDateKey(date);
      const shifts = vardiyalar
        .filter((item) => item.tarih === dateKey && !isLeave(item.vardiyaTipi))
        .sort((left, right) => String(left.saatAraligi || '').localeCompare(String(right.saatAraligi || ''), 'tr'))
        .map((item) => ({
          id: item.id,
          meydanId: String(item.meydanId || '').trim(),
          meydan: resolveMeydanBilgisi(item.meydanId, meydanMap, item).isim,
          time: formatShiftType(item.vardiyaTipi, item.saatAraligi),
        }));

      return {
        dateKey,
        label: date.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: 'short' }),
        isToday: dateKey === todayKey,
        shifts,
      };
    });
  }, [meydanMap, vardiyalar]);

  const weeklyShiftCount = useMemo(
    () => weeklySchedule.reduce((total, day) => total + day.shifts.length, 0),
    [weeklySchedule],
  );

  const izinSummary = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const thisMonthKey = todayKey.slice(0, 7);
    const sortedRecords = [...izinKayitlari].sort((left, right) => {
      const leftDate = String(left?.baslangicTarihi || '');
      const rightDate = String(right?.baslangicTarihi || '');
      return rightDate.localeCompare(leftDate, 'tr');
    });

    const activeToday = sortedRecords.filter((item) => {
      const from = String(item?.baslangicTarihi || '');
      const to = String(item?.bitisTarihi || item?.baslangicTarihi || '');
      return from && to && todayKey >= from && todayKey <= to;
    });

    const thisMonthDays = sortedRecords.reduce((sum, item) => {
      const from = String(item?.baslangicTarihi || '');
      if (!from.startsWith(thisMonthKey)) {
        return sum;
      }

      const dayCount = Number(item?.gunSayisi);
      return sum + (Number.isFinite(dayCount) && dayCount > 0 ? dayCount : 1);
    }, 0);

    return {
      totalRecords: sortedRecords.length,
      activeTodayCount: activeToday.length,
      thisMonthDays,
      activeToday,
      recent: sortedRecords.slice(0, 6),
      all: sortedRecords,
    };
  }, [izinKayitlari]);

  const [izinCalendarMonth, setIzinCalendarMonth] = useState(() => toDateKey(new Date()).slice(0, 7));
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  const izinCalendar = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const [year, month] = String(izinCalendarMonth || '').split('-').map(Number);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return { label: '', cells: [], leaveDayCount: 0, shiftDayCount: 0 };
    }

    const monthStart = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = (monthStart.getDay() + 6) % 7;

    // Build leave-record map (izinKayitlari spans multi-day ranges)
    const leaveByDay = new Map();
    izinKayitlari.forEach((item) => {
      const start = toDateFromKey(item?.baslangicTarihi);
      const end = toDateFromKey(item?.bitisTarihi || item?.baslangicTarihi);
      if (!start || !end) {
        return;
      }

      const safeEnd = end < start ? start : end;
      const cursor = new Date(start);

      while (cursor <= safeEnd) {
        const key = toDateKey(cursor);
        const list = leaveByDay.get(key) || [];
        list.push(item);
        leaveByDay.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    // Build vardiya map (single-day entries)
    const shiftByDay = new Map();
    vardiyalar.forEach((item) => {
      if (!item.tarih) return;
      const list = shiftByDay.get(item.tarih) || [];
      list.push(item);
      shiftByDay.set(item.tarih, list);
    });

    const cells = [];
    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const leaveRows = leaveByDay.get(dateKey) || [];
      const allShiftRows = shiftByDay.get(dateKey) || [];
      const leaveShiftRows = allShiftRows.filter((v) => isLeave(v.vardiyaTipi));
      const dutyShiftRows = allShiftRows.filter((v) => !isLeave(v.vardiyaTipi));
      cells.push({
        day,
        dateKey,
        leaveRows,
        leaveShiftRows,
        dutyShiftRows,
        isToday: dateKey === todayKey,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const leaveDayCount = cells.filter((cell) => cell?.leaveRows?.length || cell?.leaveShiftRows?.length).length;
    const shiftDayCount = cells.filter((cell) => cell?.dutyShiftRows?.length).length;

    return {
      label: monthStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
      cells,
      leaveDayCount,
      shiftDayCount,
    };
  }, [izinCalendarMonth, izinKayitlari, vardiyalar]);

  const [rangeFrom, setRangeFrom] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [rangeTo, setRangeTo] = useState(() => toDateKey(new Date()));

  const rangeFilteredShifts = useMemo(() => {
    if (!rangeFrom || !rangeTo || rangeFrom > rangeTo) return [];
    return [...vardiyalar]
      .filter((v) => !isLeave(v.vardiyaTipi) && v.tarih >= rangeFrom && v.tarih <= rangeTo)
      .sort(compareShiftDatesDesc);
  }, [vardiyalar, rangeFrom, rangeTo]);

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
                En çok görev yaptığı meydan:{' '}
                {topMeydan.meydanId ? (
                  <Link to={`/meydan/${encodeURIComponent(topMeydan.meydanId)}`} className="personel-meydan-link">
                    <strong>{topMeydan.isim}</strong>
                  </Link>
                ) : (
                  <strong>{topMeydan.isim}</strong>
                )}
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
            <div className="detail-filter-bar" style={{ marginBottom: '1.25rem' }}>
              <DateRangePicker value={filterRange} onChange={setFilterRange} />
            </div>

            <div className="personel-stats-row">
              <div className="personel-stat-card">
                <span className="personel-stat-card__label">Planlanan Çalışma Günleri (2026)</span>
                <strong className="personel-stat-card__value">{stats.plannedWorkDays}</strong>
              </div>
              <div className="personel-stat-card">
                <span className="personel-stat-card__label">Toplam Açılan Kayıt</span>
                <strong className="personel-stat-card__value">
                  {(() => {
                    const v = lookupStaticCount(ACILAN_KAYIT_Q1_2026, decodedName);
                    return v !== null ? v : '-';
                  })()}
                </strong>
                <span className="personel-stat-card__meta">{PERIOD_LABEL_Q1_2026}</span>
              </div>
              <div className="personel-stat-card personel-stat-card--songorev">
                <span className="personel-stat-card__label">Son Görev</span>
                <strong className="personel-stat-card__value personel-stat-card__value--sm">
                  {stats.lastShift ? (
                    stats.lastShift.meydanId ? (
                      <Link
                        to={`/meydan/${encodeURIComponent(stats.lastShift.meydanId)}`}
                        className="personel-meydan-link personel-meydan-link--stat"
                      >
                        {resolveMeydanBilgisi(stats.lastShift.meydanId, meydanMap, stats.lastShift).tamAd}
                      </Link>
                    ) : (
                      resolveMeydanBilgisi(stats.lastShift.meydanId, meydanMap, stats.lastShift).tamAd
                    )
                  ) : '-'}
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

            <section className="panel-section personel-leave-panel">
              <div className="panel-section__header">
                <h2>İzin Özeti</h2>
                <p>Veri Yönetimi ekranından yüklenen personel izin kayıtları</p>
              </div>

              <div className="personel-leave-stats">
                <div className="personel-leave-stat personel-leave-stat--clickable-wrap">
                  <button
                    type="button"
                    className="personel-leave-stat personel-leave-stat--clickable"
                    onClick={() => setIsIzinPopoverOpen((current) => !current)}
                    aria-expanded={isIzinPopoverOpen}
                    aria-label="Toplam izin kaydı detaylarını göster"
                  >
                    <span className="personel-leave-stat__label">Toplam İzin Kaydı</span>
                    <strong className="personel-leave-stat__value">{izinSummary.totalRecords}</strong>
                    <small className="personel-leave-stat__hint">Detayları görmek için tıklayın</small>
                  </button>

                  {isIzinPopoverOpen ? (
                    <div className="personel-leave-popover" role="dialog" aria-label="İzin kayıt detayları">
                      <div className="personel-leave-popover__header">
                        <strong>İzin Kayıtları</strong>
                        <button
                          type="button"
                          className="personel-leave-popover__close"
                          onClick={() => setIsIzinPopoverOpen(false)}
                          aria-label="Kapat"
                        >
                          ×
                        </button>
                      </div>
                      {izinSummary.all.length ? (
                        <ul className="personel-leave-popover__list">
                          {izinSummary.all.map((item) => (
                            <li key={item.id} className="personel-leave-popover__item">
                              <strong>{item.izinTuru || 'İzin'}</strong>
                              <span>
                                {formatDate(item.baslangicTarihi)}
                                {item.bitisTarihi && item.bitisTarihi !== item.baslangicTarihi ? ` - ${formatDate(item.bitisTarihi)}` : ''}
                              </span>
                              <small>{item.gunSayisi || 1} gün</small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="personel-leave-popover__empty">Geçerli izin kaydı yok.</p>
                      )}
                    </div>
                  ) : null}
                </div>
                <article className="personel-leave-stat">
                  <span className="personel-leave-stat__label">Bu Ay İzin Günü</span>
                  <strong className="personel-leave-stat__value">{izinSummary.thisMonthDays}</strong>
                </article>
                <article className="personel-leave-stat">
                  <span className="personel-leave-stat__label">Bugün İzin Durumu</span>
                  <strong className="personel-leave-stat__value">{izinSummary.activeTodayCount > 0 ? 'İzinli' : 'Görevde'}</strong>
                </article>
              </div>

              {invalidIzinKayitlari.length > 0 ? (
                <div className="quality-warning-banner">
                  <strong>{invalidIzinKayitlari.length} adet geçersiz/eksik izin kaydı filtrelendi.</strong>
                  <span>Tarih formatı uyumsuz izin satırları takvim görünümünden hariç tutulmuştur.</span>
                </div>
              ) : null}

              <div className="personel-leave-calendar">
                <div className="personel-leave-calendar__header">
                  <button
                    type="button"
                    className="btn btn-ghost btn-inline"
                    onClick={() => setIzinCalendarMonth((current) => shiftMonthKey(current, -1))}
                  >
                    ← Önceki Ay
                  </button>
                  <div className="personel-leave-calendar__title-wrap">
                    <strong>{izinCalendar.label}</strong>
                    <small>
                      {izinCalendar.leaveDayCount > 0 ? `${izinCalendar.leaveDayCount} izinli` : ''}
                      {izinCalendar.leaveDayCount > 0 && izinCalendar.shiftDayCount > 0 ? ' · ' : ''}
                      {izinCalendar.shiftDayCount > 0 ? `${izinCalendar.shiftDayCount} çalışmalı gün` : ''}
                      {izinCalendar.leaveDayCount === 0 && izinCalendar.shiftDayCount === 0 ? 'Kayıt yok' : ''}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-inline"
                    onClick={() => setIzinCalendarMonth((current) => shiftMonthKey(current, 1))}
                  >
                    Sonraki Ay →
                  </button>
                </div>

                <div className="personel-leave-calendar__weekdays" aria-hidden="true">
                  <span>Pzt</span>
                  <span>Sal</span>
                  <span>Çar</span>
                  <span>Per</span>
                  <span>Cum</span>
                  <span>Cmt</span>
                  <span>Paz</span>
                </div>

                <div className="personel-leave-calendar__grid" role="list" aria-label="Aylık personel takvimi">
                  {izinCalendar.cells.map((cell, index) => {
                    if (!cell) {
                      return <span key={`empty-${index}`} className="personel-leave-calendar__day is-empty" aria-hidden="true" />;
                    }

                    const hasLeave = cell.leaveRows.length > 0;
                    const hasLeaveShift = cell.leaveShiftRows.length > 0;
                    const hasDuty = cell.dutyShiftRows.length > 0;
                    const isSelected = selectedDayKey === cell.dateKey;

                    // Badge logic: leave record → blue; weekly tatil → grey; duty → green
                    let badgeText = null;
                    let badgeClass = '';
                    if (hasLeave) {
                      badgeText = cell.leaveRows[0]?.izinTuru || 'İzin';
                      badgeClass = 'personel-leave-calendar__tag--leave';
                    } else if (hasLeaveShift) {
                      badgeText = 'Haftalık İzin';
                      badgeClass = 'personel-leave-calendar__tag--weekly';
                    } else if (hasDuty) {
                      const firstName = resolveMeydanBilgisi(cell.dutyShiftRows[0]?.meydanId, meydanMap, cell.dutyShiftRows[0]).isim;
                      badgeText = cell.dutyShiftRows.length > 1 ? `${cell.dutyShiftRows.length} görev` : firstName;
                      badgeClass = 'personel-leave-calendar__tag--shift';
                    }

                    const classNames = [
                      'personel-leave-calendar__day',
                      hasLeave ? 'is-leave' : '',
                      hasLeaveShift && !hasLeave ? 'is-weekly-leave' : '',
                      hasDuty && !hasLeave && !hasLeaveShift ? 'is-shift' : '',
                      cell.isToday ? 'is-today' : '',
                      isSelected ? 'is-selected' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <button
                        key={cell.dateKey}
                        type="button"
                        className={classNames}
                        onClick={() => setSelectedDayKey((prev) => (prev === cell.dateKey ? null : cell.dateKey))}
                        aria-pressed={isSelected}
                        aria-label={`${formatDate(cell.dateKey)}${hasLeave ? ', izinli' : hasDuty ? ', görevde' : ''}`}
                      >
                        <strong>{cell.day}</strong>
                        {badgeText ? (
                          <span className={`personel-leave-calendar__tag ${badgeClass}`}>{badgeText}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {selectedDayKey && (() => {
                  const cell = izinCalendar.cells.find((c) => c?.dateKey === selectedDayKey);
                  if (!cell) return null;
                  const hasAny = cell.leaveRows.length || cell.leaveShiftRows.length || cell.dutyShiftRows.length;
                  return (
                    <div className="personel-day-detail">
                      <div className="personel-day-detail__header">
                        <strong>{formatDate(selectedDayKey)}</strong>
                        <button type="button" className="personel-day-detail__close" onClick={() => setSelectedDayKey(null)} aria-label="Kapat">×</button>
                      </div>
                      {!hasAny && (
                        <p className="personel-day-detail__empty">Bu gün için kayıt yok.</p>
                      )}
                      {cell.leaveRows.map((item) => (
                        <div key={item.id} className="personel-day-detail__item personel-day-detail__item--leave">
                          <span className="personel-day-detail__type">{item.izinTuru || 'İzin'}</span>
                          <span className="personel-day-detail__meta">
                            {formatDate(item.baslangicTarihi)}
                            {item.bitisTarihi && item.bitisTarihi !== item.baslangicTarihi ? ` – ${formatDate(item.bitisTarihi)}` : ''}
                            {' '}· {item.gunSayisi || 1} gün
                          </span>
                        </div>
                      ))}
                      {cell.leaveShiftRows.map((shift) => (
                        <div key={shift.id} className="personel-day-detail__item personel-day-detail__item--weekly">
                          <span className="personel-day-detail__type">Haftalık İzin</span>
                          <span className="personel-day-detail__meta">{shift.vardiyaTipi}</span>
                        </div>
                      ))}
                      {cell.dutyShiftRows.map((shift) => {
                        const meydan = resolveMeydanBilgisi(shift.meydanId, meydanMap, shift);
                        return (
                          <div key={shift.id} className="personel-day-detail__item personel-day-detail__item--shift">
                            <span className="personel-day-detail__type">Görevde</span>
                            <span className="personel-day-detail__meta">
                              {shift.meydanId ? (
                                <Link
                                  to={`/meydan/${encodeURIComponent(shift.meydanId)}`}
                                  className="personel-day-detail__meydan-link"
                                >
                                  {meydan.tamAd || meydan.isim}
                                </Link>
                              ) : (
                                meydan.tamAd || meydan.isim
                              )}
                              {shift.saatAraligi && shift.saatAraligi !== '-' ? ` · ${shift.saatAraligi}` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {izinSummary.recent.length ? (
                <ul className="personel-leave-list">
                  {izinSummary.recent.map((item) => (
                    <li key={item.id} className="personel-leave-list__item">
                      <div className="personel-leave-list__main">
                        <strong>{item.izinTuru || 'İzin'}</strong>
                        <span>
                          {formatDate(item.baslangicTarihi)}
                          {item.bitisTarihi && item.bitisTarihi !== item.baslangicTarihi ? ` - ${formatDate(item.bitisTarihi)}` : ''}
                        </span>
                        {item.aciklama ? <small>{item.aciklama}</small> : null}
                      </div>
                      <span className="personel-leave-list__days">{item.gunSayisi || 1} gün</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="personel-chart-empty">Bu personel için henüz izin kaydı yüklenmedi.</div>
              )}
            </section>

            <section className="panel-section personel-week-panel">
              <div className="panel-section__header">
                <h2>Haftalık Vardiya</h2>
                <p>Bu hafta çalışacağı meydanlar ve saatler</p>
              </div>

              {weeklyShiftCount > 0 ? (
                <ul className="personel-week-list" aria-label="Personelin bu haftaki vardiya planı">
                  {weeklySchedule.map((day) => (
                    <li key={day.dateKey} className={`personel-week-list__item ${day.isToday ? 'is-today' : ''}`}>
                      <div className="personel-week-list__head">
                        <strong>{day.label}</strong>
                        <span>{day.shifts.length} görev</span>
                      </div>

                      {day.shifts.length ? (
                        <ul className="personel-week-list__rows">
                          {day.shifts.map((shift) => (
                            <li key={shift.id} className="personel-week-list__row">
                              {shift.meydanId ? (
                                <Link
                                  to={`/meydan/${encodeURIComponent(shift.meydanId)}`}
                                  className="personel-week-list__meydan personel-week-list__meydan-link"
                                >
                                  {shift.meydan}
                                </Link>
                              ) : (
                                <span className="personel-week-list__meydan">{shift.meydan}</span>
                              )}
                              <span className="personel-week-list__time">{shift.time}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="personel-week-list__empty">Planlı görev yok</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="personel-chart-empty">Bu hafta için planlı vardiya kaydı bulunamadı.</div>
              )}
            </section>

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

            <section className="panel-section personel-range-panel">
              <div className="panel-section__header">
                <h2>Dönem Sorgulama</h2>
                <p>Seçili tarih aralığındaki vardiya kayıtları</p>
              </div>
              <div className="basvuru-filter-row personel-range-filters">
                <label className="basvuru-filter-field">
                  <span>Başlangıç</span>
                  <input
                    type="date"
                    value={rangeFrom}
                    max={rangeTo || undefined}
                    onChange={(e) => setRangeFrom(e.target.value)}
                  />
                </label>
                <label className="basvuru-filter-field">
                  <span>Bitiş</span>
                  <input
                    type="date"
                    value={rangeTo}
                    min={rangeFrom || undefined}
                    onChange={(e) => setRangeTo(e.target.value)}
                  />
                </label>
              </div>
              {rangeFilteredShifts.length > 0 ? (
                <>
                  <p className="personel-range-meta">{rangeFilteredShifts.length} vardiya kaydı</p>
                  <ul className="personel-range-list">
                    {rangeFilteredShifts.map((v) => (
                      <li key={v.id} className="personel-range-list__item">
                        <span className="personel-range-list__date">{formatDate(v.tarih)}</span>
                        <Link
                          to={`/meydan/${encodeURIComponent(v.meydanId)}`}
                          className="personel-range-list__meydan personel-name-link"
                        >
                          {resolveMeydanBilgisi(v.meydanId, meydanMap, v).isim}
                        </Link>
                        <span className="personel-range-list__saat">{v.saatAraligi || '-'}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="personel-chart-empty">
                  {rangeFrom && rangeTo
                    ? 'Seçili tarih aralığında vardiya kaydı bulunamadı.'
                    : 'Tarih aralığı seçin.'}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
