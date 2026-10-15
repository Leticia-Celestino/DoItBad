import { Redirect, Tabs } from 'expo-router';
import { useStore, supabase } from '../../src/store';
import { Page, Copy } from '../../src/ui';
import Splash from '../../src/Splash';
import BottomNav from '../../src/BottomNav';
export default function Layout() {
  const { ready, dataReady, session } = useStore();
  if (!ready) return <Splash />;
  if (supabase && !session) return <Redirect href="/boas-vindas" />;
  if (!dataReady)
    return (
      <Page>
        <Copy>Preparando seu espaço…</Copy>
      </Page>
    );
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <BottomNav />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tarefas" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="mais" />
      <Tabs.Screen name="historico" options={{ href: null }} />
    </Tabs>
  );
}
