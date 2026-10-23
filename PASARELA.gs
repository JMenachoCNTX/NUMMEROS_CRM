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

// ---------------- Términos y condiciones por servicio (resumen del Manual CONTAX) ----------------
// Se muestran antes del QR (el cliente debe aceptarlos) y se envían con el correo de la Orden de Recepción.
var PAS_TERMINOS_VERSION = "2026-10-23b";
var PAS_TERMINOS = {
  declaracion: [
    "Cada pago cubre una sola declaración (un mes). Los meses atrasados se pagan uno por uno, con la tarifa de su plan.",
    "Precio normal: pagando hasta el último día del mes que se declara (también puedes pagarlo por adelantado). Si pagas después de ese mes, se cobra la tarifa de recepción tardía.",
    "No hay hora ni fecha fija de entrega: presentamos tu declaración antes de su vencimiento, que depende del último dígito de tu NIT (del día 13 al 22).",
    "Las facturas manuales deben dejarse a tiempo en nuestro buzón (Av. Alemana, 7mo anillo). Las electrónicas las tomamos del portal de Impuestos Nacionales.",
    "Plan Estándar: hasta 100 facturas al mes. Plan Premium: de 101 a 200. Más de 200 facturas requiere el Plan Personalizado.",
    "Los impuestos que resulten (IVA e IT) los pagas tú directamente; te enviamos el QR de pago por WhatsApp junto con los formularios.",
    "Las multas por meses atrasados o por entregar la documentación fuera de tiempo corren por tu cuenta.",
    "CONTAX no se responsabiliza por facturas que no sean válidas para tu actividad registrada."
  ],
  eeff: [
    "El servicio corresponde a los estados financieros de la gestión indicada (un año).",
    "Incluye: balance general, estado de resultados, flujo de efectivo, evolución del patrimonio, notas, cuadro de activos fijos y balance de sumas y saldos; presentación del Formulario 500 (IUE) y envío digital con el Formulario 605.",
    "El precio corresponde a la fase habilitada al momento de tu pago; cuando se llenan los cupos de una fase, el precio sube a la siguiente fase.",
    "Debes entregarnos a tiempo toda la información y documentación que te solicitemos.",
    "El IUE que resulte a pagar lo pagas tú directamente.",
    "Las multas por presentar fuera de plazo debido a documentación entregada tarde corren por tu cuenta."
  ],
  facturacion: [
    "La suscripción cubre la emisión de tus facturas pendientes durante el mes pagado. No incluye la declaración mensual.",
    "Repartidores de Yango: emitimos tu factura semanal por el importe autorizado por la aplicación y la dejamos lista antes del jueves (la verificación cierra el jueves a las 18:00).",
    "Si la aplicación no autoriza tu pago de la semana (por ejemplo, por no cumplir el mínimo de horas), esa semana no se emite factura.",
    "Repartidores de PedidosYa: emitimos aproximadamente dos facturas al mes. Otros clientes: emitimos las facturas que nos solicites.",
    "Debes mantener al día tus datos y tu acceso a Impuestos Nacionales para poder emitir."
  ]
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
    ufv: pasUfv_(), multasEeff: { f500: 50, f605: 100 },
    periodoFact: { anio: hoy.anio, mes: hoy.mes, texto: PAS_MESES[hoy.mes - 1] + " " + hoy.anio },
    terminos: PAS_TERMINOS, terminosVersion: PAS_TERMINOS_VERSION
  };
}

