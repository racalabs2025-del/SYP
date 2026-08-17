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
      let aiReply = '';
      let lastErrorMessage = '';

      // 1. Try relative proxy path first (Vercel Serverless Function or local proxy)
      try {
        const proxyRes = await fetch('/api/deepseek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: userPrompt }],
            temperature: 0.7,
          }),
        });

        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          aiReply = proxyData.choices?.[0]?.message?.content || proxyData.content || proxyData.reply || '';
        } else {
          const errData = await proxyRes.json().catch(() => ({}));
          lastErrorMessage = errData.error || errData.message || `Proxy hatası (${proxyRes.status})`;
        }
      } catch (proxyErr) {
        console.warn('Proxy fetch failed, checking direct fallback...', proxyErr);
        lastErrorMessage = proxyErr.message;
      }

      // 2. If proxy did not provide a reply, try direct client-side fallback if key exists
      if (!aiReply) {
        const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        if (apiKey) {
          const directRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{ role: 'user', content: userPrompt }],
              temperature: 0.7,
            }),
          });

          if (directRes.ok) {
            const data = await directRes.json();
            aiReply = data.choices?.[0]?.message?.content || data.content || data.reply || '';
          } else {
            const errText = await directRes.text().catch(() => '');
            throw new Error(`Doğrudan DeepSeek API yanıt vermedi (${directRes.status}): ${errText.slice(0, 100)}`);
          }
        } else if (lastErrorMessage) {
          throw new Error(lastErrorMessage);
        } else {
          throw new Error('DeepSeek API Anahtarı bulunamadı (Vercel ortam değişkenlerine DEEPSEEK_API_KEY veya VITE_DEEPSEEK_API_KEY eklenmelidir).');
        }
      }

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
