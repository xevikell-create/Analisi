/* RADAR EMERGENCY — last loaded, deliberately dependency-free */
(function(){
  function safe(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function num(v,d){var x=Number(v);return isFinite(x)?x:(d||0);}
  function renderRadar(){
    var app=document.getElementById('app');
    if(!app)return;
    app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="muted">Radar conectado. Cargando datos…</p></div>';
    fetch('./radar-data.json?emergency='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(data){
      var assets=data.assets||{};var list=[];
      Object.keys(assets).forEach(function(k){var a=assets[k]||{};if(num(a.price)>0){var growth=Math.max(0,Math.min(100,50+num(a.revenueGrowth)*1.3));var eps=Math.max(0,Math.min(100,50+num(a.epsGrowth)*.7));var quality=Math.max(0,Math.min(100,num(a.roe)/35*35+num(a.roic)/30*35+num(a.operatingMargin)/35*30));var balance=Math.max(0,Math.min(100,100-num(a.debtToEbitda)*18));var val=Math.max(0,Math.min(100,100-Math.max(0,num(a.pe,30)-10)*2.2));var fcf=Math.max(0,Math.min(100,50+num(a.fcfMargin)*2));var score=Math.round(growth*.22+eps*.14+quality*.22+balance*.12+val*.15+fcf*.08+7);list.push({a:a,score:score});}});
      list.sort(function(x,y){return y.score-x.score;});var opp=list.filter(function(x){return x.score>=78;});var watch=list.filter(function(x){return x.score>=62&&x.score<78;});var first=list[0];
      var rows=list.map(function(x){var action=x.score>=78?'OPORTUNIDAD':x.score>=62?'VIGILAR':'ESPERAR';var cls=x.score>=78?'green':x.score>=62?'amber':'red';return '<div class="row"><span><b>'+safe(x.a.name||x.a.ticker)+'</b><br><span class="muted">'+safe(x.a.ticker)+' · '+action+' · datos '+num(x.a.completeness)+'%</span></span><span class="badge '+cls+'">'+x.score+'/100</span></div>';}).join('');
      app.innerHTML='<h2>🔎 Radar</h2><p class="muted">Motor operativo · fundamentales + valoración + calidad + riesgo.</p><div class="radar-stats"><div><b>'+opp.length+'</b><span>Oportunidades</span></div><div><b>'+watch.length+'</b><span>En vigilancia</span></div><div><b>'+list.length+'</b><span>Activos válidos</span></div></div><div class="card hero"><span class="badge">PRÓXIMO EURO</span><h2>'+(first?safe(first.a.name||first.a.ticker):'ESPERAR')+'</h2><div class="kpi">'+(first?first.score+'/100':'—')+'</div><p>'+(first?'Señal calculada con los datos disponibles.':'No hay activos con precio válido.')+'</p></div><div class="card section"><h3>🏆 Ranking</h3>'+(rows||'<div class="empty">Sin activos válidos.</div>')+'</div><div class="card section"><h3>🛡️ Diagnóstico</h3><div class="row"><span>Datos recibidos</span><b>'+Object.keys(assets).length+'</b></div><div class="row"><span>Precios válidos</span><b>'+list.length+'</b></div><div class="row"><span>Última actualización</span><b>'+safe(data.updatedAt||'—')+'</b></div><div class="row"><span>Motor</span><b>EMERGENCY ACTIVO</b></div></div>';
    }).catch(function(e){app.innerHTML='<div class="card"><h2>🔎 Radar</h2><p class="negative"><b>Error del Radar</b></p><p class="muted">'+safe(e.message)+'</p><button class="action" onclick="location.reload()">Reintentar</button></div>';});
  }
  function install(){if(typeof pages==='undefined'){setTimeout(install,50);return;}pages.radar=renderRadar;if(typeof current!=='undefined'&&current==='radar')renderRadar();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
