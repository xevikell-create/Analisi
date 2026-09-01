/* P/L V5 — P/L total + P/L anual + XIRR */
(function(){
  const KEY='patrimonio_v4';
  const fmt=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0);
  const pct=n=>((Number(n)||0)*100).toFixed(1)+'%';
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function xirr(flows){
    if(flows.length<2)return null;
    const base=flows[0].date.getTime(), f=r=>flows.reduce((s,c)=>s+c.amount/Math.pow(1+r,(c.date-base)/31557600000),0);
    let lo=-.9999,hi=10,fl=f(lo),fh=f(hi);
    while(fl*fh>0&&hi<100000){hi*=2;fh=f(hi)}
    if(fl*fh>0)return null;
    for(let i=0;i<150;i++){const mid=(lo+hi)/2,fm=f(mid);if(Math.abs(fm)<1e-9)return mid;if(fl*fm<=0){hi=mid;fh=fm}else{lo=mid;fl=fm}}
    return (lo+hi)/2;
  }
  function getMetrics(){
    const d=read(), rows=window.I?.rows||[], eth=Number(window.I?.eth?.valueEUR||0), value=rows.reduce((s,r)=>s+Number(r.valueEUR||0),0)+eth, cost=rows.reduce((s,r)=>s+Number(r.costEUR||0),0), gain=value-cost;
    const flows=(d.contributions||[]).map(c=>({date:new Date(c.date),amount:-Math.abs(Number(c.amount||0))})).filter(x=>Number.isFinite(x.date.getTime())&&x.amount<0);
    if(value>0)flows.push({date:new Date(),amount:value});
    const xr=xirr(flows);
    const now=new Date(),year=now.getFullYear(),start=new Date(year,0,1),snapKey='pl_year_start_'+year;
    let snap=Number(localStorage.getItem(snapKey));
    if(!Number.isFinite(snap)){localStorage.setItem(snapKey,String(value));snap=value}
    const ytd=value-snap;
    return {value,cost,gain,totalPct:cost?gain/cost:0,xirr:xr,ytd,ytdPct:snap?ytd/snap:0,hasXirr:flows.length>=2};
  }
  function render(){
    const app=document.getElementById('app');if(!app)return;
    if(!document.querySelector('h2')||(!document.querySelector('h2').textContent.includes('Cartera')&&!document.querySelector('h2').textContent.includes('Patrimonio total')))return;
    const old=app.querySelector('[data-pl-metrics]');if(old)old.remove();
    const z=getMetrics(), card=document.createElement('div');card.className='card section';card.dataset.plMetrics='1';
    card.innerHTML=`<h3>📈 Rentabilidad</h3><div class="grid"><div><span class="muted">P/L total</span><div class="kpi ${z.gain>=0?'positive':'negative'}">${fmt(z.gain)}</div><span>${pct(z.totalPct)}</span></div><div><span class="muted">P/L anual (YTD)</span><div class="kpi ${z.ytd>=0?'positive':'negative'}">${fmt(z.ytd)}</div><span>${pct(z.ytdPct)} desde 1 de enero</span></div><div><span class="muted">XIRR anualizada</span><div class="kpi">${z.hasXirr&&z.xirr!=null?pct(z.xirr):'—'}</div><span class="muted">según aportaciones registradas</span></div></div>`;
    app.appendChild(card);
  }
  window.PLXIRR={xirr,getMetrics,render};
  const originalSet=window.setPage;
  if(typeof originalSet==='function'&&!originalSet.__plx){window.setPage=function(p){const r=originalSet.apply(this,arguments);setTimeout(render,30);return r};window.setPage.__plx=true}
  const obs=new MutationObserver(()=>setTimeout(render,0));
  const app=document.getElementById('app');if(app)obs.observe(app,{childList:true,subtree:false});
  setTimeout(render,500);
})();