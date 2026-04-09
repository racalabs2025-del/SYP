import { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import Header from '../Header';
import { batchAddVardiyalar, deleteAllData, deleteVardiya } from '../batchFirestore';
import { sendToDeepSeek } from '../deepseek';
import { auth } from '../firebaseAuth';
import { db } from '../firebaseDb';
import { useEscapeHandler } from '../hooks/useEscapeHandler';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useModalState } from '../hooks/useModalState';
import { fetchDashboardBaseData } from '../service/dashboardService';
import { COLLECTIONS, SUBCOLLECTIONS } from '../service/firestoreCollections';
import { generateOperationalInsights } from '../service/operationalInsights';
import { loadStoredOperationalInsights, saveOperationalInsights } from '../service/operationalInsightsStore';
import { normalizeMeydanInput } from '../utils/meydanNormalization';
import { getExpandedActiveMeydanId, setExpandedActiveMeydanId } from '../utils/session';
import { isShiftActive, toDateKey } from '../utils/date';
import { parseKronikExcelRows, splitToChunks } from '../utils/excelParsing';
import DashboardHeroSection from '../components/dashboard/DashboardHeroSection';
import ActiveMeydanlarSection from '../components/dashboard/ActiveMeydanlarSection';
import KronikSorunlarSection from '../components/dashboard/KronikSorunlarSection';
import MeydanYonetimiSection from '../components/dashboard/MeydanYonetimiSection';
import OperationalInsightsSection from '../components/dashboard/OperationalInsightsSection';
import DataManagementSection from '../components/dashboard/DataManagementSection';
import SectionToggleBar, { SectionLinkBar, getSectionItem } from '../components/dashboard/SectionToggleBar';
import StatusToast from '../components/shared/StatusToast';

const ExcelUpload = lazy(() => import('../ExcelUpload'));
const INITIAL_VISIBLE_MEYDAN_COUNT = 4;
const INITIAL_VISIBLE_KRONIK_COUNT = 4;
const INITIAL_VISIBLE_ADMIN_KRONIK_COUNT = 6;
const FIRESTORE_BATCH_LIMIT = 350;
const KRONIK_PREVIEW_LIMIT = 96;
const ABOUT_VISIBLE_RESPONSIBILITY_COUNT = 4;
const INITIAL_VISIBLE_MEYDAN_PERSONEL_COUNT = 6;

const ACTIVE_MEYDAN_PRIORITY = [
  'Bakırköy Meydanı',
  'Kadıköy Meydanı',
  'Bağcılar Meydanı',
  'Maltepe Meydanı',
  'Beylikdüzü Meydanı',
  'Kartal Meydanı',
  'Eyüpsultan Meydanı',
  'Pendik Meydanı',
];

const ACTIVE_MEYDAN_PRIORITY_INDEX = new Map(ACTIVE_MEYDAN_PRIORITY.map((name, index) => [name, index]));

const MEYDAN_YONETIMI_ACIKLAMA = 'Meydan Yönetimi Birimi, İstanbul Büyükşehir Belediyesine ait olup, Müdürlüğümüz sorumluluğuna verilmiş meydanlarda vatandaş memnuniyetinin artırılması, çözüm süreçlerinin iyileştirilmesi ve çözüm bekleyen konuların ivedilikle giderilmesi amacıyla faaliyet göstermektedir. Birim, meydanlardaki çalışmaların etkin ve koordineli yürütülmesi için Belediyemizin ilgili birimleriyle sürekli iletişim halindedir.';

const MEYDAN_YONETIMI_GOREVLER = [
  'Vatandaşlardan gelen talep ve şikâyetleri ilgili birimlere iletmek ve sonuçlarını takip etmek.',
  'İstanbul Büyükşehir Belediyesi çalışmaları hakkında vatandaşları bilgilendirmek.',
  'Meydanlarda oluşan acil ve öncelikli sorunların ilgili müdürlükler aracılığıyla hızlıca çözülmesini sağlamak.',
  'Olası sorunları vatandaş şikâyetine dönüşmeden tespit ederek gerekli birimlere iletmek ve çözümünü sağlamak.',
  'Meydanlarda yapılacak etkinlikler için belediyenin ilgili birimleriyle koordinasyon kurmak.',
  'Meydanlardaki bakım ve onarım çalışmalarının takibini yapmak.',
  'Meydanlarda gerçekleştirilecek yeni uygulamaların takibini sağlamak.',
  'Meydanlarda yapılacak tüm etkinliklerin izin belgelerinin kontrolünü gerçekleştirmek.',
  'Görev alanında tespit edilen teknik sorunların sistem girişini yapmak ve sürecin kontrolünü sağlamak.',
  'Meydan çevresindeki esnaf ve sivil toplum kuruluşlarına ziyaretlerde bulunmak.',
  'Vatandaşların meydanlarla ilgili görüş, kullanım alışkanlıkları ve beklentilerini öğrenmek amacıyla anket çalışmaları düzenlemek.',
];

const RAPOR_AY_MAP = {
  ocak: 1,
  subat: 2,
  mart: 3,
  nisan: 4,
  mayis: 5,
  haziran: 6,
  temmuz: 7,
  agustos: 8,
  eylul: 9,
  ekim: 10,
  kasim: 11,
  aralik: 12,
};

const VALID_OPERATIONAL_INSIGHT_TITLES = new Set([
  'Planlama Sessizliği',
  'Çok Meydanlı Personel',
  'Sabit Görev Eşleşmesi',
  'Toplam Kayıt Lideri',
  'Veri Akışı',
  'Düşük Kayıtlı Meydanlar',
  'Yoğunluk/Kayıt Dengesi',
]);

const MEYDAN_YONETIMI_GROUP_ITEMS = [
  'meydan-hakkinda',
  'ziyaret-formu',
  'faaliyet-raporlari',
  'personel-listesi',
  'kronik-sorunlar',
];

function isValidInsightText(item) {
  const title = normalizeTrText(item?.title || '');
  const text = normalizeTrText(item?.text || '');
  const compact = `${title} ${text}`.replace(/[\s-]+/g, '');
  const hasExcludedPlaceholder = ['ofis', 'babalik', 'babalikizni', 'calistay', 'calistayprogrami'].some((token) => compact.includes(token));
  return VALID_OPERATIONAL_INSIGHT_TITLES.has(String(item?.title || '')) && !hasExcludedPlaceholder;
}

function normalizeTrText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıi]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c');
}

function extractRaporPeriod(baslik) {
  const normalized = normalizeTrText(baslik);
  const yearMatch = normalized.match(/(20\d{2})/);
  if (!yearMatch) {
    return null;
  }

  const year = Number(yearMatch[1]);
  let month = 0;
  Object.entries(RAPOR_AY_MAP).some(([monthName, monthNumber]) => {
    if (normalized.includes(monthName)) {
      month = monthNumber;
      return true;
    }
    return false;
  });

  if (!month) {
    return null;
  }

  return year * 100 + month;
}

