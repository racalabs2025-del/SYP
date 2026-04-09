import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const APPLY_MODE = process.argv.includes('--apply');
const FROM_ARG = process.argv.find((arg) => arg.startsWith('--from='))?.slice(7);
const TO_ARG = process.argv.find((arg) => arg.startsWith('--to='))?.slice(5);
const STRATEGY_ARG = process.argv.find((arg) => arg.startsWith('--strategy='))?.slice(11) || 'previous';
const VALID_STRATEGIES = new Set(['previous', 'nearest']);

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function enumerateDateRange(fromDate, toDate) {
  const dates = [];
  const cursor = new Date(fromDate);

  while (cursor <= toDate) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function findSourceDate(missingDate, existingDates, strategy) {
  if (!existingDates.length) {
    return '';
  }

  if (strategy === 'previous') {
    for (let index = existingDates.length - 1; index >= 0; index -= 1) {
      if (existingDates[index] < missingDate) {
        return existingDates[index];
      }
    }

    for (let index = 0; index < existingDates.length; index += 1) {
      if (existingDates[index] > missingDate) {
        return existingDates[index];
      }
    }

    return '';
  }

  let best = '';
  let bestDistance = Number.MAX_SAFE_INTEGER;
  const targetMs = new Date(`${missingDate}T00:00:00`).getTime();

  for (const dateKey of existingDates) {
    const dateMs = new Date(`${dateKey}T00:00:00`).getTime();
    const distance = Math.abs(dateMs - targetMs);
    if (distance < bestDistance) {
      best = dateKey;
      bestDistance = distance;
    }
  }

  return best;
}

function buildShiftKey(shift, dateKeyOverride = '') {
  return [
    String(shift.personelAdi || '').trim(),
    String(shift.meydanId || '').trim(),
    dateKeyOverride || String(shift.tarih || '').trim(),
    String(shift.saatAraligi || '').trim(),
    String(shift.vardiyaTipi || '').trim(),
  ].join('|');
}

function toWriteChunks(items, chunkSize = 400) {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

async function writeRows(db, rows) {
  const chunks = toWriteChunks(rows, 400);

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      batch.set(doc(collection(db, 'vardiyalar')), {
        personelAdi: item.personelAdi,
        meydanId: item.meydanId,
        tarih: item.tarih,
        saatAraligi: item.saatAraligi,
        vardiyaTipi: item.vardiyaTipi,
        kaynak: 'gap-fill',
        yuklemeKaynagi: 'coverage-audit-script',
        createdAt: serverTimestamp(),
        gapFilledAt: serverTimestamp(),
        gapFillSourceDate: item.gapFillSourceDate,
      });
    });
    await batch.commit();
  }
}