// ---------------- Buscar cliente por NIT ----------------
function pasBuscar(nitRaw) {
  var nit = String(nitRaw || "").replace(/\D/g, "");
  if (nit.length < 5) return { ok: false, error: "Escribe un NIT válido." };
  var cli = pasClienteCache_(nit);
  if (cli && !pasPermitido_(cli)) return { ok: false, error: "No podemos procesar tu pago en línea. Escríbenos por WhatsApp para ayudarte." };
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
// Nombres de columnas de la Base de Datos: vienen como "2. NIT", "20. Estado Usuario", etc.
// Se traduce cada encabezado a una clave interna (misma lógica que el panel).
function pasClave_(h) {
  var raw = String(h || "").trim().replace(/^\s*\d+\s*[.\-)]\s*/, "");
  var n = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  if (n.indexOf("estado") >= 0 && n.indexOf("usuario") >= 0) return "estado";
  if (n.indexOf("matricula") >= 0) return "estMat";
  if (n.indexOf("apertura") >= 0 && n.indexOf("nit") >= 0) return "fechaNit";
  if (n.indexOf("correo") >= 0 && n.indexOf("seprec") >= 0) return "";
  if (n.indexOf("correo") >= 0) return "correo";
  if (n.indexOf("tipo") >= 0 && n.indexOf("contribuy") >= 0) return "tipo";
  if (n.indexOf("brinda") >= 0) return "brinda";
  if (n.indexOf("actividad principal") >= 0) return "actP";
  if (n.indexOf("celular") >= 0 || n.indexOf("telefono") >= 0) return "celular";
  if (n.indexOf("codigo") >= 0) return "codigoId";
  if (n.indexOf("razon") >= 0) return "razon";
  if (n === "nombre") return "nombre";
  if (n === "nit") return "nit";
  return "";
}
function pasCamposBD_() {
  var app = pasCfgApp(), campos = {};
  (app.bdHeader || []).forEach(function (h) { var k = pasClave_(h); if (k && !campos[k]) campos[k] = h; });
  var guardados = (app.pasarela && app.pasarela.campos) || {};
  for (var k in guardados) if (!campos[k]) campos[k] = guardados[k];
  var def = { nit: "2. NIT", nombre: "NOMBRE", razon: "3. Nombre o Razón Social", codigoId: "1. Codigo de ID", celular: "Celular", correo: "5. Correo Electrónico",
              tipo: "6. Tipo de Contribuyente", brinda: "9. Brinda Servicios A", actP: "7. Actividad Principal", fechaNit: "10. Fecha Apertura NIT",
              estMat: "14. Estado de La Matricula SEPREC", estado: "20. Estado Usuario" };
  for (var d in def) if (!campos[d]) campos[d] = def[d];
  return campos;
}
function pasClientePorNit_(nit) {
  var campos = pasCamposBD_();
  var docs = [];
  [campos.nit, "2. NIT", "NIT"].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).some(function (h) {
    docs = fsQuery_("bdclientes", [[h, "EQUAL", nit]], 2);
    if (!docs.length && /^\d+$/.test(nit)) docs = fsQuery_("bdclientes", [[h, "EQUAL", Number(nit)]], 2);
    if (docs.length) { campos.nit = h; return true; }
    return false;
  });
  if (!docs.length) return null;
  // Si hay varios con el mismo NIT, se prefiere el que no está de baja
  var elegido = docs.filter(function (d) { return !/inactiv|negra|solicitad|baja/i.test(String(d.data[campos.estado] || "")); })[0] || docs[0];
  var r = elegido.data;
  var v = function (k) { var h = campos[k]; var x = h ? r[h] : ""; x = x == null ? "" : String(x).trim(); return /^(sn|s\/n|-|n\/a)$/i.test(x) ? "" : x; };
  return {
    docId: elegido.id, campoEstado: campos.estado,
    nombre: v("nombre") || v("razon"),
    codigoId: v("codigoId"), celular: v("celular"), correo: /@/.test(v("correo")) ? v("correo") : "",
    tipo: v("tipo"), brinda: v("brinda"), actP: v("actP"), fechaNit: v("fechaNit"), estMat: v("estMat"), estado: v("estado")
  };
}
// Estado del cliente: quiénes pueden pagar por la pasarela
function pasGrupoEstado_(estado) {
  var u = String(estado || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  if (u === "ACTIVO") return "activo";
  if (u.indexOf("LISTA NEGRA") >= 0) return "lista_negra";
  if (u.indexOf("SOLICITAD") >= 0) return "nit_baja";
  if (u.indexOf("SUSCRIP") >= 0 && u.indexOf("INACTIV") >= 0) return "susc_inact";
  if (u.indexOf("SUSCRIP") >= 0 || u.indexOf("FACTURACION") >= 0) return "facturacion";
  if (u.indexOf("INACTIV") >= 0) return "inactivo";
  return u ? "otro" : "activo";
}
function pasPermitido_(cli) { var g = pasGrupoEstado_(cli.estado); return g !== "lista_negra" && g !== "nit_baja"; }
// Repartidores de cualquier flota de delivery tienen tarifa preferencial (Manual CONTAX)
function pasEsRepartidor_(cli) {
  return /YANGO|PEDIDOS|TADA|DELIVERY|MTG|MILTHAGOR|PARTNER|REPARTID|FLOTA|UBER|INDRIVE/i.test(String((cli && (cli.brinda + " " + cli.actP)) || ""));
}
function pasClienteCache_(nit) {
  var k = "cli_" + nit, c = pasCache_(k);
  if (c) return c;
  var cli = pasClientePorNit_(nit);
  if (cli) { cli.nitBuscado = nit; pasCachePut_(k, cli, 600); }
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
// Mes que toca declarar: del 6 a fin de mes es el mes actual (se presenta el mes siguiente);
// del 1 al 5 es el mes anterior (recepción tardía).
function pasPeriodoDeclDefault_(c, hoy) {
  var a = hoy.anio, m = hoy.mes;
  if (hoy.dia <= Number(c.diaCierre || 5)) { m -= 1; if (m < 1) { m = 12; a -= 1; } }
  return { anio: a, mes: m, texto: PAS_MESES[m - 1] + " " + a };
}
// Precio en fecha si se paga hasta el último día del mes que se declara (incluye pagar por adelantado);
// después de ese mes es recepción tardía.
function pasDeclEnFecha_(anio, mes, hoy) { return (hoy.anio * 12 + hoy.mes) <= (Number(anio) * 12 + Number(mes)); }
function pasPeriodoInfo_(anio, mes, hoy) {
  var sig = mes === 12 ? 1 : mes + 1;
  var enF = pasDeclEnFecha_(anio, mes, hoy), adel = enF && hoy.anio === Number(anio) && hoy.mes === Number(mes) && hoy.dia < 25;
  return { anio: anio, mes: mes, texto: PAS_MESES[mes - 1] + " " + anio, enFecha: enF, adelantado: adel,
           seDeclara: PAS_MESES[sig - 1], estado: adel ? "adelantado" : (enF ? "en fecha" : "atrasado") };
}
// Estado de la recepción (solo informativo: ya no bloquea el pago)
function pasVentana_(c, hoy) {
  if (hoy.dia >= Number(c.diaDesde)) return { abierta: true, tipo: "enFecha" };
  if (hoy.dia <= Number(c.diaCierre)) return { abierta: true, tipo: "tardia" };
  return { abierta: true, tipo: "adelantado", abreDia: Number(c.diaDesde), abreMes: PAS_MESES[hoy.mes - 1] };
}
// El mes actual (aunque sea por adelantado) y los 12 meses anteriores
function pasPeriodosDecl_(c, hoy) {
  var out = [], a = hoy.anio, m = hoy.mes;
  for (var i = 0; i < 13; i++) { out.push(pasPeriodoInfo_(a, m, hoy)); m -= 1; if (m < 1) { m = 12; a -= 1; } }
  return out;
}
// ---------------- UFV del día (Banco Central de Bolivia) ----------------
// Se lee de la portada del BCB y se guarda 6 horas; si el BCB no responde se usa el último valor conocido.
function pasUfv_() {
  var cache = CacheService.getScriptCache(), props = PropertiesService.getScriptProperties();
  var c = cache.get("ufv_hoy"); if (c) return JSON.parse(c);
  var r = null;
  try {
    var html = UrlFetchApp.fetch("https://www.bcb.gob.bo/", { muteHttpExceptions: true, followRedirects: true }).getContentText();
    var mm = html.match(/Bs\/UFV<\/div>[\s\S]{0,300}?bcb-quote-value">\s*([\d.,]+)/) || html.match(/UFV[\s\S]{0,400}?(\d,\d{5})/);
    if (mm) {
      var v = Number(mm[1].replace(/\./g, "").replace(",", "."));
      if (v > 1 && v < 20) r = { valor: v, fecha: pasHoy_().fecha, fuente: "BCB" };
    }
  } catch (e) {}
  if (r) { props.setProperty("ufv_ultimo", JSON.stringify(r)); cache.put("ufv_hoy", JSON.stringify(r), 21600); return r; }
  var u = props.getProperty("ufv_ultimo");
  if (u) { r = JSON.parse(u); r.fuente = "último valor conocido"; cache.put("ufv_hoy", JSON.stringify(r), 3600); return r; }
  return { valor: 3.36231, fecha: "23/10/2026", fuente: "referencial" };
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
    var def = pasPeriodoDeclDefault_(c, hoy);
    var anio = Number(d.anio) || def.anio, mes = Number(d.mes) || def.mes;
    if (anio * 12 + mes > hoy.anio * 12 + hoy.mes) return { ok: false, error: "Ese mes todavía no se puede declarar." };
    var texto = PAS_MESES[mes - 1] + " " + anio;
    var cli = d.nit ? pasClienteCache_(String(d.nit).replace(/\D/g, "")) : null;
    var repartidor = cli ? pasEsRepartidor_(cli) : true;
    var tiposFact = { elec: "Facturas ELECTRÓNICAS", man: "Facturas MANUALES", mix: "Facturas MIXTAS (Electrónicas y Manuales)" };
    var plan = d.plan || (d.opcion === "sin" ? "basico" : "estandar");
    var tf = d.tipoFact || (d.opcion !== "sin" ? d.opcion : "");
    var monto, det, planTxt, enFecha = pasDeclEnFecha_(anio, mes, hoy);
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
             periodo: { tipo: "gestion", mes: "", anio: e.gestion, texto: "Gestión " + e.gestion }, resumen: "Estados financieros gestión " + e.gestion + " · Fase " + e.actual.n };
  }
  if (s === "fact") {
    var t = PAS_MESES[hoy.mes - 1] + " " + hoy.anio;
    return { ok: true, monto: Number(c.precios.fact), servicio: "FACTURACIÓN", detalle: "SUSCRIPCIÓN FACTURACIÓN", tipo: "facturacion",
             periodo: { tipo: "mes", mes: hoy.mes, anio: String(hoy.anio), texto: t }, resumen: "Suscripción de facturación · " + t, qrIncluido: true };
  }
  return { ok: false, error: "Elige un servicio." };
}
function pasQR_(monto) {
  var m = Math.round(Number(monto));
  var d = fsGet_("config/qr_m" + m);
  if (d && d.img) return d.img;
  var q = fsGet_("config/pasarelaQR") || {};
  return q["m" + m] || "";
}

// ---------------- Verificar comprobante con IA ----------------
function pasVerificar(d) {
  var cli = pasClienteCache_(String(d.nit || "").replace(/\D/g, ""));
  if (!cli || !pasPermitido_(cli)) return { ok: false, error: "No podemos procesar tu pago en línea. Escríbenos por WhatsApp." };
  var cot = pasCotizar(d);
  if (!cot.ok) return cot;
  if (d.aceptaTerminos !== true) return { ok: false, error: "Debes leer y aceptar los términos y condiciones del servicio." };
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
    if (!cli || !pasPermitido_(cli)) return { ok: false, error: "No podemos procesar tu pago en línea. Escríbenos por WhatsApp." };
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
      terminosAceptados: { servicio: cot.tipo, version: PAS_TERMINOS_VERSION, fecha: hoy.iso + " " + hoy.hora },
      pasarela: { estado: estadoPas, motivos: v.motivos, montoEsperado: cot.monto, montoLeido: pasNum_(x.importe), leido: x, cupo: cot.cupo || "" },
      _upd: Date.now()
    };
    fsCreate_("recepciones", rec);
    if (v.aprobado) { try { pasReactivar_(cli, cot); } catch (e) { console.error(e); } }
    var enviado = false;
    if (v.aprobado && cli.correo) {
      try {
        enviarRecibo({
          action: "recibo", to: cli.correo, nombre: cli.nombre, nit: v.nit, idCliente: cli.codigoId, celular: cli.celular, correo: cli.correo,
          tipoContribuyente: cli.tipo, rubro: cli.brinda, actividad: cli.actP, aperturaNit: cli.fechaNit, matricula: cli.estMat,
          nroRecepcion: nroRec, nroRecibo: nroCom, dia: rec.dia, fecha: hoy.fecha, hora: hoy.hora, mes: cot.periodo.texto,
          tipoServicio: cot.servicio, detalleServicio: cot.detalle, importe: cot.monto, formaPago: "QR", atencion: "PASARELA", comentarios: "",
          terminos: PAS_TERMINOS[cot.tipo] || [], terminosTitulo: "Términos y condiciones aceptados (" + cot.servicio + ")",
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
// Cliente Inactivo que paga y se aprueba → vuelve a ACTIVO, y queda en Movimientos como hecho por la pasarela
function pasReactivar_(cli, cot) {
  var g = pasGrupoEstado_(cli.estado);
  if (g !== "inactivo" && g !== "susc_inact") return;
  var nuevo = (g === "susc_inact" && cot.tipo === "facturacion") ? "SUSCRIPCIÓN FACTURACIÓN" : "ACTIVO";
  var campo = cli.campoEstado || "20. Estado Usuario";
  var f = {}; f[campo] = { stringValue: nuevo }; f._upd = { integerValue: String(Date.now()) };
  fsReq_(fsBase_() + "/bdclientes/" + cli.docId + "?updateMask.fieldPaths=" + encodeURIComponent(fsCampo_(campo)) + "&updateMask.fieldPaths=_upd", "patch", { fields: f });
  fsCreate_("bdlog", { fechaISO: new Date().toISOString(), accion: "cambio_estado", nombre: cli.nombre, estadoAnterior: cli.estado, estadoNuevo: nuevo,
                       porUid: "pasarela", porNombre: "Pasarela de pagos", detalle: "Reactivado al pagar " + cot.resumen });
  CacheService.getScriptCache().remove("cli_" + String(cli.nitBuscado || ""));
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

// =====================================================================
//  ADMINISTRACIÓN DE USUARIOS (desde el panel, solo Admin)
//  El panel envía el "idToken" de quien está conectado; aquí se verifica
//  con Google que sea un usuario Admin activo antes de cambiar nada.
// =====================================================================
var ADM_API_KEY = "AIzaSyBPUgVMi3IQCow6pJiQwaC-WsH_mMf_arI"; // clave web pública de Firebase (la misma de config.js)
function adminHandle(d) {
  try {
    var yo = admVerificar_(d.idToken);
    if (d.action === "admin_set_password") return admSetPassword_(yo, d.uid, d.password);
    return { ok: false, error: "accion_desconocida" };
  } catch (e) { console.error(e); return { ok: false, error: String(e && e.message || e) }; }
}
function admVerificar_(idToken) {
  if (!idToken) throw new Error("Falta la sesión. Vuelve a iniciar sesión en el panel.");
  var r = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + ADM_API_KEY,
    { method: "post", contentType: "application/json", payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error("Tu sesión venció. Recarga el panel e inténtalo de nuevo.");
  var u = (JSON.parse(r.getContentText()).users || [])[0];
  if (!u) throw new Error("Sesión no válida.");
  var perfil = fsGet_("users/" + u.localId) || {};
  if (perfil.role !== "admin" || perfil.active !== true) throw new Error("Solo un Admin puede cambiar contraseñas.");
  return { uid: u.localId, nombre: perfil.name || perfil.email || "" };
}
function admSetPassword_(yo, uid, password) {
  password = String(password || "");
  if (!uid) throw new Error("Falta el usuario.");
  if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
  var r = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/projects/" + PAS.proyecto + "/accounts:update", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken(), "x-goog-user-project": PAS.proyecto },
    payload: JSON.stringify({ localId: uid, password: password })
  });
  if (r.getResponseCode() !== 200) throw new Error("Firebase no aceptó el cambio (" + r.getResponseCode() + "): " + r.getContentText().slice(0, 200));
  // Se anota en la caja privada del Admin (userPins) para poder verla desde el panel
  fsReq_(fsBase_() + "/userPins/" + uid + "?updateMask.fieldPaths=pin&updateMask.fieldPaths=updatedAtMs&updateMask.fieldPaths=updatedBy", "patch",
    { fields: fsEnc_({ pin: password, updatedAtMs: Date.now(), updatedBy: yo.nombre }).mapValue.fields });
  return { ok: true };
}
