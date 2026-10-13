// Actualización manual de cotizaciones compatibles con Yahoo Finance.
(function(){
  if (window.__patrimonioRefreshValuesInstalled) return;
  window.__patrimonioRefreshValuesInstalled = true;
  const originalRender = window.render;
  if (typeof originalRender !== 'function') return;

  function installButton(){
    const top = document.querySelector('#app .top');
    if (!top || document.getElementById('refreshValuesBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'refreshValuesBtn';
    btn.className = 'btn';
    btn.textContent = '↻ Actualizar cotizaciones';
    btn.title = 'Recupera cotizaciones recientes de los productos con ticker configurado';
    btn.addEventListener('click', updateValues);
    const logout = top.querySelector('button');
    if (logout) top.insertBefore(btn, logout);
    else top.appendChild(btn);
    const style = document.createElement('style');
    style.textContent = '@media(max-width:600px){#refreshValuesBtn{font-size:12px;padding:9px 10px}.top{flex-wrap:wrap}}';
    document.head.appendChild(style);
  }

  window.render = function(){
    originalRender.apply(this, arguments);
    installButton();
  };

  async function updateValues(){
    const btn = document.getElementById('refreshValuesBtn');
    if (!btn) return;
    const products = (S.p || []).filter(p => p.activo !== false && p.ticker && !account(p) && !String(tn(p) || '').toLowerCase().includes('pensión') && !String(tn(p) || '').toLowerCase().includes('pension'));
    const skippedPensions = (S.p || []).filter(p => p.activo !== false && p.ticker && /pensión|pension/i.test(String(tn(p) || ''))).map(p => p.nombre);
    if (!products.length) {
      alert('No hay productos activos con ticker configurado para actualizar automáticamente. Los saldos de cuentas y los productos sin ticker requieren actualización manual.');
      return;
    }
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Actualizando…';
    let updated = 0, unchanged = 0, failed = [], latestAvailable = [];
    try {
      const end = new Date().toISOString().slice(0,10);
      for (const p of products) {
        try {
          const latest = await db.from('cotizaciones_historicas').select('fecha').eq('producto_id',p.id).order('fecha',{ascending:false}).limit(1);
          if (latest.error) throw latest.error;
          const lastDate = latest.data && latest.data[0] ? String(latest.data[0].fecha).slice(0,10) : '';
          const startDate = lastDate ? new Date(new Date(lastDate+'T00:00:00').getTime()-7*86400000).toISOString().slice(0,10) : '2020-01-01';
          const response = await db.functions.invoke('sync-yahoo-history',{body:{ticker:p.ticker,start:startDate,end}});
          if (response.error) throw response.error;
          const rows = response.data && response.data.rows || [];
          if (!rows.length) { unchanged++; continue; }
          const existing = await db.from('cotizaciones_historicas').select('fecha').eq('producto_id',p.id).gte('fecha',startDate).lte('fecha',end);
          if (existing.error) throw existing.error;
          const seen = new Set((existing.data||[]).map(x=>String(x.fecha).slice(0,10)));
          const fresh = [...new Map(rows.filter(x=>x.fecha && !seen.has(String(x.fecha).slice(0,10))).map(x=>[String(x.fecha).slice(0,10),x])).values()];
          if (!fresh.length) { unchanged++; const maxDate = rows.reduce((m,x)=>x.fecha && x.fecha>m?x.fecha:m,''); if(maxDate) latestAvailable.push(p.nombre+': '+maxDate); continue; }
          const payload = fresh.map(x=>({user_id:S.user.id,producto_id:p.id,fecha:x.fecha,apertura:x.apertura,maximo:x.maximo,minimo:x.minimo,cierre:x.cierre,volumen:x.volumen,moneda:p.moneda||'EUR',tipo_precio:'cierre',factor_conversion:1,origen:'Yahoo Finance',fuente:'Yahoo Finance API',es_valida:true,prioridad_origen:60}));
          for(let i=0;i<payload.length;i+=500){
            const ins=await db.from('cotizaciones_historicas').insert(payload.slice(i,i+500));
            if(ins.error) throw ins.error;
          }
          if (S.qLoaded) S.qLoaded[p.id]=false;
          updated += fresh.length;
        } catch(e) { failed.push(p.nombre+': '+(e.message||String(e))); }
      }
      await load();
      let message = 'Actualización terminada.\nCotizaciones nuevas añadidas: '+updated+'.\nProductos sin cambios nuevos: '+unchanged+'.';
      if (failed.length) message += '\n\nNo se pudieron actualizar:\n'+failed.join('\n');
      message += '\n\nSolo se actualizan productos con ticker compatible con Yahoo Finance. Los saldos manuales y los productos sin ticker no se modifican.';
      alert(message);
    } finally {
      const current = document.getElementById('refreshValuesBtn');
      if (current) { current.disabled=false; current.textContent=label; }
    }
  }

  // El primer render puede haberse ejecutado antes de cargar este archivo.
  installButton();
})();
