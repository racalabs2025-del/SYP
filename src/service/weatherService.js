function toWeatherErrorMessage(error) {
  if (error?.name === 'AbortError') {
    return 'İstek iptal edildi.';
  }

  return error?.message || 'Hava verisi alınamadı.';
}

export async function fetchMeydanWeather({ lat, lon, queryText, signal }) {
  const search = new URLSearchParams();

  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
    search.set('lat', String(lat));
    search.set('lon', String(lon));
  } else if (String(queryText || '').trim()) {
    search.set('q', String(queryText).trim());
  } else {
    throw new Error('Konum bilgisi eksik.');
  }

  const response = await fetch(`/api/weather?${search.toString()}`, {
    method: 'GET',
    signal,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.detail || 'Hava verisi alınamadı.');
  }

  return {
    current: payload?.current || null,
    hourly: Array.isArray(payload?.hourly) ? payload.hourly : [],
    coordinates: payload?.coordinates || null,
    source: payload?.source || 'live',
    cachedAt: payload?.cachedAt || null,
    expiresAt: payload?.expiresAt || null,
  };
}

export { toWeatherErrorMessage };
