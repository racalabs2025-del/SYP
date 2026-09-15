import fs from 'node:fs';
import path from 'node:path';
import { ALL_CANONICAL_MEYDANLAR } from '../src/data/canonicalMeydanData.js';

function getDimensions(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  if (filePath.endsWith('.png')) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), size: buffer.length };
  } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] === 0xFF && (buffer[offset + 1] === 0xC0 || buffer[offset + 1] === 0xC2)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7), size: buffer.length };
      }
      if (buffer[offset] === 0xFF) {
        offset += 2 + buffer.readUInt16BE(offset + 2);
      } else {
        offset++;
      }
    }
  }
  return { size: buffer.length };
}

let totalImages = 0;
let upgraded = 0;
let unenhanced = 0;
const needsUpgrade = [];

for (const m of ALL_CANONICAL_MEYDANLAR) {
  (m.images || []).forEach((relPath, idx) => {
    totalImages++;
    const cleanRel = relPath.startsWith('/') ? relPath.slice(1) : relPath;
    const resolvedPath = path.resolve('./public', cleanRel);
    const dims = getDimensions(resolvedPath);
    const filename = path.basename(relPath);
    
    // An upgraded image is high res (>= 1000px wide, 16:9 widescreen, usually > 300KB)
    // Unenhanced images are either:
    // 1. Raw slide files (photo_slide...) that were never upgraded
    // 2. Vertical images (height > width)
    // 3. Low resolution / small file sizes (under 300KB or under 1000px wide)
    const isWidescreen = dims?.width && dims?.height && (dims.width / dims.height >= 1.5);
    const isHighRes = dims?.width && dims.width >= 1000;
    const isUpgradedSize = dims?.size && dims.size >= 280000;
    const isNamedUpgraded = !filename.startsWith('photo_slide') || filename.includes('detail');

    if (isWidescreen && isHighRes && (isUpgradedSize || isNamedUpgraded)) {
      upgraded++;
    } else {
      unenhanced++;
      needsUpgrade.push({
        meydanId: m.id,
        meydanName: m.name,
        district: m.district,
        yaka: m.yaka,
        index: idx + 1,
        relPath,
        filename,
        dims,
        isVertical: dims ? dims.height > dims.width : false,
        ratio: dims ? (dims.width / dims.height).toFixed(2) : 'N/A'
      });
    }
  });
}

console.log('=== SYP SQUARE PHOTO INVENTORY ===');
console.log('Total Squares:', ALL_CANONICAL_MEYDANLAR.length);
console.log('Total Images in Data:', totalImages);
console.log('Already Upgraded (16:9 High-Res):', upgraded);
console.log('Needs Upgrade / Raw Slide Images:', unenhanced);
console.log('Distinct Squares Needing Upgrade:', new Set(needsUpgrade.map(x => x.meydanName)).size);
console.log('\n--- LIST OF IMAGES NEEDING UPGRADE ---');
needsUpgrade.forEach(x => {
  console.log(`[${x.meydanName}] (${x.district}) - Görsel ${x.index}: ${x.filename} | ${x.dims?.width}x${x.dims?.height} (${x.ratio}:1) | ${Math.round((x.dims?.size || 0) / 1024)}KB`);
});
