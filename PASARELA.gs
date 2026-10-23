/**********************************************************************
 * NUMMEROS by CONTAX — PASARELA DE PAGOS  ·  v1
 * --------------------------------------------------------------------
 * Va en el MISMO proyecto de Apps Script que PUENTE-RECIBOS.gs
 * (cuenta info@contaxbolivia.com). Es el "intermediario seguro" entre
 * la página pública de pagos (pagos.html) y Firebase:
 *   - busca los datos del cliente por NIT (sin abrir la base al público)
 *   - calcula el precio en el servidor (el cliente no puede cambiarlo)
 *   - entrega el QR del monto que corresponde
 *   - lee el comprobante con la IA (la clave nunca sale de aquí)
 *   - valida monto, cuenta destino, fecha y N° de operación no repetido
 *   - registra la recepción en Firebase, guarda el comprobante en Drive
 *     y envía la Orden de Recepción por correo
 *
 * Firebase se usa con el permiso de la cuenta dueña del script (no con
 * las reglas de la web), por eso funciona con el plan gratis (Spark).
 **********************************************************************/

var PAS = {
  proyecto: "crm-contax",
  carpetaDrive: "NUMMEROS Pasarela - Comprobantes",
  diasMaxComprobante: 3
};
var PAS_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
var PAS_DEF = {
  activo: true,
  // Manual CONTAX: Básico 30 (sin movimiento) · Estándar 50 del 25 al 30 / 60 del 1 al 5 (repartidores, hasta 100 facturas)
  // · Premium 95 (101 a 200 facturas, o unipersonales que no son repartidores) · Facturación 20 · Balance otros rubros desde 780
  precios: { sinMov: 30, enFecha: 50, fueraFecha: 60, premium: 95, fact: 20, eeffOtros: 780 },
  diaDesde: 25, diaHasta: 31, diaCierre: 5,
  eeffGestion: String(new Date().getFullYear()),
  cupos: [{ precio: 250, capacidad: 40 }, { precio: 300, capacidad: 30 }, { precio: 380, capacidad: 30 }, { precio: 480, capacidad: 30 }, { precio: 780, capacidad: 500 }],
  destinoClaves: [],
  campos: {}
};

// ---------------- Entrada (la llama doPost de PUENTE-RECIBOS.gs) ----------------
function pasarelaHandle(d) {
  try { return pasarelaHandle_(d); }
  catch (e) {
    console.error(e);
    var t = String(e && e.message || e);
    return { ok: false, error: /429|RESOURCE_EXHAUSTED|quota/i.test(t)
      ? "El sistema está con mucha demanda en este momento. Intenta de nuevo en unos minutos o escríbenos por WhatsApp."
      : "No pudimos procesar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp." };
  }
}
function pasarelaHandle_(d) {
  var a = d.action;
  if (a === "pas_config") return pasConfigPublica();
  if (a === "pas_buscar") return pasBuscar(d.nit);
  if (a === "pas_cotizar") { var r = pasCotizar(d); if (r.ok) r.qr = pasQR_(r.monto); return r; }
  if (a === "pas_verificar") return pasVerificar(d);
  if (a === "pas_confirmar") return pasConfirmar(d.token);
  return { ok: false, error: "accion_desconocida" };
}

// ---------------- Configuración ----------------
function pasCfgApp() {
  var c = pasCache_("cfgapp");
  if (c) return c;
  var app = fsGet_("config/app") || {};
  pasCachePut_("cfgapp", app, 120);
  return app;
}
function pasCfg() {
  var app = pasCfgApp();
  var p = app.pasarela || {};
  var c = JSON.parse(JSON.stringify(PAS_DEF));
  for (var k in p) c[k] = p[k];
  c.precios = Object.assign({}, PAS_DEF.precios, p.precios || {});
  return c;
}
function pasConfigPublica() {
  var c = pasCfg();
  if (!c.activo) return { ok: false, error: "La pasarela está pausada. Escríbenos por WhatsApp." };
  var hoy = pasHoy_();
  return {
    ok: true,
    empresa: "CONTAX - Contabilidad e Impuestos",
    precios: c.precios, diaDesde: c.diaDesde, diaHasta: c.diaHasta, diaCierre: c.diaCierre,
    ventana: pasVentana_(c, hoy),
    periodoDeclDefault: pasPeriodoDeclDefault_(c, hoy),
    periodosDecl: pasPeriodosDecl_(c, hoy),
    eeff: pasCupoActual_(c),
    periodoFact: { anio: hoy.anio, mes: hoy.mes, texto: PAS_MESES[hoy.mes - 1] + " " + hoy.anio }
  };
}

