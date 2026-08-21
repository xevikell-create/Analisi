window.MarketV4={
  async sync(data){
    let ethPrice=null,ethSource='unavailable';
    try{const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur',{cache:'no-store'});if(r.ok){const j=await r.json();ethPrice=Number(j?.ethereum?.eur)||null;if(ethPrice)ethSource='CoinGecko';}}catch(e){}
    let quotes={},marketUpdatedAt=null,marketSource='unavailable';
    try{const r=await fetch('./market-data.json?ts='+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();quotes=j?.quotes||{};marketUpdatedAt=j?.updatedAt||null;if(Object.keys(quotes).length)marketSource=j?.provider||'market-data';}}catch(e){}
    return {ethPrice,ethSource,quotes,marketUpdatedAt,source:[marketSource,ethSource].filter(x=>x!=='unavailable').join('+')||'unavailable'};
  },
  async portfolio(){try{const r=await fetch('./portfolio-data.json?ts='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json();}catch(e){}return null;},
  fx(quotes,from){if(!from||from==='EUR')return 1;const d=Number(quotes[`${from}/EUR`]||quotes[`${from}EUR`]||0);if(d>0)return d;const i=Number(quotes[`EUR/${from}`]||quotes[`EUR${from}`]||0);return i>0?1/i:1;},
  valuePosition(p,quotes){const q=Number(quotes[p.ticker]);if(!Number.isFinite(q)||q<=0)return null;return Number(p.quantity||0)*q*this.fx(quotes,p.marketCurrency||p.costCurrency||'EUR');},
  async hydrate(data){
    const p=await this.portfolio();if(!p||!data)return null;
    const market=await this.sync(data);
    if(data.crypto&&market.ethPrice)data.crypto.ethPrice=market.ethPrice;
    const live=(p.positions||[]).map(pos=>{const value=this.valuePosition(pos,market.quotes);const fx=this.fx(market.quotes,pos.costCurrency||'EUR');const cost=Number(pos.quantity||0)*Number(pos.averageCost||0)*fx;return {...pos,quantity:Number(pos.quantity||0),averageCost:Number(pos.averageCost||0),currentPrice:Number(market.quotes[pos.ticker])||null,value,cost,gain:value==null?null:value-cost};});
    data.portfolioMeta=p.positions||[];data.livePositions=live;
    data.assets=live.map(x=>[x.name,x.value==null?0:x.value,x.type||'Activo']);
    data.market=data.market||{};data.market.lastSync=new Date().toLocaleString('es-ES');data.market.source=market.source;data.market.pricedPositions=live.filter(x=>x.value!=null).length;data.market.pendingPositions=live.filter(x=>x.value==null).map(x=>x.name);
    return {market,live};
  }
};
window.V4LiveBridge={async snapshot(data){const h=await window.MarketV4.hydrate(data||{});if(!h)return null;let engine=window.DecisionEngineV4;if(!engine){try{await new Promise((res,rej)=>{const s=document.createElement('script');s.src='decision-engine.js?ts='+Date.now();s.onload=res;s.onerror=rej;document.head.appendChild(s);});engine=window.DecisionEngineV4;}catch(e){}}return {market:h.market,decision:engine?engine.rank({positions:h.live,quotes:h.market.quotes,cash:Number(data?.accounts?.efectivo||0)+Number(data?.accounts?.remunerada||0),weeklyContribution:Number(data?.weekly||300)}):null};}};

window.addEventListener('DOMContentLoaded',()=>{
  const boot=async()=>{
    // The app currently keeps `data`, `save` and `nav` as global lexical bindings.
    // Global eval can access those bindings without changing the existing UI shell.
    let d;try{d=window.eval('data')}catch(e){return}if(!d)return;
    const originalSave=()=>{try{window.eval('save()')}catch(e){}};
    const hydrate=async()=>{await window.MarketV4.hydrate(d);originalSave();try{window.eval("nav('dashboard')")}catch(e){}};
    await hydrate();
    const oldSync=window.eval('syncMarket');
    window.eval(`syncMarket=async function(){await window.MarketV4.hydrate(data);save();nav('dashboard')}`);
    window.__V4_LIVE_READY__=true;
  };
  boot().catch(()=>{});
});
