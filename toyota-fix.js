/* Toyota P/L correction: keep the position and historical cost in JPY. */
(function(){
  const KEY='patrimonio_positions_overrides';
  try{
    const ov=JSON.parse(localStorage.getItem(KEY)||'{}');
    if(ov.Toyota){
      ov.Toyota={quantity:83.34,averageCost:2897};
      localStorage.setItem(KEY,JSON.stringify(ov));
    }
  }catch(e){ console.warn('Toyota migration skipped',e); }
  function run(){ if(typeof sync==='function') sync(); else setTimeout(run,100); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
