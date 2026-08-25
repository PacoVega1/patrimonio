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
      .replace(/[º°]/g,'o');
  }

  function numES(v){
    const s=String(v||'').trim().replace(/\./g,'').replace(',','.');
    const n=Number(s);
    return Number.isFinite(n)?n:null;
  }

  function normalizarOperaciones(root){
    const tablas=[...(root||document).querySelectorAll('table')];
    tablas.forEach(table=>{
      const head=table.querySelector('thead tr');
      if(!head)return;
      let hs=[...head.children].map(x=>clave(x.textContent));
      const esPlan=hs.some(x=>x.includes('aportaciones anteriores')) &&
        (hs.some(x=>x.includes('aportacion actual'))||hs.some(x=>x.includes('importe aportacion')));
      if(!esPlan)return;

      // Este es el formato que genera actualmente la aplicación:
      // FECHA | TIPO | APORTACIONES ANTERIORES | APORTACIÓN ACTUAL | TOTAL APORTADO | Nº APORTACIONES | PARTICIPACIONES
      // Lo convertimos a la estructura definitiva solicitada.
      const find=(tests)=>hs.findIndex(x=>tests.some(t=>x.includes(t)));
      const idx={
        fecha:find(['fecha']),
        tipo:find(['tipo']),
        anteriores:find(['aportaciones anteriores']),
        importe:find(['aportacion actual','importe aportacion']),
        total:find(['total aportado']),
        numero:find(['n aportaciones','n aportacion','numero aportaciones']),
        participacionAport:find(['participaciones aportacion','participaciones de la aportacion','participaciones'])
      };
      if(idx.fecha<0||idx.anteriores<0||idx.importe<0||idx.total<0||idx.numero<0||idx.participacionAport<0)return;

      // El número de participaciones que ya muestra la aplicación corresponde a las
      // participaciones adquiridas en esa aportación. Renombramos y añadimos el acumulado.
      const rows=[...table.querySelectorAll('tbody tr')];
      const ops=(window.S&&Array.isArray(window.S.o))?window.S.o:[];
      const productId=window.S?.context;
      const contribs=ops.filter(o=>o.producto_id===productId && ['Aportacion','Aportación'].includes(o.tipo_operacion||''))
        .slice().sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id||'').localeCompare(String(b.id||'')));
      const acumulados=[];
      let acc=0;
      for(const o of contribs){
        const q=Number(o.cantidad)||0;
        acc+=q;
        acumulados.push({fecha:String(o.fecha).slice(0,10),id:o.id,acc});
      }

      // Elimina una eventual columna de valor liquidativo/valor aportación si existiera.
      const valorIdx=hs.findIndex(x=>x.includes('valor aportacion')||x.includes('valor liquidativo'));
      if(valorIdx>=0){
        [...table.querySelectorAll('tr')].forEach(tr=>{if(tr.children[valorIdx])tr.removeChild(tr.children[valorIdx]);});
        hs=[...head.children].map(x=>clave(x.textContent));
      }

      // Si ya hay una columna TOTAL PARTICIPACIONES de una ejecución anterior,
      // reutilizarla; si no, crearla.
      let totalPartIdx=hs.findIndex(x=>x.includes('total participaciones'));
      if(totalPartIdx<0){
        const th=document.createElement('th');
        th.textContent='TOTAL PARTICIPACIONES';
        head.appendChild(th);
        totalPartIdx=head.children.length-1;
        rows.forEach(tr=>tr.appendChild(document.createElement('td')));
      }

      const currentPartIdx=[...head.children].map(x=>clave(x.textContent)).findIndex(x=>x==='participaciones'||x.includes('participaciones aportacion'));
      const tipoIdx=[...head.children].map(x=>clave(x.textContent)).findIndex(x=>x==='tipo'||x.includes('tipo'));
      const fechaIdx=[...head.children].map(x=>clave(x.textContent)).findIndex(x=>x.includes('fecha'));
      const numeroIdx=[...head.children].map(x=>clave(x.textContent)).findIndex(x=>x.includes('n aportaciones')||x.includes('n aportacion')||x.includes('numero aportaciones'));

      rows.forEach(tr=>{
        const cells=[...tr.children];
        if(currentPartIdx<0||totalPartIdx<0)return;
        const ordinal=numES(cells[numeroIdx]?.textContent);
        let total=null;
        if(ordinal!=null && ordinal>0 && contribs.length){
          const a=acumulados[ordinal-1];
          if(a)total=a.acc;
        }
        if(total==null){
          // Fallback para tablas cuyo ordinal no sea utilizable: acumular por fecha.
          const f=String(cells[fechaIdx]?.textContent||'').trim();
          const m=f.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          const iso=m?`${m[3]}-${m[2]}-${m[1]}`:f;
          const found=acumulados.filter(x=>x.fecha<=iso).pop();
          if(found)total=found.acc;
        }
        if(total!=null)cells[totalPartIdx].textContent=new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(total);
      });

      // El orden definitivo es exactamente este.
      const current=[...head.children].map(x=>clave(x.textContent));
      const pos={
        fecha:current.findIndex(x=>x.includes('fecha')),
        anteriores:current.findIndex(x=>x.includes('aportaciones anteriores')),
        numero:current.findIndex(x=>x.includes('n aportaciones')||x.includes('n aportacion')||x.includes('numero aportaciones')),
        importe:current.findIndex(x=>x.includes('aportacion actual')||x.includes('importe aportacion')),
        total:current.findIndex(x=>x.includes('total aportado')),
        participacionAport:current.findIndex(x=>x==='participaciones'||x.includes('participaciones aportacion')),
        participaciones:current.findIndex(x=>x.includes('total participaciones')),
        tipo:current.findIndex(x=>x==='tipo'||x.includes('tipo'))
      };
      const orden=[pos.fecha,pos.anteriores,pos.numero,pos.importe,pos.total,pos.participacionAport,pos.participaciones,pos.tipo];
      if(orden.some(i=>i<0))return;
      [...table.querySelectorAll('tr')].forEach(tr=>{
        const cells=[...tr.children];
        orden.forEach(i=>{if(cells[i])tr.appendChild(cells[i]);});
      });

      const nombres=['FECHA','APORTACIONES ANTERIORES','Nº APORTACIÓN','IMPORTE APORTACIÓN','TOTAL APORTADO','PARTICIPACIONES APORTACIÓN','TOTAL PARTICIPACIONES','TIPO'];
      [...head.children].forEach((c,i)=>{if(nombres[i])c.textContent=nombres[i];});
      table.dataset.patrimonioPlanFixed='1';
    });
  }

  function aplicar(){
    normalizarFechas(document.body);
    normalizarOperaciones(document.body);
  }

  const obs=new MutationObserver(()=>{
    clearTimeout(obs._t);
    obs._t=setTimeout(aplicar,60);
  });
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar);else aplicar();
})();
