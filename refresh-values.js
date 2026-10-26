// Actualización manual de cotizaciones compatibles con Yahoo Finance.
(function(){
  if (window.__patrimonioRefreshValuesInstalled) return;
  window.__patrimonioRefreshValuesInstalled = true;
  const originalRender = window.render;
  if (typeof originalRender !== 'function') return;

  function installButton(){
    const top = document.querySelector('#app .top');
    if (!top) return;
    let btn = document.getElementById('refreshValuesBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'refreshValuesBtn';
      btn.className = 'btn';
      btn.textContent = '↻ Actualizar cotizaciones';
      btn.title = 'Recupera cotizaciones recientes de los productos con ticker configurado';
      btn.addEventListener('click', updateValues);
    }
    const brand = top.querySelector('.brand');
    const capture = Array.from(top.querySelectorAll('button')).find(b => (b.textContent || '').includes('Captura inteligente'));
    const logout = Array.from(top.querySelectorAll('button')).find(b => (b.textContent || '').trim() === 'Salir');
    // Orden solicitado: título a la izquierda, actualizar, captura en medio y salir a la derecha.
    if (brand) top.appendChild(brand);
    top.appendChild(btn);
    if (capture) top.appendChild(capture);
    if (logout) top.appendChild(logout);
    if (!document.getElementById('refreshValuesResponsiveStyle')) {
      const style = document.createElement('style');
      style.id = 'refreshValuesResponsiveStyle';
      style.textContent = '@media(max-width:600px){#refreshValuesBtn{font-size:12px;padding:9px 10px}.top{flex-wrap:wrap}}';
      document.head.appendChild(style);
    }
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
      const fmt = value => {
        if (value === null || value === undefined || value === '') return 'no disponible';
        const n = Number(value);
        return Number.isFinite(n) ? n.toLocaleString('es-ES', {maximumFractionDigits: 8}) : String(value);
      };
      if (discrepancies.length) message += '\n\nDISCREPANCIAS (se conservaron los datos existentes):\n' +
        discrepancies.map(x => x.producto + '\nFecha: ' + (x.fecha || 'no disponible') +
          '\nValor guardado: ' + fmt(x.manual) + '\nValor de la fuente: ' + fmt(x.automatico)).join('\n\n');
      if (failed.length) message += '\n\nERRORES DE FUENTE:\n' + failed.map(x => x.producto + ': ' + (x.error || 'error de fuente')).join('\n');
      if (noSource.length) message += '\n\nSIN FUENTE ACTIVA:\n' + noSource.map(x => x.producto).join('\n');
      if (updated.length) message += '\n\nACTUALIZADOS:\n' + updated.map(x => x.producto + ': ' + x.fecha + ' — ' + fmt(x.valor) + ' ' + (x.fuente ? '(' + x.fuente + ')' : '')).join('\n');
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
