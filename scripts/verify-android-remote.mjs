// Requires an installed DoItBad build and an authorized Android device.
// Uses one temporary account, removed in finally. Never prints auth links or tokens.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createRepository } from '../packages/core/src/index.ts';
const { fetch } = globalThis;
const requireCore = createRequire(new URL('../packages/core/package.json', import.meta.url));
const { createClient } = requireCore('@supabase/supabase-js');
const project = 'fdfhqmmlbxgpzfsatavm';
const keys = JSON.parse(
  execFileSync(
    'pnpm',
    ['exec', 'supabase', 'projects', 'api-keys', '--project-ref', project, '--output', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ),
);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(
  `https://${project}.supabase.co`,
  keys.find((k) => k.name === 'service_role').api_key,
  options,
);
const client = createClient(
  `https://${project}.supabase.co`,
  keys.find((k) => k.name === 'anon').api_key,
  options,
);
const device = process.env.ANDROID_SERIAL;
assert.ok(device, 'Set ANDROID_SERIAL to the test device');
function adb(...args) {
  try {
    return execFileSync('adb', ['-s', device, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20000,
    });
  } catch {
    throw new Error('Android command failed (arguments hidden to protect credentials)');
  }
}
function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
async function waitForText(text) {
  for (let i = 0; i < 15; i++) {
    adb('shell', 'uiautomator', 'dump', '/sdcard/doitbad-layout.xml');
    const xml = adb('shell', 'cat', '/sdcard/doitbad-layout.xml');
    if (xml.includes(text)) return;
    await delay(1000);
  }
  throw new Error(`Android screen did not show: ${text}`);
}
async function openAuth(type, email) {
  const link = checked(
    await admin.auth.admin.generateLink({
      type,
      email,
      options: { redirectTo: 'doitbad://entrar' },
    }),
  );
  const response = await fetch(link.properties.action_link, { redirect: 'manual' });
  const callback = response.headers.get('location');
  assert.ok(callback?.startsWith('doitbad://entrar#access_token='));
  assert.ok(!callback.includes("'"));
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
}
let user;
try {
  const email = `android-check-${randomUUID()}@example.invalid`;
  const password = `${randomUUID()}Aa1!`;
  user = checked(await admin.auth.admin.createUser({ email, password, email_confirm: true })).user;
  checked(await client.auth.signInWithPassword({ email, password }));
  const repo = createRepository(
    client,
    { getItem: async () => null, setItem: async () => {} },
    randomUUID,
  );
  adb('shell', 'am', 'force-stop', 'tech.doitbad.app');
  await openAuth('magiclink', email);
  await waitForText('de execução');
  console.log('PASS: installed Android build, cold-start auth link, authenticated dashboard');
  adb('shell', 'input', 'keyevent', 'KEYCODE_HOME');
  await repo.save('focus', {
    taskId: null,
    title: 'Sincronização Android verificada',
    step: 'Um passo remoto',
    blockers: [],
    target: 120,
    elapsed: 0,
    runningSince: null,
    status: 'active',
    note: '',
    mood: null,
  });
  adb('shell', 'am', 'start', '-W', '-n', 'tech.doitbad.app/.MainActivity');
  await waitForText('Retomar meu passo');
  adb('shell', 'am', 'force-stop', 'tech.doitbad.app');
  adb('shell', 'am', 'start', '-W', '-n', 'tech.doitbad.app/.MainActivity');
  await waitForText('Retomar meu passo');
  console.log(
    'PASS: foreground synchronization and persisted native session after process restart',
  );
  await openAuth('recovery', email);
  await waitForText('Sua nova senha');
  console.log('PASS: native recovery link while already signed in');
} finally {
  await client.auth.signOut();
  if (user) {
    checked(await admin.auth.admin.deleteUser(user.id));
    // Stop the test app after revoking the fixture account.
    adb('shell', 'am', 'force-stop', 'tech.doitbad.app');
    console.log('Removed temporary Android test account and its records; test app stopped.');
  }
}
