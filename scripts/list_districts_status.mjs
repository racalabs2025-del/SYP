import { AVRUPA_DISTRICTS, ANADOLU_DISTRICTS } from '../src/data/canonicalMeydanData.js';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('public/assets/meydan_photos');

function analyzeDistricts(districts, title) {
  console.log(`\n=== ${title} ===`);
  districts.forEach((d, i) => {
    const needs = [];
    d.meydanlar.forEach(m => {
      (m.images || []).forEach((img, idx) => {
        const f = path.basename(img);
        const isCustom = !f.startsWith('photo_slide');
        const p = path.join(dir, f);
        const size = fs.existsSync(p) ? fs.statSync(p).size : 0;
        if (!isCustom && size < 600000) {
          needs.push({ meydan: m.name, id: m.id, file: f, idx: idx+1, size });
        }
      });
    });
    console.log(`${i+1}. ${d.name} (${d.meydanlar.length} meydan) - Needing upgrade: ${needs.length} images`);
    needs.forEach(n => console.log(`   * [${n.meydan}] Görsel ${n.idx}: ${n.file} (${Math.round(n.size/1024)}KB)`));
  });
}

analyzeDistricts(AVRUPA_DISTRICTS, 'AVRUPA DISTRICTS');
analyzeDistricts(ANADOLU_DISTRICTS, 'ANADOLU DISTRICTS');
