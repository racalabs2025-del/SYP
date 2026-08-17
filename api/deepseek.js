export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'DeepSeek API Anahtarı sunucuda bulunamadı. Lütfen Vercel panelinden DEEPSEEK_API_KEY değişkenini ekleyin.',
    });
  }

  try {
    const rawBody = req.body || {};
    const payload = rawBody.payload || rawBody;

    if (!payload.model) {
      payload.model = 'deepseek-chat';
    }

    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await deepseekRes.json();
    if (!deepseekRes.ok) {
      return res.status(deepseekRes.status).json({
        error: 'DeepSeek upstream hatası',
        detail: data,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'Proxy sunucu hatası',
      detail: error.message,
    });
  }
}
