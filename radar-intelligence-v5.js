/* RADAR INTELLIGENCE V5.1 — conservative, portfolio-aware, data-gated */
(function(){
  const VERSION='5.1.0';
  const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,Number(x)||0));
  const finite=x=>Number.isFinite(Number(x));
  const avg=a=>{const v=a.filter(finite).map(Number);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};
  const SOURCE_POLICY={primary:['SEC/EDGAR','Federal Reserve','ECB','Eurostat','company filings','exchange/regulator'],secondary:['Reuters','high-quality financial news'],tertiary:['other media/social']};
  const DEFAULTS={weights:{quality:.20,valuation:.17,growth:.12,balance:.11,market:.07,macro:.08,news:.07,diversification:.10,liquidity:.03,risk:.05},minConfidence:65,minData:72,maxPosition:.10,maxSector:.25,maxCountry:.45};
  function scoreFundamentals(a){return avg([a.quality,a.roe!==undefined?clamp(Number(a.roe)/35*100):null,a.roic!==undefined?clamp(Number(a.roic)/30*100):null,a.operatingMargin!==undefined?clamp(Number(a.operatingMargin)/35*100):null,a.fcfMargin!==undefined?clamp((Number(a.fcfMargin)+10)/40*100):null]);}
  function scoreValuation(a){return avg([a.marginOfSafety!==undefined?clamp(50+Number(a.marginOfSafety)*1.5):null,a.valuationPercentile!==undefined?100-Number(a.valuationPercentile):null,a.peVs5y!==undefined?clamp(100-(Number(a.peVs5y)-1)*80):null]);}
  function scoreGrowth(a){return avg([a.revenueGrowth!==undefined?clamp(50+Number(a.revenueGrowth)*1.8):null,a.epsGrowth!==undefined?clamp(50+Number(a.epsGrowth)*1.2):null,a.fcfGrowth!==undefined?clamp(50+Number(a.fcfGrowth)*1.2):null]);}
  function scoreBalance(a){return avg([a.debtToEbitda!==undefined?clamp(100-Number(a.debtToEbitda)*25):null,a.interestCoverage!==undefined?clamp(Number(a.interestCoverage)*7):null,a.currentRatio!==undefined?clamp(Number(a.currentRatio)*45):null]);}
  function scoreMarket(a){return avg([a.return1m!==undefined?clamp(50+Number(a.return1m)*2):null,a.return6m!==undefined?clamp(50+Number(a.return6m)):null,a.return12m!==undefined?clamp(50+Number(a.return12m)*.6):null,a.drawdown!==undefined?clamp(50+Number(a.drawdown)*1.5):null]);}
  function scoreRisk(a){let s=70;if(finite(a.beta)){if(a.beta>1.6)s-=25;else if(a.beta>1.3)s-=12;else if(a.beta<.8)s+=8}if(finite(a.volatility)){if(a.volatility>45)s-=25;else if(a.volatility>30)s-=12;else if(a.volatility<18)s+=8}if(finite(a.debtToEbitda)&&a.debtToEbitda>4)s-=25;return clamp(s)}
  function scoreMacro(a,macro){if(!macro)return null;let s=60;const sector=String(a.sector||'').toLowerCase();
    if(finite(macro.inflation))s+=macro.inflation<2.5?8:macro.inflation>4?-10:0;
    if(finite(macro.ratePressure)){
      const rateSensitivity=finite(a.rateSensitivity)?Number(a.rateSensitivity):(['technology','real estate','utilities','consumer discretionary'].includes(sector)?1:0.35);
      s-=Number(macro.ratePressure)*.18*rateSensitivity;
    }
    if(finite(macro.oilShock)){
      const oilSensitivity=finite(a.oilSensitivity)?Number(a.oilSensitivity):(['energy','oil & gas','materials'].includes(sector)?-0.35:0.35);
      s-=Number(macro.oilShock)*.08*oilSensitivity;
    }
    if(finite(macro.recessionRisk))s-=Number(macro.recessionRisk)*.25*(finite(a.cycleSensitivity)?Number(a.cycleSensitivity):1);
    if(finite(macro.liquidity))s+=Number(macro.liquidity)*.12;
    return clamp(s);
  }
  function scoreNews(a,news){if(!news)return null;const items=(news[a.ticker]||news[a.name]||[]);if(!items.length)return null;let weighted=0,total=0;items.slice(0,20).forEach(n=>{const rec=clamp(n.reliability??.7,0,1),impact=clamp(Number(n.impact)||0,-1,1),age=Math.max(0,(Date.now()-new Date(n.date||Date.now()).getTime())/86400000),decay=Math.exp(-age/14);weighted+=(impact*rec*decay);total+=rec*decay});return total?clamp(50+weighted*50/total):null;}
  function diversification(a,ctx){let s=70,w=ctx.assetWeights?.[a.ticker]||0,sw=ctx.sectorWeights?.[a.sector]||0,cw=ctx.countryWeights?.[a.country]||0;if(w>DEFAULTS.maxPosition)s-=35;else if(w>.07)s-=15;else if(w<.02)s+=10;if(sw>DEFAULTS.maxSector)s-=25;else if(sw>.20)s-=10;else if(sw<.08)s+=8;if(cw>DEFAULTS.maxCountry)s-=20;else if(cw>.35)s-=8;else if(cw<.15)s+=5;return clamp(s)}
  function dataQuality(a){
    const critical=['price','currency'];
    const preferred=['quality','marginOfSafety','revenueGrowth','epsGrowth','fcfMargin','debtToEbitda','sector','country'];
    const missingCritical=critical.filter(k=>a[k]===undefined||a[k]===null||a[k]==='').length;
    const missingPreferred=preferred.filter(k=>a[k]===undefined||a[k]===null||a[k]==='').length;
    const t=Date.parse(a.updatedAt||'');
    const age=Number.isFinite(t)?Math.max(0,Date.now()-t):Infinity;
    const freshness=Number.isFinite(age)?clamp(100-age/(30*86400000)*100):0;
    const source=String(a.sourceType||'').toLowerCase();
    const sourceScore=source==='primary'||source==='institutional'?100:source==='licensed'?98:source==='financial'?90:source==='secondary'?70:source?50:35;
    return clamp(100-missingCritical*40-missingPreferred*5)*.55+freshness*.25+sourceScore*.20;
  }
  function score(a,ctx={},macro=null,news=null){
    const q=dataQuality(a);
    const components={quality:scoreFundamentals(a),valuation:scoreValuation(a),growth:scoreGrowth(a),balance:scoreBalance(a),market:scoreMarket(a),macro:scoreMacro(a,macro),news:scoreNews(a,news),diversification:diversification(a,ctx),liquidity:finite(a.avgVolume)?clamp(Number(a.avgVolume)/5000000*100):null,risk:scoreRisk(a)};
    const weights=DEFAULTS.weights;let total=0,w=0;
    Object.keys(weights).forEach(k=>{if(components[k]!==null){total+=components[k]*weights[k];w+=weights[k]}});
    const raw=w?total/w:0;
    const confidence=clamp(q*.55+(components.macro===null?55:100)*.15+(components.news===null?50:100)*.10+(components.valuation===null?55:100)*.20);
    if(q<DEFAULTS.minData||confidence<DEFAULTS.minConfidence)return{version:VERSION,score:0,confidence:Math.round(confidence),action:'DATOS_INSUFICIENTES',components,dataQuality:Math.round(q)};
    const risk=components.risk,final=clamp(raw-(risk<40?15:0));
    const action=final>=78?'OPORTUNIDAD':final>=62?'VIGILAR':final>=48?'ESPERAR':'EVITAR';
    return{version:VERSION,score:Math.round(final),confidence:Math.round(confidence),action,components,dataQuality:Math.round(q),sourcePolicy:SOURCE_POLICY};
  }
  function buildContext(positions,total){const t=Math.max(1,Number(total)||0),assetWeights={},sectorWeights={},countryWeights={};(positions||[]).forEach(p=>{const v=Number(p.valueEUR)||0;assetWeights[p.ticker||p.name]=v/t;if(p.sector)sectorWeights[p.sector]=(sectorWeights[p.sector]||0)+v/t;if(p.country)countryWeights[p.country]=(countryWeights[p.country]||0)+v/t});return{assetWeights,sectorWeights,countryWeights}}
  window.RadarIntelligenceV5={VERSION,DEFAULTS,SOURCE_POLICY,score,buildContext,rank(list,ctx,macro,news){return(list||[]).map(a=>({...a,radar:score(a,ctx,macro,news)})).sort((x,y)=>{const xb=x.radar.action==='DATOS_INSUFICIENTES',yb=y.radar.action==='DATOS_INSUFICIENTES';return xb!==yb?(xb?1:-1):y.radar.score-x.radar.score})}};
})();
