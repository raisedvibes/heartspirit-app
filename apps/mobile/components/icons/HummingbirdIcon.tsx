import Svg, { Path } from "react-native-svg"

type HummingbirdIconProps = {
  size?: number
  color?: string
}

export default function HummingbirdIcon({
  size = 24,
  color = "#FFFFFF",
}: HummingbirdIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11.5c3.1-.9 5.4-.3 7 1.7 1.3 1.5 2.8 2.3 4.8 2.3 1.4 0 2.8-.4 4.2-1.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.3 15.4c-.6 1.8-1.8 3.3-3.6 4.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.5 11.4c1.7-2.5 3.9-4.1 6.6-4.9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.2 6.5 22 6.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.4 12.7c-.7-2.1-2-3.8-4-5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
