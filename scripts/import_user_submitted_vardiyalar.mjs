import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../src/shared/firebaseConfig.js';
import { normalizeMeydanInput } from '../src/utils/meydanNormalization.js';

const DRY_RUN = process.argv.includes('--dry-run') && !process.argv.includes('--apply');

// Leave and non-meydan tokens
const LEAVE_MAPPINGS = {
  'HT': 'Hafta Tatili',
  'Yİ': 'Yıllık İzin',
  'YI': 'Yıllık İzin',
  'R': 'Raporlu',
  'RT': 'Resmi Tatil',
  'Mİ': 'Mazeret İzni',
  'MI': 'Mazeret İzni',
  'ÇALIŞTAY': 'Çalıştay',
  'CALISTAY': 'Çalıştay',
  'OFİS': 'Ofis',
  'OFIS': 'Ofis',
};

function detectShiftHours(rawText) {
  const upper = String(rawText || '').toUpperCase();
  if (upper.includes('SABAH')) {
    return '08:30-17:00';
  }
  if (upper.includes('AKŞAM') || upper.includes('AKSAM')) {
    return '11:30-20:00';
  }
  return '10:00-18:30';
}

function parseShiftEntry(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) {
    return null;
  }

  const upper = trimmed.toUpperCase();

  // Check simple leave tokens
  if (LEAVE_MAPPINGS[upper]) {
    return {
      isLeave: true,
      vardiyaTipi: LEAVE_MAPPINGS[upper],
      saatAraligi: '00:00-00:00',
      meydanId: null,
      rawLocation: trimmed,
    };
  }

  const hours = detectShiftHours(trimmed);

  // Normalize meydan
  const normalized = normalizeMeydanInput(trimmed);
  const meydanId = normalized?.id || 'diger';

  return {
    isLeave: false,
    vardiyaTipi: hours === '08:30-17:00' ? 'Sabah' : hours === '11:30-20:00' ? 'Akşam' : 'Tam Gün',
    saatAraligi: hours,
    meydanId: meydanId,
    rawLocation: trimmed,
  };
}

// -------------------------------------------------------------
// 1. DATASET: 24-30 AĞUSTOS 2026 (ANADOLU YAKASI)
// -------------------------------------------------------------
const AGUSTOS_ANADOLU_DATES = [
  '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30'
];

