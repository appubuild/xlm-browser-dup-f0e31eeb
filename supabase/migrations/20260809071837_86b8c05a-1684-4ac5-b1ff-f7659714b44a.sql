UPDATE public.wallet_config
SET rpc_url = CASE WHEN network = 'Testnet' THEN 'https://horizon-testnet.stellar.org' ELSE 'https://horizon.stellar.org' END,
    updated_at = now()
WHERE rpc_url IS NULL OR rpc_url !~* '^https?://' OR rpc_url ~* '(xrpl|ripple)';