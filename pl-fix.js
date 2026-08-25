/* P/L total fix — Patrimonio V2 — incluye Ethereum en P/L total */
(function(){
  function buildRows(m){
    const fx={USD:Number(m.usdEur)||0.85,HKD:Number(m.hkdEur)||0.108,JPY:Number(m.jpyEur)||0.0058,GBP:Number(m.gbpEur)||0.856,EUR:1};
    const aliases={Meta:'Meta Platforms',Palantir:'Palantir Technologies','S&P 500 ETF':'Vanguard S&P 500 Dist ETF','MSCI World Acc':'iShares Core MSCI World Acc'};
    const overrides=JSON.parse(localStorage.getItem('patrimonio_positions_overrides')||'{}');
    return (window.V4Portfolio?.positions||[]).map(p=>{const x={...p,...(overrides[p.name]||{})};const qd=m.quotes?.[p.name]||m.quotes?.[aliases[p.name]];const rate=fx[qd?.currency||p.currency]||1;const costRate=fx[p.costCurrency||p.currency]||1;const price=Number(qd?.price);const cost=Number(x.quantity)*Number(x.averageCost)*costRate;const value=Number.isFinite(price)?Number(x.quantity)*price*rate:0;return{name:p.name,quantity:Number(x.quantity),averageCost:Number(x.averageCost),currency:qd?.currency||p.currency,quote:Number.isFinite(price)?price:null,valueEUR:value,costEUR:cost,gainEUR:value-cost,returnPct:cost?(value-cost)/cost:0}});
  }
  function ethPL(m){
    const eth=Number(window.data?.crypto?.eth)||0;
    const price=Number(m.ethPrice)||0;
    const value=eth*price;
    const cost=Number(window.data?.crypto?.ethCostEUR);
    const gain=value-(Number.isFinite(cost)?cost:0);
    return {value,cost:Number.isFinite(cost)?cost:0,gain};
  }
  function totals(m){
    const rs=buildRows(m); const invCost=rs.reduce((s,r)=>s+r.costEUR,0); const invValue=rs.reduce((s,r)=>s+r.valueEUR,0); const invGain=invValue-invCost;
    const eth=ethPL(m); const totalCost=invCost+eth.cost; const totalValue=invValue+eth.value; const totalGain=invGain+eth.gain; const totalPct=totalCost?totalGain/totalCost:0;
    return {rs,invCost,invValue,invGain,invPct:invCost?invGain/invCost:0,eth,totalCost,totalValue,totalGain,totalPct};
  }
  function patch(){
    const originalDashboard=window.pages.dashboard;
    window.pages.dashboard=async function(){
      try{
        const m=await window.MarketV4.sync(); const z=totals(m); const t=window.total(), gap=Math.max(0,window.data.target-t);
        document.getElementById('app').innerHTML=`<div class="card hero"><span class="badge">MOTOR PATRIMONIAL</span><h2>Patrimonio total</h2><div class="kpi sensitive">${window.money(t)}</div><p class="muted">${window.pct(t/window.data.target)} del objetivo de ${window.money(window.data.target)}</p><div class="progress"><div style="width:${Math.min(100,t/window.data.target*100)}%"></div></div><p class="small">Faltan ${window.money(gap)}</p></div><div class="grid section"><div class="card">Inversiones<div class="kpi sensitive">${window.money(z.invValue)}</div><span>P/L ${window.money(z.invGain)} · ${window.pct(z.invPct)}</span></div><div class="card">Liquidez<div class="kpi sensitive">${window.money(window.liq())}</div><span>${window.pct(window.liq()/Math.max(1,t))}</span></div><div class="card">Ethereum<div class="kpi sensitive">${window.money(z.eth.value)}</div><span>P/L ${window.money(z.eth.gain)}</span></div><div class="card">P/L total<div class="kpi ${z.totalGain>=0?'positive':'negative'} sensitive">${window.money(z.totalGain)}</div><span>${window.pct(z.totalPct)}</span></div></div><div class="card"><b>P/L total cartera:</b> ${window.money(z.totalGain)} (${window.pct(z.totalPct)})<br><span class="muted">Acciones + ETFs + Ethereum. La liquidez queda fuera.</span><br><small>Inversiones: ${window.money(z.invGain)} · Ethereum: ${window.money(z.eth.gain)}</small></div>`;
        window.applyPrivate?.();
      }catch(e){console.error(e);originalDashboard();}
    };
    window.pages.cartera=function(){
      window.MarketV4.sync().then(m=>{const z=totals(m);document.getElementById('app').innerHTML=`<h2>Cartera completa</h2><div class="card scroll"><table><thead><tr><th>Activo</th><th>Cantidad</th><th>Precio medio</th><th>Actual</th><th class="right">Valor €</th><th class="right">P/L</th><th>Estado</th></tr></thead><tbody>${z.rs.map(r=>`<tr><td><b>${window.esc(r.name)}</b></td><td>${window.num(r.quantity)}</td><td>${window.num(r.averageCost)} ${r.currency}</td><td>${r.quote==null?'—':window.num(r.quote)+' '+r.currency}</td><td class="right"><b>${window.money(r.valueEUR)}</b></td><td class="right ${r.gainEUR>=0?'positive':'negative'}">${window.money(r.gainEUR)}<br>${window.pct(r.returnPct)}</td><td><span class="badge green">LIVE</span></td></tr>`).join('')}<tr><td><b>Ethereum</b></td><td>${window.num(window.data.crypto.eth)}</td><td>—</td><td>${window.num(Number(m.ethPrice)||0)} EUR</td><td class="right"><b>${window.money(z.eth.value)}</b></td><td class="right ${z.eth.gain>=0?'positive':'negative'}">${window.money(z.eth.gain)}</td><td><span class="badge green">LIVE</span></td></tr></tbody></table></div><div class="card section"><b>P/L total cartera:</b> ${window.money(z.totalGain)} (${window.pct(z.totalPct)})<br><span class="muted">Acciones + ETFs + Ethereum. Sin liquidez.</span><br>Acciones/ETFs: ${window.money(z.invGain)} · Ethereum: ${window.money(z.eth.gain)}</div>`;window.applyPrivate?.();}).catch(console.error);
    };
    window.pages.dashboard();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,0));else setTimeout(patch,0);
})();
