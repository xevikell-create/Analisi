/* Patrimonial Intelligence Engine V1
   Single source of truth for portfolio-aware scoring, next-euro decisions and goal projections.
   Structural weekly contribution is deliberately separated from tactical capital. */
(function(){
  const VERSION='1.0.0';
  const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number(n)||0));
  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const avg=a=>{const x=a.filter(v=>v!==null&&Number.isFinite(Number(v)));return x.length?x.reduce((s,v)=>s+Number(v),0)/x.length:null};
  const norm=(v,min,max)=>v==null?null:clamp((n(v)-min)/(max-min)*100);
  const annualToWeekly=r=>Math.pow(1+r,1/52)-1;

  function portfolioContext(){
    const rs=(typeof rows==='function'?rows():[]).filter(r=>n(r.valueEUR)>0);
    const t=Math.max(1,typeof total==='function'?n(total()):0);
    const assetWeights={},sectorWeights={},countryWeights={};
    rs.forEach(r=>{
      const w=n(r.valueEUR)/t;
      assetWeights[r.name]=w; assetWeights[r.ticker||r.name]=w;
      if(r.sector)sectorWeights[r.sector]=(sectorWeights[r.sector]||0)+w;
      if(r.country)countryWeights[r.country]=(countryWeights[r.country]||0)+w;
    });
    return {rs,t,assetWeights,sectorWeights,countryWeights};
  }

  function scoreAsset(a,ctx){
    const w=n(ctx.assetWeights[a.name||a.ticker]);
    const valuation=avg([norm(a.marginOfSafety,-30,50),Number.isFinite(Number(a.pe))?clamp(100-(n(a.pe)-8)*2.2):null,Number.isFinite(Number(a.evEbitda))?clamp(100-(n(a.evEbitda)-6)*4):null]);
    const quality=avg([norm(a.roe,0,35),norm(a.roic,0,30),norm(a.operatingMargin,0,35),norm(a.fcfMargin,0,30),norm(a.earningsStability,-30,30)]);
    const growth=avg([norm(a.revenueGrowth,-20,40),norm(a.epsGrowth,-30,50),norm(a.fcfGrowth,-30,50)]);
    const financial=avg([norm(a.debtToEbitda,4,0),norm(a.currentRatio,.5,3),norm(a.interestCoverage,0,20)]);
    const trend=avg([norm(a.return1m,-20,20),norm(a.return6m,-40,60),norm(a.return12m,-50,100)]);
    let diversification=70;
    if(w>.20)diversification-=35; else if(w>.10)diversification-=18; else if(w<.03)diversification+=15;
    if(a.sector){const sw=n(ctx.sectorWeights[a.sector]);if(sw>.25)diversification-=25;else if(sw>.20)diversification-=12;else if(sw<.08)diversification+=8;}
    if(a.country){const cw=n(ctx.countryWeights[a.country]);if(cw>.45)diversification-=20;else if(cw>.35)diversification-=10;}
    diversification=clamp(diversification);
    const risk=avg([norm(a.beta,0.5,1.8),norm(a.volatility,10,45),norm(a.debtToEquity,0,2)])==null?60:clamp(100-avg([norm(a.beta,.5,1.8),norm(a.volatility,10,45),norm(a.debtToEquity,0,2)]));
    const vals={valuation:valuation??60,quality:quality??60,growth:growth??60,financialStrength:financial??60,trend:trend??50,diversification,risk};
    let score=vals.valuation*.30+vals.quality*.20+vals.growth*.15+vals.financialStrength*.10+vals.trend*.05+vals.diversification*.15+vals.risk*.05;
    if(w>.25)score-=25; else if(w>.15)score-=10;
    return {score:Math.round(clamp(score)),components:vals,weight:w};
  }

  function universe(){
    const ctx=portfolioContext(), map=new Map();
    ctx.rs.forEach(r=>map.set(r.name,{...r}));
    const radar=window.RadarDataV1?.assets||{};
    Object.entries(radar).forEach(([ticker,a])=>{
      const name=a.name||ticker;
      map.set(name,{...a,name,ticker});
    });
    return {ctx,assets:[...map.values()]};
  }

  function nextEuro(){
    const {ctx,assets}=universe();
    const candidates=assets.map(a=>{
      const s=scoreAsset(a,ctx);
      const held=n(ctx.assetWeights[a.name||a.ticker]);
      const structural=/msci world/i.test(String(a.name||''));
      // Structural MSCI World contribution is NOT part of this tactical ranking.
      if(structural)return {...a,...s,excludedFromTactical:true,reason:'Aportación estructural separada del capital táctico.'};
      const dataConfidence=n(a.dataQuality,70);
      const final=Math.round(clamp(s.score-(dataConfidence<55?20:0)));
      return {...a,...s,score:final,confidence:Math.round(clamp(dataConfidence*.45+s.score*.55)),heldWeight:held,reason:held>.20?'Concentración elevada; limita nuevas compras.':held<.03?'Posición pequeña o inexistente; mejora la diversificación.':'Buena combinación de valoración, calidad y encaje en cartera.'};
    }).filter(a=>!a.excludedFromTactical).sort((a,b)=>b.score-a.score);
    const winner=candidates[0]||null;
    return {version:VERSION,winner,candidates:candidates.slice(0,10),weeklyContribution:300,structuralAsset:'MSCI World Acc'};
  }

  function project(target,current,weekly,rate){
    target=Math.max(0,n(target));current=Math.max(0,n(current));weekly=Math.max(0,n(weekly));rate=n(rate,0.07);
    if(current>=target)return {years:0,date:new Date(),contributed:0,growth:current-target,final:current};
    const rw=annualToWeekly(rate), months=[]; let v=current, contributed=0, weeks=0;
    while(v<target&&weeks<52*100){v=v*(1+rw)+weekly;contributed+=weekly;weeks++;if(weeks%52===0)months.push(v)}
    const years=weeks/52; const d=new Date();d.setDate(d.getDate()+weeks*7);
    return {years,date:d,contributed,growth:Math.max(0,v-current-contributed),final:v};
  }
  function goal(target,current,weekly){
    return {target:n(target,1000000),current:n(current),weekly:n(weekly,300),scenarios:[4,7,10].map(rate=>({rate, ...project(target,current,weekly,rate/100)}))};
  }

  window.PatrimonialIntelligence={VERSION,portfolioContext,scoreAsset,nextEuro,project,goal};
  window.recommendation=function(){
    const r=nextEuro(),w=r.winner;
    if(!w)return {label:'ESPERAR',text:'No hay suficientes datos para una decisión táctica fiable.'};
    const label=w.score>=80?'COMPRAR':w.score>=68?'REFORZAR':w.score>=55?'ANALIZAR':'ESPERAR';
    return {label,text:`${w.name||w.ticker}: ${w.score}/100 · confianza ${w.confidence}/100. ${w.reason}`};
  };
  const originalObjective=pages.objetivo;
  pages.objetivo=function(){
    const g=goal(data.target,total(),data.weekly||300);
    const f=e=>e.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    document.getElementById('app').innerHTML=`<h2>🎯 Objetivo patrimonial</h2><div class="card hero"><span class="badge">MOTOR DE OBJETIVO V1</span><div class="kpi sensitive">${money(g.current)}</div><p>Objetivo ${money(g.target)} · aportación estructural <b>${money(g.weekly)}/semana</b></p><div class="progress"><div style="width:${Math.min(100,g.current/g.target*100)}%"></div></div><p class="small">La proyección incluye las aportaciones semanales y el interés compuesto.</p></div><div class="grid section">${g.scenarios.map((s,i)=>`<div class="card"><b>${['Conservador','Base','Optimista'][i]}</b><div class="kpi">${s.rate}%</div><p>Objetivo estimado: <b>${f(s.date)}</b></p><p class="small">Aportaciones futuras: ${money(s.contributed)}<br>Rentabilidad proyectada: ${money(s.growth)}</p></div>`).join('')}</div><div class="card section"><h3>Separación estratégica</h3><p>Los ${money(g.weekly)} semanales al MSCI World se consideran <b>aportación estructural</b>. No compiten con la decisión de capital adicional de “¿Dónde pongo el próximo euro?”.</p></div>`;
  };
  const originalDecision=pages.decision;
  pages.decision=function(){
    const r=nextEuro(),w=r.winner;
    document.getElementById('app').innerHTML=`<h2>🧠 ¿Dónde pongo el próximo euro?</h2><div class="card hero"><span class="badge">CAPITAL TÁCTICO · NO INCLUYE LOS 300 €/SEMANA</span>${w?`<div class="kpi">${esc(w.name||w.ticker)}</div><p><b>${w.score}/100</b> · confianza ${w.confidence}/100</p><p>${esc(w.reason)}</p><div class="pill"><span>Valoración ${Math.round(w.components.valuation)}</span><span>Calidad ${Math.round(w.components.quality)}</span><span>Crecimiento ${Math.round(w.components.growth)}</span><span>Diversificación ${Math.round(w.components.diversification)}</span><span>Riesgo ${Math.round(w.components.risk)}</span></div><button class="action" onclick="logDecision('Próximo euro: ${esc(w.name||w.ticker)} · ${w.score}/100','Motor IA');render('historial')">Guardar decisión</button>`:'<div class="kpi">ESPERAR</div><p>Datos insuficientes.</p>'}</div><div class="card section"><h3>Top oportunidades tácticas</h3>${r.candidates.slice(0,6).map((a,i)=>`<div class="row"><span><b>${i+1}. ${esc(a.name||a.ticker)}</b><br><span class="muted">${esc(a.reason)}</span></span><span><b>${a.score}</b>/100</span></div>`).join('')}</div>`;
  };
  void originalObjective;void originalDecision;
})();
