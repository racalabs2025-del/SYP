import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { ALL_CANONICAL_MEYDANLAR } from '../src/data/canonicalMeydanData.js';

const gitOutput = execSync('git show --name-only --pretty="" 0d48518').toString();
const upgradedInCommit = new Set(
  gitOutput
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('public/assets/meydan_photos/'))
    .map(l => path.basename(l))
);

upgradedInCommit.add('mecidiyekoy_meydani_1.jpg');
upgradedInCommit.add('photo_slide85_39dea70ced.jpg');

const remainingNeedUpgrade = [];

for (const m of ALL_CANONICAL_MEYDANLAR) {
  (m.images || []).forEach((relPath, idx) => {
    const filename = path.basename(relPath);
    if (!upgradedInCommit.has(filename)) {
      remainingNeedUpgrade.push({
        meydanId: m.id,
        meydanName: m.name,
        district: m.district,
        yaka: m.yaka,
        sira: m.sira,
        index: idx + 1,
        relPath,
        filename,
        aciklama: m.aciklama,
        yapimYili: m.yapimYili,
        fonksiyonlar: m.fonksiyonlar
      });
    }
  });
}

console.log('Total images never upgraded with AI:', remainingNeedUpgrade.length);
console.log('Distinct squares with at least one non-upgraded image:', new Set(remainingNeedUpgrade.map(x => x.meydanName)).size);
console.log('Breakdown by Yaka:');
const avrupa = remainingNeedUpgrade.filter(x => x.yaka === 'avrupa');
const anadolu = remainingNeedUpgrade.filter(x => x.yaka === 'anadolu');
console.log('  Avrupa:', avrupa.length, 'images in', new Set(avrupa.map(x => x.meydanName)).size, 'squares');
console.log('  Anadolu:', anadolu.length, 'images in', new Set(anadolu.map(x => x.meydanName)).size, 'squares');

fs.writeFileSync('scripts/remaining_non_upgraded.json', JSON.stringify(remainingNeedUpgrade, null, 2));

// Print squares by district
const byDistrict = {};
remainingNeedUpgrade.forEach(item => {
  if (!byDistrict[item.district]) byDistrict[item.district] = [];
  byDistrict[item.district].push(item);
});

console.log('\nDistricts needing upgrade:');
for (const [dist, list] of Object.entries(byDistrict)) {
  console.log(`- ${dist} (${list.length} images): ${[...new Set(list.map(x => x.meydanName))].join(', ')}`);
}
