import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '../../shared/firebaseConfig';
import { normalizeMeydanInput } from '../../utils/meydanNormalization';

const BATCH_LIMIT = 400;

const SKIP_TOKENS = new Set([
  'ht', 'h t', 'yi', 'mi', 'r', 'rt', 'off', 'izin', 'izinli',
  'rapor', 'ofis', '-', '', 'cozum noktasi',
]);

function isSkipValue(val) {
  if (!val || typeof val !== 'string') return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
  if (SKIP_TOKENS.has(lower)) return true;
  if (trimmed.length <= 2) return true;
  if (lower.startsWith('cozum')) return true;
  return false;
}

function excelSerialToIsoDate(serial) {
  if (typeof serial === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(serial.trim())) {
    return serial.trim();
  }
  const num = Number(serial);
  if (isNaN(num) || num <= 0) return null;
  const utcDays = Math.floor(num - 25569);
  const utcValue = utcDays * 86400;
  const dateObj = new Date(utcValue * 1000);
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function splitIntoChunks(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function detectShiftHours(cellValue) {
  const upper = String(cellValue || '').toUpperCase();
  if (upper.includes('AKŞAM') || upper.includes('AKSAM')) {
    return '11:30-20:00';
  }
  if (upper.includes('SABAH')) {
    return '08:30-17:00';
  }
  return '10:00-18:30';
}

function extractMeydanIds(cellValue) {
  if (!cellValue || typeof cellValue !== 'string') return [];
  const cleaned = cellValue
    .replace(/\(TAM GÜN\)/gi, '')
    .replace(/\(TAMGÜN\)/gi, '')
    .replace(/\(SABAH\)/gi, '')
    .replace(/\(AKŞAM\)/gi, '')
    .replace(/\(AKSAM\)/gi, '')
    .trim();
  if (!cleaned) return [];
  const fullNorm = normalizeMeydanInput({ tamAd: cleaned, kisaAd: cleaned, isim: cleaned });
  if (fullNorm.valid) return [fullNorm.id];

  const parts = cleaned.split(/[-,\n]/).map((s) => s.trim()).filter(Boolean);
  const ids = new Set();
  for (const part of parts) {
    if (isSkipValue(part)) continue;
    const norm = normalizeMeydanInput({ tamAd: part, kisaAd: part, isim: part });
    if (norm.valid) ids.add(norm.id);
  }
  return Array.from(ids);
}

export default function ExcelWizardModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [formatType, setFormatType] = useState('monthly'); // 'monthly' | 'weekly'
  const [parsedShifts, setParsedShifts] = useState([]);
  const [unresolvedCells, setUnresolvedCells] = useState([]);
  const [isResolvingAI, setIsResolvingAI] = useState(false);
  const [aiResolvedCount, setAiResolvedCount] = useState(0);
  const [parseStats, setParseStats] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setStatusMsg('Excel okunuyor...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        setWorkbook(wb);
        setSelectedSheets(wb.SheetNames);
        setStatusMsg('');
        setStep(2);
      } catch (err) {
        console.error(err);
        setStatusMsg('Excel okuma hatası: ' + err.message);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleToggleSheet = (sn) => {
    if (selectedSheets.includes(sn)) {
      setSelectedSheets(selectedSheets.filter((s) => s !== sn));
    } else {
      setSelectedSheets([...selectedSheets, sn]);
    }
  };

  const handleParseAndSimulate = () => {
    if (!workbook || selectedSheets.length === 0) return;

    setStatusMsg('Veriler ayrıştırılıyor...');
    const shiftList = [];
    const unmatchedList = [];
    const seenKeys = new Set();
    let totalCells = 0;
    let skippedCells = 0;
    let totalPersonnel = 0;

    for (const sheetName of selectedSheets) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      if (rows.length < 2) continue;

      if (formatType === 'weekly') {
        let currentPersonel = '';
        let currentTelefon = '';
        let currentBolge = '';

        for (let i = 2; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r[0] === undefined || r[0] === null) continue;
          if (r[1] && String(r[1]).trim()) {
            currentPersonel = String(r[1]).trim();
            currentTelefon = String(r[2] || '').trim();
            currentBolge = String(r[3] || '').trim();
          }

          const isoTarih = excelSerialToIsoDate(r[0]);
          if (!isoTarih || !currentPersonel) continue;
          const lokasyonRaw = String(r[4] || '').trim();
          if (isSkipValue(lokasyonRaw)) continue;

          const meydanIds = extractMeydanIds(lokasyonRaw);
          if (meydanIds.length === 0) {
            unmatchedList.push({ personelAdi: currentPersonel, isoDate: isoTarih, cellStr: lokasyonRaw, saatAraligi: '09:00-17:00' });
            continue;
          }

          for (const mId of meydanIds) {
            const key = `${currentPersonel}_${isoTarih}_${mId}`;
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);

            shiftList.push({
              personelAdi: currentPersonel,
              telefon: currentTelefon,
              bolge: currentBolge,
              meydanId: mId,
              tarih: isoTarih,
              saatAraligi: '09:00-17:00',
              vardiyaTipi: 'Gunduz',
              lokasyonRaw,
            });
          }
        }
      } else {
        // Monthly calendar format
        const dateRow = rows[0] || [];
        const headerRow = rows[1] || [];

        let nameColIdx = 1;
        let firstDateColIdx = 2;

        for (let c = 0; c < headerRow.length; c++) {
          const hdr = String(headerRow[c] || '').trim().toUpperCase();
          if (hdr.includes('ADI') || hdr.includes('SOYADI') || hdr.includes('ISIM')) {
            nameColIdx = c;
            firstDateColIdx = c + 1;
            break;
          }
        }

        const colDateMap = new Map();
        for (let c = firstDateColIdx; c < dateRow.length; c++) {
          const serial = dateRow[c];
          if (serial === null || serial === undefined) continue;
          const isoDate = excelSerialToIsoDate(serial);
          if (isoDate) colDateMap.set(c, isoDate);
        }

        for (let rIdx = 2; rIdx < rows.length; rIdx++) {
          const row = rows[rIdx];
          if (!row) continue;
          const personelAdi = String(row[nameColIdx] || '').trim();
          if (!personelAdi || personelAdi.length < 3) continue;
          if (personelAdi.toUpperCase().includes('SABAH') || personelAdi.toUpperCase().includes('TAM GÜN')) continue;

          totalPersonnel++;

          for (const [colIdx, isoDate] of colDateMap) {
            const cellVal = row[colIdx];
            if (cellVal === null || cellVal === undefined) continue;
            const cellStr = String(cellVal).trim();
            totalCells++;

            if (isSkipValue(cellStr)) {
              skippedCells++;
              continue;
            }

            const meydanIds = extractMeydanIds(cellStr);
            const saatAraligi = detectShiftHours(cellStr);

            if (meydanIds.length === 0) {
              unmatchedList.push({ personelAdi, isoDate, cellStr, saatAraligi });
              continue;
            }

            for (const mId of meydanIds) {
              const key = `${personelAdi}_${isoDate}_${mId}`;
              if (seenKeys.has(key)) continue;
              seenKeys.add(key);

              shiftList.push({
                personelAdi,
                meydanId: mId,
                tarih: isoDate,
                saatAraligi,
                vardiyaTipi: 'Gunduz',
                lokasyonRaw: cellStr,
              });
            }
          }
        }
      }
    }

    setParsedShifts(shiftList);
    setUnresolvedCells(unmatchedList);
    setAiResolvedCount(0);
    setParseStats({
      totalSheets: selectedSheets.length,
      totalPersonnel,
      totalCells,
      skippedCells,
      totalShifts: shiftList.length,
      unresolvedCount: unmatchedList.length,
    });
    setStatusMsg('');
    setStep(3);
  };

  const handleResolveUnmatchedWithAI = async () => {
    if (unresolvedCells.length === 0) return;

    setIsResolvingAI(true);
    setStatusMsg('🤖 DeepSeek AI tanınmayan lokasyonları analiz ediyor...');

    const uniqueStrings = Array.from(new Set(unresolvedCells.map((u) => u.cellStr))).slice(0, 20);

    const prompt = `
Aşağıda Excel dosyasından gelen kural dışı / tanınmayan İstanbul saha ve meydan konum metinleri yer alıyor.
Bu metinleri incele ve her birini aşağıdaki bilinen meydan ID'lerinden en uygun olanına eşleştir:
Geçerli Meydan ID'leri: ["kadikoy", "uskudar", "fatih", "besiktas", "taksim", "sisli", "bakirkoy", "bahcelievler", "zeytinburnu", "eyupsultan", "sariyer", "umraniye", "maltepe", "kartal", "pendik", "beykoz", "cekmekoy", "sancaktepe", "sultanbeyli", "tuzla", "sile", "silivri", "avcilar", "beylikduzu", "buyukcekmece", "esenler", "bagcilar"]

Eşleştirilmesi Gereken Metinler:
${JSON.stringify(uniqueStrings)}

YALNIZCA geçerli bir JSON nesnesi döndür (Format: {"Metin": "meydanId"}). Başka hiçbir açıklama yazma.
`;

    try {
      const res = await fetch('http://127.0.0.1:8787/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) throw new Error('AI proxy sunucusu yanıt vermedi.');
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || data.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI geçerli bir eşleştirme formatı oluşturamadı.');

      const mapping = JSON.parse(jsonMatch[0]);

      let newlyAdded = 0;
      const updatedShifts = [...parsedShifts];
      const remainingUnresolved = [];

      unresolvedCells.forEach((item) => {
        const resolvedId = mapping[item.cellStr];
        if (resolvedId) {
          updatedShifts.push({
            personelAdi: item.personelAdi,
            meydanId: resolvedId,
            tarih: item.isoDate,
            saatAraligi: item.saatAraligi,
            vardiyaTipi: 'Gunduz',
            lokasyonRaw: `${item.cellStr} (AI-Çözüldü)`,
            aiResolved: true,
          });
          newlyAdded++;
        } else {
          remainingUnresolved.push(item);
        }
      });

      setParsedShifts(updatedShifts);
      setUnresolvedCells(remainingUnresolved);
      setAiResolvedCount((prev) => prev + newlyAdded);
      setStatusMsg(`✨ DeepSeek AI ile ${newlyAdded} adet tanınmayan lokasyon başarıyla çözüldü!`);
    } catch (err) {
      console.error(err);
      setStatusMsg('AI Çözüm hatası: ' + err.message);
    } finally {
      setIsResolvingAI(false);
    }
  };

  const handleConfirmAndUpload = async () => {
    if (parsedShifts.length === 0) return;

    setIsUploading(true);
    setUploadPercent(0);
    setStatusMsg("Firestore'a aktarılıyor...");

    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      await signInAnonymously(auth);

      const existingSnap = await getDocs(collection(db, 'vardiyalar'));
      const existingKeys = new Set();
      existingSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.personelAdi && data.tarih && data.meydanId) {
          existingKeys.add(`${data.personelAdi}_${data.tarih}_${data.meydanId}`);
        }
      });

      const newShifts = parsedShifts.filter((s) => {
        const key = `${s.personelAdi}_${s.tarih}_${s.meydanId}`;
        return !existingKeys.has(key);
      });

      if (newShifts.length === 0) {
        setStatusMsg('Tüm kayıtlar zaten veritabanında mevcut.');
        setIsUploading(false);
        return;
      }

      const chunks = splitIntoChunks(newShifts, BATCH_LIMIT);
      let written = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const batch = writeBatch(db);

        for (const shift of chunk) {
          batch.set(doc(collection(db, 'vardiyalar')), {
            ...shift,
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();
        written += chunk.length;
        const pct = Math.round((written / newShifts.length) * 100);
        setUploadPercent(pct);
      }

      setStatusMsg(`Tamamlandı! ${written} yeni vardiya kaydı başarıyla eklendi.`);
      setStep(4);
      if (onSuccess) onSuccess(written);
    } catch (err) {
      console.error(err);
      setStatusMsg('Aktarım hatası: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card excel-wizard-modal">
        <div className="modal-header">
          <div>
            <span className="section-kicker">Veri Aktarım Sihirbazı</span>
            <h3>Aylık & Haftalık Excel Yükleme</h3>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Kapat">×</button>
        </div>

        <div className="excel-wizard-steps">
          <div className={`wizard-step-pill ${step >= 1 ? 'is-active' : ''}`}>1. Dosya Seçimi</div>
          <div className={`wizard-step-pill ${step >= 2 ? 'is-active' : ''}`}>2. Şablon & Sayfalar</div>
          <div className={`wizard-step-pill ${step >= 3 ? 'is-active' : ''}`}>3. Simülasyon Önizleme</div>
          <div className={`wizard-step-pill ${step >= 4 ? 'is-active' : ''}`}>4. Sonuç</div>
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <div className="wizard-step-content">
              <p>Lütfen yüklemek istediğiniz Excel dosyasını (.xlsx) seçin.</p>
              <div className="file-drop-area">
                <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} id="wizard-file-input" />
                <label htmlFor="wizard-file-input" className="btn btn-secondary">
                  📁 Excel Dosyası Seç
                </label>
                {file ? <div className="selected-file-name">{file.name}</div> : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="wizard-step-content">
              <label className="wizard-form-group">
                <strong>Format Tipi:</strong>
                <select value={formatType} onChange={(e) => setFormatType(e.target.value)} className="wizard-select">
                  <option value="monthly">Aylık Takvim Formatı (Sütunlar = Günler)</option>
                  <option value="weekly">Haftalık Program Formatı (Satırlar = Günler)</option>
                </select>
              </label>

              <div className="wizard-form-group">
                <strong>İşlenecek Çalışma Sayfaları (Sheets):</strong>
                <div className="wizard-sheet-grid">
                  {workbook?.SheetNames.map((sn) => (
                    <label key={sn} className="wizard-sheet-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSheets.includes(sn)}
                        onChange={() => handleToggleSheet(sn)}
                      />
                      <span>{sn}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="wizard-step-content">
              <div className="wizard-stats-grid">
                <div className="stat-box">
                  <span className="stat-label">Toplam Sayfa</span>
                  <span className="stat-val">{parseStats?.totalSheets}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Personel Sayısı</span>
                  <span className="stat-val">{parseStats?.totalPersonnel}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Bulunan Vardiya</span>
                  <span className="stat-val stat-val--highlight">{parseStats?.totalShifts}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Atlanan İzin/HT Satırı</span>
                  <span className="stat-val">{parseStats?.skippedCells}</span>
                </div>
              </div>

              {unresolvedCells.length > 0 ? (
                <div className="ai-hybrid-alert-box" style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#d48806', fontSize: '0.9rem' }}>⚠️ {unresolvedCells.length} adet tanınmayan veya kural dışı lokasyon bulundu</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#8c8c8c' }}>
                        Standart kurallar ile eşleşmeyen bu hücreleri DeepSeek yapay zekası ile otomatik çözümleyebilirsiniz.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handleResolveUnmatchedWithAI}
                      disabled={isResolvingAI}
                      style={{ background: '#faad14', color: '#fff', border: 'none', fontWeight: '700' }}
                    >
                      {isResolvingAI ? '🤖 DeepSeek Çözümlüyor...' : `🤖 DeepSeek AI ile Çöz (${unresolvedCells.length})`}
                    </button>
                  </div>
                </div>
              ) : null}

              {aiResolvedCount > 0 ? (
                <div className="ai-success-banner" style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', color: '#389e0d', fontSize: '0.85rem', fontWeight: '600' }}>
                  ✓ {aiResolvedCount} adet tanınmayan lokasyon DeepSeek AI tarafından başarıyla eşleştirildi ve vardiyaya eklendi!
                </div>
              ) : null}

              {parsedShifts.length > 0 ? (
                <div className="wizard-preview-table-wrap">
                  <table className="wizard-preview-table">
                    <thead>
                      <tr>
                        <th>Personel</th>
                        <th>Tarih</th>
                        <th>Meydan ID</th>
                        <th>Saat Aralığı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedShifts.slice(0, 8).map((s, idx) => (
                        <tr key={idx}>
                          <td>{s.personelAdi}</td>
                          <td>{s.tarih}</td>
                          <td>{s.meydanId}</td>
                          <td>{s.saatAraligi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedShifts.length > 8 ? (
                    <div className="wizard-more-note">...ve {parsedShifts.length - 8} kayıt daha</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="wizard-step-content wizard-step-success">
              <div className="success-icon">✓</div>
              <h4>Veri Aktarımı Tamamlandı!</h4>
              <p>{statusMsg}</p>
            </div>
          ) : null}

          {statusMsg && step !== 4 ? <div className="wizard-status-msg">{statusMsg}</div> : null}

          {isUploading ? (
            <div className="wizard-progress-bar-wrap">
              <div className="wizard-progress-bar" style={{ width: `${uploadPercent}%` }} />
              <span>%{uploadPercent} tamamlandı</span>
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          {step > 1 && step < 4 && !isUploading ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              Geri
            </button>
          ) : null}

          {step === 2 ? (
            <button type="button" className="btn btn-primary" onClick={handleParseAndSimulate} disabled={selectedSheets.length === 0}>
              Ayrıştır ve Önizle
            </button>
          ) : null}

          {step === 3 ? (
            <button type="button" className="btn btn-success" onClick={handleConfirmAndUpload} disabled={isUploading || parsedShifts.length === 0}>
              {isUploading ? 'Yükleniyor...' : 'Veritabanına Aktar'}
            </button>
          ) : null}

          {step === 4 ? (
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Kapat
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
