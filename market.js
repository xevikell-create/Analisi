window.MarketV4={
  async sync(data){
    let ethPrice=null;
    try{
      const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur',{cache:'no-store'});
      if(r.ok){const j=await r.json();ethPrice=Number(j?.ethereum?.eur)||null;}
    }catch(e){}
    return {ethPrice,source:ethPrice?'CoinGecko':'unavailable'};
  }
};