// ---------------- Buscar cliente por NIT ----------------
function pasBuscar(nitRaw) {
  var nit = String(nitRaw || "").replace(/\D/g, "");
  if (nit.length < 5) return { ok: false, error: "Escribe un NIT válido." };
  var cli = pasClienteCache_(nit);
  if (!cli) return { ok: false, error: "No encontramos ese NIT. Revisa el número o escríbenos por WhatsApp para registrarte." };
  return {
    ok: true,
    cliente: {
      nombre: cli.nombre, nit: nit, id: cli.codigoId,
      celular: pasOcultar_(cli.celular, "cel"), correo: pasOcultar_(cli.correo, "mail"),
      brinda: cli.brinda, tieneCorreo: !!cli.correo, repartidor: pasEsRepartidor_(cli),
      diaVence: 13 + Number(nit.slice(-1))
    }
  };
}
function pasClientePorNit_(nit) {
  var c = pasCfg();
  var campos = c.campos || {};
  var hNit = campos.nit || "NIT";
  var docs = fsQuery_("bdclientes", [[hNit, "EQUAL", nit]], 1);
  if (!docs.length) docs = fsQuery_("bdclientes", [[hNit, "EQUAL", Number(nit)]], 1);
  if (!docs.length) return null;
  var r = docs[0].data;
  var v = function (k, def) { var h = campos[k] || def; var x = h ? r[h] : ""; return x == null ? "" : String(x).trim(); };
  return {
    docId: docs[0].id,
    nombre: v("nombre", "NOMBRE") || v("razon", "Nombre o Razón Social"),
    codigoId: v("codigoId", "Codigo de ID"),
    celular: v("celular", "Celular"), correo: v("correo", "Correo Electrónico"),
    tipo: v("tipo", "Tipo de Contribuyente"), brinda: v("brinda", "Brinda Servicios A"),
    actP: v("actP", "Actividad Principal"), fechaNit: v("fechaNit", "Fecha Apertura NIT"),
    estMat: v("estMat", "Estado de La Matricula SEPREC"), estado: v("estado", "Estado Usuario")
  };
}
// Repartidores de cualquier flota de delivery tienen tarifa preferencial (Manual CONTAX)
function pasEsRepartidor_(cli) {
  return /YANGO|PEDIDOS|TADA|DELIVERY|MTG|MILTHAGOR|PARTNER|REPARTID|FLOTA|UBER|INDRIVE/i.test(String((cli && (cli.brinda + " " + cli.actP)) || ""));
}
function pasClienteCache_(nit) {
  var k = "cli_" + nit, c = pasCache_(k);
  if (c) return c;
  var cli = pasClientePorNit_(nit);
  if (cli) pasCachePut_(k, cli, 600);
  return cli;
}
function pasOcultar_(v, tipo) {
  v = String(v || "");
  if (!v) return "";
  if (tipo === "mail") { var p = v.split("@"); return p[0].charAt(0) + "•••••@" + (p[1] || ""); }
  var d = v.replace(/\D/g, ""); return d.slice(0, 4) + " ••••";
}

