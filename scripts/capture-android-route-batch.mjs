// Captures authenticated routes in small batches without exposing session values.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const device = process.env.ANDROID_SERIAL;
if (!device) throw new Error('Set ANDROID_SERIAL');
const output = process.env.ANDROID_CAPTURE_DIR ?? '/tmp/doitbad-layout-review';
const routes = JSON.parse(process.env.ANDROID_CAPTURE_ROUTES ?? '[]');
mkdirSync(output, { recursive: true });

function adb(...args) {
  return execFileSync('adb', ['-s', device, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 20_000,
  });
}

for (const [route, name] of routes) {
  adb(
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    `'doitbad://${route}'`,
    'tech.doitbad.app',
  );
  await delay(900);
  adb('shell', 'screencap', '-p', `/sdcard/${name}.png`);
  adb('pull', `/sdcard/${name}.png`, `${output}/${name}.png`);
  console.log(`CAPTURED ${name}`);
}