const AGUSTOS_ANADOLU_ROWS = [
  { name: 'HELİN ÖZDEMİR', shifts: ['Yİ', 'Yİ', 'Yİ', 'Yİ', 'Yİ', 'HT', 'HT'] },
  { name: 'OZAN YUSUF AKBAŞ', shifts: ['Yİ', 'Yİ', 'Yİ', 'Yİ', 'Yİ', 'HT', 'HT'] },
  {
    name: 'İSMAİL ÇOBAN',
    shifts: [
      'HT',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'HT'
    ]
  },
  {
    name: 'AYKUT ARMAĞAN',
    shifts: [
      'Ümraniye 15 Temmuz Şehitler Meydanı (TAM GÜN)',
      'Ümraniye 15 Temmuz Şehitler Meydanı (TAM GÜN)',
      'Ümraniye 15 Temmuz Şehitler Meydanı (TAM GÜN)',
      'Ümraniye 15 Temmuz Şehitler Meydanı (TAM GÜN)',
      'HT',
      'HT',
      'Ümraniye 15 Temmuz Şehitler Meydanı (TAM GÜN)'
    ]
  },
  {
    name: 'OKTAY ARSLAN',
    shifts: [
      'HT',
      'Ümraniye Dudullu Meydanı (SABAH)',
      'Ümraniye Dudullu Meydanı (SABAH)',
      'Ümraniye Dudullu Meydanı (SABAH)',
      'Ümraniye 15 Temmuz Şehitler Meydanı (SABAH)',
      'Ümraniye 15 Temmuz Şehitler Meydanı (SABAH)',
      'HT'
    ]
  },
  {
    name: 'UĞUR AKIN',
    shifts: [
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'HT',
      'HT',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)'
    ]
  },
  {
    name: 'ŞABAN ETİRLİ',
    shifts: [
      'HT',
      'Sultanbeyli Meydanı (TAM GÜN)',
      'Sultanbeyli Meydanı (TAM GÜN)',
      'Sultanbeyli Meydanı (TAM GÜN)',
      'Yİ',
      'HT',
      'HT'
    ]
  },
  {
    name: 'BERKAY DEDE',
    shifts: [
      'R',
      'R',
      'R',
      'Çekmeköy Meydanı (TAM GÜN)',
      'HT',
      'HT',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)'
    ]
  },
  { name: 'VEDAT VARLIK', shifts: ['Yİ', 'Yİ', 'Yİ', 'Yİ', 'Yİ', 'HT', 'HT'] },
  {
    name: 'HAKAN HAN',
    shifts: [
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı (TAM GÜN)',
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı (TAM GÜN)',
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı (TAM GÜN)',
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı (TAM GÜN)',
      'HT',
      'HT',
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı (TAM GÜN)'
    ]
  },
  {
    name: 'KEMAL GÖNÜLTAŞ',
    shifts: [
      'Kozyatağı Meydanı (TAM GÜN)',
      'Kadıköy Meydanı (TAM GÜN)',
      'HT',
      'Yoğurtçu Parkı-Fenerbahçe Parkı-Kalamış Parkı Meydanı (TAM GÜN)',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'HT'
    ]
  },
  {
    name: 'KAMİLE ÇELİK',
    shifts: [
      'Pendik Meydanı-Pendik Sahil Meydanı-Toprak Dede Hayrettin Karaca Parkı Meydanı-Dr. Tahsin Arcan Tören Alanı/Parkı-Kaynarca Sahil Parkı (TAM GÜN)',
      'Pendik Meydanı-Pendik Sahil Meydanı-Toprak Dede Hayrettin Karaca Parkı Meydanı-Dr. Tahsin Arcan Tören Alanı/Parkı-Kaynarca Sahil Parkı (TAM GÜN)',
      'Pendik Meydanı-Pendik Sahil Meydanı-Toprak Dede Hayrettin Karaca Parkı Meydanı-Dr. Tahsin Arcan Tören Alanı/Parkı-Kaynarca Sahil Parkı (TAM GÜN)',
      'Pendik Meydanı-Pendik Sahil Meydanı-Toprak Dede Hayrettin Karaca Parkı Meydanı-Dr. Tahsin Arcan Tören Alanı/Parkı-Kaynarca Sahil Parkı (TAM GÜN)',
      'HT',
      'HT',
      'Adalar Büyükada Meydanı (TAM GÜN)'
    ]
  },
  {
    name: 'HAYDAR ÇOBAN',
    shifts: [
      'Tuzla Meydanı-Tahaffuzhane Caddesi Meydanı-Tuzla Yaşam Vadisi 1.Etap 1. Kısım (TAM GÜN)',
      'Tuzla Meydanı-Tahaffuzhane Caddesi Meydanı-Tuzla Yaşam Vadisi 1.Etap 1. Kısım (TAM GÜN)',
      'Tuzla Meydanı-Tahaffuzhane Caddesi Meydanı-Tuzla Yaşam Vadisi 1.Etap 1. Kısım (TAM GÜN)',
      'Tuzla Meydanı-Tahaffuzhane Caddesi Meydanı-Tuzla Yaşam Vadisi 1.Etap 1. Kısım (TAM GÜN)',
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı (TAM GÜN)',
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı (TAM GÜN)',
      'HT'
    ]
  },
  {
    name: 'ENES DURAN',
    shifts: [
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)',
      'HT',
      'HT',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı (TAM GÜN)'
    ]
  },
  {
    name: 'MUSTAFA KAYA',
    shifts: [
      'HT',
      'Beykoz Onçeşmeler Meydanı-Kanlıca Meydanı-Çubuklu Kent Meydanı-Paşabahçe Meydanı (TAM GÜN)',
      'Beykoz Onçeşmeler Meydanı-Kanlıca Meydanı-Çubuklu Kent Meydanı-Paşabahçe Meydanı (TAM GÜN)',
      'Beykoz Onçeşmeler Meydanı-Kanlıca Meydanı-Çubuklu Kent Meydanı-Paşabahçe Meydanı (TAM GÜN)',
      'Beykoz Onçeşmeler Meydanı-Kanlıca Meydanı-Çubuklu Kent Meydanı-Paşabahçe Meydanı (TAM GÜN)',
      'Beykoz Onçeşmeler Meydanı-Kanlıca Meydanı-Çubuklu Kent Meydanı-Paşabahçe Meydanı (TAM GÜN)',
      'HT'
    ]
  },
  {
    name: 'SEZAYİ KARAKOÇ',
    shifts: [
      'HT',
      'Terminal Meydanı (TAM GÜN)',
      'Terminal Meydanı (TAM GÜN)',
      'Terminal Meydanı (TAM GÜN)',
      'Ağva Meydanı (TAM GÜN)',
      'Terminal Meydanı (TAM GÜN)',
      'HT'
    ]
  },
  {
    name: 'TUNCAY ÇATAL',
    shifts: [
      'Kadıköy Bostancı Meydanı- Kadıköy Suadiye Meydanı- Caddebostan Sahil Meydanı (SABAH)',
      'Kadıköy Bostancı Meydanı- Kadıköy Suadiye Meydanı- Caddebostan Sahil Meydanı (SABAH)',
      'Kadıköy Bostancı Meydanı- Kadıköy Suadiye Meydanı- Caddebostan Sahil Meydanı (SABAH)',
      'Kadıköy Bostancı Meydanı- Kadıköy Suadiye Meydanı- Caddebostan Sahil Meydanı (SABAH)',
      'Kadıköy Bostancı Meydanı- Kadıköy Suadiye Meydanı- Caddebostan Sahil Meydanı (SABAH)',
      'HT',
      'HT'
    ]
  },
  {
    name: 'HALİL İBRAHİM BULUT',
    shifts: [
      'Kadıköy Meydanı-Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı-Kadıköy Bostancı Meydanı- Kadıköy Suadiye Sahil Meydanı- Caddesbostan Sahil Meydanı-Kozyatağı Meydanı',
      'Kadıköy Meydanı-Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı-Kadıköy Bostancı Meydanı- Kadıköy Suadiye Sahil Meydanı- Caddesbostan Sahil Meydanı-Kozyatağı Meydanı',
      'Kadıköy Meydanı-Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı-Kadıköy Bostancı Meydanı- Kadıköy Suadiye Sahil Meydanı- Caddesbostan Sahil Meydanı-Kozyatağı Meydanı',
      'Kadıköy Meydanı-Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı-Kadıköy Bostancı Meydanı- Kadıköy Suadiye Sahil Meydanı- Caddesbostan Sahil Meydanı-Kozyatağı Meydanı',
      'Kadıköy Meydanı-Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı-Kadıköy Bostancı Meydanı- Kadıköy Suadiye Sahil Meydanı- Caddesbostan Sahil Meydanı-Kozyatağı Meydanı',
      'HT',
      'HT'
    ]
  },
  {
    name: 'HAKAN BEĞENMİŞ',
    shifts: [
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı-Çekmeköy Meydanı',
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı-Pendik Meydanı-Pendik Sahil Meydanı Toprak Dede Hayrettin Karaca Parkı Meydanı-Dr. Tahsin Arcan Tören Alanı/Parkı-Kaynarca Sahil Parkı',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı',
      'Ümraniye 15 Temmuz Şehitler Meydanı-Ümraniye Dudullu Meydanı-Sultanbeyli Meydanı',
      'Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı-Tuzla Meydanı-Tahaffuzhane Caddesi Meydanı-Tuzla Yaşam Vadisi 1.Etap 1. Kısım',
      'HT',
      'HT'
    ]
  },
  { name: 'BEKİR GÖRMEK', shifts: ['Yİ', 'Yİ', 'Yİ', 'Yİ', 'Yİ', 'HT', 'HT'] },
  {
    name: 'UMUT EMRE',
    shifts: [
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı-Kadıköy Meydanı-Ümraniye 15 Temmuz Şehitler Meydanı',
      'Ümraniye Dudullu Meydanı-Pendik Meydanı-Pendik Sahil Meydanı-Toprak Dede Hayrettin Karaca Parkı Meydanı-Dr. Tahsin Arcan Tören Alanı/Parkı-Kaynarca Sahil Parkı-Kadıköy Bostancı Meydanı-Kadıköy Suadiye Sahil Meydanı- Caddesbostan Sahil Meydanı',
      'OFİS-Ümraniye 15 Temmuz Şehitler Meydanı-Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı-Kartal Neyzen Tevfik Meydanı-Kartal Sahil (Savarona) Meydanı-Tuzla Meydanı-Tahaffuzhane Caddesi Meydanı-Tuzla Yaşam Vadisi 1.Etap 1. Kısım',
      'Üsküdar Mimar Sinan Meydanı-Üsküdar Sahil Meydanı-Üsküdar Salacak Meydanı-Üsküdar Paşalimanı Meydanı-Ümraniye 15 Temmuz Şehitler Meydanı-Beykoz Onçeşmeler Meydanı-Kanlıca Meydanı-Çubuklu Kent Meydanı-Paşabahçe Meydanı',
      'OFİS-Ümraniye 15 Temmuz Şehitler Meydanı-Sultanbeyli Meydanı-Kadıköy Meydanı',
      'HT',
      'HT'
    ]
  },
  {
    name: 'BERAT SEFA İSTANBUL',
    shifts: [
      'HT',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)',
      'Maltepe Cumhuriyet Meydanı-Maltepe Adalet Meydanı-Maltepe Bakireler Anıtı Meydanı (TAM GÜN)'
    ]
  }
];

