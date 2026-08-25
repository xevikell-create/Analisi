/* Próximo euro — motor único, aislado y seguro */
(function(){
  function escX(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function moneyX(n){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0)}
  function calc(){
    try{
      if(!window.DecisionEngineV4||typeof window.DecisionEngineV4.rank!=='function') return null;
      const ps=typeof positions==='function'?positions():[];
      const rs=typeof rows==='function'?rows():[];
      const quotes={};rs.forEach(r=>{if(r.name&&r.quote!=null)quotes[r.name]={price:r.quote,currency:r.currency||'EUR'}});
      return window.DecisionEngineV4.rank({positions:ps,crypto:[{ticker:'ETH',quantity:Number(data?.crypto?.eth)||1.1,cost:2000,price:Number(I?.eth?.price)||Number(data?.crypto?.ethPrice)||0}],quotes,cash:typeof liq==='function'?liq():0,weeklyContribution:Number(data?.weekly)||300,usdPerEur:Number(window.MarketV4?.usdEur)||1});
    }catch(e){console.error('Próximo euro:',e);return null}
  }
  function renderNextEuro(){
    const result=calc(),app=document.getElementById('app');if(!app||!result)return;
    const action=result.action||'ESPERAR',cls=action==='COMPRAR'||action==='REFORZAR'?'green':action==='ESPERAR'?'amber':'';
    app.innerHTML='<h2>🧠 ¿Dónde pongo el próximo euro?</h2>'+
      '<div class="card hero"><span class="badge">MOTOR DE DECISIÓN</span><div class="kpi">'+escX(action)+'</div><h3>'+escX(result.recommendation)+'</h3><p>'+escX(result.reason)+'</p><div class="pill"><span>Score '+result.score+'/100</span><span>Confianza '+result.confidence+'%</span><span>Próxima aportación '+moneyX(result.amount)+'</span></div></div>'+
      '<div class="card section"><h3>Top 3</h3>'+result.top3.map((r,i)=>'<div class="row"><span><b>'+(i+1)+'. '+escX(r.name||r.symbol)+'</b><br><span class="muted">'+escX(r.action)+' · '+escX(r.reason)+'</span></span><span class="score">'+Math.round(r.score)+'</span></div>').join('')+'</div>'+
      '<div class="card section"><h3>Cómo ha decidido</h3><div class="pill"><span>Valoración 35%</span><span>Calidad 25%</span><span>Peso/riesgo 25%</span><span>Situación 15%</span></div><p class="muted">No recomienda comprar únicamente porque una posición tenga poco peso. Si los datos no justifican una compra, devuelve ESPERAR.</p></div>';
  }
  // Sustituye también la tarjeta del dashboard: se elimina la recomendación antigua basada solo en peso/P&L.
  window.recommendation=function(){
    const r=calc();
    if(!r)return {label:'ESPERAR',text:'Sin datos suficientes para decidir.'};
    return {label:r.action,text:`${r.recommendation}: ${r.reason} Score ${r.score}/100.`};
  };
  const originalSetPage=window.setPage;
  window.setPage=function(p){const r=originalSetPage?originalSetPage.apply(this,arguments):null;if(p==='decision')setTimeout(renderNextEuro,0);return r};
  window.renderNextEuro=renderNextEuro;
  try{if(typeof current!=='undefined'&&current==='decision')setTimeout(renderNextEuro,0)}catch(e){}
})();
