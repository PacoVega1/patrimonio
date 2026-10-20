// Actualización manual de cotizaciones compatibles con Yahoo Finance.
(function(){
  if (window.__patrimonioRefreshValuesInstalled) return;
  window.__patrimonioRefreshValuesInstalled = true;
  const originalRender = window.render;
  if (typeof originalRender !== 'function') return;

  function installButton(){
    const top = document.querySelector('#app .top');
    const tabs = document.querySelector('#app .tabs');
    const capture = Array.from(document.querySelectorAll('#app button')).find(b => (b.textContent || '').includes('Captura inteligente'));
    if (capture && tabs && capture.parentElement !== tabs) tabs.insertBefore(capture, tabs.firstChild);
    if (!top || document.getElementById('refreshValuesBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'refreshValuesBtn';
    btn.className = 'btn';
    btn.textContent = '↻ Actualizar cotizaciones';
    btn.title = 'Recupera cotizaciones recientes de los productos con ticker configurado';
    btn.addEventListener('click', updateValues);
    const logout = top.querySelector('button');
    top.appendChild(btn);
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
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Actualizando…';
    try {
      const response = await db.functions.invoke('actualizar-cotizaciones', { body: {} });
      if (response.error) {
        let detail = response.error.message || String(response.error);
        if (response.error.context && typeof response.error.context.json === 'function') {
          try { const j = await response.error.context.json(); detail = j.error || detail; } catch (_) {}
        }
        throw new Error(detail);
      }
      const data = response.data || {};
      if (!data.ok && data.error) throw new Error(data.error);
      await load();
      const resumen = data.resumen || {};
      const details = data.detalles || [];
      let message = 'Actualización terminada.\nProductos actualizados: ' + (resumen.actualizados || 0) +
        '.\nDiscrepancias (no sobrescritas): ' + (resumen.discrepancias || 0) +
        '.\nSin fuente configurada: ' + (resumen.sin_fuente || 0) +
        '.\nErrores de fuente: ' + (resumen.errores || 0) + '.';
      const updated = details.filter(x => x.estado === 'actualizado');
      const failed = details.filter(x => x.estado === 'error');
      const discrepancies = details.filter(x => x.estado === 'discrepancia');
      const noSource = details.filter(x => x.estado === 'sin_fuente');
      if (updated.length) message += '\n\nActualizados:\n' + updated.map(x => x.producto + ': ' + x.fecha + ' — ' + x.valor + ' ' + (x.fuente ? '(' + x.fuente + ')' : '')).join('\n');
      if (failed.length) message += '\n\nErrores:\n' + failed.map(x => x.producto + ': ' + (x.error || 'error de fuente')).join('\n');
      if (discrepancies.length) message += '\n\nDiscrepancias detectadas; se conservaron los datos existentes:\n' + discrepancies.map(x => x.producto + ': fecha ' + x.fecha).join('\n');
      if (noSource.length) message += '\n\nSin fuente activa:\n' + noSource.map(x => x.producto).join(', ');
      message += '\n\nLas cuentas y saldos manuales no se modifican.';
      alert(message);
    } catch(e) {
      alert('No se pudo completar la actualización automática.\n' + (e.message || String(e)));
    } finally {
      const current = document.getElementById('refreshValuesBtn');
      if (current) { current.disabled = false; current.textContent = label; }
    }
  }
  // El primer render puede haberse ejecutado antes de cargar este archivo.
  installButton();
})();
