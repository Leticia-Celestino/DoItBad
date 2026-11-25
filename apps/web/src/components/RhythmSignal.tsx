import { useEffect, useRef, useState } from 'react';
import type { Focus } from '@doitbad/core';
import chime from '../../../../packages/assets/rhythm-chime.wav?url';
export default function RhythmSignal({ focus }: { focus: Focus }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const r = focus.rhythm!;
  const signal = r.paused
    ? 'paused'
    : r.phase === 'checkin' || r.phase === 'ready'
      ? r.phase
      : r.eyeRemaining > 0
        ? 'eye'
        : r.config.eyeCare && r.eyeDueIn === 0
          ? 'eye-due'
          : 'focus';
  const previous = useRef(signal);
  useEffect(() => {
    const before = previous.current;
    previous.current = signal;
    if (!enabled || before === signal) return;
    if (
      signal === 'checkin' ||
      signal === 'ready' ||
      signal === 'eye-due' ||
      (before === 'eye' && signal === 'focus')
    ) {
      if (audio.current) {
        audio.current.currentTime = 0;
        void audio.current
          .play()
          .catch(() =>
            setError(
              'O navegador não reproduziu o aviso. Confira o volume e tente ativar novamente.',
            ),
          );
      }
    }
  }, [signal, enabled]);
  return (
    <div>
      <audio ref={audio} src={chime} preload="auto" />
      <button
        className="text-button"
        type="button"
        aria-pressed={enabled}
        onClick={async () => {
          if (enabled) {
            setEnabled(false);
            audio.current?.pause();
            return;
          }
          try {
            if (audio.current) {
              audio.current.volume = 0.3;
              await audio.current.play();
              setEnabled(true);
              setError('');
            }
          } catch {
            setError('Não foi possível ativar o som. Tente novamente.');
          }
        }}
      >
        {enabled ? 'Desativar avisos sonoros nesta tela' : 'Ativar avisos sonoros nesta tela'}
      </button>
      {error && <p role="status">{error}</p>}
    </div>
  );
}