// ---------------- Precio (siempre calculado aquí) ----------------
function pasHoy_() {
  var tz = "America/La_Paz", n = new Date();
  return { anio: Number(Utilities.formatDate(n, tz, "yyyy")), mes: Number(Utilities.formatDate(n, tz, "M")), dia: Number(Utilities.formatDate(n, tz, "d")),
           fecha: Utilities.formatDate(n, tz, "dd/MM/yyyy"), hora: Utilities.formatDate(n, tz, "H:mm:ss"), iso: Utilities.formatDate(n, tz, "yyyy-MM-dd") };
}
// Mes que toca declarar: desde el día 25 es el mes actual; antes, el mes anterior
function pasPeriodoDeclDefault_(c, hoy) {
  var a = hoy.anio, m = hoy.mes;
  if (hoy.dia < Number(c.diaDesde)) { m -= 1; if (m < 1) { m = 12; a -= 1; } }
  return { anio: a, mes: m, texto: PAS_MESES[m - 1] + " " + a };
}
// Recepción de declaraciones: del 25 a fin de mes (en fecha) · del 1 al 5 (tardía) · del 6 al 24 cerrada
function pasVentana_(c, hoy) {
  if (hoy.dia >= Number(c.diaDesde)) return { abierta: true, tipo: "enFecha" };
  if (hoy.dia <= Number(c.diaCierre)) return { abierta: true, tipo: "tardia" };
  return { abierta: false, tipo: "cerrada", abreDia: Number(c.diaDesde), abreMes: PAS_MESES[hoy.mes - 1] };
}
function pasPeriodosDecl_(c, hoy) {
  var d = pasPeriodoDeclDefault_(c, hoy), out = [], a = d.anio, m = d.mes;
  for (var i = 0; i < 12; i++) { out.push({ anio: a, mes: m, texto: PAS_MESES[m - 1] + " " + a }); m -= 1; if (m < 1) { m = 12; a -= 1; } }
  return out;
}
function pasCupoActual_(c) {
  var g = String(c.eeffGestion || PAS_DEF.eeffGestion);
  var usados = fsCount_("recepciones", [["tipo", "EQUAL", "eeff"], ["periodoAnio", "EQUAL", g]]);
  var acum = 0, cupos = (c.cupos || []).map(function (x, i) {
    var cap = Number(x.capacidad) || 0, desde = acum; acum += cap;
    var ocup = Math.max(0, Math.min(cap, usados - desde));
    return { n: i + 1, precio: Number(x.precio) || 0, capacidad: cap, ocupados: ocup, libres: cap - ocup };
  });
  var actual = null;
  for (var i = 0; i < cupos.length; i++) if (cupos[i].libres > 0) { actual = cupos[i]; break; }
  return { gestion: g, cupos: cupos, actual: actual, agotado: !actual };
}
function pasCotizar(d) {
  var c = pasCfg(), hoy = pasHoy_(), s = d.servicio;
  if (s === "decl") {
    var ven = pasVentana_(c, hoy);
    if (!ven.abierta) return { ok: false, cerrada: true, error: "La recepción de declaraciones está cerrada. Abre el " + ven.abreDia + " de " + ven.abreMes + "." };
    var def = pasPeriodoDeclDefault_(c, hoy);
    var anio = Number(d.anio) || def.anio, mes = Number(d.mes) || def.mes;
    if (anio * 12 + mes > def.anio * 12 + def.mes) return { ok: false, error: "Ese mes todavía no se puede declarar." };
    var texto = PAS_MESES[mes - 1] + " " + anio;
    var cli = d.nit ? pasClienteCache_(String(d.nit).replace(/\D/g, "")) : null;
    var repartidor = cli ? pasEsRepartidor_(cli) : true;
    var tiposFact = { elec: "Facturas ELECTRÓNICAS", man: "Facturas MANUALES", mix: "Facturas MIXTAS (Electrónicas y Manuales)" };
    var plan = d.plan || (d.opcion === "sin" ? "basico" : "estandar");
    var tf = d.tipoFact || (d.opcion !== "sin" ? d.opcion : "");
    var monto, det, planTxt, enFecha = ven.tipo === "enFecha";
    if (plan === "basico") { monto = Number(c.precios.sinMov); det = "DDJJ - Sin Movimiento"; planTxt = "Plan Básico"; }
    else {
      if (!tiposFact[tf]) return { ok: false, error: "Elige qué facturas tuviste." };
      if (plan === "estandar" && !repartidor) plan = "premium"; // las unipersonales que no son repartidores pagan Premium
      if (plan === "estandar") { monto = enFecha ? Number(c.precios.enFecha) : Number(c.precios.fueraFecha); planTxt = "Plan Estándar"; }
      else if (plan === "premium") { monto = Number(c.precios.premium); planTxt = "Plan Premium"; }
      else return { ok: false, error: "Elige un plan." };
      det = "DDJJ - " + tiposFact[tf];
    }
    return { ok: true, monto: monto, enFecha: enFecha, plan: plan, repartidor: repartidor, servicio: "DECLARACIÓN MENSUAL", detalle: det, tipo: "declaracion",
             periodo: { tipo: "mes", mes: mes, anio: String(anio), texto: texto }, resumen: "Declaración " + texto + " · " + planTxt + (plan === "basico" ? " (sin movimiento)" : " · " + det.replace("DDJJ - ", "")) };
  }
  if (s === "eeff") {
    var cliE = d.nit ? pasClienteCache_(String(d.nit).replace(/\D/g, "")) : null;
    if (cliE && !pasEsRepartidor_(cliE)) {
      var gO = String(c.eeffGestion || PAS_DEF.eeffGestion);
      return { ok: true, monto: Number(c.precios.eeffOtros), servicio: "BALANCE", detalle: "BALANCE GENERAL", tipo: "eeff", cupo: "",
               periodo: { tipo: "gestion", mes: "", anio: gO, texto: "Gestión " + gO }, resumen: "Estados financieros gestión " + gO };
    }
    var e = pasCupoActual_(c);
    if (e.agotado) return { ok: false, error: "Se agotaron los cupos de balance de la gestión " + e.gestion + ". Escríbenos por WhatsApp." };
    return { ok: true, monto: e.actual.precio, servicio: "BALANCE", detalle: "BALANCE GENERAL", tipo: "eeff", cupo: e.actual.n,
             periodo: { tipo: "gestion", mes: "", anio: e.gestion, texto: "Gestión " + e.gestion }, resumen: "Estados financieros gestión " + e.gestion + " · Cupo " + e.actual.n };
  }
  if (s === "fact") {
    var t = PAS_MESES[hoy.mes - 1] + " " + hoy.anio;
    return { ok: true, monto: Number(c.precios.fact), servicio: "FACTURACIÓN", detalle: "SUSCRIPCIÓN FACTURACIÓN", tipo: "facturacion",
             periodo: { tipo: "mes", mes: hoy.mes, anio: String(hoy.anio), texto: t }, resumen: "Suscripción de facturación · " + t, qrIncluido: true };
  }
  return { ok: false, error: "Elige un servicio." };
}
function pasQR_(monto) {
  var q = fsGet_("config/pasarelaQR") || {};
  return q["m" + Math.round(Number(monto))] || "";
}

