import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@doitbad/core';
import { Logo } from './visuals';
import { PersonOnHill } from './illustrations';

export default function Splash() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
          paddingVertical: 40,
        }}
      >
        <Logo size={52} />
        <Text
          style={{
            fontFamily: 'Fraunces_400Regular',
            fontSize: 19,
            lineHeight: 27,
            color: colors.muted,
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          Pequenos passos.{'\n'}Grandes mudanças.
        </Text>
        <View style={{ width: '100%', maxWidth: 280, marginTop: 48 }}>
          <PersonOnHill height={228} />
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Preparando seu espaço"
          style={{
            width: 96,
            height: 4,
            borderRadius: 4,
            backgroundColor: colors.line,
            marginTop: 56,
            overflow: 'hidden',
          }}
        >
          <View style={{ width: 32, height: 4, backgroundColor: colors.terracotta }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
