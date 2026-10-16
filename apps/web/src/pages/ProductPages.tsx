import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  dayKey,
  elapsedSeconds,
  formatTime,
  summarize,
  type Item,
  type Focus,
  type Priority,
  type Recurrence,
  type DayPeriod,
  dayPeriodLabels,
  priorityLabels,
  recurrenceLabels,
  projectColors,
  isTaskBlocked,
  orderedTasks,
  toggleStep,
  editSteps,
  type ActivityEvent,
  groupTasksByHorizon,
  taskHorizonLabels,
  type TaskHorizon,
  firstName,
  greetingForHour,
  presenceDays,
} from '@doitbad/core';
import { useWorkspace } from '../lib/workspace';
import { getSession, updateProfileName } from '../lib/auth';
import {
  getPreferences,
  preferencesEvent,
  savePreferences,
  type Preferences,
  type ThemePreference,
} from '../lib/preferences';
import { acceptRecommendation, recommendNextStep } from '../lib/ai';
import Garden from '../components/Garden';
import Ambience from '../components/Ambience';

export function Heading({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{tag}</p>
      <h1>{title}</h1>
      {children && <p className="lede">{children}</p>}
    </header>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
export function Dashboard() {
  const { items } = useWorkspace();
  const [name, setName] = useState('você');
  const [preferences, setPreferences] = useState(getPreferences);
  useEffect(() => {
    void getSession().then((session) =>
      setName(firstName(String(session?.user.user_metadata?.name ?? ''), session?.user.email)),
    );
  }, []);
  useEffect(() => {
    const update = (event: Event) =>
      setPreferences((event as CustomEvent<Preferences>).detail ?? getPreferences());
    window.addEventListener(preferencesEvent, update);
    return () => window.removeEventListener(preferencesEvent, update);
  }, []);
  const stats = summarize(items);
  const active = items.find(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'active',
  );
  const tasks = items.filter((i): i is Item<'task'> => i.kind === 'task' && !i.payload.done);
  const horizons = groupTasksByHorizon(items);
  return (
    <>
      <Heading
        tag={new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        title={`${preferences.contextualGreeting ? greetingForHour() : 'Olá'}, ${name}.`}
      >
        Seu ritmo. Seu próximo passo. Não precisa fazer tudo hoje.
      </Heading>
      <div className="dashboard-grid">
        <section className="hero-panel">
          <div>
            <span className="pill">Um começo possível</span>
            <h2>{active ? 'Vamos guardar o fio da meada?' : 'O começo pode ser pequeno.'}</h2>
            <p>
              {active
                ? active.payload.title
                : 'Dois minutos de presença já podem abrir um caminho.'}
            </p>
            <Link className="button" to={active ? `/foco/${active.id}` : '/tarefa'}>
              {active ? 'Retomar meu passo' : 'Dar o primeiro passo'}{' '}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <Garden />
        </section>
        <section className="card quiet-card">
          <span className="eyebrow">Sem pressa</span>
          <h2>Você pode voltar quantas vezes precisar.</h2>
          <p>Uma pausa faz parte do caminho.</p>
          <Link to="/retomada">Encontrar meu fio da meada →</Link>
        </section>
      </div>
      <div className="metrics">
        <div>
          <strong>{stats.steps}</strong>
          <span>passos registrados</span>
        </div>
        <div>
          <strong>{stats.minutes}</strong>
          <span>minutos de presença</span>
        </div>
        <div>
          <strong>{tasks.length}</strong>
          <span>tarefas abertas</span>
        </div>
      </div>
      <div className="section-title">
        <div>
          <span className="eyebrow">Seu dia continua daqui</span>
          <h2>Agora, depois, quando couber.</h2>
        </div>
        <Link to="/tarefas">Todas as tarefas →</Link>
      </div>
      {tasks.length ? (
        <div className="day-horizons">
          {(Object.keys(horizons) as TaskHorizon[]).map((horizon) => (
            <section className={`card horizon horizon-${horizon}`} key={horizon}>
              <div className="horizon-heading">
                <span className="horizon-dot" aria-hidden="true" />
                <h3>{taskHorizonLabels[horizon]}</h3>
                <small>{horizons[horizon].length}</small>
              </div>
              {horizons[horizon].length ? (
                horizons[horizon].slice(0, 3).map((task) => (
                  <Link className="horizon-task" to={`/tarefa?task=${task.id}`} key={task.id}>
                    <span>{task.payload.title}</span>
                    <small>
                      {isTaskBlocked(task, items)
                        ? 'Esperando um passo anterior'
                        : dayPeriodLabels[task.payload.timeOfDay ?? 'anytime']}
                    </small>
                  </Link>
                ))
              ) : (
                <p>Há espaço aqui.</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <Empty>
          Seu espaço está pronto. <Link to="/tarefas">Adicione sua primeira tarefa.</Link>
        </Empty>
      )}
      <Link className="presence-invite card" to="/pequenos-comecos">
        <span className="round-icon" aria-hidden="true">
          ✦
        </span>
        <span className="grow">
          <strong>Pequenos começos</strong>
          <small>Veja os dias em que você esteve presente, sem sequências obrigatórias.</small>
        </span>
        <span aria-hidden="true">→</span>
      </Link>
    </>
  );
}
export function TasksPage() {
  const { items, save, remove, busy } = useWorkspace();
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState<Priority>('media');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [timeOfDay, setTimeOfDay] = useState<DayPeriod>('anytime');
  const [dependsOn, setDependsOn] = useState('');
  const [date, setDate] = useState(dayKey());
  const [steps, setSteps] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('open');
  const [editing, setEditing] = useState<Item<'task'> | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayKey());
  const [showAllDates, setShowAllDates] = useState(false);
  const tasks = orderedTasks(items);
  const projectItems = items.filter((item): item is Item<'project'> => item.kind === 'project');
  const projects = [
    ...new Set([
      ...projectItems.map((item) => item.payload.title),
      ...tasks.map((task) => task.payload.project).filter(Boolean),
    ]),
  ];
  const suggested = tasks.find((task) => !task.payload.done && !isTaskBlocked(task, items));
  const periods: DayPeriod[] = ['morning', 'afternoon', 'night', 'anytime'];
  const weekStart = new Date(`${selectedDate}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const value = new Date(weekStart);
    value.setDate(value.getDate() + index);
    return { key: dayKey(value), date: value };
  });
  const visibleTasks = tasks.filter(
    (task) =>
      (showAllDates || task.payload.date === selectedDate) &&
      task.payload.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
      (filter === 'all' || task.payload.done === (filter === 'done')),
  );
  function resetEditor() {
    setEditing(undefined);
    setTitle('');
    setProject('');
    setSteps('');
    setPriority('media');
    setRecurrence('none');
    setTimeOfDay('anytime');
    setDependsOn('');
    setDate(selectedDate);
  }
  function openNewTask(period: DayPeriod = 'anytime') {
    resetEditor();
    setTimeOfDay(period);
    setEditorOpen(true);
    window.setTimeout(() => document.getElementById('task-title')?.focus(), 0);
  }
  function openTaskEditor(task: Item<'task'>) {
    setEditing(task);
    setTitle(task.payload.title);
    setProject(task.payload.project);
    setPriority(task.payload.priority ?? 'media');
    setRecurrence(task.payload.recurrence ?? 'none');
    setTimeOfDay(task.payload.timeOfDay ?? 'anytime');
    setDependsOn(task.payload.dependsOn?.[0] ?? '');
    setDate(task.payload.date || selectedDate);
    setSteps(task.payload.steps.join('\n'));
    setEditorOpen(true);
    window.setTimeout(() => document.getElementById('task-title')?.focus(), 0);
  }
  useEffect(() => {
    if (!editorOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditorOpen(false);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [editorOpen]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const projectTitle = project.trim();
    let projectId: string | null;
    if (projectTitle) {
      const existingProject = projectItems.find(
        (item) => item.payload.title.toLocaleLowerCase() === projectTitle.toLocaleLowerCase(),
      );
      if (existingProject) projectId = existingProject.id;
      else {
        const created = await save('project', {
          title: projectTitle,
          color: projectColors[projectItems.length % projectColors.length],
        });
        if (!created) return;
        projectId = created.id;
      }
    } else projectId = null;
    if (
      await save(
        'task',
        {
          ...editing?.payload,
          title: title.trim(),
          priority,
          recurrence,
          timeOfDay,
          dependsOn: dependsOn ? [dependsOn] : [],
          project: projectTitle,
          projectId,
          date,
          done: editing?.payload.done ?? false,
          ...editSteps(
            editing?.payload,
            steps
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        },
        editing,
      )
    ) {
      setSelectedDate(date || selectedDate);
      setShowAllDates(false);
      setEditorOpen(false);
      resetEditor();
    }
  }
  return (
    <section className="tasks-timeline-page">
      <header className="tasks-page-header">
        <div>
          <p className="eyebrow">Seu plano visual</p>
          <h1>O que cabe neste dia?</h1>
          <p>Veja o dia inteiro sem precisar organizar tudo de uma vez.</p>
        </div>
        <button className="button" onClick={() => openNewTask()}>
          + Nova tarefa
        </button>
      </header>

      <nav className="week-strip card" aria-label="Escolher dia">
        <button
          className="week-arrow"
          aria-label="Semana anterior"
          onClick={() => {
            const previous = new Date(`${selectedDate}T12:00:00`);
            previous.setDate(previous.getDate() - 7);
            setSelectedDate(dayKey(previous));
          }}
        >
          ←
        </button>
        {weekDays.map(({ key, date: weekDate }) => (
          <button
            key={key}
            className="week-day"
            aria-pressed={selectedDate === key}
            aria-current={key === dayKey() ? 'date' : undefined}
            onClick={() => {
              setSelectedDate(key);
              setShowAllDates(false);
            }}
          >
            <span>
              {weekDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
            </span>
            <strong>{weekDate.getDate()}</strong>
          </button>
        ))}
        <button
          className="week-arrow"
          aria-label="Próxima semana"
          onClick={() => {
            const next = new Date(`${selectedDate}T12:00:00`);
            next.setDate(next.getDate() + 7);
            setSelectedDate(dayKey(next));
          }}
        >
          →
        </button>
      </nav>

      <div className="task-view-bar">
        <div>
          <h2>
            {showAllDates
              ? 'Todas as tarefas'
              : new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
          </h2>
          <small>{visibleTasks.length} coisas neste recorte</small>
        </div>
        <div className="segmented-control task-scope" aria-label="Escopo das tarefas">
          <button aria-pressed={!showAllDates} onClick={() => setShowAllDates(false)}>
            Este dia
          </button>
          <button aria-pressed={showAllDates} onClick={() => setShowAllDates(true)}>
            Todas
          </button>
        </div>
      </div>

      {suggested && !showAllDates && selectedDate === dayKey() && (
        <aside className="gentle-suggestion">
          <span className="round-icon" aria-hidden="true">
            ↗
          </span>
          <div className="grow">
            <small>Se estiver difícil escolher</small>
            <strong>
              {suggested.payload.steps.find(
                (_, index) => !suggested.payload.completedSteps?.includes(index),
              ) ?? suggested.payload.title}
            </strong>
          </div>
          <Link className="text-button" to={`/tarefa?task=${suggested.id}`}>
            Começar por aqui
          </Link>
        </aside>
      )}

      <details className="task-tools">
        <summary>Buscar e filtrar</summary>
        <div className="filters card">
          <label className="grow">
            Buscar
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome da tarefa"
            />
          </label>
          <label>
            Mostrar
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="open">Em aberto</option>
              <option value="done">Concluídas</option>
              <option value="all">Todas</option>
            </select>
          </label>
        </div>
      </details>

      <div className="daily-task-timeline">
        {periods.map((period) => {
          const periodTasks = visibleTasks.filter(
            (task) => (task.payload.timeOfDay ?? 'anytime') === period,
          );
          return (
            <section className={`task-period task-period-${period}`} key={period}>
              <header>
                <span className="period-mark" aria-hidden="true" />
                <div className="grow">
                  <h2>{dayPeriodLabels[period]}</h2>
                  <small>
                    {period === 'morning'
                      ? 'Um começo calmo para o dia.'
                      : period === 'afternoon'
                        ? 'O que pode continuar depois.'
                        : period === 'night'
                          ? 'Só o que ainda fizer sentido.'
                          : 'Sem hora marcada, sem pressão.'}
                  </small>
                </div>
                <span className="period-count">{periodTasks.length}</span>
                <button
                  className="period-add"
                  aria-label={`Adicionar em ${dayPeriodLabels[period]}`}
                  onClick={() => openNewTask(period)}
                >
                  +
                </button>
              </header>
              <div className="period-list">
                {periodTasks.length ? (
                  periodTasks.map((task) => {
                    const blocked = isTaskBlocked(task, items);
                    const projectItem = projectItems.find(
                      (item) => item.id === task.payload.projectId,
                    );
                    return (
                      <article
                        className={`timeline-task ${blocked ? 'blocked' : ''}`}
                        key={task.id}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Concluir ${task.payload.title}`}
                          checked={task.payload.done}
                          disabled={busy || (blocked && !task.payload.done)}
                          onChange={() =>
                            void save('task', { ...task.payload, done: !task.payload.done }, task)
                          }
                        />
                        <div className="grow">
                          <strong className={task.payload.done ? 'done' : ''}>
                            {task.payload.title}
                          </strong>
                          <div className="task-quiet-meta">
                            {task.payload.project && (
                              <span style={{ color: projectItem?.payload.color }}>
                                {task.payload.project}
                              </span>
                            )}
                            {showAllDates && task.payload.date && (
                              <span>
                                {new Date(`${task.payload.date}T12:00:00`).toLocaleDateString(
                                  'pt-BR',
                                  { day: 'numeric', month: 'short' },
                                )}
                              </span>
                            )}
                            {task.payload.steps.length > 0 && (
                              <span>
                                {task.payload.completedSteps?.length ?? 0}/
                                {task.payload.steps.length} passos
                              </span>
                            )}
                            {blocked && <span>Depois de outra tarefa</span>}
                          </div>
                          {task.payload.steps.length > 0 && (
                            <details className="task-steps-details">
                              <summary>Ver pequenos passos</summary>
                              <MicroSteps task={task} />
                            </details>
                          )}
                        </div>
                        {!blocked && !task.payload.done && (
                          <Link className="task-focus-link" to={`/tarefa?task=${task.id}`}>
                            Focar
                          </Link>
                        )}
                        <details className="task-row-menu">
                          <summary aria-label={`Mais opções para ${task.payload.title}`}>
                            •••
                          </summary>
                          <div>
                            <button onClick={() => openTaskEditor(task)}>Editar</button>
                            <button
                              className="danger"
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm(`Remover “${task.payload.title}”?`))
                                  void remove(task);
                              }}
                            >
                              Remover
                            </button>
                          </div>
                        </details>
                      </article>
                    );
                  })
                ) : (
                  <button className="empty-period" onClick={() => openNewTask(period)}>
                    <span aria-hidden="true">＋</span>
                    <span>Nada planejado aqui. Deixe vazio ou adicione algo.</span>
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {editorOpen && (
        <div className="task-editor-layer">
          <button
            className="task-editor-backdrop"
            aria-label="Fechar editor"
            onClick={() => setEditorOpen(false)}
          />
          <form className="task-editor" onSubmit={submit} role="dialog" aria-modal="true">
            <header>
              <div>
                <p className="eyebrow">{editing ? 'Ajustar com calma' : 'Um novo começo'}</p>
                <h2>{editing ? 'Editar tarefa' : 'Adicionar tarefa'}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Fechar editor"
                onClick={() => setEditorOpen(false)}
              >
                ×
              </button>
            </header>
            <label>
              O que você quer fazer?
              <input
                required
                id="task-title"
                maxLength={240}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Uma frase já basta"
              />
            </label>
            <div className="editor-primary-grid">
              <label>
                Quando?
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label>
                Período do dia
                <select
                  value={timeOfDay}
                  onChange={(event) => setTimeOfDay(event.target.value as DayPeriod)}
                >
                  {Object.entries(dayPeriodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Pequenos passos <span className="optional-label">opcional</span>
              <textarea
                value={steps}
                onChange={(event) => setSteps(event.target.value)}
                maxLength={2000}
                placeholder="Abrir o documento&#10;Escrever uma frase"
              />
            </label>
            <details className="editor-more">
              <summary>Mais opções</summary>
              <div className="stack">
                <label>
                  Projeto
                  <input
                    value={project}
                    maxLength={80}
                    onChange={(event) => setProject(event.target.value)}
                    placeholder="Pessoal, estudos, trabalho…"
                    list="task-projects"
                  />
                  <datalist id="task-projects">
                    {projects.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </label>
                <div className="editor-primary-grid">
                  <label>
                    Prioridade
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as Priority)}
                    >
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Repetir
                    <select
                      value={recurrence}
                      onChange={(event) => setRecurrence(event.target.value as Recurrence)}
                    >
                      {Object.entries(recurrenceLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Começar depois de
                  <select value={dependsOn} onChange={(event) => setDependsOn(event.target.value)}>
                    <option value="">Nada — pode começar já</option>
                    {tasks
                      .filter((task) => task.id !== editing?.id && !task.payload.done)
                      .map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.payload.title}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </details>
            <footer>
              <button type="button" className="text-button" onClick={() => setEditorOpen(false)}>
                Agora não
              </button>
              <button className="button" disabled={busy || !title.trim()}>
                {editing ? 'Salvar alterações' : 'Adicionar ao dia'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
export function StartPage() {
  const { items, save, busy } = useWorkspace();
  const nav = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const task = items.find(
    (i): i is Item<'task'> => i.kind === 'task' && i.id === params.get('task'),
  );
  const [stage, setStage] = useState(0);
  const [title, setTitle] = useState(
    task?.payload.title ?? params.get('title')?.slice(0, 240) ?? '',
  );
  const [step, setStep] = useState(
    task?.payload.steps.find((_, i) => !task.payload.completedSteps?.includes(i)) ?? '',
  );
  const [blockers, setBlockers] = useState<string[]>([]);
  const [duration, setDuration] = useState(() => getPreferences().focusMinutes);
  const [recommendationBusy, setRecommendationBusy] = useState(false);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [createdTask, setCreatedTask] = useState<Item<'task'> | null>(null);
  const active = items.find(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'active',
  );
  async function start() {
    const focusTask = task ?? createdTask;
    const savedTask =
      createdTask && step.trim()
        ? await save(
            'task',
            {
              ...createdTask.payload,
              steps: [step.trim()],
              completedSteps: [],
            },
            createdTask,
          )
        : focusTask;
    const result = await save('focus', {
      taskId: savedTask?.id ?? null,
      title,
      step,
      blockers,
      target: duration * 60,
      elapsed: 0,
      runningSince: Date.now(),
      status: 'active',
      note: '',
      mood: null,
    });
    if (result) {
      const session = await getSession().catch(() => null);
      if (session && recommendationId)
        void acceptRecommendation(session.access_token, recommendationId);
      nav(`/foco/${result.id}`);
    }
  }
  async function findStep() {
    setRecommendationBusy(true);
    try {
      let candidate = task ?? createdTask;
      if (!candidate && title.trim()) {
        candidate = await save('task', {
          title: title.trim(),
          project: '',
          date: dayKey(),
          done: false,
          steps: [],
          priority: 'media',
          completedSteps: [],
          dependsOn: [],
          recurrence: 'none',
        });
        if (candidate) setCreatedTask(candidate);
      }
      const session = await getSession();
      if (session && candidate) {
        const recommendation = await recommendNextStep(session.access_token);
        setStep(recommendation.microaction);
        setRecommendationId(recommendation.id);
        setStage(2);
        return;
      }
      if (!step) setStep('Dedicar dois minutos a um primeiro rascunho');
      setStage(2);
    } catch {
      if (!step) setStep('Abrir o material e escolher por onde começar');
      setStage(2);
    } finally {
      setRecommendationBusy(false);
    }
  }
  const labels = [
    'Não sei por onde começar',
    'Parece coisa demais',
    'Tenho medo de fazer errado',
    'Estou sem energia',
  ];
  if (active)
    return (
      <section className="card focus-card">
        <Heading tag="Um passo de cada vez" title="Seu passo está aqui.">
          Você já tem um começo em andamento. Pode retomá-lo ou encerrá-lo antes de escolher outro.
        </Heading>
        <p>{active.payload.title}</p>
        <Link className="button" to={`/foco/${active.id}`}>
          Retomar meu passo
        </Link>
      </section>
    );
  return (
    <div className="focus-layout">
      <section className="focus-card card">
        <p className="eyebrow">Seu começo · {stage + 1} de 3</p>
        <div className="step-dots" aria-label={`Etapa ${stage + 1} de 3`}>
          {[0, 1, 2].map((n) => (
            <span key={n} className={n <= stage ? 'selected' : ''} />
          ))}
        </div>
        {stage === 0 ? (
          <>
            <h1>O que você precisa fazer?</h1>
            <p>Uma frase já basta. Podemos diminuir depois.</p>
            <label>
              Sua tarefa
              <input
                autoFocus
                value={title}
                maxLength={240}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="O que está na sua cabeça?"
              />
            </label>
            <button className="button" disabled={!title.trim()} onClick={() => setStage(1)}>
              Continuar →
            </button>
          </>
        ) : stage === 1 ? (
          <>
            <h1>O que está te travando?</h1>
            <p>Você pode escolher mais de uma opção, ou seguir sem escolher.</p>
            <div className="stack">
              {labels.map((label) => (
                <label className="choice" key={label}>
                  <input
                    type="checkbox"
                    checked={blockers.includes(label)}
                    onChange={() =>
                      setBlockers((v) =>
                        v.includes(label) ? v.filter((s) => s !== label) : [...v, label],
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              className="button"
              disabled={recommendationBusy}
              onClick={() => void findStep()}
            >
              {recommendationBusy ? 'Encontrando um passo específico…' : 'Encontrar meu passo →'}
            </button>
          </>
        ) : (
          <>
            <h1>Seu único passo agora.</h1>
            <p>{title}</p>
            <label>
              Um passo que cabe hoje
              <textarea value={step} maxLength={240} onChange={(e) => setStep(e.target.value)} />
            </label>
            <button
              className="text-button"
              onClick={() => setStep('Abrir o material e escolher por onde começar')}
            >
              Diminuir este passo
            </button>
            <label>
              Tempo de foco
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {[2, 5, 10, 15, 25].map((n) => (
                  <option key={n} value={n}>
                    {n} minutos
                  </option>
                ))}
              </select>
            </label>
            <button className="button" disabled={busy || !step.trim()} onClick={() => void start()}>
              Iniciar {duration} minutos
            </button>
          </>
        )}
        {stage > 0 && (
          <button className="text-button" onClick={() => setStage(stage - 1)}>
            Voltar
          </button>
        )}
      </section>
      <aside className="focus-aside">
        <Garden />
        <h2>Não precisa sair perfeito.</h2>
        <p>Você só precisa de um começo possível. O restante pode esperar.</p>
      </aside>
    </div>
  );
}
export function TimerPage() {
  const { id } = useParams();
  const { items, save, busy, loading } = useWorkspace();
  const nav = useNavigate();
  const [now, setNow] = useState(Date.now());
  const finishing = useRef(false);
  const item = items.find((i): i is Item<'focus'> => i.kind === 'focus' && i.id === id);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      !item ||
      item.payload.status !== 'active' ||
      elapsedSeconds(item.payload, now) < item.payload.target ||
      finishing.current
    )
      return;
    finishing.current = true;
    void save(
      'focus',
      { ...item.payload, elapsed: item.payload.target, runningSince: null, status: 'complete' },
      item,
    ).then((saved) => {
      if (saved) nav(`/conclusao/${item.id}`, { replace: true });
      else finishing.current = false;
    });
  }, [item, nav, now, save]);
  if (!item)
    return (
      <Empty>
        {loading ? 'Carregando seu passo…' : 'Este passo não foi encontrado.'}{' '}
        <Link to="/atividade">Voltar ao início</Link>
      </Empty>
    );
  const focus = item.payload;
  const elapsed = elapsedSeconds(focus, now);
  const remaining = focus.target - elapsed;
  async function update(payload: Focus, done = false) {
    if (await save('focus', payload, item)) {
      if (done) nav(`/conclusao/${id}`);
    }
  }
  return (
    <div className="focus-layout">
      <section className="card focus-card timer-card">
        <Ambience />
        <span className="pill">Um passo de cada vez</span>
        <h1>{focus.step}</h1>
        <p>{focus.title}</p>
        <div
          className="timer-ring"
          style={{ '--progress': `${(elapsed / focus.target) * 100}%` } as React.CSSProperties}
        >
          <div>
            <strong role="timer" aria-label="Tempo restante">
              {formatTime(remaining)}
            </strong>
            <span>
              {focus.status === 'complete'
                ? 'Passo registrado'
                : remaining === 0
                  ? 'Seu tempo chegou'
                  : focus.runningSince
                    ? 'Você já começou'
                    : 'Uma pausa também cabe'}
            </span>
          </div>
        </div>
        {focus.status === 'active' ? (
          <>
            <div className="button-row">
              <button
                className="button secondary"
                disabled={busy || remaining === 0}
                onClick={() =>
                  void update({
                    ...focus,
                    elapsed,
                    runningSince: focus.runningSince ? null : Date.now(),
                  })
                }
              >
                {focus.runningSince ? 'Pausar' : 'Retomar'}
              </button>
              <button
                className="button"
                disabled={busy}
                onClick={() =>
                  void update({ ...focus, elapsed, runningSince: null, status: 'complete' }, true)
                }
              >
                Encerrar e registrar
              </button>
            </div>
            <Link to="/retomada">Guardar o fio da meada</Link>
          </>
        ) : (
          <Link className="button" to={`/conclusao/${id}`}>
            Ver meu resultado
          </Link>
        )}
      </section>
      <aside className="focus-aside">
        <Garden />
        <h2>Só este momento.</h2>
        <p>O tempo é um convite. Você pode pausar ou encerrar quando precisar.</p>
      </aside>
    </div>
  );
}
export function DonePage() {
  const { id } = useParams();
  const { items, save, busy } = useWorkspace();
  const item = items.find((i): i is Item<'focus'> => i.kind === 'focus' && i.id === id);
  const [note, setNote] = useState(item?.payload.note ?? '');
  const [saved, setSaved] = useState(false);
  const task =
    item && items.find((i): i is Item<'task'> => i.kind === 'task' && i.id === item.payload.taskId);
  if (!item)
    return (
      <Empty>
        Encontre seus passos no <Link to="/historico">histórico</Link>.
      </Empty>
    );
  return (
    <div className="focus-layout">
      <section className="card focus-card">
        <span className="celebration" aria-hidden="true">
          ✦
        </span>
        <Heading tag="Uma pequena vitória" title="Você começou.">
          Esse passo já faz parte do seu caminho.
        </Heading>
        <p>
          {item.payload.title} · {formatTime(item.payload.elapsed)} de presença
        </p>
        <label>
          O que fica para o próximo passo?
          <textarea
            maxLength={1000}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            placeholder="Guarde uma pista para quando voltar…"
          />
        </label>
        <button
          className="button secondary"
          disabled={busy}
          onClick={async () => {
            if (await save('focus', { ...item.payload, note }, item)) setSaved(true);
          }}
        >
          Guardar meu fio da meada
        </button>
        {saved && <p role="status">Sua anotação foi guardada.</p>}
        {task && (
          <label className="choice">
            <input
              type="checkbox"
              checked={task.payload.done}
              disabled={busy}
              onChange={() =>
                void save('task', { ...task.payload, done: !task.payload.done }, task)
              }
            />
            Concluí também esta tarefa
          </label>
        )}
        <div className="button-row">
          <Link className="button" to="/tarefa">
            Dar outro passo
          </Link>
          <Link to="/historico">Ver meu histórico</Link>
        </div>
      </section>
      <aside className="focus-aside">
        <Garden />
        <h2>Pequeno também conta.</h2>
      </aside>
    </div>
  );
}
export function HistoryPage() {
  const { items } = useWorkspace();
  const [period, setPeriod] = useState<'Semana' | 'Mês' | 'Ano'>('Semana');
  const cutoff = Date.now() - { Semana: 7, Mês: 30, Ano: 365 }[period] * 86400000;
  const stats = summarize(items.filter((i) => new Date(i.created_at).getTime() >= cutoff));
  const allSessions = summarize(items).sessions;
  const days = new Set(allSessions.map((item) => dayKey(new Date(item.created_at))));
  let streak = 0;
  const cursor = new Date();
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const started = new Set(stats.sessions.map((item) => item.payload.taskId || item.payload.title))
    .size;
  const goal = Math.min(100, Math.round((stats.minutes / 20) * 100));
  return (
    <section className="history-reference">
      <p className="history-kicker">Cada ação conta. Mesmo as pequenas.</p>
      <div className="history-hero">
        <div>
          <h1>{stats.minutes} minutos</h1>
          <h2>de execução</h2>
          <p>Olá, você — cada começo faz parte do seu caminho.</p>
        </div>
        <div className="history-goal" aria-label={`${goal}% da meta do período`}>
          <strong>{goal}%</strong>
          <small>Meta do período</small>
        </div>
      </div>
      <div className="segmented-control history-period" aria-label="Período">
        {(['Semana', 'Mês', 'Ano'] as const).map((value) => (
          <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>
            {value}
          </button>
        ))}
      </div>
      <div className="history-metrics card">
        {[
          ['✓', 'Passos dados', stats.steps],
          ['◷', 'Minutos focados', stats.minutes],
          ['✦', 'Tarefas iniciadas', started],
          ['⚑', 'Sequência atual', `${streak} dias`],
        ].map(([icon, label, value]) => (
          <div key={label}>
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="history-actions">
        <Link to="/desafios">Desafios</Link>
        <Link to="/zen">Modo Zen</Link>
        <Link to="/retomada">Recovery</Link>
      </div>
      <h3>Sua semana</h3>
      {!stats.steps && <p>Seu primeiro passo vai aparecer aqui.</p>}
      <div className="stack history-list">
        {stats.sessions.slice(0, 5).map((i) => (
          <article className="card task-row" key={i.id}>
            <span className="round-icon" aria-hidden="true">
              ✓
            </span>
            <div className="grow">
              <h3>{i.payload.title}</h3>
              <p>{i.payload.step}</p>
              <small>
                {formatTime(i.payload.elapsed)} ·{' '}
                {new Date(i.created_at).toLocaleDateString('pt-BR')}
              </small>
              {i.payload.note && <blockquote>{i.payload.note}</blockquote>}
            </div>
            <Link to={`/conclusao/${i.id}`}>Revisitar</Link>
          </article>
        ))}
      </div>
      <Link className="button history-new" to="/tarefa">
        Novo desafio de 2 minutos
      </Link>
    </section>
  );
}
const activityLabels: Record<ActivityEvent['type'], string> = {
  task_created: 'Tarefa acolhida',
  task_completed: 'Tarefa concluída',
  step_completed: 'Microação concluída',
  focus_started: 'Foco iniciado',
  focus_resumed: 'Foco retomado',
  focus_completed: 'Sessão de foco concluída',
  mood_logged: 'Como você estava foi registrado',
};
export function SmallBeginningsPage() {
  const { events } = useWorkspace();
  const [selected, setSelected] = useState(dayKey());
  const days = presenceDays(events);
  const selectedDay = days.find((day) => day.key === selected);
  const selectedEvents = selectedDay?.events ?? [];
  return (
    <section className="presence-page">
      <Heading tag="Pequenos começos" title="Você esteve aqui.">
        Um mapa de presença, não uma cobrança. Pausas também fazem parte do caminho.
      </Heading>
      <div className="card presence-card">
        <div className="presence-summary">
          <div>
            <strong>
              {new Set(events.map((event) => dayKey(new Date(event.occurredAt)))).size}
            </strong>
            <span>dias em que você voltou</span>
          </div>
          <div className="presence-legend" aria-label="Intensidade de presença">
            <span>Um começo</span>
            {[1, 2, 3, 4].map((level) => (
              <i key={level} className={`presence-cell level-${level}`} />
            ))}
            <span>Mais de uma frente</span>
          </div>
        </div>
        <div className="presence-scroll">
          <div className="presence-grid" aria-label="Presença nos últimos doze meses">
            {days.map((day) => (
              <button
                key={day.key}
                className={`presence-cell level-${day.level}`}
                aria-label={`${day.date.toLocaleDateString('pt-BR')}: ${day.events.length ? `${day.events.length} registros` : 'dia de pausa'}`}
                aria-pressed={selected === day.key}
                title={`${day.date.toLocaleDateString('pt-BR')} · ${day.events.length ? `${day.events.length} registros` : 'Dia de pausa'}`}
                onClick={() => setSelected(day.key)}
              />
            ))}
          </div>
        </div>
        <p className="presence-footnote">Dias sem registro aparecem como espaço, não como falha.</p>
      </div>
      <div className="section-title presence-day-title">
        <div>
          <p className="eyebrow">O que ficou deste dia</p>
          <h2>
            {new Date(`${selected}T12:00:00`).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h2>
        </div>
      </div>
      {selectedEvents.length ? (
        <div className="stack presence-events">
          {selectedEvents.map((event) => (
            <article className="card" key={event.id}>
              <span className="round-icon" aria-hidden="true">
                {event.type === 'mood_logged' ? '♡' : event.type.includes('focus') ? '◷' : '✓'}
              </span>
              <div className="grow">
                <span className="eyebrow">{activityLabels[event.type]}</span>
                <h3>
                  {String(event.metadata.title ?? event.metadata.step ?? 'Um gesto de presença')}
                </h3>
                {Boolean(event.metadata.step && event.metadata.title) && (
                  <p>{String(event.metadata.step)}</p>
                )}
                <small>
                  {new Date(event.occurredAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty>Dia de pausa. Ele também pertence ao seu caminho.</Empty>
      )}
    </section>
  );
}
export function CalendarPage() {
  const { items, save, busy } = useWorkspace();
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState(dayKey());
  const [view, setView] = useState<'month' | 'day'>('month');
  function move(direction: number) {
    if (view === 'month') setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1));
    else {
      const next = new Date(`${selected}T12:00:00`);
      next.setDate(next.getDate() + direction);
      setSelected(dayKey(next));
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const tasks = orderedTasks(items);
  const selectedTasks = tasks.filter((t) => t.payload.date === selected);
  const periods: DayPeriod[] = ['morning', 'afternoon', 'night', 'anytime'];
  return (
    <>
      <Heading tag="Espaço para o que importa" title="Seu calendário, com respiro." />
      <div className="segmented-control" aria-label="Visualização do calendário">
        <button aria-pressed={view === 'month'} onClick={() => setView('month')}>
          Mês
        </button>
        <button aria-pressed={view === 'day'} onClick={() => setView('day')}>
          Dia
        </button>
      </div>
      <div className="split-layout">
        <section className="card">
          <div className="section-title">
            <button
              aria-label={view === 'month' ? 'Mês anterior' : 'Dia anterior'}
              className="icon-button"
              onClick={() => move(-1)}
            >
              ←
            </button>
            <h2>
              {(view === 'month' ? month : new Date(`${selected}T12:00:00`)).toLocaleDateString(
                'pt-BR',
                { day: view === 'day' ? 'numeric' : undefined, month: 'long', year: 'numeric' },
              )}
            </h2>
            <button
              aria-label={view === 'month' ? 'Próximo mês' : 'Próximo dia'}
              className="icon-button"
              onClick={() => move(1)}
            >
              →
            </button>
          </div>
          {view === 'month' && (
            <div className="calendar-grid">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <span key={d}>{d}</span>
              ))}
              {Array.from({ length: month.getDay() }, (_, n) => (
                <span key={`empty-${n}`} />
              ))}
              {Array.from({ length: count }, (_, n) => {
                const day = dayKey(new Date(month.getFullYear(), month.getMonth(), n + 1));
                const total = tasks.filter((t) => t.payload.date === day).length;
                return (
                  <button
                    key={day}
                    className={selected === day ? 'selected' : ''}
                    aria-pressed={selected === day}
                    aria-label={`${n + 1}, ${total} tarefas`}
                    onClick={() => {
                      setSelected(day);
                      setView('day');
                    }}
                  >
                    {n + 1}
                    {total > 0 && (
                      <small>
                        {total} <span className="desktop-label">tarefas</span>
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {view === 'day' && (
            <p>Um passo de cada vez. Veja as tarefas deste dia e marque o que já concluiu.</p>
          )}
        </section>
        <aside className="card">
          <h2>
            {new Date(`${selected}T12:00:00`).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
            })}
          </h2>
          {periods.map((period) => {
            const periodTasks = selectedTasks.filter(
              (t) => (t.payload.timeOfDay ?? 'anytime') === period,
            );
            if (!periodTasks.length) return null;
            return (
              <section className="agenda-period" key={period}>
                <p className="eyebrow">{dayPeriodLabels[period]}</p>
                {periodTasks.map((t) => (
                  <div className="micro-step" key={t.id}>
                    <input
                      type="checkbox"
                      aria-label={`Concluir ${t.payload.title}`}
                      checked={t.payload.done}
                      disabled={busy}
                      onChange={() => void save('task', { ...t.payload, done: !t.payload.done }, t)}
                    />
                    <Link to={`/tarefa?task=${t.id}`}>
                      {t.payload.done ? '✓ ' : ''}
                      {t.payload.title}
                    </Link>
                    {(t.payload.recurrence ?? 'none') !== 'none' && (
                      <small>{recurrenceLabels[t.payload.recurrence ?? 'none']}</small>
                    )}
                  </div>
                ))}
              </section>
            );
          })}
          {!selectedTasks.length && <p>Um dia com espaço. Você decide o que cabe aqui.</p>}
          <Link className="button secondary" to="/tarefas">
            Organizar tarefas
          </Link>
        </aside>
      </div>
    </>
  );
}
function MicroSteps({ task }: { task: Item<'task'> }) {
  const { save, busy } = useWorkspace();
  return (
    <div>
      {task.payload.steps.map((step, index) => (
        <label key={index} className="micro-step">
          <input
            type="checkbox"
            checked={task.payload.completedSteps?.includes(index) ?? false}
            disabled={busy}
            onChange={() => void save('task', toggleStep(task.payload, index), task)}
          />
          <span>{step}</span>
        </label>
      ))}
    </div>
  );
}
export function MapPage() {
  const { items } = useWorkspace();
  const tasks = orderedTasks(items);
  return (
    <>
      <Heading tag="Mapa de execução" title="Um caminho feito de pequenos passos.">
        Escolha por onde seguir. Você pode mudar o ritmo.
      </Heading>
      {!tasks.length && (
        <Empty>
          Adicione uma tarefa para construir seu mapa. <Link to="/tarefas">Criar tarefa</Link>
        </Empty>
      )}
      <div className="map-grid">
        {tasks.map((t, n) => (
          <article className="card map-stop" key={t.id}>
            <span className="round-icon">{t.payload.done ? '✓' : n + 1}</span>
            <h2>{t.payload.title}</h2>
            <p>{t.payload.project || 'Seu caminho'}</p>
            {t.payload.steps.length ? <MicroSteps task={t} /> : <p>Escolher um primeiro passo</p>}
            <Link className="button secondary" to={`/tarefa?task=${t.id}`}>
              Escolher este caminho
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
export function ChallengesPage() {
  const { items } = useWorkspace();
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - ((since.getDay() + 6) % 7));
  const stats = summarize(items.filter((i) => new Date(i.created_at) >= since));
  const challenges = [
    {
      title: 'Um começo em três dias',
      text: 'Três dias nesta semana, no seu ritmo.',
      value: stats.days,
      total: 3,
    },
    {
      title: 'Dez minutos de presença',
      text: 'Some pequenos momentos de foco.',
      value: stats.minutes,
      total: 10,
    },
    {
      title: 'Cinco pequenos passos',
      text: 'Cada tentativa registrada faz parte.',
      value: stats.steps,
      total: 5,
    },
  ];
  return (
    <>
      <Heading tag="Desafios gentis" title="Um convite, nunca uma cobrança.">
        O progresso considera esta semana. Pausas não apagam seu histórico.
      </Heading>
      <div className="card-grid">
        {challenges.map((c) => (
          <article className="card challenge" key={c.title}>
            <span className="celebration" aria-hidden="true">
              ✦
            </span>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <progress aria-label={c.title} value={Math.min(c.value, c.total)} max={c.total} />
            <p>
              {Math.min(c.value, c.total)} de {c.total} ·{' '}
              {c.value >= c.total ? 'Você chegou lá!' : 'Há espaço para começar'}
            </p>
            <Link to="/tarefa">Dar um passo →</Link>
          </article>
        ))}
      </div>
    </>
  );
}
export function RecoveryPage() {
  const { items, save, busy } = useWorkspace();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const active = items.find(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'active',
  );
  const last = summarize(items).sessions[0];
  return (
    <section className="night-panel">
      <span className="eyebrow">Seu fio da meada</span>
      <h1>Você pode voltar de onde está.</h1>
      <p>Não precisa recuperar o tempo. Só encontrar o próximo gesto.</p>
      <Garden />
      {active ? (
        <div className="card">
          <h2>{active.payload.title}</h2>
          <p>{active.payload.step}</p>
          {active.payload.note && <blockquote>{active.payload.note}</blockquote>}
          <label>
            Uma pista para sua próxima visita
            <textarea
              value={note}
              maxLength={1000}
              onChange={(e) => {
                setNote(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          <div className="button-row">
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                if (
                  await save(
                    'focus',
                    {
                      ...active.payload,
                      note,
                      elapsed: elapsedSeconds(active.payload),
                      runningSince: null,
                    },
                    active,
                  )
                )
                  setSaved(true);
              }}
            >
              Pausar e guardar
            </button>
            <Link to={`/foco/${active.id}`}>Retomar este passo</Link>
          </div>
          {saved && <p role="status">Passo pausado e anotação guardada.</p>}
        </div>
      ) : (
        <div>
          <p>
            {last?.payload.note ||
              'Quando você guardar uma pista ao concluir um passo, ela aparece aqui.'}
          </p>
          <Link className="button" to="/tarefa">
            Escolher um novo começo
          </Link>
        </div>
      )}
    </section>
  );
}
export function StatsPage() {
  const { items, save, busy } = useWorkspace();
  const [value, setValue] = useState(3);
  const [note, setNote] = useState('');
  const moods = items.filter((i): i is Item<'mood'> => i.kind === 'mood');
  const labels = ['Muito baixo', 'Baixo', 'Neutro', 'Bem', 'Muito bem'];
  return (
    <>
      <Heading tag="Como você está" title="Um espaço para se perceber.">
        Registros opcionais para observar como você se sente, sem julgamentos.
      </Heading>
      <div className="split-layout">
        <section className="card">
          <h2>Seus registros recentes</h2>
          {!moods.length ? (
            <Empty>Seu gráfico começa com o primeiro registro.</Empty>
          ) : (
            <>
              <div className="mood-chart" aria-hidden="true">
                {moods
                  .slice(0, 14)
                  .reverse()
                  .map((m) => (
                    <div key={m.id}>
                      <span style={{ height: `${m.payload.value * 28}px` }} />
                      <small>
                        {new Date(m.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </small>
                    </div>
                  ))}
              </div>
              <ul className="mood-list">
                {moods.slice(0, 14).map((m) => (
                  <li key={m.id}>
                    <strong>{labels[m.payload.value - 1]}</strong> ·{' '}
                    {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    {m.payload.note && <p>{m.payload.note}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <form
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await save('mood', { value, note })) setNote('');
          }}
        >
          <h2>Como você se sente agora?</h2>
          <label>
            Seu momento
            <select value={value} onChange={(e) => setValue(Number(e.target.value))}>
              {labels.map((s, i) => (
                <option value={i + 1} key={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quer guardar algo sobre hoje?
            <textarea maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button className="button" disabled={busy}>
            Guardar meu registro
          </button>
          <small>Esses registros descrevem seus relatos. Não são uma avaliação clínica.</small>
        </form>
      </div>
    </>
  );
}
export function ZenPage() {
  const { save, busy } = useWorkspace();
  const nav = useNavigate();
  const [minutes, setMinutes] = useState(() => getPreferences().focusMinutes);
  return (
    <section className="zen-panel">
      <Ambience />
      <Garden />
      <Heading tag="Modo zen" title="Um pouco de espaço para você.">
        Encontre uma posição confortável. Deixe o próximo momento ser simples.
      </Heading>
      <label>
        Tempo para desacelerar
        <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
          {[2, 5, 10, 15, 25].map((n) => (
            <option key={n} value={n}>
              {n} minutos
            </option>
          ))}
        </select>
      </label>
      <button
        className="button"
        disabled={busy}
        onClick={async () => {
          const i = await save('focus', {
            taskId: null,
            title: 'Um momento de pausa',
            step: 'Respirar e estar aqui',
            blockers: [],
            target: minutes * 60,
            elapsed: 0,
            runningSince: Date.now(),
            status: 'active',
            note: '',
            mood: null,
          });
          if (i) nav(`/foco/${i.id}`);
        }}
      >
        Começar meu momento
      </button>
    </section>
  );
}

export function SettingsPage() {
  const [preferences, setPreferences] = useState(getPreferences);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  useEffect(() => {
    void getSession().then((session) => {
      setName(String(session?.user.user_metadata?.name ?? ''));
      setEmail(session?.user.email ?? '');
    });
  }, []);
  function updatePreferences(next: Partial<Preferences>) {
    const value = { ...preferences, ...next };
    setPreferences(value);
    savePreferences(value);
  }
  return (
    <section className="settings-page">
      <Heading tag="Seu espaço, do seu jeito" title="Configurações">
        Ajustes simples para o DoItBad acompanhar seu ritmo sem criar mais cobrança.
      </Heading>
      <div className="settings-layout">
        <nav className="settings-index" aria-label="Seções de configurações">
          <a href="#perfil">Perfil</a>
          <a href="#aparencia">Aparência</a>
          <a href="#foco">Foco e som</a>
          <a href="#privacidade">Dados e privacidade</a>
        </nav>
        <div className="settings-sections">
          <section className="card settings-card" id="perfil">
            <header>
              <div>
                <p className="eyebrow">Perfil</p>
                <h2>Como podemos chamar você?</h2>
              </div>
              <span className="settings-icon" aria-hidden="true">
                ☺
              </span>
            </header>
            <form
              className="stack"
              onSubmit={async (event) => {
                event.preventDefault();
                setSavingProfile(true);
                setProfileMessage('');
                try {
                  await updateProfileName(name);
                  setProfileMessage('Nome atualizado. Que bom ter você por aqui.');
                } catch {
                  setProfileMessage('Não foi possível atualizar agora. Tente novamente.');
                } finally {
                  setSavingProfile(false);
                }
              }}
            >
              <label>
                Seu nome
                <input
                  value={name}
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                E-mail da conta
                <input value={email} disabled readOnly />
              </label>
              <div className="settings-action-row">
                <button className="button" disabled={savingProfile || !name.trim()}>
                  {savingProfile ? 'Salvando…' : 'Salvar nome'}
                </button>
                {profileMessage && <p role="status">{profileMessage}</p>}
              </div>
            </form>
          </section>

          <section className="card settings-card" id="aparencia">
            <header>
              <div>
                <p className="eyebrow">Aparência</p>
                <h2>Uma luz confortável para você.</h2>
              </div>
              <span className="settings-icon" aria-hidden="true">
                ☾
              </span>
            </header>
            <fieldset className="preference-options">
              <legend>Tema</legend>
              {(
                [
                  ['light', 'Claro', 'Creme e superfícies quentes'],
                  ['dark', 'Noturno', 'Verde profundo e contraste suave'],
                  ['system', 'Do dispositivo', 'Acompanha o sistema automaticamente'],
                ] as [ThemePreference, string, string][]
              ).map(([value, label, description]) => (
                <label className="preference-choice" key={value}>
                  <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={preferences.theme === value}
                    onChange={() => updatePreferences({ theme: value })}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="setting-toggle">
              <span>
                <strong>Saudação pelo horário</strong>
                <small>Usar “Bom dia”, “Boa tarde” ou “Boa noite”.</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.contextualGreeting}
                onChange={(event) =>
                  updatePreferences({ contextualGreeting: event.target.checked })
                }
              />
            </label>
          </section>

          <section className="card settings-card" id="foco">
            <header>
              <div>
                <p className="eyebrow">Foco e som</p>
                <h2>Começar com o tamanho certo.</h2>
              </div>
              <span className="settings-icon" aria-hidden="true">
                ◷
              </span>
            </header>
            <fieldset className="compact-options">
              <legend>Duração sugerida para novos focos</legend>
              {[2, 5, 10, 15, 25].map((minutes) => (
                <button
                  type="button"
                  key={minutes}
                  aria-pressed={preferences.focusMinutes === minutes}
                  onClick={() => updatePreferences({ focusMinutes: minutes })}
                >
                  {minutes} min
                </button>
              ))}
            </fieldset>
            <label className="volume-setting">
              <span>
                <strong>Volume dos sons suaves</strong>
                <small>O som só começa quando você pedir.</small>
              </span>
              <span className="volume-control">
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.05"
                  value={preferences.soundVolume}
                  onChange={(event) =>
                    updatePreferences({ soundVolume: Number(event.target.value) })
                  }
                />
                <output>{Math.round(preferences.soundVolume * 100)}%</output>
              </span>
            </label>
          </section>

          <section className="card settings-card" id="privacidade">
            <header>
              <div>
                <p className="eyebrow">Dados e privacidade</p>
                <h2>Seu espaço continua sendo seu.</h2>
              </div>
              <span className="settings-icon" aria-hidden="true">
                ◇
              </span>
            </header>
            <p>
              Suas tarefas, sessões e registros ficam ligados à sua conta para sincronizar web e
              aplicativo.
            </p>
            <div className="privacy-note">
              <strong>Excluir dados</strong>
              <p>
                Para evitar uma exclusão acidental, o fluxo definitivo de remoção da conta será
                confirmado em uma etapa protegida.
              </p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
export function WelcomePage() {
  return (
    <main className="welcome-page">
      <div className="welcome-copy">
        <Link className="brand" to="/boas-vindas">
          DoIt<span>B</span>ad
        </Link>
        <h1>Que bom te ver por aqui!</h1>
        <p>Vamos transformar intenção em ação. Um passo de cada vez.</p>
        <div className="welcome-art">
          <svg viewBox="0 0 320 220" role="img" aria-label="Ambiente aconchegante com plantas">
            <rect
              x="24"
              y="20"
              width="90"
              height="110"
              rx="10"
              fill="#eee4d5"
              stroke="#d9ccb2"
              strokeWidth="3"
            />
            <path d="M40 120c0-24 8-44 18-44s18 20 18 44" fill="#c9d3b0" />
            <path d="M58 120V70" stroke="#7c8a58" strokeWidth="3" />
            <rect x="180" y="120" width="26" height="40" rx="4" fill="#b98a63" />
            <path
              d="M193 120c-18-2-26-16-24-34 14 2 24 12 24 34zM193 118c14-4 22-16 20-32-12 2-20 12-20 32z"
              fill="#7c8a58"
            />
            <path d="M0 190h320v30H0z" fill="#d9ccb2" />
            <ellipse cx="150" cy="190" rx="60" ry="12" fill="#c7b593" />
            <path d="M96 178c-8 0-12 6-12 14h24c0-8-4-14-12-14zM90 168l4 8 4-8z" fill="#3d392f" />
          </svg>
        </div>
        <div className="button-row">
          <Link className="button" to="/entrar?mode=signup">
            Vamos começar
          </Link>
          <Link to="/entrar">Já tenho uma conta</Link>
        </div>
      </div>
    </main>
  );
}

export function SplashPage({ signedIn }: { signedIn: boolean }) {
  const nav = useNavigate();
  useEffect(() => {
    const timer = window.setTimeout(
      () => nav(signedIn ? '/atividade' : '/boas-vindas', { replace: true }),
      2100,
    );
    return () => window.clearTimeout(timer);
  }, [nav, signedIn]);
  return (
    <main className="splash-page" aria-label="DoItBad">
      <div className="splash-copy">
        <div className="brand splash-brand">
          DoIt<span>B</span>ad
        </div>
        <p>Pequenos passos.</p>
        <p>Grandes mudanças.</p>
      </div>
      <svg
        className="splash-illustration"
        viewBox="0 0 320 260"
        role="img"
        aria-label="Pessoa sentada numa colina sob a lua"
      >
        <circle cx="238" cy="58" r="26" fill="#e4c579" />
        <circle cx="248" cy="52" r="22" fill="#f4ede1" />
        <path d="M70 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#c8a05a" />
        <path d="M120 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#c8a05a" />
        <path d="M290 110l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#c8a05a" />
        <path d="M0 260c40-70 100-96 160-96s120 26 160 96H0z" fill="#a9a06f" />
        <path d="M0 260c50-50 108-64 160-64s110 14 160 64H0z" fill="#8f8a52" />
        <path d="M150 150c-10 8-14 26-14 40h44c2-16-2-34-12-42-6-4-12-3-18 2z" fill="#526148" />
        <path d="M150 190c-14 2-22 8-28 18h30zM178 190c12 2 20 8 24 16h-26z" fill="#526148" />
        <circle cx="163" cy="132" r="15" fill="#c88a63" />
        <path d="M150 128c0-12 8-18 15-18s14 6 14 16c-6-4-10-4-16-2-5 2-9 3-13 4z" fill="#4a3f34" />
      </svg>
      <div className="splash-progress" role="progressbar" aria-label="Preparando seu espaço">
        <span />
      </div>
    </main>
  );
}
