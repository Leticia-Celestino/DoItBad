// Explicit remote integration check. Credentials stay in memory; only this run's users are deleted.
// Run: node --experimental-strip-types scripts/verify-workspace-remote.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createRepository } from '../packages/core/src/index.ts';
const { fetch } = globalThis;
const requireCore = createRequire(new URL('../packages/core/package.json', import.meta.url));
const { createClient } = requireCore('@supabase/supabase-js');
const { chromium } = await import('@playwright/test');
const project = 'fdfhqmmlbxgpzfsatavm';
const url = `https://${project}.supabase.co`;
const keys = JSON.parse(
  execFileSync(
    'pnpm',
    ['exec', 'supabase', 'projects', 'api-keys', '--project-ref', project, '--output', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ),
);
const anon = keys.find((key) => key.name === 'anon')?.api_key;
const service = keys.find((key) => key.name === 'service_role')?.api_key;
assert.ok(anon && service, 'CLI credentials unavailable');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, service, options);
const clients = Array.from({ length: 3 }, () => createClient(url, anon, options));
const users = [];
let server;
let browser;
const base = 'http://127.0.0.1:4325';
const storage = { getItem: async () => null, setItem: async () => {} };
function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
try {
  for (let i = 0; i < 2; i++) {
    const email = `workspace-check-${randomUUID()}@example.invalid`;
    const password = `${randomUUID()}Aa1!`;
    const { user } = checked(
      await admin.auth.admin.createUser({ email, password, email_confirm: false }),
    );
    users.push({ id: user.id, email, password });
    const unconfirmed = await clients[i].auth.signInWithPassword({ email, password });
    assert.equal(unconfirmed.error?.code, 'email_not_confirmed');
    const redirectTo = i === 0 ? `${base}/entrar` : 'doitbad://entrar';
    const signup = checked(
      await admin.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: { redirectTo },
      }),
    );
    const confirmation = await fetch(signup.properties.action_link, { redirect: 'manual' });
    assert.ok(
      confirmation.headers.get('location')?.startsWith(`${redirectTo}#access_token=`),
      'Signup callback rejected',
    );
    assert.ok(checked(await admin.auth.admin.getUserById(user.id)).user.email_confirmed_at);
  }
  console.log(
    'PASS: unconfirmed login rejected, signup confirmation callbacks for web and native (no email sent)',
  );
  for (const [index, client] of clients.entries()) {
    const user = users[index === 2 ? 1 : 0];
    checked(await client.auth.signInWithPassword({ email: user.email, password: user.password }));
  }
  const [first, second, other] = clients.map((client) =>
    createRepository(client, storage, randomUUID),
  );
  const projectRecord = await first.save('project', {
    title: 'Remote integration project',
    color: '#5C6B4A',
  });
  const task = await first.save('task', {
    title: 'Remote integration task',
    project: projectRecord.payload.title,
    projectId: projectRecord.id,
    date: '',
    done: false,
    steps: [],
  });
  const copy = (await second.list()).find((item) => item.id === task.id);
  assert.deepEqual(copy, task);
  assert.deepEqual(await other.list(), []);
  assert.deepEqual(
    (await second.list()).find((item) => item.id === projectRecord.id),
    projectRecord,
  );
  const edited = await first.save(
    'task',
    { ...task.payload, title: 'Updated from first client' },
    task,
  );
  await assert.rejects(
    () => second.save('task', { ...copy.payload, done: true }, copy),
    /outro dispositivo/,
  );
  assert.deepEqual(
    (await second.list()).find((item) => item.id === task.id),
    edited,
  );
  const forbidden = await clients[2]
    .from('workspace_items')
    .update({ revision: 99 })
    .eq('id', task.id)
    .select();
  assert.deepEqual(checked(forbidden), []);
  const disposable = await first.save('task', {
    title: 'Remote deletion check',
    project: '',
    date: '',
    done: false,
    steps: [],
  });
  const forbiddenDelete = await clients[2]
    .from('workspace_items')
    .delete()
    .eq('id', disposable.id)
    .select('id');
  assert.deepEqual(checked(forbiddenDelete), []);
  await first.remove(disposable);
  assert.equal(
    (await second.list()).some((item) => item.id === disposable.id),
    false,
  );
  const spoof = await clients[2]
    .from('workspace_items')
    .insert({ id: randomUUID(), user_id: users[0].id, kind: 'task', payload: task.payload });
  assert.equal(spoof.error?.code, '42501');
  const focusPayload = {
    taskId: task.id,
    title: 'Focus check',
    step: 'One step',
    blockers: [],
    target: 120,
    elapsed: 0,
    runningSince: null,
    status: 'active',
    note: '',
    mood: null,
  };
  const focus = await first.save('focus', focusPayload);
  await assert.rejects(() => second.save('focus', focusPayload));
  await first.save('focus', { ...focus.payload, status: 'complete', elapsed: 60 }, focus);
  checked(await clients[1].auth.refreshSession());
  assert.equal((await second.list()).length, 3);
  console.log(
    'PASS: password login, shared project, session refresh, cross-client reads, stale-write rejection, owner-only deletion, account isolation, single active focus',
  );

  server = spawn('pnpm', ['--filter', '@doitbad/web', 'dev', '--port', '4325', '--strictPort'], {
    env: {
      ...process.env,
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: anon,
      VITE_SITE_URL: base,
    },
    stdio: 'ignore',
    detached: true,
  });
  let available = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Test web server exited');
    try {
      available = (await fetch(base)).ok;
    } catch {
      /* waiting for Vite */
    }
    if (available) break;
    await delay(500);
  }
  assert.ok(available, 'Test web server did not start');
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${base}/entrar`);
  await page.getByLabel('E-mail', { exact: true }).fill(users[0].email);
  await page.getByLabel('Senha', { exact: true }).fill(users[0].password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/atividade');
  await page.goto(`${base}/tarefas`);
  await page.getByRole('heading', { name: edited.payload.title, exact: true }).waitFor();
  await page.getByLabel('O que você quer fazer?').fill('Created in browser');
  await page.getByRole('button', { name: 'Adicionar tarefa' }).click();
  await page.getByRole('heading', { name: 'Created in browser', exact: true }).waitFor();
  assert.ok((await second.list()).some((item) => item.payload.title === 'Created in browser'));
  await page.reload();
  await page.getByRole('heading', { name: 'Created in browser', exact: true }).waitFor();
  console.log(
    'PASS: web login, remote task creation, independent client reads, session persistence after reload',
  );

  // Generate a recovery link without sending an email to anyone.
  const recovery = checked(
    await admin.auth.admin.generateLink({
      type: 'recovery',
      email: users[0].email,
      options: { redirectTo: `${base}/redefinir-senha` },
    }),
  );
  const action = new URL(recovery.properties.action_link);
  const redirect = action.searchParams.get('redirect_to');
  assert.equal(redirect, `${base}/redefinir-senha`);
  const callback = await fetch(action, { redirect: 'manual' });
  const location = callback.headers.get('location');
  assert.ok(
    location?.startsWith(`${base}/redefinir-senha#access_token=`),
    'Recovery callback rejected',
  );
  await page.goto(location);
  const newPassword = `${randomUUID()}Aa1!`;
  await page.getByLabel('Nova senha', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await page.getByRole('status').filter({ hasText: 'Senha atualizada.' }).waitFor();
  checked(
    await clients[1].auth.signInWithPassword({ email: users[0].email, password: newPassword }),
  );
  const nativeRecovery = checked(
    await admin.auth.admin.generateLink({
      type: 'recovery',
      email: users[1].email,
      options: { redirectTo: 'doitbad://entrar' },
    }),
  );
  const nativeCallback = await fetch(nativeRecovery.properties.action_link, { redirect: 'manual' });
  assert.ok(
    nativeCallback.headers.get('location')?.startsWith('doitbad://entrar#access_token='),
    'Native callback rejected',
  );
  console.log(
    'PASS: web recovery callback and password form, login with new password, native callback URL (email delivery not tested)',
  );
} finally {
  await browser?.close();
  if (server?.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      /* already exited */
    }
  }
  for (const client of clients) await client.auth.signOut();
  for (const user of users) {
    checked(await admin.auth.admin.deleteUser(user.id));
  }
  console.log(`Cleaned up ${users.length} temporary users and their test records.`);
}
