/* Próximo euro — integración definitiva */
(function(){
  function escX(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function moneyX(n){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0)}
  function calc(){
    try{
      if(!window.DecisionEngineV4||typeof window.DecisionEngineV4.rank!=='function') return null;
      const ps=typeof positions==='function'?positions():[];
      const rs=typeof rows==='function'?rows():[];
      const quotes={};
      rs.forEach(r=>{if(r.name&&r.quote!=null)quotes[r.name]={price:r.quote,currency:r.currency||'EUR'}});
      const ethQty=Number(data?.crypto?.eth)||1.1;
      const ethPrice=Number(I?.eth?.price)||Number(data?.crypto?.ethPrice)||0;
      return window.DecisionEngineV4.rank({
        positions:ps,
        crypto:[{ticker:'ETH',quantity:ethQty,cost:2000,price:ethPrice}],
        quotes,
        cash:typeof liq==='function'?liq():0,
        weeklyContribution:Number(data?.weekly)||300,
        usdPerEur:Number(window.MarketV4?.usdEur)||0.85
      });
    }catch(e){console.error('Próximo euro:',e);return null}
  }
  function renderNextEuro(){
    const app=document.getElementById('app');
    if(!app)return;
    const result=calc();
    if(!result){app.innerHTML='<h2>🧠 ¿Dónde pongo el próximo euro?</h2><div class="card"><b>ESPERAR</b><p>No hay datos suficientes para calcular una decisión fiable.</p></div>';return;}
    app.innerHTML='<h2>🧠 ¿Dónde pongo el próximo euro?</h2>'+
      '<div class="card hero"><span class="badge">MOTOR DE DECISIÓN V4</span><div class="kpi">'+escX(result.action)+'</div><h3>'+escX(result.recommendation)+'</h3><p>'+escX(result.reason)+'</p><div class="pill"><span>Score '+result.score+'/100</span><span>Confianza '+result.confidence+'%</span><span>Próxima aportación '+moneyX(result.amount)+'</span></div></div>'+
      '<div class="card section"><h3>Top 3 oportunidades</h3>'+result.top3.map((r,i)=>'<div class="row"><span><b>'+(i+1)+'. '+escX(r.name||r.symbol)+'</b><br><span class="muted">'+escX(r.action)+' · '+escX(r.reason)+'</span></span><span class="score">'+Math.round(r.score)+'/100</span></div>').join('')+'</div>'+
      '<div class="card section"><h3>Cómo decide</h3><div class="pill"><span>Valoración 35%</span><span>Calidad 25%</span><span>Peso/riesgo 25%</span><span>Situación 15%</span></div><p class="muted">El peso bajo por sí solo ya no genera una recomendación de compra. La decisión compara toda la cartera.</p></div>';
  }
  window.renderNextEuro=renderNextEuro;
  // Sustitución directa de la página que usa setPage(): evita que otros parches posteriores recuperen la lógica antigua.
  try{
    if(typeof pages!=='undefined'&&pages){
      pages.decision=renderNextEuro;
    }
  }catch(e){console.error('Integración Próximo euro:',e)}
  window.recommendation=function(){
    const r=calc();
    if(!r)return {label:'ESPERAR',text:'Sin datos suficientes para decidir.'};
    return {label:r.action,text:`${r.recommendation}: ${r.reason} Score ${r.score}/100.`};
  };
})();
