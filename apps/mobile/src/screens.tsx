import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, BackHandler, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  colors,
  dayKey,
  elapsedSeconds,
  formatTime,
  summarize,
  type Item,
  type Priority,
  type Recurrence,
  priorityLabels,
  recurrenceLabels,
  projectColors,
  isTaskBlocked,
  orderedTasks,
  toggleStep,
  editSteps,
} from '@doitbad/core';
import { supabase, useStore } from './store';
import { Button, Card, Copy, DateField, Field, Page, Title, ListRow, Pill, s } from './ui';
import { SunOverHills, NightScene, Sprout } from './illustrations';
import { Icon, Ring, MoodChart, PathMap } from './visuals';
import { MonthGrid } from './calendar';
import Ambience from './Ambience';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  acceptRecommendation,
  recommendNextStep,
  type AIRecommendation,
} from './ai';

const go = (path: string) => router.push(path as never);
export function Dashboard() {
  const { items, session, night, toggleNight } = useStore();
  const [signOutError, setSignOutError] = useState('');
  const [range, setRange] = useState<'Semana' | 'Mês' | 'Ano'>('Semana');
  const stats = summarize(
    items.filter(
      (i) =>
        Date.now() - new Date(i.created_at).getTime() <=
        { Semana: 7, Mês: 30, Ano: 365 }[range] * 86400000,
    ),
  );
  const days = new Set(summarize(items).sessions.map((i) => dayKey(new Date(i.created_at))));
  let streak = 0;
  const cursor = new Date();
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const active = items.find(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'active',
  );
  return (
    <Page contentStyle={{ paddingTop: 32, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Copy style={{ fontSize: 12 }}>Cada ação conta. Mesmo as pequenas.</Copy>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={night ? 'Ativar modo claro' : 'Ativar modo noturno'}
            accessibilityState={{ selected: night }}
            onPress={toggleNight}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: night ? '#464c5d' : colors.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={night ? 'sun' : 'moon'} size={18} color={night ? '#e4c579' : colors.sage} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const result = await supabase?.auth.signOut();
              if (result?.error) setSignOutError('Não foi possível sair. Tente novamente.');
            }}
          >
            <Copy style={{ fontSize: 12, textDecorationLine: 'underline' }}>Sair</Copy>
          </Pressable>
        </View>
      </View>
      {!!signOutError && <Copy style={{ color: '#c87e5a' }}>{signOutError}</Copy>}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 150, gap: 4 }}>
          <Title style={{ fontSize: 30, lineHeight: 36, color: colors.terracotta }}>
            {stats.minutes} minutos
          </Title>
          <Text style={[s.subtitle, night && { color: '#f4ede1' }]}>de execução</Text>
          <Copy style={{ fontSize: 13, lineHeight: 20 }}>
            Olá, {String(session?.user.user_metadata?.name || 'você').split(' ')[0]} — cada começo
            faz parte do seu caminho.
          </Copy>
        </View>
        <View style={{ gap: 4 }}>
          <Ring
            progress={Math.min(1, stats.minutes / 20)}
            label={`${Math.min(100, Math.round((stats.minutes / 20) * 100))}%`}
            caption=""
            diameter={96}
          />
          <Copy style={{ textAlign: 'center', fontSize: 10 }}>Meta do período</Copy>
        </View>
      </View>
      <View
        style={[
          s.row,
          {
            gap: 4,
            alignSelf: 'flex-start',
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface,
            padding: 4,
            marginTop: 8,
          },
        ]}
      >
        {(['Semana', 'Mês', 'Ano'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: range === value }}
            onPress={() => setRange(value)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 24,
              backgroundColor: range === value ? colors.sage : 'transparent',
            }}
          >
            <Text
              style={[
                s.text,
                { fontSize: 13, color: range === value ? colors.canvas : colors.muted },
              ]}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        {(
          [
            ['check', 'Passos dados', stats.steps],
            ['clock', 'Minutos focados', stats.minutes],
            [
              'flag',
              'Tarefas iniciadas',
              new Set(stats.sessions.map((i) => i.payload.taskId || i.payload.title)).size,
            ],
            ['calendar', 'Sequência atual', `${streak} dias`],
          ] as const
        ).map(([icon, label, value], n) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderTopWidth: n ? 1 : 0,
              borderColor: colors.line,
            }}
          >
            <View style={{ padding: 8, borderRadius: 12, backgroundColor: '#e8eadc' }}>
              <Icon name={icon} size={20} />
            </View>
            <Text style={[s.text, { flex: 1, color: colors.ink, fontSize: 14 }]}>{label}</Text>
            <Text style={[s.subtitle, { fontSize: 22, flexShrink: 1 }]}>{value}</Text>
          </View>
        ))}
      </Card>
      <View style={[s.row, { gap: 10, marginTop: 8 }]}>
        {[
          ['Desafios', 'desafios'],
          ['Modo Zen', 'zen'],
          ['Recovery', 'retomada'],
        ].map(([label, path]) => (
          <Pressable
            key={path}
            accessibilityRole="button"
            onPress={() => go(`/${path}`)}
            style={[s.pill, { flexGrow: 1, borderRadius: 16, paddingHorizontal: 12 }]}
          >
            <Text style={[s.text, { fontSize: 13, color: colors.ink, textAlign: 'center' }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[s.text, { color: colors.ink, marginTop: 8 }]}>Sua semana</Text>
      {!stats.sessions.length && <Copy>Seu primeiro passo vai aparecer aqui.</Copy>}
      {stats.sessions.slice(0, 5).map((item) => (
        <ListRow
          key={item.id}
          icon="check"
          title={item.payload.title}
          meta={`${formatTime(item.payload.elapsed)} · ${new Date(item.created_at).toLocaleDateString('pt-BR')}`}
          onPress={() => go(`/conclusao?id=${item.id}`)}
        />
      ))}
      <Button onPress={() => go(active ? `/foco?id=${active.id}` : '/tarefa')}>
        {active ? 'Retomar meu passo' : 'Novo desafio de 2 minutos'}
      </Button>
    </Page>
  );
}

export function Tasks() {
  const { items, save, remove, busy, session } = useStore();
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState<Priority>('media');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [dependsOn, setDependsOn] = useState('');
  const [steps, setSteps] = useState('');
  const [date, setDate] = useState(dayKey());
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<'Todas' | 'Pendentes' | 'Concluídas'>('Todas');
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('Todos');
  const [editing, setEditing] = useState<Item<'task'> | undefined>();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [recommendationBusy, setRecommendationBusy] = useState(false);
  const [recommendationNotice, setRecommendationNotice] = useState('');
  const tasks = orderedTasks(items);
  const projectItems = items.filter((item): item is Item<'project'> => item.kind === 'project');
  return (
    <Page>
      <Copy style={{ fontSize: 12 }}>Por ordem de prioridade</Copy>
      <Title style={{ fontSize: 30, lineHeight: 36 }}>Suas tarefas</Title>
      <Copy style={{ fontSize: 13 }}>
        {tasks.filter((t) => !t.payload.done).length || 'Nenhuma tarefa'} para hoje — comece pela do
        topo.
      </Copy>
      <ListRow
        icon="leaf"
        title={recommendationBusy ? 'Escolhendo com cuidado…' : 'Não sei por onde começar'}
        meta="Deixe o DoItBad escolher um pequeno passo"
        onPress={async () => {
          const next = tasks.find((t) => !t.payload.done && !isTaskBlocked(t, items));
          if (!next) {
            go('/tarefa');
            return;
          }
          if (recommendationBusy) return;
          setRecommendationBusy(true);
          setRecommendationNotice('');
          try {
            if (!session?.access_token) throw new Error('Sessão indisponível.');
            setRecommendation(await recommendNextStep(session.access_token));
          } catch {
            const pending = next.payload.steps.find(
              (_, index) => !next.payload.completedSteps?.includes(index),
            );
            setRecommendation({
              id: null,
              task_id: next.id,
              task_revision: next.revision,
              microaction: pending || `Abra o que precisa e comece por: ${next.payload.title}`,
              reason: 'Este é o próximo passo disponível com maior prioridade.',
              estimated_minutes: 2,
              source: 'deterministic',
              model: null,
            });
            setRecommendationNotice(
              'A ajuda inteligente está momentaneamente indisponível; preparamos um passo seguro para você.',
            );
          } finally {
            setRecommendationBusy(false);
          }
        }}
      />
      {recommendation && (
        <Card style={{ backgroundColor: '#efe6d6', gap: 10 }}>
          <Pill>Seu próximo pequeno passo</Pill>
          <Text style={[s.subtitle, { color: colors.ink }]}>{recommendation.microaction}</Text>
          <Copy>{recommendation.reason}</Copy>
          <Copy style={{ fontSize: 11 }}>
            Cerca de {recommendation.estimated_minutes} min
            {recommendation.source === 'llama' ? ' · sugerido com Llama' : ''}
          </Copy>
          {!!recommendationNotice && (
            <Copy style={{ fontSize: 11, color: colors.terracotta }}>
              {recommendationNotice}
            </Copy>
          )}
          <Button
            onPress={async () => {
              if (recommendation.id && session?.access_token) {
                await acceptRecommendation(session.access_token, recommendation.id).catch(() => undefined);
              }
              go(
                `/tarefa?task=${recommendation.task_id}&suggestion=${encodeURIComponent(recommendation.microaction)}`,
              );
            }}
          >
            Começar por aqui
          </Button>
          <Button variant="text" onPress={() => setRecommendation(null)}>
            Agora não
          </Button>
        </Card>
      )}
      {tasks.length > 5 && (
        <>
          <Field
            label="Buscar tarefa"
            placeholder="O que você procura?"
            value={query}
            onChangeText={setQuery}
          />
          <View style={s.row}>
            {(['Todas', 'Pendentes', 'Concluídas'] as const).map((v) => (
              <Pressable
                key={v}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === v }}
                onPress={() => setFilter(v)}
                style={[s.pill, filter === v && s.selected]}
              >
                <Text style={s.text}>{v}</Text>
              </Pressable>
            ))}
          </View>
          {tasks.some((t) => t.payload.project) && (
            <View style={s.row}>
              {['Todos', ...new Set(tasks.map((t) => t.payload.project).filter(Boolean))].map(
                (v) => (
                  <Pressable
                    key={v}
                    accessibilityRole="button"
                    accessibilityState={{ selected: projectFilter === v }}
                    onPress={() => setProjectFilter(v)}
                    style={[s.pill, projectFilter === v && s.selected]}
                  >
                    <Text style={s.text}>{v}</Text>
                  </Pressable>
                ),
              )}
            </View>
          )}
        </>
      )}
      {(adding || editing) && (
        <Card>
          <Text style={s.subtitle}>{editing ? 'Ajustar sua tarefa' : 'Uma nova tarefa'}</Text>
          <Field
            label="O que você quer fazer?"
            value={title}
            onChangeText={setTitle}
            maxLength={240}
          />
          <Field
            label="Nova tag (opcional)"
            placeholder="Ex.: Casa, Estudos, Trabalho"
            value={project}
            onChangeText={setProject}
          />
          {!!projectItems.length && (
            <>
              <Copy>Organizar por tag</Copy>
              <View style={s.row}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !project }}
                  onPress={() => setProject('')}
                  style={[s.pill, !project && s.selected]}
                >
                  <Text style={s.text}>Sem tag</Text>
                </Pressable>
                {projectItems.map((item) => {
                  const selected = project === item.payload.title;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setProject(item.payload.title)}
                      style={[
                        s.pill,
                        {
                          minHeight: 40,
                          paddingVertical: 8,
                          borderColor: item.payload.color,
                          backgroundColor: selected ? `${item.payload.color}22` : colors.surface,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: item.payload.color,
                          }}
                        />
                        <Text style={[s.text, { fontSize: 13, color: colors.ink }]}>
                          {item.payload.title}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
          <Copy>Prioridade</Copy>
          <View style={s.row}>
            {(Object.keys(priorityLabels) as Priority[]).map((p) => (
              <Pressable
                key={p}
                accessibilityRole="radio"
                accessibilityState={{ selected: priority === p }}
                onPress={() => setPriority(p)}
                style={[s.pill, priority === p && s.selected]}
              >
                <Text style={s.text}>{priorityLabels[p]}</Text>
              </Pressable>
            ))}
          </View>
          <Copy>Repetir</Copy>
          <View style={s.row}>
            {(Object.keys(recurrenceLabels) as Recurrence[]).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected: recurrence === value }}
                onPress={() => setRecurrence(value)}
                style={[s.pill, recurrence === value && s.selected]}
              >
                <Text style={s.text}>{recurrenceLabels[value]}</Text>
              </Pressable>
            ))}
          </View>
          <Copy>Só faça depois de</Copy>
          <View style={s.row}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: !dependsOn }}
              onPress={() => setDependsOn('')}
              style={[s.pill, !dependsOn && s.selected]}
            >
              <Text style={s.text}>Nada</Text>
            </Pressable>
            {tasks
              .filter((task) => task.id !== editing?.id && !task.payload.done)
              .map((task) => (
                <Pressable
                  key={task.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dependsOn === task.id }}
                  onPress={() => setDependsOn(task.id)}
                  style={[s.pill, dependsOn === task.id && s.selected]}
                >
                  <Text style={s.text}>{task.payload.title}</Text>
                </Pressable>
              ))}
          </View>
          <DateField value={date} onChange={setDate} />
          <Field
            label="Pequenos passos (um por linha)"
            value={steps}
            onChangeText={setSteps}
            multiline
            maxLength={2000}
          />
          <Button
            disabled={busy || !title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)}
            onPress={async () => {
              const projectTitle = project.trim();
              let projectId: string | null;
              if (projectTitle) {
                const existingProject = projectItems.find(
                  (item) =>
                    item.payload.title.toLocaleLowerCase() === projectTitle.toLocaleLowerCase(),
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
                    dependsOn: dependsOn ? [dependsOn] : [],
                    project: projectTitle,
                    projectId,
                    date,
                    ...editSteps(
                      editing?.payload,
                      steps
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    ),
                    done: editing?.payload.done ?? false,
                  },
                  editing,
                )
              ) {
                setTitle('');
                setSteps('');
                setEditing(undefined);
                setAdding(false);
                setProject('');
                setPriority('media');
                setRecurrence('none');
                setDependsOn('');
              }
            }}
          >
            {editing ? 'Salvar alterações' : 'Adicionar tarefa'}
          </Button>
          {editing && (
            <Button
              onPress={() => {
                setEditing(undefined);
                setTitle('');
                setSteps('');
                setProject('');
                setPriority('media');
                setRecurrence('none');
                setDependsOn('');
              }}
            >
              Cancelar edição
            </Button>
          )}
        </Card>
      )}
      {!tasks.length && <Copy>Seu espaço está pronto para a primeira tarefa.</Copy>}
      {tasks
        .filter(
          (t) =>
            (filter === 'Todas' || t.payload.done === (filter === 'Concluídas')) &&
            (projectFilter === 'Todos' || t.payload.project === projectFilter) &&
            t.payload.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        )
        .map((t) => (
          <Card key={t.id} style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`Concluir ${t.payload.title}`}
                accessibilityState={{ checked: t.payload.done }}
                disabled={busy || (isTaskBlocked(t, items) && !t.payload.done)}
                onPress={() => void save('task', { ...t.payload, done: !t.payload.done }, t)}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: colors.sage,
                    backgroundColor: t.payload.done ? colors.sage : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t.payload.done && <Icon name="check" size={16} color={colors.canvas} />}
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: expanded === t.id }}
                onPress={() => setExpanded(expanded === t.id ? null : t.id)}
                style={{ flex: 1, minWidth: 0, gap: 4, minHeight: 44, justifyContent: 'center' }}
              >
                <Text
                  style={[
                    s.text,
                    {
                      color: colors.ink,
                      fontSize: 15,
                      textDecorationLine: t.payload.done ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {t.payload.title}
                </Text>
                <TaskTags task={t} projects={projectItems} blocked={isTaskBlocked(t, items)} />
              </Pressable>
              <Icon name="next" size={18} />
            </View>
            {expanded === t.id && (
              <>
                <Text style={s.eyebrow}>Microações</Text>
                <MicroSteps task={t} />
                <Button
                  disabled={isTaskBlocked(t, items)}
                  onPress={() => go(`/tarefa?task=${t.id}`)}
                >
                  {isTaskBlocked(t, items) ? 'Conclua a tarefa anterior' : 'Focar nesta tarefa'}
                </Button>
                <Button
                  variant="text"
                  onPress={() => {
                    setEditing(t);
                    setTitle(t.payload.title);
                    setProject(t.payload.project);
                    setPriority(t.payload.priority ?? 'media');
                    setRecurrence(t.payload.recurrence ?? 'none');
                    setDependsOn(t.payload.dependsOn?.[0] ?? '');
                    setDate(t.payload.date || dayKey());
                    setSteps(t.payload.steps.join('\n'));
                  }}
                >
                  Editar tarefa
                </Button>
                <Button
                  variant="text"
                  disabled={busy}
                  textStyle={{ color: colors.terracotta }}
                  onPress={() =>
                    Alert.alert('Remover tarefa?', t.payload.title, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Remover', style: 'destructive', onPress: () => void remove(t) },
                    ])
                  }
                >
                  Remover tarefa
                </Button>
              </>
            )}
          </Card>
        ))}
      <Button
        variant="outline"
        style={{ borderStyle: 'dashed', borderColor: colors.line }}
        onPress={() => setAdding(!adding)}
      >
        {adding ? 'Cancelar' : '＋ Nova tarefa'}
      </Button>
      <Button variant="text" onPress={() => go('/agenda')}>
        Ver no calendário
      </Button>
    </Page>
  );
}
function TaskTags({
  task,
  projects,
  blocked,
}: {
  task: Item<'task'>;
  projects: Item<'project'>[];
  blocked: boolean;
}) {
  const project = projects.find(
    (item) => item.id === task.payload.projectId || item.payload.title === task.payload.project,
  );
  const projectColor = project?.payload.color ?? colors.sage;
  const priority = task.payload.priority ?? 'media';
  const priorityColor =
    priority === 'alta' ? colors.terracotta : priority === 'baixa' ? colors.sage : '#9A7B2E';
  const priorityBackground =
    priority === 'alta' ? '#F4DED3' : priority === 'baixa' ? '#E3E9DB' : '#F5E9C9';
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {!!task.payload.project && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 3,
            backgroundColor: `${projectColor}20`,
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: projectColor }} />
          <Copy style={{ fontSize: 10, lineHeight: 14, color: projectColor }}>
            {task.payload.project}
          </Copy>
        </View>
      )}
      <View
        style={{
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 3,
          backgroundColor: priorityBackground,
        }}
      >
        <Copy style={{ fontSize: 10, lineHeight: 14, color: priorityColor }}>
          {priorityLabels[priority]}
        </Copy>
      </View>
      {(task.payload.recurrence ?? 'none') !== 'none' && (
        <Copy style={{ fontSize: 10, lineHeight: 20 }}>
          ↻ {recurrenceLabels[task.payload.recurrence ?? 'none']}
        </Copy>
      )}
      {blocked && (
        <Copy style={{ fontSize: 10, lineHeight: 20, color: colors.terracotta }}>
          Após outra tarefa
        </Copy>
      )}
      {!!task.payload.steps.length && (
        <Copy style={{ fontSize: 10, lineHeight: 20 }}>
          {task.payload.completedSteps?.length ?? 0}/{task.payload.steps.length} microações
        </Copy>
      )}
    </View>
  );
}
function MicroSteps({ task }: { task: Item<'task'> }) {
  const { save, busy } = useStore();
  return (
    <View style={{ gap: 4 }}>
      {task.payload.steps.map((step, index) => {
        const checked = task.payload.completedSteps?.includes(index) ?? false;
        return (
          <Pressable
            key={index}
            accessibilityRole="checkbox"
            accessibilityLabel={step}
            accessibilityState={{ checked, disabled: busy }}
            disabled={busy}
            onPress={() => void save('task', toggleStep(task.payload, index), task)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.sage,
                backgroundColor: checked ? colors.sage : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked && <Icon name="check" size={16} color={colors.canvas} />}
            </View>
            <Text
              style={[
                s.text,
                {
                  flex: 1,
                  color: colors.ink,
                  textDecorationLine: checked ? 'line-through' : 'none',
                },
              ]}
            >
              {step}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
export function History() {
  return <Dashboard />;
}
export function More() {
  const [error, setError] = useState('');
  return (
    <Page>
      <Title>Encontre seu caminho.</Title>
      <Copy>Cuide do seu ritmo e descubra o que ajuda você a começar.</Copy>
      {(
        [
          ['historico', 'Seu histórico', 'clock', 'Todas as suas pequenas vitórias'],
          ['calendario', 'Calendário', 'calendar', 'Um dia de cada vez'],
          ['mapa', 'Mapa de execução', 'flag', 'Enxergue o próximo passo'],
          ['intencoes', 'Intenções', 'leaf', 'Ideias que podem esperar'],
          ['desafios', 'Desafios gentis', 'check', 'Pequenos convites para começar'],
          ['estatisticas', 'Estatísticas emocionais', 'chart', 'Conheça seus padrões'],
          ['retomada', 'Retomar', 'heart', 'Seu fio da meada está aqui'],
          ['zen', 'Modo zen', 'moon', 'Um espaço tranquilo para você'],
        ] as const
      ).map(([path, title, icon, meta]) => (
        <ListRow key={path} title={title} icon={icon} meta={meta} onPress={() => go(`/${path}`)} />
      ))}
      <Button
        variant="text"
        onPress={async () => {
          const result = await supabase?.auth.signOut();
          if (result?.error) setError('Não foi possível sair. Tente novamente.');
        }}
      >
        Sair da conta
      </Button>
      {error && <Copy>{error}</Copy>}
    </Page>
  );
}
function Start() {
  const { task: taskId, suggestion } = useLocalSearchParams<{
    task?: string;
    suggestion?: string;
  }>();
  const { items, save, busy } = useStore();
  const task = items.find((i): i is Item<'task'> => i.kind === 'task' && i.id === taskId);
  const [stage, setStage] = useState(suggestion ? 2 : 0);
  const [customStep, setCustomStep] = useState(false);
  const [title, setTitle] = useState(task?.payload.title ?? '');
  const [step, setStep] = useState(
    suggestion ?? task?.payload.steps.find((_, i) => !task.payload.completedSteps?.includes(i)) ?? '',
  );
  const [blockers, setBlockers] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(2);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stage > 0) {
        setStage(stage - 1);
        return true;
      }
      return false;
    });
    return () => listener.remove();
  }, [stage]);
  const active = items.find(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'active',
  );
  if (active)
    return (
      <Page>
        <Title>Seu passo está aqui.</Title>
        <Copy>Retome ou encerre seu passo atual antes de escolher outro.</Copy>
        <Copy>{active.payload.title}</Copy>
        <Button onPress={() => router.replace(`/foco?id=${active.id}` as never)}>
          Retomar meu passo
        </Button>
      </Page>
    );
  return (
    <Page
      key={stage}
      back
      step={stage}
      onBack={() =>
        stage > 0 ? setStage(stage - 1) : router.canGoBack() ? router.back() : router.replace('/')
      }
    >
      {stage === 0 ? (
        <>
          <View style={{ width: 56, marginTop: 16, marginBottom: 8 }}>
            <Sprout height={56} />
          </View>
          <Title>O que você precisa fazer?</Title>
          <Copy>Qual é a missão de hoje?</Copy>
          <View style={{ marginVertical: 16 }}>
            <Field
              label=""
              accessibilityLabel="Sua tarefa"
              placeholder="Ex.: Terminar apresentação"
              value={title}
              onChangeText={setTitle}
              maxLength={240}
            />
          </View>
          <Text style={s.eyebrow}>Sugestões rápidas</Text>
          <View style={s.row}>
            {[
              'Terminar apresentação',
              'Estudar para a prova',
              'Organizar currículo',
              'Ler 5 páginas',
            ].map((v) => (
              <Pressable
                key={v}
                accessibilityRole="button"
                onPress={() => setTitle(v)}
                style={[s.pill, title === v && s.selected]}
              >
                <Text style={[s.text, { fontSize: 13 }]}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <Button disabled={!title.trim()} onPress={() => setStage(1)}>
            Continuar
          </Button>
        </>
      ) : stage === 1 ? (
        <>
          <Title style={{ marginTop: 16 }}>O que está te travando agora?</Title>
          <Copy>Entender é o primeiro passo para destravar.</Copy>
          <View style={{ gap: 12, marginTop: 12 }}>
            {[
              'Não sei por onde começar',
              'Parece coisa demais',
              'Quero fazer perfeito',
              'Estou evitando',
              'Estou distraído',
              'Estou cansado',
              'Outro motivo',
            ].map((label) => (
              <Pressable
                key={label}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: blockers.includes(label) }}
                style={[
                  s.card,
                  { padding: 16, flexDirection: 'row', alignItems: 'center' },
                  blockers.includes(label) && s.selected,
                ]}
                onPress={() =>
                  setBlockers((v) =>
                    v.includes(label) ? v.filter((s) => s !== label) : [...v, label],
                  )
                }
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: colors.sage,
                    backgroundColor: blockers.includes(label) ? colors.sage : 'transparent',
                  }}
                >
                  {blockers.includes(label) && <Icon name="check" color={colors.surface} />}
                </View>
                <Text style={[s.text, { flex: 1, color: colors.ink }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1, minHeight: 8 }} />
          <Button
            onPress={() => {
              if (!step) setStep('Abrir o documento');
              setStage(2);
            }}
          >
            Continuar
          </Button>
        </>
      ) : (
        <>
          <View style={{ alignItems: 'center', gap: 16, marginTop: 8 }}>
            <Pill>Desafio de 2 minutos</Pill>
            <Title style={{ fontSize: 32, lineHeight: 36, textAlign: 'center' }}>
              Seu único passo agora é:
            </Title>
          </View>
          <Card style={{ marginTop: 12, paddingVertical: 28 }}>
            <View style={{ alignItems: 'center', gap: 16 }}>
              <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#f4e8c8' }}>
                <Icon name="document" size={32} color={colors.terracotta} />
              </View>
              <Text style={[s.subtitle, { textAlign: 'center' }]}>{step}</Text>
              <Copy style={{ textAlign: 'center', fontSize: 14 }}>
                Não precisa ser perfeito. Só precisa começar.
              </Copy>
            </View>
          </Card>
          <Text style={s.eyebrow}>Escolha por onde começar</Text>
          <View style={{ gap: 10 }}>
            {(
              [
                'Abrir o documento',
                'Ler 1 página',
                'Escrever 1 parágrafo',
                'Trabalhar por 2 minutos',
              ] as const
            ).map((v, n) => (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityState={{ selected: step === v }}
                onPress={() => setStep(v)}
                style={[
                  s.card,
                  {
                    padding: 12,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  },
                  step === v && s.selected,
                ]}
              >
                <View
                  style={{
                    padding: 8,
                    borderRadius: 12,
                    backgroundColor: step === v ? colors.sage : '#e8eadc',
                  }}
                >
                  <Icon
                    name={(['document', 'book', 'pencil', 'clock'] as const)[n]}
                    size={16}
                    color={step === v ? colors.canvas : colors.sage}
                  />
                </View>
                <Text style={[s.text, { fontSize: 14, color: colors.ink, flex: 1 }]}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <Button variant="text" onPress={() => setCustomStep(!customStep)}>
            {customStep ? 'Fechar ajuste' : 'Ajustar meu passo'}
          </Button>
          {customStep && (
            <>
              <Field
                label="Um passo que cabe hoje"
                multiline
                value={step}
                onChangeText={setStep}
                maxLength={240}
              />
              <Button
                variant="text"
                onPress={() => setStep('Abrir o material e escolher por onde começar')}
              >
                Diminuir este passo
              </Button>
              <Duration value={minutes} onChange={setMinutes} />
            </>
          )}
          <View style={{ flex: 1, minHeight: 8 }} />
          <Button
            disabled={busy || !step.trim()}
            onPress={async () => {
              const item = await save('focus', {
                taskId: task?.id ?? null,
                title,
                step,
                blockers,
                target: minutes * 60,
                elapsed: 0,
                runningSince: Date.now(),
                status: 'active',
                note: '',
                mood: null,
              });
              if (item) router.replace(`/foco?id=${item.id}` as never);
            }}
          >
            {`Iniciar ${minutes} minutos`}
          </Button>
          <Button variant="text" onPress={() => setStage(0)}>
            Quero outro passo
          </Button>
        </>
      )}
    </Page>
  );
}
function Duration({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={s.row}>
      {[2, 5, 10, 15, 25].map((n) => (
        <Pressable
          key={n}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === n }}
          style={[s.pill, value === n && s.selected]}
          onPress={() => onChange(n)}
        >
          <Text style={s.text}>{n} min</Text>
        </Pressable>
      ))}
    </View>
  );
}
function Timer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, save, busy } = useStore();
  const [now, setNow] = useState(Date.now());
  const finishing = useRef(false);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);
  const item = items.find((i): i is Item<'focus'> => i.kind === 'focus' && i.id === id);
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
      if (saved) router.replace(`/conclusao?id=${item.id}` as never);
      else finishing.current = false;
    });
  }, [item, now, save]);
  if (!item)
    return (
      <Page>
        <Copy>
          Carregando seu passo. Se ele não aparecer, volte ao seu espaço e sincronize novamente.
        </Copy>
      </Page>
    );
  const f = item.payload;
  const elapsed = elapsedSeconds(f, now);
  return (
    <Page back step={3}>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <Pill>Você já começou</Pill>
        <Title style={{ fontSize: 28, lineHeight: 35, textAlign: 'center' }}>
          A única coisa que importa agora é{' '}
          <Text style={{ color: colors.terracotta }}>continuar.</Text>
        </Title>
        <Copy style={{ fontSize: 13, textAlign: 'center' }}>{f.title}</Copy>
      </View>
      <View
        accessibilityRole="timer"
        accessibilityLabel={`${formatTime(f.target - elapsed)} restantes`}
        style={{ paddingVertical: 20 }}
      >
        <Ring
          progress={elapsed / f.target}
          label={formatTime(f.target - elapsed)}
          caption={
            elapsed >= f.target
              ? 'Seu tempo está completo'
              : f.runningSince
                ? 'Foque em você'
                : 'Uma pausa também cabe'
          }
        />
      </View>
      {f.status === 'active' ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={f.runningSince ? 'Pausar' : 'Retomar'}
            style={{
              alignSelf: 'center',
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.sage,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={busy || elapsed === f.target}
            onPress={() =>
              void save(
                'focus',
                { ...f, elapsed, runningSince: f.runningSince ? null : Date.now() },
                item,
              )
            }
          >
            <Icon name={f.runningSince ? 'pause' : 'play'} color={colors.canvas} />
          </Pressable>
          <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 12 }}>
            <View style={{ padding: 8, borderRadius: 12, backgroundColor: '#f4e8c8' }}>
              <Icon name="leaf" color={colors.terracotta} />
            </View>
            <Copy style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>
              Cada segundo conta. Você está no caminho certo.
            </Copy>
          </Card>
          <View style={{ flex: 1, minHeight: 8 }} />
          <Button
            variant="outline"
            disabled={busy}
            onPress={async () => {
              if (
                await save('focus', { ...f, elapsed, runningSince: null, status: 'complete' }, item)
              )
                router.replace(`/conclusao?id=${id}` as never);
            }}
          >
            Encerrar e concluir
          </Button>
          <Button
            variant="text"
            disabled={busy}
            onPress={() => void save('focus', { ...f, target: f.target + 60 }, item)}
          >
            Preciso de mais tempo
          </Button>
        </>
      ) : (
        <Button onPress={() => go(`/conclusao?id=${id}`)}>Ver meu resultado</Button>
      )}
    </Page>
  );
}
function Done() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, save, busy } = useStore();
  const item = items.find((i): i is Item<'focus'> => i.kind === 'focus' && i.id === id);
  const [note, setNote] = useState(item?.payload.note ?? '');
  const [saved, setSaved] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const task =
    item && items.find((i): i is Item<'task'> => i.kind === 'task' && i.id === item.payload.taskId);
  return (
    <Page contentStyle={{ paddingTop: 32 }}>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#e5e7d8',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={36} />
        </View>
        <Title style={{ textAlign: 'center' }}>
          Você <Text style={{ color: colors.terracotta }}>começou.</Text>
        </Title>
        <Copy style={{ textAlign: 'center' }}>E isso já é mais do que ontem.</Copy>
      </View>
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden', marginTop: 16 }}>
        <View style={{ backgroundColor: '#efe6d6' }}>
          <SunOverHills height={190} />
        </View>
        <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
          <Pill>Desafio concluído</Pill>
          <Copy>Você dedicou</Copy>
          <Text
            style={[
              s.title,
              { fontSize: 46, lineHeight: 54, color: colors.terracotta, textAlign: 'center' },
            ]}
          >
            {item ? formatTime(item.payload.elapsed) : '—'}
          </Text>
          <Copy>à sua tarefa.</Copy>
          <View
            style={{ height: 1, width: '100%', backgroundColor: colors.line, marginVertical: 12 }}
          />
          <Icon name="flag" color="#e4c579" />
          <Copy style={{ fontSize: 14, textAlign: 'center' }}>
            A meta nunca foi terminar.{'\n'}Era começar.
          </Copy>
        </View>
      </Card>
      <Button onPress={() => go('/tarefa')}>Continuar por mais 2 minutos</Button>
      <Button variant="text" onPress={() => router.replace('/historico')}>
        Ver meu histórico
      </Button>
      {item && (
        <Button variant="text" onPress={() => setShowNote(!showNote)}>
          {showNote ? 'Fechar anotação' : 'Guardar meu fio da meada'}
        </Button>
      )}
      {item && showNote && (
        <Card>
          <Copy>
            {item.payload.title} · {formatTime(item.payload.elapsed)}
          </Copy>
          <Field
            label="Uma pista para quando voltar"
            multiline
            value={note}
            onChangeText={(v) => {
              setNote(v);
              setSaved(false);
            }}
            maxLength={1000}
          />
          <Button
            disabled={busy}
            onPress={async () => {
              if (await save('focus', { ...item.payload, note }, item)) setSaved(true);
            }}
          >
            Guardar meu fio da meada
          </Button>
          {saved && <Copy>Anotação guardada.</Copy>}
          {task && (
            <Button
              disabled={busy}
              onPress={() => void save('task', { ...task.payload, done: !task.payload.done }, task)}
            >
              {task.payload.done ? 'Reabrir esta tarefa' : 'Concluí também esta tarefa'}
            </Button>
          )}
        </Card>
      )}
    </Page>
  );
}
function Intentions() {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [values, setValues] = useState<
    { id: string; title: string; created_at?: string; createdAt?: string }[]
  >([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('intentions')
          .select('id,title,created_at')
          .order('updated_at', { ascending: false });
        if (error) throw error;
        setValues(data);
      } else
        setValues(JSON.parse((await AsyncStorage.getItem('doitbad-native-intentions')) ?? '[]'));
    } catch {
      setMessage('Não foi possível carregar suas intenções.');
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <Page navigation>
      <Pill>Intenções</Pill>
      <Title style={{ fontSize: 30, lineHeight: 36 }}>Intenções guardadas</Title>
      <Copy style={{ fontSize: 14 }}>Aqui ficam suas missões para quando você estiver pronto.</Copy>
      {values.map((v) => (
        <Card key={v.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={{ padding: 9, borderRadius: 12, backgroundColor: '#f4e8c8' }}>
            <Icon name="pencil" color={colors.terracotta} />
          </View>
          <View style={{ flex: 1 }}>
            <Copy style={{ color: colors.ink }}>{v.title}</Copy>
            <Copy style={{ fontSize: 12 }}>
              Criada em{' '}
              {new Date(v.created_at ?? v.createdAt ?? Date.now()).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
            </Copy>
          </View>
        </Card>
      ))}
      {!values.length && <Copy>Suas intenções vão encontrar espaço aqui.</Copy>}
      {adding && (
        <>
          <Field
            label="Minha intenção"
            multiline
            maxLength={240}
            value={title}
            onChangeText={setTitle}
          />
          <Button
            disabled={busy || !title.trim()}
            onPress={async () => {
              setBusy(true);
              try {
                if (supabase) {
                  const { error } = await supabase
                    .from('intentions')
                    .insert({ title: title.trim() });
                  if (error) throw error;
                } else {
                  await AsyncStorage.setItem(
                    'doitbad-native-intentions',
                    JSON.stringify([
                      {
                        id: String(Date.now()),
                        title: title.trim(),
                        createdAt: new Date().toISOString(),
                      },
                      ...values,
                    ]),
                  );
                }
                await load();
                setTitle('');
                setAdding(false);
                setMessage('Intenção guardada.');
              } catch {
                setMessage('Não foi possível guardar. Tente novamente.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Guardar intenção
          </Button>
        </>
      )}
      <Button variant={adding ? 'outline' : 'primary'} onPress={() => setAdding(!adding)}>
        {adding ? 'Cancelar' : '＋ Nova intenção'}
      </Button>
      {message && <Copy>{message}</Copy>}
    </Page>
  );
}
export function Detail({ screen, embedded = false }: { screen: string; embedded?: boolean }) {
  if (screen === 'tarefa') return <Start />;
  if (screen === 'foco') return <Timer />;
  if (screen === 'conclusao') return <Done />;
  if (screen === 'intencoes') return <Intentions />;
  return <Explore screen={screen} embedded={embedded} />;
}
function Explore({ screen, embedded = false }: { screen: string; embedded?: boolean }) {
  const { items, save, busy } = useStore();
  const [note, setNote] = useState('');
  const [mood, setMood] = useState(3);
  const [minutes, setMinutes] = useState(25);
  const [date, setDate] = useState(dayKey());
  const [message, setMessage] = useState('');
  const [recordMood, setRecordMood] = useState(false);
  const stats = summarize(items);
  const tasks = orderedTasks(items);
  const projectItems = items.filter((item): item is Item<'project'> => item.kind === 'project');
  const active = items.find(
    (i): i is Item<'focus'> => i.kind === 'focus' && i.payload.status === 'active',
  );
  if (screen === 'calendario')
    return (
      <Page navigation={!embedded}>
        <Copy style={{ fontSize: 12 }}>Seu ritmo, dia após dia</Copy>
        <Title style={{ fontSize: 30, lineHeight: 36 }}>Calendário</Title>
        <MonthGrid value={date} onChange={setDate} dates={tasks.map((t) => t.payload.date)} />
        <Text
          style={[s.text, { color: colors.ink, fontSize: 14, fontFamily: 'Inter_600SemiBold' }]}
        >
          {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        {tasks
          .filter((t) => t.payload.date === date)
          .map((t) => (
            <Card key={t.id} style={{ paddingHorizontal: 16, paddingVertical: 13 }}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`Concluir ${t.payload.title}`}
                accessibilityState={{ checked: t.payload.done }}
                disabled={busy || (isTaskBlocked(t, items) && !t.payload.done)}
                onPress={() => void save('task', { ...t.payload, done: !t.payload.done }, t)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: colors.sage,
                    backgroundColor: t.payload.done ? colors.sage : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t.payload.done && <Icon name="check" size={15} color={colors.canvas} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      s.text,
                      { color: colors.ink, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
                      t.payload.done && { textDecorationLine: 'line-through', opacity: 0.6 },
                    ]}
                  >
                    {t.payload.title}
                  </Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}
                  >
                    {!!t.payload.project &&
                      (() => {
                        const project = projectItems.find(
                          (item) =>
                            item.id === t.payload.projectId ||
                            item.payload.title === t.payload.project,
                        );
                        const color = project?.payload.color ?? colors.sage;
                        return (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 5,
                              borderRadius: 12,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              backgroundColor: `${color}20`,
                            }}
                          >
                            <View
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: color,
                              }}
                            />
                            <Copy style={{ fontSize: 10, lineHeight: 14, color }}>
                              {t.payload.project}
                            </Copy>
                          </View>
                        );
                      })()}
                    {(t.payload.recurrence ?? 'none') !== 'none' && (
                      <Copy style={{ fontSize: 10, lineHeight: 20 }}>
                        ↻ {recurrenceLabels[t.payload.recurrence ?? 'none']}
                      </Copy>
                    )}
                  </View>
                </View>
              </Pressable>
            </Card>
          ))}
        {!tasks.some((t) => t.payload.date === date) && (
          <Copy>Um dia com espaço. Você decide o que cabe aqui.</Copy>
        )}
        <Button variant="text" onPress={() => go('/tarefas')}>
          Voltar para a lista
        </Button>
      </Page>
    );
  if (screen === 'mapa')
    return (() => {
      const task = tasks.find((item) => !item.payload.done) ?? tasks[0];
      const steps = task?.payload.steps.length
        ? task.payload.steps
        : task
          ? [task.payload.title]
          : [];
      const completed = task?.payload.steps.length
        ? (task.payload.completedSteps ?? [])
        : task?.payload.done
          ? [0]
          : [];
      return (
        <Page navigation={!embedded}>
          <Pill>Seu mapa de hoje</Pill>
          <Title style={{ fontSize: 30, lineHeight: 36 }}>
            Veja seus passos e avance no seu ritmo.
          </Title>
          <Card style={{ backgroundColor: '#efe6d6' }}>
            <PathMap done={completed.length} total={Math.max(steps.length, 1)} />
          </Card>
          <Text style={[s.text, { color: colors.ink }]}>⚑ Próximos passos</Text>
          {!task && <Copy>Crie uma tarefa para começar seu mapa.</Copy>}
          {task &&
            steps.map((label, index) => {
              const checked = completed.includes(index);
              return (
                <Pressable
                  key={`${task.id}-${index}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked, disabled: busy }}
                  disabled={busy}
                  onPress={() =>
                    void save(
                      'task',
                      task.payload.steps.length
                        ? toggleStep(task.payload, index)
                        : { ...task.payload, done: !task.payload.done },
                      task,
                    )
                  }
                  style={[
                    s.card,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      gap: 12,
                      backgroundColor: checked ? '#e8eadc' : colors.surface,
                      borderColor: checked ? colors.sage : colors.line,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: checked ? colors.sage : colors.line,
                      backgroundColor: checked ? colors.sage : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {checked && <Icon name="check" size={15} color={colors.canvas} />}
                  </View>
                  <Text
                    style={[
                      s.text,
                      { flex: 1, color: checked ? colors.muted : colors.ink, fontSize: 14 },
                      checked && { textDecorationLine: 'line-through' },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
        </Page>
      );
    })();
  if (screen === 'desafios') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const week = summarize(items.filter((i) => new Date(i.created_at) >= start));
    return (
      <Page navigation={!embedded}>
        <Pill>Desafios gentis</Pill>
        <Title style={{ fontSize: 30, lineHeight: 36 }}>Desafio da semana</Title>
        <Card style={{ backgroundColor: '#f2e3c8', padding: 24 }}>
          <Text style={s.subtitle}>Começar 5 dias seguidos</Text>
          <Copy style={{ fontSize: 13 }}>Um pequeno passo por dia. Sem pressa.</Copy>
          <View
            style={{
              height: 10,
              borderRadius: 8,
              backgroundColor: colors.canvas,
              overflow: 'hidden',
              marginTop: 8,
            }}
          >
            <View
              style={{
                height: 10,
                borderRadius: 8,
                backgroundColor: colors.terracotta,
                width: `${Math.min(100, (week.days / 5) * 100)}%`,
              }}
            />
          </View>
          <Copy style={{ fontSize: 12, textAlign: 'right' }}>
            {Math.min(week.days, 5)} / 5 dias
          </Copy>
        </Card>
        <Text style={[s.text, { color: colors.ink, marginTop: 12 }]}>Desafios disponíveis</Text>
        {[
          ['Foco de 10 minutos', week.minutes, 10],
          ['Pequenas vitórias', week.steps, 3],
          ['Manhã ativa', week.days, 5],
        ].map(([title, value, total]) => (
          <ListRow
            key={title}
            icon="flag"
            title={String(title)}
            meta={`${Math.min(Number(value), Number(total))} de ${total}`}
            onPress={() => go('/tarefa')}
          />
        ))}
        <Button onPress={() => go('/tarefa')}>Dar um passo</Button>
      </Page>
    );
  }
  if (screen === 'retomada')
    return (
      <Page dark contentStyle={{ paddingTop: 72 }}>
        <Copy style={{ textAlign: 'center', fontSize: 13, letterSpacing: 2, color: '#c9c0ac' }}>
          ANTES DE CONTINUAR…
        </Copy>
        <Title
          style={{
            fontSize: 32,
            lineHeight: 42,
            textAlign: 'center',
            color: colors.canvas,
            marginTop: 8,
          }}
        >
          Você tinha algo que queria fazer hoje?
        </Title>
        <Copy style={{ textAlign: 'center', fontSize: 14, color: '#b9b19c' }}>
          Sem cobrança. Só um convite gentil para dar o próximo passo.
        </Copy>
        <View style={{ flex: 1, minHeight: 80, justifyContent: 'flex-end' }}>
          <NightScene height={200} />
        </View>
        {active ? (
          <Card>
            <Text style={s.subtitle}>{active.payload.title}</Text>
            <Copy>{active.payload.step}</Copy>
            {active.payload.note && <Copy>{active.payload.note}</Copy>}
            <Field
              label="Uma pista para a próxima visita"
              multiline
              value={note}
              onChangeText={setNote}
            />
            <Button
              disabled={busy}
              onPress={async () => {
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
                  setMessage('Passo pausado e anotação guardada.');
              }}
            >
              Pausar e guardar
            </Button>
            <Button onPress={() => go(`/foco?id=${active.id}`)}>Retomar meu passo</Button>
            {message && <Copy>{message}</Copy>}
          </Card>
        ) : (
          <>
            <Button
              style={{ backgroundColor: '#e4c579' }}
              textStyle={{ color: colors.night }}
              onPress={() => go('/tarefas')}
            >
              Ver minhas tarefas
            </Button>
          </>
        )}
        <Button variant="text" textStyle={{ color: '#c9c0ac' }} onPress={() => router.replace('/')}>
          Continuar navegando
        </Button>
        <Copy style={{ textAlign: 'center', fontSize: 12, fontStyle: 'italic', color: '#b9b19c' }}>
          A escolha é sua. Sempre.
        </Copy>
      </Page>
    );
  if (screen === 'estatisticas')
    return (
      <Page navigation={!embedded}>
        <Pill>Estatísticas emocionais</Pill>
        <Title style={{ fontSize: 30, lineHeight: 36 }}>Como você se sente ao começar?</Title>
        <Copy>Acompanhe seus padrões e se conheça melhor.</Copy>
        <Card>
          <Text style={s.subtitle}>Seus últimos sete dias</Text>
          <MoodChart
            values={Array.from({ length: 7 }, (_, n) => {
              const d = new Date();
              d.setDate(d.getDate() - 6 + n);
              const records = items.filter(
                (i): i is Item<'mood'> =>
                  i.kind === 'mood' && dayKey(new Date(i.created_at)) === dayKey(d),
              );
              return {
                label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
                value: records.length
                  ? records.reduce((sum, i) => sum + i.payload.value, 0) / records.length
                  : null,
              };
            })}
          />
          <Copy>
            Dias sem registro ficam em branco. Cada ponto representa a média dos registros daquele
            dia.
          </Copy>
        </Card>
        <Card style={{ flexDirection: 'row', padding: 16, alignItems: 'flex-start' }}>
          <View style={{ padding: 8, borderRadius: 12, backgroundColor: '#f4e8c8' }}>
            <Icon name="heart" color={colors.terracotta} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.eyebrow}>Insight</Text>
            <Copy style={{ color: colors.ink, fontSize: 14 }}>
              Cada registro ajuda você a reconhecer seus padrões. Observe o que muda entre os dias.
            </Copy>
          </View>
        </Card>
        <View style={[s.row, { alignItems: 'stretch' }]}>
          <Card style={{ flex: 1, minWidth: 120, padding: 16 }}>
            <Text style={[s.subtitle, { fontSize: 28, color: colors.terracotta }]}>
              {stats.minutes} min
            </Text>
            <Copy style={{ fontSize: 12 }}>De presença nas suas tarefas</Copy>
          </Card>
          <Card style={{ flex: 1, minWidth: 120, padding: 16 }}>
            <Text style={[s.subtitle, { fontSize: 28, color: colors.sage }]}>
              {items.filter((i) => i.kind === 'mood').length}
            </Text>
            <Copy style={{ fontSize: 12 }}>Registros de como você se sente</Copy>
          </Card>
        </View>
        <Button variant="outline" onPress={() => setRecordMood(!recordMood)}>
          {recordMood ? 'Fechar registro' : 'Como você se sente agora?'}
        </Button>
        {recordMood && (
          <>
            <Text style={s.subtitle}>Como você se sente agora?</Text>
            <Copy>Um registro opcional para se perceber.</Copy>
            <View style={s.row}>
              {['Muito baixo', 'Baixo', 'Neutro', 'Bem', 'Muito bem'].map((label, n) => (
                <Pressable
                  key={label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: mood === n + 1 }}
                  style={[s.pill, mood === n + 1 && s.selected]}
                  onPress={() => setMood(n + 1)}
                >
                  <Text style={s.text}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Field
              label="Quer guardar algo sobre hoje?"
              multiline
              value={note}
              onChangeText={setNote}
              maxLength={1000}
            />
            <Button
              disabled={busy}
              onPress={async () => {
                if (await save('mood', { value: mood, note })) {
                  setNote('');
                  setMessage('Registro guardado.');
                }
              }}
            >
              Guardar meu registro
            </Button>
            {message && <Copy>{message}</Copy>}
            {items
              .filter((i): i is Item<'mood'> => i.kind === 'mood')
              .map((i) => (
                <Card key={i.id}>
                  <Copy>
                    {new Date(i.created_at).toLocaleDateString('pt-BR')} ·{' '}
                    {['Muito baixo', 'Baixo', 'Neutro', 'Bem', 'Muito bem'][i.payload.value - 1]}
                  </Copy>
                  {i.payload.note && <Copy>{i.payload.note}</Copy>}
                </Card>
              ))}
          </>
        )}
        {embedded && (
          <>
            <ListRow icon="flag" title="Mapa de execução" onPress={() => go('/mapa')} />
            <ListRow icon="leaf" title="Intenções guardadas" onPress={() => go('/intencoes')} />
            <ListRow icon="moon" title="Modo zen" onPress={() => go('/zen')} />
            <Button
              variant="text"
              onPress={() => {
                void supabase?.auth.signOut().then(({ error }) => {
                  if (error) setMessage(error.message);
                });
              }}
            >
              Sair da conta
            </Button>
          </>
        )}
      </Page>
    );
  if (screen === 'zen')
    return (
      <Page navigation={!embedded}>
        <Pill>Modo zen</Pill>
        <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
          <View style={{ backgroundColor: colors.night }}>
            <NightScene height={220} />
            <View style={{ padding: 24, paddingTop: 0, gap: 4 }}>
              <Text style={[s.title, { color: colors.canvas, fontSize: 28, lineHeight: 35 }]}>
                Ambiente zen
              </Text>
              <Text style={[s.text, { fontSize: 13, color: '#c9c0ac' }]}>
                Um espaço tranquilo para você focar.
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            <Ambience />
          </View>
          <View style={{ padding: 20, gap: 12, borderTopWidth: 1, borderColor: colors.line }}>
            <Copy style={{ color: colors.ink }}>Duração</Copy>
            <View style={s.row}>
              {[10, 25, 45].map((n) => (
                <Pressable
                  key={n}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: minutes === n }}
                  onPress={() => setMinutes(n)}
                  style={[s.pill, { flexGrow: 1, borderRadius: 12 }, minutes === n && s.selected]}
                >
                  <Text style={[s.text, { textAlign: 'center', fontSize: 13 }]}>{n} min</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>
        <Copy style={{ fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
          “Você não precisa fazer tudo hoje. Só o próximo passo.”
        </Copy>
        <Button
          disabled={busy}
          onPress={async () => {
            if (active) {
              go(`/foco?id=${active.id}`);
              return;
            }
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
            if (i) go(`/foco?id=${i.id}`);
          }}
        >
          Começar
        </Button>
      </Page>
    );
  return (
    <Page>
      <Title>Seu espaço para começar.</Title>
      <Button onPress={() => router.replace('/')}>Voltar ao início</Button>
    </Page>
  );
}
