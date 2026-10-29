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

export const ShareIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 15V4M8 7.500l4-4 4 4M5 12v6.500A1.500 1.500 0 0 0 6.500 20h11a1.500 1.500 0 0 0 1.500-1.500V12" />
  </Svg>
);

export const CopyIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="8.500" y="8.500" width="11" height="11" rx="2.500" />
    <path d="M15.500 8.500V6.500a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </Svg>
);

export const NavigationIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.500l7.500 16-7.500-3.800-7.500 3.800 7.500-16z" />
  </Svg>
);

export const PhoneIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6.500 4h2.800l1.400 3.700-1.800 1.300a11 11 0 0 0 5.100 5.100L15.300 12.300 19 13.700v2.800A2.500 2.500 0 0 1 16.500 19 12.500 12.500 0 0 1 4 6.500 2.500 2.500 0 0 1 6.500 4z" />
  </Svg>
);

export const MessageIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 11.500a7.500 7.500 0 0 1-11 6.600L4 19l1.200-4.300A7.500 7.500 0 1 1 20 11.500z" />
  </Svg>
);

export const CarIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 16.500V12l1.800-4.500A1.500 1.500 0 0 1 8.200 6.500h7.600a1.500 1.500 0 0 1 1.400 1L19 12v4.500M3.500 12h17M5 16.500h14M7 16.500V18.500M17 16.500V18.500" />
    <circle cx="8" cy="14" r=".6" />
    <circle cx="16" cy="14" r=".6" />
  </Svg>
);

export const ShieldCheckIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.500l7 2.500v5.500c0 4.200-2.800 7.600-7 9-4.200-1.400-7-4.800-7-9V6l7-2.500z" />
    <path d="M9 12l2.200 2.200L15.200 10" />
  </Svg>
);

export const CalendarIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4" y="5.500" width="16" height="14.500" rx="2.500" />
    <path d="M8 3.500v4M16 3.500v4M4 10h16" />
  </Svg>
);

export const EyeIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" />
    <circle cx="12" cy="12" r="2.800" />
  </Svg>
);

export const CloudIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 18.500a4 4 0 0 1-.5-7.970A5.500 5.500 0 0 1 17 9.500a4.500 4.500 0 0 1 .5 9H7z" />
  </Svg>
);

export const BoltIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M13 3L5.500 13.500H12L11 21l7.500-10.500H12L13 3z" />
  </Svg>
);

export const SnowflakeIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3v18M4.200 7.500l15.600 9M19.800 7.500l-15.600 9" />
  </Svg>
);

export const DropletIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.500c3.500 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2.500-6 6-10z" />
  </Svg>
);

export const WindIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.500 9.500h10a2.500 2.500 0 1 0-2.400-3.200M3.500 14h14a2.500 2.500 0 1 1-2.400 3.200M3.500 11.800h6" />
  </Svg>
);

export const FileTextIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 3.500h6.500L19 9v10.500a1.500 1.500 0 0 1-1.500 1.500h-10A1.500 1.500 0 0 1 6 19.500v-14A2 2 0 0 1 7 3.500z" />
    <path d="M13 3.500V9h5.500M9 13h6M9 16.500h6" />
  </Svg>
);

export const MessageSquareIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 5.500h14a1.500 1.500 0 0 1 1.500 1.500v8.500a1.500 1.500 0 0 1-1.500 1.500H11l-4.500 3v-3H5a1.500 1.500 0 0 1-1.500-1.500V7A1.500 1.500 0 0 1 5 5.500z" />
  </Svg>
);

export const CodeIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8.500 7.500L4 12l4.500 4.500M15.500 7.500L20 12l-4.500 4.500M13.500 5l-3 14" />
  </Svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const UploadIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 16V4M7 9l5-5 5 5M4 16v2.500A1.500 1.500 0 0 0 5.500 20h13a1.500 1.500 0 0 0 1.500-1.500V16" />
  </Svg>
);

export const PencilIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4.500 19.500l1-4L16 5a2.100 2.100 0 0 1 3 3L8.500 18.500l-4 1zM14.500 6.500l3 3" />
  </Svg>
);

