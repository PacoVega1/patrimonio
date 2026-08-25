/* Operaciones de planes de pensiones: reconstrucción desde S.o.
   Orden definitivo:
   FECHA | Nº APORTACIÓN | APORTACIONES ANTERIORES | IMPORTE APORTACIÓN |
   TOTAL APORTADO | PARTICIPACIONES APORTACIÓN | TOTAL PARTICIPACIONES | TIPO
*/
(function(){
  'use strict';
  const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const isContribution=t=>['aportacion','aportación'].includes(norm(t));
  const parseNum=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const fmt3=n=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(parseNum(n));
  const fmtMoney=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(parseNum(n));
  const fmtDate=v=>{const s=String(v??'').slice(0,10),m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);return m?`${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`:s};

  function operationsTable(){
    const cards=[...document.querySelectorAll('.card')];
    const card=cards.find(c=>norm(c.querySelector('h3')?.textContent)==='operaciones');
    return card?.querySelector('table.history')||null;
  }

  function rebuild(){
    const table=operationsTable();
    if(!table||!window.S||!Array.isArray(S.o)||!S.context)return;
    const ops=S.o.filter(x=>x.producto_id===S.context).slice().sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||String(a.id).localeCompare(String(b.id)));
    if(!ops.length)return;

    let numero=0, totalAportado=0, totalParticipaciones=0;
    const rows=ops.map(o=>{
      const t=o.tipo_operacion||'';
      const aport=isContribution(t);
      const cantidad=parseNum(o.cantidad);
      let importe=parseNum(o.importe_neto);
      if(aport && !importe) importe=Math.abs(cantidad*parseNum(o.precio_unitario));
      const anteriores=totalAportado;
      if(aport){numero++;totalAportado+=importe;totalParticipaciones+=cantidad;}
      return {
        fecha:fmtDate(o.fecha),
        numero:aport?numero:'',
        anteriores,
        importe:aport?importe:0,
        total:totalAportado,
        participacion:aport?cantidad:0,
        totalParticipaciones,
        tipo:t
      };
    }).reverse();

    table.innerHTML='';
    const thead=document.createElement('thead');
    const trh=document.createElement('tr');
    ['FECHA','Nº APORTACIÓN','APORTACIONES ANTERIORES','IMPORTE APORTACIÓN','TOTAL APORTADO','PARTICIPACIONES APORTACIÓN','TOTAL PARTICIPACIONES','TIPO'].forEach(x=>{const th=document.createElement('th');th.textContent=x;trh.appendChild(th)});
    thead.appendChild(trh);table.appendChild(thead);
    const tbody=document.createElement('tbody');
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      [r.fecha,r.numero,r.anteriores?fmtMoney(r.anteriores):fmtMoney(0),r.importe?fmtMoney(r.importe):'—',r.total?fmtMoney(r.total):fmtMoney(0),r.participacion?fmt3(r.participacion):'—',r.totalParticipaciones?fmt3(r.totalParticipaciones):'—',r.tipo].forEach((x,i)=>{const td=document.createElement('td');td.textContent=x;td.style.textAlign=i===0?'left':'right';tr.appendChild(td)});
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    table.style.minWidth='1200px';
  }

  function formatDates(){
    const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),a=[];
    while(w.nextNode())a.push(w.currentNode);
    const rx=/\b(?:\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g;
    a.forEach(n=>{const p=n.parentElement;if(!p||['SCRIPT','STYLE','INPUT','TEXTAREA','OPTION'].includes(p.tagName))return;n.nodeValue=n.nodeValue.replace(rx,x=>fmtDate(x));});
  }

  function apply(){formatDates();rebuild();}
  let timer;
  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,120);});
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
