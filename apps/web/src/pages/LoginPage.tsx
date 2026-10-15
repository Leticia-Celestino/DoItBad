import { FormEvent, useState } from 'react';
import { requestPasswordReset, signIn, signUp, updatePassword } from '../lib/auth';
import { Link, useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const [params] = useSearchParams();
  const requestedMode = params.get('mode');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(() =>
    requestedMode === 'signup' || requestedMode === 'reset' ? requestedMode : 'signin',
  );
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      if (mode === 'reset') {
        await requestPasswordReset(email);
        setStatus('Enviamos um link para redefinir sua senha.');
      } else if (mode === 'signup') {
        await signUp(email, password, name);
        setStatus('Conta criada. Confira seu e-mail para confirmar o acesso.');
      } else await signIn(email, password);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="entry-page">
      <section className="entry-card" aria-labelledby="entry-title">
        <Link className="entry-back" to="/boas-vindas" aria-label="Voltar">
          ←
        </Link>
        <a className="brand" href="/entrar">
          DoIt<span>B</span>ad<i>✦</i>
        </a>
        <h1 id="entry-title">
          {mode === 'signup'
            ? 'Comece do jeitinho leve'
            : mode === 'reset'
              ? 'Vamos recuperar seu acesso'
              : 'Bem-vindo de volta'}
        </h1>
        <p>
          {mode === 'signup'
            ? 'Crie sua conta em segundos.'
            : mode === 'reset'
              ? 'Um link para escolher sua nova senha.'
              : 'Continue de onde você parou.'}
        </p>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                autoComplete="name"
                maxLength={80}
                required
                value={name}
                placeholder="Como te chamamos?"
                onChange={(event) => setName(event.target.value)}
              />
            </>
          )}
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {mode !== 'reset' && (
            <>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? 'Aguarde…'
              : mode === 'signin'
                ? 'Entrar'
                : mode === 'signup'
                  ? 'Criar conta'
                  : 'Enviar link'}
          </button>
        </form>
        <p className="status" role="status">
          {status}
        </p>
        <div className="entry-links">
          <button
            className="text-button"
            type="button"
            onClick={() => setMode(mode === 'reset' ? 'signin' : 'reset')}
          >
            {mode === 'reset' ? 'Voltar para entrar' : 'Esqueci minha senha'}
          </button>
          {mode !== 'reset' && (
            <button
              className="text-button"
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            >
              {mode === 'signup' ? 'Já tenho conta' : 'Criar uma conta'}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export function PasswordPage() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <main className="entry-page">
      <section className="entry-card">
        <h1>Uma nova senha para continuar.</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await updatePassword(password);
              setSaved(true);
              setStatus('Senha atualizada.');
            } catch {
              setStatus('Não foi possível atualizar. Solicite um novo link se este expirou.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="new-password">Nova senha</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="button" disabled={busy || saved}>
            Salvar nova senha
          </button>
        </form>
        <p role="status">{status}</p>
        <Link to={saved ? '/atividade' : '/entrar'}>
          {saved ? 'Abrir meu espaço' : 'Voltar ao acesso'}
        </Link>
      </section>
    </main>
  );
}
