DELETE FROM public.projects;
INSERT INTO public.projects (slug, name, logo, category, tagline, description, url, screenshots, socials, verified, status, featured, date_added, visits, live_status, is_public) VALUES
('freighter','Freighter','🦅','wallets','The most secure wallet for Stellar assets','Freighter is a non-custodial browser extension wallet for the Stellar network, with hardware wallet support and Soroban smart contract signing.','https://freighter.app','{}','{"twitter":"https://x.com/freighterwallet"}',true,'approved',true,'2024-01-12',18420,'Live',true),
('lobstr','LOBSTR','🦞','wallets','Simple & secure wallet for XLM','LOBSTR is a user-friendly Stellar wallet available on web, iOS and Android with a built-in DEX and asset discovery.','https://lobstr.co','{}','{"twitter":"https://x.com/lobstrco"}',true,'approved',true,'2023-11-15',22188,'Live',true),
('albedo','Albedo','🔆','wallets','Web-based signer for Stellar','Albedo lets any Stellar web app request signatures and account access without exposing secret keys.','https://albedo.link','{}','{}',true,'approved',false,'2024-02-18',6110,'Live',true),
('xbull','xBull','🐂','wallets','Multi-platform Stellar wallet','xBull is a Stellar wallet for browser, desktop and mobile with multi-account and Soroban support.','https://xbull.app','{}','{}',true,'approved',false,'2024-03-02',5240,'Live',true),
('soroban','Soroban','🧩','infrastructure','Smart contracts for Stellar','Soroban is the Rust-based smart contract platform for the Stellar network, built for scale and low fees.','https://soroban.stellar.org','{}','{}',true,'approved',true,'2024-04-08',15330,'Live',true),
('horizon','Horizon API','🛰️','infrastructure','Public Stellar API gateway','Horizon is the client-facing API server for the Stellar network — accounts, ledgers, payments and streaming endpoints.','https://horizon.stellar.org','{}','{}',true,'approved',false,'2023-09-01',9880,'Live',true),
('stellar-expert','StellarExpert','🔎','infrastructure','Block explorer for Stellar','Explore accounts, ledgers, assets and transactions across the Stellar mainnet and testnet.','https://stellar.expert','{}','{}',true,'approved',true,'2023-10-05',20450,'Live',true),
('stellarx','StellarX','▲','defi','Trade tokens & provide liquidity','StellarX is a full-featured trading client for the Stellar decentralized exchange with zero trading fees.','https://stellarx.com','{}','{}',true,'approved',true,'2023-12-20',12190,'Live',true),
('aquarius','Aquarius','♒','defi','Liquidity incentives for Stellar','Aquarius manages liquidity rewards and market voting for the Stellar DEX using the AQUA token.','https://aqua.network','{}','{}',true,'approved',true,'2024-01-30',8760,'Live',true),
('blend','Blend','◈','defi','Universal lending protocol','Blend is a liquidity protocol primitive on Soroban that lets anyone create lending pools.','https://blend.capital','{}','{}',true,'approved',false,'2024-06-11',4310,'Live',true),
('phoenix','Phoenix','🔥','defi','AMM DEX on Soroban','Phoenix is an automated market maker and DEX built natively on Soroban.','https://phoenix-hub.io','{}','{}',true,'approved',false,'2024-07-04',3980,'Live',true),
('litemint','Litemint','🖼️','nfts','NFT marketplace on Stellar','Mint, buy and sell NFTs on Stellar with auctions, royalties and in-app gaming.','https://litemint.com','{}','{}',true,'approved',true,'2024-02-18',6120,'Live',true),
('stellart','StellArt','◊','nfts','Curated Stellar NFT drops','A curated marketplace for Stellar-native digital art and collectibles.','https://stellart.io','{}','{}',false,'approved',false,'2024-04-01',2821,'Live',true),
('stellarquest','StellarQuest','🗺️','gaming','Learn Stellar by playing','StellarQuest is a series of on-chain puzzles that teach Stellar development while awarding collectible badges.','https://quest.stellar.org','{}','{}',true,'approved',true,'2024-05-20',3421,'Live',true),
('stellarterm','StellarTerm','📊','tools','Real-time data & analytics for Stellar','StellarTerm is an open-source trading client and market data dashboard for the Stellar DEX.','https://stellarterm.com','{}','{}',true,'approved',false,'2023-07-19',3901,'Live',true),
('stellar-lab','Stellar Lab','⚗️','tools','Build & test transactions','The Stellar Laboratory lets developers construct, sign and submit transactions against any Stellar network.','https://lab.stellar.org','{}','{}',true,'approved',false,'2023-08-22',5015,'Live',true),
('montelibero','Montelibero','🏔️','dapps','Sovereign community on Stellar','Montelibero is a free-market community coordinating on-chain through Stellar-issued assets.','https://montelibero.org','{}','{}',false,'approved',false,'2024-03-18',1890,'Live',true),
('ultrastellar','UltraStellar','🌌','dapps','Stellar-native banking rails','UltraStellar provides Stellar-native financial products including yXLM yield accounts.','https://ultrastellar.com','{}','{}',true,'approved',false,'2024-05-06',2470,'Live',true),
('usdc-stellar','USDC on Stellar','💵','tokens','Circle''s stablecoin on Stellar','Native USDC issued by Circle on the Stellar network for fast, low-cost settlement.','https://circle.com','{}','{}',true,'approved',true,'2023-06-14',14200,'Live',true),
('aqua','AQUA','💧','tokens','Stellar liquidity reward token','AQUA is the governance and reward token powering Aquarius liquidity incentives on Stellar.','https://aqua.network','{}','{}',true,'approved',false,'2024-01-22',5320,'Live',true);

