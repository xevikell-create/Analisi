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
