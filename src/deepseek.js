const DEFAULT_DIRECT_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_PROXY_ENDPOINT = '/api/deepseek';
const CHUNK_SIZE = 8;
const MAX_RETRY = 4;

function convertToCompactText(json) {
  if (!Array.isArray(json) || json.length === 0) return '';
  const headers = Object.keys(json[0]);
  let text = `${headers.join(' | ')}\n`;
  text += `${headers.map(() => '---').join(' | ')}\n`;
  json.forEach((row) => {
    text += `${headers.map((h) => String(row[h] || '').replace(/\n/g, ' ')).join(' | ')}\n`;
  });
  return text;
}

function normalizeShift(item) {
  return {
    personelAdi: item[0],
    meydanId: item[1],
    kisaAd: item[2],
    tamAd: item[3],
    tarih: item[4],
    saatAraligi: item[5] || '10:00-18:30',
    vardiyaTipi: item[6] || 'Gunduz',
  };
}

function parseDeepSeekResponse(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON bulunamadi.');

  const parsed = JSON.parse(jsonMatch[0]);
  const rawList = parsed.v || (Array.isArray(parsed) ? parsed : Object.values(parsed).find((value) => Array.isArray(value)));

  if (!rawList || !Array.isArray(rawList)) {
    throw new Error('Vardiya listesi bulunamadi.');
  }

  return rawList.map(normalizeShift).filter((item) => item && item.personelAdi && item.meydanId && item.tarih);
}

function readAiConfig() {
  const proxyEndpoint = import.meta.env.VITE_AI_PROXY_URL || DEFAULT_PROXY_ENDPOINT;
  const directApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  const directEndpoint = import.meta.env.VITE_DEEPSEEK_ENDPOINT || DEFAULT_DIRECT_ENDPOINT;
  const allowDirect = import.meta.env.VITE_ALLOW_CLIENT_DEEPSEEK === 'true';

  return { allowDirect, directApiKey, directEndpoint, proxyEndpoint };
}

function shouldRetry(error) {
  const status = Number(error?.status || error?.cause?.status || 0);
  if (!status) {
    return true;
  }

  if (status === 429 || status >= 500) {
    return true;
  }

  return false;
}

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithRetry(requestFactory, retryCount = MAX_RETRY, onRetry) {
  let lastError = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;
      if (attempt === retryCount) {
        break;
      }

      if (!shouldRetry(error)) {
        break;
      }

      const delay = Math.min(3000, (200 * (2 ** attempt)) + Math.floor(Math.random() * 120));
      onRetry?.({ attempt: attempt + 1, retryCount, delay, error });
      await waitFor(delay);
    }
  }

  throw lastError;
}

export async function sendToDeepSeek(rawJson, onProgress, options = {}) {
  const config = readAiConfig();
  if (!Array.isArray(rawJson) || !rawJson.length) {
    return [];
  }

  let allVardiyalar = [];
  const totalChunks = Math.ceil(rawJson.length / CHUNK_SIZE);

  for (let i = 0; i < rawJson.length; i += CHUNK_SIZE) {
    const currentChunk = Math.floor(i / CHUNK_SIZE) + 1;
    if (onProgress) onProgress(currentChunk, totalChunks);

    const chunk = rawJson.slice(i, i + CHUNK_SIZE);

    try {
      const chunkResult = await postWithRetry(() => fetchDeepSeekChunk(chunk, config, options));
      allVardiyalar = [...allVardiyalar, ...chunkResult];
    } catch (error) {
      console.error(`Grup ${currentChunk} islenirken hata:`, error);
      throw error;
    }
  }

  const unique = new Map();
  allVardiyalar.forEach((item) => {
    const key = `${item.personelAdi}|${item.meydanId}|${item.tarih}|${item.saatAraligi}|${item.vardiyaTipi}`;
    if (!unique.has(key)) unique.set(key, item);
  });

  return Array.from(unique.values());
}

