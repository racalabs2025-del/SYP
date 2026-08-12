import { getMeydanReadingNote } from './meydanReadingNotes';

const DEEPSEEK_PROXY_ENDPOINT = '/api/deepseek';

function trimText(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function buildSearchUrl(meydan) {
  const query = `${meydan?.isim || meydan?.tamAd || 'meydan'} hakkında bilgi`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const SPOTLIGHT_ANGLE_VARIANTS = [
  'gün içi yönlendirme akışının görünür olduğu bir temas noktasıdır',
  'çevre hareketinin düzenli izlenmesini gerektiren bir merkezdir',
  'kamusal dolaşımın toplandığı ana odak alanlarından biridir',
  'saha ekip koordinasyonunun sürekli takip edildiği aktif bir alandır',
  'yaya temasının yoğun hissedildiği operasyon odaklarından biridir',
  'çevre düzeninin ve akışın birlikte yönetildiği bir buluşma alanıdır',
];

const SPOTLIGHT_OPERATION_VARIANTS = [
  'Kısa müdahale ve yönlendirme ihtiyacı gün içinde hızlı karar takibi gerektirebilir.',
  'Saha görünürlüğünün korunması, vatandaş temasının sürekliliği açısından önemlidir.',
  'Planlama ve anlık koordinasyon dengesinin birlikte yürütülmesi beklenir.',
  'Ekip konumlanmasının dengeli tutulması, meydan düzenini doğrudan etkiler.',
  'Günlük operasyon temposu, saha geri bildirimlerinin düzenli toplanmasını gerekli kılar.',
  'Akışın sürekliliği için saha iletişiminin canlı tutulması kritik rol oynar.',
];

const SPOTLIGHT_BADGE_VARIANTS = [
  'Saha odağı',
  'Akış odağı',
  'Kamusal merkez',
  'Koordinasyon noktası',
  'Yaya akışı',
  'Operasyon özeti',
];

function normalizeSpotlightText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hashText(value) {
  const text = String(value || '');
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function pickVariant(list, seed) {
  if (!Array.isArray(list) || !list.length) {
    return '';
  }

  return list[Math.abs(seed) % list.length];
}

function buildDeterministicSummary(meydan) {
  const exactName = String(meydan?.isim || 'Bu meydan').trim() || 'Bu meydan';
  const baseSeed = hashText(`${meydan?.id || ''}|${meydan?.isim || ''}|${meydan?.tamAd || ''}`);
  const angle = pickVariant(SPOTLIGHT_ANGLE_VARIANTS, baseSeed);
  const detail = pickVariant(SPOTLIGHT_OPERATION_VARIANTS, baseSeed + 13);
  return `${exactName}, ${angle}. ${detail}`;
}

function buildDeterministicBadge(meydan) {
  const seed = hashText(`${meydan?.id || ''}|${meydan?.isim || ''}|badge`);
  return pickVariant(SPOTLIGHT_BADGE_VARIANTS, seed) || 'Meydan özeti';
}

function isGenericSummary(summary) {
  const normalized = normalizeSpotlightText(summary);
  if (!normalized) {
    return true;
  }

  return /(canli bir kamusal alan|canli bir bulusma noktasi|ulasim ve sosyal bulusmalar|ana baglanti noktasi|bolgenin merkezinde)/.test(normalized);
}

function finalizeSpotlight(meydan, spotlight) {
  const exactName = String(meydan?.isim || '').trim();
  const rawSummary = String(spotlight?.summary || '').trim();
  const summaryHasMeydanName = exactName
    ? normalizeSpotlightText(rawSummary).includes(normalizeSpotlightText(exactName))
    : true;

  const safeSummary = (!rawSummary || isGenericSummary(rawSummary) || !summaryHasMeydanName)
    ? buildDeterministicSummary(meydan)
    : rawSummary;

  const rawBadge = String(spotlight?.badge || '').trim();
  const safeBadge = !rawBadge || /^google/i.test(rawBadge)
    ? buildDeterministicBadge(meydan)
    : rawBadge;

  return {
    title: trimText(spotlight?.title || exactName || 'Meydan Notu', 26),
    summary: trimText(safeSummary, 140),
    badge: trimText(safeBadge, 22),
    searchUrl: spotlight?.searchUrl || buildSearchUrl(meydan),
  };
}

function buildContextPhrase(meydan) {
  const exactName = String(meydan?.isim || '').trim();
  const fullName = String(meydan?.tamAd || '').trim();
  const normalizedFullName = normalizeSpotlightText(fullName);

  if (/sahil/.test(normalizedFullName)) {
    return `${exactName || 'Bu meydan'}, sahil hattına yakın konumu nedeniyle gün içi akışın görünür olduğu bir buluşma alanıdır.`;
  }

  if (/cumhuriyet|ozgurluk|demokrasi|kent/.test(normalizedFullName)) {
    return `${exactName || 'Bu meydan'}, kamusal odak noktası niteliğiyle çevresindeki yaya hareketini ve günlük meydan düzenini toparlayan bir merkezdir.`;
  }

  if (/rihtim|iskele/.test(normalizedFullName)) {
    return `${exactName || 'Bu meydan'}, geçiş ve bekleme hareketinin hissedildiği güçlü bir bağlantı alanı olarak öne çıkar.`;
  }

  if (/park|vadi/.test(normalizedFullName)) {
    return `${exactName || 'Bu meydan'}, açık alan kullanımı ve çevre dolaşımıyla daha geniş bir nefes alanı hissi veren operasyon noktalarından biridir.`;
  }

  return `${exactName || 'Bu meydan'}, çevresindeki günlük kullanım akışını toplayan aktif bir kamusal temas noktası olarak öne çıkar.`;
}

function buildDetailPhrase(meydan) {
  const fullName = String(meydan?.tamAd || '').trim();
  const exactName = String(meydan?.isim || '').trim();

  if (fullName && fullName !== exactName) {
    return `${fullName} çevresindeki hareket, bu alanın yönlendirme ve görünürlük açısından düzenli takibini önemli kılar.`;
  }

  const variants = [
    'Yakın çevresindeki yaya dolaşımı nedeniyle sahadaki düzenin dengeli yürütülmesi beklenir.',
    'Günlük kullanım yoğunluğu, saha ekibinin görünürlüğünü ve hızlı koordinasyonu öne çıkarır.',
    'Çevre akışı, kısa temas ve yönlendirme ihtiyacını gün içinde belirgin hale getirebilir.',
  ];

  return variants[hashText(exactName || fullName) % variants.length];
}

function buildBadge(meydan) {
  const normalized = normalizeSpotlightText(`${meydan?.isim || ''} ${meydan?.tamAd || ''}`);

  if (/sahil/.test(normalized)) {
    return 'Sahil odağı';
  }

  if (/rihtim|iskele/.test(normalized)) {
    return 'Geçiş odağı';
  }

  if (/park|vadi/.test(normalized)) {
    return 'Açık alan odağı';
  }

  if (/cumhuriyet|kent|ozgurluk|demokrasi/.test(normalized)) {
    return 'Kamusal merkez';
  }

  return 'Meydan özeti';
}

function createFallbackSpotlight(meydan) {
  return finalizeSpotlight(meydan, {
    title: trimText(meydan?.isim || 'Meydan Notu', 26),
    summary: buildDeterministicSummary(meydan),
    badge: buildDeterministicBadge(meydan),
    searchUrl: buildSearchUrl(meydan),
  });
}

async function generateDeepSeekSpotlight(meydan, signal) {
  const exactName = String(meydan?.isim || '').trim();
  const fullName = String(meydan?.tamAd || '').trim();

  const payload = {
    model: 'deepseek-chat',
    temperature: 0.2,
    max_tokens: 220,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Sen mobil arayuz icin kisa kart metni yazan bir asistansin. Sadece JSON don. Format: {"title":"...","summary":"...","badge":"..."}. title en fazla 26 karakter, summary en fazla 140 karakter, badge en fazla 22 karakter olsun. SADECE verilen meydan adina odaklan. Baska meydan, mahalle, belde, semt, ilce veya tarihsel yer adi uydurma. Emin degilsen genel ve temkinli yaz. Hava durumu veya anlik meteoroloji bilgisinden hic bahsetme. Her meydan icin farkli aci yakala; tum kartlarda ayni kalibi tekrar etme. Ozette tek bir somut baglam vurgusu kullan: baglanti noktasi, sahil, yaya akisi, kamusal merkez, acik alan gibi. Asla "bolgenin canli bir bulusma noktasi" benzeri jenerik kaliplari tekrar etme.',
      },
      {
        role: 'user',
        content: `Exact meydan adı: ${exactName || 'Bilinmiyor'}\nTam meydan adı: ${fullName || 'Yok'}\nBu kart için sadece bu meydanı anlatan, yanlış yere sapmayan, kısa bir özet üret. Başlıkta ve özette exact meydan adından farklı yeni bir yer adı kullanma. Ozeti onceki meydan kartlarindan ayristiracak sekilde yaz; mumkunse tam ad içindeki bir baglami kullan.`,
      },
    ],
  };

  const response = await fetch(DEEPSEEK_PROXY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider: 'deepseek', payload }),
    signal,
  });

  if (!response.ok) {
    throw new Error('DeepSeek spotlight istegi basarisiz oldu.');
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || data?.data?.choices?.[0]?.message?.content || '';
  const jsonMatch = String(content).match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('DeepSeek spotlight JSON donmedi.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: trimText(parsed?.title || exactName || 'Meydan Notu', 26),
    summary: trimText(parsed?.summary || '', 140),
    badge: trimText(parsed?.badge || 'Google’da incele', 22),
    searchUrl: buildSearchUrl(meydan),
  };
}

export async function fetchMeydanSpotlight({ meydan, signal }) {
  const localReadingNote = getMeydanReadingNote(meydan);
  if (localReadingNote) {
    return {
      title: trimText(localReadingNote.title || meydan?.isim || 'Meydan Notu', 26),
      summary: trimText(localReadingNote.summary || '', 140),
      badge: trimText(localReadingNote.badge || 'Detayli oku', 22),
      searchUrl: localReadingNote.readPath,
      readPath: localReadingNote.readPath,
    };
  }

  try {
    const spotlight = await generateDeepSeekSpotlight(meydan, signal);
    if (!spotlight?.summary) {
      return createFallbackSpotlight(meydan);
    }
    return finalizeSpotlight(meydan, spotlight);
  } catch {
    return createFallbackSpotlight(meydan);
  }
}
