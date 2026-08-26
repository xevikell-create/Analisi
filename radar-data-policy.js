/* RADAR DATA POLICY V1
   Reliability layer: freshness, provenance, completeness and conflict handling.
   This module never invents missing values. */
(function(){
  const MAX_AGE={price:15*60*1000,fundamental:45*24*60*60*1000,macro:14*24*60*60*1000,news:24*60*60*1000};
  function now(){return Date.now()}
  function ageMs(v){const t=Date.parse(v||'');return Number.isFinite(t)?Math.max(0,now()-t):Infinity}
  function quality(source,updatedAt,type){
    const age=ageMs(updatedAt), max=MAX_AGE[type]||MAX_AGE.fundamental;
    const freshness=Number.isFinite(age)?Math.max(0,Math.min(1,1-age/(max*2))):0;
    const sourceScore={primary:1,institutional:1,licensed:0.98,financial:0.9,secondary:0.7,unknown:0.3}[source||'unknown']||0.3;
    return Math.round(100*(0.55*sourceScore+0.45*freshness));
  }
  function validate(item){
    const fields=Array.isArray(item?.requiredFields)?item.requiredFields:[];
    const missing=fields.filter(k=>item[k]===null||item[k]===undefined||item[k]==='');
    const q=quality(item?.sourceType,item?.updatedAt,item?.dataType);
    const conflict=!!item?.conflict;
    const blocked=missing.length>0||q<55||conflict;
    return {quality:q,missing,conflict,blocked,reason:blocked?(conflict?'Fuentes en conflicto':missing.length?'Datos críticos ausentes':'Datos demasiado antiguos'):'Validado'};
  }
  function aggregate(items){
    const xs=(items||[]).map(validate), n=xs.length||1;
    return {items:xs,coverage:Math.round(100*xs.filter(x=>!x.blocked).length/n),averageQuality:Math.round(xs.reduce((a,x)=>a+x.quality,0)/n),blocked:xs.filter(x=>x.blocked).length};
  }
  window.RadarDataPolicy={version:'1.0.0',MAX_AGE,quality,validate,aggregate};
})();
