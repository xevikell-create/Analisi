/* P/L total fix V2 — coste ETH incluido correctamente */
(function(){
  const KEY='patrimonio_v4';
  function state(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function saveEthCost(){
    const d=state();
    if(!Number.isFinite(Number(d?.crypto?.ethCostEUR))){
      d.crypto={...(d.crypto||{}),ethCostEUR:2000};
      localStorage.setItem(KEY,JSON.stringify(d));
    }
    return Number(d?.crypto?.ethCostEUR)||2000;
  }
  function buildRows(m){
    const fx={USD:Number(m.usdEur)||0.85,HKD:Number(m.hkdEur)||0.108,JPY:Number(m.jpyEur)||0.0058,GBP:Number(m.gbpEur)||0.856,EUR:1};
    const aliases={Meta:'Meta Platforms',Palantir:'Palantir Technologies','S&P 500 ETF':'Vanguard S&P 500 Dist ETF','MSCI World Acc':'iShares Core MSCI World Acc'};
    const ov=JSON.parse(localStorage.getItem('patrimonio_positions_overrides')||'{}');
    return (window.V4Portfolio?.positions||[]).map(p=>{
      const x={...p,...(ov[p.name]||{})}; const qd=m.quotes?.[p.name]||m.quotes?.[aliases[p.name]];
      const rate=fx[qd?.currency||p.currency]||1; const costRate=fx[p.costCurrency||p.currency]||1;
      const price=Number(qd?.price); const cost=Number(x.quantity)*Number(x.averageCost)*costRate;
      const value=Number.isFinite(price)?Number(x.quantity)*price*rate:0;
      return {name:p.name,quantity:Number(x.quantity),averageCost:Number(x.averageCost),currency:qd?.currency||p.currency,quote:Number.isFinite(price)?price:null,valueEUR:value,costEUR:cost,gainEUR:value-cost,returnPct:cost?(value-cost)/cost:0};
    });
  }
  function totals(m){
    const rs=buildRows(m), invCost=rs.reduce((s,r)=>s+r.costEUR,0), invValue=rs.reduce((s,r)=>s+r.valueEUR,0);
    const d=state(), ethQty=Number(d?.crypto?.eth)||1.1, ethCost=saveEthCost(), ethPrice=Number(m.ethPrice)||0, ethValue=ethQty*ethPrice;
    const totalCost=invCost+ethCost, totalValue=invValue+ethValue, totalGain=totalValue-totalCost;
    return {rs,invCost,invValue,invGain:invValue-invCost,invPct:invCost?(invValue-invCost)/invCost:0,eth:{qty:ethQty,price:ethPrice,value:ethValue,cost:ethCost,gain:ethValue-ethCost},totalCost,totalValue,totalGain,totalPct:totalCost?totalGain/totalCost:0};
  }
  async function renderPL(){
    const m=await window.MarketV4.sync(), z=totals(m), t=window.total();
    const money=window.money,pct=window.pct,num=window.num,esc=window.esc;
    document.getElementById('app').innerHTML=`<h2>📊 Cartera completa</h2><div class="card scroll"><table><thead><tr><th>Activo</th><th>Cantidad</th><th>Precio medio</th><th>Actual</th><th class="right">Valor €</th><th class="right">P/L</th></tr></thead><tbody>${z.rs.map(r=>`<tr><td><b>${esc(r.name)}</b></td><td>${num(r.quantity)}</td><td>${num(r.averageCost)} ${r.currency}</td><td>${r.quote==null?'—':num(r.quote)+' '+r.currency}</td><td class="right"><b>${money(r.valueEUR)}</b></td><td class="right ${r.gainEUR>=0?'positive':'negative'}">${money(r.gainEUR)}<br>${pct(r.returnPct)}</td></tr>`).join('')}<tr><td><b>Ethereum</b></td><td>${num(z.eth.qty)}</td><td>${money(z.eth.cost/z.eth.qty)}</td><td>${money(z.eth.price)}</td><td class="right"><b>${money(z.eth.value)}</b></td><td class="right ${z.eth.gain>=0?'positive':'negative'}">${money(z.eth.gain)}</td></tr></tbody></table></div><div class="grid section"><div class="card">P/L acciones + ETFs<div class="kpi ${z.invGain>=0?'positive':'negative'}">${money(z.invGain)}</div><span>${pct(z.invPct)}</span></div><div class="card">P/L Ethereum<div class="kpi ${z.eth.gain>=0?'positive':'negative'}">${money(z.eth.gain)}</div><span>Coste registrado: ${money(z.eth.cost)}</span></div><div class="card">P/L GLOBAL<div class="kpi ${z.totalGain>=0?'positive':'negative'}">${money(z.totalGain)}</div><span>${pct(z.totalPct)}</span></div></div><div class="card"><b>P/L global correcto:</b> ${money(z.totalGain)} (${pct(z.totalPct)})<br><span class="muted">Coste total invertido: ${money(z.totalCost)} · Valor actual: ${money(z.totalValue)} · Liquidez excluida del P/L.</span></div>`;
    window.applyPrivate?.();
  }
  function patch(){
    saveEthCost();
    if(window.pages){window.pages.cartera=renderPL;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,50));else setTimeout(patch,50);
})();