function isLeaveShift(type) {
  return type === 'Izinli' || type === 'İzinli' || type === 'HAFTA TATILI' || type === 'HAFTA TATİLİ';
}

function compareActiveMeydanOrder(left, right) {
  const leftPriority = ACTIVE_MEYDAN_PRIORITY_INDEX.get(left?.isim);
  const rightPriority = ACTIVE_MEYDAN_PRIORITY_INDEX.get(right?.isim);

  if (leftPriority !== undefined || rightPriority !== undefined) {
    if (leftPriority === undefined) {
      return 1;
    }

    if (rightPriority === undefined) {
      return -1;
    }

    return leftPriority - rightPriority;
  }

  return String(left?.isim || '').localeCompare(String(right?.isim || ''), 'tr');
}

function LoadingUploadModule() {
  return <div className="message message-loading">Yukleme modulu hazirlaniyor...</div>;
}

function detectExpectedYear(rawJson, fileNames = []) {
  const yearCandidates = [];

  fileNames.forEach((name) => {
    const match = String(name).match(/(20\d{2})/g);
    if (match) {
      match.forEach((value) => yearCandidates.push(Number(value)));
    }
  });

  const headers = Object.keys(rawJson?.[0] || {});
  headers.forEach((header) => {
    const match = String(header).match(/(20\d{2})/g);
    if (match) {
      match.forEach((value) => yearCandidates.push(Number(value)));
    }
  });

  const currentYear = new Date().getFullYear();
  const validYears = yearCandidates.filter((year) => Number.isFinite(year) && year >= 2020 && year <= 2100);

  if (!validYears.length) {
    return currentYear;
  }

  return validYears.sort((a, b) => b - a)[0];
}

function truncateText(value, maxLength = KRONIK_PREVIEW_LIMIT) {
  const raw = String(value || '').trim();
  if (raw.length <= maxLength) {
    return raw;
  }

  return `${raw.slice(0, maxLength).trim()}...`;
}

function formatFileSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < (1024 * 1024)) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function createKronikDraftFromItem(item) {
  return {
    basvuruNo: item?.basvuruNo || '',
    meydanAdi: item?.meydanAdi || '',
    basvuruAciklamasi: item?.basvuruAciklamasi || '',
    basvuruGelisTarihi: item?.basvuruGelisTarihi || '',
    konuBasligi: item?.konuBasligi || item?.basvuruAciklamasi || '',
    detaylar: Array.isArray(item?.detaylar)
      ? item.detaylar.map((detail) => ({
        label: String(detail?.label || ''),
        value: String(detail?.value || ''),
      }))
      : [],
  };
}

function getKronikFirestoreErrorMessage(error, action) {
  const code = String(error?.code || '').trim();

  if (code === 'permission-denied') {
    if (!auth.currentUser) {
      return 'Firebase oturumu bulunamadi. Lutfen yeniden giris yapin ve tekrar deneyin.';
    }

    return `Kronik sorunlar icin Firestore ${action} yetkisi reddedildi. Canli projede firestore.rules henuz deploy edilmemis olabilir. Firebase CLI ile once proje secip ardından "npm run deploy:rules" komutunu calistirin.`;
  }

  return error?.message || `Kronik sorunlar icin Firestore ${action} islemi basarisiz oldu.`;
}

