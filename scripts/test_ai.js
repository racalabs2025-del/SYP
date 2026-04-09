import { readSecret } from './shared/env.js';

async function testAI() {
  const apiKey = readSecret('VITE_DEEPSEEK_API_KEY');

  if (!apiKey) {
    throw new Error('VITE_DEEPSEEK_API_KEY bulunamadi. .env veya ortam degiskenini kontrol edin.');
  }

  console.log(`Testing API key: ${apiKey.slice(0, 5)}...`);

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Merhaba, bu bir testtir. Sadece OK yaz.' }],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek testi basarisiz oldu: ${response.status}`);
  }

  const data = await response.json();
  console.log('Response:', data.choices?.[0]?.message?.content || '(bos yanit)');
}

testAI().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
