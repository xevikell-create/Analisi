// Patrimonio V4 — market adapter + decision engine
// The browser must call a protected backend/proxy in production; never expose a provider API key in this file.
export const MARKET_PROVIDER = 'twelvedata';
export const MARKET_PROXY = '/api/market';

export async function fetchMarketPrices(symbols, fetchImpl = fetch) {
  const unique = [...new Set((symbols || []).filter(Boolean))];
  if (!unique.length) return {};
  const response = await fetchImpl(`${MARKET_PROXY}?symbols=${encodeURIComponent(unique.join(','))}`);
  if (!response.ok) throw new Error(`Market service HTTP ${response.status}`);
  const payload = await response.json();
  return payload.prices || payload;
}

export function valuePosition(position, marketPrice, fx = 1) {
  const price = Number(marketPrice);
  const quantity = Number(position.quantity || 0);
  return Number.isFinite(price) && Number.isFinite(quantity)
    ? price * quantity * Number(fx || 1)
    : Number(position.value || 0);
}

export function scoreAsset(asset, ctx = {}) {
  const current = Number(asset.currentPrice || 0);
  const target = Number(asset.targetPrice || 0);
  const weight = Number(asset.weight || 0);
  const targetWeight = Number(asset.targetWeight || 0);
  const risk = Math.max(0, Number(asset.risk || 0));
  const concentration = Math.max(0, weight - Math.max(targetWeight, 0));
  const upside = current > 0 && target > 0 ? target / current - 1 : 0;
  const safety = Math.max(0, Math.min(1, upside));
  const underweight = Math.max(0, targetWeight - weight);
  const liquidityFactor = Math.max(0, Math.min(1, Number(ctx.liquidityFactor ?? 1)));
  const minMargin = Math.max(0, Number(ctx.minMargin ?? 0));
  const marginGate = target > 0 && current > 0 && upside >= minMargin;
  const hasValuation = current > 0 && target > 0;

  // Never reward a purchase solely because price fell. A positive score requires
  // either a valuation margin or a portfolio-allocation need.
  const valuationSignal = marginGate ? 35 * safety : 0;
  const allocationSignal = 30 * underweight;
  const liquiditySignal = 20 * liquidityFactor;
  const riskPenalty = 20 * risk;
  const concentrationPenalty = 25 * concentration;
  const score = valuationSignal + allocationSignal + liquiditySignal - riskPenalty - concentrationPenalty;

  let action = 'MANTENER';
  if (!hasValuation && underweight > 0 && risk < 0.6) action = 'VIGILAR';
  else if (score >= 20 && marginGate) action = 'REFORZAR';
  else if (score >= 5) action = 'VIGILAR';
  else if (score <= -10) action = 'REDUCIR/ESPERAR';

  return {
    ...asset,
    upside,
    marginGate,
    score: Number(score.toFixed(2)),
    action,
    reason: action === 'REFORZAR'
      ? 'Margen de valoración + peso objetivo favorable, con riesgo controlado.'
      : action === 'VIGILAR'
        ? 'Hay interés potencial, pero falta margen suficiente o más confirmación.'
        : action === 'REDUCIR/ESPERAR'
          ? 'La concentración o el riesgo penalizan la nueva aportación.'
          : 'Mantener hasta que mejore la relación valoración/riesgo/asignación.'
  };
}

export function rankNextEuro(assets, ctx = {}) {
  return (assets || [])
    .map(a => scoreAsset(a, ctx))
    .sort((a, b) => b.score - a.score);
}

export function nextEuroDecision(assets, ctx = {}) {
  const ranked = rankNextEuro(assets, ctx);
  return ranked[0] || { action: 'ESPERAR', score: 0, reason: 'No hay activos suficientes para evaluar.' };
}
