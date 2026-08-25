/* Corrección definitiva de la tabla Operaciones de planes de pensiones. */
(function(){
'use strict';
const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
const money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n(v));
const qtyfmt=v=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(n(v));
function datefmt(v){
 const s=String(v??'').slice(0,10);
 let m=s.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})$/);
 if(m)return `${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`;
 m=s.match(/^([0-9]{1,2})[-\/]([0-9]{1,2})[-\/](\d{4})$/);
 if(m)return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`;
 return s;
}
function isAportacion(t){return norm(t)==='aportacion';}
function findOperationsTable(){
 const tables=[...document.querySelectorAll('table')];
 return tables.find(t=>{
   const text=norm(t.innerText||'');
   return (text.includes('aportaciones anteriores')||text.includes('nº aportaciones')) &&
          (text.includes('aportacion actual')||text.includes('importe aportacion'));
 })||null;
}
function getOps(){
 if(!window.S||!Array.isArray(window.S.o))return [];
 let ops=window.S.o.slice();
 if(window.S.context)ops=ops.filter(x=>String(x.producto_id)===String(window.S.context));
 return ops.filter(x=>x.fecha).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id??'').localeCompare(String(b.id??'')));
}
function rebuild(){
 const table=findOperationsTable(),ops=getOps();
 if(!table||!ops.length)return false;
 let numero=0,totalAportado=0,totalParticipaciones=0;
 const rows=ops.map(o=>{
   const tipo=o.tipo_operacion||'';
   const aport=isAportacion(tipo);
   const participaciones=n(o.cantidad);
   let importe=n(o.importe_neto);
   if(aport&&importe===0)importe=Math.abs(participaciones*n(o.precio_unitario));
   const anteriores=totalAportado;
   if(aport){
     numero++;
     totalAportado+=importe;
     totalParticipaciones+=participaciones;
   }
   return {
     fecha:datefmt(o.fecha),
     numero:aport?numero:'',
     anteriores,
     importe:aport?importe:0,
     total:totalAportado,
     part:aport?participaciones:0,
     totalPart:totalParticipaciones,
     tipo
   };
 }).reverse();
 table.replaceChildren();
 const thead=document.createElement('thead');
 const hr=document.createElement('tr');
 ['FECHA','Nº APORTACIÓN','APORTACIONES ANTERIORES','IMPORTE APORTACIÓN','TOTAL APORTADO','PARTICIPACIONES APORTACIÓN','TOTAL PARTICIPACIONES','TIPO'].forEach(x=>{const th=document.createElement('th');th.textContent=x;hr.appendChild(th)});
 thead.appendChild(hr);table.appendChild(thead);
 const tbody=document.createElement('tbody');
 rows.forEach(r=>{
   const tr=document.createElement('tr');
   const vals=[r.fecha,r.numero,money(r.anteriores),money(r.importe),money(r.total),r.part?qtyfmt(r.part):'—',r.totalPart?qtyfmt(r.totalPart):'—',r.tipo];
   vals.forEach((v,i)=>{
     const td=document.createElement('td');
     td.textContent=v;
     td.style.textAlign=i===0||i===7?'left':'right';
     tr.appendChild(td);
   });
   tbody.appendChild(tr);
 });
 table.appendChild(tbody);
 table.dataset.operationsFixed='1';
 table.style.width='100%';
 table.style.minWidth='1250px';
 table.style.tableLayout='auto';
 return true;
}
function fixDates(){
 [...document.querySelectorAll('table td,table th')].forEach(cell=>{
   const s=cell.textContent.trim();
   if(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(s)||/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(s))cell.textContent=datefmt(s);
 });
}
let timer;
let running=false;
function apply(){
 if(running)return;
 running=true;
 try{rebuild();fixDates();}catch(e){console.error('ui-fixes Operaciones:',e)}
 finally{running=false;}
}
const observer=new MutationObserver(()=>{
 clearTimeout(timer);
 timer=setTimeout(apply,250);
});
function start(){
 observer.observe(document.body,{childList:true,subtree:true});
 apply();
 [500,1200,2500,5000].forEach(ms=>setTimeout(apply,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();