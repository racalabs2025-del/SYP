/**
 * src/utils/privacySafeApplication.js
 *
 * Central Privacy Allowlist and Sanitization Boundary for SYP.
 * PII Principle: ALLOWLIST > BLOCKLIST.
 *
 * Operational fields for executive decision support, staffing, and SLA tracking are preserved.
 * All citizen personal data (name, phone, TCKN, email, address, vehicle plate, raw complaint text) is dropped at the boundary.
 */

export const ALLOWED_APPLICATION_FIELDS = [
  'docId',
  'basvuruNo',
  'tarih',
  'taahhutTarihi',
  'ilce',
  'mahalle',
  'meydanId',
  'konu',
  'altKonu',
  'durum',
  'altDurum',
  'onemDerecesi',
  'birim',
  'personelAdi',
  'personelKey',
  'yaka',
  'isShared',
  'sourcePersonnel',
  'agingDays',
  'slaBreached',
  'dataQuality',
];

export const FORBIDDEN_CITIZEN_FIELDS = [
  'aciklama',
  'ozet',
  'basvuruSahibi',
  'vatandas',
  'telefon',
  'cepTelefonu',
  'email',
  'eposta',
  'tckn',
  'tcKimlikNo',
  'adres',
  'acikAdres',
  'kapiNo',
  'daireNo',
  'plaka',
  'aracPlakasi',
  'fotograf',
  'gorsel',
  'sesKaydi',
];

/**
 * Sanitizes an incoming raw application record to strictly allowlisted operational fields.
 * Citizen PII fields and raw complaint text are strictly dropped.
 */
export function toPrivacySafeApplication(rawRecord) {
  if (!rawRecord || typeof rawRecord !== 'object') {
    return null;
  }

  const safeRecord = {};

  for (const field of ALLOWED_APPLICATION_FIELDS) {
    if (field in rawRecord && rawRecord[field] !== undefined) {
      safeRecord[field] = rawRecord[field];
    }
  }

  return safeRecord;
}

/**
 * Validates that an object contains zero forbidden citizen PII fields.
 */
export function validateNoCitizenPII(record) {
  if (!record || typeof record !== 'object') return true;

  for (const key of Object.keys(record)) {
    if (FORBIDDEN_CITIZEN_FIELDS.includes(key)) {
      return false;
    }
  }

  return true;
}
