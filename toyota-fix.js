/* Toyota P/L correction — source of truth: 83.34 shares, average cost 2,897 JPY/share. */
(function(){
  const KEY='patrimonio_positions_overrides';
  const TOYOTA={quantity:83.34,averageCost:2897};
  function enforce(){
    try{
      const ov=JSON.parse(localStorage.getItem(KEY)||'{}');
      if(ov.Toyota?.quantity!==TOYOTA.quantity || ov.Toyota?.averageCost!==TOYOTA.averageCost){
        ov.Toyota={...TOYOTA};
        localStorage.setItem(KEY,JSON.stringify(ov));
      }
    }catch(e){ console.warn('Toyota override skipped',e); }
  }
  function run(){
    enforce();
    if(typeof sync==='function') sync();
    else setTimeout(run,100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
