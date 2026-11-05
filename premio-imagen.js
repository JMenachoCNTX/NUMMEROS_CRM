/* Imágenes para compartir en el estado de WhatsApp (CONTAX · contador virtual)
   Una por cada beneficio: referido, cumpleaños, premios del balance, cashback y premio por referir.
   Todas llevan el código del cliente y un QR a la pasarela con su código (también es publicidad).
   Uso:  PremioImg.crear({ tipo: "referido", codigo: "CONTAX-245" }).then(blob => PremioImg.compartir(blob, texto))
   Tipos: referido · cumple · premio (con `nombre` del premio) · cashback (con `pct`) · refpremio (con `monto`) */
(function () {
  var BASE = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, "")) || "";
  var QR_LIB = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  var NAVY = "#16233f", FONDO = "#0a1a45", GRIS = "#b9c2d3";
  var FUENTE = '"Century Gothic", Questrial, Helvetica, Arial, sans-serif';

  function cargarScript(src) {
    return new Promise(function (ok, mal) {
      if (window.QRCode) return ok();
      var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function () { mal(new Error("No se pudo cargar el generador de QR.")); };
      document.head.appendChild(s);
    });
  }
  function cargarImg(src) {
    return new Promise(function (ok, mal) { var i = new Image(); i.crossOrigin = "anonymous"; i.onload = function () { ok(i); }; i.onerror = function () { mal(new Error("No se pudo cargar " + src)); }; i.src = src; });
  }
  var fuenteLista = null;
  function cargarFuente() {
    if (fuenteLista) return fuenteLista;
    fuenteLista = (window.FontFace ? new FontFace("Questrial", "url(" + BASE + "marca/fuentes/Questrial-400.woff2)").load().then(function (f) { document.fonts.add(f); }) : Promise.resolve()).catch(function () {});
    return fuenteLista;
  }
  function qrCanvas(texto, lado) {
    var div = document.createElement("div");
    new window.QRCode(div, { text: texto, width: lado, height: lado, colorDark: NAVY, colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M });
    return div.querySelector("canvas");
  }
  function redondo(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function texto(ctx, t, x, y, tam, peso, color, alto, espacio) {
    ctx.font = (peso || 400) + " " + tam + "px " + FUENTE; ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    if ("letterSpacing" in ctx) ctx.letterSpacing = (espacio || 0) + "px";
    String(t).split("\n").forEach(function (l, i) { ctx.fillText(l, x, y + i * (alto || tam * 1.1)); });
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }
  var PLANT = {
    referido: { foto: "celular", kicker: "YO DECLARO CON CONTAX", titulo: "Declara desde\ntu celular", big: "50%", tx: "de descuento en tu declaración\ncon mi código" },
    cumple: { foto: "caminando", kicker: "¡FELIZ CUMPLEAÑOS!", titulo: "Mi regalo\nde CONTAX", big: "Bs 0", tx: "este mes mi declaración\nes sin cobro" },
    dev10: { foto: "brazos", kicker: "PREMIO DE MI BALANCE", titulo: "¡Gané con CONTAX!", big: "10%", tx: "de devolución de mi pago\ndel balance" },
    dev20: { foto: "retrato", kicker: "PREMIO DE MI BALANCE", titulo: "¡Gané con CONTAX!", big: "20%", tx: "de devolución de mi pago\ndel balance" },
    mes: { foto: "sofa", kicker: "PREMIO DE MI BALANCE", titulo: "¡Gané con CONTAX!", big: "1 mes", tx: "de declaración\nsin costo" },
    anio: { foto: "hamaca2", kicker: "PREMIO DE MI BALANCE", titulo: "¡Gané un año\nsin pagar!", big: "12 meses", tx: "de declaraciones\nsin costo" },
    refpremio: { foto: "ventana", kicker: "GRACIAS POR RECOMENDARNOS", titulo: "¡Mi recomendado\nya es cliente!", big: "Bs 50", tx: "para mi billetera CONTAX" },
    cashback: { foto: "piso", kicker: "CASHBACK CONTAX", titulo: "Cada pago\nme devuelve", big: "5%", tx: "en saldo para mis\nbalances" },
    premio: { foto: "brazos", kicker: "PREMIO CONTAX", titulo: "¡Gané con CONTAX!", big: "¡Premio!", tx: "" }
  };
  function plantillaDe(o) {
    var t = o.tipo;
    if (t === "premio") {
      var n = String(o.nombre || "");
      t = /20\s*%/.test(n) ? "dev20" : /10\s*%/.test(n) ? "dev10" : /a[ñn]o/i.test(n) ? "anio" : /declaraci/i.test(n) ? "mes" : "premio";
    }
    var p = Object.assign({}, PLANT[t] || PLANT.referido);
    if (t === "premio") p.tx = String(o.nombre || "");
    if (t === "cashback" && o.pct) p.big = o.pct + "%";
    if (t === "refpremio" && o.monto) p.big = "Bs " + String(o.monto).replace(".", ",");
    return p;
  }
  function crear(o) {
    var p = plantillaDe(o), codigo = String(o.codigo || ""), url = location.origin + location.pathname.replace(/[^/]*$/, "") + "pagos.html" + (codigo ? "?ref=" + encodeURIComponent(codigo) : "");
    return Promise.all([cargarScript(QR_LIB), cargarFuente(), cargarImg(BASE + "marca/contador/" + p.foto + ".jpg"), cargarImg(BASE + "marca/correo/contax-logo.png")]).then(function (r) {
      var foto = r[2], logo = r[3], W = 1080, H = 1920;
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = FONDO; ctx.fillRect(0, 0, W, H);
      // Foto del contador virtual, con los bordes de arriba y abajo difuminados
      var fc = document.createElement("canvas"); fc.width = W; fc.height = 840;
      var fx = fc.getContext("2d"), k = Math.max(W / foto.width, 840 / foto.height), fw = foto.width * k, fh = foto.height * k;
      fx.drawImage(foto, (W - fw) / 2, (840 - fh) * 0.2, fw, fh);
      var g = fx.createLinearGradient(0, 0, 0, 840);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.14, "#000"); g.addColorStop(0.72, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
      fx.globalCompositeOperation = "destination-in"; fx.fillStyle = g; fx.fillRect(0, 0, W, 840);
      ctx.drawImage(fc, 0, 500);
      // Logo en caja blanca
      var lw = 360, lh = logo.height * lw / logo.width;
      ctx.fillStyle = "#fff"; redondo(ctx, (W - lw) / 2 - 50, 80, lw + 100, lh + 52, 30); ctx.fill();
      ctx.drawImage(logo, (W - lw) / 2, 106, lw, lh);
      var yT = 80 + lh + 52;
      texto(ctx, p.kicker, W / 2, yT + 80, 36, 400, GRIS, 0, 5);
      ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 24;
      texto(ctx, p.titulo, W / 2, yT + 170, 84, 700, "#fff", 90);
      ctx.shadowBlur = 0;
      // Tarjeta del premio
      var txL = String(p.tx || "").split("\n").filter(Boolean), cy = 1255, ch = 200 + txL.length * 52;
      ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
      ctx.fillStyle = "#fff"; redondo(ctx, 80, cy, W - 160, ch, 38); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      texto(ctx, p.big, W / 2, cy + 160, p.big.length > 6 ? 110 : 132, 700, NAVY);
      texto(ctx, txL.join("\n"), W / 2, cy + 225, 42, 400, NAVY, 52);
      // Código y QR
      var yp = 1640;
      ctx.fillStyle = "#fff"; redondo(ctx, 80, yp, 222, 222, 20); ctx.fill();
      ctx.drawImage(qrCanvas(url, 190), 96, yp + 16, 190, 190);
      ctx.textAlign = "left"; ctx.font = "400 30px " + FUENTE; ctx.fillStyle = GRIS; ctx.fillText("MI CÓDIGO", 338, yp + 40);
      ctx.font = "700 " + (codigo.length > 11 ? 62 : 72) + "px " + FUENTE; ctx.fillStyle = "#fff"; ctx.fillText(codigo || "CONTAX", 338, yp + 116);
      ctx.font = "400 30px " + FUENTE; ctx.fillStyle = "#d7dce4";
      ctx.fillText("Usa mi código y paga 50% menos", 338, yp + 166); ctx.fillText("WhatsApp " + (o.whatsapp || "690-21969"), 338, yp + 206);
      return new Promise(function (ok) { cv.toBlob(function (b) { ok(b); }, "image/png"); });
    });
  }
  // Comparte la imagen (en el celular abre WhatsApp, Instagram, etc.); si no se puede, la descarga
  function compartir(blob, textoMsj, nombre) {
    var file = new File([blob], nombre || "CONTAX.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: textoMsj || "" }).catch(function () {});
    descargar(blob, nombre);
    return Promise.resolve();
  }
  function descargar(blob, nombre) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre || "CONTAX.png";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function textoReferido(codigo) {
    return "Yo declaro mis impuestos con CONTAX desde el celular. Con mi código " + codigo + " pagas 50% menos en tu primera declaración: " +
      location.origin + location.pathname.replace(/[^/]*$/, "") + "pagos.html?ref=" + encodeURIComponent(codigo);
  }
  window.PremioImg = { crear: crear, compartir: compartir, descargar: descargar, textoReferido: textoReferido };
})();
