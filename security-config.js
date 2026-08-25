/* Patrimonio V2 — configuración de seguridad visible */
(function(){
  const SKEY='patrimonio_v2_security_v2';
  function get(){try{return JSON.parse(localStorage.getItem(SKEY)||'null')}catch(e){return null}}
  function save(v){localStorage.setItem(SKEY,JSON.stringify(v))}
  function renderSecurityConfig(){
    if(typeof pages==='undefined'||!pages.config||typeof data==='undefined')return;
    const original=pages.config;
    pages.config=function(){
      original();
      const root=document.querySelector('main#app'); if(!root)return;
      const st=get();
      const card=document.createElement('section');
      card.className='card section';
      card.innerHTML='<h2>🔐 Seguridad</h2><p class="muted">Protege el acceso a Patrimonio V2.</p>'+
        '<div class="row"><div><b>Bloqueo de acceso</b><div class="muted">Face ID / autenticación y PIN</div></div><span class="badge green">ACTIVO</span></div>'+
        '<div class="row"><div><b>Face ID</b><div class="muted">Autenticación biométrica del dispositivo</div></div><span class="badge">'+(st&&st.credentialId?'CONFIGURADO':'PENDIENTE')+'</span></div>'+
        '<div class="row"><div><b>PIN</b><div class="muted">PIN de 6 dígitos como alternativa</div></div><span class="badge">'+(st&&st.pinHash?'CONFIGURADO':'PENDIENTE')+'</span></div>'+
        '<div class="row"><div><b>Bloqueo automático</b><div class="muted">30 segundos sin actividad</div></div><span class="badge">30 s</span></div>'+
        '<button class="action" id="securityLockNow">🔒 Bloquear ahora</button>';
      root.appendChild(card);
      const btn=document.getElementById('securityLockNow');
      if(btn)btn.onclick=function(){if(typeof lock==='function')lock();};
    };
    pages.config();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(renderSecurityConfig,150));
})();
