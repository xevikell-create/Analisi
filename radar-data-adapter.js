/* RADAR DATA ADAPTER V1 — joins live market cache + portfolio context + validated macro/news snapshots */
(function(){
  const ageDays=iso=>iso?Math.max(0,(Date.now()-new Date(iso).getTime())/86400000):9999;
  const normTicker=s=>String(s||'').trim().toUpperCase();
  async function loadMarket(){try{return await (window.MarketV4?.sync?window.MarketV4.sync():{quotes:{}})}catch(e){return{quotes:{}}}}
  async function loadSnapshot(){try{const r=await fetch('./radar-intelligence-data.json?ts='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}return null}
  function quoteFor(c,q){const keys=[c.name,c.ticker,normTicker(c.ticker)];for(const k of keys){if(q?.[k])return q[k]}return null}
  function buildCandidates(universe,quotes,positions){const held=new Set((positions||[]).map(p=>normTicker(p.ticker||p.name)));return (universe||[]).map(c=>{const q=quoteFor(c,quotes);return {...c,price:q?.price??null,currency:q?.currency??null,quoteSource:q?.source??null,quoteUpdatedAt:q?.timestamp??null,held:held.has(normTicker(c.ticker)),updatedAt:q?.timestamp??null}})}
  async function prepare(universe,positions,total){const market=await loadMarket(),snapshot=await loadSnapshot();const candidates=buildCandidates(universe,market.quotes||{},positions);const ctx=window.RadarIntelligenceV5.buildContext(positions,total);const macro=snapshot?.macro||null,news=snapshot?.news||{};return{candidates,ctx,macro,news,market,snapshot,coverage:candidates.filter(c=>Number.isFinite(Number(c.price))).length/(candidates.length||1),snapshotAgeDays:ageDays(snapshot?.updatedAt)}}
  window.RadarDataAdapterV1={prepare,buildCandidates};
})();
