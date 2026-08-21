// Patrimonio V4 — market adapter + decision engine
// The browser must call a protected backend/proxy in production; never expose a provider API key in this file.
export const MARKET_PROVIDER = 'twelvedata';
export const MARKET_PROXY = '/api/market';

export async function fetchMarketPrices(symbols, fetchImpl = fetch) {
  const unique = [...new Set(symbols.filter(Boolean))];
  if (!unique.length) return {};
  const response = await fetchImpl(`${MARKET_PROXY}?symbols=${encodeURIComponent(unique.join(','))}`);
  if (!response.ok) throw new Error(`Market service HTTP ${response.status}`);
  const payload = await response.json();
  return payload.prices || payload;
}

export function valuePosition(position, marketPrice, fx = 1) {
  const price = Number(marketPrice);
  const quantity = Number(position.quantity || 0);
  return Number.isFinite(price) && Number.isFinite(quantity) ? price * quantity * Number(fx || 1) : Number(position.value || 0);
}

export function scoreAsset(asset, ctx = {}) {
  const current = Number(asset.currentPrice || 0);
  const target = Number(asset.targetPrice || 0);
  const weight = Number(asset.weight || 0);
  const targetWeight = Number(asset.targetWeight || 0);
  const risk = Number(asset.risk || 0);
  const concentration = Math.max(0, weight - Math.max(targetWeight, 0));
  const upside = current > 0 && target > 0 ? target / current - 1 : 0;
  const safety = Math.max(0, Math.min(1, upside));
  const underweight = Math.max(0, targetWeight - weight);
  const liquidityFactor = Number(ctx.liquidityFactor ?? 1);
  const score = 35 * safety + 30 * underweight + 20 * liquidityFactor - 20 * risk - 25 * concentration;
  return { ...asset, upside, score: Number(score.toFixed(2)), action: score >= 20 ? 'REFORZAR' : score >= 5 ? 'VIGILAR' : score <= -10 ? 'REDUCIR/ESPERAR' : 'MANTENER' };
}

export function rankNextEuro(assets, ctx = {}) {
  return assets.map(a => scoreAsset(a, ctx)).sort((a, b) => b.score - a.score);
}
