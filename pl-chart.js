/* P/L chart — capital invertido vs valor actual */
(function(){
  function renderPLChart(t){
    const host=document.getElementById('pl-chart'); if(!host)return;
    const invested=Number(t.totalCost)||0, current=Number(t.totalValue)||0, diff=current-invested, pct=invested?diff/invested:0;
    const max=Math.max(invested,current,1), a=Math.round(invested/max*100), b=Math.round(current/max*100);
    host.innerHTML=`<div class="card"><h3>Capital invertido vs valor actual</h3><div style="margin:16px 0"><div class="small">Invertido <b>${window.money(invested)}</b></div><div class="progress"><div style="width:${a}%"></div></div></div><div style="margin:16px 0"><div class="small">Valor actual <b>${window.money(current)}</b></div><div class="progress"><div style="width:${b}%"></div></div></div><div class="grid"><div><b>Diferencia</b><div class="kpi ${diff>=0?'positive':'negative'}">${window.money(diff)}</div></div><div><b>Rentabilidad</b><div class="kpi ${pct>=0?'positive':'negative'}">${window.pct(pct)}</div></div></div><p class="muted small">Acciones + ETFs + Ethereum. Liquidez excluida.</p></div>`;
  }
  window.renderPLChart=renderPLChart;
})();
