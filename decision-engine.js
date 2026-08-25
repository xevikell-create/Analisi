window.DecisionEngineV4={
  rank({positions=[],crypto=[],quotes={},cash=0,weeklyContribution=300,usdPerEur=1}={}){
    const fx=Math.max(Number(usdPerEur)||1,0.000001);
    const rows=positions.map(p=>{
      const symbol=p.ticker||p.name;
      const raw=quotes[symbol]??quotes[p.name];
      const q=typeof raw==='object'?Number(raw?.price):Number(raw);
      const currency=String(raw?.currency||p.currency||'EUR').toUpperCase();
      const priceEUR=Number.isFinite(q)?(currency==='USD'?q/fx:currency==='HKD'?q*0.108:q):null;
      const quantity=Number(p.quantity)||0;
      const avg=Number(p.averageCost)||0;
      const cost=quantity*avg*(currency==='USD'?1/fx:currency==='HKD'?0.108:1);
      const value=Number.isFinite(priceEUR)?quantity*priceEUR:null;
      const gain=value==null?null:value-cost;
      const ret=cost>0&&gain!=null?gain/cost:0;
      return {...p,symbol,value,cost,gain,returnPct:ret,price:priceEUR,currency};
    });
    const eth=Array.isArray(crypto)?crypto.find(c=>(c.ticker||c.name||'').toUpperCase()==='ETH'):null;
    const ethQty=Number(eth?.quantity)||0;
    const ethPrice=Number(eth?.price)||Number(quotes.ETH)||0;
    const ethValue=ethQty*ethPrice;
    const ethCost=Number(eth?.cost)||Number(eth?.totalCost)||2000;
    const priced=rows.filter(r=>r.value!=null);
    const totalMarketValue=priced.reduce((s,r)=>s+r.value,0)+ethValue;
    const investable=priced.map(r=>({...r,weight:totalMarketValue?r.value/totalMarketValue:0}));
    const candidates=investable.map(r=>{
      const weight=r.weight;
      let valuation=50;
      if(r.valuationScore!=null) valuation=Math.max(0,Math.min(100,Number(r.valuationScore)));
      else if(r.fairValue!=null&&r.price>0){const upside=Number(r.fairValue)/r.price-1;valuation=Math.max(0,Math.min(100,50+upside*50));}
      let quality=r.qualityScore!=null?Number(r.qualityScore):50;
      quality=Math.max(0,Math.min(100,quality));
      let balance=50+(0.08-weight)*300;
      balance=Math.max(0,Math.min(100,balance));
      let momentum=50;
      if(r.returnPct<-0.20)momentum=65;
      if(r.returnPct>0.80)momentum=35;
      let score=valuation*0.35+quality*0.25+balance*0.25+momentum*0.15;
      if(r.core)score+=7;
      if(weight>0.20)score-=20;
      if(weight>0.30)score-=15;
      score=Math.max(0,Math.min(100,score));
      let action='ESPERAR';
      if(score>=75)action='COMPRAR';
      else if(score>=62)action='REFORZAR';
      else if(score>=48)action='MANTENER';
      const reason=r.core?'Es el núcleo de la cartera y mantiene prioridad estructural.':weight<0.03?'Está infraponderada y tiene margen para aumentar peso.':weight>0.20?'La concentración limita nuevas compras.':'Su puntuación global no justifica aumentar posición ahora.';
      return {...r,score,action,reason,components:{valuation,quality,balance,momentum}};
    }).sort((a,b)=>b.score-a.score);
    const winner=candidates[0]||null;
    const top=candidates.slice(0,3);
    return {
      action:winner?.action||'ESPERAR',
      recommendation:winner?.name||winner?.symbol||'Sin datos de mercado',
      amount:Number(weeklyContribution)||0,
      suggestedAllocation:winner&&winner.score>=62?100:0,
      reason:winner?.reason||'Faltan cotizaciones para calcular una decisión fiable.',
      score:winner?Math.round(winner.score):0,
      totalMarketValue,
      cash:Number(cash)||0,
      pricedPositions:priced.length,
      crypto:{ethQuantity:ethQty,ethPrice,ethValue,ethCost},
      candidates,
      top3:top,
      confidence:winner?Math.round(Math.max(0,Math.min(100,50+Math.abs(winner.score-50)))):0
    };
  }
};

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