// ---------------- Verificar comprobante con IA ----------------
function pasVerificar(d) {
  var cli = pasClienteCache_(String(d.nit || "").replace(/\D/g, ""));
  if (!cli) return { ok: false, error: "No encontramos tu NIT." };
  var cot = pasCotizar(d);
  if (!cot.ok) return cot;
  var img = String(d.imagen || "");
  if (img.indexOf("data:") !== 0) return { ok: false, error: "Sube la imagen del comprobante." };
  if (img.length > 3500000) return { ok: false, error: "La imagen es muy pesada. Toma una captura más pequeña." };
  var lect = pasLeerComprobante_(img);
  var c = pasCfg(), checks = [], motivos = [];
  var x = lect.data || {};
  if (lect.error) motivos.push("No se pudo leer el comprobante");
  // 1) Monto
  var leido = pasNum_(x.importe);
  var okMonto = !lect.error && Math.abs(leido - cot.monto) < 0.01;
  checks.push({ label: "Monto pagado", valor: leido ? ("Bs " + pasFmt_(leido)) : "No se ve", ok: okMonto, nota: okMonto ? "Coincide" : ("Debía ser Bs " + pasFmt_(cot.monto)) });
  if (!okMonto) motivos.push("Monto no coincide");
  // 2) Cuenta destino
  var claves = (c.destinoClaves || []).filter(function (k) { return String(k).trim(); });
  var textoTodo = JSON.stringify(x).toUpperCase();
  var okDest = !claves.length || claves.some(function (k) { return textoTodo.indexOf(String(k).trim().toUpperCase()) >= 0; });
  checks.push({ label: "Cuenta destino", valor: x.destino || "—", ok: okDest && !lect.error, nota: okDest ? "Correcta" : "No es la cuenta de CONTAX" });
  if (!okDest) motivos.push("Cuenta destino distinta");
  // 3) Fecha
  var f = pasFecha_(x.fecha), hoy = pasHoy_();
  var dias = f ? Math.round((new Date(hoy.iso + "T00:00:00") - new Date(f + "T00:00:00")) / 86400000) : null;
  var okFecha = dias !== null && dias >= -1 && dias <= PAS.diasMaxComprobante;
  checks.push({ label: "Fecha del pago", valor: [x.fecha, x.hora].filter(String).join(" · ") || "No se ve", ok: okFecha, nota: okFecha ? "Reciente" : "Fecha no válida" });
  if (!okFecha) motivos.push("Fecha del comprobante");
  // 4) N° de operación no usado
  var nro = String(x.nroOperacion || "").replace(/\s/g, "");
  var usado = nro ? fsQuery_("recepciones", [["compNroOperacion", "EQUAL", nro]], 1).length > 0 : false;
  var okNro = !!nro && !usado;
  checks.push({ label: "N° de operación", valor: nro || "No se ve", ok: okNro, nota: usado ? "Ya fue usado" : (nro ? "No usado antes" : "Falta") });
  if (!okNro) motivos.push(usado ? "Comprobante ya usado" : "Sin N° de operación");
  // 5) Depositante (informativo)
  checks.push({ label: "Depositante", valor: x.depositante || "—", ok: true, nota: "Informativo" });

  var aprobado = motivos.length === 0;
  var token = Utilities.getUuid();
  pasCachePut_("v_" + token, { nit: String(d.nit).replace(/\D/g, ""), cot: cot, x: x, motivos: motivos, aprobado: aprobado, img: img }, 1800);
  return { ok: true, token: token, aprobado: aprobado, checks: checks, motivos: motivos, monto: cot.monto, resumen: cot.resumen };
}
function pasLeerComprobante_(dataUrl) {
  var app = pasCfgApp();
  var key = String(app.visionKey || app.aiKey || app.geminiKey || "").trim();
  if (!key) return { error: "sin_clave" };
  var mime = (dataUrl.match(/^data:([^;]+);base64,/) || [])[1] || "image/jpeg";
  var b64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
  var prompt = "Eres un asistente contable en Bolivia. La imagen es un comprobante de pago QR o transferencia bancaria. " +
    "Responde ÚNICAMENTE con un JSON válido (sin texto extra, sin ```), con estas claves exactas: " +
    '{"banco":"","importe":"","moneda":"","depositante":"","destino":"","cuentaDestino":"","fecha":"","hora":"","nroOperacion":"","glosa":"","pareceEditado":false}. ' +
    "importe solo el número (ej. 50.00). fecha en formato dd/mm/aaaa. destino = nombre del beneficiario. " +
    "pareceEditado=true si ves señales de que la imagen fue alterada. Si un dato no aparece, cadena vacía.";
  var body = JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 700 } });
  var modelos = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];
  for (var i = 0; i < modelos.length; i++) {
    for (var t = 0; t < 3; t++) {
      var r = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelos[i] + ":generateContent?key=" + encodeURIComponent(key),
        { method: "post", contentType: "application/json", payload: body, muteHttpExceptions: true });
      var code = r.getResponseCode();
      if (code === 200) {
        var j = JSON.parse(r.getContentText());
        var txt = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(function (p) { return p.text || ""; }).join("").trim();
        txt = txt.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
        try { return { data: JSON.parse(txt) }; } catch (e) { var m = txt.match(/\{[\s\S]*\}/); if (m) { try { return { data: JSON.parse(m[0]) }; } catch (e2) {} } }
        return { error: "no_interpretado" };
      }
      if (code === 503 || code === 429 || code === 500) { Utilities.sleep(1500 * (t + 1)); continue; }
      break; // otro modelo
    }
  }
  return { error: "ia_no_disponible" };
}

