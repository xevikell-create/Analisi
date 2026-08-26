/* Radar de oportunidades V2 — módulo funcional */
(function(){
  function boot(){
    if(typeof pages==='undefined'||typeof data==='undefined'||typeof rows!=='function'||typeof total!=='function'||typeof money!=='function'||typeof pct!=='function'||typeof num!=='function'||typeof esc!=='function'||typeof save!=='function'){
      setTimeout(boot,100);return;
    }

    const cfg=()=>data.radarConfig||{targets:{},watchlist:[]};
    function ensure(){if(!data.radarConfig)data.radarConfig={targets:{},watchlist:[]};return data.radarConfig}
    function score(r){
      const t=Math.max(1,total());
      const weight=Number(r.valueEUR||0)/t;
      let s=45;
      const ret=Number(r.returnPct||0);
      if(ret<=-.25)s+=25; else if(ret<=-.15)s+=18; else if(ret<=-.10)s+=12; else if(ret<0)s+=6;
      if(weight<.025)s+=12; else if(weight<.05)s+=7; else if(weight>.25)s-=22; else if(weight>.15)s-=10;
      if(r.core)s+=12;
      const target=Number(cfg().targets?.[r.name]);
      const price=Number(r.quote);
      if(target>0&&price>0){const gap=target/price-1;if(gap>=.20)s+=15;else if(gap>=.10)s+=9;else if(gap<0)s-=12}
      return Math.max(0,Math.min(100,Math.round(s)));
    }
    function label(s){return s>=75?'OPORTUNIDAD':s>=58?'VIGILAR':'ESPERAR'}
    function renderRadar(){
      const c=ensure();
      const rs=rows().filter(r=>Number(r.valueEUR)>0).map(r=>({...r,weight:Number(r.valueEUR||0)/Math.max(1,total())})).map(r=>({...r,score:score(r)})).sort((a,b)=>b.score-a.score);
      const opportunities=rs.filter(r=>r.score>=75);
      const watch=rs.filter(r=>r.score>=58&&r.score<75);
      document.getElementById('app').innerHTML=`
        <h2>🔎 Radar de oportunidades</h2>
        <div class="grid section">
          <div class="card"><span class="muted">Oportunidades</span><div class="kpi">${opportunities.length}</div><span class="small">Score ≥ 75</span></div>
          <div class="card"><span class="muted">En vigilancia</span><div class="kpi">${watch.length}</div><span class="small">Score 58–74</span></div>
          <div class="card"><span class="muted">Universo analizado</span><div class="kpi">${rs.length}</div><span class="small">Posiciones con precio</span></div>
        </div>
        <div class="card section">
          <h3>Señales actuales</h3>
          ${rs.length?rs.slice(0,12).map(r=>{const target=Number(c.targets?.[r.name])||0;const gap=target&&r.quote?target/r.quote-1:null;const st=label(r.score);const cls=st==='OPORTUNIDAD'?'green':st==='VIGILAR'?'amber':'red';return `<div class="row"><span><b>${esc(r.name)}</b><br><span class="muted">Peso ${pct(r.weight)} · P/L ${pct(r.returnPct)}${gap!==null?' · Objetivo '+num(target)+' ('+(gap*100).toFixed(1)+'%)':''}</span></span><span style="text-align:right"><span class="badge ${cls}">${st}</span><br><span class="score">${r.score}/100</span></span></div>`}).join(''):'<div class="empty">Sin datos de mercado para analizar.</div>'}
        </div>
        <div class="card section">
          <h3>🎯 Precios objetivo del radar</h3>
          <p class="muted">Define un precio objetivo por activo. El radar premiará descuentos relevantes frente a ese objetivo.</p>
          <div class="form">${rs.map(r=>`<label>${esc(r.name)}<input id="radar-target-${esc(r.name)}" type="number" step="0.0001" value="${Number(c.targets?.[r.name])||''}" placeholder="Precio objetivo"></label>`).join('')}</div>
          <button class="action" style="margin-top:12px" onclick="saveRadarTargets()">💾 Guardar objetivos y recalcular</button>
        </div>
        <div class="card section">
          <h3>Cómo decide el radar</h3>
          <div class="pill"><span>caída / P/L</span><span>peso de cartera</span><span>MSCI World núcleo</span><span>precio objetivo</span><span>concentración</span></div>
          <p class="muted" style="margin-top:12px">No compra automáticamente: identifica dónde merece la pena investigar antes de asignar el próximo euro.</p>
        </div>`;
    }
    window.saveRadarTargets=function(){
      const c=ensure();
      rows().forEach(r=>{const el=document.getElementById('radar-target-'+CSS.escape(r.name));if(el){const v=Number(el.value);if(v>0)c.targets[r.name]=v;else delete c.targets[r.name]}});
      data.radarConfig=c;save();render('radar');
    };
    pages.radar=renderRadar;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
