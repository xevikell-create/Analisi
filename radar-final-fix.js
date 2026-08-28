/* RADAR FINAL FIX V3 — 2026-08-28
   Source of truth: radar-data.json. Never allow an empty Radar when validated priced assets exist. */
(function(){
  const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Number(n):0));
  const esc2=s=>typeof esc==='function'?esc(s):String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  async function json(path){try{const r=await fetch(path+'?radar='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){console.error('Radar data',e);return null}}
  function score(a,heldWeight=0){
    const growth=clamp(50+(Number(a.revenueGrowth)||0)*1.3)*.22;
    const eps=clamp(50+(Number(a.epsGrowth)||0)*.7)*.14;
    const quality=clamp(((Number(a.roe)||0)/35)*35+((Number(a.roic)||0)/30)*35+((Number(a.operatingMargin)||0)/35)*30)*.22;
    const balance=clamp(100-(Number(a.debtToEbitda)||0)*18)*.12;
    const valuation=clamp(100-(Math.max(0,(Number(a.pe)||30)-10))*2.2)*.15;
    const fcf=clamp(50+(Number(a.fcfMargin)||0)*2)*.05;
    const diversification=heldWeight>.10?35:heldWeight>.07?55:heldWeight<.02?85:72;
    const final=clamp(growth+eps+quality+balance+valuation+fcf+diversification*.10);
    const action=final>=78?'OPORTUNIDAD':final>=62?'VIGILAR':'ESPERAR';
    return {score:Math.round(final),action,dataQuality:Math.round(Number(a.completeness)||0),confidence:Math.round(clamp((Number(a.completeness)||0)*.75+25))};
  }
  async function renderRadar(){
    const app=document.getElementById('app');if(!app)return;
    app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Cargando oportunidades y validando datos…</p></div>';
    const rd=await json('./radar-data.json');
    const md=await json('./market-data.json');
    const assets=rd?.assets||{};
    const quotes=md?.quotes||{};
    let totalValue=0,held={};
    try{if(typeof rows==='function')rows().forEach(r=>{held[r.name]=Number(r.valueEUR)||0});if(typeof total==='function')totalValue=Number(total())||0}catch(e){}
    const list=Object.values(assets).map(a=>{
      const q=quotes[a.ticker]||quotes[a.name];
      const x={...a};
      if((!Number.isFinite(Number(x.price))||Number(x.price)<=0)&&Number.isFinite(Number(q?.price)))x.price=Number(q.price);
      if(!x.currency&&q?.currency)x.currency=q.currency;
      const hw=totalValue?Number(held[x.name]||0)/totalValue:0;
      return {...x,radar:score(x,hw)};
    }).filter(x=>Number.isFinite(Number(x.price))&&Number(x.price)>0&&Number(x.completeness||0)>=80)
      .sort((a,b)=>b.radar.score-a.radar.score);
    const opp=list.filter(x=>x.radar.action==='OPORTUNIDAD');
    const watch=list.filter(x=>x.radar.action==='VIGILAR');
    const first=opp[0]||watch[0]||list[0];
    const row=x=>`<div class="row"><span><b>${esc2(x.name)}</b><br><span class="muted">${x.ticker} · ${x.radar.action} · confianza ${x.radar.confidence}% · datos ${x.radar.dataQuality}%</span></span><span class="badge ${x.radar.action==='OPORTUNIDAD'?'green':x.radar.action==='VIGILAR'?'amber':'red'}">${x.radar.score}/100</span></div>`;
    app.innerHTML=`<h2>🔎 Radar</h2><p class="muted">Radar operativo · mercado + fundamentales + valoración + calidad + riesgo + encaje de cartera.</p>
      <div class="radar-stats"><div><b>${opp.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${list.length}</b><span>Activos validados</span></div></div>
      <div class="card hero"><span class="badge">PRÓXIMO EURO</span><h2>${first?esc2(first.name):'Esperar'}</h2><div class="kpi">${first?first.radar.score+'/100':'—'}</div><p>${first?first.radar.action+' · señal priorizada por el Radar.':'No hay datos de mercado validados todavía.'}</p></div>
      <div class="card section"><h3>🏆 Ranking</h3>${list.map(row).join('')||'<div class="empty">No hay activos validados.</div>'}</div>
      <div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Fundamentales disponibles</span><b>${Object.keys(assets).length}</b></div><div class="row"><span>Activos con precio válido</span><b>${list.length}</b></div><div class="row"><span>Oportunidades ≥78</span><b>${opp.length}</b></div><div class="row"><span>Última actualización</span><b>${esc2(rd?.updatedAt||'—')}</b></div></div>`;
  }
  function boot(){if(typeof pages==='undefined'){setTimeout(boot,100);return;}pages.radar=renderRadar;if(typeof current!=='undefined'&&current==='radar')renderRadar();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
