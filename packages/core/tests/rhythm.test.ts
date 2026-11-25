import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actOnRhythm,
  createRhythmFocus,
  defaultRhythm,
  focusRecordedSeconds,
  projectRhythm,
  rhythmSummary,
  summarize,
  validate,
  createRepository,
  type Item,
  type RhythmConfig,
} from '../src/index.ts';
const start = 1_000_000;
const config: RhythmConfig = { ...defaultRhythm, blocks: 2, eyeCare: true };
const make = (overrides: Partial<RhythmConfig> = {}) =>
  createRhythmFocus('task', 'Química', 'Questão 8', { ...config, ...overrides }, start);

test('50/10 reserves only the break between blocks; focus stops at the deadline after suspension', () => {
  assert.match(rhythmSummary(config), /110 min reservados/);
  const projected = projectRhythm(make(), start + 4 * 3600_000);
  assert.equal(projected.rhythm?.phase, 'checkin');
  assert.equal(projected.rhythm?.focusSeconds, 3000);
  assert.equal(projected.status, 'active');
  assert.equal(projected.runningSince, null);
  validate('focus', projected);
});
test('break and decision time never become focus; the next block requires a command', () => {
  const rest = actOnRhythm(make(), 'break', start + 3100_000);
  const ready = projectRhythm(rest, start + 5000_000);
  assert.equal(ready.rhythm?.phase, 'ready');
  assert.equal(ready.rhythm?.focusSeconds, 3000);
  assert.equal(ready.rhythm?.breakSeconds, 600);
  const next = actOnRhythm(ready, 'next', start + 6000_000);
  assert.equal(next.rhythm?.block, 2);
  const end = actOnRhythm(next, 'finish', start + 9000_000);
  assert.equal(focusRecordedSeconds(end), 6000);
  assert.equal(end.status, 'complete');
  validate('focus', end);
  const item = {
    id: 'session',
    kind: 'focus',
    payload: end,
    revision: 1,
    created_at: new Date(start).toISOString(),
  } as Item<'focus'>;
  assert.equal(summarize([item]).minutes, 100);
});
test('accepted 20-second visual break fits inside the block and is not counted as work', () => {
  const due = projectRhythm(make(), start + 1200_000);
  assert.equal(due.rhythm?.eyeDueIn, 0);
  const eye = actOnRhythm(due, 'eye', start + 1200_000);
  const after = projectRhythm(eye, start + 1220_000);
  assert.equal(after.rhythm?.focusSeconds, 1200);
  assert.equal(after.rhythm?.eyeSeconds, 20);
  assert.equal(after.rhythm?.eyeDueIn, 1200);
  const end = projectRhythm(eye, start + 3000_000);
  assert.equal(end.rhythm?.focusSeconds, 2980);
  assert.equal(end.rhythm?.phase, 'checkin');
});
test('manual pause freezes focus, eye countdown and accepted micropause across reload', () => {
  const eye = actOnRhythm(make(), 'eye', start + 1200_000);
  const paused = actOnRhythm(eye, 'pause', start + 1205_000);
  assert.equal(paused.rhythm?.eyeRemaining, 15);
  assert.deepEqual(projectRhythm(JSON.parse(JSON.stringify(paused)), start + 6000_000), paused);
  const resumed = actOnRhythm(paused, 'resume', start + 6000_000);
  assert.equal(projectRhythm(resumed, start + 6015_000).rhythm?.eyeSeconds, 20);
});
test('defer and dismiss schedule one future reminder without a backlog', () => {
  const deferred = actOnRhythm(make({ mode: 'free' }), 'defer-eye', start + 2400_000);
  assert.equal(deferred.rhythm?.eyeDueIn, 300);
  const dismissed = actOnRhythm(deferred, 'dismiss-eye', start + 2700_000);
  assert.equal(dismissed.rhythm?.eyeDueIn, 1200);
  assert.equal(projectRhythm(dismissed, start + 20 * 3600_000).rhythm?.eyeDueIn, 0);
});
test('free timer exceeds two hours, extending a timed block preserves its totals', () => {
  const free = actOnRhythm(make({ mode: 'free' }), 'finish', start + 10_800_000);
  assert.equal(focusRecordedSeconds(free), 10800);
  validate('focus', free);
  const extended = actOnRhythm(make(), 'extend', start + 3500_000);
  assert.equal(extended.rhythm?.phaseTarget, 3300);
  assert.equal(projectRhythm(extended, start + 3800_000).rhythm?.focusSeconds, 3300);
});
test('continuing a small beginning carries visual interval, without double-counting its minutes', () => {
  const previous: Item<'focus'> = {
    id: 'first',
    kind: 'focus',
    revision: 1,
    created_at: new Date(start).toISOString(),
    payload: {
      taskId: 'task',
      title: 'Química',
      step: 'Abrir o livro',
      target: 120,
      elapsed: 120,
      runningSince: null,
      status: 'complete',
      note: 'Questão 8',
      mood: null,
      blockers: [],
      purpose: 'start',
      completedAt: start,
    },
  };
  const next = createRhythmFocus('task', 'Química', 'Questão 8', config, start, previous);
  assert.equal(next.rhythm?.eyeDueIn, 1080);
  assert.equal(next.rhythm?.focusSeconds, 0);
  assert.equal(next.previousFocusId, 'first');
  assert.equal(next.note, 'Questão 8');
});
test('configuration snapshot survives preference edits; invalid durations and states are rejected', () => {
  const session = make();
  const preference = { ...config };
  const snapshot = createRhythmFocus('task', 'Química', 'Questão 8', preference, start);
  preference.focusMinutes = 25;
  assert.equal(snapshot.rhythm?.config.focusMinutes, 50);
  for (const bad of [0, -1, 121, 1.5, NaN])
    assert.throws(() =>
      validate('rhythm_preferences', { config: { ...config, focusMinutes: bad } }),
    );
  assert.throws(() =>
    validate('focus', { ...session, rhythm: { ...session.rhythm!, eyeRemaining: 21 } }),
  );
  assert.throws(() => validate('focus', { ...session, status: 'complete' }));
  assert.throws(() => make({ mode: 'none' }));
});
test('two clients cannot overwrite each other or create a second active rhythm', async () => {
  let data: string | null = null;
  let id = 0;
  const storage = {
    getItem: async () => data,
    setItem: async (_: string, value: string) => {
      data = value;
    },
  };
  const a = createRepository(null, storage, () => String(++id));
  const b = createRepository(null, storage, () => String(++id));
  const original = await a.save('focus', make());
  const paused = await a.save(
    'focus',
    actOnRhythm(original.payload, 'pause', start + 100_000),
    original,
  );
  await assert.rejects(() =>
    b.save('focus', actOnRhythm(original.payload, 'finish', start + 120_000), original),
  );
  await assert.rejects(() => b.save('focus', make()));
  assert.equal((await b.list())[0].revision, paused.revision);
});

test('an old beginning does not shorten the visual interval of a new day', () => {
  const previous = {
    id: 'old',
    kind: 'focus',
    revision: 1,
    created_at: new Date(start).toISOString(),
    payload: {
      ...make(),
      rhythm: undefined,
      purpose: 'start',
      target: 120,
      elapsed: 120,
      status: 'complete',
      completedAt: start,
      runningSince: null,
    },
  } as Item<'focus'>;
  const next = createRhythmFocus(
    'task',
    'Química',
    'Questão 8',
    config,
    start + 86400_000,
    previous,
  );
  assert.equal(next.rhythm?.eyeDueIn, 1200);
});
