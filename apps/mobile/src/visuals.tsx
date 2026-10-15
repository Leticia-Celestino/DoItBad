import { Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors } from '@doitbad/core';

const paths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  check: 'm5 12 4 4L19 6',
  tasks: 'M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1',
  calendar:
    'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4m10-4v4M3 11h18',
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  plus: 'M12 5v14M5 12h14',
  back: 'm14 5-7 7 7 7M7 12h14',
  next: 'm9 5 7 7-7 7',
  moon: 'M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z',
  sun: 'M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  flag: 'M5 21V3m0 0h14l-3 4 3 4H5',
  leaf: 'M5 20C1 7 12 3 21 3c0 11-4 17-13 14M4 21 15 10',
  chart: 'M4 3v18h17M8 16l4-6 4 3 5-8',
  heart: 'M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 3 11 8 15 5-4 13-10 8-15Z',
  pause: 'M8 5v14M16 5v14',
  play: 'm8 4 12 8-12 8Z',
  document: 'M14 2H5v20h14V7ZM14 2v6h5M8 12h8M8 16h6',
  book: 'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v15',
  pencil: 'm4 16 12-12 4 4L8 20l-5 1ZM14 6l4 4',
  flash: 'm13 2-9 12h7l-1 8 10-13h-8Z',
};
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 22,
  color = colors.sage,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      <Path
        d={paths[name]}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function Logo({ size = 30 }: { size?: number }) {
  const style = {
    fontFamily: 'Fraunces_400Regular',
    fontSize: size,
    lineHeight: Math.ceil(size * 1.2),
    color: colors.sage,
    flexShrink: 0,
  };
  return (
    <View
      accessible
      accessibilityLabel="DoItBad"
      style={{ flexDirection: 'row', alignItems: 'center', overflow: 'visible' }}
    >
      <Text style={style}>DoIt</Text>
      <Text style={[style, { color: colors.terracotta, transform: [{ scaleX: -1 }] }]}>B</Text>
      <Text style={[style, { color: colors.terracotta }]}>a</Text>
      <Text
        style={[
          style,
          {
            color: colors.terracotta,
            paddingRight: Math.max(3, Math.ceil(size * 0.1)),
          },
        ]}
      >
        d
      </Text>
    </View>
  );
}
export function Ring({
  progress,
  label,
  caption,
  small = false,
  diameter,
}: {
  progress: number;
  label: string;
  caption: string;
  small?: boolean;
  diameter?: number;
}) {
  const { width, fontScale } = useWindowDimensions();
  const size = Math.min(diameter ?? (small ? 160 : 236), width - 80);
  const circumference = 2 * Math.PI * 105;
  return (
    <View
      style={{
        alignSelf: 'center',
        width: size,
        minHeight: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        style={{ position: 'absolute' }}
        accessible={false}
      >
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#e4c579" />
            <Stop offset="0.55" stopColor="#ebb89a" />
            <Stop offset="1" stopColor="#c87e5a" />
          </LinearGradient>
        </Defs>
        <Circle cx={120} cy={120} r={105} fill="none" stroke="#e7decd" strokeWidth={12} />
        <Circle
          cx={120}
          cy={120}
          r={105}
          fill="none"
          stroke="url(#ring)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
          rotation={-90}
          origin="120,120"
        />
      </Svg>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={{
          maxWidth: '78%',
          fontFamily: 'Fraunces_400Regular',
          fontSize: diameter ? 22 : small ? 32 : Math.min(58, 58 / fontScale),
          color: colors.ink,
          fontVariant: ['tabular-nums'],
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
      {!!caption && (
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 12,
            color: colors.muted,
            textAlign: 'center',
            maxWidth: '70%',
            marginTop: 6,
          }}
        >
          {caption}
        </Text>
      )}
    </View>
  );
}
export function MoodChart({ values }: { values: { label: string; value: number | null }[] }) {
  const points = values.map((v, i) => ({
    x: 22 + i * 46,
    y: v.value === null ? null : 140 - v.value * 23,
  }));
  const path = points
    .map((p, i) =>
      p.y === null ? '' : `${i === 0 || points[i - 1].y === null ? 'M' : 'L'}${p.x} ${p.y}`,
    )
    .join(' ');
  return (
    <Svg
      width="100%"
      height={180}
      viewBox="0 0 320 180"
      accessibilityLabel="Humor registrado nos últimos sete dias"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Path key={n} d={`M16 ${140 - n * 23}H304`} stroke={colors.line} strokeDasharray="3 5" />
      ))}
      <Path d={path} fill="none" stroke="#c87e5a" strokeWidth={2.5} />
      {points.map((p, i) => (
        <ViewlessPoint key={i} x={p.x} y={p.y} label={values[i].label} />
      ))}
    </Svg>
  );
}
function ViewlessPoint({ x, y, label }: { x: number; y: number | null; label: string }) {
  return (
    <>
      {y !== null && (
        <Circle cx={x} cy={y} r={4} fill={colors.surface} stroke="#c87e5a" strokeWidth={2} />
      )}
      <SvgText x={x} y={165} textAnchor="middle" fontSize={11} fill={colors.muted}>
        {label}
      </SvgText>
    </>
  );
}
export function PathMap({ done, total }: { done: number; total: number }) {
  const nodes = [
    { x: 18, y: 78 },
    { x: 40, y: 55 },
    { x: 60, y: 68 },
    { x: 82, y: 34 },
  ];
  return (
    <Svg
      width="100%"
      height={208}
      viewBox="0 0 100 100"
      accessibilityLabel={`${done} de ${total} passos concluídos`}
    >
      <Path
        d="M18 78 Q30 62 40 55 T60 68 Q72 60 82 34"
        fill="none"
        stroke="#c8b78f"
        strokeWidth={1.4}
        strokeDasharray="3 3"
      />
      {nodes.map(({ x, y }, i) => {
        return (
          <Circle
            key={i}
            cx={x}
            cy={y}
            r={5.5}
            fill={total > 0 && i < Math.round((done / total) * 4) ? colors.sage : colors.surface}
            stroke={colors.sage}
            strokeWidth={1.2}
          />
        );
      })}
      <Path
        d="M80 34V26m0 0h6l-1.4 2.4L86 31h-6"
        fill={colors.terracotta}
        stroke={colors.terracotta}
        strokeWidth={0.6}
      />
    </Svg>
  );
}
