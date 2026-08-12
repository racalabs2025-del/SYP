import fs from 'fs';
import path from 'path';
import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const APPLY_MODE = process.argv.includes('--apply');
const ARCHIVE_UNRESOLVED = process.argv.includes('--archive-unresolved');
const HELP_MODE = process.argv.includes('--help') || process.argv.includes('-h');
const MIN_YEAR = 2020;
const MAX_YEAR = 2040;

function normalizePersonelKey(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidDateKey(dateKey, { minYear = MIN_YEAR, maxYear = MAX_YEAR } = {}) {
  const raw = String(dateKey || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || year < minYear || year > maxYear) return false;

  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

function toDate(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(dateKey, delta) {
  const base = toDate(dateKey);
  if (!base) return '';
  base.setDate(base.getDate() + delta);
  return formatDateKey(base);
}

function dayDiffInclusive(fromDateKey, toDateKey) {
  const from = toDate(fromDateKey);
  const to = toDate(toDateKey);
  if (!from || !to) return 1;
  const safeTo = to < from ? from : to;
  const diff = Math.round((safeTo.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function resolveDates(row) {
  const rawStart = String(row?.baslangicTarihi || '').trim();
  const rawEnd = String(row?.bitisTarihi || row?.baslangicTarihi || '').trim();
  const startValid = isValidDateKey(rawStart);
  const endValid = isValidDateKey(rawEnd);
  const rawDays = Number(row?.gunSayisi);
  const gunSayisi = Number.isFinite(rawDays) && rawDays > 0 ? Math.floor(rawDays) : 1;

  if (startValid && endValid) {
    const start = rawStart <= rawEnd ? rawStart : rawEnd;
    const end = rawStart <= rawEnd ? rawEnd : rawStart;
    return { ok: true, start, end, gunSayisi: dayDiffInclusive(start, end), reason: rawStart <= rawEnd ? 'valid' : 'swapped' };
  }

  if (startValid && !endValid) {
    const end = addDays(rawStart, Math.max(0, gunSayisi - 1));
    if (!isValidDateKey(end)) return { ok: false, reason: 'cannot-build-end' };
    return { ok: true, start: rawStart, end, gunSayisi: dayDiffInclusive(rawStart, end), reason: 'rebuild-end-from-days' };
  }

  if (!startValid && endValid) {
    const start = addDays(rawEnd, -Math.max(0, gunSayisi - 1));
    if (!isValidDateKey(start)) return { ok: false, reason: 'cannot-build-start' };
    return { ok: true, start, end: rawEnd, gunSayisi: dayDiffInclusive(start, rawEnd), reason: 'rebuild-start-from-days' };
  }

  return { ok: false, reason: 'both-invalid' };
}

function printHelp() {
  console.log('Personel izin tarih düzeltme scripti');
  console.log('');
  console.log('Ne yapar:');
  console.log('- 2020-2040 aralığı dışındaki tarihleri hatalı kabul eder');
  console.log('- Tek tarafı hatalı kayıtlarda gunSayisi ile eksik tarihi yeniden üretir');
  console.log('- Tarih sıralaması ters ise düzeltir ve gunSayisi yeniden hesaplar');
  console.log('- İsteğe bağlı çözülmeyen kayıtları arşive taşıyabilir');
  console.log('');
  console.log('Kullanım:');
  console.log('  node scripts/fix_personel_izin_dates.mjs');
  console.log('  node scripts/fix_personel_izin_dates.mjs --apply');
  console.log('  node scripts/fix_personel_izin_dates.mjs --apply --archive-unresolved');
}

async function main() {
  if (HELP_MODE) {
    printHelp();
    return;
  }

  const app = initializeApp(firebaseConfig);

  try {
    const auth = getAuth(app);
    await signInAnonymously(auth);
    const db = getFirestore(app);

    const snapshot = await getDocs(collection(db, 'personelIzinler'));
    const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    const fixable = [];
    const unresolved = [];

    rows.forEach((row) => {
      const result = resolveDates(row);
      if (!result.ok) {
        unresolved.push({ id: row.id, personelAdi: row.personelAdi || '-', reason: result.reason, baslangicTarihi: row.baslangicTarihi || '-', bitisTarihi: row.bitisTarihi || '-' });
        return;
      }

      const currentStart = String(row.baslangicTarihi || '').trim();
      const currentEnd = String(row.bitisTarihi || row.baslangicTarihi || '').trim();
      const currentDays = Number(row.gunSayisi);
      const nextDays = result.gunSayisi;

      const changed = currentStart !== result.start
        || currentEnd !== result.end
        || !Number.isFinite(currentDays)
        || Math.floor(currentDays) !== nextDays
        || !String(row?.personelAdiNorm || '').trim();

      if (changed) {
        fixable.push({
          id: row.id,
          personelAdi: row.personelAdi || '-',
          from: `${currentStart || '-'} - ${currentEnd || '-'}`,
          to: `${result.start} - ${result.end}`,
          reason: result.reason,
          patch: {
            baslangicTarihi: result.start,
            bitisTarihi: result.end,
            gunSayisi: nextDays,
            personelAdiNorm: normalizePersonelKey(row.personelAdi || row.personelAdiNorm || ''),
            updatedAt: serverTimestamp(),
            tarihFixAppliedAt: serverTimestamp(),
          },
        });
      }
    });

    const report = {
      scanned: rows.length,
      fixable: fixable.length,
      unresolved: unresolved.length,
      archiveUnresolved: ARCHIVE_UNRESOLVED,
      sampleFixable: fixable.slice(0, 50).map((item) => ({ id: item.id, personelAdi: item.personelAdi, from: item.from, to: item.to, reason: item.reason })),
      sampleUnresolved: unresolved.slice(0, 50),
      generatedAt: new Date().toISOString(),
    };

    const outDir = path.resolve(process.cwd(), 'scripts', 'reports');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `izin-date-fix-report-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

    console.log('='.repeat(64));
    console.log('PERSONEL IZIN TARIH DUZELTME RAPORU');
    console.log('='.repeat(64));
    console.log(`Taranan kayıt: ${rows.length}`);
    console.log(`Düzeltilebilir kayıt: ${fixable.length}`);
    console.log(`Çözülemeyen kayıt: ${unresolved.length}`);
    console.log(`Rapor dosyası: ${outPath}`);

    if (fixable.length) {
      console.log('Düzeltilebilir örnekler (ilk 20):');
      fixable.slice(0, 20).forEach((item, index) => {
        console.log(`${index + 1}. ${item.personelAdi} | ${item.from} -> ${item.to} (${item.reason})`);
      });
    }

    if (unresolved.length) {
      console.log('Çözülemeyen örnekler (ilk 20):');
      unresolved.slice(0, 20).forEach((item, index) => {
        console.log(`${index + 1}. ${item.personelAdi} | ${item.baslangicTarihi} - ${item.bitisTarihi} (${item.reason})`);
      });
    }

    if (!APPLY_MODE) {
      console.log('');
      console.log('Dry-run tamamlandı. Yazım yapılmadı.');
      console.log('Uygulamak için: node scripts/fix_personel_izin_dates.mjs --apply');
      if (unresolved.length) {
        console.log('Çözülemeyenleri arşive taşımak için: node scripts/fix_personel_izin_dates.mjs --apply --archive-unresolved');
      }
      return;
    }

    for (const item of fixable) {
      await setDoc(doc(db, 'personelIzinler', item.id), item.patch, { merge: true });
    }

    let archivedCount = 0;
    if (ARCHIVE_UNRESOLVED && unresolved.length) {
      for (const item of unresolved) {
        const sourceRef = doc(db, 'personelIzinler', item.id);
        const archiveRef = doc(collection(db, 'personelIzinHataArsivi'));
        await setDoc(archiveRef, {
          sourceCollection: 'personelIzinler',
          sourceId: item.id,
          personelAdi: item.personelAdi,
          baslangicTarihi: item.baslangicTarihi,
          bitisTarihi: item.bitisTarihi,
          reason: item.reason,
          archivedAt: serverTimestamp(),
        });
        await deleteDoc(sourceRef);
        archivedCount += 1;
      }
    }

    console.log('');
    console.log(`Tamamlandı. ${fixable.length} kayıt düzeltildi.${ARCHIVE_UNRESOLVED ? ` ${archivedCount} çözülemeyen kayıt arşive taşındı.` : ''}`);
  } finally {
    await deleteApp(app);
  }
}

main().catch((error) => {
  console.error('İzin tarih fix hatası:', error?.message || error);
  process.exitCode = 1;
});
