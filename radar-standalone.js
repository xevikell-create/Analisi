/* RADAR STANDALONE V4 — independent Radar with partial-data scoring and confidence. */
(function(){
  const DATA='./radar-data.json?radar_v4='+Date.now();
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const clamp=x=>Math.max(0,Math.min(100,x));
  function metricScore(a,k){const v=n(a[k]);if(v===null)return null;
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
  const KEYS=['revenueGrowth','epsGrowth','roe','roic','operatingMargin','debtToEbitda','pe','fcfMargin'];
  function analyse(a){
    if(n(a.price)===null||n(a.price)<=0)return null;
    const weights={revenueGrowth:.22,epsGrowth:.14,roe:.10,roic:.12,operatingMargin:.10,debtToEbitda:.10,pe:.14,fcfMargin:.08};
    let total=0,ws=0,available=0;
    KEYS.forEach(k=>{const s=metricScore(a,k);if(s!==null){total+=s*weights[k];ws+=weights[k];available++}});
    if(!available)return null;
    let score=total/ws;
    // Do not manufacture a strong signal from sparse data.
    const completeness=Math.round(available/KEYS.length*100);
    if(available<4)score=Math.min(score,69);
    else if(available<6)score=Math.min(score,79);
    const confidence=available>=7?'ALTA':available>=5?'MEDIA':'BAJA';
    return {...a,radarScore:Math.round(score),completeness,confidence,metricsAvailable:available};
  }
  async function render(){
    const app=document.getElementById('app');if(!app)return;
    app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Analizando oportunidades…</p></div>';
    try{
      const r=await fetch(DATA,{cache:'no-store'});if(!r.ok)throw new Error('radar-data.json HTTP '+r.status);
      const d=await r.json();const all=Object.values(d.assets||{});const analysed=all.map(analyse).filter(Boolean).sort((a,b)=>b.radarScore-a.radarScore);
      const opportunities=analysed.filter(a=>a.radarScore>=75&&a.metricsAvailable>=6);
      const watch=analysed.filter(a=>a.radarScore>=60&&!opportunities.includes(a));
      const pending=all.filter(a=>n(a.price)>0&&!analyse(a));const best=opportunities[0]||analysed[0];
      const rows=analysed.map((a,i)=>`<div class="row"><span><b>${i+1}. ${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.ticker)} · ${a.radarScore>=75&&a.metricsAvailable>=6?'OPORTUNIDAD':a.radarScore>=60?'VIGILAR':'ESPERAR'} · ${a.completeness}% datos · confianza ${esc(a.confidence)}</span></span><span class="badge ${a.radarScore>=75&&a.metricsAvailable>=6?'green':a.radarScore>=60?'amber':'red'}">${a.radarScore}/100</span></div>`).join('');
      app.innerHTML=`<h2>🔎 Radar</h2><p class="muted">Radar V4 · crecimiento · calidad · valoración · riesgo · sin depender de que todos los campos estén disponibles.</p>
      <div class="radar-stats"><div><b>${opportunities.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${pending.length}</b><span>Datos pendientes</span></div></div>
      <div class="card hero"><span class="badge">¿DÓNDE PONGO EL PRÓXIMO EURO?</span><h2>${best?esc(best.name||best.ticker):'ESPERAR'}</h2><div class="kpi">${best?best.radarScore+'/100':'—'}</div><p>${best?`Mejor señal disponible · confianza ${esc(best.confidence)} · ${best.completeness}% de métricas.`:'No hay datos de mercado válidos.'}</p></div>
      <div class="card section"><h3>🏆 Oportunidades detectadas</h3>${opportunities.length?opportunities.map((a,i)=>`<div class="row"><span><b>${i+1}. ${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.ticker)} · crecimiento ${n(a.revenueGrowth)!==null?esc(a.revenueGrowth)+'%':'—'} · PER ${n(a.pe)!==null?esc(a.pe):'—'} · confianza ${esc(a.confidence)}</span></span><span class="badge green">${a.radarScore}/100</span></div>`).join(''):'<div class="empty">No hay señales de alta calidad ahora mismo. Consulta el ranking y vigilancia.</div>'}</div>
      <div class="card section"><h3>📊 Ranking completo</h3>${rows||'<div class="empty">No hay activos con precio disponible.</div>'}</div>
      <div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Activos recibidos</span><b>${all.length}</b></div><div class="row"><span>Con precio</span><b>${all.filter(a=>n(a.price)>0).length}</b></div><div class="row"><span>Analizados</span><b>${analysed.length}</b></div><div class="row"><span>Oportunidad mínima</span><b>75/100 + ≥6 métricas</b></div><div class="row"><span>Última actualización</span><b>${esc(d.updatedAt||'—')}</b></div><div class="row"><span>Motor</span><b class="positive">STANDALONE V4</b></div></div>`;
    }catch(e){console.error('Radar V4',e);app.innerHTML=`<div class="card"><h2>🔎 Radar</h2><p class="negative"><b>Error de datos del Radar</b></p><p class="muted">${esc(e.message||e)}</p><button class="action" onclick="location.reload()">Reintentar</button></div>`}
  }
  function boot(){if(typeof pages==='undefined'){setTimeout(boot,50);return}pages.radar=render;if(typeof current!=='undefined'&&current==='radar')render()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