async function main() {
  if (!VALID_STRATEGIES.has(STRATEGY_ARG)) {
    throw new Error(`Gecersiz strategy: ${STRATEGY_ARG}. Kullanilabilir: previous, nearest`);
  }

  const now = new Date();
  const fromDate = parseIsoDate(FROM_ARG, new Date('2026-01-01T00:00:00'));
  const toDate = parseIsoDate(TO_ARG, new Date(`${toDateKey(now)}T00:00:00`));

  if (!fromDate || !toDate) {
    throw new Error('Tarih araligi gecersiz. Ornek: --from=2026-01-01 --to=2026-04-09');
  }

  if (fromDate > toDate) {
    throw new Error('--from tarihi --to tarihinden buyuk olamaz.');
  }

  const app = initializeApp(firebaseConfig);

  try {
    const auth = getAuth(app);
    await signInAnonymously(auth);
    const db = getFirestore(app);

    console.log('Vardiya kayitlari okunuyor...');
    const allSnapshot = await getDocs(query(collection(db, 'vardiyalar')));
    const allRows = allSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    const validRows = allRows
      .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(String(row.tarih || '').trim()))
      .map((row) => ({ ...row, tarih: String(row.tarih).trim() }));

    const availableDateSet = new Set(validRows.map((row) => row.tarih));
    const availableDatesSorted = Array.from(availableDateSet).sort((left, right) => left.localeCompare(right));
    const dateRange = enumerateDateRange(fromDate, toDate);
    const missingDates = dateRange.filter((dateKey) => !availableDateSet.has(dateKey));

    const byDate = new Map();
    validRows.forEach((row) => {
      const dateKey = row.tarih;
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey).push(row);
    });

    const existingTargetKeys = new Set(validRows.map((row) => buildShiftKey(row)));
    const plannedInsertions = [];
    const unresolvedDates = [];

    for (const missingDate of missingDates) {
      const sourceDate = findSourceDate(missingDate, availableDatesSorted, STRATEGY_ARG);
      if (!sourceDate) {
        unresolvedDates.push(missingDate);
        continue;
      }

      const sourceRows = byDate.get(sourceDate) || [];
      if (!sourceRows.length) {
        unresolvedDates.push(missingDate);
        continue;
      }

      sourceRows.forEach((sourceRow) => {
        const candidate = {
          personelAdi: String(sourceRow.personelAdi || '').trim(),
          meydanId: String(sourceRow.meydanId || '').trim(),
          tarih: missingDate,
          saatAraligi: String(sourceRow.saatAraligi || '').trim(),
          vardiyaTipi: String(sourceRow.vardiyaTipi || '').trim(),
          gapFillSourceDate: sourceDate,
        };

        if (!candidate.personelAdi || !candidate.meydanId || !candidate.saatAraligi) {
          return;
        }

        const key = buildShiftKey(candidate, missingDate);
        if (existingTargetKeys.has(key)) {
          return;
        }

        existingTargetKeys.add(key);
        plannedInsertions.push(candidate);
      });
    }

    const firstDate = availableDatesSorted[0] || 'N/A';
    const lastDate = availableDatesSorted[availableDatesSorted.length - 1] || 'N/A';

    console.log('='.repeat(64));
    console.log('VARDIYA TARIH KAPSAM RAPORU');
    console.log('='.repeat(64));
    console.log(`Toplam kayit: ${allRows.length}`);
    console.log(`Gecerli tarihli kayit: ${validRows.length}`);
    console.log(`Ilk tarih (db): ${firstDate}`);
    console.log(`Son tarih (db): ${lastDate}`);
    console.log(`Kontrol araligi: ${toDateKey(fromDate)} .. ${toDateKey(toDate)}`);
    console.log(`Beklenen gun sayisi: ${dateRange.length}`);
    console.log(`Eksik gun sayisi: ${missingDates.length}`);
    console.log(`Planlanan eklenecek vardiya: ${plannedInsertions.length}`);
    console.log(`Cozulemeyen eksik gun: ${unresolvedDates.length}`);

    if (missingDates.length) {
      console.log('Eksik gunler (ilk 40):');
      console.log(missingDates.slice(0, 40).join(', '));
    }

    if (unresolvedDates.length) {
      console.log('Kaynak bulunamayan gunler (ilk 20):');
      console.log(unresolvedDates.slice(0, 20).join(', '));
    }

    if (!APPLY_MODE) {
      console.log('\nDry-run tamamlandi. Yazim yapilmadi.');
      console.log('Yazmak icin: node scripts/audit_vardiya_coverage.mjs --apply');
      return;
    }

    if (!plannedInsertions.length) {
      console.log('\nEksik gun bulunmadi veya eklenecek kayit olusmadi.');
      return;
    }

    console.log('\nEksik vardiyalar yaziliyor...');
    await writeRows(db, plannedInsertions);
    console.log(`Tamamlandi. Eklenen vardiya kaydi: ${plannedInsertions.length}`);
  } finally {
    await deleteApp(app);
  }
}

main().catch((error) => {
  console.error('Kapsam kontrol hatasi:', error?.message || error);
  process.exitCode = 1;
});
