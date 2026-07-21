export type ProjectStatus = "approved" | "pending" | "rejected";
export type ProjectCategory =
  | "wallets"
  | "defi"
  | "gaming"
  | "infrastructure"
  | "nfts"
  | "tools"
  | "dapps"
  | "tokens";

export interface Project {
  id: string;
  slug: string;
  name: string;
  logo: string; // emoji fallback
  category: ProjectCategory;
  tagline: string;
  description: string;
  url: string;
  screenshots: string[];
  socials: { twitter?: string; discord?: string; telegram?: string; github?: string };
  verified: boolean;
  status: ProjectStatus;
  featured: boolean;
  dateAdded: string;
  visits: number;
  submitterName?: string;
  submitterEmail?: string;
  liveStatus?: "Live" | "Beta" | "Coming Soon";
}

export interface Category {
  id: ProjectCategory;
  name: string;
  icon: string;
  description: string;
  visible: boolean;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  coverImage: string;
  excerpt: string;
  body: string;
  publishDate: string;
  status: "draft" | "published";
  views: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  joinDate: string;
  submissionsCount: number;
}

export interface Ticker {
  id: string;
  label: string;
  linkedProjectSlug?: string;
  order: number;
}

export const CATEGORIES: Category[] = [
  { id: "wallets", name: "Wallets", icon: "👛", description: "XRPL wallets and key managers", visible: true },
  { id: "defi", name: "DeFi", icon: "💱", description: "DEXs, aggregators, lending", visible: true },
  { id: "gaming", name: "Gaming", icon: "🎮", description: "On-ledger games and play-to-earn", visible: true },
  { id: "infrastructure", name: "Infrastructure", icon: "🛠️", description: "Nodes, explorers, bridges", visible: true },
  { id: "nfts", name: "NFTs", icon: "🖼️", description: "NFT marketplaces and collections", visible: true },
  { id: "tools", name: "Tools", icon: "🧰", description: "Developer and analytics tools", visible: true },
  { id: "dapps", name: "dApps", icon: "📱", description: "Decentralized applications", visible: true },
  { id: "tokens", name: "Tokens", icon: "🪙", description: "Issued tokens on XRPL", visible: true },
];

