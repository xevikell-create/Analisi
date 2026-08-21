/* Patrimonio V2 — valoración final y control de calidad */
window.ValuationReviewV4={
  money(n){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0)},
  pct(n){return Number.isFinite(n)?(n*100).toFixed(1)+'%':'—'},
  async run(data){
    const market=await (window.MarketV4?window.MarketV4.sync(data):Promise.resolve({quotes:{},usdEur:null,hkdEur:null}));
    const meta=Object.fromEntries((window.V4Portfolio?.positions||[]).map(p=>[p.name.toLowerCase(),p]));
    const aliases={'MSCI World Acc':'iShares Core MSCI World Acc','S&P 500 ETF':'Vanguard S&P 500 Dist ETF','Meta':'Meta Platforms','Palantir':'Palantir Technologies'};
    const rows=(data.assets||[]).map(a=>{
      const name=a[0],stored=Number(a[1])||0,m=meta[name.toLowerCase()]||meta[(aliases[name]||'').toLowerCase()]||{};
      const q=market.quotes?.[name]||market.quotes?.[aliases[name]]||market.quotes?.[m.ticker]||null;
      const qty=Number(m.quantity)||0,avg=Number(m.averageCost)||0,price=Number(q?.price),cur=String(q?.currency||m.currency||'EUR').toUpperCase();
      let valueEUR=null,costEUR=null;
      if(Number.isFinite(price)&&qty>0){const native=qty*price;if(cur==='EUR'){valueEUR=native;costEUR=qty*avg}else if(cur==='USD'&&Number(market.usdEur)>0){valueEUR=native*market.usdEur;costEUR=qty*avg*market.usdEur}else if(cur==='HKD'&&Number(market.hkdEur)>0){valueEUR=native*market.hkdEur;costEUR=qty*avg*market.hkdEur}}
      const diff=valueEUR==null?null:valueEUR-stored,diffPct=diff==null||stored===0?null:diff/stored,gain=valueEUR!=null&&costEUR!=null?valueEUR-costEUR:null,ret=gain!=null&&costEUR>0?gain/costEUR:null;
      return{name,stored,quantity:qty,averageCost:avg,price:Number.isFinite(price)?price:null,currency:cur,valueEUR,costEUR,diff,diffPct,gain,ret,status:valueEUR==null?'PENDIENTE':stored===0?'SIN IMPORTE BASE':Math.abs(diffPct||0)>0.05?'REVISAR':'OK',source:q?.source||'—'};
    });
    const ethQty=Number(data.crypto?.eth)||0,ethPrice=Number(market.ethPrice)||Number(data.crypto?.ethPrice)||0,ethValue=ethQty*ethPrice;
    const liquidity=Number(data.accounts?.remunerada||0)+Number(data.accounts?.efectivo||0),live=rows.reduce((s,r)=>s+(r.valueEUR??0),0),stored=rows.reduce((s,r)=>s+r.stored,0),total=live+ethValue+liquidity;
    return{market,rows,eth:{quantity:ethQty,price:ethPrice,valueEUR:ethValue},liquidity,total,storedTotal:stored+liquidity,difference:total-(stored+liquidity),summary:{ok:rows.filter(r=>r.status==='OK').length,review:rows.filter(r=>r.status==='REVISAR').length,pending:rows.filter(r=>r.status==='PENDIENTE').length,baseMissing:rows.filter(r=>r.status==='SIN IMPORTE BASE').length}};
  },
  async render(data){
    const result=await this.run(data);window.__V4_VALUATION_REVIEW__=result;
    const host=document.getElementById('app');if(!host)return;
    let box=document.getElementById('valuation-review');if(box)box.remove();
    box=document.createElement('div');box.id='valuation-review';box.className='card section';
    const badge=(s,t)=>`<span class="badge ${s}">${t}</span>`;
    const safe=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const rows=result.rows.map(r=>`<div class="row"><span><b>${safe(r.name)}</b><br><span class="muted">${r.quantity? r.quantity+' × '+(r.price==null?'precio pendiente':r.price+' '+r.currency):'cantidad pendiente'}</span></span><span class="right"><b>${r.valueEUR==null?'—':this.money(r.valueEUR)}</b><br>${r.status==='OK'?badge('green','OK'):r.status==='REVISAR'?badge('amber','REVISAR '+this.pct(r.diffPct)):r.status==='SIN IMPORTE BASE'?badge('amber','SIN BASE'):badge('red','PENDIENTE')}</span></div>`).join('');
    box.innerHTML=`<h3>🔎 Control de valoración</h3><p>${badge('green',result.summary.ok+' OK')} ${badge('amber',result.summary.review+' revisar')} ${badge('red',result.summary.pending+' pendientes')} ${badge('amber',result.summary.baseMissing+' sin base')}</p><div class="grid"><div><span class="muted">Patrimonio calculado</span><div class="kpi">${this.money(result.total)}</div></div><div><span class="muted">ETH</span><div class="kpi">${this.money(result.eth.valueEUR)}</div><span class="small">${result.eth.quantity} ETH · ${result.eth.price?this.money(result.eth.price)+'/ETH':'precio pendiente'}</span></div></div><p class="muted">Diferencia frente al valor almacenado: ${this.money(result.difference)}</p><details><summary>Ver posiciones</summary>${rows}</details>`;
    host.appendChild(box);return result;
  }
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(window.data)window.ValuationReviewV4.render(window.data)},1800));
window.addEventListener('v4:refresh',()=>{if(window.data)window.ValuationReviewV4.render(window.data)});
