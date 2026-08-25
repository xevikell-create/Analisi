/* Centro de configuración de seguridad — independiente del router */
(function(){
  const KEY='patrimonio_security_settings';
  const defaults={biometric:true,lockOnBackground:false,lockOnReload:true,privateMode:false};
  function get(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s));window.SECURITY_SETTINGS=s;}
  window.SECURITY_SETTINGS=get();
  window.openSecuritySettings=function(){
    const s=get(); const app=document.getElementById('app'); if(!app)return;
    app.innerHTML=`<h2>🔐 Seguridad</h2><div class="card"><p class="muted">Configura aquí toda la protección de tu patrimonio.</p>
      <div class="row"><div><b>Face ID / biometría</b><br><span class="muted">Solicitar validación para acceder.</span></div><input id="sec-biometric" type="checkbox" ${s.biometric?'checked':''} style="width:auto"></div>
      <div class="row"><div><b>Bloquear al salir</b><br><span class="muted">Bloquea al pasar la app a segundo plano.</span></div><input id="sec-bg" type="checkbox" ${s.lockOnBackground?'checked':''} style="width:auto"></div>
      <div class="row"><div><b>Bloquear al recargar</b><br><span class="muted">Solicita validación al abrir de nuevo.</span></div><input id="sec-reload" type="checkbox" ${s.lockOnReload?'checked':''} style="width:auto"></div>
      <div class="row"><div><b>Modo privado</b><br><span class="muted">Oculta importes sensibles.</span></div><input id="sec-private" type="checkbox" ${s.privateMode?'checked':''} style="width:auto"></div>
      <button class="action" onclick="saveSecuritySettings()">Guardar configuración</button></div>`;
  };
  window.saveSecuritySettings=function(){const s={biometric:document.getElementById('sec-biometric').checked,lockOnBackground:document.getElementById('sec-bg').checked,lockOnReload:document.getElementById('sec-reload').checked,privateMode:document.getElementById('sec-private').checked};save(s);document.body.classList.toggle('private-mode',s.privateMode);alert('Configuración de seguridad guardada');};
})();
