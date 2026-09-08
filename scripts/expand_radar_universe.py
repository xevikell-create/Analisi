import json
import re
import urllib.request
from pathlib import Path

OUT = Path('radar-universe-v2.json')
HEADERS = {'User-Agent': 'AnalisiRadar/1.0 github-actions[bot]@users.noreply.github.com'}

# Public index constituent tables. This is deliberately additive: the curated seed
# universe remains authoritative for metadata, while index constituents expand coverage.
SOURCES = [
    ('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', 'US', 'large_cap'),
    ('https://en.wikipedia.org/wiki/Nasdaq-100', 'US', 'large_cap'),
    ('https://en.wikipedia.org/wiki/FTSE_100_Index', 'GB', 'large_cap'),
    ('https://en.wikipedia.org/wiki/DAX', 'DE', 'large_cap'),
    ('https://en.wikipedia.org/wiki/CAC_40', 'FR', 'large_cap'),
    ('https://en.wikipedia.org/wiki/Euro_Stoxx_50', 'EU', 'large_cap'),
    ('https://en.wikipedia.org/wiki/Nikkei_225', 'JP', 'large_cap'),
    ('https://en.wikipedia.org/wiki/Hang_Seng_Index', 'HK', 'large_cap'),
    ('https://en.wikipedia.org/wiki/S%26P/TSX_60', 'CA', 'large_cap'),
    ('https://en.wikipedia.org/wiki/ASX_200', 'AU', 'large_cap'),
]

# Yahoo Finance exchange suffixes used where the source table exposes local symbols.
SUFFIX = {'GB': '.L', 'DE': '.DE', 'FR': '.PA', 'JP': '.T', 'HK': '.HK', 'CA': '.TO', 'AU': '.AX'}

def clean_symbol(value):
    if value is None:
        return None
    s = str(value).strip().upper()
    s = re.sub(r'\[[^\]]+\]', '', s)
    s = s.replace(' ', '')
    if not s or s in {'SYMBOL', 'TICKER', 'TICKER SYMBOL'}:
        return None
    # Wikipedia sometimes uses dots for class shares; Yahoo uses dashes.
    return s.replace('.', '-')

def candidate_columns(df):
    cols = [str(c).strip().lower() for c in df.columns]
    preferred = [i for i,c in enumerate(cols) if any(x in c for x in ('symbol','ticker','code'))]
    return preferred or list(range(min(3, len(cols))))

def fetch_tables(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        html = r.read()
    try:
        import pandas as pd
        return pd.read_html(html)
    except Exception:
        return []

def main():
    base = json.loads(OUT.read_text()) if OUT.exists() else {'version': 3, 'assets': []}
    seeds = {a.get('ticker'): a for a in base.get('assets', []) if a.get('ticker')}
    added = 0
    source_hits = {}
    for url, country, cap in SOURCES:
        try:
            tables = fetch_tables(url)
            found = 0
            for df in tables:
                for col_i in candidate_columns(df):
                    if col_i >= len(df.columns):
                        continue
                    col = df.columns[col_i]
                    for raw in df[col].tolist():
                        local = clean_symbol(raw)
                        if not local or len(local) > 12:
                            continue
                        # Reject obvious non-ticker prose.
                        if not re.match(r'^[A-Z0-9-]+$', local):
                            continue
                        ticker = local
                        if country in SUFFIX and not ticker.endswith(SUFFIX[country]):
                            ticker = ticker + SUFFIX[country]
                        if ticker in seeds:
                            continue
                        seeds[ticker] = {
                            'ticker': ticker,
                            'marketTicker': ticker,
                            'name': ticker,
                            'assetType': 'stock',
                            'sector': 'Unknown',
                            'country': country,
                            'theme': 'Global equities',
                            'universeSource': url,
                            'universeTier': cap,
                        }
                        added += 1
                        found += 1
                    # One useful ticker column is enough per table.
                    if found:
                        break
            source_hits[url] = found
        except Exception as exc:
            source_hits[url] = f'error: {exc}'

    base['assets'] = list(seeds.values())
    base['version'] = 3
    base['coverage'] = {
        'mode': 'dynamic-index-expansion',
        'sources': SOURCES,
        'sourceHits': source_hits,
        'assetCount': len(base['assets']),
        'generatedBy': 'scripts/expand_radar_universe.py',
    }
    OUT.write_text(json.dumps(base, ensure_ascii=False, indent=2) + '\n')
    print(f'Radar dynamic universe: {len(base["assets"])} assets ({added} added this run)')

if __name__ == '__main__':
    main()
