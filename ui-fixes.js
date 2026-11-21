(function(){'use strict';
const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const N=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
const money=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(N(v));
const qty=v=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(N(v));
const date=v=>{const s=String(v??'').slice(0,10),m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:s};
function table(){return [...document.querySelectorAll('table')].find(t=>{const x=norm(t.innerText||'');return x.includes('aportaciones anteriores')&&(x.includes('aportacion actual')||x.includes('importe aportacion'))})||null}
function ops(){const state=window.S;if(!state||!Array.isArray(state.o))return [];let a=state.o.slice();if(state.context)a=a.filter(x=>String(x.producto_id)===String(state.context));return a.filter(x=>x.fecha).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.created_at||'').localeCompare(String(b.created_at||'')))}
function rebuild(){const t=table(),a=ops();if(!t||!a.length)return false;let capital=0,count=0,units=0;
const rows=a.map(o=>{const type=norm(o.tipo_operacion),amount=N(o.importe_neto)||N(o.importe_bruto);let move=0,parts=0,label=o.tipo_operacion||'';
if(type==='aportacion'){move=amount!==0?Math.abs(amount):Math.abs(N(o.cantidad)*N(o.precio_unitario));count++;parts=Math.abs(N(o.cantidad));label='Aportación'}
else if(type==='traspaso'){move=amount<0?amount:0;parts=N(o.cantidad);label=amount<0?'Traspaso de salida':'Traspaso recibido'}
else if(type==='otros'){label='Revalorización anterior (informativa)'}
const prev=capital;capital+=move;units+=parts;return {id:o.id,date:date(o.fecha),label,prev,move,capital,count: type==='aportacion'?count:'',units}}).reverse();
t.replaceChildren();const head=document.createElement('thead'),hr=document.createElement('tr');
['FECHA','TIPO','APORTACIONES ANTERIORES','APORTACIÓN ACTUAL','TOTAL APORTADO','Nº APORTACIONES','PARTICIPACIONES','ACCIONES'].forEach(x=>{const th=document.createElement('th');th.textContent=x;hr.appendChild(th)});head.appendChild(hr);t.appendChild(head);
const body=document.createElement('tbody');rows.forEach(r=>{const tr=document.createElement('tr');const vals=[r.date,r.label,money(r.prev),money(r.move),money(r.capital),r.count,qty(r.units),null];vals.forEach((v,i)=>{const td=document.createElement('td');if(i===7){const id=String(r.id).replace(/[^a-f0-9-]/gi,'');td.innerHTML='<button class="btn alt" onclick="editOperation(\''+id+'\')">Modificar</button> <button class="btn red" onclick="deleteOperation(\''+id+'\')">Eliminar</button>'}else td.textContent=v;td.style.textAlign=i<2?'left':'right';tr.appendChild(td)});body.appendChild(tr)});t.appendChild(body);
const foot=document.createElement('tfoot'),fr=document.createElement('tr'),l=document.createElement('td'),v=document.createElement('td'),c=document.createElement('td'),q=document.createElement('td'),blank=document.createElement('td');l.colSpan=4;l.textContent='CAPITAL NETO APORTADO';l.style.fontWeight='800';v.textContent=money(capital);v.style.fontWeight='800';c.textContent=count+' aportaciones';q.textContent=qty(units);fr.append(l,v,c,q,blank);foot.appendChild(fr);t.appendChild(foot);t.dataset.operationsFixed='20261121-v3';t.style.width='100%';t.style.minWidth='1200px';t.style.tableLayout='auto';if(t.parentElement)t.parentElement.style.overflowX='auto';return true}
let busy=false;function apply(){if(busy)return;busy=true;try{rebuild()}catch(e){console.error('Histórico planes',e)}busy=false}
const observer=new MutationObserver(()=>setTimeout(apply,120));function start(){observer.observe(document.body,{childList:true,subtree:true});apply();[300,800,1500,3000].forEach(x=>setTimeout(apply,x))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();