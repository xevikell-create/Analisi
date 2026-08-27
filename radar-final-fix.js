/* RADAR FINAL FIX 2026-08-27 — guaranteed visible ranking from validated snapshot */
(function(){
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number(n)||0));
 const esc2=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
 async function json(path){try{const r=await fetch(path+'?ts='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){return null}}
 function score(a,heldWeight=0){
  const growth=clamp(50+(Number(a.revenueGrowth)||0)*1.3)*.22;
  const eps=clamp(50+(Number(a.epsGrowth)||0)*.7)*.14;
  const quality=clamp(((Number(a.roe)||0)/35)*35+((Number(a.roic)||0)/30)*35+((Number(a.operatingMargin)||0)/35)*30)*.22;
  const balance=clamp(100-(Number(a.debtToEbitda)||0)*18)*.12;
  const valuation=clamp(100-(Number(a.pe)||30-15)*2.2)*.15;
  const fcf=clamp(50+(Number(a.fcfMargin)||0)*2)*.05;
  const diversification=heldWeight>.10?35:heldWeight>.07?55:heldWeight<.02?85:72;
  const final=clamp(growth+eps+quality+balance+valuation+fcf+diversification*.10);
  const action=final>=78?'OPORTUNIDAD':final>=62?'VIGILAR':'ESPERAR';
  return {score:Math.round(final),action,dataQuality:Math.round(Number(a.completeness)||0),confidence:Math.round(clamp((Number(a.completeness)||0)*.75+25))};
 }
 async function renderRadar(){
  const app=document.getElementById('app'); if(!app)return;
  app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Cargando oportunidades y validando datos…</p></div>';
  const [rd,md]=await Promise.all([json('./radar-data.json'),json('./market-data.json')]);
  const assets=rd?.assets||{}; const quotes=md?.quotes||{};
  const universe=window.RadarUniverseV1?.candidates||Object.values(assets);
  const held={};
  try{(typeof rows==='function'?rows():[]).forEach(r=>held[r.name]=Number(r.valueEUR)||0)}catch(e){}
  let totalValue=0;try{totalValue=typeof total==='function'?Number(total())||0:0}catch(e){}
  const list=universe.map(c=>{const a={...(assets[c.ticker]||{}),...c};const q=quotes[c.name]||quotes[c.ticker]||quotes[a.name];if(a.price==null&&q?.price!=null)a.price=q.price;if(a.currency==null&&q?.currency)a.currency=q.currency;const hw=totalValue?Number(held[a.name]||0)/totalValue:0;return {...a,radar:score(a,hw)}}).filter(x=>Number.isFinite(Number(x.price))&&Number(x.price)>0).sort((a,b)=>b.radar.score-a.radar.score);
  const opp=list.filter(x=>x.radar.action==='OPORTUNIDAD'); const watch=list.filter(x=>x.radar.action==='VIGILAR');
  const first=opp[0]||watch[0]||list[0];
  const row=x=>`<div class="row"><span><b>${esc2(x.name)}</b><br><span class="muted">${x.radar.action} · confianza ${x.radar.confidence}% · datos ${x.radar.dataQuality}%</span></span><span class="badge ${x.radar.action==='OPORTUNIDAD'?'green':x.radar.action==='VIGILAR'?'amber':'red'}">${x.radar.score}/100</span></div>`;
  app.innerHTML=`<h2>🔎 Radar</h2><p class="muted">Radar operativo · ranking de oportunidades con datos disponibles y encaje patrimonial.</p>
  <div class="radar-stats"><div><b>${opp.length}</b><span>Oportunidades</span></div><div><b>${watch.length}</b><span>En vigilancia</span></div><div><b>${list.length}</b><span>Activos con precio</span></div></div>
  <div class="card hero"><span class="badge">PRÓXIMO EURO</span><h2>${first?esc2(first.name):'Esperar'}</h2><div class="kpi">${first?first.radar.score+'/100':'—'}</div><p>${first?first.radar.action+' · señal priorizada por el Radar.':'Sin datos suficientes.'}</p></div>
  <div class="card section"><h3>🏆 Ranking</h3>${list.slice(0,15).map(row).join('')||'<div class="empty">Sin activos con precio.</div>'}</div>
  <div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Datos fundamentales validados</span><b>${Object.keys(assets).length}</b></div><div class="row"><span>Precios de mercado</span><b>${list.length}</b></div><div class="row"><span>Fuente de precios</span><b>${esc2(md?.provider||'snapshot')}</b></div><div class="row"><span>Última actualización</span><b>${esc2(md?.updatedAt||rd?.updatedAt||'—')}</b></div></div>`;
 }
 function boot(){if(typeof pages==='undefined'){setTimeout(boot,100);return}pages.radar=renderRadar;if(typeof current!=='undefined'&&current==='radar')renderRadar()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
