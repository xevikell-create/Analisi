/* RADAR SELF TEST V1 — deterministic smoke tests; no network required */
(function(){
 const assert=(name,ok,details='')=>({name,ok,details});
 window.RadarSelfTest={run:function(){
  const out=[];
  try{
   const E=window.RadarIntelligenceV5, P=window.RadarDataPolicy;
   out.push(assert('Motor V5 disponible',!!E,'RadarIntelligenceV5'));
   out.push(assert('Politica de datos disponible',!!P,'RadarDataPolicy'));
   if(E){
    const ctx=E.buildContext([{ticker:'A',valueEUR:7000,sector:'Technology',country:'USA'}],10000);
    const x=E.score({ticker:'A',name:'A',price:100,currency:'USD',quality:90,marginOfSafety:10,revenueGrowth:10,epsGrowth:10,fcfMargin:15,debtToEbitda:1,roe:20,roic:15,sector:'Technology',country:'USA',updatedAt:new Date().toISOString()},ctx,{inflation:3.7,ratePressure:70,oilShock:40,recessionRisk:30,liquidity:40},{A:[{impact:1,reliability:1,date:new Date().toISOString()}]});
    out.push(assert('Score devuelve resultado',!!x&&Number.isFinite(x.score),JSON.stringify(x)));
    out.push(assert('Concentración penaliza',x.components.diversification<80,`div=${x.components.diversification}`));
    const weak=E.score({ticker:'B',name:'B',price:100,currency:'USD',sector:'Technology',country:'USA'},E.buildContext([],10000),null,null);
    out.push(assert('Datos insuficientes bloquean',weak.action==='DATOS_INSUFICIENTES',weak.action));
   }
   if(P){
    const bad=P.validate({requiredFields:['price','currency'],price:null,currency:'USD',sourceType:'unknown',updatedAt:new Date(Date.now()-365*864e5).toISOString(),dataType:'price'});
    out.push(assert('Dato antiguo/faltante bloqueado',bad.blocked===true,bad.reason));
   }
  }catch(e){out.push(assert('Sin excepción',false,String(e)))}
  return {passed:out.filter(x=>x.ok).length,failed:out.filter(x=>!x.ok).length,total:out.length,tests:out};
 }};
})();
