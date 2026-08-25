/* Corrección definitiva de Operaciones para planes de pensiones. */
(function(){
'use strict';
const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
const money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(n(v));
const qtyfmt=v=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(n(v));
function datefmt(v){
 const s=String(v??'').slice(0,10);
 let m=s.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})$/);
 if(m)return `${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`;
 m=s.match(/^([0-9]{1,2})[-\/]([0-9]{1,2})[-\/](\d{4})$/);
 if(m)return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`;
 return s;
}
function isAportacion(t){return ['aportacion','aportación'].includes(norm(t));}
function findOperationsTable(){
 const tables=[...document.querySelectorAll('table')];
 return tables.find(t=>{
   const h=[...t.querySelectorAll('thead th')].map(x=>norm(x.textContent));
   return h.includes('fecha') && (h.includes('tipo') || h.includes('tipo operacion')) &&
          (h.includes('aportaciones anteriores') || h.includes('nº aportaciones'));
 })||null;
}
function getOps(){
 if(!window.S||!Array.isArray(S.o))return [];
 let ops=S.o.slice();
 if(S.context)ops=ops.filter(x=>x.producto_id===S.context);
 return ops.filter(x=>x.fecha).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id??'').localeCompare(String(b.id??'')));
}
function rebuild(){
 const table=findOperationsTable();
 const ops=getOps();
 if(!table||!ops.length)return false;
 let numero=0,totalAportado=0,totalParticipaciones=0;
 const rows=ops.map(o=>{
   const tipo=o.tipo_operacion||'';
   const aport=isAportacion(tipo);
   const participaciones=n(o.cantidad);
   let importe=n(o.importe_neto);
   if(aport && importe===0)importe=Math.abs(participaciones*n(o.precio_unitario));
   const anteriores=totalAportado;
   if(aport){numero++;totalAportado+=importe;totalParticipaciones+=participaciones;}
   return {fecha:datefmt(o.fecha),numero:aport?numero:'',anteriores,importe:aport?importe:0,total:totalAportado,part:aport?participaciones:0,totalPart:totalParticipaciones,tipo};
 }).reverse();
 table.innerHTML='';
 const thead=document.createElement('thead'),hr=document.createElement('tr');
 ['FECHA','Nº APORTACIÓN','APORTACIONES ANTERIORES','IMPORTE APORTACIÓN','TOTAL APORTADO','PARTICIPACIONES APORTACIÓN','TOTAL PARTICIPACIONES','TIPO'].forEach(x=>{const th=document.createElement('th');th.textContent=x;hr.appendChild(th)});
 thead.appendChild(hr);table.appendChild(thead);
 const tbody=document.createElement('tbody');
 rows.forEach(r=>{
   const tr=document.createElement('tr');
   const vals=[r.fecha,r.numero,money(r.anteriores),money(r.importe),money(r.total),r.part?qtyfmt(r.part):'—',r.totalPart?qtyfmt(r.totalPart):'—',r.tipo];
   vals.forEach((v,i)=>{const td=document.createElement('td');td.textContent=v;td.style.textAlign=i===0?'left':'right';tr.appendChild(td)});
   tbody.appendChild(tr);
 });
 table.appendChild(tbody);
 table.style.width='100%';table.style.minWidth='1250px';table.style.tableLayout='auto';
 return true;
}
function fixDates(){
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];
 while(w.nextNode())nodes.push(w.currentNode);
 const rx=/\b(?:\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g;
 nodes.forEach(x=>{const p=x.parentElement;if(!p||['SCRIPT','STYLE','INPUT','TEXTAREA','OPTION'].includes(p.tagName))return;x.nodeValue=x.nodeValue.replace(rx,datefmt);});
}
let running=false,timer;
const apply=()=>{if(running)return;running=true;try{rebuild();fixDates();}finally{running=false;}};
const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,150);});
function start(){observer.observe(document.body,{childList:true,subtree:true,characterData:true});apply();setTimeout(apply,500);setTimeout(apply,1500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
