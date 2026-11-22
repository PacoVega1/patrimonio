(()=> {
  const KEY='patrimonio_theme';
  const apply=mode=>{
    document.body.classList.toggle('dark-mode',mode==='dark');
    try{localStorage.setItem(KEY,mode)}catch(e){}
    const b=document.getElementById('themeToggle');
    if(b){b.textContent=mode==='dark'?'☀️ Modo claro':'🌙 Modo oscuro';b.setAttribute('aria-pressed',String(mode==='dark'))}
  };
  window.togglePatrimonioTheme=()=>{
    const next=document.body.classList.contains('dark-mode')?'light':'dark';
    apply(next);
  };
  let saved='light';
  try{saved=localStorage.getItem(KEY)==='dark'?'dark':'light'}catch(e){}
  apply(saved);
  const css=`
    body.dark-mode{--bg:#101722;--c:#1b2635;--t:#e8eef7;--m:#a8b5c8;--l:#354459;--g:#55d98b;--r:#ff827a;--w:#f1cc75;color-scheme:dark}
    body.dark-mode .card,body.dark-mode .section,body.dark-mode .modalbox,body.dark-mode .library-item,
    body.dark-mode .entity-cash-chip,body.dark-mode .inactive{background:#1b2635!important;color:var(--t);border-color:var(--l)}
    body.dark-mode .tab{background:#202d3e;color:var(--t);border-color:var(--l)}
    body.dark-mode .tab.active,body.dark-mode .btn{background:var(--b);color:#fff}
    body.dark-mode .btn.alt{background:#202d3e;color:#e8eef7;border-color:#465970}
    body.dark-mode .entity-head,body.dark-mode .category-head{background:linear-gradient(90deg,#24364b,#1b293a)!important;border-color:#40536b}
    body.dark-mode .entity-body{background:#172231!important;border-color:#40536b}
    body.dark-mode .entity-investment-title,body.dark-mode .entity-accounts-title{background:linear-gradient(90deg,#203a35,#1c302d)!important;border-color:#365b50}
    body.dark-mode .entity-investment-title h3,body.dark-mode .entity-accounts-title h3,body.dark-mode .category-head h3{color:#8bd8ae}
    body.dark-mode .entity-investment-group,body.dark-mode .entity-accounts{border-color:var(--l)}
    body.dark-mode .entity-investment-group .ptable thead th{background:#202d3e}
    body.dark-mode .ptable tbody tr:hover{background:#26364a}
    body.dark-mode .pill{background:#263d5a;color:#b9d5ff}
    body.dark-mode .pill.ok{background:#1d4435;color:#9be5bd}
    body.dark-mode .pill.warn{background:#493c20;color:#f4d58b}
    body.dark-mode input,body.dark-mode select,body.dark-mode textarea{background:#111c2a!important;color:var(--t)!important;border-color:#465970!important}
    body.dark-mode .modal{background:#020711bb}
    body.dark-mode .notice{background:#44391f;color:#f4d58b}
    body.dark-mode .error{background:#482b30;color:#ffaaa4}
    body.dark-mode .empty{color:var(--m)}
    body.dark-mode table th,body.dark-mode table td{border-color:var(--l)!important}
    body.dark-mode .inactive{background:#2b2a20!important;border-color:#66552d!important}
    body.dark-mode .stat{background:#ffffff16}
    body.dark-mode [style*="background:#fff"],body.dark-mode [style*="background: #fff"],body.dark-mode [style*="background:white"]{background:#1b2635!important;color:var(--t)!important}
    body.dark-mode [style*="border-top:1px solid #d5dfeb"],body.dark-mode [style*="border-bottom:1px solid #d5dfeb"]{border-color:var(--l)!important}
    @media(max-width:650px){body.dark-mode .top{align-items:flex-start;flex-wrap:wrap}}
  `;
  const style=document.createElement('style');style.id='patrimonio-dark-theme';style.textContent=css;document.head.appendChild(style);
  const addButton=()=>{
    const top=document.querySelector('#app .top');
    if(!top||document.getElementById('themeToggle'))return;
    const b=document.createElement('button');b.id='themeToggle';b.className='btn alt';b.type='button';
    b.onclick=window.togglePatrimonioTheme;top.appendChild(b);
    apply(document.body.classList.contains('dark-mode')?'dark':'light');
  };
  const start=()=>{addButton();const root=document.getElementById('app');if(root)new MutationObserver(addButton).observe(root,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();