/* Correcciones definitivas de fechas y tabla de operaciones de planes */
(function(){
  'use strict';

  const key=s=>String(s??'').trim().toLowerCase()
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
    let trHead=table.querySelector('thead tr');
    const allRows=[...table.querySelectorAll('tr')];
    if(!trHead)trHead=allRows[0];
    if(!trHead)return;

    const headerCells=[...trHead.children];
    const headers=headerCells.map(c=>key(c.textContent));
    const hasAnterior=headers.some(h=>h.includes('aportaciones anteriores'));
    const hasImporte=headers.some(h=>h.includes('aportacion actual')||h.includes('importe aportacion'));
    if(!hasAnterior||!hasImporte)return;

    const find=tests=>headers.findIndex(h=>tests.some(t=>h===t||h.includes(t)));
    const idx={
      fecha:find(['fecha']),
      tipo:find(['tipo']),
      anteriores:find(['aportaciones anteriores']),
      importe:find(['aportacion actual','importe aportacion']),
      total:find(['total aportado']),
      numero:find(['n aportaciones','n aportacion','numero aportaciones','numero aportacion']),
      part:find(['participaciones aportacion','participaciones de la aportacion','participaciones'])
    };
    if(Object.values(idx).some(i=>i<0))return;

    const dataRows=table.querySelector('tbody')
      ? [...table.querySelector('tbody').querySelectorAll('tr')]
      : allRows.slice(1);
    const data=dataRows.map(tr=>[...tr.children].map(td=>td.textContent.trim()));

    const ops=(window.S&&Array.isArray(window.S.o))?window.S.o:[];
    const productId=window.S?.context;
    const contribs=ops
      .filter(o=>o.producto_id===productId && ['Aportacion','Aportación'].includes(o.tipo_operacion||''))
      .slice()
      .sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id||'').localeCompare(String(b.id||'')));
    const acumulado=[];
    let acc=0;
    contribs.forEach((o,i)=>{
      acc+=Number(o.cantidad)||0;
      acumulado[i+1]=acc;
    });

    /* ORDEN DEFINITIVO ACORDADO:
       1 Fecha
       2 Nº aportación
       3 Importe aportación
       4 Aportaciones anteriores
       5 Total aportado
       6 Participaciones de la aportación
       7 Total participaciones
       8 Tipo */
    const ordenHeaders=[
      'FECHA',
      'Nº APORTACIÓN',
      'IMPORTE APORTACIÓN',
      'APORTACIONES ANTERIORES',
      'TOTAL APORTADO',
      'PARTICIPACIONES APORTACIÓN',
      'TOTAL PARTICIPACIONES',
      'TIPO'
    ];

    let thead=table.querySelector('thead');
    let tbody=table.querySelector('tbody');
    if(!thead){
      thead=document.createElement('thead');
      table.insertBefore(thead,table.firstChild);
    }
    thead.innerHTML='';
    const htr=document.createElement('tr');
    ordenHeaders.forEach(h=>{
      const th=document.createElement('th');
      th.textContent=h;
      htr.appendChild(th);
    });
    thead.appendChild(htr);

    if(!tbody){
      tbody=document.createElement('tbody');
      table.appendChild(tbody);
    }
    tbody.innerHTML='';

    data.forEach(r=>{
      const fecha=fechaES(r[idx.fecha]);
      const numero=r[idx.numero]||'';
      const importe=r[idx.importe]||'';
      const anteriores=r[idx.anteriores]||'';
      const total=r[idx.total]||'';
      const partAport=r[idx.part]||'';
      const n=num(numero);
      const totalPart=n!=null&&acumulado[n]!=null?fmt3(acumulado[n]):'';
      const tipo=r[idx.tipo]||'';
      const vals=[fecha,numero,importe,anteriores,total,partAport,totalPart,tipo];
      const tr=document.createElement('tr');
      vals.forEach(v=>{
        const td=document.createElement('td');
        td.textContent=v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function aplicar(){
    normalizarFechas();
    document.querySelectorAll('table').forEach(corregirTabla);
  }

  let timer;
  const obs=new MutationObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(aplicar,120);
  });
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar);
  else aplicar();
})();
