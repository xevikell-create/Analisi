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

    return {
      ethPrice,
      ethSource,
      quotes,
      marketUpdatedAt,
      source:[marketSource,ethSource].filter(x=>x!=='unavailable').join('+')||'unavailable'
    };
  }
};

// V4 bridge: keep the market layer independent from the UI and expose a
// deterministic decision snapshot for the Dashboard when quotes are present.
window.V4LiveBridge={
  async snapshot(data){
    const market=await window.MarketV4.sync(data||{});
    if(data?.crypto && market.ethPrice) data.crypto.ethPrice=market.ethPrice;
    if(data?.market){data.market.lastSync=new Date().toLocaleString('es-ES');data.market.source=market.source;}
    let engine=window.DecisionEngineV4;
    if(!engine){
      try{await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='decision-engine.js?ts='+Date.now();s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});engine=window.DecisionEngineV4;}catch(e){}
    }
    const symbols=await this.symbols();
    const positions=(data?.assets||[]).map(x=>({name:x[0],value:Number(x[1])||0,type:x[2]}));
    const enriched=positions.map(p=>{const symbol=symbols[p.name]||'';return {...p,ticker:symbol,quantity:1,averageCost:p.value,core:/msci world/i.test(p.name)};});
    return {market,decision:engine?engine.rank({positions:enriched,quotes:market.quotes,cash:Number(data?.accounts?.efectivo||0)+Number(data?.accounts?.remunerada||0),weeklyContribution:Number(data?.weekly||300)}):null};
  },
  async symbols(){
    try{const r=await fetch('./market-symbols.json?ts='+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();return j.assets||{};}}catch(e){}
    return {};
  }
};
