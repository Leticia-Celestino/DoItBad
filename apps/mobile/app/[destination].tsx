import { Redirect, useLocalSearchParams } from 'expo-router';
import { useStore, supabase } from '../src/store';
import { Detail } from '../src/screens';
import { Text } from 'react-native';
import { Page, Copy } from '../src/ui';
export default function Screen() {
  const { destination } = useLocalSearchParams<{ destination: string }>();
  const { ready, dataReady, session } = useStore();
  if (!ready) return <Text>Preparando seu espaço…</Text>;
  if (supabase && !session) return <Redirect href="/entrar" />;
  if (!dataReady)
    return (
      <Page>
        <Copy>Preparando seu espaço…</Copy>
      </Page>
    );
  return <Detail screen={destination} />;
}
