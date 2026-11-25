import type { Focus, Item, Task } from './index.ts';

export type RhythmConfig = {
  mode: 'cycles' | 'free' | 'none';
  focusMinutes: number;
  breakMinutes: number;
  blocks: number;
  eyeCare: boolean;
};
export const defaultRhythm: RhythmConfig = {
  mode: 'cycles',
  focusMinutes: 50,
  breakMinutes: 10,
  blocks: 1,
  eyeCare: false,
};
export type RhythmState = {
  version: 1;
  config: RhythmConfig;
  phase: 'focus' | 'break' | 'checkin' | 'ready' | 'finished';
  block: number;
  phaseSeconds: number;
  phaseTarget: number;
  focusSeconds: number;
  breakSeconds: number;
  eyeSeconds: number;
  eyeRemaining: number;
  eyeDueIn: number;
  paused: boolean;
  lastAt: number;
};
export type RhythmAction =
  | 'pause'
  | 'resume'
  | 'break'
  | 'next'
  | 'extend'
  | 'finish'
  | 'eye'
  | 'defer-eye'
  | 'dismiss-eye';

export function validateRhythmConfig(config: RhythmConfig) {
  if (
    !config ||
    !['cycles', 'free', 'none'].includes(config.mode) ||
    !Number.isInteger(config.focusMinutes) ||
    config.focusMinutes < 1 ||
    config.focusMinutes > 120 ||
    !Number.isInteger(config.breakMinutes) ||
    config.breakMinutes < 1 ||
    config.breakMinutes > 60 ||
    !Number.isInteger(config.blocks) ||
    config.blocks < 1 ||
    config.blocks > 12 ||
    typeof config.eyeCare !== 'boolean'
  )
    throw new Error('Revise o ritmo: foco de 1 a 120 min, pausa de 1 a 60 min e até 12 blocos.');
}
export function personalRhythm(items: Item[]): RhythmConfig {
  return (
    items.find((item): item is Item<'rhythm_preferences'> => item.kind === 'rhythm_preferences')
      ?.payload.config ?? defaultRhythm
  );
}
export function taskRhythm(task: Task, items: Item[]): RhythmConfig {
  return task.rhythm ?? personalRhythm(items);
}
export function rhythmSummary(config: RhythmConfig): string {
  if (config.mode === 'none') return 'Sem cronômetro';
  if (config.mode === 'free') return `Cronômetro livre${config.eyeCare ? ' · cuidado visual' : ''}`;
  const minutes = config.blocks * config.focusMinutes + (config.blocks - 1) * config.breakMinutes;
  return `${config.blocks} ${config.blocks === 1 ? 'bloco' : 'blocos'} de ${config.focusMinutes} min · pausa de ${config.breakMinutes} min · ${minutes} min reservados${config.eyeCare ? ' · cuidado visual' : ''}`;
}
export function createRhythmFocus(
  taskId: string | null,
  title: string,
  step: string,
  config: RhythmConfig,
  now: number,
  previous?: Item<'focus'>,
): Focus {
  validateRhythmConfig(config);
  if (config.mode === 'none') throw new Error('Esta atividade está configurada sem cronômetro.');
  const seed =
    previous &&
    previous.payload.status === 'complete' &&
    previous.payload.purpose !== 'rhythm' &&
    previous.payload.taskId === taskId &&
    previous.payload.completedAt !== undefined &&
    now >= previous.payload.completedAt &&
    now - previous.payload.completedAt <= 300_000
      ? previous.payload.elapsed
      : 0;
  return {
    taskId,
    title,
    step,
    blockers: [],
    target: config.focusMinutes * 60,
    elapsed: 0,
    runningSince: now,
    status: 'active',
    note: previous?.payload.note ?? '',
    mood: null,
    purpose: 'rhythm',
    ...(previous ? { previousFocusId: previous.id } : {}),
    rhythm: {
      version: 1,
      config: { ...config },
      phase: 'focus',
      block: 1,
      phaseSeconds: 0,
      phaseTarget: config.focusMinutes * 60,
      focusSeconds: 0,
      breakSeconds: 0,
      eyeSeconds: 0,
      eyeRemaining: 0,
      eyeDueIn: Math.max(0, 1200 - seed),
      paused: false,
      lastAt: now,
    },
  };
}

