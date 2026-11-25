// End-to-end check for Supabase auth/RLS -> Python Worker -> Llama -> persistence.
// Creates disposable confirmed users and removes them in finally.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

const requireCore = createRequire(new URL('../packages/core/package.json', import.meta.url));
const { createClient } = requireCore('@supabase/supabase-js');
const project = 'fdfhqmmlbxgpzfsatavm';
const supabaseUrl = `https://${project}.supabase.co`;
const aiUrl = process.env.AI_API_URL ?? 'https://doitbad-ai.doitbad-app.workers.dev';
const keys = JSON.parse(
  execFileSync(
    'pnpm',
    ['exec', 'supabase', 'projects', 'api-keys', '--project-ref', project, '--output', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ),
);
const anon = keys.find((key) => key.name === 'anon')?.api_key;
const service = keys.find((key) => key.name === 'service_role')?.api_key;
assert.ok(anon && service, 'Supabase CLI credentials unavailable');

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(supabaseUrl, service, options);
const users = [];
function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

try {
  for (let index = 0; index < 2; index++) {
    const email = `ai-check-${randomUUID()}@example.invalid`;
    const password = `${randomUUID()}Aa1!`;
    const { user } = checked(
      await admin.auth.admin.createUser({ email, password, email_confirm: true }),
    );
    const client = createClient(supabaseUrl, anon, options);
    const { session } = checked(await client.auth.signInWithPassword({ email, password }));
    users.push({ user, client, session });
  }

  const taskId = randomUUID();
  checked(
    await users[0].client.from('workspace_items').insert({
      id: taskId,
      kind: 'task',
      payload: {
        title: 'Preparar material do primeiro teste',
        project: 'Lançamento',
        date: '2026-10-14',
        done: false,
        steps: ['Abrir a lista de participantes', 'Escrever a mensagem de convite'],
        priority: 'alta',
        recurrence: 'none',
        completedSteps: [],
        dependsOn: [],
      },
    }),
  );

  const response = await fetch(`${aiUrl}/v1/recommendations/next-step`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${users[0].session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ locale: 'pt-BR' }),
  });
  if (response.status !== 200) {
    throw new Error(`AI API returned ${response.status}: ${await response.text()}`);
  }
  const recommendation = await response.json();
  assert.equal(recommendation.task_id, taskId);
  assert.equal(recommendation.source, 'llama', 'Workers AI fell back instead of using Llama');
  assert.ok(recommendation.id);
  assert.ok(recommendation.microaction.length >= 3);

  const own = checked(
    await users[0].client
      .from('ai_recommendations')
      .select('id,status,source')
      .eq('id', recommendation.id)
      .single(),
  );
  assert.equal(own.source, 'llama');
  const foreign = checked(
    await users[1].client.from('ai_recommendations').select('id').eq('id', recommendation.id),
  );
  assert.deepEqual(foreign, []);

  const accept = await fetch(`${aiUrl}/v1/recommendations/${recommendation.id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${users[0].session.access_token}` },
  });
  if (accept.status !== 204) {
    throw new Error(`AI acceptance returned ${accept.status}: ${await accept.text()}`);
  }
  const accepted = checked(
    await users[0].client
      .from('ai_recommendations')
      .select('status,accepted_at')
      .eq('id', recommendation.id)
      .single(),
  );
  assert.equal(accepted.status, 'accepted');
  assert.ok(accepted.accepted_at);
  console.log('PASS: auth, Llama, structured response, persistence, acceptance and RLS isolation');
} finally {
  for (const { user } of users) await admin.auth.admin.deleteUser(user.id);
}
