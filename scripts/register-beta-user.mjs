import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envText = await readFile(resolve(root, 'apps/mobile/.env.local'), 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const input = JSON.parse(await new Promise((resolve, reject) => {
  let value = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (value += chunk));
  process.stdin.on('end', () => resolve(value));
  process.stdin.on('error', reject);
}));

const response = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
  method: 'POST',
  headers: {
    apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    email: input.email,
    password: input.password,
    data: { name: input.name },
    redirect_to: process.env.BETA_WEB_URL
      ? `${process.env.BETA_WEB_URL.replace(/\/$/, '')}/entrar`
      : 'https://doitbad-beta.vercel.app/entrar',
  }),
  signal: globalThis.AbortSignal.timeout(20_000),
});

const data = await response.json();
if (!response.ok) {
  console.log(JSON.stringify({ ok: false, message: data.msg ?? data.message ?? 'Falha no cadastro', status: response.status }));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      ok: true,
      userId: data.id ?? null,
      confirmationRequired: !data.access_token,
      identities: data.identities?.length ?? null,
    }),
  );
}