// -------------------------------------------------------------
// 2. DATASET: 24-30 AĞUSTOS 2026 (AVRUPA YAKASI)
// -------------------------------------------------------------
const AGUSTOS_AVRUPA_DATES = [
  '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30'
];

const AGUSTOS_AVRUPA_ROWS = [
  {
    name: 'HASAN BİLİCİ',
    shifts: [
      'Fatih Aksaray Meydanı',
      'HT',
      'Fatih Aksaray Meydanı',
      'Sarıyer Ayazağa Meydanı-Sarıyer Meydanı-Sarıyer Rumeli Hisarüstü Meydanı-Emirgan Çınaraltı Meydanı-İstinye Meydanı',
      'Fatih Aksaray Meydanı',
      'Fatih Aksaray Meydanı',
      'HT'
    ]
  },
  {
    name: 'HÜSEYİN TÜRKAY',
    shifts: [
      'Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı',
      'Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı',
      'Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı',
      'Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı',
      'HT',
      'HT',
      'Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı'
    ]
  },
  {
    name: 'BURAK ÖZÇELİK',
    shifts: [
      'Bakırköy Özgürlük Meydanı',
      'Gaziosmanpaşa Cumhuriyet Meydanı-Gaziosmanpaşa Meydanı ve Kent Merkezi',
      'Fatih Eminönü Meydanı',
      'Fatih Eminönü Meydanı',
      'HT',
      'HT',
      'Bakırköy Özgürlük Meydanı'
    ]
  },
  {
    name: 'ŞÜKRÜ KİDİL',
    shifts: [
      'HT',
      'Bakırköy Özgürlük Meydanı',
      'Bağcılar Ebubekir Meydanı-Bağcılar Meydanı',
      'Bakırköy Özgürlük Meydanı',
      'Bakırköy Özgürlük Meydanı',
      'Bakırköy Özgürlük Meydanı',
      'HT'
    ]
  },
  {
    name: 'ÇAĞATAY BEYOĞLU',
    shifts: [
      'Taksim Meydanı-Şişhane Meydanı',
      'Fatih Aksaray Meydanı',
      'Beyoğlu Piyalepaşa Meydanı',
      'Fatih Aksaray Meydanı',
      'HT',
      'HT',
      'Fatih Aksaray Meydanı'
    ]
  },
  {
    name: 'İBRAHİM SİREK',
    shifts: [
      'HT',
      'Bayrampaşa Kartaltepe Meydanı',
      'Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı',
      'Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı',
      'Bağcılar Ebubekir Meydanı-Bağcılar Meydanı',
      'Bağcılar Ebubekir Meydanı-Bağcılar Meydanı',
      'HT'
    ]
  },
  {
    name: 'ONUR ARMAĞAN',
    shifts: [
      'HT',
      'Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı',
      'Beşiktaş Barbaros Meydanı-Ortaköy Meydanı',
      'Beşiktaş Barbaros Meydanı-Ortaköy Meydanı',
      'Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı',
      'Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı',
      'HT'
    ]
  },
  {
    name: 'HATİCE ADSAN',
    shifts: [
      'Esenyurt Meydanı-Esenyurt Yaşar Kemal Meydanı',
      'Büyükçekmece Albatros Sahil Meydanı',
      '100. Yıl Meydanı (Beylikdüzü E5 Meydanı)',
      '100. Yıl Meydanı (Beylikdüzü E5 Meydanı)',
      'HT',
      'HT',
      'Büyükçekmece Albatros Sahil Meydanı'
    ]
  },
  { name: 'NİYAZİ BOL', shifts: ['R', 'R', 'R', 'R', 'R', 'R', 'R'] },
  {
    name: 'KADER SALMAN',
    shifts: [
      'HT',
      'Esenyurt Belediye Meydanı',
      'Avcılar Meydanı-Avcılar E-5 Meydanı',
      'Küçükçekmece Fevzi Çakmak Meydanı-Küçükçekmece Cennet Meydanı',
      'Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı',
      'Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı',
      'HT'
    ]
  },
  { name: 'EMİN ERDOĞAN', shifts: ['Yİ', 'Yİ', 'Yİ', 'Yİ', 'Yİ', 'HT', 'HT'] },
  { name: 'ERDEM ARABACI', shifts: ['Yİ', 'Yİ', 'Yİ', 'Yİ', 'Yİ', 'HT', 'HT'] },
  {
    name: 'ERHAN EKİNCİ',
    shifts: [
      'Bağcılar Ebubekir Meydanı-Bağcılar Meydanı',
      'Bağcılar Ebubekir Meydanı-Bağcılar Meydanı',
      'Esenler Meydanı',
      'Bağcılar Ebubekir Meydanı-Bağcılar Meydanı',
      'HT',
      'HT',
      'Bağcılar Ebubekir Meydanı-Bağcılar Meydanı'
    ]
  },
  {
    name: 'ESRA ŞEKER',
    shifts: [
      'Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı',
      'Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı',
      'Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı',
      'Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı',
      'HT',
      'HT',
      'Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı'
    ]
  },
  { name: 'CANER DİŞLİ', shifts: ['Yİ', 'Yİ', 'Yİ', 'Yİ', 'Yİ', 'HT', 'HT'] },
  {
    name: 'KEMAL EVREN DARMAN',
    shifts: [
      'HT',
      'OFİS-Yeşil Vadi Caddesi Saat Kulesi ve Çevresi-Metrokent Metro İstasyonu Meydanı',
      'Bakırköy Özgürlük Meydanı',
      'Yeşil Vadi Caddesi Saat Kulesi ve Çevresi-Metrokent Metro İstasyonu Meydanı',
      'Yeşil Vadi Caddesi Saat Kulesi ve Çevresi-Metrokent Metro İstasyonu Meydanı',
      'Yeşil Vadi Caddesi Saat Kulesi ve Çevresi-Metrokent Metro İstasyonu Meydanı',
      'HT'
    ]
  },
  {
    name: 'BUSE DEMİREL',
    shifts: [
      'Eyüpsultan Meydanı-Pierre Loti Meydanı-Gaziosmanpaşa Cumhuriyet Meydanı-Gaziosmanpaşa Meydanı ve Kent Merkezi-Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı-Çağlayan Meydanı',
      'OFİS-Bakırköy Özgürlük Meydanı-Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı-Zeytinburnu Çırpıcı Meydanı-Güngören Kasım Sokak Meydanı-Yeşil Vadi Caddesi Saat Kulesi ve Çevresi-Metrokent Metro İstasyonu Meydanı-Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı-Gaziosmanpaşa Cumhuriyet Meydanı-Gaziosmanpaşa Meydanı ve Kent Merkezi',
      'Sultanahmet Meydanı-Ayasofya Kebir Camii Meydanı-Çemberlitaş Meydanı-Fatih Eminönü Meydanı-Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı-Gaziosmanpaşa Cumhuriyet Meydanı-Gaziosmanpaşa Meydanı ve Kent Merkezi-Bayrampaşa Kartaltepe Meydanı-Esenler Meydanı',
      'Fatih Eminönü Meydanı-Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı-Gaziosmanpaşa Cumhuriyet Meydanı-Gaziosmanpaşa Meydanı ve Kent Merkezi-Sultanahmet Meydanı-Ayasofya Kebir Camii Meydanı-Çemberlitaş Meydanı-Taksim Meydanı-Şişhane Meydanı-Beyoğlu Karaköy Meydanı-Tophane Plaza Meydanı-Beyoğlu Kabataş Meydanı',
      'OFİS-Eyüpsultan Meydanı-Pierre Loti Meydanı-Gaziosmanpaşa Cumhuriyet Meydanı-Gaziosmanpaşa Meydanı ve Kent Merkezi-Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı-Çağlayan Meydanı',
      'HT',
      'HT'
    ]
  },
  {
    name: 'KAAN DİNÇERLER',
    shifts: [
      'Taksim Meydanı-Şişhane Meydanı-Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı-Fatih Aksaray Meydanı',
      'OFİS-Taksim Meydanı-Şişhane Meydanı-Beyoğlu Piyalepaşa Meydanı-Beşiktaş Barbaros Meydanı-Ortaköy Meydanı',
      'Taksim Meydanı-Şişhane Meydanı-Bağcılar Ebubekir Meydanı-Bağcılar Meydanı-Beyoğlu Karaköy Meydanı-Tophane Plaza Meydanı-Beyoğlu Kabataş Meydanı',
      'Taksim Meydanı-Şişhane Meydanı-Sarıyer Ayazağa Meydanı-Sarıyer Meydanı-Sarıyer Rumeli Hisarüstü Meydanı-Emirgan Çınaraltı Meydanı-İstinye Meydanı',
      'Taksim Meydanı-Şişhane Meydanı-Mecidiyeköy Meydanı-Halaskar Gençlik ve Yaşam Merkezi Meydanı-Şişli Uğur Mumcu Meydanı-Şişli Cami Önü Meydanı',
      'HT',
      'HT'
    ]
  },
  {
    name: 'CANSIN BOYOĞLU',
    shifts: [
      'Esenler Meydanı-Zeytinburnu Çırpıcı Meydanı-Bağcılar Ebubekir Meydanı-Bağcılar Meydanı-Fatih Aksaray Meydanı-Taksim Meydanı-Şişhane Meydanı',
      'Esenler Meydanı-Zeytinburnu Çırpıcı Meydanı-Bakırköy Özgürlük Meydanı-Bahçelievler Şirinevler Meydanı-Şehit Yarbay Cesur Parkı Meydanı-Yeşil Vadi Caddesi Saat Kulesi ve Çevresi-Metrokent Metro İstasyonu Meydanı',
      'OFİS-Zeytinburnu Çırpıcı Meydanı-Sultanahmet Meydanı-Ayasofya Kebir Camii Meydanı-Çemberlitaş Meydanı-Fatih Eminönü Meydanı-Esenler Meydanı-Eyüpsultan Meydanı-Pierre Loti Meydanı-Kağıthane Metro Durağı Meydanı-Kağıthane Nurtepe Metro Durağı',
      'Taksim Meydanı-Şişhane Meydanı-Zeytinburnu Çırpıcı Meydanı-Esenler Meydanı-Bayrampaşa Kartaltepe Meydanı-Gaziosmanpaşa Cumhuriyet Meydanı-Gaziosmanpaşa Meydanı ve Kent Merkezi-Beyoğlu Karaköy Meydanı-Tophane Plaza Meydanı-Beyoğlu Kabataş Meydanı',
      'OFİS-Zeytinburnu Çırpıcı Meydanı-Bakırköy Özgürlük Meydanı-Bahçelievler Şirinevler Meydanı-Esenler Meydanı-Küçükçekmece Fevzi Çakmak Meydanı-Küçükçekmece Cennet Meydanı',
      'HT',
      'HT'
    ]
  }
];

