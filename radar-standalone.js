/* RADAR STANDALONE V3 — Radar is independent from every previous Radar module. */
(function(){
  const DATA='./radar-data.json?radar_v3='+Date.now();
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const score=a=>{const g=Math.max(0,Math.min(100,50+n(a.revenueGrowth)*1.3)),e=Math.max(0,Math.min(100,50+n(a.epsGrowth)*.7)),q=Math.max(0,Math.min(100,(n(a.roe)/35)*35+(n(a.roic)/30)*35+(n(a.operatingMargin)/35)*30)),b=Math.max(0,Math.min(100,100-n(a.debtToEbitda)*18)),v=Math.max(0,Math.min(100,100-Math.max(0,n(a.pe)-10)*2.2)),f=Math.max(0,Math.min(100,50+n(a.fcfMargin)*2));return Math.round(Math.max(0,Math.min(100,g*.22+e*.14+q*.22+b*.12+v*.15+f*.08+7)))};
  const valid=a=>['price','revenueGrowth','epsGrowth','roe','roic','operatingMargin','debtToEbitda','pe','fcfMargin'].every(k=>n(a[k])!==null)&&n(a.price)>0;
  async function render(){
    const app=document.getElementById('app'); if(!app)return;
    app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Analizando oportunidades…</p></div>';
    try{
      const r=await fetch(DATA,{cache:'no-store'}); if(!r.ok)throw new Error('radar-data.json HTTP '+r.status);
      const d=await r.json(); const all=Object.values(d.assets||{});
      const ranked=all.filter(valid).map(a=>({...a,radarScore:score(a)})).sort((a,b)=>b.radarScore-a.radarScore);
      const opportunities=ranked.filter(a=>a.radarScore>=75), watch=ranked.filter(a=>a.radarScore>=60&&a.radarScore<75), pending=all.filter(a=>n(a.price)>0&&!valid(a));
      const best=ranked[0];
      const rows=ranked.map((a,i)=>`<div class="row"><span><b>${i+1}. ${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.ticker)} · ${a.radarScore>=75?'OPORTUNIDAD':a.radarScore>=60?'VIGILAR':'ESPERAR'} · ${esc(a.completeness??'—')}% datos</span></span><span class="badge ${a.radarScore>=75?'green':a.radarScore>=60?'amber':'red'}">${a.radarScore}/100</span></div>`).join('');
      app.innerHTML=`<h2>🔎 Radar</h2><p class="muted">Radar operativo independiente · crecimiento · calidad · valoración · riesgo.</p>
      <div class="radar-stats"><div><b>${opportunities.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${pending.length}</b><span>Datos pendientes</span></div></div>
      <div class="card hero"><span class="badge">¿DÓNDE PONGO EL PRÓXIMO EURO?</span><h2>${best?esc(best.name||best.ticker):'ESPERAR'}</h2><div class="kpi">${best?best.radarScore+'/100':'—'}</div><p>${best?'Mejor señal del universo analizado.':'No hay datos fundamentales válidos.'}</p></div>
      <div class="card section"><h3>🏆 Oportunidades detectadas</h3>${opportunities.length?opportunities.map((a,i)=>`<div class="row"><span><b>${i+1}. ${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.ticker)} · crecimiento ${esc(a.revenueGrowth)}% · PER ${esc(a.pe)}</span></span><span class="badge green">${a.radarScore}/100</span></div>`).join(''):'<div class="empty">No hay oportunidades por encima del umbral actual.</div>'}</div>
      <div class="card section"><h3>📊 Ranking completo</h3>${rows||'<div class="empty">No hay activos con fundamentales completos.</div>'}</div>
      <div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Activos recibidos</span><b>${all.length}</b></div><div class="row"><span>Con precio</span><b>${all.filter(a=>n(a.price)>0).length}</b></div><div class="row"><span>Fundamentales completos</span><b>${ranked.length}</b></div><div class="row"><span>Umbral oportunidad</span><b>75/100</b></div><div class="row"><span>Última actualización</span><b>${esc(d.updatedAt||'—')}</b></div><div class="row"><span>Motor</span><b class="positive">STANDALONE V3</b></div></div>`;
    }catch(e){console.error('Radar V3',e);app.innerHTML=`<div class="card"><h2>🔎 Radar</h2><p class="negative"><b>Error de datos del Radar</b></p><p class="muted">${esc(e.message||e)}</p><button class="action" onclick="location.reload()">Reintentar</button></div>`}
  }
  function boot(){if(typeof pages==='undefined'){setTimeout(boot,50);return} pages.radar=render; if(typeof current!=='undefined'&&current==='radar')render()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
