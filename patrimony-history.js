/* Patrimonio V2 — histórico real de patrimonio */
(function(){
  const KEY='patrimonio_history_v1';
  const MAX=3650;
  const moneyText=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
  const write=a=>localStorage.setItem(KEY,JSON.stringify(a.slice(-MAX)));
  function capture(){
    if(document.body.classList.contains('private-mode')) return;
    const hero=document.querySelector('.hero .kpi.sensitive');
    if(!hero) return;
    const raw=hero.textContent.replace(/[^0-9,.-]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');
    const value=Number(raw);
    if(!Number.isFinite(value)||value<=0)return;
    const now=new Date();
    const day=now.toISOString().slice(0,10);
    const a=read();
    const existing=a.find(x=>x.date===day);
    if(existing){existing.value=value;existing.timestamp=now.toISOString();}
    else a.push({date:day,timestamp:now.toISOString(),value});
    write(a);
  }
  function points(mode){
    const a=read();
    if(mode==='daily') return a;
    if(mode==='monthly'){
      const m=new Map();a.forEach(x=>m.set(x.date.slice(0,7),x));
      return [...m.values()];
    }
    const y=new Map();a.forEach(x=>y.set(x.date.slice(0,4),x));
    return [...y.values()];
  }
  function chart(mode='daily'){
    const box=document.getElementById('patrimonyHistory');if(!box)return;
    const pts=points(mode);
    if(!pts.length){box.innerHTML='<div class="empty">El histórico empezará a registrarse desde hoy. No se inventan datos anteriores.</div>';return;}
    const w=900,h=260,p=34,vals=pts.map(x=>x.value),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
    const path=pts.map((x,i)=>{const X=p+(i*Math.max(1,w-2*p))/Math.max(1,pts.length-1);const Y=h-p-((x.value-min)/range)*(h-2*p);return [X,Y,x]});
    const d=path.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
    const last=pts[pts.length-1],prev=pts.length>1?pts[pts.length-2]:null,delta=prev?last.value-prev.value:0,pct=prev?delta/prev.value:0;
    box.innerHTML=`<div class="pill" style="margin-bottom:10px"><button class="secondary action" onclick="window.__patHist('daily')">Diario</button><button class="secondary action" onclick="window.__patHist('monthly')">Mensual</button><button class="secondary action" onclick="window.__patHist('annual')">Anual</button></div><div class="small muted">${pts.length} ${mode==='daily'?'días':mode==='monthly'?'meses':'años'} registrados · último: ${new Date(last.date).toLocaleDateString('es-ES')}</div><div style="overflow:auto"><svg viewBox="0 0 ${w} ${h}" width="100%" height="260" role="img" aria-label="Evolución histórica del patrimonio"><path d="${d}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${path.map(q=>`<circle cx="${q[0]}" cy="${q[1]}" r="4" fill="currentColor"><title>${new Date(q[2].date).toLocaleDateString('es-ES')} · ${moneyText(q[2].value)}</title></circle>`).join('')}</svg></div><div class="grid"><div class="card"><span class="muted">Último patrimonio</span><div class="kpi sensitive">${moneyText(last.value)}</div></div><div class="card"><span class="muted">Variación periodo</span><div class="kpi ${delta>=0?'positive':'negative'} sensitive">${delta>=0?'+':''}${moneyText(delta)}</div><span>${(pct*100).toFixed(1)}%</span></div></div>`;
  }
  window.__patHist=chart;
  function mount(){
    capture();
    const app=document.getElementById('app');if(!app||document.getElementById('patrimonyHistory'))return;
    const card=document.createElement('div');card.className='card section';card.id='patrimonyHistoryCard';card.innerHTML='<h3>📈 Evolución del patrimonio</h3><div id="patrimonyHistory"></div>';
    app.appendChild(card);chart('daily');
  }
  const oldSet=window.setPage;
  if(oldSet){window.setPage=function(p){oldSet(p);if(p==='dashboard')setTimeout(mount,0);};}
  setTimeout(mount,0);
  setInterval(()=>{if(window.current==='dashboard'||document.querySelector('.hero .kpi.sensitive'))capture();},60000);
})();
