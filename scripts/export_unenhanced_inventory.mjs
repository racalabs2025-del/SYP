import fs from 'node:fs';
import path from 'node:path';
import { ALL_CANONICAL_MEYDANLAR } from '../src/data/canonicalMeydanData.js';

const dir = path.resolve('./public/assets/meydan_photos');

const unenhancedList = [];

for (const m of ALL_CANONICAL_MEYDANLAR) {
  (m.images || []).forEach((relPath, idx) => {
    const filename = path.basename(relPath);
    const fullPath = path.join(dir, filename);
    const exists = fs.existsSync(fullPath);
    const size = exists ? fs.statSync(fullPath).size : 0;
    const isNamedUpgraded = !filename.startsWith('photo_slide') || filename.includes('detail');
    
    // If it's still a photo_slide and not custom upgraded or size < 350KB
    if (!isNamedUpgraded || size < 350000) {
      unenhancedList.push({
        meydanId: m.id,
        meydanName: m.name,
        district: m.district,
        yaka: m.yaka,
        sira: m.sira,
        index: idx + 1,
        relPath,
        filename,
        fullPath,
        sizeKB: Math.round(size / 1024),
        yapimYili: m.yapimYili,
        fonksiyonlar: m.fonksiyonlar || [],
        aciklama: m.aciklama || ''
      });
    }
  });
}

console.log('Total unenhanced images remaining:', unenhancedList.length);
const distinctSquares = [...new Set(unenhancedList.map(x => x.meydanName))];
console.log('Distinct squares:', distinctSquares.length);

// Group by priority / yaka
const avrupa = unenhancedList.filter(x => x.yaka === 'avrupa');
const anadolu = unenhancedList.filter(x => x.yaka === 'anadolu');

console.log(`Avrupa: ${avrupa.length} images (${new Set(avrupa.map(x => x.meydanName)).size} squares)`);
console.log(`Anadolu: ${anadolu.length} images (${new Set(anadolu.map(x => x.meydanName)).size} squares)`);

fs.writeFileSync('scripts/unenhanced_inventory.json', JSON.stringify(unenhancedList, null, 2));
