import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { router, usePathname } from 'expo-router';
import { colors, formatTime, projectRhythm, rhythmClock, type Item } from '@doitbad/core';
import { useStore } from './store';
export default function RhythmMini() {
  const { items, night } = useStore();
  const path = usePathname();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const item = items.find(
    (i): i is Item<'focus'> =>
      i.kind === 'focus' && i.payload.status === 'active' && !!i.payload.rhythm,
  );
  if (!item || path === '/foco') return null;
  const f = projectRhythm(item.payload, now);
  const r = f.rhythm!;
  const state = r.paused
    ? 'Pausado'
    : r.phase === 'checkin'
      ? 'Tempo concluído — escolha como seguir'
      : r.phase === 'ready'
        ? 'Pausa concluída — retome quando quiser'
        : `${formatTime(rhythmClock(f))} · ${r.phase === 'break' ? 'descanso' : 'foco'}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Retomar ${f.title}: ${state}`}
      onPress={() => router.push(`/foco?id=${item.id}` as never)}
      style={{
        padding: 16,
        borderWidth: 1,
        borderColor: night ? colors.nightLine : colors.line,
        borderRadius: 16,
        gap: 6,
      }}
    >
      <Text
        style={{ fontFamily: 'Inter_600SemiBold', color: night ? colors.nightInk : colors.ink }}
      >
        {f.title}
      </Text>
      <Text
        style={{ fontFamily: 'Inter_400Regular', color: night ? colors.nightMuted : colors.muted }}
      >
        {state}
      </Text>
      {r.config.eyeCare &&
        r.phase === 'focus' &&
        !r.paused &&
        r.eyeDueIn === 0 &&
        r.eyeRemaining === 0 && (
          <Text style={{ color: night ? colors.nightInk : colors.ink }}>
            Descanso visual disponível
          </Text>
        )}
    </Pressable>
  );
}
