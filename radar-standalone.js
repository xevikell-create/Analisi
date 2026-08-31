/* Radar standalone: last-resort renderer. Intentionally independent from every previous Radar engine. */
(function(){
  const DATA='./radar-data.json?standalone='+Date.now();
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  function score(a){
    const growth=clamp(50+num(a.revenueGrowth)*1.3), eps=clamp(50+num(a.epsGrowth)*.7);
    const quality=clamp((num(a.roe)/35)*35+(num(a.roic)/30)*35+(num(a.operatingMargin)/35)*30);
    const balance=clamp(100-num(a.debtToEbitda)*18), valuation=clamp(100-Math.max(0,num(a.pe)-10)*2.2), fcf=clamp(50+num(a.fcfMargin)*2);
    return Math.round(clamp(growth*.22+eps*.14+quality*.22+balance*.12+valuation*.15+fcf*.08+7));
  }
  function valid(a){return num(a.price)>0&&num(a.revenueGrowth)!==null&&num(a.epsGrowth)!==null&&num(a.roe)!==null&&num(a.roic)!==null&&num(a.operatingMargin)!==null&&num(a.debtToEbitda)!==null&&num(a.pe)!==null&&num(a.fcfMargin)!==null&&num(a.completeness)>=85;}
  async function render(){
    const app=document.getElementById('app'); if(!app)return;
    app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Cargando datos del Radar…</p></div>';
    try{
      const r=await fetch(DATA,{cache:'no-store'}); if(!r.ok)throw new Error('radar-data.json HTTP '+r.status);
      const d=await r.json(), all=Object.values(d.assets||{}), validRows=all.filter(valid).map(a=>({...a,radarScore:score(a)})).sort((a,b)=>b.radarScore-a.radarScore);
      const opportunities=validRows.filter(a=>a.radarScore>=78), watch=validRows.filter(a=>a.radarScore>=62&&a.radarScore<78), pending=all.filter(a=>num(a.price)>0&&!valid(a));
      const next=opportunities[0]||watch[0]||validRows[0];
      const action=a=>a.radarScore>=78?'OPORTUNIDAD':a.radarScore>=62?'VIGILAR':'ESPERAR';
      const cls=a=>a.radarScore>=78?'green':a.radarScore>=62?'amber':'red';
      const rows=validRows.map((a,i)=>`<div class="row"><span><b>${i+1}. ${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.ticker)} · ${action(a)} · ${num(a.completeness)||0}% datos</span></span><span class="badge ${cls(a)}">${a.radarScore}/100</span></div>`).join('');
      app.innerHTML=`<h2>🔎 Radar</h2><p class="muted">Motor independiente · fundamentales + valoración + crecimiento + riesgo.</p>
      <div class="radar-stats"><div><b>${opportunities.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${pending.length}</b><span>Datos pendientes</span></div></div>
      <div class="card hero"><span class="badge">¿DÓNDE PONGO EL PRÓXIMO EURO?</span><h2>${next?esc(next.name||next.ticker):'ESPERAR'}</h2><div class="kpi">${next?next.radarScore+'/100':'—'}</div><p>${next?'Mejor señal disponible entre los activos con fundamentales suficientes.':'No hay datos fundamentales suficientes.'}</p></div>
      <div class="card section"><h3>🏆 Ranking validado</h3>${rows||'<div class="empty">Sin activos validados.</div>'}</div>
      <div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Activos recibidos</span><b>${all.length}</b></div><div class="row"><span>Fundamentales validados</span><b>${validRows.length}</b></div><div class="row"><span>Precios disponibles</span><b>${all.filter(a=>num(a.price)>0).length}</b></div><div class="row"><span>Actualización</span><b>${esc(d.updatedAt||'—')}</b></div><div class="row"><span>Estado</span><b class="positive">RADAR OPERATIVO</b></div></div>`;
    }catch(e){console.error('Radar standalone',e);app.innerHTML=`<div class="card"><h2>🔎 Radar</h2><p class="negative"><b>No se pudo cargar el Radar</b></p><p class="muted">${esc(e.message||e)}</p><button class="action" onclick="location.reload()">Reintentar</button></div>`;}
  }
  function boot(){
    if(typeof pages==='undefined'){setTimeout(boot,25);return;}
    pages.radar=render;
    if(typeof current!=='undefined'&&current==='radar')render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
