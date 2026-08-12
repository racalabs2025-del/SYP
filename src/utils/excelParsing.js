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

function parseExcelDateValue(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return '';
  }

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    // Excel serial date (1900-based, allowing fractional days).
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + (Math.floor(rawValue) * 24 * 60 * 60 * 1000));
    if (!Number.isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      // Reject serials that produce unrealistic years — prevents day-count or
      // row-index numbers (2, 3, 4 …) from being mis-parsed as 1900 dates.
      if (year < 2000 || year > 2040) return '';
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  const text = String(rawValue).trim();
  if (!text) {
    return '';
  }

  const ymdMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${String(Number(year)).padStart(4, '0')}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
  }

  const dmyMatch = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${String(Number(year)).padStart(4, '0')}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
  }

  return '';
}

function normalizePersonelName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getDayDiffInclusive(fromDateKey, toDateKey) {
  if (!fromDateKey || !toDateKey) {
    return 0;
  }

  const fromDate = new Date(`${fromDateKey}T00:00:00`);
  const toDate = new Date(`${toDateKey}T00:00:00`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return 0;
  }

  const diff = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

function looksLikePersonName(value) {
  const text = String(value || '').trim();
  if (!text) {
    return false;
  }

  if (text.length < 4 || text.length > 60) {
    return false;
  }

  if (/^\d+$/.test(text)) {
    return false;
  }

  if (/^[\d./-]+$/.test(text)) {
    return false;
  }

  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) {
    return false;
  }

  return /[a-zA-ZığüşöçİĞÜŞÖÇ]/.test(text);
}

function pickLikelyPersonelName(row = {}) {
  const entries = Object.entries(row || {});

  const preferredByKey = entries.find(([key, value]) => {
    const normalizedKey = normalizeHeaderText(key);
    if (!normalizedKey) {
      return false;
    }

    if (normalizedKey.includes('personel') || normalizedKey.includes('adsoyad') || normalizedKey.includes('adisoyadi') || normalizedKey.includes('isimsoyisim')) {
      return looksLikePersonName(value);
    }

    return false;
  });

  if (preferredByKey) {
    return String(preferredByKey[1] || '').replace(/\s+/g, ' ').trim();
  }

  const fallback = entries.find(([, value]) => looksLikePersonName(value));
  return fallback ? String(fallback[1] || '').replace(/\s+/g, ' ').trim() : '';
}

function pickLikelyDateRange(row = {}) {
  const dateValues = [];

  Object.values(row || {}).forEach((value) => {
    const parsed = parseExcelDateValue(value);
    if (parsed) {
      dateValues.push(parsed);
    }
  });

  if (!dateValues.length) {
    return { from: '', to: '' };
  }

  dateValues.sort((left, right) => left.localeCompare(right, 'tr'));
  return {
    from: dateValues[0],
    to: dateValues[dateValues.length - 1],
  };
}

export function parsePersonelIzinExcelRows(rawRows = []) {
  const personelAliases = ['personeladi', 'personel', 'adisoyadi', 'adsoyad', 'adisoyisim', 'calisan', 'isimsoyisim', 'adisoyadiniz'];
  const izinTuruAliases = ['izinturu', 'izintipi', 'tur', 'izinkodu', 'izinsebebi', 'izin'];
  const baslangicAliases = [
    'baslangictarihi',
    'baslangic',
    'baslangictarih',
    'izininbaslangici',
    'baslangicgunu',
    'isebaslamatarihi',
    'isbaslamatarihi',
    'isebaslama',
    'isbaslama',
    'isebaslangictarihi',
    'isbaslangictarihi',
    'tarih',
  ];
  const bitisAliases = [
    'bitistarihi',
    'bitis',
    'bitistarih',
    'izininbitisi',
    'bitisgunu',
    'donustarihi',
    'isebitistarihi',
    'isbitistarihi',
    'isebitis',
    'isbitis',
  ];
  const gunSayisiAliases = ['izingunsayisi', 'gunsayisi', 'izinsuresi', 'sure', 'toplamgun'];
  const aciklamaAliases = ['aciklama', 'not', 'detay', 'aciklamasi', 'sebep'];

  const parsedRows = [];
  let skippedRows = 0;

  rawRows.forEach((row, rowIndex) => {
    const normalizedRow = buildNormalizedRow(row);

    const personelAdi = normalizePersonelName(
      firstNonEmpty(normalizedRow, ['personeladi', 'personel', 'adisoyadi', 'adsoyad', 'calisan'])
      || pickRowValue(row, personelAliases)
    ) || pickLikelyPersonelName(row);

    const izinTuru = String(
      firstNonEmpty(normalizedRow, ['izinturu', 'izintipi', 'izinsebebi', 'izin'])
      || pickRowValue(row, izinTuruAliases)
      || 'İzin'
    ).trim();

    const rawBaslangic = firstNonEmpty(normalizedRow, ['baslangictarihi', 'baslangic', 'tarih']) || pickRowValue(row, baslangicAliases);
    const rawBitis = firstNonEmpty(normalizedRow, ['bitistarihi', 'bitis']) || pickRowValue(row, bitisAliases);
    const rawGunSayisi = firstNonEmpty(normalizedRow, ['izingunsayisi', 'gunsayisi', 'izinsuresi', 'sure']) || pickRowValue(row, gunSayisiAliases);
    const aciklama = String(
      firstNonEmpty(normalizedRow, ['aciklama', 'not', 'detay', 'sebep'])
      || pickRowValue(row, aciklamaAliases)
    ).trim();

    const likelyDateRange = pickLikelyDateRange(row);
    const baslangicTarihi = parseExcelDateValue(rawBaslangic) || likelyDateRange.from;
    const bitisTarihiFromCell = parseExcelDateValue(rawBitis);

    let gunSayisiFromCell = Number(String(rawGunSayisi || '').replace(',', '.').trim());
    if (!Number.isFinite(gunSayisiFromCell) || gunSayisiFromCell <= 0) {
      gunSayisiFromCell = 0;
    }

    let bitisTarihi = bitisTarihiFromCell || likelyDateRange.to || baslangicTarihi;
    if (!bitisTarihiFromCell && baslangicTarihi && gunSayisiFromCell > 1) {
      const baslangicDate = new Date(`${baslangicTarihi}T00:00:00`);
      baslangicDate.setDate(baslangicDate.getDate() + Math.floor(gunSayisiFromCell) - 1);
      bitisTarihi = `${baslangicDate.getFullYear()}-${String(baslangicDate.getMonth() + 1).padStart(2, '0')}-${String(baslangicDate.getDate()).padStart(2, '0')}`;
    }

    if (!personelAdi || !baslangicTarihi || !bitisTarihi) {
      skippedRows += 1;
      return;
    }

    const gunSayisi = gunSayisiFromCell > 0
      ? Math.max(1, Math.floor(gunSayisiFromCell))
      : Math.max(1, getDayDiffInclusive(baslangicTarihi, bitisTarihi));
    const stableId = toSafeDocId(`${personelAdi}-${baslangicTarihi}-${bitisTarihi}-${izinTuru}`);

    parsedRows.push({
      id: stableId,
      personelAdi,
      izinTuru: izinTuru || 'İzin',
      baslangicTarihi,
      bitisTarihi,
      gunSayisi,
      aciklama,
      rawRowIndex: rowIndex,
    });
  });

  const deduped = new Map();
  parsedRows.forEach((item) => {
    deduped.set(item.id, item);
  });

  return {
    validRows: Array.from(deduped.values()),
    skippedRows,
  };
}
