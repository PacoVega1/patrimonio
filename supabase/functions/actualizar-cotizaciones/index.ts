import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" }
});

function isoDate(ts: number) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function toNumber(v: unknown) {
  // Yahoo puede devolver null en los últimos días sin negociación.
  // Number(null) es 0 en JavaScript: hay que descartarlo para no guardar cotizaciones falsas.
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function yahooLatest(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=10d&interval=1d&events=history`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
  const j = await r.json();
  const q = j?.chart?.result?.[0];
  if (!q?.timestamp?.length) throw new Error("Yahoo no devuelve cotizaciones");
  for (let i = q.timestamp.length - 1; i >= 0; i--) {
    const close = toNumber(q.indicators?.quote?.[0]?.close?.[i]);
    if (close !== null) {
      return { fecha: isoDate(q.timestamp[i]), cierre: close, moneda: q.meta?.currency || "EUR" };
    }
  }
  throw new Error("Yahoo no devuelve un cierre válido");
}

function investingUrl(productName: string) {
  const n = productName.toUpperCase();
  if (n.includes("DESTINO 2030")) return "https://es.investing.com/funds/cabk-destino-2030-pp-historical-data";
  if (n.includes("OPORTUNIDAD")) return "https://es.investing.com/funds/cabk-oportunidad-pp-historical-data";
  return null;
}

async function investingLatest(productName: string) {
  const url = investingUrl(productName);
  if (!url) throw new Error("No hay adaptador Investing configurado para este producto");
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "es-ES,es;q=0.9,en;q=0.8" } });
  if (!r.ok) throw new Error(`Investing HTTP ${r.status}`);
  const text = await r.text();
  // Investing cambia con frecuencia el HTML. Buscamos patrones de fecha/último
  // sin asumir que el HTML concreto permanecerá estable.
  const dateMatches = [...text.matchAll(/(\d{2})[-\/]([A-Za-z]{3}|\d{2})[-\/](\d{4})/g)];
  const euroMatches = [...text.matchAll(/(?:Último|Last|Close)[^0-9]{0,80}([0-9]+[.,][0-9]+)/gi)];
  if (!dateMatches.length || !euroMatches.length) throw new Error("Investing no ha permitido extraer el último valor del histórico");
  const lastDate = dateMatches[dateMatches.length - 1];
  const months: Record<string,string> = { ene:"01",feb:"02",mar:"03",abr:"04",may:"05",jun:"06",jul:"07",ago:"08",sep:"09",oct:"10",nov:"11",dic:"12" };
  const m = months[(lastDate[2] || "").toLowerCase()] || lastDate[2];
  const fecha = `${lastDate[3]}-${String(m).padStart(2,"0")}-${lastDate[1]}`;
  const raw = euroMatches[euroMatches.length - 1][1].replace(/\./g, "").replace(",", ".");
  const cierre = Number(raw);
  if (!Number.isFinite(cierre)) throw new Error("Valor Investing no válido");
  return { fecha, cierre, moneda: "EUR" };
}

async function bankinterLatest(isin: string) {
  const funds: Record<string, { url: string; name: string }> = {
    "ES0133565004": {
      url: "https://bancaonline.bankinter.com/fondos/valores-liquidativos.xhtml?cod=0469&div=001&faces-redirect=true&fromView=buscadorFondos&nombreFondo=Bankinter+Fondo+Inteligente+Rf",
      name: "Bankinter Fondo Inteligente RF"
    },
    "ES0133565012": {
      url: "https://bancaonline.bankinter.com/fondos/valores-liquidativos.xhtml?cod=0470&div=001&faces-redirect=true&fromView=buscadorFondos&nombreFondo=Bankinter+Fondo+Inteligente+Rv",
      name: "Bankinter Fondo Inteligente RV"
    }
  };
  const fund = funds[isin];
  if (!fund) throw new Error("ISIN no configurado para Bankinter");
  const r = await fetch(fund.url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "es-ES,es;q=0.9,en;q=0.8" }
  });
  if (!r.ok) throw new Error("Bankinter histórico HTTP " + r.status);
  const html = await r.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&euro;|&#8364;/gi, "€")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  const monthNumbers: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
    enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
    julio: "07", agosto: "08", septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12"
  };
  const regex = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})[\s\S]{0,100}?([0-9]+(?:[.,][0-9]+)*)\s*€/gi;
  const matches = [...text.matchAll(regex)];
  if (!matches.length) throw new Error("Bankinter no devuelve fechas y valores reconocibles en el histórico de " + fund.name);
  const candidates = matches.map(m => {
    const day = String(m[1]).padStart(2, "0");
    const month = monthNumbers[m[2].toLowerCase()];
    const year = m[3];
    const raw = m[4];
    const cierre = Number(raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw);
    return { fecha: year + "-" + month + "-" + day, cierre };
  }).filter(x => Number.isFinite(x.cierre) && x.cierre > 0 && /^\d{4}-\d{2}-\d{2}$/.test(x.fecha));
  if (!candidates.length) throw new Error("Bankinter no devuelve un valor liquidativo válido para " + fund.name);
  candidates.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return { fecha: candidates[0].fecha, cierre: candidates[0].cierre, moneda: "EUR" };
}
async function caixabankPensionLatest(productName: string) {
  const n = productName.toUpperCase();
  const id = n.includes("OPORTUNIDAD") ? "106" : n.includes("DESTINO 2030") ? "46" : "";
  if (!id) throw new Error("Plan de pensiones CaixaBank no reconocido");
  const url = `https://www4.caixabank.es/aplnr/planes/fichas.index_es.html?PLA_continuar=continuar&PLA_idPla=${id}`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "es-ES,es;q=0.9" } });
  if (!r.ok) throw new Error(`CaixaBank planes HTTP ${r.status}`);
  const html = await r.text();
  const text = html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&euro;|&#8364;/g,"€").replace(/&amp;/g,"&").replace(/\s+/g," ");
  const m = text.match(/Valor de participación al cierre del día\s*\[\s*(\d{2})-(\d{2})-(\d{4})\s*\]\s*:?\s*([0-9]+(?:\.[0-9]{3})*,[0-9]{2,8}|[0-9]+,[0-9]{2,8})\s*€/i);
  if (!m) throw new Error("La ficha oficial de CaixaBank no devolvió el valor liquidativo en formato reconocible");
  const cierre = Number(m[4].replace(/\./g,"").replace(",","."));
  if (!Number.isFinite(cierre)) throw new Error("Valor del plan de pensiones no válido");
  return { fecha: `${m[3]}-${m[2]}-${m[1]}`, cierre, moneda: "EUR" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Falta autorización" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: "Sesión no válida" }, 401);
  const userId = userData.user.id;

  const { data: products, error: pError } = await supabase
    .from("productos")
    .select("id,nombre,isin,ticker,moneda")
    .eq("user_id", userId)
    .eq("activo", true)
    .order("nombre");
  if (pError) return json({ error: pError.message }, 500);

  const detalles: any[] = [];
  let actualizados = 0, discrepancias = 0, sinFuente = 0, errores = 0;

  for (const p of products || []) {
    const { data: links, error: linkError } = await supabase
      .from("productos_fuentes")
      .select("id,prioridad,es_principal,usar_cotizacion,fuente_id,fuentes_valoracion(id,nombre,tipo_fuente,formato,url,activa)")
      .eq("producto_id", p.id)
      .eq("usar_cotizacion", true)
      .order("prioridad", { ascending: true });

    if (linkError || !links?.length) {
      sinFuente++;
      detalles.push({ producto: p.nombre, estado: "sin_fuente" });
      continue;
    }

    let got: any = null;
    let usedLink: any = null;
    let lastError = "";

    for (const link of links) {
      const source = link.fuentes_valoracion;
      if (!source?.activa) continue;
      try {
        const sourceName = String(source.nombre || "").toLowerCase();
        if (/CABK OPORTUNIDAD|CABK DESTINO 2030/i.test(p.nombre)) {
          got = await caixabankPensionLatest(p.nombre);
        } else if (sourceName.includes("yahoo") || sourceName.includes("newton")) {
          if (!p.ticker) throw new Error("Producto sin ticker");
          got = await yahooLatest(p.ticker);
        } else if (sourceName.includes("investing")) {
          got = await investingLatest(p.nombre);
        } else if (sourceName.includes("bankinter")) {
          got = await bankinterLatest(p.isin || "");
        } else {
          throw new Error("Adaptador automático no implementado para esta fuente");
        }
        usedLink = link;
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (!got || !usedLink) {
      errores++;
      detalles.push({ producto: p.nombre, estado: "error", error: lastError || "No se pudo actualizar" });
      continue;
    }

    const source = usedLink.fuentes_valoracion;
    const sourceId = usedLink.fuente_id;
    const date = got.fecha;
    const price = got.cierre;

    // Acciones/ETF y cualquier producto cuya fuente sea una cotización se
    // guardan en cotizaciones_historicas. No se modifica ningún registro.
    const { data: existingQuote } = await supabase
      .from("cotizaciones_historicas")
      .select("id,cierre,fecha")
      .eq("producto_id", p.id)
      .eq("fecha", date)
      .maybeSingle();

    if (!existingQuote) {
      const { error: insQ } = await supabase.from("cotizaciones_historicas").insert({
        producto_id: p.id,
        fecha: date,
        cierre: price,
        moneda: got.moneda || p.moneda || "EUR",
        fuente_id: sourceId,
        tipo_precio: "cierre",
        observaciones: `Actualización automática mediante ${source.nombre}.`
      });
      if (insQ) {
        errores++;
        detalles.push({ producto: p.nombre, estado: "error", error: insQ.message });
        continue;
      }
    } else if (Math.abs(Number(existingQuote.cierre) - price) > 0.0000001) {
      detalles.push({ producto: p.nombre, estado: "discrepancia", manual: existingQuote.cierre, automatico: price, fecha: date });
      discrepancias++;
      continue;
    }

    // Para fondos/planes, la valoración automática se registra aparte y jamás
    // sustituye una valoración manual de la misma fecha.
    const sourceType = String(source.nombre || "").toLowerCase();
    if (sourceType.includes("investing") || sourceType.includes("bankinter")) {
      const { data: manual } = await supabase
        .from("valoraciones_historicas")
        .select("id,precio_unitario,origen")
        .eq("producto_id", p.id)
        .eq("fecha", date)
        .eq("origen", "manual")
        .maybeSingle();

      if (manual && Math.abs(Number(manual.precio_unitario) - price) > 0.0000001) {
        discrepancias++;
        detalles.push({ producto: p.nombre, estado: "discrepancia", manual: manual.precio_unitario, automatico: price, fecha: date });
      }

      const { data: auto } = await supabase
        .from("valoraciones_historicas")
        .select("id")
        .eq("producto_id", p.id)
        .eq("fecha", date)
        .eq("origen", "automatico")
        .maybeSingle();

      if (!auto) {
        const { data: component } = await supabase
          .from("cartera_componentes")
          .select("cantidad")
          .eq("producto_id", p.id)
          .eq("activo", true);
        const quantity = (component || []).reduce((s: number, x: any) => s + Number(x.cantidad || 0), 0);
        const { error: insV } = await supabase.from("valoraciones_historicas").insert({
          user_id: userId,
          producto_id: p.id,
          fecha: date,
          cantidad: quantity || null,
          precio_unitario: price,
          valor_total: quantity ? price * quantity : null,
          moneda: got.moneda || p.moneda || "EUR",
          origen: "automatico",
          fuente: source.nombre,
          observaciones: `Actualización automática mediante ${source.nombre}. Las valoraciones manuales no se sobrescriben.`
        });
        if (insV) {
          errores++;
          detalles.push({ producto: p.nombre, estado: "error", error: insV.message });
          continue;
        }
      }
    }

    await supabase.from("productos_fuentes").update({
      ultima_comprobacion: new Date().toISOString(),
      ultima_respuesta_correcta: new Date().toISOString(),
      ultima_cotizacion: price,
      ultima_fecha_cotizacion: `${date}T00:00:00Z`
    }).eq("id", usedLink.id);

    actualizados++;
    detalles.push({ producto: p.nombre, estado: "actualizado", fecha: date, valor: price, fuente: source.nombre });
  }

  return json({ ok: true, resumen: { actualizados, discrepancias, sin_fuente: sinFuente, errores }, detalles });
});
