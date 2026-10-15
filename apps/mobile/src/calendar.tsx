import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, dayKey } from '@doitbad/core';
import { s } from './ui';
import { Icon } from './visuals';
export function MonthGrid({
  value,
  onChange,
  dates,
}: {
  value: string;
  onChange: (v: string) => void;
  dates: string[];
}) {
  const [month, setMonth] = useState(() => new Date(value + 'T12:00:00'));
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = first.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((offset + days) / 7) * 7;
  const [view, setView] = useState<'month' | 'day'>('month');
  function move(direction: number) {
    if (view === 'month')
      setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1, 12));
    else {
      const next = new Date(value + 'T12:00:00');
      next.setDate(next.getDate() + direction);
      onChange(dayKey(next));
      setMonth(next);
    }
  }
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 28,
          padding: 4,
          backgroundColor: colors.surface,
        }}
      >
        {(['month', 'day'] as const).map((v) => (
          <Pressable
            key={v}
            accessibilityRole="radio"
            accessibilityState={{ selected: view === v }}
            onPress={() => setView(v)}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 24,
              backgroundColor: view === v ? colors.sage : 'transparent',
            }}
          >
            <Text
              style={[s.text, { fontSize: 13, color: view === v ? colors.canvas : colors.muted }]}
            >
              {v === 'month' ? 'Mês' : 'Dia'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={view === 'month' ? 'Mês anterior' : 'Dia anterior'}
          onPress={() => move(-1)}
          style={{ padding: 8 }}
        >
          <Icon name="back" size={20} />
        </Pressable>
        <Text style={[s.subtitle, { fontSize: 18, flex: 1, textAlign: 'center' }]}>
          {view === 'month'
            ? month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : new Date(value + 'T12:00:00').toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
              })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={view === 'month' ? 'Próximo mês' : 'Próximo dia'}
          onPress={() => move(1)}
          style={{ padding: 8 }}
        >
          <Icon name="next" size={20} />
        </Pressable>
      </View>
      {view === 'month' && (
        <>
          <View style={{ flexDirection: 'row' }}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <Text
                key={i}
                style={[s.text, { width: '14.2857%', textAlign: 'center', fontSize: 12 }]}
              >
                {d}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: cells }, (_, i) => {
              const d = i - offset + 1;
              const key = dayKey(new Date(month.getFullYear(), month.getMonth(), d, 12));
              return d < 1 || d > days ? (
                <View key={i} style={{ width: '14.2857%', minHeight: 36 }} />
              ) : (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={new Date(key + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                  })}
                  accessibilityState={{ selected: value === key }}
                  onPress={() => {
                    onChange(key);
                    setView('day');
                  }}
                  style={{
                    width: '14.2857%',
                    minHeight: 36,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: value === key ? colors.sage : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    borderWidth: key === dayKey() ? 1 : 0,
                    borderColor: colors.sage,
                  }}
                >
                  <Text
                    style={[
                      s.text,
                      { fontSize: 14, color: value === key ? colors.surface : colors.ink },
                    ]}
                  >
                    {d}
                  </Text>
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: dates.includes(key)
                        ? value === key
                          ? colors.surface
                          : colors.terracotta
                        : 'transparent',
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
