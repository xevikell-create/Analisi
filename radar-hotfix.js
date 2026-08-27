/* RADAR HOTFIX 2026-08-27 — guaranteed render + fallback diagnostics */
(function(){
 function boot(){
  if(typeof pages==='undefined'||!window.RadarUniverseV1||!window.RadarIntelligenceV5){setTimeout(boot,100);return;}
  pages.radar=async function(){
   const app=document.getElementById('app');
   if(!app)return;
   app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Cargando y validando oportunidades…</p></div>';
   try{
    const rs=typeof rows==='function'?rows().filter(r=>Number(r.valueEUR)>0):[];
    const t=Math.max(1,typeof total==='function'?Number(total()):0);
    let prep={candidates:[],ctx:{},macro:null,news:{},coverage:0,assetData:{assets:{}},snapshot:null};
    if(window.RadarDataAdapterV1?.prepare) prep=await RadarDataAdapterV1.prepare(RadarUniverseV1.candidates,rs,t);
    const candidates=Array.isArray(prep.candidates)?prep.candidates:[];
    const ranked=window.RadarIntelligenceV5.rank(candidates,prep.ctx||{},prep.macro||null,prep.news||{});
    const actionable=ranked.filter(x=>x.radar&&x.radar.action!=='DATOS_INSUFICIENTES');
    const pending=ranked.filter(x=>x.radar?.action==='DATOS_INSUFICIENTES');
    const opp=actionable.filter(x=>x.radar.action==='OPORTUNIDAD');
    const watch=actionable.filter(x=>x.radar.action==='VIGILAR');
    const first=opp[0]||watch[0]||null;
    const esc2=s=>typeof esc==='function'?esc(s):String(s??'');
    const item=x=>{const r=x.radar||{};const cls=r.action==='OPORTUNIDAD'?'green':r.action==='VIGILAR'?'amber':'red';return `<div class="row"><span><b>${esc2(x.name)}</b><br><span class="muted">${r.action||'SIN SEÑAL'} · confianza ${r.confidence??0}% · datos ${r.dataQuality??0}%</span></span><span class="badge ${cls}">${r.score??0}/100</span></div>`};
    const pend=x=>{const r=x.radar||{};return `<div class="row"><span><b>${esc2(x.name)}</b><br><span class="muted">Datos insuficientes para señal</span></span><span class="badge red">${r.dataQuality??0}%</span></div>`};
    app.innerHTML=`<div class="radar-head"><div><span class="radar-eyebrow">RADAR OPERATIVO · V5.1</span><h2>🔎 Radar</h2><p>Analiza mercado, fundamentales, valoración, riesgo y encaje con tu cartera.</p></div></div>
     <div class="radar-stats"><div><b>${opp.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${pending.length}</b><span>Datos pendientes</span></div></div>
     <div class="card hero"><span class="badge">PRÓXIMO EURO</span><h2>${first?esc2(first.name):'Esperar'}</h2><div class="kpi">${first?first.radar.score+'/100':'—'}</div><p>${first?'Señal priorizada por el motor de Radar.':'No se fuerza una compra mientras no haya evidencia suficiente.'}</p></div>
     <div class="card section"><h3>🏆 Ranking analizado</h3>${actionable.slice(0,15).map(item).join('')||'<div class="empty">No hay señales accionables todavía.</div>'}</div>
     <div class="card section"><h3>⏳ En revisión</h3>${pending.slice(0,15).map(pend).join('')||'<div class="empty">Ninguno.</div>'}</div>
     <div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Candidatos</span><b>${ranked.length}</b></div><div class="row"><span>Precios cubiertos</span><b>${Math.round((prep.coverage||0)*100)}%</b></div><div class="row"><span>Fundamentales cargados</span><b>${Object.keys(prep.assetData?.assets||{}).length}</b></div><div class="row"><span>Snapshot</span><b>${prep.snapshot?.updatedAt?esc2(prep.snapshot.updatedAt):'No disponible'}</b></div></div>`;
   }catch(e){console.error('Radar',e);app.innerHTML=`<div class="card"><h2>🔎 Radar</h2><p class="negative"><b>Error controlado del Radar.</b></p><p class="muted">El módulo está cargado pero ha fallado durante el cálculo. Candidatos disponibles: ${window.RadarUniverseV1?.candidates?.length||0}.</p></div>`;}
  };
  if(typeof current!=='undefined'&&current==='radar')pages.radar();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
