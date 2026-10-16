import type { SupabaseClient } from '@supabase/supabase-js';

export const colors = {
  canvas: '#F4EDE1',
  canvasSoft: '#EEE4D5',
  surface: '#FBF6EC',
  surfaceRaised: '#FFFAF1',
  ink: '#343E31',
  inkSoft: '#635E53',
  muted: '#625D53',
  line: '#DCD1BF',
  sage: '#526148',
  sageSoft: '#DCE1CD',
  terracotta: '#985033',
  butter: '#E8C77F',
  butterSoft: '#F4E8C8',
  peach: '#E8AF8D',
  night: '#171C19',
  nightSurface: '#222A24',
  nightRaised: '#293229',
  nightInk: '#F4ECDC',
  nightMuted: '#B7AE9D',
  nightLine: '#3B463C',
};
export type Priority = 'alta' | 'media' | 'baixa';
export type Recurrence = 'none' | 'daily' | 'weekly';
export type DayPeriod = 'morning' | 'afternoon' | 'night' | 'anytime';
export const dayPeriodLabels: Record<DayPeriod, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
  anytime: 'Qualquer horário',
};
export type Project = { title: string; color: string };
export type Task = {
  title: string;
  project: string;
  date: string;
  done: boolean;
  steps: string[];
  priority?: Priority;
  completedSteps?: number[];
  dependsOn?: string[];
  recurrence?: Recurrence;
  timeOfDay?: DayPeriod;
  projectId?: string | null;
};
export const projectColors = ['#526148', '#985033', '#E8C77F', '#E8AF8D', '#635E53'];
export const priorityLabels = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
export const recurrenceLabels = { none: 'Uma vez', daily: 'Diária', weekly: 'Semanal' };
export function isTaskBlocked(task: Item<'task'>, items: Item[]): boolean {
  return (task.payload.dependsOn ?? []).some((id) => {
    const dependency = items.find(
      (item): item is Item<'task'> => item.kind === 'task' && item.id === id,
    );
    return Boolean(dependency && !dependency.payload.done);
  });
}
export function orderedTasks(items: Item[]): Item<'task'>[] {
  const rank = { alta: 0, media: 1, baixa: 2 };
  const base = items
    .filter((i): i is Item<'task'> => i.kind === 'task')
    .sort(
      (a, b) =>
        Number(a.payload.done) - Number(b.payload.done) ||
        Number(isTaskBlocked(a, items)) - Number(isTaskBlocked(b, items)) ||
        rank[a.payload.priority ?? 'media'] - rank[b.payload.priority ?? 'media'] ||
        a.created_at.localeCompare(b.created_at),
    );
  const tasks = new Map(base.map((task) => [task.id, task]));
  const ordered: Item<'task'>[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(task: Item<'task'>) {
    if (visited.has(task.id) || visiting.has(task.id)) return;
    visiting.add(task.id);
    for (const dependencyId of task.payload.dependsOn ?? []) {
      const dependency = tasks.get(dependencyId);
      if (dependency && !dependency.payload.done) visit(dependency);
    }
    visiting.delete(task.id);
    visited.add(task.id);
    ordered.push(task);
  }
  base.forEach(visit);
  return ordered;
}
export function taskSequencePosition(task: Item<'task'>, items: Item[]) {
  const related = orderedTasks(items).filter(
    (candidate) =>
      candidate.payload.projectId === task.payload.projectId &&
      Boolean(candidate.payload.projectId) &&
      !candidate.payload.done,
  );
  const position = related.findIndex((candidate) => candidate.id === task.id);
  return position < 0 || related.length < 2
    ? null
    : { position: position + 1, total: related.length };
}
export type TaskHorizon = 'today' | 'after' | 'later';
export const taskHorizonLabels: Record<TaskHorizon, string> = {
  today: 'Hoje',
  after: 'Depois',
  later: 'Mais tarde',
};
export function groupTasksByHorizon(items: Item[], today = dayKey()) {
  const end = new Date(`${today}T12:00:00`);
  end.setDate(end.getDate() + 7);
  const afterEnd = dayKey(end);
  const groups: Record<TaskHorizon, Item<'task'>[]> = { today: [], after: [], later: [] };
  orderedTasks(items)
    .filter((task) => !task.payload.done)
    .forEach((task) => {
      if (task.payload.date && task.payload.date <= today) groups.today.push(task);
      else if (task.payload.date && task.payload.date <= afterEnd) groups.after.push(task);
      else groups.later.push(task);
    });
  return groups;
}
export function toggleStep(task: Task, index: number): Task {
  if (!Number.isInteger(index) || index < 0 || index >= task.steps.length) return task;
  const completed = task.completedSteps ?? [];
  return {
    ...task,
    completedSteps: completed.includes(index)
      ? completed.filter((i) => i !== index)
      : [...completed, index],
  };
}
export function editSteps(
  task: Task | undefined,
  steps: string[],
): Pick<Task, 'steps' | 'completedSteps'> {
  // Match occurrences, so reordering or removing a step does not complete an unrelated one.
  const used = new Set<number>();
  const completedSteps: number[] = [];
  steps.forEach((step, index) => {
    const previous = task?.steps.findIndex((text, i) => text === step && !used.has(i)) ?? -1;
    if (previous >= 0) {
      used.add(previous);
      if (task?.completedSteps?.includes(previous)) completedSteps.push(index);
    }
  });
  return { steps, completedSteps };
}
export type Focus = {
  taskId: string | null;
  title: string;
  step: string;
  blockers: string[];
  target: number;
  elapsed: number;
  runningSince: number | null;
  status: 'active' | 'complete';
  note: string;
  mood: number | null;
};
export type Mood = { value: number; note: string };
export type ActivityEventType =
  | 'task_created'
  | 'task_completed'
  | 'step_completed'
  | 'focus_started'
  | 'focus_resumed'
  | 'focus_completed'
  | 'mood_logged';
export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  workspaceItemId: string | null;
  taskId: string | null;
  projectId: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
};
export type Payloads = { task: Task; focus: Focus; mood: Mood; project: Project };
export type Kind = keyof Payloads;
export type Item<K extends Kind = Kind> = K extends Kind
  ? { id: string; kind: K; payload: Payloads[K]; revision: number; created_at: string }
  : never;
