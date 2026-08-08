# XLM Browser DUP

Build XRPBrowser.com — a search engine, ecosystem portal, and discovery platform for the XRP Ledger (XRPL) Network. The platform functions as a "browser within a browser," letting users search, discover, and preview XRPL ecosystem projects (wallets, DeFi, gaming, infrastructure, NFTs, tools) without leaving the site, via a simulated in-app browser viewport.

The product has three surfaces:

Public Site — search, directory, project profiles, submission flow, legal pages
User Panel (/panel/*) — authenticated users manage their submitted projects, bookmarks, history
Admin Panel (/admin/*) — full backend control center for site operators
Build this as a fully clickable, navigable prototype with all routes functional (using mock/local data — no real backend or database required, but structure data as if it will later connect to one).

DUAL THEME SYSTEM (Critical Requirement)
Implement a global theme toggle (sun/moon icon, top-right nav) that switches the ENTIRE application between two completely distinct visual systems. Persist choice in localStorage. Default to Light Mode on first visit.

🌞 LIGHT MODE — "Modern Web3 Browser"
Clean modern SaaS/Web3 aesthetic
Left sidebar navigation: Home, Web Search, XRPL Ecosystem, dApps, Tokens, NFTs, Wallets, News, Developers, Bookmarks, History, Settings, Help & Support
Top bar: Logo (XRP Browser with "X" ledger-style icon), theme toggle, "Connect Wallet" button, "Launch dApp" primary CTA button (blue/navy accent #0EA5E9 or #1E40AF — evoking Ripple/XRPL brand tones)
Hero section: large gradient background with soft decorative sparkles/dots/wave motifs, bold headline "Search the XRP Ledger Universe" (mixed color emphasis on "XRP Ledger"), subtext: "The search engine and browser for the fastest, greenest blockchain.", large rounded search bar with icon + "Search" button
Quick-action pill buttons below search: Explore dApps, Find Tokens, XRPL Network, NFT Marketplace, XRP News
"Trending on XRPL" horizontal card row — each card: project icon/avatar, verified checkmark badge, project name, category tag pill, one-line description, "View all" link top-right
Feature strip (4 columns w/ icons): Borderless Search, Built for XRPL, Private by Default, Open & Decentralized
Bottom-left widget: Live XRP Price ticker with % change (green/red), Network status indicator (green dot = Mainnet, with "Ledger Close Time: 3-5s" mock stat)
Rounded corners (12-16px), soft shadows, generous whitespace, Inter/Poppins font, color palette: white/off-white background, blue/navy primary, slate gray text, green for positive stats
🖤 DARK MODE — "1999 Retro Terminal Browser"
Full aesthetic pivot: pure black or near-black (#0a0a0a) background
Monospace font throughout (e.g., "Courier New", "VT323", "IBM Plex Mono")
Green-on-black terminal text (#00FF41 classic terminal green), with amber (#FFB000) as secondary accent
Simulated retro browser chrome at top of every page:
Fake OS window bar with 3 mock buttons (min/max/close as colored squares, non-functional)
Simulated URL/address bar showing current route path e.g. xrpbrowser.com/directory/wallets with a blinking cursor _
Fake "Back / Forward / Refresh / Home" pixelated buttons
Retro loading bar animation on page transitions ("LOADING... [##### ]")
Raw HTML aesthetic: visible-looking table borders, <hr> dividers, blocky ASCII-style section dividers (e.g., =====================), bullet lists with > or * prefixes
Blinking cursor effects on headings, scanline/CRT overlay effect (subtle CSS scanline animation), slight text flicker/glow (text-shadow: 0 0 5px #00FF41)
Search bar styled like a terminal input line: C:\> search_ with blinking cursor
Trending tickers rendered as scrolling marquee-style text bar (like old stock tickers) across the top: >> XRP $0.52 (+3.12%) | LEDGER #89234501 CLOSED | NEW: XRPCHESS.COM ADDED <<
Directory grid becomes a "table" layout resembling a 1999 web directory (like early Yahoo!) with green hyperlink-style text, underlined, purple for "visited" links
Buttons styled as raw HTML <input type="button"> gray beveled 3D elements
Easter egg: small "Best viewed in Netscape Navigator 4.0 — 800x600" badge in footer
Both themes must share identical functionality, routes, and data — only visual skin changes.

GLOBAL NAVIGATION STRUCTURE
Top Navigation Bar (persistent, all public pages)
Logo (left) → links to /
Trending Tickers strip (clickable — each ticker item links to that project's profile page)
Theme Toggle (sun/moon)
"Connect Wallet" button → opens mock wallet connect modal (Xaman/Xumm, GateHub, Trust Wallet, Ledger, Crossmark — mock list, clicking any = simulated "Connected ✅" state, stores mock address in state)
"Launch dApp" button → opens dropdown of featured dApps, each clickable to open in Browser Viewport
User avatar/login icon (right) → if logged out: "Sign In / Sign Up" → if logged in: dropdown menu (My Panel, Bookmarks, Submitted Projects, Settings, Log Out)
Left Sidebar Navigation (persistent, collapsible)
Each item is a fully clickable route:

🏠 Home → /
🔍 Web Search → /search
🌐 XRPL Ecosystem → /ecosystem
📱 dApps → /directory/dapps
🪙 Tokens → /directory/tokens
🖼️ NFTs → /directory/nfts
👛 Wallets → /directory/wallets
📰 News → /news
</> Developers → /developers
🔖 Bookmarks → /panel/bookmarks
🕐 History → /panel/history
⚙️ Settings → /panel/settings
❓ Help & Support → /help
Bottom-fixed widget: Live XRP Price + Network Status (mock data, animate small random fluctuations; include mock "Ledger Index" counter incrementing every few seconds for authenticity)

Footer (persistent, all pages)
Four columns:

Company: About (/about), Contact
Legal: Privacy Policy (/privacy), Terms of Service (/terms)
Developers: Developer API (/developers/api)
Contact Info (static, displayed exactly):
text

partner@skipads.ai
SkipAds AI LLC
Detroit, MI · USA
Social icons row (mock links: Twitter/X, Discord, Telegram, GitHub)
Retro mode: same content, styled as green terminal text with ASCII divider above.

PAGE-BY-PAGE SPECIFICATION
1. / — Home / Landing Page
Hero search bar (central, large) — typing + hitting enter routes to /search?q= with mock results
Quick action pills (Explore dApps, Find Tokens, XRPL Network, NFT Marketplace, XRP News) — each routes to relevant directory page
Featured Projects Showcase section (large cards, 3-4 across): image/icon, name, verified badge, category, short description, "Visit" button (opens Browser Viewport) and "View Profile" button (opens /project/[slug])
Trending on XRPL row (5-6 cards) — clickable to project profiles
Feature highlights strip (4 icons/columns)
CTA banner: "Have a project on the XRP Ledger? Submit it to XRPBrowser" → routes to /submit
2. /search — Web Search Results Page
Persistent search bar at top pre-filled with query
Tabs: All, dApps, Tokens, NFTs, Wallets, News, Web (mock filtering of same dataset)
Results list: each result = icon, title (clickable, opens Browser Viewport), URL breadcrumb, description snippet
Sidebar filters: Category checkboxes, "Verified Only" toggle, Sort by (Relevance, Newest, Most Visited)
Empty state and "no results" mock state included
3. /ecosystem — XRPL Ecosystem Overview
Visual map/grid of ecosystem categories with counts (e.g., "Wallets (12)", "DeFi (18)")
Each category card clickable → routes to /directory/[category]
Stats bar: Total Projects, Total Categories, Verified Projects, New This Week
Optional mock stat row: "XRPL TPS: 1,500", "Avg Fee: $0.0002", "Ledger Close Time: 3-5s"
4. /directory/[category] — Categorized Directory Grid
Categories: wallets, defi, gaming, infrastructure, nfts, tools, dapps, tokens

Grid/list toggle view
Filter sidebar: Verified only, Sort (A-Z, Newest, Trending)
Each project card: logo, name, verified badge, one-line description, category tag, "Visit" (Browser Viewport) + "Details" (/project/[slug]) buttons
Pagination or "Load More"
In Dark Mode: renders as literal HTML table with borders like a 1999 web directory
5. /project/[slug] — Custom Project Profile Page
Header: large logo, project name, verified badge, category tags, live status indicator
Tabs: Overview, Details, Reviews/Community, Links
Overview: full description, screenshot/preview thumbnail, launch date, website URL
"Open in Browser" primary button → launches Browser Viewport
"Visit Official Site" secondary button (mock external link)
Social/community links row (Twitter, Discord, Telegram, GitHub — mock icons)
Related Projects carousel (same category)
Stats sidebar: Total Visits (mock counter), Category, Date Added, Status (Live/Beta/Coming Soon)
Report/Flag project link (opens mock modal → "Thank you, our team will review this")
6. /submit — Project Info Submission Form
Multi-step form (Lovable should build as a 3-step wizard):

Step 1 — Basic Info: Project Name, Category (dropdown), Website URL, One-line tagline
Step 2 — Details: Full description (textarea), Logo upload (mock file picker), Screenshot upload (mock), Social links (Twitter, Discord, Telegram, GitHub)
Step 3 — Contact & Review: Submitter name, Submitter email, Terms checkbox, Review summary screen
On submit → show confirmation screen: "✅ Submitted for Review — Your project has been added to the moderation queue. You'll be notified at [email] once reviewed."
Mock Automated Admin Approval Flow: Behind the scenes, simulate that submission goes into pending state, visible in Admin Panel → Project Moderation queue. Include a simulated auto-approval toggle in Admin settings ("Auto-Approve New Submissions") that, when ON, mock-approves submissions after a fake 5-second delay with a toast notification "🎉 New project auto-approved: [Project Name]"
7. /news — XRPL Ecosystem News Feed
Card grid of mock news articles (title, thumbnail, date, source tag, excerpt)
Category filter tabs: All, Announcements, Partnerships, Updates, Market
Click article → /news/[slug] detail page with full mock content, share buttons, related articles
8. /developers & /developers/api — Developer Hub
/developers: Overview of building on XRPBrowser (mock SDK/API teaser cards), links to docs, mock XRPL RPC endpoint reference
/developers/api: Mock API documentation page — endpoint list (GET /projects, GET /project/:id, GET /categories, POST /submit), sample JSON request/response blocks, auth key mock generator button ("Generate API Key" → shows fake key with copy button)
9. Legal Pages
/about — Company mission, "What is XRPBrowser", team/vision blurb, contact block
/privacy — Full mock Privacy Policy (standard sections: Data Collection, Cookies, Third Parties, Contact)
/terms — Full mock Terms of Service (Acceptable Use, Disclaimers, Liability, Governing Law)
/help — FAQ accordion + contact support CTA
All must display footer contact block:
text

partner@skipads.ai
SkipAds AI LLC
Detroit, MI · USA
🖥️ THE BROWSER VIEWPORT (Signature Feature — Hard Requirement)
Build a reusable Browser Viewport Modal/Panel component that triggers whenever a user clicks "Visit," "Open in Browser," a search result, or a directory card.

Behavior:

Opens as a full-screen overlay OR a large centered modal (support both — default full-screen "new tab" simulation)
Top chrome bar mimics a real browser:
Back / Forward / Refresh / Home mock buttons (functional within the viewport's mock history stack)
Simulated address bar showing the project's URL (e.g., https://xrpchess.com) — editable-looking but functional only for mock nav
Bookmark star icon (toggles bookmark state, adds to /panel/bookmarks)
Tab strip at top supporting multiple open tabs (users can open several projects in tabs within the viewport, switch between them, close tabs with ×)
"Open in New Real Tab" button (would open actual external URL)
Close (×) button returns to underlying page
Content area: embed via <iframe> when possible (many real project sites will block embedding via X-Frame-Options — Lovable should implement graceful fallback: if iframe fails/blocked, show a styled mock preview screen with project screenshot, name, and message "Live preview unavailable — Visit Official Site" with external link button)
Loading state: retro-style progress bar in Dark Mode ("LOADING XRPCHESS.COM... ▓▓▓▓░░░░ 60%"), modern skeleton loader in Light Mode
This viewport component must be reused consistently across Home, Search, Directory, and Project Profile pages
👤 USER PANEL — /panel/* (Authenticated User Routes)
Sidebar layout within panel (distinct from public sidebar):

/panel — Dashboard: welcome message, quick stats (Bookmarks count, Submitted Projects count, Recently Visited count), quick links
/panel/bookmarks — Grid/list of bookmarked projects, remove button on each, empty state
/panel/history — Chronological list of visited/opened projects (via Browser Viewport), grouped by date, "Clear History" button
/panel/submissions — Table of user's own submitted projects with status badges (Pending / Approved / Rejected), click row → view submission detail, "Edit & Resubmit" button for rejected ones
/panel/settings — Profile info (display name, email, avatar upload mock), Theme preference toggle, Notification preferences (checkboxes), Connected Wallet display, "Delete Account" (mock confirm modal)
/panel/notifications — List of mock notifications (e.g., "Your project XYZ was approved!", "New project added to Wallets category")
Auth simulation: Build a mock login/signup flow at /login and /signup (email/password fields, no real backend — successful "login" just sets a mock user session in local state and redirects to /panel). Include "Continue with Wallet" mock option too.

🛠️ ADMIN PANEL — /admin/* (Full Control Center)
Separate distinct layout: dark sidebar (regardless of site theme — admin panel always uses a professional dark dashboard UI for clarity), top bar with admin name/avatar, notification bell, logout.

Admin sidebar routes — all clickable, all functional with mock data/state:

/admin — Dashboard & Analytics
KPI cards: Total Projects, Pending Approvals, Total Users, Total Searches Today, Total Page Views
Charts (mock data): Traffic over time (line chart), Category distribution (pie/donut chart), Top 10 Most Visited Projects (bar chart), New Submissions per Week
Recent Activity feed: "New project submitted: X", "User Y registered", "Project Z approved"
/admin/projects — Project Management
Full table of ALL projects (approved + pending + rejected): columns — Logo, Name, Category, Status, Date Added, Visits, Actions
Actions per row: Edit, View Live Profile, Approve/Reject (if pending), Feature/Unfeature toggle, Delete (confirm modal)
Bulk actions: bulk approve, bulk delete
"+ Add New Project" button → opens same multi-step form as public /submit, admin-authored, auto-approved
Filter/search bar + category filter + status filter
/admin/projects/pending — Moderation Queue
Dedicated queue view of only pending submissions
Each card/row: full submission preview, submitter contact info, Approve ✅ / Reject ❌ (with reason textarea) / Request Changes buttons
Toggle at top: "Auto-Approve New Submissions" (ON/OFF) — ties into the mock automated approval flow described in /submit section
/admin/categories — Category Management
List of categories (Wallets, DeFi, Gaming, Infrastructure, NFTs, Tools, dApps, Tokens)
Add/Edit/Delete/Reorder categories (drag-handle icon, mock reorder)
Toggle category visibility on public directory
/admin/users — User Management
Table: Avatar, Name, Email, Join Date, Role (User/Admin), Status (Active/Suspended), Submissions Count
Actions: View Profile, Suspend/Activate, Promote to Admin, Delete
Search/filter bar
/admin/blog (or /admin/news) — Content/News Management
Table of news articles: Title, Category, Author, Publish Date, Status (Draft/Published), Views
"+ New Article" → rich text editor mock (title, category, cover image upload, body textarea, publish toggle)
Edit/Delete/Duplicate actions per article
/admin/tickers — Trending Ticker Management
Manage what appears in the homepage/nav trending ticker strip
Add/remove/reorder ticker items, set custom text or link to project
/admin/site-settings — Global Site Settings
General: Site Name, Logo upload, Favicon upload, Meta description
Theme Defaults: Default theme (Light/Dark), allow user override toggle
Feature Flags: Enable/Disable Browser Viewport iframe mode, Enable/Disable Submissions, Maintenance Mode toggle
Contact Info editor (pre-filled with partner@skipads.ai / SkipAds AI LLC / Detroit, MI · USA — editable fields)
API Settings: Rate limits mock config, API key management table (list of issued keys, revoke button)
Footer Links Manager: edit/add/remove footer legal links
/admin/analytics — Deep Analytics
Extended charts: Search queries log (table of top searches), Traffic sources (mock pie chart), Device breakdown, Geographic mock map/table
Export report button (mock CSV download trigger)
/admin/notifications — Notification Center
Compose/send mock platform-wide notification to users
History of sent notifications
/admin/wallet-connect-config — Wallet Integration Settings
Toggle which wallets appear in "Connect Wallet" modal (Xaman/Xumm, GateHub, Trust Wallet, Ledger, Crossmark, etc.)
Mock RPC/network endpoint config fields (Mainnet/Testnet toggle, mock XRPL node URL field)
Admin login: /admin/login — separate mock auth gate (simple email/password, hardcoded mock check, redirect to /admin on "success")

DATA MODEL (Mock, for consistent prototype structure)
Structure mock JSON data (stored in local state/context, not a real DB) for:

Projects: id, slug, name, logo, category, tagline, description, url, screenshots[], socials{}, verified, status (approved/pending/rejected), featured, dateAdded, visits, submitterName, submitterEmail
Categories: id, name, icon, description, projectCount, visible
Users: id, name, email, avatar, role, status, joinDate, bookmarks[], history[], submissions[]
News Articles: id, title, slug, category, author, coverImage, body, publishDate, status, views
Tickers: id, label, linkedProjectId, order
Notifications: id, message, type, timestamp, read
Pre-populate with realistic sample data: at least 15-20 mock projects across all categories reflecting the real XRPL ecosystem style (e.g., a wallet like "Xaman," a DEX/aggregator like "Sologenic," an explorer like "XRPScan," a bridge/tool like "Bithomp," and include "XRP Chess" at xrpchess.com as a Gaming entry), 5-6 mock news articles, 3-4 mock users, mock ticker data.

INTERACTION & POLISH REQUIREMENTS
Every button, link, sidebar item, tab, ticker item, and card MUST route somewhere or trigger a visible state change (modal, toast, viewport) — nothing dead-ends
Toast notification system for actions (approve, reject, bookmark added, submission sent, settings saved, etc.)
Loading skeletons/spinners on all data-fetching simulations (even though mock, simulate 300-800ms delay for realism)
Fully responsive: mobile nav collapses sidebar into hamburger menu, directory grids stack, Browser Viewport becomes full-screen on mobile
Smooth transitions between Light/Dark theme (no jarring flash)
404 page styled per active theme with "Return Home" button
Breadcrumb navigation on nested pages (Directory > Wallets > Xaman)
TECH APPROACH NOTES FOR BUILDER
Use client-side routing with all routes above fully wired
Use React Context (or equivalent) for: theme state, mock auth/user session, mock admin session, project data store, notification/toast queue
No real backend/database integration required — all data mock/local, structured cleanly so it could later map to real API endpoints
Prioritize the Browser Viewport component, dual-theme system, and full route click-through as the three pillars of this build — every other feature supports these
Build this as a cohesive, fully clickable, demo-ready prototype where a reviewer can navigate from Home → Search → Directory → Project Profile → Browser Viewport → Submit a Project → see it in Admin Moderation Queue → Approve it → see it appear live — all without hitting a single broken link or dead button.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/217b5653-98c7-4787-b527-f32fffe65971).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