// ---------------- Confirmar: registrar recepción ----------------
function pasConfirmar(token) {
  var v = pasCache_("v_" + token);
  if (!v) return { ok: false, error: "La verificación venció. Vuelve a subir el comprobante." };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (pasCache_("hecho_" + token)) return pasCache_("hecho_" + token);
    var cli = pasClienteCache_(v.nit);
    if (!cli) return { ok: false, error: "No encontramos tu NIT." };
    var x = v.x || {}, cot = v.cot, hoy = pasHoy_();
    var nro = String(x.nroOperacion || "").replace(/\s/g, "");
    if (v.aprobado && nro && fsQuery_("recepciones", [["compNroOperacion", "EQUAL", nro]], 1).length) { v.aprobado = false; v.motivos = ["Comprobante ya usado"]; }
    var nroRec = fsContador_("nextRecep", 7048);
    var nroCom = fsContador_("nextRecibo", 7784);
    var url = "";
    try { url = pasGuardarDrive_(v.img, v.nit + "_" + hoy.iso + "_" + nroRec); } catch (e) {}
    var estadoPas = v.aprobado ? "aprobado" : "revision";
    var rec = {
      nroRecepcion: nroRec, nroComprobante: nroCom,
      fechaISO: new Date().toISOString(), fecha: hoy.fecha, hora: hoy.hora, dia: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][Number(Utilities.formatDate(new Date(), "America/La_Paz", "u")) % 7],
      clienteId: cli.codigoId, clienteNombre: cli.nombre, nit: v.nit, ultimoDigitoNit: v.nit.slice(-3),
      clienteCelular: cli.celular, clienteCorreo: cli.correo, tipoContribuyente: cli.tipo, rubro: cli.brinda,
      actividad: cli.actP, aperturaNit: cli.fechaNit, matriculaComercio: cli.estMat,
      servicio: cot.servicio, servicioNombre: cot.servicio, detalleServicio: cot.detalle,
      mesRecepcion: cot.periodo.texto, periodoTipo: cot.periodo.tipo, periodoMes: cot.periodo.mes, periodoAnio: cot.periodo.anio,
      anio: cot.periodo.anio, mesPago: PAS_MESES[hoy.mes - 1] + " " + hoy.anio, fechaPago: hoy.iso,
      importe: cot.monto, tipoPago: "QR", atencion: "PASARELA", comentarios: v.aprobado ? "Pago por pasarela (verificado por IA)" : ("Pasarela en revisión: " + v.motivos.join(", ")),
      compBanco: x.banco || "", compNroOperacion: nro, compDepositante: x.depositante || "", compUrl: url,
      tipo: cot.tipo, estado: "pendiente", estadoDeuda: "sin_deuda",
      reciboNro: String(nroCom), reciboEnviado: false,
      registradoPorUid: "", registradoPorNombre: "Pasarela (cliente)", origen: "pasarela",
      pasarela: { estado: estadoPas, motivos: v.motivos, montoEsperado: cot.monto, montoLeido: pasNum_(x.importe), leido: x, cupo: cot.cupo || "" },
      _upd: Date.now()
    };
    fsCreate_("recepciones", rec);
    var enviado = false;
    if (v.aprobado && cli.correo) {
      try {
        enviarRecibo({
          action: "recibo", to: cli.correo, nombre: cli.nombre, nit: v.nit, idCliente: cli.codigoId, celular: cli.celular, correo: cli.correo,
          tipoContribuyente: cli.tipo, rubro: cli.brinda, actividad: cli.actP, aperturaNit: cli.fechaNit, matricula: cli.estMat,
          nroRecepcion: nroRec, nroRecibo: nroCom, dia: rec.dia, fecha: hoy.fecha, hora: hoy.hora, mes: cot.periodo.texto,
          tipoServicio: cot.servicio, detalleServicio: cot.detalle, importe: cot.monto, formaPago: "QR", atencion: "PASARELA", comentarios: "",
          empresa: (pasCfgApp().company || "CONTAX - Contabilidad e Impuestos")
        });
        enviado = true;
      } catch (e) {}
    }
    var out = { ok: true, estado: estadoPas, nroRecepcion: nroRec, resumen: cot.resumen, monto: cot.monto, correoEnviado: enviado, correo: pasOcultar_(cli.correo, "mail") };
    pasCachePut_("hecho_" + token, out, 1800);
    return out;
  } finally { lock.releaseLock(); }
}
function pasGuardarDrive_(dataUrl, nombre) {
  var it = DriveApp.getFoldersByName(PAS.carpetaDrive);
  var carpeta = it.hasNext() ? it.next() : DriveApp.createFolder(PAS.carpetaDrive);
  var mime = (dataUrl.match(/^data:([^;]+);base64,/) || [])[1] || "image/jpeg";
  var blob = Utilities.newBlob(Utilities.base64Decode(dataUrl.replace(/^data:[^;]+;base64,/, "")), mime, nombre + (mime.indexOf("png") >= 0 ? ".png" : ".jpg"));
  return carpeta.createFile(blob).getUrl();
}

