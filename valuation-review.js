/* Patrimonio V2 — revisión de valoración.
   Calcula valor actual, coste y discrepancia del importe manual.
   Nunca sobrescribe el dato manual: solo lo contrasta.
*/
window.ValuationReviewV4={
  build(data, quotes, fx){
    const meta=Object.fromEntries((window.V4Portfolio?.positions||[]).map(p=>[p.name.toLowerCase(),p]));
    const aliases={'MSCI World Acc':'iShares Core MSCI World Acc','S&P 500 ETF':'Vanguard S&P 500 Dist ETF'};
    const rows=(data?.assets||[]).map(a=>{
      const name=a[0], stored=Number(a[1])||0;
      const m=meta[name.toLowerCase()]||meta[(aliases[name]||'').toLowerCase()]||{};
      const q=quotes?.[name]||quotes?.[aliases[name]]||quotes?.[m.ticker]||null;
      const qty=Number(m.quantity)||0, price=Number(q?.price);
      const currency=String(q?.currency||m.currency||'EUR').toUpperCase();
      const usdEur=Number(fx?.usdEur)||0, hkdEur=Number(fx?.hkdEur)||0;
      let valueEUR=null;
      if(Number.isFinite(price)){
        const native=qty*price;
        if(currency==='EUR') valueEUR=native;
        else if(currency==='USD'&&usdEur>0) valueEUR=native*usdEur;
        else if(currency==='HKD'&&hkdEur>0) valueEUR=native*hkdEur;
      }
      const diff=valueEUR==null?null:valueEUR-stored;
      const diffPct=valueEUR==null||stored===0?null:diff/stored;
      return {name,stored,quantity:qty,price:Number.isFinite(price)?price:null,currency,valueEUR,diff,diffPct,status:valueEUR==null?'PENDIENTE':stored===0?'SIN IMPORTE BASE':Math.abs(diffPct)>0.05?'REVISAR':'OK'};
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
      const rows=ValuationReviewV4.build(data,market.quotes,{usdEur:market.usdEur,hkdEur:market.hkdEur});
      const old=document.getElementById('valuation-review'); if(old)old.remove();
      const box=document.createElement('div'); box.id='valuation-review'; box.className='card section';
      const money=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);
      const pct=n=>n==null?'—':(n*100).toFixed(1)+'%';
      const diffText=r=>r.diff==null?'':` · ${r.diff>0?'+':''}${money(r.diff)}`;
      box.innerHTML='<h3>🔎 Revisión de importes</h3><p class="muted">Valor actual calculado = cantidad × precio. Se compara con el importe manual sin modificarlo.</p>'+rows.map(r=>'<div class="row"><span><b>'+esc(r.name)+'</b><br><span class="muted">'+(r.quantity?r.quantity:'Cantidad pendiente')+' × '+(r.price==null?'precio pendiente':r.price+' '+r.currency)+'</span></span><span class="right"><b>'+ (r.valueEUR==null?'—':money(r.valueEUR)) +'</b><br><span class="badge '+(r.status==='OK'?'green':r.status==='REVISAR'?'amber':'red')+'">'+r.status+(r.diffPct==null?'':' · '+pct(r.diffPct))+diffText(r)+'</span></span></div>').join('');
      document.getElementById('app').appendChild(box);
    }catch(e){console.warn('valuation review',e)}
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(render,1500));
  window.addEventListener('v4:refresh',render);
})();
