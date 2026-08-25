/* Toyota P/L correction — source of truth: 83.34 shares, average cost 18.10 EUR/share. */
(function(){
  const KEY='patrimonio_positions_overrides';
  const TOYOTA={quantity:83.34,averageCost:18.10,costCurrency:'EUR'};
  function enforce(){
    try{
      const ov=JSON.parse(localStorage.getItem(KEY)||'{}');
      ov.Toyota={...(ov.Toyota||{}),...TOYOTA};
      localStorage.setItem(KEY,JSON.stringify(ov));
    }catch(e){ console.warn('Toyota override skipped',e); }
  }
  function run(){enforce();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
