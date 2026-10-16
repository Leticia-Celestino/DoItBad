import { useEffect, useRef, useState } from 'react';
import sound from '../../../../packages/assets/zen.wav?url';
import { getPreferences, preferencesEvent, type Preferences } from '../lib/preferences';
export default function Ambience() {
  const audio = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const [volume, setVolume] = useState(() => getPreferences().soundVolume);
  useEffect(() => {
    const element = audio.current;
    return () => element?.pause();
  }, []);
  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<Preferences>).detail ?? getPreferences();
      setVolume(next.soundVolume);
      if (audio.current) audio.current.volume = next.soundVolume;
    };
    window.addEventListener(preferencesEvent, update);
    return () => window.removeEventListener(preferencesEvent, update);
  }, []);
  return (
    <div className="ambience">
      <audio ref={audio} src={sound} loop preload="none" />
      <button
        type="button"
        className="text-button"
        aria-pressed={enabled}
        onClick={async () => {
          if (!audio.current) return;
          if (enabled) {
            audio.current.pause();
            setEnabled(false);
          } else {
            try {
              audio.current.volume = volume;
              await audio.current.play();
              setEnabled(true);
              setError('');
            } catch {
              setError('Não foi possível iniciar o som. Tente novamente.');
            }
          }
        }}
      >
        {enabled ? 'Desativar sons suaves' : 'Ativar sons suaves'}
      </button>
      {error && <p role="status">{error}</p>}
    </div>
  );
}