// Pure projection: a suspended client never invents additional work/rest cycles.
// Time beyond a phase deadline belongs to the decision interval, not to focus.
export function projectRhythm(focus: Focus, now: number): Focus {
  if (!focus.rhythm || focus.status === 'complete') return focus;
  const r: RhythmState = { ...focus.rhythm, config: { ...focus.rhythm.config } };
  const seconds = Math.max(0, Math.floor((now - r.lastAt) / 1000));
  if (r.paused || !['focus', 'break'].includes(r.phase)) return focus;
  const bounded = r.phase === 'break' || r.config.mode === 'cycles';
  const elapsed = bounded
    ? Math.min(seconds, Math.max(0, r.phaseTarget - r.phaseSeconds))
    : seconds;
  if (r.phase === 'focus') {
    const eye = Math.min(elapsed, r.eyeRemaining);
    r.eyeRemaining -= eye;
    r.eyeSeconds += eye;
    r.focusSeconds += elapsed - eye;
    // An accepted visual break resets the next reminder after its actual end.
    if (focus.rhythm.eyeRemaining > 0 && r.eyeRemaining === 0) r.eyeDueIn = 1200;
    r.eyeDueIn = Math.max(0, r.eyeDueIn - (elapsed - eye));
  } else r.breakSeconds += elapsed;
  r.phaseSeconds += elapsed;
  r.lastAt += elapsed * 1000;
  if (bounded && r.phaseSeconds >= r.phaseTarget) {
    r.phase = r.phase === 'focus' ? 'checkin' : 'ready';
    r.eyeRemaining = 0;
    if (r.phase === 'ready') r.eyeDueIn = 1200;
  }
  return withRhythm(focus, r);
}
function withRhythm(focus: Focus, r: RhythmState): Focus {
  return {
    ...focus,
    rhythm: r,
    elapsed: Math.min(focus.target, r.focusSeconds),
    runningSince: !r.paused && ['focus', 'break'].includes(r.phase) ? r.lastAt : null,
    status: r.phase === 'finished' ? 'complete' : 'active',
  };
}
export function actOnRhythm(focus: Focus, action: RhythmAction, now: number): Focus {
  const current = projectRhythm(focus, now);
  if (!current.rhythm || current.status === 'complete') return current;
  const r: RhythmState = { ...current.rhythm, config: { ...current.rhythm.config } };
  if (action === 'finish') {
    r.phase = 'finished';
    r.eyeRemaining = 0;
  } else if (action === 'pause' && ['focus', 'break'].includes(r.phase)) r.paused = true;
  else if (action === 'resume' && r.paused) r.paused = false;
  else if (action === 'break' && r.phase === 'checkin') {
    r.phase = 'break';
    r.phaseSeconds = 0;
    r.phaseTarget = r.config.breakMinutes * 60;
  } else if (
    action === 'next' &&
    ['checkin', 'ready'].includes(r.phase) &&
    r.block < r.config.blocks
  ) {
    r.block++;
    r.phase = 'focus';
    r.phaseSeconds = 0;
    r.phaseTarget = r.config.focusMinutes * 60;
  } else if (action === 'extend' && r.phase === 'checkin') {
    r.phase = 'focus';
    r.phaseTarget += 5 * 60;
  } else if (
    r.phase === 'focus' &&
    !r.paused &&
    r.config.eyeCare &&
    r.eyeRemaining === 0 &&
    r.eyeDueIn === 0
  ) {
    if (action === 'eye') r.eyeRemaining = 20;
    else if (action === 'defer-eye') r.eyeDueIn = 5 * 60;
    else if (action === 'dismiss-eye') r.eyeDueIn = 20 * 60;
  }
  r.lastAt = Math.max(now, r.lastAt);
  const result = withRhythm(current, r);
  return r.phase === 'finished' ? { ...result, completedAt: now } : result;
}
export function rhythmClock(focus: Focus): number {
  const r = focus.rhythm;
  if (!r) return 0;
  return r.config.mode === 'free' && r.phase === 'focus'
    ? r.phaseSeconds
    : Math.max(0, r.phaseTarget - r.phaseSeconds);
}
export function focusRecordedSeconds(focus: Focus): number {
  return focus.rhythm?.focusSeconds ?? focus.elapsed;
}
export function validateRhythmState(focus: Focus) {
  const r = focus.rhythm;
  if (!r) return;
  validateRhythmConfig(r.config);
  const counters = [
    r.phaseSeconds,
    r.phaseTarget,
    r.focusSeconds,
    r.breakSeconds,
    r.eyeSeconds,
    r.eyeRemaining,
    r.eyeDueIn,
    r.lastAt,
  ];
  if (
    r.version !== 1 ||
    focus.purpose !== 'rhythm' ||
    r.config.mode === 'none' ||
    !['focus', 'break', 'checkin', 'ready', 'finished'].includes(r.phase) ||
    !Number.isInteger(r.block) ||
    r.block < 1 ||
    r.block > r.config.blocks ||
    counters.some((value) => !Number.isSafeInteger(value) || value < 0) ||
    r.phaseTarget < 60 ||
    r.eyeRemaining > 20 ||
    r.eyeDueIn > 1200 ||
    typeof r.paused !== 'boolean' ||
    (focus.status === 'complete') !== (r.phase === 'finished')
  )
    throw new Error('Revise o estado da sessão de ritmo.');
}
