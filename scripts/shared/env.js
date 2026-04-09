import fs from 'fs';
import path from 'path';

function parseEnv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((accumulator, line) => {
      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      accumulator[key] = value;
      return accumulator;
    }, {});
}

export function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return parseEnv(fs.readFileSync(envPath, 'utf8'));
}

export function readSecret(key, fallback = '') {
  const envFile = loadEnvFile();
  return process.env[key] || envFile[key] || fallback;
}

export function resolveSourceDir(defaultDir = '') {
  const cliArg = process.argv[2];
  const configured = cliArg || process.env.PLANLAR_DIR || defaultDir;
  return configured ? path.resolve(configured) : '';
}