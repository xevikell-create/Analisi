/* P/L GLOBAL V3 — fuente única de verdad, ETH coste 2.000 € */
(function(){
  const KEY='patrimonio_v4';
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function ethCost(){const d=read();return Number.isFinite(Number(d?.crypto?.ethCostEUR))?Number(d.crypto.ethCostEUR):2000}
  async function calc(){
    const m=await window.MarketV4.sync(), d=read(), ov=JSON.parse(localStorage.getItem('patrimonio_positions_overrides')||'{}');
    const fx={USD:Number(m.usdEur)||.85,HKD:Number(m.hkdEur)||.108,JPY:Number(m.jpyEur)||.0058,GBP:Number(m.gbpEur)||.856,EUR:1};
    const aliases={Meta:'Meta Platforms',Palantir:'Palantir Technologies','S&P 500 ETF':'Vanguard S&P 500 Dist ETF','MSCI World Acc':'iShares Core MSCI World Acc'};
    const rows=(window.V4Portfolio?.positions||[]).map(p=>{const x={...p,...(ov[p.name]||{})},q=m.quotes?.[p.name]||m.quotes?.[aliases[p.name]],rate=fx[q?.currency||p.currency]||1,costRate=fx[x.costCurrency||x.currency]||1,price=Number(q?.price),cost=Number(x.quantity)*Number(x.averageCost)*costRate,value=Number.isFinite(price)?Number(x.quantity)*price*rate:0;return {name:p.name,cost,value,gain:value-cost,pct:cost?(value-cost)/cost:0}});
    const ec=ethCost(), eq=Number(d.crypto?.eth)||1.1, ep=Number(m.ethPrice)||0, ev=eq*ep, eg=ev-ec;
    const cost=rows.reduce((s,r)=>s+r.cost,0)+ec,value=rows.reduce((s,r)=>s+r.value,0)+ev,gain=value-cost;
    return {m,rows,eth:{qty:eq,price:ep,value:ev,cost:ec,gain:eg},cost,value,gain,pct:cost?gain/cost:0};
  }
  async function render(){const z=await calc(), money=window.money,pct=window.pct,num=window.num,esc=window.esc;document.getElementById('app').innerHTML=`<h2>📊 Cartera completa</h2><div class="card scroll"><table><thead><tr><th>Activo</th><th>Cantidad</th><th>Precio medio</th><th>Actual</th><th class="right">Valor €</th><th class="right">P/L</th></tr></thead><tbody>${z.rows.map(r=>{const p=(window.V4Portfolio?.positions||[]).find(x=>x.name===r.name),q=z.m.quotes?.[r.name];return `<tr><td><b>${esc(r.name)}</b></td><td>${num(p?.quantity||0)}</td><td>${num(p?.averageCost||0)} ${p?.currency||''}</td><td>${q?.price!=null?num(q.price)+' '+q.currency:'—'}</td><td class="right"><b>${money(r.value)}</b></td><td class="right ${r.gain>=0?'positive':'negative'}">${money(r.gain)}<br>${pct(r.pct)}</td></tr>`}).join('')}<tr><td><b>Ethereum</b></td><td>${num(z.eth.qty)}</td><td>${money(z.eth.cost/z.eth.qty)}</td><td>${money(z.eth.price)}</td><td class="right"><b>${money(z.eth.value)}</b></td><td class="right ${z.eth.gain>=0?'positive':'negative'}">${money(z.eth.gain)}<br>${pct(z.eth.gain/z.eth.cost)}</td></tr></tbody></table></div><div class="grid section"><div class="card">P/L acciones + ETFs<div class="kpi">${money(z.gain-z.eth.gain)}</div></div><div class="card">P/L Ethereum<div class="kpi">${money(z.eth.gain)}</div><span>Coste: ${money(z.eth.cost)}</span></div><div class="card">P/L GLOBAL<div class="kpi ${z.gain>=0?'positive':'negative'}">${money(z.gain)}</div><span>${pct(z.pct)}</span></div></div><div class="card"><b>Coste total invertido:</b> ${money(z.cost)} · <b>Valor actual:</b> ${money(z.value)}<br><span class="muted">Liquidez excluida del P/L.</span></div>`;window.applyPrivate?.()}
  function patch(){if(!window.pages)return;window.pages.cartera=render;window.pages.dashboard=async function(){await render();}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,100));else setTimeout(patch,100);
})();
