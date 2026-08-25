/* Próximo euro FINAL — toma el control directo de pages.decision */
(function(){
  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function eur(n){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0)}
  function calculate(){
    const rs=(typeof window.rows==='function'?window.rows():[]).filter(r=>Number(r.valueEUR)>0);
    const ps=(window.V4Portfolio&&Array.isArray(window.V4Portfolio.positions))?window.V4Portfolio.positions:[];
    const quotes={};
    rs.forEach(r=>{quotes[r.name]={price:Number(r.quote)||0,currency:r.currency||'EUR'}});
    if(window.DecisionEngineV4?.rank){
      try{
        return window.DecisionEngineV4.rank({positions:ps,crypto:[{ticker:'ETH',quantity:1.1,cost:2000,price:Number(window.I?.eth?.price)||0}],quotes,cash:typeof window.liq==='function'?window.liq():0,weeklyContribution:300,usdPerEur:Number(window.MarketV4?.usdEur)||0.85});
      }catch(e){console.error(e)}
    }
    return null;
  }
  function render(){
    const app=document.getElementById('app'); if(!app)return;
    const r=calculate();
    if(!r){app.innerHTML='<h2>🧠 ¿Dónde pongo el próximo euro?</h2><div class="card amber"><b>Motor en revisión</b><p>No se ha podido conectar el motor de decisión. La cartera sigue funcionando con normalidad.</p></div>';return;}
    const top=(r.top3||[]).map((x,i)=>`<div class="row"><span><b>${i+1}. ${esc(x.name||x.symbol)}</b><br><span class="muted">${esc(x.action)} · ${esc(x.reason)}</span></span><span class="score">${Math.round(x.score)}/100</span></div>`).join('');
    app.innerHTML=`<h2>🧠 ¿Dónde pongo el próximo euro?</h2><div class="card hero"><span class="badge">MOTOR V4 ACTIVO</span><div class="kpi">${esc(r.action)}</div><h3>${esc(r.recommendation)}</h3><p>${esc(r.reason)}</p><div class="pill"><span>Score ${r.score}/100</span><span>Confianza ${r.confidence}%</span><span>Próxima aportación ${eur(r.amount)}</span></div></div><div class="card section"><h3>Top 3</h3>${top||'<div class="empty">Sin datos suficientes.</div>'}</div><div class="card section"><h3>Criterios</h3><div class="pill"><span>Valoración 35%</span><span>Calidad 25%</span><span>Peso/riesgo 25%</span><span>Situación 15%</span></div><p class="muted">El peso bajo no provoca por sí solo una recomendación de compra.</p></div>`;
  }
  function install(){
    if(typeof window.pages==='object'&&window.pages){window.pages.decision=render;}
    const nav=document.getElementById('nav');
    if(nav&&!nav.__nextEuroFinal){
      nav.addEventListener('click',function(e){const b=e.target.closest('button[data-p="decision"]');if(!b)return;setTimeout(render,50);setTimeout(render,500);});nav.__nextEuroFinal=true;
    }
    if(typeof window.current!=='undefined'&&window.current==='decision')setTimeout(render,50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,100));else setTimeout(install,100);
  window.renderNextEuroFinal=render;
})();
