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
    else if (String(d.action || "").indexOf("pas_") === 0) out = pasarelaHandle(d);   // Pasarela de pagos (PASARELA.gs)
    else if (String(d.action || "").indexOf("admin_") === 0) out = adminHandle(d);    // Usuarios del panel (solo Admin)
    else out.error = "accion_desconocida";
  } catch (err) { out.error = String(err); }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// Logos para el correo (PNG publicados en el panel; Gmail no muestra SVG)
var LOGOS = {
  contax:   "https://nummerospanel.contaxbolivia.com/marca/correo/contax-logo.png",
  nummeros: "https://nummerospanel.contaxbolivia.com/marca/correo/nummeros-logo.png"
};

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
  GmailApp.sendEmail(para, asunto, cuerpo, { name: empresaNombre, htmlBody: buildCorreoHTML(d, empresaNombre), attachments: [blob] });
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
    'Sistema de gestión desarrollado por<br><img src="' + LOGOS.nummeros + '" width="120" alt="NUMMEROS" style="display:inline-block;width:120px;height:auto;margin-top:6px;border:0"><br><span style="font-size:10px">NUMMEROS by CONTAX</span>' +
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

  return '' +
  '<!doctype html><html><head><meta charset="utf-8"><style>' +
  '@page{size:A4 landscape;margin:0}' +
  '*{box-sizing:border-box;font-family:Helvetica,Arial,sans-serif;color:#1f2a3a}' +
  'body{margin:0;padding:0}' +
  '.band{background:' + navy + ';color:#fff;text-align:center;padding:26px 0 22px}' +
  '.band .t{font-size:40px;letter-spacing:.22em;font-weight:400}' +
  '.sub{text-align:center;font-size:22px;color:#2b3952;margin:18px 0 6px;font-weight:400}' +
  '.wrap{padding:0 46px}' +
  '.cols{display:table;width:100%;margin-top:10px;border-top:1px solid #dfe3ea;padding-top:14px}' +
  '.col{display:table-cell;width:50%;vertical-align:top;padding:0 14px}' +
  '.col.r{border-left:1px solid #e4e7ee}' +
  '.ch{text-align:center;font-size:16px;color:#2b3952;margin:0 0 10px}' +
  'table.kv{width:100%;border-collapse:collapse}' +
  'table.kv td{padding:3px 4px;font-size:12px;vertical-align:top}' +
  'table.kv td.k{color:#55617a;white-space:nowrap;width:1%;padding-right:12px}' +
  'table.kv td.v{color:#1f2a3a}' +
  '.sdoc{text-align:center;font-size:22px;color:#2b3952;margin:26px 0 8px;font-weight:400}' +
  'table.serv{width:100%;border-collapse:collapse;margin-top:6px}' +
  'table.serv th{border-top:1px solid #cfd4de;border-bottom:1px solid #cfd4de;padding:9px 6px;font-size:12px;color:#2b3952;text-align:left}' +
  'table.serv th.r,table.serv td.r{text-align:right}' +
  'table.serv td{padding:14px 6px;font-size:12px;border-bottom:1px solid #eef0f4}' +
  '.tot{margin-top:16px;text-align:right;font-size:13px;line-height:1.9}' +
  '.tot b{color:#1f2a3a}' +
  '.disc{margin:40px 46px 0;font-size:10.5px;color:#55617a;font-style:italic;text-align:center;line-height:1.6}' +
  '.foot{margin-top:40px;background:' + navy + ';color:#cdd4e2;font-size:10px;padding:9px 46px;display:flex;justify-content:space-between}' +
  '</style></head><body>' +
  '<div class="band"><div class="t">' + esc(empresaNombre) + '</div></div>' +
  '<div class="sub">Orden de Recepción</div>' +
  '<div class="wrap">' +
    '<div class="cols">' +
      '<div class="col"><div class="ch">Datos del Cliente</div><table class="kv">' + cliRows + '</table></div>' +
      '<div class="col r"><div class="ch">Datos de Recepción</div><table class="kv">' + recRows + '</table></div>' +
    '</div>' +
    '<div class="sdoc">Datos del Servicio</div>' +
    '<table class="serv"><tr><th>Mes</th><th>Tipo de Servicio</th><th>Nro Recepción</th><th class="r">Importe</th></tr>' +
      '<tr><td>' + esc(d.mes || "") + '</td><td>' + esc(d.tipoServicio || "") + (d.detalleServicio ? '<br><span style="color:#55617a">' + esc(d.detalleServicio) + '</span>' : '') + '</td><td>' + esc(d.nroRecepcion || "") + '</td><td class="r">' + esc(numero(d.importe)) + '</td></tr>' +
    '</table>' +
    '<div class="tot">' +
      'Total: <b>' + money(d.importe) + '</b><br>' +
      'Forma de Pago: <b>' + esc(d.formaPago || "") + '</b><br>' +
      'Atención: <b>' + esc(d.atencion || "") + '</b>' +
      (d.comentarios ? '<br><span style="color:#55617a;font-size:11px">' + esc(d.comentarios) + '</span>' : '') +
    '</div>' +
  '</div>' +
  '<div class="disc">' + esc(DISCLAIMER) + '</div>' +
  '<div class="foot"><span>' + esc(EMPRESA.direccion) + '</span><span>Contacto: ' + esc(EMPRESA.contacto) + '</span><span>Correo: ' + esc(EMPRESA.correo) + '</span></div>' +
  '</body></html>';
}

function numero(v) { var n = Number(v); return isNaN(n) ? (v || "0") : n.toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function money(v) { var n = Number(v); return "Bs" + (isNaN(n) ? (v || "0") : n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
