
INSERT INTO landing_sections (section_key, title, subtitle, visible, sort_order, config) VALUES
  ('live_prices', 'Live Prices', 'Real-time market data via CoinGecko', true, 3, '{}'::jsonb),
  ('popular', 'Most Popular', 'Community favorites on XRPL', true, 6, '{"projectSlugs": []}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

UPDATE landing_sections SET config = COALESCE(config, '{}'::jsonb) || '{"projectSlugs": []}'::jsonb
  WHERE section_key IN ('featured','trending','popular') AND NOT (config ? 'projectSlugs');
