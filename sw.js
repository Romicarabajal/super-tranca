/* ==========================================================
   Súper Barrio · Service worker (sw.js)
   Es un "portero" que se ubica entre la app y internet.
   Guarda una copia de la app para que abra sin conexión.
   ========================================================== */

// VERSION: el "número de edición" de la app.
// Cada vez que publiques cambios, cambialo ("v3" → "v4") para que los celulares se enteren.
const VERSION = "v3";

// NOMBRE_CACHE: el nombre de la "caja" donde se guardan las copias.
// Como incluye la versión, cada edición tiene su propia caja.
const NOMBRE_CACHE = "super-barrio-" + VERSION;

// ARCHIVOS: la lista de todo lo que la app necesita para abrir sin internet.
// Usamos rutas con "./" (relativas) porque la app vive dentro de una subcarpeta de GitHub Pages.
// OJO: solo van archivos que existen de verdad. Si uno falta, la instalación entera falla.
// (El CSS de esta app está dentro de index.html, por eso no hay un styles.css en la lista.)
const ARCHIVOS = [
  "./",                // la carpeta de la app (la dirección sin escribir index.html)
  "./index.html",      // la página principal (con el CSS adentro)
  "./app.js",          // la lógica de la app
  "./manifest.json",   // el documento de identidad de la app
  "./icono-192.png",   // ícono chico
  "./icono-512.png"    // ícono grande
];

// ----------------------------------------------------------
// EVENTO INSTALL: ocurre una sola vez, cuando el navegador
// descubre este service worker por primera vez (o una versión nueva).
// ----------------------------------------------------------
self.addEventListener("install", function (evento) {
  // waitUntil: "esperá a que termine esto antes de dar por instalado el service worker".
  evento.waitUntil(
    // caches.open: abre (o crea) la caja con el nombre de esta versión.
    caches.open(NOMBRE_CACHE).then(function (cache) {
      // addAll: descarga cada archivo de la lista y guarda una copia en la caja.
      return cache.addAll(ARCHIVOS);
    })
  );
});

// ----------------------------------------------------------
// EVENTO ACTIVATE: ocurre cuando esta versión empieza a trabajar,
// es decir, cuando reemplaza a la anterior.
// ----------------------------------------------------------
self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    // caches.keys: pide el nombre de todas las cajas que hay guardadas.
    caches.keys().then(function (nombres) {
      // Promise.all: espera a que se terminen de borrar todas las cajas viejas.
      return Promise.all(
        nombres
          // Nos quedamos solo con las cajas de esta app que NO son la de la versión actual.
          .filter(function (nombre) {
            return nombre.indexOf("super-barrio-") === 0 && nombre !== NOMBRE_CACHE;
          })
          // Y las borramos, para no acumular copias viejas.
          .map(function (nombre) {
            return caches.delete(nombre);
          })
      );
    }).then(function () {
      // clients.claim: empieza a atender enseguida las pantallas que ya están abiertas.
      return self.clients.claim();
    })
  );
});

// ----------------------------------------------------------
// EVENTO FETCH: ocurre cada vez que la app pide un archivo
// (index.html, app.js, un ícono...). Estrategia "primero la caché".
// ----------------------------------------------------------
self.addEventListener("fetch", function (evento) {
  // Solo nos ocupamos de los pedidos de lectura (GET); el resto pasa sin tocar.
  if (evento.request.method !== "GET") return;

  // respondWith: "yo me encargo de contestar este pedido".
  evento.respondWith(
    // caches.match: busca el archivo pedido en las copias guardadas.
    caches.match(evento.request).then(function (copia) {
      // Si hay copia, se entrega al instante (por eso anda sin internet).
      // Si no hay (devuelve undefined), lo busca en internet con fetch.
      return copia || fetch(evento.request);
    })
  );
});
