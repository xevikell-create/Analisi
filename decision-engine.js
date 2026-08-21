window.DecisionEngineV4={
  rank({positions=[],crypto=[],quotes={},cash=0,weeklyContribution=300,usdPerEur=1}={}){
    const rows=positions.map(p=>{
      const symbol=p.ticker||p.name;
      const raw=quotes[symbol]??quotes[p.name];
      const q=typeof raw==='object'?Number(raw?.price):Number(raw);
      const currency=String(raw?.currency||p.currency||'EUR').toUpperCase();
      const fx=Number(usdPerEur)||1;
      const priceEUR=Number.isFinite(q)?(currency==='USD'?q/Math.max(fx,0.000001):currency==='HKD'?q*0.108:q):null;
      const quantity=Number(p.quantity)||0;
      const cost=quantity*(Number(p.averageCost)||0)*(currency==='USD'?1/Math.max(fx,0.000001):currency==='HKD'?0.108:1);
      const value=Number.isFinite(priceEUR)?quantity*priceEUR:null;
      const gain=value==null?null:value-cost;
      return {...p,symbol,value,cost,gain,price:priceEUR,currency};
    });
    const eth=Array.isArray(crypto)?crypto.find(c=>(c.ticker||c.name||'').toUpperCase()==='ETH'):null;
    const ethQty=Number(eth?.quantity)||0;
    const ethPrice=Number(eth?.price)||Number(quotes.ETH)||0;
    const ethValue=ethQty*ethPrice;
    const priced=rows.filter(r=>r.value!=null);
    const totalInvested=priced.reduce((s,r)=>s+r.value,0)+ethValue;
    const core=priced.find(r=>r.core);
    const scores=priced.map(r=>{
      let score=50;
      if(r.core) score+=25;
      const weight=totalInvested?r.value/totalInvested:0;
      if(weight<0.03) score+=10;
      if(weight>0.20) score-=20;
      if(r.gain!=null&&r.cost>0){const ret=r.gain/r.cost;if(ret<-0.20)score+=8;if(ret>0.80)score-=8;}
      return {...r,score:Math.max(0,Math.min(100,score)),weight};
    }).sort((a,b)=>b.score-a.score);
    const winner=scores[0]||core||null;
    return {action:winner?'REFORZAR':'ESPERAR',recommendation:winner?winner.name:'Sin datos de mercado',amount:Number(weeklyContribution)||0,reason:winner?(winner.core?'Es el núcleo de la cartera y tiene prioridad estructural.':'Tiene margen de peso y no presenta una concentración excesiva.'):'Faltan cotizaciones para calcular una decisión fiable.',totalMarketValue:totalInvested,cash:Number(cash)||0,pricedPositions:priced.length,crypto:{ethQuantity:ethQty,ethPrice,ethValue},candidates:scores};
  }
};

// Compatibility layer: the V4 portfolio screen must not turn a valid quote into
// "Pendiente" merely because the FX endpoint is temporarily unavailable.
(function installCarteraMarketFix(){
  const FALLBACK_USD_EUR=0.85;
  function patch(){
    const api=window.PortfolioIntelligenceV4;
    if(!api||api.__carteraMarketFix)return false;
    const original=api.build;
    api.build=async function(data){
      const result=await original.call(this,data);
      const fx=Number(result?.fx?.usdEur)||FALLBACK_USD_EUR;
      if(Array.isArray(result?.rows)){
        result.rows.forEach(r=>{
          if(r.status!=='live'&&r.quote!=null&&Number.isFinite(Number(r.quote))){
            const c=String(r.currency||'EUR').toUpperCase();
            const qty=Number(r.quantity)||0;
            const avg=Number(r.averageCost)||0;
            if(c==='USD'){
              r.valueEUR=qty*Number(r.quote)*fx;
              r.costEUR=qty*avg*fx;
              r.gainEUR=r.valueEUR-r.costEUR;
              r.returnPct=r.costEUR>0?r.gainEUR/r.costEUR:null;
              r.status='live';
            }else if(c==='HKD'){
              r.valueEUR=qty*Number(r.quote)*0.108;
              r.costEUR=qty*avg*0.108;
              r.gainEUR=r.valueEUR-r.costEUR;
              r.returnPct=r.costEUR>0?r.gainEUR/r.costEUR:null;
              r.status='live';
            }
          }
        });
        const total=(result.rows.reduce((s,r)=>s+(r.valueEUR??r.storedValue??0),0))+Number(result.eth?.valueEUR||0)+Number(result.liquidity||0);
        result.rows.forEach(r=>r.weight=total>0?(r.valueEUR??r.storedValue??0)/total:0);
        result.total=total;
        result.quality=result.quality||{};
        result.quality.live=result.rows.filter(r=>r.status==='live').length;
        result.quality.pending=result.rows.filter(r=>r.status!=='live').length;
        result.fx=result.fx||{};
        if(!result.fx.usdEur)result.fx.usdEur=fx;
      }
      return result;
    };
    api.__carteraMarketFix=true;
    return true;
  }
  if(!patch()){
    let tries=0;
    const timer=setInterval(()=>{if(patch()||++tries>120)clearInterval(timer)},250);
  }
})();
