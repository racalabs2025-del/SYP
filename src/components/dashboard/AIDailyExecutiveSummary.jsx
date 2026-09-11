import { useState } from 'react';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';
import { buildDailySummary } from '../../utils/dailySummary';
import { fetchPanelAI } from '../../service/aiClient';
import DataFreshnessNotice from '../shared/DataFreshnessNotice';

export default function AIDailyExecutiveSummary({
  todayShifts = [],
  shiftDate = '',
  activeMeydanCount = 0,
  dataQualityIssuesCount = 0,
  kronikSorunlarCount = 0,
}) {
  const [loading, setLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    setErrorMsg('');

    const summary = buildDailySummary({ todayShifts, activeMeydanCount, executiveData: compiledExecutiveData, shiftDate, dataQualityIssuesCount, kronikSorunlarCount });
    try {
      const response = await fetchPanelAI({
        method: 'POST',
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Verilen kayıt özetini Türkçe, kısa ve tarafsız bir yönetici bülteni olarak düzenle. Yalnızca verilen verileri kullan. Veri tarihlerini ve güncellik uyarılarını koru. Vardiya planını sahada bulunma kanıtı olarak sunma. Eksik veriden başarı, çözüm oranı veya risk yokluğu çıkarma. KRİTİK GRANÜLERLİK KURALI: Başvuru, SLA ve kritik iş verileri İLÇE seviyesindedir; vardiya kayıtları fiziksel meydan seviyesindedir. İlçe istatistiğini tek bir meydana atfetme.' },
            { role: 'user', content: summary.text },
          ],
          temperature: 0.2,
        }),
      });
      if (!response.ok) throw new Error('Akıllı servis yanıt vermedi.');
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;
      if (!reply) throw new Error('Bülten boş döndü.');
      setSummaryText(reply);
    } catch {
      setSummaryText(summary.text);
      setErrorMsg('Akıllı servis kullanılamadı. Kayıtlardan hesaplanan özet gösteriliyor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!summaryText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="ai-executive-summary-card">
      <DataFreshnessNotice executiveData={compiledExecutiveData} shiftDate={shiftDate} />
      <div className="ai-summary-header">
        <div className="ai-title-group">
          <span className="ai-badge">⚡ AKILLI BRİFİNG</span>
          <h3>Günlük Akıllı Yönetici Bülteni</h3>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-ai-generate"
          onClick={generateSummary}
          disabled={loading}
        >
          {loading ? '⚡ Akıllı Bülten Hazırlanıyor...' : '✨ Günlük Akıllı Bülten Üret'}
        </button>
      </div>

      {errorMsg ? <div className="message message-error">{errorMsg}</div> : null}

      {summaryText ? (
        <div className="ai-summary-body">
          <div className="ai-text-content">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.86rem', lineHeight: '1.55' }}>
              {summaryText}
            </pre>
          </div>
          <div className="ai-summary-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? '✓ Kopyalandı' : '📋 Metni Kopyala'}
            </button>
            <button type="button" className="btn btn-success btn-sm" onClick={handleWhatsAppShare}>
              💬 WhatsApp'ta Paylaş
            </button>
          </div>
        </div>
      ) : (
        <div className="ai-summary-placeholder">
          <p>
            Meydanlardaki personel dağılımı, saha koordinasyon gücü ve günlük operasyonel başarılar analiz edilerek üst yönetim için anlık akıllı yönetici bülteni oluşturulur.
          </p>
        </div>
      )}
    </div>
  );
}
