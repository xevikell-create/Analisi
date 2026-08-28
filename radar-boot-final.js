/* RADAR BOOT FINAL — deterministic renderer, last in script order */
(function(){
  async function render(){
    const app=document.getElementById('app'); if(!app)return;
    app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Cargando oportunidades…</p></div>';
    try{
      const r=await fetch('./radar-data.json?final='+Date.now(),{cache:'no-store'});
      if(!r.ok)throw new Error('radar-data.json '+r.status);
      const data=await r.json();
      const assets=Object.values(data.assets||{}).filter(a=>Number(a.price)>0);
      const score=a=>{
        const n=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
        const growth=Math.max(0,Math.min(100,50+n(a.revenueGrowth,0)*1.3))*0.22;
        const eps=Math.max(0,Math.min(100,50+n(a.epsGrowth,0)*0.7))*0.14;
        const quality=Math.max(0,Math.min(100,(n(a.roe,0)/35)*35+(n(a.roic,0)/30)*35+(n(a.operatingMargin,0)/35)*30))*0.22;
        const balance=Math.max(0,Math.min(100,100-n(a.debtToEbitda,0)*18))*0.12;
        const valuation=Math.max(0,Math.min(100,100-(Math.max(0,n(a.pe,30)-10))*2.2))*0.15;
        const fcf=Math.max(0,Math.min(100,50+n(a.fcfMargin,0)*2))*0.05;
        return Math.round(Math.max(0,Math.min(100,growth+eps+quality+balance+valuation+fcf+7)));
      };
      const list=assets.map(a=>({...a,radarScore:score(a)})).sort((a,b)=>b.radarScore-a.radarScore);
      const opp=list.filter(a=>a.radarScore>=78), watch=list.filter(a=>a.radarScore>=62&&a.radarScore<78), first=opp[0]||watch[0]||list[0];
      const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
      const row=a=>`<div class="row"><span><b>${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.ticker)} · ${a.radarScore>=78?'OPORTUNIDAD':a.radarScore>=62?'VIGILAR':'ESPERAR'} · datos ${Number(a.completeness)||0}%</span></span><span class="badge ${a.radarScore>=78?'green':a.radarScore>=62?'amber':'red'}">${a.radarScore}/100</span></div>`;
      app.innerHTML=`<h2>🔎 Radar</h2><p class="muted">Radar operativo · mercado + fundamentales + valoración + calidad + riesgo.</p><div class="radar-stats"><div><b>${opp.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${list.length}</b><span>Activos validados</span></div></div><div class="card hero"><span class="badge">PRÓXIMO EURO</span><h2>${first?esc(first.name||first.ticker):'Esperar'}</h2><div class="kpi">${first?first.radarScore+'/100':'—'}</div><p>${first?'Señal priorizada por el Radar.':'No hay datos validados.'}</p></div><div class="card section"><h3>🏆 Ranking</h3>${list.map(row).join('')||'<div class="empty">No hay activos validados.</div>'}</div><div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Datos recibidos</span><b>${Object.keys(data.assets||{}).length}</b></div><div class="row"><span>Precios válidos</span><b>${list.length}</b></div><div class="row"><span>Actualización</span><b>${esc(data.updatedAt||'—')}</b></div></div>`;
    }catch(e){console.error(e);app.innerHTML=`<div class="card"><h2>🔎 Radar</h2><p class="negative"><b>No se han podido cargar los datos del Radar.</b></p><p class="muted">${String(e.message||e)}</p><button class="action" onclick="location.reload()">Reintentar</button></div>`;}
  }
  function boot(){if(typeof pages==='undefined'){setTimeout(boot,100);return;}pages.radar=render;if(typeof current!=='undefined'&&current==='radar')render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
