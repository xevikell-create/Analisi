/* Patrimonio V2 — revisión de valoración.
   Calcula el valor de cada posición desde cantidad × precio y detecta
   discrepancias frente al importe almacenado manualmente.
*/
window.ValuationReviewV4={
  build(data, quotes, usdEur){
    const meta=Object.fromEntries((window.V4Portfolio?.positions||[]).map(p=>[p.name.toLowerCase(),p]));
    const aliases={'MSCI World Acc':'iShares Core MSCI World Acc','S&P 500 ETF':'Vanguard S&P 500 Dist ETF'};
    const rows=(data?.assets||[]).map(a=>{
      const name=a[0], stored=Number(a[1])||0;
      const m=meta[name.toLowerCase()]||meta[(aliases[name]||'').toLowerCase()]||{};
      const q=quotes?.[name]||quotes?.[aliases[name]]||quotes?.[m.ticker]||null;
      const qty=Number(m.quantity)||0, price=Number(q?.price);
      const currency=String(q?.currency||m.currency||'EUR').toUpperCase();
      let valueEUR=null;
      if(Number.isFinite(price)){
        const native=qty*price;
        valueEUR=currency==='USD'&&Number(usdEur)>0?native*Number(usdEur):native;
      }
      const diff=valueEUR==null?null:valueEUR-stored;
      const diffPct=valueEUR==null||stored===0?null:diff/stored;
      return {name,stored,quantity:qty,price:Number.isFinite(price)?price:null,currency,valueEUR,diff,diffPct,status:valueEUR==null?'PENDIENTE':Math.abs(diffPct||0)>0.05?'REVISAR':'OK'};
    });
    return rows;
  }
};
(function installReview(){
  async function render(){
    try{
      const data=V4Data();
      if(!data||!document.getElementById('app')) return;
      const market=await MarketV4.sync(data);
      const rows=ValuationReviewV4.build(data,market.quotes,market.usdEur);
      const old=document.getElementById('valuation-review'); if(old)old.remove();
      const box=document.createElement('div'); box.id='valuation-review'; box.className='card section';
      const money=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);
      const pct=n=>n==null?'—':(n*100).toFixed(1)+'%';
      box.innerHTML='<h3>🔎 Revisión de importes</h3><p class="muted">Compara el importe guardado con la valoración calculada por cantidad × precio actual.</p>'+rows.map(r=>'<div class="row"><span><b>'+esc(r.name)+'</b><br><span class="muted">'+r.quantity+' × '+(r.price==null?'precio pendiente':r.price+' '+r.currency')+'</span></span><span class="right"><b>'+ (r.valueEUR==null?'—':money(r.valueEUR)) +'</b><br><span class="badge '+(r.status==='OK'?'green':r.status==='REVISAR'?'amber':'red')+'">'+r.status+(r.diffPct==null?'':' · '+pct(r.diffPct))+'</span></span></div>').join('');
      document.getElementById('app').appendChild(box);
    }catch(e){console.warn('valuation review',e)}
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(render,1500));
  window.addEventListener('v4:refresh',render);
})();
