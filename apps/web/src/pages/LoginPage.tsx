import { FormEvent, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { requestPasswordReset, signIn, signUp } from '../lib/auth';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setStatus('');
    try {
      if (mode === 'reset') { await requestPasswordReset(email); setStatus('Enviamos um link para redefinir sua senha.'); }
      else if (mode === 'signup') { await signUp(email, password); setStatus('Conta criada. Confira seu e-mail para confirmar o acesso.'); }
      else await signIn(email, password);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }

  if (!isSupabaseConfigured) return <main className="entry-page"><section className="entry-card" aria-labelledby="entry-title"><a className="brand" href="/entrar">DoIt<span>B</span>ad<i>✦</i></a><p className="eyebrow">Beta web</p><h1 id="entry-title">Entre quando o acesso estiver liberado.</h1><p>Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o acesso do beta.</p><small>Somente para desenvolvimento. Os dados ficam neste navegador.</small></section></main>;

  return <main className="entry-page"><section className="entry-card" aria-labelledby="entry-title"><a className="brand" href="/entrar">DoIt<span>B</span>ad<i>✦</i></a><p className="eyebrow">Beta web</p><h1 id="entry-title">Um espaço para continuar.</h1><form onSubmit={submit}><label htmlFor="email">E-mail</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />{mode !== 'reset' && <><label htmlFor="password">Senha</label><input id="password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></>}<button className="button" disabled={busy}>{busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}</button></form><p className="status" role="status">{status}</p><div className="entry-links"><button className="text-button" type="button" onClick={() => setMode(mode === 'reset' ? 'signin' : 'reset')}>{mode === 'reset' ? 'Voltar para entrar' : 'Esqueci minha senha'}</button>{mode !== 'reset' && <button className="text-button" type="button" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>{mode === 'signup' ? 'Já tenho conta' : 'Criar uma conta'}</button>}</div></section></main>;
}
