/* Ajustes de presentación y navegación de Patrimonio */
(function(){
  const originalQuoteHistory=window.quoteHistory;
  const originalOpsHistory=window.opsHistory;

  // Formato europeo fijo DD/MM/AAAA, independientemente de la configuración regional del navegador.
  window.date=function(d){
    if(!d)return '—';
    const s=String(d).slice(0,10);
    const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m?`${m[3]}/${m[2]}/${m[1]}`:s;
  };

  // Histórico con paginación funcional: no reinicia la página al pulsar Anterior/Siguiente.
  window.quoteHistory=function(id){
    const qh=histQ(id),vh=histV(id),m=new Map();
    qh.forEach(q=>m.set(String(q.fecha).slice(0,10),{fecha:q.fecha,cot:q.cierre,total:Number(q.cierre||0)*qty(id),origen:'Cotización'}));
    vh.forEach(v=>{const k=String(v.fecha).slice(0,10),r=m.get(k)||{fecha:v.fecha};r.total=v.valor_total;r.cot=r.cot??v.precio_unitario;r.origen=r.origen?r.origen+' + '+(v.origen||'Valoración'):(v.origen||'Valoración');m.set(k,r)});
    const rows=[...m.values()].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
    const page=25,start=S.historyPage*page,part=rows.slice(start,start+page);
    if(!rows.length)return '<div class="empty">Sin histórico.</div>';
    const body=part.map(r=>`<tr><td>${date(r.fecha)}</td><td>${r.cot==null?'—':num(r.cot)+' €'}</td><td>${r.total==null?'—':money(r.total)}</td><td>${esc(r.origen||'')}</td></tr>`).join('');
    const prevDisabled=start===0?'disabled':'';
    const nextDisabled=start+page>=rows.length?'disabled':'';
    return `<div id="quoteHistory_${id}"><table class="history"><thead><tr><th>Fecha</th><th>Cotización/valor</th><th>Total</th><th>Origen</th></tr></thead><tbody>${body}</tbody></table><div class="toolbar" style="margin-top:12px"><span class="sub">${start+1}-${Math.min(start+page,rows.length)} de ${rows.length}</span><span><button class="btn alt" ${prevDisabled} onclick="historyMove('${id}',-1)">Anterior</button> <button class="btn alt" ${nextDisabled} onclick="historyMove('${id}',1)">Siguiente</button></span></div></div>`;
  };

  window.historyMove=function(id,delta){
    const total=histQ(id).length+histV(id).filter(v=>!histQ(id).some(q=>String(q.fecha).slice(0,10)===String(v.fecha).slice(0,10))).length;
    const maxPage=Math.max(0,Math.ceil(total/25)-1);
    S.historyPage=Math.max(0,Math.min(maxPage,S.historyPage+delta));
    const box=document.getElementById('quoteHistory_'+id);
    if(box)box.outerHTML=quoteHistory(id);
  };

  // En planes de pensiones mostramos las aportaciones con el contexto acumulado solicitado.
  window.opsHistory=function(id){
    const a=S.o.filter(x=>x.producto_id===id).sort((x,y)=>String(x.fecha).localeCompare(String(y.fecha))||String(x.id).localeCompare(String(y.id)));
    if(!a.length)return '<div class="empty">Sin operaciones.</div>';
    const p=S.p.find(x=>x.id===id);
    const pension=p&&String(tn(p)).toLowerCase().includes('pension');
    if(!pension)return originalOpsHistory(id);

    let acumulado=0,numero=0;
    const rows=a.map(x=>{
      const tipo=String(x.tipo_operacion||'');
      const esAportacion=['aportacion','aportación'].includes(tipo.toLowerCase());
      const importe=esAportacion?Number(x.importe_neto)||0:0;
      const anteriores=acumulado;
      if(esAportacion){acumulado+=importe;numero++;}
      return {x,anteriores,importe,total:acumulado,numero};
    }).reverse();

    return '<div class="tablewrap"><table class="history"><thead><tr><th>Fecha</th><th>Nº participaciones</th><th>Importe aportación</th><th>Aportaciones anteriores</th><th>Total aportado</th><th>Nº aportaciones</th><th>Valor aportación</th><th>Tipo</th></tr></thead><tbody>'+rows.map(r=>{
      const x=r.x;
      return `<tr><td>${date(x.fecha)}</td><td>${num(x.cantidad)}</td><td>${r.importe?money(r.importe):'—'}</td><td>${money(r.anteriores)}</td><td><b>${money(r.total)}</b></td><td>${r.numero}</td><td>${money(x.precio_unitario)}</td><td>${esc(x.tipo_operacion)}</td></tr>`;
    }).join('')+'</tbody></table></div>';
  };
})();
