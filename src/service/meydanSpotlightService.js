const DEEPSEEK_PROXY_ENDPOINT = '/api/deepseek';

function trimText(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function buildSearchUrl(meydan) {
  const query = `${meydan?.isim || meydan?.tamAd || 'meydan'} hakkında bilgi`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function createFallbackSpotlight(meydan, weather) {
  const weatherLine = weather?.current?.description
    ? `${weather.current.description} ve ${Math.round(Number(weather.current.temp) || 0)}° ile izleniyor.`
    : 'güncel saha görünümüyle izleniyor.';

  return {
    title: trimText(meydan?.isim || 'Meydan Notu', 26),
    summary: trimText(`${meydan?.isim || 'Bu meydan'}, gün içi operasyon akışının izlendiği aktif bir kamusal alan olarak öne çıkıyor; detaylı bilgi için arama sonuçlarını inceleyin. Şu an ${weatherLine}`, 140),
    badge: 'Google’da incele',
    searchUrl: buildSearchUrl(meydan),
  };
}

async function generateDeepSeekSpotlight(meydan, weather, signal) {
  const exactName = String(meydan?.isim || '').trim();
  const fullName = String(meydan?.tamAd || '').trim();
  const weatherText = weather?.current
    ? `Anlık hava: ${weather.current.description || 'bilinmiyor'}, ${Math.round(Number(weather.current.temp) || 0)} derece.`
    : 'Anlık hava bilgisi yok.';

  const payload = {
    model: 'deepseek-chat',
    temperature: 0.2,
    max_tokens: 220,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Sen mobil arayuz icin kisa kart metni yazan bir asistansin. Sadece JSON don. Format: {"title":"...","summary":"...","badge":"..."}. title en fazla 26 karakter, summary en fazla 140 karakter, badge en fazla 22 karakter olsun. SADECE verilen meydan adina odaklan. Baska meydan, mahalle, belde, semt, ilce veya tarihsel yer adi uydurma. Emin degilsen genel ve temkinli yaz. Google AI Bakis tonuna yakin, kisa ve acik bir ozet uret.',
      },
      {
        role: 'user',
        content: `Exact meydan adı: ${exactName || 'Bilinmiyor'}\nTam meydan adı: ${fullName || 'Yok'}\n${weatherText}\nBu kart için sadece bu meydanı anlatan, yanlış yere sapmayan, kısa bir özet üret. Başlıkta ve özette exact meydan adından farklı yeni bir yer adı kullanma.`,
      },
    ],
  };

  const response = await fetch(DEEPSEEK_PROXY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider: 'deepseek', payload }),
    signal,
  });

  if (!response.ok) {
    throw new Error('DeepSeek spotlight istegi basarisiz oldu.');
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || data?.data?.choices?.[0]?.message?.content || '';
  const jsonMatch = String(content).match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('DeepSeek spotlight JSON donmedi.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: trimText(parsed?.title || exactName || 'Meydan Notu', 26),
    summary: trimText(parsed?.summary || '', 140),
    badge: trimText(parsed?.badge || 'Google’da incele', 22),
    searchUrl: buildSearchUrl(meydan),
  };
}

export async function fetchMeydanSpotlight({ meydan, weather, signal }) {
  try {
    const spotlight = await generateDeepSeekSpotlight(meydan, weather, signal);
    if (!spotlight?.summary) {
      return createFallbackSpotlight(meydan, weather);
    }
    return spotlight;
  } catch {
    return createFallbackSpotlight(meydan, weather);
  }
}
