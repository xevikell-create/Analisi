/* RADAR V7 — resilient renderer: never leaves Radar blank on data/network errors */
(function(){
  const VERSION='20260827-1';
  const withTimeout=(p,ms=8000)=>Promise.race([Promise.resolve(p),new Promise((_,rej)=>setTimeout(()=>rej(new Error('TIMEOUT')),ms))]);
  function boot(){
    if(typeof pages==='undefined'||typeof rows!=='function'||typeof total!=='function'||typeof money!=='function'||typeof num!=='function'||typeof esc!=='function'||!window.RadarIntelligenceV5||!window.RadarUniverseV1){setTimeout(boot,100);return;}
    async function makeUniverse(){
      const meta={};
      (window.V4Portfolio?.positions||[]).forEach(p=>meta[p.ticker||p.name]=p);
      const held=rows().map(r=>{const p=meta[r.name]||meta[r.ticker]||{};return{...r,ticker:p.ticker||r.ticker||r.name,sector:p.sector,country:p.country,assetType:p.assetType||'stock'}});
      let prepared=null;
      try{if(window.RadarDataAdapterV1?.prepare)prepared=await withTimeout(window.RadarDataAdapterV1.prepare(window.RadarUniverseV1.candidates,held,total()),9000)}catch(e){console.warn('Radar data adapter:',e)}
      const snap=prepared?.snapshot?.assets||{};
      const base=prepared?.candidates||window.RadarUniverseV1.candidates||[];
      return{assets:base.map(a=>({...a,...(snap[a.ticker]||{}),price:a.price??snap[a.ticker]?.price??null,currency:a.currency??snap[a.ticker]?.currency??null,updatedAt:a.updatedAt??snap[a.ticker]?.updatedAt??null,held:!!a.held})),macro:prepared?.macro||null,news:prepared?.news||null,coverage:prepared?.coverage||0,snapshotAgeDays:prepared?.snapshotAgeDays||9999};
    }
    function renderError(message){
      const app=document.getElementById('app');
      if(!app)return;
      app.innerHTML=`<div class="card"><h2>🔎 Radar</h2><div class="badge amber">RADAR ACTIVO</div><p>El módulo está cargado, pero los datos externos no han respondido todavía.</p><p class="muted">${esc(message||'Puedes volver a intentar actualizando precios.')}</p><button class="action" onclick="pages.radar()">🔄 Reintentar Radar</button></div>`;
    }
    pages.radar=async function(){
      const app=document.getElementById('app');
      if(app)app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p>⏳ Analizando oportunidades y validando datos...</p></div>';
      try{
        const rs=rows().filter(r=>Number(r.valueEUR)>0),t=Math.max(1,total()),meta={};
        (window.V4Portfolio?.positions||[]).forEach(p=>meta[p.ticker||p.name]=p);
        const ctx=RadarIntelligenceV5.buildContext(rs.map(r=>{const p=meta[r.name]||meta[r.ticker]||{};return{ticker:p.ticker||r.name,name:r.name,valueEUR:r.valueEUR,sector:p.sector,country:p.country}}),t);
        const data=await makeUniverse();
        const ranked=RadarIntelligenceV5.rank(data.assets,ctx,data.macro,data.news);
        const opp=ranked.filter(x=>x.radar.action==='OPORTUNIDAD'),watch=ranked.filter(x=>x.radar.action==='VIGILAR'),insufficient=ranked.filter(x=>x.radar.action==='DATOS_INSUFICIENTES');
        const top=opp[0]||watch[0]||insufficient[0];
        const climate=opp.length>=3?'FAVORABLE':watch.length>=3?'SELECTIVO':'PRUDENTE';
        app.innerHTML=`<div class="radar-head"><div><span class="radar-eyebrow">INTELLIGENCE CENTER · V7</span><h2>🔎 Radar</h2><p>Mercado global cruzado con tu patrimonio y contexto macro.</p></div><div class="climate ${climate==='FAVORABLE'?'good':climate==='SELECTIVO'?'warn':'care'}">${climate}<small>clima</small></div></div><div class="radar-stats"><div><b>${opp.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>Vigilancia</span></div><div><b>${ranked.length}</b><span>Activos analizados</span></div><div><b>${Math.round(data.coverage*100)}%</b><span>Cobertura de precios</span></div></div><div class="radar-card hero-radar"><div><span class="radar-eyebrow">PRÓXIMO EURO</span><h3>${top?esc(top.name):'Sin señal'}</h3><p>${top?top.radar.action==='DATOS_INSUFICIENTES'?'Datos insuficientes para recomendar.':top.radar.action==='VIGILAR'?'Interesante, pero necesita confirmación.':'Mejor oportunidad validada disponible.':'Sin datos suficientes.'}</p></div><strong>${top?top.radar.score:'—'}<small>/100</small></strong></div><div class="radar-card"><div class="radar-title"><h3>🏆 Mejores oportunidades</h3><span>${opp.length}</span></div>${opp.slice(0,10).map(card).join('')||'<div class="empty">No hay oportunidades validadas todavía.</div>'}</div><div class="radar-card"><div class="radar-title"><h3>👀 Vigilancia y datos pendientes</h3><span>${watch.length+insufficient.length}</span></div>${watch.concat(insufficient).slice(0,12).map(card).join('')||'<div class="empty">Sin señales.</div>'}</div><div class="radar-card"><div class="radar-title"><h3>🌍 Contexto macro</h3><span>${data.macro?.regime||'Sin snapshot'}</span></div><div class="risk-line"><span>Inflación</span><b>${data.macro?.inflation??'—'}%</b></div><div class="risk-line"><span>Presión de tipos</span><b>${data.macro?.ratePressure??'—'}/100</b></div><div class="risk-line"><span>Shock petróleo</span><b>${data.macro?.oilShock??'—'}/100</b></div><div class="risk-line"><span>Riesgo recesión</span><b>${data.macro?.recessionRisk??'—'}/100</b></div><p class="hint">El contexto macro modifica el análisis, pero nunca sustituye los fundamentales.</p></div><div class="radar-card"><div class="radar-title"><h3>🛡️ Seguridad</h3><span>anti-falsas señales</span></div><div class="risk-line"><span>Datos insuficientes</span><b>${insufficient.length}</b></div><div class="risk-line"><span>Snapshot macro</span><b>${data.snapshotAgeDays<2?'ACTUAL':'ANTIGUO'}</b></div><p class="hint">No se convierte un activo en oportunidad cuando faltan datos críticos o confianza suficiente.</p></div>`;
      }catch(e){console.error('Radar render error:',e);renderError(String(e?.message||e));}
    };
    function card(x,i){const r=x.radar||{},cls=r.action==='OPORTUNIDAD'?'good':r.action==='VIGILAR'?'warn':'care';return `<div class="radar-item"><div class="rank">${i+1}</div><div class="radar-main"><b>${esc(x.name)}</b><span>${r.action||'ESPERAR'} · confianza ${r.confidence||0}% · datos ${r.dataQuality||0}% · ${x.price!=null?'precio '+num(x.price):'precio pendiente'}</span></div><div class="radar-score ${cls}">${r.score||0}</div></div>`}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  }
})();
