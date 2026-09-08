import { ALL_CANONICAL_MEYDANLAR } from '../data/canonicalMeydanData.js';

export const INVALID_TOKENS = new Set([
  'ht',
  'h t',
  'calistay',
  'calistay meydani',
  'izinli',
  'izin',
  'rapor',
  'raporlu',
  'off',
  'diger',
  'diger meydan',
  'diger meydani',
  'digerleri',
  'diger gorevler',
  'diger alanlar',
  'ofis',
  'merkez',
  'saha',
  'saha destek',
  'mobil ekip',
  'egitim',
  'toplanti',
  'idari',
  'belirsiz',
  'tanimsiz',
  'bos',
  'yok',
  'gorevli',
  'gorev',
  'babalik-i',
  'babalik izni',
  'evlilik izni',
  'olum izni',
  'mazeret izni',
  '-',
  '--',
  '---',
]);

function normalizeText(value) {
  return String(value || '')
    .toLowerCase('tr-TR')
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

// ─── CANONICAL LOOKUP MAPS ──────────────────────────────────────────────────
const CANONICAL_BY_ID = new Map();
const CANONICAL_BY_NAME = new Map();
const CANONICAL_BY_NORM_NAME = new Map();

ALL_CANONICAL_MEYDANLAR.forEach((m) => {
  CANONICAL_BY_ID.set(m.id.toLowerCase(), m);
  CANONICAL_BY_NAME.set(m.name.toLowerCase('tr-TR'), m);
  CANONICAL_BY_NORM_NAME.set(normalizeText(m.name), m);
  CANONICAL_BY_NORM_NAME.set(normalizeText(m.id), m);
});

// Explicit aliases for old district slugs and variations
const ALIAS_MAP = {
  // Shared/Special Squares (89-95)
  'kasimpasa': 'kasimpasa-kizilay-meydani',
  'kasimpasa-kizilay': 'kasimpasa-kizilay-meydani',
  'kasimpasa kizilay': 'kasimpasa-kizilay-meydani',
  'sultangazi': 'sultangazi-meydani',
  'sultangazi meydani': 'sultangazi-meydani',
  'kucukcekmece': 'kucukcekmece-meydani',
  'kucukcekmece meydani': 'kucukcekmece-meydani',
  'arnavutkoy-cumhuriyet': 'arnavutkoy-cumhuriyet-meydani',
  'arnavutkoy cumhuriyet': 'arnavutkoy-cumhuriyet-meydani',
  'basaksehir-kent': 'basaksehir-kent-meydani',
  'basaksehir kent': 'basaksehir-kent-meydani',
  'sancaktepe': 'sancaktepe-meydani',
  'sancaktepe meydani': 'sancaktepe-meydani',
  'beyazit': 'beyazit-meydani',
  'beyazit meydani': 'beyazit-meydani',

  // Other District and Square Aliases
  'taksim': 'taksim-meydani',
  'taksim meydani': 'taksim-meydani',
  'beyoglu': 'taksim-meydani',
  'kadikoy': 'kadikoy-meydani',
  'kadikoy meydani': 'kadikoy-meydani',
  'bostanci': 'kadikoy-bostanci-meydani',
  'kadikoy-bostanci': 'kadikoy-bostanci-meydani',
  'kozyatagi': 'kozyatagi-meydani',
  'suadiye': 'kadikoy-suadiye-sahil-meydani',
  'yogurtcu': 'yogurtcu-parki-meydani',
  'kalamis': 'kalamis-parki-meydani',
  'fenerbahce': 'fenerbahce-parki-meydani',
  'caddebostan': 'caddebostan-sahili-meydani',
  'mimar-sinan': 'mimar-sinan-meydani',
  'mimar sinan': 'mimar-sinan-meydani',
  'uskudar': 'mimar-sinan-meydani',
  'uskudar mimar sinan': 'mimar-sinan-meydani',
  'salacak': 'salacak-meydani',
  'pasalimani': 'pasalimani-meydani',
  'oncesmeler': 'beykoz-oncesmeler-meydani',
  'pasabahce': 'pasabahce-meydani',
  'cubuklu': 'cubuklu-kent-meydani',
  'kanlica': 'kanlica-meydani',
  'beykoz': 'beykoz-oncesmeler-meydani',
  'agva': 'agva-meydani',
  'sile': 'terminal-meydani',
  'terminal': 'terminal-meydani',
  'neyzen-tevfik': 'kartal-neyzen-tevfik-meydani',
  'kartal': 'kartal-neyzen-tevfik-meydani',
  'savarona': 'kartal-sahil-savarona-meydani',
  'adalet': 'maltepe-adalet-meydani',
  'bakireler': 'maltepe-bakireler-aniti-meydani',
  'maltepe': 'maltepe-cumhuriyet-meydani',
  'maltepe cumhuriyet': 'maltepe-cumhuriyet-meydani',
  'dudullu': 'umraniye-dudullu-meydani',
  'cekmekoy': 'cekmekoy-meydani',
  'sultanbeyli': 'sultanbeyli-meydani',
  'pendik': 'pendik-meydani',
  'pendik sahil': 'pendik-sahil-meydani',
  'kaynarca': 'kaynarca-sahil-parki',
  'tahsin-arcan': 'dr-tahsin-arcan-toren-alaniparki',
  'hayrettin-karaca': 'toprak-dede-hayrettin-karaca-parki-meydani',
  'tuzla': 'tuzla-meydani',
  'tahaffuzhane': 'tahaffuzhane-caddesi-meydani',
  'yasam-vadisi': 'tuzla-yasam-vadisi-1etap-1-kisim',
  'umraniye': 'umraniye-15-temmuz-sehitler-meydani',
  'aksaray': 'fatih-aksaray-meydani',
  'fatih-aksaray': 'fatih-aksaray-meydani',
  'eminonu': 'fatih-eminonu-meydani',
  'fatih-eminonu': 'fatih-eminonu-meydani',
  'sultanahmet': 'sultanahmet-meydani',
  'ayasofya': 'ayasofya-meydani',
  'cemberlitas': 'cemberlitas-meydani',
  'fatih': 'fatih-aksaray-meydani',
  'piyalepasa': 'beyoglu-piyalepasa-meydani',
  'karakoy': 'beyoglu-karakoy-meydani',
  'kabatas': 'beyoglu-kabatas-meydani',
  'tophane': 'tophane-meydani',
  'sishane': 'sishane-meydani',
  'barbaros': 'besiktas-barbaros-meydani',
  'besiktas': 'besiktas-barbaros-meydani',
  'ortakoy': 'ortakoy-meydani',
  'mecidiyekoy': 'mecidiyekoy-meydani',
  'halaskar': 'halaskar-genclik-ve-yasam-merkezi-meydani',
  'ugur-mumcu': 'sisli-ugur-mumcu-meydani',
  'cami-onu': 'sisli-cami-onu-meydani',
  'sisli': 'mecidiyekoy-meydani',
  'caglayan': 'caglayan-meydani',
  'nurtepe': 'kagithane-nurtepe-metro-duragi',
  'kagithane': 'kagithane-metro-duragi-meydani',
  'ozgurluk': 'bakirkoy-ozgurluk-meydani',
  'bakirkoy': 'bakirkoy-ozgurluk-meydani',
  'sirinevler': 'bahcelievler-sirinevler-meydani',
  'bahcelievler': 'bahcelievler-sirinevler-meydani',
  'cesur-parki': 'sehit-yarbay-cesur-parki-meydani',
  'ebubekir': 'bagcilar-ebubekir-meydani',
  'bagcilar': 'bagcilar-meydani',
  'esenler': 'esenler-meydani',
  'eyupsultan': 'eyupsultan-meydani',
  'pierre-loti': 'pierre-loti-meydani',
  'gaziosmanpasa': 'gaziosmanpasa-cumhuriyet-meydani',
  'kartaltepe': 'bayrampasa-kartaltepe-meydani',
  'bayrampasa': 'bayrampasa-kartaltepe-meydani',
  'albatros': 'buyukcekmece-albatros-sahil-meydani',
  'buyukcekmece': 'buyukcekmece-albatros-sahil-meydani',
  'catalca': 'catalca-meydani',
  'seymen': 'seymen-mahallesi-meydani',
  'silivri': 'seymen-mahallesi-meydani',
  '100-yil': '100-yil-meydani-beylikduzu-e5-meydani',
  'beylikduzu': '100-yil-meydani-beylikduzu-e5-meydani',
  'esenyurt': 'esenyurt-meydani',
  'yasar-kemal': 'esenyurt-yasar-kemal-meydani',
  'fevzi-cakmak': 'kucukcekmece-fevzi-cakmak-meydani',
  'cennet': 'kucukcekmece-cennet-meydani',
  'avcilar': 'avcilar-meydani',
  'yesil-vadi': 'yesil-vadi-caddesi-saat-kulesi-ve-cevresi',
  'metrokent': 'metrokent-metro-istasyonu-meydani',
  'basaksehir': 'basaksehir-kent-meydani',
  'arnavutkoy': 'arnavutkoy-15-temmuz-demokrasi-ve-sehitler-meydani',
  'cirpici': 'zeytinburnu-cirpici-meydani',
  'zeytinburnu': 'zeytinburnu-cirpici-meydani',
  'kasim-sokak': 'gungoren-kasim-sokak-meydani',
  'gungoren': 'gungoren-kasim-sokak-meydani',
  'adalar': 'adalar-buyukada-meydani',
  'buyukada': 'adalar-buyukada-meydani',
};

/**
 * Normalizes any meydan identifier, name, or raw text input directly
 * to one of the 95 official Canonical Squares.
 */
export function normalizeMeydanInput(input) {
  const rawMeydanId = typeof input === 'string' ? input : (input?.meydanId || '');
  const rawKisaAd = typeof input === 'object' ? (input?.kisaAd || '') : '';
  const rawTamAd = typeof input === 'object' ? (input?.tamAd || '') : '';
  const rawIsim = typeof input === 'object' ? (input?.isim || '') : '';

  const candidates = [rawMeydanId, rawTamAd, rawKisaAd, rawIsim]
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  if (!candidates.length) {
    return { valid: false, id: '', isim: '', tamAd: '' };
  }

  // 1. Check for invalid non-meydan tokens (e.g. HT, İzinli, Diğer)
  for (const c of candidates) {
    const norm = normalizeText(c);
    if (INVALID_TOKENS.has(norm) || norm.startsWith('izin') || norm.startsWith('rapor') || norm === 'ht') {
      return { valid: false, id: '', isim: '', tamAd: '' };
    }
  }

  // 2. Direct ID check
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (CANONICAL_BY_ID.has(lower)) {
      const match = CANONICAL_BY_ID.get(lower);
      return {
        valid: true,
        id: match.id,
        isim: match.name,
        tamAd: match.name,
        district: match.district,
        yaka: match.yaka,
        kategori: match.kategori,
        yonetimNotu: match.yonetimNotu,
        confidence: 'high',
      };
    }
  }

  // 3. Exact or normalized name check
  for (const c of candidates) {
    const norm = normalizeText(c);
    if (CANONICAL_BY_NORM_NAME.has(norm)) {
      const match = CANONICAL_BY_NORM_NAME.get(norm);
      return {
        valid: true,
        id: match.id,
        isim: match.name,
        tamAd: match.name,
        district: match.district,
        yaka: match.yaka,
        kategori: match.kategori,
        yonetimNotu: match.yonetimNotu,
        confidence: 'high',
      };
    }
  }

  // 4. Check explicit aliases map
  for (const c of candidates) {
    const norm = normalizeText(c).replace(/\s+/g, '-');
    const normSpaced = normalizeText(c);
    const aliasTargetId = ALIAS_MAP[norm] || ALIAS_MAP[normSpaced];
    if (aliasTargetId && CANONICAL_BY_ID.has(aliasTargetId)) {
      const match = CANONICAL_BY_ID.get(aliasTargetId);
      return {
        valid: true,
        id: match.id,
        isim: match.name,
        tamAd: match.name,
        district: match.district,
        yaka: match.yaka,
        kategori: match.kategori,
        yonetimNotu: match.yonetimNotu,
        confidence: 'high',
      };
    }
  }

  // 5. Partial token match against canonical squares
  for (const c of candidates) {
    const norm = normalizeText(c);
    if (norm.length < 3) continue;

    // Try to find if any canonical square name contains or is contained in this candidate
    for (const m of ALL_CANONICAL_MEYDANLAR) {
      const mNorm = normalizeText(m.name);
      const mIdNorm = normalizeText(m.id);
      if (norm.includes(mNorm) || mNorm.includes(norm) || norm.includes(mIdNorm)) {
        return {
          valid: true,
          id: m.id,
          isim: m.name,
          tamAd: m.name,
          district: m.district,
          yaka: m.yaka,
          kategori: m.kategori,
          yonetimNotu: m.yonetimNotu,
          confidence: 'medium',
        };
      }
    }
  }

  return { valid: false, id: '', isim: '', tamAd: '' };
}
