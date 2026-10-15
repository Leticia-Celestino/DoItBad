import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, supabase } from '../src/store';
import { colors } from '@doitbad/core';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Text, View } from 'react-native';
import Splash from '../src/Splash';
import { useEffect, useState } from 'react';
export default function Layout() {
  const [opening, setOpening] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setOpening(false), 2100);
    return () => clearTimeout(timer);
  }, []);
  const [loaded, error] = useFonts({ Fraunces_400Regular, Inter_400Regular, Inter_600SemiBold });
  if (!__DEV__ && !supabase)
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', padding: 32 }}
      >
        <Text style={{ fontSize: 24, color: colors.ink }}>Seu espaço está sendo preparado.</Text>
        <Text style={{ color: colors.muted, marginTop: 16 }}>
          O acesso está temporariamente indisponível. Tente novamente mais tarde.
        </Text>
      </View>
    );
  if (opening || (!loaded && !error)) return <Splash />;
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.canvas },
          headerTintColor: colors.sage,
          headerShadowVisible: false,
          headerTitle: 'DoItBad',
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="entrar" options={{ title: 'Seu acesso' }} />
        <Stack.Screen name="[destination]" options={{ title: 'Seu próximo passo' }} />
      </Stack>
    </StoreProvider>
  );
}
