// Original, deterministic, soft filtered noise. No external recording or license dependency.
// Run with `node scripts/generate-zen-audio.mjs` to reproduce the bundled asset.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
const rate = 22050;
const samples = rate * 8;
const wav = Buffer.alloc(44 + samples * 2);
wav.write('RIFF');
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(samples * 2, 40);
let seed = 42;
let filtered = 0;
for (let n = 0; n < samples; n++) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  filtered = 0.97 * filtered + 0.03 * ((seed / 0xffffffff) * 2 - 1);
  const envelope = Math.min(1, n / 2205, (samples - n - 1) / 2205);
  wav.writeInt16LE(Math.round(filtered * envelope * 12000), 44 + n * 2);
}
const folder = new URL('../packages/assets/', import.meta.url);
mkdirSync(folder, { recursive: true });
writeFileSync(new URL('zen.wav', folder), wav);
