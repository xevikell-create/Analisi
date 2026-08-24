/* Keep the application configuration screen as the single source of truth. */
(function(){
  function restore(){
    if(typeof pages==='undefined'||typeof data==='undefined'||typeof render==='undefined')return;
    window.openPatrimonioConfig=function(){
      current='config';
      document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.p==='config'));
      pages.config();
      window.scrollTo(0,0);
      if(typeof applyPrivate==='function')applyPrivate();
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(restore,50));
  else setTimeout(restore,50);
})();