async function fetchDeepSeekChunk(chunk, config, options = {}) {
  const compactData = convertToCompactText(chunk);
  const expectedYear = Number(options.expectedYear) || new Date().getFullYear();

  const systemPrompt = `Gelen ham Excel verilerini analiz edip personellerin haftalık vardiya planını çıkaracaksın. 
VERİ YAPISI:
- Veriler tablo formatındadır (Sütunlar | ile ayrılmıştır).
- İlk sütunlar genellikle 'Çalışma Saati' veya 'Adı Soyadı' bilgilerini içerir.
- Tarihler sütun başlıklarında yer alır (örn: "30.Mar Pazartesi").
- Hücrelerin içinde birden fazla meydan adı, saat bilgisi (Örn: "TAM GÜN", "SABAH") veya özel notlar ("HT", "İzinli", "Çalıştay") bulunabilir.

KURALLAR:
1. Her personel ve her tarih için bir kayıt oluştur.
1.1. YIL KURALI: Tarihler ${expectedYear} yılına göre çıkarılmalıdır. Excel içinde yıl açıkça yazmıyorsa yılı ${expectedYear} kabul et.
2. Saat Bilgisi: Excel'de "SABAH", "AKŞAM" vb. belirtilmişse kendi saatlerine sadık kal: "SABAH" (08:30-17:00), "AKŞAM" (11:30-20:00), "TAM GÜN" veya belirtilmemişse (10:00-18:30). SAAT FORMATI: Mutlaka HH:MM-HH:MM formatında olsun.
3. MEYDAN İSİMLERİ (DİNAMİK): Excel listesinde yüzlerce farklı meydan olabilir. Senden istediğim her bulduğun meydan için:
   - "tamAd": Hücrede yazan eksiksiz orijinal isim. (Örn: "Mecidiyeköy Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü...")
   - "kisaAd": İnsanın okuyacağı sadeleştirilmiş ve kısaltılmış adı. (Örn: "Mecidiyeköy")
   - "meydanId": Kısa adın türkçe karaktersiz ve küçük harfli ID versiyonu. (Örn: "mecidiyekoy")
4. Çıktı formatı SADECE geçerli bir JSON objesi olsun. Diziyi "v" anahtarı altında döndür.
5. BOYUT KISITI: Alan adlarını tekrarlamamak için her vardiyayı şu sırayla bir dizi (array) olarak döndür:
   [personelAdi, meydanId, kisaAd, tamAd, tarih, saatAraligi, vardiyaTipi]
   Örn: { "v": [ ["Ahmet Yılmaz", "mecidiyekoy", "Mecidiyeköy", "Mecidiyeköy Meydanı-Şişli Uğur...", "2026-03-31", "10:00-18:30", "Gündüz"], ... ] }`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Bu personellerin verilerini "v" anahtari altinda JSON listesine donustur:\n\n${compactData}` },
  ];

  const body = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.1,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  };

  try {
    const proxyResponse = await fetch(config.proxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider: 'deepseek', payload: body }),
    });

    if (!proxyResponse.ok) {
      const detail = await proxyResponse.text();
      const proxyError = new Error(`Proxy yanıtı başarısız: ${proxyResponse.status}`);
      proxyError.status = proxyResponse.status;
      proxyError.detail = detail.slice(0, 200);
      throw proxyError;
    }

    const proxyData = await proxyResponse.json();
    const proxyText =
      proxyData.choices?.[0]?.message?.content ||
      proxyData.data?.choices?.[0]?.message?.content ||
      proxyData.content ||
      '';

    return parseDeepSeekResponse(proxyText);
  } catch {
    // Proxy yoksa fallback denenecek.
  }

  if (!config.allowDirect || !config.directApiKey) {
    throw new Error('DeepSeek proxy ulasilamadi. Ayrı terminalde `npm run proxy:ai` calistirin. Gerekirse VITE_AI_PROXY_URL ayarlayin veya gecici olarak VITE_ALLOW_CLIENT_DEEPSEEK=true kullanin.');
  }

  const res = await fetch(config.directEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.directApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    const directError = new Error(`DeepSeek API hatasi: ${res.status} - ${errorBody.substring(0, 120)}`);
    directError.status = res.status;
    throw directError;
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  try {
    return parseDeepSeekResponse(text);
  } catch (error) {
    throw new Error(`Parse hatasi: ${error.message}. Ham yanitin basi: ${text.substring(0, 80)}`);
  }
}
