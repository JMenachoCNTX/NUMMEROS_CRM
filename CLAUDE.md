# NUMMEROS by CONTAX · Panel de Administración (NUMMEROS_CRM)

## Para qué sirve
Es el **sistema central de CONTAX** y la **fuente de usuarios** de todos los sistemas internos
(Panel, CRM/extensión de WhatsApp, CONTROL y Portal de repartidores). Tiene tres páginas:
- `index.html` + `app.js` — **Panel** del equipo: inicio, bandeja/chats de WhatsApp, clientes y ficha, Base de Datos,
  recepciones (órdenes de recepción y recibos), arqueo, tarifas, calendario, declaraciones, EEFF, facturación,
  trámites, egresos, reportes, pasarela, CONTROL, usuarios, configuración, asistente IA.
- `pagos.html` — **Pasarela de pagos** pública: el cliente busca su NIT, ve el precio, paga por QR y sube el comprobante (lo lee la IA).
  Incluye la venta de balances (Balance Integral / Balance Independiente para no clientes).
- `cliente.html` — **Portal del Cliente**: el cliente activo entra con NIT y C.I. y ve sus datos y documentos.
- `privacy-policy.html` — política de privacidad.

## Para qué empresa
CONTAX (estudio contable, Santa Cruz) con la marca NUMMEROS by CONTAX.

## Cómo está armado (archivos principales)
- `config.js` — datos de Firebase `crm-contax` (públicos por diseño). `pagos-config.js` — URL `/exec` del puente y WhatsApp.
- `PUENTE-RECIBOS.gs` + `PASARELA.gs` + `appsscript.json` — **un solo proyecto de Apps Script** ("PUENTE RECIBOS",
  cuenta info@contaxbolivia.com): envía la Orden de Recepción en PDF por Gmail, atiende la pasarela (`pas_*`),
  el Portal del Cliente (`portal_*`), el Sistema Contable (`sis_*`) y tareas de admin (`admin_*`, incluye los accesos a CONTROL y al Portal de repartidores).
- `firestore-rules-COMPLETO.txt` — **reglas vigentes** del proyecto `crm-contax`.
- `firestore-rules.txt` — reglas viejas del CRM original (no usar; le faltan casi todas las colecciones).
- `README.md`, `GUIA.md`, `LEEME-*.txt` — guías de la primera instalación (CRM "crm-atencion"); en parte desactualizadas.
- `marca/` — logos, fuentes, fotos, imágenes de correo y ejemplos de EEFF.

## Dónde se guardan los datos
- **Firebase `crm-contax`** (Auth + Firestore): `users`, `userPins`, `config` (incluye `config/app` con claves de IA y del Sistema Contable),
  `clientes`, `bdclientes`, `bdlog`, `recepciones`, `tarifas`, `eventos`, `egresos`, `noclientes`, `quickReplies`, `waChats`,
  `contacts`, `reminders`, `activity`, `ctrlLlaves` (solo la usa el script).
- **Google Drive** (cuenta del script): carpetas "NUMMEROS Pasarela - Comprobantes", "NUMMEROS · Balance Independiente" y "NUMMEROS · Portal de clientes".
- **Gmail** de CONTAX para enviar recibos. Algunas funciones viejas usan Google Sheets (BDCONTAX) por puente.
- El script escribe también cuentas en los proyectos `control--nummeros` y `portal-nummeros`.

## Cómo se publica
- GitHub Pages, rama `main`, dominio `nummerospanel.contaxbolivia.com` (archivo `CNAME`). `index.html` redirige http → https.
- **Reglas:** copiar `firestore-rules-COMPLETO.txt` y pegarlo en Firebase → `crm-contax` → Firestore → Reglas → Publicar.
- **Apps Script:** pegar `PUENTE-RECIBOS.gs`, `PASARELA.gs` y `appsscript.json` en el proyecto de script y crear
  **Implementar → Gestionar implementaciones → Nueva versión** (así la URL `/exec` no cambia). Esa misma URL la usan CONTROL y `pagos-config.js`.
- **Versiones:** el commit empieza con "vNN: ..." (hoy v68). Al subir versión se cambia `APP_VERSION` en `app.js` y el
  "vNN" y `?v=NN` en `index.html` (para que el navegador no use la copia vieja). `APP_VERSION` de `config.js` está desactualizado.

## Cuidados importantes
- **El repositorio es PÚBLICO.** Nunca escribir claves de IA, contraseñas ni datos de clientes en los archivos; las claves van en el Panel (Configuración), que las guarda en Firestore.
- Cualquier cambio a `users` o a las reglas afecta también a CONTROL y al Portal de repartidores.
- No pegar `firestore-rules.txt` (el viejo) en la consola: dejaría sin acceso a casi todo el panel.
- Cambiar el `.gs` en GitHub **no** cambia el script real: hay que pegarlo y crear nueva versión.
- Hay varios puntos de seguridad pendientes en las reglas y en el puente: ver aviso de seguridad.
