export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENWEATHER_API_KEY tanımlı değil.' });
  }

  try {
    const { lat, lon, q } = req.query || {};
    let targetLat = lat ? Number(lat) : null;
    let targetLon = lon ? Number(lon) : null;

    if ((targetLat === null || targetLon === null) && q) {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (Array.isArray(geoData) && geoData.length > 0) {
        targetLat = Number(geoData[0].lat);
        targetLon = Number(geoData[0].lon);
      } else {
        return res.status(404).json({ error: 'Konum bulunamadı' });
      }
    }

    if (targetLat === null || targetLon === null || Number.isNaN(targetLat) || Number.isNaN(targetLon)) {
      return res.status(400).json({ error: 'Geçerli lat/lon veya q parametresi gerekli' });
    }

    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${targetLat}&lon=${targetLon}&units=metric&lang=tr&appid=${apiKey}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${targetLat}&lon=${targetLon}&units=metric&lang=tr&cnt=8&appid=${apiKey}`
      ),
    ]);

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    const hourly = (forecast.list || []).slice(0, 4);

    return res.status(200).json({
      current: {
        dt: current.dt || 0,
        temp: current.main?.temp ?? null,
        feelsLike: current.main?.feels_like ?? null,
        humidity: current.main?.humidity ?? null,
        windSpeed: current.wind?.speed ?? null,
        description: current.weather?.[0]?.description || '',
        icon: current.weather?.[0]?.icon || '',
      },
      hourly: hourly.map((item) => ({
        dt: item.dt || 0,
        temp: item.main?.temp ?? null,
        pop: item.pop ?? null,
        icon: item.weather?.[0]?.icon || '',
        description: item.weather?.[0]?.description || '',
      })),
      coordinates: { lat: targetLat, lon: targetLon },
      source: 'live',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Hava durumu servisi hatası', detail: err.message });
  }
}
