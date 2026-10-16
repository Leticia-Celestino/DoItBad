// Hand-drawn-feeling SVG illustrations in the warm DoitBad palette.
import Svg, { Circle, Path, G, Rect, Ellipse } from 'react-native-svg';
import { colors } from '@doitbad/core';
type IlloProps = { height?: number };

export function PersonOnHill({ height = 220 }: IlloProps) {
  return (
    <Svg
      viewBox="0 0 320 260"
      width="100%"
      height={height}
      fill="none"
      accessibilityLabel="Pessoa sentada numa colina sob a lua"
    >
      {/* moon */}
      <Circle cx="238" cy="58" r="26" fill="#e4c579" />
      <Circle cx="248" cy="52" r="22" fill="#f4ede1" />
      {/* stars */}
      <G fill="#c8a05a">
        <Path d="M70 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
        <Path d="M120 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <Path d="M290 110l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </G>
      {/* hill */}
      <Path d="M0 260c40-70 100-96 160-96s120 26 160 96H0z" fill="#a9a06f" />
      <Path d="M0 260c50-50 108-64 160-64s110 14 160 64H0z" fill="#8f8a52" />
      {/* plants */}
      <G stroke="#6f7a44" strokeWidth="3" strokeLinecap="round">
        <Path d="M40 232c0-14-4-24-10-30M40 232c2-10 8-16 15-18M300 236c0-12 4-20 9-25M300 236c-2-9-7-14-13-16" />
      </G>
      {/* person */}
      <G>
        <Path d="M150 150c-10 8-14 26-14 40h44c2-16-2-34-12-42-6-4-12-3-18 2z" fill={colors.sage} />
        <Path d="M150 190c-14 2-22 8-28 18h30zM178 190c12 2 20 8 24 16h-26z" fill={colors.sage} />
        <Circle cx="163" cy="132" r="15" fill="#c88a63" />
        <Path d="M150 128c0-12 8-18 15-18s14 6 14 16c-6-4-10-4-16-2-5 2-9 3-13 4z" fill="#4a3f34" />
      </G>
    </Svg>
  );
}

export function CozyRoom({ height = 220 }: IlloProps) {
  return (
    <Svg
      viewBox="0 0 320 220"
      width="100%"
      height={height}
      fill="none"
      accessibilityLabel="Ambiente aconchegante com plantas"
    >
      <Rect
        x="24"
        y="20"
        width="90"
        height="110"
        rx="10"
        fill={colors.canvasSoft}
        stroke="#d9ccb2"
        strokeWidth="3"
      />
      <Path d="M40 120c0-24 8-44 18-44s18 20 18 44" fill="#c9d3b0" />
      <Path d="M58 120V70" stroke="#7c8a58" strokeWidth="3" />
      <Rect x="180" y="120" width="26" height="40" rx="4" fill="#b98a63" />
      <Path
        d="M193 120c-18-2-26-16-24-34 14 2 24 12 24 34zM193 118c14-4 22-16 20-32-12 2-20 12-20 32z"
        fill="#7c8a58"
      />
      <Path d="M0 190h320v30H0z" fill="#d9ccb2" />
      <Ellipse cx="150" cy="190" rx="60" ry="12" fill="#c7b593" />
      {/* cat */}
      <Path d="M96 178c-8 0-12 6-12 14h24c0-8-4-14-12-14z" fill="#3d392f" />
      <Path d="M90 168l4 8 4-8z" fill="#3d392f" />
    </Svg>
  );
}

export function SunOverHills({ height = 220 }: IlloProps) {
  return (
    <Svg
      viewBox="0 0 320 200"
      width="100%"
      height={height}
      fill="none"
      accessibilityLabel="Sol nascendo sobre colinas com um caminho"
    >
      <Circle cx="200" cy="70" r="34" fill="#ebb89a" />
      <Path d="M0 200c60-70 120-88 170-88s90 18 150 40v48H0z" fill="#b7b17c" />
      <Path d="M0 200c70-46 140-56 200-40 50 14 80 38 120 56H0z" fill="#8f8a52" />
      <Path
        d="M150 200c10-40 40-58 70-64"
        stroke="#f4ede1"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="1 14"
      />
    </Svg>
  );
}

export function NightScene({ height = 220 }: IlloProps) {
  return (
    <Svg
      viewBox="0 0 320 220"
      width="100%"
      height={height}
      fill="none"
      accessibilityLabel="Cena noturna com lua sobre colinas"
    >
      <Circle cx="160" cy="86" r="40" fill="#e4c579" opacity="0.9" />
      <G fill="#f0e4c4">
        <Circle cx="70" cy="50" r="2" />
        <Circle cx="250" cy="44" r="2.5" />
        <Circle cx="120" cy="30" r="1.6" />
        <Circle cx="290" cy="90" r="2" />
        <Circle cx="40" cy="96" r="1.8" />
      </G>
      <Path d="M0 220c60-60 110-72 160-72s100 12 160 72H0z" fill="#293229" />
      <Path d="M0 220c70-40 120-48 160-48s110 10 160 48H0z" fill="#171c19" />
    </Svg>
  );
}

export function Sprout({ height = 220 }: IlloProps) {
  return (
    <Svg viewBox="0 0 80 80" width="100%" height={height} fill="none" accessible={false}>
      <Path d="M40 70V38" stroke="#7c8a58" strokeWidth="3" strokeLinecap="round" />
      <Path d="M40 44c-14 0-22-10-20-26 14 0 22 10 20 26z" fill="#8f9a63" />
      <Path d="M40 40c12-2 18-12 16-26-12 2-18 12-16 26z" fill="#a7b17c" />
      <Path d="M26 70h28" stroke="#c88a63" strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}
