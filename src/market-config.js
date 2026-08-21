// Symbols used by the V4 market connector.
// Provider-specific mappings can be changed here without touching portfolio logic.
export const MARKET_SYMBOLS = {
  'Apple': 'AAPL',
  'Nvidia': 'NVDA',
  'AMD': 'AMD',
  'Meta': 'META',
  'Amazon': 'AMZN',
  'Netflix': 'NFLX',
  'Palantir': 'PLTR',
  'Toyota': 'TM',
  'First Solar': 'FSLR',
  'BYD': 'BYDDY',
  'NextEra Energy': 'NEE',
  'CaixaBank': 'CABK',
  'S&P 500 ETF': 'SPY',
  'MSCI World Acc': 'URTH',
  'Ethereum': 'ETH/EUR'
};

export function symbolForAsset(name) {
  return MARKET_SYMBOLS[name] || name;
}
