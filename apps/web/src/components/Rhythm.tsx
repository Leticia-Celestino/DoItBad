import RhythmSignal from './RhythmSignal';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  actOnRhythm,
  createRhythmFocus,
  focusRecordedSeconds,
  formatTime,
  isTaskBlocked,
  personalRhythm,
  projectRhythm,
  rhythmClock,
  rhythmSummary,
  taskRhythm,
  type Item,
  type RhythmAction,
  type RhythmConfig,
} from '@doitbad/core';
import { useWorkspace } from '../lib/workspace';

export function RhythmFields({
  value,
  onChange,
}: {
  value: RhythmConfig;
  onChange: (value: RhythmConfig) => void;
}) {
  return (
    <div className="stack rhythm-fields">
      <label>
        Forma de acompanhar
        <select
          value={value.mode}
          onChange={(e) => onChange({ ...value, mode: e.target.value as RhythmConfig['mode'] })}
        >
          <option value="cycles">Blocos de foco e pausa</option>
          <option value="free">Cronômetro livre</option>
          <option value="none">Sem cronômetro</option>
        </select>
      </label>
      {value.mode === 'cycles' && (
        <>
          <div className="button-row">
            <button
              type="button"
              className="button secondary"
              onClick={() => onChange({ ...value, focusMinutes: 25, breakMinutes: 5 })}
            >
              25 / 5
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => onChange({ ...value, focusMinutes: 50, breakMinutes: 10 })}
            >
              50 / 10
            </button>
          </div>
          <div className="editor-primary-grid">
            <label>
              Foco (minutos)
              <input
                type="number"
                min={1}
                max={120}
                required
                value={value.focusMinutes}
                onChange={(e) => onChange({ ...value, focusMinutes: Number(e.target.value) })}
              />
            </label>
            <label>
              Pausa (minutos)
              <input
                type="number"
                min={1}
                max={60}
                required
                value={value.breakMinutes}
                onChange={(e) => onChange({ ...value, breakMinutes: Number(e.target.value) })}
              />
            </label>
            <label>
              Quantidade de blocos
              <input
                type="number"
                min={1}
                max={12}
                required
                value={value.blocks}
                onChange={(e) => onChange({ ...value, blocks: Number(e.target.value) })}
              />
            </label>
          </div>
          <p>O tempo reservado inclui pausas entre blocos. A pausa final é uma escolha sua.</p>
        </>
      )}
      {value.mode !== 'none' && (
        <label className="choice">
          <input
            type="checkbox"
            checked={value.eyeCare}
            onChange={(e) => onChange({ ...value, eyeCare: e.target.checked })}
          />
          Lembrar de descansar os olhos — 20-20-20
        </label>
      )}
      {value.mode !== 'none' && value.eyeCare && (
        <p>
          A cada 20 minutos, um convite para olhar por 20 segundos a cerca de 6 metros. As
          micropausas cabem no bloco reservado.
        </p>
      )}
    </div>
  );
}
export function TaskRhythmFields({
  value,
  onChange,
}: {
  value: RhythmConfig | null;
  onChange: (value: RhythmConfig | null) => void;
}) {
  const { items } = useWorkspace();
  return (
    <details className="editor-more">
      <summary>Ritmo para quando eu começar · opcional</summary>
      <label>
        Ritmo desta atividade
        <select
          value={value ? 'custom' : 'inherit'}
          onChange={(e) =>
            onChange(e.target.value === 'inherit' ? null : { ...personalRhythm(items) })
          }
        >
          <option value="inherit">Usar meu padrão</option>
          <option value="custom">Personalizar esta atividade</option>
        </select>
      </label>
      {value ? (
        <RhythmFields value={value} onChange={onChange} />
      ) : (
        <p>{rhythmSummary(personalRhythm(items))}</p>
      )}
      <p>Se começar estiver difícil, a ajuda de dois minutos continua disponível.</p>
    </details>
  );
}
export function RhythmDefaults() {
  const { items, save, busy } = useWorkspace();
  const stored = items.find(
    (i): i is Item<'rhythm_preferences'> => i.kind === 'rhythm_preferences',
  );
  const [value, setValue] = useState(() => personalRhythm(items));
  const [message, setMessage] = useState('');
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setMessage('');
        if (await save('rhythm_preferences', { config: value }, stored))
          setMessage('Seu ritmo foi salvo. Sessões em andamento mantêm sua configuração.');
      }}
    >
      <h3>Meu ritmo</h3>
      <p>
        Para quando você já sabe como começar. A ajuda de dois minutos permanece sem configuração.
      </p>
      <RhythmFields value={value} onChange={setValue} />
      <button className="button" disabled={busy}>
        Salvar meu ritmo
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function TaskRhythmActions({ task }: { task: Item<'task'> }) {
  const { items } = useWorkspace();
  if (task.payload.done || isTaskBlocked(task, items)) return null;
  return (
    <div className="rhythm-task-actions">
      <Link className="text-button" to={`/ritmo?task=${task.id}`}>
        Começar meu ritmo
      </Link>
      <Link className="text-button" to={`/tarefa?task=${task.id}`}>
        Me ajude a começar
      </Link>
    </div>
  );
}
export function RhythmStartPage() {
  const [params] = useSearchParams();
  const { items, save, busy } = useWorkspace();
  const nav = useNavigate();
  const previous = items.find(
    (i): i is Item<'focus'> =>
      i.kind === 'focus' && i.id === params.get('from') && i.payload.status === 'complete',
  );
  const task = items.find(
    (i): i is Item<'task'> =>
      i.kind === 'task' && i.id === (params.get('task') ?? previous?.payload.taskId),
  );
  const [config, setConfig] = useState<RhythmConfig>(() =>
    task ? taskRhythm(task.payload, items) : personalRhythm(items),
  );
  const [step, setStep] = useState(
    () =>
      previous?.payload.note ||
      task?.payload.steps.find((_, n) => !task.payload.completedSteps?.includes(n)) ||
      task?.payload.title ||
      previous?.payload.step ||
      '',
  );
  const active = items.find(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'active',
  );
  const [error, setError] = useState('');
  if (!task && !previous)
    return (
      <section className="card">
        <h1>Escolha uma atividade</h1>
        <Link to="/tarefas">Ir para minhas tarefas</Link>
      </section>
    );
  if (active)
    return (
      <section className="card">
        <h1>Seu momento continua aqui</h1>
        <p>Retome ou encerre sua sessão antes de iniciar outra.</p>
        <Link className="button" to={`/foco/${active.id}`}>
          Retomar sessão
        </Link>
      </section>
    );
  const blocked = task && (task.payload.done || isTaskBlocked(task, items));
  return (
    <section className="card stack rhythm-start">
      <p className="eyebrow">Continuidade no seu ritmo</p>
      <h1>{task?.payload.title ?? previous?.payload.title}</h1>
      <p>{rhythmSummary(config)}</p>
      <label>
        O que você quer fazer neste momento?
        <input maxLength={240} value={step} onChange={(e) => setStep(e.target.value)} />
      </label>
      <details>
        <summary>Ajustar apenas esta sessão</summary>
        <RhythmFields value={config} onChange={setConfig} />
      </details>
      {error && <p role="alert">{error}</p>}
      {blocked ? (
        <p>Esta tarefa já foi concluída ou depende de outra atividade.</p>
      ) : config.mode === 'none' ? (
        <>
          <p>Faça no seu tempo. Você pode registrar a conclusão na tarefa quando quiser.</p>
          <Link className="button" to="/tarefas">
            Voltar à atividade
          </Link>
        </>
      ) : (
        <button
          className="button"
          disabled={busy || !step.trim()}
          onClick={async () => {
            setError('');
            try {
              const result = await save(
                'focus',
                createRhythmFocus(
                  task?.id ?? null,
                  task?.payload.title ?? previous!.payload.title,
                  step.trim(),
                  config,
                  Date.now(),
                  previous,
                ),
              );
              if (result) nav(`/foco/${result.id}`);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Revise seu ritmo.');
            }
          }}
        >
          Começar meu ritmo
        </button>
      )}
      <Link to={task ? `/tarefa?task=${task.id}` : '/tarefa'}>
        Está difícil hoje? Me ajude a começar
      </Link>
    </section>
  );
}
export function useRhythmNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export function RhythmTimer({ item }: { item: Item<'focus'> }) {
  const { items, save, busy } = useWorkspace();
  const nav = useNavigate();
  const now = useRhythmNow();
  const focus = projectRhythm(item.payload, now);
  const r = focus.rhythm!;
  const [note, setNote] = useState(focus.note);
  const [noteEdited, setNoteEdited] = useState(false);
  async function act(action: RhythmAction) {
    const result = await save(
      'focus',
      {
        ...actOnRhythm(item.payload, action, Date.now()),
        note: noteEdited ? note : item.payload.note,
      },
      item,
    );
    if (result) setNoteEdited(false);
    if (result?.payload.status === 'complete') nav(`/conclusao/${item.id}`);
  }
  const next = items.filter(
    (i): i is Item<'task'> =>
      i.kind === 'task' && i.id !== focus.taskId && !i.payload.done && !isTaskBlocked(i, items),
  );
  const eyeDue =
    r.config.eyeCare &&
    r.phase === 'focus' &&
    !r.paused &&
    r.eyeRemaining === 0 &&
    r.eyeDueIn === 0;
  return (
    <div className="focus-layout">
      <section className="card focus-card stack">
        <p className="eyebrow">
          {r.paused
            ? 'Sessão pausada'
            : r.phase === 'focus'
              ? 'No seu ritmo'
              : r.phase === 'break'
                ? 'Tempo de descanso'
                : r.phase === 'ready'
                  ? 'Voltar é uma escolha'
                  : 'Um momento para decidir'}
        </p>
        <h1>{focus.title}</h1>
        <p>{focus.step}</p>
        {r.config.mode === 'cycles' && (
          <p>
            Bloco {r.block} de {r.config.blocks}
          </p>
        )}
        <strong
          className="rhythm-clock"
          role="timer"
          aria-label={r.config.mode === 'free' ? 'Tempo transcorrido' : 'Tempo restante'}
        >
          {formatTime(rhythmClock(focus))}
        </strong>
        <RhythmSignal focus={focus} />
        {r.phase === 'focus' && (
          <p>
            {r.config.mode === 'cycles'
              ? `Depois deste bloco, você pode fazer uma pausa de ${r.config.breakMinutes} min.`
              : 'Você escolhe quando pausar ou encerrar.'}
          </p>
        )}
        {r.eyeRemaining > 0 && (
          <div className="rhythm-care">
            <strong>Olhe ao longe por {r.eyeRemaining} segundos.</strong>
            <p>Procure algo a cerca de 6 metros. Você não precisa acompanhar a tela.</p>
          </div>
        )}
        {eyeDue && (
          <div className="rhythm-care" role="status">
            <strong>Um descanso para os olhos?</strong>
            <p>Olhe por 20 segundos para algo a cerca de 6 metros.</p>
            <div className="button-row">
              <button className="button secondary" disabled={busy} onClick={() => void act('eye')}>
                Começar 20 segundos
              </button>
              <button className="text-button" disabled={busy} onClick={() => void act('defer-eye')}>
                Adiar 5 min
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => void act('dismiss-eye')}
              >
                Dispensar
              </button>
            </div>
          </div>
        )}
        {['focus', 'break'].includes(r.phase) && (
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => void act(r.paused ? 'resume' : 'pause')}
          >
            {r.paused ? 'Retomar' : 'Pausar'}
          </button>
        )}
        {r.phase === 'checkin' && (
          <div role="status">
            <h2>Você chegou ao tempo planejado.</h2>
            <p>Como quer seguir?</p>
            <div className="button-row">
              <button className="button" disabled={busy} onClick={() => void act('break')}>
                Fazer pausa de {r.config.breakMinutes} min
              </button>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void act('extend')}
              >
                Acrescentar 5 min
              </button>
            </div>
          </div>
        )}
        {r.phase === 'ready' && (
          <p role="status">Sua pausa terminou. O próximo bloco só começa quando você quiser.</p>
        )}
        {['ready', 'checkin'].includes(r.phase) && r.block < r.config.blocks && (
          <button className="button secondary" disabled={busy} onClick={() => void act('next')}>
            Iniciar próximo bloco
          </button>
        )}
        <label>
          Quando voltar, qual é o próximo gesto? <span className="optional-label">opcional</span>
          <textarea
            maxLength={1000}
            value={noteEdited ? note : item.payload.note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteEdited(true);
            }}
          />
        </label>
        <button className="button secondary" disabled={busy} onClick={() => void act('finish')}>
          Encerrar e registrar
        </button>
        <p>
          {formatTime(focusRecordedSeconds(focus))} de foco · {formatTime(r.breakSeconds)} de
          descanso · {formatTime(r.eyeSeconds)} de cuidado visual
        </p>
      </section>
      <aside className="focus-aside">
        <h2>Outras atividades continuam disponíveis</h2>
        <p>Encerre e registre este momento antes de trocar de atividade.</p>
        {next.slice(0, 4).map((task) => (
          <p key={task.id}>{task.payload.title}</p>
        ))}
        <Link to="/tarefas">Ver meu dia</Link>
      </aside>
    </div>
  );
}
export function RhythmMini() {
  const { items } = useWorkspace();
  const now = useRhythmNow();
  const item = items.find(
    (i): i is Item<'focus'> =>
      i.kind === 'focus' && i.payload.status === 'active' && !!i.payload.rhythm,
  );
  if (!item) return null;
  const focus = projectRhythm(item.payload, now);
  const r = focus.rhythm!;
  return (
    <Link className="rhythm-mini" to={`/foco/${item.id}`}>
      <strong>{focus.title}</strong>
      <span>
        {r.paused
          ? 'Pausado'
          : r.phase === 'checkin'
            ? 'Tempo concluído — escolha como seguir'
            : r.phase === 'ready'
              ? 'Pausa concluída — retome quando quiser'
              : `${formatTime(rhythmClock(focus))} · ${r.phase === 'break' ? 'descanso' : 'foco'}`}
      </span>
      {r.config.eyeCare &&
        r.phase === 'focus' &&
        !r.paused &&
        r.eyeDueIn === 0 &&
        r.eyeRemaining === 0 && <span>Descanso visual disponível</span>}
    </Link>
  );
}
