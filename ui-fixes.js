/* Correcciones de presentación: fechas y operaciones */
(function(){
  'use strict';

  function fechaES(v){
    if(v==null)return v;
    let s=String(v).trim();
    let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/);
    if(m)return String(m[3]).padStart(2,'0')+'/'+String(m[2]).padStart(2,'0')+'/'+m[1];
    m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(m)return String(m[1]).padStart(2,'0')+'/'+String(m[2]).padStart(2,'0')+'/'+m[3];
    m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if(m)return String(m[3]).padStart(2,'0')+'/'+String(m[2]).padStart(2,'0')+'/'+m[1];
    return s;
  }

  function normalizarFechas(root){
    const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      const p=n.parentElement;
      if(!p||['SCRIPT','STYLE','INPUT','TEXTAREA','OPTION'].includes(p.tagName))return;
      const t=n.nodeValue;
      const r=/\b(?:\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g;
      if(r.test(t))n.nodeValue=t.replace(r,x=>fechaES(x));
    });
  }

  function normalizarOperaciones(root){
    const tablas=[...(root||document).querySelectorAll('table')];
    tablas.forEach(table=>{
      const head=table.querySelector('thead tr');
      if(!head)return;
      const hs=[...head.children].map(x=>x.textContent.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
      if(!hs.some(x=>x.includes('aportaciones anteriores')) && !hs.some(x=>x.includes('n aportaciones')))return;

      const idx={
        fecha:hs.findIndex(x=>x==='fecha'||x.includes('fecha')),
        participaciones:hs.findIndex(x=>x.includes('participaciones')),
        importe:hs.findIndex(x=>x.includes('aportacion actual')||x.includes('importe aportacion')),
        anteriores:hs.findIndex(x=>x.includes('aportaciones anteriores')),
        total:hs.findIndex(x=>x.includes('total aportado')),
        numero:hs.findIndex(x=>x.includes('n aportaciones')||x.includes('numero aportaciones')),
        valor:hs.findIndex(x=>x.includes('valor aportacion')||x.includes('valor liquidativo')),
        tipo:hs.findIndex(x=>x==='tipo'||x.includes('tipo'))
      };
      const orden=['fecha','participaciones','importe','anteriores','total','numero','valor','tipo'].map(k=>idx[k]).filter(i=>i>=0);
      if(orden.length<hs.length)return;

      [head,...table.querySelectorAll('tbody tr')].forEach(tr=>{
        const cells=[...tr.children];
        orden.forEach(i=>{if(cells[i])tr.appendChild(cells[i]);});
      });
    });
  }

  function aplicar(){
    normalizarFechas(document.body);
    normalizarOperaciones(document.body);
  }

  const obs=new MutationObserver(()=>{
    clearTimeout(obs._t);
    obs._t=setTimeout(aplicar,30);
  });
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar);else aplicar();
})();
