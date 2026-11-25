import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { accountEmails, renderAccountEmail } from './build-account-emails.mjs';

// A minimal config declares ONLY email content/subjects. No SMTP, redirects,
// notification enablement, auth policy or database setting is changed.
const dir = mkdtempSync(join(tmpdir(), 'doitbad-email-deploy-'));
mkdirSync(join(dir, 'supabase', 'templates'), { recursive: true });
let config = 'project_id = "doitbad"\n';
for (const entry of accountEmails) {
  const email = renderAccountEmail(entry);
  writeFileSync(join(dir, 'supabase', 'templates', email.file), email.html);
  config += `\n[auth.email.${email.kind === 'notification' ? 'notification' : 'template'}.${email.key}]\nsubject = ${JSON.stringify(email.subject)}\ncontent_path = "./supabase/templates/${email.file}"\n`;
}
writeFileSync(join(dir, 'supabase', 'config.toml'), config);
console.log(dir);