// ---------------- Utilidades ----------------
function pasNum_(v) {
  var s = String(v == null ? "" : v).replace(/[^0-9.,-]/g, "");
  if (!s) return 0;
  var c = s.lastIndexOf(","), p = s.lastIndexOf(".");
  if (c > -1 && p > -1) s = c > p ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (c > -1) s = (s.length - c - 1) <= 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  var n = parseFloat(s); return isNaN(n) ? 0 : n;
}
function pasFmt_(n) { return (Math.round(Number(n) * 100) / 100).toFixed(2).replace(".", ","); }
function pasFecha_(t) {
  t = String(t || "").trim();
  var m = t.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/); if (m) return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
  m = t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/); if (m) { var y = m[3].length === 2 ? "20" + m[3] : m[3]; return y + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2); }
  return "";
}
function pasCache_(k) {
  var c = CacheService.getScriptCache(), n = c.get(k + "_n");
  if (!n) { var v = c.get(k); return v ? JSON.parse(v) : null; }
  var keys = []; for (var i = 0; i < Number(n); i++) keys.push(k + "_p" + i);
  var got = c.getAll(keys), s = keys.map(function (x) { return got[x] || ""; }).join("");
  try { return JSON.parse(s); } catch (e) { return null; }
}
function pasCachePut_(k, v, seg) {
  var s = JSON.stringify(v), c = CacheService.getScriptCache();
  if (s.length < 95000) { c.put(k, s, seg); return; }
  // Valores grandes (la imagen del comprobante): se guardan en trozos
  var n = Math.ceil(s.length / 90000), parts = {};
  for (var i = 0; i < n; i++) parts[k + "_p" + i] = s.substr(i * 90000, 90000);
  c.putAll(parts, seg); c.put(k + "_n", String(n), seg);
}

