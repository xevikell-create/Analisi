window.MarketV4={
  async sync(data){
    let ethPrice=null;
    let ethSource='unavailable';
    try{
      const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur',{cache:'no-store'});
      if(r.ok){const j=await r.json();ethPrice=Number(j?.ethereum?.eur)||null;if(ethPrice)ethSource='CoinGecko';}
    }catch(e){}

    let quotes={};
    let marketUpdatedAt=null;
    let marketSource='unavailable';
    try{
      const r=await fetch('./market-data.json?ts='+Date.now(),{cache:'no-store'});
      if(r.ok){
        const j=await r.json();
        quotes=j?.quotes||{};
        marketUpdatedAt=j?.updatedAt||null;
        if(Object.keys(quotes).length) marketSource=j?.provider||'market-data';
      }
    }catch(e){}

    return {ethPrice,ethSource,quotes,marketUpdatedAt,source:[marketSource,ethSource].filter(x=>x!=='unavailable').join('+')||'unavailable'};
  },
  async portfolio(){
    try{
      const r=await fetch('./portfolio-data.json?ts='+Date.now(),{cache:'no-store'});
      if(r.ok)return await r.json();
    }catch(e){}
    return null;
  },
  fx(quotes,from){
    if(!from||from==='EUR')return 1;
    const direct=Number(quotes[`${from}/EUR`]||quotes[`${from}EUR`]||0);
    if(direct>0)return direct;
    const inverse=Number(quotes[`EUR/${from}`]||quotes[`EUR${from}`]||0);
    return inverse>0?1/inverse:1;
  },
  valuePosition(p,quotes){
    const q=Number(quotes[p.ticker]);
    if(!Number.isFinite(q)||q<=0)return null;
    return Number(p.quantity||0)*q*this.fx(quotes,p.marketCurrency||p.costCurrency||'EUR');
  },
  async hydrate(data){
    const p=await this.portfolio();
    if(!p||!data)return null;
    data.portfolioMeta=p.positions||[];
    const market=await this.sync(data);
    if(data.crypto&&market.ethPrice)data.crypto.ethPrice=market.ethPrice;
    const live=[];
    for(const pos of (p.positions||[])){
      const value=this.valuePosition(pos,market.quotes);
      const cost=Number(pos.quantity||0)*Number(pos.averageCost||0)*this.fx(market.quotes,pos.costCurrency||'EUR');
      live.push({name:pos.name,ticker:pos.ticker,quantity:Number(pos.quantity||0),averageCost:Number(pos.averageCost||0),costCurrency:pos.costCurrency||'EUR',type:pos.type,core:!!pos.core,currentPrice:Number(market.quotes[pos.ticker])||null,value,cost,gain:value==null?null:value-cost});
    }
    data.livePositions=live;
    // Keep the existing UI contract [name,value,type], but replace stale seed values with live EUR values.
    data.assets=live.map(x=>[x.name,x.value==null?0:x.value,x.type||'Activo']);
    data.market=data.market||{};
    data.market.lastSync=new Date().toLocaleString('es-ES');
    data.market.source=market.source;
    data.market.pricedPositions=live.filter(x=>x.value!=null).length;
    data.market.pendingPositions=live.filter(x=>x.value==null).map(x=>x.name);
    return {market,live};
  }
};

window.V4LiveBridge={
  async snapshot(data){
    const hydrated=await window.MarketV4.hydrate(data||{});
    if(!hydrated)return null;
    let engine=window.DecisionEngineV4;
    if(!engine){
      try{await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='decision-engine.js?ts='+Date.now();s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});engine=window.DecisionEngineV4;}catch(e){}
    }
    const positions=hydrated.live.map(p=>({...p,value:p.value||0}));
    return {market:hydrated.market,decision:engine?engine.rank({positions,quotes:hydrated.market.quotes,cash:Number(data?.accounts?.efectivo||0)+Number(data?.accounts?.remunerada||0),weeklyContribution:Number(data?.weekly||300)}):null};
  }
};

// After the main inline application script has defined its UI functions, bridge
// live valuation into the existing dashboard without duplicating the app shell.
window.addEventListener('DOMContentLoaded',()=>{
  const boot=async()=>{
    if(!window.data||!window.save)return;
    const originalSync=window.syncMarket;
    window.syncMarket=async()=>{
      await window.MarketV4.hydrate(window.data);
      window.save();
      if(typeof window.nav==='function')window.nav('dashboard');
    };
    await window.MarketV4.hydrate(window.data);
    window.save();
    if(typeof window.nav==='function')window.nav('dashboard');
    window.__V4_LIVE_READY__=true;
  };
  boot().catch(()=>{});
});
