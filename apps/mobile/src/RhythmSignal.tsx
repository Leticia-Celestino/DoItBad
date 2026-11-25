import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import type { Focus } from '@doitbad/core';
import chime from '../../../packages/assets/rhythm-chime.wav';
import { Button } from './ui';
export default function RhythmSignal({ focus }: { focus: Focus }) {
  const player = useAudioPlayer(chime);
  const [enabled, setEnabled] = useState(false);
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
      player.volume = 0.3;
      void player
        .seekTo(0)
        .then(() => player.play())
        .catch(() => undefined);
    }
  }, [signal, enabled, player]);
  return (
    <Button
      variant="text"
      onPress={() => {
        setEnabled(!enabled);
        if (!enabled) {
          player.volume = 0.3;
          void player
            .seekTo(0)
            .then(() => player.play())
            .catch(() => undefined);
        } else player.pause();
      }}
    >
      {enabled ? 'Desativar avisos sonoros nesta tela' : 'Ativar avisos sonoros nesta tela'}
    </Button>
  );
}
