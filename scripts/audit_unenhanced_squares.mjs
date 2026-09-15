import fs from 'node:fs';
import path from 'node:path';
import { ALL_CANONICAL_MEYDANLAR } from '../src/data/canonicalMeydanData.js';

// Let's check which files exist in public/assets/meydan_photos/
const dir = path.resolve('./public/assets/meydan_photos');
const files = fs.readdirSync(dir);

// Find all AI generated files in public/assets/meydan_photos/
// Usually named like: *_meydani_*.jpg, *_1.jpg, *_2.jpg, taksim_*, etc.
const customFiles = files.filter(f => !f.startsWith('photo_slide'));
console.log('Total files in meydan_photos:', files.length);
console.log('Named/Custom upgraded files in dir:', customFiles.length);
console.log('Custom upgraded files:', customFiles);

// Now let's inspect each square in ALL_CANONICAL_MEYDANLAR:
const summary = [];
for (const m of ALL_CANONICAL_MEYDANLAR) {
  const images = (m.images || []).map((relPath, idx) => {
    const filename = path.basename(relPath);
    const isCustom = !filename.startsWith('photo_slide');
    const fullPath = path.join(dir, filename);
    const exists = fs.existsSync(fullPath);
    const size = exists ? fs.statSync(fullPath).size : 0;
    return {
      index: idx + 1,
      relPath,
      filename,
      isCustom,
      sizeKB: Math.round(size / 1024),
    };
  });

  const hasUnenhanced = images.some(img => !img.isCustom && !img.filename.includes('detail') && img.sizeKB < 600);
  summary.push({
    id: m.id,
    name: m.name,
    district: m.district,
    yaka: m.yaka,
    heroImage: path.basename(m.heroImage || ''),
    images,
    hasUnenhanced
  });
}

const unenhancedSquares = summary.filter(s => s.hasUnenhanced);
console.log('\nTotal squares with unenhanced images:', unenhancedSquares.length);
unenhancedSquares.forEach(s => {
  console.log(`- [${s.name}] (${s.district}): ${s.images.map(i => `${i.filename} (${i.sizeKB}KB)`).join(', ')}`);
});