export type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};
export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function greetingForHour(
  hour = new Date().getHours(),
): 'Bom dia' | 'Boa tarde' | 'Boa noite' {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
export function firstName(name?: string | null, email?: string | null): string {
  const value = name?.trim() || email?.split('@')[0].trim() || 'você';
  return value.split(/\s+/)[0];
}
export function elapsedSeconds(focus: Focus, now = Date.now()): number {
  return Math.min(
    focus.target,
    Math.max(
      0,
      focus.elapsed +
        (focus.runningSince === null ? 0 : Math.floor((now - focus.runningSince) / 1000)),
    ),
  );
}
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}
export function summarize(items: Item[]) {
  const sessions = items.filter(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'complete',
  );
  return {
    sessions,
    steps: sessions.length,
    minutes: Math.floor(sessions.reduce((n, i) => n + i.payload.elapsed, 0) / 60),
    days: new Set(sessions.map((i) => dayKey(new Date(i.created_at)))).size,
  };
}
export function deriveActivityEvents(items: Item[]): ActivityEvent[] {
  return items.flatMap((item): ActivityEvent[] => {
    const common = {
      workspaceItemId: item.id,
      occurredAt: item.created_at,
      projectId: null,
    };
    if (item.kind === 'task')
      return [
        {
          ...common,
          id: `legacy-task-${item.id}`,
          type: item.payload.done ? 'task_completed' : 'task_created',
          taskId: item.id,
          projectId: item.payload.projectId ?? null,
          metadata: { title: item.payload.title, historical: true },
        },
      ];
    if (item.kind === 'focus')
      return [
        {
          ...common,
          id: `legacy-focus-${item.id}`,
          type: item.payload.status === 'complete' ? 'focus_completed' : 'focus_started',
          taskId: item.payload.taskId,
          metadata: {
            title: item.payload.title,
            step: item.payload.step,
            seconds: item.payload.elapsed,
            historical: true,
          },
        },
      ];
    if (item.kind === 'mood')
      return [
        {
          ...common,
          id: `legacy-mood-${item.id}`,
          type: 'mood_logged',
          taskId: null,
          metadata: { value: item.payload.value, note: item.payload.note, historical: true },
        },
      ];
    return [];
  });
}
export async function loadActivityEvents(
  client: SupabaseClient | null,
  items: Item[],
): Promise<ActivityEvent[]> {
  if (!client) return deriveActivityEvents(items);
  const { data, error } = await client
    .from('activity_events')
    .select('id,event_type,workspace_item_id,task_id,project_id,occurred_at,metadata')
    .order('occurred_at', { ascending: false })
    .limit(2000);
  if (error) return deriveActivityEvents(items);
  return (data ?? []).map((event) => ({
    id: event.id,
    type: event.event_type as ActivityEventType,
    workspaceItemId: event.workspace_item_id,
    taskId: event.task_id,
    projectId: event.project_id,
    occurredAt: event.occurred_at,
    metadata: event.metadata ?? {},
  }));
}
export function activityLevel(events: ActivityEvent[]): 0 | 1 | 2 | 3 | 4 {
  if (!events.length) return 0;
  const fronts = new Set(
    events.map((event) => event.taskId ?? event.projectId ?? event.workspaceItemId ?? event.id),
  );
  if (fronts.size > 1) return 4;
  if (events.some((event) => event.type === 'focus_completed')) return 3;
  if (events.some((event) => ['step_completed', 'task_completed'].includes(event.type))) return 2;
  return 1;
}
export function presenceDays(events: ActivityEvent[], today = new Date()) {
  const end = new Date(today);
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());
  const byDay = new Map<string, ActivityEvent[]>();
  events.forEach((event) => {
    const key = dayKey(new Date(event.occurredAt));
    byDay.set(key, [...(byDay.get(key) ?? []), event]);
  });
  const result = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = new Date(cursor);
    const key = dayKey(date);
    const dayEvents = byDay.get(key) ?? [];
    result.push({ key, date, events: dayEvents, level: activityLevel(dayEvents) });
  }
  return result;
}
export function validate<K extends Kind>(kind: K, payload: Payloads[K]) {
  if (kind === 'task') {
    const p = payload as Task;
    if (!p.title.trim() || p.title.length > 240)
      throw new Error('Escreva uma tarefa com até 240 caracteres.');
    if (
      p.date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || dayKey(new Date(`${p.date}T12:00:00`)) !== p.date)
    )
      throw new Error('Escolha uma data válida.');
    if (p.project.length > 80 || p.steps.join('\n').length > 2000)
      throw new Error('Diminua o projeto ou a lista de passos.');
    if (p.priority !== undefined && !['alta', 'media', 'baixa'].includes(p.priority))
      throw new Error('Escolha uma prioridade válida.');
    if (p.recurrence !== undefined && !['none', 'daily', 'weekly'].includes(p.recurrence))
      throw new Error('Escolha uma recorrência válida.');
    if (
      p.timeOfDay !== undefined &&
      !['morning', 'afternoon', 'night', 'anytime'].includes(p.timeOfDay)
    )
      throw new Error('Escolha um período válido.');
    if (
      p.dependsOn &&
      (new Set(p.dependsOn).size !== p.dependsOn.length ||
        p.dependsOn.some((id) => typeof id !== 'string' || !id.trim()))
    )
      throw new Error('Revise as dependências da tarefa.');
    if (
      p.completedSteps &&
      (new Set(p.completedSteps).size !== p.completedSteps.length ||
        p.completedSteps.some((i) => !Number.isInteger(i) || i < 0 || i >= p.steps.length))
    )
      throw new Error('Revise as microações concluídas.');
  }
  if (kind === 'focus') {
    const p = payload as Focus;
    if (
      !p.title.trim() ||
      !p.step.trim() ||
      p.title.length > 240 ||
      p.step.length > 240 ||
      p.note.length > 1000 ||
      !Number.isFinite(p.elapsed) ||
      p.elapsed < 0 ||
      p.elapsed > p.target ||
      (p.runningSince !== null && !Number.isFinite(p.runningSince)) ||
      !Number.isFinite(p.target) ||
      p.target < 60 ||
      p.target > 7200
    )
      throw new Error('Revise a tarefa, o passo e a duração.');
  }
  if (kind === 'mood') {
    const p = payload as Mood;
    if (!Number.isInteger(p.value) || p.value < 1 || p.value > 5)
      throw new Error('Escolha como você se sente.');
    if (p.note.length > 1000) throw new Error('Use até 1000 caracteres na anotação.');
  }
  if (kind === 'project') {
    const p = payload as Project;
    if (!p.title.trim() || p.title.length > 80) throw new Error('Use um nome de projeto válido.');
    if (!/^#[0-9a-f]{6}$/i.test(p.color)) throw new Error('Escolha uma cor de projeto válida.');
  }
}

