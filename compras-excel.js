// ============================================================
//  NUMMEROS by CONTAX — Excel del Registro de Compras (RCV)
//  Arma el Excel con la plantilla OFICIAL de Impuestos Nacionales
//  (marca/plantillas/PlantillaRegistroCompras.xlsx): se abre la plantilla,
//  se agregan las filas debajo del título y se descarga. Así se respetan
//  exactamente las 23 columnas, su orden y sus formatos (fecha dd/mm/aaaa,
//  importes con 2 decimales) para subirlo de forma masiva al portal del SIN.
//  Lo usan el Panel (app.js) y las pruebas. Necesita JSZip (cdnjs 3.10.1).
// ============================================================
(function (raiz) {
  const PLANTILLA = "marca/plantillas/PlantillaRegistroCompras.xlsx";
  const COLS = "ABCDEFGHIJKLMNOPQRSTUVW".split("");
  // Estilos de la plantilla (xl/styles.xml → cellXfs): 0 general, 1 entero "0;[RED]0",
  // 2 texto "@", 3 número "0", 4 fecha dd/mm/yyyy, 5 importe "0.00;[RED]0.00"
  const EST = { A: 1, B: 1, C: 0, D: 2, E: 3, F: 0, G: 0, H: 4, I: 5, J: 5, K: 5, L: 5, M: 5, N: 5, O: 5, P: 5, Q: 5, R: 5, S: 5, T: 5, U: 5, V: 1, W: 0 };

  // "1.234,50" / "1,234.50" / "1234.5" / 1234.5 → 1234.5
  function num(v) {
    if (typeof v === "number") return isFinite(v) ? v : 0;
    let s = String(v == null ? "" : v).replace(/[^\d.,-]/g, "");
    if (!s) return 0;
    const c = s.lastIndexOf(","), p = s.lastIndexOf(".");
    if (c > p) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }
  const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const dig = v => String(v == null ? "" : v).replace(/\D/g, "");
  // "dd/mm/aaaa", "d/m/aa" o "aaaa-mm-dd" → {d,m,a} o null
  function fecha(v) {
    const s = String(v == null ? "" : v).trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return valida(+m[3], +m[2], +m[1]);
    m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
    if (m) return valida(+m[1], +m[2], m[3].length === 2 ? 2000 + +m[3] : +m[3]);
    return null;
  }
  function valida(d, m, a) {
    const f = new Date(Date.UTC(a, m - 1, d));
    return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d ? { d, m, a } : null;
  }
  const fechaTxt = f => f ? String(f.d).padStart(2, "0") + "/" + String(f.m).padStart(2, "0") + "/" + f.a : "";
  // Número de serie de Excel (días desde el 30/12/1899)
  const serial = f => Math.round((Date.UTC(f.a, f.m - 1, f.d) - Date.UTC(1899, 11, 30)) / 86400000);

  // Cálculo del RCV (Registro de Compras):
  // SUBTOTAL = TOTAL − ICE − IEHD − IPJ − TASAS − NO SUJETO A CF − EXENTOS − TASA CERO
  // BASE CF  = SUBTOTAL − DESCUENTOS − GIFT CARD ;  CRÉDITO FISCAL = BASE × 13 %
  function calcular(d) {
    d = d || {};
    const x = {
      total: num(d.importeTotal), ice: num(d.ice), iehd: num(d.iehd), ipj: num(d.ipj), tasas: num(d.tasas),
      noSujeto: num(d.otroNoSujeto), exentos: num(d.exentos), tasaCero: num(d.tasaCero),
      descuentos: num(d.descuentos), giftCard: num(d.giftCard)
    };
    x.subtotal = r2(x.total - x.ice - x.iehd - x.ipj - x.tasas - x.noSujeto - x.exentos - x.tasaCero);
    x.base = r2(x.subtotal - x.descuentos - x.giftCard);
    x.cf = r2(x.base * 0.13);
    return x;
  }

  // Revisa una fila: devuelve { faltan: [...], avisos: [...] }
  function revisar(d, ctx) {
    d = d || {}; ctx = ctx || {};
    const faltan = [], avisos = [];
    if (!dig(d.nitProveedor)) faltan.push("NIT del proveedor");
    if (!String(d.razonSocial || "").trim()) faltan.push("razón social");
    if (!String(d.codigoAutorizacion || "").trim()) faltan.push("código de autorización");
    if (!dig(d.numeroFactura)) faltan.push("N.º de factura");
    const f = fecha(d.fecha);
    if (!f) faltan.push("fecha (dd/mm/aaaa)");
    const c = calcular(d);
    if (!(c.total > 0)) faltan.push("importe total");
    if (c.base < 0) avisos.push("la base para crédito fiscal sale negativa");
    if (f && ctx.periodo) { const p = String(f.a) + "-" + String(f.m).padStart(2, "0"); if (p !== ctx.periodo) avisos.push("la fecha es de otro mes (" + String(f.m).padStart(2, "0") + "/" + f.a + ")"); }
    if (ctx.nitCliente && dig(d.nitComprador) && dig(d.nitComprador) !== dig(ctx.nitCliente)) avisos.push("la factura está a nombre de otro NIT (" + dig(d.nitComprador) + ")");
    if (num(d.baseFactura) > 0 && Math.abs(num(d.baseFactura) - c.base) > 0.05) avisos.push("la base calculada (" + c.base.toFixed(2) + ") no coincide con la de la factura (" + num(d.baseFactura).toFixed(2) + ")");
    return { faltan, avisos };
  }

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const cN = (ref, v) => `<c r="${ref}" s="${EST[ref.replace(/\d+/, "")]}"><v>${v}</v></c>`;
  const cT = (ref, v) => `<c r="${ref}" s="${EST[ref.replace(/\d+/, "")]}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;

  // Filas (en orden) → XML de las filas, desde la fila 2
  function filasXML(filas) {
    return filas.map((d, i) => {
      const n = i + 2, c = calcular(d), f = fecha(d.fecha);
      const aut = String(d.codigoAutorizacion || "").replace(/\s+/g, "").toUpperCase();
      const ctl = String(d.codigoControl || "").replace(/\s+/g, "").toUpperCase();
      const nitP = dig(d.nitProveedor), nro = dig(d.numeroFactura);
      const celdas = [
        cN("A" + n, i + 1),                                    // Nº
        cN("B" + n, 1),                                        // ESPECIFICACION (1 = compras)
        nitP.length <= 15 ? cN("C" + n, nitP || 0) : cT("C" + n, nitP),
        cT("D" + n, String(d.razonSocial || "").trim().toUpperCase()),
        /^\d{1,15}$/.test(aut) ? cN("E" + n, aut) : cT("E" + n, aut || "0"),
        nro.length <= 15 ? cN("F" + n, nro || 0) : cT("F" + n, nro),
        cN("G" + n, 0),                                        // NUMERO DUI/DIM
        f ? cN("H" + n, serial(f)) : cT("H" + n, String(d.fecha || "")),
        cN("I" + n, c.total.toFixed(2)), cN("J" + n, c.ice.toFixed(2)), cN("K" + n, c.iehd.toFixed(2)), cN("L" + n, c.ipj.toFixed(2)),
        cN("M" + n, c.tasas.toFixed(2)), cN("N" + n, c.noSujeto.toFixed(2)), cN("O" + n, c.exentos.toFixed(2)), cN("P" + n, c.tasaCero.toFixed(2)),
        cN("Q" + n, c.subtotal.toFixed(2)), cN("R" + n, c.descuentos.toFixed(2)), cN("S" + n, c.giftCard.toFixed(2)),
        cN("T" + n, c.base.toFixed(2)), cN("U" + n, c.cf.toFixed(2)),
        cN("V" + n, Math.max(1, Math.min(5, parseInt(d.tipoCompra, 10) || 1))), // TIPO COMPRA (1 = mercado interno, actividades gravadas)
        ctl && ctl !== "0" ? cT("W" + n, ctl) : cN("W" + n, 0)  // CODIGO DE CONTROL (0 si la factura no tiene)
      ];
      return `<row r="${n}">${celdas.join("")}</row>`;
    }).join("");
  }

  // Abre la plantilla (ArrayBuffer), agrega las filas y devuelve un Blob/Uint8Array del .xlsx
  async function armar(JSZip, plantilla, filas, tipo) {
    const z = await JSZip.loadAsync(plantilla);
    const ruta = "xl/worksheets/sheet1.xml";
    let x = await z.file(ruta).async("string");
    const ultima = filas.length + 1;
    x = x.replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="A1:W${ultima}"/>`)
         .replace("</row></sheetData>", "</row>" + filasXML(filas) + "</sheetData>");
    z.file(ruta, x, { createFolders: false });
    return z.generateAsync({ type: tipo || "blob", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  raiz.ComprasExcel = { PLANTILLA, num, fecha, fechaTxt, calcular, revisar, filasXML, armar, COLS };
  if (typeof module !== "undefined" && module.exports) module.exports = raiz.ComprasExcel;
})(typeof window !== "undefined" ? window : globalThis);
