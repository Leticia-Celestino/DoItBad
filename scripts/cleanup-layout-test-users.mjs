// Removes only disposable users created by review-android-screens.mjs.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

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
const service = keys.find((key) => key.name === 'service_role')?.api_key;
if (!service) throw new Error('Supabase service credential unavailable');
const admin = createClient(`https://${project}.supabase.co`, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let removed = 0;
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  for (const user of data.users) {
    if (/^layout-.*@example\.invalid$/.test(user.email ?? '')) {
      const result = await admin.auth.admin.deleteUser(user.id);
      if (result.error) throw result.error;
      removed++;
    }
  }
  if (data.users.length < 100) break;
}
console.log(`Removed ${removed} disposable layout test user(s).`);
