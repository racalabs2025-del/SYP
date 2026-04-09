const DISTRICT_DISPLAY_TR = {
  adalar: 'Adalar',
  arnavutkoy: 'Arnavutköy',
  atasehir: 'Ataşehir',
  avcilar: 'Avcılar',
  bagcilar: 'Bağcılar',
  bahcelievler: 'Bahçelievler',
  bakirkoy: 'Bakırköy',
  basaksehir: 'Başakşehir',
  bayrampasa: 'Bayrampaşa',
  besiktas: 'Beşiktaş',
  beykoz: 'Beykoz',
  beylikduzu: 'Beylikdüzü',
  beyoglu: 'Beyoğlu',
  buyukcekmece: 'Büyükçekmece',
  catalca: 'Çatalca',
  cekmekoy: 'Çekmeköy',
  esenler: 'Esenler',
  esenyurt: 'Esenyurt',
  eyupsultan: 'Eyüpsultan',
  fatih: 'Fatih',
  gaziosmanpasa: 'Gaziosmanpaşa',
  gungoren: 'Güngören',
  kadikoy: 'Kadıköy',
  kagithane: 'Kağıthane',
  kartal: 'Kartal',
  kucukcekmece: 'Küçükçekmece',
  maltepe: 'Maltepe',
  pendik: 'Pendik',
  sancaktepe: 'Sancaktepe',
  sariyer: 'Sarıyer',
  sile: 'Şile',
  silivri: 'Silivri',
  sisli: 'Şişli',
  sultanbeyli: 'Sultanbeyli',
  sultangazi: 'Sultangazi',
  sultanahmet: 'Sultanahmet',
  tuzla: 'Tuzla',
  umraniye: 'Ümraniye',
  uskudar: 'Üsküdar',
  zeytinburnu: 'Zeytinburnu',
};

const DISTRICT_FULL_NAME_TR = {
  adalar: 'Büyükada Saat Meydanı',
  arnavutkoy: 'Arnavutköy Meydanı - Şehir Parkı Çevresi',
  avcilar: 'Avcılar Marmara Caddesi Meydanı',
  bagcilar: '15 Temmuz Demokrasi Meydanı (Bağcılar)',
  basaksehir: 'Başakşehir Sular Vadisi Meydanı',
  bahcelievler: 'Şirinevler Meydanı - Şehit Yarbay Cesur Parkı',
  bakirkoy: 'Bakırköy Özgürlük Meydanı',
  bayrampasa: 'Bayrampaşa Meydanı - İsmet Paşa Caddesi Çevresi',
  besiktas: 'Beşiktaş Meydanı (İskele Meydanı)',
  beykoz: 'Beykoz Meydanı (Sahil Meydanı)',
  beylikduzu: 'Beylikdüzü Yaşam Vadisi Cumhuriyet Meydanı',
  beyoglu: 'Taksim Meydanı',
  buyukcekmece: 'Büyükçekmece Kent Meydanı',
  catalca: 'Çatalca Cumhuriyet Meydanı',
  cekmekoy: 'Çekmeköy Meydanı - Belediye Önü',
  esenler: 'Esenler Dörtyol Meydanı',
  esenyurt: 'Esenyurt Cumhuriyet Meydanı',
  eyupsultan: 'Eyüpsultan Meydanı',
  fatih: 'Fatih Saraçhane Meydanı',
  gaziosmanpasa: 'Gaziosmanpaşa Meydanı',
  gungoren: 'Güngören Meydanı',
  kadikoy: 'Kadıköy Rıhtım Meydanı',
  kagithane: 'Çağlayan Meydanı',
  kartal: 'Kartal Meydanı',
  kucukcekmece: 'Küçükçekmece Meydanı',
  maltepe: 'Maltepe Sahil Etkinlik Meydanı',
  pendik: 'Pendik Sahil Meydanı',
  sancaktepe: 'Sancaktepe Meydanı',
  sariyer: 'Sarıyer Merkez Meydanı',
  sile: 'Şile Meydanı',
  sisli: 'Şişli Mecidiyeköy Meydanı',
  sultanahmet: 'Sultanahmet Meydanı',
  sultanbeyli: 'Sultanbeyli Kent Meydanı',
  tuzla: 'Tuzla Sahil Tören Alanı',
  umraniye: 'Ümraniye 15 Temmuz Şehitler Meydanı',
  uskudar: 'Üsküdar Mimar Sinan Meydanı',
  zeytinburnu: 'Zeytinburnu 15 Temmuz Meydanı',
};


const INVALID_TOKENS = new Set([
  'ht',
  'h t',
  'calistay',
  'calistay meydani',
  'izinli',
  'izin',
  'rapor',
  'off',
  '-',
]);

const LOCATION_STOPWORDS = new Set([
  'meydan',
  'meydani',
  'meydani',
  'mahalle',
  'mahallesi',
  'cadde',
  'caddesi',
  'sokak',
  'sokagi',
  'on',
  'onu',
  've',
]);

