import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useStore } from '../src/store';
import { Button, Card, Copy, Page, Title } from '../src/ui';
import { Logo } from '../src/visuals';
import { CozyRoom } from '../src/illustrations';
export default function Welcome() {
  const { session } = useStore();
  if (session) return <Redirect href="/" />;
  return (
    <Page contentStyle={{ paddingTop: 40 }}>
      <View style={{ alignItems: 'center' }}>
        <Logo />
      </View>
      <View style={{ alignItems: 'center', gap: 16, marginTop: 24 }}>
        <Title style={{ textAlign: 'center' }}>Que bom te ver por aqui!</Title>
        <Copy style={{ textAlign: 'center', maxWidth: 280 }}>
          Vamos transformar intenção em ação. Um passo de cada vez.
        </Copy>
      </View>
      <Card style={{ padding: 16, marginTop: 24, borderRadius: 28, overflow: 'hidden' }}>
        <CozyRoom />
      </Card>
      <View style={{ flex: 1 }} />
      <Button onPress={() => router.push('/entrar?mode=signup')}>Vamos começar</Button>
      <Button variant="text" onPress={() => router.push('/entrar')}>
        Já tenho uma conta
      </Button>
    </Page>
  );
}
