import { collection, deleteDoc, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebaseDb';
import { normalizeMeydanInput } from './utils/meydanNormalization';

const BATCH_LIMIT = 400;
const MAX_SKIP_DETAILS = 20;

const MONTH_MAP = {
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

function splitIntoChunks(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function normalizeLeaveType(value) {
  const normalized = normalizeText(value);

  if (normalized === 'ht' || normalized === 'hafta tatili' || normalized === 'hafta tatili') {
    return 'HAFTA TATILI';
  }

  if (normalized === 'izinli' || normalized === 'izin') {
    return 'Izinli';
  }

  if (value === 'İzinli') {
    return 'Izinli';
  }

  if (value === 'HAFTA TATILI' || value === 'HAFTA TATİLİ') {
    return 'HAFTA TATILI';
  }

  return value || 'Gunduz';
}

function isOffDayValue(value) {
  const normalized = normalizeText(value);
  return normalized === 'ht' || normalized === 'hafta tatili' || normalized === 'izinli' || normalized === 'izin';
}

function isOffDayRow(item) {
  return isOffDayValue(item?.vardiyaTipi) || isOffDayValue(item?.meydanId) || isOffDayValue(item?.kisaAd) || isOffDayValue(item?.tamAd);
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c');
}

function toDateKey(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeDateValue(value, expectedYear = new Date().getFullYear()) {
  if (!value) {
    return '';
  }

  const raw = String(value).trim();
  if (!raw) {
    return '';
  }

  const ymdMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const parsedYear = Number(year);
    const correctedYear = Number.isFinite(expectedYear) && Math.abs(parsedYear - expectedYear) === 1 ? expectedYear : parsedYear;
    return toDateKey(correctedYear, Number(month), Number(day));
  }

  const dmyMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const parsedYear = Number(year);
    const correctedYear = Number.isFinite(expectedYear) && Math.abs(parsedYear - expectedYear) === 1 ? expectedYear : parsedYear;
    return toDateKey(correctedYear, Number(month), Number(day));
  }

  const monthText = normalizeText(raw).replace(/[,]/g, ' ').replace(/\s+/g, ' ');
  const parts = monthText.split(' ').filter(Boolean);

  if (parts.length >= 2) {
    const day = Number(parts[0].replace(/\D/g, ''));
    const month = MONTH_MAP[parts[1]];
    const year = Number((parts[2] || '').replace(/\D/g, '')) || expectedYear;

    const correctedYear = Number.isFinite(expectedYear) && Math.abs(year - expectedYear) === 1 ? expectedYear : year;

    if (day && month) {
      return toDateKey(correctedYear, month, day);
    }
  }

  return '';
}

function normalizeTimeRange(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '10:00-18:30';
  }

  const clean = raw.replace(/[–—]/g, '-').replace(/\./g, ':').replace(/\s+/g, '');
  const match = clean.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);

  if (!match) {
    return '10:00-18:30';
  }

  const startHour = Number(match[1]);
  const startMinute = Number(match[2]);
  const endHour = Number(match[3]);
  const endMinute = Number(match[4]);

  if (
    Number.isNaN(startHour)
    || Number.isNaN(startMinute)
    || Number.isNaN(endHour)
    || Number.isNaN(endMinute)
    || startHour < 0
    || startHour > 23
    || endHour < 0
    || endHour > 23
    || startMinute < 0
    || startMinute > 59
    || endMinute < 0
    || endMinute > 59
  ) {
    return '10:00-18:30';
  }

  return `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}-${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
}

export async function batchAddVardiyalar(vardiyalar, options = {}) {
  const expectedYear = Number(options.expectedYear) || new Date().getFullYear();
  const meydanSnapshot = await getDocs(collection(db, 'meydanlar'));
  const mevcutMeydanIds = new Set(meydanSnapshot.docs.map((item) => item.id));
  const yeniMeydanlar = new Map();
  const uniqueShifts = new Map();
  let skippedMissingFields = 0;
  let skippedInvalidDate = 0;
  let skippedInvalidMeydan = 0;
  let ignoredOffDays = 0;
  const skippedDetails = {
    missingFields: [],
    invalidDate: [],
    invalidMeydan: [],
  };

  function addSkipDetail(type, item, extra = {}) {
    if (!skippedDetails[type] || skippedDetails[type].length >= MAX_SKIP_DETAILS) {
      return;
    }

    skippedDetails[type].push({
      personelAdi: item?.personelAdi || '-',
      tarih: item?.tarih || '-',
      meydan: item?.tamAd || item?.kisaAd || item?.meydanId || '-',
      ...extra,
    });
  }

  vardiyalar.forEach((item) => {
    const leaveType = normalizeLeaveType(item?.vardiyaTipi);
    const rowIsOffDay = isOffDayRow(item) || leaveType === 'HAFTA TATILI' || leaveType === 'Izinli';

    if (!item?.personelAdi || !item?.tarih) {
      if (rowIsOffDay) {
        ignoredOffDays += 1;
        return;
      }

      skippedMissingFields += 1;
      addSkipDetail('missingFields', item);
      return;
    }

    const normalizedDate = normalizeDateValue(item.tarih, expectedYear);
    if (!normalizedDate) {
      if (rowIsOffDay) {
        ignoredOffDays += 1;
        return;
      }

      skippedInvalidDate += 1;
      addSkipDetail('invalidDate', item);
      return;
    }

    const normalizedTime = normalizeTimeRange(item.saatAraligi);

    const normalizedMeydan = normalizeMeydanInput(item);
    if (!normalizedMeydan.valid) {
      if (rowIsOffDay) {
        ignoredOffDays += 1;
        return;
      }

      skippedInvalidMeydan += 1;
      addSkipDetail('invalidMeydan', item);
      return;
    }

    const vardiyaTipi = leaveType;
    const shiftKey = [item.personelAdi, normalizedMeydan.id, normalizedDate, normalizedTime, vardiyaTipi].join('|');

    if (!uniqueShifts.has(shiftKey)) {
      uniqueShifts.set(shiftKey, {
        personelAdi: item.personelAdi,
        meydanId: normalizedMeydan.id,
        tarih: normalizedDate,
        saatAraligi: normalizedTime,
        vardiyaTipi,
      });
    }

    if (!mevcutMeydanIds.has(normalizedMeydan.id) && !yeniMeydanlar.has(normalizedMeydan.id)) {
      yeniMeydanlar.set(normalizedMeydan.id, {
        isim: normalizedMeydan.isim,
        tamAd: normalizedMeydan.tamAd,
      });
    }
  });

  const operations = [
    ...Array.from(yeniMeydanlar.entries()).map(([id, data]) => ({ type: 'meydan', id, data })),
    ...Array.from(uniqueShifts.values()).map((data) => ({ type: 'vardiya', data })),
  ];

  const chunks = splitIntoChunks(operations, BATCH_LIMIT);

  for (const chunk of chunks) {
    const batch = writeBatch(db);

    chunk.forEach((operation) => {
      if (operation.type === 'meydan') {
        batch.set(doc(db, 'meydanlar', operation.id), operation.data);
        return;
      }

      batch.set(doc(collection(db, 'vardiyalar')), {
        ...operation.data,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  return {
    totalInput: Array.isArray(vardiyalar) ? vardiyalar.length : 0,
    createdMeydanlar: yeniMeydanlar.size,
    createdShifts: uniqueShifts.size,
    skippedMissingFields,
    skippedInvalidDate,
    skippedInvalidMeydan,
    ignoredOffDays,
    skippedDetails,
  };
}

export async function deleteVardiya(id) {
  await deleteDoc(doc(db, 'vardiyalar', id));
}

export async function deleteAllData() {
  const [vardiyalarSnapshot, meydanlarSnapshot] = await Promise.all([
    getDocs(collection(db, 'vardiyalar')),
    getDocs(collection(db, 'meydanlar')),
  ]);

  const refs = [
    ...vardiyalarSnapshot.docs.map((item) => item.ref),
    ...meydanlarSnapshot.docs.map((item) => item.ref),
  ];

  const chunks = splitIntoChunks(refs, BATCH_LIMIT);

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((reference) => batch.delete(reference));
    await batch.commit();
  }
}
