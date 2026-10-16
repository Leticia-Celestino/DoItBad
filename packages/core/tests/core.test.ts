import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository, elapsedSeconds, summarize, validate, type Focus } from '../src/index.ts';
const focus: Focus = {
  taskId: null,
  title: 'Ler',
  step: 'Uma página',
  blockers: [],
  target: 120,
  elapsed: 10,
  runningSince: 1000,
  status: 'active',
  note: '',
  mood: null,
};
test('timer reconstructs elapsed time and clamps completion', () => {
  assert.equal(elapsedSeconds(focus, 31000), 40);
  assert.equal(elapsedSeconds(focus, 999999), 120);
  assert.equal(elapsedSeconds({ ...focus, runningSince: null }, 999999), 10);
});
test('repository rejects stale edits without erasing another record', async () => {
  let data: string | null = null;
  let id = 0;
  const storage = {
    getItem: async () => data,
    setItem: async (_key: string, value: string) => {
      data = value;
    },
  };
  const first = createRepository(null, storage, () => String(++id));
  const second = createRepository(null, storage, () => String(++id));
  const record = await first.save('focus', focus);
  await second.save('mood', { value: 3, note: '' });
  const completed = await first.save(
    'focus',
    { ...focus, status: 'complete', runningSince: null },
    record,
  );
  await assert.rejects(() => second.save('focus', { ...focus, note: 'stale' }, record), /mudou/);
  const items = await first.list();
  assert.equal(items.length, 2);
  assert.equal(summarize(items).steps, 1);
  assert.equal(completed.revision, 2);
});
test('failed storage propagates and invalid dates are rejected', async () => {
  const repo = createRepository(
    null,
    {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('Storage full');
      },
    },
    () => 'id',
  );
  await assert.rejects(() => repo.save('mood', { value: 4, note: '' }), /Storage full/);
  assert.throws(
    () =>
      validate('task', {
        title: 'Tarefa',
        project: '',
        date: '2026-02-30',
        steps: [],
        done: false,
      }),
    /data válida/,
  );
});

test('microaction completion survives reorder, removal and repeated titles', async () => {
  const { editSteps, toggleStep, orderedTasks, isTaskBlocked } = await import('../src/index.ts');
  const task = {
    title: 'Preparar',
    project: '',
    date: '',
    done: false,
    steps: ['Abrir', 'Escrever', 'Abrir'],
    completedSteps: [1, 2],
  };
  assert.deepEqual(
    editSteps(task, ['Escrever', 'Abrir', 'Abrir', 'Revisar']).completedSteps,
    [0, 2],
  );
  assert.deepEqual(editSteps(task, ['Escrever']).completedSteps, [0]);
  assert.deepEqual(toggleStep(task, 1).completedSteps, [2]);
  assert.deepEqual(toggleStep(task, 0).completedSteps, [1, 2, 0]);
  assert.equal(toggleStep(task, 10), task);
  const records = [
    {
      id: 'done',
      kind: 'task' as const,
      payload: { ...task, done: true, priority: 'alta' as const },
      revision: 1,
      created_at: '2026-01-01',
    },
    { id: 'normal', kind: 'task' as const, payload: task, revision: 1, created_at: '2026-01-01' },
    {
      id: 'high',
      kind: 'task' as const,
      payload: { ...task, priority: 'alta' as const },
      revision: 1,
      created_at: '2026-01-02',
    },
  ];
  assert.deepEqual(
    orderedTasks(records).map((t) => t.id),
    ['high', 'normal', 'done'],
  );
  const dependent = {
    ...records[1],
    id: 'dependent',
    payload: { ...task, priority: 'alta' as const, dependsOn: ['normal'] },
  };
  assert.equal(isTaskBlocked(dependent, [...records, dependent]), true);
  assert.deepEqual(
    orderedTasks([...records, dependent]).map((t) => t.id),
    ['high', 'normal', 'dependent', 'done'],
  );
  const chained = {
    ...dependent,
    id: 'chained',
    payload: { ...task, priority: 'alta' as const, dependsOn: ['dependent'] },
  };
  assert.deepEqual(
    orderedTasks([chained, dependent, ...records]).map((t) => t.id),
    ['high', 'normal', 'dependent', 'chained', 'done'],
  );
  assert.throws(() => validate('task', { ...task, completedSteps: [3] }), /microações/);
  let data: string | null = null;
  const repo = createRepository(
    null,
    {
      getItem: async () => data,
      setItem: async (_key, value) => {
        data = value;
      },
    },
    () => 'task',
  );
  const saved = await repo.save('task', task);
  await repo.save('task', toggleStep(task, 0), saved);
  assert.deepEqual((await repo.list())[0].payload, { ...task, completedSteps: [1, 2, 0] });
  await repo.remove((await repo.list())[0]);
  assert.deepEqual(await repo.list(), []);
});

