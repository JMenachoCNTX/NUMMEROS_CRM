// Aviso emergente del Portal del Cliente (v121).
// Lee el documento público avisos/portal de Firebase crm-contax (solo lectura; lo cambia el admin desde
// Panel → Comunicados) y lo muestra como una ventana con la imagen, un botón ✕ y un botón con enlace.
// Si el cliente lo cierra, no vuelve a salir en ese navegador hasta que el admin suba otra imagen (campo version).
(function () {
  var URL_DOC = "https://firestore.googleapis.com/v1/projects/crm-contax/databases/(default)/documents/avisos/portal";
  var CLAVE = "aviso-portal-cerrado";
  var mostrado = false;

  function val(f) {
    if (!f) return "";
    if ("stringValue" in f) return f.stringValue;
    if ("booleanValue" in f) return f.booleanValue;
    if ("integerValue" in f) return Number(f.integerValue);
    if ("doubleValue" in f) return f.doubleValue;
    return "";
  }
  function hoy() { // fecha de Bolivia (UTC-4) como AAAA-MM-DD
    return new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10);
  }
  function linkSeguro(u) { return /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : ""; }

  function pintar(a) {
    if (document.getElementById("avisoPortal")) return;
    var bg = document.createElement("div");
    bg.id = "avisoPortal";
    bg.setAttribute("role", "dialog");
    bg.setAttribute("aria-modal", "true");
    bg.setAttribute("aria-label", "Aviso de CONTAX");
    bg.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(3,10,25,.72);display:flex;align-items:center;justify-content:center;padding:14px;animation:avIn .2s ease-out";
    var st = document.createElement("style");
    st.textContent = "@keyframes avIn{from{opacity:0}to{opacity:1}}" +
      "#avisoPortal .avCaja{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;max-width:min(460px,100%);max-height:100%}" +
      "#avisoPortal img{display:block;max-width:100%;max-height:calc(100dvh - 110px);width:auto;height:auto;object-fit:contain;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.45);background:#fff}" +
      "#avisoPortal .avX{position:absolute;top:-8px;right:-8px;width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:#0A1A3A;color:#fff;font-size:20px;line-height:1;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4)}" +
      "#avisoPortal .avBtn{display:block;width:100%;text-align:center;background:#0A1A3A;color:#fff;border:2px solid #fff;border-radius:12px;padding:13px 16px;font:700 17px 'Century Gothic',CenturyGothic,AppleGothic,sans-serif;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.35)}" +
      "#avisoPortal .avBtn:active{transform:scale(.98)}";
    bg.appendChild(st);
    var caja = document.createElement("div");
    caja.className = "avCaja";
    var img = document.createElement("img");
    img.src = a.img;
    img.alt = a.alt || "Aviso de CONTAX";
    caja.appendChild(img);
    var x = document.createElement("button");
    x.className = "avX"; x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Cerrar aviso");
    caja.appendChild(x);
    var link = linkSeguro(a.link);
    if (link) {
      var b = document.createElement("a");
      b.className = "avBtn"; b.href = link; b.target = "_blank"; b.rel = "noopener";
      b.textContent = a.boton || "Ver más";
      b.onclick = function () { cerrar(); };
      caja.appendChild(b);
    }
    bg.appendChild(caja);
    function cerrar() {
      try { localStorage.setItem(CLAVE, String(a.version)); } catch (e) {}
      document.removeEventListener("keydown", tecla);
      bg.remove();
    }
    function tecla(e) { if (e.key === "Escape") cerrar(); }
    x.onclick = cerrar;
    bg.onclick = function (e) { if (e.target === bg) cerrar(); };
    document.addEventListener("keydown", tecla);
    document.body.appendChild(bg);
    x.focus();
  }

  function mostrar() {
    if (mostrado) return;
    mostrado = true;
    fetch(URL_DOC, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.fields) return;
      var f = d.fields, a = {
        activo: val(f.activo) === true, img: val(f.img), link: val(f.link), boton: val(f.boton), alt: val(f.alt),
        desde: val(f.desde), hasta: val(f.hasta), version: val(f.version)
      };
      if (!a.activo || !/^data:image\/|^https:\/\//.test(a.img) || !a.version) return;
      var h = hoy();
      if (a.desde && h < a.desde) return;
      if (a.hasta && h > a.hasta) return;
      var visto = ""; try { visto = localStorage.getItem(CLAVE) || ""; } catch (e) {}
      if (visto === String(a.version)) return;
      pintar(a);
    }).catch(function () {});
  }

  window.AvisoPortal = { mostrar: mostrar };
})();
