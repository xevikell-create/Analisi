/* security layer for the personal PWA */
(function(){
  const LOCK_KEY='patrimonio_v4_lock';
  const TIMEOUT_MS=5*60*1000;
  let locked=false,lastActivity=Date.now();
  const supportsBiometric=!!(window.PublicKeyCredential&&navigator.credentials);
  function mark(){lastActivity=Date.now();}
  ['click','touchstart','keydown','scroll'].forEach(e=>window.addEventListener(e,mark,{passive:true}));
  function lock(){locked=true;const el=document.getElementById('security-lock');if(el){el.style.display='flex';}}
  function unlock(){locked=false;lastActivity=Date.now();const el=document.getElementById('security-lock');if(el){el.style.display='none';}}
  window.PatrimonioSecurity={lock,unlock,isLocked:()=>locked,supportsBiometric};
  setInterval(()=>{if(!locked&&Date.now()-lastActivity>TIMEOUT_MS)lock();},15000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden) mark();});
  document.addEventListener('DOMContentLoaded',()=>{
    const overlay=document.createElement('div');overlay.id='security-lock';overlay.style.cssText='display:none;position:fixed;inset:0;z-index:9999;background:#111827;color:#fff;align-items:center;justify-content:center;padding:24px;text-align:center';
    overlay.innerHTML='<div style="max-width:360px;width:100%"><div style="font-size:48px">🔒</div><h2>Patrimonio bloqueado</h2><p style="opacity:.75">La aplicación se bloqueó por inactividad.</p><button id="security-unlock" style="border:0;border-radius:12px;padding:13px 20px;font-weight:700">Desbloquear</button></div>';
    document.body.appendChild(overlay);document.getElementById('security-unlock').onclick=()=>unlock();
  });
})();