DELETE FROM public.tickers;
INSERT INTO public.tickers (label, linked_project_slug, sort_order, visible) VALUES
('SOROBAN SMART CONTRACTS LIVE','soroban',1,true),
('NEW: LITEMINT NFT MARKET ADDED','litemint',2,true),
('USDC ON STELLAR — $2.1B SETTLED THIS MONTH','usdc-stellar',3,true),
('AQUA REWARDS V3 NOW LIVE','aquarius',4,true),
('FREIGHTER ADDS LEDGER SUPPORT','freighter',5,true),
('STELLAR DEX 24H VOL +12%','stellarx',6,true);

DELETE FROM public.news;
INSERT INTO public.news (slug, title, category, author, cover_image, excerpt, body, publish_date, status, views) VALUES
('soroban-mainnet-milestone','Soroban passes 50M contract invocations','Announcements','Stellar Development Foundation','🧩','Soroban has become the backbone of Stellar smart contracts.','Soroban launched on Stellar mainnet and has since processed more than 50 million contract invocations, with DeFi, gaming and payments teams shipping production apps.','2026-07-01','published',12403),
('circle-expands-usdc-stellar','Circle expands native USDC on Stellar','Partnerships','Newsdesk','💵','USDC volume on Stellar crosses $2B in monthly settlement.','Circle announced expanded liquidity partnerships across the Stellar network, deepening on/off ramps for native USDC in Latin America, Africa and Southeast Asia.','2026-06-24','published',8842),
('aquarius-rewards-v3','Aquarius launches Rewards v3','Updates','Aquarius','♒','A new emissions model targets deeper stablecoin liquidity.','The Aquarius team shipped v3 of its liquidity incentive engine, rebalancing AQUA emissions toward stablecoin pairs on the Stellar DEX.','2026-06-15','published',5621),
('xlm-market-analysis-q3','XLM market analysis: Q3 recap','Market','Analyst Desk','📈','XLM outperforms mid-cap peers on volume and active addresses.','In Q3, Stellar saw a 34% increase in active addresses and steady growth in payment volume, driven largely by stablecoin settlement corridors.','2026-06-10','published',4310),
('freighter-hardware-wallet','Freighter adds hardware wallet support','Updates','Freighter Team','🦅','Ledger integration goes live for all Freighter users.','Freighter now supports Ledger devices natively, letting users sign Stellar and Soroban transactions from hardware.','2026-05-28','published',6120),
('stellarquest-season','StellarQuest opens a new season','Announcements','StellarQuest','🗺️','On-chain puzzles return with fresh collectible badges.','StellarQuest kicked off a new season of on-chain development puzzles, rewarding participants with limited badges issued on Stellar.','2026-05-20','published',2988);

UPDATE public.landing_sections SET subtitle = 'Eight curated corners of the Stellar universe.' WHERE subtitle ILIKE '%XRP Ledger universe%';
UPDATE public.landing_sections SET subtitle = 'Fresh from the Stellar ecosystem.' WHERE subtitle ILIKE '%XRPL ecosystem%';
UPDATE public.landing_sections SET subtitle = 'Community favorites on Stellar' WHERE subtitle ILIKE '%favorites on XRPL%';
UPDATE public.landing_sections SET title = 'Trending on Stellar' WHERE title ILIKE '%Trending on XRPL%';
UPDATE public.landing_sections SET subtitle = 'Hand-picked by the XLM Browser team.' WHERE subtitle ILIKE '%XRPBrowser%';
UPDATE public.landing_sections SET title = 'Discover the Stellar Network.', subtitle = 'Search, preview and explore Stellar projects — without leaving the browser.' WHERE title ILIKE '%XRP Ledger%';
UPDATE public.landing_sections SET title = replace(replace(title,'XRPL','Stellar'),'XRP','XLM'), subtitle = replace(replace(coalesce(subtitle,''),'XRPL','Stellar'),'XRP','XLM') WHERE title ILIKE '%XRP%' OR subtitle ILIKE '%XRP%';

UPDATE public.categories SET description = replace(replace(description,'XRPL','Stellar'),'XRP','XLM') WHERE description ILIKE '%XRP%';
UPDATE public.site_settings SET site_name = 'XLM Browser', meta_description = replace(replace(meta_description,'XRPL','Stellar'),'XRP','XLM') WHERE id = 1;