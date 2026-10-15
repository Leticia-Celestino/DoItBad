import { useEffect, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Text, View } from 'react-native';
import { supabase, useStore } from '../src/store';
import { Logo } from '../src/visuals';
import { Button, Card, Copy, Field, Page, Title, s } from '../src/ui';
export default function Login() {
  const { session } = useStore();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'password'>(
    params.mode === 'signup' ? 'signup' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const link = Linking.useURL();
  useEffect(() => {
    setMode(params.mode === 'signup' ? 'signup' : 'signin');
  }, [params.mode]);
  useEffect(() => {
    if (!link || !supabase) return;
    let parsed: URL;
    try {
      parsed = new URL(link.replace('#', link.includes('?') ? '&' : '?'));
    } catch {
      return;
    }
    const access = parsed.searchParams.get('access_token');
    const refresh = parsed.searchParams.get('refresh_token');
    if (access && refresh) {
      if (parsed.searchParams.get('type') === 'recovery') setMode('password');
      void supabase.auth
        .setSession({ access_token: access, refresh_token: refresh })
        .then(({ error }) => {
          if (error) setStatus(error.message);
        });
    }
  }, [link]);
  if (session && mode !== 'password') return <Redirect href="/" />;
  async function submit() {
    if (!supabase) return;
    setBusy(true);
    setStatus('');
    try {
      const redirect = 'doitbad://entrar';
      const result =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : mode === 'signup'
            ? await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: redirect, data: { name: name.trim() } },
              })
            : mode === 'reset'
              ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect })
              : await supabase.auth.updateUser({ password });
      if (result.error) throw result.error;
      if (mode === 'password') setMode('signin');
      else if (mode !== 'signin') setStatus('Confira seu e-mail para continuar.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page back>
      <Logo size={26} />
      <View style={{ gap: 8, marginTop: 16 }}>
        <Title style={{ fontSize: 32, lineHeight: 40 }}>
          {mode === 'signup'
            ? 'Comece do jeitinho leve'
            : mode === 'reset'
              ? 'Vamos recuperar seu acesso'
              : mode === 'password'
                ? 'Sua nova senha'
                : 'Bem-vindo de volta'}
        </Title>
        <Copy>
          {mode === 'signup'
            ? 'Crie sua conta em segundos.'
            : mode === 'reset'
              ? 'Enviaremos um link para você escolher uma nova senha.'
              : 'Continue de onde você parou.'}
        </Copy>
      </View>
      {!supabase ? (
        <Card>
          <Copy>Ambiente local de desenvolvimento. Os dados ficam apenas neste dispositivo.</Copy>
          <Button onPress={() => router.replace('/')}>Abrir meu espaço local</Button>
        </Card>
      ) : (
        <View style={{ gap: 20, flex: 1, paddingTop: 12 }}>
          <Text style={[s.subtitle, { display: 'none' }]}>
            {mode === 'signup'
              ? 'Crie seu espaço'
              : mode === 'reset'
                ? 'Recuperar acesso'
                : mode === 'password'
                  ? 'Sua nova senha'
                  : 'Entre no seu espaço'}
          </Text>
          {mode === 'signup' && (
            <Field
              label="Nome"
              placeholder="Como te chamamos?"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
          )}
          {mode !== 'password' && (
            <Field
              label="E-mail"
              placeholder="voce@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
          )}
          {mode !== 'reset' && (
            <Field
              label="Senha"
              placeholder="Pelo menos 8 caracteres"
              secureTextEntry
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChangeText={setPassword}
            />
          )}
          <View style={{ flex: 1, minHeight: 16 }} />
          <Button
            disabled={
              busy || (!email && mode !== 'password') || (mode !== 'reset' && password.length < 8)
            }
            onPress={() => void submit()}
          >
            {busy
              ? 'Aguarde…'
              : mode === 'signin'
                ? 'Entrar'
                : mode === 'signup'
                  ? 'Criar conta'
                  : mode === 'password'
                    ? 'Salvar senha'
                    : 'Enviar link'}
          </Button>
          {status && (
            <Text accessibilityLiveRegion="polite" style={s.text}>
              {status}
            </Text>
          )}
          <Button
            variant="text"
            onPress={() => {
              setStatus('');
              setMode(mode === 'signin' ? 'signup' : 'signin');
            }}
          >
            {mode === 'signin' ? 'Criar minha conta' : 'Já tenho uma conta'}
          </Button>
          {mode === 'signin' && (
            <Button
              variant="text"
              onPress={() => {
                setStatus('');
                setMode('reset');
              }}
            >
              Esqueci minha senha
            </Button>
          )}
        </View>
      )}
    </Page>
  );
}
