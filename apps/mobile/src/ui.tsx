import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
  useWindowDimensions,
} from 'react-native';
import { router, useSegments, useFocusEffect } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { Icon, Logo, type IconName } from './visuals';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@doitbad/core';
import { type ReactNode } from 'react';
import { useStore, supabase } from './store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, useCallback } from 'react';
import { dayKey } from '@doitbad/core';
import BottomNav from './BottomNav';
import { StatusBar } from 'expo-status-bar';
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: {
    padding: 24,
    gap: 16,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    fontFamily: 'Fraunces_400Regular',
  },
  subtitle: {
    fontSize: 23,
    color: colors.ink,
    fontFamily: 'Fraunces_400Regular',
  },
  text: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 24, color: colors.muted },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: colors.sage, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.surface,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  button: {
    backgroundColor: colors.sage,
    padding: 16,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    flexShrink: 1,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    minHeight: 50,
  },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  timer: {
    fontSize: 68,
    color: colors.sage,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    paddingVertical: 38,
  },
  error: { color: '#873e27', backgroundColor: '#f6dfd5', padding: 15, borderRadius: 10 },
  metric: { fontSize: 38, color: colors.sage },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    maxWidth: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.sage, borderWidth: 2 },
});
export function choiceState(night: boolean, selected: boolean): ViewStyle {
  return {
    backgroundColor: selected
      ? night
        ? colors.nightRaised
        : colors.sageSoft
      : night
        ? colors.nightSurface
        : colors.surface,
    borderColor: selected
      ? night
        ? colors.nightMuted
        : colors.sage
      : night
        ? colors.nightLine
        : colors.line,
    borderWidth: selected ? 2 : 1,
  };
}
export function Page({
  children,
  back = false,
  step,
  brand = false,
  onBack,
  dark = false,
  contentStyle,
  navigation = false,
}: {
  children: ReactNode;
  back?: boolean;
  step?: number;
  brand?: boolean;
  onBack?: () => void;
  dark?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  navigation?: boolean;
}) {
  const { error, refresh, night } = useStore();
  const nightPage = dark || night;
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') NavigationBar.setStyle(nightPage ? 'light' : 'dark');
    }, [nightPage]),
  );
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const inTabs = useSegments().includes('(tabs)');
  const hasNavigation = inTabs || navigation;
  const rail = hasNavigation && (width >= 768 || (width >= 600 && width > height));
  const wide = hasNavigation && width >= 768;
  return (
    <SafeAreaView
      style={[s.page, nightPage && { backgroundColor: colors.night }]}
      edges={hasNavigation ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}
    >
      <StatusBar style={nightPage ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1, paddingLeft: rail ? 96 : 0 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.content,
            { paddingHorizontal: width < 360 ? 18 : wide ? 40 : 24, maxWidth: wide ? 1000 : 560 },
            contentStyle,
            hasNavigation && {
              paddingBottom: rail ? 40 : Math.max(104, 86 + 14 * fontScale) + insets.bottom,
            },
          ]}
        >
          {(back || brand || step !== undefined) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 44,
              }}
            >
              {back ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Voltar"
                  onPress={
                    onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))
                  }
                  style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
                >
                  <Icon name="back" />
                </Pressable>
              ) : (
                <Logo size={26} />
              )}
              {step !== undefined && (
                <View
                  accessibilityLabel={`Etapa ${step + 1} de 4`}
                  style={{ flexDirection: 'row', gap: 7 }}
                >
                  {[0, 1, 2, 3].map((n) => (
                    <View
                      key={n}
                      style={{
                        height: 6,
                        width: n <= step ? 22 : 7,
                        borderRadius: 4,
                        backgroundColor: n <= step ? colors.terracotta : colors.line,
                      }}
                    />
                  ))}
                </View>
              )}
              {back && <View style={{ width: 44 }} />}
            </View>
          )}
          {!supabase && <Text style={s.eyebrow}>Desenvolvimento · dados neste dispositivo</Text>}
          {error && (
            <View>
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
              <Button onPress={() => void refresh()}>Tentar sincronizar novamente</Button>
            </View>
          )}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {navigation && <BottomNav />}
    </SafeAreaView>
  );
}

export function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(`${value}T12:00:00`);
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.text}>Quando?</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escolher data"
        style={s.input}
        onPress={() => setOpen(!open)}
      >
        <Text style={s.text}>
          {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, next) => {
            if (Platform.OS === 'android') setOpen(false);
            if (event.type === 'set' && next) onChange(dayKey(next));
          }}
        />
      )}
    </View>
  );
}
export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { night } = useStore();
  return (
    <Text accessibilityRole="header" style={[s.title, night && { color: colors.nightInk }, style]}>
      {children}
    </Text>
  );
}
export function Copy({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { night } = useStore();
  return <Text style={[s.text, night && { color: colors.nightMuted }, style]}>{children}</Text>;
}
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { night } = useStore();
  return (
    <View
      style={[
        s.card,
        style,
        night && { backgroundColor: colors.nightSurface, borderColor: colors.nightLine },
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  children,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'text';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { night } = useStore();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        variant !== 'primary' && {
          backgroundColor: 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.sage,
        },
        style,
        { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text
        style={[
          s.buttonText,
          variant !== 'primary' && { color: colors.sage },
          variant === 'text' && {
            fontSize: 14,
            textDecorationLine: 'underline',
            color: night ? colors.nightMuted : colors.muted,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  const { night } = useStore();
  return (
    <View style={{ gap: 8 }}>
      {!!label && (
        <Text
          style={[s.text, night && { color: colors.nightMuted }, { fontSize: 13, lineHeight: 18 }]}
        >
          {label}
        </Text>
      )}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={night ? colors.nightMuted : colors.muted}
        style={[
          s.input,
          night && {
            backgroundColor: colors.nightSurface,
            borderColor: colors.nightLine,
            color: colors.nightInk,
          },
          props.multiline && { minHeight: 100, textAlignVertical: 'top' },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function ListRow({
  icon,
  title,
  meta,
  onPress,
}: {
  icon: IconName;
  title: string;
  meta?: string;
  onPress: () => void;
}) {
  const { night } = useStore();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        night && { backgroundColor: colors.nightSurface, borderColor: colors.nightLine },
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          gap: 12,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={{
          backgroundColor: night ? colors.nightRaised : colors.sageSoft,
          borderRadius: 12,
          padding: 10,
        }}
      >
        <Icon name={icon} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 14,
            color: night ? colors.nightInk : colors.ink,
          }}
        >
          {title}
        </Text>
        {meta && (
          <Text
            style={[
              s.text,
              night && { color: colors.nightMuted },
              { fontSize: 12, lineHeight: 18 },
            ]}
          >
            {meta}
          </Text>
        )}
      </View>
      <Icon name="next" size={16} />
    </Pressable>
  );
}
export function Pill({ children }: { children: string }) {
  const { night } = useStore();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: night ? colors.nightRaised : colors.sageSoft,
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 30,
      }}
    >
      <Text style={[s.eyebrow, { letterSpacing: 1, fontFamily: 'Inter_600SemiBold' }]}>
        {children}
      </Text>
    </View>
  );
}
