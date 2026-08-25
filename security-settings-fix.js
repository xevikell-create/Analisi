/* Conecta el centro de seguridad real al menú Configuración */
(function(){
  const oldConfig=window.pages?.config;
  if(!window.pages)return;
  const security=()=>window.openSecuritySettings?window.openSecuritySettings():window.pages.seguridad();
  const original=oldConfig;
  window.pages.config=function(){
    if(!original){security();return;}
    original();
    const app=document.getElementById('app');
    if(!app||document.getElementById('securitySettingsBtn'))return;
    const box=document.createElement('div');box.className='card section';box.id='securitySettingsBtn';
    box.innerHTML='<h3>🔐 Seguridad</h3><p class="muted">Configura Face ID, bloqueo y privacidad.</p><button class="action" onclick="openSecuritySettings()">⚙️ Configurar seguridad</button>';
    app.appendChild(box);
  };
})();
