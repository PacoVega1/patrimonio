/* Corrección de la tabla Operaciones de planes de pensiones.
   IMPORTANTE: app.js declara S con `const`, por lo que no existe como window.S.
   Este script se ejecuta después de app.js y accede al binding global S directamente. */
(function(){
'use strict';

const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const N=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
const money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(N(v));
const qtyFmt=v=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(N(v));
const dateFmt=v=>{
  const s=String(v??'').slice(0,10);
  let m=s.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})$/);
  if(m)return `${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`;
  m=s.match(/^([0-9]{1,2})[-\/]([0-9]{1,2})[-\/](\d{4})$/);
  if(m)return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`;
  return s;
};

function getState(){
  try{return typeof S!=='undefined'?S:null}catch(_){return null}
}

function table(){
  return [...document.querySelectorAll('table')].find(t=>{
    const x=norm(t.innerText||'');
    return x.includes('aportaciones anteriores') && x.includes('aportacion actual');
  })||null;
}

function ops(){
  const state=getState();
  if(!state || !Array.isArray(state.o))return [];
  let a=state.o.slice();
  if(state.context)a=a.filter(o=>String(o.producto_id)===String(state.context));
  return a.filter(o=>o.fecha)
    .sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id??'').localeCompare(String(b.id??'')));
}

function rebuild(){
  const t=table(), a=ops();
  if(!t || !a.length)return false;

  let num=0,total=0,totalPart=0;
  const rows=a.map(o=>{
    const tipo=o.tipo_operacion||'';
    const isA=['aportacion','aportación'].includes(norm(tipo));
    const part=N(o.cantidad);
    let importe=N(o.importe_neto);
    if(isA && importe===0) importe=Math.abs(part*N(o.precio_unitario));

    const anteriores=total;
    if(isA){
      num++;
      total+=importe;
      totalPart+=part;
    }

    return [
      dateFmt(o.fecha),
      isA?num:'',
      anteriores,
      isA?importe:0,
      total,
      isA?part:0,
      totalPart,
      tipo
    ];
  }).reverse();

  t.replaceChildren();
  const h=document.createElement('thead'),trh=document.createElement('tr');
  [
    'FECHA',
    'Nº APORTACIÓN',
    'APORTACIONES ANTERIORES',
    'IMPORTE APORTACIÓN',
    'TOTAL APORTADO',
    'PARTICIPACIONES APORTACIÓN',
    'TOTAL PARTICIPACIONES',
    'TIPO'
  ].forEach(x=>{
    const th=document.createElement('th');
    th.textContent=x;
    trh.appendChild(th);
  });
  h.appendChild(trh); t.appendChild(h);

  const b=document.createElement('tbody');
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    r.forEach((v,i)=>{
      const td=document.createElement('td');
      if(i===2||i===3||i===4)td.textContent=money(v);
      else if(i===5||i===6)td.textContent=v?qtyFmt(v):'—';
      else td.textContent=v;
      td.style.textAlign=(i===0||i===7)?'left':'right';
      tr.appendChild(td);
    });
    b.appendChild(tr);
  });
  t.appendChild(b);

  // Resumen final: total de aportaciones acumuladas del plan.
  const f=document.createElement('tfoot');
  const fr=document.createElement('tr');
  const label=document.createElement('td');
  label.colSpan=4;
  label.textContent='TOTAL APORTACIONES ACUMULADAS';
  label.style.textAlign='left';
  label.style.fontWeight='700';
  const value=document.createElement('td');
  value.textContent=money(total);
  value.style.textAlign='right';
  value.style.fontWeight='700';
  fr.appendChild(label);
  fr.appendChild(value);
  const spacer=document.createElement('td');
  spacer.colSpan=3;
  fr.appendChild(spacer);
  f.appendChild(fr);
  t.appendChild(f);

  t.style.width='100%';
  t.style.minWidth='1250px';
  t.style.tableLayout='auto';
  t.dataset.pensionOpsFix='v5';
  return true;
}

function fixDates(){
  document.querySelectorAll('table td,table th').forEach(c=>{
    const s=c.textContent.trim();
    if(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(s)||/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(s)){
      c.textContent=dateFmt(s);
    }
  });
}

let busy=false;
function apply(){
  if(busy)return;
  busy=true;
  try{rebuild();fixDates()}catch(e){console.error('pension-ops-fix',e)}
  busy=false;
}

const ob=new MutationObserver(()=>setTimeout(apply,30));
function start(){
  ob.observe(document.body,{childList:true,subtree:true});
  apply();
  [100,300,700,1200,2000,4000,7000].forEach(x=>setTimeout(apply,x));
  setInterval(apply,1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
