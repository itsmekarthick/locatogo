import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CheckIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const XIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const InfoIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);

export const CheckCircleIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </Svg>
);

export const AlertTriangleIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
);

export const AlertCircleIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </Svg>
);

export const InboxIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 13l2.5-7.5h13L21 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V13z" />
    <path d="M3 13h5.5a3.5 3.5 0 0 0 7 0H21" />
  </Svg>
);

export const SearchIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);

export const SunIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
  </Svg>
);

export const MoonIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Svg>
);

export const MenuIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 17L17 7M8 7h9v9" />
  </Svg>
);

export const MapPinIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);

export const BriefcaseIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" />
  </Svg>
);

export const BuildingIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 10h3a1 1 0 0 1 1 1v10M3 21h18" />
    <path d="M9 8h2M9 12h2M9 16h2" />
  </Svg>
);

export const SlidersIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
);

export const GlobeIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </Svg>
);

export const LinkIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
  </Svg>
);

export const SparklesIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 4l1.8 4.7L18.5 10l-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.3L12 4zM18.5 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
  </Svg>
);

export const ClockIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const HeartIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 20s-7-4.4-7-10a4.2 4.2 0 0 1 7-3.1A4.2 4.2 0 0 1 19 10c0 5.600-7 10-7 10z" />
  </Svg>
);

export const UsersIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19c0-3.100 2.700-5 6-5s6 1.900 6 5M16 5.200a3.200 3.200 0 0 1 0 5.600M18 14.400c1.900.7 3 2.300 3 4.600" />
  </Svg>
);

export const MapIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 4L3.500 6v14L9 18l6 2 5.500-2V4L15 6 9 4zM9 4v14M15 6v14" />
  </Svg>
);

export const ListIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 7h11M9 12h11M9 17h11M4.500 7h.01M4.500 12h.01M4.500 17h.01" />
  </Svg>
);

export const GridIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4" y="4" width="6.500" height="6.500" rx="1.500" />
    <rect x="13.500" y="4" width="6.500" height="6.500" rx="1.500" />
    <rect x="4" y="13.500" width="6.500" height="6.500" rx="1.500" />
    <rect x="13.500" y="13.500" width="6.500" height="6.500" rx="1.500" />
  </Svg>
);

export const LocateIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3.500" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <circle cx="12" cy="12" r="7.500" />
  </Svg>
);

export const PlusIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const MinusIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12h14" />
  </Svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const ChevronUpIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 15l6-6 6 6" />
  </Svg>
);

export const StarIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 4l2.400 5 5.400.7-3.900 3.800.9 5.400L12 16.400 7.200 18.900l.9-5.400L4.200 9.700 9.600 9 12 4z" />
  </Svg>
);

export const LayersIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 4l8.500 4.500L12 13 3.500 8.500 12 4zM3.500 12.500L12 17l8.500-4.500M3.500 16.500L12 21l8.500-4.500" />
  </Svg>
);

export const CloudRainIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 15a4 4 0 0 1-.6-7.900A5.500 5.500 0 0 1 17 8.500a3.500 3.500 0 0 1 .5 6.500M8 18v2M12 17v3M16 18v2" />
  </Svg>
);

export const ExpandIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Svg>
);

export const RefreshIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 11a8 8 0 0 0-14.500-4M4 5v3.500h3.500M4 13a8 8 0 0 0 14.500 4M20 19v-3.500h-3.500" />
  </Svg>
);

export const PanelLeftIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.500" y="4.500" width="17" height="15" rx="2.500" />
    <path d="M9.500 4.500v15" />
  </Svg>
);
