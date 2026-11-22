/* Patrimonio · cotizaciones en tiempo real por WebSocket público de Kraken.
 * Solo activos cripto expresamente identificados como tales y con ticker reconocido.
 * No utiliza claves, no envía órdenes y no guarda ticks como cierres históricos.
 */
(function () {
  'use strict';
  const state = { socket: null, reconnectTimer: null, retry: 0, active: false, status: 'desconectado', rows: {}, message: '' };
  const quoteCurrencies = ['USDT', 'USDC', 'EUR', 'USD', 'GBP'];
  const aliases = { BTC: 'XBT', DOGE: 'XDG' };

  function cryptoProducts() {
    try {
      return (S.p || []).filter(p => p.activo !== false && !account(p) && /cripto|crypto|moneda virtual/i.test(String(tn(p) || '')));
    } catch (_) { return []; }
  }
  function parsePair(raw) {
    let s = String(raw || '').trim().toUpperCase().replace(/\s/g, '');
    if (!s) return null;
    let base = '', quote = '';
    const separated = s.match(/^([A-Z0-9]{2,12})[\/_-]([A-Z]{3,5})$/);
    if (separated) { base = separated[1]; quote = separated[2]; }
    else {
      const q = quoteCurrencies.find(x => s.endsWith(x));
      if (!q || s.length <= q.length) return null;
      base = s.slice(0, -q.length); quote = q;
    }
    if (aliases[base]) base = aliases[base];
    if (aliases[quote]) quote = aliases[quote];
    return { symbol: base + '/' + quote, quote };
  }
  function el(id) { return document.getElementById(id); }
  function money(v, currency) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 8 }).format(Number(v) || 0);
  }
  function paint() {
    const host = el('patrimonioRealtimeStatus');
    const body = el('patrimonioRealtimeRows');
    const status = el('patrimonioRealtimeState');
    if (status) {
      const labels = { conectado: 'Conectado', conectando: 'Conectando…', desconectado: 'Desconectado', error: 'Error de conexión' };
      status.textContent = labels[state.status] || state.status;
      status.className = 'pill ' + (state.status === 'conectado' ? 'ok' : state.status === 'error' ? 'warn' : '');
    }
    if (host) host.textContent = state.message;
    if (!body) return;
    const products = cryptoProducts();
    if (!products.length) {
      body.innerHTML = '<div class="empty">No hay criptomonedas activas en la cartera. La conexión WebSocket queda preparada, pero no se abrirá una conexión ni se inventarán activos.</div>';
      return;
    }
    body.innerHTML = products.map(p => {
      const pair = parsePair(p.ticker);
      const q = pair && state.rows[pair.symbol];
      return '<div class="row"><span><b>' + esc(p.nombre) + '</b><div class="sub">' + esc(p.ticker || 'Sin ticker') + (pair ? ' · Kraken ' + esc(pair.symbol) : ' · Símbolo no reconocido') + '</div></span><span style="text-align:right"><b>' + (q ? money(q.price, pair.quote) : '—') + '</b><div class="sub">' + (q ? new Date(q.time).toLocaleTimeString('es-ES') : 'Esperando cotización') + '</div></span></div>';
    }).join('');
  }
  function stopTimer() { if (state.reconnectTimer) clearTimeout(state.reconnectTimer); state.reconnectTimer = null; }
  function disconnect(manual) {
    state.active = false; stopTimer();
    if (state.socket) { try { state.socket.onclose = null; state.socket.close(1000, 'Cierre solicitado'); } catch (_) {} }
    state.socket = null; state.status = 'desconectado';
    if (manual) state.message = 'Conexión cerrada por el usuario.';
    paint();
  }
  function scheduleReconnect() {
    if (!state.active || state.reconnectTimer) return;
    const delay = Math.min(30000, 2000 * Math.pow(2, Math.min(state.retry++, 4)));
    state.status = 'error'; state.message = 'Conexión interrumpida. Reintento automático en ' + Math.round(delay / 1000) + ' s.';
    paint();
    state.reconnectTimer = setTimeout(() => { state.reconnectTimer = null; openSocket(); }, delay);
  }
  function openSocket() {
    if (!state.active) return;
    const products = cryptoProducts();
    const bySymbol = new Map();
    for (const p of products) {
      const pair = parsePair(p.ticker);
      if (pair) {
        if (!bySymbol.has(pair.symbol)) bySymbol.set(pair.symbol, []);
        bySymbol.get(pair.symbol).push(p);
      }
    }
    const symbols = [...bySymbol.keys()];
    if (!symbols.length) {
      state.status = 'desconectado';
      state.message = 'No hay tickers de criptomonedas compatibles con Kraken. Configura, por ejemplo, BTC/EUR o ETH/USD.';
      paint(); return;
    }
    state.status = 'conectando'; state.message = 'Abriendo una conexión pública de mercado a Kraken…'; paint();
    let ws;
    try { ws = new WebSocket('wss://ws.kraken.com/'); }
    catch (e) { state.message = e.message || String(e); scheduleReconnect(); return; }
    state.socket = ws;
    ws.onopen = () => {
      if (!state.active || state.socket !== ws) return;
      state.retry = 0; state.status = 'conectado';
      state.message = 'Conectado a Kraken. Suscripciones: ' + symbols.join(', ') + '. Datos en directo; sin clave API.';
      ws.send(JSON.stringify({ event: 'subscribe', pair: symbols, subscription: { name: 'ticker' } }));
      paint();
    };
    ws.onmessage = ev => {
      if (state.socket !== ws) return;
      let data; try { data = JSON.parse(ev.data); } catch (_) { return; }
      if (data && data.event === 'heartbeat') return;
      if (data && data.event === 'subscriptionStatus') {
        if (data.status === 'error') { state.message = 'Kraken rechazó una suscripción: ' + (data.errorMessage || data.pair || 'símbolo no admitido'); paint(); }
        return;
      }
      if (!Array.isArray(data) || data[2] !== 'ticker' || !data[1]) return;
      const pair = String(data[3] || '');
      const ticker = data[1];
      const last = Number(ticker.c && ticker.c[0]);
      if (!Number.isFinite(last) || last <= 0) return;
      const key = pair.replace(/^XBT\//, 'XBT/');
      const quote = key.split('/')[1] || 'EUR';
      state.rows[key] = { price: last, time: Date.now(), quote };
      paint();
    };
    ws.onerror = () => { if (state.socket === ws) { state.status = 'error'; state.message = 'Error en la conexión con Kraken. Se intentará reconectar.'; paint(); } };
    ws.onclose = () => { if (state.socket === ws) { state.socket = null; scheduleReconnect(); } };
  }
  function connect() {
    disconnect(false);
    state.active = true; state.retry = 0; state.message = '';
    openSocket();
  }
  function panel() {
    const products = cryptoProducts();
    const rows = products.length
      ? '<div id="patrimonioRealtimeRows"></div>'
      : '<div id="patrimonioRealtimeRows"><div class="empty">No hay criptomonedas activas en la cartera. La conexión WebSocket queda preparada para cuando se añadan.</div></div>';
    return '<div class="card" id="patrimonioRealtimeCard"><div class="toolbar"><div><h2>⚡ Cotizaciones en tiempo real · WebSocket</h2><div class="sub">Kraken · Feed público de mercado · Sin clave API · Solo lectura</div></div><span id="patrimonioRealtimeState" class="pill">Desconectado</span></div><div class="notice">Esta conexión solo cubre criptomonedas negociadas en Kraken. No sustituye las fuentes de acciones, ETF, fondos ni planes de pensiones. Los ticks se muestran en directo y no se guardan como cierres históricos.</div><div id="patrimonioRealtimeRows">' + rows.replace(/^<div id="patrimonioRealtimeRows">|<\/div>$/g, '') + '</div><div id="patrimonioRealtimeStatus" class="sub" style="margin-top:10px">La conexión se abrirá únicamente cuando existan criptomonedas compatibles.</div><div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px"><button class="btn" type="button" onclick="window.PatrimonioRealtime.connect()" ' + (products.length ? '' : 'disabled') + '>Conectar WebSocket</button><button class="btn alt" type="button" onclick="window.PatrimonioRealtime.disconnect(true)">Desconectar</button></div><div class="sub" style="margin-top:10px">Documentación oficial: <a href="https://support.kraken.com/articles/360022326871-kraken-websocket-api-frequently-asked-questions" target="_blank" rel="noopener">Kraken WebSocket API</a>.</div></div>';
  }
  const originalSources = window.sources;
  if (typeof originalSources === 'function') {
    window.sources = function () {
      return originalSources() + panel();
    };
  }
  window.PatrimonioRealtime = { connect, disconnect, status: () => ({ status: state.status, rows: state.rows }) };
  window.addEventListener('beforeunload', () => disconnect(false));
})();
