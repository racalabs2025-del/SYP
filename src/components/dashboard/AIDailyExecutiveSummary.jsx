import { useState } from 'react';

export default function AIDailyExecutiveSummary({
  todayShifts = [],
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

    // Sample top personnel/district info for prompt
    const staffNames = Array.from(new Set(todayShifts.map((s) => s.personelAdi))).slice(0, 10);
    const districts = Array.from(new Set(todayShifts.map((s) => s.meydanId))).slice(0, 8);

    const promptData = {
      todayDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      totalActiveShifts: todayShifts.length,
      activeMeydanCount,
      dataQualityIssuesCount,
      kronikSorunlarCount,
      sampleStaff: staffNames.join(', '),
      sampleDistricts: districts.join(', '),
    };

    const userPrompt = `
Sen İstanbul Büyükşehir Belediyesi Meydan Yönetimi Birimi Yapay Zeka Saha Asistanısın.
Aşağıdaki bugünkü canlı saha operasyon verilerine dayanarak üst yönetim için Türkçe, profesyonel, maddeler halinde ve aksiyon odaklı bir "GÜNLÜK SAHA OPERASYON BÜLTENİ" hazırla.

VERİLER:
- Tarih: ${promptData.todayDate}
- Sahada Aktif Görevli Personel Sayısı: ${promptData.totalActiveShifts}
- Aktif Meydan Sayısı: ${promptData.activeMeydanCount}
- Veri Kalitesi İkaz Sayısı: ${promptData.dataQualityIssuesCount}
- Takip Edilen Kronik/Önemli Saha Konusu Sayısı: ${promptData.kronikSorunlarCount}
- Nöbetçi Örnek Personeller: ${promptData.sampleStaff}
- Öne Çıkan Meydanlar: ${promptData.sampleDistricts}

ÇIKTI FORMATI:
1. 📌 GÜNÜN ÖNE ÇIKAN SAHA ÖZETİ
2. 🗺️ BÖLGESEL PERSONEL KAPSAMA VE DÜZENİ
3. 🚨 DİKKAT GEREKTİREN HUSUSLAR VE UYARILAR
4. 💡 YÖNETSEL AKSİYON VE TEDBİR TAVSİYELERİ

Kısa, öz ve yönetim sunumuna uygun formatta yaz.
`;
    try {
      let res;

      // 1. Try relative proxy path first
      try {
        res = await fetch('/api/deepseek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });
      } catch (proxyErr) {
        console.warn('Proxy fetch failed, trying direct DeepSeek API...', proxyErr);
      }

      // 2. If proxy was blocked, failed, or didn't return 200, try direct fallback
      if (!res || !res.ok) {
        const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        if (!apiKey) {
          throw new Error('DeepSeek API Anahtarı bulunamadı (VITE_DEEPSEEK_API_KEY). Lütfen proxy sunucusunu çalıştırın veya çevresel değişkenleri ayarlayın.');
        }

        res = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: userPrompt }],
            temperature: 0.7,
          }),
        });
      }

      if (!res.ok) {
        throw new Error(`Servis yanıt vermedi (${res.status})`);
      }

      const data = await res.json();
      const aiReply = data.choices?.[0]?.message?.content || data.content || data.reply || '';
      if (!aiReply) {
        throw new Error('Yapay zeka boş yanıt döndürdü.');
      }

      setSummaryText(aiReply);
    } catch (err) {
      console.error(err);
      setErrorMsg('AI bülten üretilirken bir hata oluştu: ' + err.message);
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
      <div className="ai-summary-header">
        <div className="ai-title-group">
          <span className="ai-badge">🤖 AI COPILOT</span>
          <h3>Günlük Yönetici Operasyon Bülteni</h3>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-ai-generate"
          onClick={generateSummary}
          disabled={loading}
        >
          {loading ? '⚡ DeepSeek Bülteni Hazırlıyor...' : '✨ Günlük AI Bülteni Üret'}
        </button>
      </div>

      {errorMsg ? <div className="message message-error">{errorMsg}</div> : null}

      {summaryText ? (
        <div className="ai-summary-body">
          <div className="ai-text-content">
            <pre>{summaryText}</pre>
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
            Tüm meydanlar, sahadaki aktif personeller ve kronik sorunların verileri analiz edilerek üst yöneticiler için anlık AI operasyon özeti oluşturulur.
          </p>
        </div>
      )}
    </div>
  );
}