test('task recurrence and dependencies are validated', () => {
  const task = {
    title: 'Preparar',
    project: '',
    date: '',
    done: false,
    steps: [],
    recurrence: 'weekly' as const,
    timeOfDay: 'morning' as const,
    dependsOn: ['first'],
  };
  assert.doesNotThrow(() => validate('task', task));
  assert.throws(() => validate('task', { ...task, recurrence: 'yearly' as never }), /recorrência/);
  assert.throws(() => validate('task', { ...task, timeOfDay: 'dawn' as never }), /período/);
  assert.throws(() => validate('task', { ...task, dependsOn: ['first', 'first'] }), /dependências/);
  assert.doesNotThrow(() => validate('project', { title: 'Trabalho', color: '#5C6B4A' }));
  assert.throws(() => validate('project', { title: 'Trabalho', color: 'verde' }), /cor/);
});

test('tasks are grouped into gentle planning horizons', async () => {
  const { groupTasksByHorizon } = await import('../src/index.ts');
  const record = (id: string, date: string, done = false) => ({
    id,
    kind: 'task' as const,
    payload: { title: id, project: '', date, done, steps: [] },
    revision: 1,
    created_at: '2026-10-01T12:00:00Z',
  });
  const groups = groupTasksByHorizon(
    [
      record('overdue', '2026-10-15'),
      record('today', '2026-10-16'),
      record('after', '2026-10-20'),
      record('later', '2026-11-01'),
      record('done', '2026-10-16', true),
    ],
    '2026-10-16',
  );
  assert.deepEqual(
    groups.today.map((task) => task.id),
    ['overdue', 'today'],
  );
  assert.deepEqual(
    groups.after.map((task) => task.id),
    ['after'],
  );
  assert.deepEqual(
    groups.later.map((task) => task.id),
    ['later'],
  );
});

test('presence levels celebrate kinds of progress without counting volume', async () => {
  const { activityLevel } = await import('../src/index.ts');
  const event = (type: 'focus_started' | 'step_completed' | 'focus_completed', taskId = 'one') => ({
    id: `${type}-${taskId}`,
    type,
    workspaceItemId: taskId,
    taskId,
    projectId: null,
    occurredAt: '2026-10-16T12:00:00Z',
    metadata: {},
  });
  assert.equal(activityLevel([]), 0);
  assert.equal(activityLevel([event('focus_started')]), 1);
  assert.equal(activityLevel([event('step_completed')]), 2);
  assert.equal(activityLevel([event('focus_completed')]), 3);
  assert.equal(activityLevel([event('focus_started'), event('step_completed', 'two')]), 4);
});

test('greetings and first names stay human without requiring profile data', async () => {
  const { firstName, greetingForHour } = await import('../src/index.ts');
  assert.equal(greetingForHour(8), 'Bom dia');
  assert.equal(greetingForHour(14), 'Boa tarde');
  assert.equal(greetingForHour(22), 'Boa noite');
  assert.equal(firstName(' Letícia Celestino ', 'ignored@example.com'), 'Letícia');
  assert.equal(firstName('', 'pessoa@example.com'), 'pessoa');
  assert.equal(firstName(), 'você');
});

test('presence calendar starts on Sunday and ends today', async () => {
  const { presenceDays } = await import('../src/index.ts');
  const days = presenceDays([], new Date('2026-10-16T12:00:00'));
  assert.equal(days[0].date.getDay(), 0);
  assert.equal(days.at(-1)?.key, '2026-10-16');
  assert.ok(days.length >= 365 && days.length <= 371);
});
