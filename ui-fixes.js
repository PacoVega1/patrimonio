/* Correcciones de presentación: fechas y operaciones */
(function(){
  'use strict';

  function fechaES(v){
    if(v==null)return v;
    const s=String(v).trim();
    let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/);
    if(m)return String(m[3]).padStart(2,'0')+'/'+String(m[2]).padStart(2,'0')+'/'+m[1];
    m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(m)return String(m[1]).padStart(2,'0')+'/'+String(m[2]).padStart(2,'0')+'/'+m[3];
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

  function clave(s){
    return String(s||'').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/º/g,'o').replace(/°/g,'o');
  }

  function normalizarOperaciones(root){
    const tablas=[...(root||document).querySelectorAll('table')];
    tablas.forEach(table=>{
      const head=table.querySelector('thead tr');
      if(!head)return;
      const hs=[...head.children].map(x=>clave(x.textContent));
      const esPlan=hs.some(x=>x.includes('aportaciones anteriores')) &&
                   (hs.some(x=>x.includes('aportacion actual')) || hs.some(x=>x.includes('importe aportacion')));
      if(!esPlan)return;

      const idx={
        fecha:hs.findIndex(x=>x.includes('fecha')),
        anteriores:hs.findIndex(x=>x.includes('aportaciones anteriores')),
        numero:hs.findIndex(x=>x.includes('n aportaciones')||x.includes('numero aportaciones')||x.includes('n aportacion')),
        importe:hs.findIndex(x=>x.includes('aportacion actual')||x.includes('importe aportacion')),
        total:hs.findIndex(x=>x.includes('total aportado')),
        participacionAport:hs.findIndex(x=>x.includes('participaciones aportacion')||x.includes('participaciones de la aportacion')),
        participaciones:hs.findIndex(x=>x.includes('total participaciones')),
        tipo:hs.findIndex(x=>x==='tipo'||x.includes('tipo')),
        valor:hs.findIndex(x=>x.includes('valor aportacion')||x.includes('valor liquidativo'))
      };

      // Elimina la antigua columna redundante «Valor aportación» / «Valor liquidativo».
      if(idx.valor>=0){
        [...table.querySelectorAll('tr')].forEach(tr=>{
          if(tr.children[idx.valor])tr.removeChild(tr.children[idx.valor]);
        });
      }

      // Releer cabeceras después de eliminar la columna.
      const h2=[...head.children].map(x=>clave(x.textContent));
      const ix={
        fecha:h2.findIndex(x=>x.includes('fecha')),
        anteriores:h2.findIndex(x=>x.includes('aportaciones anteriores')),
        numero:h2.findIndex(x=>x.includes('n aportaciones')||x.includes('numero aportaciones')||x.includes('n aportacion')),
        importe:h2.findIndex(x=>x.includes('aportacion actual')||x.includes('importe aportacion')),
        total:h2.findIndex(x=>x.includes('total aportado')),
        participacionAport:h2.findIndex(x=>x.includes('participaciones aportacion')||x.includes('participaciones de la aportacion')),
        participaciones:h2.findIndex(x=>x.includes('total participaciones')),
        tipo:h2.findIndex(x=>x==='tipo'||x.includes('tipo'))
      };

      const orden=['fecha','anteriores','numero','importe','total','participacionAport','participaciones','tipo']
        .map(k=>ix[k]).filter(i=>i>=0);

      if(orden.length!==h2.length)return;

      [...table.querySelectorAll('tr')].forEach(tr=>{
        const cells=[...tr.children];
        orden.forEach(i=>{if(cells[i])tr.appendChild(cells[i]);});
      });

      // Nombres definitivos de las columnas para evitar ambigüedades.
      const finalHeaders=[...head.children];
      const nombres=['FECHA','APORTACIONES ANTERIORES','Nº APORTACIÓN','IMPORTE APORTACIÓN','TOTAL APORTADO','PARTICIPACIONES APORTACIÓN','TOTAL PARTICIPACIONES','TIPO'];
      finalHeaders.forEach((c,i)=>{if(nombres[i])c.textContent=nombres[i];});
    });
  }

  function aplicar(){
    normalizarFechas(document.body);
    normalizarOperaciones(document.body);
  }

  const obs=new MutationObserver(()=>{
    clearTimeout(obs._t);
    obs._t=setTimeout(aplicar,40);
  });
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar);else aplicar();
})();
