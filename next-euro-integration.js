/* Próximo euro: integración aislada y segura. No bloquea el arranque si falla. */
(function(){
  function engine(){
    try{
      const rs=(typeof rows==='function'?rows():[]).filter(r=>Number(r.valueEUR)>0);
      const totalValue=Math.max(1,typeof total==='function'?Number(total()):0);
      if(!rs.length)return {label:'ESPERAR',text:'No hay datos de mercado suficientes para tomar una decisión fiable.',score:0,top:[]};
      const scored=rs.map(r=>{
        const w=Number(r.valueEUR)/totalValue;
        const pl=Number(r.returnPct)||0;
        let score=50;
        // Peso: favorece posiciones pequeñas, penaliza concentración.
        score += Math.max(-25,Math.min(25,(0.08-w)*220));
        // P/L: una caída moderada puede mejorar la oportunidad, pero no compra automáticamente una mala inversión.
        if(pl<=-0.20)score+=8; else if(pl<0)score+=3; else if(pl>0.80)score-=8;
        // Núcleo estructural.
        if(r.name==='MSCI World Acc')score+=7;
        if(w>0.20)score-=20;
        if(w>0.30)score-=15;
        score=Math.max(0,Math.min(100,score));
        let label='ESPERAR';
        if(score>=75)label='COMPRAR'; else if(score>=62)label='REFORZAR'; else if(score>=48)label='MANTENER';
        return {...r,weight:w,score,label};
      }).sort((a,b)=>b.score-a.score);
      const winner=scored[0];
      return {
        label:winner.label,
        text:`${winner.name}: puntuación ${Math.round(winner.score)}/100. Peso actual ${(winner.weight*100).toFixed(1)}% y P/L ${(winner.returnPct*100).toFixed(1)}%.`,
        score:Math.round(winner.score),
        top:scored.slice(0,3)
      };
    }catch(e){
      console.error('Próximo euro:',e);
      return {label:'ESPERAR',text:'El motor no tiene datos suficientes; la cartera sigue funcionando normalmente.',score:0,top:[]};
    }
  }
  window.NextEuroV1={calculate:engine};
  const oldRecommendation=window.recommendation;
  window.recommendation=function(){return engine()};
  // Refresca solo la vista si la app ya está arrancada; nunca bloquea el arranque.
  try{if(typeof render==='function'&&typeof current!=='undefined')render(current)}catch(e){console.warn('Next euro UI refresh skipped',e)}
})();
