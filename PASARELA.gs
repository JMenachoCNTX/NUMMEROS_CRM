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
  campos: {},
  // Lanzamiento: antes de esta fecha la página de pagos muestra una cuenta regresiva
  lanzamiento: "2026-10-26T10:30:00-04:00",
  // Beneficios de cada plan (se muestran en la pasarela; se editan en el panel)
  beneficios: {
    basico: ["Declaración sin movimiento (IVA e IT) presentada a tiempo", "Consolidación de tu RCV antes del día 9", "Tus formularios en tu Portal de Clientes NUMMEROS"],
    estandar: ["Hasta 100 facturas de compras y ventas al mes", "Control de tu RCV y alertas de vencimiento", "Acceso a tu Portal de Clientes NUMMEROS con tus reportes", "Resumen mensual de tus compras y ventas", "Mes de tu cumpleaños sin cobro"],
    premium: ["De 101 a 200 facturas al mes", "Todo lo del Plan Estándar", "Atención prioritaria", "Revisión de tu NIT, matrícula de comercio y ROE"],
    fact: ["Facturación automática semanal (repartidores Yango)", "Tu factura lista antes del jueves", "Historial de tus facturas en tu Portal de Clientes NUMMEROS"]
  },
  // Premios: "fijo" = para todos los que pagan ese servicio/balance; "azar" = N ganadores entre los próximos M pagos
  premios: [
    { id: "p7", nombre: "10% de devolución", descripcion: "Te devolvemos el 10% de tu pago por QR.", servicio: "eeff", fase: 4, tipo: "azar", ganadores: 1, entre: 30 },
    { id: "p8", nombre: "Una declaración mensual gratis", descripcion: "Una de tus declaraciones mensuales sin costo.", servicio: "eeff", fase: 4, tipo: "azar", ganadores: 1, entre: 30 },
    { id: "p9", nombre: "20% de devolución", descripcion: "Te devolvemos el 20% de tu pago por QR.", servicio: "eeff", fase: 5, tipo: "azar", ganadores: 1, entre: 30 },
    { id: "p10", nombre: "Un año de declaraciones gratis", descripcion: "12 declaraciones mensuales sin costo.", servicio: "eeff", fase: 5, tipo: "azar", ganadores: 1, entre: 30 }
  ]
};
// Nombres y contenido por defecto de cada balance (fase). El admin los puede cambiar en el panel.
var BAL_INCLUYE = ["Balance General", "Estado de Resultados", "Balance de Comprobación de Sumas y Saldos", "Estado de Evolución y Cambios en el Patrimonio", "Estado de Flujo de Efectivo", "Cuadro de Activos Fijos", "Notas a los Estados Financieros", "Declaración Formulario 500 (IUE)", "Declaración Formulario 605 (Envío de EEFF al SIN)", "Envío de Estados Financieros en digital (PDF)", "Firma digital de los Estados Financieros (certificada por DigiCert)", "Descarga y visualización desde nuestro Portal de Clientes cuando lo necesites, sin costo, una vez culminados", "Notificación al momento en que culminemos tus estados financieros (si agregas nuestro Portal de Clientes como app de inicio, cuando lo lancemos)"];
var BAL_EXTRAS = [[], [], ["Libro Mayor"], ["Libro Mayor", "Libro Diario"], ["Libro Mayor", "Libro Diario", "Atención prioritaria", "Reunión virtual para explicarte tus resultados"]];
function balIncluyeDef_(i) { return (i === 0 ? ["Solo para NIT abiertos en octubre, noviembre o diciembre de 2026"] : []).concat(BAL_INCLUYE, BAL_EXTRAS[i] || []); }
var PAS_BAL_DEF = [
  { nombre: "Balance ¡Nuevos!", nitDesde: "2026-10-01", incluye: balIncluyeDef_(0) },
  { nombre: "Balance Esencial", incluye: balIncluyeDef_(1) },
  { nombre: "Balance Plus", incluye: balIncluyeDef_(2) },
  { nombre: "Balance Pro", incluye: balIncluyeDef_(3) },
  { nombre: "Balance Total", incluye: balIncluyeDef_(4) }
];
// Si lo guardado es un texto antiguo (con "beneficios CONTAX", etc.) o la lista básica sin extras, se usa la lista vigente
function balIncluyeViejo_(l) {
  if (!l || !l.length) return true;
  if (l.some(function (x) { return /beneficios CONTAX|^Libro Diario y Libro Mayor$|Reunión para explicarte tu resultado|Atención prioritaria en la entrega|Los 7 estados financieros con firma/i.test(x); })) return true;
  var j = JSON.stringify(l); return j === JSON.stringify(BAL_INCLUYE) || j === JSON.stringify(["Solo para NIT abiertos en octubre, noviembre o diciembre de 2026"].concat(BAL_INCLUYE));
}
function pasBalInfo_(c, i) {
  var x = (c.cupos || [])[i] || {}, d = PAS_BAL_DEF[i] || {};
  return { nombre: x.nombre || d.nombre || ("Balance " + (i + 1)), incluye: !balIncluyeViejo_(x.incluye) ? x.incluye : (d.incluye || []),
           nitDesde: x.nitDesde !== undefined ? x.nitDesde : (d.nitDesde || "") };
}
// Fecha (aaaa-mm-dd) desde los formatos de la Base de Datos
function pasFechaISO_(v) {
  var t = String(v || "").trim(), m;
  if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[1] + "-" + m[2] + "-" + m[3];
  if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
  return "";
}
// ¿Este cliente puede tomar este balance? (el ¡Nuevos! es solo para NIT abiertos desde cierta fecha)
function pasBalAplica_(info, cli) {
  if (!info.nitDesde) return true;
  if (!cli) return false;
  var f = pasFechaISO_(cli.fechaNit);
  return !f || f >= info.nitDesde;   // sin fecha de apertura registrada: se permite, y se verifica en la revisión
}

