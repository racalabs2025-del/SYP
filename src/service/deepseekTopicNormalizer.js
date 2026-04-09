/**
 * deepseekTopicNormalizer.js
 * 
 * DeepSeek API'yi kullanarak başvuru konularını standart kategorilere normalizes.
 * Örn: "Yol bozuk", "Asfalt çukuru", "Kaldırım hasarı" → "BAKIM_ONARIM"
 * 
 * Export edilen fonksiyonlar:
 *   - normalizeTopic(konu, aciklama, apiKey) -> Promise<{ normalized, category, confidence }>
 *   - normalizeTopicBatch(items, apiKey, onProgress) -> Promise<{ konu, normalizedKonu, category }[]>
 */

const DEFAULT_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

/**
 * Standart kategori listesi — sistemde kullanılan temel konular
 */
const STANDARD_CATEGORIES = [
  'BAKIM_ONARIM',
  'AYDINLATMA',
  'VE_SU_KANAL',
  'CES_VE_DIS_TIC',
  'PEYZAJ_YESIL_ALAN',
  'CIKISLAR_BEGE',
  'YAYALAR_VE_BISIKLET',
  'VENT_VE_TESISLER',
  'KAMU_TESISLERI',
  'ETKINLIKLER_ORGANIZASYON',
  'DIGER',
];

/**
 * API hatası veya timeout durumunda fallback
 */
function getFallbackNormalization(konu) {
  // Basit keyword eşlemesi
  const keywordMap = {
    'yol': 'BAKIM_ONARIM',
    'asfalt': 'BAKIM_ONARIM',
    'kaldırım': 'BAKIM_ONARIM',
    'hasara': 'BAKIM_ONARIM',
    'bozul': 'BAKIM_ONARIM',
    'aydınlat': 'AYDINLATMA',
    'lamba': 'AYDINLATMA',
    'işık': 'AYDINLATMA',
    'su': 'VE_SU_KANAL',
    'kanal': 'VE_SU_KANAL',
    'çeşme': 'CIKISLAR_BEGE',
    'ağaç': 'PEYZAJ_YESIL_ALAN',
    'yeşil': 'PEYZAJ_YESIL_ALAN',
    'sandalye': 'CIKISLAR_BEGE',
    'koltuk': 'CIKISLAR_BEGE',
    'masası': 'CIKISLAR_BEGE',
    'torna': 'BAKIM_ONARIM',
    'çöp': 'BAKIM_ONARIM',
  };

  const normalized = String(konu || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c');

  for (const [keyword, category] of Object.entries(keywordMap)) {
    if (normalized.includes(keyword)) {
      return { normalized: category, category, confidence: 0.6 };
    }
  }

  return { normalized: 'DIGER', category: 'DIGER', confidence: 0.3 };
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Endpoint'i al — Node.js veya browser bağlamında
 */
function getEndpoint() {
  // Check for Node.js environment
  if (typeof globalThis.process !== 'undefined' && globalThis.process?.env) {
    return globalThis.process.env.VITE_DEEPSEEK_ENDPOINT || DEFAULT_ENDPOINT;
  }
  // Fallback to default
  return DEFAULT_ENDPOINT;
}

/**
 * DeepSeek API'ye sistem prompt ve mesaj gönder
 */
async function callDeepSeekApi(messages, apiKey) {
  const endpoint = getEndpoint();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API hatası: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  if (!content) {
    throw new Error('API yanıt içeriği boş');
  }

  return content;
}

/**
 * JSON yanıtını ayrıştır
 */
function parseApiResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON yapısı bulunamadı');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(`API yanıtı parse hatası: ${err.message}`);
  }
}

/**
 * Tek bir konuyu normalizes — retry mantığı ile
 */
async function normalizeTopic(konu, aciklama = '', apiKey) {
  if (!apiKey) {
    return getFallbackNormalization(konu);
  }

  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const systemPrompt = `İBB meydan yönetimi başvuruları için konu kategorilendirmesi yapacaksın.

GEREKLİ ÇIKTILARI:
- normalized: Orijinal konunun genelleştirilmiş hali (Türkçe, UPPERCASE, öğretici)
- category: Aşağıdaki listeden BİR SEÇİM:
  "${STANDARD_CATEGORIES.join('", "')}"
- confidence: 0.1 ile 1.0 arası güvenirlik skoru (1.0 = emin, 0.1 = spekülasyon)

Örnek giriş:
  konu: "Yol çukuru"
  aciklama: "Sultan caddesinde büyük kaldırım hasarı var"

Örnek çıktı:
{
  "normalized": "Yol ve Kaldırım Bakım-Onarım",
  "category": "BAKIM_ONARIM",
  "confidence": 0.95
}`;

      const userMessage = `Konu: "${konu}"
Açıklama: "${aciklama}"

Bu başvuruyu kategorize et ve normalleştirilmiş başlığı döndür.`;

      const content = await callDeepSeekApi(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        apiKey
      );

      const result = parseApiResponse(content);

      // Validasyon
      if (!result.category || !STANDARD_CATEGORIES.includes(result.category)) {
        result.category = 'DIGER';
      }
      if (typeof result.confidence !== 'number') {
        result.confidence = 0.5;
      }
      result.confidence = Math.max(0.1, Math.min(1.0, result.confidence));

      return result;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  console.warn(`Normalizasyon başarısız oldu (${konu}): ${lastError?.message}. Fallback kullanılıyor.`);
  return getFallbackNormalization(konu);
}

/**
 * Başvuruları batch olarak normalizes
 * Her item: { konu, altKonu?, aciklama?, ... }
 */
async function normalizeTopicBatch(items, apiKey, onProgress) {
  if (!Array.isArray(items) || !items.length) {
    return [];
  }

  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, items.length);
    }

    try {
      const normResult = await normalizeTopic(
        item.konu || '',
        item.aciklama || '',
        apiKey
      );

      results.push({
        basvuruNo: item.basvuruNo,
        konu: item.konu,
        normalizedKonu: normResult.normalized,
        category: normResult.category,
        confidence: normResult.confidence,
      });
    } catch (err) {
      console.error(`Batch item hatası (${item.konu}):`, err.message);
      const fallback = getFallbackNormalization(item.konu);
      results.push({
        basvuruNo: item.basvuruNo,
        konu: item.konu,
        normalizedKonu: fallback.normalized,
        category: fallback.category,
        confidence: 0.2, // Düşük güvenirlik = fallback kullanıldı
      });
    }

    // API kısıtlaması için ara
    if (i < items.length - 1) {
      await sleep(300);
    }
  }

  return results;
}

export { normalizeTopic, normalizeTopicBatch, STANDARD_CATEGORIES };
