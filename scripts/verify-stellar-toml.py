"""Verify public Stellar discovery without credentials: python3 scripts/verify-stellar-toml.py [origin]."""
import json
import sys
import tomllib
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:8080'
PATH = '/.well-known/stellar.toml'
EXPECTED = (ROOT / 'public/.well-known/stellar.toml').read_bytes()
config = tomllib.loads(EXPECTED.decode())
assert len(config['ACCOUNTS']) == 2
asset = config['CURRENCIES'][0]
assert asset['code'] == 'Browser'
assert asset['issuer'] in config['ACCOUNTS']
assert asset['display_decimals'] == 7
assert asset['fixed_number'] == 21000000
assert asset['is_asset_anchored'] is False
assert json.loads((ROOT / 'wrangler.json').read_text())['assets']['run_worker_first'] == [PATH]

for method, expected_status in [('GET', 200), ('HEAD', 200), ('OPTIONS', 204), ('POST', 405)]:
    request = urllib.request.Request(ORIGIN + PATH, method=method, headers={
        'Origin': 'https://example.org', 'Access-Control-Request-Method': 'GET',
    })
    try:
        response = urllib.request.urlopen(request, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        assert response.status == expected_status, (method, response.status)
        assert response.headers['Access-Control-Allow-Origin'] == '*', method
        assert response.headers['Access-Control-Allow-Methods'] == 'GET, HEAD, OPTIONS', method
        assert response.headers['Content-Type'] == 'text/plain; charset=utf-8', method
        assert response.headers['X-Content-Type-Options'] == 'nosniff', method
        assert response.headers['Cache-Control'] == 'public, max-age=0, must-revalidate', method
        assert response.headers['Cloudflare-CDN-Cache-Control'] == 'no-store', method
        body = response.read()
        if method == 'GET':
            assert body == EXPECTED
            assert tomllib.loads(body.decode()) == config
        if method in ('HEAD', 'OPTIONS'):
            assert not body
        print(method, response.status, 'OK')

print('Public discovery checks passed:', ORIGIN + PATH)