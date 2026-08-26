/* RADAR DATA ADAPTER V2 — market + validated asset snapshot + macro/news + portfolio */
(function(){
 const ageDays=iso=>iso?Math.max(0,(Date.now()-new Date(iso).getTime())/86400000):9999;
 const normTicker=s=>String(s||'').trim().toUpperCase();
 async function loadMarket(){try{return await (window.MarketV4?.sync?window.MarketV4.sync():{quotes:{}})}catch(e){return{quotes:{}}}}
 async function loadAssets(){try{if(window.RadarDataPipelineV1)return await RadarDataPipelineV1.load();const r=await fetch('./radar-data.json?ts='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}return{assets:{}}}
 async function loadSnapshot(){try{const r=await fetch('./radar-intelligence-data.json?ts='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}return null}
 function quoteFor(c,q){for(const k of [c.name,c.ticker,normTicker(c.ticker)])if(q?.[k])return q[k];return null}
 function buildCandidates(universe,quotes,assets,positions){const held=new Set((positions||[]).map(p=>normTicker(p.ticker||p.name)));return (universe||[]).map(c=>{const d=assets?.assets?.[c.ticker]||assets?.[normTicker(c.ticker)]||{};const q=quoteFor(c,quotes);return{...c,...d,price:d.price??q?.price??null,currency:d.currency??q?.currency??null,quoteSource:q?.source??null,quoteUpdatedAt:q?.timestamp??null,held:held.has(normTicker(c.ticker)),updatedAt:d.updatedAt??q?.timestamp??null}})}
 async function prepare(universe,positions,total){const market=await loadMarket(),assets=await loadAssets(),snapshot=await loadSnapshot();const candidates=buildCandidates(universe,market.quotes||{},assets,positions);const ctx=window.RadarIntelligenceV5?.buildContext?window.RadarIntelligenceV5.buildContext(positions,total):{};return{candidates,ctx,macro:snapshot?.macro||null,news:snapshot?.news||{},market,snapshot,assetData:assets,coverage:candidates.filter(c=>Number.isFinite(Number(c.price))).length/(candidates.length||1),snapshotAgeDays:ageDays(snapshot?.updatedAt)}}
 window.RadarDataAdapterV1={prepare,buildCandidates};
})();
