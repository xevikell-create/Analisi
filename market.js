window.V4Portfolio={
  version:4,
  weeklyContribution:300,
  target:1000000,
  positions:[
    {name:'MSCI World Acc',isin:'IE00B4L5Y983',ticker:'SWDA',quantity:23.089,averageCost:125.60,currency:'EUR',core:true},
    {name:'BYD',isin:'CNE100000296',ticker:'1211.HK',quantity:207.85,averageCost:12.81,currency:'EUR',core:false},
    {name:'Palantir Technologies',ticker:'PLTR',quantity:11.95,averageCost:123.76,currency:'USD'},
    {name:'Netflix',ticker:'NFLX',quantity:25.97,averageCost:75.11,currency:'USD'},
    {name:'First Solar',ticker:'FSLR',quantity:8.48,averageCost:164.90,currency:'USD'},
    {name:'Apple',ticker:'AAPL',quantity:5.47,averageCost:222.16,currency:'USD'},
    {name:'Toyota',ticker:'TM',quantity:83.34,averageCost:18.01,currency:'USD'},
    {name:'Meta',ticker:'META',quantity:3.70,averageCost:544.68,currency:'USD'},
    {name:'Nvidia',ticker:'NVDA',quantity:9.27,averageCost:126.50,currency:'USD'},
    {name:'AMD',ticker:'AMD',quantity:4.10,averageCost:126.66,currency:'USD'},
    {name:'CaixaBank',ticker:'CABK',quantity:97.75,averageCost:5.09,currency:'EUR'},
    {name:'Amazon',ticker:'AMZN',quantity:2.74,averageCost:198.70,currency:'USD'},
    {name:'NextEra Energy',ticker:'NEE',quantity:7.067,averageCost:71.76,currency:'USD'},
    {name:'Vanguard S&P 500 Dist ETF',quantity:4.860,averageCost:107.63,currency:'EUR',identifierPending:true}
  ],
  crypto:{name:'Ethereum',ticker:'ETH',quantity:1.1,currency:'EUR',priceSource:'CoinGecko'}
};

(function migratePortfolio(){
  try{
    const key='patrimonio_v4';
    const raw=localStorage.getItem(key);
    if(!raw)return;
    const data=JSON.parse(raw);
    data.portfolioV4=window.V4Portfolio;
    data.crypto=data.crypto||{};
    data.crypto.eth=window.V4Portfolio.crypto.quantity;
    data.market=data.market||{};
    data.market.portfolioVersion=4;
    localStorage.setItem(key,JSON.stringify(data));
  }catch(e){}
})();

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
    const enriched=positions.map(p=>{const meta=(window.V4Portfolio.positions||[]).find(m=>m.name.toLowerCase()===p.name.toLowerCase())||{};const symbol=meta.ticker||symbols[p.name]||'';return {...p,ticker:symbol,quantity:Number(meta.quantity)||0,averageCost:Number(meta.averageCost)||0,currency:meta.currency||'EUR',core:!!meta.core};});
    return {market,decision:engine?engine.rank({positions:enriched,quotes:market.quotes,cash:Number(data?.accounts?.efectivo||0)+Number(data?.accounts?.remunerada||0),weeklyContribution:Number(data?.weekly||300)}):null};
  },
  async symbols(){
    try{const r=await fetch('./market-symbols.json?ts='+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();return j.assets||{};}}catch(e){}
    return {};
  }
};