// Each mutation touches one record. Revision checks reject stale edits from another device.
export function createRepository(
  client: SupabaseClient | null,
  storage: Storage,
  uuid: () => string,
) {
  const key = 'doitbad-workspace-v1';
  const pending = new Map<string, string>();
  async function list(): Promise<Item[]> {
    if (client) {
      const { data, error } = await client
        .from('workspace_items')
        .select('id,kind,payload,revision,created_at')
        .order('created_at', { ascending: false });
      if (error)
        throw new Error('Não foi possível sincronizar. Confira a conexão e tente novamente.');
      return data as Item[];
    }
    const value = JSON.parse((await storage.getItem(key)) ?? '[]');
    if (!Array.isArray(value)) throw new Error('Não foi possível ler os registros locais.');
    return value;
  }
  async function save<K extends Kind>(
    kind: K,
    payload: Payloads[K],
    previous?: Item<K>,
  ): Promise<Item<K>> {
    validate(kind, payload);
    const requestKey = JSON.stringify([kind, payload]);
    const newId = previous?.id ?? pending.get(requestKey) ?? uuid();
    if (!previous) pending.set(requestKey, newId);
    const item = {
      id: newId,
      kind,
      payload,
      revision: (previous?.revision ?? 0) + 1,
      created_at: previous?.created_at ?? new Date().toISOString(),
    } as Item<K>;
    if (client) {
      const query = previous
        ? client
            .from('workspace_items')
            .update({ payload, revision: item.revision })
            .eq('id', previous.id)
            .eq('revision', previous.revision)
        : client.from('workspace_items').insert(item);
      const { data, error } = await query
        .select('id,kind,payload,revision,created_at')
        .maybeSingle();
      // A lost response can hide a committed write. Retry the same ID, then verify
      // the stored payload instead of creating a duplicate or overwriting a conflict.
      if ((!previous && error?.code === '23505') || (previous && !error && !data)) {
        const { data: existing } = await client
          .from('workspace_items')
          .select('id,kind,payload,revision,created_at')
          .eq('id', item.id)
          .maybeSingle();
        if (
          existing &&
          existing.revision === item.revision &&
          existing.kind === kind &&
          Object.entries(payload).every(
            ([key, value]) => JSON.stringify(existing.payload[key]) === JSON.stringify(value),
          )
        ) {
          pending.delete(requestKey);
          return existing as Item<K>;
        }
      }
      if (error)
        throw new Error('Não foi possível salvar. Seu formulário foi preservado; tente novamente.');
      if (!data)
        throw new Error(
          'Este registro mudou em outro dispositivo. Atualize os dados antes de editar novamente.',
        );
      pending.delete(requestKey);
      return data as Item<K>;
    }
    const items = await list();
    if (
      !previous &&
      kind === 'focus' &&
      items.some((i) => i.kind === 'focus' && i.payload.status === 'active')
    )
      throw new Error('Você já tem um passo em andamento. Retome ou encerre esse passo primeiro.');
    if (previous && items.find((i) => i.id === previous.id)?.revision !== previous.revision)
      throw new Error('Este registro mudou. Atualize os dados.');
    await storage.setItem(key, JSON.stringify([item, ...items.filter((i) => i.id !== item.id)]));
    pending.delete(requestKey);
    return item;
  }
  async function remove(previous: Item): Promise<void> {
    if (client) {
      const { data, error } = await client
        .from('workspace_items')
        .delete()
        .eq('id', previous.id)
        .eq('revision', previous.revision)
        .select('id')
        .maybeSingle();
      if (error) throw new Error('Não foi possível remover. Tente novamente.');
      if (!data)
        throw new Error(
          'Este registro mudou em outro dispositivo. Atualize os dados antes de remover.',
        );
      return;
    }
    const items = await list();
    if (items.find((item) => item.id === previous.id)?.revision !== previous.revision)
      throw new Error('Este registro mudou. Atualize os dados.');
    await storage.setItem(key, JSON.stringify(items.filter((item) => item.id !== previous.id)));
  }
  return { list, save, remove };
}