// ---------------- Firestore (REST con el permiso de la cuenta del script) ----------------
function fsBase_() { return "https://firestore.googleapis.com/v1/projects/" + PAS.proyecto + "/databases/(default)/documents"; }
function fsReq_(url, method, payload) {
  var opt = { method: method || "get", muteHttpExceptions: true, contentType: "application/json",
              headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken(), "x-goog-user-project": PAS.proyecto } };
  if (payload) opt.payload = JSON.stringify(payload);
  var r = UrlFetchApp.fetch(url, opt), code = r.getResponseCode();
  if (code === 404) return null;
  if (code >= 300) throw new Error("Firestore " + code + ": " + r.getContentText().slice(0, 300));
  return JSON.parse(r.getContentText() || "{}");
}
function fsGet_(path) { var d = fsReq_(fsBase_() + "/" + path); return d ? fsDec_(d.fields || {}) : null; }
function fsCreate_(coll, obj) { return fsReq_(fsBase_() + "/" + coll, "post", { fields: fsEnc_(obj).mapValue.fields }); }
function fsCampo_(f) { return /^[A-Za-z_][A-Za-z_0-9]*$/.test(f) ? f : "`" + String(f).replace(/`/g, "\\`") + "`"; }
function fsFiltros_(filtros) {
  var fs = filtros.map(function (x) { return { fieldFilter: { field: { fieldPath: fsCampo_(x[0]) }, op: x[1], value: fsEnc_(x[2]) } }; });
  return fs.length === 1 ? fs[0] : { compositeFilter: { op: "AND", filters: fs } };
}
function fsQuery_(coll, filtros, lim) {
  var q = { structuredQuery: { from: [{ collectionId: coll }], where: fsFiltros_(filtros), limit: lim || 10 } };
  var res = fsReq_(fsBase_() + ":runQuery", "post", q) || [];
  return res.filter(function (x) { return x.document; }).map(function (x) { return { id: x.document.name.split("/").pop(), data: fsDec_(x.document.fields || {}) }; });
}
function fsCount_(coll, filtros) {
  var q = { structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: coll }], where: fsFiltros_(filtros) }, aggregations: [{ alias: "n", count: {} }] } };
  var res = fsReq_(fsBase_() + ":runAggregationQuery", "post", q) || [];
  var r = res[0] && res[0].result && res[0].result.aggregateFields && res[0].result.aggregateFields.n;
  return r ? Number(r.integerValue || 0) : 0;
}
// Contador atómico en config/app (igual que la numeración del panel: devuelve el número a usar)
function fsContador_(campo, base) {
  var doc = "projects/" + PAS.proyecto + "/databases/(default)/documents/config/app";
  var r = fsReq_(fsBase_() + ":commit", "post", { writes: [{ transform: { document: doc, fieldTransforms: [{ fieldPath: campo, increment: { integerValue: "1" } }] } }] });
  var v = r.writeResults[0].transformResults[0];
  var nuevo = Number(v.integerValue != null ? v.integerValue : v.doubleValue);
  if (nuevo <= 1) { // el campo no existía: arranca desde la base
    fsReq_(fsBase_() + ":commit", "post", { writes: [{ update: { name: doc, fields: (function () { var f = {}; f[campo] = { integerValue: String(base + 1) }; return f; })() }, updateMask: { fieldPaths: [campo] } }] });
    return base;
  }
  return nuevo - 1;
}
function fsEnc_(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(fsEnc_) } };
  var f = {}; for (var k in v) f[k] = fsEnc_(v[k]);
  return { mapValue: { fields: f } };
}
function fsDec1_(x) {
  if (!x) return null;
  if ("stringValue" in x) return x.stringValue;
  if ("integerValue" in x) return Number(x.integerValue);
  if ("doubleValue" in x) return x.doubleValue;
  if ("booleanValue" in x) return x.booleanValue;
  if ("nullValue" in x) return null;
  if ("timestampValue" in x) return x.timestampValue;
  if ("arrayValue" in x) return (x.arrayValue.values || []).map(fsDec1_);
  if ("mapValue" in x) return fsDec_(x.mapValue.fields || {});
  return null;
}
function fsDec_(fields) { var o = {}; for (var k in fields) o[k] = fsDec1_(fields[k]); return o; }

// Prueba manual desde el editor: ejecuta esta función y revisa el registro
function probarPasarela() {
  Logger.log(JSON.stringify(pasConfigPublica()));
}
