/* Dashboard dinámico de la portada de Patrimonio */
(function(){
  const escD=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const dashMoney=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(n)||0);
  const dashNum=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(Number(n)||0);
  const dashDate=d=>d?new Intl.DateTimeFormat('es-ES').format(new Date(String(d).slice(0,10)+'T00:00:00')):'—';
  window.PatrimonioDashboard={range:'all'};

  const style=document.createElement('style');
  style.textContent=`
  .dash{display:grid;gap:18px}.dash-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.dash-card{background:#fff;border:1px solid var(--l);border-radius:18px;padding:18px;box-shadow:0 6px 20px #17243d0a}.dash-kpi{min-height:118px}.dash-label{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--m);font-weight:900}.dash-kpi strong{display:block;font-size:28px;margin-top:8px}.dash-small{font-size:13px;color:var(--m);margin-top:6px}.dash-positive{color:var(--g)}.dash-negative{color:var(--r)}.dash-layout{display:grid;grid-template-columns:1.45fr .95fr;gap:18px}.dash-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.dash-title h2,.dash-title h3{margin:0}.dash-filters{display:flex;gap:7px;flex-wrap:wrap}.dash-filter{border:1px solid var(--l);background:#fff;color:var(--b);border-radius:9px;padding:7px 10px;font-size:12px;font-weight:800;cursor:pointer}.dash-filter.active{background:var(--b);color:#fff}.dash-chart{height:250px;position:relative}.dash-chart svg{width:100%;height:100%;overflow:visible}.dash-axis{font-size:10px;fill:#71809a}.dash-legend{display:grid;gap:9px;margin-top:10px}.dash-legend-row{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px}.dash-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:7px}.dash-bar-row{display:grid;grid-template-columns:minmax(100px,1fr) 2fr auto;align-items:center;gap:9px;margin:12px 0;font-size:13px}.dash-bar-bg{height:10px;background:#edf2f8;border-radius:99px;overflow:hidden}.dash-bar{height:100%;background:var(--b);border-radius:99px}.dash-empty{padding:30px;text-align:center;color:var(--m)}.dash-note{font-size:12px;color:var(--m);margin-top:12px}.dash-table{width:100%;border-collapse:collapse}.dash-table th{font-size:11px;text-transform:uppercase;color:var(--m);text-align:left;padding:8px;border-bottom:2px solid var(--l)}.dash-table td{padding:10px 8px;border-bottom:1px solid var(--l);font-size:13px}.dash-table td:not(:first-child),.dash-table th:not(:first-child){text-align:right}.dash-top{display:grid;grid-template-columns:1fr 1fr;gap:18px}.dash-pie-wrap{display:grid;grid-template-columns:180px 1fr;align-items:center;gap:20px}.dash-pie{width:170px;height:170px;border-radius:50%;position:relative;background:#edf2f8}.dash-pie:after{content:'';position:absolute;inset:38px;background:#fff;border-radius:50%}.dash-pie-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:1;font-weight:900;font-size:13px;text-align:center;padding:35px}.dash-alert{padding:12px 14px;border-radius:12px;background:#fff7df;color:var(--w);font-size:13px}.dash-list{display:grid;gap:10px}.dash-list-item{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--l)}
  @media(max-width:1000px){.dash-grid{grid-template-columns:repeat(2,1fr)}.dash-layout,.dash-top{grid-template-columns:1fr}.dash-pie-wrap{grid-template-columns:160px 1fr}}
  @media(max-width:600px){.dash-grid{grid-template-columns:1fr}.dash-pie-wrap{grid-template-columns:1fr}.dash-pie{margin:auto}.dash-title{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);

  function rangeStart(range){
    const now=new Date();
    if(range==='1m'){now.setMonth(now.getMonth()-1);return now.toISOString().slice(0,10)}
    if(range==='3m'){now.setMonth(now.getMonth()-3);return now.toISOString().slice(0,10)}
    if(range==='ytd')return now.getFullYear()+'-01-01';
    if(range==='1y'){now.setFullYear(now.getFullYear()-1);return now.toISOString().slice(0,10)}
    return '0000-01-01';
  }
  function snapshots(){
    const byDate={};
    (S.v||[]).forEach(v=>{const d=String(v.fecha||'').slice(0,10);if(!d)return;(byDate[d]??=[]).push(v)});
    const dates=Object.keys(byDate).sort();
    return dates.map(d=>{let total=0;byDate[d].forEach(v=>{if(v.valor_total!=null)total+=Number(v.valor_total)||0;else if(v.precio_unitario!=null&&v.producto_id)total+=(Number(v.precio_unitario)||0)*(typeof qty==='function'?qty(v.producto_id):0)});return {d,total}}).filter(x=>x.total>0);
  }
  function evolution(){
    let rows=snapshots();
    const start=rangeStart(PatrimonioDashboard.range);if(start!=='0000-01-01')rows=rows.filter(x=>x.d>=start);
    if(rows.length<2)return rows;
    const maxPoints=12;if(rows.length>maxPoints){const step=(rows.length-1)/(maxPoints-1);rows=Array.from({length:maxPoints},(_,i)=>rows[Math.round(i*step)])}
    return rows;
  }
  function allocation(){
    const map={};
    active().forEach(p=>{const k=tn(p);map[k]=(map[k]||0)+val(p)});
    return Object.entries(map).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  }
  function entityData(){
    return Object.entries(groups()).map(([id,ps])=>({name:S.e.find(e=>e.id===id)?.nombre||'Sin entidad',value:ps.reduce((a,p)=>a+val(p),0),count:ps.length})).sort((a,b)=>b.value-a.value);
  }
  function trend(rows){if(rows.length<2)return null;const first=rows[0].total,last=rows[rows.length-1].total;return {value:last-first,pct:first?((last-first)/first*100):0}}
  function lineChart(rows){
    if(!rows.length)return '<div class="dash-empty">No hay valoraciones históricas suficientes para mostrar la evolución.</div>';
    if(rows.length===1)return '<div class="dash-empty">Solo existe una valoración histórica: '+dashMoney(rows[0].total)+' el '+dashDate(rows[0].d)+'.</div>';
    const w=720,h=250,p=28,vals=rows.map(r=>r.total),min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;
    const pts=rows.map((r,i)=>{const x=p+i*(w-2*p)/(rows.length-1);const y=h-p-(r.total-min)/span*(h-2*p);return [x,y,r]});
    const poly=pts.map(x=>x[0]+','+x[1]).join(' ');
    const area=p+' '+(h-p)+' '+pts.map(x=>x[0]+' '+x[1]).join(' ')+' '+(w-p)+' '+(h-p);
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="${area}" fill="#edf3ff"></polygon><polyline points="${poly}" fill="none" stroke="#234b86" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>${pts.map(x=>`<circle cx="${x[0]}" cy="${x[1]}" r="4" fill="#fff" stroke="#234b86" stroke-width="2"><title>${dashDate(x[2].d)} · ${dashMoney(x[2].total)}</title></circle>`).join('')}<text x="${p}" y="16" class="dash-axis">${dashMoney(max)}</text><text x="${p}" y="${h-3}" class="dash-axis">${dashMoney(min)}</text>${pts.map((x,i)=>i===0||i===pts.length-1?`<text x="${x[0]}" y="${h+1}" text-anchor="${i?'end':'start'}" class="dash-axis">${dashDate(x[2].d)}</text>`:'').join('')}</svg>`;
  }
  function pie(data,total){
    if(!data.length)return '<div class="dash-empty">Sin datos.</div>';
    const palette=['#234b86','#4f79b8','#6f9bd1','#8bb3dc','#9bbcae','#c49a52','#7c6ea8','#6d9b9a'];let cur=0;const stops=data.map(([k,v],i)=>{const a=cur;cur+=v/total*360;return `${palette[i%palette.length]} ${a}deg ${cur}deg`}).join(',');
    return `<div class="dash-pie-wrap"><div class="dash-pie" style="background:conic-gradient(${stops})"><div class="dash-pie-center">${dashMoney(total)}</div></div><div class="dash-legend">${data.map(([k,v],i)=>`<div class="dash-legend-row"><span><i class="dash-dot" style="background:${palette[i%palette.length]}"></i>${escD(k)}</span><b>${(v/total*100).toFixed(1)}%</b></div>`).join('')}</div></div>`;
  }
  function summaryDashboard(){
    const products=active(),total=products.reduce((a,p)=>a+val(p),0),accounts=products.filter(account).reduce((a,p)=>a+val(p),0),invest=total-accounts;
    const rows=evolution(),tr=trend(rows),alloc=allocation(),entities=entityData();
    const ranges=[['all','Todo'],['1y','1 año'],['ytd','Este año'],['3m','3 meses'],['1m','1 mes']];
    const top=products.map(p=>({p,v:val(p),d:diff(p),pc:pct(p)})).sort((a,b)=>b.v-a.v).slice(0,5);
    return `<div class="dash">
      <div class="dash-grid">
        <div class="dash-card dash-kpi"><div class="dash-label">Patrimonio total</div><strong>${dashMoney(total)}</strong><div class="dash-small">Último valor disponible</div></div>
        <div class="dash-card dash-kpi"><div class="dash-label">Cuentas</div><strong>${dashMoney(accounts)}</strong><div class="dash-small">Liquidez y saldos</div></div>
        <div class="dash-card dash-kpi"><div class="dash-label">Inversiones</div><strong>${dashMoney(invest)}</strong><div class="dash-small">Productos de inversión</div></div>
        <div class="dash-card dash-kpi"><div class="dash-label">Productos</div><strong>${products.length}</strong><div class="dash-small">${Object.keys(groups()).length} entidades</div></div>
      </div>
      <div class="dash-layout">
        <div class="dash-card"><div class="dash-title"><h3>Evolución del patrimonio</h3><div class="dash-filters">${ranges.map(([k,l])=>`<button class="dash-filter ${PatrimonioDashboard.range===k?'active':''}" onclick="PatrimonioDashboard.range='${k}';render()">${l}</button>`).join('')}</div></div>${lineChart(rows)}${tr?`<div class="dash-small ${tr.value>=0?'dash-positive':'dash-negative'}">${tr.value>=0?'▲':'▼'} ${dashMoney(Math.abs(tr.value))} (${Math.abs(tr.pct).toFixed(2)} %) en el periodo mostrado</div>`:''}</div>
        <div class="dash-card"><div class="dash-title"><h3>Distribución por categoría</h3></div>${pie(alloc,total)}</div>
      </div>
      <div class="dash-top">
        <div class="dash-card"><div class="dash-title"><h3>Patrimonio por entidad</h3></div>${entities.length?entities.map(e=>`<div class="dash-bar-row"><span title="${escD(e.name)}">${escD(e.name)}</span><div class="dash-bar-bg"><div class="dash-bar" style="width:${total?Math.max(2,e.value/total*100):0}%"></div></div><b>${dashMoney(e.value)}</b></div>`).join(''):'<div class="dash-empty">Sin entidades.</div>'}</div>
        <div class="dash-card"><div class="dash-title"><h3>Mayores posiciones</h3></div><table class="dash-table"><thead><tr><th>Producto</th><th>Valor</th><th>%</th></tr></thead><tbody>${top.map(x=>`<tr><td>${escD(x.p.nombre)}</td><td>${dashMoney(x.v)}</td><td>${total?(x.v/total*100).toFixed(1):'0.0'}%</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="dash-card"><div class="dash-title"><h3>Resumen de resultados</h3></div><div class="dash-list">${top.map(x=>`<div class="dash-list-item"><span>${escD(x.p.nombre)}</span><span class="${x.d>0?'dash-positive':x.d<0?'dash-negative':''}">${x.d>0?'+':''}${dashMoney(x.d)} ${x.pc?(x.pc>0?'+':'')+x.pc.toFixed(2)+' %':''}</span></div>`).join('')}</div><div class="dash-note">El resultado de cada producto se calcula con la información disponible en operaciones y valoraciones. Las cuentas muestran la variación frente a sus valoraciones registradas.</div></div>
    </div>`;
  }
  window.summary=summaryDashboard;
  try{summary=summaryDashboard}catch(e){}
})();
