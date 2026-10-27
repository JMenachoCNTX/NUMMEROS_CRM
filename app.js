// ============================================================
//  NUMMEROS by CONTAX — Panel de Administración (web)
//  VERSIÓN 1  ·  2026-09-07
//  Presencia · Reportes · Clientes · Base de Datos (Google Sheets) · IA
// ============================================================
const APP_VERSION = "61";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, increment, FieldPath, query, where, orderBy, limit, startAfter, documentId } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (!window.APP_CONFIG || !window.APP_CONFIG.firebase) {
  document.body.innerHTML = '<div style="color:#fff;font-family:sans-serif;padding:40px">Falta config.js con los datos de Firebase.</div>';
  throw new Error("config.js");
}
const app = initializeApp(window.APP_CONFIG.firebase);
const auth = getAuth(app);
const db = getFirestore(app);
// App secundaria para crear usuarios sin cerrar la sesión del admin
const app2 = initializeApp(window.APP_CONFIG.firebase, "secondary");
const auth2 = getAuth(app2);

const el = (id) =>document.getElementById(id);
// Muestra la versión en pantalla (todos los <span class="ver">)
try { document.querySelectorAll(".ver").forEach(e => { e.textContent = "v" + APP_VERSION; e.title = "NUMMEROS · Panel de Administración v" + APP_VERSION; }); document.title = "NUMMEROS · Panel v" + APP_VERSION; } catch (e) {}
const LOGO_BYC = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" zoomAndPan="magnify" viewBox="11 100 132 40" preserveAspectRatio="xMidYMid meet" version="1.0"><defs><g/><clipPath id="c73c86b7c9"><path d="M 42 24 L 88 24 L 88 37.578125 L 42 37.578125 Z M 42 24 " clip-rule="nonzero"/></clipPath><clipPath id="8b639d37ef"><path d="M 0.542969 4 L 8 4 L 8 13 L 0.542969 13 Z M 0.542969 4 " clip-rule="nonzero"/></clipPath><clipPath id="3c14d60791"><path d="M 4 3 L 7.496094 3 L 7.496094 8 L 4 8 Z M 4 3 " clip-rule="nonzero"/></clipPath><clipPath id="b0db276849"><rect x="0" width="8" y="0" height="9"/></clipPath><clipPath id="ec4969832e"><path d="M 39 4 L 45.378906 4 L 45.378906 11 L 39 11 Z M 39 4 " clip-rule="nonzero"/></clipPath><clipPath id="cd5bf04f37"><rect x="0" width="46" y="0" height="14"/></clipPath><clipPath id="f202c15746"><rect x="0" width="132" y="0" height="38"/></clipPath></defs><g transform="matrix(1, 0, 0, 1, 11, 101)"><g clip-path="url(#f202c15746)"><g fill="currentColor" fill-opacity="1"><g transform="translate(0.701317, 19.527358)"><g><path d="M 10.59375 0 L 4.0625 -11.5625 C 4.1875 -10.4375 4.25 -9.53125 4.25 -8.84375 L 4.25 0 L 1.453125 0 L 1.453125 -15 L 5.046875 -15 L 11.6875 -3.359375 C 11.550781 -4.429688 11.484375 -5.40625 11.484375 -6.28125 L 11.484375 -15 L 14.28125 -15 L 14.28125 0 Z M 10.59375 0 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(16.44427, 19.527358)"><g><path d="M 7.703125 0.21875 C 5.628906 0.21875 4.046875 -0.285156 2.953125 -1.296875 C 1.859375 -2.304688 1.3125 -3.75 1.3125 -5.625 L 1.3125 -15 L 4.453125 -15 L 4.453125 -5.875 C 4.453125 -4.6875 4.734375 -3.785156 5.296875 -3.171875 C 5.859375 -2.554688 6.6875 -2.25 7.78125 -2.25 C 8.90625 -2.25 9.769531 -2.566406 10.375 -3.203125 C 10.976562 -3.847656 11.28125 -4.769531 11.28125 -5.96875 L 11.28125 -15 L 14.421875 -15 L 14.421875 -5.78125 C 14.421875 -3.875 13.832031 -2.394531 12.65625 -1.34375 C 11.476562 -0.300781 9.828125 0.21875 7.703125 0.21875 Z M 7.703125 0.21875 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(32.187223, 19.527358)"><g><path d="M 13.921875 0 L 13.921875 -9.09375 C 13.921875 -9.300781 13.921875 -9.503906 13.921875 -9.703125 C 13.929688 -9.910156 13.96875 -10.796875 14.03125 -12.359375 C 13.519531 -10.453125 13.144531 -9.125 12.90625 -8.375 L 10.203125 0 L 7.96875 0 L 5.265625 -8.375 L 4.125 -12.359375 C 4.207031 -10.710938 4.25 -9.625 4.25 -9.09375 L 4.25 0 L 1.453125 0 L 1.453125 -15 L 5.671875 -15 L 8.34375 -6.609375 L 8.578125 -5.796875 L 9.09375 -3.796875 L 9.765625 -6.203125 L 12.53125 -15 L 16.703125 -15 L 16.703125 0 Z M 13.921875 0 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(50.346431, 19.527358)"><g><path d="M 13.921875 0 L 13.921875 -9.09375 C 13.921875 -9.300781 13.921875 -9.503906 13.921875 -9.703125 C 13.929688 -9.910156 13.96875 -10.796875 14.03125 -12.359375 C 13.519531 -10.453125 13.144531 -9.125 12.90625 -8.375 L 10.203125 0 L 7.96875 0 L 5.265625 -8.375 L 4.125 -12.359375 C 4.207031 -10.710938 4.25 -9.625 4.25 -9.09375 L 4.25 0 L 1.453125 0 L 1.453125 -15 L 5.671875 -15 L 8.34375 -6.609375 L 8.578125 -5.796875 L 9.09375 -3.796875 L 9.765625 -6.203125 L 12.53125 -15 L 16.703125 -15 L 16.703125 0 Z M 13.921875 0 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(68.505639, 19.527358)"><g><path d="M 1.453125 0 L 1.453125 -15 L 13.265625 -15 L 13.265625 -12.578125 L 4.59375 -12.578125 L 4.59375 -8.8125 L 12.609375 -8.8125 L 12.609375 -6.375 L 4.59375 -6.375 L 4.59375 -2.421875 L 13.703125 -2.421875 L 13.703125 0 Z M 1.453125 0 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(83.045778, 19.527358)"><g><path d="M 11.765625 0 L 8.28125 -5.703125 L 4.59375 -5.703125 L 4.59375 0 L 1.453125 0 L 1.453125 -15 L 8.953125 -15 C 10.742188 -15 12.125 -14.613281 13.09375 -13.84375 C 14.070312 -13.082031 14.5625 -11.976562 14.5625 -10.53125 C 14.5625 -9.476562 14.257812 -8.570312 13.65625 -7.8125 C 13.0625 -7.050781 12.257812 -6.550781 11.25 -6.3125 L 15.3125 0 Z M 11.390625 -10.40625 C 11.390625 -11.84375 10.46875 -12.5625 8.625 -12.5625 L 4.59375 -12.5625 L 4.59375 -8.140625 L 8.71875 -8.140625 C 9.59375 -8.140625 10.253906 -8.335938 10.703125 -8.734375 C 11.160156 -9.128906 11.390625 -9.6875 11.390625 -10.40625 Z M 11.390625 -10.40625 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(98.788732, 19.527358)"><g><path d="M 16.046875 -7.578125 C 16.046875 -6.015625 15.738281 -4.640625 15.125 -3.453125 C 14.507812 -2.265625 13.625 -1.351562 12.46875 -0.71875 C 11.320312 -0.09375 9.984375 0.21875 8.453125 0.21875 C 6.085938 0.21875 4.234375 -0.472656 2.890625 -1.859375 C 1.554688 -3.253906 0.890625 -5.160156 0.890625 -7.578125 C 0.890625 -9.984375 1.554688 -11.859375 2.890625 -13.203125 C 4.234375 -14.554688 6.09375 -15.234375 8.46875 -15.234375 C 10.84375 -15.234375 12.695312 -14.550781 14.03125 -13.1875 C 15.375 -11.820312 16.046875 -9.953125 16.046875 -7.578125 Z M 12.84375 -7.578125 C 12.84375 -9.191406 12.457031 -10.457031 11.6875 -11.375 C 10.925781 -12.300781 9.851562 -12.765625 8.46875 -12.765625 C 7.0625 -12.765625 5.972656 -12.304688 5.203125 -11.390625 C 4.441406 -10.472656 4.0625 -9.203125 4.0625 -7.578125 C 4.0625 -5.929688 4.453125 -4.632812 5.234375 -3.6875 C 6.015625 -2.738281 7.085938 -2.265625 8.453125 -2.265625 C 9.859375 -2.265625 10.941406 -2.722656 11.703125 -3.640625 C 12.460938 -4.566406 12.84375 -5.878906 12.84375 -7.578125 Z M 12.84375 -7.578125 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(115.745137, 19.527358)"><g><path d="M 13.703125 -4.328125 C 13.703125 -2.859375 13.15625 -1.734375 12.0625 -0.953125 C 10.96875 -0.171875 9.367188 0.21875 7.265625 0.21875 C 5.335938 0.21875 3.828125 -0.117188 2.734375 -0.796875 C 1.640625 -1.484375 0.9375 -2.519531 0.625 -3.90625 L 3.65625 -4.40625 C 3.863281 -3.613281 4.265625 -3.035156 4.859375 -2.671875 C 5.460938 -2.316406 6.289062 -2.140625 7.34375 -2.140625 C 9.539062 -2.140625 10.640625 -2.804688 10.640625 -4.140625 C 10.640625 -4.566406 10.515625 -4.914062 10.265625 -5.1875 C 10.015625 -5.46875 9.660156 -5.703125 9.203125 -5.890625 C 8.742188 -6.078125 7.863281 -6.300781 6.5625 -6.5625 C 5.4375 -6.820312 4.65625 -7.03125 4.21875 -7.1875 C 3.78125 -7.351562 3.382812 -7.539062 3.03125 -7.75 C 2.675781 -7.96875 2.375 -8.226562 2.125 -8.53125 C 1.875 -8.84375 1.675781 -9.203125 1.53125 -9.609375 C 1.394531 -10.023438 1.328125 -10.5 1.328125 -11.03125 C 1.328125 -12.382812 1.835938 -13.421875 2.859375 -14.140625 C 3.878906 -14.867188 5.363281 -15.234375 7.3125 -15.234375 C 9.164062 -15.234375 10.554688 -14.941406 11.484375 -14.359375 C 12.421875 -13.773438 13.023438 -12.8125 13.296875 -11.46875 L 10.25 -11.0625 C 10.09375 -11.707031 9.773438 -12.191406 9.296875 -12.515625 C 8.816406 -12.835938 8.132812 -13 7.25 -13 C 5.34375 -13 4.390625 -12.40625 4.390625 -11.21875 C 4.390625 -10.820312 4.488281 -10.5 4.6875 -10.25 C 4.894531 -10.007812 5.195312 -9.800781 5.59375 -9.625 C 5.988281 -9.445312 6.796875 -9.226562 8.015625 -8.96875 C 9.453125 -8.664062 10.476562 -8.382812 11.09375 -8.125 C 11.71875 -7.863281 12.210938 -7.5625 12.578125 -7.21875 C 12.941406 -6.875 13.21875 -6.460938 13.40625 -5.984375 C 13.601562 -5.503906 13.703125 -4.953125 13.703125 -4.328125 Z M 13.703125 -4.328125 "/></g></g></g><g clip-path="url(#c73c86b7c9)"><g transform="matrix(1, 0, 0, 1, 42, 24)"><g clip-path="url(#cd5bf04f37)"><g clip-path="url(#8b639d37ef)"><g transform="matrix(1, 0, 0, 1, -0.000000000000021316, 4)"><g clip-path="url(#b0db276849)"><g fill="currentColor" fill-opacity="1"><g transform="translate(0.725152, 6.153239)"><g><path d="M 0.359375 -3.046875 L 0.359375 -4.234375 L 1.328125 -4.234375 L 1.328125 -3.046875 Z M 1.328125 0 L 0.359375 0 L 0.359375 -3.0625 L 1.328125 -3.0625 Z M 3.0625 -1.140625 L 2.078125 -1.140625 L 2.078125 -1.921875 L 3.0625 -1.921875 Z M 2.078125 -1.921875 C 2.078125 -2.078125 2.046875 -2.195312 1.984375 -2.28125 C 1.929688 -2.375 1.847656 -2.421875 1.734375 -2.421875 L 2.03125 -3.15625 C 2.226562 -3.15625 2.40625 -3.097656 2.5625 -2.984375 C 2.71875 -2.878906 2.835938 -2.734375 2.921875 -2.546875 C 3.015625 -2.367188 3.0625 -2.160156 3.0625 -1.921875 Z M 1.0625 -1.859375 C 1.0625 -2.109375 1.101562 -2.332031 1.1875 -2.53125 C 1.269531 -2.726562 1.382812 -2.878906 1.53125 -2.984375 C 1.675781 -3.097656 1.84375 -3.15625 2.03125 -3.15625 L 1.734375 -2.421875 C 1.609375 -2.421875 1.507812 -2.367188 1.4375 -2.265625 C 1.363281 -2.171875 1.328125 -2.035156 1.328125 -1.859375 Z M 2.078125 -1.140625 L 3.0625 -1.140625 C 3.0625 -0.910156 3.015625 -0.703125 2.921875 -0.515625 C 2.835938 -0.328125 2.71875 -0.175781 2.5625 -0.0625 C 2.40625 0.0390625 2.226562 0.09375 2.03125 0.09375 L 1.734375 -0.640625 C 1.847656 -0.640625 1.929688 -0.679688 1.984375 -0.765625 C 2.046875 -0.859375 2.078125 -0.984375 2.078125 -1.140625 Z M 1.0625 -1.203125 L 1.328125 -1.203125 C 1.328125 -1.023438 1.363281 -0.882812 1.4375 -0.78125 C 1.507812 -0.6875 1.609375 -0.640625 1.734375 -0.640625 L 2.03125 0.09375 C 1.84375 0.09375 1.675781 0.0351562 1.53125 -0.078125 C 1.382812 -0.191406 1.269531 -0.34375 1.1875 -0.53125 C 1.101562 -0.726562 1.0625 -0.953125 1.0625 -1.203125 Z M 1.0625 -1.203125 "/></g></g></g><g clip-path="url(#3c14d60791)"><g fill="currentColor" fill-opacity="1"><g transform="translate(4.049206, 6.153239)"><g><path d="M 0.453125 1.0625 L 0.671875 0.3125 C 0.835938 0.351562 0.96875 0.359375 1.0625 0.328125 C 1.15625 0.304688 1.21875 0.242188 1.25 0.140625 L 2.0625 0.140625 C 1.9375 0.566406 1.738281 0.851562 1.46875 1 C 1.207031 1.15625 0.867188 1.175781 0.453125 1.0625 Z M 1.25 0.140625 L 2.03125 -3.0625 L 3.015625 -3.0625 L 2.0625 0.140625 Z M 1.25 0.53125 L 0.171875 -3.0625 L 1.15625 -3.0625 L 1.703125 -0.84375 Z M 1.25 0.53125 "/></g></g></g></g></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(8.028157, 10.61739)"><g><path d="M 3.875 0.15625 C 3.195312 0.15625 2.597656 0.0078125 2.078125 -0.28125 C 1.554688 -0.570312 1.148438 -0.976562 0.859375 -1.5 C 0.566406 -2.019531 0.421875 -2.609375 0.421875 -3.265625 C 0.421875 -3.929688 0.578125 -4.519531 0.890625 -5.03125 C 1.210938 -5.550781 1.632812 -5.953125 2.15625 -6.234375 C 2.6875 -6.523438 3.265625 -6.671875 3.890625 -6.671875 C 4.421875 -6.671875 4.929688 -6.554688 5.421875 -6.328125 C 5.910156 -6.097656 6.332031 -5.773438 6.6875 -5.359375 L 5.8125 -4.53125 C 5.519531 -4.84375 5.210938 -5.078125 4.890625 -5.234375 C 4.566406 -5.398438 4.222656 -5.484375 3.859375 -5.484375 C 3.453125 -5.484375 3.078125 -5.382812 2.734375 -5.1875 C 2.398438 -5 2.132812 -4.734375 1.9375 -4.390625 C 1.738281 -4.054688 1.640625 -3.679688 1.640625 -3.265625 C 1.640625 -2.816406 1.734375 -2.425781 1.921875 -2.09375 C 2.117188 -1.757812 2.390625 -1.5 2.734375 -1.3125 C 3.078125 -1.125 3.460938 -1.03125 3.890625 -1.03125 C 4.273438 -1.03125 4.613281 -1.101562 4.90625 -1.25 C 5.207031 -1.40625 5.523438 -1.644531 5.859375 -1.96875 L 6.703125 -1.09375 C 6.398438 -0.789062 6.109375 -0.550781 5.828125 -0.375 C 5.554688 -0.195312 5.257812 -0.0664062 4.9375 0.015625 C 4.625 0.109375 4.269531 0.15625 3.875 0.15625 Z M 3.875 0.15625 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(14.911591, 10.61739)"><g><path d="M 3.828125 0.15625 C 3.191406 0.15625 2.613281 0.00390625 2.09375 -0.296875 C 1.582031 -0.609375 1.175781 -1.023438 0.875 -1.546875 C 0.570312 -2.066406 0.421875 -2.640625 0.421875 -3.265625 C 0.421875 -3.890625 0.570312 -4.460938 0.875 -4.984375 C 1.1875 -5.503906 1.601562 -5.914062 2.125 -6.21875 C 2.644531 -6.519531 3.207031 -6.671875 3.8125 -6.671875 C 4.414062 -6.671875 4.972656 -6.519531 5.484375 -6.21875 C 6.003906 -5.914062 6.421875 -5.503906 6.734375 -4.984375 C 7.046875 -4.460938 7.203125 -3.878906 7.203125 -3.234375 C 7.203125 -2.609375 7.050781 -2.035156 6.75 -1.515625 C 6.445312 -1.003906 6.039062 -0.597656 5.53125 -0.296875 C 5.019531 0.00390625 4.453125 0.15625 3.828125 0.15625 Z M 3.828125 -1.03125 C 4.210938 -1.03125 4.566406 -1.128906 4.890625 -1.328125 C 5.210938 -1.523438 5.46875 -1.789062 5.65625 -2.125 C 5.84375 -2.46875 5.9375 -2.84375 5.9375 -3.25 C 5.9375 -3.644531 5.84375 -4.007812 5.65625 -4.34375 C 5.476562 -4.6875 5.222656 -4.960938 4.890625 -5.171875 C 4.566406 -5.378906 4.207031 -5.484375 3.8125 -5.484375 C 3.414062 -5.484375 3.054688 -5.382812 2.734375 -5.1875 C 2.410156 -5 2.148438 -4.734375 1.953125 -4.390625 C 1.765625 -4.054688 1.671875 -3.671875 1.671875 -3.234375 C 1.671875 -2.804688 1.769531 -2.425781 1.96875 -2.09375 C 2.164062 -1.757812 2.425781 -1.5 2.75 -1.3125 C 3.082031 -1.125 3.441406 -1.03125 3.828125 -1.03125 Z M 3.828125 -1.03125 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(22.519645, 10.61739)"><g><path d="M 4.71875 -6.5 L 5.96875 -6.5 L 5.96875 0 L 4.765625 0 L 1.984375 -4.265625 L 1.984375 0 L 0.75 0 L 0.75 -6.5 L 1.9375 -6.5 L 4.71875 -2.234375 Z M 4.71875 -6.5 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(29.221978, 10.61739)"><g><path d="M 1.265625 -5.296875 L 0.09375 -5.296875 L 0.09375 -6.5 L 3.703125 -6.5 L 3.703125 -5.296875 L 2.5 -5.296875 L 2.5 0 L 1.265625 0 Z M 1.265625 -5.296875 "/></g></g></g><g fill="currentColor" fill-opacity="1"><g transform="translate(32.935411, 10.61739)"><g><path d="M 4.984375 0 L 4.484375 -1.34375 L 1.78125 -1.34375 L 1.28125 0 L 0 0 L 2.515625 -6.5 L 3.765625 -6.5 L 6.265625 0 Z M 2.25 -2.5625 L 4.03125 -2.5625 L 3.140625 -4.953125 Z M 2.25 -2.5625 "/></g></g></g><g clip-path="url(#ec4969832e)"><g fill="currentColor" fill-opacity="1"><g transform="translate(39.202998, 10.61739)"><g><path d="M 2.390625 -3.359375 L 0.3125 -6.5 L 1.71875 -6.5 L 3.078125 -4.421875 L 4.453125 -6.5 L 5.84375 -6.5 L 3.78125 -3.359375 L 5.96875 0 L 4.578125 0 L 3.078125 -2.296875 L 1.59375 0 L 0.1875 0 Z M 2.390625 -3.359375 "/></g></g></g></g></g></g></g></g></g></svg>`;
let ME = null, USERS = [], CHATS = [];

// ---------- Tema ----------
if (localStorage.getItem("cx-theme") === "dark") { document.documentElement.classList.add("dark"); }
const CX_SUN = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.5 1.5M17.9 17.9l1.5 1.5M2.5 12h2M19.5 12h2M4.6 19.4l1.5-1.5M17.9 6.1l1.5-1.5"/></svg>';
const CX_MOON = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/></svg>';
function initTheme() { const b = el("themeBtn"); if (!b) return; const dark = () =>document.documentElement.classList.contains("dark"); b.innerHTML = dark() ? CX_SUN : CX_MOON; b.onclick = () => { const d = !dark(); document.documentElement.classList.toggle("dark", d); localStorage.setItem("cx-theme", d ? "dark" : "light"); b.innerHTML = d ? CX_SUN : CX_MOON; }; }
function initSidebar() {
  const b = el("sbToggle"); const lay = document.querySelector(".layout"); if (!b || !lay) return;
  try { if (localStorage.getItem("cx-sb") === "hide") lay.classList.add("sbhide"); } catch (e) {}
  const guardar = h => { try { localStorage.setItem("cx-sb", h ? "hide" : "show"); } catch (e) {} };
  b.onclick = (ev) => { ev.stopPropagation(); const h = lay.classList.toggle("sbhide"); guardar(h); };
  // Tooltip con el nombre de cada pestaña (útil cuando el menú está contraído)
  document.querySelectorAll("nav.tabs button").forEach(x => { const t = x.querySelector("span"); if (t && !x.title) x.title = t.textContent.trim(); });
  // Clic en cualquier parte fuera del menú → se contrae (solo en pantallas grandes)
  if (!window.__cxSbClick) {
    window.__cxSbClick = true;
    document.addEventListener("click", ev => {
      if (window.innerWidth <= 900 || lay.classList.contains("sbhide")) return;
      if (ev.target.closest && (ev.target.closest(".sb") || ev.target.closest("#sbToggle"))) return;
      lay.classList.add("sbhide"); guardar(true);
    });
  }
}
function initFab() {
  const f = el("cxFab"); if (!f) return;
  f.onclick = () => { const btn = document.querySelector('nav.tabs button[data-v="asistente"]'); if (btn) btn.click(); };
}
let cxClockTimer = null;
function initClock() {
  const upd = () => {
    const d = new Date();
    const t = el("cxClockTime"), f = el("cxClockDate");
    if (t) t.textContent = d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
    if (f) f.textContent = d.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  upd(); if (cxClockTimer) clearInterval(cxClockTimer); cxClockTimer = setInterval(upd, 15000);
}


// ============================================================
//  ÍCONOS VECTORIALES (sin emojis). ICO("nombre") devuelve un <svg> lineal.
//  Además, cualquier emoji que aparezca en pantalla se cambia solo por su vector.
// ============================================================
const ICO_PATHS = {
  check: '<path d="M5 12l5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.5 4.9-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  pin: '<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  bot: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 4v4M8 14h.01M16 14h.01"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M19 4l2 2"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  clip: '<path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>'
};
function ICO(n, size) {
  const p = ICO_PATHS[n]; if (!p) return "";
  const z = size || 14;
  return `<svg class="ico" width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;flex-shrink:0">${p}</svg>`;
}
window.ICO = ICO;
const EMOJI_A_ICO = { "✓": "check", "✔": "check", "✕": "x", "✖": "x", "👁": "eye", "🙈": "eyeOff", "📋": "copy", "📌": "pin", "⚡": "zap", "⛔": "ban", "📲": "phone", "⚙": "settings", "💡": "bulb", "⚠": "alert", "📷": "camera", "🤖": "bot", "📧": "mail", "✉": "mail", "🔑": "key", "🧮": "calc", "🔎": "search", "🔍": "search", "🎉": "check", "📄": "doc", "📎": "clip", "🧾": "receipt" };
const EMOJI_RE = /([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}\u{23F0}-\u{23FF}])\u{FE0F}?\s?/gu;
function emojisAVectores(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (EMOJI_RE.lastIndex = 0, EMOJI_RE.test(n.nodeValue) && !(n.parentNode && /^(SCRIPT|STYLE|TEXTAREA|OPTION|TITLE)$/.test(n.parentNode.nodeName))) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const nodos = []; while (w.nextNode()) nodos.push(w.currentNode);
  nodos.forEach(t => {
    const span = document.createElement("span");
    span.innerHTML = escape(t.nodeValue).replace(EMOJI_RE, (m, e) => { const n = EMOJI_A_ICO[e]; return n ? ICO(n) + (/\s$/.test(m) ? " " : "") : ""; });
    t.replaceWith(...span.childNodes);
  });
}
try {
  const obs = new MutationObserver(ms => { for (const m of ms) { if (m.type === "characterData") { if (m.target.parentNode) emojisAVectores(m.target.parentNode); } else m.addedNodes.forEach(n => { if (n.nodeType === 1) emojisAVectores(n); else if (n.nodeType === 3 && n.parentNode) emojisAVectores(n.parentNode); }); } });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  emojisAVectores(document.body);
} catch (e) {}

// ---------- Login ----------
el("loginBtn").onclick = async () => {
  const email = el("email").value.trim(), pass = el("password").value, msg = el("loginMsg");
  msg.className = "msg"; msg.textContent = "";
  if (!email || !pass) { msg.className = "msg err"; msg.textContent = "Completa correo y contraseña."; return; }
  el("loginBtn").disabled = true;
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch (e) { msg.className = "msg err"; msg.textContent = traducir(e.code); }
  finally { el("loginBtn").disabled = false; }
};
function traducir(c) { return ({ "auth/too-many-requests": "Demasiados intentos fallidos. Espera unos minutos o pide al administrador que te restablezca la contraseña.", "auth/network-request-failed": "Sin conexión. Revisa tu internet.", "auth/user-disabled": "Esta cuenta está deshabilitada en Firebase.", "auth/quota-exceeded": "Se alcanzó el límite diario de Firebase. Intenta después de las 3:00 a.m.", "auth/invalid-credential": "Correo o contraseña incorrectos.", "auth/user-not-found": "No existe esa cuenta.", "auth/wrong-password": "Contraseña incorrecta.", "auth/invalid-email": "Correo no válido." })[c] || ("Error: " + c); }
el("logoutBtn").onclick = () =>signOut(auth);
el("agentLogout").onclick = () =>signOut(auth);

// ---------- Roles, secciones y permisos del portal ----------
// Secciones del menú (apartados) y las pestañas (views) que contienen
const NAV_SECTIONS = [
  { key: "portal",   label: "PORTAL",          views: ["inicio", "dashboard", "basedatos", "ficha", "tarifas", "calendario"] },
  { key: "finanzas", label: "FINANZAS",        views: ["recepcion", "pasarela", "arqueo", "egresos", "repfinanzas"] },
  { key: "listas",   label: "LISTAS",          views: ["control", "declaraciones", "tramites", "eeff", "facturacion"] },
  { key: "crm",      label: "CRM",             views: ["bandeja", "respuestas"] },
  { key: "reportes", label: "REPORTES",        views: ["presence", "historial", "reports"] },
  { key: "admin",    label: "ADMINISTRACIÓN",  views: ["asistente", "config", "users", "importar"] }
];
const VIEW_LABELS = {
  inicio: "Inicio", dashboard: "Dashboard", basedatos: "Clientes", ficha: "Ficha del cliente", tarifas: "Tarifas y Suscripciones", calendario: "Calendario",
  recepcion: "Recepción", pasarela: "Pasarela de pagos", arqueo: "Arqueo", egresos: "Egresos", repfinanzas: "Reportes financieros",
  control: "Control del mes", declaraciones: "Declaraciones", tramites: "Trámites", eeff: "Estados Fin. (EEFF)", facturacion: "Facturación",
  bandeja: "Bandeja", respuestas: "Respuestas",
  presence: "Presencia", historial: "Historial", reports: "Reportes",
  asistente: "Asistente IA", config: "Configuración", users: "Usuarios", importar: "Importar"
};
const ALL_VIEWS = NAV_SECTIONS.reduce((a, s) => a.concat(s.views), []);
const PORTAL_ROLES = ["admin", "supervisor", "editor", "cajero", "lector"];
const ROLE_LABELS = { admin: "Admin", supervisor: "Supervisor", editor: "Editor", cajero: "Cajero", lector: "Lector", agent: "Agente (extensión)" };
// Visibilidad por defecto por rol (editable en Panel → Usuarios → Permisos)
const DEFAULT_ROLE_VIEWS = {
  admin: ALL_VIEWS.slice(),
  supervisor: ALL_VIEWS.slice(),
  editor: ["inicio", "dashboard", "basedatos", "ficha", "tarifas", "calendario", "control", "declaraciones", "tramites", "eeff", "facturacion", "asistente"],
  cajero: ["inicio", "dashboard", "basedatos", "recepcion", "pasarela", "arqueo", "egresos", "calendario", "asistente"],
  lector: ["inicio", "dashboard", "basedatos", "ficha", "tarifas", "calendario", "control", "declaraciones", "tramites", "eeff", "facturacion", "presence", "historial", "reports"]
};
let ROLE_VIEWS = null; // se carga de config/app.rolePerms; si no, usa los defaults
function roleViewsFor(role) {
  const custom = ROLE_VIEWS && ROLE_VIEWS[role];
  if (custom && Array.isArray(custom)) return custom;
  return DEFAULT_ROLE_VIEWS[role] || [];
}
function canSeeView(v) { if (!ME) return false; if (ME.role === "admin") return true; return roleViewsFor(ME.role).indexOf(v) >= 0; }
function isAdmin() { return !!(ME && (ME.role === "admin" || ME.role === "supervisor")); }
function isAdminStrict() { return !!(ME && ME.role === "admin"); }
function canEditClientes() { return !!(ME && ["admin", "supervisor", "editor", "cajero"].indexOf(ME.role) >= 0); }
function roleOptionsHTML(cur) {
  const order = ["admin", "supervisor", "editor", "cajero", "lector", "agent"];
  return order.map(r => `<option value="${r}" ${cur === r ? "selected" : ""}>${ROLE_LABELS[r]}</option>`).join("");
}

function buildNav() {
  let first = null;
  document.querySelectorAll('nav.tabs button').forEach(b => {
    const ok = canSeeView(b.dataset.v);
    b.classList.toggle("hidden", !ok);
    b.classList.remove("active");
    b.onclick = () => switchView(b.dataset.v, b);
    if (ok && !first) first = b;
  });
  // Ocultar el encabezado de una sección si no tiene ninguna pestaña visible
  document.querySelectorAll('nav.tabs .navgroup[data-sec]').forEach(h => {
    const sec = h.dataset.sec;
    const any = [...document.querySelectorAll(`nav.tabs button[data-sec="${sec}"]`)].some(b => !b.classList.contains("hidden"));
    h.classList.toggle("hidden", !any);
  });
  return first;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { el("login").classList.remove("hidden"); el("app").classList.add("hidden"); el("agentOnly").classList.add("hidden"); return; }
  let snap, errPerfil = null;
  try { snap = await getDoc(doc(db, "users", user.uid)); } catch (e) { snap = null; errPerfil = e; }
  el("login").classList.add("hidden");
  // 0) No se pudo LEER el perfil (no es que no exista): mostramos la causa real
  if (errPerfil) {
    el("app").classList.add("hidden"); el("agentOnly").classList.remove("hidden");
    const r = el("agentReason"), code = String(errPerfil.code || errPerfil.message || errPerfil);
    if (r) r.innerHTML = /resource-exhausted|quota/i.test(code)
      ? `<b>El sistema alcanzó el límite diario gratuito de Firebase</b> (cuota de lecturas/escrituras). No es problema de tu cuenta ni de tu contraseña.<br><br>Se restablece solo a las <b>3:00 a.m.</b> (hora de Bolivia), o el administrador puede activar el plan de pago por uso en Firebase.<br><br><span style="color:var(--muted);font-size:12px">Código: ${escape(code)}</span>`
      : /unavailable|network|offline/i.test(code)
      ? `No hay conexión con el servidor. Revisa tu internet y vuelve a intentar.<br><br><span style="color:var(--muted);font-size:12px">Código: ${escape(code)}</span>`
      : `No se pudo leer tu perfil en el sistema.<br><br><span style="color:var(--muted);font-size:12px">Código: ${escape(code)}</span><br>Envía esta pantalla al administrador.`;
    return;
  }
  // 1) La cuenta existe en Firebase pero NO tiene perfil en el sistema
  if (!snap || !snap.exists()) {
    el("app").classList.add("hidden"); el("agentOnly").classList.remove("hidden");
    const r = el("agentReason");
    if (r) r.innerHTML = `Tu cuenta <b>${escape(user.email || "")}</b> entró correctamente, pero <b>no tiene perfil en el sistema</b>. Esto NO es problema de contraseña.<br><br>Pídele al administrador que te dé de alta desde <b>Usuarios</b> con tu mismo correo (o, si el administrador eres tú, créalo ahí).`;
    return;
  }
  ME = { uid: user.uid, ...snap.data() };
  // Cargar permisos por rol configurados (si existen)
  try { const c = await loadConfigDoc(); ROLE_VIEWS = c.rolePerms || null; } catch (e) { ROLE_VIEWS = null; }
  // 2) Perfil sin acceso al portal: rol de agente / rol desconocido / inactivo
  if (ME.active !== true || PORTAL_ROLES.indexOf(ME.role) < 0) {
    el("app").classList.add("hidden"); el("agentOnly").classList.remove("hidden");
    const r = el("agentReason");
    if (r) {
      if (ME.active !== true) r.innerHTML = `Tu cuenta <b>${escape(ME.email || "")}</b> está <b>inactiva</b>. Esto NO es problema de contraseña.<br><br>Pídele al administrador que te <b>active</b> desde <b>Usuarios</b>.`;
      else r.innerHTML = `Tu cuenta <b>${escape(ME.email || "")}</b> tiene el rol <b>${escape(ROLE_LABELS[ME.role] || ME.role || "—")}</b>, que trabaja desde la <b>extensión</b> de WhatsApp, no desde este panel.<br><br>Si necesitas entrar al panel, pídele al administrador que te asigne un rol del portal (Admin, Supervisor, Editor, Cajero o Lector) desde <b>Usuarios</b>.`;
    }
    return;
  }
  // 3) Acceso OK
  el("agentOnly").classList.add("hidden"); el("app").classList.remove("hidden");
  el("who").textContent = `${ME.name || ME.email} · ${ROLE_LABELS[ME.role] || ME.role}`;
  initTheme();
  initSidebar();
  initFab();
  initClock();
  const first = buildNav();
  if (first) switchView(first.dataset.v, first);
});

async function loadAll() {
  USERS = []; CHATS = [];
  try { (await getDocs(collection(db, "users"))).forEach(d =>USERS.push({ ...d.data(), uid: d.id })); } catch (e) {}
  try { (await getDocs(collection(db, "waChats"))).forEach(d =>CHATS.push(d.data())); } catch (e) {}
}

// Títulos fijos en todas las listas: las tablas dentro de un contenedor con desplazamiento
// reciben un alto máximo, así el encabezado se queda arriba al bajar.
function tablasTitulosFijos(raiz) {
  (raiz || document).querySelectorAll(".main table").forEach(t => {
    if (!t.tHead || t.closest(".bd-scroll") || t.dataset.tf) return;
    t.dataset.tf = "1";
    const p = t.parentElement; if (!p) return;
    const st = getComputedStyle(p);
    if (/(auto|scroll)/.test(st.overflowX + st.overflowY) && !p.classList.contains("tfix")) p.classList.add("tfix");
  });
}
(() => { let tm = null; const mo = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(() => tablasTitulosFijos(), 120); }); document.addEventListener("DOMContentLoaded", () => { const m = document.querySelector(".main") || document.body; mo.observe(m, { childList: true, subtree: true }); }); if (document.readyState !== "loading") { const m = document.querySelector(".main") || document.body; mo.observe(m, { childList: true, subtree: true }); } })();
function switchView(v, btn) {
  document.querySelectorAll('nav.tabs button').forEach(b =>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  try { const _t = document.getElementById("pgTitle"); if (_t) { const _s = btn && btn.querySelector("span"); _t.textContent = _s ? _s.textContent : (v.charAt(0).toUpperCase() + v.slice(1)); } } catch (e) {}
  document.querySelectorAll('.view').forEach(s =>s.classList.remove('active'));
  el("v-" + v).classList.add("active");
  if (v === "inicio") renderInicio();
  if (v === "clientes") renderClientes();
  if (v === "basedatos") renderBaseDatos();
  if (v === "ficha") renderFicha();
  if (v === "tarifas") renderTarifas();
  if (v === "asistente") renderAsistente();
  if (v === "recepcion") renderRecepcion();
  if (v === "pasarela") renderPasarela();
  if (v === "dashboard") renderDashboard();
  if (v === "control") renderControl();
  if (v === "declaraciones") renderDDJJ();
  if (v === "tramites") renderLista("tramite", "v-tramites", "Trámites");
  if (v === "eeff") renderListaEEFF();
  if (v === "facturacion") renderFacturacion();
  if (v === "calendario") renderCalendario();
  if (v === "arqueo") renderArqueo();
  if (v === "egresos") renderEgresos();
  if (v === "repfinanzas") renderRepFinanzas();
  if (v === "presence") renderPresence();
  if (v === "historial") renderHistorial();
  if (v === "bandeja") renderBandeja();
  if (v === "respuestas") renderRespuestas();
  if (v === "reports") renderReports();
  if (v === "users") renderUsers();
  if (v === "importar") renderImportar();
  if (v === "config") renderConfig();
}

// ---------- Inicio (portal home) ----------
const INICIO_IMGS = {
  claro: ["arquimedes-saludo-claro", "reunion-sala"],
  oscuro: ["los-cuatro-oscuro", "pitagoras-muestra-sistema", "contrato-euclides-oscuro", "pitagoras-saludo-oscuro", "apreton-arquimedes"]
};
async function renderInicio() {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : (hora < 19 ? "Buenas tardes" : "Buenas noches");
  const nombre = escape((ME.name || ME.email || "").split(" ")[0] || "");
  const oscuro = document.documentElement.classList.contains("dark");
  const lista = oscuro ? INICIO_IMGS.oscuro : INICIO_IMGS.claro.concat(INICIO_IMGS.oscuro.slice(0, 2));
  const img = lista[Math.floor(Math.random() * lista.length)];
  el("v-inicio").innerHTML = `
    <div style="position:relative;overflow:hidden;border-radius:18px;min-height:min(74vh,640px);display:flex;align-items:flex-end;background:#051F20">
      <img src="marca/colaboracion/${img}.jpg" alt="Los clásicos de NUMMEROS junto al Contador Virtual de CONTAX" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,31,32,0) 35%,rgba(5,31,32,.88) 100%)"></div>
      <div style="position:relative;padding:28px 30px;color:#fff;width:100%">
        <img src="marca/logos/nummeros-logotipo-firma-blanco.svg" alt="NUMMEROS by CONTAX" style="height:44px;width:auto;display:block;margin-bottom:14px">
        <h1 style="font-size:26px;margin:0 0 4px;font-weight:600;color:#fff">${saludo}, ${nombre}.</h1>
        <p style="margin:0;color:#DAF1DE;font-size:15px">Sistemas a la medida de tu empresa.</p>
      </div>
    </div>`;
}

// ---------- Respuestas rápidas (CRUD + Google Sheets) ----------
let QR = [], qrEditId = null, qrFilter = "", qrCatFilter = "";
function catHue(s) { s = String(s || "General"); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
function catChip(cat) { const l = 82 - (catHue(cat) % 26); return `<span style="background:hsl(0,0%,${l}%);color:#1a1a1a;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">${escape(cat || "General")}</span>`; }
async function loadConfigDoc() { try { const s = await getDoc(doc(db, "config", "app")); return s.exists() ? s.data() : {}; } catch (e) { return {}; } }
async function sheetPush(action, item) {
  const cfg = await loadConfigDoc(); const url = (cfg.sheetUrl || "").trim(); if (!url) return;
  const payload = { action, item: { categoria: item.category || "", nombre: item.title || "", nro: item.nro || "", titulo: item.description || "", respuesta: item.text || "" } };
  try { await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }); } catch (e) {}
}
async function renderRespuestas() {
  const snap = await getDocs(collection(db, "quickReplies"));
  QR = []; snap.forEach(d =>QR.push({ id: d.id, ...d.data() }));
  QR.sort((a, b) => (a.category || "General").localeCompare(b.category || "General") || (Number(a.nro) || 9999) - (Number(b.nro) || 9999) || (a.title || "").localeCompare(b.title || ""));
  const cats = [...new Set(QR.map(q =>q.category || "General"))];
  const term = qrFilter.toLowerCase();
  const list = QR.filter(q => {
    if (qrCatFilter && (q.category || "General") !== qrCatFilter) return false;
    if (term && !`${q.title} ${q.text} ${q.category || ""} ${q.description || ""}`.toLowerCase().includes(term)) return false;
    return true;
  });
  const chips = `<span class="chip ${qrCatFilter === "" ? "on" : ""}" data-c="" style="cursor:pointer;padding:5px 12px;border-radius:20px;font-size:12px;border:1px solid var(--line);${qrCatFilter === "" ? "background:var(--accent);color:var(--accent-ink);font-weight:600" : "color:var(--muted)"}">Todas</span>` +
    cats.map(c => { const on = qrCatFilter === c; return `<span class="chip" data-c="${escape(c)}" style="cursor:pointer;padding:5px 12px;border-radius:20px;font-size:12px;border:1px solid var(--line);background:${on ? "var(--accent)" : "var(--panel2)"};color:${on ? "var(--accent-ink)" : "var(--muted)"};font-weight:600">${escape(c)}</span>`; }).join("");
  const rows = list.map(q => {
    return `<tr style="border-left:4px solid var(--line)">
    <td>${escape(q.nro || "")}</td>
    <td>${catChip(q.category)}</td>
    <td><b>${escape(q.title || "")}</b>${q.image ? '' : ""}${q.description ? `<div style="color:var(--muted);font-size:12px">${escape(q.description)}</div>` : ""}</td>
    <td style="color:var(--muted)">${q.text ? escape(q.text.slice(0, 60)) + (q.text.length > 60 ? "…" : "") : (q.image ? "(solo imagen)" : "")}</td>
    <td style="white-space:nowrap"><button class="mini" data-edit="${q.id}">Editar</button> <button class="mini" data-del="${q.id}">Borrar</button></td></tr>`;
  }).join("");
  el("v-respuestas").innerHTML = `<h1>Respuestas rápidas</h1><p class="lead">Créalas y edítalas aquí; se guardan en la nube (Firebase) y se comparten con todo el equipo al instante.</p>
    <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
      <input id="qr_search" class="mini" style="padding:8px;min-width:220px" placeholder="Buscar por nombre o texto…" value="${escape(qrFilter)}">
      <button class="btn" id="qr_new">＋ Nueva respuesta</button>
      <span class="msg" id="qr_msg" style="align-self:center"></span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${chips}</div>
    <table><thead><tr><th>Nro</th><th>Categoría</th><th>Nombre</th><th>Respuesta</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="color:var(--muted)">Sin respuestas con estos filtros.</td></tr>'}</tbody></table>`;
  el("qr_search").oninput = () => { qrFilter = el("qr_search").value; renderRespuestas(); };
  el("v-respuestas").querySelectorAll(".chip").forEach(c =>c.onclick = () => { qrCatFilter = c.dataset.c; renderRespuestas(); });
  el("qr_new").onclick = () =>openQrModal(null);
  el("v-respuestas").querySelectorAll("[data-edit]").forEach(b =>b.onclick = () =>openQrModal(QR.find(x =>x.id === b.dataset.edit)));
  el("v-respuestas").querySelectorAll("[data-del]").forEach(b =>b.onclick = async () => {
    const q = QR.find(x =>x.id === b.dataset.del); if (!q) return;
    await deleteDoc(doc(db, "quickReplies", q.id)); renderRespuestas();
  });
}
function qrWrapSel(ta, a, b) {
  b = b || a;
  const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
  const sel = v.slice(s, e) || "texto";
  ta.value = v.slice(0, s) + a + sel + b + v.slice(e);
  ta.focus();
  ta.selectionStart = s + a.length; ta.selectionEnd = s + a.length + sel.length;
}
function openQrModal(q) {
  qrEditId = q ? q.id : null;
  let curImage = q && q.image ? q.image : "";
  const cats = [...new Set(QR.map(x =>x.category || "General"))];
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:24px;width:640px;max-width:96vw;max-height:92vh;overflow-y:auto">
    <h3 style="margin:0 0 16px">${q ? "Editar" : "Nueva"} respuesta</h3>
    <div class="grid2">
      <div class="field"><label>Nro</label><input id="f_nro" value="${escape(q ? q.nro || "" : "")}"></div>
      <div class="field"><label>Categoría</label><input id="f_cat" value="${escape(q ? q.category || "" : "")}" placeholder="Ventas" list="f_catlist"><datalist id="f_catlist">${cats.map(c => `<option value="${escape(c)}">`).join("")}</datalist></div>
    </div>
    <div class="grid2">
      <div class="field"><label>Nombre de la respuesta</label><input id="f_title" value="${escape(q ? q.title || "" : "")}" placeholder="Saludo"></div>
      <div class="field"><label>Descripción breve</label><input id="f_desc" value="${escape(q ? q.description || "" : "")}" placeholder="De qué trata"></div>
    </div>
    <div class="field">
      <label>Respuesta</label>
      <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap">
        <button type="button" class="mini" id="f_b" title="Negrita (WhatsApp)"><b>N</b></button>
        <button type="button" class="mini" id="f_i" title="Cursiva"><i>C</i></button>
        <button type="button" class="mini" id="f_s" title="Tachado"><s>T</s></button>
        <span class="note" style="align-self:center">Selecciona texto y aplica formato. En WhatsApp se ve *negrita*, _cursiva_, ~tachado~.</span>
      </div>
      <textarea id="f_text" style="min-height:200px;font-size:14px;line-height:1.6;white-space:pre-wrap">${escape(q ? q.text || "" : "")}</textarea>
    </div>
    <div class="field">
      <label>Imagen (opcional) — p. ej. tu QR de pago</label>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button type="button" class="btn sec" id="f_imgbtn" style="border:1px solid var(--line)">Elegir imagen</button>
        <button type="button" class="mini" id="f_imgclear" style="${curImage ? "" : "display:none"}">Quitar</button>
        <span class="note" id="f_imgnote">Se guarda junto a la respuesta. En el CRM podrás copiarla y pegarla en el chat.</span>
      </div>
      <img id="f_imgprev" src="${curImage || ""}" style="${curImage ? "" : "display:none;"}max-width:160px;max-height:160px;margin-top:10px;border:1px solid var(--line);border-radius:8px">
      <input type="file" id="f_imgfile" accept="image/*" style="display:none">
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button class="btn sec" id="f_cancel" style="border:1px solid var(--line)">Cancelar</button><button class="btn" id="f_save">Guardar</button></div>
    <div class="msg" id="f_msg"></div>
  </div>`;
  document.body.appendChild(bg);
  const close = () =>bg.remove();
  const $ = s =>bg.querySelector(s);
  bg.onclick = (e) => { if (e.target === bg) close(); };
  $("#f_cancel").onclick = close;
  const ta = $("#f_text");
  $("#f_b").onclick = () =>qrWrapSel(ta, "*");
  $("#f_i").onclick = () =>qrWrapSel(ta, "_");
  $("#f_s").onclick = () =>qrWrapSel(ta, "~");
  // Imagen: elegir, comprimir a PNG y previsualizar
  $("#f_imgbtn").onclick = () => $("#f_imgfile").click();
  $("#f_imgclear").onclick = () => { curImage = ""; $("#f_imgprev").style.display = "none"; $("#f_imgprev").src = ""; $("#f_imgclear").style.display = "none"; $("#f_imgnote").textContent = "Imagen quitada."; };
  $("#f_imgfile").onchange = () => {
    const file = $("#f_imgfile").files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900, sc = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        curImage = cv.toDataURL("image/png");
        $("#f_imgprev").src = curImage; $("#f_imgprev").style.display = "";
        $("#f_imgclear").style.display = "";
        const kb = Math.round(curImage.length * 0.75 / 1024);
        $("#f_imgnote").textContent = kb > 700 ? `Imagen pesada (~${kb} KB). Usa uno más liviano si falla al guardar.` : `Imagen lista (~${kb} KB).`;
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  };
  $("#f_save").onclick = async () => {
    const item = { nro: $("#f_nro").value.trim(), category: $("#f_cat").value.trim() || "General", title: $("#f_title").value.trim(), description: $("#f_desc").value.trim(), text: $("#f_text").value.replace(/\s+$/, "") };
    item.image = curImage || "";
    if (!item.title) { $("#f_msg").className = "msg err"; $("#f_msg").textContent = "Ponle un nombre a la respuesta."; return; }
    if (!item.text && !item.image) { $("#f_msg").className = "msg err"; $("#f_msg").textContent = "Agrega texto o una imagen."; return; }
    $("#f_save").disabled = true; $("#f_msg").className = "msg"; $("#f_msg").textContent = "Guardando…";
    try {
      if (qrEditId) await updateDoc(doc(db, "quickReplies", qrEditId), item);
      else await setDoc(doc(collection(db, "quickReplies")), item);
      close(); renderRespuestas();
    } catch (e) { $("#f_save").disabled = false; $("#f_msg").className = "msg err"; $("#f_msg").textContent = "Error al guardar" + (String(e).includes("longer than") || String(e).includes("bytes") ? ": la imagen es muy grande. Usa una más liviana." : ": " + (e.code || e.message)); }
  };
}
function importFromSheet() {
  const msg = el("qr_msg"); msg.className = "msg";
  loadConfigDoc().then(cfg => {
    const url = (cfg.sheetUrl || "").trim();
    if (!url) { msg.className = "msg err"; msg.textContent = "Primero pon la URL del puente en Configuración."; return; }
    msg.textContent = "Importando…";
    const cb = "cxcb_" + Math.abs(url.length);
    const sep = url.indexOf("?") >= 0 ? "&" : "?";
    const s = document.createElement("script");
    window[cb] = async (data) => {
      try {
        const rows = (data && data.rows) || [];
        let n = 0;
        for (const r of rows) {
          const title = (r.nombre || "").toString().trim(); const text = (r.respuesta || "").toString().trim();
          if (!title && !text) continue;
          const item = { nro: (r.nro || "").toString(), category: (r.categoria || "General").toString().trim() || "General", title, description: (r.titulo || "").toString().trim(), text };
          const existing = QR.find(x => (x.title || "").trim() === title && (x.category || "") === item.category);
          if (existing) await updateDoc(doc(db, "quickReplies", existing.id), item);
          else await setDoc(doc(collection(db, "quickReplies")), item);
          n++;
        }
        msg.className = "msg ok"; msg.textContent = `✓ ${n} respuestas importadas.`;
        renderRespuestas();
      } catch (e) { msg.className = "msg err"; msg.textContent = "Error al importar: " + (e.message || e); }
      finally { delete window[cb]; s.remove(); }
    };
    s.src = url + sep + "callback=" + cb;
    s.onerror = () => { msg.className = "msg err"; msg.textContent = "No se pudo leer el Sheet. Revisa la URL del puente."; s.remove(); };
    document.body.appendChild(s);
  });
}

// ---------- Bandeja de pendientes ----------
let bandejaFilter = { status: "", agent: "", label: "" };
function statusLabel(s) { return ({ nuevo: "Nuevo", proceso: "En proceso", cerrado: "Cerrado" })[s] || "— sin estado —"; }
async function renderBandeja() {
  await loadAll();
  const agents = USERS.filter(u =>u.active);
  const allLabels = [...new Set(CHATS.flatMap(c =>c.labels || []))].sort();
  const chats = CHATS.map(c =>c).filter(c => {
    if (bandejaFilter.status === "pendiente") { if (c.status !== "nuevo" && c.status !== "proceso") return false; }
    else if (bandejaFilter.status && c.status !== bandejaFilter.status) return false;
    if (bandejaFilter.agent === "__none" && c.assignedTo) return false;
    else if (bandejaFilter.agent && bandejaFilter.agent !== "__none" && c.assignedTo !== bandejaFilter.agent) return false;
    if (bandejaFilter.label && !(c.labels || []).includes(bandejaFilter.label)) return false;
    return true;
  }).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  const rows = chats.map(c => `<tr>
    <td>${escape(c.title || "—")}</td>
    <td>${statusLabel(c.status)}</td>
    <td>${c.assignedToName ? escape(c.assignedToName) : '<span style="color:var(--muted)">sin asignar</span>'}</td>
    <td>${(c.labels || []).map(t => `<span class="pill" style="background:var(--panel2);color:var(--txt);border:1px solid var(--line)">${escape(t)}</span>`).join(" ")}</td>
    <td>${c.updatedAt ? new Date(Date.parse(c.updatedAt)).toLocaleString("es") : "—"}</td></tr>`).join("");
  const agentOpts = agents.map(u => `<option value="${u.uid}">${escape(u.name || u.email)}</option>`).join("");
  el("v-bandeja").innerHTML = `<h1>Bandeja de chats</h1><p class="lead">Todos los chats que el equipo ha marcado, para que nada quede sin responder.</p>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <select id="b_status" class="mini" style="padding:8px">
        <option value="">Todos los estados</option>
        <option value="pendiente">Solo pendientes</option>
        <option value="nuevo">Nuevo</option><option value="proceso">En proceso</option><option value="cerrado">Cerrado</option>
      </select>
      <select id="b_agent" class="mini" style="padding:8px">
        <option value="">Todos los agentes</option><option value="__none">Sin asignar</option>${agentOpts}
      </select>
      <select id="b_label" class="mini" style="padding:8px">
        <option value="">Todas las etiquetas</option>${allLabels.map(l => `<option value="${escape(l)}">${escape(l)}</option>`).join("")}
      </select>
    </div>
    <table><thead><tr><th>Chat</th><th>Estado</th><th>Atiende</th><th>Etiquetas</th><th>Última actualización</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="color:var(--muted)">Sin chats con estos filtros.</td></tr>'}</tbody></table>`;
  el("b_status").value = bandejaFilter.status; el("b_agent").value = bandejaFilter.agent; el("b_label").value = bandejaFilter.label;
  el("b_status").onchange = () => { bandejaFilter.status = el("b_status").value; renderBandeja(); };
  el("b_agent").onchange = () => { bandejaFilter.agent = el("b_agent").value; renderBandeja(); };
  el("b_label").onchange = () => { bandejaFilter.label = el("b_label").value; renderBandeja(); };
}

// ---------- Presencia ----------
function online(u) { if (u.online !== true || !u.lastSeen) return false; const t = Date.parse(u.lastSeen); return !isNaN(t) && (Date.now() - t) < 180000; }
function timeAgo(iso) { if (!iso) return "nunca"; const t = Date.parse(iso); if (isNaN(t)) return "—"; const s = Math.floor((Date.now() - t) / 1000); if (s < 60) return "hace " + s + "s"; if (s < 3600) return "hace " + Math.floor(s / 60) + " min"; if (s < 86400) return "hace " + Math.floor(s / 3600) + " h"; return new Date(t).toLocaleString("es"); }
function fmtMin(m) { m = Number(m) || 0; const h = Math.floor(m / 60), mm = m % 60; return h ? (h + "h " + mm + "m") : (mm + "m"); }
async function renderPresence() {
  await loadAll();
  const today = new Date().toISOString().slice(0, 10);
  const conn = USERS.filter(online).length;
  const totalToday = USERS.reduce((s, u) =>s + (Number((u.dailyMinutes || {})[today]) || 0), 0);
  const rows = USERS.map(u => {
    const mins = Number((u.dailyMinutes || {})[today]) || 0;
    return `<tr><td><span class="dot ${online(u) ? "on" : ""}"></span>${escape(u.name || "—")}<div style="color:var(--muted);font-size:12px">${escape(u.email || "")}</div></td>
    <td><span class="pill ${u.role}">${u.role}</span></td>
    <td>${online(u) ? '<span style="color:var(--green)">En línea</span>' : 'Desconectado'}</td>
    <td><b>${fmtMin(mins)}</b></td>
    <td>${timeAgo(u.lastSeen)}</td></tr>`;
  }).join("");
  el("v-presence").innerHTML = `<h1>Presencia del equipo</h1><p class="lead">Quién está conectado, cuánto tiempo lleva conectado hoy y su última conexión. Recarga para actualizar.</p>
    <div class="kpis"><div class="kpi"><div class="n" style="color:var(--green)">${conn}</div><div class="l">En línea ahora</div></div>
    <div class="kpi"><div class="n">${USERS.length}</div><div class="l">Usuarios totales</div></div>
    <div class="kpi"><div class="n">${fmtMin(totalToday)}</div><div class="l">Tiempo total hoy</div></div></div>
    <table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Conectado hoy</th><th>Última conexión</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="note" style="margin-top:12px">El "conectado hoy" se cuenta mientras tienen WhatsApp Web abierto con sesión iniciada en la extensión (aprox., en minutos).</p>`;
}

// ---------- Historial de presencia (día/semana/mes) ----------
let histPeriod = 7;
async function renderHistorial() {
  await loadAll();
  const days = [];
  for (let i = 0; i < histPeriod; i++) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)); }
  const monthKey = new Date().toISOString().slice(0, 7);
  const rows = USERS.map(u => {
    const dm = u.dailyMinutes || {};
    const week7 = Object.keys(dm).filter(k =>days.includes(k)).reduce((s, k) =>s + (Number(dm[k]) || 0), 0);
    const month = Object.keys(dm).filter(k =>k.startsWith(monthKey)).reduce((s, k) =>s + (Number(dm[k]) || 0), 0);
    const cells = days.map(d => `<td style="text-align:center">${dm[d] ? fmtMin(dm[d]) : "·"}</td>`).join("");
    return `<tr><td>${escape(u.name || u.email)}</td>${cells}<td><b>${fmtMin(week7)}</b></td><td><b>${fmtMin(month)}</b></td></tr>`;
  }).join("");
  const dayHeaders = days.map(d => { const dt = new Date(d + "T00:00:00"); return `<th style="text-align:center">${dt.getDate()}/${dt.getMonth() + 1}</th>`; }).join("");
  el("v-historial").innerHTML = `<h1>Historial de conexión</h1><p class="lead">Tiempo conectado por día para analizar el trabajo del equipo (remoto). Recarga para actualizar.</p>
    <div style="margin-bottom:14px"><label style="color:var(--muted);font-size:13px;margin-right:8px">Periodo:</label>
      <select id="h_period" class="mini" style="padding:8px"><option value="7">Últimos 7 días</option><option value="14">Últimos 14 días</option><option value="30">Últimos 30 días</option></select></div>
    <div style="overflow-x:auto"><table><thead><tr><th>Agente</th>${dayHeaders}<th>Periodo</th><th>Este mes</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="3" style="color:var(--muted)">Sin datos aún.</td></tr>'}</tbody></table></div>
    <p class="note" style="margin-top:12px">Los días se muestran del más reciente al más antiguo. El historial guarda hasta ~2 meses.</p>`;
  el("h_period").value = String(histPeriod);
  el("h_period").onchange = () => { histPeriod = Number(el("h_period").value); renderHistorial(); };
}

// ---------- Reportes ----------
async function renderReports() {
  await loadAll();
  const total = CHATS.length;
  const cerrados = CHATS.filter(c =>c.status === "cerrado").length;
  const pendientes = CHATS.filter(c =>c.status === "nuevo" || c.status === "proceso").length;
  const sinAsignar = CHATS.filter(c => !c.assignedTo).length;
  const by = {};
  USERS.forEach(u =>by[u.uid] = { name: u.name || u.email, role: u.role, asignados: 0, cerrados: 0, pendientes: 0 });
  CHATS.forEach(c => { if (c.assignedTo && by[c.assignedTo]) { by[c.assignedTo].asignados++; if (c.status === "cerrado") by[c.assignedTo].cerrados++; else if (c.status === "nuevo" || c.status === "proceso") by[c.assignedTo].pendientes++; } });
  const rows = Object.values(by).map(a => `<tr><td>${escape(a.name)}</td><td><span class="pill ${a.role}">${a.role}</span></td><td>${a.asignados}</td><td>${a.pendientes}</td><td>${a.cerrados}</td></tr>`).join("");
  el("v-reports").innerHTML = `<h1>Reportes</h1><p class="lead">Chats atendidos por el equipo (según lo marcado en la extensión).</p>
    <div class="kpis">
      <div class="kpi"><div class="n">${total}</div><div class="l">Chats registrados</div></div>
      <div class="kpi"><div class="n" style="color:var(--warn)">${pendientes}</div><div class="l">Pendientes</div></div>
      <div class="kpi"><div class="n" style="color:var(--green)">${cerrados}</div><div class="l">Cerrados</div></div>
      <div class="kpi"><div class="n" style="color:var(--muted)">${sinAsignar}</div><div class="l">Sin asignar</div></div>
    </div>
    <table><thead><tr><th>Agente</th><th>Rol</th><th>Asignados</th><th>Pendientes</th><th>Cerrados</th></tr></thead><tbody>${rows || '<tr><td colspan="5" style="color:var(--muted)">Sin datos aún.</td></tr>'}</tbody></table>`;
}

// ---------- Usuarios ----------
async function renderUsers() {
  await loadAll();
  // PINs guardados (caja privada, solo admin). Si no es admin, no se cargan.
  const PINS = {};
  if (ME.role === "admin") {
    try { (await getDocs(collection(db, "userPins"))).forEach(d => { PINS[d.id] = (d.data() || {}).pin || ""; }); } catch (e) {}
  }
  const isAdmin = ME.role === "admin";
  const rows = USERS.map(u => {
    const pin = PINS[u.uid] || "";
    const pinCell = isAdmin
      ? `<div style="display:flex;flex-direction:column;gap:6px;min-width:250px">
           <div style="display:flex;gap:6px;align-items:center">
             <span style="font-size:11px;color:var(--muted);width:52px">Actual</span>
             <input class="mini pin-in" data-uid="${u.uid}" type="password" value="${escape(pin)}" placeholder="sin anotar" readonly style="width:120px;background:transparent">
             <button class="mini pin-eye" data-uid="${u.uid}" title="Mostrar u ocultar la contraseña">${ICO("eye")} Ver</button>
           </div>
           <div style="display:flex;gap:6px;align-items:center">
             <span style="font-size:11px;color:var(--muted);width:52px">Nueva</span>
             <input class="mini pin-new" data-uid="${u.uid}" type="text" placeholder="mín. 6 caracteres" style="width:120px" autocomplete="off">
             <button class="mini pin-set" data-uid="${u.uid}" title="Cambia la contraseña al instante (sin correo)">Restablecer</button>
           </div>
         </div>`
      : `<span style="color:var(--muted)">—</span>`;
    return `<tr>
    <td>${escape(u.name || "—")}<div style="color:var(--muted);font-size:12px">${escape(u.email || "")}</div></td>
    <td><select class="mini role-sel" data-uid="${u.uid}" ${u.uid === ME.uid ? "disabled" : ""}>${roleOptionsHTML(u.role)}</select></td>
    <td>${pinCell}</td>
    <td>${u.active ? '<span class="pill agent">Activo</span>' : '<span class="pill" style="background:var(--panel2);color:var(--muted);border:1px solid var(--line)">Inactivo</span>'}</td>
    <td style="white-space:nowrap">${isAdmin ? `<button class="mini" data-acceso="${u.uid}" data-nombre="${escape(u.name || "")}" data-correo="${escape(u.email || "")}" data-rol="${escape(ROLE_LABELS[u.role] || u.role || "")}" title="Copia un mensaje con los accesos para enviar por WhatsApp">${ICO("copy")} Copiar accesos</button> ` : ""}${u.uid === ME.uid ? "" : `<button class="mini" data-toggle="${u.uid}" data-s="${u.active}">${u.active ? "Desactivar" : "Activar"}</button>`}</td></tr>`;
  }).join("");
  el("v-users").innerHTML = `<h1>Usuarios</h1><p class="lead">Crea las cuentas de tu equipo y define qué ve cada rol. Los roles del panel (Admin, Supervisor, Editor, Cajero, Lector) entran aquí; el rol Agente usa la extensión de WhatsApp.</p>
    <div class="formcard">
      <h3 style="margin:0 0 14px">Crear usuario</h3>
      <label>Nombre</label><input id="u_name" placeholder="Ej. María López">
      <label>Correo</label><input id="u_email" type="email" placeholder="maria@empresa.com">
      <label>PIN / contraseña (mínimo 6)</label><input id="u_pin" placeholder="Ej. 123456">
      <label>Rol</label><select id="u_role">${roleOptionsHTML("agent")}</select>
      <p class="note" style="margin:6px 0 0">Roles del <b>panel</b>: Admin, Supervisor, Editor, Cajero, Lector. El rol <b>Agente</b> es solo para la extensión de WhatsApp (no entra al panel).</p>
      <button class="btn" id="u_create">Crear usuario</button>
      <div class="msg" id="u_msg"></div>
      <p class="note" style="margin-top:8px">El usuario queda activo al instante. Comparte con esa persona su correo y PIN para que entre a la extensión.</p>
    </div>
    <table><thead><tr><th>Usuario</th><th>Rol</th><th>PIN / Contraseña</th><th>Estado</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    ${isAdmin ? `<div class="note" style="margin-top:12px;line-height:1.6">
      <b>PIN / Contraseña</b> = tu <b>cuaderno privado</b> (solo lo ve el admin). Firebase cifra la contraseña real y nadie la puede leer, así que aquí solo la <b>anotas</b>para recordarla. <b>Anotar NO cambia la contraseña.</b><br>
      <b>¿Alguien olvidó su contraseña?</b>Toca <b>Restablecer</b>: le llega un correo a esa cuenta con un enlace para poner una nueva. Cuando la ponga, anótala aquí con el para tenerla a mano.<br>
      <span style="color:var(--muted)">Nota: para crear usuarios nuevos, el PIN que escribes sí es el de acceso desde el inicio. El problema es solo con los usuarios viejos cuya contraseña ya nadie recuerda.</span>
    </div>` : ""}
    ${isAdminStrict() ? `<div id="u_permisos" style="margin-top:26px"></div>` : ""}`;
  if (isAdminStrict()) renderPermisosMatrix();

  el("u_create").onclick = async () => {
    const name = el("u_name").value.trim(), email = el("u_email").value.trim(), pin = el("u_pin").value, role = el("u_role").value;
    const msg = el("u_msg"); msg.className = "msg";
    if (!name || !email || pin.length < 6) { msg.className = "msg err"; msg.textContent = "Completa nombre, correo y un PIN de 6+ caracteres."; return; }
    el("u_create").disabled = true; msg.textContent = "Creando…";
    try {
      const cred = await createUserWithEmailAndPassword(auth2, email, pin);
      await setDoc(doc(db, "users", cred.user.uid), { name, email, role, active: true, signature: "", createdAt: serverTimestamp() });
      try { await setDoc(doc(db, "userPins", cred.user.uid), { pin, email, updatedAt: serverTimestamp() }); } catch (e) {}
      await signOut(auth2);
      msg.className = "msg ok"; msg.textContent = "✓ Usuario creado. Dale su correo y PIN.";
      el("u_name").value = ""; el("u_email").value = ""; el("u_pin").value = "";
      renderUsers();
    } catch (e) {
      msg.className = "msg err";
      msg.textContent = e.code === "auth/email-already-in-use" ? "Ese correo ya está registrado." : ("Error: " + (e.code || e.message));
    } finally { el("u_create").disabled = false; }
  };
  document.querySelectorAll(".role-sel").forEach(s =>s.onchange = async () => { await updateDoc(doc(db, "users", s.dataset.uid), { role: s.value }); renderUsers(); });
  document.querySelectorAll("[data-toggle]").forEach(b =>b.onclick = async () => { await updateDoc(doc(db, "users", b.dataset.toggle), { active: b.dataset.s !== "true" }); renderUsers(); });
  // Mensaje de accesos listo para WhatsApp (usa la contraseña anotada en la columna PIN)
  document.querySelectorAll("[data-acceso]").forEach(b => b.onclick = async () => {
    const uid = b.dataset.acceso, u = { name: b.dataset.nombre, email: b.dataset.correo, rolTxt: b.dataset.rol };
    const fila = b.closest("tr"), i = fila && fila.querySelector(".pin-in");
    const pin = (i && i.value) || "";
    if (!pin && !confirm("Este usuario no tiene contraseña anotada en la columna PIN.\n\n¿Copiar el mensaje igual (con la contraseña en blanco)?")) return;
    const msg = [
      "*Accesos Panel & CRM*:",
      "*Link CRM*: https://microsoftedge.microsoft.com/addons/detail/nummeros-by-contax-%E2%80%94-crm-/hhhomdbjhagdapmfkgajimjcnbpamlpj",
      "*Link Panel*: https://nummerospanel.contaxbolivia.com/",
      "*Usuario*: " + (u.name || "—"),
      "*Correo*: " + (u.email || "—"),
      "*Contraseña*: " + (pin || "_______"),
      "*Rol*: " + (u.rolTxt || "—")
    ].join("\n");
    try { await navigator.clipboard.writeText(msg); const o = b.innerHTML; b.innerHTML = ICO("check") + " Copiado"; setTimeout(() => { b.innerHTML = o; }, 2000); }
    catch (e) { prompt("Copia este mensaje:", msg); }
  });
  document.querySelectorAll(".pin-eye").forEach(e => e.onclick = () => {
    const fe = e.closest("tr"), i = fe && fe.querySelector(".pin-in");
    if (!i) return; const ver = i.type === "password"; i.type = ver ? "text" : "password"; e.innerHTML = ver ? ICO("eyeOff") + " Ocultar" : ICO("eye") + " Ver";
  });
  // Cambia la contraseña al instante (vía el script de Apps Script, que verifica que seas Admin)
  document.querySelectorAll(".pin-set").forEach(b => b.onclick = async () => {
    const uid = b.dataset.uid, u = USERS.find(x => x.uid === uid) || {};
    const filaN = b.closest("tr"), inp = filaN && filaN.querySelector(".pin-new"), nueva = (inp && inp.value || "").trim();
    if (nueva.length < 6) { alert("La nueva contraseña debe tener al menos 6 caracteres."); if (inp) inp.focus(); return; }
    if (!confirm(`¿Cambiar la contraseña de ${u.name || u.email} a:\n\n${nueva}\n\nSe cerrará su sesión en el panel y en el CRM, y tendrá que entrar con la nueva.`)) return;
    const url = await recibosUrlGet();
    if (!url) { alert("Falta la URL del script en Configuración → Conexiones (Recibos por correo)."); return; }
    b.disabled = true; const o = b.innerHTML; b.textContent = "Cambiando…";
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "admin_set_password", idToken, uid, password: nueva }) }).then(x => x.json());
      if (!r.ok) throw new Error(r.error || "No se pudo cambiar.");
      const actual = filaN && filaN.querySelector(".pin-in"); if (actual) { actual.value = nueva; actual.type = "text"; }
      if (inp) inp.value = "";
      b.innerHTML = ICO("check") + " Listo"; setTimeout(() => { b.innerHTML = o; b.disabled = false; }, 2500);
    } catch (e) { b.innerHTML = o; b.disabled = false; alert("No se pudo cambiar la contraseña:\n" + (e.message || e)); }
  });

}

// ---------- Permisos por rol (qué pestañas ve cada rol) ----------
const PERM_ROLES = ["supervisor", "editor", "cajero", "lector"]; // admin siempre ve todo
let permWork = null; // copia de trabajo { rol: [views] }
async function renderPermisosMatrix() {
  const box = el("u_permisos"); if (!box) return;
  // Copia de trabajo desde lo configurado (o defaults)
  permWork = {};
  PERM_ROLES.forEach(r => { permWork[r] = (roleViewsFor(r) || []).slice(); });
  paintPermisosMatrix();
}
function paintPermisosMatrix() {
  const box = el("u_permisos"); if (!box) return;
  const head = `<tr><th style="text-align:left">Pestaña</th>${PERM_ROLES.map(r => `<th style="text-align:center">${ROLE_LABELS[r]}</th>`).join("")}</tr>`;
  let body = "";
  NAV_SECTIONS.forEach(sec => {
    body += `<tr><td colspan="${PERM_ROLES.length + 1}" style="background:var(--panel2);font-weight:700;font-size:12px;letter-spacing:.04em;color:var(--muted);padding:8px 10px">${sec.label}</td></tr>`;
    sec.views.forEach(v => {
      body += `<tr><td>${VIEW_LABELS[v] || v}</td>${PERM_ROLES.map(r => {
        const on = permWork[r].indexOf(v) >= 0;
        return `<td style="text-align:center"><input type="checkbox" class="perm-chk" data-role="${r}" data-view="${v}" ${on ? "checked" : ""} style="width:auto"></td>`;
      }).join("")}</tr>`;
    });
  });
  box.innerHTML = `<div class="formcard" style="max-width:none">
    <h3 style="margin:0 0 6px">Permisos por rol — qué pestañas ve cada quién</h3>
    <p class="note" style="margin:0 0 12px">Marca las pestañas que cada rol puede <b>ver</b>. <b>Admin</b> siempre ve todo. Cuando un usuario entre, solo verá lo marcado para su rol. (La edición/borrado sigue protegida por rol y por las reglas de seguridad de Firestore.)</p>
    <div style="overflow-x:auto"><table style="min-width:520px"><thead>${head}</thead><tbody>${body}</tbody></table></div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:14px;flex-wrap:wrap">
      <button class="btn" id="perm_save">Guardar permisos</button>
      <button class="btn sec" id="perm_reset" style="border:1px solid var(--line)">Restaurar valores por defecto</button>
      <span class="msg" id="perm_msg"></span>
    </div>
  </div>`;
  box.querySelectorAll(".perm-chk").forEach(c => c.onchange = () => {
    const r = c.dataset.role, v = c.dataset.view;
    const arr = permWork[r]; const i = arr.indexOf(v);
    if (c.checked && i < 0) arr.push(v); else if (!c.checked && i >= 0) arr.splice(i, 1);
  });
  el("perm_reset").onclick = () => { PERM_ROLES.forEach(r => { permWork[r] = (DEFAULT_ROLE_VIEWS[r] || []).slice(); }); paintPermisosMatrix(); };
  el("perm_save").onclick = async () => {
    const msg = el("perm_msg"); msg.className = "msg"; msg.textContent = "Guardando…";
    const perms = { admin: ALL_VIEWS.slice() };
    PERM_ROLES.forEach(r => { perms[r] = permWork[r].slice(); });
    try {
      await setDoc(doc(db, "config", "app"), { rolePerms: perms, updatedAt: serverTimestamp() }, { merge: true });
      ROLE_VIEWS = perms;
      buildNav(); // refleja los cambios en el menú de inmediato
      msg.className = "msg ok"; msg.textContent = "✓ Permisos guardados. Cada rol verá solo lo marcado la próxima vez que entre.";
    } catch (e) { msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message) + " (solo el administrador puede cambiar permisos)."; }
  };
}

// ---------- Configuración IA ----------
const AI_MODELS = {
  deepseek: [["deepseek-chat", "deepseek-chat (recomendado)"], ["deepseek-reasoner", "deepseek-reasoner (razonamiento)"]],
  gemini: [["gemini-2.5-flash", "gemini-2.5-flash (recomendado)"], ["gemini-2.5-pro", "gemini-2.5-pro (más potente)"], ["gemini-flash-latest", "gemini-flash-latest (siempre el más nuevo)"], ["gemini-2.0-flash", "gemini-2.0-flash (antiguo)"]]
};
const AI_HELP = {
  deepseek: 'Consigue tu clave en <a href="https://platform.deepseek.com/api_keys" target="_blank" style="color:var(--green)">platform.deepseek.com</a> (crea cuenta, agrega saldo — es muy barato — y crea una API key). Empieza con <code>sk-</code>.',
  gemini: 'Consigue tu clave gratis en <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--green)">aistudio.google.com/app/apikey</a>. Empieza con <code>AIza</code>.'
};
async function renderConfig() {
  let cfg = {};
  try { const s = await getDoc(doc(db, "config", "app")); if (s.exists()) cfg = s.data(); } catch (e) {}
  const provider = cfg.provider || (cfg.geminiKey ? "gemini" : "deepseek");
  const curKey = cfg.aiKey || cfg.geminiKey || "";
  const curModel = cfg.aiModel || cfg.geminiModel || "";
  el("v-config").innerHTML = `<h1>Configuración</h1><p class="lead">Todo lo del sistema en un solo lugar, ordenado por secciones. Pones las claves y conexiones UNA vez y funciona para TODO el equipo.</p>
    <div class="subtabs" id="cfgtabs">
      <button class="subtab on" data-pane="ia">IA</button>
      <button class="subtab" data-pane="empresa">Empresa</button>
      <button class="subtab" data-pane="conexiones">Conexiones</button>
      <button class="subtab" data-pane="recepcion">Recepción</button>
      <button class="subtab" data-pane="conocimiento">Conocimiento IA</button>
    </div>
    <div class="cfgpane" data-pane="ia">
    <div class="formcard">
      <label>Proveedor de IA</label>
      <select id="c_provider">
        <option value="deepseek">DeepSeek (barato)</option>
        <option value="gemini">Google Gemini (gratis)</option>
      </select>
      <label>Clave (API key)</label>
      <input id="c_key" type="password" placeholder="Pega aquí tu clave" value="${escape(curKey)}">
      <label>Modelo</label>
      <select id="c_model"></select>
      <button class="btn" id="c_save">Guardar</button>
      <div class="msg" id="c_msg"></div>
      <p class="note" id="c_help" style="margin-top:10px"></p>
    </div>
    <div class="formcard">
      <h3 style="margin:0 0 6px">Clave de Gemini para leer comprobantes (opcional)</h3>
      <p class="note" style="margin:0 0 12px">Si tu IA principal (arriba) es DeepSeek, DeepSeek no puede leer imágenes. Pega aquí una clave de <b>Gemini</b>(empieza con <code>AIza</code>) que se usará <b>solo</b>para el lector de comprobantes del CRM. Todo lo demás sigue con la IA principal.</p>
      <label>Clave de Gemini (solo lector de comprobantes)</label>
      <input id="c_vision" type="password" placeholder="AIza… (déjalo vacío si tu IA principal ya es Gemini)" value="${escape(cfg.visionKey || "")}">
      <label style="margin-top:10px">Modelo para leer comprobantes (pasarela y Recepción)</label>
      <select id="c_vmodel">${[["auto", "Automático: el más rápido disponible (recomendado)"], ["gemini-flash-lite-latest", "Gemini Flash-Lite (última versión) · el más rápido"], ["gemini-flash-latest", "Gemini Flash (última versión) · más preciso"]].map(([v, l]) => `<option value="${v}" ${(/latest|auto/.test(cfg.visionModel || "") ? cfg.visionModel : "auto") === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <p class="note" style="margin:8px 0 10px">Para que lea en 2 a 4 segundos sin esperas, activa la <b>facturación</b> en Google AI Studio para el proyecto de esta clave (la misma clave pasa a ser de pago; no hay que cambiarla aquí). Si creas una clave nueva en un proyecto con facturación, pégala arriba.</p>
      <button class="btn" id="c_visionsave">Guardar clave de comprobantes</button>
      <button class="btn sec" id="c_visiontest" style="border:1px solid var(--line)">Probar velocidad</button>
      <div class="msg" id="c_visionmsg"></div>
    </div>
    </div>
    <div class="cfgpane" data-pane="empresa" style="display:none">
    <div class="formcard">
      <h3 style="margin:0 0 6px">Datos de la empresa</h3>
      <p class="note" style="margin:0 0 12px">El nombre se usa en la variable <code>{empresa}</code>de las respuestas rápidas.</p>
      <label>Nombre de la empresa</label>
      <input id="c_company" placeholder="Ej. CONTAX" value="${escape(cfg.company || "")}">
      <button class="btn" id="c_csave">Guardar empresa</button>
      <div class="msg" id="c_cmsg"></div>
    </div>
    </div>
    <div class="cfgpane" data-pane="conexiones" style="display:none">
    <div class="formcard">
      <h3 style="margin:0 0 6px">Sistema Contable (sistema.contaxbolivia.com)</h3>
      <p class="note" style="margin:0 0 12px">El Sistema Contable lee automáticamente la lista de <b>Estados Financieros</b> del panel y puede cambiar su estado (Pendiente / En proceso / Entregado). En el Sistema Contable, pestaña <b>Lista EEFF → Panel NUMMEROS</b>, pega esta clave una sola vez.</p>
      ${isAdmin() ? `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="c_siskey" readonly value="${escape(cfg.sistemaKey || "")}" placeholder="Aún no hay clave" style="flex:1;min-width:240px;font-family:monospace">
        <button class="btn sec" id="c_siscopy" style="border:1px solid var(--line)">Copiar</button><button class="btn" id="c_sisgen">${cfg.sistemaKey ? "Generar otra clave" : "Generar clave"}</button></div>
        <div class="msg" id="c_sismsg"></div>` : `<p class="note">Solo el administrador puede ver la clave.</p>`}
    </div>
    <div class="formcard">
      <p class="note" style="margin:0">La Base de Datos y las Respuestas rápidas ahora viven 100% en la nube (Firebase); ya no necesitas puentes de Google Sheets para ellas. Aquí solo queda el puente de Recibos por correo.</p>
    </div>
    <div class="formcard">
      <h3 style="margin:0 0 6px">Recibos por correo (Gmail CONTAX)</h3>
      <p class="note" style="margin:0 0 12px">Pega la URL del "puente" de recibos (Apps Script <b>PUENTE-RECIBOS.gs</b>) publicado desde la cuenta de Gmail de CONTAX.
      Con esto la pestaña <b>Recepción</b>envía automáticamente el recibo en PDF al correo del cliente cuando registras un pago.
      Si lo dejas vacío, igual se registra el pago pero no se envía el correo.</p>
      <label>URL del puente de Recibos (…/exec)</label>
      <input id="c_recibos" placeholder="https://script.google.com/macros/s/…/exec" value="${escape(cfg.recibosUrl || "")}">
      <button class="btn" id="c_recibossave">Guardar URL</button>
      <div class="msg" id="c_recibosmsg"></div>
    </div>
    </div>
    <div class="cfgpane" data-pane="recepcion" style="display:none">
    <div class="formcard">
      <h3 style="margin:0 0 6px">Recepción — Numeración automática</h3>
      <p class="note" style="margin:0 0 12px">Define desde qué número siguen el <b>N° de Recepción</b>y el <b>N° de Comprobante/Recibo</b>, y el <b>N° de Gasto</b>(Egresos). El sistema usa el número y sube +1 solo en cada registro.</p>
      <div class="grid3">
        <div class="field"><label>Próximo N° Recepción</label><input id="c_nrec" type="number" value="${escape(String(cfg.nextRecep != null ? cfg.nextRecep : 7048))}"></div>
        <div class="field"><label>Próximo N° Comprobante</label><input id="c_ncom" type="number" value="${escape(String(cfg.nextRecibo != null ? cfg.nextRecibo : 7784))}"></div>
        <div class="field"><label>Próximo N° Gasto (Egresos)</label><input id="c_ngas" type="number" value="${escape(String(cfg.nextGasto != null ? cfg.nextGasto : 1002))}"></div>
      </div>
      <button class="btn" id="c_numsave">Guardar numeración</button>
      <div class="msg" id="c_nummsg"></div>
    </div>
    <div class="formcard">
      <h3 style="margin:0 0 6px">Recepción — Listas desplegables</h3>
      <p class="note" style="margin:0 0 12px">Un valor por línea. Estas listas aparecen en Recepción y Egresos. Si dejas una vacía, se usan los valores por defecto. El <b>Detalle de servicio</b> ahora está separado por categoría: en Recepción se muestra solo el detalle que corresponde al servicio elegido.</p>
      <div class="field"><label>Servicios (SERVICIOS CONTAX)</label><textarea id="c_l_servicios" style="min-height:90px">${escape((recListas(cfg).servicios).join("\n"))}</textarea></div>
      <div class="grid2">
        <div class="field"><label>Detalle — Declaraciones</label><textarea id="c_l_detdecl" style="min-height:110px">${escape((recListas(cfg).detallesDeclaracion).join("\n"))}</textarea></div>
        <div class="field"><label>Detalle — Trámites</label><textarea id="c_l_dettram" style="min-height:110px">${escape((recListas(cfg).detallesTramite).join("\n"))}</textarea></div>
        <div class="field"><label>Detalle — Balances (EEFF)</label><textarea id="c_l_detbal" style="min-height:110px">${escape((recListas(cfg).detallesBalance).join("\n"))}</textarea></div>
        <div class="field"><label>Detalle — Facturación</label><textarea id="c_l_detfact" style="min-height:110px">${escape((recListas(cfg).detallesFacturacion).join("\n"))}</textarea></div>
      </div>
      <div class="grid3">
        <div class="field"><label>Formas de pago</label><textarea id="c_l_pagos" style="min-height:90px">${escape((recListas(cfg).pagos).join("\n"))}</textarea></div>
        <div class="field"><label>Atención (personas)</label><textarea id="c_l_atencion" style="min-height:90px">${escape((recListas(cfg).atencion).join("\n"))}</textarea></div>
        <div class="field"><label>Cuentas contables (Egresos)</label><textarea id="c_l_cuentas" style="min-height:90px">${escape((recListas(cfg).cuentas).join("\n"))}</textarea></div>
      </div>
      <button class="btn" id="c_listsave">Guardar listas</button>
      <div class="msg" id="c_listmsg"></div>
    </div>
    </div>
    <div class="cfgpane" data-pane="conocimiento" style="display:none">
    <div class="formcard">
      <h3 style="margin:0 0 6px">Conocimiento de la empresa (para la IA)</h3>
      <p class="note" style="margin:0 0 12px">Escribe aquí todo lo que la IA debe saber de tu empresa: qué es CONTAX, servicios y precios,
      formas de pago, horarios, procedimientos, tono de respuesta, datos de contacto, preguntas frecuentes, etc.
      La IA usará esto como base en <b>Consultar</b>, <b>Sugerir</b>, <b>Mejorar</b>y <b>Resumir</b>, para todo el equipo.</p>
      <textarea id="c_context" style="width:100%;min-height:220px;padding:12px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;color:var(--txt);font-size:13px;line-height:1.5;font-family:inherit" placeholder="Ej:
CONTAX es una empresa de contabilidad e impuestos en Santa Cruz, Bolivia.
Servicios: declaraciones mensuales, RCV, balances, trámites SEPREC/SIAT, emisión y verificación de facturas, asesoramiento.
Precios: declaración mensual desde Bs 50; balance desde Bs …
Formas de pago: QR / transferencia. Enviar comprobante por WhatsApp.
Horario: Lun-Vie 8:30-18:00.
Tono: cordial, claro y profesional. Tratar de 'usted'.
Contacto: …">${escape(cfg.aiContext || "")}</textarea>
      <button class="btn" id="c_ctxsave">Guardar conocimiento</button>
      <div class="msg" id="c_ctxmsg"></div>
    </div>
    </div>`;
  // Subpestañas de Configuración
  el("v-config").querySelectorAll("#cfgtabs .subtab").forEach(b => b.onclick = () => {
    el("v-config").querySelectorAll("#cfgtabs .subtab").forEach(x => x.classList.toggle("on", x === b));
    el("v-config").querySelectorAll(".cfgpane").forEach(p => p.style.display = (p.dataset.pane === b.dataset.pane ? "" : "none"));
  });
  const provSel = el("c_provider"); provSel.value = provider;
  function fillModels() {
    const p = provSel.value;
    el("c_model").innerHTML = AI_MODELS[p].map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
    if (curModel && AI_MODELS[p].some(m =>m[0] === curModel)) el("c_model").value = curModel;
    el("c_help").innerHTML = AI_HELP[p];
  }
  fillModels();
  provSel.onchange = fillModels;
  el("c_save").onclick = async () => {
    const msg = el("c_msg"); msg.className = "msg"; msg.textContent = "Guardando…";
    try {
      await setDoc(doc(db, "config", "app"), { provider: provSel.value, aiKey: el("c_key").value.trim(), aiModel: el("c_model").value, updatedAt: serverTimestamp() }, { merge: true });
      msg.className = "msg ok"; msg.textContent = "✓ Guardado. La IA ya funciona para todo el equipo.";
    } catch (e) { msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
  };
  if (el("c_siscopy")) el("c_siscopy").onclick = () => { try { navigator.clipboard.writeText(el("c_siskey").value); el("c_sismsg").className = "msg ok"; el("c_sismsg").textContent = "Clave copiada."; } catch (e) {} };
  if (el("c_sisgen")) el("c_sisgen").onclick = async () => {
    if (el("c_siskey").value && !confirm("Si generas otra clave, el Sistema Contable dejará de conectarse hasta que pegues la nueva. ¿Continuar?")) return;
    const a = new Uint8Array(18); crypto.getRandomValues(a);
    const k = "sis_" + Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
    try { await setDoc(doc(db, "config", "app"), { sistemaKey: k, updatedAt: serverTimestamp() }, { merge: true }); el("c_siskey").value = k; el("c_sismsg").className = "msg ok"; el("c_sismsg").textContent = "Clave lista. Cópiala y pégala en el Sistema Contable (la conexión toma hasta 2 minutos en activarse)."; }
    catch (e) { el("c_sismsg").className = "msg err"; el("c_sismsg").textContent = "Error: " + (e.code || e.message); }
  };
  el("c_visionsave").onclick = async () => {
    const msg = el("c_visionmsg"); msg.className = "msg"; msg.textContent = "Guardando…";
    try { await setDoc(doc(db, "config", "app"), { visionKey: el("c_vision").value.trim(), visionModel: el("c_vmodel").value, updatedAt: serverTimestamp() }, { merge: true }); msg.className = "msg ok"; msg.textContent = "Guardado. La pasarela lo usa en máximo 2 minutos."; }
    catch (e) { msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
  };
  el("c_visiontest").onclick = async () => {
    const msg = el("c_visionmsg"), key = el("c_vision").value.trim(), model = el("c_vmodel").value === "auto" ? "gemini-flash-lite-latest" : el("c_vmodel").value;
    if (!key) { msg.className = "msg err"; msg.textContent = "Pega primero la clave."; return; }
    msg.className = "msg"; msg.textContent = "Probando " + model + "…";
    // Imagen de prueba pequeña con un texto de comprobante (se dibuja aquí mismo)
    const cv = document.createElement("canvas"); cv.width = 600; cv.height = 300; const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, 600, 300); g.fillStyle = "#000"; g.font = "22px sans-serif";
    ["Banco Nacional de Bolivia", "Transferencia QR exitosa", "Importe: Bs 50.00", "Destino: CONTAX SRL", "Fecha: 26/10/2026 20:15", "Nro. operacion: 00123456"].forEach((t, i) => g.fillText(t, 30, 45 + i * 42));
    const b64 = cv.toDataURL("image/jpeg", 0.8).split(",")[1];
    const gen = { temperature: 0.1, maxOutputTokens: 300, responseMimeType: "application/json" };
    const t0 = performance.now();
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: 'Lee el comprobante. Responde solo JSON {"importe":"","destino":"","nroOperacion":""}' }, { inline_data: { mime_type: "image/jpeg", data: b64 } }] }], generationConfig: gen }) });
      const ms = Math.round(performance.now() - t0), txt = await r.text();
      if (r.ok) { msg.className = "msg ok"; msg.textContent = `Respondió en ${(ms / 1000).toFixed(1)} segundos. ` + (ms > 6000 ? "Es lento: activa la facturación de la clave en Google AI Studio." : "Velocidad buena."); }
      else { msg.className = "msg err"; msg.textContent = `Error ${r.status} en ${(ms / 1000).toFixed(1)} s` + (r.status === 429 ? ": se acabó el límite gratuito. Activa la facturación en Google AI Studio." : r.status === 503 ? ": Google está saturado (pasa más en el plan gratuito)." : ": " + txt.slice(0, 160)); }
    } catch (e) { msg.className = "msg err"; msg.textContent = "No se pudo conectar: " + e.message; }
  };
  el("c_csave").onclick = async () => {
    const msg = el("c_cmsg"); msg.className = "msg"; msg.textContent = "Guardando…";
    try { await setDoc(doc(db, "config", "app"), { company: el("c_company").value.trim(), updatedAt: serverTimestamp() }, { merge: true }); msg.className = "msg ok"; msg.textContent = "✓ Empresa guardada."; }
    catch (e) { msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
  };
  el("c_recibossave").onclick = async () => {
    const msg = el("c_recibosmsg"); msg.className = "msg"; msg.textContent = "Guardando…";
    try { await setDoc(doc(db, "config", "app"), { recibosUrl: el("c_recibos").value.trim(), updatedAt: serverTimestamp() }, { merge: true }); msg.className = "msg ok"; msg.textContent = "✓ URL guardada. La pestaña Recepción ya puede enviar recibos."; }
    catch (e) { msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
  };
  el("c_numsave").onclick = async () => {
    const msg = el("c_nummsg"); msg.className = "msg"; msg.textContent = "Guardando…";
    try { await setDoc(doc(db, "config", "app"), { nextRecep: parseInt(el("c_nrec").value, 10) || 1, nextRecibo: parseInt(el("c_ncom").value, 10) || 1, nextGasto: parseInt(el("c_ngas").value, 10) || 1, updatedAt: serverTimestamp() }, { merge: true }); msg.className = "msg ok"; msg.textContent = "✓ Numeración guardada."; }
    catch (e) { msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
  };
  el("c_listsave").onclick = async () => {
    const msg = el("c_listmsg"); msg.className = "msg"; msg.textContent = "Guardando…";
    const toArr = id => (el(id) ? el(id).value : "").split("\n").map(s => s.trim()).filter(Boolean);
    const recListasVal = {
      servicios: toArr("c_l_servicios"),
      detallesDeclaracion: toArr("c_l_detdecl"), detallesTramite: toArr("c_l_dettram"),
      detallesBalance: toArr("c_l_detbal"), detallesFacturacion: toArr("c_l_detfact"),
      pagos: toArr("c_l_pagos"), atencion: toArr("c_l_atencion"), cuentas: toArr("c_l_cuentas")
    };
    try { await setDoc(doc(db, "config", "app"), { recListas: recListasVal, updatedAt: serverTimestamp() }, { merge: true }); msg.className = "msg ok"; msg.textContent = "✓ Listas guardadas. Ya aparecen en Recepción y Egresos."; }
    catch (e) { msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
  };
  el("c_ctxsave").onclick = async () => {
    const msg = el("c_ctxmsg"); msg.className = "msg"; msg.textContent = "Guardando…";
    try { await setDoc(doc(db, "config", "app"), { aiContext: el("c_context").value, updatedAt: serverTimestamp() }, { merge: true }); msg.className = "msg ok"; msg.textContent = "✓ Conocimiento guardado. La IA ya lo usa para todo el equipo."; }
    catch (e) { msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
  };
}

// ============================================================
//  MÓDULO CLIENTES (Portal) — base de datos BDCONTAX en Firebase
// ============================================================
let CLIENTES = [], cliFilter = "", cliEstado = "", cliTipo = "";

// Campos del cliente (clave interna, etiqueta, grupo, tipo)
const CLI_FIELDS = [
  ["codigoId", "Código ID", "Cliente", "text"],
  ["nit", "NIT", "Cliente", "text"],
  ["nombre", "Nombre o Razón Social", "Cliente", "text"],
  ["telefono", "Teléfono", "Cliente", "text"],
  ["correo", "Correo electrónico", "Cliente", "text"],
  ["tipoContribuyente", "Tipo de contribuyente", "Actividad", "text"],
  ["actividadPrincipal", "Actividad principal", "Actividad", "text"],
  ["actividadSecundaria", "Actividad secundaria", "Actividad", "text"],
  ["brindaServiciosA", "Brinda servicios a", "Actividad", "text"],
  ["fechaAperturaNit", "Fecha apertura NIT", "Actividad", "text"],
  ["usuario", "Usuario (impuestos)", "Actividad", "text"],
  ["password", "Contraseña (impuestos)", "Actividad", "secret"],
  ["passwordSiat", "Contraseña SIAT", "Actividad", "secret"],
  ["inicioCapital", "Inicio de capital", "SEPREC", "text"],
  ["estadoMatricula", "Estado de la matrícula SEPREC", "SEPREC", "text"],
  ["correoSeprec", "Correo SEPREC", "SEPREC", "text"],
  ["usuarioSeprec", "Usuario SEPREC", "SEPREC", "text"],
  ["passwordSeprec", "Contraseña SEPREC", "SEPREC", "secret"],
  ["contratosServicio", "Contratos de servicio", "Adicionales", "text"],
  ["estadoUsuario", "Estado del cliente", "Adicionales", "estado"],
  ["costoMensual", "Costo servicio mensual (Bs)", "Adicionales", "text"],
  ["fileUrl", "Carpeta / archivos (Drive URL)", "Adicionales", "text"],
  ["comentarios", "Comentarios", "Adicionales", "textarea"]
];
const CLI_GROUPS = ["Cliente", "Actividad", "SEPREC", "Adicionales"];

function cliIsActivo(c) { return /^activo/i.test(String(c.estadoUsuario || "").trim()); }
function cliMoney(v) {
  let s = String(v == null ? "" : v).replace(/\s/g, "");
  s = s.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const n = parseFloat(s); return isNaN(n) ? 0 : n;
}
function fmtBs(n) { return "Bs " + (Number(n) || 0).toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

async function loadClientes() {
  CLIENTES = [];
  try { (await getDocs(collection(db, "clientes"))).forEach(d =>CLIENTES.push({ id: d.id, ...d.data() })); } catch (e) {}
  CLIENTES.sort((a, b) => (Number(a.codigoId) || 9e9) - (Number(b.codigoId) || 9e9) || String(a.nombre || "").localeCompare(String(b.nombre || "")));
}

async function renderClientes() {
  await loadClientes();
  const canEdit = canEditClientes();
  const isAdmin = ME.role === "admin";
  const term = cliFilter.toLowerCase().trim();
  const tipos = [...new Set(CLIENTES.map(c => (c.tipoContribuyente || "").trim()).filter(Boolean))].sort();
  const estados = [...new Set(CLIENTES.map(c => (c.estadoUsuario || "").trim()).filter(Boolean))].sort();
  const list = CLIENTES.filter(c => {
    if (cliEstado === "__activo" && !cliIsActivo(c)) return false;
    if (cliEstado === "__inactivo" && cliIsActivo(c)) return false;
    if (cliEstado && cliEstado.indexOf("__") !== 0 && (c.estadoUsuario || "").trim() !== cliEstado) return false;
    if (cliTipo && (c.tipoContribuyente || "").trim() !== cliTipo) return false;
    if (term && !`${c.codigoId} ${c.nit} ${c.nombre} ${c.telefono} ${c.correo} ${c.actividadPrincipal}`.toLowerCase().includes(term)) return false;
    return true;
  });
  const total = CLIENTES.length;
  const activos = CLIENTES.filter(cliIsActivo).length;
  const ingreso = CLIENTES.filter(cliIsActivo).reduce((s, c) =>s + cliMoney(c.costoMensual), 0);

  const rows = list.map(c => `<tr class="clienterow" data-open="${c.id}" style="cursor:pointer">
    <td>${escape(c.codigoId || "—")}</td>
    <td><b>${escape(c.nombre || "—")}</b>${c.nit ? `<div style="color:var(--muted);font-size:12px">NIT ${escape(c.nit)}</div>` : ""}</td>
    <td>${escape(c.telefono || "—")}</td>
    <td>${escape((c.tipoContribuyente || "—"))}</td>
    <td><span class="badge ${cliIsActivo(c) ? "ok" : "off"}">${escape(c.estadoUsuario || "—")}</span></td>
    <td style="text-align:right">${c.costoMensual ? escape(String(c.costoMensual)) : "—"}</td>
    <td style="white-space:nowrap" data-stop="1">
      <button class="mini" data-edit="${c.id}">${canEdit ? "Editar" : "Ver"}</button>
      ${isAdmin ? `<button class="mini" data-del="${c.id}">Borrar</button>` : ""}
    </td></tr>`).join("");

  el("v-clientes").innerHTML = `<h1>Clientes</h1>
    <p class="lead">Tu base de datos de clientes (BDCONTAX), guardada en Firebase y compartida con tu equipo según su rol.</p>
    <div class="kpis">
      <div class="kpi"><div class="n">${total}</div><div class="l">Clientes registrados</div></div>
      <div class="kpi"><div class="n" style="color:var(--green)">${activos}</div><div class="l">Activos</div></div>
      <div class="kpi"><div class="n" style="color:var(--warn)">${total - activos}</div><div class="l">Inactivos</div></div>
      <div class="kpi"><div class="n">${fmtBs(ingreso)}</div><div class="l">Ingreso mensual (activos)</div></div>
    </div>
    <div class="toolbar">
      <input id="cli_search" class="mini" style="padding:9px;min-width:240px" placeholder="Buscar por nombre, NIT, código, teléfono…" value="${escape(cliFilter)}">
      <select id="cli_estado" class="mini" style="padding:9px">
        <option value="">Todos los estados</option>
        <option value="__activo">Solo activos</option>
        <option value="__inactivo">Solo inactivos</option>
        ${estados.map(e => `<option value="${escape(e)}">${escape(e)}</option>`).join("")}
      </select>
      <select id="cli_tipo" class="mini" style="padding:9px">
        <option value="">Todos los tipos</option>
        ${tipos.map(t => `<option value="${escape(t)}">${escape(t)}</option>`).join("")}
      </select>
      ${canEdit ? '<button class="btn" id="cli_new">＋ Nuevo cliente</button>' : ""}
      ${canEdit ? '<button class="btn sec" id="cli_import" style="border:1px solid var(--line)">Importar CSV</button>' : ""}
      <button class="btn sec" id="cli_export" style="border:1px solid var(--line)">Exportar CSV</button>
      <span class="msg" id="cli_msg" style="align-self:center"></span>
    </div>
    <div style="overflow-x:auto"><table>
      <thead><tr><th>Código</th><th>Cliente</th><th>Teléfono</th><th>Tipo</th><th>Estado</th><th style="text-align:right">Costo/mes</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7" style="color:var(--muted)">${total ? "Sin clientes con estos filtros." : "Aún no hay clientes. Usa “Importar CSV” para cargar tu base, o “＋ Nuevo cliente”."}</td></tr>`}</tbody>
    </table></div>
    <p class="note" style="margin-top:10px">Mostrando ${list.length} de ${total}. Toca una fila para ver la ficha completa.</p>`;

  el("cli_search").oninput = () => { cliFilter = el("cli_search").value; renderClientes(); };
  el("cli_estado").value = cliEstado; el("cli_estado").onchange = () => { cliEstado = el("cli_estado").value; renderClientes(); };
  el("cli_tipo").value = cliTipo; el("cli_tipo").onchange = () => { cliTipo = el("cli_tipo").value; renderClientes(); };
  if (el("cli_new")) el("cli_new").onclick = () =>openClienteModal(null);
  if (el("cli_import")) el("cli_import").onclick = importClientesCSV;
  el("cli_export").onclick = exportClientesCSV;
  el("v-clientes").querySelectorAll("[data-edit]").forEach(b =>b.onclick = (e) => { e.stopPropagation(); openClienteModal(CLIENTES.find(x =>x.id === b.dataset.edit)); });
  el("v-clientes").querySelectorAll("[data-del]").forEach(b =>b.onclick = (e) => { e.stopPropagation(); delCliente(CLIENTES.find(x =>x.id === b.dataset.del)); });
  el("v-clientes").querySelectorAll("[data-open]").forEach(r =>r.onclick = () =>openClienteModal(CLIENTES.find(x =>x.id === r.dataset.open)));
}

function openClienteModal(c) {
  const canEdit = canEditClientes();
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  const groupsHtml = CLI_GROUPS.map(g => {
    const fields = CLI_FIELDS.filter(f =>f[2] === g);
    const inputs = fields.map(([key, label, , type]) => {
      const val = escape(c ? (c[key] != null ? c[key] : "") : "");
      const dis = canEdit ? "" : "disabled";
      if (type === "textarea") return `<div class="field" style="grid-column:1/-1"><label>${label}</label><textarea id="cf_${key}" style="min-height:70px" ${dis}>${val}</textarea></div>`;
      if (type === "secret") return `<div class="field"><label>${label}</label><input id="cf_${key}" type="password" value="${val}" ${dis}><span class="reveal note" data-rev="cf_${key}" style="font-size:11px">mostrar</span></div>`;
      if (type === "estado") return `<div class="field"><label>${label}</label><input id="cf_${key}" value="${val}" list="cf_estlist" placeholder="ACTIVO" ${dis}></div>`;
      return `<div class="field"><label>${label}</label><input id="cf_${key}" value="${val}" ${dis}></div>`;
    }).join("");
    return `<div class="fs">${g}</div><div class="grid2">${inputs}</div>`;
  }).join("");
  const estOpts = [...new Set(CLIENTES.map(x => (x.estadoUsuario || "").trim()).filter(Boolean))];
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:24px;width:760px;max-width:96vw;max-height:92vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">${c ? (canEdit ? "Editar cliente" : "Ficha del cliente") : "Nuevo cliente"}</h3>
      <button class="mini" id="cf_x">✕</button>
    </div>
    <datalist id="cf_estlist">${estOpts.map(e => `<option value="${escape(e)}">`).join("")}</datalist>
    ${groupsHtml}
    ${c && c.fileUrl ? `<div class="note" style="margin-top:10px"><a href="${escape(c.fileUrl)}" target="_blank" style="color:var(--green)">Abrir carpeta de archivos</a></div>` : ""}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">
      <button class="btn sec" id="cf_cancel" style="border:1px solid var(--line)">Cerrar</button>
      ${canEdit ? '<button class="btn" id="cf_save">Guardar</button>' : ""}
    </div>
    <div class="msg" id="cf_msg"></div>`;
  document.body.appendChild(bg);
  const close = () =>bg.remove();
  bg.onclick = (e) => { if (e.target === bg) close(); };
  bg.querySelector("#cf_x").onclick = close;
  bg.querySelector("#cf_cancel").onclick = close;
  bg.querySelectorAll("[data-rev]").forEach(s =>s.onclick = () => { const i = bg.querySelector("#" + s.dataset.rev); if (i) { i.type = i.type === "password" ? "text" : "password"; s.textContent = i.type === "password" ? "mostrar" : "ocultar"; } });
  const saveBtn = bg.querySelector("#cf_save");
  if (saveBtn) saveBtn.onclick = async () => {
    const data = {};
    CLI_FIELDS.forEach(([key]) => { const i = bg.querySelector("#cf_" + key); data[key] = i ? i.value.trim() : ""; });
    const msg = bg.querySelector("#cf_msg"); msg.className = "msg";
    if (!data.nombre) { msg.className = "msg err"; msg.textContent = "El nombre o razón social es obligatorio."; return; }
    saveBtn.disabled = true; msg.textContent = "Guardando…";
    data.updatedAt = serverTimestamp();
    try {
      if (c) { await updateDoc(doc(db, "clientes", c.id), data); }
      else {
        data.createdAt = serverTimestamp(); data.createdBy = ME.uid;
        const id = data.codigoId ? ("id" + String(data.codigoId).replace(/[^\w-]/g, "")) : null;
        if (id) await setDoc(doc(db, "clientes", id), data, { merge: true });
        else await setDoc(doc(collection(db, "clientes")), data);
      }
      close(); renderClientes();
    } catch (e) { msg.className = "msg err"; saveBtn.disabled = false; msg.textContent = "Error: " + (e.code || e.message); }
  };
}

async function delCliente(c) {
  if (!c) return;
  if (!confirm(`¿Eliminar al cliente "${c.nombre || c.codigoId}"?\nEsta acción no se puede deshacer.`)) return;
  try { await deleteDoc(doc(db, "clientes", c.id)); renderClientes(); }
  catch (e) { const m = el("cli_msg"); if (m) { m.className = "msg err"; m.textContent = "Error al borrar: " + (e.code || e.message); } }
}

// ---------- CSV: parser robusto (comillas, comas y saltos de línea) ----------
function parseCSV(text) {
  const rows = []; let row = [], field = "", i = 0, q = false;
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  while (i < text.length) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += ch;
    }
    i++;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
// mapea encabezado → clave interna
function headerToKey(h) {
  const raw = String(h || "").trim();
  const m = raw.match(/^\s*(\d+)\s*[.\-)]/);
  const byNum = { 1: "codigoId", 2: "nit", 3: "nombre", 4: "telefono", 5: "correo", 6: "tipoContribuyente", 7: "actividadPrincipal", 8: "actividadSecundaria", 9: "brindaServiciosA", 10: "fechaAperturaNit", 11: "usuario", 12: "password", 13: "inicioCapital", 14: "estadoMatricula", 15: "correoSeprec", 16: "passwordSeprec", 17: "usuarioSeprec", 18: "contratosServicio", 19: "comentarios", 20: "estadoUsuario", 21: "costoMensual", 22: "fileUrl" };
  if (m && byNum[m[1]]) return byNum[m[1]];
  const n = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("siat")) return "passwordSiat";
  if (n === "nombre" || n.includes("razon social")) return "nombre";
  if (n.includes("codigo")) return "codigoId";
  if (n === "nit") return "nit";
  if (n.includes("telefono")) return "telefono";
  if (n.includes("correo") && n.includes("seprec")) return "correoSeprec";
  if (n.includes("correo")) return "correo";
  if (n.includes("estado") && n.includes("usuario")) return "estadoUsuario";
  if (n.includes("costo")) return "costoMensual";
  return null;
}
function importClientesCSV() {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = ".csv,text/csv,text/plain";
  inp.onchange = () => {
    const file = inp.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = async () => {
      const msg = el("cli_msg"); msg.className = "msg";
      try {
        const rows = parseCSV(String(rd.result)).filter(r =>r.some(x => (x || "").trim() !== ""));
        if (rows.length < 2) { msg.className = "msg err"; msg.textContent = "El archivo no tiene datos."; return; }
        const header = rows[0].map(headerToKey);
        if (!header.includes("nombre")) { msg.className = "msg err"; msg.textContent = "No encontré la columna de Nombre/Razón Social. ¿Exportaste la hoja BDCONTAX con sus encabezados?"; return; }
        const existingByCode = {}; CLIENTES.forEach(c => { if (c.codigoId) existingByCode[String(c.codigoId)] = c; });
        let ok = 0, skip = 0;
        for (let r = 1; r < rows.length; r++) {
          const rowArr = rows[r]; const data = {};
          header.forEach((k, idx) => { if (k) data[k] = (rowArr[idx] || "").trim(); });
          if (!data.nombre) { skip++; continue; }
          data.updatedAt = serverTimestamp();
          msg.className = "msg"; msg.textContent = `Importando ${ok + 1}… (no cierres la pestaña)`;
          const code = (data.codigoId || "").replace(/[^\w-]/g, "");
          const id = code ? ("id" + code) : null;
          if (id) await setDoc(doc(db, "clientes", id), data, { merge: true });
          else await setDoc(doc(collection(db, "clientes")), data);
          ok++;
        }
        msg.className = "msg ok"; msg.textContent = `✓ ${ok} clientes importados${skip ? ` · ${skip} filas sin nombre omitidas` : ""}.`;
        renderClientes();
      } catch (e) { msg.className = "msg err"; msg.textContent = "Error al importar: " + (e.message || e); }
    };
    rd.readAsText(file, "UTF-8");
  };
  inp.click();
}
function exportClientesCSV() {
  const cols = CLI_FIELDS.map(f =>f[0]);
  const labels = CLI_FIELDS.map(f =>f[1]);
  const esc = v => { const s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const lines = [labels.map(esc).join(",")];
  CLIENTES.forEach(c =>lines.push(cols.map(k =>esc(c[k])).join(",")));
  const blob = new Blob(["" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "clientes-contax.csv"; a.click(); URL.revokeObjectURL(a.href);
}

// ============================================================
//  MÓDULO BASE DE DATOS (Google Sheets · hoja BDCONTAX vía Apps Script)
//  El Google Sheets sigue siendo la fuente; el portal lo lee y escribe.
// ============================================================
// [clave interna, ETIQUETA EXACTA en el Sheet (fila A1), grupo, tipo]
const BD_FIELDS = [
  ["nombre", "NOMBRE", "Cliente", "text"],
  ["codigoId", "Codigo de ID", "Cliente", "text"],
  ["nit", "NIT", "Cliente", "text"],
  ["ci", "C.I.", "Cliente", "text"],
  ["razon", "Nombre o Razón Social", "Cliente", "text"],
  ["celular", "Celular", "Cliente", "text"],
  ["correo", "Correo Electrónico", "Cliente", "text"],
  ["tipo", "Tipo de Contribuyente", "Actividad", "text"],
  ["actP", "Actividad Principal", "Actividad", "text"],
  ["actS", "Actividad Secundaria", "Actividad", "text"],
  ["brinda", "Brinda Servicios A", "Actividad", "text"],
  ["fechaNit", "Fecha Apertura NIT", "Actividad", "text"],
  ["usuario", "Usuario", "Accesos", "text"],
  ["password", "Contraseña", "Accesos", "secret"],
  ["passSiat", "Contraseña SIAT", "Accesos", "secret"],
  ["capital", "Inicio De Capital", "SEPREC", "text"],
  ["estMat", "Estado de La Matricula SEPREC", "SEPREC", "text"],
  ["correoSeprec", "Correo SEPREC", "SEPREC", "text"],
  ["userSeprec", "Usuario SEPREC", "SEPREC", "text"],
  ["passSeprec", "Contraseña SEPREC", "SEPREC", "secret"],
  ["estado", "Estado Usuario", "Adicionales", "estado"],
  ["costo", "Costo Servicio Mensual", "Adicionales", "text"],
  ["fechaInact", "Fecha Inactivación", "Adicionales", "text"],
  ["comentarios", "Comentarios", "Adicionales", "textarea"]
];
const BD_GROUPS = ["Cliente", "Actividad", "Accesos", "SEPREC", "Adicionales"];
const BD_LBL2KEY = {}; BD_FIELDS.forEach(f =>BD_LBL2KEY[f[1]] = f[0]);
const BD_KEY2LBL = {}; BD_FIELDS.forEach(f =>BD_KEY2LBL[f[0]] = f[1]);
const BD_SECRET_LBL = BD_FIELDS.filter(f =>f[3] === "secret").map(f =>f[1]);
// Las filas se guardan TAL CUAL vienen del Sheet: claves = etiquetas (títulos).
let BD = [], bdHeader = [], bdFilter = "", bdEstado = "", bdTipo = "", bdLoaded = false, bdUrlCache = "";
let bdSubtab = "resumen", bdSort = "", bdEnFirebaseFlag = false;
let bdKey2Header = {};
// Mapea un encabezado del Sheet (aunque tenga "20." adelante) a la clave interna de BD_FIELDS
function bdHeaderToKey(h) {
  const raw = String(h || "").trim().replace(/^\s*\d+\s*[.\-)]\s*/, "");
  const n = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  if (n.includes("estado") && n.includes("usuario")) return "estado";
  if (n.includes("costo")) return "costo";
  if (n.includes("matricula")) return "estMat";
  if (n.includes("apertura") && n.includes("nit")) return "fechaNit";
  if (n.replace(/[^a-z]/g, "") === "ci" || n.includes("carnet") || n.includes("cedula")) return "ci";
  if (n.includes("correo") && n.includes("seprec")) return "correoSeprec";
  if (n.includes("correo")) return "correo";
  if (n.includes("tipo") && n.includes("contribuy")) return "tipo";
  if (n.includes("brinda")) return "brinda";
  if (n.includes("actividad principal")) return "actP";
  if (n.includes("actividad secundaria")) return "actS";
  if (n.includes("celular") || n.includes("telefono")) return "celular";
  if (n.includes("codigo")) return "codigoId";
  if (n.includes("razon")) return "razon";
  if (n === "nombre") return "nombre";
  if (n === "nit") return "nit";
  if (n.includes("comentario")) return "comentarios";
  if (n.includes("fecha inactiv")) return "fechaInact";
  return BD_LBL2KEY[raw] || null;
}
function bdBuildKeyMap() {
  bdKey2Header = {};
  bdHeader.forEach(h => { const k = bdHeaderToKey(h); if (k && !bdKey2Header[k]) bdKey2Header[k] = h; });
}
const BD_COLL = "bdclientes";
// Carga la Base de Datos desde Firebase (cuando ya se migró)
// Caché local de la Base de Datos (igual que Recepciones): la 1ª vez descarga todo y lo guarda
// en el navegador; después solo pide lo que cambió (_upd). Descarga completa 1 vez al día.
const BDC = { docs: null, lastSync: 0, fullAt: 0, netAt: 0, loading: null };
let bdcGuardarT = null;
function bdcGuardar() { clearTimeout(bdcGuardarT); bdcGuardarT = setTimeout(() => rcIdbSet("bdclientes", { docs: BDC.docs, lastSync: BDC.lastSync, fullAt: BDC.fullAt, uid: ME && ME.uid }), 400); }
function bdcPoner(id, datos) { if (!BDC.docs || !id) return; const i = BDC.docs.findIndex(x => x._docid === id); const n = Object.assign({ _docid: id }, datos); if (i >= 0) BDC.docs[i] = Object.assign(BDC.docs[i], n); else BDC.docs.push(n); bdcGuardar(); }
async function bdSync(forzarTodo) {
  if (BDC.loading) return BDC.loading;
  BDC.loading = (async () => {
    if (!BDC.docs) {
      const c = await rcIdbGet("bdclientes");
      if (c && Array.isArray(c.docs) && (!c.uid || !ME || c.uid === ME.uid)) { BDC.docs = c.docs; BDC.lastSync = c.lastSync || 0; BDC.fullAt = c.fullAt || 0; }
    }
    const ahora = Date.now();
    if (forzarTodo || !BDC.docs || (ahora - BDC.fullAt) > 86400000) {
      const snap = await getDocs(collection(db, BD_COLL));
      BDC.docs = snap.docs.filter(d => d.id !== "_meta").map(d => rcLimpio(d.id, d.data())).map(o => { o._docid = o.id; delete o.id; return o; });
      BDC.fullAt = ahora; BDC.lastSync = ahora; BDC.netAt = ahora; bdcGuardar();
    } else if (ahora - BDC.netAt > 45000) {
      const snap = await getDocs(query(collection(db, BD_COLL), where("_upd", ">", BDC.lastSync - 600000)));
      snap.docs.forEach(d => { if (d.id === "_meta") return; const n = rcLimpio(d.id, d.data()); n._docid = d.id; delete n.id; const i = BDC.docs.findIndex(x => x._docid === d.id); if (i >= 0) BDC.docs[i] = n; else BDC.docs.push(n); });
      BDC.lastSync = ahora; BDC.netAt = ahora; bdcGuardar();
    }
    return BDC.docs;
  })();
  try { return await BDC.loading; } finally { BDC.loading = null; }
}
async function bdLoadFirebase(cb, forzarTodo) {
  try {
    const cfg = await loadConfigDoc();
    bdHeader = (cfg.bdHeader && cfg.bdHeader.length) ? cfg.bdHeader.slice() : [];
    bdBuildKeyMap();
    const rows = (await bdSync(forzarTodo)).map(r => Object.assign({}, r));
    if (!bdHeader.length && rows.length) { bdHeader = Object.keys(rows[0]).filter(k => k.charAt(0) !== "_"); bdBuildKeyMap(); }
    BD = rows.filter(r => (bdV(r, "nombre") || bdV(r, "razon") || bdV(r, "codigoId") || bdV(r, "nit")));
    bdEnFirebaseFlag = true; bdLoaded = true; cb(true);
  } catch (e) { cb(false, e.message || e); }
}
// Carga la Base de Datos (Sheet) si aún no está, y luego ejecuta cb
function bdEnsureLoaded(cb) {
  if (bdLoaded && BD.length) { cb(true); return; }
  loadConfigDoc().then(cfg => {
    if (cfg.bdEnFirebase) { bdLoadFirebase(cb); return; }
    bdEnsureLoadedBridge(cb);
  });
}
function bdEnsureLoadedBridge(cb) {
  bdFetch((data) => {
    if (data && !data.error) {
      const rows = (data.rows || []);
      bdHeader = (data.header && data.header.length) ? data.header : (rows.length ? Object.keys(rows[0]) : BD_FIELDS.map(f => f[1]));
      bdBuildKeyMap();
      BD = rows.filter(r => (bdV(r, "nombre") || bdV(r, "razon") || bdV(r, "codigoId") || bdV(r, "nit")));
      bdEnFirebaseFlag = false; bdLoaded = true; cb(true);
    } else { cb(false, data && data.error); }
  });
}
let bdHidden = [], bdPinned = [];
try { bdHidden = JSON.parse(localStorage.getItem("bd-hidden") || "[]"); if (!Array.isArray(bdHidden)) bdHidden = []; } catch (e) { bdHidden = []; }
try { bdPinned = JSON.parse(localStorage.getItem("bd-pinned") || "[]"); if (!Array.isArray(bdPinned)) bdPinned = []; } catch (e) { bdPinned = []; }
function bdSaveHidden() { try { localStorage.setItem("bd-hidden", JSON.stringify(bdHidden)); } catch (e) {} }
function bdSavePinned() { try { localStorage.setItem("bd-pinned", JSON.stringify(bdPinned)); } catch (e) {} }
function bdVisibleHeader() { return bdHeader.filter(h => bdHidden.indexOf(h) < 0); }
// Devuelve las columnas visibles con las FIJADAS primero, y el ancho/posición de fijado
const BD_PINW = 170;
function bdOrderedHeader() {
  const vis = bdVisibleHeader();
  const pin = bdPinned.filter(h => vis.indexOf(h) >= 0);
  const rest = vis.filter(h => pin.indexOf(h) < 0);
  return { ordered: pin.concat(rest), pin: pin };
}
function bdPinStyle(h, pin, head) {
  const i = pin.indexOf(h); if (i < 0) return "";
  const bg = head ? "var(--panel2)" : "var(--panel)";
  return `position:sticky;left:${i * BD_PINW}px;z-index:${head ? 6 : 5};min-width:${BD_PINW}px;max-width:${BD_PINW}px;background:${bg};box-shadow:${i === pin.length - 1 ? "2px 0 5px rgba(0,0,0,.12)" : "none"}`;
}

// Lee un campo por su clave interna (busca la etiqueta del Sheet)
function bdV(r, key) { const lbl = (bdKey2Header && bdKey2Header[key]) || BD_KEY2LBL[key]; const v = r && lbl != null ? r[lbl] : ""; return String(v == null ? "" : v).trim(); }

// Los 6 estados definidos por CONTAX (clave, etiqueta corta, color)
// Solo "ACTIVO" son clientes reales. "Suscripcion de facturacion" NO es cliente.
const BD_ESTADO_DEFS = [
  ["activo",       "Clientes activos",     "ok"],
  ["facturacion",  "Por facturacion",      "mut"],
  ["inactivo",     "Clientes inactivos",   "off"],
  ["nit_baja",     "Cerraron NIT",         "off"],
  ["susc_inact",   "Suscripcion inactiva", "off"],
  ["lista_negra",  "Lista negra",          "danger"]
];
const BD_ESTADO_LBL = {}; BD_ESTADO_DEFS.forEach(function (d) { BD_ESTADO_LBL[d[0]] = d[1]; });

// Clasifica el "Estado Usuario" en uno de los 6 grupos, con su color
function bdEstadoInfo(r) {
  const raw = bdV(r, "estado");
  const u = raw.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  let g;
  if (u === "ACTIVO") g = "activo";
  else if (u.indexOf("LISTA NEGRA") >= 0) g = "lista_negra";
  else if (u.indexOf("SUSCRIP") >= 0 && u.indexOf("INACTIV") >= 0) g = "susc_inact";
  else if (u.indexOf("SUSCRIP") >= 0 || u.indexOf("FACTURACION") >= 0) g = "facturacion";
  else if (u.indexOf("SOLICITAD") >= 0) g = "nit_baja";
  else if (u.indexOf("INACTIV") >= 0) g = "inactivo";
  else g = raw ? "inactivo" : "otro";
  const cls = g === "activo" ? "ok" : g === "lista_negra" ? "danger" : g === "facturacion" ? "mut" : "off";
  return { raw: raw, grupo: g, cls: cls, activo: g === "activo" };
}
function bdIsActivo(r) { return bdEstadoInfo(r).activo; }
function bdMoney(v) { let s = String(v == null ? "" : v).replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".").replace(/[^\d.]/g, ""); const n = parseFloat(s); return isNaN(n) ? 0 : n; }
function fmtBs2(n) { return "Bs " + (Number(n) || 0).toLocaleString("es-BO", { maximumFractionDigits: 2 }); }
// Descarga una copia de respaldo en CSV (se abre en Excel / Google Sheets)
function downloadCSV(filename, headers, rows) {
  const cell = v => { let s = String(v == null ? "" : v); if (/[",\n;]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'; return s; };
  const lines = [headers.map(cell).join(",")].concat(rows.map(r => r.map(cell).join(",")));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function hoyISO() { const d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0"); }

async function bdBridgeUrl() { const cfg = await loadConfigDoc(); return (cfg.bdUrl || "").trim(); }

function bdFetch(cb) {
  bdBridgeUrl().then(url => {
    if (!url) { cb({ error: "nourl" }); return; }
    bdUrlCache = url;
    const cbn = "bdcb_" + Date.now() + Math.floor(Math.random() * 999);
    const s = document.createElement("script");
    const to = setTimeout(() => { try { delete window[cbn]; } catch (e) {} s.remove(); cb({ error: "timeout" }); }, 20000);
    window[cbn] = (data) => { clearTimeout(to); try { delete window[cbn]; } catch (e) {} s.remove(); cb(data || {}); };
    const sep = url.indexOf("?") >= 0 ? "&" : "?";
    s.src = url + sep + "action=list&callback=" + cbn;
    s.onerror = () => { clearTimeout(to); try { delete window[cbn]; } catch (e) {} s.remove(); cb({ error: "net" }); };
    document.body.appendChild(s);
  });
}

async function renderBaseDatos(force) {
  // Caché: si ya está cargada, no volvemos a leer (navegar entre pestañas es instantáneo y no gasta Firebase)
  if (!force && bdLoaded && BD.length) { BD.forEach((r, i) => r._i = i); paintBaseDatos(); return; }
  const cfg0 = await loadConfigDoc();
  if (cfg0.bdEnFirebase) {
    el("v-basedatos").innerHTML = `<h1>Base de Datos</h1><p class="lead"><span class="cx-spin"></span> Cargando desde Firebase…</p>`;
    bdLoadFirebase((ok, err) => {
      if (!ok) { el("v-basedatos").innerHTML = `<h1>Base de Datos</h1><p class="msg err">No se pudo cargar desde Firebase: ${escape(String(err || ""))}</p>`; return; }
      BD.forEach((r, i) => r._i = i); paintBaseDatos();
    });
    return;
  }
  const url = await bdBridgeUrl();
  if (!url) {
    el("v-basedatos").innerHTML = `<h1>Base de Datos</h1>
      <p class="lead">Tu hoja <b>BDCONTAX</b>de Google Sheets, dentro del portal. El Sheet sigue siendo la fuente y puedes seguir usándolo normal.</p>
      <div class="formcard"><h3 style="margin:0 0 8px">Falta conectar tu Google Sheets</h3>
      <p class="note">Ve a <b>Configuración → Base de Datos (Google Sheets)</b>y pega la URL del puente (Apps Script). Te pasé el código para instalarlo en tu hoja.</p>
      <button class="btn" onclick="document.querySelector('nav.tabs [data-v=config]').click()">Ir a Configuración</button></div>`;
    return;
  }
  el("v-basedatos").innerHTML = `<h1>Base de Datos</h1><p class="lead"><span class="cx-spin"></span>Cargando desde Google Sheets…</p>`;
  bdFetch((data) => {
    if (data.error) {
      el("v-basedatos").innerHTML = `<h1>Base de Datos</h1><p class="msg err">No se pudo leer el Sheet (${escape(data.error)}). Revisa la URL del puente en Configuración y que el Apps Script esté publicado como "Cualquiera".</p>
        <button class="btn sec" style="border:1px solid var(--line)">Reintentar</button>`;
      const b = el("v-basedatos").querySelector("button"); if (b) b.onclick = () =>renderBaseDatos();
      return;
    }
    const rows = (data.rows || []);
    // Orden de columnas TAL CUAL el Sheet (fila 1). Si el puente no lo manda, lo deducimos.
    bdHeader = (data.header && data.header.length) ? data.header
             : (rows.length ? Object.keys(rows[0]) : BD_FIELDS.map(f =>f[1]));
    bdBuildKeyMap();
    BD = rows.filter(r => (bdV(r, "nombre") || bdV(r, "razon") || bdV(r, "codigoId") || bdV(r, "nit")));
    bdEnFirebaseFlag = false; bdLoaded = true;
    paintBaseDatos();
  });
}

function paintBaseDatos() {
  const canEdit = canEditClientes();
  // _i estable por índice en BD (antes de construir filas)
  BD.forEach((r, i) =>r._i = i);
  const term = bdFilter.toLowerCase().trim();
  const ESTADO_LBL = BD_KEY2LBL["estado"];   // "Estado Usuario"
  const TIPO_LBL = BD_KEY2LBL["tipo"];       // "Tipo de Contribuyente"
  const tipos = [...new Set(BD.map(r =>bdV(r, "tipo")).filter(Boolean))].sort();
  const estados = [...new Set(BD.map(r =>bdV(r, "estado")).filter(Boolean))].sort();
  const list = BD.filter(r => {
    // Filtro por subpestaña: Activos / Otros estados
    if (bdSubtab === "activos" && !bdEstadoInfo(r).activo) return false;
    if (bdSubtab === "otros" && bdEstadoInfo(r).activo) return false;
    if (bdEstado) {
      if (bdEstado.indexOf("g:") === 0) { if (bdEstadoInfo(r).grupo !== bdEstado.slice(2)) return false; }
      else if (bdV(r, "estado") !== bdEstado) return false;
    }
    if (bdTipo && bdV(r, "tipo") !== bdTipo) return false;
    if (term) {
      let hay = false;
      for (const lbl of bdHeader) { if (String(r[lbl] == null ? "" : r[lbl]).toLowerCase().includes(term)) { hay = true; break; } }
      if (!hay) return false;
    }
    return true;
  });
  const codeNum = r => { const n = parseInt(String(bdV(r, "codigoId")).replace(/\D/g, ""), 10); return isNaN(n) ? -1 : n; };
  if (bdSort === "nombre") list.sort((a, b) => String(bdV(a, "nombre") || bdV(a, "razon")).localeCompare(String(bdV(b, "nombre") || bdV(b, "razon"))));
  else if (bdSort === "estado") list.sort((a, b) => String(bdV(a, "estado")).localeCompare(String(bdV(b, "estado"))));
  else if (bdSort === "costo") list.sort((a, b) => bdMoney(bdV(b, "costo")) - bdMoney(bdV(a, "costo")));
  else if (bdSort === "antiguo") list.sort((a, b) => codeNum(a) - codeNum(b));
  else list.sort((a, b) => codeNum(b) - codeNum(a)); // "reciente" por defecto (código más alto primero)
  const counts = { activo: 0, facturacion: 0, inactivo: 0, nit_baja: 0, susc_inact: 0, lista_negra: 0, otro: 0 };
  BD.forEach(r => { counts[bdEstadoInfo(r).grupo] = (counts[bdEstadoInfo(r).grupo] || 0) + 1; });
  const total = BD.length, activos = counts.activo;
  const ingreso = BD.filter(bdIsActivo).reduce((s, r) =>s + bdMoney(bdV(r, "costo")), 0);
  // Cabecera: solo las columnas visibles del Sheet + una fija al final para "Editar/Ver"
  const { ordered: visHeader, pin: pinCols } = bdOrderedHeader();
  const thead = `<tr>${visHeader.map(h => `<th style="${bdPinStyle(h, pinCols, true)}">${pinCols.indexOf(h) >= 0 ? "📌 " : ""}${escape(h)}</th>`).join("")}<th class="bd-actioncol"></th></tr>`;
  const rowCls = { inactivo: "bd-inact", nit_baja: "bd-inact", susc_inact: "bd-inact", lista_negra: "bd-negra" };
  const rows = list.map(r => {
    const info = bdEstadoInfo(r);
    const tds = visHeader.map(lbl => {
      const val = String(r[lbl] == null ? "" : r[lbl]);
      const ps = bdPinStyle(lbl, pinCols, false);
      if (lbl === ESTADO_LBL) {
        return `<td style="${ps}"><span class="badge ${info.cls}">${escape(info.raw || "—")}</span></td>`;
      }
      return `<td style="${ps}" title="${escape(val)}">${escape(val) || "<span style='color:var(--muted)'>—</span>"}</td>`;
    }).join("");
    const cls = rowCls[info.grupo] || "";
    return `<tr data-open="${r._i}" class="${cls}">${tds}<td class="bd-actioncol"><button class="mini" data-edit="${r._i}">${canEdit ? "Editar" : "Ver"}</button></td></tr>`;
  }).join("");
  const colspan = visHeader.length + 1;
  const resumenHTML = `
    <div class="kpis">
      <div class="kpi"><div class="n">${total}</div><div class="l">Registros</div></div>
      <div class="kpi bd-kpi" data-gfilter="activo" title="Ver en la lista"><div class="n" style="color:var(--green)">${counts.activo}</div><div class="l">Clientes activos <span class="badge ok" style="padding:1px 6px">reales</span></div></div>
      <div class="kpi bd-kpi" data-gfilter="facturacion" title="Ver en la lista"><div class="n">${counts.facturacion}</div><div class="l">Por facturación</div></div>
      <div class="kpi bd-kpi" data-gfilter="inactivo" title="Ver en la lista"><div class="n">${counts.inactivo}</div><div class="l">Clientes inactivos</div></div>
      <div class="kpi bd-kpi" data-gfilter="nit_baja" title="Ver en la lista"><div class="n">${counts.nit_baja}</div><div class="l">Cerraron NIT</div></div>
      <div class="kpi bd-kpi" data-gfilter="susc_inact" title="Ver en la lista"><div class="n">${counts.susc_inact}</div><div class="l">Suscripción inactiva</div></div>
      <div class="kpi bd-kpi" data-gfilter="lista_negra" title="Ver en la lista"><div class="n" style="color:var(--danger)">${counts.lista_negra}</div><div class="l">Lista negra</div></div>
      <div class="kpi"><div class="n">${fmtBs2(ingreso)}</div><div class="l">Ingreso mensual (activos)</div></div>
    </div>`;
  const listaHTML = `
    <div class="toolbar">
      <input id="bd_search" class="mini" style="padding:9px;min-width:240px" placeholder="Buscar en toda la base…" value="${escape(bdFilter)}">
      <select id="bd_estado" class="mini" style="padding:9px"><option value="">Todos los estados</option><optgroup label="Por categoría">${BD_ESTADO_DEFS.map(d => `<option value="g:${d[0]}">${escape(d[1])} (${counts[d[0]] || 0})</option>`).join("")}</optgroup><optgroup label="Texto exacto del Sheet">${estados.map(e => `<option value="${escape(e)}">${escape(e)}</option>`).join("")}</optgroup></select>
      <select id="bd_tipo" class="mini" style="padding:9px"><option value="">Todos los tipos</option>${tipos.map(t => `<option value="${escape(t)}">${escape(t)}</option>`).join("")}</select>
      <select id="bd_sort" class="mini" style="padding:9px"><option value="">Más recientes</option><option value="antiguo">Más antiguos</option><option value="nombre">Nombre (A-Z)</option><option value="estado">Estado</option><option value="costo">Costo (mayor)</option></select>
      ${canEdit ? '<button class="btn" id="bd_new">＋ Nuevo</button>' : ""}
      <button class="btn sec" id="bd_cols" style="border:1px solid var(--line)">Columnas${bdHidden.length ? ` (${visHeader.length}/${bdHeader.length})` : ""}</button>
      <button class="btn sec" id="bd_download" style="border:1px solid var(--line)">⬇ Descargar</button>
      <button class="btn sec" id="bd_reload" style="border:1px solid var(--line)">Actualizar</button>
      ${(isAdmin() && !bdEnFirebaseFlag) ? '<button class="btn" id="bd_migrar" style="background:var(--green);border-color:var(--green)" title="Copiar todo a Firebase y dejar de usar Google Sheets">⬆ Migrar a Firebase</button>' : ''}
      ${(isAdmin() && bdEnFirebaseFlag) ? '<label class="btn sec" id="bd_xls" style="border:1px solid var(--line);cursor:pointer" title="Sube el Excel actualizado: solo se guarda lo nuevo y lo que cambió">Importar Excel<input type="file" id="bd_xls_in" accept=".xlsx,.xls" style="display:none"></label>' : ''}
      ${(isAdmin() && bdEnFirebaseFlag) ? '<button class="btn sec" id="bd_sync" style="border:1px solid var(--line)" title="Trae del Google Sheet solo los clientes nuevos y los cambios">Sincronizar con Sheets</button>' : ''}
      ${bdEnFirebaseFlag ? '<span class="badge ok" style="align-self:center;padding:4px 10px">⚡ En Firebase</span>' : ''}
      <span class="msg" id="bd_msg" style="align-self:center"></span>
    </div>
    <div class="bd-scroll"><table class="bd-table">
      <thead>${thead}</thead>
      <tbody>${rows || `<tr><td colspan="${colspan}" style="color:var(--muted)">Sin registros con estos filtros.</td></tr>`}</tbody></table></div>
    <p class="note" style="margin-top:10px">Mostrando ${list.length} de ${total}. Toca una fila para ver la ficha completa. Desliza a los lados para ver todas las columnas.</p>`;
  const isList = bdSubtab !== "resumen" && bdSubtab !== "movimientos";
  el("v-basedatos").innerHTML = `<h1>Clientes</h1>
    <p class="lead">${bdEnFirebaseFlag ? `Base de datos de clientes en Firebase (rápida), con las ${bdHeader.length} columnas.` : `Tu hoja <b>BDCONTAX</b>de Google Sheets, con las ${bdHeader.length} columnas tal cual.`}</p>
    <div class="subtabs">
      <button class="subtab ${bdSubtab === 'resumen' ? 'on' : ''}" data-st="resumen">Resumen</button>
      <button class="subtab ${bdSubtab === 'general' ? 'on' : ''}" data-st="general">Base de Datos (${total})</button>
      <button class="subtab ${bdSubtab === 'activos' ? 'on' : ''}" data-st="activos">Activos (${counts.activo})</button>
      <button class="subtab ${bdSubtab === 'otros' ? 'on' : ''}" data-st="otros">Otros estados (${total - counts.activo})</button>
      <button class="subtab ${bdSubtab === 'movimientos' ? 'on' : ''}" data-st="movimientos">Movimientos</button>
    </div>
    <div ${bdSubtab === 'resumen' ? '' : 'style="display:none"'}>${resumenHTML}</div>
    <div ${isList ? '' : 'style="display:none"'}>${listaHTML}</div>
    <div ${bdSubtab === 'movimientos' ? '' : 'style="display:none"'} id="bd-mov"></div>`;
  el("v-basedatos").querySelectorAll(".subtab").forEach(b => b.onclick = () => { bdSubtab = b.dataset.st; if (bdSubtab !== "resumen" && bdSubtab !== "general" && bdSubtab !== "activos" && bdSubtab !== "otros" && bdSubtab !== "movimientos") bdSubtab = "general"; paintBaseDatos(); });
  if (bdSubtab === "movimientos") renderBDMovimientos();
  if (el("bd_sort")) { el("bd_sort").value = bdSort; el("bd_sort").onchange = () => { bdSort = el("bd_sort").value; paintBaseDatos(); }; }
  if (el("bd_search")) el("bd_search").oninput = () => { bdFilter = el("bd_search").value; paintBaseDatos(); const nb = el("bd_search"); if (nb) { nb.focus(); nb.setSelectionRange(nb.value.length, nb.value.length); } };
  if (el("bd_estado")) { el("bd_estado").value = bdEstado; el("bd_estado").onchange = () => { bdEstado = el("bd_estado").value; paintBaseDatos(); }; }
  if (el("bd_tipo")) { el("bd_tipo").value = bdTipo; el("bd_tipo").onchange = () => { bdTipo = el("bd_tipo").value; paintBaseDatos(); }; }
  if (el("bd_new")) el("bd_new").onclick = () =>openBDModal(null);
  if (el("bd_cols")) el("bd_cols").onclick = () => openBDColsModal();
  if (el("bd_reload")) el("bd_reload").onclick = () =>renderBaseDatos(true);
  if (el("bd_migrar")) el("bd_migrar").onclick = () => migrarBDaFirebase();
  if (el("bd_sync")) el("bd_sync").onclick = () => bdSincronizarSheet();
  if (el("bd_xls_in")) el("bd_xls_in").onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) bdImportarExcel(f); };
  el("v-basedatos").querySelectorAll(".bd-kpi").forEach(k => { k.style.cursor = "pointer"; k.onclick = () => { const g = "g:" + k.dataset.gfilter; bdEstado = (bdEstado === g) ? "" : g; bdSubtab = "general"; paintBaseDatos(); }; });
  if (el("bd_download")) el("bd_download").onclick = () => openBDDownloadModal(list);
  el("v-basedatos").querySelectorAll("[data-edit]").forEach(b =>b.onclick = (e) => { e.stopPropagation(); openBDModal(BD[+b.dataset.edit]); });
  el("v-basedatos").querySelectorAll("tr[data-open]").forEach(r =>r.onclick = () =>openBDModal(BD[+r.dataset.open]));
  // Resaltado de columna: al pasar el cursor, ilumina toda la columna
  const tabla = el("v-basedatos").querySelector(".bd-table");
  if (tabla) {
    let colActual = -1;
    const limpiar = () => { tabla.querySelectorAll(".bd-colhi").forEach(c =>c.classList.remove("bd-colhi")); colActual = -1; };
    tabla.addEventListener("mouseover", (e) => {
      const cel = e.target.closest("td,th"); if (!cel || cel.cellIndex === colActual) return;
      limpiar(); colActual = cel.cellIndex;
      tabla.querySelectorAll("tr").forEach(tr => { const c = tr.children[colActual]; if (c) c.classList.add("bd-colhi"); });
    });
    tabla.addEventListener("mouseleave", limpiar);
  }
}

function openBDColsModal() {
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  const items = bdHeader.map((h, i) => {
    const on = bdHidden.indexOf(h) < 0;
    const pinned = bdPinned.indexOf(h) >= 0;
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);font-size:13px;cursor:pointer">
      <input type="checkbox" data-col="${escape(h)}" ${on ? "checked" : ""} style="width:auto"> <span style="flex:1">${escape(h)}</span>
      <span class="bc-pin" data-pin="${escape(h)}" title="Fijar/soltar columna" style="cursor:pointer;opacity:${pinned ? "1" : ".3"};font-size:15px">📌</span></label>`;
  }).join("");
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:22px;width:500px;max-width:96vw;max-height:90vh;display:flex;flex-direction:column">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <h3 style="margin:0">Columnas</h3><button class="mini" id="bc_x">✕</button></div>
    <p class="note" style="margin:0 0 12px">Marca las que quieres ver. Toca el 📌 para <b>fijar</b>una columna: las fijadas quedan siempre visibles a la izquierda aunque te muevas de lado. (Se recuerda en este navegador.)</p>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button class="btn sec" id="bc_all" style="flex:1;border:1px solid var(--line)">Mostrar todas</button>
      <button class="btn sec" id="bc_none" style="flex:1;border:1px solid var(--line)">Ocultar todas</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;overflow-y:auto;flex:1">${items}</div>
    <div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn" id="bc_apply">Aplicar</button></div>
  </div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.onclick = e => { if (e.target === bg) close(); };
  bg.querySelector("#bc_x").onclick = close;
  bg.querySelector("#bc_all").onclick = () => bg.querySelectorAll("input[data-col]").forEach(c => c.checked = true);
  bg.querySelector("#bc_none").onclick = () => bg.querySelectorAll("input[data-col]").forEach(c => c.checked = false);
  bg.querySelectorAll(".bc-pin").forEach(p => p.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const h = p.dataset.pin; const idx = bdPinned.indexOf(h);
    if (idx >= 0) bdPinned.splice(idx, 1); else bdPinned.push(h);
    p.style.opacity = bdPinned.indexOf(h) >= 0 ? "1" : ".3";
  });
  bg.querySelector("#bc_apply").onclick = () => {
    bdHidden = [...bg.querySelectorAll("input[data-col]")].filter(c => !c.checked).map(c => c.dataset.col);
    bdSaveHidden(); bdSavePinned(); close(); paintBaseDatos();
  };
}

// Registro de movimientos (alta / baja / cambio de estado)
async function bdLog(e) {
  try {
    const entry = { fechaISO: new Date().toISOString(), accion: e.accion || "", nombre: e.nombre || "", estadoAnterior: e.estadoAnterior || "", estadoNuevo: e.estadoNuevo || "", detalle: e.detalle || "", porUid: (ME && ME.uid) || "", porNombre: (ME && (ME.name || ME.email)) || "", createdAt: serverTimestamp() };
    await setDoc(doc(collection(db, "bdlog")), entry);
  } catch (err) {}
}
function esBaja(estado) { return /inactiv|negra|suspend|baja/i.test(String(estado || "").normalize("NFD").replace(/[̀-ͯ]/g, "")); }
async function renderBDMovimientos() {
  const box = el("bd-mov"); if (!box) return;
  box.innerHTML = `<p class="lead"><span class="cx-spin"></span> Cargando movimientos…</p>`;
  let logs = [];
  try { const snap = await getDocs(query(collection(db, "bdlog"), orderBy("fechaISO", "desc"), limit(500))); logs = snap.docs.map(d => d.data()); }
  catch (e) { box.innerHTML = `<p class="note">Aún no hay registro de movimientos (se empieza a llenar cuando des de alta/baja o cambies estados). Si ves un error, revisa que agregaste la regla de Firestore para <b>bdlog</b>.</p>`; return; }
  if (!logs.length) { box.innerHTML = `<p class="note">Todavía no hay movimientos registrados. A partir de ahora, cada alta, baja o cambio de estado quedará aquí con su fecha.</p>`; return; }
  const byMonth = {};
  logs.forEach(l => { const m = (l.fechaISO || "").slice(0, 7); if (!m) return; byMonth[m] = byMonth[m] || { alta: 0, baja: 0, cambio: 0 }; if (l.accion === "alta") byMonth[m].alta++; else if (esBaja(l.estadoNuevo)) byMonth[m].baja++; else byMonth[m].cambio++; });
  const months = Object.keys(byMonth).sort().reverse().slice(0, 12);
  const MES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mLbl = m => { const p = m.split("-"); return (MES[parseInt(p[1], 10)] || p[1]) + " " + p[0]; };
  const resumen = `<table style="max-width:520px"><thead><tr><th>Mes</th><th style="text-align:center">Nuevos</th><th style="text-align:center">Bajas</th><th style="text-align:center">Otros cambios</th></tr></thead>
    <tbody>${months.map(m => `<tr><td>${mLbl(m)}</td><td style="text-align:center;color:var(--green);font-weight:700">${byMonth[m].alta}</td><td style="text-align:center;color:var(--danger);font-weight:700">${byMonth[m].baja}</td><td style="text-align:center">${byMonth[m].cambio}</td></tr>`).join("")}</tbody></table>`;
  const rows = logs.slice(0, 200).map(l => `<tr>
    <td class="mono">${escape(fmtFecha(l.fechaISO))}</td>
    <td>${l.accion === "alta" ? '<span class="badge ok">Alta</span>' : (esBaja(l.estadoNuevo) ? '<span class="badge danger">Baja</span>' : '<span class="badge off">Cambio</span>')}</td>
    <td><b>${escape(l.nombre || "—")}</b></td>
    <td>${escape(l.estadoAnterior || "")}${l.estadoAnterior && l.estadoNuevo ? " → " : ""}${escape(l.estadoNuevo || "")}</td>
    <td>${escape(l.porNombre || "")}</td></tr>`).join("");
  box.innerHTML = `<h3 style="margin:6px 0 8px">Resumen por mes</h3>${resumen}
    <h3 style="margin:18px 0 8px">Movimientos recientes</h3>
    <div class="bd-scroll"><table class="bd-table"><thead><tr><th>Fecha</th><th>Acción</th><th>Cliente</th><th>Estado</th><th>Por</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
// Descargar seleccionando columnas (abre en Excel)
function openBDDownloadModal(list) {
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  const defaults = bdHeader.filter(h => { const k = bdHeaderToKey(h); return k === "nombre" || k === "nit" || k === "celular" || k === "codigoId" || k === "estado"; });
  const items = bdHeader.map(h => {
    const on = defaults.indexOf(h) >= 0;
    return `<label style="display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);font-size:13px;cursor:pointer"><input type="checkbox" data-dc="${escape(h)}" ${on ? "checked" : ""} style="width:auto"><span style="flex:1">${escape(h)}</span></label>`;
  }).join("");
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:22px;width:520px;max-width:96vw;max-height:90vh;display:flex;flex-direction:column">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><h3 style="margin:0">Descargar (Excel/CSV)</h3><button class="mini" id="dc_x">✕</button></div>
    <p class="note" style="margin:0 0 10px">Elige qué columnas descargar. Se bajan los <b>${list.length}</b>registros que estás viendo ahora (según el filtro/subpestaña actual).</p>
    <div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn sec" id="dc_all" style="flex:1;border:1px solid var(--line)">Todas</button><button class="btn sec" id="dc_none" style="flex:1;border:1px solid var(--line)">Ninguna</button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;overflow-y:auto;flex:1">${items}</div>
    <div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn" id="dc_go">⬇ Descargar</button></div>
  </div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.onclick = e => { if (e.target === bg) close(); };
  bg.querySelector("#dc_x").onclick = close;
  bg.querySelector("#dc_all").onclick = () => bg.querySelectorAll("input[data-dc]").forEach(c => c.checked = true);
  bg.querySelector("#dc_none").onclick = () => bg.querySelectorAll("input[data-dc]").forEach(c => c.checked = false);
  bg.querySelector("#dc_go").onclick = () => {
    const cols = [...bg.querySelectorAll("input[data-dc]")].filter(c => c.checked).map(c => c.dataset.dc);
    if (!cols.length) { alert("Elige al menos una columna."); return; }
    const rws = list.map(r => cols.map(h => String(r[h] == null ? "" : r[h])));
    downloadCSV("CONTAX-Clientes-" + hoyISO() + ".csv", cols, rws);
    close();
  };
}

// Siguiente Código de ID correlativo (el mayor número usado + 1)
function bdNextCodigo() {
  let max = 0;
  const ver = r => { const n = parseInt(String(bdV(r, "codigoId")).replace(/\D/g, ""), 10); if (!isNaN(n) && n > max && n < 1000000) max = n; };
  BD.forEach(ver); ((typeof BDC !== "undefined" && BDC.docs) || []).forEach(ver);
  return String(max + 1);
}
function openBDModal(row) {
  const canEdit = canEditClientes();
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  const groupsHtml = BD_GROUPS.map(g => {
    const fields = BD_FIELDS.filter(f =>f[2] === g);
    const inputs = fields.map(([key, label, , type]) => {
      const val = escape(row ? bdV(row, key) : "");
      const dis = canEdit ? "" : "disabled";
      if (type === "textarea") return `<div class="field" style="grid-column:1/-1"><label>${escape(label)}</label><textarea id="bf_${key}" style="min-height:70px" ${dis}>${val}</textarea></div>`;
      if (type === "secret") return `<div class="field"><label>${escape(label)}</label><input id="bf_${key}" type="password" value="${val}" ${dis}><span class="reveal note" data-rev="bf_${key}" style="font-size:11px">mostrar</span></div>`;
      if (type === "estado") return `<div class="field"><label>${escape(label)}</label><input id="bf_${key}" value="${val}" list="bf_estlist" placeholder="ACTIVO" ${dis}></div>`;
      if (key === "codigoId" && !row) return `<div class="field"><label>${escape(label)} <span class="note" style="font-size:11px">(automático, correlativo)</span></label><input id="bf_${key}" value="${escape(bdNextCodigo())}" ${dis}></div>`;
      return `<div class="field"><label>${escape(label)}</label><input id="bf_${key}" value="${val}" ${dis}></div>`;
    }).join("");
    return `<div class="fs">${g}</div><div class="grid2">${inputs}</div>`;
  }).join("");
  const estOpts = [...new Set(["ACTIVO", "CLIENTE INACTIVO", "INACTIVO SOLICITADO", "LISTA NEGRA", "SUSCRIPCIÓN FACTURACIÓN", ...BD.map(x =>bdV(x, "estado"))].filter(Boolean))];
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:24px;width:760px;max-width:96vw;max-height:92vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">${row ? (canEdit ? "Editar registro" : "Ficha") : "Nuevo registro"}</h3>
      <button class="mini" id="bf_x">✕</button></div>
    <datalist id="bf_estlist">${estOpts.map(e => `<option value="${escape(e)}">`).join("")}</datalist>
    ${groupsHtml}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">
      <button class="btn sec" id="bf_cancel" style="border:1px solid var(--line)">Cerrar</button>
      ${canEdit ? '<button class="btn" id="bf_save">Guardar</button>' : ""}</div>
    <div class="msg" id="bf_msg"></div></div>`;
  document.body.appendChild(bg);
  const close = () =>bg.remove();
  bg.onclick = (e) => { if (e.target === bg) close(); };
  bg.querySelector("#bf_x").onclick = close;
  bg.querySelector("#bf_cancel").onclick = close;
  bg.querySelectorAll("[data-rev]").forEach(s =>s.onclick = () => { const i = bg.querySelector("#" + s.dataset.rev); if (i) { i.type = i.type === "password" ? "text" : "password"; s.textContent = i.type === "password" ? "mostrar" : "ocultar"; } });
  const saveBtn = bg.querySelector("#bf_save");
  if (saveBtn) saveBtn.onclick = async () => {
    const item = {}, itemByHeader = {};
    BD_FIELDS.forEach(([key, label]) => {
      const i = bg.querySelector("#bf_" + key); const val = i ? i.value.trim() : "";
      item[label] = val;
      const hdr = (bdKey2Header && bdKey2Header[key]) || label; // clave real de la fila (ej. "20. ESTADO USUARIO")
      itemByHeader[hdr] = val;
    });
    if (!item[BD_KEY2LBL["razon"]] && !item[BD_KEY2LBL["nombre"]]) { bg.querySelector("#bf_msg").className = "msg err"; bg.querySelector("#bf_msg").textContent = "Pon al menos el nombre o razón social."; return; }
    saveBtn.disabled = true; bg.querySelector("#bf_msg").className = "msg"; bg.querySelector("#bf_msg").textContent = "Guardando…";
    const estAnt = row ? bdV(row, "estado") : "";
    const estNue = item[BD_KEY2LBL["estado"]] || "";
    const nombreCli = item[BD_KEY2LBL["nombre"]] || item[BD_KEY2LBL["razon"]] || "";
    const nowISO = new Date().toISOString();
    // Cliente nuevo: el código se asigna al guardar (por si otra persona creó uno mientras tanto)
    if (!row) {
      const hdrC = (bdKey2Header && bdKey2Header["codigoId"]) || BD_KEY2LBL["codigoId"];
      const escrito = String(itemByHeader[hdrC] || "").trim(), sig = bdNextCodigo();
      if (!escrito || (Number(escrito) && Number(escrito) < Number(sig) && BD.some(x => bdV(x, "codigoId") === escrito))) { itemByHeader[hdrC] = sig; item[BD_KEY2LBL["codigoId"]] = sig; }
    }
    // Marcas de fecha automáticas (alta/baja) en la propia ficha
    if (!row) itemByHeader["_altaISO"] = nowISO;
    if (row && estNue !== estAnt && /inactiv|negra|suspend|baja/i.test(estNue.normalize("NFD").replace(/[̀-ͯ]/g, ""))) itemByHeader["_bajaISO"] = nowISO;
    const ok = await bdSave(item, row ? bdV(row, "codigoId") : "", itemByHeader, row ? row._docid : "");
    if (ok) {
      // Registro de movimiento
      if (!row) bdLog({ accion: "alta", nombre: nombreCli, estadoNuevo: estNue });
      else if (estNue !== estAnt) bdLog({ accion: "cambio_estado", nombre: nombreCli, estadoAnterior: estAnt, estadoNuevo: estNue });
      close(); renderBaseDatos(true); setTimeout(() => { const mm = el("bd_msg"); if (mm) { mm.className = "msg ok"; mm.textContent = "✓ Guardado."; } }, 400);
    }
    else { saveBtn.disabled = false; bg.querySelector("#bf_msg").className = "msg err"; bg.querySelector("#bf_msg").textContent = "No se pudo guardar."; }
  };
}

async function bdSave(item, keyValue, itemByHeader, docid) {
  const cfg = await loadConfigDoc();
  if (cfg.bdEnFirebase) {
    try {
      let id = docid || String(keyValue || "").trim().replace(/[\/#.\$\[\]]/g, "_");
      if (!id) id = "row" + Date.now();
      const datos = Object.assign({}, itemByHeader || item, { _upd: Date.now() });
      await setDoc(doc(db, BD_COLL, id), datos, { merge: true });
      bdcPoner(id, datos);
      return true;
    } catch (e) { return false; }
  }
  const url = await bdBridgeUrl(); if (!url) return false;
  const payload = { action: "save", key: "Codigo de ID", keyValue: keyValue || item["Codigo de ID"] || "", item: item };
  try { await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }); return true; }
  catch (e) { return false; }
}
// Sincroniza la Base de Datos de Firebase con el Google Sheet: SOLO escribe lo nuevo o lo que cambió.
// No lee Firebase de nuevo (usa la copia local) y muestra una vista previa antes de guardar.
async function bdSincronizarSheet() {
  if (!isAdmin()) { alert("Solo el administrador puede sincronizar."); return; }
  const btn = el("bd_sync"); const txt0 = btn ? btn.innerHTML : "";
  if (btn) { btn.disabled = true; btn.textContent = "Leyendo el Sheet…"; }
  const fin = () => { if (btn) { btn.disabled = false; btn.innerHTML = txt0; } };
  const data = await new Promise(res => bdFetch(res));
  if (!data || data.error) { fin(); alert("No se pudo leer el Google Sheet (" + ((data && data.error) || "") + "). Revisa en Configuración la URL del puente de la Base de Datos."); return; }
  const header = (data.header && data.header.length) ? data.header : ((data.rows && data.rows.length) ? Object.keys(data.rows[0]) : []);
  fin();
  await bdSincronizarFilas(header, data.rows || [], "Google Sheets");
}
// Importa un Excel (.xlsx) de la Base de Datos: misma vista previa, solo escribe lo que cambió
async function bdImportarExcel(file) {
  if (!isAdmin()) { alert("Solo el administrador puede importar."); return; }
  const btn = el("bd_xls"); const txt0 = btn ? btn.innerHTML : "";
  if (btn) { btn.disabled = true; btn.textContent = "Leyendo el Excel…"; }
  try {
    const X = await arqLoadXLSX();
    const wb = X.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const matriz = X.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
    const header = (matriz[0] || []).map(h => String(h).trim()).filter(Boolean);
    const filas = matriz.slice(1).map(r => { const o = {}; header.forEach((h, i) => { o[h] = r[i] instanceof Date ? r[i] : (r[i] == null ? "" : r[i]); }); return o; });
    if (btn) { btn.disabled = false; btn.innerHTML = txt0; }
    await bdSincronizarFilas(header, filas, "Excel (" + file.name + ")", true);
  } catch (e) { if (btn) { btn.disabled = false; btn.innerHTML = txt0; } alert("No se pudo leer el Excel: " + (e.message || e)); }
}
async function bdSincronizarFilas(header, filasIn, origenTxt, permitirBorrar) {
  const filas = filasIn.filter(r => Object.values(r).some(v => String(v == null ? "" : v).trim() !== ""));
  // Fechas: se comparan como día (aaaa-mm-dd) y se guardan con el mismo formato que ya usa la Base de Datos
  const pad = n => String(n).padStart(2, "0");
  const diaDe = v => {
    if (v instanceof Date && !isNaN(v)) return v.getFullYear() + "-" + pad(v.getMonth() + 1) + "-" + pad(v.getDate());
    const t = String(v == null ? "" : v).trim(); let m;
    if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):\d{2})?/))) { if (m[4]) { const d = new Date(t); if (!isNaN(d)) return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); } return m[1] + "-" + m[2] + "-" + m[3]; }
    if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return m[3] + "-" + pad(m[2]) + "-" + pad(m[1]);
    return null;
  };
  const formatoFecha = {};
  header.forEach(h => { const ej = BD.map(r => r[h]).find(v => v && diaDe(v)); formatoFecha[h] = !ej ? "dmy" : /^\d{4}-\d{2}-\d{2}T/.test(String(ej)) ? "iso" : /^\d{4}-\d{2}-\d{2}$/.test(String(ej)) ? "ymd" : "dmy"; });
  const aTexto = (h, v) => {
    if (v instanceof Date && !isNaN(v)) { const d = diaDe(v), [y, mo, da] = d.split("-"); return formatoFecha[h] === "iso" ? new Date(Date.UTC(+y, +mo - 1, +da, 4)).toISOString() : formatoFecha[h] === "ymd" ? d : da + "/" + mo + "/" + y; }
    return String(v == null ? "" : v).trim();
  };
  filas.forEach(f => header.forEach(h => { f[h] = aTexto(h, f[h]); }));
  const norm = v => String(v == null ? "" : v).trim();
  const igual = (a, b) => { const x = norm(a), y = norm(b); if (x === y) return true; const da = diaDe(x), db = diaDe(y); if (da && db) return da === db; const na = Number(x), nb = Number(y); return x !== "" && y !== "" && !isNaN(na) && !isNaN(nb) && na === nb; };
  const soloDig = v => norm(v).replace(/\D/g, "");
  const porCod = {}, porNit = {};
  BD.forEach(r => { const c = norm(bdV(r, "codigoId")); if (c) porCod[c] = r; const n = soloDig(bdV(r, "nit")); if (n && !porNit[n]) porNit[n] = r; });
  const usados = new Set(BD.map(r => r._docid));
  const nuevos = [], cambios = [];
  filas.forEach((f, idx) => {
    const cod = norm(bdV(f, "codigoId")), nit = soloDig(bdV(f, "nit"));
    const ex = (cod && porCod[cod]) || (nit && porNit[nit]) || null;
    if (!ex) {
      let id = cod.replace(/[\/#.\$\[\]]/g, "_");
      if (!id || usados.has(id)) id = "row" + Date.now() + "_" + idx;
      usados.add(id); nuevos.push({ id: id, datos: f, nombre: bdV(f, "nombre") || bdV(f, "razon") || cod }); return;
    }
    const dif = {};
    header.forEach(h => { if (!igual(f[h], ex[h])) dif[h] = f[h] == null ? "" : f[h]; });
    if (Object.keys(dif).length) cambios.push({ id: ex._docid, ex: ex, dif: dif, nombre: bdV(ex, "nombre") || bdV(ex, "razon") || cod });
  });
  const enArchivo = new Set();
  filas.forEach(f => { const cod = norm(bdV(f, "codigoId")), nit = soloDig(bdV(f, "nit")); const ex = (cod && porCod[cod]) || (nit && porNit[nit]); if (ex) enArchivo.add(ex._docid); });
  const sobran = permitirBorrar ? BD.filter(r => !enArchivo.has(r._docid)) : [];
  if (typeof fin === "function") fin();
  const hEst = (bdKey2Header && bdKey2Header["estado"]) || BD_KEY2LBL["estado"];
  const total = nuevos.length + cambios.length;
  const totalConBorrar = total + sobran.length;
  const lineas = cambios.slice(0, 150).map(c => `<tr><td>${escape(c.nombre)}</td><td>${Object.keys(c.dif).map(h => `<div><b>${escape(h)}:</b> <span style="color:var(--muted);text-decoration:line-through">${escape(norm(c.ex[h]) || "(vacío)")}</span> → ${escape(norm(c.dif[h]) || "(vacío)")}</div>`).join("")}</td></tr>`).join("");
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:22px;width:820px;max-width:96vw;max-height:90vh;display:flex;flex-direction:column">
    <h3 style="margin:0 0 6px">Actualizar Base de Datos desde ${escape(origenTxt)}</h3>
    <p class="note" style="margin:0 0 12px">Archivo: <b>${filas.length}</b> registros · Panel: <b>${BD.length}</b> registros.<br>
      Se guardarán solo <b>${nuevos.length}</b> cliente(s) nuevo(s) y <b>${cambios.length}</b> con cambios = <b>${total}</b> escrituras en Firebase (el límite gratis es 20.000 por día).${sobran.length ? "" : " No se borra nada."}</p>
    ${sobran.length ? `<label style="display:flex;gap:8px;align-items:flex-start;margin:0 0 10px;font-size:13px;border:1px solid var(--line);border-radius:8px;padding:8px 10px"><input type="checkbox" id="sy_borrar" style="width:auto;margin-top:2px"> <span><b>Eliminar ${sobran.length} cliente(s) que están en el panel pero no en el archivo</b> (para que quede exactamente igual al Excel). Revisa la lista antes de marcar: ${sobran.slice(0, 60).map(r => escape(bdV(r, "nombre") || bdV(r, "razon") || bdV(r, "codigoId") || r._docid)).join(", ")}${sobran.length > 60 ? "…" : ""}</span></label>` : ""}
    <div style="overflow:auto;flex:1;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:12.5px">
      ${nuevos.length ? `<p style="margin:4px 0 8px"><b>Nuevos:</b> ${nuevos.map(n => escape(n.nombre)).join(", ")}</p>` : ""}
      ${cambios.length ? `<table class="bd-table" style="width:100%"><thead><tr><th>Cliente</th><th>Cambios (antes → Sheet)</th></tr></thead><tbody>${lineas}</tbody></table>${cambios.length > 150 ? `<p class="note">…y ${cambios.length - 150} más.</p>` : ""}` : ""}
      ${!total ? '<p>No hay datos nuevos ni cambios.</p>' : ""}
    </div>
    <p class="msg" id="sy_msg" style="margin:10px 0 0"></p>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btn sec" id="sy_x" style="border:1px solid var(--line)">Cancelar</button>
      ${totalConBorrar ? `<button class="btn" id="sy_ok">Aplicar cambios</button>` : ""}
    </div></div>`;
  document.body.appendChild(bg);
  bg.querySelector("#sy_x").onclick = () => bg.remove();
  const ok = bg.querySelector("#sy_ok"); if (!ok) return;
  ok.onclick = async () => {
    ok.disabled = true; bg.querySelector("#sy_x").disabled = true;
    const msg = bg.querySelector("#sy_msg");
    const tareas = nuevos.map(n => ({ id: n.id, datos: Object.assign({}, n.datos, { _altaISO: new Date().toISOString() }), log: { accion: "alta", nombre: n.nombre, estadoNuevo: norm(n.datos[hEst]) } }))
      .concat(cambios.map(c => ({ id: c.id, datos: Object.assign({}, c.dif), log: (hEst in c.dif) ? { accion: "cambio_estado", nombre: c.nombre, estadoAnterior: norm(c.ex[hEst]), estadoNuevo: norm(c.dif[hEst]) } : null })));
    let hechos = 0, errores = 0; const CH = 20;
    for (let i = 0; i < tareas.length; i += CH) {
      await Promise.all(tareas.slice(i, i + CH).map(async t => {
        try {
          const d = Object.assign({}, t.datos, { _upd: Date.now() });
          await setDoc(doc(db, BD_COLL, t.id), d, { merge: true }); bdcPoner(t.id, d); hechos++;
          if (t.log) await bdLog(Object.assign(t.log, { detalle: "Actualizado desde " + origenTxt }));
        } catch (e) { errores++; }
      }));
      msg.className = "msg"; msg.textContent = `Guardando… ${hechos}/${tareas.length}`;
    }
    if (sobran.length && bg.querySelector("#sy_borrar") && bg.querySelector("#sy_borrar").checked) {
      for (const r of sobran) {
        try { await deleteDoc(doc(db, BD_COLL, r._docid)); if (BDC.docs) BDC.docs = BDC.docs.filter(x => x._docid !== r._docid); hechos++; await bdLog({ accion: "baja_registro", nombre: bdV(r, "nombre") || bdV(r, "razon") || r._docid, estadoAnterior: norm(r[hEst]), detalle: "Eliminado al actualizar desde " + origenTxt }); }
        catch (e) { errores++; }
      }
      bdcGuardar();
    }
    if (header.length) { try { await setDoc(doc(db, "config", "app"), { bdHeader: header }, { merge: true }); } catch (e) {} }
    bg.remove(); bdLoaded = false;
    alert(`Listo: ${hechos} cliente(s) actualizado(s)${errores ? ", " + errores + " con error" : ""}.`);
    renderBaseDatos(true);
  };
}
// Migra todos los registros del Google Sheet a Firebase (una sola vez)
async function migrarBDaFirebase() {
  if (!isAdmin()) { alert("Solo el administrador puede migrar."); return; }
  if (!confirm("Se copiarán TODOS los registros del Google Sheet a Firebase. Después la Base de Datos funcionará desde Firebase (más rápido) y el Sheet quedará como respaldo. ¿Continuar?")) return;
  const btn = el("bd_migrar"); if (btn) { btn.disabled = true; btn.textContent = "Leyendo el Sheet…"; }
  bdFetch(async (data) => {
    if (!data || data.error) { alert("No se pudo leer el Sheet: " + ((data && data.error) || "")); if (btn) { btn.disabled = false; btn.textContent = "⬆ Migrar a Firebase"; } return; }
    try {
      const header = (data.header && data.header.length) ? data.header : ((data.rows && data.rows.length) ? Object.keys(data.rows[0]) : []);
      const rows = (data.rows || []).filter(r => Object.values(r).some(v => String(v == null ? "" : v).trim() !== ""));
      bdHeader = header; bdBuildKeyMap();
      await setDoc(doc(db, "config", "app"), { bdHeader: header, bdEnFirebase: true, updatedAt: serverTimestamp() }, { merge: true });
      const used = {};
      const docs = rows.map((r, idx) => {
        let id = String(bdV(r, "codigoId") || "").trim().replace(/[\/#.\$\[\]]/g, "_");
        if (!id || used[id]) id = "row" + idx + (id ? ("_" + id) : "");
        used[id] = 1; return { id: id, data: r };
      });
      let done = 0; const CH = 20;
      for (let i = 0; i < docs.length; i += CH) {
        await Promise.all(docs.slice(i, i + CH).map(d => setDoc(doc(db, BD_COLL, d.id), d.data)));
        done += Math.min(CH, docs.length - i);
        if (btn) btn.textContent = `Migrando… ${done}/${docs.length}`;
      }
      bdLoaded = false;
      alert(`Migrados ${done} registros a Firebase. La Base de Datos ahora funciona desde Firebase (más rápido). El Google Sheet queda como respaldo.`);
      renderBaseDatos();
    } catch (e) { alert("Error al migrar: " + (e.code || e.message)); if (btn) { btn.disabled = false; btn.textContent = "⬆ Migrar a Firebase"; } }
  });
}

// ============================================================
//  MÓDULO TARIFAS — catálogo de servicios (alimenta a la IA)
// ============================================================
let TARIFAS = [], tarFilter = "";
async function tarLoad() {
  try { const snap = await getDocs(collection(db, "tarifas")); TARIFAS = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); }
  catch (e) { TARIFAS = []; }
  TARIFAS.sort((a, b) => (a.categoria || "").localeCompare(b.categoria || "") || (a.orden || 0) - (b.orden || 0) || (a.nombre || "").localeCompare(b.nombre || ""));
}
function tarMoney(v) { const n = Number(v); return isNaN(n) ? "" : ("Bs " + n.toLocaleString("es-BO", { maximumFractionDigits: 2 })); }
let tarSubtab = "servicios";
async function renderTarifas() {
  el("v-tarifas").innerHTML = `<h1>Tarifas y Suscripciones</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  await tarLoad();
  paintTarifasView();
}
function paintTarifasView() {
  el("v-tarifas").innerHTML = `<h1>Tarifas y Suscripciones</h1>
    <div class="subtabs">
      <button class="subtab ${tarSubtab === 'servicios' ? 'on' : ''}" data-st="servicios">Catálogo de servicios</button>
      <button class="subtab ${tarSubtab === 'suscripciones' ? 'on' : ''}" data-st="suscripciones">Suscripciones</button>
    </div>
    <div id="tar-body"></div>`;
  el("v-tarifas").querySelectorAll(".subtab").forEach(b => b.onclick = () => { tarSubtab = b.dataset.st; paintTarifasView(); });
  if (tarSubtab === "suscripciones") paintSuscripciones();
  else paintTarifas();
}
function paintTarifas() {
  const box = el("tar-body") || el("v-tarifas");
  const admin = isAdmin();
  const term = tarFilter.toLowerCase().trim();
  const list = TARIFAS.filter(t => !term || `${t.nombre || ""} ${t.categoria || ""} ${t.descripcion || ""}`.toLowerCase().includes(term));
  const cats = [...new Set(list.map(t => t.categoria || "General"))];
  let rows = "";
  cats.forEach(cat => {
    rows += `<tr><td colspan="5" class="fs" style="border:0;padding:16px 0 6px">${escape(cat)}</td></tr>`;
    list.filter(t => (t.categoria || "General") === cat).forEach(t => {
      const precio = (t.precio != null && t.precio !== "") ? tarMoney(t.precio) : (t.precioTexto ? escape(t.precioTexto) : "—");
      rows += `<tr>
        <td><b>${escape(t.nombre || "")}</b>${t.activo === false ? ' <span class="badge off">inactivo</span>' : ''}</td>
        <td style="white-space:nowrap"><b>${precio}</b></td>
        <td>${escape(t.plazo || "—")}</td>
        <td style="color:var(--muted);max-width:380px">${escape(t.descripcion || "")}</td>
        <td style="text-align:right;white-space:nowrap">${admin ? `<button class="mini" data-edit="${t.id}">Editar</button> <button class="mini" data-del="${t.id}">✕</button>` : ''}</td></tr>`;
    });
  });
  box.innerHTML = `
    <p class="lead">Catálogo de servicios con precios, plazos y detalle. El Asistente IA del Panel lo usa para responder. ${admin ? 'Edita aquí y se actualiza para todo el equipo.' : ''}</p>
    <div class="toolbar">
      <input id="tar_search" class="mini" style="padding:9px;min-width:240px" placeholder="Buscar servicio…" value="${escape(tarFilter)}">
      ${admin ? '<button class="btn" id="tar_new">＋ Nuevo servicio</button>' : ''}
      ${admin ? '<button class="btn sec" id="tar_seed" style="border:1px solid var(--line)" title="Carga los planes de CONTAX (Básico, Standard, Premium, Facturación, Trámites, Balances)">⬆ Cargar planes CONTAX</button>' : ''}
      <button class="btn sec" id="tar_export" style="border:1px solid var(--line)" title="Descargar respaldo en CSV">⬇ Exportar</button>
      <span class="msg" id="tar_msg" style="align-self:center"></span>
    </div>
    <table><thead><tr><th>Servicio</th><th>Precio</th><th>Plazo</th><th>En qué consiste</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="5" style="color:var(--muted)">Aún no hay servicios. ${admin ? 'Crea el primero con “＋ Nuevo servicio”.' : ''}</td></tr>`}</tbody></table>`;
  el("tar_search").oninput = () => { tarFilter = el("tar_search").value; paintTarifas(); };
  el("tar_export").onclick = () => {
    const H = ["Nombre", "Categoría", "Precio (Bs)", "Precio texto", "Plazo", "Tipo", "Activo", "Descripción"];
    const rws = TARIFAS.map(t => [t.nombre || "", t.categoria || "", (t.precio != null ? t.precio : ""), t.precioTexto || "", t.plazo || "", t.tipo || "", (t.activo === false ? "No" : "Sí"), t.descripcion || ""]);
    downloadCSV("CONTAX-Tarifas-" + hoyISO() + ".csv", H, rws);
  };
  if (el("tar_new")) el("tar_new").onclick = () => openTarifaModal(null);
  if (el("tar_seed")) el("tar_seed").onclick = seedTarifasContax;
  el("v-tarifas").querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openTarifaModal(TARIFAS.find(x => x.id === b.dataset.edit)));
  el("v-tarifas").querySelectorAll("[data-del]").forEach(b => b.onclick = () => delTarifa(TARIFAS.find(x => x.id === b.dataset.del)));
}
// Planes de CONTAX (según la información dada) para cargar de una vez
const CONTAX_TARIFAS = [
  { id: "contax-decl-basico", nombre: "Declaración Mensual — Básico", categoria: "Declaración Mensual", tipo: "declaracion", precio: 30, plazo: "", descripcion: "Declaración jurada SIN movimiento (no se ingresan las facturas electrónicas del portal). Incluye facturación. Tarifa especial para repartidores (YANGO, PedidosYa, TADA, ToGo, Turbo).", activo: true },
  { id: "contax-decl-standard", nombre: "Declaración Mensual — Standard", categoria: "Declaración Mensual", tipo: "declaracion", precio: 50, precioTexto: "50 Bs (paga 25–30) / 60 Bs (paga 1–5)", plazo: "", descripcion: "Declaración con hasta 100 facturas (electrónicas + manuales en total). Incluye emisión de facturas. 50 Bs si recepciona del 25 al 30 (anticipado), 60 Bs si paga del 1 al 5. Tarifa especial para repartidores.", activo: true },
  { id: "contax-decl-premium", nombre: "Declaración Mensual — Premium", categoria: "Declaración Mensual", tipo: "declaracion", precio: 95, plazo: "", descripcion: "Igual que Standard (hasta 100 facturas, incluye emisión de facturas) pero para empresas unipersonales que NO son repartidores.", activo: true },
  { id: "contax-facturacion", nombre: "Facturación (suscripción)", categoria: "Facturación", tipo: "facturacion", precio: 20, plazo: "", descripcion: "Solo emisión de facturas durante todo el mes.", activo: true },
  { id: "contax-tramites", nombre: "Trámites", categoria: "Trámites", tipo: "tramite", precio: null, precioTexto: "Según el trámite", plazo: "", descripcion: "Trámites varios (matrículas, ROE, SEPREC, actualizaciones). No es suscripción: se cobra por trámite.", activo: true },
  { id: "contax-balance", nombre: "Balance / Estados Financieros (EEFF)", categoria: "Balances", tipo: "eeff", precio: null, precioTexto: "Según la empresa", plazo: "", descripcion: "Elaboración de balances / estados financieros por gestión. No es suscripción: se cobra por trabajo.", activo: true }
];
async function seedTarifasContax() {
  if (!isAdmin()) return;
  const msg = el("tar_msg");
  if (!confirm("Se cargarán los planes de CONTAX (Básico 30, Standard 50/60, Premium 95, Facturación 20, Trámites y Balances). Si ya existían, se actualizan. ¿Continuar?")) return;
  const btn = el("tar_seed"); if (btn) { btn.disabled = true; btn.textContent = "Cargando…"; }
  try {
    for (const t of CONTAX_TARIFAS) {
      const { id, ...data } = t;
      data.updatedAt = serverTimestamp();
      await setDoc(doc(db, "tarifas", id), data, { merge: true });
    }
    await tarLoad(); await saveTarifasText(); paintTarifas();
    const m = el("tar_msg"); if (m) { m.className = "msg ok"; m.textContent = "✓ Planes de CONTAX cargados. Puedes editarlos cuando quieras."; }
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = "⬆ Cargar planes CONTAX"; }
    const m = el("tar_msg"); if (m) { m.className = "msg err"; m.textContent = "Error: " + (e.code || e.message) + " (solo el administrador puede cargarlos)."; }
  }
}
function openTarifaModal(t) {
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:24px;width:520px;max-width:96vw;max-height:92vh;overflow:auto">
    <h3 style="margin:0 0 14px">${t ? 'Editar' : 'Nuevo'} servicio</h3>
    <div class="field"><label>Nombre del servicio</label><input id="t_nombre" value="${t ? escape(t.nombre || '') : ''}" placeholder="Ej. Declaración jurada mensual"></div>
    <div class="grid2">
      <div class="field"><label>Categoría</label><input id="t_cat" list="t_catlist" value="${t ? escape(t.categoria || '') : ''}" placeholder="Ej. Trámites"></div>
      <div class="field"><label>Plazo de entrega</label><input id="t_plazo" value="${t ? escape(t.plazo || '') : ''}" placeholder="Ej. 48 a 72 hrs hábiles"></div>
    </div>
    <datalist id="t_catlist">${[...new Set(TARIFAS.map(x => x.categoria).filter(Boolean))].map(c => `<option value="${escape(c)}">`).join("")}</datalist>
    <div class="field"><label>Tipo (para las listas de trabajo)</label><select id="t_tipo"><option value="">Ninguno</option><option value="declaracion">Declaración</option><option value="tramite">Trámite</option><option value="eeff">Balance / EEFF</option><option value="otro">Otro</option></select></div>
    <div class="grid2">
      <div class="field"><label>Precio (Bs) — número</label><input id="t_precio" type="number" step="0.01" value="${t && t.precio != null ? escape(String(t.precio)) : ''}" placeholder="Ej. 150"></div>
      <div class="field"><label>…o precio en texto (si varía)</label><input id="t_preciotxt" value="${t ? escape(t.precioTexto || '') : ''}" placeholder="Ej. Desde Bs 250 / estacional"></div>
    </div>
    <div class="field"><label>En qué consiste (lo lee la IA y sirve para el cliente)</label><textarea id="t_desc" style="min-height:90px">${t ? escape(t.descripcion || '') : ''}</textarea></div>
    <div class="field"><label><input type="checkbox" id="t_activo" ${t && t.activo === false ? '' : 'checked'} style="width:auto;margin-right:6px">Activo (visible para la IA)</label></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn sec" id="t_cancel">Cancelar</button>
      <button class="btn" id="t_save">Guardar</button>
    </div><div class="msg" id="t_modmsg"></div></div>`;
  document.body.appendChild(bg);
  bg.querySelector("#t_tipo").value = t ? (t.tipo || "") : "";
  const close = () => bg.remove();
  bg.onclick = e => { if (e.target === bg) close(); };
  bg.querySelector("#t_cancel").onclick = close;
  bg.querySelector("#t_save").onclick = async () => {
    const nombre = bg.querySelector("#t_nombre").value.trim();
    const m = bg.querySelector("#t_modmsg");
    if (!nombre) { m.className = "msg err"; m.textContent = "Ponle un nombre al servicio."; return; }
    const pv = bg.querySelector("#t_precio").value.trim();
    const item = {
      nombre, categoria: bg.querySelector("#t_cat").value.trim() || "General", plazo: bg.querySelector("#t_plazo").value.trim(),
      precio: pv === "" ? null : Number(pv), precioTexto: bg.querySelector("#t_preciotxt").value.trim(),
      descripcion: bg.querySelector("#t_desc").value.trim(), tipo: bg.querySelector("#t_tipo").value, activo: bg.querySelector("#t_activo").checked, updatedAt: serverTimestamp()
    };
    const btn = bg.querySelector("#t_save"); btn.disabled = true; btn.textContent = "Guardando…";
    try {
      if (t && t.id) await setDoc(doc(db, "tarifas", t.id), item, { merge: true });
      else await setDoc(doc(collection(db, "tarifas")), item);
      await tarLoad(); await saveTarifasText(); close(); paintTarifas();
    } catch (e) { btn.disabled = false; btn.textContent = "Guardar"; m.className = "msg err"; m.textContent = "Error: " + (e.code || e.message); }
  };
}
function delTarifa(t) {
  if (!t) return;
  if (!confirm(`¿Eliminar el servicio "${t.nombre}"? Esta acción no se puede deshacer.`)) return;
  deleteDoc(doc(db, "tarifas", t.id)).then(async () => { await tarLoad(); await saveTarifasText(); paintTarifas(); });
}
function buildTarifasText() {
  const act = TARIFAS.filter(t => t.activo !== false);
  if (!act.length) return "";
  let txt = "TARIFAS Y SERVICIOS DE CONTAX (precios y plazos vigentes; usa estos datos para cotizar):\n";
  act.forEach(t => {
    const precio = (t.precio != null && t.precio !== "") ? ("Bs " + t.precio) : (t.precioTexto || "consultar");
    txt += `- ${t.nombre}${t.categoria ? ` [${t.categoria}]` : ''}: ${precio}${t.plazo ? `, plazo ${t.plazo}` : ''}.${t.descripcion ? ` ${t.descripcion}` : ''}\n`;
  });
  return txt.slice(0, 6000);
}
async function saveTarifasText() { try { await setDoc(doc(db, "config", "app"), { tarifasText: buildTarifasText(), updatedAt: serverTimestamp() }, { merge: true }); } catch (e) {} }

// ============================================================
//  MÓDULO SUSCRIPCIONES — control de planes, al día / morosos
//  Se calcula CRUZANDO las recepciones (pagos) con el mes calendario.
//  Regla CONTAX: el mes de la suscripción = mes calendario (no 30 días).
//  Pago del 25 al 30 = anticipado, cubre el mes siguiente (así lo registra
//  la recepcionista en "Mes a recepcionar"). El 1ro, quien no pagó el mes
//  en curso queda, de forma automática y visual, como SUSPENDIDO.
// ============================================================
let suscMesIdx = new Date().getMonth();   // 0-11
let suscAnio = new Date().getFullYear();
let suscFiltro = "";
let suscVista = "morosos";                 // morosos | aldia | todos
const SUSC_PLANES = {
  basico:      { lbl: "Básico",      precio: "30 Bs",      color: "#1f8a4c" },
  standard:    { lbl: "Standard",    precio: "50 / 60 Bs", color: "#0d6efd" },
  premium:     { lbl: "Premium",     precio: "95 Bs",      color: "#7a3ff2" },
  facturacion: { lbl: "Facturación", precio: "20 Bs",      color: "#b8860b" },
  otro:        { lbl: "Otro",        precio: "—",          color: "#55617a" }
};
const SUSC_FLOTAS = ["YANGO", "PEDIDOSYA", "PEDIDOS YA", "TADA", "TOGO", "TO GO", "TURBO", "UBER", "DIDI"];
function suscNorm(s) { return String(s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); }
function suscEsServicioSusc(servicio, imp) {
  const s = suscNorm(servicio);
  if (/TRAMITE|BALANCE|EEFF|ESTADO FINANCIERO/.test(s)) return false;
  if (/DECLARAC|FACTURAC|SUSCRIP|MENSUAL/.test(s)) return true;
  return [20, 30, 50, 60, 95].indexOf(Math.round(Number(imp) || 0)) >= 0;
}
function suscEsDeclaracion(servicio, imp) {
  const s = suscNorm(servicio);
  if (/DECLARAC|MENSUAL/.test(s)) return true;
  if (/FACTURAC/.test(s)) return false;
  return [30, 50, 60, 95].indexOf(Math.round(Number(imp) || 0)) >= 0;
}
function suscPlanFromImporte(imp, servicio) {
  const r = Math.round(Number(imp) || 0);
  if (/FACTURAC/.test(suscNorm(servicio)) && r <= 25) return "facturacion";
  if (r === 20) return "facturacion";
  if (r === 30) return "basico";
  if (r === 50 || r === 60) return "standard";
  if (r === 95) return "premium";
  return "otro";
}
function suscEsRepartidor(txt) { const s = suscNorm(txt); return SUSC_FLOTAS.some(f => s.indexOf(f) >= 0); }
// Etiqueta de mes como la usa la recepción: "OCTUBRE./26"
function suscMesLabel(idx, anio) { return REC_MESES[idx] + "./" + String(anio).slice(2); }
// Ciclo de suscripción que cubre un pago: por fecha de pago (día 25-30 → mes siguiente).
// Si no hay fecha de pago, usa la fecha de registro (fechaISO).
function suscCicloDe(rec) {
  const f = (rec.fechaPago && /^\d{4}-\d{2}-\d{2}/.test(rec.fechaPago)) ? rec.fechaPago : (rec.fechaISO || "");
  const d = new Date(f.length > 10 ? f : (f + "T00:00:00"));
  if (isNaN(d)) return null;
  let mes = d.getMonth(), anio = d.getFullYear();
  if (d.getDate() >= 25) { mes += 1; if (mes > 11) { mes = 0; anio += 1; } }
  return { mes, anio };
}
function suscKeyDe(r) { return (r.clienteId || r.codigoId || r.nit || r.clienteNombre || "").toString().trim().toUpperCase(); }
function suscTelLimpio(t) { let d = String(t || "").replace(/\D/g, ""); if (d.length >= 8 && d.indexOf("591") !== 0 && d.length <= 9) d = "591" + d; return d; }

// Arma la estructura de suscriptores a partir de las recepciones cargadas (RECEP)
function suscBuild(overrides) {
  overrides = overrides || {};
  const bdByCode = {}, bdByNit = {};
  BD.forEach(r => { const c = suscNorm(bdV(r, "codigoId")); const n = suscNorm(bdV(r, "nit")); if (c) bdByCode[c] = r; if (n) bdByNit[n] = r; });
  const map = {};
  RECEP.forEach(r => {
    const imp = Number(r.importe) || 0;
    if (!suscEsServicioSusc(r.servicio || r.servicioNombre, imp)) return;
    const key = suscKeyDe(r);
    if (!key) return;
    if (!map[key]) {
      const bd = bdByCode[suscNorm(r.clienteId || r.codigoId)] || bdByNit[suscNorm(r.nit)] || null;
      map[key] = {
        key, bd,
        codigoId: r.clienteId || r.codigoId || (bd ? bdV(bd, "codigoId") : ""),
        nit: r.nit || (bd ? bdV(bd, "nit") : ""),
        nombre: r.clienteNombre || (bd ? (bdV(bd, "nombre") || bdV(bd, "razon")) : "") || "—",
        celular: (bd ? bdV(bd, "celular") : "") || r.clienteCelular || "",
        correo: (bd ? bdV(bd, "correo") : "") || r.clienteCorreo || "",
        pagos: [], declPlan: null, declUlt: "", repartidor: false
      };
    }
    const m = map[key];
    m.pagos.push(r);
    if (suscEsRepartidor([r.clienteNombre, r.detalleServicio, r.servicio].join(" "))) m.repartidor = true;
    if (suscEsDeclaracion(r.servicio || r.servicioNombre, imp)) {
      const f = r.fechaPago || r.fechaISO || "";
      if (f >= (m.declUlt || "")) { m.declUlt = f; m.declPlan = suscPlanFromImporte(imp, r.servicio); }
    }
  });
  // Determina plan, estado del mes objetivo y aplica overrides
  const list = [];
  Object.keys(map).forEach(key => {
    const m = map[key];
    const ov = overrides[key] || {};
    if (ov.excluir) return;
    // Estado en la BD; ocultamos a los dados de baja (CLIENTE INACTIVO / lista negra / suspendidos)
    m.estadoBD = m.bd ? bdV(m.bd, "estado") : "";
    if (m.bd && esBaja(m.estadoBD)) return;
    m.plan = ov.plan || m.declPlan || (m.pagos.some(p => /FACTURAC/.test(suscNorm(p.servicio))) ? "facturacion" : "otro");
    // ¿pagó el ciclo del mes objetivo? (ciclo por fecha de pago: 25-30 = mes siguiente)
    const pagoMes = m.pagos.find(p => { const c = suscCicloDe(p); return c && c.mes === suscMesIdx && c.anio === suscAnio; });
    m.alDia = !!pagoMes;
    m.pagoMes = pagoMes || null;
    m.importeMes = pagoMes ? (Number(pagoMes.importe) || 0) : 0;
    // estado BD actual (si está en la base)
    m.estadoBD = m.bd ? bdV(m.bd, "estado") : "";
    list.push(m);
  });
  list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  return list;
}

async function paintSuscripciones() {
  const box = el("tar-body"); if (!box) return;
  box.innerHTML = `<p class="lead"><span class="cx-spin"></span> Cargando suscripciones (cruzando pagos del mes)…</p>`;
  const yr = String(suscAnio);
  try {
    await Promise.all([
      (recLoadedGestion !== yr && recLoadedGestion !== "todas") ? recepLoad(yr) : Promise.resolve(),
      new Promise(res => bdEnsureLoaded(() => res()))
    ]);
  } catch (e) {}
  const cfg = await loadConfigDoc();
  const overrides = cfg.suscOverrides || {};
  suscRenderBody(box, overrides);
}

function suscRenderBody(box, overrides) {
  const admin = isAdmin();
  const puedeEditar = !!(ME && ["admin", "supervisor", "editor", "cajero"].includes(ME.role));
  const target = suscMesLabel(suscMesIdx, suscAnio);
  const hoy = new Date();
  const esMesActual = (suscMesIdx === hoy.getMonth() && suscAnio === hoy.getFullYear());
  const esFuturo = (suscAnio > hoy.getFullYear()) || (suscAnio === hoy.getFullYear() && suscMesIdx > hoy.getMonth());
  const dia = hoy.getDate();
  let LIST = suscBuild(overrides);
  const total = LIST.length;
  const alDia = LIST.filter(m => m.alDia);
  const morosos = LIST.filter(m => !m.alDia);
  const ingresos = alDia.reduce((s, m) => s + m.importeMes, 0);
  const porPlan = {}; LIST.forEach(m => { porPlan[m.plan] = (porPlan[m.plan] || 0) + 1; });
  // término de suspensión según el mes elegido
  const etiquetaMoroso = esFuturo ? "Por renovar" : "Suspendido (sin pago)";

  const mesSel = REC_MESES.map((m, i) => `<option value="${i}" ${i === suscMesIdx ? "selected" : ""}>${m.charAt(0) + m.slice(1).toLowerCase()}</option>`).join("");
  const y2 = hoy.getFullYear();
  const anioSel = [];
  for (let y = y2 + 1; y >= 2023; y--) anioSel.push(`<option value="${y}" ${y === suscAnio ? "selected" : ""}>${y}</option>`);

  // Nota de precio Standard según ventana de pago (hoy)
  let notaStd = "";
  if (esMesActual || esFuturo) {
    if (dia >= 25 && dia <= 31) notaStd = `Hoy es día ${dia}: pago <b>anticipado (25–30)</b> → Standard <b>50 Bs</b> para el mes siguiente.`;
    else if (dia >= 1 && dia <= 5) notaStd = `Hoy es día ${dia}: pago <b>regular (1–5)</b> → Standard <b>60 Bs</b>.`;
    else notaStd = `Standard: <b>50 Bs</b> si paga del 25 al 30 (anticipado), <b>60 Bs</b> si paga del 1 al 5.`;
  }

  const planChips = Object.keys(SUSC_PLANES).filter(p => porPlan[p]).map(p =>
    `<span style="display:inline-block;background:${SUSC_PLANES[p].color}22;color:${SUSC_PLANES[p].color};border:1px solid ${SUSC_PLANES[p].color}55;border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600;margin:2px">${SUSC_PLANES[p].lbl}: ${porPlan[p]} · ${SUSC_PLANES[p].precio}</span>`).join("");

  const term = suscFiltro.toLowerCase().trim();
  const vistaList = (suscVista === "aldia" ? alDia : suscVista === "todos" ? LIST : morosos)
    .filter(m => !term || `${m.nombre} ${m.nit} ${m.celular}`.toLowerCase().includes(term));

  const planBadge = m => `<span style="background:${SUSC_PLANES[m.plan].color}22;color:${SUSC_PLANES[m.plan].color};border-radius:6px;padding:2px 7px;font-size:11px;font-weight:600">${SUSC_PLANES[m.plan].lbl}</span>${m.repartidor ? ' <span style="background:#ff8c0022;color:#c76a00;border-radius:6px;padding:2px 6px;font-size:10px">repartidor</span>' : ''}`;

  const filas = vistaList.map(m => {
    const estadoTxt = m.alDia
      ? `<span style="color:var(--ok,#1f8a4c);font-weight:600">✓ Al día</span>`
      : `<span style="color:${esFuturo ? '#b8860b' : 'var(--danger)'};font-weight:600">${esFuturo ? '◷ ' : '⛔ '}${etiquetaMoroso}</span>`;
    const tel = suscTelLimpio(m.celular);
    const acc = !m.alDia && tel
      ? `<button class="mini" data-wa="${escape(tel)}" data-nom="${escape(m.nombre)}" title="Abrir WhatsApp para avisarle">📲 Avisar</button>`
      : (m.alDia && m.pagoMes ? `<span style="color:var(--muted);font-size:11px">${escape(m.pagoMes.fechaPago || "")} · Bs ${m.importeMes}</span>` : "");
    return `<tr>
      <td><b>${escape(m.nombre)}</b>${m.nit ? `<div style="color:var(--muted);font-size:11px">NIT ${escape(m.nit)}</div>` : ""}</td>
      <td>${planBadge(m)}</td>
      <td>${escape(m.celular || "—")}</td>
      <td>${estadoTxt}${m.estadoBD ? `<div style="color:var(--muted);font-size:10px">BD: ${escape(m.estadoBD)}</div>` : ""}</td>
      <td style="text-align:right;white-space:nowrap">${acc}${admin ? ` <button class="mini" data-ov="${escape(m.key)}" title="Cambiar plan / excluir">⚙</button>` : ""}</td>
    </tr>`;
  }).join("");

  box.innerHTML = `
    <p class="lead">Control de suscripciones mensuales. El estado <b>al día / suspendido</b> se calcula automáticamente cruzando los pagos registrados en <b>Recepción</b> con el mes que eliges. Modalidad por <b>mes calendario</b>: el pago del 25 al 30 es anticipado y cubre el mes siguiente.</p>

    <div class="toolbar" style="gap:10px;align-items:center;flex-wrap:wrap">
      <label style="font-size:13px;color:var(--muted)">Mes a controlar:</label>
      <select id="su_mes" class="mini">${mesSel}</select>
      <select id="su_anio" class="mini">${anioSel.join("")}</select>
      <button class="mini" id="su_reload" title="Volver a leer los pagos">↻ Actualizar</button>
      <span style="flex:1"></span>
      <input id="su_search" class="mini" style="padding:9px;min-width:200px" placeholder="Buscar cliente…" value="${escape(suscFiltro)}">
      <button class="btn sec" id="su_export" style="border:1px solid var(--line)" title="Descargar lista en Excel/CSV">⬇ Exportar</button>
    </div>

    <div class="kpis" style="margin:12px 0">
      <div class="kpi"><div class="n">${total}</div><div class="l">Suscriptores</div></div>
      <div class="kpi"><div class="n" style="color:var(--ok,#1f8a4c)">${alDia.length}</div><div class="l">Al día (${REC_MESES[suscMesIdx].toLowerCase()})</div></div>
      <div class="kpi"><div class="n" style="color:${esFuturo ? '#b8860b' : 'var(--danger)'}">${morosos.length}</div><div class="l">${esFuturo ? 'Por renovar' : 'Suspendidos / sin pago'}</div></div>
      <div class="kpi"><div class="n">Bs ${ingresos.toLocaleString("es-BO")}</div><div class="l">Cobrado del mes</div></div>
    </div>
    <div style="margin:4px 0 12px">${planChips || '<span style="color:var(--muted)">Aún no hay planes detectados.</span>'}</div>
    ${notaStd ? `<p class="note" style="margin:0 0 12px">💡 ${notaStd}</p>` : ""}
    ${esMesActual && morosos.length && puedeEditar ? `<p class="note" style="margin:0 0 12px;border-left:3px solid var(--danger);padding-left:10px">Hay <b>${morosos.length}</b> suscriptores sin pago de ${REC_MESES[suscMesIdx].toLowerCase()}. Puedes marcarlos a todos como “Servicio Suspendido” en la Base de Datos con un clic: <button class="mini" id="su_aplicar" style="margin-left:6px">⛔ Aplicar suspensión en la BD</button></p>` : ""}

    <div class="subtabs" style="margin-bottom:8px">
      <button class="subtab ${suscVista === 'morosos' ? 'on' : ''}" data-sv="morosos">${esFuturo ? 'Por renovar' : 'Suspendidos'} (${morosos.length})</button>
      <button class="subtab ${suscVista === 'aldia' ? 'on' : ''}" data-sv="aldia">Al día (${alDia.length})</button>
      <button class="subtab ${suscVista === 'todos' ? 'on' : ''}" data-sv="todos">Todos (${total})</button>
    </div>

    <table><thead><tr><th>Cliente</th><th>Plan</th><th>Celular</th><th>Estado del mes</th><th></th></tr></thead>
    <tbody>${filas || `<tr><td colspan="5" style="color:var(--muted)">${total ? "Nadie en esta vista." : "No se encontraron pagos de suscripción en la gestión " + suscAnio + ". Registra pagos en Recepción o cambia el año."}</td></tr>`}</tbody></table>`;

  // Eventos
  el("su_mes").onchange = () => { suscMesIdx = parseInt(el("su_mes").value, 10); suscRenderBody(box, overrides); };
  el("su_anio").onchange = () => { suscAnio = parseInt(el("su_anio").value, 10); paintSuscripciones(); };
  el("su_reload").onclick = () => { recLoadedGestion = null; paintSuscripciones(); };
  el("su_search").oninput = () => { suscFiltro = el("su_search").value; suscRenderBody(box, overrides); };
  box.querySelectorAll(".subtab[data-sv]").forEach(b => b.onclick = () => { suscVista = b.dataset.sv; suscRenderBody(box, overrides); });
  box.querySelectorAll("[data-wa]").forEach(b => b.onclick = () => suscAvisar(b.dataset.wa, b.dataset.nom));
  box.querySelectorAll("[data-ov]").forEach(b => b.onclick = () => suscOverrideModal(b.dataset.ov, LIST.find(x => x.key === b.dataset.ov), overrides));
  if (el("su_export")) el("su_export").onclick = () => {
    const H = ["Cliente", "NIT", "Celular", "Correo", "Plan", "Precio", "Repartidor", "Estado del mes", "Pagó (fecha)", "Importe", "Estado BD"];
    const rws = vistaList.map(m => [m.nombre, m.nit, m.celular, m.correo, SUSC_PLANES[m.plan].lbl, SUSC_PLANES[m.plan].precio, m.repartidor ? "Sí" : "No", m.alDia ? "Al día" : etiquetaMoroso, m.pagoMes ? (m.pagoMes.fechaPago || "") : "", m.importeMes || "", m.estadoBD]);
    downloadCSV("CONTAX-Suscripciones-" + REC_MESES[suscMesIdx] + suscAnio + ".csv", H, rws);
  };
  if (el("su_aplicar")) el("su_aplicar").onclick = () => suscAplicarSuspension(morosos.filter(m => m.bd));
}

// Abre WhatsApp con un mensaje de aviso de renovación
function suscAvisar(tel, nombre) {
  const mes = REC_MESES[suscMesIdx].charAt(0) + REC_MESES[suscMesIdx].slice(1).toLowerCase();
  const txt = `Hola ${nombre || ""}, le saluda CONTAX 👋. Le recordamos que su suscripción del mes de ${mes} está pendiente de pago. Para reactivar su servicio puede cancelar del 25 al 30 (tarifa anticipada) o del 1 al 5. ¡Gracias!`;
  window.open("https://wa.me/" + tel + "?text=" + encodeURIComponent(txt), "_blank");
}

// Modal admin: cambiar plan o excluir a un cliente de las suscripciones
function suscOverrideModal(key, m, overrides) {
  if (!m) return;
  const ov = overrides[key] || {};
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  const opts = Object.keys(SUSC_PLANES).map(p => `<option value="${p}" ${((ov.plan || m.plan) === p) ? "selected" : ""}>${SUSC_PLANES[p].lbl} (${SUSC_PLANES[p].precio})</option>`).join("");
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:24px;width:440px;max-width:96vw">
    <h3 style="margin:0 0 6px">Ajustar suscripción</h3>
    <p style="color:var(--muted);margin:0 0 14px">${escape(m.nombre)}${m.nit ? " · NIT " + escape(m.nit) : ""}</p>
    <div class="field"><label>Plan (forzar manualmente)</label><select id="ov_plan">${opts}</select>
      <div style="color:var(--muted);font-size:12px;margin-top:4px">Normalmente el plan se detecta solo por el monto pagado. Úsalo solo si quieres corregirlo.</div></div>
    <div class="field"><label><input type="checkbox" id="ov_excl" ${ov.excluir ? "checked" : ""} style="width:auto;margin-right:6px">No es suscriptor (excluir de esta lista)</label></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn sec" id="ov_cancel">Cancelar</button>
      <button class="btn" id="ov_save">Guardar</button>
    </div><div class="msg" id="ov_msg"></div></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.onclick = e => { if (e.target === bg) close(); };
  bg.querySelector("#ov_cancel").onclick = close;
  bg.querySelector("#ov_save").onclick = async () => {
    const nuevo = Object.assign({}, overrides);
    nuevo[key] = { plan: bg.querySelector("#ov_plan").value, excluir: bg.querySelector("#ov_excl").checked };
    if (!nuevo[key].excluir && nuevo[key].plan === (m.declPlan || "")) delete nuevo[key].plan;
    const btn = bg.querySelector("#ov_save"); btn.disabled = true; btn.textContent = "Guardando…";
    try {
      await setDoc(doc(db, "config", "app"), { suscOverrides: nuevo, updatedAt: serverTimestamp() }, { merge: true });
      close(); paintSuscripciones();
    } catch (e) { btn.disabled = false; btn.textContent = "Guardar"; bg.querySelector("#ov_msg").className = "msg err"; bg.querySelector("#ov_msg").textContent = "Error: " + (e.code || e.message) + " (solo el administrador puede ajustar planes)."; }
  };
}

// Marca en la Base de Datos (bdclientes) a los morosos del mes como suspendidos, de una vez
async function suscAplicarSuspension(morosos) {
  if (!morosos.length) { alert("No hay morosos con ficha en la Base de Datos para suspender."); return; }
  const ESTADO = "SUSCRIPCIÓN INACTIVA";
  if (!confirm(`Se marcará a ${morosos.length} cliente(s) como "${ESTADO}" en la Base de Datos (los que no pagaron ${REC_MESES[suscMesIdx].toLowerCase()}).\n\nEsto cambia su estado y queda en el registro de Movimientos. ¿Continuar?`)) return;
  const btn = el("su_aplicar"); if (btn) { btn.disabled = true; btn.textContent = "Aplicando…"; }
  let ok = 0, err = 0;
  for (const m of morosos) {
    try {
      const estAnt = bdV(m.bd, "estado");
      if (suscNorm(estAnt) === suscNorm(ESTADO)) { ok++; continue; }
      const hdr = (bdKey2Header && bdKey2Header["estado"]) || BD_KEY2LBL["estado"];
      const itemByHeader = {}; itemByHeader[hdr] = ESTADO; itemByHeader["_bajaISO"] = new Date().toISOString();
      const done = await bdSave({}, bdV(m.bd, "codigoId"), itemByHeader, m.bd._docid);
      if (done) { ok++; bdLog({ accion: "cambio_estado", nombre: m.nombre, estadoAnterior: estAnt, estadoNuevo: ESTADO }); }
      else err++;
    } catch (e) { err++; }
  }
  bdLoaded = false;
  if (btn) { btn.disabled = false; btn.textContent = "⛔ Aplicar suspensión en la BD"; }
  alert(`Listo: ${ok} suspendido(s)${err ? ", " + err + " con error" : ""}. Se actualizó la Base de Datos y el registro de Movimientos.`);
  paintSuscripciones();
}

// ============================================================
//  MÓDULO ASISTENTE IA (Panel) — chat para todo el equipo
// ============================================================
let asisMsgs = [];
async function renderAsistente() {
  const cfg = await loadConfigDoc();
  const hasKey = !!(cfg.aiKey || cfg.geminiKey);
  el("v-asistente").innerHTML = `<h1>Asistente IA</h1>
    <p class="lead">Pregúntale lo que necesites. Conoce el conocimiento de la empresa y las tarifas. ${hasKey ? '' : '<b style="color:var(--danger)">Falta configurar la clave de IA</b> en ⚙️ Configuración.'}</p>
    <div id="as_chat" style="border:1px solid var(--line);border-radius:14px;background:var(--panel);min-height:320px;max-height:58vh;overflow:auto;padding:16px;margin-bottom:12px"></div>
    <textarea id="as_in" style="width:100%;min-height:58px;padding:11px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--txt);font-size:14px;font-family:inherit" placeholder="Escribe tu pregunta…  (Ctrl/Cmd + Enter para enviar)"></textarea>
    <div class="toolbar" style="margin-top:10px">
      <button class="btn" id="as_send">Enviar</button>
      <button class="btn sec" id="as_clear">Limpiar conversación</button>
    </div>`;
  paintAsis();
  el("as_send").onclick = asisSend;
  el("as_clear").onclick = () => { asisMsgs = []; paintAsis(); };
  el("as_in").addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); asisSend(); } });
}
function paintAsis() {
  const c = el("as_chat"); if (!c) return;
  if (!asisMsgs.length) { c.innerHTML = `<div style="color:var(--muted);text-align:center;padding:40px 10px">Escribe tu primera pregunta. Por ejemplo:<br>“¿Cuánto cuesta la actualización de matrícula y qué incluye?”</div>`; return; }
  c.innerHTML = asisMsgs.map(m => {
    const me = m.role === "user";
    return `<div style="display:flex;justify-content:${me ? 'flex-end' : 'flex-start'};margin-bottom:10px">
      <div style="max-width:82%;padding:10px 13px;border-radius:12px;white-space:pre-wrap;font-size:13.5px;line-height:1.5;${me ? 'background:var(--accent);color:var(--accent-ink)' : 'background:var(--panel2);border:1px solid var(--line);color:var(--txt)'}">${escape(m.text)}</div></div>`;
  }).join("");
  c.scrollTop = c.scrollHeight;
}
async function asisSend() {
  const inp = el("as_in"); const q = (inp.value || "").trim(); if (!q) return;
  asisMsgs.push({ role: "user", text: q }); inp.value = ""; paintAsis();
  asisMsgs.push({ role: "assistant", text: "…" }); paintAsis();
  const cfg = await loadConfigDoc();
  let sys = "Eres el asistente interno de CONTAX (consultora de contabilidad e impuestos en Santa Cruz, Bolivia). Responde de forma clara, útil y bien organizada, con tono cordial y profesional. Si la pregunta es sobre precios o servicios, usa EXACTAMENTE las tarifas provistas. No inventes datos; si no lo sabes, dilo con honestidad.";
  if (cfg.aiContext) sys += "\n\nCONOCIMIENTO DE LA EMPRESA:\n" + String(cfg.aiContext).slice(0, 6000);
  if (cfg.tarifasText) sys += "\n\n" + String(cfg.tarifasText).slice(0, 6000);
  try {
    const r = await panelAI(cfg, sys, q);
    asisMsgs[asisMsgs.length - 1] = { role: "assistant", text: r || "(sin respuesta)" };
  } catch (e) {
    asisMsgs[asisMsgs.length - 1] = { role: "assistant", text: "⚠️ " + (e.message || "No se pudo contactar a la IA.") };
  }
  paintAsis();
}
async function panelAI(cfg, system, user) {
  const key = (cfg.aiKey || cfg.geminiKey || "").trim();
  if (!key) throw new Error("Falta la clave de IA. Configúrala en ⚙️ Configuración.");
  const prov = cfg.provider || (/^sk-/.test(key) ? "deepseek" : "gemini");
  if (prov === "deepseek") {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model: cfg.aiModel || "deepseek-chat", messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.6 })
    });
    if (!res.ok) { let t = ""; try { t = ((await res.json()).error || {}).message || ""; } catch (e) {} throw new Error("DeepSeek: " + (t || res.status)); }
    const d = await res.json(); return ((((d.choices || [])[0] || {}).message || {}).content || "").trim();
  }
  const models = [cfg.aiModel, "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"].filter((m, i, a) => m && a.indexOf(m) === i);
  const body = JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 900 } });
  let lastErr = "";
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (!res.ok) { let t = ""; try { t = ((await res.json()).error || {}).message || ""; } catch (e) {} lastErr = t || ("HTTP " + res.status); if (res.status === 404) continue; throw new Error("Gemini: " + lastErr); }
      const d = await res.json();
      const txt = ((((d.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || "").join("").trim();
      if (txt) return txt;
      lastErr = "respuesta vacía";
    } catch (e) { lastErr = e.message; }
  }
  throw new Error("IA: " + (lastErr || "sin respuesta"));
}


// ============================================================
//  MÓDULO OPERACIONES — Recepción · Dashboard · Listas
// ============================================================
// ============================================================
//  CACHÉ LOCAL DE RECEPCIONES (para no gastar la cuota diaria de Firebase)
//  - La 1ª vez en cada computadora descarga todo y lo guarda en el navegador (IndexedDB).
//  - Después solo pide a Firebase lo que cambió (campo "_upd" = fecha de la última modificación).
//  - Cada 3 días hace una descarga completa para limpiar lo que se haya borrado en otra computadora.
// ============================================================
const RC = { docs: null, lastSync: 0, fullAt: 0, netAt: 0, loading: null };
function rcIdb() {
  return new Promise((res, rej) => {
    try { const r = indexedDB.open("nummeros-cache", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }
    catch (e) { rej(e); }
  });
}
async function rcIdbGet(k) { try { const db_ = await rcIdb(); return await new Promise(res => { const t = db_.transaction("kv").objectStore("kv").get(k); t.onsuccess = () => res(t.result); t.onerror = () => res(null); }); } catch (e) { return null; } }
async function rcIdbSet(k, v) { try { const db_ = await rcIdb(); await new Promise(res => { const t = db_.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
function rcLimpio(id, d) { const o = { id: id }; for (const k in d) { const v = d[k]; o[k] = (v && typeof v.toMillis === "function") ? v.toMillis() : v; } return o; }
let rcGuardarT = null;
function rcGuardar() { clearTimeout(rcGuardarT); rcGuardarT = setTimeout(() => rcIdbSet("recepciones", { docs: RC.docs, lastSync: RC.lastSync, fullAt: RC.fullAt, uid: ME && ME.uid }), 400); }
// Actualiza/borra en la copia local (para que lo propio se vea al instante)
function rcPoner(id, datos) { if (!RC.docs) return; const i = RC.docs.findIndex(x => x.id === id); const n = rcLimpio(id, datos); if (i >= 0) RC.docs[i] = Object.assign(RC.docs[i], n); else RC.docs.push(n); rcGuardar(); }
function rcQuitar(ids) { if (!RC.docs) return; const s_ = new Set(ids); RC.docs = RC.docs.filter(x => !s_.has(x.id)); rcGuardar(); }
async function recSync(forzarTodo) {
  if (RC.loading) return RC.loading;
  RC.loading = (async () => {
    if (!RC.docs) {
      const c = await rcIdbGet("recepciones");
      if (c && Array.isArray(c.docs) && (!c.uid || !ME || c.uid === ME.uid)) { RC.docs = c.docs; RC.lastSync = c.lastSync || 0; RC.fullAt = c.fullAt || 0; }
    }
    const ahora = Date.now();
    const completo = forzarTodo || !RC.docs || (ahora - RC.fullAt) > 3 * 86400000;
    if (completo) {
      const PAG = 1000; let todos = [], ultimo = null;
      while (true) {
        const partes = [collection(db, "recepciones"), orderBy(documentId())];
        if (ultimo) partes.push(startAfter(ultimo));
        partes.push(limit(PAG));
        const snap = await getDocs(query(...partes));
        todos = todos.concat(snap.docs);
        if (snap.docs.length < PAG) break;
        ultimo = snap.docs[snap.docs.length - 1];
      }
      RC.docs = todos.map(d => rcLimpio(d.id, d.data()));
      RC.fullAt = ahora; RC.lastSync = ahora; RC.netAt = ahora; rcGuardar();
    } else if (ahora - RC.netAt > 45000) {
      // Solo lo modificado desde la última vez (margen de 10 min por diferencias de reloj)
      const snap = await getDocs(query(collection(db, "recepciones"), where("_upd", ">", RC.lastSync - 600000)));
      snap.docs.forEach(d => { const n = rcLimpio(d.id, d.data()); const i = RC.docs.findIndex(x => x.id === d.id); if (i >= 0) RC.docs[i] = n; else RC.docs.push(n); });
      RC.lastSync = ahora; RC.netAt = ahora; rcGuardar();
    }
    if (RC.docs.some(x => x.eliminado)) { RC.docs = RC.docs.filter(x => !x.eliminado); rcGuardar(); }
    return RC.docs;
  })();
  try { return await RC.loading; } finally { RC.loading = null; }
}
// Pagos de la pasarela que aún no se aprobaron (o se rechazaron) no cuentan como recepción
function recValida(r) { if (r && r.eliminado) return false; const e = r && r.pasarela && r.pasarela.estado; return e !== "revision" && e !== "rechazado"; }
let RECEP = [], recepLoaded = false, recFilterMes = "", recFlash = "", recGestion = String(new Date().getFullYear()), recLoadedGestion = null, recepError = "";
async function recepLoad(gestion) {
  gestion = gestion || recGestion || String(new Date().getFullYear());
  try {
    const todos = (await recSync()).filter(recValida);
    RECEP = gestion === "todas" ? todos.slice() : todos.filter(r => String(r.fechaISO || "").slice(0, 4) === String(gestion));
    RECEP.sort((a, b) => (b.fechaISO || "").localeCompare(a.fechaISO || ""));
    recLoadedGestion = gestion; recepLoaded = true; recepError = "";
  } catch (e) { recepError = e.code || e.message; recepLoaded = true; /* conserva lo que ya había */ }
}
function money(n) { return "Bs " + (Number(n) || 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtFecha(iso) { if (!iso) return ""; try { return new Date(iso).toLocaleString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; } }
function mesKey(iso) { return (iso || "").slice(0, 7); }
async function recibosUrlGet() { const cfg = await loadConfigDoc(); return (cfg.recibosUrl || "").trim(); }
// ===== Listas configurables de Recepción (con valores semilla) =====
const REC_SEED = {
  servicios: ["DECLARACIÓN MENSUAL", "TRÁMITES", "BALANCE", "FACTURACIÓN", "FACTURACIÓN YANGO", "SERVICIOS MTG - YANGO", "Servicios de Emisión de Facturas, Verificaciones de Documentos"],
  // Detalle de servicio AGRUPADO por categoría (se muestra según el servicio elegido)
  detallesDeclaracion: ["DDJJ - Sin Movimiento", "DDJJ - Con Su Crédito Fiscal Anterior", "DDJJ - Facturas ELECTRÓNICAS", "DDJJ - Facturas MANUALES", "DDJJ - Facturas MIXTAS (Electrónicas y Manuales)", "FORM 110 - RC IVA (Dependientes)"],
  detallesTramite: ["TRÁMITES RIDERS (Matrícula - ROE)", "TRÁMITE MATRÍCULA (APERTURA)", "TRÁMITE MATRÍCULA (CIERRE)", "TRÁMITE ROE", "TRÁMITE ACTUALIZACION DE ACTIVIDADES ECONOMICAS", "TRÁMITE ACTUALIZACIÓN SEPREC"],
  detallesBalance: ["BALANCE DE APERTURA", "BALANCE GENERAL", "BALANCE DE CIERRE", "INICIO DE SERVICIOS CONTABLES"],
  detallesFacturacion: ["EMISIÓN DE FACTURAS (mes completo)", "EMISIÓN PUNTUAL DE FACTURA", "VERIFICACIÓN DE FACTURAS"],
  detalles: [], // general / otros (fallback)
  pagos: ["EFECTIVO", "TRANSFERENCIA", "DEUDOR"],
  atencion: ["AILYN", "SOLEDAD", "JHONNY", "KEVIN"],
  cuentas: ["ALQUILER", "AGUA", "LUZ", "INTERNET", "SUELDOS", "LINEA CORPORATIVA", "IMPUESTOS", "INTERESES"]
};
// Categoría de un servicio (para filtrar el detalle y clasificar la lista de trabajo)
function recCategoria(servicio, detalle) {
  const s = ((servicio || "") + " " + (detalle || "")).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/FACTURAC/.test(s)) return "facturacion";
  if (/BALANCE|EEFF|ESTADO FINANC|SERVICIOS CONTABLES/.test(s)) return "eeff";
  if (/TRAMITE|MATRICULA|ROE|SEPREC|ACTUALIZ/.test(s)) return "tramite";
  if (/DECLARAC|MENSUAL|DDJJ|FORM 110|RC IVA/.test(s)) return "declaracion";
  return "otro";
}
// Detalles disponibles para una categoría (de la config o de las semillas)
function recDetallesPorCat(cat, L) {
  const map = { declaracion: "detallesDeclaracion", tramite: "detallesTramite", eeff: "detallesBalance", facturacion: "detallesFacturacion" };
  const key = map[cat];
  const arr = (key && L[key] && L[key].length) ? L[key] : (key ? REC_SEED[key] : []);
  const vistos = new Set();
  return (arr || []).concat((L.detalles && L.detalles.length) ? L.detalles : []).filter(x => {
    const k = recNormTxt(x).replace(/\s+/g, " ").trim(); if (!k || vistos.has(k)) return false; vistos.add(k); return true;
  });
}
const REC_MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
function recMesesOpts() {
  const out = []; const y2 = new Date().getFullYear() + 1;
  for (let y = y2; y >= 2023; y--) { const yy = String(y).slice(2); REC_MESES.forEach(m => out.push(m + "./" + yy)); }
  return out;
}
function recListas(cfg) {
  const L = (cfg && cfg.recListas) || {};
  const pick = (k) => (Array.isArray(L[k]) && L[k].length) ? L[k] : REC_SEED[k];
  const pickRaw = (k) => Array.isArray(L[k]) ? L[k] : (REC_SEED[k] || []);
  return {
    servicios: pick("servicios"), detalles: pickRaw("detalles"),
    detallesDeclaracion: pick("detallesDeclaracion"), detallesTramite: pick("detallesTramite"),
    detallesBalance: pick("detallesBalance"), detallesFacturacion: pick("detallesFacturacion"),
    pagos: pick("pagos"), atencion: pick("atencion"), cuentas: pick("cuentas")
  };
}
// Numeración automática continua (lee config, usa el número y guarda el siguiente)
async function recNextNum(field, fallback) {
  const cfg = await loadConfigDoc();
  let n = parseInt(cfg[field], 10); if (!Number.isFinite(n)) n = fallback;
  try { await setDoc(doc(db, "config", "app"), { [field]: n + 1, updatedAt: serverTimestamp() }, { merge: true }); } catch (e) {}
  return n;
}
// Clasifica el servicio/detalle en la lista de trabajo (declaración / trámite / EEFF / facturación)
function recTipoDe(servicio, detalle) {
  const cat = recCategoria(servicio, detalle);
  return cat === "otro" ? "" : cat;
}
// Meses y opciones para el período
const REC_MESES_CAP = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function recMesOptions(selIdx) {
  return REC_MESES_CAP.map((m, i) => `<option value="${i}" ${i === selIdx ? "selected" : ""}>${m}</option>`).join("");
}
function recAnioOptions(sel) {
  const y = new Date().getFullYear(); let o = "";
  for (let a = y + 1; a >= 2022; a--) o += `<option value="${a}" ${a === sel ? "selected" : ""}>${a}</option>`;
  return o;
}
// Widget de "período a recepcionar" según la categoría del servicio
function recPeriodoWidget(cat) {
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  if (cat === "tramite" || cat === "otro" || !cat) {
    return `<div class="field" data-percat="${cat || ''}"><label>Período</label><input value="— no aplica para este servicio —" disabled style="color:var(--muted)"><input type="hidden" id="r_pertipo" value="none"></div>`;
  }
  if (cat === "eeff") {
    // Balance = gestión (año), por defecto el año anterior
    return `<div class="field"><label>Gestión del balance (año)</label>
      <select id="r_peranio">${recAnioOptions(y - 1)}</select>
      <input type="hidden" id="r_pertipo" value="gestion"><input type="hidden" id="r_permes" value="">
      <div class="note" style="margin-top:3px">Ej.: en 2026 se recepciona el balance de la gestión 2025.</div></div>`;
  }
  // declaracion → mes anterior ; facturacion → mes actual
  const defMes = (cat === "declaracion") ? (m === 0 ? 11 : m - 1) : m;
  const defAnio = (cat === "declaracion" && m === 0) ? (y - 1) : y;
  const ayuda = (cat === "declaracion")
    ? "El mes que se va a declarar (ej.: en octubre se declara septiembre)."
    : "El mes al que corresponde la emisión de facturas (normalmente el mes actual).";
  return `<div class="field"><label>${cat === "declaracion" ? "Mes a declarar" : "Mes a facturar"}</label>
    <div style="display:flex;gap:6px"><select id="r_permes" style="flex:1">${recMesOptions(defMes)}</select><select id="r_peranio" style="width:90px">${recAnioOptions(defAnio)}</select></div>
    <input type="hidden" id="r_pertipo" value="mes">
    <div class="note" style="margin-top:3px">${ayuda}</div></div>`;
}
// Lee el período elegido → { texto, tipo, mes, anio }
function recLeerPeriodo() {
  const tipo = (el("r_pertipo") && el("r_pertipo").value) || "none";
  if (tipo === "none") return { texto: "", tipo: "none", mes: "", anio: "" };
  if (tipo === "gestion") {
    const a = (el("r_peranio") && el("r_peranio").value) || "";
    return { texto: a ? ("Gestión " + a) : "", tipo: "gestion", mes: "", anio: a };
  }
  const mi = parseInt((el("r_permes") && el("r_permes").value), 10);
  const a = (el("r_peranio") && el("r_peranio").value) || "";
  const texto = (isNaN(mi) ? "" : REC_MESES_CAP[mi]) + (a ? " " + a : "");
  return { texto: texto.trim(), tipo: "mes", mes: isNaN(mi) ? "" : (mi + 1), anio: a };
}
function nitUltimo(nit) { const d = String(nit || "").replace(/\D/g, ""); return d ? d.slice(-3) : ""; }
function recDiaSemana(d) { try { return d.toLocaleDateString("es-BO", { weekday: "long" }); } catch (e) { return ""; } }

async function postRecibo(rec) {
  const url = await recibosUrlGet(); if (!url) return false;
  const cfg = await loadConfigDoc();
  const payload = {
    action: "recibo", to: rec.clienteCorreo, nombre: rec.clienteNombre, nit: rec.nit || "", idCliente: rec.clienteId || "",
    celular: rec.clienteCelular || "", correo: rec.clienteCorreo || "", tipoContribuyente: rec.tipoContribuyente || "",
    rubro: rec.rubro || "", actividad: rec.actividad || "", aperturaNit: rec.aperturaNit || "", matricula: rec.matriculaComercio || "",
    nroRecepcion: rec.nroRecepcion || "", nroRecibo: rec.nroComprobante || "", dia: rec.dia || "", fecha: rec.fecha || "", hora: rec.hora || "",
    mes: rec.mesRecepcion || "", tipoServicio: rec.servicio || "", detalleServicio: rec.detalleServicio || "",
    importe: rec.importe, formaPago: rec.tipoPago || "", atencion: rec.atencion || "", comentarios: rec.comentarios || "",
    fechaPago: rec.fechaPago || "", compBanco: rec.compBanco || "", compNroOperacion: rec.compNroOperacion || "", compDepositante: rec.compDepositante || "",
    empresa: (cfg.company || "CONTAX")
  };
  try { await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }); return true; }
  catch (e) { return false; }
}

// ---------- RECEPCIÓN (completa) ----------
let recCli = null; // cliente seleccionado para autollenado
let recSubtab = "form", recListFilter = "", recListSort = "fecha", recLastRec = null, recListDir = -1, recFull = false;
let recFijar = (() => { try { return Number(localStorage.getItem("rec-fijar") || 0); } catch (e) { return 0; } })();
// Columnas de la lista: [clave de orden, título, valor para ordenar]
const REC_COLS = [
  ["fecha", "Fecha", r => String(r.fechaISO || "")], ["nrorec", "N° Rec", r => Number(r.nroRecepcion) || 0], ["nrocom", "N° Comp", r => Number(r.nroComprobante) || 0],
  ["cliente", "Cliente", r => String(r.clienteNombre || "").toUpperCase()], ["servicio", "Servicio", r => String(r.servicio || r.servicioNombre || "").toUpperCase()],
  ["mes", "Mes", r => recPeriodoKey(r) || ""], ["fpago", "F. pago", r => String(r.fechaPago || "")], ["importe", "Total", r => Number(r.importe) || 0],
  ["pago", "Pago", r => String(r.tipoPago || "")], ["atencion", "Atención", r => String(r.atencion || "")], ["deuda", "Deuda", r => (r.tipoPago === "DEUDOR" || r.estadoDeuda === "con_deuda") ? 1 : 0]
];
// Fija las primeras n columnas de una tabla (quedan quietas al deslizar a los lados)
function tablaFijarCols(tabla, n) {
  if (!tabla) return;
  tabla.querySelectorAll("th,td").forEach(c => { c.style.position = ""; c.style.left = ""; c.classList.remove("col-fija", "col-fija-ult"); });
  if (!n) return;
  const cab = tabla.tHead && tabla.tHead.rows[0]; if (!cab) return;
  let izq = 0; const lefts = [];
  for (let i = 0; i < n && i < cab.cells.length; i++) { lefts.push(izq); izq += cab.cells[i].getBoundingClientRect().width; }
  tabla.querySelectorAll("tr").forEach(tr => { for (let i = 0; i < lefts.length && i < tr.cells.length; i++) { const c = tr.cells[i]; c.style.position = "sticky"; c.style.left = lefts[i] + "px"; c.classList.add("col-fija"); if (i === lefts.length - 1) c.classList.add("col-fija-ult"); } });
}
const ORD_UP = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-label="ascendente"><path d="M12 6l8 10H4z"/></svg>';
const ORD_DN = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-label="descendente"><path d="M12 18L4 8h16z"/></svg>';
const ORD_NO = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity=".35" aria-hidden="true"><path d="M12 3l6 7H6zM12 21l-6-7h12z"/></svg>';
const ICO_FULL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const ICO_FULLX = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function recSetFull(on) {
  recFull = on;
  try { if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {}
  paintRecepcion();
}
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && recFull) { recFull = false; if (el("v-recepcion")) paintRecepcion(); } });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && recFull) recSetFull(false); });
let recComprobante = null, recCompData = null, recPasteHandler = null;
// Genera la Orden de Recepción en HTML (misma que el correo) para ver/descargar/imprimir como PDF
function comprobanteHTML(r) {
  const nv = "#16233f";
  const row = (l, v) => v ? `<tr><td style="color:#55617a;white-space:nowrap;padding:2px 10px 2px 0;font-size:12px">${l}</td><td style="font-size:12px;padding:2px 0">${escape(v)}</td></tr>` : "";
  const money2 = v => { const n = Number(v); return "Bs" + (isNaN(n) ? v : n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };
  const comp = (r.compBanco || r.compNroOperacion || r.compDepositante) ? `<div style="margin-top:12px;font-size:11px;color:#55617a;border-top:1px solid #eef0f4;padding-top:8px">Datos de la transacción: ${[r.compBanco ? "Banco " + r.compBanco : "", r.compNroOperacion ? "N° oper. " + r.compNroOperacion : "", r.compDepositante ? "Depositante " + r.compDepositante : ""].filter(Boolean).map(escape).join(" · ")}</div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>Orden de Recepción ${escape(String(r.nroRecepcion || ""))}</title>
  <style>@page{size:A4 landscape;margin:0}*{box-sizing:border-box;font-family:Helvetica,Arial,sans-serif;color:#1f2a3a}body{margin:0}
  .band{background:${nv};color:#fff;text-align:center;padding:24px 0 20px}.band .t{font-size:38px;letter-spacing:.22em}
  .sub{text-align:center;font-size:22px;color:#2b3952;margin:16px 0 6px}.wrap{padding:0 46px}
  .cols{display:flex;gap:30px;border-top:1px solid #dfe3ea;padding-top:14px;margin-top:8px}.col{flex:1}.ch{text-align:center;font-size:15px;color:#2b3952;margin:0 0 8px}
  table.serv{width:100%;border-collapse:collapse;margin-top:8px}table.serv th{border-top:1px solid #cfd4de;border-bottom:1px solid #cfd4de;padding:9px 6px;font-size:12px;color:#2b3952;text-align:left}
  table.serv td{padding:14px 6px;font-size:12px;border-bottom:1px solid #eef0f4}.r{text-align:right}
  .tot{margin-top:14px;text-align:right;font-size:13px;line-height:1.9}.disc{margin:34px 46px 0;font-size:10.5px;color:#55617a;font-style:italic;text-align:center}
  .foot{margin-top:30px;background:${nv};color:#cdd4e2;font-size:10px;padding:9px 46px;display:flex;justify-content:space-between}
  .noprint{text-align:center;margin:16px}@media print{.noprint{display:none}}</style></head><body>
  <div class="noprint"><button onclick="window.print()" style="padding:10px 18px;font-size:14px;cursor:pointer;background:#16233f;color:#fff;border:none;border-radius:8px">Imprimir / Guardar como PDF</button></div>
  <div class="band"><div class="t">CONTAX</div></div><div class="sub">Orden de Recepción</div>
  <div class="wrap"><div class="cols">
    <div class="col"><div class="ch">Datos del Cliente</div><table>${row("Nombre del Cliente:", r.clienteNombre)}${row("NIT:", r.nit)}${row("ID Cliente:", r.clienteId)}${row("Celular:", r.clienteCelular)}${row("Correo:", r.clienteCorreo)}${row("Tipo de Contribuyente:", r.tipoContribuyente)}${row("Rubro:", r.rubro)}${row("Apertura de NIT:", r.aperturaNit)}</table></div>
    <div class="col"><div class="ch">Datos de Recepción</div><table>${row("Nro Recepción:", String(r.nroRecepcion || ""))}${row("Nro Recibo:", String(r.nroComprobante || ""))}${row("Día:", r.dia)}${row("Fecha:", r.fecha)}${row("Hora:", r.hora)}${row("Fecha de pago:", r.fechaPago)}</table></div>
  </div>
  <div class="sub" style="margin-top:22px">Datos del Servicio</div>
  <table class="serv"><tr><th>Mes</th><th>Tipo de Servicio</th><th>Nro Recepción</th><th class="r">Importe</th></tr>
  <tr><td>${escape(r.mesRecepcion || "")}</td><td>${escape(r.servicio || r.servicioNombre || "")}${r.detalleServicio ? `<br><span style="color:#55617a">${escape(r.detalleServicio)}</span>` : ""}</td><td>${escape(String(r.nroRecepcion || ""))}</td><td class="r">${money2(r.importe)}</td></tr></table>
  <div class="tot">Total: <b>${money2(r.importe)}</b><br>Forma de Pago: <b>${escape(r.tipoPago || "")}</b><br>Atención: <b>${escape(r.atencion || "")}</b>${r.comentarios ? `<br><span style="color:#55617a;font-size:11px">${escape(r.comentarios)}</span>` : ""}</div>${comp}
  </div>
  <div class="disc">"CONTAX no asume responsabilidad alguna por declaraciones presentadas fuera de plazo o multas derivadas de la falta de entrega oportuna de documentación por parte del cliente. Es responsabilidad del cliente garantizar la entrega correcta y a tiempo de toda la documentación necesaria."</div>
  <div class="foot"><span>Santa Cruz - Bolivia</span><span>Contacto: 690-21969</span><span>Correo: info@contaxbolivia.com</span></div>
  </body></html>`;
}
function verComprobante(r) {
  if (!r) return;
  const w = window.open("", "_blank");
  if (!w) { alert("Permite las ventanas emergentes para ver el comprobante."); return; }
  w.document.write(comprobanteHTML(r)); w.document.close();
}
async function renderRecepcion() {
  el("v-recepcion").innerHTML = `<h1>Recepción</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  // Solo cargamos los clientes para el formulario; el historial se carga al abrir "Lista".
  bdEnsureLoaded(() => { BD.forEach((r, i) => r._i = i); paintRecepcion(); });
}
function recFill(id, v) { const e = el(id); if (e) e.value = v == null ? "" : v; }
function recSortList(list) {
  const l = list.slice();
  const col = REC_COLS.find(c => c[0] === recListSort);
  if (col) { const f = col[2], d = recListDir; l.sort((a, b) => { const x = f(a), y = f(b); return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * d || String(b.fechaISO || "").localeCompare(String(a.fechaISO || "")); }); return l; }
  if (recListSort === "cliente") l.sort((a, b) => String(a.clienteNombre || "").localeCompare(String(b.clienteNombre || "")));
  else if (recListSort === "nrorec") l.sort((a, b) => (Number(b.nroRecepcion) || 0) - (Number(a.nroRecepcion) || 0));
  else if (recListSort === "importe") l.sort((a, b) => (Number(b.importe) || 0) - (Number(a.importe) || 0));
  else l.sort((a, b) => String(b.fechaISO || "").localeCompare(String(a.fechaISO || "")));
  return l;
}
function paintRecepcion() {
  const canEdit = canEditClientes();
  if (recPasteHandler) { document.removeEventListener("paste", recPasteHandler); recPasteHandler = null; }
  // La "Lista" carga el historial de la gestión elegida SOLO cuando se abre (ahorra lecturas)
  if (recSubtab === "list" && recLoadedGestion !== recGestion) {
    el("v-recepcion").innerHTML = `<h1>Recepción</h1>
      <div class="subtabs"><button class="subtab" data-st="form">Registrar</button><button class="subtab on" data-st="list">Lista</button></div>
      <p class="lead"><span class="cx-spin"></span> Cargando recepciones de la gestión ${escape(recGestion)}…</p>`;
    el("v-recepcion").querySelectorAll(".subtab").forEach(b => b.onclick = () => { recSubtab = b.dataset.st; paintRecepcion(); });
    recepLoad(recGestion).then(() => paintRecepcion());
    return;
  }
  loadConfigDoc().then(cfg => {
    const L = recListas(cfg);
    const nextRec = parseInt(cfg.nextRecep, 10) || 7048;
    const nextCom = parseInt(cfg.nextRecibo, 10) || 7784;
    // Buscador de cliente (datalist con todos los de la Base de Datos)
    const cliDL = BD.map(c => `<option value="${escape((bdV(c, "codigoId") ? bdV(c, "codigoId") + " · " : "") + (bdV(c, "nombre") || bdV(c, "razon") || ""))}">`).join("");
    const now = new Date();
    const hoyIso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    // Lista filtrada + ordenada
    const term = recListFilter.toLowerCase();
    let list = RECEP.slice();
    if (term) list = list.filter(r => [r.clienteNombre, r.nit, r.servicio, r.detalleServicio, r.mesRecepcion, r.atencion, r.tipoPago, String(r.nroRecepcion), String(r.nroComprobante)].join(" ").toLowerCase().includes(term));
    list = recSortList(list);
    const totalAll = RECEP.reduce((s, r) => s + (Number(r.importe) || 0), 0);
    const rows = list.map(r => `<tr data-rec="${r.id}">
       <td class="mono">${escape(r.fecha || fmtFecha(r.fechaISO))}${r.hora ? `<div style="color:var(--muted);font-size:11px">${escape(r.hora)}</div>` : ''}</td>
       <td class="mono">${escape(String(r.nroRecepcion || "—"))}</td>
       <td class="mono">${escape(String(r.nroComprobante || "—"))}</td>
       <td><b>${escape(r.clienteNombre || "—")}</b>${r.nit ? `<div style="color:var(--muted);font-size:11px">NIT ${escape(r.nit)}</div>` : ''}</td>
       <td>${escape(r.servicio || r.servicioNombre || "—")}${r.detalleServicio ? `<div style="color:var(--muted);font-size:11px">${escape(r.detalleServicio)}</div>` : ''}</td>
       <td>${escape(r.mesRecepcion || "—")}</td>
       <td>${escape(r.fechaPago || "—")}</td>
       <td class="mono" style="text-align:right">${money(r.importe)}</td>
       <td>${escape(r.tipoPago || "—")}</td>
       <td>${escape(r.atencion || "—")}</td>
       <td style="text-align:center">${(r.tipoPago === "DEUDOR" || r.estadoDeuda === "con_deuda") ? '<span class="badge danger">Con deuda</span>' : '<span class="badge ok">Sin deuda</span>'}</td>
       <td style="text-align:right;white-space:nowrap"><button class="mini" data-ver="${r.id}">Ver</button>${canEdit ? ` <button class="mini" data-recibo="${r.id}">Recibo</button>` : ''}${isAdmin() ? ` <button class="mini" data-delr="${r.id}" title="Eliminar este registro (solo administrador)" style="color:#B42318;border-color:#F3B8B2"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg> Eliminar</button>` : ''}</td></tr>`).join("");

    const g2 = "display:grid;grid-template-columns:1fr 1fr;gap:10px";
    const formHTML = !canEdit ? '<div class="note">Tu rol puede ver la recepción pero no registrar.</div>' : `
      <div class="formcard" style="max-width:none">
        <div class="field"><label>Cliente (escribe para buscar)</label><div style="display:flex;gap:8px"><input id="r_clibusca" list="r_cli_dl" placeholder="Escribe el nombre o código y elige de la lista" autocomplete="off" style="flex:1;min-width:0"><button type="button" class="btn sec" id="r_newcli" style="border:1px solid var(--line);white-space:nowrap;display:inline-flex;align-items:center;gap:6px" title="El cliente no está en la Base de Datos"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>Nuevo cliente</button></div><datalist id="r_cli_dl">${cliDL}</datalist></div>
        <div id="r_estado_box" style="margin:-4px 0 6px"></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:22px;align-items:start;margin-top:6px">

          <div>
            <div class="fs">Cliente</div>
            <div class="field"><label>Nombre / Razón Social</label><input id="r_nombre" placeholder="Nombre completo"></div>
            <div style="${g2}">
              <div class="field"><label>NIT</label><input id="r_nit" placeholder="—"></div>
              <div class="field"><label>Último dígito</label><input id="r_ult" placeholder="—"></div>
              <div class="field"><label>ID Cliente</label><input id="r_idcli" placeholder="—"></div>
              <div class="field"><label>Presta servicios a</label><input id="r_rubro" placeholder="—"></div>
              <div class="field"><label>Correo (recibo)</label><input id="r_correo" type="email" placeholder="cliente@correo.com"></div>
              <div class="field"><label>Celular</label><input id="r_cel" placeholder="7xxxxxxx"></div>
            </div>
          </div>

          <div>
            <div class="fs">Servicio</div>
            <div class="field"><label>Servicio (SERVICIOS CONTAX)</label><select id="r_serv"><option value="">— elegir —</option>${L.servicios.map(s => `<option>${escape(s)}</option>`).join("")}</select></div>
            <div class="field"><label>Detalle de servicio</label><select id="r_det"><option value="">— elige primero el servicio —</option></select></div>
            <div id="r_periodo_wrap">${recPeriodoWidget("")}</div>
            <div class="field"><label>Comentarios</label><input id="r_com" placeholder="Observaciones"></div>
          </div>

          <div>
            <div class="fs">Pago</div>
            <div style="${g2}">
              <div class="field"><label>Total (Bs)</label><input id="r_total" type="number" step="0.01" placeholder="0.00"></div>
              <div class="field"><label>Forma de pago</label><select id="r_pago">${L.pagos.map(s => `<option>${escape(s)}</option>`).join("")}</select></div>
              <div class="field"><label>Fecha de pago real</label><input id="r_fpago" type="date" value="${hoyIso}"></div>
              <div class="field"><label>Atención</label><select id="r_at"><option value="">—</option>${L.atencion.map(s => `<option>${escape(s)}</option>`).join("")}</select></div>
            </div>
            <div class="fs" style="margin-top:10px">Automático</div>
            <div style="${g2}">
              <div class="field"><label>N° Recepción</label><input id="r_nrorec" value="${nextRec}"></div>
              <div class="field"><label>N° Comprobante</label><input id="r_nrocom" value="${nextCom}"></div>
              <div class="field"><label>Fecha</label><input id="r_fecha" value="${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}"></div>
              <div class="field"><label>Hora</label><input id="r_hora" value="${now.toLocaleTimeString("es-BO", { hour12: false })}"></div>
            </div>
          </div>

          <div>
            <div class="fs">📷 Comprobante (opcional) — la IA llena los datos</div>
            <div class="field" style="border:1px dashed var(--line);border-radius:10px;padding:12px">
              <p class="note" style="margin:0 0 8px">Toma/sube una foto o <b>pega</b> (Ctrl+V) la captura del comprobante. La IA llena Total, Banco, N° de operación y Depositante.</p>
              <input id="r_compfile" type="file" accept="image/*" capture="environment">
              <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
                <button type="button" class="btn sec" id="r_compread" style="border:1px solid var(--line)" disabled>🤖 Leer con IA</button>
                <span class="msg" id="r_compmsg"></span>
              </div>
              <div id="r_compprev" style="margin-top:8px"></div>
            </div>
            <div style="${g2}">
              <div class="field"><label>Banco</label><input id="r_banco" placeholder="Ej. BNB, BCP…"></div>
              <div class="field"><label>N° de operación</label><input id="r_oper" placeholder="—"></div>
            </div>
            <div class="field"><label>Depositante</label><input id="r_depo" placeholder="Quién hizo el pago"></div>
          </div>

        </div>
        <p class="note" style="margin:10px 0 4px">📧 Al registrar se enviará automáticamente la Orden de Recepción al correo del cliente (si tiene correo).</p>
        <button class="btn" id="r_save">Registrar recepción</button>
        <div class="msg" id="r_msg"></div>
      </div>`;

    const yNow = new Date().getFullYear();
    const yearOpts = [];
    for (let y = yNow; y >= 2022; y--) yearOpts.push(`<option value="${y}" ${String(y) === recGestion ? "selected" : ""}>Gestión ${y}</option>`);
    yearOpts.push(`<option value="todas" ${recGestion === "todas" ? "selected" : ""}>Todas (últimas 1500)</option>`);
    const listHTML = `
      <div class="kpis" style="margin-top:4px">
        <div class="kpi"><div class="n">${RECEP.length}</div><div class="l">Recepciones (${escape(recGestion === "todas" ? "todas" : "gestión " + recGestion)})</div></div>
        <div class="kpi"><div class="n">${money(totalAll)}</div><div class="l">Total de la gestión</div></div>
        <div class="kpi"><div class="n" style="color:var(--danger)">${RECEP.filter(r => r.tipoPago === "DEUDOR" || r.estadoDeuda === "con_deuda").length}</div><div class="l">Con deuda</div></div>
      </div>
      ${recepError ? `<p class="msg err">No se pudo leer: ${escape(recepError)}. Toca "Actualizar".</p>` : ""}
      <div class="toolbar">
        <select id="r_gestion" class="mini" style="padding:9px" title="Mostrar solo esta gestión (año)">${yearOpts.join("")}</select>
        <input id="r_buscar" class="mini" style="padding:9px;min-width:220px" placeholder="Buscar en esta gestión…" value="${escape(recListFilter)}">
        <select id="r_fijar" class="mini" style="padding:9px" title="Columnas que se quedan quietas al deslizar a los lados">
          <option value="0">Fijar columnas: ninguna</option>${REC_COLS.slice(0, 5).map((c, i) => `<option value="${i + 1}" ${recFijar === i + 1 ? "selected" : ""}>Fijar hasta: ${escape(c[1])}</option>`).join("")}
        </select>
        <button class="btn sec" id="r_full" style="border:1px solid var(--line);display:inline-flex;align-items:center;gap:6px">${recFull ? ICO_FULLX + "Salir de pantalla completa" : ICO_FULL + "Pantalla completa"}</button>
        <button class="btn sec" id="r_reload" style="border:1px solid var(--line)">↻ Actualizar</button>
        <button class="btn sec" id="r_export" style="border:1px solid var(--line)">⬇ Exportar</button>
      </div>
      <p class="note" style="margin:0 0 6px">Toca un título para ordenar (otra vez para invertir).</p>
      <div class="bd-scroll"><table class="bd-table" id="r_tabla"><thead><tr>${REC_COLS.map(c => `<th class="th-ord${recListSort === c[0] ? " on" : ""}" data-ord="${c[0]}"${c[0] === "importe" ? ' style="text-align:right"' : ""}>${escape(c[1])}<span class="ord">${recListSort === c[0] ? (recListDir > 0 ? ORD_UP : ORD_DN) : ORD_NO}</span></th>`).join("")}<th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="12" style="color:var(--muted)">Sin recepciones${term ? " con ese filtro" : " todavía"}.</td></tr>`}</tbody></table></div>`;

    el("v-recepcion").innerHTML = `<h1>Recepción</h1>
      <div class="subtabs">
        <button class="subtab ${recSubtab === 'form' ? 'on' : ''}" data-st="form">Registrar</button>
        <button class="subtab ${recSubtab === 'list' ? 'on' : ''}" data-st="list">Lista (${RECEP.length})</button>
      </div>
      <div ${recSubtab === 'form' ? '' : 'style="display:none"'} id="r_pane_form">${formHTML}</div>
      <div ${recSubtab === 'list' ? '' : 'style="display:none"'} id="r_pane_list" class="${recFull ? "rec-full" : ""}">${recFull ? '<h2 style="margin:0 0 8px;font-size:18px">Recepción · Lista</h2>' : ""}${listHTML}</div>`;

    el("v-recepcion").querySelectorAll(".subtab").forEach(b => b.onclick = () => { recSubtab = b.dataset.st; paintRecepcion(); });

    if (canEdit && recSubtab === "form") {
      const busca = el("r_clibusca");
      if (busca) busca.oninput = () => {
        const val = busca.value.trim();
        const code = val.split(" · ")[0].trim();
        let c = BD.find(x => bdV(x, "codigoId") === code && code);
        if (!c) { const nm = val.split(" · ").slice(1).join(" · ").trim() || val; c = BD.find(x => (bdV(x, "nombre") || bdV(x, "razon")) === nm); }
        if (c) {
          recCli = c;
          recFill("r_nombre", bdV(c, "nombre") || bdV(c, "razon")); recFill("r_nit", bdV(c, "nit")); recFill("r_ult", nitUltimo(bdV(c, "nit")));
          recFill("r_rubro", bdV(c, "brinda")); recFill("r_idcli", bdV(c, "codigoId"));
          recFill("r_correo", bdV(c, "correo")); recFill("r_cel", bdV(c, "celular"));
          recPintarEstado();
          if (REC_FASE) recFasePintar(true);
        }
      };
      // Servicio → detalle dependiente + período según categoría
      const serv = el("r_serv");
      const refreshServicio = () => {
        const cat = recCategoria(serv ? serv.value : "", "");
        const dets = recDetallesPorCat(cat, L);
        const det = el("r_det");
        if (det) det.innerHTML = `<option value="">— elegir —</option>` + dets.map(s => `<option>${escape(s)}</option>`).join("");
        const pw = el("r_periodo_wrap"); if (pw) pw.innerHTML = recPeriodoWidget(cat) + (cat === "eeff" ? '<div id="r_fase"></div>' : "");
        if (cat === "eeff") {
          recFaseCargar();
          const pa = el("r_peranio"); if (pa) pa.addEventListener("change", () => recFasePintar(true));
        } else { REC_FASE = null; const t = el("r_total"); if (t && t.dataset.auto === "1") { t.value = ""; t.dataset.auto = ""; } }
      };
      if (el("r_total")) el("r_total").addEventListener("input", () => { el("r_total").dataset.auto = ""; if (REC_FASE) recFasePintar(false); });
      if (serv) serv.onchange = refreshServicio;
      // Comprobante con IA (igual que en el CRM)
      const setCompPrev = (dataUrl) => { recComprobante = dataUrl; recCompData = null; const p = el("r_compprev"); if (p) p.innerHTML = `<img src="${dataUrl}" style="max-height:130px;border-radius:8px;border:1px solid var(--line)">`; if (el("r_compread")) el("r_compread").disabled = false; const m = el("r_compmsg"); if (m) { m.className = "msg"; m.textContent = "Listo. Toca “Leer con IA”."; } };
      if (el("r_compfile")) el("r_compfile").onchange = async () => {
        const f = el("r_compfile").files && el("r_compfile").files[0]; if (!f) return;
        const m = el("r_compmsg"); if (m) { m.className = "msg"; m.textContent = "Preparando imagen…"; }
        try { setCompPrev(await cxCompressImage(f)); } catch (e) { if (m) { m.className = "msg err"; m.textContent = e.message || "No se pudo preparar la imagen."; } }
      };
      if (el("r_compread")) el("r_compread").onclick = async () => {
        if (!recComprobante) return;
        const m = el("r_compmsg"), btn = el("r_compread");
        btn.disabled = true; const o = btn.textContent; btn.textContent = "Leyendo…"; if (m) { m.className = "msg"; m.textContent = ""; }
        const r = await ocrComprobanteGemini(recComprobante);
        btn.disabled = false; btn.textContent = o;
        if (r.error) { if (m) { m.className = "msg err"; m.textContent = r.error; } return; }
        recCompData = r.data || {}; const d = recCompData;
        if (d.importe && el("r_total") && !el("r_total").value) { const n = parseFloat(String(d.importe).replace(/[^\d.]/g, "")); if (!isNaN(n)) el("r_total").value = n; }
        if (d.banco && el("r_banco") && !el("r_banco").value) el("r_banco").value = d.banco;
        if (d.nroOperacion && el("r_oper") && !el("r_oper").value) el("r_oper").value = d.nroOperacion;
        if (d.depositante && el("r_depo") && !el("r_depo").value) el("r_depo").value = d.depositante;
        if (m) { m.className = "msg ok"; m.textContent = "✓ Datos extraídos. Revísalos antes de registrar." + (d.destino && !/contax/i.test(d.destino) ? " ⚠ El destino no parece CONTAX." : ""); }
      };
      // Pegar imagen con Ctrl+V
      recPasteHandler = (ev) => {
        if (recSubtab !== "form") return;
        const items = (ev.clipboardData && ev.clipboardData.items) || [];
        for (const it of items) { if (it.type && it.type.indexOf("image") === 0) { const f = it.getAsFile(); if (f) { cxCompressImage(f).then(setCompPrev).catch(() => {}); ev.preventDefault(); break; } } }
      };
      document.addEventListener("paste", recPasteHandler);
      if (el("r_save")) el("r_save").onclick = registrarRecepcion;
      if (el("r_newcli")) el("r_newcli").onclick = recNuevoCliente;
      if (recFlash && el("r_msg")) {
        el("r_msg").className = "msg ok"; el("r_msg").innerHTML = escape(recFlash) + (recLastRec ? ` <button class="btn sec" id="r_vercomp" style="border:1px solid var(--line);margin-left:8px;padding:3px 10px">👁 Ver comprobante</button>` : "");
        recFlash = "";
        if (el("r_vercomp")) el("r_vercomp").onclick = () => verComprobante(recLastRec);
      }
    }
    if (recSubtab === "list") {
      const bq = el("r_buscar"); if (bq) bq.oninput = () => { recListFilter = bq.value; const pane = el("r_pane_list"); /* re-render solo lista */ paintRecepcion(); const nb = el("r_buscar"); if (nb) { nb.focus(); nb.setSelectionRange(nb.value.length, nb.value.length); } };
      el("v-recepcion").querySelectorAll("th[data-ord]").forEach(th => th.onclick = () => {
        const k = th.dataset.ord;
        if (recListSort === k) recListDir = -recListDir; else { recListSort = k; recListDir = (k === "cliente" || k === "servicio" || k === "atencion" || k === "pago") ? 1 : -1; }
        paintRecepcion();
      });
      const fj = el("r_fijar"); if (fj) fj.onchange = () => { recFijar = Number(fj.value) || 0; try { localStorage.setItem("rec-fijar", String(recFijar)); } catch (e) {} tablaFijarCols(el("r_tabla"), recFijar); };
      if (el("r_full")) el("r_full").onclick = () => recSetFull(!recFull);
      requestAnimationFrame(() => tablaFijarCols(el("r_tabla"), recFijar));
      const gs = el("r_gestion"); if (gs) gs.onchange = () => { recGestion = gs.value; recLoadedGestion = null; paintRecepcion(); };
      if (el("r_reload")) el("r_reload").onclick = () => { recLoadedGestion = null; paintRecepcion(); };
      if (el("r_export")) el("r_export").onclick = recExport;
      el("v-recepcion").querySelectorAll("[data-ver]").forEach(b => b.onclick = () => openRecepDetalle(RECEP.find(x => x.id === b.dataset.ver)));
      el("v-recepcion").querySelectorAll("[data-recibo]").forEach(b => b.onclick = () => enviarReciboDe(RECEP.find(x => x.id === b.dataset.recibo)));
      el("v-recepcion").querySelectorAll("[data-delr]").forEach(b => b.onclick = () => delRecepcion(RECEP.find(x => x.id === b.dataset.delr)));
    }
  });
}
// Nuevo cliente desde Recepción: lo crea en la Base de Datos con lo mínimo (nombre) y deja una Tarea
// pendiente en Calendario para completar sus datos. Así se puede recepcionar al momento.
function recNuevoCliente() {
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:120;display:flex;align-items:center;justify-content:center;padding:20px";
  const pre = (el("r_clibusca") && el("r_clibusca").value.trim()) || "";
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:24px;width:480px;max-width:96vw;max-height:92vh;overflow:auto">
    <h3 style="margin:0 0 4px">Nuevo cliente</h3>
    <p class="note" style="margin:0 0 14px">Basta con el nombre completo para recepcionarlo ahora. Se agrega a la Base de Datos y se crea una <b>Tarea pendiente</b> en Calendario para completar el resto de sus datos.</p>
    <div class="field"><label>Nombre completo / Razón social *</label><input id="nc_nombre" value="${escape(pre.indexOf(" · ") >= 0 ? "" : pre)}" placeholder="Ej. JUAN PEREZ LOPEZ"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="field"><label>NIT (opcional)</label><input id="nc_nit" inputmode="numeric"></div>
      <div class="field"><label>Celular (opcional)</label><input id="nc_cel" inputmode="tel"></div>
    </div>
    <div class="field"><label>C.I. (opcional · es su clave del Portal del Cliente)</label><input id="nc_ci"></div>
    <div class="field"><label>Correo (opcional)</label><input id="nc_correo" type="email"></div>
    <div class="field"><label>Nota para la tarea (opcional)</label><textarea id="nc_nota" style="min-height:60px" placeholder="Ej. Trae su carnet el lunes"></textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn sec" id="nc_cancel" style="border:1px solid var(--line)">Cancelar</button>
      <button class="btn" id="nc_save">Crear y usar en la recepción</button>
    </div><div class="msg" id="nc_msg"></div></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.onclick = ev => { if (ev.target === bg) close(); };
  bg.querySelector("#nc_cancel").onclick = close;
  setTimeout(() => { const i = bg.querySelector("#nc_nombre"); if (i) i.focus(); }, 50);
  bg.querySelector("#nc_save").onclick = async () => {
    const v = id => bg.querySelector(id).value.trim();
    const nombre = v("#nc_nombre").toUpperCase(), ciN = v("#nc_ci"), nit = v("#nc_nit"), cel = v("#nc_cel"), correo = v("#nc_correo"), nota = v("#nc_nota");
    const m = bg.querySelector("#nc_msg");
    if (nombre.length < 3) { m.className = "msg err"; m.textContent = "Escribe el nombre completo del cliente."; return; }
    const repe = BD.find(x => (nit && bdV(x, "nit") === nit) || (bdV(x, "nombre") || bdV(x, "razon")).toUpperCase() === nombre);
    if (repe && !confirm("Ya existe en la Base de Datos un cliente con ese " + (nit && bdV(repe, "nit") === nit ? "NIT" : "nombre") + ": " + (bdV(repe, "nombre") || bdV(repe, "razon")) + ".\n\n¿Crear otro de todas formas?")) return;
    const btn = bg.querySelector("#nc_save"); btn.disabled = true; btn.textContent = "Creando…";
    const H = k => (bdKey2Header && bdKey2Header[k]) || BD_KEY2LBL[k];
    const fila = {};
    fila[H("nombre")] = nombre; if (nit) fila[H("nit")] = nit; if (ciN) fila[H("ci")] = ciN; if (cel) fila[H("celular")] = cel; if (correo) fila[H("correo")] = correo;
    fila[H("estado")] = "ACTIVO";
    const codigo = bdNextCodigo(); fila[H("codigoId")] = codigo;
    fila["_altaISO"] = new Date().toISOString(); fila["_altaDesde"] = "recepcion"; fila["_datosIncompletos"] = true;
    fila["_creadoPor"] = (ME && (ME.name || ME.email)) || "";
    const docid = "nuevo_" + Date.now();
    const ok = await bdSave({}, "", fila, docid);
    if (!ok) { btn.disabled = false; btn.textContent = "Crear y usar en la recepción"; m.className = "msg err"; m.textContent = "No se pudo guardar en la Base de Datos."; return; }
    const cli = Object.assign({ _docid: docid }, fila);
    if (!BD.find(x => x._docid === docid)) BD.unshift(cli);
    bdLog({ accion: "alta", nombre, estadoNuevo: "ACTIVO", detalle: "Creado desde Recepción (datos por completar)" });
    // Tarea pendiente para completar los datos
    const falta = [nit ? "" : "NIT", "Tipo de contribuyente", "Actividad / rubro", "Fecha de apertura del NIT", cel ? "" : "Celular", correo ? "" : "Correo"].filter(Boolean);
    try {
      await setDoc(doc(collection(db, "eventos")), {
        titulo: "Completar datos del nuevo cliente: " + nombre, fechaISO: todayISO(), hora: "", tipo: "tarea", cliente: nombre, clienteNit: nit, clienteBdId: docid,
        nota: "Cliente creado desde Recepción. Falta: " + falta.join(", ") + "." + (nota ? " Nota: " + nota : ""),
        origen: "recepcion", bdDocid: docid, done: false,
        createdByUid: (ME && ME.uid) || "", createdByNombre: (ME && (ME.name || ME.email)) || "", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      evLoaded = false;
    } catch (e) {}
    close();
    recCli = cli;
    recFill("r_clibusca", nombre); recFill("r_nombre", nombre); recFill("r_nit", nit); recFill("r_ult", nit ? nitUltimo(nit) : "");
    recFill("r_cel", cel); recFill("r_correo", correo); recFill("r_idcli", codigo); recFill("r_rubro", "");
    recPintarEstado();
    const rm = el("r_msg"); if (rm) { rm.className = "msg ok"; rm.textContent = "Cliente nuevo creado con el Código de ID " + codigo + " y listo para recepcionar. Se creó una tarea en Calendario > Tareas pendientes para completar sus datos."; }
  };
}
// Si el cliente de la BD está dado de baja, lo pone ACTIVO (y lo registra en Movimientos)
async function recReactivarSiInactivo(cli) {
  if (!cli || !cli._docid) return false;
  const est = bdV(cli, "estado");
  if (!est || !esBaja(est)) return false;
  const hdr = (bdKey2Header && bdKey2Header["estado"]) || BD_KEY2LBL["estado"];
  const itemByHeader = {}; itemByHeader[hdr] = "ACTIVO";
  const ok = await bdSave({}, bdV(cli, "codigoId"), itemByHeader, cli._docid);
  if (ok) {
    try { cli[hdr] = "ACTIVO"; } catch (e) {}
    bdLoaded = false;
    bdLog({ accion: "cambio_estado", nombre: bdV(cli, "nombre") || bdV(cli, "razon"), estadoAnterior: est, estadoNuevo: "ACTIVO" });
    return true;
  }
  return false;
}
// Ventana: el cliente está inactivo → ¿activar y registrar, registrar sin activar o volver?
function recPreguntarActivar(cli) {
  return new Promise(res => {
    const bg = document.createElement("div");
    bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:120;display:flex;align-items:center;justify-content:center;padding:20px";
    bg.innerHTML = `<div style="background:var(--panel);border:2px solid var(--danger);border-radius:14px;padding:24px;width:470px;max-width:96vw">
      <h3 style="margin:0 0 8px;color:var(--danger)">⚠ El cliente no está ACTIVO</h3>
      <p style="margin:0 0 6px"><b>${escape(bdV(cli, "nombre") || bdV(cli, "razon"))}</b> figura como <b style="color:var(--danger)">${escape(bdV(cli, "estado"))}</b> en la Base de Datos.</p>
      <p class="note" style="margin:0 0 16px">Si no lo activas, <b>no aparecerá en Facturación</b> ni en los controles de clientes activos. ¿Estás seguro de registrar sin activarlo?</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn" data-r="activar" style="background:#2E7D5B;border-color:#2E7D5B;color:#fff">✓ Activar y registrar</button>
        <button class="btn sec" data-r="sin" style="border:1px solid var(--line)">Registrar sin activar</button>
        <button class="mini" data-r="cancelar">Volver al formulario</button>
      </div></div>`;
    document.body.appendChild(bg);
    bg.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { bg.remove(); res(b.dataset.r); });
  });
}
// Pinta el estado del cliente seleccionado en el formulario, con botón para reactivar
function recPintarEstado() {
  const box = el("r_estado_box"); if (!box) return;
  if (!recCli) { box.innerHTML = ""; return; }
  const info = bdEstadoInfo(recCli);
  const est = info.raw || "—";
  const cls = info.cls === "ok" ? "ok" : (info.cls === "danger" ? "danger" : "off");
  const baja = esBaja(est);
  box.innerHTML = baja
    ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;background:rgba(180,69,60,.10);border:1.5px solid var(--danger);border-radius:10px;padding:9px 12px">
        <span style="color:var(--danger);font-weight:700">⚠ Cliente: ${escape(est)}</span>
        <span style="color:var(--danger);font-size:12px;flex:1;min-width:180px">Si vuelve a trabajar con nosotros, actívalo para que aparezca en Facturación y en los controles.</span>
        <button type="button" class="btn" id="r_setactivo" style="background:#2E7D5B;border-color:#2E7D5B;color:#fff;padding:7px 14px;font-size:13px" title="Cambiar a ACTIVO en la Base de Datos">✓ Marcar ACTIVO</button></div>`
    : `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px">
    <span style="color:var(--muted)">Estado:</span> <span class="badge ${cls}">${escape(est)}</span></div>`;
  if (el("r_setactivo")) el("r_setactivo").onclick = async () => {
    const b = el("r_setactivo"); b.disabled = true; b.textContent = "…";
    const ok = await recReactivarSiInactivo(recCli);
    if (ok) recPintarEstado(); else { b.disabled = false; b.textContent = "✓ Marcar ACTIVO"; }
  };
}
async function registrarRecepcion() {
  const msg = el("r_msg");
  const nombre = el("r_nombre").value.trim();
  const total = parseFloat(el("r_total").value);
  const servicio = el("r_serv").value;
  if (!nombre) { msg.className = "msg err"; msg.textContent = "Elige o escribe el cliente."; return; }
  if (isNaN(total) || total < 0) { msg.className = "msg err"; msg.textContent = "Pon un total válido."; return; }
  // Cliente dado de baja: preguntar antes de registrar
  let activarAlRegistrar = false;
  if (recCli && esBaja(bdV(recCli, "estado"))) {
    const resp = await recPreguntarActivar(recCli);
    if (resp === "cancelar") return;
    activarAlRegistrar = resp === "activar";
  }
  const btn = el("r_save"); btn.disabled = true; btn.textContent = "Registrando…";
  try {
    const nroRec = await recNextNum("nextRecep", 7048);
    const nroCom = await recNextNum("nextRecibo", 7784);
    const now = new Date();
    const detalle = el("r_det").value;
    const per = recLeerPeriodo();
    const fpago = el("r_fpago").value || "";
    // Mes de pago legible, derivado de la fecha de pago real
    let mesPagoTxt = "";
    if (fpago) { const dp = new Date(fpago + "T00:00:00"); if (!isNaN(dp)) mesPagoTxt = REC_MESES_CAP[dp.getMonth()] + " " + dp.getFullYear(); }
    const tipoPago = el("r_pago").value;
    const rec = {
      nroRecepcion: nroRec, nroComprobante: nroCom,
      fechaISO: now.toISOString(), fecha: el("r_fecha").value.trim(), hora: el("r_hora").value.trim(), dia: recDiaSemana(now),
      clienteId: el("r_idcli").value.trim(), clienteNombre: nombre, nit: el("r_nit").value.trim(), ultimoDigitoNit: el("r_ult").value.trim(),
      clienteCelular: el("r_cel").value.trim(), clienteCorreo: el("r_correo").value.trim(),
      tipoContribuyente: recCli ? bdV(recCli, "tipo") : "", rubro: el("r_rubro").value.trim(),
      actividad: recCli ? bdV(recCli, "actP") : "", aperturaNit: recCli ? bdV(recCli, "fechaNit") : "", matriculaComercio: recCli ? bdV(recCli, "estMat") : "",
      servicio: servicio, servicioNombre: servicio, detalleServicio: detalle,
      mesRecepcion: per.texto, periodoTipo: per.tipo, periodoMes: per.mes, periodoAnio: per.anio,
      anio: per.anio || "", mesPago: mesPagoTxt,
      fechaPago: fpago,
      importe: total, tipoPago: tipoPago, atencion: el("r_at").value, comentarios: el("r_com").value.trim(),
      compBanco: el("r_banco").value.trim(), compNroOperacion: el("r_oper").value.trim(), compDepositante: el("r_depo").value.trim(),
      tipo: recTipoDe(servicio, detalle), estado: "pendiente", estadoDeuda: (tipoPago === "DEUDOR" ? "con_deuda" : "sin_deuda"),
      reciboNro: String(nroCom), reciboEnviado: false,
      registradoPorUid: (ME && ME.uid) || "", registradoPorNombre: (ME && (ME.name || ME.email)) || "", createdAt: serverTimestamp()
    };
    rec._upd = Date.now();
    const ref = doc(collection(db, "recepciones")); await setDoc(ref, rec); rec.id = ref.id; rcPoner(ref.id, rec); LT_DATA = null;
    eeffContar(rec, 1);
    let enviado = false;
    if (rec.clienteCorreo) {
      enviado = await postRecibo(rec);
      if (enviado) { try { await setDoc(doc(db, "recepciones", ref.id), { reciboEnviado: true, _upd: Date.now() }, { merge: true }); } catch (e) {} rec.reciboEnviado = true; }
    }
    // Solo se reactiva si el usuario lo eligió en la pregunta
    let reactivado = false;
    if (activarAlRegistrar) { try { reactivado = await recReactivarSiInactivo(recCli); } catch (e) {} }
    // Inserción inmediata en la lista (no dependemos de releer todo)
    RECEP.unshift(Object.assign({}, rec));
    recFlash = (reactivado ? `✓ Cliente reactivado a ACTIVO. ` : "") + `✓ Recepción N° ${nroRec} registrada` + (rec.clienteCorreo ? (enviado ? " y Orden enviada al correo." : " (no se pudo enviar el PDF; revisa la URL de recibos en Configuración).") : " (el cliente no tiene correo: no se envió PDF).") + ` — míralo en la pestaña "Lista".`;
    recLastRec = rec;
    recCli = null; recComprobante = null; recCompData = null;
    paintRecepcion();
  } catch (e) { btn.disabled = false; btn.textContent = "Registrar recepción"; msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
}
function openRecepDetalle(r) {
  if (!r) return;
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  const row = (l, v) => `<div style="display:flex;gap:10px;padding:3px 0;font-size:13px"><span style="color:var(--muted);flex:0 0 160px">${l}</span><span style="flex:1">${escape(v || "—")}</span></div>`;
  const tieneComp = r.compBanco || r.compNroOperacion || r.compDepositante;
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:24px;width:640px;max-width:96vw;max-height:92vh;overflow:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="margin:0">Recepción N° ${escape(String(r.nroRecepcion || "—"))}</h3><button class="mini" id="rd_x">✕</button></div>
    <div class="fs">Datos de recepción</div>
    ${row("N° Recepción", String(r.nroRecepcion || ""))}${row("N° Comprobante", String(r.nroComprobante || ""))}${row("Día / Fecha / Hora", [r.dia, r.fecha, r.hora].filter(Boolean).join(" · "))}${row("Fecha de pago real", r.fechaPago)}
    <div class="fs" style="margin-top:8px">Cliente</div>
    ${row("Nombre / Razón Social", r.clienteNombre)}${row("NIT", r.nit)}${row("ID Cliente", r.clienteId)}${row("Celular", r.clienteCelular)}${row("Correo", r.clienteCorreo)}${row("Tipo contribuyente", r.tipoContribuyente)}${row("Rubro", r.rubro)}
    <div class="fs" style="margin-top:8px">Servicio</div>
    ${row("Servicio", r.servicio || r.servicioNombre)}${row("Detalle", r.detalleServicio)}${row("Mes a recepcionar", r.mesRecepcion)}${row("Mes de pago", r.mesPago)}${row("Total", money(r.importe))}${row("Forma de pago", r.tipoPago)}${row("Atención", r.atencion)}${row("Comentarios", r.comentarios)}${row("Estado deuda", (r.tipoPago === "DEUDOR" || r.estadoDeuda === "con_deuda") ? "Con deuda" : "Sin deuda")}
    ${tieneComp ? `<div class="fs" style="margin-top:8px">Datos del comprobante</div>${row("Banco", r.compBanco)}${row("N° operación", r.compNroOperacion)}${row("Depositante", r.compDepositante)}` : ''}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button class="btn sec" id="rd_close" style="border:1px solid var(--line)">Cerrar</button>
      <button class="btn sec" id="rd_ver" style="border:1px solid var(--line)">👁 Ver comprobante</button>
      ${canEditClientes() ? '<button class="btn" id="rd_recibo">Reenviar recibo</button>' : ''}
    </div></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.onclick = e => { if (e.target === bg) close(); };
  bg.querySelector("#rd_x").onclick = close; bg.querySelector("#rd_close").onclick = close;
  bg.querySelector("#rd_ver").onclick = () => verComprobante(r);
  const rb = bg.querySelector("#rd_recibo"); if (rb) rb.onclick = () => { enviarReciboDe(r); close(); };
}
function recExport() {
  const H = ["Fecha", "Hora", "N Recepcion", "N Comprobante", "Cliente", "NIT", "ID", "Rubro", "Servicio", "Detalle", "Mes recepcion", "Año", "Mes pago", "Fecha pago", "Total", "Forma pago", "Atencion", "Comentarios", "Banco", "N operacion", "Depositante", "Estado deuda", "Correo", "Celular", "Registrado por"];
  const rws = RECEP.map(r => [r.fecha || fmtFecha(r.fechaISO), r.hora || "", r.nroRecepcion || "", r.nroComprobante || "", r.clienteNombre || "", r.nit || "", r.clienteId || "", r.rubro || "", r.servicio || r.servicioNombre || "", r.detalleServicio || "", r.mesRecepcion || "", r.anio || "", r.mesPago || "", r.fechaPago || "", (Number(r.importe) || 0), r.tipoPago || "", r.atencion || "", r.comentarios || "", r.compBanco || "", r.compNroOperacion || "", r.compDepositante || "", ((r.tipoPago === "DEUDOR" || r.estadoDeuda === "con_deuda") ? "Con deuda" : "Sin deuda"), r.clienteCorreo || "", r.clienteCelular || "", r.registradoPorNombre || ""]);
  downloadCSV("CONTAX-Recepcion-" + hoyISO() + ".csv", H, rws);
}

async function enviarReciboDe(rec) {
  if (!rec) return;
  if (!rec.clienteCorreo) { alert("Esta recepción no tiene correo del cliente."); return; }
  const ok = await postRecibo(rec);
  if (ok) { try { await setDoc(doc(db, "recepciones", rec.id), { reciboEnviado: true, _upd: Date.now() }, { merge: true }); rcPoner(rec.id, { reciboEnviado: true }); } catch (e) {} await recepLoad(); paintRecepcion(); alert("Orden de Recepción enviada (si la URL de recibos está configurada)."); }
  else alert("No se pudo enviar. Configura la URL de recibos en Configuración.");
}
async function delRecepcion(rec) {
  if (!rec) return;
  if (!isAdmin()) { alert("Solo el administrador puede eliminar registros."); return; }
  const det = [rec.servicio || rec.servicioNombre, rec.detalleServicio, rec.mesRecepcion].filter(Boolean).join(" · ");
  if (!confirm(`¿Estás seguro de eliminar este registro?\n\nRecepción N° ${rec.nroRecepcion || "—"}\nCliente: ${rec.clienteNombre || "—"}\n${det}\nImporte: ${money(rec.importe)}\n\nDesaparecerá de todas las listas (declaraciones, balances, facturación, trámites, reportes y dashboard) en todas las computadoras. No se puede deshacer.`)) return;
  const quien = (ME && (ME.name || ME.email)) || "";
  try {
    // Se marca como eliminado (así las demás computadoras también lo quitan al sincronizar) y se libera el N° de operación del comprobante
    const datos = { eliminado: true, eliminadoPor: quien, eliminadoAt: Date.now(), compNroOperacion: "", compNroOperacionAntes: rec.compNroOperacion || "", _upd: Date.now() };
    await setDoc(doc(db, "recepciones", rec.id), datos, { merge: true });
    if (recValida(rec) && recCatDe(rec) === "eeff") eeffContar(rec, -1);   // libera su cupo en las fases de balances
    rcQuitar([rec.id]); LT_DATA = null; await recepLoad(); paintRecepcion();
  } catch (e) { alert("No se pudo eliminar: " + (e.code || e.message)); }
}

// ============================================================
//  MÓDULO EGRESOS (gastos de la empresa) — colección "egresos"
// ============================================================
let EGRESOS = [], egLoaded = false;
async function egLoad() {
  try { const snap = await getDocs(collection(db, "egresos")); EGRESOS = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); }
  catch (e) { EGRESOS = []; }
  EGRESOS.sort((a, b) => (b.fechaISO || "").localeCompare(a.fechaISO || ""));
  egLoaded = true;
}
// Comprime una imagen (File) a un dataURL JPEG más liviano (para leerla con IA)
function cxCompressImage(file, maxPx, quality) {
  maxPx = maxPx || 1100; quality = quality || 0.72;
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h && w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; }
        else if (h >= w && h > maxPx) { w = Math.round(w * maxPx / h); h = maxPx; }
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("No se pudo abrir la imagen."));
      img.src = fr.result;
    };
    fr.onerror = () => reject(new Error("No se pudo leer el archivo."));
    fr.readAsDataURL(file);
  });
}
// Lee un comprobante con Gemini (usa la clave visionKey, o la principal si es Gemini)
const CX_GEMINI_FALLBACKS = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
async function ocrComprobanteGemini(dataUrl) {
  const cfg = await loadConfigDoc();
  let key = (cfg.visionKey || "").trim();
  const mainKey = (cfg.aiKey || cfg.geminiKey || "").trim();
  // Usa la clave de visión; si no hay, usa la principal (sea cual sea su formato).
  if (!key) key = mainKey;
  if (!key) return { error: "Falta una clave de Gemini para leer comprobantes. Ponla en Configuración → IA → 'Clave de Gemini para leer comprobantes'." };
  const mime = (dataUrl.match(/^data:([^;]+);base64,/) || [])[1] || "image/jpeg";
  const b64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
  if (!b64) return { error: "No hay imagen." };
  const prompt = "Eres un asistente contable en Bolivia. La imagen es un comprobante de pago/transferencia bancaria o un gasto. " +
    "Extrae los datos y responde ÚNICAMENTE con un JSON válido (sin texto extra, sin ```), con estas claves exactas: " +
    '{"banco":"","importe":"","moneda":"","depositante":"","destino":"","fecha":"","hora":"","nroOperacion":"","concepto":"","observacion":""}. ' +
    "importe solo el número (ej. 150.00). Si un dato no aparece, déjalo como cadena vacía.";
  const body = JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }], generationConfig: Object.assign({ temperature: 0.1, maxOutputTokens: 400, responseMimeType: "application/json" }, {}) });
  const baseModel = /latest/.test(cfg.visionModel || "") ? cfg.visionModel : "gemini-flash-lite-latest";
  const models = [baseModel, ...CX_GEMINI_FALLBACKS].filter((m, i, a) => m && a.indexOf(m) === i && /gemini/i.test(m));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  let lastErr = "";
  for (const model of models) {
    // Hasta 3 intentos por modelo ante sobrecarga (503) o límite momentáneo (429/500)
    for (let intento = 0; intento < 3; intento++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        if (res.ok) {
          const data = await res.json();
          let txt = ((data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts || []).map(p => p.text).join("") || "").trim();
          txt = txt.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
          let obj = {}; try { obj = JSON.parse(txt); } catch (e) { const m = txt.match(/\{[\s\S]*\}/); if (m) { try { obj = JSON.parse(m[0]); } catch (_) {} } }
          if (!obj || typeof obj !== "object") return { error: "No se pudo interpretar el comprobante." };
          return { data: obj };
        }
        let d = ""; try { d = (await res.json()).error.message || ""; } catch (e) {}
        lastErr = `(${res.status}) ${d}`;
        if (res.status === 503 || res.status === 429 || res.status === 500) break; // saturado: pasa al siguiente modelo
        if (res.status === 404 || /not found|not supported/i.test(d)) break; // prueba otro modelo
        return { error: "No se pudo leer el comprobante. " + lastErr }; // error definitivo
      } catch (e) { lastErr = String(e.message || e); await sleep(800); }
    }
  }
  return { error: "La IA está con mucha demanda en este momento. Vuelve a tocar “Leer con IA” en unos segundos (o escribe los datos a mano). Detalle: " + lastErr };
}

let egComprobante = null, egCompData = null;
async function renderEgresos() {
  el("v-egresos").innerHTML = `<h1>Egresos</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  egComprobante = null; egCompData = null;
  await egLoad();
  paintEgresos();
}
function paintEgresos() {
  const canEdit = canEditClientes();
  loadConfigDoc().then(cfg => {
    const L = recListas(cfg);
    const nextG = parseInt(cfg.nextGasto, 10) || 1002;
    const now = new Date();
    const total = EGRESOS.reduce((s, r) => s + (Number(r.importe) || 0), 0);
    const rows = EGRESOS.map(r => `<tr>
       <td class="mono">${escape(r.fecha || fmtFecha(r.fechaISO))}</td>
       <td class="mono">${escape(String(r.nroGasto || "—"))}</td>
       <td><b>${escape(r.cuentaContable || "—")}</b></td>
       <td>${escape(r.detalle || "—")}</td>
       <td>${escape(r.tipoPago || "—")}</td>
       <td>${escape(r.atencion || "—")}</td>
       <td class="mono" style="text-align:right">${money(r.importe)}</td>
       <td style="text-align:right">${isAdmin() ? `<button class="mini" data-dele="${r.id}">✕</button>` : ''}</td></tr>`).join("");
    el("v-egresos").innerHTML = `<h1>Egresos</h1>
      <p class="lead">Registro de gastos de la empresa por cuenta contable (alquiler, luz, sueldos, etc.).</p>
      ${canEdit ? `<div class="formcard" style="max-width:820px">
        <h3 style="margin:0 0 10px">Nuevo egreso</h3>
        <div class="grid3">
          <div class="field"><label>N° Gasto</label><input id="e_nro" value="${nextG}"></div>
          <div class="field"><label>Fecha</label><input id="e_fecha" value="${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}"></div>
          <div class="field"><label>Importe (Bs)</label><input id="e_imp" type="number" step="0.01" placeholder="0.00"></div>
        </div>
        <div class="grid2">
          <div class="field"><label>Cuenta contable</label><select id="e_cuenta">${L.cuentas.map(s => `<option>${escape(s)}</option>`).join("")}</select></div>
          <div class="field"><label>Forma de pago</label><select id="e_pago">${L.pagos.map(s => `<option>${escape(s)}</option>`).join("")}</select></div>
        </div>
        <div class="grid2">
          <div class="field"><label>Detalle</label><input id="e_det" placeholder="Ej. alquiler oficina octubre"></div>
          <div class="field"><label>Atención / responsable</label><select id="e_at"><option value="">—</option>${L.atencion.map(s => `<option>${escape(s)}</option>`).join("")}</select></div>
        </div>
        <div class="field" style="margin-top:4px;border:1px dashed var(--line);border-radius:10px;padding:12px">
          <label style="font-weight:600">📷 Comprobante (opcional) — la IA extrae los datos</label>
          <p class="note" style="margin:2px 0 8px">Toma o sube la foto del comprobante. Desde el celular abre la cámara. La IA llena el <b>importe</b> y el <b>detalle</b> (banco, depositante, N° de operación); tú solo eliges la <b>cuenta contable</b>.</p>
          <input id="e_compfile" type="file" accept="image/*" capture="environment">
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
            <button type="button" class="btn sec" id="e_compread" style="border:1px solid var(--line)" disabled>🤖 Leer comprobante con IA</button>
            <span class="msg" id="e_compmsg"></span>
          </div>
          <div id="e_compprev" style="margin-top:8px"></div>
        </div>
        <button class="btn" id="e_save">Registrar egreso</button>
        <div class="msg" id="e_msg"></div>
      </div>` : ''}
      <div class="kpis" style="margin-top:10px">
        <div class="kpi"><div class="n">${EGRESOS.length}</div><div class="l">Egresos</div></div>
        <div class="kpi"><div class="n" style="color:var(--danger)">${money(total)}</div><div class="l">Total egresos</div></div>
      </div>
      <div class="toolbar"><button class="btn sec" id="e_export" style="border:1px solid var(--line)">⬇ Exportar</button></div>
      <table><thead><tr><th>Fecha</th><th>N° Gasto</th><th>Cuenta</th><th>Detalle</th><th>Pago</th><th>Resp.</th><th style="text-align:right">Importe</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="8" style="color:var(--muted)">Sin egresos todavía.</td></tr>`}</tbody></table>`;
    if (el("e_save")) el("e_save").onclick = registrarEgreso;
    if (el("e_compfile")) el("e_compfile").onchange = async () => {
      const f = el("e_compfile").files && el("e_compfile").files[0]; if (!f) return;
      const msg = el("e_compmsg"); msg.className = "msg"; msg.textContent = "Preparando imagen…";
      try {
        egComprobante = await cxCompressImage(f);
        egCompData = null;
        el("e_compprev").innerHTML = `<img src="${egComprobante}" style="max-height:140px;border-radius:8px;border:1px solid var(--line)">`;
        el("e_compread").disabled = false;
        msg.textContent = "Listo. Toca “Leer comprobante con IA”.";
      } catch (e) { msg.className = "msg err"; msg.textContent = e.message || "No se pudo preparar la imagen."; }
    };
    if (el("e_compread")) el("e_compread").onclick = async () => {
      if (!egComprobante) return;
      const msg = el("e_compmsg"); const btn = el("e_compread");
      btn.disabled = true; const o = btn.textContent; btn.textContent = "Leyendo…"; msg.className = "msg"; msg.textContent = "";
      const r = await ocrComprobanteGemini(egComprobante);
      btn.disabled = false; btn.textContent = o;
      if (r.error) { msg.className = "msg err"; msg.textContent = r.error; return; }
      egCompData = r.data || {};
      const d = egCompData;
      if (d.importe && el("e_imp") && !el("e_imp").value) { const n = parseFloat(String(d.importe).replace(/[^\d.]/g, "")); if (!isNaN(n)) el("e_imp").value = n; }
      const partes = [];
      if (d.concepto) partes.push(d.concepto);
      if (d.banco) partes.push("Banco " + d.banco);
      if (d.depositante) partes.push("de " + d.depositante);
      if (d.nroOperacion) partes.push("Op. " + d.nroOperacion);
      const detalleAuto = partes.join(" · ");
      if (detalleAuto && el("e_det") && !el("e_det").value) el("e_det").value = detalleAuto;
      msg.className = "msg ok"; msg.textContent = "✓ Datos extraídos. Revisa y elige la cuenta contable.";
    };
    if (el("e_export")) el("e_export").onclick = () => {
      const H = ["Fecha", "N Gasto", "Cuenta contable", "Detalle", "Forma pago", "Responsable", "Importe"];
      const rws = EGRESOS.map(r => [r.fecha || fmtFecha(r.fechaISO), r.nroGasto || "", r.cuentaContable || "", r.detalle || "", r.tipoPago || "", r.atencion || "", (Number(r.importe) || 0)]);
      downloadCSV("CONTAX-Egresos-" + hoyISO() + ".csv", H, rws);
    };
    el("v-egresos").querySelectorAll("[data-dele]").forEach(b => b.onclick = async () => {
      const r = EGRESOS.find(x => x.id === b.dataset.dele); if (!r) return;
      if (!confirm(`¿Eliminar el egreso N° ${r.nroGasto} (${money(r.importe)})?`)) return;
      try { await deleteDoc(doc(db, "egresos", r.id)); await egLoad(); paintEgresos(); } catch (e) { alert("No se pudo eliminar."); }
    });
  });
}
async function registrarEgreso() {
  const msg = el("e_msg");
  const imp = parseFloat(el("e_imp").value);
  if (isNaN(imp) || imp < 0) { msg.className = "msg err"; msg.textContent = "Pon un importe válido."; return; }
  const btn = el("e_save"); btn.disabled = true; btn.textContent = "Registrando…";
  try {
    const nro = await recNextNum("nextGasto", 1002);
    const now = new Date();
    const eg = {
      nroGasto: nro, fechaISO: now.toISOString(), fecha: el("e_fecha").value.trim(),
      cuentaContable: el("e_cuenta").value, detalle: el("e_det").value.trim(), importe: imp,
      tipoPago: el("e_pago").value, atencion: el("e_at").value,
      compBanco: (egCompData && egCompData.banco) || "", compDepositante: (egCompData && egCompData.depositante) || "",
      compNroOperacion: (egCompData && egCompData.nroOperacion) || "", compFecha: (egCompData && egCompData.fecha) || "",
      registradoPorUid: (ME && ME.uid) || "", registradoPorNombre: (ME && (ME.name || ME.email)) || "", createdAt: serverTimestamp()
    };
    await setDoc(doc(collection(db, "egresos")), eg);
    egComprobante = null; egCompData = null;
    await egLoad(); paintEgresos();
  } catch (e) { btn.disabled = false; btn.textContent = "Registrar egreso"; msg.className = "msg err"; msg.textContent = "Error: " + (e.code || e.message); }
}

// ---------- DASHBOARD ----------
async function renderDashboard() {
  el("v-dashboard").innerHTML = `<h1>Dashboard</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  await recepLoad();
  try { await ltLoad(); } catch (e) {}
  paintDashboard();
}
// Quien no tiene acceso a Reportes financieros ve el mismo dashboard pero solo con cantidades (sin importes)
function paintDashboard() {
  const verBs = canSeeView("repfinanzas");
  const total = RECEP.length;
  const hoy = new Date(), mesAct = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");
  const fLocal = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  const delMes = RECEP.filter(r => fLocal(r.fechaISO) === mesAct);
  const suma = l => l.reduce((a, r) => a + (Number(r.importe) || 0), 0);
  const cat = r => { const c = recCatDe(r); return c === "declaracion" ? "Declaraciones" : c === "eeff" ? "Estados financieros" : c === "facturacion" ? "Facturación" : c === "tramite" ? "Trámites" : "Otros"; };
  const porCat = {}; RECEP.forEach(r => { const k = cat(r); porCat[k] = porCat[k] || { n: 0, m: 0 }; porCat[k].n++; porCat[k].m += Number(r.importe) || 0; });
  const meses = {}; RECEP.forEach(r => { const k = fLocal(r.fechaISO); if (k) { meses[k] = meses[k] || { n: 0, m: 0 }; meses[k].n++; meses[k].m += Number(r.importe) || 0; } });
  const mesesK = Object.keys(meses).sort().slice(-6);
  const val = k => verBs ? meses[k].m : meses[k].n;
  const maxMes = Math.max(1, ...mesesK.map(val));
  const porAt = {}; delMes.forEach(r => { const k = String(r.atencion || "—").toUpperCase(); porAt[k] = (porAt[k] || 0) + 1; });
  // Avance de las listas de trabajo
  const LT = LT_DATA || [];
  const decl = LT.filter(r => enListaTrabajo(r, "declaracion"));
  const dEst = k => decl.filter(r => djGrupo(djEstado(r)) === k).length;
  const eeff = LT.filter(r => enListaTrabajo(r, "eeff"));
  const fact = LT.filter(r => recCatDe(r) === "facturacion" && recPeriodoKey(r) === mesAct);
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const barra = (lbl, a, b, color) => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>${lbl}</span><b class="mono">${a} / ${b}</b></div><div style="height:10px;background:var(--panel2);border-radius:20px;overflow:hidden"><i style="display:block;height:100%;width:${pct(a, b)}%;background:${color || "var(--accent)"};border-radius:20px"></i></div></div>`;
  const kpi = (n, l, c) => `<div class="kpi"><div class="n"${c ? ` style="color:${c}"` : ""}>${n}</div><div class="l">${l}</div></div>`;
  el("v-dashboard").innerHTML = `<h1>Dashboard</h1><p class="lead">Cómo vamos: recepciones y avance del trabajo del equipo${verBs ? "" : " (sin importes)"}.</p>
    <div class="kpis">
      ${kpi(total, "Recepcionados en la gestión")}
      ${kpi(delMes.length, "Recepciones este mes")}
      ${verBs ? kpi(money(suma(RECEP)), "Ingresos de la gestión") : ""}
      ${verBs ? kpi(money(suma(delMes)), "Ingresos este mes", "var(--green)") : ""}
      ${kpi(dEst("pendiente"), "Declaraciones pendientes", "var(--warn)")}
      ${kpi(dEst("en_proceso"), "Declaraciones en proceso")}
      ${kpi(dEst("entregado"), "Declaraciones terminadas", "var(--ok)")}
    </div>
    <div class="grid2" style="gap:16px;align-items:start">
      <div class="formcard" style="max-width:none"><h3 style="margin:0 0 12px">Avance del trabajo</h3>
        ${barra("Declaraciones terminadas", dEst("entregado"), decl.length)}
        ${barra("Estados financieros entregados", eeff.filter(r => r.estadoTrabajo === "entregado").length, eeff.length)}
        ${barra("Facturación del mes · facturados", fact.filter(r => r.estadoFactura === "facturado").length, fact.length)}
      </div>
      <div class="formcard" style="max-width:none"><h3 style="margin:0 0 12px">${verBs ? "Ingresos por mes" : "Recepciones por mes"}</h3>
        ${mesesK.length ? mesesK.map(k => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px"><span class="mono" style="width:62px;color:var(--muted)">${k}</span><span style="flex:1;height:10px;background:var(--panel2);border-radius:20px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(val(k) / maxMes * 100)}%;background:var(--accent);border-radius:20px"></i></span><span class="mono" style="width:${verBs ? 120 : 50}px;text-align:right">${verBs ? money(meses[k].m) : meses[k].n}</span></div>`).join("") : '<div class="note">Aún no hay datos.</div>'}
      </div>
    </div>
    <div class="grid2" style="gap:16px;align-items:start">
      <div class="formcard" style="max-width:none"><h3 style="margin:0 0 12px">Por servicio</h3>
        <table><thead><tr><th>Servicio</th><th style="text-align:right">Cantidad</th>${verBs ? '<th style="text-align:right">Ingresos</th>' : ""}</tr></thead><tbody>${Object.keys(porCat).sort((a, b) => porCat[b].n - porCat[a].n).map(k => `<tr><td>${escape(k)}</td><td class="mono" style="text-align:right">${porCat[k].n}</td>${verBs ? `<td class="mono" style="text-align:right">${money(porCat[k].m)}</td>` : ""}</tr>`).join("") || '<tr><td class="note" colspan="3">Sin datos</td></tr>'}</tbody></table>
      </div>
      <div class="formcard" style="max-width:none"><h3 style="margin:0 0 12px">Recepciones del mes por persona</h3>
        <table><tbody>${Object.entries(porAt).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<tr><td>${escape(k)}</td><td class="mono" style="text-align:right">${n}</td></tr>`).join("") || '<tr><td class="note">Sin recepciones este mes</td></tr>'}</tbody></table>
      </div>
    </div>
    <div class="formcard" style="max-width:none;margin-top:16px" id="dash-fases"><p class="note"><span class="cx-spin"></span> Cargando balances por fase…</p></div>`;
  eeffFasesBloque("dash-fases", verBs);
}

// ---------- LISTAS (Declaraciones / Trámites / EEFF) ----------
const ESTADOS_LISTA = [["pendiente", "Pendiente"], ["en_proceso", "En proceso"], ["entregado", "Entregado"]];
async function renderLista(tipo, viewId, titulo) {
  el(viewId).innerHTML = `<h1>${escape(titulo)}</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  await recepLoad();
  paintLista(tipo, viewId, titulo);
}
function paintLista(tipo, viewId, titulo) {
  const canEdit = canEditClientes();
  const list = RECEP.filter(r => r.tipo === tipo);
  const pend = list.filter(r => (r.estado || "pendiente") !== "entregado").length;
  const rows = list.map(r => {
    const est = r.estado || "pendiente";
    const ctrl = canEdit ? `<select class="mini" data-estado="${r.id}">${ESTADOS_LISTA.map(([v, l]) => `<option value="${v}" ${v === est ? 'selected' : ''}>${l}</option>`).join('')}</select>` : `<span class="badge ${est === 'entregado' ? 'ok' : 'off'}">${est}</span>`;
    return `<tr>
      <td class="mono">${escape(fmtFecha(r.fechaISO))}</td>
      <td><b>${escape(r.clienteNombre || "—")}</b>${r.clienteCelular ? `<div style="color:var(--muted);font-size:12px">${escape(r.clienteCelular)}</div>` : ''}</td>
      <td>${escape(r.servicioNombre || "—")}</td>
      <td class="mono" style="text-align:right">${money(r.importe)}</td>
      <td>${ctrl}</td></tr>`;
  }).join("");
  el(viewId).innerHTML = `<h1>${escape(titulo)}</h1>
    <p class="lead">Trabajo generado desde la Recepción. ${canEdit ? 'Cambia el estado conforme avances con el equipo.' : ''}</p>
    <div class="kpis"><div class="kpi"><div class="n">${list.length}</div><div class="l">Total</div></div><div class="kpi"><div class="n" style="color:var(--warn)">${pend}</div><div class="l">Por entregar</div></div></div>
    <table><thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th style="text-align:right">Importe</th><th>Estado</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="5" style="color:var(--muted)">Nada por aquí todavía. Se llena cuando registres pagos de este tipo en Recepción (el tipo se define en Tarifas).</td></tr>`}</tbody></table>`;
  el(viewId).querySelectorAll("[data-estado]").forEach(sel => sel.onchange = async () => {
    try { await setDoc(doc(db, "recepciones", sel.dataset.estado), { estado: sel.value, _upd: Date.now() }, { merge: true }); rcPoner(sel.dataset.estado, { estado: sel.value }); const r = RECEP.find(x => x.id === sel.dataset.estado); if (r) r.estado = sel.value; paintLista(tipo, viewId, titulo); }
    catch (e) { alert("No se pudo guardar el estado."); }
  });
}


// ============================================================
//  LISTAS DE TRABAJO (Declaraciones · EEFF · Facturación)
//  Reglas de corte acordadas (oct-2026):
//   - Declaraciones: DECLARACIÓN MENSUAL del período OCTUBRE 2026 en adelante
//     (lo anterior ya se culminó) + todo lo que se recepcione desde el corte.
//   - EEFF: todos los BALANCE recepcionados en 2026 en adelante.
//   - Facturación: FACTURACIÓN del período OCTUBRE 2026 en adelante (suscripción activa).
//  Estados propios de cada lista (no se mezclan con el "estado" del importador):
//   estadoTrabajo (declaraciones/EEFF) y estadoFactura (facturación).
// ============================================================
const LISTA_CORTE = {
  declaracionDesdePeriodo: "2026-10",
  eeffDesdeFecha: "2026-01-01", // desde cuándo se cargan datos para las listas
  eeffDesdeGestion: "2026",     // EEFF: gestión (año del balance) desde la cual se lista
  facturacionDesdePeriodo: "2026-10",
  nuevosDesdeFecha: "2026-10-23"
};
function recNormTxt(t) { return String(t == null ? "" : t).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
// Período (AAAA-MM) al que corresponde la recepción: el mes declarado / facturado
function recPeriodoKey(r) {
  if (r.periodoTipo === "mes" && r.periodoMes && r.periodoAnio) return r.periodoAnio + "-" + String(r.periodoMes).padStart(2, "0");
  const t = recNormTxt(r.mesRecepcion).replace("SETIEMBRE", "SEPTIEMBRE");
  const mi = REC_MESES.findIndex(m => t.indexOf(m) >= 0);
  if (mi < 0) return "";
  let y = (t.match(/20\d{2}/) || [])[0];
  if (!y) { const yy = t.match(/[./>\-\s](\d{2})\b/); if (yy) y = "20" + yy[1]; }
  if (!y) {
    const f = String(r.fechaISO || ""); const fy = Number(f.slice(0, 4)), fm = Number(f.slice(5, 7));
    if (!fy) return "";
    // El año que deja el período más cerca de la fecha de recepción:
    // "DICIEMBRE" recepcionado en enero = diciembre anterior; "OCTUBRE" pagado el 30/09 = octubre del mismo año (adelantado)
    const ref = fy * 12 + (fm - 1);
    // Se toma el más reciente que no pase de 1 mes adelante de la recepción
    y = [fy + 1, fy, fy - 1].find(c => c * 12 + mi <= ref + 1);
  }
  return y + "-" + String(mi + 1).padStart(2, "0");
}
// Gestión (año) del balance: la que se pone en "Mes" al recepcionar (ej.: "2026" o "Gestión 2026")
function recGestionEEFF(r) {
  if (r.periodoTipo === "gestion" && r.periodoAnio) return String(r.periodoAnio);
  const m = String(r.mesRecepcion || "").match(/(20\d{2})/);
  return m ? m[1] : "";
}
function recPeriodoTxt(k) { if (!k) return "—"; const [y, m] = k.split("-"); return REC_MESES_CAP[Number(m) - 1] + " " + y; }
function recCatDe(r) { return r.tipo || recCategoria(r.servicio || r.servicioNombre, r.detalleServicio); }
function enListaTrabajo(r, tipo) {
  const cat = recCatDe(r), f = String(r.fechaISO || "").slice(0, 10), per = recPeriodoKey(r);
  // "Nuevo" = registrado en el panel (no viene de la importación) o recepcionado desde el corte:
  // entra a la lista SEA DEL PERÍODO QUE SEA (ej.: alguien que recién paga enero 2025).
  const nuevo = r.origen !== "importado" || f >= LISTA_CORTE.nuevosDesdeFecha;
  if (tipo === "declaracion") return cat === "declaracion" && (nuevo || per >= LISTA_CORTE.declaracionDesdePeriodo);
  if (tipo === "eeff") { const g = recGestionEEFF(r); return cat === "eeff" && (nuevo || (g && g >= LISTA_CORTE.eeffDesdeGestion)); }
  if (tipo === "facturacion") return cat === "facturacion" && (nuevo || per >= LISTA_CORTE.facturacionDesdePeriodo);
  return false;
}
const ESTADOS_TRABAJO = [["pendiente", "Pendiente"], ["en_proceso", "En proceso"], ["entregado", "Entregado"]];
const ESTADOS_FACTURA = [["pendiente", "Pendiente"], ["facturado", "Facturado"]];
const LT_UI = {}; // filtros por lista
// Datos propios de las listas (desde 2026), se cargan una vez por sesión para no gastar lecturas
let LT_DATA = null, LT_AT = 0;
async function ltLoad(force) {
  try {
    const todos = (await recSync()).filter(recValida);
    LT_DATA = todos.filter(r => String(r.fechaISO || "") >= LISTA_CORTE.eeffDesdeFecha); LT_AT = Date.now();
  } catch (e) { if (!LT_DATA) LT_DATA = []; alert("No se pudo cargar la lista: " + (e.code || e.message)); }
}
async function renderListaTrabajo(tipo, viewId, titulo) {
  el(viewId).innerHTML = `<h1>${escape(titulo)}</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  await ltLoad();
  paintListaTrabajo(tipo, viewId, titulo);
}
function ltFila(r, campo, estados, canEdit) {
  const est = r[campo] || "pendiente";
  const ctrl = canEdit
    ? `<select class="mini" data-lt="${r.id}" data-campo="${campo}">${estados.map(([v, l]) => `<option value="${v}" ${v === est ? "selected" : ""}>${l}</option>`).join("")}</select>`
    : `<span class="badge ${est === "entregado" || est === "facturado" ? "ok" : "off"}">${escape((estados.find(e => e[0] === est) || [0, est])[1])}</span>`;
  return ctrl;
}
function ltBindEstados(root, repaint) {
  root.querySelectorAll("[data-lt]").forEach(sel => sel.onchange = async () => {
    const id = sel.dataset.lt, campo = sel.dataset.campo, val = sel.value;
    try {
      await setDoc(doc(db, "recepciones", id), { [campo]: val, [campo + "At"]: serverTimestamp(), [campo + "Por"]: (ME && ME.uid) || "", _upd: Date.now() }, { merge: true });
      rcPoner(id, { [campo]: val });
      [LT_DATA || [], RECEP].forEach(arr => { const r = arr.find(x => x.id === id); if (r) r[campo] = val; });
      repaint();
    } catch (e) { alert("No se pudo guardar el estado."); }
  });
}
function paintListaTrabajo(tipo, viewId, titulo) {
  const canEdit = canEditClientes();
  const ui = LT_UI[tipo] || (LT_UI[tipo] = { q: "", est: "", per: "" });
  const base = LT_DATA.filter(r => enListaTrabajo(r, tipo));
  const perDe = r => tipo === "eeff" ? recGestionEEFF(r) : recPeriodoKey(r);
  const perTxt = k => tipo === "eeff" ? (k ? "Gestión " + k : "—") : recPeriodoTxt(k);
  const periodos = [...new Set(base.map(perDe).filter(Boolean))].sort().reverse();
  let list = base;
  if (ui.per) list = list.filter(r => perDe(r) === ui.per);
  if (ui.est) list = list.filter(r => (r.estadoTrabajo || "pendiente") === ui.est);
  if (ui.q) { const q = ui.q.toLowerCase(); list = list.filter(r => [r.clienteNombre, r.nit, r.detalleServicio, r.mesRecepcion, r.nroRecepcion, r.atencion].join(" ").toLowerCase().includes(q)); }
  list = list.slice().sort((a, b) => (b.fechaISO || "").localeCompare(a.fechaISO || ""));
  const cnt = k => base.filter(r => (r.estadoTrabajo || "pendiente") === k).length;
  const rows = list.map(r => `<tr>
      <td class="mono">${escape(r.fecha || fmtFecha(r.fechaISO))}</td>
      <td class="mono">${escape(String(r.nroRecepcion || "—"))}</td>
      <td><b>${escape(r.clienteNombre || "—")}</b><div style="color:var(--muted);font-size:12px">NIT ${escape(String(r.nit || "—"))}${r.rubro ? " · " + escape(r.rubro) : ""}</div></td>
      <td>${escape(r.detalleServicio || r.servicio || "—")}</td>
      <td>${escape(perTxt(perDe(r)))}</td>
      <td>${ltFila(r, "estadoTrabajo", ESTADOS_TRABAJO, canEdit)}</td></tr>`).join("");
  const nota = tipo === "declaracion"
    ? "Declaraciones mensuales del período <b>Octubre 2026</b> en adelante, más todo lo que se recepcione desde ahora. Lo anterior ya está culminado."
    : "Estados financieros de la <b>gestión 2026</b> en adelante, más todo balance que se recepcione desde ahora aunque sea de una gestión anterior (ej.: alguien que recién hace su gestión 2024).";
  el(viewId).innerHTML = `<h1>${escape(titulo)}</h1>
    <p class="lead">${nota}</p>
    <div class="kpis">
      <div class="kpi"><div class="n">${base.length}</div><div class="l">Total</div></div>
      <div class="kpi"><div class="n" style="color:var(--warn)">${cnt("pendiente")}</div><div class="l">Pendientes</div></div>
      <div class="kpi"><div class="n">${cnt("en_proceso")}</div><div class="l">En proceso</div></div>
      <div class="kpi"><div class="n" style="color:var(--ok)">${cnt("entregado")}</div><div class="l">Entregados</div></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px">
      ${periodos.length ? `<select id="lt_per"><option value="">Todos los períodos</option>${periodos.map(k => `<option value="${k}" ${k === ui.per ? "selected" : ""}>${perTxt(k)}</option>`).join("")}</select>` : ""}
      <select id="lt_est"><option value="">Todos los estados</option>${ESTADOS_TRABAJO.map(([v, l]) => `<option value="${v}" ${v === ui.est ? "selected" : ""}>${l}</option>`).join("")}</select>
      <input id="lt_q" placeholder="Buscar cliente, NIT, detalle…" value="${escape(ui.q)}" style="flex:1;min-width:200px">
    </div>
    <div style="overflow:auto"><table><thead><tr><th>Fecha rec.</th><th>N° Rec</th><th>Cliente</th><th>Detalle</th><th>${tipo === "eeff" ? "Gestión" : "Período"}</th><th>Estado</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="6" style="color:var(--muted)">No hay registros con este filtro.</td></tr>`}</tbody></table></div>`;
  const root = el(viewId), repaint = () => paintListaTrabajo(tipo, viewId, titulo);
  if (el("lt_per")) el("lt_per").onchange = e => { ui.per = e.target.value; repaint(); };
  el("lt_est").onchange = e => { ui.est = e.target.value; repaint(); };
  el("lt_q").oninput = e => { ui.q = e.target.value; clearTimeout(LT_UI._t); LT_UI._t = setTimeout(() => { repaint(); const q = el("lt_q"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250); };
  ltBindEstados(root, repaint);
}

// ---------- ESTADOS FINANCIEROS (formato de la hoja "Balance2025") ----------
// Cada fila = una recepción de BALANCE. El avance se guarda en la misma recepción con campos "ee_…".
const EE_SEG_REC = ["", "MENSAJE ENV", "ENV AL GRUPO", "NO RESPONDIÓ NADA AL RESPECTO", "FINALIZADO"];
const EE_COLS = [
  ["resp", "Responsable", "resp"], ["iniciado", "Iniciado", "si"], ["rcv", "RCV / Ventas", "si"], ["comp", "Compensaciones", "si"], ["ajustes", "Ajustes", "si"],
  ["pdf", "PDF", "si"], ["arch605", "Archivos 605", "si"], ["firma", "Firma contador", "si"], ["pagadoCont", "Pagado contador", "si"], ["f500emerg", "F500 emergencia", "si"],
  ["f500", "Form-500", "sel", ["", "SI", "RECTIFICADO"]], ["f605", "Form-605", "si"], ["resultado", "Resultado", "sel", ["", "UTILIDAD", "PERDIDA"]],
  ["importe", "Importe utilidad / pérdida", "num"], ["iue", "IUE", "num"], ["iueComp", "IUE a compensar", "si"], ["finalizado", "Finalizado", "si"],
  ["coment", "Comentarios", "txt"], ["respCli", "Respuesta cliente", "si"], ["segCli", "Seguimiento cliente", "sel", EE_SEG_REC], ["wa", "Enviado WhatsApp", "si"]
];
// Etapas que se cuentan en el seguimiento (avance / restante)
const EE_ETAPAS = [["iniciado", "Iniciado"], ["rcv", "RCV / Ventas"], ["comp", "Compensaciones"], ["ajustes", "Ajustes"], ["pdf", "PDF"], ["arch605", "Archivos 605"], ["f500", "Form-500"], ["f605", "Form-605"], ["finalizado", "Finalizado"]];
const EE_UI = { q: "", g: "", resp: "", av: "", res: "", sort: "nro", dir: 1, full: false, fijar: (() => { try { return Number(localStorage.getItem("ee-fijar") || 2); } catch (e) { return 2; } })() };
const eeSi = v => !!v && v !== "NO";
function eeNum(v) { if (v === "" || v == null) return null; const n = typeof v === "number" ? v : arqNum(v); return isNaN(n) ? null : n; }
function eeMoney(v) { const n = eeNum(v); return n == null ? "" : n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
// Meses de actividad dentro de la gestión ("Tiene Gestión Anterior" si abrió el NIT antes)
function eeTiempo(fechaNit, gestion) {
  const f = recFechaISO(fechaNit), g = Number(gestion); if (!f || !g) return f ? "" : "Revisar";
  const y = Number(f.slice(0, 4)), m = Number(f.slice(5, 7));
  if (y < g) return "Tiene Gestión Anterior"; if (y > g) return "Revisar";
  return String(12 - m + 1);
}
function eeAvance(r) { return EE_ETAPAS.filter(([k]) => eeSi(r["ee_" + k])).length; }
async function renderListaEEFF() {
  el("v-eeff").innerHTML = `<h1>Estados Financieros (EEFF)</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  await Promise.all([ltLoad(), new Promise(res => bdEnsureLoaded(() => res())), USERS.length ? 0 : getDocs(collection(db, "users")).then(sn => { if (!USERS.length) sn.forEach(d => USERS.push({ ...d.data(), uid: d.id })); }).catch(() => {})]);
  paintListaEEFF();
}
function eeDatos() {
  const base = LT_DATA.filter(r => enListaTrabajo(r, "eeff"));
  // N° correlativo por gestión, en orden de recepción (BALANCE GENERAL2026/1, /2…)
  const porG = {};
  base.slice().sort((a, b) => String(a.fechaISO || "").localeCompare(String(b.fechaISO || ""))).forEach(r => { const g = recGestionEEFF(r) || "—"; porG[g] = (porG[g] || 0) + 1; r._eeN = porG[g]; r._eeG = g; });
  const bdPorNit = {}; BD.forEach(c => { const n = String(bdV(c, "nit")).replace(/\D/g, ""); if (n) bdPorNit[n] = c; });
  base.forEach(r => { r._bd = bdPorNit[String(r.nit || "").replace(/\D/g, "")] || null; });
  return base;
}
function paintListaEEFF() {
  const canEdit = canEditClientes(), verClave = canEdit, ui = EE_UI;
  const base = eeDatos();
  const gestiones = [...new Set(base.map(r => r._eeG))].sort().reverse();
  const resps = [...new Set(base.map(r => r.ee_resp).filter(Boolean).concat(USERS.filter(u => u.active !== false).map(u => String(u.name || "").split(" ")[0].toUpperCase()).filter(Boolean)))].sort();
  let list = base;
  if (ui.g) list = list.filter(r => r._eeG === ui.g);
  if (ui.resp) list = list.filter(r => (r.ee_resp || "") === (ui.resp === "-" ? "" : ui.resp));
  if (ui.av === "sin") list = list.filter(r => !eeSi(r.ee_iniciado) && !eeSi(r.ee_finalizado));
  else if (ui.av === "curso") list = list.filter(r => eeSi(r.ee_iniciado) && !eeSi(r.ee_finalizado));
  else if (ui.av === "fin") list = list.filter(r => eeSi(r.ee_finalizado));
  if (ui.res) list = list.filter(r => (r.ee_resultado || "") === (ui.res === "-" ? "" : ui.res));
  if (ui.q) { const q = ui.q.toLowerCase(); list = list.filter(r => [r.clienteNombre, r.nit, r.ee_coment, r.ee_resp, r.clienteCorreo, "bg" + r._eeG + "/" + r._eeN].join(" ").toLowerCase().includes(q)); }
  const val = { nro: r => r._eeG + String(r._eeN).padStart(5, "0"), cliente: r => String(r.clienteNombre || "").toUpperCase(), avance: r => eeAvance(r), importe: r => eeNum(r.ee_importe) || 0, fecha: r => String(r.fechaISO || "") };
  const fv = val[ui.sort] || val.nro;
  list = list.slice().sort((a, b) => { const x = fv(a), y = fv(b); return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * ui.dir; });
  // ---- Seguimiento (como la hoja "Seguimiento") ----
  const tot = list.length;
  const etapa = k => list.filter(r => k === "f500" ? !!r.ee_f500 : eeSi(r["ee_" + k])).length;
  const util = list.filter(r => r.ee_resultado === "UTILIDAD"), perd = list.filter(r => r.ee_resultado === "PERDIDA");
  const iueTot = list.reduce((a, r) => a + (eeNum(r.ee_iue) || 0), 0);
  const seg = `<div class="formcard" style="max-width:none;margin:0 0 14px">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <div class="kpi" style="flex:1;min-width:140px"><div class="n">${tot}</div><div class="l">Balances en la lista</div></div>
      <div class="kpi" style="flex:1;min-width:140px"><div class="n" style="color:var(--ok)">${etapa("finalizado")}</div><div class="l">Finalizados</div></div>
      <div class="kpi" style="flex:1;min-width:140px"><div class="n" style="color:#B4453C">${util.length}</div><div class="l">Con utilidad (informar al cliente)</div></div>
      <div class="kpi" style="flex:1;min-width:140px"><div class="n">${perd.length}</div><div class="l">Con pérdida</div></div>
      <div class="kpi" style="flex:1;min-width:140px"><div class="n">${money(iueTot)}</div><div class="l">IUE total</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">${EE_ETAPAS.map(([k, l]) => { const a = etapa(k), pct = tot ? Math.round(a / tot * 100) : 0; return `<div style="background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px 10px"><div style="display:flex;justify-content:space-between;font-size:12px"><b>${escape(l)}</b><span class="mono">${a}/${tot}</span></div><div style="height:6px;border-radius:6px;background:var(--line);margin:6px 0 4px;overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:${pct === 100 ? "var(--ok)" : "var(--sage)"}"></i></div><div style="font-size:11px;color:var(--muted)">Avance ${a} · Restante ${tot - a}</div></div>`; }).join("")}</div></div>`;
  // ---- Tabla ----
  const ord = (k, l, st) => `<th class="th-ord${ui.sort === k ? " on" : ""}" data-eeo="${k}" ${st || ""}>${escape(l)}<span class="ord">${ui.sort === k ? (ui.dir > 0 ? ORD_UP : ORD_DN) : ORD_NO}</span></th>`;
  const celda = (r, [k, l, t, o]) => {
    const v = r["ee_" + k] == null ? "" : r["ee_" + k], id = r.id;
    if (t === "si") return `<td style="text-align:center"><button class="ee-si${eeSi(v) ? " on" : ""}" data-ee="${id}" data-k="${k}" ${canEdit ? "" : "disabled"} title="${escape(l)}">${eeSi(v) ? "SI" : ""}</button></td>`;
    if (!canEdit) return `<td${t === "num" ? ' class="mono" style="text-align:right"' : ""}>${escape(t === "num" ? eeMoney(v) : v)}</td>`;
    if (t === "sel") return `<td><select class="ee-in" data-ee="${id}" data-k="${k}" style="min-width:${k === "segCli" ? 170 : 100}px;${k === "resultado" ? (v === "UTILIDAD" ? "color:#B4453C;font-weight:700" : v === "PERDIDA" ? "font-weight:700" : "") : ""}">${o.map(x => `<option value="${escape(x)}" ${x === v ? "selected" : ""}>${escape(x || "—")}</option>`).join("")}</select></td>`;
    if (t === "resp") return `<td><input class="ee-in" data-ee="${id}" data-k="${k}" list="ee_resps" value="${escape(v)}" style="width:110px;text-transform:uppercase"></td>`;
    if (t === "num") return `<td><input class="ee-in mono" data-ee="${id}" data-k="${k}" inputmode="decimal" value="${escape(eeMoney(v))}" style="width:110px;text-align:right${k === "importe" && eeNum(v) < 0 ? ";color:#B4453C" : ""}"></td>`;
    return `<td><input class="ee-in" data-ee="${id}" data-k="${k}" value="${escape(v)}" style="width:220px"></td>`;
  };
  const rows = list.map(r => {
    const c = r._bd, pass = c ? bdV(c, "password") : "", fNit = c ? bdV(c, "fechaNit") : (r.aperturaNit || "");
    return `<tr${eeSi(r.ee_finalizado) ? ' style="background:rgba(46,125,91,.07)"' : ""}>
      <td class="mono" style="white-space:nowrap">BG${escape(r._eeG)}/${r._eeN}</td>
      <td><b>${escape(r.clienteNombre || "—")}</b><div style="font-size:11px;color:var(--muted)">${escape(r.detalleServicio || "")}${r.pasarela && r.pasarela.balance ? " · " + escape(r.pasarela.balance) : ""}</div></td>
      <td class="mono">${escape(String(r.nit || ""))}</td>
      <td style="font-size:12px">${escape(r.clienteCorreo || (c ? bdV(c, "correo") : ""))}</td>
      <td class="mono" style="font-size:12px">${pass ? (verClave ? `<span class="ee-pass" data-p="${escape(pass)}" title="Toca para ver">••••••</span>` : "••••••") : ""}</td>
      <td class="mono" style="text-align:right">${escape(c ? bdV(c, "capital") : "")}</td>
      <td class="mono">${escape(fNit)}</td>
      <td style="font-size:12px">${escape(eeTiempo(fNit, r._eeG))}</td>
      ${EE_COLS.map(col => celda(r, col)).join("")}
      <td class="mono" style="text-align:center">${eeAvance(r)}/${EE_ETAPAS.length}</td></tr>`;
  }).join("");
  el("v-eeff").innerHTML = `<div id="ee_wrap" class="${ui.full ? "rec-full" : ""}"><h1 style="margin-bottom:4px">Estados Financieros (EEFF)</h1>
    <p class="lead">Lista y seguimiento de balances, con las mismas columnas de la hoja <b>Balance2025</b>. Los cambios se guardan solos y se ven en el Sistema Contable.</p>
    ${seg}
    <div class="toolbar" style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px;align-items:center">
      <select id="ee_g"><option value="">Todas las gestiones</option>${gestiones.map(g => `<option ${g === ui.g ? "selected" : ""}>${escape(g)}</option>`).join("")}</select>
      <select id="ee_resp"><option value="">Todos los responsables</option><option value="-" ${ui.resp === "-" ? "selected" : ""}>Sin responsable</option>${resps.map(x => `<option ${x === ui.resp ? "selected" : ""}>${escape(x)}</option>`).join("")}</select>
      <select id="ee_av"><option value="">Todo el avance</option><option value="sin" ${ui.av === "sin" ? "selected" : ""}>Sin iniciar</option><option value="curso" ${ui.av === "curso" ? "selected" : ""}>En curso</option><option value="fin" ${ui.av === "fin" ? "selected" : ""}>Finalizados</option></select>
      <select id="ee_res"><option value="">Utilidad y pérdida</option><option ${ui.res === "UTILIDAD" ? "selected" : ""}>UTILIDAD</option><option ${ui.res === "PERDIDA" ? "selected" : ""}>PERDIDA</option><option value="-" ${ui.res === "-" ? "selected" : ""}>Sin resultado</option></select>
      <input id="ee_q" placeholder="Buscar cliente, NIT, comentario…" value="${escape(ui.q)}" style="flex:1;min-width:200px">
      <select id="ee_fijar" title="Columnas que se quedan quietas al deslizar"><option value="0">Fijar: ninguna</option>${["N°", "Cliente", "NIT"].map((l, i) => `<option value="${i + 1}" ${ui.fijar === i + 1 ? "selected" : ""}>Fijar hasta: ${l}</option>`).join("")}</select>
      <button class="btn sec" id="ee_xls" style="border:1px solid var(--line)">Exportar Excel</button>
      <button class="btn sec" id="ee_full" style="border:1px solid var(--line);display:inline-flex;gap:6px;align-items:center">${ui.full ? ICO_FULLX + "Salir" : ICO_FULL + "Pantalla completa"}</button>
      <button class="btn sec" id="ee_rel" style="border:1px solid var(--line)">Actualizar</button>
    </div>
    <datalist id="ee_resps">${resps.map(x => `<option value="${escape(x)}">`).join("")}</datalist>
    <div class="bd-scroll" style="max-height:${ui.full ? "calc(100vh - 330px)" : "70vh"}"><table class="bd-table" id="ee_tabla"><thead><tr>
      ${ord("nro", "N°")}${ord("cliente", "Cliente")}<th>NIT</th><th>Correo</th><th>Contraseña</th><th>Capital</th><th>Apertura NIT</th><th>Tiempo</th>
      ${EE_COLS.map(([k, l, t]) => k === "importe" ? ord("importe", l, 'style="text-align:right"') : `<th${t === "si" ? ' style="text-align:center"' : ""}>${escape(l)}</th>`).join("")}${ord("avance", "Avance", 'style="text-align:center"')}
    </tr></thead><tbody>${rows || `<tr><td colspan="${EE_COLS.length + 9}" style="color:var(--muted)">No hay balances con estos filtros.</td></tr>`}</tbody></table></div>
    <p class="note">Toca una casilla para marcar <b>SI</b>. Al marcar <b>Iniciado</b> el balance pasa a "En proceso" y al marcar <b>Finalizado</b> pasa a "Entregado" (también en el Sistema Contable). Al escribir el importe, el resultado y el IUE (25% de la utilidad) se llenan solos.</p></div>
    <style>.ee-si{width:34px;height:26px;border-radius:6px;border:1.5px solid var(--line);background:var(--panel);color:#fff;font-size:11px;font-weight:800;cursor:pointer}.ee-si.on{background:var(--ok);border-color:var(--ok)}.ee-si:disabled{cursor:default}
    .ee-in{height:30px;padding:2px 6px;font-size:12.5px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--txt)}.ee-pass{cursor:pointer;color:var(--muted)}</style>`;
  const repaint = () => { const sc = document.querySelector("#ee_wrap .bd-scroll"), x = sc ? sc.scrollLeft : 0, y = sc ? sc.scrollTop : 0; paintListaEEFF(); const s2 = document.querySelector("#ee_wrap .bd-scroll"); if (s2) { s2.scrollLeft = x; s2.scrollTop = y; } };
  [["ee_g", "g"], ["ee_resp", "resp"], ["ee_av", "av"], ["ee_res", "res"]].forEach(([id, k]) => el(id).onchange = e => { ui[k] = e.target.value; paintListaEEFF(); });
  el("ee_q").oninput = e => { ui.q = e.target.value; clearTimeout(EE_UI._t); EE_UI._t = setTimeout(() => { paintListaEEFF(); const q = el("ee_q"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 300); };
  el("ee_fijar").onchange = e => { ui.fijar = Number(e.target.value) || 0; try { localStorage.setItem("ee-fijar", String(ui.fijar)); } catch (er) {} tablaFijarCols(el("ee_tabla"), ui.fijar); };
  el("ee_full").onclick = () => { ui.full = !ui.full; try { if (ui.full && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); if (!ui.full && document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {} paintListaEEFF(); };
  el("ee_rel").onclick = async () => { LT_DATA = null; await renderListaEEFF(); };
  el("ee_xls").onclick = () => eeExportar(list);
  el("v-eeff").querySelectorAll("th[data-eeo]").forEach(th => th.onclick = () => { const k = th.dataset.eeo; if (ui.sort === k) ui.dir = -ui.dir; else { ui.sort = k; ui.dir = k === "cliente" || k === "nro" ? 1 : -1; } repaint(); });
  el("v-eeff").querySelectorAll(".ee-pass").forEach(sp => sp.onclick = () => { sp.textContent = sp.textContent === "••••••" ? sp.dataset.p : "••••••"; });
  el("v-eeff").querySelectorAll(".ee-si").forEach(b => b.onclick = () => { const r = LT_DATA.find(x => x.id === b.dataset.ee); if (!r) return; eeGuardar(r, b.dataset.k, eeSi(r["ee_" + b.dataset.k]) ? "" : "SI", repaint); });
  el("v-eeff").querySelectorAll(".ee-in").forEach(inp => inp.onchange = () => {
    const r = LT_DATA.find(x => x.id === inp.dataset.ee); if (!r) return;
    let v = inp.value.trim(); if (inp.dataset.k === "resp") v = v.toUpperCase();
    if (inp.dataset.k === "importe" || inp.dataset.k === "iue") { const n = eeNum(v); v = n == null ? "" : n; }
    eeGuardar(r, inp.dataset.k, v, repaint);
  });
  requestAnimationFrame(() => tablaFijarCols(el("ee_tabla"), ui.fijar));
}
async function eeGuardar(r, k, v, repaint) {
  const datos = { ["ee_" + k]: v, ee_editadoPor: (ME && (ME.name || ME.email)) || "", ee_editadoAt: Date.now(), _upd: Date.now() };
  // Automáticos: resultado e IUE según el importe; estado de trabajo según Iniciado / Finalizado
  if (k === "importe" && v !== "") { datos.ee_resultado = v < 0 ? "PERDIDA" : "UTILIDAD"; datos.ee_iue = v > 0 ? Math.round(v * 25) / 100 : 0; }
  if (k === "finalizado") datos.estadoTrabajo = v ? "entregado" : (eeSi(r.ee_iniciado) ? "en_proceso" : "pendiente");
  if (k === "iniciado" && !eeSi(r.ee_finalizado)) datos.estadoTrabajo = v ? "en_proceso" : "pendiente";
  const antes = {}; Object.keys(datos).forEach(x => antes[x] = r[x]);
  Object.assign(r, datos); repaint();
  try { await setDoc(doc(db, "recepciones", r.id), datos, { merge: true }); rcPoner(r.id, datos); }
  catch (e) { Object.assign(r, antes); repaint(); alert("No se pudo guardar: " + (e.code || e.message)); }
}
async function eeExportar(list) {
  try {
    const X = await arqLoadXLSX();
    const filas = [["Nro", "CLIENTE", "NIT", "CORREO", "CAPITAL", "FECHA DE APERTURA NIT", "TIEMPO", ...EE_COLS.map(c => c[1].toUpperCase()), "AVANCE"]];
    list.forEach(r => { const c = r._bd, fNit = c ? bdV(c, "fechaNit") : ""; filas.push(["BALANCE GENERAL" + r._eeG + "/" + r._eeN, r.clienteNombre || "", String(r.nit || ""), r.clienteCorreo || (c ? bdV(c, "correo") : ""), c ? bdV(c, "capital") : "", fNit, eeTiempo(fNit, r._eeG), ...EE_COLS.map(([k, , t]) => t === "num" ? (eeNum(r["ee_" + k]) == null ? "" : eeNum(r["ee_" + k])) : (r["ee_" + k] || "")), eeAvance(r) + "/" + EE_ETAPAS.length]); });
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(filas), "Balances");
    X.writeFile(wb, "Lista-EEFF-" + new Date().toISOString().slice(0, 10) + ".xlsx");
  } catch (e) { alert("No se pudo exportar: " + (e.message || e)); }
}

// ---------- DECLARACIONES (formato BD_DDJJ) ----------
// Cada fila = una recepción de DECLARACIÓN MENSUAL. El equipo llena RCV → Declaración → Seguimiento.
// Los datos se guardan en la misma recepción con campos "dj_…".
const DJ_EQUIPO_DEF = ["LUIS", "ALEJANDRA", "CARELIS", "ENRIQUE", "AILYN", "SOLEDAD", "KEVIN", "OTRO"];
const DJ_ESTADO_RCV = ["", "Falta Factura", "Se rechazaron facturas", "Esperando Facturas Manuales", "Usuario y Contraseña Incorrecta", "Otro"];
const DJ_RESP_CLIENTE = ["", "Esperando respuesta", "Declarar", "Facturas en el Buzón", "Enviará Facturas", "No respondió, Declarar"];
const DJ_PAGO_IMP = ["", "SI", "NO", "No Corresponde Pagar"];
const DJ_ESTADOS = [
  ["pendiente", "Pendiente", "off"],
  ["rcv", "RCV en curso", "mut"],
  ["falta_declarar", "Falta declarar", "danger"],
  ["terminado", "Terminado", "ok"]
];
// Estado: si alguien lo fijó a mano se respeta; si no, se calcula solo con lo llenado
function djEstado(r) {
  if (r.dj_estado && DJ_ESTADOS.some(e => e[0] === r.dj_estado)) return r.dj_estado;
  if (r.dj_fechaDeclaracion || r.dj_declaradoPor) return "terminado";
  if (r.dj_rcvFinalizado) return "falta_declarar";
  if (r.dj_rcvIniciado || r.dj_rcvPor) return "rcv";
  return "pendiente";
}
// Calculadora tributaria (régimen general): IVA 13% (F200) e IT 3% (F400) compensable con IUE
function djCalcular(d) {
  const n = x => { const v = arqNum(x); return isNaN(v) ? 0 : v; };
  const r2 = x => Math.round(x * 100) / 100;
  const ventas = n(d.ventas), compras = n(d.compras), cfAnterior = n(d.cfAnterior), iue = n(d.iue);
  const debito = r2(ventas * 0.13), credito = r2(compras * 0.13);
  const difIva = r2(debito - credito - cfAnterior);           // > 0 a pagar ; < 0 saldo a favor
  const ivaPagar = difIva > 0 ? difIva : 0, cfSiguiente = difIva < 0 ? r2(-difIva) : 0;
  const itBruto = r2(ventas * 0.03);
  const itPagar = r2(Math.max(0, itBruto - iue)), iueSobrante = r2(Math.max(0, iue - itBruto));
  return { hayDatos: String(d.ventas || "").trim() !== "" || String(d.compras || "").trim() !== "", ventas, compras, cfAnterior, iue, debito, credito, difIva, ivaPagar, cfSiguiente, itBruto, itPagar, iueSobrante, total: r2(ivaPagar + itPagar) };
}
function djEstadoBadge(k) { const e = DJ_ESTADOS.find(x => x[0] === k) || DJ_ESTADOS[0]; return `<span class="badge ${e[2]}">${e[1]}</span>`; }
function djYo() { const n = (ME && (ME.name || ME.email || "")) || ""; return n.split(/[\s@]/)[0].toUpperCase(); }
function djEquipo() { const yo = djYo(); return yo && DJ_EQUIPO_DEF.indexOf(yo) < 0 ? [yo].concat(DJ_EQUIPO_DEF) : DJ_EQUIPO_DEF.slice(); }
function djHoy() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function djFechaTxt(iso) { if (!iso) return ""; const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso); }
const DJ_UI = { q: "", est: "", per: "", resp: "", tab: "lista", agr: "periodo" };
// Agrupa estados para el resumen: En proceso = RCV en curso + Falta declarar; Entregado = Terminado
function djGrupo(k) { return k === "terminado" ? "entregado" : (k === "rcv" || k === "falta_declarar") ? "en_proceso" : "pendiente"; }
function djResumenHTML(base, conDinero) {
  const tot = l => {
    const o = { n: l.length, bs: 0, pendiente: 0, en_proceso: 0, entregado: 0 };
    l.forEach(r => { o.bs += Number(r.importe) || 0; o[djGrupo(djEstado(r))]++; });
    return o;
  };
  const T = tot(base);
  const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "—";
  const keyDe = r => DJ_UI.agr === "periodo" ? recPeriodoKey(r) : String(r.fechaISO || "").slice(0, 7);
  const grupos = {};
  base.forEach(r => { const k = keyDe(r) || "sin"; (grupos[k] = grupos[k] || []).push(r); });
  const keys = Object.keys(grupos).sort().reverse();
  const fila = (lbl, o) => `<tr><td><b>${lbl}</b></td><td class="mono" style="text-align:right">${o.n}</td>${conDinero ? `<td class="mono" style="text-align:right">${money(o.bs)}</td>` : ""}
    <td class="mono" style="text-align:right;color:var(--warn)">${o.pendiente}</td><td class="mono" style="text-align:right">${o.en_proceso}</td>
    <td class="mono" style="text-align:right;color:var(--ok)">${o.entregado}</td>
    <td style="min-width:120px"><div style="height:8px;background:var(--panel2);border-radius:20px;overflow:hidden"><i style="display:block;height:100%;width:${o.n ? Math.round(o.entregado / o.n * 100) : 0}%;background:var(--ok)"></i></div><div class="note" style="margin:2px 0 0">${pct(o.entregado, o.n)} entregado</div></td></tr>`;
  return `
    ${conDinero ? "" : `<p class="lead">Declaraciones recepcionadas desde la migración a Firebase (período Octubre 2026 en adelante y todo lo nuevo).</p>`}
    <div class="kpis">
      <div class="kpi"><div class="n">${T.n}</div><div class="l">Recepcionadas para declarar</div></div>
      ${conDinero ? `<div class="kpi"><div class="n" style="font-size:22px">${money(T.bs)}</div><div class="l">Total recepcionado</div></div>` : ""}
      <div class="kpi"><div class="n" style="color:var(--warn)">${T.pendiente}</div><div class="l">Pendientes</div></div>
      <div class="kpi"><div class="n">${T.en_proceso}</div><div class="l">En proceso</div></div>
      <div class="kpi"><div class="n" style="color:var(--ok)">${T.entregado}</div><div class="l">Entregados</div></div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin:0 0 10px;flex-wrap:wrap"><h3 style="margin:0 auto 0 0">Por mes</h3>
      <select id="dj_agr"><option value="periodo" ${DJ_UI.agr === "periodo" ? "selected" : ""}>Por período a declarar</option><option value="recepcion" ${DJ_UI.agr === "recepcion" ? "selected" : ""}>Por mes en que se recepcionó</option></select></div>
    <div style="overflow:auto"><table><thead><tr><th>Mes</th><th style="text-align:right">Recepcionadas</th>${conDinero ? `<th style="text-align:right">Total Bs</th>` : ""}<th style="text-align:right">Pendientes</th><th style="text-align:right">En proceso</th><th style="text-align:right">Entregados</th><th>Avance</th></tr></thead>
    <tbody>${keys.map(k => fila(k === "sin" ? "Sin mes" : recPeriodoTxt(k), tot(grupos[k]))).join("") || `<tr><td colspan="7" class="note">Sin datos todavía.</td></tr>`}</tbody>
    ${keys.length > 1 ? `<tfoot>${fila("TOTAL", T)}</tfoot>` : ""}</table></div>
    <p class="note">En proceso = RCV en curso + Falta declarar · Entregado = Terminado.</p>`;
}
async function renderDDJJ() {
  el("v-declaraciones").innerHTML = `<h1>Declaraciones</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  await ltLoad();
  paintDDJJ();
}
function paintDDJJ() {
  const base = LT_DATA.filter(r => enListaTrabajo(r, "declaracion"));
  const periodos = [...new Set(base.map(recPeriodoKey).filter(Boolean))].sort().reverse();
  let list = base;
  if (DJ_UI.per) list = list.filter(r => recPeriodoKey(r) === DJ_UI.per);
  if (DJ_UI.est) list = list.filter(r => djEstado(r) === DJ_UI.est);
  if (DJ_UI.resp) list = list.filter(r => r.dj_rcvPor === DJ_UI.resp || r.dj_declaradoPor === DJ_UI.resp);
  if (DJ_UI.q) { const q = DJ_UI.q.toLowerCase(); list = list.filter(r => [r.clienteNombre, r.nit, r.clienteId, r.detalleServicio, r.mesRecepcion, r.nroRecepcion, r.rubro].join(" ").toLowerCase().includes(q)); }
  list = list.slice().sort((a, b) => (a.fechaISO || "").localeCompare(b.fechaISO || "") || String(a.hora || "").localeCompare(String(b.hora || "")));
  const cnt = k => base.filter(r => djEstado(r) === k).length;
  const ck = v => v ? `<span style="color:var(--ok);font-weight:700">✓</span>` : `<span style="color:var(--muted)">·</span>`;
  const rows = list.map((r, i) => `<tr class="dj-row" data-id="${r.id}" style="cursor:pointer">
      <td class="mono">${i + 1}</td>
      <td>${escape(recPeriodoTxt(recPeriodoKey(r)))}</td>
      <td><b>${escape(r.clienteNombre || "—")}</b><div style="color:var(--muted);font-size:11.5px">NIT ${escape(String(r.nit || "—"))}${r.clienteId ? " · ID " + escape(String(r.clienteId)) : ""} · ${escape(r.rubro || "")}</div></td>
      <td style="font-size:12px">${escape(r.detalleServicio || "—")}<div style="color:var(--muted);font-size:11px">${escape(r.fecha || djFechaTxt(r.fechaISO))}</div></td>
      <td>${escape(r.dj_rcvPor || "—")}</td>
      <td style="text-align:center">${ck(r.dj_rcvIniciado)} ${ck(r.dj_rcvFinalizado)}</td>
      <td style="font-size:12px">${escape(r.dj_estadoRcv || "")}${r.dj_respuestaCliente ? `<div style="color:var(--muted);font-size:11px">${escape(r.dj_respuestaCliente)}</div>` : ""}</td>
      <td>${escape(r.dj_declaradoPor || "—")}<div style="color:var(--muted);font-size:11px">${escape(djFechaTxt(r.dj_fechaDeclaracion))}</div></td>
      <td class="mono" style="text-align:right">${escape(r.dj_ivaPagar || "")}</td>
      <td class="mono" style="text-align:right">${escape(r.dj_itPagar || "")}</td>
      <td>${djEstadoBadge(djEstado(r))}</td>
      <td style="font-size:12px">${escape(r.dj_pagoImpuestos || "")} ${r.dj_correoEnviado ? "✉️" : ""}</td></tr>`).join("");
  const tabs = `<div class="subtabs" id="djtabs"><button class="subtab ${DJ_UI.tab === "lista" ? "on" : ""}" data-tab="lista">Lista de trabajo</button><button class="subtab ${DJ_UI.tab === "resumen" ? "on" : ""}" data-tab="resumen">Resumen</button></div>`;
  const bindTabs = () => el("v-declaraciones").querySelectorAll("#djtabs .subtab").forEach(b => b.onclick = () => { DJ_UI.tab = b.dataset.tab; paintDDJJ(); });
  if (DJ_UI.tab === "resumen") {
    el("v-declaraciones").innerHTML = `<h1>Declaraciones</h1>${tabs}${djResumenHTML(base)}`;
    bindTabs();
    el("dj_agr").onchange = e => { DJ_UI.agr = e.target.value; paintDDJJ(); };
    return;
  }
  el("v-declaraciones").innerHTML = `<h1>Declaraciones</h1>${tabs}
    <p class="lead">Declaraciones del período <b>Octubre 2026</b> en adelante, más <b>toda declaración que se recepcione desde ahora</b>, sea del mes que sea (lo anterior ya está culminado). Toca una fila para llenar el <b>RCV</b>, la <b>Declaración</b> y el <b>Seguimiento</b>.</p>
    <div class="kpis">
      <div class="kpi"><div class="n">${base.length}</div><div class="l">Total</div></div>
      ${DJ_ESTADOS.map(([k, l]) => `<div class="kpi dj-kpi" data-k="${k}" style="cursor:pointer;${DJ_UI.est === k ? "outline:2px solid var(--accent)" : ""}"><div class="n" ${k === "terminado" ? 'style="color:var(--ok)"' : k === "falta_declarar" ? 'style="color:var(--danger)"' : ""}>${cnt(k)}</div><div class="l">${l}</div></div>`).join("")}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px">
      <select id="dj_per"><option value="">Todos los períodos</option>${periodos.map(k => `<option value="${k}" ${k === DJ_UI.per ? "selected" : ""}>${recPeriodoTxt(k)}</option>`).join("")}</select>
      <select id="dj_est"><option value="">Todos los estados</option>${DJ_ESTADOS.map(([v, l]) => `<option value="${v}" ${v === DJ_UI.est ? "selected" : ""}>${l}</option>`).join("")}</select>
      <select id="dj_resp"><option value="">Todo el equipo</option>${djEquipo().map(n => `<option ${n === DJ_UI.resp ? "selected" : ""}>${escape(n)}</option>`).join("")}</select>
      <input id="dj_q" placeholder="Buscar cliente, NIT, ID…" value="${escape(DJ_UI.q)}" style="flex:1;min-width:200px">
      <button class="mini" id="dj_reload">↻ Actualizar</button>
    </div>
    <div style="overflow:auto"><table style="font-size:13px"><thead>
      <tr style="font-size:11px;letter-spacing:.04em"><th colspan="4" style="text-align:center;background:var(--panel2)">RECEPCIÓN</th><th colspan="3" style="text-align:center;background:var(--tint)">RCV</th><th colspan="4" style="text-align:center;background:var(--panel2)">DECLARACIÓN</th><th style="text-align:center;background:var(--tint)">SEGUIM.</th></tr>
      <tr><th>#</th><th>Período</th><th>Cliente</th><th>Detalle / F. rec.</th><th>Realizado por</th><th>Inic. / Fin.</th><th>Estado RCV</th><th>Declarado por</th><th style="text-align:right">IVA</th><th style="text-align:right">IT</th><th>ESTADO</th><th>Pagó / ✉</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="12" style="color:var(--muted)">No hay declaraciones con este filtro.</td></tr>`}</tbody></table></div>`;
  const re = () => paintDDJJ();
  bindTabs();
  el("dj_per").onchange = e => { DJ_UI.per = e.target.value; re(); };
  el("dj_est").onchange = e => { DJ_UI.est = e.target.value; re(); };
  el("dj_resp").onchange = e => { DJ_UI.resp = e.target.value; re(); };
  el("dj_reload").onclick = async () => { await ltLoad(true); re(); };
  el("dj_q").oninput = e => { DJ_UI.q = e.target.value; clearTimeout(DJ_UI._t); DJ_UI._t = setTimeout(() => { re(); const q = el("dj_q"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250); };
  el("v-declaraciones").querySelectorAll(".dj-kpi").forEach(k => k.onclick = () => { DJ_UI.est = DJ_UI.est === k.dataset.k ? "" : k.dataset.k; re(); });
  el("v-declaraciones").querySelectorAll(".dj-row").forEach(tr => tr.onclick = () => openDDJJ(LT_DATA.find(x => x.id === tr.dataset.id)));
}
function openDDJJ(r, alGuardar) {
  if (!r) return;
  const canEdit = canEditClientes();
  const dis = canEdit ? "" : "disabled";
  const eq = djEquipo();
  const sel = (id, opts, v) => `<select id="${id}" ${dis}>${opts.map(o => `<option value="${escape(o)}" ${String(o) === String(v || "") ? "selected" : ""}>${escape(o || "—")}</option>`).join("")}</select>`;
  const inp = (id, v, ph, t) => `<input id="${id}" type="${t || "text"}" value="${escape(v == null ? "" : String(v))}" placeholder="${ph || ""}" ${dis}>`;
  const chk = (id, v, lbl) => `<label style="display:flex;gap:8px;align-items:center;font-weight:500;margin:0 0 8px"><input type="checkbox" id="${id}" ${v ? "checked" : ""} ${dis} style="width:auto"> ${lbl}</label>`;
  const f = (lbl, html) => `<div class="field"><label>${lbl}</label>${html}</div>`;
  const ts = v => v ? `<span class="note" style="margin-left:4px">(${escape(v)})</span>` : "";
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:22px;width:860px;max-width:96vw;max-height:94vh;overflow:auto">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
      <div><h3 style="margin:0">${escape(r.clienteNombre || "—")}</h3>
        <div class="note" style="margin:2px 0 0">NIT ${escape(String(r.nit || "—"))}${r.clienteId ? " · ID " + escape(String(r.clienteId)) : ""} · ${escape(r.rubro || "")} · ${escape(r.detalleServicio || "")} · Período <b>${escape(recPeriodoTxt(recPeriodoKey(r)))}</b> · Rec. ${escape(r.fecha || djFechaTxt(r.fechaISO))} N° ${escape(String(r.nroRecepcion || "—"))}</div></div>
      <button class="mini" id="dj_x">✕</button></div>
    <div id="dj_cred" class="note" style="margin:6px 0 10px;padding:8px 10px;border:1px dashed var(--line);border-radius:8px">${canEdit ? "🔑 Cargando accesos del cliente…" : "🔑 Accesos visibles solo para quienes pueden editar."}</div>
    <div class="fs">1) RCV</div>
    <div class="grid3">
      ${f("RCV realizado por", sel("dj_rcvPor", [""].concat(eq), r.dj_rcvPor))}
      <div class="field"><label>&nbsp;</label>${chk("dj_rcvIniciado", r.dj_rcvIniciado, "RCV iniciado" + ts(r.dj_rcvIniciadoAt))}${chk("dj_rcvFinalizado", r.dj_rcvFinalizado, "RCV finalizado" + ts(r.dj_rcvFinalizadoAt))}</div>
      <div class="field"><label>&nbsp;</label>${chk("dj_rcvMulta", r.dj_rcvMulta, "Multa fuera de plazo RCV")}</div>
      ${f("Cant. facturas", inp("dj_cantFacturas", r.dj_cantFacturas, "Ej. 12"))}
      ${f("Total compras netas", inp("dj_totalCompras", r.dj_totalCompras, "0,00"))}
      ${f("Total ventas", inp("dj_totalVentas", r.dj_totalVentas, "0,00"))}
      ${f("¿Cuánto le falta?", inp("dj_cuantoFalta", r.dj_cuantoFalta, "Ej. Falta 948,59bs"))}
      ${f("Crédito fiscal (mes anterior)", inp("dj_creditoFiscal", r.dj_creditoFiscal, "0,00"))}
      ${f("Estado RCV", sel("dj_estadoRcv", DJ_ESTADO_RCV, r.dj_estadoRcv))}
      ${f("Respuesta del cliente", sel("dj_respuestaCliente", DJ_RESP_CLIENTE, r.dj_respuestaCliente))}
    </div>
    ${f("Comentario adicional", inp("dj_comentario", r.dj_comentario, "Ej. Facturas con nombre mal escrito"))}
    <div class="fs" style="margin-top:6px">2) Declaración</div>
    <div id="dj_calc" style="background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:0 0 12px;font-size:13px"></div>
    <div class="grid3">
      ${f("Declarado por", sel("dj_declaradoPor", [""].concat(eq), r.dj_declaradoPor))}
      ${f("Fecha de declaración", inp("dj_fechaDeclaracion", r.dj_fechaDeclaracion, "", "date"))}
      ${f("Compensación del IUE", inp("dj_compIUE", r.dj_compIUE, "0,00"))}
      ${f("Crédito fiscal siguiente mes", inp("dj_creditoSigMes", r.dj_creditoSigMes, "0,00"))}
      ${f("IVA a pagar", inp("dj_ivaPagar", r.dj_ivaPagar, "0,00"))}
      ${f("IT a pagar", inp("dj_itPagar", r.dj_itPagar, "0,00"))}
      <div class="field"><label>&nbsp;</label>${chk("dj_multaIVA", r.dj_multaIVA, "Multa fuera de plazo IVA")}${chk("dj_multaIT", r.dj_multaIT, "Multa fuera de plazo IT")}</div>
      ${f("ESTADO", `<select id="dj_estado" ${dis}><option value="">Automático (${escape((DJ_ESTADOS.find(e => e[0] === djEstado(Object.assign({}, r, { dj_estado: "" }))) || [])[1] || "")})</option>${DJ_ESTADOS.map(([k, l]) => `<option value="${k}" ${r.dj_estado === k ? "selected" : ""}>${l}</option>`).join("")}</select>`)}
    </div>
    <div class="fs" style="margin-top:6px">3) Seguimiento</div>
    <div class="grid3">
      ${f("¿El cliente pagó impuestos?", sel("dj_pagoImpuestos", DJ_PAGO_IMP, r.dj_pagoImpuestos))}
      ${f("Fecha que pagó impuestos", inp("dj_fechaPagoImp", r.dj_fechaPagoImp, "", "date"))}
      <div class="field"><label>&nbsp;</label>${chk("dj_correoEnviado", r.dj_correoEnviado, "Correo enviado al cliente" + ts([r.dj_correoFecha, r.dj_correoPor].filter(Boolean).join(" · ")))}</div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px;align-items:center">
      <span class="msg" id="dj_msg" style="margin:0 auto 0 0"></span>
      <button class="btn sec" id="dj_close" style="border:1px solid var(--line)">Cerrar</button>
      ${canEdit ? '<button class="btn" id="dj_save">Guardar</button>' : ""}
    </div></div>`;
  document.body.appendChild(bg);
  const $ = id => bg.querySelector("#" + id);
  const close = () => bg.remove();
  bg.onclick = e => { if (e.target === bg) close(); };
  $("dj_x").onclick = close; $("dj_close").onclick = close;
  // Atajos: al marcar RCV o poner fecha, se completa el responsable con quien está usando el panel
  if (canEdit) {
    const yo = djYo();
    ["dj_rcvIniciado", "dj_rcvFinalizado"].forEach(id => $(id).onchange = () => { if ($(id).checked && !$("dj_rcvPor").value && yo) $("dj_rcvPor").value = yo; });
    $("dj_fechaDeclaracion").onchange = () => { if ($("dj_fechaDeclaracion").value && !$("dj_declaradoPor").value && yo) $("dj_declaradoPor").value = yo; };
    $("dj_declaradoPor").onchange = () => { if ($("dj_declaradoPor").value && !$("dj_fechaDeclaracion").value) $("dj_fechaDeclaracion").value = djHoy(); };
  }
  if (canEdit) (() => {
    const box = $("dj_cred");
    bdEnsureLoaded(ok => {
      if (!ok) { box.textContent = "No se pudo abrir la Base de Datos."; return; }
      const nit = String(r.nit || "").replace(/\D/g, "");
      const c = BD.find(x => String(bdV(x, "nit")).replace(/\D/g, "") === nit && nit);
      if (!c) { box.textContent = "Este NIT no está en la Base de Datos de clientes."; return; }
      const items = [["Usuario", bdV(c, "usuario")], ["Contraseña", bdV(c, "password")], ["Contraseña SIAT", bdV(c, "passSiat")], ["Correo", bdV(c, "correo")], ["Celular", bdV(c, "celular")]].filter(x => x[1]);
      box.innerHTML = items.map(([l, v], i) => `<span style="display:inline-flex;gap:6px;align-items:center;margin:2px 14px 2px 0"><span style="color:var(--muted)">${l}:</span> <b class="mono">${escape(v)}</b> <button class="mini dj-copy" data-i="${i}" title="Copiar">📋</button></span>`).join("") || "El cliente no tiene accesos guardados.";
      box.innerHTML = `<b style="color:var(--accent);margin-right:8px">🔑 Accesos SIN</b>` + box.innerHTML;
      box.querySelectorAll(".dj-copy").forEach(b => b.onclick = () => { try { navigator.clipboard.writeText(items[Number(b.dataset.i)][1]); b.textContent = "✓"; } catch (e) {} });
    });
  })();
  // ---- Calculadora tributaria (IVA 13% / IT 3%) ----
  // Si no hay crédito fiscal anterior, se toma el "crédito fiscal siguiente mes" de la declaración anterior del mismo NIT
  if (!r.dj_creditoFiscal && canEdit) {
    const pk = recPeriodoKey(r), nit = String(r.nit || "").replace(/\D/g, "");
    const prev = (LT_DATA || []).filter(x => x.id !== r.id && String(x.nit || "").replace(/\D/g, "") === nit && nit && recPeriodoKey(x) && recPeriodoKey(x) < pk && x.dj_creditoSigMes)
      .sort((a, b) => recPeriodoKey(b).localeCompare(recPeriodoKey(a)))[0];
    if (prev) { $("dj_creditoFiscal").value = prev.dj_creditoSigMes; $("dj_creditoFiscal").title = "Tomado de " + recPeriodoTxt(recPeriodoKey(prev)); }
  }
  const pintarCalc = (aplicar) => {
    const c = djCalcular({ ventas: $("dj_totalVentas").value, compras: $("dj_totalCompras").value, cfAnterior: $("dj_creditoFiscal").value, iue: $("dj_compIUE").value });
    const fx = n => (Number(n) || 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const lin = (l, v, b) => `<div style="display:flex;justify-content:space-between;gap:10px"><span style="color:var(--muted)">${l}</span><span class="mono" ${b ? 'style="font-weight:700"' : ""}>${v}</span></div>`;
    $("dj_calc").innerHTML = !c.hayDatos ? `🧮 <b>Calculadora:</b> <span class="note">llena <b>Total ventas</b> y <b>Total compras</b> en el RCV y aquí se calculan el IVA y el IT.</span>` : `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b>🧮 Calculadora tributaria</b>${canEdit ? '<button class="mini" id="dj_aplicar" type="button">Pasar resultados ↓</button>' : ""}</div>
      <div class="grid3" style="gap:4px 18px">
        <div>${lin("Débito fiscal (13% ventas)", fx(c.debito))}${lin("Crédito fiscal (13% compras)", fx(c.credito))}${lin("Crédito fiscal anterior", fx(c.cfAnterior))}${lin("IVA: " + (c.ivaPagar > 0 ? "saldo en contra" : "saldo a favor"), fx(Math.abs(c.difIva)), 1)}</div>
        <div>${lin("IT (3% ventas)", fx(c.itBruto))}${lin("IUE a compensar", fx(c.iue))}${lin("IT: " + (c.itPagar > 0 ? "saldo en contra" : "compensado"), fx(c.itPagar), 1)}${c.iueSobrante > 0 ? lin("IUE que sobra (próximo mes)", fx(c.iueSobrante)) : ""}</div>
        <div>${lin("Formulario 200 (IVA)", fx(c.ivaPagar))}${lin("Formulario 400 (IT)", fx(c.itPagar))}${lin("Crédito fiscal siguiente mes", fx(c.cfSiguiente))}${lin("TOTAL A PAGAR", "Bs " + fx(c.total), 1)}</div>
      </div>`;
    const aplicar1 = () => { $("dj_ivaPagar").value = fx(c.ivaPagar); $("dj_itPagar").value = fx(c.itPagar); $("dj_creditoSigMes").value = fx(c.cfSiguiente); };
    if ($("dj_aplicar")) $("dj_aplicar").onclick = () => { aplicar1(); $("dj_aplicar").textContent = "✓ Pasado"; };
    if (aplicar && c.hayDatos && canEdit) aplicar1();
  };
  ["dj_totalVentas", "dj_totalCompras", "dj_creditoFiscal", "dj_compIUE"].forEach(id => $(id).oninput = () => pintarCalc(true));
  pintarCalc(false);
  if ($("dj_save")) $("dj_save").onclick = async () => {
    const v = id => $(id).value.trim(), c = id => !!$(id).checked;
    const ahora = new Date().toLocaleString("es-BO");
    const d = {
      dj_rcvPor: v("dj_rcvPor"), dj_rcvIniciado: c("dj_rcvIniciado"), dj_rcvFinalizado: c("dj_rcvFinalizado"), dj_rcvMulta: c("dj_rcvMulta"),
      dj_cantFacturas: v("dj_cantFacturas"), dj_totalCompras: v("dj_totalCompras"), dj_totalVentas: v("dj_totalVentas"), dj_cuantoFalta: v("dj_cuantoFalta"),
      dj_creditoFiscal: v("dj_creditoFiscal"), dj_estadoRcv: v("dj_estadoRcv"), dj_respuestaCliente: v("dj_respuestaCliente"), dj_comentario: v("dj_comentario"),
      dj_declaradoPor: v("dj_declaradoPor"), dj_fechaDeclaracion: v("dj_fechaDeclaracion"), dj_compIUE: v("dj_compIUE"), dj_creditoSigMes: v("dj_creditoSigMes"),
      dj_ivaPagar: v("dj_ivaPagar"), dj_itPagar: v("dj_itPagar"), dj_multaIVA: c("dj_multaIVA"), dj_multaIT: c("dj_multaIT"), dj_estado: v("dj_estado"),
      dj_pagoImpuestos: v("dj_pagoImpuestos"), dj_fechaPagoImp: v("dj_fechaPagoImp"), dj_correoEnviado: c("dj_correoEnviado"),
      dj_editadoPor: (ME && (ME.name || ME.email)) || "", dj_editadoAt: serverTimestamp()
    };
    // Fechas automáticas (como las columnas "Fecha de Inicio" de la hoja)
    if (d.dj_rcvIniciado && !r.dj_rcvIniciadoAt) d.dj_rcvIniciadoAt = ahora;
    if (d.dj_rcvFinalizado && !r.dj_rcvFinalizadoAt) d.dj_rcvFinalizadoAt = ahora;
    if (d.dj_correoEnviado && !r.dj_correoEnviado) { d.dj_correoFecha = ahora; d.dj_correoPor = djYo(); }
    const m = $("dj_msg"); m.className = "msg"; m.textContent = "Guardando…";
    try {
      d._upd = Date.now();
      await setDoc(doc(db, "recepciones", r.id), d, { merge: true });
      Object.assign(r, d, { dj_editadoAt: Date.now() }); rcPoner(r.id, Object.assign({}, d, { dj_editadoAt: Date.now() }));
      close(); (alGuardar || paintDDJJ)();
    } catch (e) { m.className = "msg err"; m.textContent = "No se pudo guardar: " + (e.code || e.message); }
  };
}

// ---------- FICHA DEL CLIENTE (antes "HistorialClientes" en Sheets) ----------
const FI_UI = { nit: "", anio: String(new Date().getFullYear()), recs: [], cargando: false };
function fiNit(v) { return String(v == null ? "" : v).replace(/\D/g, ""); }
async function renderFicha() {
  el("v-ficha").innerHTML = `<h1>Ficha del cliente</h1><p class="lead"><span class="cx-spin"></span> Cargando clientes…</p>`;
  bdEnsureLoaded(ok => {
    if (!ok) { el("v-ficha").innerHTML = `<h1>Ficha del cliente</h1><p class="lead">No se pudo abrir la Base de Datos de clientes.</p>`; return; }
    paintFicha();
  });
}
async function fiCargar(nit) {
  FI_UI.nit = nit; FI_UI.recs = []; FI_UI.cargando = true; paintFicha();
  try {
    if (!evLoaded) await evLoad();
    FI_UI.recs = (await recSync()).filter(r => fiNit(r.nit) === nit);
    const anios = [...new Set(FI_UI.recs.map(r => (recPeriodoKey(r) || String(r.fechaISO || "")).slice(0, 4)).filter(Boolean))].sort();
    if (anios.length && anios.indexOf(FI_UI.anio) < 0) FI_UI.anio = anios[anios.length - 1];
  } catch (e) { alert("No se pudo cargar el historial: " + (e.code || e.message)); }
  FI_UI.cargando = false; paintFicha();
}
function paintFicha() {
  const canEdit = canEditClientes();
  const opts = BD.map(c => `${bdV(c, "nombre") || bdV(c, "razon")} — NIT ${bdV(c, "nit")}${bdV(c, "codigoId") ? " — ID " + bdV(c, "codigoId") : ""}`);
  const c = FI_UI.nit ? BD.find(x => fiNit(bdV(x, "nit")) === FI_UI.nit) : null;
  const buscador = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px">
      <input id="fi_q" list="fi_list" placeholder="Escribe nombre, NIT o ID del cliente…" style="flex:1;min-width:260px" value="${c ? escape(opts[BD.indexOf(c)]) : ""}">
      <datalist id="fi_list">${opts.map(o => `<option value="${escape(o)}">`).join("")}</datalist>
      ${FI_UI.nit ? `<button class="mini" id="fi_reload">↻ Actualizar</button>` : ""}
    </div>`;
  if (!FI_UI.nit) {
    el("v-ficha").innerHTML = `<h1>Ficha del cliente</h1><p class="lead">Busca un cliente para ver sus datos, sus declaraciones mes a mes y todo lo que ha recepcionado.</p>${buscador}`;
    fiBind(); return;
  }
  if (FI_UI.cargando) { el("v-ficha").innerHTML = `<h1>Ficha del cliente</h1>${buscador}<p class="lead"><span class="cx-spin"></span> Cargando historial…</p>`; fiBind(); return; }
  const recs = FI_UI.recs;
  const uno = recs[0] || {};
  const dato = (l, v) => `<div style="display:flex;gap:8px;padding:2px 0"><span style="color:var(--muted);flex:0 0 150px">${l}</span><b style="flex:1">${escape(v || "—")}</b></div>`;
  const secretos = canEdit && c ? [["Usuario", bdV(c, "usuario")], ["Contraseña", bdV(c, "password")], ["Contraseña SIAT", bdV(c, "passSiat")]].filter(x => x[1]) : [];
  // ---- Declaraciones del año: 12 meses ----
  const decl = recs.filter(r => recCatDe(r) === "declaracion");
  const anios = [...new Set(recs.map(r => (recPeriodoKey(r) || String(r.fechaISO || "")).slice(0, 4)).filter(Boolean)).add(String(new Date().getFullYear()))].sort().reverse();
  const hoyKey = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0");
  const activo = c ? bdIsActivo(c) : false;
  let sv = 0, sc = 0;
  const filasMes = REC_MESES_CAP.map((mes, i) => {
    const key = FI_UI.anio + "-" + String(i + 1).padStart(2, "0");
    const rs = decl.filter(r => recPeriodoKey(r) === key);
    if (!rs.length) {
      const atrasado = key < hoyKey;
      return `<tr><td class="mono">${i + 1}</td><td><b>${mes}</b></td><td colspan="8">${atrasado ? `<span class="badge ${activo ? "danger" : "off"}">No recepcionado</span>` : `<span class="note">—</span>`}</td></tr>`;
    }
    return rs.map(r => {
      const n = x => { const v = arqNum(x); return isNaN(v) ? 0 : v; };
      sv += n(r.dj_totalVentas); sc += n(r.dj_totalCompras);
      return `<tr class="fi-dj" data-id="${r.id}" style="cursor:pointer"><td class="mono">${i + 1}</td><td><b>${mes}</b><div class="note" style="margin:0">Rec. ${escape(r.fecha || djFechaTxt(r.fechaISO))}</div></td>
        <td style="font-size:12px">${escape(r.detalleServicio || "—")}</td>
        <td>${escape(r.dj_rcvPor || "—")}</td><td>${escape(r.dj_declaradoPor || "—")}<div class="note" style="margin:0">${escape(djFechaTxt(r.dj_fechaDeclaracion))}</div></td>
        <td class="mono" style="text-align:right">${escape(r.dj_totalVentas || "")}</td><td class="mono" style="text-align:right">${escape(r.dj_totalCompras || "")}</td>
        <td class="mono" style="text-align:right">${escape(r.dj_ivaPagar || "")}</td><td class="mono" style="text-align:right">${escape(r.dj_itPagar || "")}</td>
        <td>${(r.origen === "importado" && !Object.keys(r).some(k => k.indexOf("dj_") === 0) && !enListaTrabajo(r, "declaracion")) ? `<span class="badge ok">Recepcionado</span>` : djEstadoBadge(djEstado(r))}</td></tr>`;
    }).join("");
  }).join("");
  const util = Math.round((sv - sc) * 100) / 100, prov = util > 0 ? Math.round(util * 25) / 100 : 0;
  const fx = n => (Number(n) || 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // ---- Otros servicios ----
  const otros = recs.filter(r => recCatDe(r) !== "declaracion").sort((a, b) => (b.fechaISO || "").localeCompare(a.fechaISO || ""));
  el("v-ficha").innerHTML = `<h1>Ficha del cliente</h1>${buscador}
    <div class="grid2" style="gap:16px;align-items:start">
      <div class="formcard" style="max-width:none;margin:0">
        <h3 style="margin:0 0 8px">${escape(c ? (bdV(c, "nombre") || bdV(c, "razon")) : (uno.clienteNombre || "—"))} ${c ? `<span class="badge ${bdEstadoInfo(c).cls}" style="vertical-align:middle">${escape(bdEstadoInfo(c).raw || "—")}</span>` : ""}</h3>
        ${dato("Código de ID", c ? bdV(c, "codigoId") : uno.clienteId)}${dato("NIT", FI_UI.nit)}${dato("Celular", c ? bdV(c, "celular") : uno.clienteCelular)}${dato("Correo", c ? bdV(c, "correo") : uno.clienteCorreo)}
        ${dato("Tipo de contribuyente", c && bdV(c, "tipo"))}${dato("Brinda servicios a", (c && bdV(c, "brinda")) || uno.rubro)}${dato("Fecha apertura NIT", c && bdV(c, "fechaNit"))}
        ${!c ? `<p class="note">Este NIT no está en la Base de Datos de clientes; se muestran los datos de sus recepciones.</p>` : ""}
      </div>
      <div>
        ${secretos.length ? `<div class="formcard" style="max-width:none;margin:0 0 14px"><h3 style="margin:0 0 8px">🔑 Accesos SIN</h3>${secretos.map(([l, v], i) => `<div style="display:flex;gap:8px;align-items:center;padding:2px 0"><span style="color:var(--muted);flex:0 0 130px">${l}</span><b class="mono" style="flex:1">${escape(v)}</b><button class="mini fi-copy" data-i="${i}">📋</button></div>`).join("")}</div>` : ""}
        <div class="kpis" style="margin:0;grid-template-columns:repeat(2,1fr)">
          <div class="kpi"><div class="n" style="font-size:22px">${fx(util)}</div><div class="l">Utilidad / Pérdida ${escape(FI_UI.anio)}</div></div>
          <div class="kpi"><div class="n" style="font-size:22px">${fx(prov)}</div><div class="l">Prov. IUE (25%)</div></div>
        </div>
        <p class="note" style="margin:6px 0 0">Estimado con las ventas y compras registradas en el RCV del año.</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin:20px 0 8px"><h3 style="margin:0 auto 0 0">Detalle de Declaraciones Juradas Mensuales</h3>
      <select id="fi_anio">${anios.map(a => `<option ${a === FI_UI.anio ? "selected" : ""}>${a}</option>`).join("")}</select></div>
    <div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Nro.</th><th>Mes</th><th>Detalle</th><th>RCV por</th><th>Declarado por</th><th style="text-align:right">Ventas</th><th style="text-align:right">Compras</th><th style="text-align:right">IVA</th><th style="text-align:right">IT</th><th>Estado</th></tr></thead>
    <tbody>${filasMes}</tbody>
    <tfoot><tr><td></td><td><b>TOTAL</b></td><td colspan="3"></td><td class="mono" style="text-align:right"><b>${fx(sv)}</b></td><td class="mono" style="text-align:right"><b>${fx(sc)}</b></td><td colspan="3"></td></tr></tfoot></table></div>
    <p class="note">Toca un mes para abrir su declaración. Los meses anteriores a octubre 2026 vienen de la importación y solo muestran que se recepcionaron.</p>
    ${fiTareasHTML(c)}
    <div id="fi_docs" style="margin-top:20px"></div>
    <h3 style="margin:20px 0 8px">Otros servicios recepcionados</h3>
    <div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Fecha</th><th>Servicio</th><th>Detalle</th><th>Período / Gestión</th><th>Atención</th></tr></thead><tbody>
    ${otros.map(r => `<tr><td class="mono">${escape(r.fecha || djFechaTxt(r.fechaISO))}</td><td>${escape(r.servicio || r.servicioNombre || "—")}</td><td style="font-size:12px">${escape(r.detalleServicio || "—")}</td><td>${escape(r.mesRecepcion || "—")}</td><td>${escape(r.atencion || "—")}</td></tr>`).join("") || `<tr><td colspan="5" class="note">Sin otros servicios.</td></tr>`}
    </tbody></table></div>`;
  fiBind();
  if (el("fi_anio")) el("fi_anio").onchange = e => { FI_UI.anio = e.target.value; paintFicha(); };
  el("v-ficha").querySelectorAll(".fi-copy").forEach(b => b.onclick = () => { try { navigator.clipboard.writeText(secretos[Number(b.dataset.i)][1]); b.textContent = "✓"; } catch (e) {} });
  fiDocsPintar(c);
  el("v-ficha").querySelectorAll(".ev-term").forEach(b => b.onclick = () => evTerminar(b.dataset.id, true));
  el("v-ficha").querySelectorAll(".ev-reab").forEach(b => b.onclick = () => evTerminar(b.dataset.id, false));
  el("v-ficha").querySelectorAll(".ev-edit").forEach(b => b.onclick = () => { const e = EVENTOS.find(x => x.id === b.dataset.id); if (e) openEventoModal(e); });
  if (el("fi_newt")) el("fi_newt").onclick = () => openEventoModal({ tipo: "tarea", fechaISO: todayISO(), cliente: c ? (bdV(c, "nombre") || bdV(c, "razon")) : "", clienteNit: FI_UI.nit, _nueva: true });
  el("v-ficha").querySelectorAll(".fi-dj").forEach(tr => tr.onclick = () => openDDJJ(FI_UI.recs.find(x => x.id === tr.dataset.id), () => { LT_DATA = null; paintFicha(); }));
}
// Tareas relacionadas al cliente (por NIT, código de la BD o nombre)
function fiTareasHTML(c) {
  const nom = c ? (bdV(c, "nombre") || bdV(c, "razon")).toUpperCase() : "";
  const T = EVENTOS.filter(e => e.tipo === "tarea" && ((e.clienteNit && fiNit(e.clienteNit) === FI_UI.nit) || (c && c._docid && e.clienteBdId === c._docid) || (nom && String(e.cliente || "").toUpperCase() === nom)));
  const pend = T.filter(e => !e.done).sort((a, b) => String(a.fechaISO).localeCompare(String(b.fechaISO)));
  const hechas = T.filter(e => e.done).sort((a, b) => (b.terminadoAt || 0) - (a.terminadoAt || 0));
  const hoy = todayISO();
  return `<div style="display:flex;gap:8px;align-items:center;margin:20px 0 8px"><h3 style="margin:0 auto 0 0">Tareas del cliente (${pend.length} pendiente${pend.length === 1 ? "" : "s"})</h3>${canEditClientes() ? '<button class="btn sec" id="fi_newt" style="border:1px solid var(--line)">+ Nueva tarea</button>' : ""}</div>
    ${pend.map(e => calTareaFila(e, false, hoy)).join("") || '<p class="note">No tiene tareas pendientes.</p>'}
    ${hechas.length ? `<details style="margin-top:6px"><summary style="cursor:pointer;font-size:13px;color:var(--muted)">Ver ${hechas.length} tarea${hechas.length === 1 ? "" : "s"} terminada${hechas.length === 1 ? "" : "s"}</summary><div style="margin-top:8px">${hechas.map(e => calTareaFila(e, true, hoy)).join("")}</div></details>` : ""}`;
}
// Portal del Cliente: enlace y documentos (carpeta de Drive del cliente)
const PORTAL_URL = location.origin + "/cliente.html";
const FI_DOCS = {};
function fiDocsPintar(c) {
  const box = el("fi_docs"); if (!box) return;
  const nit = FI_UI.nit, info = FI_DOCS[nit];
  const nombre = c ? (bdV(c, "nombre") || bdV(c, "razon")) : "";
  const ci = c ? bdV(c, "ci") : "";
  const claveTxt = ci ? "tu número de C.I." : (nit.length >= 8 ? "tu número de C.I. (" + nit.slice(0, -3) + ")" : "tu número de C.I.");
  const msgWa = `Hola ${nombre.split(" ")[0] || ""}, ya puedes revisar tus declaraciones, balances, trámites y documentos en el Portal del Cliente de CONTAX:\n${PORTAL_URL}\nUsuario: tu NIT (${nit})\nClave: ${claveTxt}`;
  const lista = info && info.documentos ? info.documentos : null;
  box.innerHTML = `<div class="formcard" style="max-width:none;margin:0">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><h3 style="margin:0 auto 0 0">Portal del Cliente y documentos</h3>
      <button class="mini" id="fi_pver" style="background:var(--green);color:#fff;border-color:var(--green)">Ver su portal</button><button class="mini" id="fi_pcopy">Copiar enlace del portal</button><button class="mini" id="fi_pwa">Copiar mensaje para WhatsApp</button></div>
    <p class="note" style="margin:0 0 10px">El cliente entra en <b>${escape(PORTAL_URL)}</b> con su <b>NIT</b> y su <b>C.I.</b>${ci ? "" : ` (no tiene C.I. en la Base de Datos: se usa el NIT sin los 3 últimos dígitos${nit.length >= 8 ? ", <b>" + escape(nit.slice(0, -3)) + "</b>" : ""}; si es empresa, carga su C.I. en la ficha de la Base de Datos)`}.</p>
    ${lista === null ? `<button class="btn sec" id="fi_dver" style="border:1px solid var(--line)">Ver documentos del cliente</button>` : lista === "cargando" ? `<p class="note"><span class="cx-spin"></span> Cargando documentos…</p>` : info.error ? `<p class="msg err">${escape(info.error)}</p>` : `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><a class="mini" href="${escape(info.carpetaContax)}" target="_blank" rel="noopener">Subir documentos para el cliente (Drive)</a><a class="mini" href="${escape(info.carpeta)}" target="_blank" rel="noopener">Abrir carpeta del cliente</a><button class="mini" id="fi_drel">Actualizar</button></div>
      <p class="note" style="margin:0 0 8px">Lo que pongas en la carpeta <b>"Entregados por CONTAX"</b> le aparece al cliente en su portal para descargar.</p>
      ${lista.length ? `<div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Archivo</th><th>Origen</th><th>Fecha</th><th>Tamaño</th></tr></thead><tbody>${lista.map(x => `<tr><td><a href="${escape(x.url)}" target="_blank" rel="noopener">${escape(x.nombre)}</a></td><td>${x.origen === "contax" ? "Entregado por CONTAX" : "Subido por el cliente"}</td><td class="mono">${escape(new Date(x.fecha).toLocaleDateString("es-BO"))}</td><td class="mono">${escape(String(x.kb))} KB</td></tr>`).join("")}</tbody></table></div>` : `<p class="note">Todavía no hay documentos.</p>`}`}
  </div>`;
  const cp = (t, b) => { try { navigator.clipboard.writeText(t); b.textContent = "Copiado"; setTimeout(() => fiDocsPintar(c), 1500); } catch (e) {} };
  if (el("fi_pcopy")) el("fi_pcopy").onclick = e => cp(PORTAL_URL, e.target);
  // Entrar al portal de este cliente sin su clave (sesión de 2 horas, queda registrado quién la abrió)
  if (el("fi_pver")) el("fi_pver").onclick = async e => {
    const b = e.target, w = window.open("", "_blank"); b.disabled = true; b.textContent = "Abriendo…";
    try {
      const url = await recibosUrlGet(); if (!url) throw new Error("Falta la URL del puente en Configuración.");
      const idToken = await auth.currentUser.getIdToken();
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "admin_portal_token", idToken, nit }) }).then(x => x.json());
      if (!r.ok) throw new Error(r.error || "No se pudo abrir.");
      if (w) w.location = PORTAL_URL + "#tk=" + r.token; else location.href = PORTAL_URL + "#tk=" + r.token;
    } catch (err) { if (w) w.close(); alert(err.message); }
    b.disabled = false; b.textContent = "Ver su portal";
  };
  if (el("fi_pwa")) el("fi_pwa").onclick = e => cp(msgWa, e.target);
  const cargar = async () => {
    FI_DOCS[nit] = { documentos: "cargando" }; fiDocsPintar(c);
    try {
      const url = await recibosUrlGet(); if (!url) throw new Error("Falta la URL del puente en Configuración.");
      const idToken = await auth.currentUser.getIdToken();
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "admin_docs_cliente", idToken, nit }) }).then(x => x.json());
      FI_DOCS[nit] = r.ok ? r : { documentos: [], error: r.error || "No se pudo leer." };
    } catch (e) { FI_DOCS[nit] = { documentos: [], error: e.message }; }
    if (FI_UI.nit === nit) fiDocsPintar(c);
  };
  if (el("fi_dver")) el("fi_dver").onclick = cargar;
  if (el("fi_drel")) el("fi_drel").onclick = cargar;
}
function fiBind() {
  const q = el("fi_q"); if (!q) return;
  const pick = () => { const m = q.value.match(/NIT\s+(\d+)/); const soloNum = fiNit(q.value); const nit = m ? m[1] : (soloNum.length >= 6 && soloNum === q.value.trim() ? soloNum : ""); if (nit && nit !== FI_UI.nit) fiCargar(nit); };
  q.onchange = pick; q.onkeydown = e => { if (e.key === "Enter") pick(); };
  if (el("fi_reload")) el("fi_reload").onclick = () => fiCargar(FI_UI.nit);
}

// ---------- CONTROL DEL MES (antes hoja "Consultas") ----------
// Cruza los clientes ACTIVOS de la Base de Datos con las declaraciones recepcionadas del período elegido.
const CM_UI = { per: "", tab: "resumen", q: "" };
// Vencimiento SIN según último dígito del NIT: 0→13, 1→14 … 9→22 del mes siguiente al período
function cmVencimiento(nit, perKey) {
  const d = fiNit(nit).slice(-1); if (d === "" || !perKey) return null;
  let [y, m] = perKey.split("-").map(Number); m += 1; if (m > 12) { m = 1; y += 1; }
  return { dia: 13 + Number(d), iso: `${y}-${String(m).padStart(2, "0")}-${String(13 + Number(d)).padStart(2, "0")}` };
}
function cmPlataforma(t) {
  const u = recNormTxt(t); const o = [];
  if (/YANGO/.test(u)) o.push("YANGO"); if (/PEDIDOS/.test(u)) o.push("PEDIDOSYA"); if (/TADA/.test(u)) o.push("TADA");
  return o.length ? o : ["OTROS"];
}
async function renderControl() {
  el("v-control").innerHTML = `<h1>Control del mes</h1><p class="lead"><span class="cx-spin"></span> Cargando clientes y recepciones…</p>`;
  await ltLoad();
  bdEnsureLoaded(ok => { if (!ok) { el("v-control").innerHTML = `<h1>Control del mes</h1><p class="lead">No se pudo abrir la Base de Datos de clientes.</p>`; return; } paintControl(); });
}
function paintControl() {
  const decl = LT_DATA.filter(r => recCatDe(r) === "declaracion");
  const periodos = [...new Set(decl.map(recPeriodoKey).filter(Boolean))].sort().reverse();
  const hoy = djHoy(), hoyKey = hoy.slice(0, 7);
  if (!CM_UI.per || periodos.indexOf(CM_UI.per) < 0) {
    // Por defecto: el mes que toca declarar (el anterior al actual), desde la migración (oct-2026) en adelante
    const desde = periodos.filter(k => k >= LISTA_CORTE.declaracionDesdePeriodo);
    CM_UI.per = desde.find(k => k < hoyKey) || desde[desde.length - 1] || periodos[0] || "";
  }
  const delPer = decl.filter(r => recPeriodoKey(r) === CM_UI.per);
  const nitsRec = new Set(delPer.map(r => fiNit(r.nit)).filter(Boolean));
  const activos = BD.filter(bdIsActivo);
  const noRec = activos.filter(c => !nitsRec.has(fiNit(bdV(c, "nit"))));
  const recActivos = activos.length - noRec.length;
  const enCorte = CM_UI.per >= LISTA_CORTE.declaracionDesdePeriodo || delPer.some(r => r.origen !== "importado");
  const pend = delPer.filter(r => djEstado(r) !== "terminado");
  // Por plataforma
  const plat = {};
  activos.forEach(c => cmPlataforma(bdV(c, "brinda")).forEach(p => { plat[p] = plat[p] || { act: 0, no: 0 }; plat[p].act++; }));
  noRec.forEach(c => cmPlataforma(bdV(c, "brinda")).forEach(p => { plat[p].no++; }));
  // Por persona
  const cuenta = campo => { const o = {}; delPer.forEach(r => { const k = String(r[campo] || "").trim().toUpperCase(); if (k) o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
  const q = CM_UI.q.toLowerCase();
  const tabs = [["resumen", "Resumen"], ["norec", `No recepcionados (${noRec.length})`], ["pend", `Pendientes y vencimientos (${enCorte ? pend.length : "—"})`], ["persona", "Por persona"], ["lista", `Lista de recepción (${delPer.length})`]];
  let body = "";
  if (CM_UI.tab === "resumen") {
    body = `<div class="kpis">
      <div class="kpi"><div class="n">${activos.length}</div><div class="l">Clientes activos</div></div>
      <div class="kpi"><div class="n" style="color:var(--ok)">${recActivos}</div><div class="l">Activos que recepcionaron</div></div>
      <div class="kpi cm-go" data-tab="norec" style="cursor:pointer"><div class="n" style="color:var(--danger)">${noRec.length}</div><div class="l">Activos sin recepcionar</div></div>
      <div class="kpi"><div class="n">${delPer.length}</div><div class="l">Total recepción del período</div></div>
      <div class="kpi cm-go" data-tab="pend" style="cursor:pointer"><div class="n" style="color:var(--warn)">${enCorte ? pend.length : "—"}</div><div class="l">Faltantes a declarar</div></div>
    </div>
    <h3 style="margin:0 0 8px">Por plataforma</h3>
    <table style="max-width:560px"><thead><tr><th>Plataforma</th><th style="text-align:right">Activos</th><th style="text-align:right">Sin recepcionar</th></tr></thead><tbody>
      ${Object.keys(plat).sort((a, b) => plat[b].act - plat[a].act).map(k => `<tr><td><b>${k}</b></td><td class="mono" style="text-align:right">${plat[k].act}</td><td class="mono" style="text-align:right;color:var(--danger)">${plat[k].no}</td></tr>`).join("")}
    </tbody></table>
    <p class="note">"Activos" = clientes con estado ACTIVO en la Base de Datos. Un cliente que trabaja para varias plataformas cuenta en cada una.</p>`;
  } else if (CM_UI.tab === "norec") {
    const list = noRec.filter(c => !q || [bdV(c, "nombre"), bdV(c, "razon"), bdV(c, "nit"), bdV(c, "celular"), bdV(c, "codigoId")].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (bdV(a, "nombre") || bdV(a, "razon")).localeCompare(bdV(b, "nombre") || bdV(b, "razon")));
    const wa = cel => { const d = fiNit(cel); return d ? `https://wa.me/${d.length === 8 ? "591" + d : d}` : ""; };
    body = `<p class="note" style="margin:0 0 10px">Clientes ACTIVOS que todavía no recepcionaron su declaración de <b>${escape(recPeriodoTxt(CM_UI.per))}</b>. Toca el celular para escribirles por WhatsApp.</p>
      <div style="display:flex;gap:8px;margin:0 0 10px;flex-wrap:wrap"><input id="cm_q" placeholder="Buscar…" value="${escape(CM_UI.q)}" style="flex:1;min-width:200px"><button class="mini" id="cm_copycel">📋 Copiar celulares</button></div>
      <div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>#</th><th>Cliente</th><th>NIT</th><th>Celular</th><th>Brinda servicios a</th><th>Vence</th></tr></thead><tbody>
      ${list.map((c, i) => { const v = cmVencimiento(bdV(c, "nit"), CM_UI.per); const cel = bdV(c, "celular"); return `<tr><td class="mono">${i + 1}</td><td><b>${escape(bdV(c, "nombre") || bdV(c, "razon"))}</b>${bdV(c, "codigoId") ? `<div class="note" style="margin:0">ID ${escape(bdV(c, "codigoId"))}</div>` : ""}</td><td class="mono">${escape(bdV(c, "nit"))}</td><td>${cel ? `<a href="${wa(cel)}" target="_blank" rel="noopener">${escape(cel)}</a>` : "—"}</td><td>${escape(bdV(c, "brinda") || "—")}</td><td class="mono">${v ? "día " + v.dia : "—"}</td></tr>`; }).join("") || `<tr><td colspan="6" class="note">¡Todos los activos recepcionaron! 🎉</td></tr>`}
      </tbody></table></div>`;
    body += `<script type="text/plain" id="cm_cels">${escape(list.map(c => bdV(c, "celular")).filter(Boolean).join("\n"))}</script>`;
  } else if (CM_UI.tab === "pend") {
    if (!enCorte) body = `<p class="lead">Este período es anterior a la migración (octubre 2026); su seguimiento quedó en la hoja antigua.</p>`;
    else {
      const list = pend.map(r => Object.assign({ _v: cmVencimiento(r.nit, CM_UI.per) }, r)).filter(r => !q || [r.clienteNombre, r.nit].join(" ").toLowerCase().includes(q))
        .sort((a, b) => ((a._v && a._v.iso) || "9").localeCompare((b._v && b._v.iso) || "9"));
      const dias = iso => Math.round((new Date(iso + "T00:00:00") - new Date(hoy + "T00:00:00")) / 86400000);
      body = `<p class="note" style="margin:0 0 10px">Declaraciones de <b>${escape(recPeriodoTxt(CM_UI.per))}</b> recepcionadas que aún no están <b>Terminadas</b>, ordenadas por fecha de vencimiento (último dígito del NIT). Toca una fila para abrirla.</p>
        <div style="display:flex;gap:8px;margin:0 0 10px"><input id="cm_q" placeholder="Buscar…" value="${escape(CM_UI.q)}" style="flex:1;min-width:200px"></div>
        <div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Vence</th><th>Cliente</th><th>NIT</th><th>Estado</th><th>RCV por</th><th>Estado RCV</th></tr></thead><tbody>
        ${list.map(r => { const v = r._v, dd = v ? dias(v.iso) : null; const col = dd == null ? "" : dd < 0 ? "var(--danger)" : dd <= 3 ? "var(--warn)" : "var(--txt)";
          return `<tr class="cm-dj" data-id="${r.id}" style="cursor:pointer"><td class="mono" style="color:${col};font-weight:700">${v ? djFechaTxt(v.iso) : "—"}<div class="note" style="margin:0;color:${col}">${dd == null ? "" : dd < 0 ? "Vencido hace " + (-dd) + " d" : dd === 0 ? "Vence hoy" : "Faltan " + dd + " d"}</div></td>
          <td><b>${escape(r.clienteNombre || "—")}</b></td><td class="mono">${escape(String(r.nit || ""))}</td><td>${djEstadoBadge(djEstado(r))}</td><td>${escape(r.dj_rcvPor || "—")}</td><td style="font-size:12px">${escape(r.dj_estadoRcv || "")}</td></tr>`; }).join("") || `<tr><td colspan="6" class="note">Sin pendientes. 🎉</td></tr>`}
        </tbody></table></div>`;
    }
  } else if (CM_UI.tab === "persona") {
    const tabla = (tit, arr) => `<div class="formcard" style="max-width:none;margin:0"><h3 style="margin:0 0 8px">${tit}</h3><table><tbody>${arr.map(([k, n]) => `<tr><td><b>${escape(k)}</b></td><td class="mono" style="text-align:right">${n}</td></tr>`).join("") || `<tr><td class="note">Sin datos</td></tr>`}</tbody></table></div>`;
    body = `<div class="grid3" style="gap:14px;align-items:start">${tabla("Recepción (atención)", cuenta("atencion"))}${tabla("RCV realizado por", cuenta("dj_rcvPor"))}${tabla("Declarado por", cuenta("dj_declaradoPor"))}</div>`;
  } else {
    const list = delPer.filter(r => !q || [r.clienteNombre, r.nit, r.atencion, r.detalleServicio].join(" ").toLowerCase().includes(q)).sort((a, b) => (a.fechaISO || "").localeCompare(b.fechaISO || ""));
    body = `<div style="display:flex;gap:8px;margin:0 0 10px"><input id="cm_q" placeholder="Buscar por cliente, NIT o persona…" value="${escape(CM_UI.q)}" style="flex:1;min-width:200px"></div>
      <div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>#</th><th>Fecha rec.</th><th>Cliente</th><th>Presta servicios a</th><th>Tipo de servicio</th><th>NIT</th><th>Atención</th></tr></thead><tbody>
      ${list.map((r, i) => `<tr><td class="mono">${i + 1}</td><td class="mono">${escape(r.fecha || djFechaTxt(r.fechaISO))}</td><td><b>${escape(r.clienteNombre || "—")}</b></td><td>${escape(r.rubro || "—")}</td><td style="font-size:12px">${escape(r.detalleServicio || "—")}</td><td class="mono">${escape(String(r.nit || ""))}</td><td>${escape(r.atencion || "—")}</td></tr>`).join("") || `<tr><td colspan="7" class="note">Sin recepciones.</td></tr>`}
      </tbody></table></div>`;
  }
  el("v-control").innerHTML = `<h1>Control del mes</h1>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 8px"><label style="margin:0">Período a declarar:</label>
      <select id="cm_per">${periodos.map(k => `<option value="${k}" ${k === CM_UI.per ? "selected" : ""}>${recPeriodoTxt(k)}</option>`).join("") || `<option>Sin datos</option>`}</select>
      <button class="mini" id="cm_reload">↻ Actualizar</button></div>
    <div class="subtabs" id="cmtabs">${tabs.map(([k, l]) => `<button class="subtab ${CM_UI.tab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>${body}`;
  const V = el("v-control");
  V.querySelectorAll("#cmtabs .subtab, .cm-go").forEach(b => b.onclick = () => { CM_UI.tab = b.dataset.tab; CM_UI.q = ""; paintControl(); });
  el("cm_per").onchange = e => { CM_UI.per = e.target.value; paintControl(); };
  el("cm_reload").onclick = async () => { await ltLoad(true); paintControl(); };
  if (el("cm_q")) el("cm_q").oninput = e => { CM_UI.q = e.target.value; clearTimeout(CM_UI._t); CM_UI._t = setTimeout(() => { paintControl(); const x = el("cm_q"); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 250); };
  if (el("cm_copycel")) el("cm_copycel").onclick = () => { try { navigator.clipboard.writeText(el("cm_cels").textContent); el("cm_copycel").textContent = "✓ Copiados"; } catch (e) {} };
  V.querySelectorAll(".cm-dj").forEach(tr => tr.onclick = () => openDDJJ(LT_DATA.find(x => x.id === tr.dataset.id), paintControl));
}

// ============================================================
//  PASARELA DE PAGOS (configuración + pagos en revisión)
//  La página pública es pagos.html; el intermediario seguro es el script
//  de Apps Script (PASARELA.gs, en el mismo proyecto que los recibos).
//  Config: config/app.pasarela  ·  QR por importe: config/pasarelaQR (campos m30, m50…)
// ============================================================
const BAL_INCLUYE = ["Balance General", "Estado de Resultados", "Balance de Comprobación de Sumas y Saldos", "Estado de Evolución y Cambios en el Patrimonio", "Estado de Flujo de Efectivo", "Cuadro de Activos Fijos", "Notas a los Estados Financieros", "Declaración Formulario 500 (IUE)", "Declaración Formulario 605 (Envío de EEFF al SIN)", "Envío de Estados Financieros en digital (PDF)", "Firma digital de los Estados Financieros (certificada por DigiCert)", "Descarga y visualización desde nuestro Portal de Clientes cuando lo necesites, sin costo, una vez culminados", "Notificación al momento en que culminemos tus estados financieros (si agregas nuestro Portal de Clientes como app de inicio, cuando lo lancemos)"];
const BAL_EXTRAS = [[], [], ["Libro Mayor"], ["Libro Mayor", "Libro Diario"], ["Libro Mayor", "Libro Diario", "Atención prioritaria", "Reunión virtual para explicarte tus resultados"]];
function balIncluyeDef(i) { return (i === 0 ? ["Solo para NIT abiertos en octubre, noviembre o diciembre de 2026"] : []).concat(BAL_INCLUYE, BAL_EXTRAS[i] || []); }
const PAS_BAL_DEF = [
  { nombre: "Balance ¡Nuevos!", nitDesde: "2026-10-01", incluye: balIncluyeDef(0) },
  { nombre: "Balance Esencial", incluye: balIncluyeDef(1) },
  { nombre: "Balance Plus", incluye: balIncluyeDef(2) },
  { nombre: "Balance Pro", incluye: balIncluyeDef(3) },
  { nombre: "Balance Total", incluye: balIncluyeDef(4) }
];
// Si lo guardado es un texto antiguo (con "beneficios CONTAX", etc.) o la lista básica sin extras, se usa la lista vigente
function balIncluyeViejo(l) {
  if (!l || !l.length) return true;
  if (l.some(function (x) { return /beneficios CONTAX|^Libro Diario y Libro Mayor$|Reunión para explicarte tu resultado|Atención prioritaria en la entrega|Los 7 estados financieros con firma/i.test(x); })) return true;
  var j = JSON.stringify(l); return j === JSON.stringify(BAL_INCLUYE) || j === JSON.stringify(["Solo para NIT abiertos en octubre, noviembre o diciembre de 2026"].concat(BAL_INCLUYE));
}
const PAS_BEN_DEF = {
  basico: ["Declaración sin movimiento (IVA e IT) presentada a tiempo", "Consolidación de tu RCV antes del día 9", "Tus formularios en tu Portal de Clientes NUMMEROS"],
  estandar: ["Hasta 100 facturas de compras y ventas al mes", "Control de tu RCV y alertas de vencimiento", "Acceso a tu Portal de Clientes NUMMEROS con tus reportes", "Resumen mensual de tus compras y ventas", "Mes de tu cumpleaños sin cobro"],
  premium: ["De 101 a 200 facturas al mes", "Todo lo del Plan Estándar", "Atención prioritaria", "Revisión de tu NIT, matrícula de comercio y ROE"],
  fact: ["Facturación automática semanal (repartidores Yango)", "Tu factura lista antes del jueves", "Historial de tus facturas en tu Portal de Clientes NUMMEROS"]
};
const PAS_PREM_DEF = [
    { id: "p7", nombre: "10% de devolución", descripcion: "Te devolvemos el 10% de tu pago por QR.", servicio: "eeff", fase: 4, tipo: "azar", ganadores: 1, entre: 30 },
    { id: "p8", nombre: "Una declaración mensual gratis", descripcion: "Una de tus declaraciones mensuales sin costo.", servicio: "eeff", fase: 4, tipo: "azar", ganadores: 1, entre: 30 },
    { id: "p9", nombre: "20% de devolución", descripcion: "Te devolvemos el 20% de tu pago por QR.", servicio: "eeff", fase: 5, tipo: "azar", ganadores: 1, entre: 30 },
    { id: "p10", nombre: "Un año de declaraciones gratis", descripcion: "12 declaraciones mensuales sin costo.", servicio: "eeff", fase: 5, tipo: "azar", ganadores: 1, entre: 30 }
];
function balInfo(cupos, i) { const x = (cupos || [])[i] || {}, d = PAS_BAL_DEF[i] || {}; return { nombre: x.nombre || d.nombre || ("Balance " + (i + 1)), incluye: !balIncluyeViejo(x.incluye) ? x.incluye : (d.incluye || []), nitDesde: x.nitDesde !== undefined ? x.nitDesde : (d.nitDesde || "") }; }
const PAS_DEF = { activo: true, precios: { sinMov: 30, enFecha: 50, fueraFecha: 60, premium: 95, fact: 20, eeffOtros: 780 }, diaDesde: 25, diaHasta: 31, diaCierre: 5, eeffGestion: String(new Date().getFullYear()), cupos: [{ precio: 250, capacidad: 40 }, { precio: 300, capacidad: 30 }, { precio: 380, capacidad: 30 }, { precio: 480, capacidad: 30 }, { precio: 780, capacidad: 500 }], destinoClaves: [] };
const PA_UI = { tab: "revision", cfg: null, qr: null, cupos: null };
async function renderPasarela() {
  el("v-pasarela").innerHTML = `<h1>Pasarela de pagos</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  const cfg = await loadConfigDoc();
  const p = cfg.pasarela || {};
  PA_UI.cfg = Object.assign(JSON.parse(JSON.stringify(PAS_DEF)), p, { precios: Object.assign({}, PAS_DEF.precios, p.precios || {}) });
  PA_UI.cupos = (PA_UI.cfg.cupos || []).map(c => Object.assign({}, c));
  PA_UI.premios = null;
  EEFF_DESDE = eeffDesdeDe(PA_UI.cfg);
  // Cada QR vive en su propio documento (config/qr_m50, config/qr_m60…) para no pasar el límite de 1 MB por documento
  PA_UI.qr = {};
  try { const q = await getDoc(doc(db, "config", "pasarelaQR")); if (q.exists()) Object.assign(PA_UI.qr, q.data()); } catch (e) {}
  try { const sn = await getDocs(collection(db, "config")); sn.docs.forEach(d => { if (/^qr_m\d+$/.test(d.id) && d.data().img) PA_UI.qr[d.id.slice(3)] = d.data().img; }); } catch (e) {}
  try { await recSync(); } catch (e) {}
  // El conteo por fase que usa la pasarela se corrige con lo que hay en las recepciones (solo admin)
  try { await eeffSincronizarConteo(PA_UI.cfg.eeffGestion); } catch (e) {}
  try { PA_UI.reservas = await eeffReservasScript(); } catch (e) { PA_UI.reservas = {}; }
  paintPasarela();
}
function paMontos() {
  const c = PA_UI.cfg, o = [];
  const add = (m, uso) => { m = Math.round(Number(m) || 0); if (!m) return; const ex = o.find(x => x.m === m); if (ex) ex.uso += " · " + uso; else o.push({ m, uso }); };
  add(c.precios.sinMov, "Plan Básico (sin movimiento)"); add(c.precios.enFecha, "Plan Estándar del 25 al 30"); add(c.precios.fueraFecha, "Plan Estándar del 1 al 5");
  add(c.precios.premium, "Plan Premium"); add(c.precios.eeffOtros, "Balance · otros rubros");
  add(c.precios.fact, "Suscripción de facturación");
  (PA_UI.cupos || []).forEach((x, i) => add(x.precio, "Balance · cupo " + (i + 1)));
  return o.sort((a, b) => a.m - b.m);
}
// ===== Balances por fase: tabla reutilizable (Pasarela editable · Dashboard y Reportes solo lectura) =====
let EEFF_RES = { t: 0, porPrecio: {}, lista: null };
async function eeffReservasScript() {
  if (Date.now() - EEFF_RES.t < 60000) return EEFF_RES.porPrecio;
  try {
    const url = await recibosUrlGet(); if (!url) return {};
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "pas_config" }) }).then(x => x.json());
    const m = {}; ((r && r.eeff && r.eeff.cupos) || []).forEach(c => { if (c.reservados) m[String(Math.round(c.precio))] = c.reservados; });
    // Quién reservó (necesita la sesión del panel; si el script aún no tiene esta función, se muestra solo la cantidad)
    let lista = null;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const l = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "admin_reservas", idToken }) }).then(x => x.json());
      if (l && l.ok && Array.isArray(l.reservas)) lista = l.reservas;
    } catch (e) {}
    EEFF_RES = { t: Date.now(), porPrecio: m, lista };
  } catch (e) {}
  return EEFF_RES.porPrecio;
}
function eeffRecsPorPrecio(g) {
  const m = {};
  (RC.docs || []).forEach(r => {
    if (!recValida(r) || recCatDe(r) !== "eeff" || eeffGestionDe(r) !== String(g) || !eeffCuenta(r)) return;
    (m[eeffPrecioKey(r)] = m[eeffPrecioKey(r)] || []).push(r);
  });
  Object.values(m).forEach(l => l.sort((a, b) => (a.fechaISO || "").localeCompare(b.fechaISO || "")));
  return m;
}
async function eeffFasesCfg() {
  const cfg = await loadConfigDoc(), p = cfg.pasarela || {};
  EEFF_DESDE = eeffDesdeDe(p);
  return { gestion: String(p.eeffGestion || PAS_DEF.eeffGestion), cupos: (p.cupos && p.cupos.length ? p.cupos : PAS_DEF.cupos).map(c => Object.assign({}, c)),
           otros: Number((p.precios && p.precios.eeffOtros) || PAS_DEF.precios.eeffOtros) };
}
// opts: { editable, conMontos, dis }
function eeffFasesHTML(cupos, recs, reservas, opts) {
  opts = opts || {}; const conM = opts.conMontos !== false;
  const precios = cupos.map(x => String(Math.round(Number(x.precio) || 0)));
  const dup = precios.filter((p, i) => precios.indexOf(p) !== i);
  let tCap = 0, tVen = 0, tRes = 0, tProy = 0, tCob = 0, tPend = 0, activa = 0;
  const filas = cupos.map((x, i) => {
    const pr = Number(x.precio) || 0, cap = Number(x.capacidad) || 0, key = String(Math.round(pr));
    const lista = recs[key] || [], ven = lista.length, res = Number(reservas[key]) || 0;
    const libres = Math.max(0, cap - ven - res), proy = pr * cap, cob = pr * ven, pend = pr * libres;
    tCap += cap; tVen += ven; tRes += res; tProy += proy; tCob += cob; tPend += pend;
    const inf = balInfo(cupos, i);
    if (!activa && libres > 0 && !inf.nitDesde) activa = i + 1;
    const est = (libres > 0 && inf.nitDesde) ? '<span class="badge" style="background:#DDE7E1;color:#335">Solo NIT nuevos</span>' : libres <= 0 ? '<span class="badge" style="background:#B42318;color:#fff">Agotada</span>' : (activa === i + 1 ? '<span class="badge ok">Habilitada</span>' : '<span class="badge" style="background:#F2C94C;color:#5A4200">Próxima</span>');
    const celPr = opts.editable ? `<input class="pa-cp" data-i="${i}" data-k="precio" type="number" value="${escape(String(x.precio))}" style="width:80px" ${opts.dis || ""}>` : `<span class="mono">${money(pr)}</span>`;
    const celCap = opts.editable ? `<input class="pa-cp" data-i="${i}" data-k="capacidad" type="number" value="${escape(String(x.capacidad))}" style="width:70px" ${opts.dis || ""}>` : `<span class="mono">${cap}</span>`;
    const rl = (EEFF_RES.lista || []).filter(r => Math.round(Number(r.precio) || 0) === Math.round(pr));
    const hm = t => { try { return new Date(t).toLocaleString("es-BO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
    const detRes = rl.length ? `<tr class="ef-resdet" data-fase="${i}" style="display:none"><td colspan="${conM ? 11 : 7}" style="background:var(--panel2)"><table style="font-size:12.5px;margin:4px 0"><thead><tr><th>Cliente</th><th>NIT</th><th>Reservó</th><th>Estado</th></tr></thead><tbody>${rl.map(r => `<tr><td>${escape(r.cliente || "—")}</td><td class="mono">${escape(r.nit)}</td><td>${escape(hm(r.creado))}</td><td>${r.vigente ? `<span class="badge ok">Pagando · vence ${escape(hm(r.exp).split(" ").pop())}</span>` : '<span class="badge off">Venció sin completar el pago</span>'}</td></tr>`).join("")}</tbody></table><p class="note" style="margin:2px 0 4px">Las reservas vencidas se guardan 48 horas: sirven para llamar a quien no terminó de pagar.</p></td></tr>` : "";
    const detalle = detRes + `<tr class="ef-det" data-fase="${i}" style="display:none"><td colspan="${conM ? 11 : 7}" style="background:var(--panel2)">${lista.length ? `<table style="font-size:12.5px;margin:4px 0"><thead><tr><th>#</th><th>Fecha</th><th>N° Recep.</th><th>Cliente</th><th>NIT</th>${conM ? '<th style="text-align:right">Importe</th>' : ""}<th>Origen</th></tr></thead><tbody>${lista.map((r, k) => `<tr><td class="mono">${k + 1}</td><td class="mono">${escape(r.fecha || String(r.fechaISO || "").slice(0, 10))}</td><td class="mono">${escape(String(r.nroRecepcion || ""))}</td><td>${escape(r.clienteNombre || "")}</td><td class="mono">${escape(String(r.nit || ""))}</td>${conM ? `<td class="mono" style="text-align:right">${money(r.importe)}</td>` : ""}<td>${r.origen === "pasarela" ? "Pasarela" : "Panel"}</td></tr>`).join("")}</tbody></table>` : '<span class="note">Todavía nadie pagó en esta fase.</span>'}</td></tr>`;
    return `<tr><td><b>${escape(inf.nombre)}</b>${inf.nitDesde ? `<div class="note" style="margin:0">NIT desde ${escape(inf.nitDesde.split("-").reverse().join("/"))}</div>` : ""}</td><td>${celPr}</td><td>${celCap}</td>
      <td class="mono">${ven}${ven > cap ? ` <span class="note" style="color:#B42318">(+${ven - cap})</span>` : ""}</td><td class="mono">${res || 0}${rl.length ? ` <button class="mini ef-rver" data-fase="${i}">Ver${rl.length !== res ? " (" + rl.length + ")" : ""}</button>` : ""}</td><td class="mono">${libres}</td><td>${est}</td>
      ${conM ? `<td class="mono" style="text-align:right">${money(proy)}</td><td class="mono" style="text-align:right">${money(cob)}</td><td class="mono" style="text-align:right">${money(pend)}</td>` : ""}
      <td style="white-space:nowrap"><button class="mini ef-ver" data-fase="${i}" ${ven ? "" : "disabled"}>Ver (${ven})</button>${opts.editable && isAdmin() ? ` <button class="mini pa-del" data-i="${i}">Quitar</button>` : ""}</td></tr>` + detalle;
  }).join("");
  const fuera = Object.keys(recs).filter(k => precios.indexOf(k) < 0);
  return `<div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Balance</th><th>Precio${opts.editable ? " (Bs)" : ""}</th><th>Cupos</th><th>Vendidos</th><th>Reservados</th><th>Libres</th><th>Estado</th>${conM ? '<th style="text-align:right">Ingreso proyectado</th><th style="text-align:right">Ya vendido</th><th style="text-align:right">Por vender</th>' : ""}<th></th></tr></thead><tbody>${filas}
    <tr style="font-weight:700;border-top:2px solid var(--line)"><td colspan="3">Total · ${tCap} cupos</td><td class="mono">${tVen}</td><td class="mono">${tRes}</td><td class="mono">${Math.max(0, tCap - tVen - tRes)}</td><td></td>${conM ? `<td class="mono" style="text-align:right">${money(tProy)}</td><td class="mono" style="text-align:right">${money(tCob)}</td><td class="mono" style="text-align:right">${money(tPend)}</td>` : ""}<td></td></tr></tbody></table></div>
    <p class="note" style="margin:8px 0 0">Solo cuentan los balances recepcionados desde el ${escape(EEFF_DESDE.split("-").reverse().join("/"))} (se cambia en Balances y beneficios). Reservados = clientes que están pagando ahora en la pasarela (tienen 30 minutos). Toca «Ver» para la lista de quienes pagaron en cada fase.${conM ? " Ingreso proyectado = precio × cupos · Ya vendido = precio × vendidos · Por vender = precio × libres." : ""}</p>
    ${dup.length ? `<p class="msg err" style="margin:6px 0 0">Dos fases tienen el mismo precio (Bs ${escape(dup.join(", "))}). Cada fase debe tener un precio distinto para contar bien los cupos.</p>` : ""}
    ${fuera.length ? `<p class="note" style="margin:6px 0 0">Balances con precios que no son de ninguna fase (no ocupan cupos): ${fuera.map(k => `Bs ${escape(k)} × ${recs[k].length}`).join(" · ")}.</p>` : ""}`;
}
function eeffFasesEnlazar(raiz) {
  (raiz || document).querySelectorAll(".ef-rver").forEach(b => b.onclick = () => {
    const d = b.closest("table").querySelector(`.ef-resdet[data-fase="${b.dataset.fase}"]`); if (!d) return;
    const ab = d.style.display === "none"; d.style.display = ab ? "" : "none"; b.classList.toggle("on", ab);
  });
  (raiz || document).querySelectorAll(".ef-ver").forEach(b => b.onclick = () => {
    const d = b.closest("table").querySelector(`.ef-det[data-fase="${b.dataset.fase}"]`); if (!d) return;
    const ab = d.style.display === "none"; d.style.display = ab ? "" : "none"; b.classList.toggle("on", ab);
  });
}
// Bloque de solo lectura para Dashboard y Reportes financieros
async function eeffFasesBloque(contId, conMontos) {
  const box = el(contId); if (!box) return;
  try {
    const f = await eeffFasesCfg();
    const [res] = await Promise.all([eeffReservasScript(), recSync().catch(() => null)]);
    box.innerHTML = `<h3 style="margin:0 0 4px">Balances por fase · Gestión ${escape(f.gestion)}</h3><p class="note" style="margin:0 0 10px">Solo consulta. Los precios y cupos se cambian en Pasarela de pagos.</p>` + eeffFasesHTML(f.cupos, eeffRecsPorPrecio(f.gestion), res, { editable: false, conMontos });
    eeffFasesEnlazar(box);
  } catch (e) { box.innerHTML = '<p class="note">No se pudo cargar el cuadro de fases.</p>'; }
}
// ===== Recepción en el panel: ayuda de fases para Estados financieros =====
function eeffEstadoFases(cupos, recs, reservas, cliente) {
  let activa = null;
  const apNit = cliente ? recFechaISO(bdV(cliente, "fechaNit")) : "";
  const l = cupos.map((x, i) => {
    const pr = Number(x.precio) || 0, cap = Number(x.capacidad) || 0, key = String(Math.round(pr));
    const ven = (recs[key] || []).length, res = Number(reservas[key]) || 0, libres = Math.max(0, cap - ven - res);
    const inf = balInfo(cupos, i);
    const o = { n: i + 1, nombre: inf.nombre, nitDesde: inf.nitDesde, precio: pr, capacidad: cap, vendidos: ven, reservados: res, libres };
    if (!activa && libres > 0 && (!inf.nitDesde || (apNit && apNit >= inf.nitDesde))) activa = o;
    return o;
  });
  return { fases: l, activa };
}
function esRepartidorCli(c) { return !!c && /YANGO|PEDIDOS|TADA|DELIVERY|MTG|MILTHAGOR|PARTNER|REPARTID|FLOTA|UBER|INDRIVE/i.test((bdV(c, "brinda") || "") + " " + (bdV(c, "actP") || "")); }
let REC_FASE = null;
function recFechaISO(v) { const t = String(v || "").trim(); let m; if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[1] + "-" + m[2] + "-" + m[3]; if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"); return ""; }
async function recFaseCargar() {
  const box = el("r_fase"); if (!box) return;
  box.innerHTML = '<span class="note"><span class="cx-spin"></span> Revisando la fase habilitada…</span>';
  try {
    const f = await eeffFasesCfg();
    const [res] = await Promise.all([eeffReservasScript(), recSync().catch(() => null)]);
    REC_FASE = Object.assign(f, { recs: eeffRecsPorPrecio(f.gestion), res }, eeffEstadoFases(f.cupos, eeffRecsPorPrecio(f.gestion), res, recCli));
    // Por defecto, la gestión que se está recepcionando con fases (la misma de la pasarela)
    const pa = el("r_peranio"); if (pa && [...pa.options].some(o => o.value === String(f.gestion))) pa.value = String(f.gestion);
    recFasePintar(true);
  } catch (e) { box.innerHTML = '<span class="note">No se pudo revisar las fases.</span>'; }
}
function recFasePintar(autollenar) {
  const box = el("r_fase"); if (!box || !REC_FASE) return;
  if (REC_FASE.recs) Object.assign(REC_FASE, eeffEstadoFases(REC_FASE.cupos, REC_FASE.recs, REC_FASE.res || {}, recCli));
  const F = REC_FASE, gSel = el("r_peranio") ? String(el("r_peranio").value) : "", tot = el("r_total");
  const caja = (color, html) => `<div style="border:2px solid ${color};border-radius:10px;padding:10px 12px;font-size:13px;line-height:19px;margin-top:6px">${html}</div>`;
  if (gSel !== String(F.gestion)) { box.innerHTML = caja("var(--line)", `Las fases de balances son de la <b>gestión ${escape(F.gestion)}</b>. Para la gestión ${escape(gSel)} el monto es libre y no ocupa cupo.`); return; }
  const otros = recCli && !esRepartidorCli(recCli);
  const sugerido = otros ? F.otros : (F.activa ? F.activa.precio : 0);
  if (autollenar && tot && sugerido && (!tot.value || tot.dataset.auto === "1")) { tot.value = sugerido; tot.dataset.auto = "1"; }
  let html = otros
    ? `<b>Cliente de otro rubro (no repartidor):</b> precio de balance Bs ${escape(String(F.otros))}. No ocupa cupo de las fases.`
    : (F.activa ? `<b style="color:var(--ok)">${escape(F.activa.nombre)} habilitado · ${money(F.activa.precio)}</b> · quedan <b>${F.activa.libres}</b> de ${F.activa.capacidad} cupos${F.activa.reservados ? ` (${F.activa.reservados} ${F.activa.reservados === 1 ? "reservado" : "reservados"} ahora en la pasarela)` : ""}.`
      : '<b style="color:var(--bad,#B42318)">Todas las fases están agotadas.</b> Puedes agregar cupos en Pasarela de pagos.');
  // Validación del monto escrito
  const v = Math.round(Number(tot && tot.value) || 0);
  if (v && !otros) {
    const fz = F.fases.find(x => Math.round(x.precio) === v);
    if (!fz) html += `<div style="margin-top:6px;color:#93370D"><b>Atención:</b> Bs ${v} no es el precio de ninguna fase, así que este balance <b>no ocupará cupo</b>.</div>`;
    else if (fz.libres <= 0) html += `<div style="margin-top:6px;color:#B42318"><b>Atención:</b> el ${escape(fz.nombre)} (Bs ${v}) ya está agotado. Si lo registras, quedará por encima del cupo (+1).</div>`;
    else if (F.activa && fz.n !== F.activa.n) html += `<div style="margin-top:6px;color:#93370D"><b>Atención:</b> Bs ${v} es el precio del ${escape(fz.nombre)}, pero el habilitado para este cliente es el ${escape(F.activa.nombre)} (${money(F.activa.precio)}).</div>`;
  } else if (v && otros && v !== Math.round(F.otros)) {
    html += `<div style="margin-top:6px;color:#93370D"><b>Atención:</b> el precio de otros rubros es Bs ${escape(String(F.otros))}.</div>`;
  }
  box.innerHTML = caja(F.activa || otros ? "var(--ok)" : "#B42318", html);
}
// ===== Conteo de balances por fase (por precio) =====
// config/eeffConteo_<gestión> = { porPrecio: { "250": 40, "300": 3 }, total }
// Lo suma la pasarela al aprobar, lo suma el panel al registrar, y el admin lo recalcula desde las recepciones.
// Solo cuentan para las fases los balances recepcionados desde esta fecha (antes = pruebas)
let EEFF_DESDE = "2026-10-26";
function eeffDesdeDe(p) { p = p || {}; return String(p.contarDesde || (p.lanzamiento ? String(p.lanzamiento).slice(0, 10) : "") || "2026-10-26"); }
function eeffCuenta(r) { const f = String(r.fechaISO || r.fechaPago || ""); return !EEFF_DESDE || (f && f.slice(0, 10) >= EEFF_DESDE); }
function eeffGestionDe(r) { return String(recGestionEEFF(r) || r.periodoAnio || ""); }
function eeffPrecioKey(r) { return String(Math.round(Number(r.importe) || 0)); }
async function eeffContar(r, signo) {
  try {
    if (recCatDe(r) !== "eeff" || !eeffCuenta(r)) return;
    const g = eeffGestionDe(r); if (!g) return;
    // Solo si el conteo ya existe (lo crea el admin al abrir Pasarela con el total correcto)
    await updateDoc(doc(db, "config", "eeffConteo_" + g), new FieldPath("porPrecio", eeffPrecioKey(r)), increment(signo || 1), "total", increment(signo || 1), "actualizadoMs", Date.now());
  } catch (e) { console.warn("conteo eeff", e); }
}
function eeffConteoLocal(g) {
  const porPrecio = {}; let total = 0;
  (RC.docs || []).forEach(r => {
    if (!recValida(r) || recCatDe(r) !== "eeff" || eeffGestionDe(r) !== String(g) || !eeffCuenta(r)) return;
    const k = eeffPrecioKey(r); porPrecio[k] = (porPrecio[k] || 0) + 1; total++;
  });
  return { porPrecio, total };
}
async function eeffSincronizarConteo(g, forzar) {
  const local = eeffConteoLocal(g);
  let remoto = null; try { const d = await getDoc(doc(db, "config", "eeffConteo_" + g)); remoto = d.exists() ? d.data() : null; } catch (e) {}
  const igual = remoto && JSON.stringify(Object.entries(remoto.porPrecio || {}).filter(x => x[1]).sort()) === JSON.stringify(Object.entries(local.porPrecio).sort());
  if ((forzar || !igual) && isAdmin()) {
    await setDoc(doc(db, "config", "eeffConteo_" + g), { gestion: String(g), porPrecio: local.porPrecio, total: local.total, actualizadoMs: Date.now(), por: "panel" });
    return local;
  }
  return remoto || local;
}
function paintPasarela() {
  const admin = isAdmin(), canEdit = canEditClientes();
  const todos = RC.docs || [];
  const pas = todos.filter(r => r.origen === "pasarela" || r.pasarela);
  const revision = pas.filter(r => r.pasarela && r.pasarela.estado === "revision").sort((a, b) => (b.fechaISO || "").localeCompare(a.fechaISO || ""));
  const hoy = djHoy();
  const fechaLocal = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const deHoy = pas.filter(r => fechaLocal(r.fechaISO) === hoy || r.fechaPago === hoy);
  const c = PA_UI.cfg;
  const conteo = eeffConteoLocal(c.eeffGestion);
  const usadosEeff = conteo.total;
  const link = location.origin + location.pathname.replace(/[^/]*$/, "") + "pagos.html";
  const conPremio = todos.filter(r => r.premios && r.premios.length).sort((a, b) => (b.fechaISO || "").localeCompare(a.fechaISO || ""));
  const tabs = [["revision", `Pagos en revisión (${revision.length})`], ["ultimos", "Últimos pagos"], ["config", "Precios y cupos"], ["balances", "Balances y beneficios"], ["premios", `Premios (${conPremio.filter(r => !r.premiosEntregado).length} por entregar)`], ["qr", "QR por importe"]];
  let body = "";
  if (PA_UI.tab === "revision") {
    body = `<p class="note" style="margin:0 0 10px">La IA no pudo confirmar estos comprobantes. Revisa la imagen y apruébalos (pasan a la lista que corresponde y se envía el correo) o recházalos.</p>
      <div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th style="text-align:right">Esperado</th><th style="text-align:right">Leído</th><th>Motivo</th><th></th></tr></thead><tbody>
      ${revision.map(r => `<tr><td class="mono">${escape(r.fecha || "")}<div class="note" style="margin:0">N° ${escape(String(r.nroRecepcion || ""))}</div></td>
        <td><b>${escape(r.clienteNombre || "—")}</b><div class="note" style="margin:0">NIT ${escape(String(r.nit || ""))}</div>${r.aperturaNit ? `<div class="note" style="margin:0">NIT abierto: <b>${escape(String(r.aperturaNit).slice(0, 10))}</b></div>` : ""}${r.balanceNombre ? `<div class="note" style="margin:0">${escape(r.balanceNombre)}</div>` : ""}</td>
        <td style="font-size:12px">${escape(r.detalleServicio || r.servicio || "")}<div class="note" style="margin:0">${escape(r.mesRecepcion || "")}</div></td>
        <td class="mono" style="text-align:right">${money(r.pasarela.montoEsperado)}</td><td class="mono" style="text-align:right">${money(r.pasarela.montoLeido)}</td>
        <td style="color:var(--warn);font-weight:600;font-size:12px">${escape((r.pasarela.motivos || []).join(", "))}</td>
        <td style="white-space:nowrap">${r.compUrl ? `<a class="mini" href="${escape(r.compUrl)}" target="_blank" rel="noopener">Ver comprobante</a> ` : ""}${canEdit ? `<button class="mini" data-aprobar="${r.id}" style="background:#2E7D5B;color:#fff;border-color:#2E7D5B">Aprobar</button> <button class="mini" data-rechazar="${r.id}">Rechazar</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="7" class="note">No hay pagos en revisión. 🎉</td></tr>`}
      </tbody></table></div>`;
  } else if (PA_UI.tab === "ultimos") {
    const ult = pas.slice().sort((a, b) => (b.fechaISO || "").localeCompare(a.fechaISO || "")).slice(0, 60);
    const est = r => { const e = (r.pasarela && r.pasarela.estado) || "aprobado"; return e === "aprobado" ? `<span class="badge ok">Aprobado</span>` : e === "revision" ? `<span class="badge off" style="color:var(--warn)">En revisión</span>` : `<span class="badge danger">Rechazado</span>`; };
    body = `<div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Fecha</th><th>N° Rec</th><th>Cliente</th><th>Servicio</th><th style="text-align:right">Importe</th><th>Estado</th><th></th></tr></thead><tbody>
      ${ult.map(r => `<tr><td class="mono">${escape((r.fecha || "") + " " + (r.hora || ""))}</td><td class="mono">${escape(String(r.nroRecepcion || ""))}</td><td><b>${escape(r.clienteNombre || "")}</b></td><td style="font-size:12px">${escape(r.detalleServicio || "")} · ${escape(r.mesRecepcion || "")}</td><td class="mono" style="text-align:right">${money(r.importe)}</td><td>${est(r)}</td><td>${r.compUrl ? `<a href="${escape(r.compUrl)}" target="_blank" rel="noopener">Comprobante</a>` : ""}</td></tr>`).join("") || `<tr><td colspan="7" class="note">Todavía no hay pagos por la pasarela.</td></tr>`}
      </tbody></table></div>`;
  } else if (PA_UI.tab === "config") {
    const dis = admin ? "" : "disabled";
    const n = (id, v, lbl) => `<div class="field"><label>${lbl}</label><input id="${id}" type="number" min="0" step="1" value="${escape(String(v))}" ${dis}></div>`;
    let acum = 0;
    body = `${admin ? "" : `<p class="note">Solo un administrador puede cambiar precios y cupos.</p>`}
      <div style="display:grid;grid-template-columns:minmax(0,1fr);gap:16px">
      <div class="formcard" style="max-width:none;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px 28px;align-items:start"><div><h3 style="margin:0 0 10px">Declaración mensual</h3>
        <div class="grid2">${n("pa_sin", c.precios.sinMov, "Básico · sin movimiento (Bs)")}${n("pa_prem", c.precios.premium, "Premium · 101 a 200 facturas (Bs)")}</div>
        <div class="grid2">${n("pa_en", c.precios.enFecha, "Estándar en fecha (Bs)")}${n("pa_fuera", c.precios.fueraFecha, "Estándar recepción tardía (Bs)")}</div>
        <div class="grid2">${n("pa_d1", c.diaDesde, "Recepción en fecha desde el día")}${n("pa_cierre", c.diaCierre, "Recepción tardía hasta el día")}</div>
        <p class="note" style="margin:0">Del día ${escape(String(c.diaDesde))} a fin de mes se recibe el mes actual a precio normal; del 1 al ${escape(String(c.diaCierre))} el mes anterior con recepción tardía; en los demás días la recepción está cerrada. Los meses atrasados pagan la tarifa del momento. El plan Estándar es solo para repartidores; las demás unipersonales pagan Premium.</p>
        </div><div><h3 style="margin:0 0 10px">Suscripción de facturación</h3>
        <div class="grid2">${n("pa_fact", c.precios.fact, "Precio mensual (Bs)")}</div>
        </div><div><h3 style="margin:0 0 10px">Cuenta que recibe los pagos</h3>
        <div class="field"><label>Palabras que deben aparecer en el comprobante (separadas por coma)</label><input id="pa_dest" value="${escape((c.destinoClaves || []).join(", "))}" placeholder="Ej. CONTAX, 4417" ${dis}></div>
        <div class="grid2"><div class="field"><label>N° de cuenta</label><input id="pa_dcta" inputmode="numeric" value="${escape(c.destinoCuenta || "")}" placeholder="Ej. 4012345678" ${dis}></div>
        <div class="field"><label>Banco</label><input id="pa_dbanco" value="${escape(c.destinoBanco || "")}" placeholder="Ej. BNB, Banco Unión" ${dis}></div></div>
        <p class="note" style="margin:0">Se revisa el nombre del titular, el N° de cuenta (completo o los últimos 4 dígitos, aunque el banco los oculte con asteriscos) y el banco. Si el comprobante muestra otra cuenta u otro titular, el pago queda en revisión.</p>
        <label style="display:flex;gap:8px;align-items:center;margin-top:14px;font-weight:600"><input type="checkbox" id="pa_activo" ${c.activo ? "checked" : ""} ${dis} style="width:auto"> Pasarela activa (los clientes pueden pagar)</label>
        </div>
      </div>
      <div class="formcard" style="max-width:none;margin:0;min-width:0"><h3 style="margin:0 0 10px">Balances · fases</h3>
        <div class="grid2">${n("pa_gest", c.eeffGestion, "Gestión")}${n("pa_eeffo", c.precios.eeffOtros, "Otros rubros (Bs, sin fases)")}</div>
        <p class="note" style="margin:0 0 10px">Balances de esa gestión ya recepcionados: <b>${usadosEeff}</b>. Cada balance cuenta en la fase que tiene su mismo precio. Se habilita la primera fase que tenga cupos libres.</p>
        ${eeffFasesHTML(PA_UI.cupos, eeffRecsPorPrecio(c.eeffGestion), PA_UI.reservas || {}, { editable: true, conMontos: true, dis })}
        ${`            <p class="note" style="margin:6px 0 0"><b>¿Aumentar cupos de una fase agotada?</b> Sube el número de cupos y guarda: la fase se vuelve a abrir y pasa a ser la habilitada (porque es la primera con cupos libres) hasta que se llene de nuevo. Lo vendido en las otras fases no cambia.</p>`}
        ${admin ? `<button class="mini" id="pa_addcupo" style="margin-top:8px">+ Agregar fase</button>` : ""}
      </div></div>
      ${admin ? `<div style="margin-top:14px"><button class="btn" id="pa_save">Guardar configuración</button> <span class="msg" id="pa_msg"></span></div>` : ""}`;
  } else if (PA_UI.tab === "balances") {
    const dis = admin ? "" : "disabled";
    const ben = Object.assign({}, PAS_BEN_DEF, c.beneficios || {});
    const lz = String(c.lanzamiento || "2026-10-26T10:30:00-04:00");
    const lzLocal = lz.slice(0, 16);
    const ta = (id, l) => `<textarea id="${id}" rows="5" style="width:100%;font-size:13px" ${dis}>${escape((l || []).join("\n"))}</textarea>`;
    body = `${admin ? "" : `<p class="note">Solo un administrador puede cambiar esto.</p>`}
      <div class="formcard" style="max-width:none;margin:0 0 16px"><h3 style="margin:0 0 6px">Lanzamiento de la pasarela</h3>
        <p class="note" style="margin:0 0 8px">Antes de esta fecha y hora (Bolivia), los clientes ven una cuenta regresiva. Tú puedes probarla igual con <span class="mono">pagos.html?vista=previa</span>. Deja vacío para no mostrar cuenta regresiva.</p>
        <input id="pa_lanz" type="datetime-local" value="${escape(lzLocal)}" ${dis}>
        <div class="field" style="margin-top:10px;max-width:320px"><label>Contar balances para las fases desde</label><input id="pa_desde" type="date" value="${escape(eeffDesdeDe(c))}" ${dis}>
        <div class="note" style="margin-top:3px">Los balances recepcionados antes de esta fecha (pruebas o de otra campaña) no ocupan cupos.</div></div></div>
      <div class="formcard" style="max-width:none;margin:0 0 16px"><h3 style="margin:0 0 6px">Balances (estados financieros)</h3>
        <p class="note" style="margin:0 0 10px">Nombre que ve el cliente y qué incluye cada balance (una línea por punto). "NIT desde" limita el balance a clientes con NIT abierto desde esa fecha (déjalo vacío para todos).</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
        ${PA_UI.cupos.map((x, i) => { const inf = balInfo(PA_UI.cupos, i); return `<div style="border:1px solid var(--line);border-radius:10px;padding:10px">
          <div class="note" style="margin:0 0 4px">Fase ${i + 1} · Bs ${escape(String(x.precio))} · ${escape(String(x.capacidad))} cupos</div>
          <div class="field"><label>Nombre</label><input class="pa-bn" data-i="${i}" value="${escape(inf.nombre)}" ${dis}></div>
          <div class="field"><label>NIT desde (opcional)</label><input class="pa-bd" data-i="${i}" type="date" value="${escape(inf.nitDesde || "")}" ${dis}></div>
          <div class="field"><label>Qué incluye</label><textarea class="pa-bi" data-i="${i}" rows="4" style="width:100%;font-size:13px" ${dis}>${escape(inf.incluye.join("\n"))}</textarea></div></div>`; }).join("")}
        </div></div>
      <div class="formcard" style="max-width:none;margin:0 0 16px"><h3 style="margin:0 0 6px">Beneficios de los planes</h3>
        <p class="note" style="margin:0 0 10px">Se muestran dentro de cada plan en la pasarela. Una línea por beneficio.</p>
        <div class="grid2" style="gap:12px">
          <div class="field"><label>Plan Básico (declaración sin movimiento)</label>${ta("pa_ben_basico", ben.basico)}</div>
          <div class="field"><label>Plan Estándar</label>${ta("pa_ben_estandar", ben.estandar)}</div>
          <div class="field"><label>Plan Premium</label>${ta("pa_ben_premium", ben.premium)}</div>
          <div class="field"><label>Suscripción Facturación</label>${ta("pa_ben_fact", ben.fact)}</div>
        </div></div>
      ${admin ? `<button class="btn" id="pa_save_bal">Guardar balances y beneficios</button> <span class="msg" id="pa_msg_bal"></span>` : ""}`;
  } else if (PA_UI.tab === "premios") {
    const dis = admin ? "" : "disabled";
    // Si lo guardado son los premios de ejemplo anteriores (p1 a p6), se proponen los nuevos (Pro y Total)
    const premViejos = c.premios && c.premios.length && c.premios.every(p => /^p[1-6]$/.test(p.id));
    PA_UI.premios = PA_UI.premios || JSON.parse(JSON.stringify(c.premios && c.premios.length && !premViejos ? c.premios : PAS_PREM_DEF));
    const nFases = PA_UI.cupos.length;
    const opt = (v, l, sel) => `<option value="${v}" ${String(sel) === String(v) ? "selected" : ""}>${l}</option>`;
    body = `<div class="formcard" style="max-width:none;margin:0 0 16px"><h3 style="margin:0 0 6px">Ganadores</h3>
        <p class="note" style="margin:0 0 10px">Clientes que ganaron un premio al pagar por la pasarela. Marca "Entregado" cuando les hagas la devolución o les des el beneficio.</p>
        ${conPremio.length ? `<div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Fecha</th><th>N° Rec</th><th>Cliente</th><th>Celular</th><th>Servicio</th><th style="text-align:right">Pagó</th><th>Premio</th><th>Entregado</th></tr></thead><tbody>
          ${conPremio.map(r => `<tr><td class="mono">${escape(r.fecha || "")}</td><td class="mono">${escape(String(r.nroRecepcion || ""))}</td><td><b>${escape(r.clienteNombre || "")}</b><div class="note" style="margin:0">NIT ${escape(String(r.nit || ""))}</div></td><td class="mono">${escape(r.clienteCelular || "")}</td>
            <td style="font-size:12px">${escape(r.balanceNombre || r.detalleServicio || r.servicio || "")}</td><td class="mono" style="text-align:right">${money(r.importe)}</td>
            <td>${r.premios.map(p => `<div><span class="badge ${p.tipo === "azar" ? "ok" : ""}">${p.tipo === "azar" ? "Azar" : "Fijo"}</span> <b>${escape(p.nombre)}</b></div>`).join("")}</td>
            <td><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" class="pa-ent" data-id="${escape(r.id)}" ${r.premiosEntregado ? "checked" : ""} ${canEdit ? "" : "disabled"} style="width:auto">${r.premiosEntregado ? `<span class="note" style="margin:0">${escape(r.premiosEntregadoPor || "")}</span>` : ""}</label></td></tr>`).join("")}
          </tbody></table></div>` : `<p class="note">Todavía no hay ganadores.</p>`}</div>
      <div class="formcard" style="max-width:none;margin:0"><h3 style="margin:0 0 6px">Premios configurados</h3>
        <p class="note" style="margin:0 0 10px"><b>Fijo:</b> lo reciben todos los que pagan ese servicio o balance. <b>Al azar:</b> se sortean de antemano los ganadores entre los próximos pagos (ej. 1 ganador entre 30 pagos); nadie sabe cuál pago gana, ni el equipo. Al completar los pagos se sortea otra ronda.</p>
        <div style="overflow:auto"><table style="font-size:13px"><thead><tr><th>Activo</th><th>Premio</th><th>Descripción</th><th>Servicio</th><th>Balance / plan</th><th>Tipo</th><th>Ganadores</th><th>Entre pagos</th><th></th></tr></thead><tbody>
        ${PA_UI.premios.map((p, i) => `<tr>
          <td><input type="checkbox" class="pm" data-i="${i}" data-k="activo" ${p.activo === false ? "" : "checked"} ${dis} style="width:auto"></td>
          <td><input class="pm" data-i="${i}" data-k="nombre" value="${escape(p.nombre || "")}" style="min-width:180px" ${dis}></td>
          <td><input class="pm" data-i="${i}" data-k="descripcion" value="${escape(p.descripcion || "")}" style="min-width:200px" ${dis}></td>
          <td><select class="pm" data-i="${i}" data-k="servicio" ${dis}>${opt("eeff", "Balances", p.servicio)}${opt("decl", "Declaraciones", p.servicio)}${opt("fact", "Facturación", p.servicio)}${opt("todos", "Todos", p.servicio)}</select></td>
          <td>${p.servicio === "eeff" ? `<select class="pm" data-i="${i}" data-k="fase" ${dis}>${opt(0, "Todos los balances", p.fase || 0)}${PA_UI.cupos.map((x, k) => opt(k + 1, escape(balInfo(PA_UI.cupos, k).nombre), p.fase)).join("")}</select>`
                : p.servicio === "decl" ? `<select class="pm" data-i="${i}" data-k="plan" ${dis}>${opt("", "Todos los planes", p.plan || "")}${opt("basico", "Básico", p.plan)}${opt("estandar", "Estándar", p.plan)}${opt("premium", "Premium", p.plan)}</select>` : "—"}</td>
          <td><select class="pm" data-i="${i}" data-k="tipo" ${dis}>${opt("fijo", "Fijo", p.tipo)}${opt("azar", "Al azar", p.tipo)}</select></td>
          <td>${p.tipo === "azar" ? `<input class="pm" data-i="${i}" data-k="ganadores" type="number" min="1" value="${escape(String(p.ganadores || 1))}" style="width:60px" ${dis}>` : "Todos"}</td>
          <td>${p.tipo === "azar" ? `<input class="pm" data-i="${i}" data-k="entre" type="number" min="1" value="${escape(String(p.entre || 30))}" style="width:70px" ${dis}>` : "—"}</td>
          <td>${admin ? `<button class="mini pm-del" data-i="${i}">Quitar</button>` : ""}</td></tr>`).join("")}
        </tbody></table></div>
        ${admin ? `<button class="mini" id="pm_add" style="margin-top:8px">+ Agregar premio</button>
        <div style="margin-top:12px"><button class="btn" id="pm_save">Guardar premios</button> <span class="msg" id="pm_msg"></span></div>` : ""}</div>`;
  } else {
    const ms = paMontos();
    body = `<p class="note" style="margin:0 0 10px">Sube el QR de tu banco para cada importe (con el monto ya fijado). La página de pagos muestra el que corresponde. Si cambias un precio, sube el QR del nuevo monto.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px">
      ${ms.map(x => { const img = (PA_UI.qr || {})["m" + x.m]; return `<div class="formcard" style="max-width:none;margin:0;display:flex;flex-direction:column;gap:8px;align-items:center;text-align:center">
        <div style="font-family:Akshar,sans-serif;font-size:26px;font-weight:700">Bs ${x.m}</div><div class="note" style="margin:0;min-height:32px">${escape(x.uso)}</div>
        ${img ? `<img src="${img}" alt="QR Bs ${x.m}" style="width:150px;height:150px;object-fit:contain;border:1px solid var(--line);border-radius:10px;background:#fff">` : `<div style="width:150px;height:150px;border:2px dashed var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--warn);font-weight:700;font-size:13px">Falta QR</div>`}
        ${admin ? `<label class="mini" style="cursor:pointer">${img ? "Cambiar QR" : "Subir QR"}<input type="file" accept="image/*" data-qr="${x.m}" style="display:none"></label>` : ""}</div>`; }).join("")}
      </div><div class="msg" id="pa_qrmsg"></div>`;
  }
  const faltanQR = paMontos().filter(x => !(PA_UI.qr || {})["m" + x.m]).length;
  el("v-pasarela").innerHTML = `<h1>Pasarela de pagos</h1>
    <div class="formcard" style="max-width:none;display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
      <div style="flex:1;min-width:240px"><div class="note" style="margin:0">Link para tus clientes</div><b class="mono" style="font-size:15px">${escape(link)}</b>
        <div class="note" style="margin:2px 0 0">Tip: con <span class="mono">?nit=NUMERO</span> al final, el NIT ya viene escrito.</div></div>
      <button class="mini" id="pa_copy">Copiar link</button><a class="mini" href="${escape(link)}" target="_blank" rel="noopener">Abrir como cliente</a>
      ${c.activo ? `<span class="badge ok">Activa</span>` : `<span class="badge danger">Pausada</span>`}
    </div>
    ${faltanQR ? `<div class="formcard" style="max-width:none;border-color:var(--warn);margin-bottom:14px"><b style="color:var(--warn)">Faltan ${faltanQR} QR.</b> <span class="note">Súbelos en la pestaña "QR por importe" para que los clientes puedan pagar esos montos.</span></div>` : ""}
    <div class="kpis"><div class="kpi"><div class="n">${deHoy.length}</div><div class="l">Pagos por la pasarela hoy</div></div>
      <div class="kpi"><div class="n">${deHoy.filter(r => (r.pasarela || {}).estado === "aprobado").length}</div><div class="l">Recepcionados solos hoy</div></div>
      <div class="kpi"><div class="n" style="color:var(--warn)">${revision.length}</div><div class="l">En revisión</div></div></div>
    <div class="subtabs" id="patabs">${tabs.map(([k, l]) => `<button class="subtab ${PA_UI.tab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>${body}`;
  const V = el("v-pasarela");
  V.querySelectorAll("#patabs .subtab").forEach(b => b.onclick = () => { PA_UI.tab = b.dataset.tab; paintPasarela(); });
  el("pa_copy").onclick = () => { try { navigator.clipboard.writeText(link); el("pa_copy").textContent = "✓ Copiado"; } catch (e) {} };
  V.querySelectorAll("[data-aprobar]").forEach(b => b.onclick = () => paResolver(b.dataset.aprobar, true));
  V.querySelectorAll("[data-rechazar]").forEach(b => b.onclick = () => paResolver(b.dataset.rechazar, false));
  // Balances y beneficios
  if (el("pa_save_bal")) el("pa_save_bal").onclick = async () => {
    const m = el("pa_msg_bal"); m.className = "msg"; m.textContent = "Guardando…";
    const lineas = t => String(t || "").split("\n").map(x => x.trim()).filter(Boolean);
    V.querySelectorAll(".pa-bn").forEach(i => { PA_UI.cupos[+i.dataset.i].nombre = i.value.trim(); });
    V.querySelectorAll(".pa-bd").forEach(i => { PA_UI.cupos[+i.dataset.i].nitDesde = i.value || ""; });
    V.querySelectorAll(".pa-bi").forEach(i => { PA_UI.cupos[+i.dataset.i].incluye = lineas(i.value); });
    const lz = el("pa_lanz").value ? el("pa_lanz").value + ":00-04:00" : "";
    const contarDesde = el("pa_desde").value || "";
    const beneficios = { basico: lineas(el("pa_ben_basico").value), estandar: lineas(el("pa_ben_estandar").value), premium: lineas(el("pa_ben_premium").value), fact: lineas(el("pa_ben_fact").value) };
    try {
      await setDoc(doc(db, "config", "app"), { pasarela: { cupos: PA_UI.cupos, beneficios, lanzamiento: lz, contarDesde }, updatedAt: serverTimestamp() }, { merge: true });
      Object.assign(PA_UI.cfg, { cupos: PA_UI.cupos, beneficios, lanzamiento: lz, contarDesde });
      EEFF_DESDE = eeffDesdeDe(PA_UI.cfg);
      try { await eeffSincronizarConteo(PA_UI.cfg.eeffGestion, true); } catch (e) {}
      paintPasarela(); const m2 = el("pa_msg_bal"); if (m2) { m2.className = "msg ok"; m2.textContent = "Guardado. Los clientes ya lo ven en la pasarela."; }
    } catch (e) { m.className = "msg err"; m.textContent = "No se pudo guardar: " + (e.code || e.message); }
  };
  // Premios
  V.querySelectorAll(".pm").forEach(i => i.onchange = () => {
    const p = PA_UI.premios[+i.dataset.i], k = i.dataset.k;
    p[k] = i.type === "checkbox" ? i.checked : (i.type === "number" || k === "fase") ? Number(i.value) || 0 : i.value;
    if (k === "servicio" || k === "tipo") paintPasarela();
  });
  V.querySelectorAll(".pm-del").forEach(b => b.onclick = () => { PA_UI.premios.splice(+b.dataset.i, 1); paintPasarela(); });
  if (el("pm_add")) el("pm_add").onclick = () => { PA_UI.premios.push({ id: "p" + Date.now().toString(36), nombre: "Nuevo premio", descripcion: "", servicio: "eeff", fase: 0, tipo: "fijo", ganadores: 1, entre: 30 }); paintPasarela(); };
  if (el("pm_save")) el("pm_save").onclick = async () => {
    const m = el("pm_msg"); m.className = "msg"; m.textContent = "Guardando…";
    try {
      await setDoc(doc(db, "config", "app"), { pasarela: { premios: PA_UI.premios }, updatedAt: serverTimestamp() }, { merge: true });
      PA_UI.cfg.premios = JSON.parse(JSON.stringify(PA_UI.premios));
      m.className = "msg ok"; m.textContent = "Guardado.";
    } catch (e) { m.className = "msg err"; m.textContent = "No se pudo guardar: " + (e.code || e.message); }
  };
  V.querySelectorAll(".pa-ent").forEach(c => c.onchange = async () => {
    const quien = (ME && (ME.name || ME.email)) || "";
    const datos = { premiosEntregado: c.checked, premiosEntregadoPor: c.checked ? quien : "", premiosEntregadoAt: c.checked ? Date.now() : 0, _upd: Date.now() };
    try { await setDoc(doc(db, "recepciones", c.dataset.id), datos, { merge: true }); rcPoner(c.dataset.id, datos); paintPasarela(); }
    catch (e) { alert("No se pudo guardar: " + (e.code || e.message)); c.checked = !c.checked; }
  });
  V.querySelectorAll(".pa-cp").forEach(i => i.onchange = () => { PA_UI.cupos[Number(i.dataset.i)][i.dataset.k] = Number(i.value) || 0; paintPasarela(); });
  eeffFasesEnlazar(V);
  V.querySelectorAll(".pa-del").forEach(b => b.onclick = () => { PA_UI.cupos.splice(Number(b.dataset.i), 1); paintPasarela(); });
  if (el("pa_addcupo")) el("pa_addcupo").onclick = () => { const u = PA_UI.cupos[PA_UI.cupos.length - 1]; PA_UI.cupos.push({ precio: u ? Number(u.precio) + 50 : 250, capacidad: 30 }); paintPasarela(); };
  if (el("pa_save")) el("pa_save").onclick = paGuardar;
  V.querySelectorAll("[data-qr]").forEach(inp => inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const m = el("pa_qrmsg"); m.className = "msg"; m.textContent = "Subiendo QR…";
    try {
      const data = await paQRImagen(f);
      await setDoc(doc(db, "config", "qr_m" + inp.dataset.qr), { img: data, monto: Number(inp.dataset.qr), updatedAt: serverTimestamp() });
      PA_UI.qr["m" + inp.dataset.qr] = data; paintPasarela();
    } catch (e) { m.className = "msg err"; m.textContent = "No se pudo guardar el QR: " + (e.code || e.message); }
  });
}
// Prepara la imagen del QR: fondo blanco (los PNG transparentes se verían negros) y tamaño liviano
function paQRImagen(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\//.test(file.type)) { reject(new Error("Sube una imagen (PNG o JPG).")); return; }
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const intento = (max, cal) => {
          let w = img.width, h = img.height; const k = Math.min(1, max / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
          const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
          return cv.toDataURL("image/jpeg", cal);
        };
        let d = intento(800, 0.9);
        if (d.length > 600000) d = intento(650, 0.85);
        if (d.length > 600000) d = intento(520, 0.8);
        if (d.length > 900000) { reject(new Error("La imagen es demasiado pesada. Recórtala solo al QR e intenta de nuevo.")); return; }
        resolve(d);
      };
      img.onerror = () => reject(new Error("No se pudo abrir la imagen."));
      img.src = fr.result;
    };
    fr.onerror = () => reject(new Error("No se pudo leer el archivo."));
    fr.readAsDataURL(file);
  });
}
async function paGuardar() {
  const m = el("pa_msg"); m.className = "msg"; m.textContent = "Guardando…";
  const v = id => Number(el(id).value) || 0;
  const pasarela = {
    activo: el("pa_activo").checked,
    precios: { sinMov: v("pa_sin"), enFecha: v("pa_en"), fueraFecha: v("pa_fuera"), premium: v("pa_prem"), fact: v("pa_fact"), eeffOtros: v("pa_eeffo") },
    diaDesde: v("pa_d1") || 25, diaHasta: 31, diaCierre: v("pa_cierre") || 5,
    eeffGestion: String(v("pa_gest") || new Date().getFullYear()),
    cupos: PA_UI.cupos.filter(x => Number(x.precio) > 0 && Number(x.capacidad) > 0),
    destinoClaves: el("pa_dest").value.split(",").map(x => x.trim()).filter(Boolean),
    destinoCuenta: (el("pa_dcta").value || "").replace(/[^\d]/g, ""), destinoBanco: (el("pa_dbanco").value || "").trim()
  };
  // Nombres de columnas de la Base de Datos, para que el script encuentre al cliente por NIT
  await new Promise(res => bdEnsureLoaded(() => res()));
  pasarela.campos = Object.assign({}, bdKey2Header || {});
  try {
    await setDoc(doc(db, "config", "app"), { pasarela, updatedAt: serverTimestamp() }, { merge: true });
    PA_UI.cfg = Object.assign(PA_UI.cfg, pasarela); PA_UI.cupos = pasarela.cupos.map(x => Object.assign({}, x));
    paintPasarela(); const m2 = el("pa_msg"); if (m2) { m2.className = "msg ok"; m2.textContent = "✓ Guardado. Los clientes ya ven los nuevos precios."; }
  } catch (e) { m.className = "msg err"; m.textContent = "No se pudo guardar: " + (e.code || e.message); }
}
async function paResolver(id, aprobar) {
  const r = (RC.docs || []).find(x => x.id === id); if (!r) return;
  let motivo = "";
  if (!aprobar) { motivo = prompt("Motivo del rechazo (se guardará en la recepción):", "Comprobante no válido"); if (motivo === null) return; }
  else if (!confirm(`¿Aprobar el pago de ${r.clienteNombre} (${money(r.importe)})?\nPasará a ${recCatDe(r) === "declaracion" ? "Declaraciones" : recCatDe(r) === "eeff" ? "EEFF" : "Facturación"} y se enviará la Orden de Recepción a su correo.`)) return;
  const pas = Object.assign({}, r.pasarela, { estado: aprobar ? "aprobado" : "rechazado", resueltoPor: (ME && (ME.name || ME.email)) || "", resueltoAt: Date.now(), motivoRechazo: motivo });
  const datos = { pasarela: pas, comentarios: aprobar ? "Pago por pasarela (aprobado manualmente)" : ("Pasarela rechazada: " + motivo), _upd: Date.now() };
  try {
    await setDoc(doc(db, "recepciones", id), datos, { merge: true });
    if (aprobar && r.pasarela && r.pasarela.estado !== "aprobado") eeffContar(r, 1);
    rcPoner(id, datos); LT_DATA = null; recepLoaded = false;
    if (aprobar && r.clienteCorreo) {
      const ok = await postRecibo(Object.assign({}, r, datos));
      if (ok) { try { await setDoc(doc(db, "recepciones", id), { reciboEnviado: true, _upd: Date.now() }, { merge: true }); rcPoner(id, { reciboEnviado: true }); } catch (e) {} }
    }
    paintPasarela();
  } catch (e) { alert("No se pudo guardar: " + (e.code || e.message)); }
}

// ---------- FINANZAS · Reportes financieros (con importes; solo para quien tenga permiso) ----------
const RF_UI = { tab: "declaraciones" };
async function renderRepFinanzas() {
  el("v-repfinanzas").innerHTML = `<h1>Reportes financieros</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  await ltLoad();
  paintRepFinanzas();
}
function paintRepFinanzas() {
  const tabs = [["declaraciones", "Declaraciones"], ["eeff", "Estados Fin. (EEFF)"], ["facturacion", "Facturación"]];
  let body = "";
  if (RF_UI.tab === "declaraciones") {
    body = djResumenHTML(LT_DATA.filter(r => enListaTrabajo(r, "declaracion")), true);
  } else {
    const tipo = RF_UI.tab;
    const base = LT_DATA.filter(r => enListaTrabajo(r, tipo));
    const keyDe = r => tipo === "eeff" ? (recGestionEEFF(r) || "—") : (recPeriodoKey(r) || "—");
    const lbl = k => k === "—" ? "Sin dato" : tipo === "eeff" ? "Gestión " + k : recPeriodoTxt(k);
    const g = {}; base.forEach(r => { const k = keyDe(r); (g[k] = g[k] || []).push(r); });
    const sum = l => l.reduce((a, r) => a + (Number(r.importe) || 0), 0);
    const hecho = r => tipo === "eeff" ? (r.estadoTrabajo === "entregado") : (r.estadoFactura === "facturado");
    const keys = Object.keys(g).sort().reverse();
    body = `<div class="kpis">
        <div class="kpi"><div class="n">${base.length}</div><div class="l">Recepcionados</div></div>
        <div class="kpi"><div class="n" style="font-size:22px">${money(sum(base))}</div><div class="l">Total recepcionado</div></div>
        <div class="kpi"><div class="n" style="color:var(--ok)">${base.filter(hecho).length}</div><div class="l">${tipo === "eeff" ? "Entregados" : "Facturados"}</div></div>
      </div>
      <table><thead><tr><th>${tipo === "eeff" ? "Gestión" : "Mes"}</th><th style="text-align:right">Cantidad</th><th style="text-align:right">Total Bs</th><th style="text-align:right">${tipo === "eeff" ? "Entregados" : "Facturados"}</th></tr></thead>
      <tbody>${keys.map(k => `<tr><td><b>${escape(lbl(k))}</b></td><td class="mono" style="text-align:right">${g[k].length}</td><td class="mono" style="text-align:right">${money(sum(g[k]))}</td><td class="mono" style="text-align:right">${g[k].filter(hecho).length}</td></tr>`).join("") || `<tr><td colspan="4" class="note">Sin datos todavía.</td></tr>`}</tbody></table>`;
  }
  el("v-repfinanzas").innerHTML = `<h1>Reportes financieros</h1>
    <p class="note" style="margin:0 0 8px">Montos de lo recepcionado por lista. Esta pestaña solo la ven los roles con permiso (Usuarios → Permisos).</p>
    <div class="subtabs" id="rftabs">${tabs.map(([k, l]) => `<button class="subtab ${RF_UI.tab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>${RF_UI.tab === "eeff" ? '<div class="formcard" style="max-width:none;margin:0 0 16px" id="rf-fases"><p class="note"><span class="cx-spin"></span> Cargando balances por fase…</p></div>' : ""}${body}`;
  if (RF_UI.tab === "eeff") eeffFasesBloque("rf-fases", true);
  el("v-repfinanzas").querySelectorAll("#rftabs .subtab").forEach(b => b.onclick = () => { RF_UI.tab = b.dataset.tab; paintRepFinanzas(); });
  if (el("dj_agr")) el("dj_agr").onchange = e => { DJ_UI.agr = e.target.value; paintRepFinanzas(); };
}

// ---------- FACTURACIÓN (subpestañas) ----------
const FAC_UI = { tab: "activos", per: "", q: "" };
async function renderFacturacion() {
  el("v-facturacion").innerHTML = `<h1>Facturación</h1><p class="lead"><span class="cx-spin"></span> Cargando…</p>`;
  await ltLoad();
  paintFacturacion();
}
function paintFacturacion() {
  const canEdit = canEditClientes();
  const todos = LT_DATA.filter(r => recCatDe(r) === "facturacion");
  const enCorte = todos.filter(r => enListaTrabajo(r, "facturacion"));
  const periodos = [...new Set(todos.map(recPeriodoKey).filter(Boolean))].sort().reverse();
  if (!FAC_UI.per) {
    const hoy = new Date(); const actual = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");
    FAC_UI.per = periodos.includes(actual) ? actual : (periodos.find(k => k <= actual) || periodos[0] || "");
  }
  const q = FAC_UI.q.toLowerCase();
  const filtQ = l => q ? l.filter(r => [r.clienteNombre, r.nit, r.clienteCelular, r.detalleServicio, r.idcli, r.clienteId].join(" ").toLowerCase().includes(q)) : l;
  const pendientes = enCorte.filter(r => (r.estadoFactura || "pendiente") !== "facturado");
  let body = "";
  if (FAC_UI.tab === "activos") {
    const list = filtQ(todos.filter(r => recPeriodoKey(r) === FAC_UI.per)).sort((a, b) => String(a.clienteNombre || "").localeCompare(String(b.clienteNombre || "")));
    const fact = list.filter(r => r.estadoFactura === "facturado").length;
    body = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px;align-items:center">
        <label style="margin:0">Mes:</label>
        <select id="fac_per">${periodos.map(k => `<option value="${k}" ${k === FAC_UI.per ? "selected" : ""}>${recPeriodoTxt(k)}</option>`).join("") || `<option value="">Sin datos</option>`}</select>
        <input id="fac_q" placeholder="Buscar suscriptor, NIT, celular…" value="${escape(FAC_UI.q)}" style="flex:1;min-width:200px">
      </div>
      <div class="kpis">
        <div class="kpi"><div class="n">${list.length}</div><div class="l">Suscriptores activos · ${escape(recPeriodoTxt(FAC_UI.per))}</div></div>
        <div class="kpi"><div class="n" style="color:var(--ok)">${fact}</div><div class="l">Facturados</div></div>
        <div class="kpi"><div class="n" style="color:var(--warn)">${list.length - fact}</div><div class="l">Por facturar</div></div>
      </div>
      <div style="overflow:auto"><table><thead><tr><th>#</th><th>Suscriptor</th><th>Celular</th><th>Servicio</th><th>Fecha pago</th><th>Factura</th></tr></thead><tbody>
      ${list.map((r, i) => `<tr><td class="mono">${i + 1}</td>
        <td><b>${escape(r.clienteNombre || "—")}</b><div style="color:var(--muted);font-size:12px">NIT ${escape(String(r.nit || "—"))}${r.clienteId ? " · ID " + escape(String(r.clienteId)) : ""}</div></td>
        <td>${escape(r.clienteCelular || "—")}</td>
        <td>${escape(r.detalleServicio || r.servicio || "—")}</td>
        <td class="mono">${escape(r.fechaPago || r.fecha || fmtFecha(r.fechaISO))}</td>
        <td>${ltFila(r, "estadoFactura", ESTADOS_FACTURA, canEdit)}</td></tr>`).join("") || `<tr><td colspan="6" style="color:var(--muted)">No hay suscriptores para este mes.</td></tr>`}
      </tbody></table></div>`;
  } else {
    const list = filtQ(pendientes).sort((a, b) => recPeriodoKey(a).localeCompare(recPeriodoKey(b)) || String(a.clienteNombre || "").localeCompare(String(b.clienteNombre || "")));
    body = `
      <p class="note" style="margin:0 0 10px">Facturas por emitir de los suscriptores activos (período Octubre 2026 en adelante). Al marcar <b>Facturado</b> sale de esta lista. <i>Esta sección se desarrollará a detalle más adelante.</i></p>
      <div style="display:flex;gap:8px;margin:0 0 12px"><input id="fac_q" placeholder="Buscar suscriptor, NIT, celular…" value="${escape(FAC_UI.q)}" style="flex:1;min-width:200px"></div>
      <div style="overflow:auto"><table><thead><tr><th>Período</th><th>Suscriptor</th><th>Celular</th><th>Fecha pago</th><th>Factura</th></tr></thead><tbody>
      ${list.map(r => `<tr><td>${escape(recPeriodoTxt(recPeriodoKey(r)))}</td>
        <td><b>${escape(r.clienteNombre || "—")}</b><div style="color:var(--muted);font-size:12px">NIT ${escape(String(r.nit || "—"))}</div></td>
        <td>${escape(r.clienteCelular || "—")}</td>
        <td class="mono">${escape(r.fechaPago || r.fecha || fmtFecha(r.fechaISO))}</td>
        <td>${ltFila(r, "estadoFactura", ESTADOS_FACTURA, canEdit)}</td></tr>`).join("") || `<tr><td colspan="5" style="color:var(--muted)">¡Sin facturas pendientes! 🎉</td></tr>`}
      </tbody></table></div>`;
  }
  el("v-facturacion").innerHTML = `<h1>Facturación</h1>
    <div class="subtabs" id="factabs">
      <button class="subtab ${FAC_UI.tab === "activos" ? "on" : ""}" data-tab="activos">Suscriptores Activos</button>
      <button class="subtab ${FAC_UI.tab === "pendientes" ? "on" : ""}" data-tab="pendientes">Facturas pendientes (${pendientes.length})</button>
    </div>${body}`;
  el("v-facturacion").querySelectorAll("#factabs .subtab").forEach(b => b.onclick = () => { FAC_UI.tab = b.dataset.tab; paintFacturacion(); });
  if (el("fac_per")) el("fac_per").onchange = e => { FAC_UI.per = e.target.value; paintFacturacion(); };
  if (el("fac_q")) el("fac_q").oninput = e => { FAC_UI.q = e.target.value; clearTimeout(FAC_UI._t); FAC_UI._t = setTimeout(() => { paintFacturacion(); const x = el("fac_q"); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 250); };
  ltBindEstados(el("v-facturacion"), paintFacturacion);
}

// ============================================================
//  MÓDULO CALENDARIO (Operaciones) — agenda del equipo
//  Colección Firestore: "eventos"
// ============================================================
let EVENTOS = [], evLoaded = false, calYear = 0, calMonth = 0, calSubtab = "cal", calTarFiltro = "todas";
const EV_TIPOS = [
  ["tarea",       "Tarea",            "#235347"],
  ["vencimiento", "Vencimiento",      "#B4453C"],
  ["turno",       "Turno de atención","#2E7D5B"],
  ["clase",       "Clase / curso",    "#7A5AA6"],
  ["reunion",     "Reunión",          "#C77C2E"],
  ["otro",        "Otro",             "#5E7A70"]
];
function evColor(t) { const f = EV_TIPOS.find(x => x[0] === t); return f ? f[2] : "#5E7A70"; }
function evTipoLbl(t) { const f = EV_TIPOS.find(x => x[0] === t); return f ? f[1] : "Otro"; }
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

async function evLoad() {
  try {
    const snap = await getDocs(collection(db, "eventos"));
    EVENTOS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    EVENTOS.sort((a, b) => (a.fechaISO + (a.hora || "")).localeCompare(b.fechaISO + (b.hora || "")));
    evLoaded = true;
  } catch (e) { EVENTOS = []; }
}
function todayISO() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function isoOf(y, m, d) { return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }

async function renderCalendario() {
  el("v-calendario").innerHTML = `<h1>Calendario</h1><p class="lead"><span class="cx-spin"></span> Cargando agenda…</p>`;
  await evLoad();
  if (!calYear) { const d = new Date(); calYear = d.getFullYear(); calMonth = d.getMonth(); }
  paintCalendario();
}

function evFechaTs(t) { if (!t) return ""; try { const d = t.toDate ? t.toDate() : new Date(t.seconds ? t.seconds * 1000 : t); return isNaN(d) ? "" : d.toLocaleString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
const EV_ICO_OK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
const EV_ICO_RE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';
async function evTerminar(id, terminar) {
  const e = EVENTOS.find(x => x.id === id); if (!e) return;
  const datos = terminar
    ? { done: true, terminadoPor: (ME && (ME.name || ME.email)) || "", terminadoPorUid: (ME && ME.uid) || "", terminadoAt: Date.now() }
    : { done: false, terminadoPor: "", terminadoPorUid: "", terminadoAt: 0, reabiertoPor: (ME && (ME.name || ME.email)) || "", reabiertoAt: Date.now() };
  try { await setDoc(doc(db, "eventos", id), datos, { merge: true }); Object.assign(e, datos); if (el("v-ficha") && el("v-ficha").offsetParent !== null) paintFicha(); else paintCalendario(); } catch (err) { alert("No se pudo actualizar: " + (err.code || err.message)); }
}
// Subpestañas Tareas pendientes / Tareas terminadas (registro de avance del equipo)
// Una tarea (para la lista del calendario y para la Ficha del cliente)
function calTareaFila(e, hechas, hoy) {
    const vencida = !hechas && e.fechaISO && e.fechaISO < hoy;
    const paraMi = e.asignadoUid && ME && e.asignadoUid === ME.uid;
    return `<div class="ev-row" style="border-left:3px solid ${hechas ? "#2E7D5B" : vencida ? "#B4453C" : evColor("tarea")}">
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;${hechas ? "opacity:.75" : ""}">${escape(e.titulo || "")}</div>
        ${e.asignadoUid ? `<div style="margin:3px 0"><span class="badge ${paraMi ? "danger" : "mut"}" style="display:inline-flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>Asignada a ${paraMi ? "ti" : escape(e.asignadoNombre || "—")}</span>${e.asignadoPor ? ` <span style="font-size:11.5px;color:var(--muted)">por ${escape(e.asignadoPor)}</span>` : ""}</div>` : ""}
        ${e.cliente ? `<div style="font-size:12px;color:var(--muted)">Cliente: ${escape(e.cliente)}${e.clienteNit ? " · NIT " + escape(e.clienteNit) : ""}</div>` : ""}
        ${e.nota ? `<div style="font-size:12.5px;margin-top:3px">${escape(e.nota)}</div>` : ""}
        <div style="font-size:12px;color:var(--muted);margin-top:5px">Para el ${escape(e.fechaISO ? e.fechaISO.split("-").reverse().join("/") : "—")}${vencida ? ' · <b style="color:#B4453C">Atrasada</b>' : ""}
          · Creada por <b>${escape(e.createdByNombre || "—")}</b>${evFechaTs(e.createdAt) ? " el " + escape(evFechaTs(e.createdAt)) : ""}${e.origen === "recepcion" ? " · desde Recepción" : ""}</div>
        ${hechas ? `<div style="font-size:12px;color:#2E7D5B;margin-top:2px">Terminada por <b>${escape(e.terminadoPor || "—")}</b>${e.terminadoAt ? " el " + escape(evFechaTs(e.terminadoAt)) : ""}</div>` : ""}
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;align-items:flex-start">
        ${hechas
          ? `<button class="mini ev-reab" data-id="${e.id}" style="display:inline-flex;align-items:center;gap:5px">${EV_ICO_RE}Reabrir</button>`
          : `<button class="btn ev-term" data-id="${e.id}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#2E7D5B;border-color:#2E7D5B;color:#fff">${EV_ICO_OK}Terminar</button>
             <button class="mini ev-edit" data-id="${e.id}">Editar</button>`}
      </div></div>`;
}
function calTareasHTML(hechas) {
  let L = EVENTOS.filter(e => e.tipo === "tarea" && !!e.done === hechas);
  const uid = ME && ME.uid;
  const nMias = L.filter(e => e.asignadoUid === uid).length, nYo = L.filter(e => e.createdByUid === uid).length, nSin = L.filter(e => !e.asignadoUid).length;
  if (calTarFiltro === "mias") L = L.filter(e => e.asignadoUid === uid);
  else if (calTarFiltro === "creadas") L = L.filter(e => e.createdByUid === uid);
  else if (calTarFiltro === "sin") L = L.filter(e => !e.asignadoUid);
  if (hechas) L.sort((a, b) => (b.terminadoAt || 0) - (a.terminadoAt || 0)); else L.sort((a, b) => String(a.fechaISO).localeCompare(String(b.fechaISO)));
  const hoy = todayISO();
  const filas = L.map(e => calTareaFila(e, hechas, hoy)).join("");
  return `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin:14px 0 10px">
      <p class="lead" style="margin:0">${hechas ? "Registro de todo lo que el equipo ya terminó, con quién lo hizo y cuándo." : "Tareas por hacer del equipo. Al terminar una, dale a Terminar y queda en el registro de Tareas terminadas."}</p>
      ${hechas ? "" : '<button class="btn" id="ev_newt">+ Nueva tarea</button>'}
    </div>
    <div class="subtabs" id="tarfil" style="margin:0 0 10px">
      <button class="subtab ${calTarFiltro === "todas" ? "on" : ""}" data-tf="todas">Todas</button>
      <button class="subtab ${calTarFiltro === "mias" ? "on" : ""}" data-tf="mias">Asignadas a mí (${nMias})</button>
      <button class="subtab ${calTarFiltro === "creadas" ? "on" : ""}" data-tf="creadas">Creadas por mí (${nYo})</button>
      <button class="subtab ${calTarFiltro === "sin" ? "on" : ""}" data-tf="sin">Sin asignar (${nSin})</button>
    </div>
    ${filas || `<p class="note">${hechas ? "No hay tareas terminadas en este filtro." : "No hay tareas pendientes en este filtro."}</p>`}`;
}

function paintCalendario() {
  const canEdit = canEditClientes() || true; // todo el equipo activo puede agendar
  const first = new Date(calYear, calMonth, 1);
  let startDow = (first.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = todayISO();

  const leyenda = EV_TIPOS.map(([k, l, c]) => `<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px;font-size:12px;color:var(--muted)"><span style="width:10px;height:10px;border-radius:3px;background:${c};display:inline-block"></span>${l}</span>`).join("");

  let cells = "";
  for (let i = 0; i < startDow; i++) cells += `<div class="cal-cell cal-empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOf(calYear, calMonth, d);
    const evs = EVENTOS.filter(e => e.fechaISO === iso);
    const isToday = iso === today;
    const chips = evs.slice(0, 3).map(e => `<div class="cal-chip" title="${escape((e.hora ? e.hora + ' · ' : '') + (e.titulo || ''))}" style="border-left:3px solid ${evColor(e.tipo)};${e.done ? 'opacity:.5;text-decoration:line-through' : ''}">${e.hora ? `<b>${escape(e.hora)}</b> ` : ''}${escape(e.titulo || '')}</div>`).join("");
    const more = evs.length > 3 ? `<div class="cal-more">+${evs.length - 3} más</div>` : "";
    cells += `<div class="cal-cell${isToday ? ' cal-today' : ''}" data-day="${iso}">
      <div class="cal-dnum">${d}</div>${chips}${more}</div>`;
  }

  // Próximos eventos (desde hoy, 40 días)
  const limit = new Date(); limit.setDate(limit.getDate() + 40); const limitISO = limit.getFullYear() + "-" + String(limit.getMonth() + 1).padStart(2, "0") + "-" + String(limit.getDate()).padStart(2, "0");
  const prox = EVENTOS.filter(e => e.fechaISO >= today && e.fechaISO <= limitISO).slice(0, 25);
  const proxRows = prox.map(e => `<div class="ev-row" style="border-left:3px solid ${evColor(e.tipo)}">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:var(--muted)">${escape(fmtFecha(e.fechaISO))}${e.hora ? ' · ' + escape(e.hora) : ''} · ${escape(evTipoLbl(e.tipo))}</div>
        <div style="font-weight:600;${e.done ? 'opacity:.5;text-decoration:line-through' : ''}">${escape(e.titulo || '')}</div>
        ${e.cliente ? `<div style="font-size:12px;color:var(--muted)">${escape(e.cliente)}</div>` : ''}
        ${e.nota ? `<div style="font-size:12px;color:var(--muted)">${escape(e.nota)}</div>` : ''}
        ${e.createdByNombre ? `<div style="font-size:11.5px;color:var(--muted)">Creado por ${escape(e.createdByNombre)}${e.done && e.terminadoPor ? " · Terminado por " + escape(e.terminadoPor) : ""}</div>` : ''}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="mini ev-done" data-id="${e.id}" title="Marcar hecho/pendiente">${e.done ? '↺' : '✓'}</button>
        <button class="mini ev-edit" data-id="${e.id}">Editar</button>
        <button class="mini ev-del" data-id="${e.id}" title="Eliminar">✕</button>
      </div>
    </div>`).join("");

  el("v-calendario").innerHTML = `
    <style>
      .cal-head{display:flex;align-items:center;gap:10px;margin:6px 0 10px}
      .cal-head h2{margin:0;font-size:19px;min-width:190px}
      .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
      .cal-dow{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:center;padding:4px 0;font-weight:600}
      .cal-cell{min-height:92px;background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:5px 5px 4px;cursor:pointer;transition:.12s;overflow:hidden}
      .cal-cell:hover{border-color:var(--sage);box-shadow:0 2px 8px rgba(0,0,0,.06)}
      .cal-empty{background:transparent;border:none;cursor:default}
      .cal-today{outline:2px solid var(--green);outline-offset:-1px}
      .cal-dnum{font-size:12px;font-weight:700;color:var(--muted);margin-bottom:3px}
      .cal-today .cal-dnum{color:var(--green)}
      .cal-chip{font-size:11px;background:var(--panel2);border-radius:5px;padding:2px 5px;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.35}
      .cal-more{font-size:10.5px;color:var(--muted);padding-left:3px}
      .ev-row{display:flex;gap:10px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:9px 11px;margin-bottom:7px}
      @media(max-width:900px){.cal-cell{min-height:70px}}
    </style>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px">
      <div><h1 style="margin:0 0 2px">Calendario</h1><p class="lead" style="margin:0">Agenda compartida del equipo: tareas, vencimientos, turnos de atención, clases y reuniones.</p></div>
      <button class="btn" id="ev_new">+ Nuevo evento</button>
    </div>
    <div class="subtabs" id="caltabs" style="margin-top:12px">
      <button class="subtab ${calSubtab === "cal" ? "on" : ""}" data-ct="cal">Calendario</button>
      <button class="subtab ${calSubtab === "pend" ? "on" : ""}" data-ct="pend">Tareas pendientes (${EVENTOS.filter(e => e.tipo === "tarea" && !e.done).length})</button>
      <button class="subtab ${calSubtab === "hechas" ? "on" : ""}" data-ct="hechas">Tareas terminadas (${EVENTOS.filter(e => e.tipo === "tarea" && e.done).length})</button>
    </div>
    ${calSubtab !== "cal" ? calTareasHTML(calSubtab === "hechas") : `
    <div style="margin:14px 0">${leyenda}</div>
    <div class="cal-head">
      <button class="btn sec" id="cal_prev">‹</button>
      <h2>${MESES[calMonth]} ${calYear}</h2>
      <button class="btn sec" id="cal_next">›</button>
      <button class="btn sec" id="cal_today">Hoy</button>
    </div>
    <div class="cal-grid">${DIAS.map(d => `<div class="cal-dow">${d}</div>`).join("")}</div>
    <div class="cal-grid" style="margin-top:6px">${cells}</div>
    <h2 style="margin:26px 0 10px;font-size:17px">Próximos eventos</h2>
    ${proxRows || `<p class="note">No hay eventos próximos. Usa "+ Nuevo evento" o toca un día del calendario para agregar uno.</p>`}`}
  `;
  el("v-calendario").querySelectorAll("#caltabs .subtab").forEach(b => b.onclick = () => { calSubtab = b.dataset.ct; paintCalendario(); });
  el("v-calendario").querySelectorAll("#tarfil .subtab").forEach(b => b.onclick = () => { calTarFiltro = b.dataset.tf; paintCalendario(); });
  el("v-calendario").querySelectorAll(".ev-term").forEach(b => b.onclick = () => evTerminar(b.dataset.id, true));
  el("v-calendario").querySelectorAll(".ev-reab").forEach(b => b.onclick = () => evTerminar(b.dataset.id, false));
  if (el("ev_newt")) el("ev_newt").onclick = () => openEventoModal(null, todayISO());
  el("v-calendario").querySelectorAll(".ev-edit").forEach(b => b.onclick = () => { const e = EVENTOS.find(x => x.id === b.dataset.id); if (e) openEventoModal(e); });
  el("ev_new").onclick = () => openEventoModal(null, today);
  if (calSubtab !== "cal") return;

  el("cal_prev").onclick = () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } paintCalendario(); };
  el("cal_next").onclick = () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } paintCalendario(); };
  el("cal_today").onclick = () => { const d = new Date(); calYear = d.getFullYear(); calMonth = d.getMonth(); paintCalendario(); };
  el("ev_new").onclick = () => openEventoModal(null, today);
  el("v-calendario").querySelectorAll(".cal-cell[data-day]").forEach(c => c.onclick = () => openEventoModal(null, c.dataset.day));
  el("v-calendario").querySelectorAll(".ev-edit").forEach(b => b.onclick = () => { const e = EVENTOS.find(x => x.id === b.dataset.id); if (e) openEventoModal(e); });
  el("v-calendario").querySelectorAll(".ev-del").forEach(b => b.onclick = () => delEvento(b.dataset.id));
  el("v-calendario").querySelectorAll(".ev-done").forEach(b => b.onclick = async () => {
    const e = EVENTOS.find(x => x.id === b.dataset.id); if (!e) return;
    evTerminar(e.id, !e.done);
  });
}

// Opciones de cliente desde la Base de Datos: "NOMBRE — NIT 123"
function evCliOpts() { return BD.map(c => (bdV(c, "nombre") || bdV(c, "razon")) + (bdV(c, "nit") ? " — NIT " + bdV(c, "nit") : "")).filter(x => x.trim()).sort(); }
function evCliParse(v) {
  const t = String(v || "").trim(); const m = t.match(/^(.*?)\s+—\s+NIT\s+(\S+)\s*$/);
  if (m) { const c = BD.find(x => bdV(x, "nit") === m[2]); return { nombre: m[1].trim(), nit: m[2], bdId: c ? c._docid || "" : "" }; }
  const c = t ? BD.find(x => (bdV(x, "nombre") || bdV(x, "razon")).toUpperCase() === t.toUpperCase()) : null;
  return { nombre: t, nit: c ? bdV(c, "nit") : "", bdId: c ? c._docid || "" : "" };
}
function evAsignables() { return USERS.filter(u => u.active !== false && (u.name || u.email)).sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email))); }
function openEventoModal(e, fechaDefault) {
  const bg = document.createElement("div");
  bg.style = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
  const clientesList = evCliOpts().map(o => `<option value="${escape(o)}">`).join("");
  const cliVal = e && e.cliente ? e.cliente + (e.clienteNit ? " — NIT " + e.clienteNit : "") : "";
  const asig = evAsignables();
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:24px;width:500px;max-width:96vw;max-height:92vh;overflow:auto">
    <h3 style="margin:0 0 14px">${e && e.id ? 'Editar' : 'Nuevo'} evento</h3>
    <div class="field"><label>Título</label><input id="ev_titulo" value="${e ? escape(e.titulo || '') : ''}" placeholder="Ej. Vencimiento IVA / Turno mañana / Clase de facturación"></div>
    <div class="grid2">
      <div class="field"><label>Fecha</label><input id="ev_fecha" type="date" value="${e ? escape(e.fechaISO || '') : (fechaDefault || todayISO())}"></div>
      <div class="field"><label>Hora (opcional)</label><input id="ev_hora" type="time" value="${e ? escape(e.hora || '') : ''}"></div>
    </div>
    <div class="field"><label>Tipo</label><select id="ev_tipo">${EV_TIPOS.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div>
    <div class="field"><label>Cliente (opcional)</label><input id="ev_cliente" list="ev_clist" value="${escape(cliVal)}" placeholder="Escribe o elige de la lista de la Base de Datos" autocomplete="off"><datalist id="ev_clist">${clientesList}</datalist>
      <div class="note" id="ev_clinote" style="margin:4px 0 0">Toca el campo o escribe para ver los clientes. Si eliges uno, la tarea aparece también en su Ficha del cliente.</div></div>
    <div class="field" style="background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px 12px">
      <label style="display:flex;gap:8px;align-items:center;cursor:pointer;margin:0;font-weight:600"><input type="checkbox" id="ev_asig_chk" ${e && e.asignadoUid ? "checked" : ""} style="width:18px;height:18px;margin:0">Asignar a alguien del equipo</label>
      <select id="ev_asig" style="margin-top:8px;${e && e.asignadoUid ? "" : "display:none"}"><option value="">— elegir a quién —</option>${asig.map(u => `<option value="${escape(u.uid)}" ${e && e.asignadoUid === u.uid ? "selected" : ""}>${escape(u.name || u.email)}${u.role ? " · " + escape(ROLE_LABELS[u.role] || u.role) : ""}</option>`).join("")}</select>
      <div class="note" style="margin:6px 0 0">La persona asignada la verá en sus tareas del panel y en el CRM.</div>
    </div>
    <div class="field"><label>Nota (opcional)</label><textarea id="ev_nota" style="min-height:70px">${e ? escape(e.nota || '') : ''}</textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn sec" id="ev_cancel">Cancelar</button>
      <button class="btn" id="ev_save">Guardar</button>
    </div><div class="msg" id="ev_mmsg"></div></div>`;
  document.body.appendChild(bg);
  bg.querySelector("#ev_tipo").value = e ? (e.tipo || "tarea") : "tarea";
  bg.querySelector("#ev_asig_chk").onchange = function () { bg.querySelector("#ev_asig").style.display = this.checked ? "" : "none"; };
  // La lista de usuarios se carga si todavía no se abrió la pestaña Usuarios
  const pintarAsig = () => { const sel = bg.querySelector("#ev_asig"); if (!sel) return; const cur = sel.value || (e && e.asignadoUid) || "";
    sel.innerHTML = '<option value="">— elegir a quién —</option>' + evAsignables().map(u => `<option value="${escape(u.uid)}" ${cur === u.uid ? "selected" : ""}>${escape(u.name || u.email)}${u.role ? " · " + escape(ROLE_LABELS[u.role] || u.role) : ""}</option>`).join(""); };
  if (!USERS.length) { const sel = bg.querySelector("#ev_asig"); if (sel) sel.innerHTML = '<option value="">Cargando usuarios…</option>'; getDocs(collection(db, "users")).then(sn => { if (!USERS.length) sn.forEach(d => USERS.push({ ...d.data(), uid: d.id })); pintarAsig(); }).catch(pintarAsig); }
  // Si la Base de Datos aún no se cargó, se carga y se llena la lista
  if (!BD.length) bdEnsureLoaded(ok => { const dl = bg.querySelector("#ev_clist"); if (ok && dl) dl.innerHTML = evCliOpts().map(o => `<option value="${escape(o)}">`).join(""); });
  const close = () => bg.remove();
  bg.onclick = ev => { if (ev.target === bg) close(); };
  bg.querySelector("#ev_cancel").onclick = close;
  bg.querySelector("#ev_save").onclick = async () => {
    const titulo = bg.querySelector("#ev_titulo").value.trim();
    const fecha = bg.querySelector("#ev_fecha").value;
    const m = bg.querySelector("#ev_mmsg");
    if (!titulo) { m.className = "msg err"; m.textContent = "Ponle un título al evento."; return; }
    if (!fecha) { m.className = "msg err"; m.textContent = "Elige una fecha."; return; }
    const cli = evCliParse(bg.querySelector("#ev_cliente").value);
    const conAsig = bg.querySelector("#ev_asig_chk").checked, asigUid = conAsig ? bg.querySelector("#ev_asig").value : "";
    if (conAsig && !asigUid) { m.className = "msg err"; m.textContent = "Elige a quién asignar la tarea (o quita el check)."; return; }
    const au = asigUid ? (USERS.find(u => u.uid === asigUid) || {}) : null;
    const item = {
      titulo, fechaISO: fecha, hora: bg.querySelector("#ev_hora").value || "",
      tipo: bg.querySelector("#ev_tipo").value, cliente: cli.nombre, clienteNit: cli.nit, clienteBdId: cli.bdId,
      nota: bg.querySelector("#ev_nota").value.trim(), updatedAt: serverTimestamp(),
      asignadoUid: asigUid, asignadoNombre: au ? (au.name || au.email || "") : "", asignadoEmail: au ? (au.email || "") : ""
    };
    if (asigUid && (!e || e.asignadoUid !== asigUid)) { item.asignadoPor = (ME && (ME.name || ME.email)) || ""; item.asignadoPorUid = (ME && ME.uid) || ""; item.asignadoAt = Date.now(); }
    const btn = bg.querySelector("#ev_save"); btn.disabled = true; btn.textContent = "Guardando…";
    try {
      if (e && e.id) await setDoc(doc(db, "eventos", e.id), item, { merge: true });
      else await setDoc(doc(collection(db, "eventos")), { ...item, done: false, createdByUid: ME.uid, createdByNombre: ME.name || ME.email, createdAt: serverTimestamp() });
      await evLoad(); close();
      if (el("v-calendario") && el("v-calendario").offsetParent !== null) paintCalendario();
      if (el("v-ficha") && el("v-ficha").offsetParent !== null) paintFicha();
    } catch (err) { btn.disabled = false; btn.textContent = "Guardar"; m.className = "msg err"; m.textContent = "Error: " + (err.code || err.message); }
  };
}
function delEvento(id) {
  const e = EVENTOS.find(x => x.id === id); if (!e) return;
  if (!confirm(`¿Eliminar el evento "${e.titulo}"?`)) return;
  deleteDoc(doc(db, "eventos", id)).then(async () => { await evLoad(); paintCalendario(); }).catch(() => alert("No se pudo eliminar."));
}


// ============================================================
//  MÓDULO ARQUEO (Operaciones) — conciliación de extracto bancario
//  Compara los movimientos del banco con los pagos registrados
//  en Recepción (colección "recepciones") por nombre, fecha e importe.
// ============================================================
let ARQ_ROWS = [], ARQ_HEADERS = [], ARQ_MAP = { fecha: -1, desc: -1, importe: -1 }, ARQ_RESULT = [];

function arqNorm(s) {
  return String(s == null ? "" : s).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
// Parsea importes en varios formatos: "1.234,56" / "1,234.56" / "1234.56" / "Bs 150,00"
function arqNum(v) {
  if (v == null) return NaN;
  let s = String(v).replace(/[^0-9.,-]/g, "").trim();
  if (!s) return NaN;
  const lastC = s.lastIndexOf(","), lastD = s.lastIndexOf(".");
  if (lastC > -1 && lastD > -1) {
    if (lastC > lastD) { s = s.replace(/\./g, "").replace(",", "."); }  // 1.234,56
    else { s = s.replace(/,/g, ""); }                                    // 1,234.56
  } else if (lastC > -1) {
    // solo comas: si hay 2 decimales tras la última coma => decimal
    s = (s.length - lastC - 1 === 2) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastD > -1) {
    // solo puntos (formato boliviano): 3 dígitos tras el último punto => separador de miles
    if (s.length - lastD - 1 === 3) s = s.replace(/\./g, "");
  }
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}
// Normaliza fechas a YYYY-MM-DD desde dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, etc.
function arqDate(v) {
  if (v == null) return "";
  let s = String(v).trim();
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return m[1] + "-" + m[2].padStart(2, "0") + "-" + m[3].padStart(2, "0");
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (m) { let y = m[3]; if (y.length === 2) y = "20" + y; return y + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"); }
  return "";
}
function arqDaysDiff(a, b) {
  if (!a || !b) return 999;
  const da = new Date(a + "T00:00:00"), db = new Date(b + "T00:00:00");
  return Math.abs(Math.round((da - db) / 86400000));
}
// Parser CSV simple (comas o ; con comillas)
function arqParseCSV(text) {
  const delim = (text.split("\n")[0].split(";").length > text.split("\n")[0].split(",").length) ? ";" : ",";
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === delim) { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ""));
}
// Carga SheetJS para leer .xlsx (bajo demanda)
let _xlsxLib = null;
async function arqLoadXLSX() {
  if (_xlsxLib) return _xlsxLib;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  _xlsxLib = window.XLSX;
  return _xlsxLib;
}

async function renderArqueo() {
  el("v-arqueo").innerHTML = `
    <h1>Arqueo / Conciliación bancaria</h1>
    <p class="lead">Carga el extracto del banco y el sistema lo cruza con los pagos registrados en <b>Recepción</b> por nombre de cliente, fecha e importe.</p>
    <div class="formcard" style="margin-top:14px">
      <h3 style="margin:0 0 6px">1) Cargar extracto bancario</h3>
      <p class="note" style="margin:0 0 12px">Acepta archivos <b>.csv</b> o <b>.xlsx</b> exportados desde tu banca por internet.
      La primera fila debe tener los títulos de columna (Fecha, Descripción/Glosa, Importe/Crédito).</p>
      <input type="file" id="arq_file" accept=".csv,.xlsx,.xls" style="margin-bottom:8px">
      <div class="msg" id="arq_msg"></div>
    </div>
    <div id="arq_cfg"></div>
    <div id="arq_out"></div>`;
  el("arq_file").onchange = arqOnFile;
  // si ya había un resultado en memoria, re-pintar
  if (ARQ_ROWS.length) { arqRenderMap(); if (ARQ_RESULT.length) arqRenderResult(); }
}

async function arqOnFile(e) {
  const file = e.target.files[0]; if (!file) return;
  const msg = el("arq_msg"); msg.className = "msg"; msg.textContent = "Leyendo archivo…";
  try {
    let rows;
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const XLSX = await arqLoadXLSX();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    } else {
      const text = await file.text();
      rows = arqParseCSV(text);
    }
    rows = rows.filter(r => r && r.some(c => String(c).trim() !== ""));
    if (rows.length < 2) { msg.className = "msg err"; msg.textContent = "El archivo no tiene filas suficientes."; return; }
    ARQ_HEADERS = rows[0].map(h => String(h).trim());
    ARQ_ROWS = rows.slice(1);
    ARQ_RESULT = [];
    // intento de auto-detección de columnas
    ARQ_MAP = { fecha: -1, desc: -1, importe: -1 };
    ARQ_HEADERS.forEach((h, i) => {
      const n = arqNorm(h);
      if (ARQ_MAP.fecha < 0 && /fecha|date|dia/.test(n)) ARQ_MAP.fecha = i;
      if (ARQ_MAP.desc < 0 && /descrip|glosa|detalle|concepto|referencia|beneficiario|ordenante|nombre/.test(n)) ARQ_MAP.desc = i;
      if (ARQ_MAP.importe < 0 && /importe|credito|abono|monto|haber|deposito|valor|ingreso/.test(n)) ARQ_MAP.importe = i;
    });
    msg.className = "msg ok"; msg.textContent = `✓ ${ARQ_ROWS.length} movimientos leídos. Revisa las columnas abajo.`;
    arqRenderMap();
  } catch (err) {
    msg.className = "msg err"; msg.textContent = "No se pudo leer el archivo: " + (err.message || err);
  }
}

function arqRenderMap() {
  const opts = (sel) => ARQ_HEADERS.map((h, i) => `<option value="${i}" ${i === sel ? "selected" : ""}>${escape(h || ("Columna " + (i + 1)))}</option>`).join("");
  const sample = ARQ_ROWS.slice(0, 4).map(r => `<tr>${ARQ_HEADERS.map((h, i) => `<td>${escape(String(r[i] == null ? "" : r[i]))}</td>`).join("")}</tr>`).join("");
  el("arq_cfg").innerHTML = `
    <div class="formcard">
      <h3 style="margin:0 0 6px">2) Indica qué columna es cada dato</h3>
      <div class="grid2" style="gap:14px">
        <div class="field"><label>Fecha</label><select id="arq_c_fecha"><option value="-1">—</option>${opts(ARQ_MAP.fecha)}</select></div>
        <div class="field"><label>Descripción / Glosa (nombre del cliente)</label><select id="arq_c_desc"><option value="-1">—</option>${opts(ARQ_MAP.desc)}</select></div>
      </div>
      <div class="grid2" style="gap:14px">
        <div class="field"><label>Importe (crédito / abono)</label><select id="arq_c_importe"><option value="-1">—</option>${opts(ARQ_MAP.importe)}</select></div>
        <div class="field"><label>Tolerancia de fecha</label><select id="arq_c_tol"><option value="0">Mismo día</option><option value="2">± 2 días</option><option value="3" selected>± 3 días</option><option value="7">± 7 días</option></select></div>
      </div>
      <div style="overflow:auto;margin:8px 0 12px"><table style="font-size:12px"><thead><tr>${ARQ_HEADERS.map(h => `<th>${escape(h)}</th>`).join("")}</tr></thead><tbody>${sample}</tbody></table></div>
      <button class="btn" id="arq_run">Conciliar con Recepción</button>
      <div class="msg" id="arq_runmsg"></div>
    </div>`;
  el("arq_c_fecha").value = ARQ_MAP.fecha; el("arq_c_desc").value = ARQ_MAP.desc; el("arq_c_importe").value = ARQ_MAP.importe;
  el("arq_run").onclick = arqRun;
}

async function arqRun() {
  ARQ_MAP.fecha = Number(el("arq_c_fecha").value);
  ARQ_MAP.desc = Number(el("arq_c_desc").value);
  ARQ_MAP.importe = Number(el("arq_c_importe").value);
  const tol = Number(el("arq_c_tol").value);
  const msg = el("arq_runmsg");
  if (ARQ_MAP.importe < 0) { msg.className = "msg err"; msg.textContent = "Elige al menos la columna de Importe."; return; }
  msg.className = "msg"; msg.textContent = "Cargando pagos de Recepción…";
  await recepLoad();
  // candidatos: pagos aún no conciliados
  const pagos = RECEP.map(r => ({ ...r, _imp: Number(r.importe) || 0, _nom: arqNorm(r.clienteNombre) }));

  ARQ_RESULT = ARQ_ROWS.map((row, idx) => {
    const imp = arqNum(row[ARQ_MAP.importe]);
    const fec = ARQ_MAP.fecha >= 0 ? arqDate(row[ARQ_MAP.fecha]) : "";
    const desc = ARQ_MAP.desc >= 0 ? String(row[ARQ_MAP.desc] || "") : "";
    const descN = arqNorm(desc);
    let matches = [];
    if (!isNaN(imp) && imp > 0) {
      pagos.forEach(p => {
        if (p.conciliado) return;
        const impOk = Math.abs(p._imp - imp) < 0.5;
        if (!impOk) return;
        const dd = fec ? arqDaysDiff(fec, p.fechaISO) : 0;
        const fecOk = !fec || dd <= tol;
        // nombre: alguna palabra del nombre (>=4 letras) aparece en la glosa
        let nomScore = 0;
        if (p._nom) {
          const words = p._nom.split(" ").filter(w => w.length >= 4);
          nomScore = words.filter(w => descN.includes(w)).length;
        }
        if (impOk && fecOk) {
          let score = 2 + (fec ? (tol - dd) : 0) + nomScore * 3;
          matches.push({ p, score, nomScore, dd });
        }
      });
      matches.sort((a, b) => b.score - a.score);
    }
    let estado = "sin", best = null;
    if (matches.length === 1) { estado = "ok"; best = matches[0]; }
    else if (matches.length > 1) {
      // si el mejor tiene coincidencia de nombre y es único en ese puntaje, lo tomamos
      if (matches[0].nomScore > 0 && matches[0].score > matches[1].score) { estado = "ok"; best = matches[0]; }
      else estado = "multi";
    }
    return { idx, imp, fec, desc, matches, estado, best, chosen: best ? best.p.id : "" };
  });

  const ok = ARQ_RESULT.filter(r => r.estado === "ok").length;
  const multi = ARQ_RESULT.filter(r => r.estado === "multi").length;
  const sin = ARQ_RESULT.filter(r => r.estado === "sin").length;
  msg.className = "msg ok"; msg.textContent = `✓ Conciliado: ${ok} · Varias opciones: ${multi} · Sin coincidencia: ${sin}`;
  arqRenderResult();
}

function arqRenderResult() {
  const canEdit = canEditClientes();
  const badge = { ok: '<span class="badge ok">Conciliado</span>', multi: '<span class="badge" style="background:#C77C2E;color:#fff">Varias opciones</span>', sin: '<span class="badge off">Sin coincidencia</span>' };
  const rows = ARQ_RESULT.map(r => {
    const pagosSel = RECEP.filter(p => Math.abs((Number(p.importe) || 0) - r.imp) < 50 || r.matches.some(m => m.p.id === p.id));
    const sel = canEdit ? `<select class="mini" data-arqsel="${r.idx}">
        <option value="">— sin asignar —</option>
        ${pagosSel.map(p => `<option value="${p.id}" ${r.chosen === p.id ? "selected" : ""}>${escape(p.clienteNombre || "?")} · ${money(p.importe)} · ${escape(fmtFecha(p.fechaISO))}</option>`).join("")}
      </select>` : (r.best ? escape(r.best.p.clienteNombre || "") : "—");
    return `<tr>
      <td class="mono">${escape(r.fec || "—")}</td>
      <td style="max-width:260px">${escape(r.desc || "—")}</td>
      <td class="mono" style="text-align:right">${isNaN(r.imp) ? "—" : money(r.imp)}</td>
      <td>${badge[r.estado]}</td>
      <td>${sel}</td>
      <td>${canEdit ? `<button class="mini" data-arqok="${r.idx}" ${r.chosen ? "" : "disabled"}>Marcar conciliado</button>` : ""}</td>
    </tr>`;
  }).join("");
  el("arq_out").innerHTML = `
    <div class="formcard">
      <h3 style="margin:0 0 6px">3) Resultado de la conciliación</h3>
      <p class="note" style="margin:0 0 10px">Revisa cada movimiento. Donde haya varias opciones, elige el pago correcto y pulsa <b>Marcar conciliado</b>. Esto marca el pago en Recepción como conciliado con el banco.</p>
      <div style="overflow:auto"><table>
        <thead><tr><th>Fecha banco</th><th>Descripción / Glosa</th><th style="text-align:right">Importe</th><th>Estado</th><th>Pago de Recepción</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6" style="color:var(--muted)">Sin movimientos.</td></tr>`}</tbody>
      </table></div>
    </div>`;
  el("arq_out").querySelectorAll("[data-arqsel]").forEach(s => s.onchange = () => {
    const r = ARQ_RESULT[Number(s.dataset.arqsel)]; if (r) { r.chosen = s.value; const b = el("arq_out").querySelector(`[data-arqok="${r.idx}"]`); if (b) b.disabled = !s.value; }
  });
  el("arq_out").querySelectorAll("[data-arqok]").forEach(b => b.onclick = async () => {
    const r = ARQ_RESULT[Number(b.dataset.arqok)]; if (!r || !r.chosen) return;
    b.disabled = true; b.textContent = "Guardando…";
    try {
      await setDoc(doc(db, "recepciones", r.chosen), { _upd: Date.now(), conciliado: true, conciliadoFechaBanco: r.fec || "", conciliadoGlosa: r.desc || "", conciliadoPorUid: ME.uid, conciliadoAt: serverTimestamp() }, { merge: true });
      const p = RECEP.find(x => x.id === r.chosen); if (p) p.conciliado = true;
      r.estado = "ok"; b.textContent = "✓ Conciliado"; b.classList.add("ok");
    } catch (e) { b.disabled = false; b.textContent = "Marcar conciliado"; alert("No se pudo guardar: " + (e.code || e.message)); }
  });
}


// ============================================================
//  MÓDULO IMPORTAR (Administración) — historial a Firestore
//  Lee un CSV/XLSX exportado de Google Sheets y lo guarda en
//  la colección "recepciones" (historial, declaraciones, EEFF…).
// ============================================================
let IMP_ROWS = [], IMP_HEADERS = [], IMP_MAP = {}, IMP_LASTLOTE = "";
const IMP_DESTINOS = [
  ["", "Recepción (historial de pagos)"],
  ["declaracion", "Declaraciones"],
  ["tramite", "Trámites"],
  ["eeff", "Estados Financieros (EEFF)"]
];
const IMP_CAMPOS = [
  ["nro", "Nro (correlativo)"],
  ["fecha", "Fecha"],
  ["hora", "Hora"],
  ["fechapago", "Fecha de pago"],
  ["nrorec", "N° Recepción"],
  ["nrocom", "N° Comprobante / Recibo"],
  ["cliente", "Cliente / Razón Social"],
  ["nit", "NIT"],
  ["idcli", "ID Cliente"],
  ["rubro", "Presta servicios a / Rubro"],
  ["celular", "Celular"],
  ["correo", "Correo"],
  ["servicio", "Servicio (SERVICIOS CONTAX)"],
  ["detalle", "Detalle / Tipo de servicio"],
  ["mesrec", "Mes a recepcionar"],
  ["anio", "Año"],
  ["mespago", "Mes de pago"],
  ["importe", "Total / Importe (Bs)"],
  ["metodo", "Forma de pago"],
  ["atencion", "Atención"],
  ["comentarios", "Comentarios"],
  ["estado", "Estado (opcional)"]
];
function impEstadoNorm(v) {
  const u = String(v == null ? "" : v).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/entreg|termin|complet|listo|hecho|pagad|cobrad/.test(u)) return "entregado";
  if (/proces|curso|tramit|avanz/.test(u)) return "en_proceso";
  if (/pend|debe|falta/.test(u)) return "pendiente";
  return "";
}

async function renderImportar() {
  if (!isAdmin()) { el("v-importar").innerHTML = `<h1>Importar</h1><p class="lead">Esta sección es solo para administradores.</p>`; return; }
  el("v-importar").innerHTML = `
    <h1>Importar historial</h1>
    <p class="lead">Trae tu historial desde Google Sheets (o Excel) hacia la base del sistema (Firebase), para no empezar de cero. Lo importado aparece en Recepción, Dashboard y las listas correspondientes.</p>
    <div class="formcard">
      <h3 style="margin:0 0 6px">1) ¿Qué vas a importar?</h3>
      <div class="grid2">
        <div class="field"><label>Destino</label><select id="imp_destino">${IMP_DESTINOS.map(d => `<option value="${d[0]}">${d[1]}</option>`).join("")}</select></div>
        <div class="field"><label>Estado por defecto (si una fila no trae estado)</label><select id="imp_estado"><option value="entregado">Entregado (historial ya hecho)</option><option value="pendiente">Pendiente</option><option value="en_proceso">En proceso</option></select></div>
      </div>
      <p class="note" style="margin:0">Consejo: exporta tu hoja desde Google Sheets con <b>Archivo → Descargar → CSV</b> (o Excel .xlsx). La primera fila debe tener los títulos de columna.</p>
    </div>
    <div class="formcard">
      <h3 style="margin:0 0 6px">2) Sube el archivo (.csv o .xlsx)</h3>
      <input type="file" id="imp_file" accept=".csv,.xlsx,.xls">
      <div class="msg" id="imp_msg"></div>
    </div>
    <div id="imp_cfg"></div>
    <div id="imp_result"></div>`;
  el("imp_file").onchange = impOnFile;
}

async function impOnFile(e) {
  const file = e.target.files[0]; if (!file) return;
  const msg = el("imp_msg"); msg.className = "msg"; msg.textContent = "Leyendo archivo…";
  try {
    let rows;
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const XLSX = await arqLoadXLSX();
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: "" });
    } else {
      rows = arqParseCSV(await file.text());
    }
    rows = rows.filter(r => r && r.some(c => String(c).trim() !== ""));
    if (rows.length < 2) { msg.className = "msg err"; msg.textContent = "El archivo no tiene filas suficientes."; return; }
    // La fila de títulos es la primera con 3 o más celdas llenas (salta títulos grandes tipo "Historial de…")
    let hi = rows.findIndex(r => r.filter(c => String(c).trim() !== "").length >= 3);
    if (hi < 0) hi = 0;
    IMP_HEADERS = rows[hi].map(h => String(h).trim());
    IMP_ROWS = rows.slice(hi + 1);
    IMP_MAP = {};
    IMP_HEADERS.forEach((h, i) => {
      const n = h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (IMP_MAP.nro == null && /^(nro|n°|no|numero|#)$/.test(n)) IMP_MAP.nro = i;
      else if (IMP_MAP.fechapago == null && /fecha\s*(de\s*)?pago/.test(n)) IMP_MAP.fechapago = i;
      else if (IMP_MAP.nrorec == null && /n.?\s*recep|nro.?\s*recep|numero\s*recep/.test(n)) IMP_MAP.nrorec = i;
      else if (IMP_MAP.nrocom == null && /comprob|recibo/.test(n)) IMP_MAP.nrocom = i;
      else if (IMP_MAP.fecha == null && /fecha|^dia$|date/.test(n)) IMP_MAP.fecha = i;
      else if (IMP_MAP.hora == null && /hora/.test(n)) IMP_MAP.hora = i;
      else if (IMP_MAP.nit == null && /\bnit\b/.test(n)) IMP_MAP.nit = i;
      else if (IMP_MAP.idcli == null && /\bid\b|id\s*cliente|codigo/.test(n)) IMP_MAP.idcli = i;
      else if (IMP_MAP.cliente == null && /cliente|nombre|razon/.test(n)) IMP_MAP.cliente = i;
      else if (IMP_MAP.rubro == null && /rubro|presta\s*servicio/.test(n)) IMP_MAP.rubro = i;
      else if (IMP_MAP.celular == null && /celular|telefono|cel|whatsapp|movil/.test(n)) IMP_MAP.celular = i;
      else if (IMP_MAP.correo == null && /correo|email|mail/.test(n)) IMP_MAP.correo = i;
      else if (IMP_MAP.detalle == null && /detalle/.test(n)) IMP_MAP.detalle = i;
      else if (IMP_MAP.servicio == null && /servicio|concepto|descrip/.test(n)) IMP_MAP.servicio = i;
      else if (IMP_MAP.mespago == null && /mes\s*de\s*pago|mes\s*pago/.test(n)) IMP_MAP.mespago = i;
      else if (IMP_MAP.mesrec == null && /\bmes\b|mes\s*recep|mes\s*declar/.test(n)) IMP_MAP.mesrec = i;
      else if (IMP_MAP.mespago == null && IMP_MAP.mesrec != null && /^mes$/.test(n)) IMP_MAP.mespago = i; // 2da columna "MES" = mes de pago
      else if (IMP_MAP.anio == null && /^a.?o$|year|gestion/.test(n)) IMP_MAP.anio = i;
      else if (IMP_MAP.importe == null && /importe|monto|total|precio|cobro/.test(n)) IMP_MAP.importe = i;
      else if (IMP_MAP.metodo == null && /metodo|forma|tipo\s*de\s*pago|transfer/.test(n)) IMP_MAP.metodo = i;
      else if (IMP_MAP.atencion == null && /atenci|atendi|responsable/.test(n)) IMP_MAP.atencion = i;
      else if (IMP_MAP.comentarios == null && /coment|observ|nota|referencia/.test(n)) IMP_MAP.comentarios = i;
      else if (IMP_MAP.estado == null && /estado|situacion|entreg/.test(n)) IMP_MAP.estado = i;
    });
    msg.className = "msg ok"; msg.textContent = `✓ ${IMP_ROWS.length} filas leídas. Revisa el emparejamiento de columnas abajo.`;
    impRenderCfg();
  } catch (err) { msg.className = "msg err"; msg.textContent = "No se pudo leer: " + (err.message || err); }
}

function impRenderCfg() {
  const opt = sel => `<option value="-1">— ninguna —</option>` + IMP_HEADERS.map((h, i) => `<option value="${i}" ${i === sel ? "selected" : ""}>${escape(h || ("Columna " + (i + 1)))}</option>`).join("");
  const sample = IMP_ROWS.slice(0, 5).map(r => `<tr>${IMP_HEADERS.map((h, i) => `<td>${escape(String(r[i] == null ? "" : r[i]))}</td>`).join("")}</tr>`).join("");
  el("imp_cfg").innerHTML = `
    <div class="formcard">
      <h3 style="margin:0 0 6px">3) Empareja las columnas</h3>
      <p class="note" style="margin:0 0 10px">Dile al sistema qué columna de tu archivo corresponde a cada dato. Lo que no tengas, déjalo en "ninguna".</p>
      <div class="grid3">
        ${IMP_CAMPOS.map(c => `<div class="field"><label>${c[1]}</label><select data-imp="${c[0]}">${opt(IMP_MAP[c[0]] == null ? -1 : IMP_MAP[c[0]])}</select></div>`).join("")}
      </div>
      <div style="overflow:auto;margin:6px 0 12px"><table style="font-size:11.5px"><thead><tr>${IMP_HEADERS.map(h => `<th>${escape(h)}</th>`).join("")}</tr></thead><tbody>${sample}</tbody></table></div>
      <p class="note" style="margin:0 0 10px">Vista previa de las primeras filas. La importación <b>no</b> envía recibos por correo; solo guarda el historial.</p>
      <div class="grid2" style="margin:0 0 10px">
        <div class="field"><label>Importar solo desde esta fecha (opcional)</label><input type="date" id="imp_desde"></div>
        <div class="field"><label>Modo</label><select id="imp_modo"><option value="agregar">Agregar a lo que ya hay</option><option value="reemplazar">REEMPLAZAR: borrar la(s) gestión(es) del archivo y subir este archivo</option></select></div>
        <div class="field"><label>Evitar duplicados (solo en modo Agregar)</label><label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" id="imp_dedup" checked style="width:auto"> Saltar las filas que ya están en el sistema (misma fecha, hora, NIT y N° recepción)</label></div>
      </div>
      <button class="btn" id="imp_run">Importar ${IMP_ROWS.length} filas</button>
      <div class="msg" id="imp_runmsg"></div>
    </div>`;
  el("imp_cfg").querySelectorAll("[data-imp]").forEach(s => s.onchange = () => { IMP_MAP[s.dataset.imp] = Number(s.value); });
  el("imp_run").onclick = impRun;
}

async function impRun() {
  const msg = el("imp_runmsg");
  if (IMP_MAP.cliente == null || IMP_MAP.cliente < 0) { msg.className = "msg err"; msg.textContent = "Al menos empareja la columna de Cliente."; return; }
  const tipo = el("imp_destino").value;
  const estadoDef = el("imp_estado").value;
  const lote = "imp-" + Date.now();
  const get = (r, k) => {
    if (IMP_MAP[k] == null || IMP_MAP[k] < 0) return "";
    const v = r[IMP_MAP[k]];
    if (v == null) return "";
    if (typeof v === "number") {
      if (k === "fecha" || k === "fechapago") return impSerialFecha(v);
      if (k === "hora") return impSerialHora(v);
      if (k === "importe") return String(v);
      return String(v);
    }
    return String(v).trim();
  };
  const modo = (el("imp_modo") && el("imp_modo").value) || "agregar";
  // Construir documentos
  const docs = [];
  IMP_ROWS.forEach(r => {
    const nombre = get(r, "cliente");
    const impTxt = get(r, "importe");
    if (!nombre && !impTxt) return; // fila vacía
    const estRaw = get(r, "estado");
    const estado = impEstadoNorm(estRaw) || estadoDef;
    const servicio = get(r, "servicio");
    const detalle = get(r, "detalle");
    const metodo = get(r, "metodo");
    const nit = get(r, "nit");
    const fechaTxt = get(r, "fecha");
    docs.push({
      nro: get(r, "nro"),
      nroRecepcion: get(r, "nrorec"),
      nroComprobante: get(r, "nrocom"),
      fechaISO: arqDate(fechaTxt) || "",
      fecha: fechaTxt,
      hora: get(r, "hora"),
      clienteNombre: nombre,
      nit: nit,
      ultimoDigitoNit: nitUltimo(nit),
      clienteId: get(r, "idcli"),
      rubro: get(r, "rubro"),
      clienteCelular: get(r, "celular"),
      clienteCorreo: get(r, "correo"),
      servicio: servicio,
      servicioNombre: servicio,
      detalleServicio: detalle,
      mesRecepcion: get(r, "mesrec"),
      anio: get(r, "anio"),
      mesPago: get(r, "mespago"),
      fechaPago: arqDate(get(r, "fechapago")) || "",
      importe: arqNum(impTxt) || 0,
      metodoPago: metodo,
      tipoPago: metodo,
      atencion: get(r, "atencion"),
      comentarios: get(r, "comentarios"),
      tipo: tipo || recTipoDe(servicio, detalle),
      estado: estado,
      estadoDeuda: (/deudor/i.test(metodo) ? "con_deuda" : "sin_deuda"),
      reciboNro: get(r, "nrocom"),
      reciboEnviado: false,
      origen: "importado",
      importLote: lote,
      createdAt: serverTimestamp()
    });
  });
  if (!docs.length) { msg.className = "msg err"; msg.textContent = "No hay filas válidas para importar."; return; }
  const btn = el("imp_run"); btn.disabled = true;
  msg.className = "msg"; let done = 0;
  // Filtro por fecha "desde"
  const desde = (el("imp_desde") && el("imp_desde").value) || "";
  let porFecha = 0;
  if (desde) { const antes = docs.length; for (let i = docs.length - 1; i >= 0; i--) { if (!docs[i].fechaISO || docs[i].fechaISO.slice(0, 10) < desde) docs.splice(i, 1); } porFecha = antes - docs.length; }
  // Evitar duplicados: compara con lo que ya está en Firebase
  let repetidos = 0, borrados = 0;
  if (modo === "reemplazar" && docs.length) {
    const anios = [...new Set(docs.map(d => (d.fechaISO || "").slice(0, 4)).filter(Boolean))].sort();
    if (!anios.length) { msg.className = "msg err"; msg.textContent = "No se reconocen las fechas del archivo; no se puede reemplazar."; btn.disabled = false; return; }
    msg.textContent = "Revisando lo que hay en el sistema…";
    let aBorrar = [];
    try {
      const todos = await recSync(true);
      aBorrar = todos.filter(d => anios.includes(String(d.fechaISO || "").slice(0, 4)));
    } catch (e) { msg.className = "msg err"; msg.textContent = "No se pudo leer el sistema: " + (e.code || e.message); btn.disabled = false; return; }
    if (!confirm(`Vas a BORRAR ${aBorrar.length} recepciones de la gestión ${anios.join(", ")} y subir ${docs.length} del archivo.\n\nAntes se descargará un respaldo (.json) de lo borrado.\n\n¿Continuar?`)) { msg.textContent = "Cancelado. No se cambió nada."; btn.disabled = false; return; }
    // Respaldo
    try {
      const data = aBorrar.map(d => Object.assign({ _id: d.id }, d));
      const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `respaldo-recepciones-${anios.join("-")}-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {}
    try {
      const CHd = 20;
      for (let i = 0; i < aBorrar.length; i += CHd) {
        const lote_ = aBorrar.slice(i, i + CHd);
        await Promise.all(lote_.map(d => deleteDoc(doc(db, "recepciones", d.id))));
        rcQuitar(lote_.map(d => d.id));
        borrados += Math.min(CHd, aBorrar.length - i);
        msg.textContent = `Borrando lo anterior… ${borrados}/${aBorrar.length}`;
      }
    } catch (e) { msg.className = "msg err"; msg.textContent = `Error al borrar (${borrados} borrados): ` + (e.code || e.message) + ". Tienes el respaldo descargado."; btn.disabled = false; return; }
  } else if (el("imp_dedup") && el("imp_dedup").checked && docs.length) {
    msg.textContent = "Revisando qué registros ya existen en el sistema…";
    try {
      const existentes = new Set((await recSync()).map(d => impClave(d)));
      const vistos = new Set();
      for (let i = docs.length - 1; i >= 0; i--) {
        const k = impClave(docs[i]);
        if (existentes.has(k) || vistos.has(k)) { docs.splice(i, 1); repetidos++; } else vistos.add(k);
      }
    } catch (e) { msg.className = "msg err"; msg.textContent = "No se pudo revisar duplicados: " + (e.code || e.message); btn.disabled = false; return; }
  }
  if (!docs.length) { msg.className = "msg ok"; msg.textContent = `No hay nada nuevo que importar (${repetidos} ya estaban en el sistema${porFecha ? `, ${porFecha} fuera de la fecha elegida` : ""}).`; btn.disabled = false; return; }
  try {
    const CH = 20;
    for (let i = 0; i < docs.length; i += CH) {
      const chunk = docs.slice(i, i + CH);
      await Promise.all(chunk.map(async d => { d._upd = Date.now(); const ref_ = doc(collection(db, "recepciones")); await setDoc(ref_, d); rcPoner(ref_.id, d); }));
      done += chunk.length;
      msg.textContent = `Importando… ${done}/${docs.length}`;
    }
    IMP_LASTLOTE = lote; recepLoaded = false; LT_DATA = null;
    msg.className = "msg ok"; msg.textContent = (borrados ? `Se reemplazaron ${borrados} registros anteriores. ` : "") + `✓ ${done} registros nuevos importados.` + (repetidos ? ` ${repetidos} ya estaban y se saltaron.` : "") + (porFecha ? ` ${porFecha} eran anteriores a la fecha elegida.` : "");
    el("imp_result").innerHTML = `<div class="formcard">
      <h3 style="margin:0 0 6px">Importación lista ✓</h3>
      <p class="note" style="margin:0 0 10px">Se importaron <b>${done}</b> registros al destino elegido. Ya aparecen en Recepción, Dashboard y las listas.
      Si algo salió mal, puedes deshacer SOLO esta importación (borra exactamente esos ${done} registros).</p>
      <button class="btn danger" id="imp_undo" style="background:var(--danger);border-color:var(--danger)">Deshacer esta importación</button>
      <div class="msg" id="imp_undomsg"></div>
    </div>`;
    el("imp_undo").onclick = () => impUndo(lote, done);
  } catch (e) { msg.className = "msg err"; msg.textContent = "Error al importar: " + (e.code || e.message) + ` (se guardaron ${done}).`; }
  btn.disabled = false;
}

// Fechas/horas que vienen de Excel como número de serie
function impSerialFecha(n) {
  const d = new Date(Math.round((Math.floor(n) - 25569) * 86400000));
  const y = d.getUTCFullYear(), m = String(d.getUTCMonth() + 1).padStart(2, "0"), dd = String(d.getUTCDate()).padStart(2, "0");
  return `${dd}/${m}/${y}`;
}
function impSerialHora(n) {
  let s = Math.round((n - Math.floor(n)) * 86400); if (s >= 86400) s = 0;
  const h = Math.floor(s / 3600), mi = String(Math.floor((s % 3600) / 60)).padStart(2, "0"), se = String(s % 60).padStart(2, "0");
  return `${h}:${mi}:${se}`;
}
// Clave para detectar si una recepción ya existe
function impClave(r) {
  const f = String(r.fechaISO || "").slice(0, 10);
  const h = String(r.hora || "").trim().replace(/^0(\d:)/, "$1");
  const nit = String(r.nit || "").replace(/\D/g, "");
  const nro = String(r.nroRecepcion || "").trim();
  return [f, h, nit, nro].join("|");
}

async function impUndo(lote, n) {
  const msg = el("imp_undomsg"); msg.className = "msg"; msg.textContent = "Deshaciendo…";
  try {
    const ids = (await recSync()).filter(d => d.importLote === lote).map(d => d.id);
    let done = 0;
    const CH = 20;
    for (let i = 0; i < ids.length; i += CH) {
      await Promise.all(ids.slice(i, i + CH).map(id => deleteDoc(doc(db, "recepciones", id))));
      rcQuitar(ids.slice(i, i + CH));
      done += Math.min(CH, ids.length - i);
      msg.textContent = `Deshaciendo… ${done}/${ids.length}`;
    }
    recepLoaded = false;
    msg.className = "msg ok"; msg.textContent = `✓ Importación deshecha (${done} registros eliminados).`;
    el("imp_undo").disabled = true;
  } catch (e) { msg.className = "msg err"; msg.textContent = "No se pudo deshacer: " + (e.code || e.message); }
}


function escape(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }
