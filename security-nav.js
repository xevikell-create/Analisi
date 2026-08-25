/* Añade el acceso visible a Seguridad sin alterar el menú principal */
(function(){
  function mount(){
    const nav=document.getElementById('nav'); if(!nav)return;
    if(document.querySelector('[data-p="seguridad"]'))return;
    const b=document.createElement('button');
    b.dataset.p='seguridad'; b.textContent='🔐 Seguridad';
    b.onclick=()=>{window.current='seguridad';document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));window.openSecuritySettings();window.scrollTo(0,0)};
    nav.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,50));else setTimeout(mount,50);
})();
