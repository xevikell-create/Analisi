/* Centro de configuración de seguridad */
(function(){
  const KEY='patrimonio_security_settings';
  const defaults={biometric:true,lockOnBackground:true,lockOnReload:true,privateMode:false};
  function get(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s));window.SECURITY_SETTINGS=s;}
  window.SECURITY_SETTINGS=get();
  window.pages=window.pages||{};
  window.pages.seguridad=function(){
    const s=get();
    document.getElementById('app').innerHTML=`<h2>🔐 Seguridad</h2><div class="card"><p class="muted">Configura aquí toda la protección de tu patrimonio.</p>
    <div class="row"><div><b>Face ID / biometría</b><br><span class="muted">Solicitar validación para acceder a la app.</span></div><input id="sec-biometric" type="checkbox" ${s.biometric?'checked':''} style="width:auto"></div>
    <div class="row"><div><b>Bloquear al salir</b><br><span class="muted">Bloquea la app cuando pasa a segundo plano.</span></div><input id="sec-bg" type="checkbox" ${s.lockOnBackground?'checked':''} style="width:auto"></div>
    <div class="row"><div><b>Bloquear al recargar</b><br><span class="muted">Vuelve a pedir validación al abrir/recargar.</span></div><input id="sec-reload" type="checkbox" ${s.lockOnReload?'checked':''} style="width:auto"></div>
    <div class="row"><div><b>Modo privado</b><br><span class="muted">Oculta los importes sensibles.</span></div><input id="sec-private" type="checkbox" ${s.privateMode?'checked':''} style="width:auto"></div>
    <button class="action" onclick="saveSecuritySettings()">Guardar configuración</button></div>`;
  };
  window.saveSecuritySettings=function(){save({biometric:document.getElementById('sec-biometric').checked,lockOnBackground:document.getElementById('sec-bg').checked,lockOnReload:document.getElementById('sec-reload').checked,privateMode:document.getElementById('sec-private').checked});alert('Configuración de seguridad guardada');};
  window.openSecuritySettings=function(){window.pages.seguridad();};
})();
