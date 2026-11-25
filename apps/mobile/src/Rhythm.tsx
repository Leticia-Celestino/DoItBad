import RhythmSignal from './RhythmSignal';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { useStore } from './store';
import { Button, Card, Copy, Field, Page, Pill, Title } from './ui';

export function RhythmFields({
  value,
  onChange,
}: {
  value: RhythmConfig;
  onChange: (value: RhythmConfig) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Copy>Forma de acompanhar</Copy>
      {(['cycles', 'free', 'none'] as const).map((mode, n) => (
        <Button
          key={mode}
          variant={value.mode === mode ? 'primary' : 'outline'}
          onPress={() => onChange({ ...value, mode })}
        >
          {['Blocos de foco e pausa', 'Cronômetro livre', 'Sem cronômetro'][n]}
        </Button>
      ))}
      {value.mode === 'cycles' && (
        <>
          <Button
            variant="outline"
            onPress={() => onChange({ ...value, focusMinutes: 25, breakMinutes: 5 })}
          >
            25 / 5
          </Button>
          <Button
            variant="outline"
            onPress={() => onChange({ ...value, focusMinutes: 50, breakMinutes: 10 })}
          >
            50 / 10
          </Button>
          <Field
            label="Foco (minutos)"
            keyboardType="number-pad"
            value={String(value.focusMinutes)}
            onChangeText={(v) => onChange({ ...value, focusMinutes: Number(v) })}
          />
          <Field
            label="Pausa (minutos)"
            keyboardType="number-pad"
            value={String(value.breakMinutes)}
            onChangeText={(v) => onChange({ ...value, breakMinutes: Number(v) })}
          />
          <Field
            label="Quantidade de blocos"
            keyboardType="number-pad"
            value={String(value.blocks)}
            onChangeText={(v) => onChange({ ...value, blocks: Number(v) })}
          />
          <Copy>O tempo reservado inclui pausas entre blocos. A pausa final é opcional.</Copy>
        </>
      )}
      {value.mode !== 'none' && (
        <>
          <Copy>Lembrar de descansar os olhos — 20-20-20</Copy>
          <Switch
            accessibilityLabel="Lembrar de descansar os olhos — 20-20-20"
            value={value.eyeCare}
            onValueChange={(eyeCare) => onChange({ ...value, eyeCare })}
          />
          {value.eyeCare && (
            <Copy>
              A cada 20 minutos, olhar por 20 segundos a cerca de 6 metros. As micropausas cabem no
              bloco reservado.
            </Copy>
          )}
        </>
      )}
    </View>
  );
}
export function TaskRhythmFields({
  value,
  onChange,
}: {
  value: RhythmConfig | null;
  onChange: (value: RhythmConfig | null) => void;
}) {
  const { items } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <Button variant="text" onPress={() => setOpen(!open)}>
        Ritmo para quando eu começar · opcional
      </Button>
      {open && (
        <>
          <Button variant={value ? 'outline' : 'primary'} onPress={() => onChange(null)}>
            Usar meu padrão
          </Button>
          <Button
            variant={value ? 'primary' : 'outline'}
            onPress={() => onChange(value ?? { ...personalRhythm(items) })}
          >
            Personalizar esta atividade
          </Button>
          {value ? (
            <RhythmFields value={value} onChange={onChange} />
          ) : (
            <Copy>{rhythmSummary(personalRhythm(items))}</Copy>
          )}
          <Copy>A ajuda de dois minutos continua disponível quando começar estiver difícil.</Copy>
        </>
      )}
    </View>
  );
}
export function RhythmDefaults() {
  const { items, save, busy } = useStore();
  const stored = items.find(
    (i): i is Item<'rhythm_preferences'> => i.kind === 'rhythm_preferences',
  );
  const [value, setValue] = useState(() => personalRhythm(items));
  const [message, setMessage] = useState('');
  return (
    <View style={{ gap: 12 }}>
      <Title>Meu ritmo</Title>
      <Copy>Para quando você já sabe como começar.</Copy>
      <RhythmFields value={value} onChange={setValue} />
      <Button
        disabled={busy}
        onPress={async () => {
          setMessage('');
          if (await save('rhythm_preferences', { config: value }, stored))
            setMessage('Seu ritmo foi salvo. Sessões em andamento mantêm sua configuração.');
        }}
      >
        Salvar meu ritmo
      </Button>
      {!!message && <Copy>{message}</Copy>}
    </View>
  );
}
export function TaskRhythmActions({ task }: { task: Item<'task'> }) {
  const { items } = useStore();
  if (task.payload.done || isTaskBlocked(task, items)) return null;
  return (
    <View style={{ gap: 8 }}>
      <Copy>{rhythmSummary(taskRhythm(task.payload, items))}</Copy>
      <Button onPress={() => router.push(`/ritmo?task=${task.id}` as never)}>
        Começar meu ritmo
      </Button>
      <Button variant="text" onPress={() => router.push(`/tarefa?task=${task.id}` as never)}>
        Me ajude a começar
      </Button>
    </View>
  );
}
export function RhythmStart() {
  const params = useLocalSearchParams<{ task?: string; from?: string }>();
  const { items, save, busy } = useStore();
  const previous = items.find(
    (i): i is Item<'focus'> =>
      i.kind === 'focus' && i.id === params.from && i.payload.status === 'complete',
  );
  const task = items.find(
    (i): i is Item<'task'> =>
      i.kind === 'task' && i.id === (params.task ?? previous?.payload.taskId),
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
  const [adjust, setAdjust] = useState(false);
  const [error, setError] = useState('');
  const active = items.find(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'active',
  );
  if (!task && !previous)
    return (
      <Page back>
        <Title>Escolha uma atividade</Title>
        <Button onPress={() => router.push('/tarefas' as never)}>Ir para minhas tarefas</Button>
      </Page>
    );
  if (active)
    return (
      <Page back>
        <Title>Seu momento continua aqui</Title>
        <Copy>Retome ou encerre sua sessão antes de iniciar outra.</Copy>
        <Button onPress={() => router.push(`/foco?id=${active.id}` as never)}>
          Retomar sessão
        </Button>
      </Page>
    );
  const blocked = task && (task.payload.done || isTaskBlocked(task, items));
  return (
    <Page back>
      <Pill>Continuidade no seu ritmo</Pill>
      <Title>{task?.payload.title ?? previous?.payload.title}</Title>
      <Copy>{rhythmSummary(config)}</Copy>
      <Field
        label="O que você quer fazer neste momento?"
        maxLength={240}
        value={step}
        onChangeText={setStep}
      />
      <Button variant="text" onPress={() => setAdjust(!adjust)}>
        Ajustar apenas esta sessão
      </Button>
      {adjust && <RhythmFields value={config} onChange={setConfig} />}
      {!!error && <Copy>{error}</Copy>}
      {blocked ? (
        <Copy>Esta tarefa já foi concluída ou depende de outra atividade.</Copy>
      ) : config.mode === 'none' ? (
        <>
          <Copy>Faça no seu tempo. Registre a conclusão na tarefa quando quiser.</Copy>
          <Button onPress={() => router.push('/tarefas' as never)}>Voltar à atividade</Button>
        </>
      ) : (
        <Button
          disabled={busy || !step.trim()}
          onPress={async () => {
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
              if (result) router.replace(`/foco?id=${result.id}` as never);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Revise seu ritmo.');
            }
          }}
        >
          Começar meu ritmo
        </Button>
      )}
      <Button
        variant="text"
        onPress={() => router.push((task ? `/tarefa?task=${task.id}` : '/tarefa') as never)}
      >
        Está difícil hoje? Me ajude a começar
      </Button>
    </Page>
  );
}
export function RhythmTimer({ item }: { item: Item<'focus'> }) {
  const { save, busy } = useStore();
  const [now, setNow] = useState(Date.now());
  const [note, setNote] = useState(item.payload.note);
  const [noteEdited, setNoteEdited] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  const focus = projectRhythm(item.payload, now);
  const r = focus.rhythm!;
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
    if (result?.payload.status === 'complete') router.replace(`/conclusao?id=${item.id}` as never);
  }
  const eyeDue =
    r.config.eyeCare &&
    r.phase === 'focus' &&
    !r.paused &&
    r.eyeRemaining === 0 &&
    r.eyeDueIn === 0;
  return (
    <Page back>
      <Pill>
        {r.paused
          ? 'Sessão pausada'
          : r.phase === 'focus'
            ? 'No seu ritmo'
            : r.phase === 'break'
              ? 'Tempo de descanso'
              : 'Um momento para decidir'}
      </Pill>
      <Title>{focus.title}</Title>
      <Copy>{focus.step}</Copy>
      {r.config.mode === 'cycles' && (
        <Copy>
          Bloco {r.block} de {r.config.blocks}
        </Copy>
      )}
      <Title style={{ fontSize: 56, lineHeight: 68, textAlign: 'center' }}>
        {formatTime(rhythmClock(focus))}
      </Title>
      <RhythmSignal focus={focus} />
      {r.phase === 'focus' && (
        <Copy>
          {r.config.mode === 'cycles'
            ? `Depois deste bloco, você pode fazer uma pausa de ${r.config.breakMinutes} min.`
            : 'Você escolhe quando pausar ou encerrar.'}
        </Copy>
      )}
      {r.eyeRemaining > 0 && (
        <Card>
          <Copy>Olhe ao longe por {r.eyeRemaining} segundos.</Copy>
          <Copy>Procure algo a cerca de 6 metros. Você não precisa acompanhar a tela.</Copy>
        </Card>
      )}
      {eyeDue && (
        <Card>
          <Title>Um descanso para os olhos?</Title>
          <Copy>Olhe por 20 segundos para algo a cerca de 6 metros.</Copy>
          <Button disabled={busy} onPress={() => void act('eye')}>
            Começar 20 segundos
          </Button>
          <Button variant="text" disabled={busy} onPress={() => void act('defer-eye')}>
            Adiar 5 min
          </Button>
          <Button variant="text" disabled={busy} onPress={() => void act('dismiss-eye')}>
            Dispensar
          </Button>
        </Card>
      )}
      {['focus', 'break'].includes(r.phase) && (
        <Button
          variant="outline"
          disabled={busy}
          onPress={() => void act(r.paused ? 'resume' : 'pause')}
        >
          {r.paused ? 'Retomar' : 'Pausar'}
        </Button>
      )}
      {r.phase === 'checkin' && (
        <Card>
          <Title>Você chegou ao tempo planejado.</Title>
          <Copy>Como quer seguir?</Copy>
          <Button
            disabled={busy}
            onPress={() => void act('break')}
          >{`Fazer pausa de ${r.config.breakMinutes} min`}</Button>
          <Button variant="outline" disabled={busy} onPress={() => void act('extend')}>
            Acrescentar 5 min
          </Button>
        </Card>
      )}
      {r.phase === 'ready' && (
        <Copy>Sua pausa terminou. O próximo bloco só começa quando você quiser.</Copy>
      )}
      {['ready', 'checkin'].includes(r.phase) && r.block < r.config.blocks && (
        <Button disabled={busy} onPress={() => void act('next')}>
          Iniciar próximo bloco
        </Button>
      )}
      <Field
        label="Quando voltar, qual é o próximo gesto? (opcional)"
        multiline
        maxLength={1000}
        value={noteEdited ? note : item.payload.note}
        onChangeText={(v) => {
          setNote(v);
          setNoteEdited(true);
        }}
      />
      <Button variant="outline" disabled={busy} onPress={() => void act('finish')}>
        Encerrar e registrar
      </Button>
      <Copy>
        {formatTime(focusRecordedSeconds(focus))} de foco · {formatTime(r.breakSeconds)} de descanso
        · {formatTime(r.eyeSeconds)} de cuidado visual
      </Copy>
      <Button variant="text" onPress={() => router.push('/tarefas' as never)}>
        Ver outras atividades
      </Button>
    </Page>
  );
}
