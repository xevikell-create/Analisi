/* RADAR RISK ENGINE V1 — scenario + thesis challenge layer */
(function(){
 const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,Number(x)||0));
 function scenario(a,macro={}){
  const sector=String(a.sector||'').toLowerCase();
  const rate=Number(macro.ratePressure)||0, oil=Number(macro.oilShock)||0, rec=Number(macro.recessionRisk)||0;
  let base=0;
  if(['technology','semiconductors'].includes(sector)) base-=rate*.35+rec*.18;
  if(['consumer'].includes(sector)) base-=rec*.22+oil*.05;
  if(['financials'].includes(sector)) base+=rate*.12-rec*.12;
  if(['energy'].includes(sector)) base+=oil*.18-rec*.04;
  if(['healthcare','utilities'].includes(sector)) base-=rate*.08-rec*.04;
  return {bear:clamp(50+base-18),base:clamp(50+base),bull:clamp(50+base+18)};
 }
 function challenge(a,radar={}){
  const risks=[];
  if(Number(a.valuationPercentile)>85) risks.push('Valoración históricamente exigente');
  if(Number(a.debtToEbitda)>4) risks.push('Apalancamiento elevado');
  if(Number(a.drawdown)<-35) risks.push('Drawdown profundo: requiere distinguir oportunidad de deterioro');
  if(Number(radar.components?.diversification)>85) risks.push('La diversificación favorece el activo: comprobar que no sea una falsa diversificación');
  if(!a.marginOfSafety && !a.valuationPercentile) risks.push('Sin margen de seguridad/valoración histórica suficiente');
  return risks;
 }
 function assess(a,radar,macro){
  const s=scenario(a,macro), risks=challenge(a,radar); const penalty=Math.min(20,risks.length*4);
  const confidence=clamp(Number(radar.confidence)-penalty);
  return {scenario:s,risks,confidence:Math.round(confidence),thesisStatus:risks.length>=3?'FRAGIL':risks.length?'REVISAR':'ROBUSTA'};
 }
 window.RadarRiskEngineV1={version:'1.0.0',scenario,challenge,assess};
})();