// ---------------- Términos y condiciones por servicio (resumen del Manual CONTAX) ----------------
// Se muestran antes del QR (el cliente debe aceptarlos) y se envían con el correo de la Orden de Recepción.
var PAS_TERMINOS_VERSION = "2026-10-26";
// Advertencia de balances (se muestra aparte, en rojo, y se acepta con su propia casilla; también va en el correo)
var PAS_ADVERTENCIA_EEFF = [
  "Tus estados financieros se elaboran con la información de tus compras y ventas registradas en el portal de Impuestos Nacionales. Nuestro sistema contable NUMMEROS los genera de forma automática.",
  "Si el resultado muestra utilidad, CONTAX no alterará los resultados ni hará ajustes que no estén de acuerdo a ley para que salga pérdida. Eso es un ilícito tributario (contravención o defraudación fiscal) y nuestra firma no lo hace.",
  "Una vez terminados tus estados financieros, presentaremos la declaración ante Impuestos Nacionales, tengas o no que pagar IUE (25% de la utilidad), aunque el monto sea alto.",
  "Si lo que buscas es que tu balance salga con pérdida teniendo utilidad, por favor no realices el pago y busca otro profesional."
];
var PAS_TERMINOS = {
  declaracion: [
    "Cada pago cubre una sola declaración (un mes). Los meses atrasados se pagan uno por uno, con la tarifa de su plan.",
    "Precio normal: pagando hasta el último día del mes que se declara (también puedes pagarlo por adelantado). Si pagas después de ese mes, se cobra la tarifa de recepción tardía.",
    "No hay hora ni fecha fija de entrega: presentamos tu declaración antes de su vencimiento, que depende del último dígito de tu NIT (del día 13 al 22).",
    "Las facturas manuales deben dejarse a tiempo en nuestro buzón (Av. Alemana, 7mo anillo). Las electrónicas las tomamos del portal de Impuestos Nacionales.",
    "Plan Estándar: hasta 100 facturas al mes. Plan Premium: de 101 a 200. Más de 200 facturas requiere el Plan Personalizado.",
    "Los impuestos que resulten (IVA e IT) los pagas tú directamente. Tus formularios y el QR de pago los encuentras en tu Portal de Clientes NUMMEROS (no se envían por WhatsApp).",
    "Las multas por meses atrasados o por entregar la documentación fuera de tiempo corren por tu cuenta.",
    "CONTAX no se responsabiliza por facturas que no sean válidas para tu actividad registrada."
  ],
  eeff: [
    "El servicio corresponde a los estados financieros de la gestión indicada (un año, o desde la apertura de tu NIT si lo abriste durante la gestión).",
    "Incluye lo detallado en el balance que elegiste: los 7 estados financieros, la declaración de los Formularios 500 (IUE) y 605 (envío de EEFF al SIN), el envío en digital (PDF) con firma digital y su descarga desde tu Portal de Clientes NUMMEROS. Según el balance, además Libro Mayor, Libro Diario, atención prioritaria y reunión virtual.",
    "El precio corresponde al balance habilitado al momento de tu pago. Cuando se llenan sus cupos, el precio pasa al siguiente balance.",
    "Al continuar al pago, tu cupo queda reservado por 30 minutos a ese precio. Si pagas dentro de ese tiempo, se respeta tu precio aunque subas el comprobante después.",
    "Balance ¡Nuevos!: es solo para NIT abiertos en octubre, noviembre o diciembre de 2026. Cada pago queda en revisión hasta que verifiquemos en Impuestos Nacionales la fecha de apertura de tu NIT; si no corresponde, se rechaza la solicitud y te devolvemos tu dinero.",
    "Los premios al azar se asignan automáticamente entre los pagos aprobados de cada balance. CONTAX se comunica con el ganador para la devolución o el beneficio.",
    "Debes entregarnos a tiempo toda la información y documentación que te solicitemos.",
    "El IUE que resulte a pagar lo pagas tú directamente.",
    "Tus estados financieros y formularios se entregan en tu Portal de Clientes NUMMEROS (no se envían por WhatsApp).",
    "Las multas por presentar fuera de plazo debido a documentación entregada tarde corren por tu cuenta."
  ],
  facturacion: [
    "La suscripción cubre la emisión de tus facturas pendientes durante el mes pagado. No incluye la declaración mensual.",
    "Repartidores de Yango: emitimos tu factura semanal por el importe autorizado por la aplicación y la dejamos lista antes del jueves (la verificación cierra el jueves a las 18:00).",
    "Si la aplicación no autoriza tu pago de la semana (por ejemplo, por no cumplir el mínimo de horas), esa semana no se emite factura.",
    "Repartidores de PedidosYa: emitimos aproximadamente dos facturas al mes. Otros clientes: emitimos las facturas que nos solicites.",
    "Debes mantener al día tus datos y tu acceso a Impuestos Nacionales para poder emitir.",
    "Tus facturas emitidas las encuentras en tu Portal de Clientes NUMMEROS (no se envían por WhatsApp)."
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
  if ((a === "pas_reservar" || a === "pas_verificar") && d.servicio === "eeff") {
    var lz = Date.parse(pasCfg().lanzamiento || "");
    if (!isNaN(lz) && Date.now() < lz) return { ok: false, error: "La venta de balances todavía no abrió. Podrás pagar cuando termine la cuenta regresiva." };
  }
  if (a === "pas_reservar") { var rr = pasReservar(d); if (rr.ok) rr.qr = pasQR_(rr.monto); return rr; }
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
    terminos: PAS_TERMINOS, terminosVersion: PAS_TERMINOS_VERSION, advertenciaEeff: PAS_ADVERTENCIA_EEFF,
    beneficios: Object.assign({}, PAS_DEF.beneficios, c.beneficios || {}), lanzamiento: c.lanzamiento || "",
    premios: (c.premios || []).filter(function (p) { return p.activo !== false; }).map(function (p) { return { nombre: p.nombre, descripcion: p.descripcion, servicio: p.servicio, fase: p.fase || 0, plan: p.plan || "", tipo: p.tipo }; })
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
      brinda: cli.brinda, tieneCorreo: !!cli.correo, repartidor: pasEsRepartidor_(cli), aperturaNit: pasFechaISO_(cli.fechaNit),
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
  // Se consulta al BCB una sola vez por día (la primera visita del día); el resto del día se usa ese valor.
  var props = PropertiesService.getScriptProperties(), hoy = pasHoy_().iso;
  var u = null; try { u = JSON.parse(props.getProperty("ufv_ultimo") || "null"); } catch (e) {}
  if (u && u.dia === hoy) return u;
  try {
    var html = UrlFetchApp.fetch("https://www.bcb.gob.bo/", { muteHttpExceptions: true, followRedirects: true }).getContentText();
    var mm = html.match(/Bs\/UFV<\/div>[\s\S]{0,300}?bcb-quote-value">\s*([\d.,]+)/) || html.match(/UFV[\s\S]{0,400}?(\d,\d{5})/);
    if (mm) {
      var v = Number(mm[1].replace(/\./g, "").replace(",", "."));
      if (v > 1 && v < 20) { var r = { valor: v, fecha: pasHoy_().fecha, fuente: "BCB", dia: hoy }; props.setProperty("ufv_ultimo", JSON.stringify(r)); return r; }
    }
  } catch (e) {}
  if (u) { u.fuente = "último valor conocido"; return u; }
  return { valor: 3.36231, fecha: "23/10/2026", fuente: "referencial" };
}
// ---------------- Fases de balance con reserva de cupo ----------------
// Al pasar al QR, el cupo queda RESERVADO 30 minutos a ese precio (nadie más puede tomarlo).
// Si el cliente pagó dentro de esos 30 minutos, se respeta su precio aunque suba el comprobante
// más tarde (por internet, por la IA, etc.): la reserva se guarda 48 horas para eso.
var PAS_RES_MIN = 30, PAS_RES_GRACIA_H = 48;
function pasReservas_(gestion) {
  var props = PropertiesService.getScriptProperties(), all = props.getProperties(), ahora = Date.now(), out = {};
  Object.keys(all).forEach(function (k) {
    if (k.indexOf("res_") !== 0) return;
    var r; try { r = JSON.parse(all[k]); } catch (e) { props.deleteProperty(k); return; }
    if (ahora - r.creado > PAS_RES_GRACIA_H * 3600000) { props.deleteProperty(k); return; }   // limpieza
    if (!gestion || String(r.gestion) === String(gestion)) out[k.slice(4)] = r;
  });
  return out;
}
// Cada balance cuenta en la fase que tiene su mismo precio (config/eeffConteo_<gestión>, que mantienen
// el panel y la pasarela). Se habilita la primera fase con cupos libres: si el admin agrega cupos a una
// fase agotada, esa fase se vuelve a abrir.
function pasConteoEeff_(g) {
  var d = fsGet_("config/eeffConteo_" + g);
  return d && d.porPrecio ? d.porPrecio : null;
}
function pasCupoActual_(c, excluirNit, cli, faseQuiere) {
  var g = String(c.eeffGestion || PAS_DEF.eeffGestion);
  var res = pasReservas_(g), ahora = Date.now(), resPorFase = {}, reservados = 0;
  Object.keys(res).forEach(function (n) { if (n !== excluirNit && res[n].exp > ahora) { reservados++; resPorFase[res[n].precio] = (resPorFase[res[n].precio] || 0) + 1; } });
  var porPrecio = pasConteoEeff_(g), cupos;
  if (porPrecio) {
    cupos = (c.cupos || []).map(function (x, i) {
      var cap = Number(x.capacidad) || 0, pr = Number(x.precio) || 0;
      var ocup = Math.min(cap, (Number(porPrecio[String(Math.round(pr))]) || 0) + (resPorFase[pr] || 0));
      var inf = pasBalInfo_(c, i);
      return { n: i + 1, precio: pr, capacidad: cap, ocupados: ocup, libres: cap - ocup, reservados: resPorFase[pr] || 0, nombre: inf.nombre, incluye: inf.incluye, nitDesde: inf.nitDesde };
    });
  } else {
    // Respaldo (si todavía no existe el conteo): se reparten en orden
    var tomados = fsCount_("recepciones", [["tipo", "EQUAL", "eeff"], ["periodoAnio", "EQUAL", g]]) + reservados, acum = 0;
    cupos = (c.cupos || []).map(function (x, i) {
      var cap = Number(x.capacidad) || 0, desde = acum; acum += cap;
      var ocup = Math.max(0, Math.min(cap, tomados - desde));
      var inf = pasBalInfo_(c, i);
      return { n: i + 1, precio: Number(x.precio) || 0, capacidad: cap, ocupados: ocup, libres: cap - ocup, nombre: inf.nombre, incluye: inf.incluye, nitDesde: inf.nitDesde };
    });
  }
  // Opciones que puede elegir el cliente: el ¡Nuevos! (si le corresponde) y el primer balance general con cupos
  var opciones = [], general = false;
  for (var i = 0; i < cupos.length; i++) {
    if (cupos[i].libres <= 0) continue;
    if (cupos[i].nitDesde) { if (cli !== undefined && pasBalAplica_(cupos[i], cli)) opciones.push(cupos[i]); continue; }   // sin cliente, no se ofrece el ¡Nuevos!
    if (!general) { opciones.push(cupos[i]); general = true; }
  }
  var actual = opciones[0] || null;
  if (faseQuiere) opciones.forEach(function (o) { if (o.n === Number(faseQuiere)) actual = o; });
  return { gestion: g, cupos: cupos, actual: actual, opciones: opciones.map(function (o) { return o.n; }), agotado: !actual, reservados: reservados, reservaMin: PAS_RES_MIN };
}
// Suma 1 balance vendido en el conteo de su precio (al aprobar un pago de la pasarela)
function pasContarEeff_(g, precio) {
  if (!fsGet_("config/eeffConteo_" + g)) return;   // el conteo lo crea el panel con el total correcto
  var doc = "projects/" + PAS.proyecto + "/databases/(default)/documents/config/eeffConteo_" + g;
  var campo = "porPrecio.`" + String(Math.round(Number(precio))) + "`";
  fsReq_(fsBase_() + ":commit", "post", { writes: [{ transform: { document: doc, fieldTransforms: [
    { fieldPath: campo, increment: { integerValue: "1" } }, { fieldPath: "total", increment: { integerValue: "1" } } ] } }] });
}
// Reserva (o recupera) el cupo del cliente. Con candado: dos personas no pueden tomar el último cupo a la vez.
function pasReservar(d) {
  var nit = String(d.nit || "").replace(/\D/g, "");
  var cli = pasClienteCache_(nit);
  if (!cli || !pasPermitido_(cli)) return { ok: false, error: "No podemos procesar tu pago en línea. Escríbenos por WhatsApp." };
  if (d.servicio !== "eeff" || !pasEsRepartidor_(cli)) { var q = pasCotizar(d); return q; }
  var c = pasCfg(), g = String(c.eeffGestion || PAS_DEF.eeffGestion), props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    var ahora = Date.now(), r = pasReservas_(g)[nit];
    if (!(r && r.exp > ahora) || (d.fase && Number(d.fase) !== Number(r.fase))) {
      var e = pasCupoActual_(c, nit, cli, d.fase);
      if (e.agotado) return { ok: false, error: "Se agotaron los cupos de balance de la gestión " + g + ". Escríbenos por WhatsApp." };
      if (d.fase && e.actual.n !== Number(d.fase)) return { ok: false, error: "Ese balance ya no está disponible para ti. Vuelve a elegir tu balance." };
      r = { gestion: g, fase: e.actual.n, precio: e.actual.precio, nombre: e.actual.nombre, creado: ahora, exp: ahora + PAS_RES_MIN * 60000, cliente: cli.nombre || "", nit: nit };
      props.setProperty("res_" + nit, JSON.stringify(r));
    }
    var cot = pasCotEeff_(g, r.precio, r.fase, r.nombre);
    cot.reserva = { fase: r.fase, nombre: r.nombre || "", precio: r.precio, exp: r.exp, quedanSeg: Math.max(0, Math.round((r.exp - ahora) / 1000)) };
    return cot;
  } finally { lock.releaseLock(); }
}
function pasCotEeff_(g, precio, fase, nombre) {
  if (!nombre) { try { nombre = pasBalInfo_(pasCfg(), Number(fase) - 1).nombre; } catch (e) { nombre = "Fase " + fase; } }
  return { ok: true, monto: precio, servicio: "BALANCE", detalle: "BALANCE GENERAL", tipo: "eeff", cupo: fase, balance: nombre,
           periodo: { tipo: "gestion", mes: "", anio: g, texto: "Gestión " + g }, resumen: "Estados financieros gestión " + g + " · " + nombre };
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
    var nitE = String(d.nit || "").replace(/\D/g, ""), gE = String(c.eeffGestion || PAS_DEF.eeffGestion);
    var resE = nitE ? pasReservas_(gE)[nitE] : null;
    if (resE && resE.exp > Date.now() && (!d.fase || Number(d.fase) === Number(resE.fase))) { var cr = pasCotEeff_(gE, resE.precio, resE.fase, resE.nombre); cr.reserva = { fase: resE.fase, nombre: resE.nombre || "", precio: resE.precio, exp: resE.exp, quedanSeg: Math.round((resE.exp - Date.now()) / 1000) }; return cr; }
    var e = pasCupoActual_(c, nitE, nitE ? pasClienteCache_(nitE) : undefined, d.fase);
    if (e.agotado) return { ok: false, error: "Se agotaron los cupos de balance de la gestión " + e.gestion + ". Escríbenos por WhatsApp." };
    return pasCotEeff_(e.gestion, e.actual.precio, e.actual.n, e.actual.nombre);
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
  if (cot.tipo === "eeff" && d.aceptaUtilidad !== true) return { ok: false, error: "Debes aceptar la advertencia sobre la utilidad de tus estados financieros." };
  var img = String(d.imagen || "");
  if (img.indexOf("data:") !== 0) return { ok: false, error: "Sube la imagen del comprobante." };
  if (img.length > 3500000) return { ok: false, error: "La imagen es muy pesada. Toma una captura más pequeña." };
  // Si el cliente sube el comprobante con la reserva vigente, se le dan 15 minutos más para terminar
  if (cot.tipo === "eeff") {
    try {
      var nitR = String(d.nit || "").replace(/\D/g, ""), pR = PropertiesService.getScriptProperties(), rr = pR.getProperty("res_" + nitR);
      if (rr) { rr = JSON.parse(rr); if (rr.exp > Date.now() && rr.exp < Date.now() + 15 * 60000) { rr.exp = Date.now() + 15 * 60000; pR.setProperty("res_" + nitR, JSON.stringify(rr)); } }
    } catch (e) {}
  }
  var lect = pasLeerComprobante_(img);
  var c = pasCfg(), checks = [], motivos = [];
  var x = lect.data || {};
  // Balances: si el cliente tenía su cupo reservado y pagó dentro de la reserva, vale el precio reservado
  if (cot.tipo === "eeff" && !lect.error) {
    var gV = String(c.eeffGestion || PAS_DEF.eeffGestion), resV = pasReservas_(gV)[String(d.nit || "").replace(/\D/g, "")];
    if (resV) {
      var tPago = pasMomentoPago_(x.fecha, x.hora);
      var dentro = tPago ? tPago <= resV.exp + 10 * 60000 : (Date.now() - resV.creado < 24 * 3600000);
      if (dentro && Math.abs(pasNum_(x.importe) - resV.precio) < 0.01) { cot = pasCotEeff_(gV, resV.precio, resV.fase, resV.nombre); cot.reservaRespetada = true; }
    }
  }
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

  var aprobado = motivos.length === 0, revisionNuevos = false;
  if (cot.tipo === "eeff" && cot.cupo) {
    var infN = pasBalInfo_(c, Number(cot.cupo) - 1);
    if (infN.nitDesde) { revisionNuevos = true; aprobado = false; motivos.push("Balance ¡Nuevos!: verificar en Impuestos Nacionales la fecha de apertura del NIT"); }
  }
  var token = Utilities.getUuid();
  pasCachePut_("v_" + token, { nit: String(d.nit).replace(/\D/g, ""), cot: cot, x: x, motivos: motivos, aprobado: aprobado, img: img }, 1800);
  return { ok: true, token: token, aprobado: aprobado, revisionNuevos: revisionNuevos, checks: checks, motivos: motivos, monto: cot.monto, resumen: cot.resumen };
}
// Fecha y hora del comprobante (hora de Bolivia) en milisegundos; null si no se pudo leer la hora
function pasMomentoPago_(fecha, hora) {
  var f = pasFecha_(fecha), h = String(hora || "").match(/(\d{1,2}):(\d{2})/);
  if (!f || !h) return null;
  var t = new Date(f + "T" + ("0" + h[1]).slice(-2) + ":" + h[2] + ":00-04:00").getTime();
  return isNaN(t) ? null : t;
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
  // Rápido: sin "pensamiento" (thinkingBudget 0) y respuesta directa en JSON. Con una clave de pago
  // (facturación activa en Google AI Studio) no hay esperas por límite de uso.
  var contents = [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }];
  var base = String(app.visionModel || "gemini-2.5-flash").trim();
  var modelos = [base, "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"].filter(function (m, i, arr) { return m && arr.indexOf(m) === i; });
  var t0 = Date.now(), intentos = [];
  for (var i = 0; i < modelos.length; i++) {
    var gen = { temperature: 0.1, maxOutputTokens: 400, responseMimeType: "application/json" };
    if (/2\.5/.test(modelos[i])) gen.thinkingConfig = { thinkingBudget: modelos[i].indexOf("pro") >= 0 ? 128 : 0 };
    var body = JSON.stringify({ contents: contents, generationConfig: gen });
    for (var t = 0; t < 2; t++) {
      var r = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelos[i] + ":generateContent?key=" + encodeURIComponent(key),
        { method: "post", contentType: "application/json", payload: body, muteHttpExceptions: true });
      var code = r.getResponseCode();
      intentos.push(modelos[i] + ":" + code);
      if (code === 200) {
        var j = JSON.parse(r.getContentText());
        var txt = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(function (p) { return p.text || ""; }).join("").trim();
        txt = txt.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
        var ms = Date.now() - t0;
        console.log("Comprobante leído con " + modelos[i] + " en " + ms + " ms (" + intentos.join(", ") + ")");
        try { return { data: JSON.parse(txt), ms: ms, modelo: modelos[i] }; } catch (e) { var m = txt.match(/\{[\s\S]*\}/); if (m) { try { return { data: JSON.parse(m[0]), ms: ms, modelo: modelos[i] }; } catch (e2) {} } }
        return { error: "no_interpretado" };
      }
      // Sobrecarga o límite: un reintento corto y luego se pasa al siguiente modelo (sin esperas largas)
      if ((code === 503 || code === 429 || code === 500) && t === 0) { Utilities.sleep(600); continue; }
      break;
    }
  }
  console.warn("IA no disponible: " + intentos.join(", ") + " en " + (Date.now() - t0) + " ms");
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
      tipo: cot.tipo, balanceNombre: cot.balance || "", estado: "pendiente", estadoDeuda: "sin_deuda",
      reciboNro: String(nroCom), reciboEnviado: false,
      registradoPorUid: "", registradoPorNombre: "Pasarela (cliente)", origen: "pasarela",
      terminosAceptados: { servicio: cot.tipo, version: PAS_TERMINOS_VERSION, fecha: hoy.iso + " " + hoy.hora, advertenciaUtilidad: cot.tipo === "eeff" },
      pasarela: { estado: estadoPas, motivos: v.motivos, montoEsperado: cot.monto, montoLeido: pasNum_(x.importe), leido: x, cupo: cot.cupo || "" },
      _upd: Date.now()
    };
    var premios = [];
    if (v.aprobado) { try { premios = pasPremiosGanados_(cot); } catch (e) { console.error(e); } }
    if (premios.length) { rec.premios = premios; rec.premiosEntregado = false; }
    fsCreate_("recepciones", rec);
    if (cot.tipo === "eeff") {
      try { PropertiesService.getScriptProperties().deleteProperty("res_" + v.nit); } catch (e) {}
      if (v.aprobado) { try { pasContarEeff_(cot.periodo.anio, cot.monto); } catch (e) { console.error(e); } }
    }
    if (v.aprobado) { try { pasReactivar_(cli, cot); } catch (e) { console.error(e); } }
    var enviado = false;
    if (v.aprobado && cli.correo) {
      try {
        enviarRecibo({
          action: "recibo", to: cli.correo, nombre: cli.nombre, nit: v.nit, idCliente: cli.codigoId, celular: cli.celular, correo: cli.correo,
          tipoContribuyente: cli.tipo, rubro: cli.brinda, actividad: cli.actP, aperturaNit: cli.fechaNit, matricula: cli.estMat,
          nroRecepcion: nroRec, nroRecibo: nroCom, dia: rec.dia, fecha: hoy.fecha, hora: hoy.hora, mes: cot.periodo.texto,
          tipoServicio: cot.servicio, detalleServicio: cot.detalle, importe: cot.monto, formaPago: "QR", atencion: "PASARELA", comentarios: "",
          terminos: (PAS_TERMINOS[cot.tipo] || []).concat(cot.tipo === "eeff" ? PAS_ADVERTENCIA_EEFF : []),
          premios: premios, terminosTitulo: "Términos y condiciones aceptados (" + cot.servicio + ")",
          empresa: (pasCfgApp().company || "CONTAX - Contabilidad e Impuestos")
        });
        enviado = true;
      } catch (e) {}
    }
    var out = { ok: true, premios: premios, estado: estadoPas, nroRecepcion: nroRec, resumen: cot.resumen, monto: cot.monto, correoEnviado: enviado, correo: pasOcultar_(cli.correo, "mail") };
    pasCachePut_("hecho_" + token, out, 1800);
    return out;
  } finally { lock.releaseLock(); }
}
// ---------------- Premios (fijos y al azar) ----------------
// Azar: para cada premio se sortean de antemano N posiciones ganadoras entre los próximos M pagos que califican.
// Nadie conoce las posiciones; cuando se completan los M pagos, se sortea una nueva ronda.
function pasPremiosGanados_(cot) {
  var c = pasCfg(), props = PropertiesService.getScriptProperties(), out = [];
  (c.premios || []).forEach(function (p) {
    if (p.activo === false) return;
    if (p.servicio && p.servicio !== "todos" && p.servicio !== cot.tipo && !(p.servicio === "decl" && cot.tipo === "declaracion") && !(p.servicio === "fact" && cot.tipo === "facturacion")) return;
    if (p.fase && !(cot.tipo === "eeff" && Number(cot.cupo) === Number(p.fase))) return;
    if (p.plan && p.plan !== cot.plan) return;
    if (p.tipo !== "azar") { out.push({ id: p.id, nombre: p.nombre, descripcion: p.descripcion || "", tipo: "fijo" }); return; }
    var k = "prem_" + p.id, st = null; try { st = JSON.parse(props.getProperty(k) || "null"); } catch (e) {}
    var M = Math.max(1, Number(p.entre) || 1), N = Math.min(M, Math.max(1, Number(p.ganadores) || 1));
    if (!st || st.M !== M || st.N !== N || st.n >= M) {
      var pos = [], nums = []; for (var i = 1; i <= M; i++) nums.push(i);
      for (var j = 0; j < N; j++) pos.push(nums.splice(Math.floor(Math.random() * nums.length), 1)[0]);
      st = { M: M, N: N, n: 0, ronda: (st && st.ronda ? st.ronda + 1 : 1), pos: pos };
    }
    st.n++;
    if (st.pos.indexOf(st.n) >= 0) out.push({ id: p.id, nombre: p.nombre, descripcion: p.descripcion || "", tipo: "azar", ronda: st.ronda });
    props.setProperty(k, JSON.stringify(st));
  });
  return out;
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
    if (d.action === "admin_reservas") { admVerificar_(d.idToken, true); return admReservas_(); }
    var yo = admVerificar_(d.idToken);
    if (d.action === "admin_set_password") return admSetPassword_(yo, d.uid, d.password);
    return { ok: false, error: "accion_desconocida" };
  } catch (e) { console.error(e); return { ok: false, error: String(e && e.message || e) }; }
}
// Reservas de cupo de balance vigentes y recientes (para ver en el panel quién reservó)
function admReservas_() {
  var c = pasCfg(), g = String(c.eeffGestion || PAS_DEF.eeffGestion), res = pasReservas_(g), ahora = Date.now(), out = [];
  Object.keys(res).forEach(function (nit) {
    var r = res[nit], nom = r.cliente;
    if (!nom) { try { var cl = pasClienteCache_(nit); nom = cl ? cl.nombre : ""; } catch (e) {} }
    out.push({ nit: nit, cliente: nom || "", fase: r.fase, nombre: r.nombre || "", precio: r.precio, creado: r.creado, exp: r.exp, vigente: r.exp > ahora });
  });
  out.sort(function (a, b) { return b.creado - a.creado; });
  return { ok: true, gestion: g, reservas: out, ahora: ahora };
}
function admVerificar_(idToken, cualquierRol) {
  if (!idToken) throw new Error("Falta la sesión. Vuelve a iniciar sesión en el panel.");
  var r = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + ADM_API_KEY,
    { method: "post", contentType: "application/json", payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error("Tu sesión venció. Recarga el panel e inténtalo de nuevo.");
  var u = (JSON.parse(r.getContentText()).users || [])[0];
  if (!u) throw new Error("Sesión no válida.");
  var perfil = fsGet_("users/" + u.localId) || {};
  if (perfil.active !== true) throw new Error("Tu usuario no está activo.");
  if (cualquierRol ? ["admin", "supervisor", "editor", "cajero", "lector"].indexOf(perfil.role) < 0 : perfil.role !== "admin") throw new Error(cualquierRol ? "Tu rol no puede ver esto." : "Solo un Admin puede cambiar contraseñas.");
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
