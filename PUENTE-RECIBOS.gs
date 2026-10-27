/**********************************************************************
 * NUMMEROS by CONTAX — PUENTE DE RECIBOS (Orden de Recepción)  ·  v3 (correo con diseño y logos)
 * --------------------------------------------------------------------
 * Genera la "Orden de Recepción" en PDF (igual al formato de CONTAX)
 * y la envía al correo del cliente desde la cuenta de Gmail de CONTAX.
 *
 * PUBLICARLO (con la cuenta de Gmail de CONTAX, ej. info@contaxbolivia.com):
 *   1. https://script.google.com  ->  Nuevo proyecto
 *   2. Pega TODO este archivo.  Nómbralo "PUENTE RECIBOS CONTAX".
 *   3. Implementar -> Nueva implementación -> Aplicación web
 *        Ejecutar como: Yo    ·    Acceso: Cualquier usuario
 *   4. Autoriza (Gmail + crear PDF). Copia la URL que termina en /exec.
 *   5. Panel -> Configuración -> "Recibos por correo": pega la URL.
 *
 *   Al cambiar el código, crea una NUEVA implementación (o nueva versión)
 *   para que tome los cambios.
 *
 *   v4: este proyecto también contiene PASARELA.gs (pasarela de pagos) y
 *   el archivo de manifiesto appsscript.json con los permisos necesarios.
 **********************************************************************/

var EMPRESA = {
  nombre:    "CONTAX",
  direccion: "Santa Cruz - Bolivia",
  contacto:  "690-21969",
  correo:    "info@contaxbolivia.com",
  navy:      "#16233f"
};
var DISCLAIMER = "\"CONTAX no asume responsabilidad alguna por declaraciones presentadas fuera de plazo o multas derivadas de la falta de entrega oportuna de documentación por parte del cliente. Tampoco nos responsabilizamos por facturas que no sean válidas para la actividad registrada, o por cualquier otro motivo que pueda afectar el proceso. Es responsabilidad del cliente garantizar la entrega correcta y a tiempo de toda la documentación necesaria.\"";

