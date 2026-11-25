// Device-level AI smoke test. Creates and removes one disposable Supabase user.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const requireCore = createRequire(new URL('../packages/core/package.json', import.meta.url));
const { createClient } = requireCore('@supabase/supabase-js');
const project = 'fdfhqmmlbxgpzfsatavm';
const device = process.env.ANDROID_SERIAL;
assert.ok(device, 'Set ANDROID_SERIAL');
const keys = JSON.parse(
  execFileSync(
    'pnpm',
    ['exec', 'supabase', 'projects', 'api-keys', '--project-ref', project, '--output', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ),
);
const admin = createClient(
  `https://${project}.supabase.co`,
  keys.find((key) => key.name === 'service_role').api_key,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const output = '/tmp/doitbad-ai-review';
mkdirSync(output, { recursive: true });
function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
function adb(...args) {
  return execFileSync('adb', ['-s', device, ...args], {
    encoding: 'utf8',
    timeout: 30_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
function tree() {
  adb('shell', 'uiautomator', 'dump', '/sdcard/doitbad-ai.xml');
  return adb('shell', 'cat', '/sdcard/doitbad-ai.xml');
}
async function tap(text) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const node = [...tree().matchAll(/<node\b[^>]+>/g)]
      .map((match) => match[0])
      .find((value) => value.includes(`text="${text}"`) || value.includes(`content-desc="${text}"`));
    const bounds = node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (bounds) {
      const [, x1, y1, x2, y2] = bounds.map(Number);
      adb('shell', 'input', 'tap', String((x1 + x2) >> 1), String((y1 + y2) >> 1));
      await delay(500);
      return;
    }
    await delay(500);
  }
  throw new Error(`Control not found: ${text}`);
}
function capture(name) {
  adb('shell', 'screencap', '-p', '/sdcard/doitbad-ai.png');
  adb('pull', '/sdcard/doitbad-ai.png', `${output}/${name}.png`);
}

let user;
try {
  const email = `android-ai-${randomUUID()}@example.invalid`;
  user = checked(
    await admin.auth.admin.createUser({
      email,
      password: `${randomUUID()}Aa1!`,
      email_confirm: true,
      user_metadata: { name: 'Teste IA' },
    }),
  ).user;
  checked(
    await admin.from('workspace_items').insert({
      id: randomUUID(),
      user_id: user.id,
      kind: 'task',
      payload: {
        title: 'Preparar convite dos primeiros testers',
        project: 'Lançamento',
        date: '2026-10-15',
        done: false,
        steps: ['Abrir a lista de testers', 'Escrever uma mensagem curta'],
        priority: 'alta',
        recurrence: 'none',
        completedSteps: [],
        dependsOn: [],
      },
    }),
  );
  const link = checked(
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'doitbad://entrar' },
    }),
  );
  const redirect = await fetch(link.properties.action_link, { redirect: 'manual' });
  const callback = redirect.headers.get('location');
  assert.ok(callback?.startsWith('doitbad://entrar#access_token='));
  adb('shell', 'am', 'force-stop', 'tech.doitbad.app');
  adb(
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    `'${callback}'`,
    'tech.doitbad.app',
  );
  await delay(2500);
  adb(
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    "'doitbad://tarefas'",
    'tech.doitbad.app',
  );
  await delay(1200);
  await tap('Não sei por onde começar');
  for (let attempt = 0; attempt < 30 && !tree().includes('sugerido com Llama'); attempt++) {
    await delay(500);
  }
  const suggestion = tree();
  assert.match(suggestion, /sugerido com Llama/);
  assert.doesNotMatch(suggestion, /momentaneamente indisponível/);
  capture('01-llama-suggestion');
  await tap('Começar por aqui');
  await delay(700);
  assert.match(tree(), /Seu único passo agora é:/);
  capture('02-llama-start');
  console.log(`PASS: mobile -> Worker -> Llama -> mobile (${output})`);
} finally {
  if (user) await admin.auth.admin.deleteUser(user.id);
  adb('shell', 'am', 'force-stop', 'tech.doitbad.app');
  adb('shell', 'pm', 'clear', 'tech.doitbad.app');
}
