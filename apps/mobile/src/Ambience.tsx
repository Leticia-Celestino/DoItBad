import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Text, View, Switch } from 'react-native';
import { colors } from '@doitbad/core';
import { s } from './ui';
import sound from '../../../packages/assets/zen.wav';
export default function Ambience() {
  const player = useAudioPlayer(sound);
  const status = useAudioPlayerStatus(player);
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
          player.volume = 0.35;
          if (status.playing) player.pause();
          else player.play();
        }}
      />
    </View>
  );
}
