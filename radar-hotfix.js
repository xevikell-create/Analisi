/* RADAR HOTFIX 2026-08-27 — forces deterministic render from validated snapshot */
(function(){
  function boot(){
    if(typeof pages==='undefined'||!window.RadarDataAdapterV1||!window.RadarIntelligenceV5||!window.RadarUniverseV1){setTimeout(boot,100);return;}
    pages.radar=async function(){
      const app=document.getElementById('app');
      app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Analizando mercado, fundamentales, valoración, riesgo y encaje con tu cartera…</p></div>';
      try{
        const rs=typeof rows==='function'?rows().filter(r=>Number(r.valueEUR)>0):[];
        const t=Math.max(1,typeof total==='function'?Number(total()):0);
        const prep=await RadarDataAdapterV1.prepare(RadarUniverseV1.candidates,rs,t);
        const ranked=RadarIntelligenceV5.rank(prep.candidates||[],prep.ctx||{},prep.macro||null,prep.news||{});
        const valid=ranked.filter(x=>x.radar&&x.radar.action!=='DATOS_INSUFICIENTES');
        const opp=valid.filter(x=>x.radar.action==='OPORTUNIDAD');
        const watch=valid.filter(x=>x.radar.action==='VIGILAR');
        const pending=ranked.filter(x=>x.radar.action==='DATOS_INSUFICIENTES');
        const first=opp[0]||watch[0]||null;
        const fmt=x=>typeof money==='function'?money(x):new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x);
        const esc2=s=>typeof esc==='function'?esc(s):String(s??'');
        const item=x=>{const r=x.radar||{};const cls=r.action==='OPORTUNIDAD'?'green':r.action==='VIGILAR'?'amber':'red';return `<div class="row"><span><b>${esc2(x.name)}</b><br><span class="muted">${r.action} · confianza ${r.confidence}% · datos ${r.dataQuality}%</span></span><span class="badge ${cls}">${r.score}/100</span></div>`};
        app.innerHTML=`<div class="radar-head"><div><span class="radar-eyebrow">RADAR OPERATIVO · AUDITADO</span><h2>🔎 Radar</h2><p>Oportunidades reales con datos suficientes. Sin inventar datos faltantes.</p></div></div>
          <div class="radar-stats"><div><b>${opp.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${pending.length}</b><span>Datos pendientes</span></div></div>
          <div class="card hero"><span class="badge">PRÓXIMO EURO</span><h2>${first?esc2(first.name):'Ninguna señal validada'}</h2><div class="kpi">${first?first.radar.score+'/100':'—'}</div><p>${first?'Señal priorizada por equilibrio entre fundamentales, valoración, crecimiento, riesgo, macro y diversificación.':'No se fuerza ninguna compra: faltan señales que superen el umbral de oportunidad.'}</p></div>
          <div class="card section"><h3>🏆 Ranking</h3>${valid.slice(0,10).map(item).join('')||'<div class="empty">Sin candidatos con datos suficientes.</div>'}</div>
          <div class="card section"><h3>🛡️ Auditoría de datos</h3><div class="row"><span>Candidatos analizados</span><b>${ranked.length}</b></div><div class="row"><span>Precios cubiertos</span><b>${Math.round((prep.coverage||0)*100)}%</b></div><div class="row"><span>Snapshot fundamental</span><b>${prep.snapshot?.updatedAt?esc2(prep.snapshot.updatedAt):'No disponible'}</b></div><p class="muted">Los activos con información crítica insuficiente quedan bloqueados como oportunidad.</p></div>`;
      }catch(e){console.error('Radar hotfix',e);app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="negative">No se ha podido completar el análisis.</p><p class="muted">El motor no ha inventado datos ni ha mostrado señales falsas.</p></div>';}
    };
    if(typeof current!=='undefined'&&current==='radar')pages.radar();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
