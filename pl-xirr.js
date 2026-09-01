/* P/L V4 — P/L total, P/L anual y XIRR
   Usa el historial de aportaciones cuando existe y evita inventar fechas.
*/
(function(){
  const KEY='patrimonio_v4';
  const DAY=86400000;
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function money(n){return window.money?window.money(n):new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0)}
  function pct(n){return window.pct?window.pct(n):((Number(n)||0)*100).toFixed(1)+'%'}
  function xirr(flows){
    if(!flows||flows.length<2)return null;
    const base=flows[0].date.getTime();
    const f=r=>flows.reduce((s,c)=>s+c.amount/Math.pow(1+r,(c.date.getTime()-base)/31557600000),0);
    let lo=-0.9999,hi=10,fl=f(lo),fh=f(hi);
    if(!Number.isFinite(fl)||!Number.isFinite(fh)||fl*fh>0){for(let h=20;h<=1000;h*=2){hi=h;fh=f(hi);if(fl*fh<=0)break}if(fl*fh>0)return null}
    for(let i=0;i<120;i++){const mid=(lo+hi)/2,fm=f(mid);if(Math.abs(fm)<1e-8)return mid;if(fl*fm<=0){hi=mid;fh=fm}else{lo=mid;fl=fm}}
    return (lo+hi)/2;
  }
  function annualPL(){
    const d=read(),now=new Date(),year=now.getFullYear(),start=new Date(year,0,1);
    const contrib=(d.contributions||[]).filter(c=>{const dt=new Date(c.date);return dt>=start&&dt<=now}).reduce((s,c)=>s+Number(c.amount||0),0);
    return contrib;
  }
  async function calculate(){
    const d=read(), ov=JSON.parse(localStorage.getItem('patrimonio_positions_overrides')||'{}');
    const m=await window.MarketV4.sync();
    const fx={USD:Number(m.usdEur)||.85,HKD:Number(m.hkdEur)||.108,JPY:Number(m.jpyEur)||.0058,GBP:Number(m.gbpEur)||.856,EUR:1};
    const aliases={Meta:'Meta Platforms',Palantir:'Palantir Technologies','S&P 500 ETF':'Vanguard S&P 500 Dist ETF','MSCI World Acc':'iShares Core MSCI World Acc'};
    const rows=(window.V4Portfolio?.positions||[]).map(p=>{const x={...p,...(ov[p.name]||{})},q=m.quotes?.[p.name]||m.quotes?.[aliases[p.name]],rate=fx[q?.currency||p.currency]||1,costRate=fx[x.costCurrency||x.currency]||1,price=Number(q?.price),cost=Number(x.quantity)*Number(x.averageCost)*costRate,value=Number.isFinite(price)?Number(x.quantity)*price*rate:0;return {name:p.name,cost,value}});
    const eq=Number(d.crypto?.eth)||1.1,ep=Number(m.ethPrice)||0,ev=eq*ep,ec=Number(d.crypto?.ethCostEUR??2000),value=rows.reduce((s,r)=>s+r.value,0)+ev,cost=rows.reduce((s,r)=>s+r.cost,0)+ec;
    const gain=value-cost, annualContrib=annualPL();
    const flows=[];
    (d.contributions||[]).forEach(c=>{const amount=Number(c.amount);const dt=new Date(c.date);if(amount>0&&Number.isFinite(dt.getTime()))flows.push({date:dt,amount:-amount})});
    if(cost>0)flows.push({date:new Date(),amount:value});
    const xr=xirr(flows);
    return {value,cost,gain,pct:cost?gain/cost:0,annualContrib,xirr:xr};
  }
  async function renderMetrics(){
    try{const z=await calculate();const app=document.getElementById('app');if(!app)return;
      const old=app.querySelector('[data-pl-metrics]');if(old)old.remove();
      const card=document.createElement('div');card.className='card section';card.dataset.plMetrics='1';
      const annualText=z.annualContrib>0?'Las aportaciones registradas del año se muestran aparte; el P/L anual requiere valor de cierre del año anterior.':'Sin histórico suficiente para calcular P/L anual exacto.';
      card.innerHTML='<h3>📈 Rentabilidad</h3><div class="grid"><div><span class="muted">P/L total</span><div class="kpi '+(z.gain>=0?'positive':'negative')+'">'+money(z.gain)+'</div><span>'+pct(z.pct)+'</span></div><div><span class="muted">XIRR anualizada</span><div class="kpi">'+(z.xirr==null?'—':pct(z.xirr))+'</div><span class="muted">según flujos registrados</span></div><div><span class="muted">Aportado este año</span><div class="kpi">'+money(z.annualContrib)+'</div><span class="muted">'+annualText+'</span></div></div>';
      app.appendChild(card);
    }catch(e){console.error('P/L XIRR',e)}
  }
  window.PLXIRR={calculate,xirr,renderMetrics};
  const oldSet=window.setPage;
  if(typeof oldSet==='function'&&!oldSet.__plx){window.setPage=function(p){const r=oldSet.apply(this,arguments);if(p==='cartera'||p==='dashboard')setTimeout(renderMetrics,150);return r};window.setPage.__plx=true}
  setTimeout(()=>{if(window.current==='cartera'||window.current==='dashboard')renderMetrics()},400);
})();