export const DownloadIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 4v11M7.500 10.500L12 15l4.500-4.500M5 19.500h14" />
  </Svg>
);

export const TagIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.500 12.200V5.500A2 2 0 0 1 5.500 3.500h6.700a2 2 0 0 1 1.400.600l6.300 6.300a2 2 0 0 1 0 2.800l-6.700 6.700a2 2 0 0 1-2.800 0L4.100 13.600a2 2 0 0 1-.600-1.400z" />
    <circle cx="8.500" cy="8.500" r="1.200" />
  </Svg>
);

export const ChartIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

export const MegaphoneIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 10v4a1 1 0 0 0 1 1h2.500L16 19.500V4.500L7.500 9H5a1 1 0 0 0-1 1zM19.500 9.500a4 4 0 0 1 0 5M8 15l1 4.500h2.500" />
  </Svg>
);

export const CreditCardIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="5.500" width="18" height="13" rx="2.500" />
    <path d="M3 10h18M7 15h3" />
  </Svg>
);

export const MailIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="5.500" width="18" height="13" rx="2.500" />
    <path d="M3.500 7.500l8.500 6 8.500-6" />
  </Svg>
);

export const SettingsIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.500v2.200M12 18.300v2.200M20.500 12h-2.200M5.700 12H3.500M18 6l-1.600 1.600M7.600 16.400L6 18M18 18l-1.600-1.600M7.600 7.600L6 6" />
  </Svg>
);

export const EyeOffIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 4l16 16M9.900 5.800A9.500 9.500 0 0 1 12 5.500c6 0 9.500 6.500 9.500 6.500a15 15 0 0 1-2.600 3.300M6.500 7.600A15 15 0 0 0 2.500 12S6 18.500 12 18.500a9.400 9.400 0 0 0 3.600-.7M10 10a2.800 2.800 0 0 0 4 4" />
  </Svg>
);

export const LockIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="5" y="10.500" width="14" height="9.500" rx="2.500" />
    <path d="M8 10.500V8a4 4 0 0 1 8 0v2.500" />
  </Svg>
);

export const UserIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="8.500" r="3.800" />
    <path d="M4.500 20a7.500 7.500 0 0 1 15 0" />
  </Svg>
);

export const TrashIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1.500 1.500 0 0 0 1.500 1.400h7A1.500 1.500 0 0 0 17 19l1-12M9 7V4.500h6V7" />
  </Svg>
);

export const ArchiveIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.500" y="4.500" width="17" height="4" rx="1.200" />
    <path d="M5 8.500V18a1.500 1.500 0 0 0 1.500 1.500h11A1.500 1.500 0 0 0 19 18V8.500M10 12.500h4" />
  </Svg>
);

export const ArrowUpIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);

export const ArrowDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
);

export const ChevronsUpDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
  </Svg>
);

export const RowsIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 6.500h16M4 12h16M4 17.500h16" />
  </Svg>
);

export const CommandIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 9V6.500A2.500 2.500 0 1 0 6.500 9H9zm0 0h6m-6 0v6m6-6V6.500A2.500 2.500 0 1 1 17.500 9H15zm0 0v6m0 0h2.500a2.500 2.500 0 1 1-2.500 2.500V15zm0 0H9m0 0v2.500A2.500 2.500 0 1 1 6.500 15H9z" />
  </Svg>
);

export const LogOutIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9.500 4.500H6.500A1.500 1.500 0 0 0 5 6v12a1.500 1.500 0 0 0 1.500 1.500h3M15 8l4 4-4 4M19 12H9.500" />
  </Svg>
);

export const TrendingUpIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.500 16.500l6-6 4 4 7-7.500M15 6.500h5.500V12" />
  </Svg>
);

export const TrendingDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.500 7.500l6 6 4-4 7 7.500M15 17.500h5.500V12" />
  </Svg>
);

export const BellIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 2h-15L6 16.500zM10 20.500a2.200 2.200 0 0 0 4 0" />
  </Svg>
);
