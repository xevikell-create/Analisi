/* P/L total fix — Patrimonio V2 */
(function(){
  function buildRows(m){
    const fx={USD:Number(m.usdEur)||0.85,HKD:Number(m.hkdEur)||0.108,JPY:Number(m.jpyEur)||0.0058,GBP:Number(m.gbpEur)||0.856,EUR:1};
    const aliases={Meta:'Meta Platforms',Palantir:'Palantir Technologies','S&P 500 ETF':'Vanguard S&P 500 Dist ETF','MSCI World Acc':'iShares Core MSCI World Acc'};
    const overrides=JSON.parse(localStorage.getItem('patrimonio_positions_overrides')||'{}');
    return (window.V4Portfolio?.positions||[]).map(p=>{const x={...p,...(overrides[p.name]||{})};const qd=m.quotes?.[p.name]||m.quotes?.[aliases[p.name]];const rate=fx[qd?.currency||p.currency]||1;const costRate=fx[p.costCurrency||p.currency]||1;const price=Number(qd?.price);const cost=Number(x.quantity)*Number(x.averageCost)*costRate;const value=Number.isFinite(price)?Number(x.quantity)*price*rate:0;return{name:p.name,quantity:Number(x.quantity),averageCost:Number(x.averageCost),currency:qd?.currency||p.currency,quote:Number.isFinite(price)?price:null,valueEUR:value,costEUR:cost,gainEUR:value-cost,returnPct:cost?(value-cost)/cost:0}});
  }
  function patch(){
    const originalDashboard=window.pages.dashboard;
    window.pages.dashboard=async function(){
      try{
        const m=await window.MarketV4.sync();
        const rs=buildRows(m); const cost=rs.reduce((s,r)=>s+r.costEUR,0); const value=rs.reduce((s,r)=>s+r.valueEUR,0); const gain=value-cost; const pct=cost?gain/cost:0;
        const t=window.total(), gap=Math.max(0,window.data.target-t);
        document.getElementById('app').innerHTML=`<div class="card hero"><span class="badge">MOTOR PATRIMONIAL</span><h2>Patrimonio total</h2><div class="kpi sensitive">${window.money(t)}</div><p class="muted">${window.pct(t/window.data.target)} del objetivo de ${window.money(window.data.target)}</p><div class="progress"><div style="width:${Math.min(100,t/window.data.target*100)}%"></div></div><p class="small">Faltan ${window.money(gap)}</p></div><div class="grid section"><div class="card">Inversiones<div class="kpi sensitive">${window.money(value)}</div></div><div class="card">Liquidez<div class="kpi sensitive">${window.money(window.liq())}</div><span>${window.pct(window.liq()/Math.max(1,t))}</span></div><div class="card">Ethereum<div class="kpi sensitive">${window.money(window.data.crypto.eth*(Number(m.ethPrice)||0))}</div><span>${window.num(window.data.crypto.eth)} ETH</span></div><div class="card">P/L total<div class="kpi ${gain>=0?'positive':'negative'} sensitive">${window.money(gain)}</div><span>${window.pct(pct)}</span></div></div><div class="card"><b>P/L de inversiones:</b> ${window.money(gain)} (${window.pct(pct)})<br><span class="muted">Calculado exclusivamente sobre las posiciones de inversión: valor actual menos coste total. Ethereum y la liquidez quedan fuera del P/L de inversiones.</span></div>`;
        window.applyPrivate?.();
      }catch(e){console.error(e);originalDashboard();}
    };
    window.pages.cartera=function(){
      window.pages.__plFixRows=buildRows;
      window.MarketV4.sync().then(m=>{const rs=buildRows(m);const cost=rs.reduce((s,r)=>s+r.costEUR,0);const value=rs.reduce((s,r)=>s+r.valueEUR,0);const gain=value-cost;const pct=cost?gain/cost:0;document.getElementById('app').innerHTML=`<h2>Cartera completa</h2><div class="card scroll"><table><thead><tr><th>Activo</th><th>Cantidad</th><th>Precio medio</th><th>Actual</th><th class="right">Valor €</th><th class="right">P/L</th><th>Estado</th></tr></thead><tbody>${rs.map(r=>`<tr><td><b>${window.esc(r.name)}</b></td><td>${window.num(r.quantity)}</td><td>${window.num(r.averageCost)} ${r.currency}</td><td>${r.quote==null?'—':window.num(r.quote)+' '+r.currency}</td><td class="right"><b>${window.money(r.valueEUR)}</b></td><td class="right ${r.gainEUR>=0?'positive':'negative'}">${window.money(r.gainEUR)}<br>${window.pct(r.returnPct)}</td><td><span class="badge green">LIVE</span></td></tr>`).join('')}</tbody></table></div><div class="card section"><b>Resultado total de inversiones:</b> ${window.money(gain)} (${window.pct(pct)})<br><span class="muted">Sin incluir Ethereum ni liquidez.</span></div>`;window.applyPrivate?.();}).catch(console.error);
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,0));else setTimeout(patch,0);
})();