// -------------------------------------------------------------
// 3. DATASET: 20-30 NİSAN 2026 (AVRUPA YAKASI)
// -------------------------------------------------------------
const NISAN_AVRUPA_DATES = [
  '2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24',
  '2026-04-25', '2026-04-26', '2026-04-27', '2026-04-28', '2026-04-29', '2026-04-30'
];

const NISAN_AVRUPA_ROWS = [
  { name: 'HASAN BİLİCİ', shifts: ['HT', 'Fatih Aksaray', 'Fatih Aksaray', 'Fatih Aksaray', 'Fatih Aksaray', 'Fatih Aksaray', 'HT', 'HT', 'Fatih Aksaray', 'Fatih Aksaray', 'Fatih Aksaray'] },
  { name: 'ZEYNEP AYDEMİR', shifts: ['Beyoğlu', 'HT', 'Taksim', 'HT', 'Mecidiyeköy', 'Mecidiyeköy', 'Taksim', 'Beyoğlu', 'HT', 'Şişli Uğur Mumcu', 'HT'] },
  { name: 'HÜSEYİN TÜRKAY', shifts: ['Mecidiyeköy', 'Mecidiyeköy', 'Mecidiyeköy', 'Mecidiyeköy', 'HT', 'HT', 'Mecidiyeköy', 'Mecidiyeköy', 'Mecidiyeköy', 'Mecidiyeköy', 'Mecidiyeköy'] },
  { name: 'BURAK ÖZÇELİK', shifts: ['Eyüpsultan', 'Eyüpsultan', 'Eyüpsultan', 'Eyüpsultan', 'HT', 'HT', 'Eyüpsultan', 'Eyüpsultan', 'Eyüpsultan', 'Çalıştay', 'Eyüpsultan'] },
  { name: 'ŞÜKRÜ KİDİL', shifts: ['HT', 'Bakırköy', 'Bakırköy', 'Bakırköy', 'Bakırköy', 'Bakırköy', 'HT', 'HT', 'Bakırköy', 'Bakırköy', 'Bakırköy'] },
  { name: 'ÇAĞATAY BEYOĞLU', shifts: ['Fatih Aksaray', 'Beyoğlu', 'Ortaköy', 'RT', 'HT', 'HT', 'Fatih Aksaray', 'Fatih Aksaray', 'Ortaköy', 'Çalıştay', 'Ortaköy'] },
  { name: 'İBRAHİM SİREK', shifts: ['HT', 'Gaziosmanpaşa', 'Gaziosmanpaşa', 'RT', 'Gaziosmanpaşa', 'Bayrampaşa', 'HT', 'HT', 'Gaziosmanpaşa', 'Gaziosmanpaşa', 'Bayrampaşa'] },
  { name: 'ONUR ARMAĞAN', shifts: ['HT', 'Beşiktaş', 'Kağıthane', 'RT', 'Bayrampaşa', 'Gaziosmanpaşa', 'HT', 'HT', 'Beşiktaş', 'Kağıthane', 'Beşiktaş'] },
  { name: 'HATİCE ADSAN', shifts: ['100. Yıl', 'Esenyurt', 'Büyükçekmece', '100. Yıl', 'HT', 'HT', '100. Yıl', 'Büyükçekmece', 'Esenyurt', '100. Yıl', 'Avcılar Meydanı'] },
  { name: 'NİYAZİ BOL', shifts: ['Yİ', 'Yİ', 'Yİ', 'RT', 'HT', 'R', 'HT', 'HT', 'Yİ', 'Yİ', 'Yİ'] },
  { name: 'KADER SALMAN', shifts: ['Bakırköy', 'Avcılar Meydanı', 'Esenyurt', 'Bağcılar', 'Avcılar Meydanı', 'HT', 'HT', 'Yİ', 'Yİ', 'Yİ', 'Yİ'] },
  { name: 'EMİN ERDOĞAN', shifts: ['Bağcılar', 'Esenler', 'Esenler', 'Esenler', 'HT', 'HT', 'Bağcılar', 'Bağcılar', 'Bağcılar', 'Bağcılar', 'Bağcılar'] },
  { name: 'ERDEM ARABACI', shifts: ['HT', 'OFİS', 'Fatih Eminönü', 'KEMERBURGAZ', 'Sultanahmet', 'Beyoğlu', 'HT', 'HT', 'Zeytinburnu', 'Beyoğlu', 'OFİS'] },
  { name: 'ERHAN EKİNCİ', shifts: ['HT', 'Bağcılar', 'Bağcılar', 'Bağcılar', 'Bağcılar', 'Bağcılar', 'HT', 'HT', 'Esenler', 'Esenler', 'Esenler'] },
  { name: 'ESRA ŞEKER', shifts: ['Bahçelievler', 'Bahçelievler', 'Bahçelievler', 'Bağcılar', 'HT', 'HT', 'Bahçelievler', 'Bahçelievler', 'OFİS-Bahçelievler', 'Bahçelievler', 'Bahçelievler'] },
  { name: 'CANER DİŞLİ', shifts: ['HT', 'Zeytinburnu', 'Zeytinburnu', 'Bahçelievler', 'Bahçelievler', 'Bahçelievler', 'HT', 'HT', 'Bahçelievler', 'Zeytinburnu', 'Zeytinburnu'] },
  { name: 'FATİH GÜNEŞ', shifts: ['Yeşil Vadi', 'Arnavutköy', 'Arnavutköy', 'RT', 'HT', 'HT', 'Bakırköy', 'Bakırköy', 'Yeşil Vadi', 'Yeşil Vadi', 'Yeşil Vadi'] },
  { name: 'UĞUR AKIN', shifts: ['HT', 'Küçükçekmece', 'Küçükçekmece', 'RT', 'Küçükçekmece', 'Küçükçekmece', 'HT', 'HT', 'Mİ', 'Küçükçekmece', 'Küçükçekmece'] },
  { name: 'KEMAL EVREN DARMAN', shifts: ['HT', 'OFİS', 'Yeşil Vadi', 'RT', 'Yeşil Vadi', 'Yeşil Vadi', 'HT', 'HT', 'Arnavutköy', 'Arnavutköy', 'Arnavutköy'] },
  { name: 'BUSE DEMİREL', shifts: ['Gaziosmanpaşa', 'OFİS-Kağıthane', 'OFİS-Kağıthane', 'KEMERBURGAZ', 'Bakırköy', 'HT', 'HT', 'OFİS-Kağıthane', 'OFİS-Yeşil Vadi', 'Bakırköy', 'OFİS-Yeşil Vadi'] },
  { name: 'KAAN DİNÇERLER', shifts: ['OFİS-100. Yıl', 'OFİS-Taksim', 'OFİS-Taksim', 'RT', 'Yİ', 'HT', 'HT', 'Taksim', 'Taksim', 'OFİS', 'Beyoğlu'] },
  { name: 'CANSIN BOYOĞLU', shifts: ['OFİS-100. Yıl', 'OFİS', 'OFİS-Esenler', 'Bağcılar', 'OFİS-Bağcılar', 'HT', 'HT', 'OFİS', 'OFİS-Taksim', 'Bakırköy', 'OFİS-Yeşil Vadi'] }
];

