/* Patrimonio V2 — Evolución patrimonial avanzada
   Añade histórico mensual/anual, aportaciones vs rentabilidad, XIRR, P/L anual,
   velocidad de creación de patrimonio y proyección al objetivo.
*/
(function(){
  const HIST='patrimony_snapshots_v2';
  const CF='patrimony_cashflows_v2';
  const oldHistKey='patrimonio_history_v1';
  const fmt=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0);
  const pct=n=>((Number(n)||0)*100).toFixed(1)+'%';
  const read=(k,f=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const today=()=>new Date().toISOString().slice(0,10);
  function snapshot(){
    if(typeof total!=='function') return;
    const t=Number(total())||0;
    if(t<=0) return;
    const a=read(HIST,[]), d=today(), old=a.find(x=>x.date===d);
    const s={date:d,value:t,liquidity:Number(typeof liq==='function'?liq():0)||0,invested:Number(window.I?.liveInvestment||0)||0,eth:Number(window.I?.eth?.valueEUR||0)||0};
    if(old) Object.assign(old,s); else a.push(s);
    a.sort((x,y)=>x.date.localeCompare(y.date));
    write(HIST,a.slice(-3650));
  }
  function migrate(){
    const a=read(HIST,[]), old=read(oldHistKey,[]);
    if(a.length||!old.length)return;
    const m=old.map(x=>({date:x.date,value:Number(x.value)||0,liquidity:null,invested:null,eth:null})).filter(x=>x.value>0);
    write(HIST,m);
  }
  function flows(){return read(CF,[]).filter(x=>Number.isFinite(Number(x.amount))&&x.amount!==0);}
  function addFlow(amount,date,type='Aportación',note=''){
    const a=flows();a.push({date:date||today(),amount:Number(amount),type,note});a.sort((x,y)=>x.date.localeCompare(y.date));write(CF,a);}
  function xirr(cfs){
    if(cfs.length<2)return null;
    const base=new Date(cfs[0].date).getTime();
    const f=r=>cfs.reduce((s,c)=>s+c.amount/Math.pow(1+r,(new Date(c.date).getTime()-base)/31557600000),0);
    let lo=-0.9999,hi=10;
    if(f(lo)*f(hi)>0)return null;
    for(let i=0;i<120;i++){const mid=(lo+hi)/2,v=f(mid);if(Math.abs(v)<1e-8)return mid;if(f(lo)*v<=0)hi=mid;else lo=mid;}
    return (lo+hi)/2;
  }
  function periods(){
    const a=read(HIST,[]).sort((x,y)=>x.date.localeCompare(y.date));
    const byMonth={},byYear={};
    a.forEach(x=>{byMonth[x.date.slice(0,7)]=x;byYear[x.date.slice(0,4)]=x});
    return {a,monthly:Object.values(byMonth),annual:Object.values(byYear)};
  }
  function contributionBetween(start,end){return flows().filter(f=>f.date>=start&&f.date<=end).reduce((s,f)=>s+Number(f.amount),0);}
  function periodStats(list){
    if(!list.length)return [];
    return list.map((x,i)=>{const prev=i?list[i-1]:null;const contrib=prev?contributionBetween(prev.date,x.date):0;const change=prev?x.value-prev.value:0;const gain=prev?change-contrib:0;return {...x,contrib,gain,change,returnPct:prev&&prev.value?gain/prev.value:null}});
  }
  function projection(){
    const t=Number(total())||0, weekly=Number(data?.weekly||400)||400, monthly=weekly*52/12, annual=monthly*12, r=(Number(data?.returnRate)||7)/100;
    const out=[];let v=t;
    for(let y=0;y<=20;y++){out.push({year:y,value:v,contributions:annual*y});v=v*(1+r)+annual;}
    return {out,monthly,annual};
  }
  function chartSVG(points,key='value'){
    if(!points.length)return '<div class="empty">Aún no hay suficiente histórico.</div>';
    const w=920,h=270,p=38,vals=points.map(x=>Number(x[key])||0),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
    const xy=points.map((x,i)=>[p+i*(w-2*p)/Math.max(1,points.length-1),h-p-((Number(x[key])||0)-min)/range*(h-2*p)]);
    const d=xy.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="270" aria-label="Evolución patrimonial"><path d="${d}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" stroke="currentColor" opacity=".15"/>${xy.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="currentColor"><title>${points[i].date} · ${fmt(points[i][key])}</title></circle>`).join('')}</svg>`;
  }
  function render(){
    const box=document.getElementById('evolutionV2');if(!box)return;
    snapshot();
    const p=periods(), ms=periodStats(p.monthly), ys=periodStats(p.annual), fs=flows(), last=p.a[p.a.length-1], first=p.a[0];
    const totalContrib=fs.reduce((s,f)=>s+Number(f.amount),0);
    const current=last?.value||Number(total())||0;
    const gainSinceFirst=first?current-first.value:0;
    const xr=xirr([...fs.map(f=>({date:f.date,amount:-Math.abs(Number(f.amount))})),{date:today(),amount:current}].sort((a,b)=>a.date.localeCompare(b.date)));
    const pr=projection();
    box.innerHTML=`
      <div class="card section">
        <h2>📈 Evolución patrimonial</h2>
        <div class="grid">
          <div><span class="muted">Patrimonio actual</span><div class="kpi sensitive">${money(current)}</div></div>
          <div><span class="muted">Crecimiento desde histórico</span><div class="kpi ${gainSinceFirst>=0?'positive':'negative'} sensitive">${gainSinceFirst>=0?'+':''}${money(gainSinceFirst)}</div></div>
          <div><span class="muted">Aportaciones registradas</span><div class="kpi sensitive">${money(totalContrib)}</div></div>
          <div><span class="muted">XIRR</span><div class="kpi">${xr==null?'—':pct(xr)}</div></div>
        </div>
        <div class="pill" style="margin:12px 0"><button class="secondary action" onclick="window.__evoMode='monthly';window.__evoRender()">Mensual</button><button class="secondary action" onclick="window.__evoMode='annual';window.__evoRender()">Anual</button><button class="secondary action" onclick="window.__evoMode='daily';window.__evoRender()">Diario</button></div>
        <div id="evoChart">${chartSVG(window.__evoMode==='annual'?p.annual:window.__evoMode==='daily'?p.a:p.monthly)}</div>
        <p class="muted">El histórico se registra automáticamente cada día y se resume por mes y año. No se inventan valores que la app no haya registrado.</p>
      </div>
      <div class="two">
        <div class="card"><h3>📅 Resultado por año</h3><div class="scroll"><table><thead><tr><th>Año</th><th>Patrimonio</th><th>Aportado</th><th>Ganancia</th><th>Rent.</th></tr></thead><tbody>${ys.map(r=>`<tr><td>${r.date.slice(0,4)}</td><td>${fmt(r.value)}</td><td>${r.contrib?fmt(r.contrib):'—'}</td><td class="${r.gain>=0?'positive':'negative'}">${r.contrib?fmt(r.gain):'—'}</td><td>${r.returnPct==null?'—':pct(r.returnPct)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="card"><h3>🗓️ Últimos meses</h3><div class="scroll"><table><thead><tr><th>Mes</th><th>Patrimonio</th><th>Aportado</th><th>Ganancia</th></tr></thead><tbody>${ms.slice(-12).reverse().map(r=>`<tr><td>${r.date}</td><td>${fmt(r.value)}</td><td>${r.contrib?fmt(r.contrib):'—'}</td><td class="${r.gain>=0?'positive':'negative'}">${r.contrib?fmt(r.gain):'—'}</td></tr>`).join('')}</tbody></table></div></div>
      </div>
      <div class="card section"><h3>⚡ Velocidad de creación de patrimonio</h3><div class="grid"><div><span class="muted">Últimos 12 meses</span><div class="kpi">${speed(365)}</div></div><div><span class="muted">Últimos 3 meses</span><div class="kpi">${speed(90)}</div></div><div><span class="muted">Media anual registrada</span><div class="kpi">${speedAnnual()}</div></div></div></div>
      <div class="card section"><h3>🎯 Proyección hacia 1 M€</h3><div class="grid"><div><span class="muted">Aportación semanal</span><div class="kpi">${fmt(pr.monthly/52)}</div></div><div><span class="muted">Aportación anual</span><div class="kpi">${fmt(pr.annual)}</div></div><div><span class="muted">10 años</span><div class="kpi sensitive">${fmt(pr.out[10].value)}</div></div><div><span class="muted">20 años</span><div class="kpi sensitive">${fmt(pr.out[20].value)}</div></div></div><p class="muted">Proyección matemática con la aportación configurada en la app y la rentabilidad anual asumida; no es una garantía.</p></div>
      <div class="card section"><h3>➕ Registrar histórico o flujo</h3><div class="form"><label>Fecha<input id="evo-date" type="date" value="${today()}"></label><label>Patrimonio de cierre<input id="evo-value" type="number" placeholder="Ej. 115000"></label><label>Aportación/flujo<input id="evo-flow" type="number" placeholder="Ej. 1000"></label><label>Tipo<select id="evo-type"><option>Aportación</option><option>Retirada</option><option>Transferencia</option></select></label></div><button class="action" style="margin-top:10px" onclick="window.__evoAdd()">Guardar registro</button><p class="small muted">Los cierres históricos introducidos manualmente quedan guardados y se usan para comparar meses/años. Las aportaciones sirven para separar ahorro de rentabilidad.</p></div>`;
  }
  function speed(days){const a=read(HIST,[]).sort((x,y)=>x.date.localeCompare(y.date)),cut=Date.now()-days*86400000;const z=a.filter(x=>new Date(x.date).getTime()>=cut);if(z.length<2)return '—';const first=z[0],last=z[z.length-1],f=flows().filter(x=>x.date>=first.date&&x.date<=last.date).reduce((s,x)=>s+Number(x.amount),0);return fmt((last.value-first.value-f)*(365/days))+' / año';}
  function speedAnnual(){const p=periods().annual;if(p.length<2)return '—';const diffs=periodStats(p).slice(1).map(x=>x.gain).filter(Number.isFinite);return diffs.length?fmt(diffs.reduce((a,b)=>a+b,0)/diffs.length):'—';}
  function addManual(){const d=document.getElementById('evo-date')?.value,v=Number(document.getElementById('evo-value')?.value),f=Number(document.getElementById('evo-flow')?.value||0),type=document.getElementById('evo-type')?.value||'Aportación';if(!d||!(v>0))return;const a=read(HIST,[]);const old=a.find(x=>x.date===d);const s={date:d,value:v,liquidity:old?.liquidity??null,invested:old?.invested??null,eth:old?.eth??null};if(old)Object.assign(old,s);else a.push(s);a.sort((x,y)=>x.date.localeCompare(y.date));write(HIST,a);if(f) addFlow(type==='Retirada'?-Math.abs(f):Math.abs(f),d,type);render();}
  window.__evoMode='monthly';window.__evoRender=render;window.__evoAdd=addManual;
  function mount(){
    migrate();snapshot();
    const app=document.getElementById('app');if(!app)return;
    let box=document.getElementById('evolutionV2');if(!box){box=document.createElement('div');box.id='evolutionV2';app.appendChild(box)}
    render();
  }
  const oldSet=window.setPage;
  if(oldSet){window.setPage=function(p){oldSet(p);if(p==='historial'||p==='dashboard'||p==='objetivo')setTimeout(mount,0)}}
  setTimeout(mount,0);setInterval(snapshot,60000);
})();
