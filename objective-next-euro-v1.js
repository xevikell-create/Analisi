/* Objective + Next Euro v1
   Weekly MSCI World contribution is structural; "next euro" is extra capital.
*/
(function(){
  const coreName='MSCI World Acc';
  function annualRate(){return Math.max(-0.99,Number(data.returnRate||7)/100)}
  function projectYears(start,target,weekly,rate){
    if(target<=start)return 0;
    const r=rate/52;
    if(Math.abs(r)<1e-10)return (target-start)/Math.max(1,weekly)/52;
    let value=start, n=0;
    while(value<target && n<1200){value=value*(1+r)+weekly;n++;}
    return n/52;
  }
  function scenario(rate){
    const t=total(), y=projectYears(t,Number(data.target||1000000),Number(data.weekly||300),rate);
    return {rate,years:y,date:new Date(Date.now()+y*365.2425*86400000)};
  }
  function objectivePage(){
    const t=total(), target=Number(data.target||1000000), weekly=Math.max(0,Number(data.weekly||300)), annual=annualRate();
    const scenarios=[scenario(0.04),scenario(0.07),scenario(0.10)];
    const base=scenarios[1], contributed=weekly*52*base.years, start=t, gain=Math.max(0,target-start-contributed);
    document.getElementById('app').innerHTML=`<h2>🎯 Objetivo máximo · ${money(target)}</h2>
      <div class="grid">
        <div class="card"><span class="muted">Progreso actual</span><div class="kpi sensitive">${pct(t/Math.max(1,target))}</div><span>${money(t)} de ${money(target)}</span></div>
        <div class="card"><span class="muted">Aportación estructural</span><div class="kpi sensitive">${money(weekly)}/semana</div><span>${money(weekly*52)}/año · MSCI World</span></div>
        <div class="card"><span class="muted">Escenario base</span><div class="kpi">${base.years.toFixed(1)} años</div><span>≈ ${base.date.toLocaleDateString('es-ES')}</span></div>
      </div>
      <div class="card hero section"><h3>Proyección al objetivo</h3><p>El cálculo incluye <b>${money(weekly)} semanales</b> de aportaciones y capitalización compuesta. Estas aportaciones son estructurales y no condicionan la decisión de dinero adicional.</p><div class="progress"><div style="width:${Math.min(100,t/Math.max(1,target)*100)}%"></div></div><p>En el escenario base (${(annual*100).toFixed(1)}% anual), llegarías aproximadamente el <b>${base.date.toLocaleDateString('es-ES')}</b>.</p></div>
      <div class="grid section">${scenarios.map(s=>`<div class="card"><b>${(s.rate*100).toFixed(0)}% anual</b><div class="kpi">${s.years.toFixed(1)} años</div><span>≈ ${s.date.toLocaleDateString('es-ES')}</span></div>`).join('')}</div>
      <div class="card section"><h3>Qué mueve realmente el objetivo</h3><div class="row"><span>Patrimonio inicial</span><b>${money(start)}</b></div><div class="row"><span>Aportaciones futuras estimadas (base)</span><b>${money(contributed)}</b></div><div class="row"><span>Rendimiento necesario aproximado</span><b>${money(gain)}</b></div></div>
      <div class="card section"><label>Rentabilidad base estimada anual (%)<input id="return-rate" type="number" step="0.1" value="${Number(data.returnRate||7)}" onchange="data.returnRate=Number(this.value)||0;save();render('objetivo')"></label></div>`;
  }
  function nextEuroRecommendation(){
    const rs=(rows()||[]).filter(r=>Number(r.valueEUR)>0);
    if(!rs.length)return {label:'ESPERAR',text:'Sin datos de mercado suficientes.',asset:null,score:0};
    const t=Math.max(1,total());
    const candidates=rs.map(r=>{
      const w=Number(r.valueEUR)/t;
      const pnl=Number(r.returnPct)||0;
      const core=r.name===coreName;
      // Extra-euro score: reward underweight + weakness; cap the core's automatic advantage.
      let score=50;
      score += Math.max(0,0.12-w)*70;
      score += Math.max(-15,Math.min(15,-pnl*45));
      if(w>0.25)score-=25;
      if(core)score-=12; // weekly core contribution is already committed
      return {...r,w,score:Math.max(0,Math.min(100,score))};
    }).sort((a,b)=>b.score-a.score);
    const best=candidates[0];
    if(best.score<55)return {label:'ESPERAR',text:'No hay una oportunidad adicional suficientemente clara. Mantén los 300 €/semana del MSCI World y reserva el capital extra.',asset:null,score:best.score};
    const action=best.name===coreName?'REFORZAR':'ANALIZAR';
    const reason=best.name===coreName
      ? 'El MSCI World sigue siendo atractivo incluso después de descontar la aportación estructural semanal.'
      : `${best.name} combina un peso relativamente bajo con una corrección/P-L que merece análisis antes de concentrar capital adicional.`;
    return {label:action,text:`${reason} Puntuación para dinero adicional: ${best.score.toFixed(0)}/100.`,asset:best.name,score:best.score};
  }
  const originalRec=window.recommendation;
  window.recommendation=nextEuroRecommendation;
  window.pages.objetivo=objectivePage;
  if(window.current==='objetivo')objectivePage();
  if(window.current==='decision' || window.current==='dashboard')render(window.current);
})();
