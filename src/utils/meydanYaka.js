const ANADOLU_SLUGS = new Set([
  'adalar',
  'atasehir',
  'beykoz',
  'cekmekoy',
  'kadikoy',
  'kartal',
  'maltepe',
  'pendik',
  'sancaktepe',
  'sile',
  'sultanbeyli',
  'tuzla',
  'umraniye',
  'uskudar',
]);

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

/**
 * Returns 'anadolu' or 'avrupa' based on the meydan object or text.
 */
export function getMeydanYaka(meydan) {
  if (!meydan) return 'avrupa';

  if (typeof meydan === 'string') {
    const norm = normalizeKey(meydan);
    if (norm.includes('anadolu')) return 'anadolu';
    if (norm.includes('avrupa')) return 'avrupa';
    for (const slug of ANADOLU_SLUGS) {
      if (norm.includes(slug)) return 'anadolu';
    }
    return 'avrupa';
  }

  if (meydan.yaka) {
    const rawYaka = normalizeKey(meydan.yaka);
    if (rawYaka.includes('anadolu')) return 'anadolu';
    if (rawYaka.includes('avrupa')) return 'avrupa';
  }

  const ilceNorm = normalizeKey(meydan.ilce);
  const idNorm = normalizeKey(meydan.id);
  const isimNorm = normalizeKey(meydan.isim || meydan.name || meydan.tamAd);

  for (const slug of ANADOLU_SLUGS) {
    if (idNorm.includes(slug) || ilceNorm.includes(slug) || isimNorm.includes(slug)) {
      return 'anadolu';
    }
  }

  return 'avrupa';
}

export function getYakaLabel(yaka) {
  return yaka === 'anadolu' ? 'Anadolu Yakası' : 'Avrupa Yakası';
}