const LOCATION_ALIAS_TO_DISTRICT = [
  {
    district: 'beyoglu',
    keywords: ['taksim', 'sishane', 'kabatas', 'tophane', 'karakoy'],
  },
  {
    district: 'besiktas',
    keywords: ['ortakoy'],
  },
  {
    district: 'kadikoy',
    keywords: ['kozyatagi', 'bostanci', 'suadiye', 'caddebostan', 'goztepe', 'fikirtepe', 'yogurtcu', 'fenerbahce', 'kalamis'],
  },
  {
    district: 'umraniye',
    keywords: ['dudullu', 'namik kemal', 'ataturk mahallesi umraniye'],
  },
  {
    district: 'basaksehir',
    keywords: ['metrokent', 'yesil vadi'],
  },
  {
    district: 'kagithane',
    keywords: ['caglayan'],
  },
  {
    district: 'sile',
    keywords: ['agva'],
  },
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTitleCase(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1))
    .join(' ');
}

function createFallbackFromText(text) {
  const normalized = normalizeText(text)
    .replace(/\b(istanbul|ibb)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized || INVALID_TOKENS.has(normalized)) {
    return null;
  }

  const tokens = normalized
    .split(/[\s-]+/)
    .filter((token) => token && !LOCATION_STOPWORDS.has(token));

  if (!tokens.length) {
    return null;
  }

  const core = tokens.slice(0, 2).join(' ').trim();
  if (core.length < 3) {
    return null;
  }

  const id = core.replace(/\s+/g, '-');
  return {
    valid: true,
    id,
    isim: `${toTitleCase(core)} Meydanı`,
    tamAd: `${toTitleCase(core)} Meydanı`,
  };
}

function findDistrictSlug(text) {
  const normalized = normalizeText(text);

  for (const district of Object.keys(DISTRICT_DISPLAY_TR)) {
    const districtWithSpace = district.replace(/-/g, ' ');
    if (normalized.includes(districtWithSpace)) {
      return district;
    }
  }

  return '';
}

function findAliasDistrictSlug(text) {
  const normalized = normalizeText(text);

  for (const rule of LOCATION_ALIAS_TO_DISTRICT) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.district;
    }
  }

  return '';
}

function shouldPreferExplicitTamAd(explicitTamAd, shortName, districtName) {
  const normalizedExplicit = normalizeText(explicitTamAd);
  const normalizedShort = normalizeText(shortName);
  const normalizedDistrict = normalizeText(districtName);

  if (!normalizedExplicit) {
    return false;
  }

  // Explicit full names like "Taksim Meydani - ..." should win,
  // but short/generic labels should fall back to canonical full names.
  if (normalizedExplicit === normalizedShort || normalizedExplicit === normalizedDistrict) {
    return false;
  }

  if (normalizedExplicit === `${normalizedDistrict} meydani`) {
    return false;
  }

  return true;
}

export function normalizeMeydanInput(input) {
  const rawMeydanId = input?.meydanId || '';
  const rawKisaAd = input?.kisaAd || '';
  const rawTamAd = input?.tamAd || '';
  const rawIsim = input?.isim || '';
  const explicitTamAd = String(rawTamAd || '').trim();
  const hasExplicitTamAd = Boolean(explicitTamAd) && !INVALID_TOKENS.has(normalizeText(explicitTamAd));
  const sourceText = [rawTamAd, rawKisaAd, rawIsim, rawMeydanId].find((item) => String(item || '').trim()) || '';

  const normalizedSource = normalizeText(sourceText);
  if (!normalizedSource || INVALID_TOKENS.has(normalizedSource)) {
    return { valid: false, id: '', isim: '', tamAd: '' };
  }

  const districtSlug = findDistrictSlug(sourceText);
  const aliasDistrictSlug = districtSlug || findAliasDistrictSlug(sourceText);
  if (aliasDistrictSlug) {
    const districtName = DISTRICT_DISPLAY_TR[aliasDistrictSlug];
    const shortName = `${districtName} Meydanı`;
    const canonicalFullName = DISTRICT_FULL_NAME_TR[aliasDistrictSlug] || shortName;
    const useExplicit = hasExplicitTamAd && shouldPreferExplicitTamAd(explicitTamAd, shortName, districtName);

    return {
      valid: true,
      id: aliasDistrictSlug,
      isim: shortName,
      tamAd: useExplicit ? explicitTamAd : canonicalFullName,
      confidence: districtSlug ? 'high' : 'medium',
    };
  }

  const fallback = createFallbackFromText(sourceText);
  if (fallback) {
    const canonicalFullName = DISTRICT_FULL_NAME_TR[fallback.id] || fallback.tamAd;
    const hasNonShortExplicit = hasExplicitTamAd
      && normalizeText(explicitTamAd) !== normalizeText(fallback.tamAd)
      && normalizeText(explicitTamAd) !== normalizeText(fallback.isim);

    return {
      ...fallback,
      confidence: 'low',
      tamAd: hasNonShortExplicit ? explicitTamAd : canonicalFullName,
    };
  }

  return { valid: false, id: '', isim: '', tamAd: '' };
}
