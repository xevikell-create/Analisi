/* RADAR GUARANTEED V5 — final navigation/render guard. */
(function(){
  const DATA='./radar-data.json?radar_v5='+Date.now();
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const clamp=x=>Math.max(0,Math.min(100,x));
  const W={revenueGrowth:.22,epsGrowth:.14,roe:.10,roic:.12,operatingMargin:.10,debtToEbitda:.10,pe:.14,fcfMargin:.08};
  function metric(a,k){const v=n(a[k]);if(v===null)return null;
    if(k==='revenueGrowth')return clamp(50+v*1.3);
    if(k==='epsGrowth')return clamp(50+v*.7);
    if(k==='roe')return clamp(v/35*100);
    if(k==='roic')return clamp(v/30*100);
    if(k==='operatingMargin')return clamp(v/35*100);
    if(k==='debtToEbitda')return clamp(100-v*18);
    if(k==='pe')return clamp(100-Math.max(0,v-10)*2.2);
    if(k==='fcfMargin')return clamp(50+v*2);
    return null;
  }
  function analyse(a){
    if(n(a.price)===null||n(a.price)<=0)return null;
    let total=0,ws=0,count=0;
    Object.keys(W).forEach(k=>{const s=metric(a,k);if(s!==null){total+=s*W[k];ws+=W[k];count++}});
    if(!count)return null;
    let score=total/ws;
    if(count<4)score=Math.min(score,69); else if(count<6)score=Math.min(score,79);
    return {...a,radarScore:Math.round(score),metricsAvailable:count,confidence:count>=7?'ALTA':count>=5?'MEDIA':'BAJA'};
  }
  async function render(){
    const app=document.getElementById('app'); if(!app)return;
    app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Analizando oportunidades…</p></div>';
    try{
      const r=await fetch(DATA,{cache:'no-store'}); if(!r.ok)throw new Error('radar-data.json HTTP '+r.status);
      const d=await r.json(); const assets=Object.values(d.assets||{}); const list=assets.map(analyse).filter(Boolean).sort((a,b)=>b.radarScore-a.radarScore);
      const opp=list.filter(a=>a.radarScore>=75&&a.metricsAvailable>=6);
      const watch=list.filter(a=>a.radarScore>=60&&!opp.includes(a));
      const best=opp[0]||watch[0]||list[0];
      const row=a=>`<div class="row"><span><b>${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.ticker)} · ${a.radarScore>=75&&a.metricsAvailable>=6?'OPORTUNIDAD':a.radarScore>=60?'VIGILAR':'ESPERAR'} · ${a.metricsAvailable}/8 métricas · confianza ${esc(a.confidence)}</span></span><span class="badge ${a.radarScore>=75&&a.metricsAvailable>=6?'green':a.radarScore>=60?'amber':'red'}">${a.radarScore}/100</span></div>`;
      app.innerHTML=`<h2>🔎 Radar</h2><p class="muted">Radar V5 · crecimiento · calidad · valoración · riesgo · datos parciales tolerados.</p>
      <div class="radar-stats"><div><b>${opp.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${list.length}</b><span>Analizados</span></div></div>
      <div class="card hero"><span class="badge">¿DÓNDE PONGO EL PRÓXIMO EURO?</span><h2>${best?esc(best.name||best.ticker):'ESPERAR'}</h2><div class="kpi">${best?best.radarScore+'/100':'—'}</div><p>${best?`Señal priorizada · confianza ${esc(best.confidence)} · ${best.metricsAvailable}/8 métricas disponibles.`:'No hay datos válidos.'}</p></div>
      <div class="card section"><h3>🏆 Oportunidades detectadas</h3>${opp.length?opp.map((a,i)=>`<div class="row"><span><b>${i+1}. ${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.ticker)} · crecimiento ${n(a.revenueGrowth)!==null?esc(a.revenueGrowth)+'%':'—'} · PER ${n(a.pe)!==null?esc(a.pe):'—'} · confianza ${esc(a.confidence)}</span></span><span class="badge green">${a.radarScore}/100</span></div>`).join(''):'<div class="empty">No hay señales de alta calidad ahora mismo.</div>'}</div>
      <div class="card section"><h3>📊 Ranking completo</h3>${list.map(row).join('')||'<div class="empty">No hay activos con precio disponible.</div>'}</div>
      <div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Activos recibidos</span><b>${assets.length}</b></div><div class="row"><span>Con precio</span><b>${assets.filter(a=>n(a.price)>0).length}</b></div><div class="row"><span>Analizados</span><b>${list.length}</b></div><div class="row"><span>Umbral oportunidad</span><b>≥75/100 + ≥6 métricas</b></div><div class="row"><span>Última actualización</span><b>${esc(d.updatedAt||'—')}</b></div><div class="row"><span>Motor</span><b class="positive">RADAR V5 · GARANTIZADO</b></div></div>`;
    }catch(e){console.error('Radar V5',e);app.innerHTML=`<div class="card"><h2>🔎 Radar</h2><p class="negative"><b>Error de datos del Radar</b></p><p class="muted">${esc(e.message||e)}</p><button class="action" onclick="location.reload()">Reintentar</button></div>`}
  }
  function install(){
    if(typeof pages!=='undefined')pages.radar=render;
    if(typeof window.setPage==='function'&&!window.__radarGuardInstalled){
      const original=window.setPage;
      window.setPage=function(p){original(p);if(p==='radar')setTimeout(render,0)};
      window.__radarGuardInstalled=true;
    }
    document.addEventListener('click',e=>{const b=e.target.closest?.('button[data-p="radar"]');if(b)setTimeout(render,0)},true);
    if(typeof current!=='undefined'&&current==='radar')render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();

/* V6 loader — portfolio-aware scoring is the final Radar layer. */
(function(){
  const s=document.createElement('script');
  s.src='./radar-portfolio-advisor-v6.js?v=20260901-1';
  s.async=false;
  document.head.appendChild(s);
})();
