/* Tabla de operaciones de planes: distingue aportaciones y traspasos en el capital acumulado. */
(function(){
'use strict';

const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const N=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
const money=v=>{const s=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',useGrouping:false,minimumFractionDigits:2,maximumFractionDigits:2}).format(N(v));return s.replace(/^(-?\d+)/,x=>x.replace(/\B(?=(\d{3})+(?!\d))/g,'.'))};
const qtyFmt=v=>{const s=new Intl.NumberFormat('es-ES',{useGrouping:false,minimumFractionDigits:3,maximumFractionDigits:3}).format(N(v));const a=s.split(',');a[0]=a[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');return a.join(',')};
const dateFmt=v=>{
  const s=String(v??'').slice(0,10);
  let m=s.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})$/);
  if(m)return `${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`;
  m=s.match(/^([0-9]{1,2})[-\/]([0-9]{1,2})[-\/](\d{4})$/);
  if(m)return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`;
  return s;
};

function getState(){try{return typeof S!=='undefined'?S:null}catch(_){return null}}
function findTable(){
  return [...document.querySelectorAll('table')].find(t=>{
    const x=norm(t.innerText||'');
    return x.includes('aportaciones anteriores') && (x.includes('aportacion actual')||x.includes('importe aportacion')||x.includes('movimiento capital'));
  })||null;
}
function getOperations(){
  const state=getState();
  if(!state||!Array.isArray(state.o))return [];
  let a=state.o.slice();
  if(state.context)a=a.filter(o=>String(o.producto_id)===String(state.context));
  return a.filter(o=>o.fecha).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id??'').localeCompare(String(b.id??'')));
}
function capitalMovement(o){
  const tipo=norm(o.tipo_operacion||'');
  const net=N(o.importe_neto);
  const gross=N(o.importe_bruto);
  const amount=net!==0?net:gross;
  if(tipo==='aportacion')return amount!==0?Math.abs(amount):Math.abs(N(o.cantidad)*N(o.precio_unitario));
  if(tipo==='traspaso')return amount!==0?amount:(N(o.cantidad)*N(o.precio_unitario));
  if(tipo==='compra')return amount!==0?Math.abs(amount):Math.abs(N(o.cantidad)*N(o.precio_unitario));
  if(tipo==='venta')return -Math.abs(amount);
  return 0;
}
function rebuild(){
  const t=findTable(),a=getOperations();
  if(!t||!a.length)return false;
  let numero=0,capital=0,totalPart=0;
  const rows=a.map(o=>{
    const tipo=norm(o.tipo_operacion||'');
    const isA=tipo==='aportacion';
    const part=N(o.cantidad);
    const prev=capital;
    const movCapital=capitalMovement(o);
    if(isA)numero++;
    capital+=movCapital;
    let movPart=0;
    if(['compra','aportacion','acciones liberadas','dividendo en acciones','split'].includes(tipo))movPart=Math.abs(part);
    else if(tipo==='venta')movPart=-Math.abs(part);
    else if(tipo==='ajuste de posicion'||tipo==='traspaso')movPart=part;
    totalPart+=movPart;
    return [dateFmt(o.fecha),isA?numero:'',prev,movCapital,capital,movPart,totalPart];
  }).reverse();

  t.replaceChildren();
  const h=document.createElement('thead'),hr=document.createElement('tr');
  ['FECHA','Nº APORTACIÓN','CAPITAL ANTERIOR','MOVIMIENTO DE CAPITAL','CAPITAL TOTAL','MOVIMIENTO PARTICIPACIONES','TOTAL PARTICIPACIONES'].forEach(x=>{
    const th=document.createElement('th');th.textContent=x;hr.appendChild(th);
  });
  h.appendChild(hr);t.appendChild(h);
  const b=document.createElement('tbody');
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    r.forEach((v,i)=>{
      const td=document.createElement('td');
      if(i===2||i===3||i===4)td.textContent=money(v);
      else if(i===5||i===6)td.textContent=v?qtyFmt(v):'—';
      else td.textContent=v;
      td.style.textAlign=i===0?'left':'right';
      tr.appendChild(td);
    });
    b.appendChild(tr);
  });
  t.appendChild(b);
  const f=document.createElement('tfoot'),fr=document.createElement('tr');
  const label=document.createElement('td');label.colSpan=4;label.textContent='CAPITAL NETO REGISTRADO';label.style.textAlign='left';label.style.fontWeight='800';
  const value=document.createElement('td');value.textContent=money(capital);value.style.textAlign='right';value.style.fontWeight='800';
  const pl=document.createElement('td');pl.textContent='TOTAL PARTICIPACIONES';pl.style.textAlign='right';pl.style.fontWeight='800';
  const pv=document.createElement('td');pv.textContent=qtyFmt(totalPart);pv.style.textAlign='right';pv.style.fontWeight='800';
  fr.append(label,value,pl,pv);f.appendChild(fr);t.appendChild(f);
  t.style.width='100%';t.style.minWidth='0';t.style.tableLayout='fixed';t.dataset.pensionOpsFix='v7';
  return true;
}
function fixDates(){
  document.querySelectorAll('table td,table th').forEach(c=>{
    const s=c.textContent.trim();
    if(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(s)||/^\d{4}[\/-]\d{1,2}[\/-]\d{2}$/.test(s))c.textContent=dateFmt(s);
  });
}
let busy=false;
function apply(){if(busy)return;busy=true;try{rebuild();fixDates()}catch(e){console.error('pension-ops-fix',e)}busy=false}
const ob=new MutationObserver(()=>setTimeout(apply,30));
function start(){ob.observe(document.body,{childList:true,subtree:true});apply();[100,300,700,1200,2000,4000,7000].forEach(x=>setTimeout(apply,x));setInterval(apply,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();