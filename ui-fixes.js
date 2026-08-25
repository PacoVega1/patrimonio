/* Corrección definitiva de la tabla de operaciones de planes de pensiones.
   Orden acordado:
   FECHA | Nº APORTACIÓN | APORTACIONES ANTERIORES | IMPORTE APORTACIÓN |
   TOTAL APORTADO | PARTICIPACIONES APORTACIÓN | TOTAL PARTICIPACIONES | TIPO
*/
(function(){
  'use strict';
  const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[º°]/g,'o');
  function fechaES(v){const s=String(v??'').trim();let m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[T ].*)?$/);if(m)return `${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`;m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);if(m)return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`;return s;}
  function parseNum(v){let s=String(v??'').trim().replace(/€|\s/g,'');if(!s)return null;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else if(s.includes(','))s=s.replace(',','.');const n=Number(s.replace(/[^0-9+\-.]/g,''));return Number.isFinite(n)?n:null;}
  function fmt3(n){if(n==null||!Number.isFinite(n))return '';return new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(n);}
  function formatDates(){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),a=[];while(w.nextNode())a.push(w.currentNode);const rx=/\b(?:\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g;a.forEach(n=>{const p=n.parentElement;if(!p||['SCRIPT','STYLE','INPUT','TEXTAREA','OPTION'].includes(p.tagName))return;n.nodeValue=n.nodeValue.replace(rx,x=>fechaES(x));});}
  function fixOperationsTable(table){
    const rows=[...table.querySelectorAll('tr')];if(!rows.length)return;const header=rows[0];const hs=[...header.children].map(x=>norm(x.textContent));
    if(!hs.some(x=>x==='fecha'||x.startsWith('fecha')))return;if(!hs.some(x=>x.includes('aportaciones anteriores')))return;if(!hs.some(x=>x.includes('aportacion actual')||x.includes('importe aportacion')))return;
    const body=table.querySelector('tbody');const dataRows=body?[...body.querySelectorAll('tr')]:rows.slice(1);if(!dataRows.length)return;
    const desired=['fecha','n aportacion','aportaciones anteriores','importe aportacion','total aportado','participaciones aportacion','total participaciones','tipo'];
    if(hs.length>=8&&hs.slice(0,8).every((h,i)=>h===desired[i]))return;
    const records=dataRows.map(tr=>[...tr.children].map(td=>td.textContent.trim()));
    const idx=(tests,backup)=>{const i=hs.findIndex(h=>tests.some(t=>h===t||h.includes(t)));return i>=0?i:backup;};
    const fechaI=idx(['fecha'],0),tipoI=idx(['tipo'],1),anterioresI=idx(['aportaciones anteriores'],2),importeI=idx(['aportacion actual','importe aportacion'],3),totalI=idx(['total aportado'],4),numeroI=idx(['n aportaciones','n aportacion','numero aportaciones','numero aportacion'],5),partI=idx(['participaciones aportacion','participaciones de la aportacion','participaciones'],6);
    const partRows=records.map(r=>parseNum(r[partI])),ascending=records.map((_,i)=>i).sort((a,b)=>String(records[a][fechaI]||'').localeCompare(String(records[b][fechaI]||''))),cumulative={};let totalParticipaciones=0;
    ascending.forEach(i=>{const p=partRows[i];if(p!=null)totalParticipaciones+=p;cumulative[i]=totalParticipaciones;});
    const out=records.map((r,i)=>{const vals=[fechaES(r[fechaI]),r[numeroI]||'',r[anterioresI]||'',r[importeI]||'',r[totalI]||'',r[partI]||'',fmt3(cumulative[i]),r[tipoI]||''];const tr=document.createElement('tr');vals.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td);});return tr;});
    header.innerHTML='';const labels=['FECHA','Nº APORTACIÓN','APORTACIONES ANTERIORES','IMPORTE APORTACIÓN','TOTAL APORTADO','PARTICIPACIONES APORTACIÓN','TOTAL PARTICIPACIONES','TIPO'];labels.forEach(text=>{const th=document.createElement('th');th.textContent=text;header.appendChild(th);});
    if(body){body.innerHTML='';out.forEach(tr=>body.appendChild(tr));}else out.forEach(tr=>table.appendChild(tr));
  }
  function apply(){formatDates();document.querySelectorAll('table').forEach(fixOperationsTable);}
  let timer;const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,100);});observer.observe(document.body,{childList:true,subtree:true,characterData:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
