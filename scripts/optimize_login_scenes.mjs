import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const sourcePrimaryDir = path.join(rootDir, 'public', 'login-scenes-photo');
const sourceFallbackDir = path.join(rootDir, 'public', 'login-scenes');
const outputDir = path.join(rootDir, 'public', 'login-scenes', 'optimized');
const reportPath = path.join(outputDir, 'report.json');

const SCENE_ORDER = [
  'istanbul-1',
  'istanbul-3',
  'istanbul-5',
  'istanbul-2',
  'istanbul-4',
];

const PRESETS = {
  'istanbul-1': { position: 'center', brightness: 1.01, saturation: 0.92, contrastSlope: 1.02, contrastOffset: -4 },
  'istanbul-2': { position: 'center', brightness: 1.0, saturation: 0.88, contrastSlope: 0.97, contrastOffset: 2 },
  'istanbul-3': { position: 'center', brightness: 1.0, saturation: 0.9, contrastSlope: 0.98, contrastOffset: 1 },
  'istanbul-4': { position: 'attention', brightness: 1.06, saturation: 0.86, contrastSlope: 0.97, contrastOffset: 3 },
  'istanbul-5': { position: 'center', brightness: 1.01, saturation: 0.9, contrastSlope: 0.98, contrastOffset: 1 },
};

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function findSourceFile(sceneName) {
  const candidateNames = [
    `${sceneName}.png`,
    `${sceneName}.jpg`,
    `${sceneName}.jpeg`,
    `${sceneName.replace('istanbul', 'İstanbul')}.png`,
    `${sceneName.replace('istanbul', 'İstanbul')}.jpg`,
    `${sceneName.replace('istanbul', 'İstanbul')}.jpeg`,
  ];

  for (const fileName of candidateNames) {
    const primary = path.join(sourcePrimaryDir, fileName);
    try {
      await fs.access(primary);
      return primary;
    } catch {
      // continue
    }

    const fallback = path.join(sourceFallbackDir, fileName);
    try {
      await fs.access(fallback);
      return fallback;
    } catch {
      // continue
    }
  }

  return null;
}

function formatKB(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

async function optimizeScene(sceneName) {
  const sourcePath = await findSourceFile(sceneName);

  if (!sourcePath) {
    throw new Error(`Kaynak gorsel bulunamadi: ${sceneName}`);
  }

  const preset = PRESETS[sceneName];
  const base = sharp(sourcePath, { failOn: 'none' })
    .rotate()
    .resize(2752, 1536, {
      fit: 'cover',
      position: preset.position,
    })
    .modulate({
      brightness: preset.brightness,
      saturation: preset.saturation,
      hue: 0,
    })
    .linear(preset.contrastSlope, preset.contrastOffset)
    .sharpen({ sigma: 1.05, m1: 1, m2: 2, x1: 2, y2: 10, y3: 16 });

  const jpgPath = path.join(outputDir, `${sceneName}.jpg`);
  const webpPath = path.join(outputDir, `${sceneName}.webp`);
  const avifPath = path.join(outputDir, `${sceneName}.avif`);

  await Promise.all([
    base.clone().jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(jpgPath),
    base.clone().webp({ quality: 78, effort: 6 }).toFile(webpPath),
    base.clone().avif({ quality: 52, effort: 6 }).toFile(avifPath),
  ]);

  const [jpgStat, webpStat, avifStat] = await Promise.all([
    fs.stat(jpgPath),
    fs.stat(webpPath),
    fs.stat(avifPath),
  ]);

  return {
    scene: sceneName,
    source: path.relative(rootDir, sourcePath).replaceAll('\\\\', '/'),
    outputs: {
      jpg: { path: path.relative(rootDir, jpgPath).replaceAll('\\\\', '/'), sizeKB: formatKB(jpgStat.size) },
      webp: { path: path.relative(rootDir, webpPath).replaceAll('\\\\', '/'), sizeKB: formatKB(webpStat.size) },
      avif: { path: path.relative(rootDir, avifPath).replaceAll('\\\\', '/'), sizeKB: formatKB(avifStat.size) },
    },
  };
}

async function main() {
  await ensureDir(outputDir);

  const result = [];

  for (const sceneName of SCENE_ORDER) {
    const report = await optimizeScene(sceneName);
    result.push(report);
  }

  const totals = result.reduce(
    (acc, item) => {
      acc.jpg += item.outputs.jpg.sizeKB;
      acc.webp += item.outputs.webp.sizeKB;
      acc.avif += item.outputs.avif.sizeKB;
      return acc;
    },
    { jpg: 0, webp: 0, avif: 0 },
  );

  const report = {
    generatedAt: new Date().toISOString(),
    outputDir: path.relative(rootDir, outputDir).replaceAll('\\\\', '/'),
    sceneOrder: SCENE_ORDER,
    scenes: result,
    totalSizeKB: {
      jpg: Math.round(totals.jpg * 10) / 10,
      webp: Math.round(totals.webp * 10) / 10,
      avif: Math.round(totals.avif * 10) / 10,
    },
  };

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Login scene optimizasyonu tamamlandi.');
  console.log(`Rapor: ${path.relative(rootDir, reportPath).replaceAll('\\\\', '/')}`);
  console.log(`Toplam JPG: ${report.totalSizeKB.jpg} KB`);
  console.log(`Toplam WebP: ${report.totalSizeKB.webp} KB`);
  console.log(`Toplam AVIF: ${report.totalSizeKB.avif} KB`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
