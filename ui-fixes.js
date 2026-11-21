(function(){'use strict';
const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const dateISO=s=>{const m=String(s||'').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?m[3]+'-'+m[2]+'-'+m[1]:String(s||'').slice(0,10)};
function findOperationsTable(){return [...document.querySelectorAll('table')].find(t=>{const h=norm(t.querySelector('thead')?.innerText||t.rows?.[0]?.innerText||'');return h.includes('fecha')&&h.includes('aportaciones anteriores')&&h.includes('aportacion actual')&&h.includes('total aportado')})||null}
function apply(){
 const t=findOperationsTable(),state=window.S;if(!t||!state||!Array.isArray(state.o)||[...(t.querySelector('thead tr')?.cells||[])].some(c=>norm(c.textContent)==='acciones'))return;
 const headers=t.querySelector('thead tr')||t.rows[0];if(!headers)return;
 if(![...headers.cells].some(c=>norm(c.textContent)==='acciones')){const th=document.createElement('th');th.textContent='ACCIONES';headers.appendChild(th)}
 const rows=[...(t.querySelector('tbody')?.rows||[])];const pid=state.context;
 rows.forEach(row=>{
  if(row.dataset.editActionsAdded)return;
  const cells=[...row.cells];if(cells.length<6)return;
  const date=dateISO(cells[0].textContent),type=norm(cells[1].textContent);
  const ops=state.o.filter(o=>String(o.producto_id)===String(pid)&&String(o.fecha).slice(0,10)===date&&norm(o.tipo_operacion)===type);
  const op=ops.length===1?ops[0]:ops.find(o=>Math.abs(Number(o.importe_neto||o.importe_bruto||0)-parseFloat(cells[3].textContent.replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.')))<0.02);
  const td=document.createElement('td');td.style.whiteSpace='nowrap';
  if(op){const id=String(op.id).replace(/[^a-f0-9-]/gi,'');td.innerHTML='<button class="btn alt" type="button" onclick="editOperation(\''+id+'\')">Modificar</button> <button class="btn red" type="button" onclick="deleteOperation(\''+id+'\')">Eliminar</button>'}
  else td.textContent='—';
  row.appendChild(td);row.dataset.editActionsAdded='1';
 });
 t.style.width='100%';t.style.minWidth='0';t.style.tableLayout='auto';
 t.querySelectorAll('th,td').forEach(c=>{c.style.padding='6px 7px';c.style.fontSize='12px';c.style.whiteSpace='nowrap'});
 const wrap=t.parentElement;if(wrap){wrap.style.maxWidth='100%';wrap.style.overflowX='auto'}
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;try{apply()}catch(e){console.error('Acciones histórico pensiones',e)}},120)}
const observer=new MutationObserver(schedule);
function start(){observer.observe(document.body,{childList:true,subtree:true});schedule();[300,800,1500,3000].forEach(x=>setTimeout(schedule,x))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();