export const PROJECTS: Project[] = [
  { id: "1", slug: "xaman", name: "Xaman", logo: "👛", category: "wallets", tagline: "The self-custodial XRPL wallet", description: "Xaman (formerly Xumm) is the most trusted self-custodial wallet for the XRP Ledger, with hardware key support and dApp signing.", url: "https://xaman.app", screenshots: [], socials: { twitter: "https://twitter.com/xamanapp" }, verified: true, status: "approved", featured: true, dateAdded: "2024-01-10", visits: 12043, liveStatus: "Live" },
  { id: "2", slug: "sologenic", name: "Sologenic", logo: "💱", category: "defi", tagline: "DEX & tokenized assets on XRPL", description: "Sologenic offers a DEX, tokenization platform, and NFT marketplace built on the XRP Ledger.", url: "https://sologenic.org", screenshots: [], socials: { twitter: "https://twitter.com/realsologenic" }, verified: true, status: "approved", featured: true, dateAdded: "2024-02-01", visits: 9821, liveStatus: "Live" },
  { id: "3", slug: "xrpscan", name: "XRPScan", logo: "🔎", category: "infrastructure", tagline: "The XRP Ledger explorer", description: "Explore accounts, ledgers, transactions and validators on the XRPL mainnet.", url: "https://xrpscan.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2023-11-15", visits: 22188, liveStatus: "Live" },
  { id: "4", slug: "bithomp", name: "Bithomp", logo: "🌐", category: "infrastructure", tagline: "XRPL explorer & services", description: "Bithomp provides ledger exploration, NFT tools and services for the XRPL ecosystem.", url: "https://bithomp.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-12-01", visits: 8321, liveStatus: "Live" },
  { id: "5", slug: "xrp-chess", name: "XRP Chess", logo: "♞", category: "gaming", tagline: "On-ledger chess with XRP wagers", description: "Play chess with XRP wagers settled directly on the XRP Ledger — instant payouts, low fees.", url: "https://xrpchess.com", screenshots: [], socials: { twitter: "https://twitter.com/xrpchess" }, verified: true, status: "approved", featured: true, dateAdded: "2024-05-20", visits: 3421, liveStatus: "Live" },
  { id: "6", slug: "gatehub", name: "GateHub", logo: "🏦", category: "wallets", tagline: "Web wallet & gateway", description: "GateHub is a web wallet and gateway for XRP and IOUs.", url: "https://gatehub.net", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-10-10", visits: 5522, liveStatus: "Live" },
  { id: "7", slug: "crossmark", name: "Crossmark", logo: "✳️", category: "wallets", tagline: "Browser extension wallet for XRPL", description: "A modern browser extension wallet for signing XRPL transactions.", url: "https://crossmark.io", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-03-15", visits: 4110, liveStatus: "Live" },
  { id: "8", slug: "onthedex", name: "OnTheDEX", logo: "📈", category: "defi", tagline: "XRPL DEX market data", description: "Market data, charts and analytics for the XRPL native DEX.", url: "https://onthedex.live", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-01-22", visits: 2891, liveStatus: "Live" },
  { id: "9", slug: "xrpl-labs", name: "XRPL Labs", logo: "🔬", category: "tools", tagline: "Tools & products for XRPL", description: "Makers of Xaman and other XRPL developer tools.", url: "https://xrpl-labs.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-09-01", visits: 3299, liveStatus: "Live" },
  { id: "10", slug: "onxrp", name: "onXRP", logo: "🎨", category: "nfts", tagline: "NFT marketplace on XRPL", description: "Mint, buy and sell NFTs on the XRP Ledger.", url: "https://onxrp.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2024-02-18", visits: 6110, liveStatus: "Live" },
  { id: "11", slug: "xrpcafe", name: "xrp.cafe", logo: "☕", category: "nfts", tagline: "Community NFT marketplace", description: "A community-driven NFT marketplace built for XRPL creators.", url: "https://xrp.cafe", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-04-01", visits: 4821, liveStatus: "Live" },
  { id: "12", slug: "csc", name: "CasinoCoin", logo: "🎰", category: "tokens", tagline: "Gaming-focused XRPL token", description: "A regulated gaming token on the XRP Ledger.", url: "https://casinocoin.org", screenshots: [], socials: {}, verified: false, status: "approved", featured: false, dateAdded: "2023-08-14", visits: 1211, liveStatus: "Live" },
  { id: "13", slug: "flr-bridge", name: "Flare Bridge", logo: "🌉", category: "infrastructure", tagline: "Bridge XRPL to Flare Network", description: "A bridge connecting XRPL assets to the Flare Network for smart contract use.", url: "https://flare.network", screenshots: [], socials: {}, verified: false, status: "approved", featured: false, dateAdded: "2024-03-05", visits: 1822, liveStatus: "Beta" },
  { id: "14", slug: "xrptoolkit", name: "XRP Toolkit", logo: "🧰", category: "tools", tagline: "Manage XRPL accounts", description: "Web tool to manage XRPL accounts, sign transactions and trade on the DEX.", url: "https://www.xrptoolkit.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-07-19", visits: 3901, liveStatus: "Live" },
  { id: "15", slug: "orchestra-finance", name: "Orchestra Finance", logo: "🎼", category: "defi", tagline: "Bond issuance on XRPL", description: "Tokenized bonds and fixed income on the XRP Ledger.", url: "https://orchestra.finance", screenshots: [], socials: {}, verified: false, status: "approved", featured: false, dateAdded: "2024-05-01", visits: 942, liveStatus: "Beta" },
  { id: "16", slug: "xrpl-services", name: "XRPL Services", logo: "🛰️", category: "tools", tagline: "NFT & trustline tools", description: "Utility site for XRPL NFT minting, trustlines and account setup.", url: "https://xrpl.services", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-06-01", visits: 2711, liveStatus: "Live" },
  { id: "17", slug: "moonbet", name: "MoonBet XRPL", logo: "🎲", category: "gaming", tagline: "Provably fair XRPL casino", description: "Provably fair casino games settled with XRP.", url: "https://moonbet.example", screenshots: [], socials: {}, verified: false, status: "pending", featured: false, dateAdded: "2024-06-01", visits: 0, submitterName: "Alex M.", submitterEmail: "alex@example.com", liveStatus: "Beta" },
  { id: "18", slug: "ledger-live-xrp", name: "Ledger Live XRP", logo: "🔐", category: "wallets", tagline: "Hardware wallet support for XRP", description: "Manage XRP using Ledger hardware wallets.", url: "https://ledger.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-05-01", visits: 6612, liveStatus: "Live" },
  { id: "19", slug: "sonar-muse", name: "Sonar Muse", logo: "🎧", category: "dapps", tagline: "Web3 music streaming on XRPL", description: "Decentralized music streaming powered by the XRP Ledger.", url: "https://sonarmuse.org", screenshots: [], socials: {}, verified: false, status: "approved", featured: false, dateAdded: "2024-04-22", visits: 812, liveStatus: "Live" },
  { id: "20", slug: "equilibrium-games", name: "Equilibrium Games", logo: "🕹️", category: "gaming", tagline: "Studio building XRPL games", description: "Game studio building on the XRP Ledger.", url: "https://equilibrium-games.example", screenshots: [], socials: {}, verified: false, status: "pending", featured: false, dateAdded: "2024-06-10", visits: 0, submitterName: "Jamie R.", submitterEmail: "jamie@example.com", liveStatus: "Coming Soon" },
];

export const NEWS: NewsArticle[] = [
  { id: "n1", slug: "xrpl-amm-launch", title: "XRPL AMM amendment activates on Mainnet", category: "Announcements", author: "XRPL Foundation", coverImage: "📰", excerpt: "The long-anticipated Automated Market Maker amendment has activated across the XRPL Mainnet.", body: "The XRPL AMM amendment officially activated today, bringing native on-ledger automated market making to the XRP Ledger. Developers can now build DeFi apps leveraging deep on-chain liquidity...", publishDate: "2024-05-30", status: "published", views: 5210 },
  { id: "n2", slug: "ripple-partnership-bank", title: "Ripple announces new banking partnership in APAC", category: "Partnerships", author: "Editorial", coverImage: "🤝", excerpt: "Ripple expands its ODL corridors with a new banking partner in Southeast Asia.", body: "Ripple continues to expand its On-Demand Liquidity network...", publishDate: "2024-05-24", status: "published", views: 3410 },
  { id: "n3", slug: "xahau-sidechain", title: "Xahau sidechain gains new hooks", category: "Updates", author: "Dev Team", coverImage: "🪝", excerpt: "The Xahau sidechain adds new hook functionality for developers.", body: "Xahau devs deployed new hooks this week...", publishDate: "2024-05-18", status: "published", views: 1988 },
  { id: "n4", slug: "xrp-market-analysis-q2", title: "XRP market analysis: Q2 recap", category: "Market", author: "Analyst Desk", coverImage: "📊", excerpt: "A look at XRP's Q2 performance and on-ledger metrics.", body: "Q2 saw XRP trade in a defined range while on-ledger activity climbed...", publishDate: "2024-05-12", status: "published", views: 4102 },
  { id: "n5", slug: "xrpchess-launch", title: "XRP Chess launches wagered play", category: "Announcements", author: "XRP Chess Team", coverImage: "♞", excerpt: "Play chess with XRP wagers settled instantly on the ledger.", body: "XRP Chess opens its wagered play mode to the public...", publishDate: "2024-05-05", status: "published", views: 2801 },
  { id: "n6", slug: "nft-standard-update", title: "XLS-20 NFT standard sees rapid growth", category: "Updates", author: "Editorial", coverImage: "🖼️", excerpt: "NFT mint volume on XRPL climbs to new highs.", body: "Ledger activity for NFTs continues to accelerate...", publishDate: "2024-04-28", status: "published", views: 1502 },
];

export const USERS: User[] = [
  { id: "u1", name: "Alex Morgan", email: "alex@example.com", avatar: "🧑", role: "user", status: "active", joinDate: "2024-01-15", submissionsCount: 2 },
  { id: "u2", name: "Jamie Rivera", email: "jamie@example.com", avatar: "👩", role: "user", status: "active", joinDate: "2024-02-20", submissionsCount: 1 },
  { id: "u3", name: "Sam Chen", email: "sam@example.com", avatar: "🧑‍💻", role: "admin", status: "active", joinDate: "2023-11-01", submissionsCount: 0 },
  { id: "u4", name: "Riley K.", email: "riley@example.com", avatar: "🧑‍🎤", role: "user", status: "suspended", joinDate: "2024-03-05", submissionsCount: 3 },
];

export const TICKERS: Ticker[] = [
  { id: "t1", label: "XRP $0.52 (+3.12%)", order: 1 },
  { id: "t2", label: "LEDGER #89234501 CLOSED", order: 2 },
  { id: "t3", label: "NEW: XRPCHESS.COM ADDED", linkedProjectSlug: "xrp-chess", order: 3 },
  { id: "t4", label: "XAMAN v2.6 RELEASED", linkedProjectSlug: "xaman", order: 4 },
  { id: "t5", label: "SOLOGENIC DEX 24H VOL +12%", linkedProjectSlug: "sologenic", order: 5 },
];

export const WALLETS = ["Xaman (Xumm)", "GateHub", "Trust Wallet", "Ledger", "Crossmark"];