export default function Dashboard({ onLogout }) {
  const statOverlayPanelRef = useRef(null);
  const kronikModalPanelRef = useRef(null);
  const [meydanlar, setMeydanlar] = useState([]);
  const [todayShifts, setTodayShifts] = useState([]);
  const [recentShifts, setRecentShifts] = useState([]);
  const [historyShifts, setHistoryShifts] = useState([]);
  const [kronikSorunlar, setKronikSorunlar] = useState([]);
  const [kronikLoadError, setKronikLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingPlan, setUploadingPlan] = useState(false);
  const [uploadingKronik, setUploadingKronik] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [progress, setProgress] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState(false);
  const [lastImportSummary, setLastImportSummary] = useState(null);
  const [showAllMeydanlar, setShowAllMeydanlar] = useState(false);
  const [expandedMeydanId, setExpandedMeydanId] = useState(() => getExpandedActiveMeydanId());
  const [showAllKronik, setShowAllKronik] = useState(false);
  const [showAllAdminKronik, setShowAllAdminKronik] = useState(false);
  const [showAllMeydanYonetimiGorevleri, setShowAllMeydanYonetimiGorevleri] = useState(false);
  const [showAllMeydanYonetimiPersonel, setShowAllMeydanYonetimiPersonel] = useState(false);
  const [activeMeydanYonetimiBolumu, setActiveMeydanYonetimiBolumu] = useState('meydan-hakkinda');
  const [meydanFaaliyetRaporlari, setMeydanFaaliyetRaporlari] = useState([]);
  const [raporBaslik, setRaporBaslik] = useState('');
  const [uploadingRapor, setUploadingRapor] = useState(false);
  const [raporUrls, setRaporUrls] = useState({});
  const {
    activeId: activeKronikModalId,
    setActiveId: setActiveKronikModalId,
    close: closeKronikModal,
  } = useModalState('');
  const [expandedAdminKronikId, setExpandedAdminKronikId] = useState('');
  const [kronikDrafts, setKronikDrafts] = useState({});
  const [kronikSavingId, setKronikSavingId] = useState('');
  const [visibleShiftsCount, setVisibleShiftsCount] = useState(5);
  const {
    activeId: activeStatOverlay,
    setActiveId: setActiveStatOverlay,
    close: closeStatOverlay,
  } = useModalState('');
  const [operationalInsights, setOperationalInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [openSections, setOpenSections] = useState(() => new Set(['active-meydanlar']));

  function toggleSection(key) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const uploading = uploadingPlan || uploadingKronik;

  const todayKey = toDateKey(new Date());

  const loadDashboard = useCallback(async () => {
    try {
      const {
        meydanSnapshot,
        todaySnapshot,
        recentDocs,
        historyDocs,
        kronikResult,
        raporlarSnapshot,
      } = await fetchDashboardBaseData(db, todayKey);

    const rawMeydanList = meydanSnapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
    const rawMeydanById = Object.fromEntries(rawMeydanList.map((item) => [item.id, item]));
    const normalizedMeydanMap = new Map();

    rawMeydanList.forEach((item) => {
      const normalized = normalizeMeydanInput({
        meydanId: item.id,
        isim: item.isim,
        kisaAd: item.isim,
        tamAd: item.tamAd,
      });

      if (!normalized.valid || normalizedMeydanMap.has(normalized.id)) {
        return;
      }

      normalizedMeydanMap.set(normalized.id, {
        id: normalized.id,
        isim: normalized.isim,
        tamAd: normalized.tamAd,
      });
    });

    function normalizeShiftRows(rows) {
      return rows.map((shift) => {
        const sourceMeydan = rawMeydanById[shift.meydanId] || {};
        const normalized = normalizeMeydanInput({
          meydanId: shift.meydanId,
          isim: sourceMeydan.isim,
          kisaAd: sourceMeydan.isim,
          tamAd: sourceMeydan.tamAd,
        });

        if (!normalized.valid) {
          return null;
        }

        if (!normalizedMeydanMap.has(normalized.id)) {
          normalizedMeydanMap.set(normalized.id, {
            id: normalized.id,
            isim: normalized.isim,
            tamAd: normalized.tamAd,
          });
        }

        return {
          ...shift,
          meydanId: normalized.id,
        };
      })
      .filter(Boolean);
    }

    const normalizedTodayShifts = normalizeShiftRows(
      todaySnapshot.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
    );
    const normalizedRecentShifts = normalizeShiftRows(recentDocs);
    const normalizedHistoryShifts = normalizeShiftRows(historyDocs);

    const meydanList = Array.from(normalizedMeydanMap.values()).sort((left, right) => left.isim.localeCompare(right.isim, 'tr'));

    setMeydanlar(meydanList);
    setTodayShifts(normalizedTodayShifts);
    setRecentShifts(normalizedRecentShifts);
    setHistoryShifts(normalizedHistoryShifts);

    if (kronikResult?.snapshot) {
      const kronikRows = kronikResult.snapshot.docs
        .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
        .sort((left, right) => {
          const leftDate = String(left.basvuruGelisTarihi || '');
          const rightDate = String(right.basvuruGelisTarihi || '');
          return rightDate.localeCompare(leftDate, 'tr');
        });
      setKronikLoadError('');
      setKronikSorunlar(kronikRows);
    } else {
      setKronikLoadError(
        kronikResult?.error ? getKronikFirestoreErrorMessage(kronikResult.error, 'okuma') : ''
      );
      setKronikSorunlar([]);
    }

    if (raporlarSnapshot) {
      const raporlarDocs = raporlarSnapshot.docs
        .map((snapshot) => {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            baslik: data.baslik || '',
            ad: data.ad || '',
            boyut: data.boyut || 0,
            chunkCount: data.chunkCount || 1,
            createdAt: data.createdAt || null,
            yuklenmeTarihi: data.yuklenmeTarihi || '',
            acilimi: false,
          };
        })
        .sort((left, right) => {
          const leftPeriod = extractRaporPeriod(left.baslik);
          const rightPeriod = extractRaporPeriod(right.baslik);

          if (leftPeriod !== null && rightPeriod !== null && leftPeriod !== rightPeriod) {
            return rightPeriod - leftPeriod;
          }

          if (leftPeriod === null && rightPeriod !== null) {
            return 1;
          }

          if (leftPeriod !== null && rightPeriod === null) {
            return -1;
          }

          const leftTime = left.createdAt?.toMillis?.() || 0;
          const rightTime = right.createdAt?.toMillis?.() || 0;
          if (leftTime !== rightTime) {
            return rightTime - leftTime;
          }

          return right.baslik.localeCompare(left.baslik, 'tr');
        });
      setMeydanFaaliyetRaporlari(raporlarDocs);
    } else {
      setMeydanFaaliyetRaporlari([]);
    }
    } catch (error) {
      console.error('loadDashboard error:', error);
      throw error;
    }
  }, [todayKey]);

  useEffect(() => {
    let active = true;

    async function runInitialLoad() {
      try {
        await loadDashboard();

        if (!active) {
          return;
        }

        setStatus({ type: '', text: '' });
      } catch (error) {
        console.error('Dashboard data load failed.', error);
        if (active) {
          setStatus({ type: 'error', text: `Veriler yuklenemedi: ${error?.code || error?.message || 'bilinmeyen hata'}` });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    runInitialLoad();

    return () => {
      active = false;
    };
  }, [loadDashboard]);

  useEscapeHandler(Boolean(activeStatOverlay), closeStatOverlay);
  useEscapeHandler(Boolean(activeKronikModalId), closeKronikModal);
  useFocusTrap(Boolean(activeStatOverlay), statOverlayPanelRef);
  useFocusTrap(Boolean(activeKronikModalId), kronikModalPanelRef);

  const meydanMap = useMemo(
    () => Object.fromEntries(meydanlar.map((meydan) => [meydan.id, meydan])),
    [meydanlar],
  );

  const activeMeydanlar = useMemo(() => {
    const scheduledIds = new Set(
      todayShifts
        .filter((shift) => !isLeaveShift(shift.vardiyaTipi))
        .map((shift) => shift.meydanId),
    );

    return meydanlar
      .filter((meydan) => scheduledIds.has(meydan.id))
      .sort(compareActiveMeydanOrder);
  }, [meydanlar, todayShifts]);

  useEffect(() => {
    if (activeMeydanlar.length <= INITIAL_VISIBLE_MEYDAN_COUNT && showAllMeydanlar) {
      setShowAllMeydanlar(false);
    }
  }, [activeMeydanlar.length, showAllMeydanlar]);

  useEffect(() => {
    if (kronikSorunlar.length <= INITIAL_VISIBLE_KRONIK_COUNT && showAllKronik) {
      setShowAllKronik(false);
    }
  }, [kronikSorunlar.length, showAllKronik]);

  useEffect(() => {
    if (kronikSorunlar.length <= INITIAL_VISIBLE_ADMIN_KRONIK_COUNT && showAllAdminKronik) {
      setShowAllAdminKronik(false);
    }
  }, [kronikSorunlar.length, showAllAdminKronik]);

  const visibleMeydanlar = useMemo(
    () => (showAllMeydanlar ? activeMeydanlar : activeMeydanlar.slice(0, INITIAL_VISIBLE_MEYDAN_COUNT)),
    [activeMeydanlar, showAllMeydanlar],
  );

  useEffect(() => {
    if (!expandedMeydanId) {
      return;
    }

    const stillVisible = activeMeydanlar.some((meydan) => meydan.id === expandedMeydanId);
    if (!stillVisible) {
      setExpandedMeydanId('');
    }
  }, [activeMeydanlar, expandedMeydanId]);

  useEffect(() => {
    if (!expandedMeydanId) {
      return;
    }

    const isVisible = visibleMeydanlar.some((meydan) => meydan.id === expandedMeydanId);
    if (!isVisible && !showAllMeydanlar) {
      setShowAllMeydanlar(true);
    }
  }, [expandedMeydanId, showAllMeydanlar, visibleMeydanlar]);

  useEffect(() => {
    setExpandedActiveMeydanId(expandedMeydanId);
  }, [expandedMeydanId]);

  const handleToggleExpandedMeydan = useCallback((meydanId) => {
    setExpandedMeydanId((current) => (current === meydanId ? '' : meydanId));
  }, []);

  const visibleKronikSorunlar = useMemo(
    () => (showAllKronik ? kronikSorunlar : kronikSorunlar.slice(0, INITIAL_VISIBLE_KRONIK_COUNT)),
    [kronikSorunlar, showAllKronik],
  );

  const visibleAdminKronikSorunlar = useMemo(
    () => (showAllAdminKronik ? kronikSorunlar : kronikSorunlar.slice(0, INITIAL_VISIBLE_ADMIN_KRONIK_COUNT)),
    [kronikSorunlar, showAllAdminKronik],
  );

  const visibleMeydanYonetimiGorevleri = useMemo(
    () => (showAllMeydanYonetimiGorevleri
      ? MEYDAN_YONETIMI_GOREVLER
      : MEYDAN_YONETIMI_GOREVLER.slice(0, ABOUT_VISIBLE_RESPONSIBILITY_COUNT)),
    [showAllMeydanYonetimiGorevleri],
  );

  const scheduledShiftCountByMeydan = useMemo(() => {
    const counts = new Map();

    todayShifts.forEach((shift) => {
      if (!shift.meydanId || isLeaveShift(shift.vardiyaTipi)) {
        return;
      }

      counts.set(shift.meydanId, (counts.get(shift.meydanId) || 0) + 1);
    });

    return counts;
  }, [todayShifts]);

  const activeShiftCountByMeydan = useMemo(() => {
    const counts = new Map();

    todayShifts.forEach((shift) => {
      if (!shift.meydanId || isLeaveShift(shift.vardiyaTipi) || !isShiftActive(shift.saatAraligi)) {
        return;
      }

      counts.set(shift.meydanId, (counts.get(shift.meydanId) || 0) + 1);
    });

    return counts;
  }, [todayShifts]);

  const scheduledPersonnelRows = useMemo(
    () => todayShifts
      .filter((shift) => shift.meydanId && !isLeaveShift(shift.vardiyaTipi))
      .map((shift) => ({
        id: shift.id,
        personelAdi: shift.personelAdi || '-',
        meydanAdi: meydanMap[shift.meydanId]?.isim || shift.meydanId || '-',
        saatAraligi: shift.saatAraligi || '-',
      })),
    [meydanMap, todayShifts],
  );

  const activePersonnelRows = useMemo(
    () => todayShifts
      .filter((shift) => shift.meydanId && !isLeaveShift(shift.vardiyaTipi) && isShiftActive(shift.saatAraligi))
      .map((shift) => ({
        id: shift.id,
        personelAdi: shift.personelAdi || '-',
        meydanAdi: meydanMap[shift.meydanId]?.isim || shift.meydanId || '-',
        saatAraligi: shift.saatAraligi || '-',
      })),
    [meydanMap, todayShifts],
  );

  const plannedPersonnelSummaryByMeydan = useMemo(() => {
    const summary = new Map();

    todayShifts.forEach((shift) => {
      if (!shift?.meydanId || isLeaveShift(shift.vardiyaTipi)) {
        return;
      }

      const personelAdi = String(shift.personelAdi || '').trim();
      if (!personelAdi) {
        return;
      }

      const current = summary.get(shift.meydanId) || [];
      if (!current.includes(personelAdi)) {
        current.push(personelAdi);
      }
      summary.set(shift.meydanId, current);
    });

    return summary;
  }, [todayShifts]);

  const plannedPersonnelWithHoursByMeydan = useMemo(() => {
    const summary = new Map();

    todayShifts.forEach((shift) => {
      if (!shift?.meydanId || isLeaveShift(shift.vardiyaTipi)) {
        return;
      }

      const personelAdi = String(shift.personelAdi || '').trim();
      if (!personelAdi) {
        return;
      }

      const saatAraligi = String(shift.saatAraligi || '').trim() || '-';
      const display = `${personelAdi} (${saatAraligi})`;
      const current = summary.get(shift.meydanId) || [];

      if (!current.includes(display)) {
        current.push(display);
      }

      summary.set(shift.meydanId, current);
    });

    return summary;
  }, [todayShifts]);

  const totalScheduledShiftCount = useMemo(
    () => scheduledPersonnelRows.length,
    [scheduledPersonnelRows],
  );

  const totalActiveShiftCount = useMemo(
    () => activePersonnelRows.length,
    [activePersonnelRows],
  );

  const uploadPercent = useMemo(() => {
    if (!progress?.total) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((progress.current / progress.total) * 100)));
  }, [progress]);

  const activeMeydanRows = useMemo(
    () => activeMeydanlar.map((meydan) => ({ id: meydan.id, isim: meydan.isim || meydan.id })),
    [activeMeydanlar],
  );

  useEffect(() => {
    if (!meydanlar.length || loading) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadInsights() {
      setInsightsLoading(true);
      const stored = await loadStoredOperationalInsights(db, todayKey).catch(() => []);
      if (!controller.signal.aborted && stored.length) {
        setOperationalInsights(stored.filter(isValidInsightText));
      }

      const insights = await generateOperationalInsights(
        {
          recentShifts,
          historyShifts,
          meydanlar,
          kronikSorunlar,
          todayKey,
        },
        {
          useAI: false,
          signal: controller.signal,
        },
      );

      if (!controller.signal.aborted) {
        const sanitizedInsights = insights.filter(isValidInsightText);
        setOperationalInsights(sanitizedInsights);
        setInsightsLoading(false);
        saveOperationalInsights(db, todayKey, sanitizedInsights).catch(() => {});
      }
    }

    loadInsights();

    return () => {
      controller.abort();
    };
  }, [historyShifts, kronikSorunlar, loading, meydanlar, recentShifts, todayKey]);

  function getScheduledCount(meydanId) {
    return scheduledShiftCountByMeydan.get(meydanId) || 0;
  }

  function getActiveCount(meydanId) {
    return activeShiftCountByMeydan.get(meydanId) || 0;
  }

  async function loadRaporUrl(reportId) {
    if (raporUrls[reportId] && raporUrls[reportId] !== 'error') {
      return;
    }

    setRaporUrls((prev) => ({ ...prev, [reportId]: 'loading' }));

    try {
      const chunksSnapshot = await getDocs(
        collection(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI, reportId, SUBCOLLECTIONS.CHUNKS)
      );

      if (!chunksSnapshot.empty) {
        const sorted = [...chunksSnapshot.docs].sort(
          (left, right) => (left.data().index || 0) - (right.data().index || 0)
        );
        const base64Full = sorted.map((d) => d.data().data).join('');
        setRaporUrls((prev) => ({ ...prev, [reportId]: base64Full }));
      } else {
        // Eski format: base64 doğrudan dokümanda
        const mainSnapshot = await getDocs(
          query(collection(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI), where('__name__', '==', reportId))
        );
        const data = mainSnapshot.docs[0]?.data();
        if (data?.base64) {
          setRaporUrls((prev) => ({ ...prev, [reportId]: data.base64 }));
        } else {
          setRaporUrls((prev) => ({ ...prev, [reportId]: 'error' }));
        }
      }
    } catch (error) {
      console.error('Rapor URL yükleme hatası:', error);
      setRaporUrls((prev) => ({ ...prev, [reportId]: 'error' }));
    }
  }

  async function handleUploadMeydanRaporu(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    if (!raporBaslik.trim()) {
      setStatus({ type: 'error', text: 'Lütfen rapor başlığını girin.' });
      return;
    }

    const validPdfFiles = files.filter((file) => {
      const name = String(file.name || '').toLocaleLowerCase('tr-TR');
      return file.type === 'application/pdf' || name.endsWith('.pdf');
    });

    if (!validPdfFiles.length) {
      setStatus({ type: 'error', text: 'Lütfen yalnızca PDF rapor yükleyin.' });
      event.target.value = '';
      return;
    }

    const CHUNK_SIZE = 500 * 1024; // 500KB per chunk

    try {
      setUploadingRapor(true);
      let uploadedCount = 0;
      const newReports = [];

      for (const file of validPdfFiles) {
        // Dosyayı base64'e çevir
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // base64'ü chunk'lara böl
        const chunkStrings = [];
        for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
          chunkStrings.push(base64.slice(i, i + CHUNK_SIZE));
        }

        // Metadata'yı Firestore'a kaydet
        const docRef = await addDoc(collection(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI), {
          baslik: raporBaslik.trim(),
          ad: file.name,
          boyut: file.size,
          chunkCount: chunkStrings.length,
          createdAt: serverTimestamp(),
          yuklenmeTarihi: new Date().toLocaleString('tr-TR'),
        });

        // Chunk'ları alt-koleksiyona batch ile kaydet
        const chunkBatch = writeBatch(db);
        chunkStrings.forEach((chunk, index) => {
          const chunkRef = doc(
            collection(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI, docRef.id, SUBCOLLECTIONS.CHUNKS),
            String(index).padStart(4, '0')
          );
          chunkBatch.set(chunkRef, { data: chunk, index });
        });
        await chunkBatch.commit();

        // URL'yi hemen state'e ekle (tekrar yüklemeye gerek yok)
        setRaporUrls((prev) => ({ ...prev, [docRef.id]: base64 }));

        newReports.push({
          id: docRef.id,
          baslik: raporBaslik.trim(),
          ad: file.name,
          boyut: file.size,
          chunkCount: chunkStrings.length,
          yuklenmeTarihi: new Date().toLocaleString('tr-TR'),
          acilimi: true,
        });

        uploadedCount += 1;
      }

      setMeydanFaaliyetRaporlari((current) => [...newReports, ...current]);
      setStatus({ type: 'success', text: `${uploadedCount} faaliyet raporu başarıyla yüklendi.` });
      setRaporBaslik('');
      event.target.value = '';
    } catch (error) {
      console.error('Rapor yükleme hatası:', error);
      setStatus({ type: 'error', text: `Rapor yükleme başarısız: ${error.message}` });
    } finally {
      setUploadingRapor(false);
    }
  }

  async function handleRemoveMeydanRaporu(reportId) {
    try {
      // Önce chunk'ları sil
      const chunksSnapshot = await getDocs(
        collection(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI, reportId, SUBCOLLECTIONS.CHUNKS)
      );
      if (!chunksSnapshot.empty) {
        const deleteBatch = writeBatch(db);
        chunksSnapshot.docs.forEach((d) => deleteBatch.delete(d.ref));
        await deleteBatch.commit();
      }

      // Sonra ana dokümanı sil
      await deleteDoc(doc(db, COLLECTIONS.MEYDAN_FAALIYET_RAPORLARI, reportId));

      setMeydanFaaliyetRaporlari((current) =>
        current.filter((item) => item.id !== reportId)
      );
      setRaporUrls((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
      setStatus({ type: 'success', text: 'Rapor başarıyla silindi.' });
    } catch (error) {
      console.error('Rapor silme hatası:', error);
      setStatus({ type: 'error', text: `Rapor silme başarısız: ${error.message}` });
    }
  }

  function toggleRaporAcilimi(reportId) {
    setMeydanFaaliyetRaporlari((current) =>
      current.map((report) =>
        report.id === reportId ? { ...report, acilimi: !report.acilimi } : report
      )
    );
    // Rapor açılıyorsa URL'yi yükle
    loadRaporUrl(reportId);
  }

  async function refreshDashboard() {
    setLoading(true);
    setStatus((current) => ({ ...current, text: current.type === 'error' ? current.text : '' }));

    try {
      await loadDashboard();
    } catch (error) {
      console.error('Dashboard refresh failed.', error);
      setStatus({ type: 'error', text: 'Veriler yenilenemedi.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAll() {
    const shouldDelete = window.confirm(
      'Tüm vardiyaları ve tanımlanmış meydanları silmek istediğinize emin misiniz? Sistem tamamen sıfırlanacaktır.',
    );

    if (!shouldDelete) {
      return;
    }

    setUploadingPlan(true);
    setStatus({ type: '', text: '' });

    try {
      await deleteAllData();
      await refreshDashboard();
      setStatus({ type: 'success', text: 'Sistem başarıyla sıfırlandı.' });
    } catch (error) {
      console.error('Delete all failed.', error);
      setStatus({ type: 'error', text: 'Sıfırlama sırasında bir hata oluştu.' });
    } finally {
      setUploadingPlan(false);
    }
  }

  async function handleDeleteShift(shiftId) {
    const shouldDelete = window.confirm('Bu vardiyayı silmek istediğinize emin misiniz?');

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteVardiya(shiftId);
      setTodayShifts((current) => current.filter((item) => item.id !== shiftId));
      setRecentShifts((current) => current.filter((item) => item.id !== shiftId));
      setHistoryShifts((current) => current.filter((item) => item.id !== shiftId));
      setStatus({ type: 'success', text: 'Vardiya başarıyla silindi.' });
    } catch (error) {
      console.error('Delete shift failed.', error);
      setStatus({ type: 'error', text: 'Vardiya silinemedi.' });
    }
  }

  function handleAdminUnlock(e) {
    e.preventDefault();
    if (adminPasswordInput === 'admin') {
      setAdminUnlocked(true);
      setAdminPasswordError(false);
      setAdminPasswordInput('');
    } else {
      setAdminPasswordError(true);
      setAdminPasswordInput('');
    }
  }

  async function handleExcelUpload(rawJson, meta = {}) {
    setUploadingPlan(true);
    setStatus({ type: '', text: '' });
    setLastImportSummary(null);
    setProgress(null);

    try {
      const expectedYear = detectExpectedYear(rawJson, meta?.fileNames || []);

      const cleanList = await sendToDeepSeek(rawJson, (current, total) => {
        setProgress({ current, total });
      }, { expectedYear });

      const importResult = await batchAddVardiyalar(cleanList, { expectedYear });
      await refreshDashboard();
      setLastImportSummary(importResult);

      const skippedCount = (importResult?.skippedMissingFields || 0) + (importResult?.skippedInvalidDate || 0) + (importResult?.skippedInvalidMeydan || 0);
      const ignoredCount = importResult?.ignoredOffDays || 0;

      setStatus({
        type: skippedCount > 0 ? 'error' : 'success',
        text: skippedCount > 0
          ? `Yükleme tamamlandı. ${ignoredCount ? `${ignoredCount} HT/izin satırı normal olarak hariç tutuldu. ` : ''}Atlanan kayıtlar için Veri Yönetimi içindeki Yükleme Detayı panelini inceleyin.`
          : `Yükleme tamamlandı.${ignoredCount ? ` ${ignoredCount} HT/izin satırı normal olarak hariç tutuldu.` : ''}`,
      });
    } catch (error) {
      console.error('Excel import failed.', error);
      setLastImportSummary(null);
      setStatus({ type: 'error', text: error.message || 'Yükleme sırasında bir hata oluştu.' });
    } finally {
      setUploadingPlan(false);
      setProgress(null);
    }
  }

  async function handleKronikUpload(rawJson) {
    setUploadingKronik(true);
    setStatus({ type: '', text: '' });

    try {
      if (!auth.currentUser) {
        setStatus({ type: 'error', text: 'Firebase oturumu bulunamadi. Lutfen yeniden giris yapin.' });
        return;
      }

      const parsed = parseKronikExcelRows(rawJson);

      if (!parsed.validRows.length) {
        setStatus({ type: 'error', text: 'Kronik sorun dosyasında uygun satır bulunamadı. Başvuru No ve Başvuru Açıklaması alanlarını kontrol edin.' });
        return;
      }

      const existingIds = new Set(kronikSorunlar.map((item) => item.id));
      let created = 0;
      let updated = 0;
      const chunks = splitToChunks(parsed.validRows, FIRESTORE_BATCH_LIMIT);

      for (const chunk of chunks) {
        const batch = writeBatch(db);

        chunk.forEach((item) => {
          const reference = doc(db, 'kronikSorunlar', item.id);
          const exists = existingIds.has(item.id);

          if (exists) {
            updated += 1;
          } else {
            created += 1;
          }

          batch.set(reference, {
            basvuruNo: item.basvuruNo,
            meydanAdi: item.meydanAdi,
            basvuruAciklamasi: item.basvuruAciklamasi,
            basvuruGelisTarihi: item.basvuruGelisTarihi,
            konuBasligi: item.konuBasligi,
            detaylar: item.detaylar,
            updatedAt: serverTimestamp(),
            ...(exists ? {} : { createdAt: serverTimestamp() }),
          }, { merge: true });
        });

        await batch.commit();
      }

      await refreshDashboard();

      const skippedPart = parsed.skippedRows ? `, ${parsed.skippedRows} satır atlandı` : '';
      setStatus({ type: 'success', text: `Kronik sorun yükleme tamamlandı. ${created} yeni, ${updated} güncel kayıt işlendi${skippedPart}.` });
    } catch (error) {
      console.error('Kronik sorun import failed.', error);
      setStatus({ type: 'error', text: getKronikFirestoreErrorMessage(error, 'yazma') });
    } finally {
      setUploadingKronik(false);
    }
  }

  function getKronikDraft(item) {
    return kronikDrafts[item.id] || createKronikDraftFromItem(item);
  }

  function handleKronikFieldChange(item, field, value) {
    setKronikDrafts((current) => ({
      ...current,
      [item.id]: {
        ...getKronikDraft(item),
        [field]: value,
      },
    }));
  }

  function handleKronikDetailChange(item, index, field, value) {
    const draft = getKronikDraft(item);
    const detaylar = (draft.detaylar || []).map((detail, detailIndex) => (
      detailIndex === index ? { ...detail, [field]: value } : detail
    ));

    setKronikDrafts((current) => ({
      ...current,
      [item.id]: {
        ...draft,
        detaylar,
      },
    }));
  }

  function handleAddDetailRow(item) {
    const draft = getKronikDraft(item);
    setKronikDrafts((current) => ({
      ...current,
      [item.id]: {
        ...draft,
        detaylar: [...(draft.detaylar || []), { label: '', value: '' }],
      },
    }));
  }

  function handleRemoveDetailRow(item, index) {
    const draft = getKronikDraft(item);
    setKronikDrafts((current) => ({
      ...current,
      [item.id]: {
        ...draft,
        detaylar: (draft.detaylar || []).filter((_, detailIndex) => detailIndex !== index),
      },
    }));
  }

  async function handleSaveKronik(item) {
    const draft = getKronikDraft(item);
    const payload = {
      basvuruNo: String(draft.basvuruNo || '').trim() || '-',
      meydanAdi: String(draft.meydanAdi || '').trim() || '-',
      basvuruAciklamasi: String(draft.basvuruAciklamasi || '').trim() || '-',
      basvuruGelisTarihi: String(draft.basvuruGelisTarihi || '').trim() || '-',
      konuBasligi: String(draft.konuBasligi || '').trim() || String(draft.basvuruAciklamasi || '').trim() || '-',
      detaylar: (draft.detaylar || [])
        .map((detail) => ({
          label: String(detail?.label || '').trim(),
          value: String(detail?.value || '').trim(),
        }))
        .filter((detail) => detail.label || detail.value),
      updatedAt: serverTimestamp(),
    };

    try {
      setKronikSavingId(item.id);
      await updateDoc(doc(db, 'kronikSorunlar', item.id), {
        ...payload,
      });

      setKronikSorunlar((current) => current.map((row) => (
        row.id === item.id
          ? { ...row, ...payload, updatedAt: row.updatedAt }
          : row
      )));

      setStatus({ type: 'success', text: `${item.basvuruNo} için kronik süreç detayları güncellendi.` });
    } catch (error) {
      console.error('Kronik surec update failed.', error);
      setStatus({ type: 'error', text: 'Kronik süreç güncellenemedi.' });
    } finally {
      setKronikSavingId('');
    }
  }

  async function handleDeleteKronik(item) {
    const shouldDelete = window.confirm(`${item.basvuruNo} numaralı kronik başvuruyu silmek istediğinize emin misiniz?`);
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteDoc(doc(db, COLLECTIONS.KRONIK_SORUNLAR, item.id));
      setKronikSorunlar((current) => current.filter((row) => row.id !== item.id));
      setKronikDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      if (activeKronikModalId === item.id) {
        setActiveKronikModalId('');
      }
      setStatus({ type: 'success', text: `${item.basvuruNo} numaralı başvuru silindi.` });
    } catch (error) {
      console.error('Kronik sorun delete failed.', error);
      setStatus({ type: 'error', text: 'Kronik başvuru silinemedi.' });
    }
  }

  const activeKronikModalItem = useMemo(
    () => kronikSorunlar.find((item) => item.id === activeKronikModalId) || null,
    [activeKronikModalId, kronikSorunlar],
  );

  return (
    <div className="app-shell">
      <Header onLogout={onLogout} />

      <main className="page page-dashboard">
        <DashboardHeroSection
          activeMeydanCount={activeMeydanlar.length}
          totalScheduledShiftCount={totalScheduledShiftCount}
          totalActiveShiftCount={totalActiveShiftCount}
          activeStatOverlay={activeStatOverlay}
          onOpenStatOverlay={setActiveStatOverlay}
          onCloseStatOverlay={closeStatOverlay}
          activeMeydanRows={activeMeydanRows}
          scheduledPersonnelRows={scheduledPersonnelRows}
          activePersonnelRows={activePersonnelRows}
          statOverlayPanelRef={statOverlayPanelRef}
        />

        <StatusToast
          status={status}
          onDismiss={() => setStatus({ type: '', text: '' })}
        />

        {activeKronikModalItem ? (
          <div className="kronik-modal" role="presentation" onClick={() => setActiveKronikModalId('')}>
            <div
              ref={kronikModalPanelRef}
              className="kronik-modal__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="kronik-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="kronik-modal__header">
                <div>
                  <span className="section-kicker">Kronik Süreç Detayı</span>
                  <h3 id="kronik-modal-title">{activeKronikModalItem.meydanAdi || '-'}</h3>
                </div>
                <button type="button" className="btn btn-ghost btn-inline" onClick={() => setActiveKronikModalId('')}>
                  Kapat
                </button>
              </div>

              <div className="kronik-modal__content">
                <div className="kronik-modal__grid">
                  <div>
                    <small>Başvuru No</small>
                    <strong>{activeKronikModalItem.basvuruNo || '-'}</strong>
                  </div>
                  <div>
                    <small>Başvuru Geliş Tarihi</small>
                    <strong>{activeKronikModalItem.basvuruGelisTarihi || '-'}</strong>
                  </div>
                </div>

                <div className="kronik-modal__block">
                  <small>Konu Başlığı</small>
                  <p>{activeKronikModalItem.konuBasligi || activeKronikModalItem.basvuruAciklamasi || '-'}</p>
                </div>

                <div className="kronik-modal__block">
                  <small>Başvuru Açıklaması</small>
                  <p>{activeKronikModalItem.basvuruAciklamasi || '-'}</p>
                </div>

                {(activeKronikModalItem.detaylar || []).length ? (
                  <div className="kronik-modal__details">
                    {(activeKronikModalItem.detaylar || []).map((detail, index) => (
                      <div key={`modal-${activeKronikModalItem.id}-${index}`} className="kronik-modal__detail-row">
                        <span>{detail.label}</span>
                        <strong>{detail.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="section-accordion-list">
          <SectionToggleBar itemKey="active-meydanlar" isOpen={openSections.has('active-meydanlar')} onToggle={toggleSection}>
            <ActiveMeydanlarSection
              loading={loading}
              activeMeydanlar={activeMeydanlar}
              visibleMeydanlar={visibleMeydanlar}
              expandedMeydanId={expandedMeydanId}
              getPlannedPersonnelNames={(meydanId) => plannedPersonnelSummaryByMeydan.get(meydanId) || []}
              getPlannedPersonnelDetails={(meydanId) => plannedPersonnelWithHoursByMeydan.get(meydanId) || []}
              getActiveCount={getActiveCount}
              getScheduledCount={getScheduledCount}
              showAllMeydanlar={showAllMeydanlar}
              initialVisibleCount={INITIAL_VISIBLE_MEYDAN_COUNT}
              onToggleMeydan={handleToggleExpandedMeydan}
              onToggleShowAll={() => setShowAllMeydanlar((current) => !current)}
            />
          </SectionToggleBar>

          <SectionToggleBar itemKey="meydan-yonetimi-grup" isOpen={openSections.has('meydan-yonetimi-grup')} onToggle={toggleSection}>
            <section className="panel-section meydan-yonetimi-group-panel">
              <div className="panel-section__header">
                <div className="meydan-yonetimi-group-panel__intro">
                  <span className="section-kicker">Meydan Yönetimi</span>
                  <h2>Meydan Yönetim Merkezi</h2>
                  <p>Ziyaret, rapor, personel ve kronik kayıt akışı tek panelden izlenir.</p>
                </div>
              </div>

              <div className="meydan-yonetimi-subnav" role="tablist" aria-label="Meydan yönetimi alt başlıkları">
                {MEYDAN_YONETIMI_GROUP_ITEMS.map((itemKey) => {
                  const item = getSectionItem(itemKey);
                  if (!item) {
                    return null;
                  }

                  const isActive = activeMeydanYonetimiBolumu === itemKey;
                  return (
                    <button
                      key={itemKey}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`meydan-yonetimi-subnav__item${isActive ? ' is-active' : ''}`}
                      onClick={() => setActiveMeydanYonetimiBolumu(itemKey)}
                    >
                      <span className="meydan-yonetimi-subnav__icon">{item.icon}</span>
                      <span className="meydan-yonetimi-subnav__label">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="meydan-yonetimi-group-panel__body">
                {activeMeydanYonetimiBolumu === 'meydan-hakkinda' ? (
                  <MeydanYonetimiSection
                    forcedSection="about"
                    meydanYonetimiAciklama={MEYDAN_YONETIMI_ACIKLAMA}
                    visibleMeydanYonetimiGorevleri={visibleMeydanYonetimiGorevleri}
                    toplamMeydanYonetimiGorev={MEYDAN_YONETIMI_GOREVLER.length}
                    aboutVisibleResponsibilityCount={ABOUT_VISIBLE_RESPONSIBILITY_COUNT}
                    showAllMeydanYonetimiGorevleri={showAllMeydanYonetimiGorevleri}
                    onToggleShowAllMeydanYonetimiGorevleri={() => setShowAllMeydanYonetimiGorevleri((current) => !current)}
                    meydanFaaliyetRaporlari={meydanFaaliyetRaporlari}
                    raporUrls={raporUrls}
                    toggleRaporAcilimi={toggleRaporAcilimi}
                    formatFileSize={formatFileSize}
                    showAllMeydanYonetimiPersonel={showAllMeydanYonetimiPersonel}
                    initialVisibleMeydanPersonelCount={INITIAL_VISIBLE_MEYDAN_PERSONEL_COUNT}
                    onToggleShowAllMeydanYonetimiPersonel={() => setShowAllMeydanYonetimiPersonel((current) => !current)}
                  />
                ) : null}

                {activeMeydanYonetimiBolumu === 'ziyaret-formu' ? (
                  <MeydanYonetimiSection
                    forcedSection="ziyaret"
                    meydanYonetimiAciklama={MEYDAN_YONETIMI_ACIKLAMA}
                    visibleMeydanYonetimiGorevleri={visibleMeydanYonetimiGorevleri}
                    toplamMeydanYonetimiGorev={MEYDAN_YONETIMI_GOREVLER.length}
                    aboutVisibleResponsibilityCount={ABOUT_VISIBLE_RESPONSIBILITY_COUNT}
                    showAllMeydanYonetimiGorevleri={showAllMeydanYonetimiGorevleri}
                    onToggleShowAllMeydanYonetimiGorevleri={() => setShowAllMeydanYonetimiGorevleri((current) => !current)}
                    meydanFaaliyetRaporlari={meydanFaaliyetRaporlari}
                    raporUrls={raporUrls}
                    toggleRaporAcilimi={toggleRaporAcilimi}
                    formatFileSize={formatFileSize}
                    showAllMeydanYonetimiPersonel={showAllMeydanYonetimiPersonel}
                    initialVisibleMeydanPersonelCount={INITIAL_VISIBLE_MEYDAN_PERSONEL_COUNT}
                    onToggleShowAllMeydanYonetimiPersonel={() => setShowAllMeydanYonetimiPersonel((current) => !current)}
                  />
                ) : null}

                {activeMeydanYonetimiBolumu === 'faaliyet-raporlari' ? (
                  <MeydanYonetimiSection
                    forcedSection="reports"
                    meydanYonetimiAciklama={MEYDAN_YONETIMI_ACIKLAMA}
                    visibleMeydanYonetimiGorevleri={visibleMeydanYonetimiGorevleri}
                    toplamMeydanYonetimiGorev={MEYDAN_YONETIMI_GOREVLER.length}
                    aboutVisibleResponsibilityCount={ABOUT_VISIBLE_RESPONSIBILITY_COUNT}
                    showAllMeydanYonetimiGorevleri={showAllMeydanYonetimiGorevleri}
                    onToggleShowAllMeydanYonetimiGorevleri={() => setShowAllMeydanYonetimiGorevleri((current) => !current)}
                    meydanFaaliyetRaporlari={meydanFaaliyetRaporlari}
                    raporUrls={raporUrls}
                    toggleRaporAcilimi={toggleRaporAcilimi}
                    formatFileSize={formatFileSize}
                    showAllMeydanYonetimiPersonel={showAllMeydanYonetimiPersonel}
                    initialVisibleMeydanPersonelCount={INITIAL_VISIBLE_MEYDAN_PERSONEL_COUNT}
                    onToggleShowAllMeydanYonetimiPersonel={() => setShowAllMeydanYonetimiPersonel((current) => !current)}
                  />
                ) : null}

                {activeMeydanYonetimiBolumu === 'personel-listesi' ? (
                  <MeydanYonetimiSection
                    forcedSection="personel"
                    meydanYonetimiAciklama={MEYDAN_YONETIMI_ACIKLAMA}
                    visibleMeydanYonetimiGorevleri={visibleMeydanYonetimiGorevleri}
                    toplamMeydanYonetimiGorev={MEYDAN_YONETIMI_GOREVLER.length}
                    aboutVisibleResponsibilityCount={ABOUT_VISIBLE_RESPONSIBILITY_COUNT}
                    showAllMeydanYonetimiGorevleri={showAllMeydanYonetimiGorevleri}
                    onToggleShowAllMeydanYonetimiGorevleri={() => setShowAllMeydanYonetimiGorevleri((current) => !current)}
                    meydanFaaliyetRaporlari={meydanFaaliyetRaporlari}
                    raporUrls={raporUrls}
                    toggleRaporAcilimi={toggleRaporAcilimi}
                    formatFileSize={formatFileSize}
                    showAllMeydanYonetimiPersonel={showAllMeydanYonetimiPersonel}
                    initialVisibleMeydanPersonelCount={INITIAL_VISIBLE_MEYDAN_PERSONEL_COUNT}
                    onToggleShowAllMeydanYonetimiPersonel={() => setShowAllMeydanYonetimiPersonel((current) => !current)}
                  />
                ) : null}

                {activeMeydanYonetimiBolumu === 'kronik-sorunlar' ? (
                  <KronikSorunlarSection
                    loading={loading}
                    kronikLoadError={kronikLoadError}
                    kronikSorunlar={kronikSorunlar}
                    visibleKronikSorunlar={visibleKronikSorunlar}
                    showAllKronik={showAllKronik}
                    initialVisibleCount={INITIAL_VISIBLE_KRONIK_COUNT}
                    previewLimit={KRONIK_PREVIEW_LIMIT}
                    truncateText={truncateText}
                    onOpenKronikModal={setActiveKronikModalId}
                    onToggleShowAll={() => setShowAllKronik((current) => !current)}
                  />
                ) : null}
              </div>
            </section>
          </SectionToggleBar>

          <SectionToggleBar itemKey="ai-icgoru" isOpen={openSections.has('ai-icgoru')} onToggle={toggleSection}>
            <OperationalInsightsSection insights={operationalInsights} loading={insightsLoading} />
          </SectionToggleBar>

          <SectionLinkBar
            itemKey="istanbul-icin-calisiyoruz"
            href="https://istanbul.ekremimamoglu.com/"
          />

          <SectionLinkBar
            itemKey="ibb-bilgi-hizmetleri"
            href="https://ibb.istanbul/tum-hizmetler/bilgi-hizmetleri"
          />

          <SectionToggleBar itemKey="veri-yonetimi" isOpen={openSections.has('veri-yonetimi')} onToggle={toggleSection}>
            <DataManagementSection
          adminUnlocked={adminUnlocked}
          adminPasswordInput={adminPasswordInput}
          adminPasswordError={adminPasswordError}
          onAdminPasswordChange={(e) => { setAdminPasswordInput(e.target.value); setAdminPasswordError(false); }}
          onAdminUnlock={handleAdminUnlock}
          uploading={uploading}
          uploadingKronik={uploadingKronik}
          progress={progress}
          uploadPercent={uploadPercent}
          ExcelUpload={ExcelUpload}
          LoadingUploadModule={LoadingUploadModule}
          handleExcelUpload={handleExcelUpload}
          handleKronikUpload={handleKronikUpload}
          raporBaslik={raporBaslik}
          setRaporBaslik={setRaporBaslik}
          uploadingRapor={uploadingRapor}
          handleUploadMeydanRaporu={handleUploadMeydanRaporu}
          meydanFaaliyetRaporlari={meydanFaaliyetRaporlari}
          raporUrls={raporUrls}
          toggleRaporAcilimi={toggleRaporAcilimi}
          formatFileSize={formatFileSize}
          handleRemoveMeydanRaporu={handleRemoveMeydanRaporu}
          handleDeleteAll={handleDeleteAll}
          lastImportSummary={lastImportSummary}
          kronikSorunlar={kronikSorunlar}
          visibleAdminKronikSorunlar={visibleAdminKronikSorunlar}
          getKronikDraft={getKronikDraft}
          kronikSavingId={kronikSavingId}
          expandedAdminKronikId={expandedAdminKronikId}
          setExpandedAdminKronikId={setExpandedAdminKronikId}
          handleKronikFieldChange={handleKronikFieldChange}
          handleAddDetailRow={handleAddDetailRow}
          handleKronikDetailChange={handleKronikDetailChange}
          handleRemoveDetailRow={handleRemoveDetailRow}
          handleSaveKronik={handleSaveKronik}
          handleDeleteKronik={handleDeleteKronik}
          showAllAdminKronik={showAllAdminKronik}
          setShowAllAdminKronik={setShowAllAdminKronik}
          initialVisibleAdminKronikCount={INITIAL_VISIBLE_ADMIN_KRONIK_COUNT}
          recentShifts={recentShifts}
          visibleShiftsCount={visibleShiftsCount}
          setVisibleShiftsCount={setVisibleShiftsCount}
          meydanMap={meydanMap}
              handleDeleteShift={handleDeleteShift}
            />
          </SectionToggleBar>
        </div>
      </main>
    </div>
  );
}
