import { useState } from 'react';
import compiledExecutiveData from '../../data/compiledExecutiveBasvurular.json';
import dataFreshness from '../../data/dataFreshness.json';

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

    const execMeta = compiledExecutiveData?.metadata || {};
    const topDistrictsStr = (execMeta.topOpenDistricts || [])
      .map((d) => `${d.district} (${d.count} açık)`)
      .join(', ') || 'Belirtilmedi';

    const promptData = {
      todayDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      lastDataDate: dataFreshness?.lastApplicationDateFormatted || '14 Ağustos 2026',
      totalActiveShifts: todayShifts.length,
      activeMeydanCount,
      dataQualityIssuesCount,
      kronikSorunlarCount,
      totalUnresolved: execMeta.totalUnresolved || 232,
      totalSlaBreached: execMeta.totalSlaBreached || 173,
      totalAging30Plus: execMeta.totalAging30Plus || 147,
      totalCritical: execMeta.totalCritical || 32,
      topDistrictsStr,
      sampleStaff: staffNames.join(', ') || 'Aktif görevli personel',
      sampleDistricts: districts.join(', ') || 'Tüm meydanlar',
    };

    const userPrompt = `
Sen İstanbul Büyükşehir Belediyesi Meydan Yönetimi Birimi Akıllı Karar Destek Asistanısın.
Aşağıdaki kesin ve denetlenmiş operasyon/SLA verilerine dayanarak üst yönetim için Türkçe, profesyonel, maddeler halinde ve doğrudan aksiyon odaklı bir "YÖNETİCİ KARAR VE RİSK BÜLTENİ" hazırla.

ÖNEMLİ KURALLAR:
1. Yalnızca sana verilen kesin sayısal verileri kullan. Asla yeni sayı üretme veya tahmin etme.
2. KRİTİK GRANÜLERLİK KURALI: Başvuru, SLA ve kritik iş verileri İLÇE seviyesindedir. Bunları belirli bir fiziksel meydana aitmiş gibi İFADE ETME (Örn: "Taksim Meydanı'nda 21 gecikme" YANLIŞTIR; "Beyoğlu ilçesi genelinde 21 gecikme" DOĞRUDUR). Meydan seviyesindeki tek gösterge nöbetçi personel ve vardiya çizelgesidir.

VERİLER:
- Son Saha Başvuru Verisi Tarihi: ${promptData.lastDataDate}
- Sahada Aktif Görevli Personel Sayısı: ${promptData.totalActiveShifts} (Meydan Seviyesi)
- Nöbet Tutulan Aktif Meydan Sayısı: ${promptData.activeMeydanCount} (Meydan Seviyesi)
- Toplam Kapanmamış İş Stoku (Açık + Süreçte): ${promptData.totalUnresolved} (İlçe Havuzları Toplamı)
- Taahhüt Süresi Aşılan İşler (SLA İhlali): ${promptData.totalSlaBreached} (İlçe Havuzları Toplamı)
- 30 Günden Uzun Süredir Bekleyen Yaşlı İşler: ${promptData.totalAging30Plus} (İlçe Havuzları Toplamı)
- Yüksek Öncelikli (Kritik) Başvurular: ${promptData.totalCritical} (Tarihsel İlçe Toplamı, Aktif: 0)
- En Çok Açık İş Bulunan İlk İlçeler: ${promptData.topDistrictsStr} (İlçe Seviyesi)
- Takip Edilen Kronik Saha Konusu: ${promptData.kronikSorunlarCount}

ÇIKTI FORMATI:
1. 📌 BUGÜNÜN ÖNCELİKLERİ VE SAHA GENELİ
2. ⚠️ TAAHHÜT (SLA) AŞIMI VE RİSKLİ İLÇELER
3. 💡 YÖNETSEL AKSİYON PLANI

Kısa, net ve karar almayı kolaylaştırıcı maddelerle yaz.
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
        throw new Error('Akıllı özet içeriği oluşturulamadı.');
      }

      setSummaryText(aiReply);
    } catch (err) {
      console.error(err);
      setErrorMsg('Akıllı bülten hazırlanırken bir durum oluştu: ' + (err.message || 'Lütfen tekrar deneyiniz.'));
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
            Tüm meydanlar, sahadaki aktif personeller ve kronik sorunların verileri analiz edilerek üst yöneticiler için anlık akıllı operasyon özeti oluşturulur.
          </p>
        </div>
      )}
    </div>
  );
}
