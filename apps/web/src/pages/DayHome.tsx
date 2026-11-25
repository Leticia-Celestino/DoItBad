import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  dayKey,
  dayPeriodLabels,
  editSteps,
  firstName,
  greetingForHour,
  isTaskBlocked,
  orderedTasks,
  type Item,
  type DayPeriod,
} from '@doitbad/core';
import { useWorkspace } from '../lib/workspace';
import { getSession } from '../lib/auth';
import { getPreferences, preferencesEvent } from '../lib/preferences';
import { acceptRecommendation, recommendNextStep, type AIRecommendation } from '../lib/ai';
import Companion from '../components/Companion';

export default function DayHome() {
  const { items, save, busy } = useWorkspace();
  const [name, setName] = useState(() => getPreferences().displayName);
  const [preferences, setPreferences] = useState(getPreferences);
  const [choice, setChoice] = useState(0);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [recommendationBusy, setRecommendationBusy] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState('');
  useEffect(() => {
    let mounted = true;
    void getSession()
      .then((session) => {
        if (mounted && session)
          setName(
            getPreferences().displayName ||
              firstName(String(session.user.user_metadata?.name ?? ''), session.user.email),
          );
      })
      .catch(() => undefined);
    const update = () => {
      const next = getPreferences();
      setPreferences(next);
      setName(next.displayName);
    };
    window.addEventListener(preferencesEvent, update);
    return () => {
      mounted = false;
      window.removeEventListener(preferencesEvent, update);
    };
  }, []);
  const today = dayKey();
  const tasks = orderedTasks(items).filter((task) => !task.payload.done);
  const todayTasks = orderedTasks(items).filter((task) => task.payload.date === today);
  const available = tasks.filter(
    (task) => !isTaskBlocked(task, items) && (!task.payload.date || task.payload.date <= today),
  );
  const next = available[choice % Math.max(available.length, 1)];
  const active = items.find(
    (item): item is Item<'focus'> => item.kind === 'focus' && item.payload.status === 'active',
  );
  const paused = active && !active.payload.runningSince;
  const recent = items
    .filter(
      (item): item is Item<'focus'> => item.kind === 'focus' && item.payload.status === 'complete',
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const step = next?.payload.steps.find(
    (_, index) => !next.payload.completedSteps?.includes(index),
  );
  const recommendedTask = recommendation
    ? (tasks.find((task) => task.id === recommendation.task_id) ?? next)
    : next;
  const greeting = preferences.contextualGreeting ? greetingForHour() : 'Olá';

  async function findMicroaction() {
    if (!next) return;
    setRecommendationBusy(true);
    setRecommendationMessage('');
    try {
      const session = await getSession();
      if (session) {
        setRecommendation(await recommendNextStep(session.access_token));
      } else {
        setRecommendation({
          id: null,
          task_id: next.id,
          task_revision: next.revision,
          microaction: step ?? `Abrir “${next.payload.title}” e fazer o primeiro gesto possível`,
          reason: 'Um começo pequeno reduz a pressão sem exigir que você termine tudo agora.',
          estimated_minutes: 2,
          source: 'deterministic',
          model: null,
        });
      }
    } catch {
      setRecommendation({
        id: null,
        task_id: next.id,
        task_revision: next.revision,
        microaction: step ?? `Abrir “${next.payload.title}” e escolher o primeiro detalhe`,
        reason: 'Você só precisa experimentar este começo por dois minutos.',
        estimated_minutes: 2,
        source: 'deterministic',
        model: null,
      });
      setRecommendationMessage('A IA está descansando; preparamos um começo seguro por aqui.');
    } finally {
      setRecommendationBusy(false);
    }
  }

  async function keepMicroaction() {
    if (!recommendation || !recommendedTask) return;
    const steps = recommendedTask.payload.steps.includes(recommendation.microaction)
      ? recommendedTask.payload.steps
      : [...recommendedTask.payload.steps, recommendation.microaction];
    const saved = await save(
      'task',
      {
        ...recommendedTask.payload,
        ...editSteps(recommendedTask.payload, steps),
        date: today,
      },
      recommendedTask,
    );
    if (!saved) return;
    const session = await getSession().catch(() => null);
    if (session && recommendation.id)
      void acceptRecommendation(session.access_token, recommendation.id);
    setRecommendationMessage('Microação guardada em Minhas tarefas e no Calendário de hoje.');
  }
  return (
    <div className="day-home">
      <header className="day-greeting">
        <p className="eyebrow">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        <h1>
          {greeting}
          {name ? `, ${name}` : ''}
          <span>.</span>
        </h1>
        <p>Vamos encontrar o que cabe hoje?</p>
      </header>
      <section
        className={`day-invitation ${recommendation ? 'has-recommendation' : ''}`}
        aria-labelledby="invitation-title"
      >
        <div className="invitation-copy">
          <span className="hand-note">
            {active ? 'o fio continua aqui' : 'um passo já é um começo'}
          </span>
          <h2 id="invitation-title">
            {active
              ? paused
                ? 'Pode voltar\ncom calma.'
                : 'Seu passo\nestá acontecendo.'
              : next
                ? 'Só o próximo\npequeno gesto.'
                : 'Abra espaço\npara um começo.'}
          </h2>
          <p>
            {active
              ? paused
                ? 'Seu passo ficou guardado. Continue de onde parou, no seu tempo.'
                : 'Você pode continuar ou fazer uma pausa quando precisar.'
              : next
                ? 'Escolhemos uma tarefa disponível. Você pode começar por ela ou escolher outra.'
                : tasks.length
                  ? 'O que está planejado pode esperar. Você também pode escolher um começo livre.'
                  : 'Uma ideia, uma tarefa, algo que está na sua cabeça. Uma frase já basta.'}
          </p>
          {(active || next) && !recommendation && (
            <div className="next-paper">
              <small>{active ? 'Onde você estava' : 'Um começo possível'}</small>
              <strong>{active?.payload.title ?? next?.payload.title}</strong>
              <span>
                {active?.payload.step ?? step ?? 'Abra o que precisa e escolha por onde começar.'}
              </span>
              {active?.payload.note && <p>{active.payload.note}</p>}
            </div>
          )}
          {!active && recommendation && recommendedTask && (
            <div className="ai-microaction" aria-live="polite">
              <div className="ai-microaction-heading">
                <small>Seu começo de 2 minutos</small>
                <span>2 min</span>
              </div>
              <strong>{recommendation.microaction}</strong>
              <p>
                <span>{recommendedTask.payload.title}</span> · {recommendation.reason}
              </p>
              <div className="ai-microaction-actions">
                <Link
                  className="button"
                  to={`/tarefa?task=${recommendedTask.id}&suggestion=${encodeURIComponent(recommendation.microaction)}`}
                >
                  Começar agora
                </Link>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void keepMicroaction()}
                >
                  Guardar para hoje
                </button>
                <button className="text-button" onClick={() => setRecommendation(null)}>
                  Tentar outra
                </button>
              </div>
            </div>
          )}
          <div className="invitation-actions">
            {!active && next && !recommendation && (
              <Link className="button secondary" to={`/ritmo?task=${next.id}`}>
                Começar meu ritmo
              </Link>
            )}
            {!recommendation && (
              <Link
                className="button"
                to={
                  active
                    ? `/foco/${active.id}`
                    : next
                      ? `/tarefa?task=${next.id}`
                      : '/tarefas?new=1'
                }
              >
                {active
                  ? paused
                    ? 'Continuar daqui'
                    : 'Voltar ao meu foco'
                  : next
                    ? 'Me ajude a começar'
                    : 'Colocar uma coisa no papel'}{' '}
                <span aria-hidden="true">↗</span>
              </Link>
            )}
            {!active && next && !recommendation && (
              <button
                className="ai-assist-button"
                disabled={recommendationBusy}
                onClick={() => void findMicroaction()}
              >
                <span aria-hidden="true">✦</span>
                {recommendationBusy ? 'Encontrando um começo…' : 'Quebrar em uma microação com IA'}
              </button>
            )}
            {!active && available.length > 1 && (
              <button className="text-button" onClick={() => setChoice((value) => value + 1)}>
                Escolher outra
              </button>
            )}
            {active && (
              <Link className="text-button" to="/retomada">
                Guardar para depois
              </Link>
            )}
          </div>
          {recommendationMessage && (
            <p className="microaction-message" role="status">
              {recommendationMessage}
            </p>
          )}
        </div>
        <div className="invitation-art">
          <div className="invitation-orbit" />
          <span className="paper-whisper">
            {paused ? 'uma pausa\ntambém cabe.' : 'do seu jeito.\nno seu tempo.'}
          </span>
          <Companion state={paused ? 'pause' : active ? 'focus' : 'welcome'} />
        </div>
      </section>
      <section className="day-plan" aria-labelledby="day-plan-title">
        <div className="section-title">
          <div>
            <p className="eyebrow">Um dia com respiro</p>
            <h2 id="day-plan-title">O que cabe neste dia.</h2>
          </div>
          <Link to="/tarefas">
            Abrir meu dia <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="day-periods">
          {(['morning', 'afternoon', 'night', 'anytime'] as DayPeriod[]).map((period, index) => {
            const entries = todayTasks.filter(
              (task) => (task.payload.timeOfDay ?? 'anytime') === period,
            );
            return (
              <section className={`day-pocket pocket-${period}`} key={period}>
                <header>
                  <span className="pocket-symbol" aria-hidden="true">
                    {['◔', '☀', '☾', '∿'][index]}
                  </span>
                  <h3>{dayPeriodLabels[period]}</h3>
                </header>
                {entries.length ? (
                  entries.map((task) => (
                    <div className="pocket-task" key={task.id}>
                      <input
                        type="checkbox"
                        aria-label={`Concluir ${task.payload.title}`}
                        checked={task.payload.done}
                        disabled={busy || (!task.payload.done && isTaskBlocked(task, items))}
                        onChange={() =>
                          void save('task', { ...task.payload, done: !task.payload.done }, task)
                        }
                      />
                      <Link
                        to={
                          task.payload.done || isTaskBlocked(task, items)
                            ? '/tarefas'
                            : `/tarefa?task=${task.id}`
                        }
                      >
                        {task.payload.title}
                        {isTaskBlocked(task, items) && <small>Espera um passo anterior</small>}
                      </Link>
                      {!task.payload.done &&
                        task.payload.steps.some(
                          (_, stepIndex) => !task.payload.completedSteps?.includes(stepIndex),
                        ) && (
                          <small className="pocket-microaction">
                            Próximo passo:{' '}
                            {task.payload.steps.find(
                              (_, stepIndex) => !task.payload.completedSteps?.includes(stepIndex),
                            )}
                          </small>
                        )}
                    </div>
                  ))
                ) : (
                  <p className="pocket-empty">
                    {
                      [
                        'Um começo sem pressa.',
                        'Espaço para o que vier.',
                        'Deixe um pouco de respiro.',
                        'Sem hora marcada.',
                      ][index]
                    }
                  </p>
                )}
                <Link
                  className="pocket-add"
                  aria-label={`Adicionar em ${dayPeriodLabels[period]}`}
                  to={`/tarefas?date=${today}&period=${period}&new=1`}
                >
                  + Colocar algo aqui
                </Link>
              </section>
            );
          })}
        </div>
      </section>
      <div className="day-footnotes">
        <Link to={recent ? `/conclusao/${recent.id}` : '/pequenos-comecos'} className="memory-note">
          <span aria-hidden="true">⌁</span>
          <div>
            <small>{recent ? 'Um fio guardado' : 'Seu caminho vai aparecendo'}</small>
            <h3>{recent?.payload.title ?? 'Pequenos começos contam.'}</h3>
            <p>
              {recent?.payload.note ||
                'Seus registros ficam aqui para quando quiser olhar para trás.'}
            </p>
          </div>
          <span aria-hidden="true">↗</span>
        </Link>
        <Link to="/zen" className="rest-note">
          <span aria-hidden="true">☾</span>
          <div>
            <h3>Um respiro também cabe.</h3>
            <p>Um pouco de espaço, sem tarefa nenhuma.</p>
          </div>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  );
}
