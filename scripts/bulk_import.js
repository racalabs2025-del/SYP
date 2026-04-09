import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';
import { readSecret, resolveSourceDir } from './shared/env.js';

const readFile = XLSX.readFile || XLSX.default?.readFile;
const utils = XLSX.utils || XLSX.default?.utils;
const WRITE_BATCH_LIMIT = 400;
const AI_CHUNK_SIZE = 5;

if (!readFile || !utils) {
  console.error('XLSX fonksiyonlari bulunamadi. Ice aktarma durduruldu.');
  process.exit(1);
}

const apiKey = readSecret('VITE_DEEPSEEK_API_KEY');

if (!apiKey) {
  console.error('VITE_DEEPSEEK_API_KEY bulunamadi.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function splitIntoChunks(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function convertToCompactText(json) {
  if (!Array.isArray(json) || !json.length) {
    return '';
  }

  const headers = Object.keys(json[0]);
  let text = `${headers.join(' | ')}\n`;
  text += `${headers.map(() => '---').join(' | ')}\n`;

  json.forEach((row) => {
    text += `${headers.map((header) => String(row[header] || '').replace(/\n/g, ' ')).join(' | ')}\n`;
  });

  return text;
}

async function fetchDeepSeekChunk(chunk) {
  const endpoint = 'https://api.deepseek.com/v1/chat/completions';
  const compactData = convertToCompactText(chunk);

  const systemPrompt = `Gelen ham Excel verilerini analiz edip personellerin haftalik vardiya planini cikaracaksin.
Guncel yil 2026. Tarih formatini mutlaka YYYY-MM-DD yap.
Saat eslemeleri: SABAH 08:30-17:00, AKSAM 11:30-20:00, TAM GUN 10:00-18:30.
Cikti yalnizca JSON olacak ve "v" anahtari altinda dizi donecek.
Her eleman su sirada olacak: [personelAdi, meydanId, kisaAd, tamAd, tarih, saatAraligi, vardiyaTipi].`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Veriler:\n\n${compactData}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek hatasi: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  try {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error('JSON bulunamadi.');
    }

    const parsed = JSON.parse(match[0]);
    const list = parsed.v || [];

    if (!Array.isArray(list)) {
      throw new Error('v anahtari altinda dizi yok.');
    }

    return list.filter((item) => Array.isArray(item) && item.length >= 5);
  } catch {
    console.error(`[AI Yanit Hatasi] Parse edilemedi. Ham metin: ${text.slice(0, 200)}...`);
    return [];
  }
}

async function writeImportedRows(rows) {
  const meydanSnapshot = await getDocs(collection(db, 'meydanlar'));
  const mevcutMeydanIds = new Set(meydanSnapshot.docs.map((item) => item.id));
  const yeniMeydanlar = new Map();
  const vardiyalar = [];

  rows.forEach((item) => {
    const normalizedMeydan = normalizeMeydanInput({
      meydanId: item[1],
      kisaAd: item[2],
      tamAd: item[3],
    });

    if (!normalizedMeydan.valid) {
      return;
    }

    const meydanId = normalizedMeydan.id;

    if (meydanId && !mevcutMeydanIds.has(meydanId) && !yeniMeydanlar.has(meydanId)) {
      yeniMeydanlar.set(meydanId, {
        isim: normalizedMeydan.isim,
        tamAd: normalizedMeydan.tamAd,
      });
    }

    vardiyalar.push({
      personelAdi: item[0],
      meydanId,
      tarih: item[4],
      saatAraligi: item[5] || '10:00-18:30',
      vardiyaTipi: item[6] || 'Gunduz',
      createdAt: serverTimestamp(),
    });
  });

  const shiftChunkSize = Math.max(1, WRITE_BATCH_LIMIT - yeniMeydanlar.size);
  const shiftChunks = splitIntoChunks(vardiyalar, shiftChunkSize);
  let meydanlarCommitted = false;

  for (const chunk of shiftChunks) {
    const batch = writeBatch(db);

    if (!meydanlarCommitted) {
      for (const [id, data] of yeniMeydanlar.entries()) {
        batch.set(doc(db, 'meydanlar', id), data);
      }

      meydanlarCommitted = true;
    }

    chunk.forEach((vardiya) => {
      batch.set(doc(collection(db, 'vardiyalar')), vardiya);
    });

    await batch.commit();
  }
}

async function runBulkImport() {
  const sourceDir = resolveSourceDir('C:/Users/candu/Desktop/PLANLAR');

  if (!sourceDir || !fs.existsSync(sourceDir)) {
    console.error(`Kaynak klasor bulunamadi: ${sourceDir || '(bos)'}`);
    process.exit(1);
  }

  const files = fs.readdirSync(sourceDir).filter((file) => file.toLowerCase().endsWith('.xlsx'));
  console.log(`Toplu aktarim basladi: ${files.length} dosya.`);

  for (let index = 0; index < files.length; index += 1) {
    const fileName = files[index];
    console.log(`\n[${index + 1}/${files.length}] DOSYA: ${fileName}`);

    try {
      const filePath = path.join(sourceDir, fileName);
      const workbook = readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawJson = utils.sheet_to_json(sheet, { defval: '' });
      const filteredJson = rawJson.filter((row) =>
        Object.values(row).some((value) => value && value.toString().trim().length > 0),
      );

      console.log(`  - Excel'den ${filteredJson.length} satir okundu. AI'ya gonderiliyor...`);
      const aiChunks = splitIntoChunks(filteredJson, AI_CHUNK_SIZE);
      const fileVardiyalar = [];

      for (let chunkIndex = 0; chunkIndex < aiChunks.length; chunkIndex += 1) {
        console.log(`  - AI Isleniyor: Grup ${chunkIndex + 1}/${aiChunks.length}...`);

        try {
          const chunkRows = await fetchDeepSeekChunk(aiChunks[chunkIndex]);
          chunkRows.forEach((item) => {
            if (Array.isArray(item)) {
              fileVardiyalar.push(item);
            }
          });
        } catch (error) {
          console.error(`  - Grup ${chunkIndex + 1} hatasi: ${error.message}`);
        }
      }

      if (!fileVardiyalar.length) {
        console.warn('  - Kayit bulunamadi, dosya atlandi.');
        continue;
      }

      console.log(`  - Veritabanina yaziliyor: ${fileVardiyalar.length} kayit...`);
      await writeImportedRows(fileVardiyalar);
      console.log(`  - Dosya bitti: ${fileName}`);
      await sleep(1500);
    } catch (error) {
      console.error(`  - Dosya hatasi [${fileName}]: ${error.message}`);
    }
  }

  console.log('\nTum surec tamamlandi.');
}

runBulkImport().catch((error) => {
  console.error(error.message);
  process.exit(1);
});