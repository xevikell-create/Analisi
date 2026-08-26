/* RADAR INTELLIGENCE V1 — macro/news context, conservative by design */
window.RadarIntelligenceV1={
 version:'1.0.0',
 updatedAt:'2026-08-26T23:00:00+02:00',
 macro:{
  usInflation:3.7,usCoreInflation:3.3,fedRateLow:3.5,fedRateHigh:3.75,
  euroInflation:2.8,ecbRatesUnchanged:true,
  oilBrent:87.84,us10y:4.70,us30y:5.30,
  regime:'INFLACION_PERSISTENTE_Y_TIPOS_RESTRICTIVOS',
  riskLevel:'MEDIO-ALTO'
 },
 themes:[
  {id:'inflation',label:'Inflación persistente',impact:'negative',sectors:['Technology','Consumer','Industrials'],weight:0.8},
  {id:'rates',label:'Tipos altos / yields elevados',impact:'negative',sectors:['Technology','Utilities','Real Estate'],weight:0.9},
  {id:'ai',label:'Inversión y expectativas de IA',impact:'mixed',sectors:['Technology','Semiconductors'],weight:0.7},
  {id:'energy',label:'Energía y riesgo geopolítico',impact:'mixed',sectors:['Energy','Industrials','Consumer'],weight:0.7},
  {id:'geopolitics',label:'Riesgo geopolítico Oriente Medio',impact:'negative',sectors:['Global'],weight:0.8}
 ],
 sources:[
  {name:'Federal Reserve',url:'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm'},
  {name:'ECB',url:'https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp260723~29f24d99bc.en.html'},
  {name:'Reuters',url:'https://www.reuters.com/world/china/global-markets-wrapup-1-2026-08-26/'},
  {name:'Financial Times',url:'https://www.ft.com/content/c96c25c1-b27c-4c08-a2ba-21821b39dd78'}
 ],
 sectorAdjustment(sector){
  const m={Technology:-5,Semiconductors:-4,Utilities:-7,'Real Estate':-8,Energy:2,Financials:1,Healthcare:2,Consumer:-2,Industrials:-2,Automotive:-2};
  return m[sector]||0;
 },
 confidence(){return 82}
};
