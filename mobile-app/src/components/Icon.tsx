import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "@/lib/theme";

/** Tracés Lucide (https://lucide.dev, licence ISC), mêmes icônes que le Notch du PC. */
const ICONS = {
  plus: [<Path key="a" d="M5 12h14" />, <Path key="b" d="M12 5v14" />],
  arrowUp: [<Path key="a" d="m5 12 7-7 7 7" />, <Path key="b" d="M12 19V5" />],
  check: [<Path key="a" d="M20 6 9 17l-5-5" />],
  x: [<Path key="a" d="M18 6 6 18" />, <Path key="b" d="m6 6 12 12" />],
  download: [<Path key="a" d="M12 4v12" />, <Path key="b" d="m6 11 6 6 6-6" />, <Path key="c" d="M5 20h14" />],
  retry: [<Path key="a" d="M3 12a9 9 0 1 0 3-6.7L3 8" />, <Path key="b" d="M3 3v5h5" />],
  image: [
    <Rect key="a" x="3" y="3" width="18" height="18" rx="2" />,
    <Circle key="b" cx="9" cy="9" r="2" />,
    <Path key="c" d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />,
  ],
  file: [
    <Path key="a" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />,
    <Path key="b" d="M14 2v4a2 2 0 0 0 2 2h4" />,
  ],
  play: [<Path key="a" d="M6 3 20 12 6 21Z" />],
  monitor: [
    <Rect key="a" x="2" y="3" width="20" height="14" rx="2" />,
    <Path key="b" d="M8 21h8" />,
    <Path key="c" d="M12 17v4" />,
  ],
  wifi: [
    <Path key="a" d="M12 20h.01" />,
    <Path key="b" d="M2 8.82a15 15 0 0 1 20 0" />,
    <Path key="c" d="M5 12.86a10 10 0 0 1 14 0" />,
    <Path key="d" d="M8.5 16.43a5 5 0 0 1 7 0" />,
  ],
  usb: [
    <Circle key="a" cx="10" cy="7" r="1" />,
    <Circle key="b" cx="4" cy="20" r="1" />,
    <Path key="c" d="M4.7 19.3 19 5" />,
    <Path key="d" d="m21 3-3 1 2 2Z" />,
    <Path key="e" d="M9.26 7.68 5 12l2 5" />,
    <Path key="f" d="m10 14 5 2 3.5-3.5" />,
    <Path key="g" d="m18 12 1-1 1 1-1 1Z" />,
  ],
  scan: [
    <Path key="a" d="M3 7V5a2 2 0 0 1 2-2h2" />,
    <Path key="b" d="M17 3h2a2 2 0 0 1 2 2v2" />,
    <Path key="c" d="M21 17v2a2 2 0 0 1-2 2h-2" />,
    <Path key="d" d="M7 21H5a2 2 0 0 1-2-2v-2" />,
  ],
  more: [
    <Circle key="a" cx="12" cy="12" r="1" />,
    <Circle key="b" cx="19" cy="12" r="1" />,
    <Circle key="c" cx="5" cy="12" r="1" />,
  ],
} as const;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color = colors.paper, strokeWidth = 2 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "play" ? color : "none"}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </Svg>
  );
}
