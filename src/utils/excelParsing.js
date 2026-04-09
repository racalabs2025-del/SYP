function normalizeHeaderText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function toSafeDocId(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '');

  return cleaned || `kronik-${Date.now()}`;
}

export function splitToChunks(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function pickRowValue(row, aliases) {
  const entries = Object.entries(row || {});
  for (const [key, value] of entries) {
    const normalizedKey = normalizeHeaderText(key);
    if (!normalizedKey) {
      continue;
    }

    if (aliases.some((alias) => normalizedKey.includes(alias))) {
      const text = String(value || '').trim();
      if (text) {
        return text;
      }
    }
  }

  return '';
}

function buildNormalizedRow(row) {
  const mapped = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const normalizedKey = normalizeHeaderText(key);
    if (!normalizedKey) {
      return;
    }

    mapped[normalizedKey] = String(value || '').trim();
  });

  return mapped;
}

function firstNonEmpty(obj, keys = []) {
  for (const key of keys) {
    const value = String(obj?.[key] || '').trim();
    if (value) {
      return value;
    }
  }

  return '';
}

export function parseKronikExcelRows(rawRows = []) {
  const basvuruNoAliases = ['basvuruno', 'basvurunumara', 'basvurunumarasi', 'basvuruid', 'ticketno', 'kayitno'];
  const meydanAliases = ['meydanadi', 'meydan', 'lokasyon', 'konum', 'bolge'];
  const aciklamaAliases = [
    'basvuruaciklamasi',
    'aciklama',
    'talepaciklamasi',
    'basvurukonusu',
    'konuaciklamasi',
    'aciklamadetayi',
    'basvuruicerigi',
  ];
  const gelisTarihiAliases = ['basvurugelishtarihi', 'gelistarihi', 'basvurutarihi', 'tarih', 'gelis'];
  const konuBasligiAliases = ['konubasligi', 'konu', 'isbasligi', 'calismabasligi', 'sorunbasligi'];

  const parsedRows = [];
  let skipped = 0;

  rawRows.forEach((row, rowIndex) => {
    const normalizedRow = buildNormalizedRow(row);

    const basvuruNo = firstNonEmpty(normalizedRow, [
      'basvuruno',
      'basvurunumarasi',
      'basvurunumarasi',
      'basvurunumara',
      'basvuruid',
      'ticketno',
      'kayitno',
    ]) || pickRowValue(row, basvuruNoAliases);

    const meydanAdi = firstNonEmpty(normalizedRow, [
      'meydanadi',
      'meydan',
      'lokasyon',
      'konum',
      'bolge',
      'ilce',
    ]) || pickRowValue(row, meydanAliases);

    const basvuruAciklamasi = firstNonEmpty(normalizedRow, [
      'basvuruaciklamasi',
      'aciklama',
      'talepaciklamasi',
      'basvurukonusu',
      'konuaciklamasi',
      'aciklamadetayi',
      'basvuruicerigi',
    ]) || pickRowValue(row, aciklamaAliases);

    const basvuruGelisTarihi = firstNonEmpty(normalizedRow, [
      'basvurugelishtarihi',
      'gelistarihi',
      'basvurutarihi',
      'tarih',
      'gelis',
    ]) || pickRowValue(row, gelisTarihiAliases);

    const konuBasligi = firstNonEmpty(normalizedRow, [
      'konubasligi',
      'konu',
      'isbasligi',
      'calismabasligi',
      'sorunbasligi',
    ]) || pickRowValue(row, konuBasligiAliases);

    if (!basvuruNo || !basvuruAciklamasi) {
      skipped += 1;
      return;
    }

    const detaylar = Object.entries(row || {})
      .filter(([key, value]) => {
        const normalized = normalizeHeaderText(key);
        const hasValue = String(value || '').trim() !== '';

        if (!hasValue) {
          return false;
        }

        const isPrimary = [
          ...basvuruNoAliases,
          ...meydanAliases,
          ...aciklamaAliases,
          ...gelisTarihiAliases,
          ...konuBasligiAliases,
        ].some((alias) => normalized.includes(alias));

        return !isPrimary;
      })
      .map(([label, value]) => ({ label: String(label), value: String(value) }));

    parsedRows.push({
      id: toSafeDocId(basvuruNo),
      basvuruNo,
      meydanAdi: meydanAdi || '-',
      basvuruAciklamasi,
      basvuruGelisTarihi: basvuruGelisTarihi || '-',
      konuBasligi: konuBasligi || '',
      detaylar,
      rawRowIndex: rowIndex,
    });
  });

  const dedupedMap = new Map();
  parsedRows.forEach((item) => {
    dedupedMap.set(item.id, item);
  });

  return {
    validRows: Array.from(dedupedMap.values()),
    skippedRows: skipped,
  };
}
