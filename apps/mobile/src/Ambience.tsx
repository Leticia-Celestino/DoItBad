import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Text, View, Switch } from 'react-native';
import { colors } from '@doitbad/core';
import { s } from './ui';
import sound from '../../../packages/assets/zen.wav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
export default function Ambience() {
  const player = useAudioPlayer(sound);
  const status = useAudioPlayerStatus(player);
  const [volume, setVolume] = useState(0.25);
  useEffect(() => {
    void AsyncStorage.getItem('doitbad:sound-volume').then((value) => {
      const next = Number(value);
      if ([0, 15, 25, 40].includes(next)) setVolume(next / 100);
    });
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={[s.text, { flex: 1, color: colors.ink }]}>Sons suaves</Text>
      <Switch
        accessibilityLabel="Alternar sons suaves"
        value={status.playing}
        trackColor={{ false: colors.line, true: colors.sage }}
        thumbColor={colors.canvas}
        onValueChange={() => {
          player.loop = true;
          player.volume = volume;
          if (status.playing) player.pause();
          else player.play();
        }}
      />
    </View>
  );
}
