/* RADAR DATA PIPELINE V1 — normaliza datos externos sin inventarlos */
(function(){
 const SOURCE_PRIORITY={primary:100,institutional:95,financial:85,market:75,secondary:60};
 const ageHours=ts=>{const t=Date.parse(ts||'');return Number.isFinite(t)?Math.max(0,(Date.now()-t)/3600000):Infinity};
 function quality(d){const src=(d?.sources||[]).map(s=>SOURCE_PRIORITY[s.type]||50);const sourceScore=src.length?Math.max(...src):0;const age=ageHours(d?.updatedAt);const freshness=age===Infinity?0:Math.max(0,100-Math.min(age/24,7)*14.3);const completeness=Number.isFinite(d?.completeness)?d.completeness:0;return Math.round(Math.max(0,Math.min(100,sourceScore*.35+freshness*.25+completeness*.40-Number(d?.conflicts||0)*12)))}
 function normalize(raw){const out={};Object.entries(raw?.assets||{}).forEach(([ticker,a])=>{const x={...a,ticker};x.dataQuality=quality(x);x.updatedAt=x.updatedAt||raw.updatedAt||null;x.sources=x.sources||[];x.missingCritical=[];['price','currency'].forEach(k=>{if(x[k]===null||x[k]===undefined||x[k]==='')x.missingCritical.push(k)});['revenueGrowth','epsGrowth','pe','evEbitda','roe','roic','debtToEbitda'].forEach(k=>{if(x[k]===null||x[k]===undefined||!Number.isFinite(Number(x[k])))x.missingCritical.push(k)});out[ticker]=x});return{version:raw?.version||1,updatedAt:raw?.updatedAt||null,assets:out}}
 async function load(){try{const r=await fetch('./radar-data.json?ts='+Date.now(),{cache:'no-store'});if(r.ok){const j=normalize(await r.json());window.RadarDataV1=j;return j}}catch(e){}window.RadarDataV1={version:1,updatedAt:null,assets:{}};return window.RadarDataV1}
 window.RadarDataPipelineV1={SOURCE_PRIORITY,quality,normalize,load};
})();
