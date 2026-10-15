import { Keyboard, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { router, usePathname } from 'expo-router';
import { colors } from '@doitbad/core';
import { Icon } from './visuals';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from './store';

export default function BottomNav() {
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const path = usePathname();
  const { night } = useStore();
  const surface = night ? '#2c3140' : colors.surface;
  const line = night ? '#464c5d' : colors.line;
  const ink = night ? '#f4ede1' : colors.ink;
  const muted = night ? '#c9c0ac' : colors.muted;
  const rail = width >= 768 || (width >= 600 && width > height);
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboard && !rail) return null;
  const entries = [
    ['/', 'Início', 'home'],
    ['/tarefas', 'Tarefas', 'tasks'],
    ['/tarefa', 'Começar', 'plus'],
    ['/agenda', 'Agenda', 'calendar'],
    ['/mais', 'Você', 'person'],
  ] as const;
  return (
    <View
      style={
        rail
          ? {
              position: 'absolute',
              left: insets.left,
              top: insets.top,
              bottom: insets.bottom,
              width: 96,
              justifyContent: 'center',
              backgroundColor: night ? colors.night : colors.canvas,
            }
          : {
              position: 'absolute',
              bottom: Math.max(insets.bottom, 12),
              left: Math.max(insets.left, 16),
              right: Math.max(insets.right, 16),
            }
      }
    >
      <View
        style={{
          width: '100%',
          maxWidth: rail ? 96 : 560,
          alignSelf: 'center',
          flexDirection: rail ? 'column' : 'row',
          alignItems: 'stretch',
          gap: rail ? 16 : 0,
          backgroundColor: surface,
          borderWidth: 1,
          borderColor: line,
          borderRadius: rail ? 28 : 999,
          paddingHorizontal: rail ? 4 : 6,
          paddingVertical: rail ? 10 : 6,
          shadowColor: ink,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.18,
          shadowRadius: 18,
          elevation: 10,
        }}
      >
        {entries.map(([href, label, icon]) => {
          const active =
            path === href ||
            (href === '/' && path === '/historico') ||
            (href === '/agenda' && path === '/calendario') ||
            (href === '/mais' &&
              !['/', '/historico', '/tarefas', '/tarefa', '/agenda', '/calendario'].includes(path));
          const create = href === '/tarefa';
          return (
            <Pressable
              key={href}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(href as never)}
              style={({ pressed }) => ({
                flex: rail ? undefined : 1,
                minWidth: 0,
                minHeight: 54 + Math.max(0, fontScale - 1) * 14,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                opacity: pressed ? 0.65 : 1,
                transform: create && !rail ? [{ translateY: -12 }] : undefined,
              })}
            >
              <View
                style={{
                  width: create ? 48 : undefined,
                  height: create ? 48 : undefined,
                  paddingVertical: create ? 0 : 6,
                  paddingHorizontal: create ? 0 : 13,
                  borderRadius: create ? 24 : 18,
                  backgroundColor: create
                    ? colors.sage
                    : active
                      ? night
                        ? '#394235'
                        : '#e5e7d8'
                      : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={icon}
                  size={21}
                  color={create ? colors.canvas : active ? colors.sage : muted}
                />
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 10,
                  maxWidth: '100%',
                  paddingHorizontal: 4,
                  textAlign: 'center',
                  color: active ? colors.sage : ink,
                  flexShrink: 1,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
