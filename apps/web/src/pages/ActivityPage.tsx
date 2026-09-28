import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { listIntentions, saveIntention } from '../lib/intentions';
import type { Intention } from '../lib/intentions';

type LoadState = 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function ActivityPage() {
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [title, setTitle] = useState('');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  async function load() {
    setLoadState('loading');
    try {
      setIntentions(await listIntentions());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || saveState === 'saving') return;
    setSaveState('saving');
    try {
      const intention = await saveIntention(title);
      setIntentions((current) => [intention, ...current]);
      setTitle('');
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  return (
    <section aria-labelledby="activity-title">
      <p className="eyebrow">Seu ponto de partida</p>
      <h1 id="activity-title">O que você quer tornar um pouco mais possível?</h1>
      <p className="lede">Guarde uma intenção. O próximo passo será construído com você.</p>

      <form className="intention-form" onSubmit={submit}>
        <label htmlFor="intention">Minha intenção agora</label>
        <textarea
          id="intention"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (saveState !== 'idle') setSaveState('idle');
          }}
          maxLength={240}
          placeholder="Ex.: retomar a apresentação do projeto"
          required
        />
        <div className="form-actions">
          <span>{title.length}/240</span>
          <button className="button" disabled={!title.trim() || saveState === 'saving'}>
            {saveState === 'saving' ? 'Guardando…' : 'Guardar intenção'}
          </button>
        </div>
        <p className="status" role="status" aria-live="polite">
          {saveState === 'saved' && 'Intenção guardada neste navegador.'}
          {saveState === 'error' && 'Não foi possível guardar. Tente outra vez.'}
        </p>
      </form>

      <div className="saved-section">
        <h2>Intenções guardadas</h2>
        {loadState === 'loading' && <p className="empty-state">Carregando…</p>}
        {loadState === 'error' && (
          <div className="empty-state" role="alert">
            <p>Não foi possível ler os dados locais.</p>
            <button className="text-button" onClick={() => void load()}>
              Tentar novamente
            </button>
          </div>
        )}
        {loadState === 'ready' && intentions.length === 0 && (
          <p className="empty-state">Nada guardado ainda. Você pode começar com uma frase curta.</p>
        )}
        {loadState === 'ready' && intentions.length > 0 && (
          <ul className="intention-list">
            {intentions.map((intention) => (
              <li key={intention.id}>{intention.title}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
