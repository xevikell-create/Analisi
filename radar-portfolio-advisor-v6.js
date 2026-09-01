/* RADAR PORTFOLIO ADVISOR V6 — cartera-aware: oportunidad + encaje patrimonial */
(function(){
  'use strict';
  const VERSION='6.0.0';
  const DATA='./radar-data.json?advisor_v6='+Date.now();
  const clamp=x=>Math.max(0,Math.min(100,Number(x)||0));
  const n=x=>Number.isFinite(Number(x))?Number(x):null;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const sectorMap={
    'AMD':'IA/semiconductores','NVIDIA':'IA/semiconductores','First Solar':'Energía/solar','Next Era Energy':'Utilities/energía','Meta':'Tecnología/comunicación','Palantir':'IA/software','Apple':'Tecnología','Amazon':'Consumo/tecnología','Netflix':'Consumo/comunicación','BYD':'Industriales/automoción','Toyota':'Industriales/automoción','Caixa banc':'Bancos','MSCI World Acc':'Renta variable global','S&P 500 ETF':'Renta variable USA'
  };
  const themeMap={
    'IA/semiconductores':'IA','Tecnología':'Tecnología','Tecnología/comunicación':'Tecnología','IA/software':'IA','Bancos':'Bancos','Consumo/tecnología':'Consumo','Consumo/comunicación':'Consumo','Consumo':'Consumo','Industriales/automoción':'Industriales','Energía/solar':'Energía','Utilities/energía':'Energía','Renta variable global':'Global','Renta variable USA':'USA'
  };
  const targets={
    'IA':0.12,'Tecnología':0.20,'Bancos':0.10,'Consumo':0.12,'Industriales':0.12,'Energía':0.08,'Salud':0.08,'Global':0.35,'USA':0.35
  };
  function classify(a){return a.sector||sectorMap[a.ticker]||sectorMap[a.name]||'Otros';}
  function theme(a){const s=classify(a);return themeMap[s]||s;}
  function loadPortfolio(){
    let raw={};try{raw=JSON.parse(localStorage.getItem('patrimonio_positions_overrides')||'{}')}catch{}
    const ps=(window.V4Portfolio&&Array.isArray(window.V4Portfolio.positions))?window.V4Portfolio.positions:[];
    const out=ps.map(p=>({...p,...(raw[p.name]||{})}));
    const assets=out.map(p=>({name:p.name,ticker:p.ticker||p.name,quantity:n(p.quantity)||0,averageCost:n(p.averageCost)||0,valueEUR:n(p.valueEUR)||0,sector:p.sector||sectorMap[p.name]||'Otros'}));
    return assets;
  }
  function allocation(portfolio){
    const t=portfolio.reduce((s,p)=>s+(n(p.valueEUR)||0),0)||1, sectors={},themes={};
    portfolio.forEach(p=>{const w=(n(p.valueEUR)||0)/t;const s=p.sector||'Otros';const th=theme(p);sectors[s]=(sectors[s]||0)+w;themes[th]=(themes[th]||0)+w});
    return {total:t,sectors,themes};
  }
  function baseOpportunity(a){
    const vals=[];
    if(n(a.revenueGrowth)!==null)vals.push(clamp(50+n(a.revenueGrowth)*1.3));
    if(n(a.epsGrowth)!==null)vals.push(clamp(50+n(a.epsGrowth)*.7));
    if(n(a.roe)!==null)vals.push(clamp(n(a.roe)/35*100));
    if(n(a.roic)!==null)vals.push(clamp(n(a.roic)/30*100));
    if(n(a.operatingMargin)!==null)vals.push(clamp(n(a.operatingMargin)/35*100));
    if(n(a.debtToEbitda)!==null)vals.push(clamp(100-n(a.debtToEbitda)*18));
    if(n(a.pe)!==null)vals.push(clamp(100-Math.max(0,n(a.pe)-10)*2.2));
    if(n(a.fcfMargin)!==null)vals.push(clamp(50+n(a.fcfMargin)*2));
    return vals.length?vals.reduce((x,y)=>x+y,0)/vals.length:50;
  }
  function fitScore(a,alloc){
    const th=theme(a), w=alloc.themes[th]||0, target=targets[th]??0.08;
    let s=75;
    if(w>target*1.75)s-=32; else if(w>target*1.35)s-=20; else if(w>target*1.10)s-=10;
    else if(w<target*.45)s+=18; else if(w<target*.70)s+=10;
    // Direct position concentration
    const direct=alloc.total?((loadPortfolio().find(p=>(p.ticker||p.name)===(a.ticker||a.name))?.valueEUR||0)/alloc.total):0;
    if(direct>.10)s-=25; else if(direct>.07)s-=12;
    // Core ETF receives a structural bonus when portfolio is concentrated
    if((a.ticker||a.name)==='MSCI World Acc'){
      const tech=alloc.themes['Tecnología']||0, ia=alloc.themes['IA']||0;
      if(tech+ia>.30)s+=12;
    }
    return clamp(s);
  }
  function overlapPenalty(a,alloc){
    const th=theme(a),w=alloc.themes[th]||0,target=targets[th]??.08;
    return w>target*1.75?20:w>target*1.35?12:w>target*1.10?6:0;
  }
  function confidence(a){
    const keys=['price','revenueGrowth','epsGrowth','roe','roic','operatingMargin','debtToEbitda','pe','fcfMargin'];
    const available=keys.filter(k=>n(a[k])!==null).length;
    return {available,score:clamp(45+available*6)};
  }
  function analyse(a,alloc){
    const opp=baseOpportunity(a),fit=fitScore(a,alloc),riskPenalty=overlapPenalty(a,alloc),c=confidence(a);
    const final=clamp(opp*.55+fit*.45-riskPenalty);
    let action=final>=82&&c.score>=75?'COMPRAR':final>=74?'VIGILAR':'ESPERAR';
    if(fit<45)action='EVITAR AUMENTAR';
    return {...a,sector:classify(a),theme:theme(a),opportunity:Math.round(opp),fit:Math.round(fit),score:Math.round(final),confidence:Math.round(c.score),metrics:c.available,action,overlapPenalty:riskPenalty,currentThemeWeight:alloc.themes[theme(a)]||0,targetThemeWeight:targets[theme(a)]??.08};
  }
  function render(list,alloc,assets){
    const app=document.getElementById('app');if(!app)return;
    const ranked=list.sort((a,b)=>b.score-a.score),best=ranked[0];
    const thRows=Object.entries(alloc.themes).sort((a,b)=>b[1]-a[1]).map(([k,w])=>{const target=targets[k];const over=target&&w>target*1.35;return `<div class="row"><span><b>${esc(k)}</b><br><span class="muted">Actual ${(w*100).toFixed(1)}% · objetivo ${target?(target*100).toFixed(0)+'%':'sin objetivo'}</span></span><span class="badge ${over?'red':target&&w<target*.7?'amber':'green'}">${over?'SOBREPESO':target&&w<target*.7?'INFRAPESO':'OK'}</span></div>`}).join('');
    const rows=ranked.map((a,i)=>`<div class="row"><span><b>${i+1}. ${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.theme)} · oportunidad ${a.opportunity} · encaje ${a.fit} · ${a.metrics} datos</span></span><span class="badge ${a.action==='COMPRAR'?'green':a.action==='ESPERAR'?'amber':'red'}">${a.score}/100</span></div>`).join('');
    app.innerHTML=`<h2>🔎 Radar · Asesor V6</h2><p class="muted">No busca solo acciones buenas: busca acciones que mejoren tu cartera.</p>
    <div class="card hero"><span class="badge">¿DÓNDE PONGO EL PRÓXIMO EURO?</span><h2>${best?esc(best.name||best.ticker):'ESPERAR'}</h2><div class="kpi">${best?best.score+'/100':'—'}</div><p>${best?`Oportunidad ${best.opportunity}/100 · encaje con cartera ${best.fit}/100 · confianza ${best.confidence}/100.`:'Sin datos suficientes.'}</p><p class="small">${best?`Sector/factor: ${esc(best.theme)} · peso actual ${(best.currentThemeWeight*100).toFixed(1)}% · objetivo ${(best.targetThemeWeight*100).toFixed(0)}%.`:''}</p></div>
    <div class="grid section"><div class="card"><b>Activos recibidos</b><div class="kpi">${assets.length}</div></div><div class="card"><b>Analizados</b><div class="kpi">${ranked.length}</div></div><div class="card"><b>Mejor encaje</b><div class="kpi">${best?best.fit:'—'}</div></div></div>
    <div class="two"><div class="card"><h3>🏆 Ranking cartera-aware</h3>${rows||'<div class="empty">No hay activos válidos.</div>'}</div><div class="card"><h3>🧭 Concentración temática</h3>${thRows||'<div class="empty">Sin posiciones clasificadas.</div>'}</div></div>
    <div class="card section"><h3>Cómo decide</h3><div class="pill"><span>55% calidad/oportunidad</span><span>45% encaje cartera</span><span>penalización concentración</span><span>riesgo de posición</span><span>diversificación</span></div><p class="muted">La recomendación puede cambiar aunque una empresa tenga buenas métricas: si ya tienes demasiado peso en su sector/factor, el asesor reduce su prioridad.</p></div>`;
  }
  async function run(){
    const app=document.getElementById('app');if(!app)return;
    app.innerHTML='<div class="card"><h2>🔎 Radar · Asesor V6</h2><p class="muted">Calculando oportunidad, concentración y encaje con tu cartera…</p></div>';
    try{const r=await fetch(DATA,{cache:'no-store'});if(!r.ok)throw Error('radar-data.json HTTP '+r.status);const d=await r.json();const assets=Object.values(d.assets||{});const port=loadPortfolio();const alloc=allocation(port);const list=assets.filter(a=>n(a.price)>0).map(a=>analyse(a,alloc));render(list,alloc,assets);}catch(e){console.error('Radar Advisor V6',e);app.innerHTML=`<div class="card"><h2>🔎 Radar</h2><p class="negative"><b>Error al analizar el Radar</b></p><p class="muted">${esc(e.message||e)}</p><button class="action" onclick="location.reload()">Reintentar</button></div>`}}
  function install(){
    const old=window.setPage;if(typeof old==='function'&&!window.__radarAdvisorV6){window.setPage=function(p){old(p);if(p==='radar')setTimeout(run,25)};window.__radarAdvisorV6=true;}
    document.addEventListener('click',e=>{if(e.target.closest?.('button[data-p="radar"]'))setTimeout(run,25)},true);
    if(typeof current!=='undefined'&&current==='radar')run();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.RadarPortfolioAdvisorV6={VERSION,run,targets};
})();
