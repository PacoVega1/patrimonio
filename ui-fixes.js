/* Correcciones visuales de Patrimonio: fechas y operaciones de planes */
(function(){
  'use strict';

  const key=s=>String(s||'').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[º°]/g,'o');

  function fechaES(v){
    const s=String(v??'').trim();
    let m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[T ].*)?$/);
    if(m)return `${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`;
    m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if(m)return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`;
    return s;
  }

  function normalizarFechas(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    const rx=/\b(?:\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g;
    nodes.forEach(n=>{
      const p=n.parentElement;
      if(!p||['SCRIPT','STYLE','INPUT','TEXTAREA','OPTION'].includes(p.tagName))return;
      n.nodeValue=n.nodeValue.replace(rx,x=>fechaES(x));
    });
  }

  function num(v){
    const s=String(v??'').trim().replace(/\./g,'').replace(',','.');
    const n=Number(s);
    return Number.isFinite(n)?n:null;
  }

  function fmt3(n){
    return new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(n);
  }

  function corregirTabla(table){
    const trHead=table.querySelector('thead tr');
    const tbody=table.querySelector('tbody');
    if(!trHead||!tbody)return;

    const headers=[...trHead.children].map(c=>key(c.textContent));
    const hasAnterior=headers.some(h=>h.includes('aportaciones anteriores'));
    const hasImporte=headers.some(h=>h.includes('aportacion actual')||h.includes('importe aportacion'));
    if(!hasAnterior||!hasImporte)return;

    const find=(tests)=>headers.findIndex(h=>tests.some(t=>h===t||h.includes(t)));
    const idx={
      fecha:find(['fecha']),
      tipo:find(['tipo']),
      anteriores:find(['aportaciones anteriores']),
      importe:find(['aportacion actual','importe aportacion']),
      total:find(['total aportado']),
      numero:find(['n aportaciones','n aportacion','numero aportaciones']),
      part:find(['participaciones aportacion','participaciones de la aportacion','participaciones'])
    };
    if(Object.values(idx).some(i=>i<0))return;

    const rows=[...tbody.querySelectorAll('tr')];
    const data=rows.map(tr=>[...tr.children].map(td=>td.textContent.trim()));

    /* Calculamos participaciones acumuladas a partir de las operaciones reales. */
    const ops=(window.S&&Array.isArray(window.S.o))?window.S.o:[];
    const productId=window.S?.context;
    const contribs=ops
      .filter(o=>o.producto_id===productId && ['Aportacion','Aportación'].includes(o.tipo_operacion||''))
      .slice().sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id||'').localeCompare(String(b.id||'')));
    const acumulado=[];
    let acc=0;
    contribs.forEach((o,i)=>{
      acc+=Number(o.cantidad)||0;
      acumulado[i+1]=acc;
    });

    /* Reconstruimos completamente la tabla en el orden acordado.
       No movemos nodos uno a uno: así evitamos que el índice cambie durante el append. */
    const ordenHeaders=[
      'FECHA',
      'APORTACIONES ANTERIORES',
      'Nº APORTACIÓN',
      'IMPORTE APORTACIÓN',
      'TOTAL APORTADO',
      'PARTICIPACIONES APORTACIÓN',
      'TOTAL PARTICIPACIONES',
      'TIPO'
    ];
    trHead.innerHTML='';
    ordenHeaders.forEach(h=>{
      const th=document.createElement('th');
      th.textContent=h;
      trHead.appendChild(th);
    });

    tbody.innerHTML='';
    data.forEach(r=>{
      const fecha=fechaES(r[idx.fecha]);
      const anteriores=r[idx.anteriores]||'';
      const numero=r[idx.numero]||'';
      const importe=r[idx.importe]||'';
      const total=r[idx.total]||'';
      const partAport=r[idx.part]||'';
      const n=num(numero);
      const totalPart=n!=null&&acumulado[n]!=null?fmt3(acumulado[n]):'';
      const tipo=r[idx.tipo]||'';
      const vals=[fecha,anteriores,numero,importe,total,partAport,totalPart,tipo];
      const tr=document.createElement('tr');
      vals.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td);});
      tbody.appendChild(tr);
    });

    table.dataset.patrimonioPlanFixed='1';
  }

  function aplicar(){
    normalizarFechas();
    document.querySelectorAll('table').forEach(corregirTabla);
  }

  let timer;
  const obs=new MutationObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(aplicar,80);
  });
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar);
  else aplicar();
})();
