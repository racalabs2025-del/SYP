import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const forbiddenValues = ['SYP_TEST_AI_SECRET_DO_NOT_SHIP', 'SYP_TEST_PASSWORD_DO_NOT_SHIP'];
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_DEEPSEEK_API_KEY: forbiddenValues[0],
    VITE_PANEL_LOGIN_PASSWORD: forbiddenValues[1],
  },
});

function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (/\.(js|html|map)$/.test(entry.name)) {
      const content = readFileSync(file, 'utf8');
      assert.ok(forbiddenValues.every((value) => !content.includes(value)), 'A private setting reached the client bundle.');
      assert.ok(!/VITE_(DEEPSEEK_API_KEY|PANEL_LOGIN_PASSWORD)/.test(content), 'A legacy secret environment field reached the client bundle.');
    }
  }
}
scan('dist');
console.log('PASS: Client bundle excludes AI keys and panel passwords, including injected test secrets.');
