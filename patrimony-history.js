/* Legacy history capture + migration source. The visible chart is owned by patrimony-evolution-v2.js. */
(function(){
  const KEY='patrimonio_history_v1';
  const MAX=3650;
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
  const write=a=>localStorage.setItem(KEY,JSON.stringify(a.slice(-MAX)));
  function capture(){
    if(document.body.classList.contains('private-mode'))return;
    const hero=document.querySelector('.hero .kpi.sensitive');
    if(!hero)return;
    const raw=hero.textContent.replace(/[^0-9,.-]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');
    const value=Number(raw);
    if(!Number.isFinite(value)||value<=0)return;
    const now=new Date(),day=now.toISOString().slice(0,10),a=read(),existing=a.find(x=>x.date===day);
    if(existing){existing.value=value;existing.timestamp=now.toISOString();}
    else a.push({date:day,timestamp:now.toISOString(),value});
    a.sort((x,y)=>x.date.localeCompare(y.date));write(a);
  }
  window.__patHistCapture=capture;
  const base=window.setPage;
  if(base)window.setPage=function(p){const r=base.apply(this,arguments);if(p==='dashboard')setTimeout(capture,0);return r;};
  setTimeout(capture,250);
  setInterval(()=>{if(window.current==='dashboard')capture()},60000);
})();