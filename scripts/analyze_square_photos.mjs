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

const report = [];

for (const meydan of ALL_CANONICAL_MEYDANLAR) {
  const images = (meydan.images || []).map((relPath, idx) => {
    const fullPath = path.resolve('./public' + relPath.replace(/^\/assets/, '/assets'));
    const cleanRel = relPath.startsWith('/') ? relPath.slice(1) : relPath;
    const publicPath = path.resolve('./public', cleanRel);
    const resolvedPath = fs.existsSync(fullPath) ? fullPath : publicPath;
    const dims = getDimensions(resolvedPath);
    const filename = path.basename(relPath);
    const isSlideName = filename.startsWith('photo_slide');
    const isVertical = dims?.width && dims?.height && dims.height > dims.width;
    const isLowRes = dims?.width && dims.width < 1000;
    const isSmallFile = dims?.size && dims.size < 300000; // Under 300KB usually raw unenhanced PPTX slide crop
    return {
      index: idx + 1,
      relPath,
      filename,
      dims,
      isSlideName,
      isVertical,
      isLowRes,
      isSmallFile,
    };
  });

  report.push({
    id: meydan.id,
    sira: meydan.sira,
    name: meydan.name,
    district: meydan.district,
    yaka: meydan.yaka,
    heroImage: meydan.heroImage,
    images,
  });
}

console.log(JSON.stringify(report, null, 2));
