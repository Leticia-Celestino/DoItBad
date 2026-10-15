import { useEffect, useRef, useState } from 'react';
import sound from '../../../../packages/assets/zen.wav?url';
export default function Ambience() {
  const audio = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = audio.current;
    return () => element?.pause();
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
              audio.current.volume = 0.35;
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