// -------------------------------------------------------------
// 4. DATASET: 20-30 NİSAN 2026 (ANADOLU YAKASI)
// -------------------------------------------------------------
const NISAN_ANADOLU_DATES = [
  '2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24',
  '2026-04-25', '2026-04-26', '2026-04-27', '2026-04-28', '2026-04-29', '2026-04-30'
];

const NISAN_ANADOLU_ROWS = [
  { name: 'HELİN ÖZDEMİR', shifts: ['HT', 'Üsküdar Mimar Sinan', 'Üsküdar Mimar Sinan', 'Pendik Meydanı (TAM)', 'Üsküdar Mimar Sinan', 'Üsküdar Mimar Sinan', 'HT', 'HT', 'R', 'R', 'Üsküdar Mimar Sinan'] },
  { name: 'OZAN YUSUF AKBAŞ', shifts: ['Üsküdar Mimar Sinan', 'Üsküdar Mimar Sinan', 'Üsküdar Mimar Sinan', 'RT', 'HT', 'HT', 'Üsküdar Mimar Sinan', 'Adalar Büyükada', 'Kadıköy Bostancı', 'Kadıköy Bostancı', 'Yoğurtçu Parkı-'] },
  { name: 'İSMAİL ÇOBAN', shifts: ['HT', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'RT', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'HT', 'HT', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet'] },
  { name: 'AYKUT ARMAĞAN', shifts: ['HT', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'Pendik Meydanı (TAM)', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'HT', 'HT', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz'] },
  { name: 'OKTAY ARSLAN', shifts: ['HT', 'Ümraniye Dudullu', 'Ümraniye Dudullu', 'RT', 'Ümraniye Dudullu', 'Ümraniye Dudullu', 'HT', 'HT', 'Ümraniye Dudullu', 'Ümraniye Dudullu', 'Ümraniye Dudullu'] },
  { name: 'UĞUR AKIN', shifts: ['Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'Pendik Meydanı (TAM)', 'HT', 'HT', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet'] },
  { name: 'AHMET KOCABIYIK', shifts: ['HT', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'RT', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'HT', 'HT', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz'] },
  { name: 'ŞABAN ETİRLİ', shifts: ['HT', 'Sultanbeyli Meydanı', 'Sultanbeyli Meydanı', 'RT', 'Sultanbeyli Meydanı', 'Sultanbeyli Meydanı', 'HT', 'HT', 'Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik'] },
  { name: 'YUSUF GÜNDOĞDU', shifts: ['HT', 'R', 'R', 'RT', 'Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik', 'HT', 'HT', 'Yİ', 'Yİ', 'Kartal Neyzen Tevfik'] },
  { name: 'BERKAY DEDE', shifts: ['Ümraniye 15 Temmuz', 'Beykoz Onçeşmeler', 'Beykoz Onçeşmeler', 'Ümraniye 15 Temmuz', 'HT', 'HT', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'Sultanbeyli Meydanı', 'Sultanbeyli Meydanı', 'Mİ'] },
  { name: 'VEDAT VARLIK', shifts: ['Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik', 'RT', 'HT', 'HT', 'Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik', 'Kartal Neyzen Tevfik'] },
  { name: 'HAKAN HAN', shifts: ['Kadıköy Meydanı', 'Mİ', 'Kadıköy Meydanı', 'Kartal Neyzen Tevfik', 'Kadıköy Meydanı', 'HT', 'HT', 'Kadıköy Meydanı', 'Kadıköy Meydanı', 'Kadıköy Meydanı', 'Kadıköy Meydanı'] },
  { name: 'KEMAL GÖNÜLTAŞ', shifts: ['HT', 'Üsküdar Mimar Sinan', 'Üsküdar Mimar Sinan', 'Kadıköy Meydanı', 'Üsküdar Mimar Sinan', 'Üsküdar Mimar Sinan', 'HT', 'HT', 'Üsküdar Mimar Sinan', 'Üsküdar Mimar Sinan', 'Üsküdar Mimar Sinan'] },
  { name: 'KAMİLE ÇELİK', shifts: ['Pendik Meydanı (TAM)', 'Pendik Meydanı (TAM)', 'Pendik Meydanı (TAM)', 'RT', 'HT', 'HT', 'Pendik Meydanı (TAM)', 'Pendik Meydanı (TAM)', 'Pendik Meydanı (TAM)', 'Pendik Meydanı (TAM)', 'Pendik Meydanı (TAM)'] },
  { name: 'HAYDAR ÇOBAN', shifts: ['HT', 'Tuzla Meydanı', 'Tuzla Meydanı', 'Maltepe Cumhuriyet', 'Tuzla Meydanı', 'Tuzla Meydanı', 'HT', 'HT', 'Tuzla Meydanı', 'Tuzla Meydanı', 'Tuzla Meydanı'] },
  { name: 'ENES DURAN', shifts: ['Yoğurtçu Parkı', 'Yoğurtçu Parkı', 'Kadıköy Bostancı', 'Üsküdar Mimar Sinan', 'HT', 'HT', 'Kadıköy Bostancı', 'Üsküdar Mimar Sinan', 'Beykoz Onçeşmeler', 'Beykoz Onçeşmeler', 'Beykoz Onçeşmeler'] },
  { name: 'MUSTAFA KAYA', shifts: ['Beykoz Onçeşmeler', 'Beykoz Onçeşmeler', 'Beykoz Onçeşmeler', 'RT', 'HT', 'HT', 'Beykoz Onçeşmeler', 'Beykoz Onçeşmeler', 'Beykoz Onçeşmeler', 'Beykoz Onçeşmeler', 'Beykoz Onçeşmeler'] },
  { name: 'SEZAYİ KARAKOÇ', shifts: ['HT', 'OFİS', 'Terminal Meydanı', 'RT', 'Ağva Meydanı', 'Terminal Meydanı', 'HT', 'HT', 'Terminal Meydanı', 'Terminal Meydanı', 'Terminal Meydanı'] },
  { name: 'TUNCAY ÇATAL', shifts: ['Kozyatağı Meydanı', 'Kozyatağı Meydanı', 'Kozyatağı Meydanı', 'RT', 'Kozyatağı Meydanı', 'HT', 'HT', 'Kozyatağı Meydanı', 'Kozyatağı Meydanı', 'ÇALIŞTAY', 'Kozyatağı Meydanı'] },
  { name: 'HALİL İBRAHİM BULUT', shifts: ['Kadıköy Meydanı', 'Kadıköy Meydanı', 'Kadıköy Meydanı', 'Pendik Meydanı (TAM)', 'Kadıköy Meydanı', 'HT', 'HT', 'Kadıköy Meydanı', 'Kadıköy Meydanı', 'Kadıköy Meydanı', 'Kadıköy Meydanı'] },
  { name: 'HAKAN BEĞENMİŞ', shifts: ['Maltepe Cumhuriyet', 'Ümraniye 15 Temmuz', 'Kartal Neyzen Tevfik', 'Pendik Meydanı (TAM)', 'Sultanbeyli Meydanı', 'HT', 'HT', 'Maltepe Cumhuriyet', 'Ümraniye 15 Temmuz', 'Kartal Neyzen Tevfik', 'OFİS'] },
  { name: 'BEKİR GÖRMEK', shifts: ['Yİ', 'Yİ', 'RT', 'RT', 'Yİ', 'HT', 'HT', 'Yİ', 'Yİ', 'Yİ', 'OFİS'] },
  { name: 'UMUT EMRE', shifts: ['R', 'R', 'Üsküdar Mimar Sinan', 'RT', 'Üsküdar Mimar Sinan', 'HT', 'HT', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'Ümraniye 15 Temmuz', 'OFİS'] },
  { name: 'BERAT SEFA İSTANBUL', shifts: ['HT', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'RT', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'HT', 'HT', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet', 'Maltepe Cumhuriyet'] }
];

async function run() {
  console.log('=== VARDİYA İÇE AKTARIM BAŞLATILIYOR ===');
  console.log(`Mod: ${DRY_RUN ? 'DRY-RUN (Sadece analiz)' : 'APPLY (Firestore’a yazılacak)'}`);

  const allRecords = [];

  // Helper to process a schedule
  function processSchedule(scheduleName, dates, rows, defaultYaka) {
    rows.forEach((person) => {
      dates.forEach((dateKey, dateIdx) => {
        const rawShift = person.shifts[dateIdx];
        if (!rawShift) return;

        const parsed = parseShiftEntry(rawShift);
        if (!parsed) return;

        allRecords.push({
          schedule: scheduleName,
          tarih: dateKey,
          personelAdi: person.name,
          yaka: defaultYaka,
          vardiyaTipi: parsed.vardiyaTipi,
          saatAraligi: parsed.saatAraligi,
          meydanId: parsed.meydanId,
          rawLocation: parsed.rawLocation,
          isLeave: parsed.isLeave,
        });
      });
    });
  }

  processSchedule('24-30 Ağustos Anadolu', AGUSTOS_ANADOLU_DATES, AGUSTOS_ANADOLU_ROWS, 'Anadolu');
  processSchedule('24-30 Ağustos Avrupa', AGUSTOS_AVRUPA_DATES, AGUSTOS_AVRUPA_ROWS, 'Avrupa');
  processSchedule('20-30 Nisan Avrupa', NISAN_AVRUPA_DATES, NISAN_AVRUPA_ROWS, 'Avrupa');
  processSchedule('20-30 Nisan Anadolu', NISAN_ANADOLU_DATES, NISAN_ANADOLU_ROWS, 'Anadolu');

  console.log(`\nToplam İşlenen Vardiya Kaydı: ${allRecords.length}`);
  const activeMeydanShifts = allRecords.filter((r) => !r.isLeave && r.meydanId);
  const leaveShifts = allRecords.filter((r) => r.isLeave || !r.meydanId);
  console.log(`- Aktif Meydan Vardiyaları: ${activeMeydanShifts.length}`);
  console.log(`- İzin / Rapor / Tatil / Ofis Kayıtları: ${leaveShifts.length}`);

  // Summary by dates
  const byDate = {};
  allRecords.forEach((r) => {
    byDate[r.tarih] = (byDate[r.tarih] || 0) + 1;
  });
  console.log('\nTarihlere Göre Dağılım:');
  Object.entries(byDate).sort().forEach(([d, c]) => {
    console.log(`  ${d}: ${c} kayıt`);
  });

  if (DRY_RUN) {
    console.log('\nDRY-RUN tamamlandı. Değişiklikleri kaydetmek için scripti --apply ile çalıştırın.');
    process.exit(0);
  }

  // Connect to Firestore
  console.log('\nFirestore bağlantısı kuruluyor...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInAnonymously(auth);

  const vardiyalarCol = collection(db, 'vardiyalar');
  const personelIzinlerCol = collection(db, 'personelIzinler');

  console.log('Mevcut kayıtlar kontrol ediliyor ve güncelleniyor...');

  let batch = writeBatch(db);
  let batchCount = 0;
  let totalWritten = 0;

  for (const record of allRecords) {
    // Generate a deterministic document ID to prevent duplicates
    const safeName = record.personelAdi.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const safeDate = record.tarih;
    const docId = `shift_${safeDate}_${safeName}`;

    const docRef = doc(vardiyalarCol, docId);
    batch.set(
      docRef,
      {
        personelAdi: record.personelAdi,
        tarih: record.tarih,
        yaka: record.yaka,
        vardiyaTipi: record.vardiyaTipi,
        saatAraligi: record.saatAraligi,
        meydanId: record.meydanId,
        rawLocation: record.rawLocation,
        kaynak: 'excel_import_guncel_vardiya',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    batchCount += 1;
    totalWritten += 1;

    // If leave, also sync to personelIzinler
    if (record.isLeave) {
      const leaveDocId = `leave_${safeDate}_${safeName}`;
      const leaveRef = doc(personelIzinlerCol, leaveDocId);
      batch.set(
        leaveRef,
        {
          personelAdi: record.personelAdi,
          tarih: record.tarih,
          izinTuru: record.vardiyaTipi,
          aciklama: record.rawLocation,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      batchCount += 1;
    }

    if (batchCount >= 400) {
      await batch.commit();
      console.log(`-> ${totalWritten} kayıt yazıldı...`);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n🎉 BAŞARILI: Toplam ${totalWritten} vardiya kaydı Firestore'a eksiksiz yazıldı!`);
  process.exit(0);
}

run().catch((err) => {
  console.error('HATA:', err);
  process.exit(1);
});