function doGet(e) {
  // Diagnóstico: ?cuota=1 muestra cuántos correos quedan hoy (no muestra datos de clientes)
  if (e && e.parameter && e.parameter.cuota === "1") {
    var q; try { q = MailApp.getRemainingDailyQuota(); } catch (err) { q = "no disponible: " + err.message; }
    return ContentService.createTextOutput(JSON.stringify({ correosRestantesHoy: q })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("PUENTE DE RECIBOS CONTAX activo. Usa POST para enviar una Orden de Recepción.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var out = { ok: false };
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.action === "recibo") { enviarRecibo(d); out.ok = true; }
    else if (/^(pas_|portal_)/.test(String(d.action || ""))) out = pasarelaHandle(d);   // Pasarela de pagos y Portal del Cliente (PASARELA.gs)
    else if (String(d.action || "").indexOf("admin_") === 0) out = adminHandle(d);    // Usuarios del panel (solo Admin)
    else out.error = "accion_desconocida";
  } catch (err) { out.error = String(err); }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// Logos para el correo (PNG publicados en el panel; Gmail no muestra SVG)
var LOGOS = {
  contax:   "https://nummerospanel.contaxbolivia.com/marca/correo/contax-logo.png",
  nummeros: "https://nummerospanel.contaxbolivia.com/marca/correo/nummeros-firma.png"
};
// Los logos van DENTRO del correo (imágenes incrustadas) y del PDF (data URI): así se ven siempre,
// aunque el correo bloquee imágenes externas. Se leen del repositorio y se guardan 6 horas.
var LOGOS_RAW = "https://raw.githubusercontent.com/JMenachoCNTX/NUMMEROS_CRM/main/marca/correo/";
function logoB64_(archivo) {
  var c = CacheService.getScriptCache(), k = "logo_" + archivo, v = c.get(k);
  if (v) return v;
  try {
    var r = UrlFetchApp.fetch(LOGOS_RAW + archivo, { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return "";
    v = Utilities.base64Encode(r.getBlob().getBytes());
    if (v.length < 95000) c.put(k, v, 21600);
    return v;
  } catch (e) { return ""; }
}
function logoBlob_(archivo, nombre) { var b = logoB64_(archivo); return b ? Utilities.newBlob(Utilities.base64Decode(b), "image/png", nombre) : null; }

function enviarRecibo(d) {
  var para = (d.to || "").trim();
  if (!para) throw new Error("sin_correo");
  var empresaNombre = d.empresa || EMPRESA.nombre;
  var html = buildOrdenHTML(d, empresaNombre);
  var blob = Utilities.newBlob(html, "text/html", "orden.html")
                      .getAs("application/pdf")
                      .setName("Orden-Recepcion-" + (d.nroRecepcion || "CONTAX") + ".pdf");
  var asunto = "Orden de Recepción N° " + (d.nroRecepcion || "") + " — " + empresaNombre;
  // Texto simple (respaldo para correos que no muestran diseño)
  var cuerpo =
      "Estimado/a " + (d.nombre || "cliente") + ",\n\n" +
      "Adjuntamos su Orden de Recepción.\n" +
      "Servicio: " + (d.tipoServicio || "") + (d.detalleServicio ? " — " + d.detalleServicio : "") + "\n" +
      "Mes: " + (d.mes || "") + "   ·   Importe: " + money(d.importe) + "   ·   Forma de pago: " + (d.formaPago || "") + "\n\n" +
      "Gracias por confiar en " + empresaNombre + ".\n\n— " + empresaNombre;
  var inl = {}, bC = logoBlob_("contax-logo.png", "contax.png"), bN = logoBlob_("nummeros-firma.png", "nummeros.png");
  if (bC) inl.logoContax = bC; if (bN) inl.logoNummeros = bN;
  var html = buildCorreoHTML(d, empresaNombre).replace(LOGOS.contax, bC ? "cid:logoContax" : LOGOS.contax).replace(LOGOS.nummeros, bN ? "cid:logoNummeros" : LOGOS.nummeros);
  GmailApp.sendEmail(para, asunto, cuerpo, { name: empresaNombre, htmlBody: html, attachments: [blob], inlineImages: inl });
}

// Correo con diseño: logo CONTAX, resumen del servicio, aviso y pie "Sistema NUMMEROS by CONTAX"
function buildCorreoHTML(d, empresaNombre) {
  var navy = EMPRESA.navy, gris = "#55617a", linea = "#e4e7ee";
  var fila = function (k, v, fuerte) {
    if (!v) return "";
    return '<tr><td style="padding:9px 0;border-bottom:1px solid ' + linea + ';color:' + gris + ';font-size:13px;width:42%">' + esc(k) + '</td>' +
           '<td style="padding:9px 0;border-bottom:1px solid ' + linea + ';color:#1f2a3a;font-size:14px;text-align:right;' + (fuerte ? 'font-weight:700' : '') + '">' + esc(v) + '</td></tr>';
  };
  var servicio = (d.tipoServicio || "") + (d.detalleServicio ? " — " + d.detalleServicio : "");
  return '' +
  '<!doctype html><html><body style="margin:0;padding:0;background:#eef1f5">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f5;padding:24px 10px"><tr><td align="center">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:\'Century Gothic\',Helvetica,Arial,sans-serif">' +
    // Logo
    '<tr><td align="center" style="padding:28px 24px 18px"><img src="' + LOGOS.contax + '" width="210" alt="' + esc(empresaNombre) + '" style="display:block;width:210px;max-width:70%;height:auto;border:0"></td></tr>' +
    // Banda de título
    '<tr><td style="background:' + navy + ';padding:16px 24px;text-align:center">' +
      '<div style="color:#cdd4e2;font-size:11px;letter-spacing:.18em;text-transform:uppercase">Orden de Recepción</div>' +
      '<div style="color:#ffffff;font-size:26px;font-weight:700;margin-top:2px">N° ' + esc(d.nroRecepcion || "") + '</div>' +
    '</td></tr>' +
    // Saludo
    '<tr><td style="padding:24px 28px 6px;color:#1f2a3a;font-size:15px;line-height:1.55">' +
      'Estimado/a <b>' + esc(d.nombre || "cliente") + '</b>,<br>' +
      (/DEUDOR/i.test(d.formaPago || "") ? 'Registramos su solicitud de servicio (pago pendiente).' : 'Recibimos su pago correctamente.') +
      ' Adjuntamos su <b>Orden de Recepción</b> en PDF con el detalle completo.' +
    '</td></tr>' +
    // Resumen
    '<tr><td style="padding:10px 28px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
      fila("Servicio", servicio) +
      fila("Mes / período", d.mes) +
      fila("Fecha", [d.fecha, d.hora].filter(Boolean).join(" · ")) +
      fila("Forma de pago", d.formaPago) +
      fila("Atendido por", d.atencion) +
      fila("Importe", money(d.importe), true) +
    '</table></td></tr>' +
    // Términos y condiciones aceptados (pagos por la pasarela)
    ((d.premios && d.premios.length) ? '<tr><td style="padding:18px 28px 0"><div style="border:2px solid #2E8B57;border-radius:10px;padding:12px 16px;background:#E8F6EE">' +
      '<div style="color:#14532D;font-size:15px;font-weight:700;margin-bottom:4px">¡Ganaste un premio!</div>' +
      d.premios.map(function (p) { return '<div style="color:#14532D;font-size:13px;margin:4px 0"><b>' + esc(p.nombre) + '</b>' + (p.descripcion ? ' — ' + esc(p.descripcion) : '') + '</div>'; }).join("") +
      '<div style="color:#557363;font-size:12px;margin-top:6px">El equipo de CONTAX se comunicará contigo para hacerte la entrega.</div></div></td></tr>' : '') +
    ((d.terminos && d.terminos.length) ? '<tr><td style="padding:18px 28px 0"><div style="border:1px solid ' + linea + ';border-radius:8px;padding:12px 16px">' +
      '<div style="color:#1f2a3a;font-size:13px;font-weight:700;margin-bottom:6px">' + esc(d.terminosTitulo || "Términos y condiciones") + '</div>' +
      '<ul style="margin:0;padding-left:18px;color:' + gris + ';font-size:12px;line-height:1.55">' + d.terminos.map(function (t) { return '<li style="margin:3px 0">' + esc(t) + '</li>'; }).join("") + '</ul></div></td></tr>' : '') +
    // Aviso
    '<tr><td style="padding:18px 28px 6px"><div style="background:#f4f6f9;border-left:3px solid ' + navy + ';border-radius:6px;padding:12px 14px;color:' + gris + ';font-size:11.5px;line-height:1.55;font-style:italic">' + esc(DISCLAIMER) + '</div></td></tr>' +
    // Gracias
    '<tr><td style="padding:16px 28px 22px;color:#1f2a3a;font-size:14px;line-height:1.5">Gracias por confiar en <b>' + esc(empresaNombre) + '</b>.<br><span style="color:' + gris + ';font-size:13px">Si tiene alguna consulta, escríbanos por WhatsApp al ' + esc(EMPRESA.contacto) + '.</span></td></tr>' +
    // Pie CONTAX
    '<tr><td style="background:' + navy + ';padding:14px 24px;color:#cdd4e2;font-size:11px;line-height:1.6;text-align:center">' +
      esc(EMPRESA.direccion) + '<br>Contacto: ' + esc(EMPRESA.contacto) + ' · ' + esc(EMPRESA.correo) +
    '</td></tr>' +
  '</table>' +
  // Firma NUMMEROS
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td align="center" style="padding:16px 10px 6px;font-family:Helvetica,Arial,sans-serif;color:#8a94a6;font-size:11px">' +
    'Sistema de gestión desarrollado por<br><img src="' + LOGOS.nummeros + '" width="170" alt="NUMMEROS by CONTAX" style="display:inline-block;width:170px;height:auto;margin-top:6px;border:0"><br><span style="font-size:10px">NUMMEROS by CONTAX</span>' +
  '</td></tr></table>' +
  '</td></tr></table></body></html>';
}

function buildOrdenHTML(d, empresaNombre) {
  var navy = EMPRESA.navy;
  var cli = [
    ["Nombre del Cliente:", d.nombre],
    ["NIT:", d.nit],
    ["ID Cliente:", d.idCliente],
    ["Celular:", d.celular],
    ["Correo:", d.correo],
    ["Tipo de Contribuyente:", d.tipoContribuyente],
    ["Rubro:", d.rubro],
    ["Actividad:", d.actividad],
    ["Apertura de NIT:", d.aperturaNit],
    ["Matrícula de Comercio:", d.matricula]
  ];
  var rec = [
    ["Nro Recepción", d.nroRecepcion, true],
    ["Nro Recibo:", d.nroRecibo, true],
    ["Día:", d.dia, false],
    ["Fecha:", d.fecha, false],
    ["Hora:", d.hora, false]
  ];
  var cliRows = cli.map(function (x) {
    return '<tr><td class="k">' + esc(x[0]) + '</td><td class="v">' + esc(x[1] || "") + '</td></tr>';
  }).join("");
  var recRows = rec.map(function (x) {
    return '<tr><td class="k">' + esc(x[1 - 1]) + '</td><td class="v" style="' + (x[2] ? "font-weight:700" : "") + '">' + esc(x[1] || "") + '</td></tr>';
  }).join("");

  // Hoja membretada NUMMEROS (el sistema que emite la orden); la empresa emisora es CONTAX
  var verde = "#235347", oscuro = "#0B2B26", salvia = "#8EB69B", menta = "#DAF1DE", tinta = "#163832", suave = "#557363";
  var logoN = logoB64_("nummeros-firma.png"), isoN = logoB64_("nummeros-isotipo-blanco.png");
  return '' +
  '<!doctype html><html><head><meta charset="utf-8"><style>' +
  '@page{size:A4 landscape;margin:0}' +
  '*{box-sizing:border-box;font-family:Helvetica,Arial,sans-serif;color:' + tinta + '}' +
  'body{margin:0;padding:0}' +
  '.franja{height:10px;background:' + verde + '}.franja2{height:3px;background:' + salvia + '}' +
  'table.cab{width:100%;border-collapse:collapse;margin:0}' +
  'table.cab td{padding:20px 46px 14px;vertical-align:middle}' +
  '.lbl{font-size:11px;letter-spacing:.28em;color:' + suave + ';text-transform:uppercase}' +
  '.nro{font-size:34px;font-weight:700;color:' + oscuro + ';margin-top:2px}' +
  '.emisor{font-size:12px;color:' + suave + ';margin-top:4px}' +
  '.wrap{padding:0 46px}' +
  'table.cols{width:100%;border-collapse:collapse;margin-top:6px}' +
  'table.cols td.col{width:50%;vertical-align:top;padding:12px 16px;background:#F4FAF5;border:1px solid ' + menta + '}' +
  '.ch{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:' + verde + ';margin:0 0 8px;border-bottom:2px solid ' + salvia + ';padding-bottom:5px}' +
  'table.kv{width:100%;border-collapse:collapse}' +
  'table.kv td{padding:3px 4px;font-size:12px;vertical-align:top}' +
  'table.kv td.k{color:' + suave + ';white-space:nowrap;width:1%;padding-right:12px}' +
  '.sdoc{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:' + verde + ';margin:20px 0 6px}' +
  'table.serv{width:100%;border-collapse:collapse}' +
  'table.serv th{background:' + verde + ';color:#fff;padding:9px 10px;font-size:11.5px;text-align:left;letter-spacing:.04em}' +
  'table.serv th.r,table.serv td.r{text-align:right}' +
  'table.serv td{padding:13px 10px;font-size:12.5px;border-bottom:1px solid ' + menta + '}' +
  'table.tot{margin:14px 0 0 auto;border-collapse:collapse}' +
  'table.tot td{padding:4px 10px;font-size:13px}table.tot td.k{color:' + suave + ';text-align:right}' +
  'table.tot tr.g td{background:' + menta + ';font-size:15px;font-weight:700;color:' + oscuro + '}' +
  '.disc{margin:24px 46px 0;font-size:10px;color:' + suave + ';font-style:italic;text-align:center;line-height:1.6}' +
  'table.pie{width:100%;border-collapse:collapse;margin-top:26px;background:' + oscuro + '}' +
  'table.pie td{color:' + menta + ';font-size:10px;padding:10px 46px}' +
  '</style></head><body>' +
  '<div class="franja"></div><div class="franja2"></div>' +
  '<table class="cab"><tr>' +
    '<td style="width:50%">' + (logoN ? '<img src="data:image/png;base64,' + logoN + '" style="height:58px;width:auto" alt="NUMMEROS by CONTAX">' : '<span style="font-size:30px;font-weight:700;color:' + verde + '">NUMMEROS</span><br><span style="color:' + suave + '">by CONTAX</span>') + '</td>' +
    '<td style="text-align:right"><div class="lbl">Orden de Recepción</div><div class="nro">N° ' + esc(d.nroRecepcion || "") + '</div><div class="emisor">Emitida por <b>' + esc(empresaNombre) + '</b> · ' + esc(d.fecha || "") + (d.hora ? ' ' + esc(d.hora) : '') + '</div></td>' +
  '</tr></table>' +
  '<div class="wrap">' +
    '<table class="cols"><tr>' +
      '<td class="col"><div class="ch">Datos del cliente</div><table class="kv">' + cliRows + '</table></td>' +
      '<td style="width:14px;background:#fff;border:0"></td>' +
      '<td class="col"><div class="ch">Datos de recepción</div><table class="kv">' + recRows + '</table></td>' +
    '</tr></table>' +
    '<div class="sdoc">Datos del servicio</div>' +
    '<table class="serv"><tr><th>Mes / Período</th><th>Tipo de servicio</th><th>N° Recepción</th><th class="r">Importe</th></tr>' +
      '<tr><td>' + esc(d.mes || "") + '</td><td><b>' + esc(d.tipoServicio || "") + '</b>' + (d.detalleServicio ? '<br><span style="color:' + suave + '">' + esc(d.detalleServicio) + '</span>' : '') + '</td><td>' + esc(d.nroRecepcion || "") + '</td><td class="r">' + esc(numero(d.importe)) + '</td></tr>' +
    '</table>' +
    '<table class="tot">' +
      '<tr class="g"><td class="k" style="color:' + oscuro + '">Total</td><td>' + money(d.importe) + '</td></tr>' +
      '<tr><td class="k">Forma de pago</td><td><b>' + esc(d.formaPago || "") + '</b></td></tr>' +
      '<tr><td class="k">Atención</td><td><b>' + esc(d.atencion || "") + '</b></td></tr>' +
      (d.comentarios ? '<tr><td class="k">Comentarios</td><td style="font-size:11px">' + esc(d.comentarios) + '</td></tr>' : '') +
    '</table>' +
  '</div>' +
  '<div class="disc">' + esc(DISCLAIMER) + '</div>' +
  '<table class="pie"><tr>' +
    '<td>' + (isoN ? '<img src="data:image/png;base64,' + isoN + '" style="height:16px;width:auto;vertical-align:middle;margin-right:8px">' : '') + 'NUMMEROS by CONTAX · Sistema de gestión contable</td>' +
    '<td style="text-align:center">' + esc(EMPRESA.direccion) + ' · Contacto: ' + esc(EMPRESA.contacto) + '</td>' +
    '<td style="text-align:right">' + esc(EMPRESA.correo) + '</td>' +
  '</tr></table>' +
  '</body></html>';
}

function numero(v) { var n = Number(v); return isNaN(n) ? (v || "0") : n.toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function money(v) { var n = Number(v); return "Bs" + (isNaN(n) ? (v || "0") : n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
