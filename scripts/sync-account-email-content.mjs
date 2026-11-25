import { execFileSync } from 'node:child_process';
import { accountEmails, renderAccountEmail } from './build-account-emails.mjs';

// Scoped Management API update: ONLY template subjects/content, no enablement flags.
const project = 'fdfhqmmlbxgpzfsatavm';
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  try {
    token = execFileSync('secret-tool', ['lookup', 'service', 'supabase', 'username', 'access-token'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore','pipe','ignore'] }).trim();
  } catch { /* CLI credentials are not always stored in this keyring. */ }
}
if (!token) throw new Error('Credencial administrativa indisponível para verificar conteúdo de notificações.');
const url = `https://api.supabase.com/v1/projects/${project}/config/auth`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' };
async function getConfig() {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Consulta de templates: HTTP ${response.status}`);
  return response.json();
}
const current = await getConfig();
const desired = {};
for (const entry of accountEmails) {
  const email = renderAccountEmail(entry);
  const suffix = email.key + (email.kind === 'notification' ? '_notification' : '');
  desired[`mailer_subjects_${suffix}`] = email.subject;
  desired[`mailer_templates_${suffix}_content`] = email.html;
}
const changes = Object.fromEntries(Object.entries(desired).filter(([key,value])=>current[key]!==value));
console.log(JSON.stringify({ project, changedFields: Object.keys(changes), apply: process.argv.includes('--apply') }));
if (process.argv.includes('--apply') && Object.keys(changes).length) {
  const response = await fetch(url,{ method:'PATCH',headers,body:JSON.stringify(changes) });
  if (!response.ok) throw new Error(`Atualização de templates: HTTP ${response.status}`);
}
if (process.argv.includes('--apply')) {
  const actual = await getConfig();
  const mismatch = Object.keys(desired).filter(key=>actual[key]!==desired[key]);
  const unrelated = Object.keys(current).filter(key=>!(key in desired) && JSON.stringify(current[key])!==JSON.stringify(actual[key]));
  if (mismatch.length || unrelated.length) throw new Error(`Verificação falhou: templates=${mismatch.join(',')}; outros campos=${unrelated.join(',')}`);
  console.log('13 assuntos e 13 conteúdos conferidos no provedor; outros campos preservados.');
}
