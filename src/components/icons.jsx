// Tiny editorial SVG icon set — line-based, 1.5 stroke, current color
const Icon = ({ children, size = 16, sw = 1.5, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>;
const IconArrowUpRight = (p) => <Icon {...p}><path d="M7 17 17 7M9 7h8v8"/></Icon>;
const IconMic = (p) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18"/></Icon>;
const IconBrain = (p) => <Icon {...p}><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3 3 3 0 0 0 2 3v1a3 3 0 0 0 3 3"/><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3 3 3 0 0 1-2 3v1a3 3 0 0 1-3 3"/><path d="M12 5v15"/></Icon>;
const IconLock = (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></Icon>;
const IconLightning = (p) => <Icon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></Icon>;
const IconList = (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01"/></Icon>;
const IconBookmark = (p) => <Icon {...p}><path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></Icon>;
const IconFile = (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></Icon>;
const IconQuote = (p) => <Icon {...p}><path d="M3 21c0-6 4-9 8-9M3 14V7a2 2 0 0 1 2-2h3v6H5a2 2 0 0 0-2 2zM13 21c0-6 4-9 8-9M13 14V7a2 2 0 0 1 2-2h3v6h-3a2 2 0 0 0-2 2z"/></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M5 12l5 5L20 7"/></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IconArchive = (p) => <Icon {...p}><path d="M3 7h18v4H3zM5 11v9h14v-9M10 15h4"/></Icon>;
const IconBolt = (p) => <Icon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></Icon>;
const IconRefresh = (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></Icon>;

Object.assign(window, {
  Icon, IconArrowRight, IconArrowUpRight, IconMic, IconSearch, IconSparkle,
  IconBrain, IconLock, IconLightning, IconList, IconBookmark, IconFile,
  IconQuote, IconCheck, IconPlus, IconArchive, IconBolt, IconRefresh,
});
