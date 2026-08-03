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
  { id: "wallets", name: "Wallets", icon: "👛", description: "Stellar wallets and key managers", visible: true },
  { id: "defi", name: "DeFi", icon: "💱", description: "DEXs, aggregators, lending", visible: true },
  { id: "gaming", name: "Gaming", icon: "🎮", description: "On-ledger games and play-to-earn", visible: true },
  { id: "infrastructure", name: "Infrastructure", icon: "🛠️", description: "Nodes, explorers, bridges", visible: true },
  { id: "nfts", name: "NFTs", icon: "🖼️", description: "NFT marketplaces and collections", visible: true },
  { id: "tools", name: "Tools", icon: "🧰", description: "Developer and analytics tools", visible: true },
  { id: "dapps", name: "dApps", icon: "📱", description: "Decentralized applications", visible: true },
  { id: "tokens", name: "Tokens", icon: "🪙", description: "Issued tokens on Stellar", visible: true },
];

export const PROJECTS: Project[] = [
  { id: "1", slug: "freighter", name: "Freighter", logo: "🦅", category: "wallets", tagline: "The most secure wallet for Stellar assets", description: "Freighter is a non-custodial browser extension wallet for the Stellar network, with hardware wallet support and Soroban smart contract signing.", url: "https://freighter.app", screenshots: [], socials: { twitter: "https://x.com/freighterwallet" }, verified: true, status: "approved", featured: true, dateAdded: "2024-01-12", visits: 18420, liveStatus: "Live" },
  { id: "2", slug: "lobstr", name: "LOBSTR", logo: "🦞", category: "wallets", tagline: "Simple & secure wallet for XLM", description: "LOBSTR is a user-friendly Stellar wallet available on web, iOS and Android with a built-in DEX and asset discovery.", url: "https://lobstr.co", screenshots: [], socials: { twitter: "https://x.com/lobstrco" }, verified: true, status: "approved", featured: true, dateAdded: "2023-11-15", visits: 22188, liveStatus: "Live" },
  { id: "3", slug: "albedo", name: "Albedo", logo: "🔆", category: "wallets", tagline: "Web-based signer for Stellar", description: "Albedo lets any Stellar web app request signatures and account access without exposing secret keys.", url: "https://albedo.link", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-02-18", visits: 6110, liveStatus: "Live" },
  { id: "4", slug: "xbull", name: "xBull", logo: "🐂", category: "wallets", tagline: "Multi-platform Stellar wallet", description: "xBull is a Stellar wallet for browser, desktop and mobile with multi-account and Soroban support.", url: "https://xbull.app", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-03-02", visits: 5240, liveStatus: "Live" },
  { id: "5", slug: "soroban", name: "Soroban", logo: "🧩", category: "infrastructure", tagline: "Smart contracts for Stellar", description: "Soroban is the Rust-based smart contract platform for the Stellar network, built for scale and low fees.", url: "https://soroban.stellar.org", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2024-04-08", visits: 15330, liveStatus: "Live" },
  { id: "6", slug: "horizon", name: "Horizon API", logo: "🛰️", category: "infrastructure", tagline: "Public Stellar API gateway", description: "Horizon is the client-facing API server for the Stellar network — accounts, ledgers, payments and streaming endpoints.", url: "https://horizon.stellar.org", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-09-01", visits: 9880, liveStatus: "Live" },
  { id: "7", slug: "stellar-expert", name: "StellarExpert", logo: "🔎", category: "infrastructure", tagline: "Block explorer for Stellar", description: "Explore accounts, ledgers, assets and transactions across the Stellar mainnet and testnet.", url: "https://stellar.expert", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2023-10-05", visits: 20450, liveStatus: "Live" },
  { id: "8", slug: "stellarx", name: "StellarX", logo: "▲", category: "defi", tagline: "Trade tokens & provide liquidity", description: "StellarX is a full-featured trading client for the Stellar decentralized exchange with zero trading fees.", url: "https://stellarx.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2023-12-20", visits: 12190, liveStatus: "Live" },
  { id: "9", slug: "aquarius", name: "Aquarius", logo: "♒", category: "defi", tagline: "Liquidity incentives for Stellar", description: "Aquarius manages liquidity rewards and market voting for the Stellar DEX using the AQUA token.", url: "https://aqua.network", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2024-01-30", visits: 8760, liveStatus: "Live" },
  { id: "10", slug: "blend", name: "Blend", logo: "◈", category: "defi", tagline: "Universal lending protocol", description: "Blend is a liquidity protocol primitive on Soroban that lets anyone create lending pools.", url: "https://blend.capital", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-06-11", visits: 4310, liveStatus: "Live" },
  { id: "11", slug: "phoenix", name: "Phoenix", logo: "🔥", category: "defi", tagline: "AMM DEX on Soroban", description: "Phoenix is an automated market maker and DEX built natively on Soroban.", url: "https://phoenix-hub.io", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-07-04", visits: 3980, liveStatus: "Live" },
  { id: "12", slug: "litemint", name: "Litemint", logo: "🖼️", category: "nfts", tagline: "NFT marketplace on Stellar", description: "Mint, buy and sell NFTs on Stellar with auctions, royalties and in-app gaming.", url: "https://litemint.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2024-02-18", visits: 6120, liveStatus: "Live" },
  { id: "13", slug: "stellart", name: "StellArt", logo: "◊", category: "nfts", tagline: "Curated Stellar NFT drops", description: "A curated marketplace for Stellar-native digital art and collectibles.", url: "https://stellart.io", screenshots: [], socials: {}, verified: false, status: "approved", featured: false, dateAdded: "2024-04-01", visits: 2821, liveStatus: "Live" },
  { id: "14", slug: "stellarquest", name: "StellarQuest", logo: "🗺️", category: "gaming", tagline: "Learn Stellar by playing", description: "StellarQuest is a series of on-chain puzzles that teach Stellar development while awarding collectible badges.", url: "https://quest.stellar.org", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2024-05-20", visits: 3421, liveStatus: "Live" },
  { id: "15", slug: "stellarterm", name: "StellarTerm", logo: "📊", category: "tools", tagline: "Real-time data & analytics for Stellar", description: "StellarTerm is an open-source trading client and market data dashboard for the Stellar DEX.", url: "https://stellarterm.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-07-19", visits: 3901, liveStatus: "Live" },
  { id: "16", slug: "stellar-lab", name: "Stellar Lab", logo: "⚗️", category: "tools", tagline: "Build & test transactions", description: "The Stellar Laboratory lets developers construct, sign and submit transactions against any Stellar network.", url: "https://lab.stellar.org", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2023-08-22", visits: 5015, liveStatus: "Live" },
  { id: "17", slug: "montelibero", name: "Montelibero", logo: "🏔️", category: "dapps", tagline: "Sovereign community on Stellar", description: "Montelibero is a free-market community coordinating on-chain through Stellar-issued assets.", url: "https://montelibero.org", screenshots: [], socials: {}, verified: false, status: "approved", featured: false, dateAdded: "2024-03-18", visits: 1890, liveStatus: "Live" },
  { id: "18", slug: "ultrastellar", name: "UltraStellar", logo: "🌌", category: "dapps", tagline: "Stellar-native banking rails", description: "UltraStellar provides Stellar-native financial products including yXLM yield accounts.", url: "https://ultrastellar.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-05-06", visits: 2470, liveStatus: "Live" },
  { id: "19", slug: "usdc-stellar", name: "USDC on Stellar", logo: "💵", category: "tokens", tagline: "Circle's stablecoin on Stellar", description: "Native USDC issued by Circle on the Stellar network for fast, low-cost settlement.", url: "https://circle.com", screenshots: [], socials: {}, verified: true, status: "approved", featured: true, dateAdded: "2023-06-14", visits: 14200, liveStatus: "Live" },
  { id: "20", slug: "aqua", name: "AQUA", logo: "💧", category: "tokens", tagline: "Stellar liquidity reward token", description: "AQUA is the governance and reward token powering Aquarius liquidity incentives on Stellar.", url: "https://aqua.network", screenshots: [], socials: {}, verified: true, status: "approved", featured: false, dateAdded: "2024-01-22", visits: 5320, liveStatus: "Live" },
];

export const NEWS: NewsArticle[] = [
  { id: "n1", slug: "soroban-mainnet-milestone", title: "Soroban passes 50M contract invocations", category: "Announcements", author: "Stellar Development Foundation", coverImage: "🧩", excerpt: "Soroban has become the backbone of Stellar smart contracts.", body: "Soroban launched on Stellar mainnet and has since processed more than 50 million contract invocations, with DeFi, gaming and payments teams shipping production apps.", publishDate: "2026-07-01", status: "published", views: 12403 },
  { id: "n2", slug: "circle-expands-usdc-stellar", title: "Circle expands native USDC on Stellar", category: "Partnerships", author: "Newsdesk", coverImage: "💵", excerpt: "USDC volume on Stellar crosses $2B in monthly settlement.", body: "Circle announced expanded liquidity partnerships across the Stellar network, deepening on/off ramps for native USDC in Latin America, Africa and Southeast Asia.", publishDate: "2026-06-24", status: "published", views: 8842 },
  { id: "n3", slug: "aquarius-rewards-v3", title: "Aquarius launches Rewards v3", category: "Updates", author: "Aquarius", coverImage: "♒", excerpt: "A new emissions model targets deeper stablecoin liquidity.", body: "The Aquarius team shipped v3 of its liquidity incentive engine, rebalancing AQUA emissions toward stablecoin pairs on the Stellar DEX.", publishDate: "2026-06-15", status: "published", views: 5621 },
  { id: "n4", slug: "xlm-market-analysis-q3", title: "XLM market analysis: Q3 recap", category: "Market", author: "Analyst Desk", coverImage: "📈", excerpt: "XLM outperforms mid-cap peers on volume and active addresses.", body: "In Q3, Stellar saw a 34% increase in active addresses and steady growth in payment volume, driven largely by stablecoin settlement corridors.", publishDate: "2026-06-10", status: "published", views: 4310 },
  { id: "n5", slug: "freighter-hardware-wallet", title: "Freighter adds hardware wallet support", category: "Updates", author: "Freighter Team", coverImage: "🦅", excerpt: "Ledger integration goes live for all Freighter users.", body: "Freighter now supports Ledger devices natively, letting users sign Stellar and Soroban transactions from hardware.", publishDate: "2026-05-28", status: "published", views: 6120 },
  { id: "n6", slug: "stellarquest-season", title: "StellarQuest opens a new season", category: "Announcements", author: "StellarQuest", coverImage: "🗺️", excerpt: "On-chain puzzles return with fresh collectible badges.", body: "StellarQuest kicked off a new season of on-chain development puzzles, rewarding participants with limited badges issued on Stellar.", publishDate: "2026-05-20", status: "published", views: 2988 },
];

export const USERS: User[] = [
  { id: "u1", name: "Alex Morgan", email: "alex@example.com", avatar: "🧑", role: "user", status: "active", joinDate: "2024-01-15", submissionsCount: 2 },
  { id: "u2", name: "Jamie Rivera", email: "jamie@example.com", avatar: "👩", role: "user", status: "active", joinDate: "2024-02-20", submissionsCount: 1 },
  { id: "u3", name: "Sam Chen", email: "sam@example.com", avatar: "🧑‍💻", role: "admin", status: "active", joinDate: "2023-11-01", submissionsCount: 0 },
  { id: "u4", name: "Riley K.", email: "riley@example.com", avatar: "🧑‍🎤", role: "user", status: "suspended", joinDate: "2024-03-05", submissionsCount: 3 },
];

export const TICKERS: Ticker[] = [
  { id: "t1", label: "SOROBAN SMART CONTRACTS LIVE", linkedProjectSlug: "soroban", order: 1 },
  { id: "t2", label: "NEW: LITEMINT NFT MARKET ADDED", linkedProjectSlug: "litemint", order: 2 },
  { id: "t3", label: "USDC ON STELLAR — $2.1B SETTLED THIS MONTH", linkedProjectSlug: "usdc-stellar", order: 3 },
  { id: "t4", label: "AQUA REWARDS V3 NOW LIVE", linkedProjectSlug: "aquarius", order: 4 },
  { id: "t5", label: "FREIGHTER ADDS LEDGER SUPPORT", linkedProjectSlug: "freighter", order: 5 },
  { id: "t6", label: "STELLAR DEX 24H VOL +12%", linkedProjectSlug: "stellarx", order: 6 },
];


export const WALLETS = ["Freighter", "Lobstr", "Albedo", "Ledger", "xBull"];
