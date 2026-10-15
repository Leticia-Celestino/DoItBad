import Svg, { Circle, Path } from 'react-native-svg';
export default function Garden() {
  return (
    <Svg width="100%" height={190} viewBox="0 0 440 260" fill="none" accessible={false}>
      <Circle cx="326" cy="66" r="34" fill="#E4C579" />
      <Path d="M12 240Q90 112 229 183Q331 83 430 240" fill="#D9DFC9" />
      <Path d="M28 240Q169 153 410 240" fill="#A7B18F" />
      <Path d="M202 240Q157 210 228 193" stroke="#FBF6EC" strokeWidth={12} strokeLinecap="round" />
      <Path
        d="M95 222V121M95 171Q51 170 62 140Q93 140 95 171ZM95 193Q134 183 128 157Q94 163 95 193Z"
        stroke="#5C6B4A"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Circle cx="257" cy="135" r="12" fill="#C87E5A" />
      <Path d="M242 158Q257 149 271 160L280 194H235Z" fill="#5C6B4A" />
      <Path
        d="M245 194L233 217M268 194L287 210"
        stroke="#3D392F"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
