import http from 'http';
import { readSecret } from '../scripts/shared/env.js';

const PORT = Number(process.env.AI_PROXY_PORT || 8787);
const HOST = process.env.AI_PROXY_HOST || '127.0.0.1';
const DEEPSEEK_ENDPOINT = process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions';
const OPENWEATHER_CURRENT_ENDPOINT = process.env.OPENWEATHER_CURRENT_ENDPOINT || 'https://api.openweathermap.org/data/2.5/weather';
const OPENWEATHER_FORECAST_ENDPOINT = process.env.OPENWEATHER_FORECAST_ENDPOINT || 'https://api.openweathermap.org/data/2.5/forecast';
const OPENWEATHER_GEOCODE_ENDPOINT = process.env.OPENWEATHER_GEOCODE_ENDPOINT || 'https://api.openweathermap.org/geo/1.0/direct';
const MAX_UPSTREAM_RETRY = 3;
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
const weatherCache = new Map();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  response.end(JSON.stringify(payload));
}

function toFiniteNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCacheKey(lat, lon) {
  return `${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

function getQueryCacheKey(queryText) {
  return `q:${String(queryText || '').toLocaleLowerCase('tr-TR').trim()}`;
}

function normalizeWeatherPayload(currentPayload, forecastPayload) {
  const current = currentPayload || {};
  const currentMain = current?.main || {};
  const currentWind = current?.wind || {};
  const currentWeather = current?.weather?.[0] || {};
  const forecastList = Array.isArray(forecastPayload?.list) ? forecastPayload.list : [];
  const hourly = forecastList.slice(0, 4);

  return {
    current: {
      dt: Number(current.dt) || 0,
      temp: toFiniteNumber(currentMain.temp),
      feelsLike: toFiniteNumber(currentMain.feels_like),
      humidity: Number(currentMain.humidity) || null,
      windSpeed: toFiniteNumber(currentWind.speed),
      description: String(currentWeather.description || ''),
      icon: String(currentWeather.icon || ''),
    },
    hourly: hourly.map((item) => ({
      dt: Number(item?.dt) || 0,
      temp: toFiniteNumber(item?.main?.temp),
      pop: toFiniteNumber(item?.pop),
      icon: String(item?.weather?.[0]?.icon || ''),
      description: String(item?.weather?.[0]?.description || ''),
    })),
  };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';

    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        request.destroy();
        reject(new Error('Request body cok buyuk.'));
      }
    });

    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('JSON body parse edilemedi.'));
      }
    });

    request.on('error', reject);
  });
}

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postDeepSeekWithRetry(payload, apiKey) {
  let lastResponse = null;
  let lastText = '';

  for (let attempt = 0; attempt < MAX_UPSTREAM_RETRY; attempt += 1) {
    const upstream = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    if (upstream.ok) {
      return { upstream, text };
    }

    lastResponse = upstream;
    lastText = text;

    const shouldRetry = upstream.status === 429 || upstream.status >= 500;
    if (!shouldRetry || attempt === MAX_UPSTREAM_RETRY - 1) {
      break;
    }

    const delay = Math.min(3500, (250 * (2 ** attempt)) + Math.floor(Math.random() * 120));
    await waitFor(delay);
  }

  return { upstream: lastResponse, text: lastText };
}

async function getWithRetry(endpointBase, queryParams) {
  let lastResponse = null;
  let lastText = '';

  for (let attempt = 0; attempt < MAX_UPSTREAM_RETRY; attempt += 1) {
    const endpoint = `${endpointBase}?${queryParams.toString()}`;
    const upstream = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await upstream.text();
    if (upstream.ok) {
      return { upstream, text };
    }

    lastResponse = upstream;
    lastText = text;

    const shouldRetry = upstream.status === 429 || upstream.status >= 500;
    if (!shouldRetry || attempt === MAX_UPSTREAM_RETRY - 1) {
      break;
    }

    const delay = Math.min(3500, (250 * (2 ** attempt)) + Math.floor(Math.random() * 120));
    await waitFor(delay);
  }

  return { upstream: lastResponse, text: lastText };
}

async function geocodeWithRetry(queryText, apiKey) {
  const raw = String(queryText || '').trim();
  const normalized = raw
    .toLocaleLowerCase('tr-TR')
    .replace(/meydani|meydanı|meydan/g, ' ')
    .replace(/turkiye|türkiye/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const districtHint = normalized
    .replace(/istanbul/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)[0] || '';

  const variants = Array.from(new Set([
    raw,
    `${raw},TR`,
    `${raw},Istanbul,TR`,
    normalized,
    `${normalized},TR`,
    `${normalized},Istanbul,TR`,
    districtHint,
    districtHint ? `${districtHint},Istanbul,TR` : '',
    districtHint ? `${districtHint},TR` : '',
  ].filter(Boolean)));

  for (const variant of variants) {
    let lastResponse = null;
    let lastText = '';

    for (let attempt = 0; attempt < MAX_UPSTREAM_RETRY; attempt += 1) {
      const queryParams = new URLSearchParams({
        q: String(variant || ''),
        limit: '1',
        appid: apiKey,
      });

      const endpoint = `${OPENWEATHER_GEOCODE_ENDPOINT}?${queryParams.toString()}`;
      const upstream = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const text = await upstream.text();
      if (upstream.ok) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return { upstream, text };
          }
        } catch {
          // keep trying next variants
        }
      }

      lastResponse = upstream;
      lastText = text;

      const shouldRetry = upstream.status === 429 || upstream.status >= 500;
      if (!shouldRetry || attempt === MAX_UPSTREAM_RETRY - 1) {
        break;
      }

      const delay = Math.min(3500, (250 * (2 ** attempt)) + Math.floor(Math.random() * 120));
      await waitFor(delay);
    }

  }

  let lastResponse = null;
  let lastText = '';
  lastResponse = { ok: false, status: 404 };
  lastText = JSON.stringify({ message: 'No geocode match for provided query variants.' });
  return { upstream: lastResponse, text: lastText };
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 200, { ok: true });
    return;
  }

  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && requestUrl.pathname === '/api/weather') {
    const apiKey = readSecret('OPENWEATHER_API_KEY');
    if (!apiKey) {
      sendJson(response, 500, { error: 'OPENWEATHER_API_KEY tanimli degil.' });
      return;
    }

    let lat = toFiniteNumber(requestUrl.searchParams.get('lat'));
    let lon = toFiniteNumber(requestUrl.searchParams.get('lon'));
    const queryText = String(requestUrl.searchParams.get('q') || '').trim();

    if ((lat === null || lon === null) && !queryText) {
      sendJson(response, 400, { error: 'Gecerli lat/lon veya q parametresi gerekli.' });
      return;
    }

    if ((lat === null || lon === null) && queryText) {
      const queryCacheKey = getQueryCacheKey(queryText);
      const cachedByQuery = weatherCache.get(queryCacheKey);
      const nowByQuery = Date.now();

      if (cachedByQuery?.coordinates && cachedByQuery.expiresAt > nowByQuery) {
        lat = cachedByQuery.coordinates.lat;
        lon = cachedByQuery.coordinates.lon;
      } else {
        try {
          const { upstream: geoUpstream, text: geoText } = await geocodeWithRetry(queryText, apiKey);
          if (!geoUpstream.ok) {
            sendJson(response, geoUpstream.status, {
              error: 'OpenWeather geocode istegi basarisiz oldu.',
              detail: geoText.slice(0, 500),
            });
            return;
          }

          const geoItems = JSON.parse(geoText);
          const firstItem = Array.isArray(geoItems) ? geoItems[0] : null;
          if (!firstItem || toFiniteNumber(firstItem.lat) === null || toFiniteNumber(firstItem.lon) === null) {
            sendJson(response, 404, { error: 'Konum cozumlenemedi.' });
            return;
          }

          lat = toFiniteNumber(firstItem.lat);
          lon = toFiniteNumber(firstItem.lon);

          weatherCache.set(queryCacheKey, {
            coordinates: { lat, lon },
            cachedAt: nowByQuery,
            expiresAt: nowByQuery + WEATHER_CACHE_TTL_MS,
          });
        } catch (error) {
          sendJson(response, 500, {
            error: 'Konum cozumleme hatasi.',
            detail: error.message,
          });
          return;
        }
      }
    }

    const cacheKey = getCacheKey(lat, lon);
    const cached = weatherCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      sendJson(response, 200, {
        ...cached.payload,
        source: 'cache',
        cachedAt: cached.cachedAt,
        expiresAt: cached.expiresAt,
      });
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        units: 'metric',
        lang: 'tr',
        appid: apiKey,
      });

      const forecastParams = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        units: 'metric',
        lang: 'tr',
        cnt: '8',
        appid: apiKey,
      });

      const [currentResult, forecastResult] = await Promise.all([
        getWithRetry(OPENWEATHER_CURRENT_ENDPOINT, queryParams),
        getWithRetry(OPENWEATHER_FORECAST_ENDPOINT, forecastParams),
      ]);

      if (!currentResult.upstream.ok) {
        sendJson(response, currentResult.upstream.status, {
          error: 'OpenWeather current istegi basarisiz oldu.',
          detail: currentResult.text.slice(0, 500),
        });
        return;
      }

      if (!forecastResult.upstream.ok) {
        sendJson(response, forecastResult.upstream.status, {
          error: 'OpenWeather forecast istegi basarisiz oldu.',
          detail: forecastResult.text.slice(0, 500),
        });
        return;
      }

      const currentRaw = JSON.parse(currentResult.text);
      const forecastRaw = JSON.parse(forecastResult.text);
      const payload = normalizeWeatherPayload(currentRaw, forecastRaw);
      const record = {
        payload,
        cachedAt: now,
        expiresAt: now + WEATHER_CACHE_TTL_MS,
      };

      weatherCache.set(cacheKey, record);
      sendJson(response, 200, {
        ...payload,
        coordinates: { lat, lon },
        source: 'live',
        cachedAt: record.cachedAt,
        expiresAt: record.expiresAt,
      });
      return;
    } catch (error) {
      sendJson(response, 500, {
        error: 'Hava durumu proxy hatasi.',
        detail: error.message,
      });
      return;
    }
  }

  if (request.method !== 'POST' || requestUrl.pathname !== '/api/deepseek') {
    sendJson(response, 404, { error: 'Endpoint bulunamadi.' });
    return;
  }

  const apiKey = readSecret('DEEPSEEK_API_KEY', readSecret('VITE_DEEPSEEK_API_KEY'));

  if (!apiKey) {
    sendJson(response, 500, { error: 'DEEPSEEK_API_KEY tanimli degil.' });
    return;
  }

  try {
    const body = await readBody(request);
    const payload = body.payload || body;

    const { upstream, text } = await postDeepSeekWithRetry(payload, apiKey);

    if (!upstream.ok) {
      sendJson(response, upstream.status, {
        error: 'DeepSeek istegi basarisiz oldu.',
        detail: text.slice(0, 500),
      });
      return;
    }

    sendJson(response, 200, JSON.parse(text));
  } catch (error) {
    sendJson(response, 500, {
      error: 'Proxy hatasi.',
      detail: error.message,
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AI proxy hazir: http://${HOST}:${PORT}/api/deepseek`);
  console.log(`Weather proxy hazir: http://${HOST}:${PORT}/api/weather?lat=41.0&lon=29.0`);
});