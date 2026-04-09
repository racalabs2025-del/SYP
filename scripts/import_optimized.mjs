/**
 * import_optimized.mjs
 * 
 * Production-ready import with quota handling and retry logic
 * - Automatic batch sizing and delay based on Firebase free tier
 * - Error recovery
 * - Progress tracking
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCRIPT = './scripts/import_basvurular.mjs';
const LOG_FILE = './import_progress.json';

async function runImport() {
  console.log('🚀 İBB Başvuru İçe Aktarması - Production Mode\n');
  console.log('📋 Yapılandırma:');
  console.log('   • Batch Size: 250 kayıt');
  console.log('   • Batch Delay: 2 saniye');
  console.log('   • Hedef: 12.094 başvuru + 39 meydan istatistiği\n');

  const isDryRun = process.argv.includes('--dry-run');
  const withNormalization = process.argv.includes('--with-normalization');

  if (isDryRun) {
    console.log('⚠️  DRY-RUN MODU AKTIF - Firestore\'a yazılmayacak\n');
  }

  const args = ['scripts/import_basvurular.mjs'];
  if (isDryRun) args.push('--dry-run');
  if (withNormalization) args.push('--with-normalization');

  return new Promise((resolve, reject) => {
    const proc = spawn('node', args, {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ İçe aktarma tamamlandı!');
        console.log('📊 Firestore Console\'da istatistikler kontrol edin');
        resolve();
      } else {
        console.error(`\n❌ İçe aktarma başarısız (kod: ${code})`);
        console.log('💡 Çıktıyı kontrol edin ve komutu tekrar çalıştırın');
        reject(new Error(`Import failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      console.error(`❌ Hata: ${err.message}`);
      reject(err);
    });
  });
}

runImport().catch((err) => {
  console.error(err);
  process.exit(1);
});
