/* Patrimonio V2 — Análisis standalone boot */
(function(){
  function renderAnalysis(){
    const app=document.getElementById('app'); if(!app)return;
    app.innerHTML='<div id="evolutionV2"></div>';
    const box=document.getElementById('evolutionV2');
    try{
      if(typeof window.__evoRender==='function') window.__evoRender();
      else box.innerHTML='<div class="card"><h2>📈 Análisis</h2><div class="empty">El módulo de análisis no se ha cargado.</div></div>';
    }catch(e){
      console.error('Análisis:',e);
      box.innerHTML='<div class="card"><h2>📈 Análisis</h2><div class="empty">Error al cargar el análisis. Recarga la aplicación.</div></div>';
    }
  }
  const base=window.setPage;
  window.setPage=function(p){
    if(p==='analisis'){
      window.current='analisis';
      document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.p===p));
      renderAnalysis(); window.scrollTo(0,0); return;
    }
    if(typeof base==='function') base(p);
  };
  setTimeout(function(){
    const nav=document.getElementById('nav');
    if(nav && !nav.querySelector('[data-p="analisis"]')){
      const b=document.createElement('button'); b.dataset.p='analisis'; b.textContent='📈 Análisis';
      b.onclick=function(){window.setPage('analisis')}; nav.appendChild(b);
    }
  },0);
})();