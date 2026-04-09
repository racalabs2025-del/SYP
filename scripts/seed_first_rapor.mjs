import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { addDoc, collection, doc, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';

const CHUNK_SIZE = 500 * 1024;

function readArg(flag, fallback) {
  const entry = process.argv.find((item) => item.startsWith(`${flag}=`));
  if (!entry) {
    return fallback;
  }

  return entry.slice(flag.length + 1) || fallback;
}

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.pdf') {
    return 'application/pdf';
  }

  if (extension === '.pptx') {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }

  return 'application/octet-stream';
}

function buildSimplePdf(title) {
  const lines = [
    '%PDF-1.1',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    `<< /Length 78 >>`,
    'stream',
    'BT',
    '/F1 18 Tf',
    '72 760 Td',
    `(${title.replace(/[()\\]/g, '\\$&')}) Tj`,
    '0 -28 Td',
    '/F1 11 Tf',
    '(Saha Yonetim Portali icin seed raporudur.) Tj',
    '0 -18 Td',
    '(Bu dokuman test amacli otomatik olarak eklendi.) Tj',
    'ET',
    'endstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000010 00000 n ',
    '0000000063 00000 n ',
    '0000000122 00000 n ',
    '0000000248 00000 n ',
    '0000000380 00000 n ',
    'trailer',
    '<< /Root 1 0 R /Size 6 >>',
    'startxref',
    '450',
    '%%EOF',
  ];

  return Buffer.from(lines.join('\n'), 'utf8');
}

function toDataUrl(pdfBuffer) {
  return `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
}

function toFileDataUrl(fileBuffer, mimeType) {
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

function splitChunks(value) {
  const chunks = [];

  for (let index = 0; index < value.length; index += CHUNK_SIZE) {
    chunks.push(value.slice(index, index + CHUNK_SIZE));
  }

  return chunks;
}

async function run() {
  const title = readArg('--title', 'Nisan 2026 Faaliyet Raporu');
  const name = readArg('--name', 'nisan-2026-faaliyet-raporu.pdf');
  const filePath = readArg('--file', '');
  const fileBuffer = filePath ? fs.readFileSync(path.resolve(filePath)) : buildSimplePdf(title);
  const effectiveName = filePath ? path.basename(filePath) : name;
  const mimeType = filePath ? getMimeType(filePath) : 'application/pdf';
  const base64 = filePath ? toFileDataUrl(fileBuffer, mimeType) : toDataUrl(fileBuffer);
  const chunks = splitChunks(base64);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Anonim oturum aciliyor...');
  await signInAnonymously(auth);

  console.log('Rapor metadata belgesi yaziliyor...');
  const raporRef = await addDoc(collection(db, 'meydanFaaliyetRaporlari'), {
    baslik: title,
    ad: effectiveName,
    boyut: fileBuffer.length,
    chunkCount: chunks.length,
    createdAt: serverTimestamp(),
    yuklenmeTarihi: new Date().toLocaleString('tr-TR'),
  });

  console.log('Chunk belgeleri yaziliyor...');
  const batch = writeBatch(db);
  chunks.forEach((chunk, index) => {
    batch.set(
      doc(collection(db, 'meydanFaaliyetRaporlari', raporRef.id, 'chunks'), String(index).padStart(4, '0')),
      { data: chunk, index },
    );
  });
  await batch.commit();

  console.log(`Tamamlandi. Rapor ID: ${raporRef.id}`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});