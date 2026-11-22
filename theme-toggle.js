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
    body.dark-mode{--bg:#101722;--c:#1b2635;--t:#e8eef7;--m:#b8c5d8;--l:#40516a;--g:#55d98b;--r:#ff827a;--w:#f1cc75;color-scheme:dark}
    body.dark-mode #app{color:var(--t)}
    body.dark-mode .card,body.dark-mode .section,body.dark-mode .modalbox,body.dark-mode .library-item,
    body.dark-mode .entity-cash-chip,body.dark-mode .inactive{background:#1b2635!important;color:var(--t)!important;border-color:var(--l)!important}
    body.dark-mode .tab{background:#202d3e!important;color:#e8eef7!important;border-color:var(--l)!important}
    body.dark-mode .tab.active,body.dark-mode .btn{background:var(--b);color:#fff}
    body.dark-mode .btn.alt{background:#202d3e!important;color:#e8eef7!important;border-color:#465970!important}
    body.dark-mode .entity-head,body.dark-mode .category-head{background:linear-gradient(90deg,#24364b,#1b293a)!important;border-color:#40536b!important;color:#f0f5fc!important}
    body.dark-mode .entity-body{background:#172231!important;border-color:#40536b!important;color:#e8eef7!important}
    body.dark-mode .entity-investment-title,body.dark-mode .entity-accounts-title{background:linear-gradient(90deg,#203a35,#1c302d)!important;border-color:#365b50!important}
    body.dark-mode .entity-investment-title h3,body.dark-mode .entity-accounts-title h3,body.dark-mode .category-head h3{color:#9be5bd!important}
    body.dark-mode .entity-investment-group,body.dark-mode .entity-accounts{border-color:var(--l)!important}
    body.dark-mode .entity-investment-group .ptable thead th{background:#202d3e!important}
    body.dark-mode .ptable tbody tr:hover{background:#26364a!important}
    body.dark-mode .ptable th,body.dark-mode .history th{color:#b8c5d8!important}
    body.dark-mode .ptable td,body.dark-mode .history td{color:#e5edf8!important}
    body.dark-mode .pname,body.dark-mode .entity-name,body.dark-mode .entity-total,
    body.dark-mode .category-metric b,body.dark-mode .close-time{color:#f1f5fb!important}
    body.dark-mode .category-metric span,body.dark-mode .entity-cash-chip span,
    body.dark-mode .entity-investment-title span,body.dark-mode .entity-accounts-title span{color:#b8c5d8!important}
    body.dark-mode .gain,body.dark-mode .dash-positive{color:#55e39a!important}
    body.dark-mode .loss,body.dark-mode .dash-negative{color:#ff8585!important}
    body.dark-mode .pill{background:#263d5a!important;color:#c7dcff!important}
    body.dark-mode .pill.ok{background:#1d4435!important;color:#9be5bd!important}
    body.dark-mode .pill.warn{background:#493c20!important;color:#f4d58b!important}
    body.dark-mode input,body.dark-mode select,body.dark-mode textarea{background:#111c2a!important;color:#e8eef7!important;border-color:#465970!important}
    body.dark-mode input::placeholder,body.dark-mode textarea::placeholder{color:#91a2ba!important}
    body.dark-mode .modal{background:#020711bb}
    body.dark-mode .notice{background:#44391f!important;color:#f4d58b!important}
    body.dark-mode .error{background:#482b30!important;color:#ffaaa4!important}
    body.dark-mode .empty{color:#b8c5d8!important}
    body.dark-mode table th,body.dark-mode table td{border-color:var(--l)!important}
    body.dark-mode .inactive{background:#2b2a20!important;border-color:#66552d!important}
    body.dark-mode .stat{background:#ffffff16!important;color:#f1f5fb!important}

    /* Paneles del resumen: fondo oscuro y texto de alto contraste */
    body.dark-mode .dash-card{background:linear-gradient(145deg,#202d3e,#182434)!important;border-color:#40516a!important;color:#edf3fb!important}
    body.dark-mode .dash-card *{color:inherit}
    body.dark-mode .dash-label,body.dark-mode .dash-small,body.dark-mode .dash-empty{color:#bdcbe0!important}
    body.dark-mode .dash-kpi strong,body.dark-mode .dash-title h2,body.dark-mode .dash-title h3,
    body.dark-mode .dash-context-title,body.dark-mode .dash-legend-row,body.dark-mode .dash-legend-row b,
    body.dark-mode .dash-list-item{color:#edf3fb!important}
    body.dark-mode .dash-kpi.accounts,body.dark-mode .dash-kpi.investments,
    body.dark-mode .dash-kpi.performance,body.dark-mode .dash-kpi.total{background:linear-gradient(145deg,#223447,#1a2939)!important}
    body.dark-mode .dash-filters{background:#111c2a!important}
    body.dark-mode .dash-filter{color:#c7d7ed!important}
    body.dark-mode .dash-filter.active,body.dark-mode .dash-select.active{background:#315f9f!important;color:#fff!important}
    body.dark-mode .dash-axis,body.dark-mode .dash-chart-label{fill:#c8d6e8!important}
    body.dark-mode .dash-chart-value{fill:#ffffff!important;stroke:#172333!important}
    body.dark-mode .dash-gridline{stroke:#40516a!important}
    body.dark-mode .dash-chart-tooltip{background:#172333!important;color:#f1f5fb!important;border-color:#6685ad!important}
    body.dark-mode .dash-trend,body.dark-mode .dash-legend,body.dark-mode .dash-list-item{border-color:#40516a!important}
    body.dark-mode .dash-trend-badge.up{background:#1d4435!important;color:#9be5bd!important}
    body.dark-mode .dash-trend-badge.down{background:#4a292d!important;color:#ffaaaa!important}
    body.dark-mode .dash-bar-bg{background:#34445a!important}
    body.dark-mode .dash-pie:after{background:#1b293a!important}
    body.dark-mode .dash-pie-center{color:#f1f5fb!important}
    body.dark-mode .dash-pie-center span{color:#c4d2e5!important}
    body.dark-mode .dash-pie-detail{background:#1b293a!important;border-color:#40516a!important;color:#edf3fb!important}
    body.dark-mode .dash-pie-detail span{color:#c4d2e5!important}
    body.dark-mode .dash-table th{color:#bdcbe0!important;border-color:#40516a!important}
    body.dark-mode .dash-table td{color:#edf3fb!important;border-color:#40516a!important}
    body.dark-mode .dash-back,body.dark-mode .dash-select{background:#202d3e!important;color:#e8eef7!important;border-color:#465970!important}
    body.dark-mode .dash-kpi:after{background:#ffffff0b!important}
    body.dark-mode .hero{color:#fff!important}
    body.dark-mode .sub,body.dark-mode .brand p{color:#b8c5d8!important}
    @media(max-width:650px){body.dark-mode .top{align-items:flex-start;flex-wrap:wrap}}

    /* Refuerzo de contraste y lectura en ambos temas */
    body{ -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility }
    .pill{font-size:12px!important;font-weight:750!important;line-height:1.35}
    .entity-investment-title h3,.entity-accounts-title h3{font-size:21px!important;font-weight:850!important}
    body.dark-mode .entity-investment-title,body.dark-mode .entity-accounts-title{background:#223a36!important}
    body.dark-mode .entity-investment-title h3,body.dark-mode .entity-accounts-title h3{color:#b5f2d0!important}
    body.dark-mode .entity-investment-title span,body.dark-mode .entity-accounts-title span{color:#d0dfeb!important}
    body.dark-mode .dash-axis,body.dark-mode .dash-chart-label{fill:#e0eaf6!important;font-size:16px!important;font-weight:750!important}
    body.dark-mode .dash-chart-value{fill:#fff!important;stroke:#172333!important;font-size:17px!important}
    body.dark-mode .dash-gridline{stroke:#52647b!important;stroke-width:1.2}
    body.dark-mode .pill{background:#29466a!important;color:#e1edff!important}
    body.dark-mode .ptable th,body.dark-mode .history th{color:#d2deed!important}
    body.dark-mode .source-panel{background:#202f42!important;color:#f0f5fb!important;border-color:#526b89!important}
    body.dark-mode .source-panel span,body.dark-mode .source-panel small{color:#d0dceb!important}
  `;


    /* Tipografía más nítida y con mayor contraste en los dos temas */
    body,.modalbox,button,input,select,textarea{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
    body{font-weight:500;letter-spacing:.02px}
    .modalbox .sub,.modalbox .dash-small{font-size:14px!important;font-weight:600!important;line-height:1.55}
    .modalbox .source-panel-title,.modalbox .history th,.modalbox .ptable th{font-size:12px!important;font-weight:850!important;letter-spacing:.25px}
    .modalbox .history td,.modalbox .ptable td{font-size:14px!important;font-weight:600!important}
    .modalbox .btn,.modalbox button{font-weight:800!important}
    .modalbox .dash-filter{font-size:14px!important;font-weight:750!important}
    .modalbox .dash-axis,.modalbox .dash-chart-label{font-size:13px!important;font-weight:750!important}
    body.dark-mode .modalbox .sub,body.dark-mode .modalbox .dash-small,body.dark-mode .modalbox .source-panel span{color:#d2deed!important}
    body.dark-mode .modalbox .source-panel-title,body.dark-mode .modalbox .history th,body.dark-mode .modalbox .ptable th{color:#e0e9f5!important}
    body.dark-mode .modalbox .history td,body.dark-mode .modalbox .ptable td{color:#f0f4fa!important}
    body.dark-mode .modalbox .dash-filter{color:#d0dced!important}
    body.dark-mode .modalbox .dash-filter.active{color:#53c5ff!important}
    body.dark-mode .modalbox .dash-axis,body.dark-mode .modalbox .dash-chart-label{fill:#d7e2f0!important}
    body.dark-mode .modalbox .dash-gridline{stroke:#53657c!important}
    body.dark-mode .product-modal-brand h2{color:#f2f6fc!important}
    body.dark-mode .brand-mark{background:#fff!important}

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