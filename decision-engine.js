window.DecisionEngineV4={
  rank({positions=[],crypto=[],quotes={},cash=0,weeklyContribution=300}={}){
    const rows=positions.map(p=>{
      const symbol=p.ticker||p.name;
      const q=Number(quotes[symbol]);
      const quantity=Number(p.quantity)||0;
      const value=Number.isFinite(q)?quantity*q:null;
      const cost=quantity*(Number(p.averageCost)||0);
      const gain=value==null?null:value-cost;
      return {...p,symbol,value,cost,gain};
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
      if(r.gain!=null && r.cost>0){
        const ret=r.gain/r.cost;
        if(ret<-0.20) score+=8;
        if(ret>0.80) score-=8;
      }
      return {...r,score:Math.max(0,Math.min(100,score)),weight};
    }).sort((a,b)=>b.score-a.score);
    const winner=scores[0]||core||null;
    return {
      action:winner?'REFORZAR':'ESPERAR',
      recommendation:winner?winner.name:'Sin datos de mercado',
      amount:Number(weeklyContribution)||0,
      reason:winner?(winner.core?'Es el núcleo de la cartera y tiene prioridad estructural.':'Tiene margen de peso y no presenta una concentración excesiva.'):'Faltan cotizaciones para calcular una decisión fiable.',
      totalMarketValue:totalInvested,
      cash:Number(cash)||0,
      pricedPositions:priced.length,
      crypto:{ethQuantity:ethQty,ethPrice,ethValue},
      candidates:scores
    };
  }
};
