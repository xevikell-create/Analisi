/* Próximo euro V4 — integración directa sobre pages.decision */
(function(){
  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function eur(n){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0)}
  function build(){
    const app=document.getElementById('app');
    if(!app)return;
    try{
      const ps=typeof positions==='function'?positions():[];
      const rs=typeof rows==='function'?rows():[];
      const quotes={};
      rs.forEach(r=>{if(r.name&&r.quote!=null)quotes[r.name]={price:Number(r.quote),currency:r.currency||'EUR'}});
      const ethQty=typeof data!=='undefined'?Number(data.crypto?.eth)||1.1:1.1;
      const ethPrice=typeof I!=='undefined'?Number(I?.eth?.price)||Number(data?.crypto?.ethPrice)||0:0;
      const result=window.DecisionEngineV4?.rank?.({
        positions:ps,
        crypto:[{ticker:'ETH',quantity:ethQty,cost:2000,price:ethPrice}],
        quotes,
        cash:typeof liq==='function'?liq():0,
        weeklyContribution:typeof data!=='undefined'?Number(data.weekly)||300:300,
        usdPerEur:Number(window.MarketV4?.usdEur)||0.85
      });
      if(!result){
        app.innerHTML='<h2>🧠 ¿Dónde pongo el próximo euro?</h2><div class="card"><b>ESPERAR</b><p>No hay datos suficientes para calcular la decisión.</p></div>';
        return;
      }
      const top=(result.top3||[]).map((r,i)=>`<div class="row"><span><b>${i+1}. ${esc(r.name||r.symbol)}</b><br><span class="muted">${esc(r.action)} · ${esc(r.reason)}</span></span><span class="score">${Math.round(r.score)}/100</span></div>`).join('');
      app.innerHTML=`<h2>🧠 ¿Dónde pongo el próximo euro?</h2><div class="card hero"><span class="badge">MOTOR V4 · DECISIÓN REAL</span><div class="kpi">${esc(result.action)}</div><h3>${esc(result.recommendation)}</h3><p>${esc(result.reason)}</p><div class="pill"><span>Score ${result.score}/100</span><span>Confianza ${result.confidence}%</span><span>Próxima aportación ${eur(result.amount)}</span></div></div><div class="card section"><h3>Top 3 oportunidades</h3>${top||'<div class="empty">Sin datos suficientes para comparar activos.</div>'}</div><div class="card section"><h3>Qué está valorando</h3><div class="pill"><span>Valoración 35%</span><span>Calidad 25%</span><span>Peso/riesgo 25%</span><span>Situación 15%</span></div><p class="muted">El peso bajo por sí solo no genera una recomendación de compra.</p></div>`;
    }catch(e){
      console.error('Próximo euro V4',e);
      app.innerHTML='<h2>🧠 ¿Dónde pongo el próximo euro?</h2><div class="card"><b>Motor en revisión</b><p>La aplicación sigue operativa. Falta información de mercado para mostrar una decisión fiable.</p></div>';
    }
  }
  window.buildNextEuroV4=build;
  try{if(typeof pages!=='undefined'&&pages)pages.decision=build}catch(e){}
  const old=window.setPage;
  window.setPage=function(p){const out=old?old.apply(this,arguments):undefined;if(p==='decision')setTimeout(build,50);return out};
})();
