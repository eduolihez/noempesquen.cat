# Estado del proyecto

Última actualización: 2026-11-03 (todo mergeado en `master` y desplegado en producción el 2026-11-03: plugin y tema por wp-admin; incluye cortes A–F, 3C, tutorial con overlay, selector «Port» y login de `/admin/` con estilo propio)

## Dónde estamos

Se está rehaciendo el simulador para que parezca un ordenador y un móvil reales, a pantalla completa, con apps de marcas inventadas y la ayuda del juego integrada en el sistema (la guía es un contacto de Parla y la lupa es una herramienta del sistema). Diseño completo: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`.

| Fase / corte     | Contenido                                                                                                                                                                                           | Estado                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Fase 1 · corte 1 | Núcleo v2, PC simulado, Navegador, Parla, Posta, Llum Clara, misión «La factura de la llum»                                                                                                         | **Hecho** (merge a `master` el 2026-10-29, plan `docs/superpowers/plans/2026-10-29-fase1-corte1-pc-factura.md`) |
| Fase 1 · corte 2 | Sistema móvil (bloqueo, inicio, centro de control, banners), Missatges, Parla móvil, Navegador móvil, webs de Envia't; reescribir «El paquet retingut» a v2; **eliminar el legado v1** (`SIM/app/`) | **Hecho** (merge a `master` el 2026-10-30, plan `docs/superpowers/plans/2026-10-29-fase1-corte2-mobil-paquet.md`) |
| Fase 1 · corte 3 | Banc Sòlid (web real, web falsa, app, móvil vinculado en el PC) → «El banc et bloqueja el compte»; «Hola, he canviat de mòbil» en Parla | **Hecho** (merge a `master` el 2026-10-30, plan `docs/superpowers/plans/2026-10-30-fase1-corte3-banc.md`) |
| Fase 1 · corte 4a | Móvil: Galeria, Ajustos (con «Apagar»), Càmera, Calculadora, Rellotge, Ullada; web El Diari del Barri (`diaridelbarri.cat`); Roboto empaquetada; el validador comprueba apps por dispositivo (`apps/claus.js`) | **Hecho** (merge a `master` el 2026-10-30, plan `docs/superpowers/plans/2026-10-30-fase1-corte4a-farcit.md`) |
| Fase 1 · corte 4b | PC en móvil horizontal, selector rediseñado, sonidos reales, revisión visual a 4 anchos, `Esc` real manual, deudas menores | **Hecho** (merge a `master` el 2026-10-30, plan `docs/superpowers/plans/2026-10-30-fase1-corte4b-pulido.md`) |
| Fase 2 · corte 5a | Misiones «Has guanyat un sorteig!» (sorteo falso en Ullada, web Sorteig del Barri) y «Em passes el codi?» (robo del código de Parla) | **Hecho** (merge a `master` el 2026-10-30) (plan `docs/superpowers/plans/2026-10-30-fase2-corte5a-sorteig-codi.md`) |
| Fase 2 · corte 5b | Misiones «Compro la teva bici» (comprador falso en la app Revenda, web Revenda Cobra) y «El truc d'inversió» (anuncio falso en El Diari del Barri, web Invest Rapid) | **Hecho** (merge a `master` el 2026-10-30) (plan `docs/superpowers/plans/2026-10-30-fase2-corte5b-revenda-inversio.md`) |
| Fase 2 · corte 5c | Misiones «Virus detectat!» (pop-up de soporte técnico falso de Suport Segur Digital en la web Cuina Avui) y «Actualitza el navegador» (barra falsa de actualización en Temps Avui; comprobación en «Quant a Brúixola»); plantilla `article` con `avis`/`barra` y descarga ficticia | **Hecho** (merge a `master` el 2026-10-30) (plan `docs/superpowers/plans/2026-10-30-fase2-corte5c-suport-actualitzacio.md`) |
| Fase 3 · entrega 3A | Panel de misiones en WordPress (CPT `nep_missio` con editor del guion, diagnóstico en vivo, previsualización, plantilla, duplicado, importar/exportar), capacidades propias (`nep_gestiona_missions`, `nep_veu_estadistiques`), estadísticas anónimas por misión (tabla `nep_resultats`, k ≥ 10, datos demo con `wp nep demo-estadistiques`) y resumen público agregado en la pantalla de resultado | **Hecho** (merge a `master`, `bce1bcc`; plan `docs/superpowers/plans/2026-10-30-fase3a-panel-estadistiques.md`) |
| Fase 3 · entrega 3B | Cuentas opcionales con progreso en servidor (rol `nep_jugador`, consentimiento, borrado de datos) | **Hecho, mergeado, subido a `origin` y desplegado en producción (plugin, tema y `/compte/`)** (verificación final: lint:js 0 errores, lint:css ok, unit 755, PHPUnit 80 + integración, build ok, Playwright 284/0; plan `docs/superpowers/plans/2026-10-31-fase3b-comptes.md`) |
| Fase 3 · entrega 3C | Verificación de correo (aviso, sin bloqueo) y recuperación de contraseña: tokens de un solo uso, pantallas `/compte/?verifica=` y `?restableix=`, token fuera de la URL, `Referrer-Policy: no-referrer` | **Hecho, mergeado y desplegado (2026-11-03)** (plan `docs/superpowers/plans/2026-11-02-fase3c-verificacio-recuperacio.md`; decisiones en `docs/decisions.md`) |
| Pulido · corte A | Base de tiempos (`nucli/temps.js`, `avisos.js`), avisos escalonados con duración dinámica y salida animada, escala de capas y movimiento, tokens de color; hook `useCuaAvisos` | **Hecho en `master` (`84167ea`, 2026-11-01), desplegado en producción (2026-11-03)** (lint, unit 781, build ok; Playwright 297 pasan y 1 falla ajena: `resum-estadistiques.spec.js:107` cuenta filas acumuladas en la BD de wp-env; plan `docs/superpowers/plans/2026-10-31-pulit-interficies-i-tutorial.md`) |
| Pulido · corte B | Lupa replanteada: botón visible con contador «Indicis n/N», chip inline, cursor compartido, evento `lupa.activa` | **Hecho en `master` (`1245bf2`, 2026-11-01), desplegado en producción (2026-11-03)** (lint, unit 792, build ok; Playwright 299 pasan y 1 falla ajena) |
| Pulido · corte C | Tutoriales `tutorial-pc` y `tutorial-mobil` (`tutorial: true`, sin puntuación, saltables, grupo «Tutorial» en el selector, «Fet» y «Ja estàs a punt») | **Hecho en `master` (8d0be97, 2026-11-02), desplegado en producción (2026-11-03)** (lint, unit 816, build ok; Playwright 306 pasan, 0 fallos) |
| Tutorial con overlay | Tutoriales guiados paso a paso (`passos`, anclas `data-tut`, componente `GuiaTutorial`, ventanas del PC lado a lado, PC 22 pasos y móvil 16) más favicon propio y acceso al admin en `/admin` (`b0e112f`, ya desplegado en producción) | **Hecho, mergeado y desplegado (2026-11-03)** (lint 0 errores, unit 966, PHP 98, build ok; Playwright 348 pasan, 0 fallos; plan `docs/superpowers/plans/2026-11-02-tutorial-overlay.md`; textos pendientes de revisión de Edu) |
| Selector «Port» | Selector de misiones como puerto ilustrado (SVG + CSS animado): un barco por dispositivo (el Pesquer = PC con la Llissa, el Pirata = móvil con la Remei), zoom de cámara y mapa lineal de misiones con tutorial primero, nodos que saltan, hechos con estrellas y bloqueados con motivo; a pantalla completa de la ventana (botones «Surt», «Pantalla completa» y pausa de animaciones), escena con más luz, profundidad y agua, y un mapa con estética propia por barco (carta náutica diurna para el Pesquer, mapa del tesoro nocturno para el Pirata); Esc vuelve al puerto; al salir de una partida se abre el mapa de su barco. Plan `docs/superpowers/plans/2026-11-02-selector-port.md` | **Hecho, mergeado y desplegado (2026-11-03)** (ronda 2 verificada: lint 0 errores, unit 993, build OK, Playwright 399 pasan/0 fallan; pendiente: etiqueta larga de nodo bloqueado no cabe entera a 320×568 y 844×390; textos pendientes de revisión de Edu) |
| Pulido · corte E | Retardos en ms (`retard_ms`, el validador rechaza `retard`), puerta de intro (`MS_TRAS_INTRO`, solo avisos programados desde `inici`), mínimos por nivel, tono «alerta» en trampas; tabla en `docs/superpowers/plans/2026-11-02-retards-taula.md`. Cambio de ritmo: si la intro dura más de ~6,5 s los avisos de `inici` se desplazan en bloque | **Hecho en `master` (bd07d02, 2026-11-02), desplegado en producción (2026-11-03)** (lint 0 errores, unit 837, build y PHP ok; Playwright 305 pasan + 1 falla ajena `resum-estadistiques`) |
| Pulido · corte D | Toast del PC compacto (ya no tapa respuestas de Parla), cabecera de Parla móvil apaisada más baja, chip de lupa dentro de la barra móvil, tarjeta del bloqueo móvil dentro de pantalla. Comprobaciones finales (2026-11-02): barra de título táctil a 44 px reales, botón de entrada del bloqueo PC a 14 px reales, PC vertical 768x1024 escalado sin desbordamiento, banner móvil con fondo opaco (antes transparentaba la cabecera de la app abierta), reloj del bloqueo con pila de fuentes genérica. Sin pendientes | **Hecho en `master` (d87b923, 2026-11-02), desplegado en producción (2026-11-03)** (lint 0 errores, unit 837, build ok; Playwright 305 pasan + 1 falla ajena `resum-estadistiques`) |
| Pulido · corte F | Ilustración vectorial propia (trazo único azul mar, color plano, simétrica): Llissa y Remei con 4 estados (`ui/avatars.js`), pez de la home, hilo y anzuelo nuevos. Las 16 escenas de `ilustracions.js` se dejan como están (hacen de foto en las webs simuladas). Remei pierde el parche (chocaba con las gafas) | **Hecho en `master` (63bf70a) y desplegado en producción (2026-11-02)** (lint 0 errores, unit 837, build ok; Playwright 306 pasan) |
| Post-despliegue F | Log de la causa del rechazo del alta (`nep_compte_log_alta`, sin datos personales; el alta fallaba por usar el correo del admin, anti-enumeración), fuente genérica del reloj, banner móvil opaco | **Hecho en `master` (`09ced1a`, `990a9f0` y el commit del banner), desplegado en producción (2026-11-03)** |
| Vídeos de concienciación | Página `/videos/` · `/ca/videos/` con galería de tarjetas y una página hija por vídeo (mismo slug en ES y CA, sin CPT): bloques dinámicos `noempesquen/video` (`<video controls>` nativo, subtítulos ES/CA con `<track>`, transcripción desplegable, enlace a una misión) y `noempesquen/galeria-videos`; `.vtt` aceptado en la biblioteca; hreflang, selector de idioma y sitemap para las hijas; migración de páginas v2; `wp nep demo-videos` crea las páginas demo; tests e2e ES/CA (`tests/e2e/videos.spec.js`, `tests/e2e/es/videos.spec.js`) con axe, teclado, sin terceros ni cookies, 4 anchos y `prefers-reduced-motion`. Guía en `docs/afegir-un-video.md` | **Hecho en la rama `feat/videos` (sin mergear a `master`)** (unit 1057, PHPUnit 184 + integración, build ok, lint:css ok, lint:js solo los 2 prettier previos de `Acces.js`; Playwright ES 36/0 y CA 405 pasan + 1 falla `panel-missions.spec.js:132`, que ya fallaba en solitario sin las páginas demo) |
| Fase 3 · IA | IA, voz o llamadas | Fuera de alcance por ahora |

## Cómo retomar

1. `npm install`, `npm run build`, `npm run env:start`. Si `/simulador/` da 404, la migración de páginas debería haberla creado (ver `docs/despliegue-i18n.md`); si no, guarda los enlaces permanentes en wp-admin.
2. Para un corte nuevo, el flujo que se ha seguido es: plan en `docs/superpowers/plans/AAAA-MM-DD-<corte>.md` (skill `superpowers:writing-plans`) → aprobación del usuario → rama `feat/...` → ejecución con subagentes y revisión por tarea (skill `superpowers:subagent-driven-development`) → revisión final de rama → merge a `master` cuando el usuario lo confirme.
3. El usuario quiere: máximo realismo, marcas inventadas, pantalla completa, sensación de libertad (apps y contenido de relleno que funcionan), público general. Las decisiones de la misión pueden tomarse dentro del mundo (denunciar, borrar, bloquear...) o en el chat con la guía.

## Internacionalización ES (raíz) y CA (`/ca/`) · rama `feat/i18n`

Estado a 2026-11-03. Sin mergear a `master`.

**Hecho**

- Idioma por URL, `html lang`, hreflang/canonical/`og:locale:alternate` y sitemaps por idioma (T10).
- Catálogo ES: 873 cadenas (`noempesquen-es_ES.po`, `.mo` y JSON por script). Partes por área en `languages/parts/`.
- Misiones en `missions/es/` y `missions/ca/` (12 cada una + `mon.json`), validador `npm run missions:valida`.
- Tema: 8 patterns con textos ES/CA, plantillas por slug, selector de idioma (`docs/i18n-tema.md`).
- Migración de páginas idempotente al activar o en `init` (`docs/despliegue-i18n.md`).
- Tests: unit y PHP en verde en su momento; Playwright ES de páginas y recorrido de escritorio en verde; suite CA lanzada en T11.

**Queda**

- Revisión humana de las traducciones (Edu). Pendientes concretos: estilo del estafador en `remei-02` (sin ¿ ni tildes), botón de `llissa-04` que pasa de 24 a 34 caracteres, «Brúixola» sin traducir, correo de contacto al admin en catalán (interno), `/admin/` sin selector de idioma.
- Recorrido móvil en ES: `tests/e2e/es/recorregut.spec.js:195` está en `test.fixme`. Posible bug real: en ES no aparece el botón «Parla» en el dock. Investigar.
- Decisión de Edu: enviar `/wp-sitemap.xml` a Search Console (el `/sitemap.xml` de TSF desaparece).
- Decisión de Edu: nombre del selector («Castellano» o «Español»).
- 301 sin verificar en wp-env (no hay `.htaccess` en local). Comprobar en producción con el orden de `docs/despliegue-i18n.md`.
- Despliegue: zip → migración → smoke sin 301 → 301 → purga Varnish → smoke completo.
- Pendiente de código: `PENDENT.md` de `missions/es/` no existe en el repo (TODO); bundle +~100 KB (valorar `import()` por idioma); aviso de idioma del simulador siempre en catalán; `Vary: X-Nep-Lang` ya está en las respuestas REST.

## Pendientes conocidos

### Pendiente tras la página de vídeos (rama `feat/videos`)

- Sustituir el vídeo de muestra (póster plano, 6 s) por vídeos reales y revisar sus transcripciones (textos pendientes de revisión de Edu).
- Antes de subir vídeos reales a Dinahosting: comprobar el límite de subida y que ninguna CSP bloquee `media-src` (ver `docs/afegir-un-video.md`).
- Al mergear y desplegar: la migración v2 crea `videos` y `ca/videos` al cargar wp-admin; no ejecutar `wp nep demo-videos` en producción. Tras desplegar, enviar `/wp-sitemap.xml` de nuevo en Search Console.

### Entrega 3B · cuentas opcionales (desplegada)

Hecho (commits de la rama):

- T01 `ca999f6` rol `nep_jugador`, bloqueo de wp-admin y limpieza en `uninstall`; `4b49a4e` tests de jugador en `test:php`.
- T02 `3cb44e3` validación y fusión de progreso por máximo (módulos puros).
- T03 `6620981` endpoints REST (registro, entrada, progreso, exportación, borrado); `aebadb7` pruebas de integración.
- T04 `5c4b191` exportador y borrador de datos personales.
- T05 `4f1b1de`, `3584f23`, `6f6bf47`, `f696044` cliente de API, bloque de cuenta (`/compte/`) y e2e.
- T06 `b3225bf`, `dd2da99`, `9eb8f86`, `ef5f52c` sincronización del progreso del simulador con la cuenta y e2e.

Ronda de arreglos hecha (T08a y T08b: endurecimiento de login, alta y borrado; `/wp/v2/users*` y contraseñas de aplicación cerradas para jugadores; progreso local borrado al salir). Verificación final hecha (ver tabla).

Antes de producción:

- Despliegue hecho (2026-10-31): plugin reemplazado desde wp-admin, rutas `/compte*` activas en la REST, página `/compte/` (ID 11) creada por REST y 200 con el bloque. `is_ssl()` comprobado: las galletas salen `Secure`. Sin probar el alta real en producción (crearía un usuario). Tema actualizado después (el formulario de wp-admin redirigía a `about.php` sin completar el paso «Reemplaça l'instal·lat»; se completó el paso por fetch). El menú de la home ya enlaza «Simulador» y «El meu compte».
- ~~`nep_ip_client` detrás de Varnish~~: resuelto en el cierre de 3A (Apache registra la IP real, el límite por IP no es global).
- Comprobar que `is_ssl()` es cierto detrás del proxy (galeta `Secure`).
- Crear la página `/compte/` a mano (README).

Pendiente tras 3B:

- ~~Verificación de email y recuperación de contraseña~~ -> hecho en 3C (rama sin mergear). Antes de desplegar: probar un correo real en producción y configurar SPF/DKIM/DMARC (Edu).
- Gestión de jugadores desde wp-admin (hoy el rol no tiene acceso).
- Probar un alta/borrado real en `/compte/` con una cuenta de prueba y un correo distinto al del admin (lo hace Edu: crear cuentas y contraseñas no lo hace Claude).
- `uninstall.php` en multisite sigue sin probar.

### Pendiente tras la entrega 3A

- Despliegue: `npm run build && npm run empaqueta` deja en `dist/` las carpetas `wp-content/plugins/noempesquen-core` y `wp-content/themes/noempesquen` más un zip por pieza (con `build/`, sin `src/`, `tests/`, `phpunit.xml.dist`, `.distignore` ni `missions/test-fixtures/`). - Despliegue de prueba hecho (2026-10-31) en `noempesquen.cat` (Dinahosting, sin Cloudflare, sin staging): zips subidos desde wp-admin (Plugins/Temas > Añadir), plugin y tema activados sin errores, página `/simulador/` (ID 9) publicada con el bloque. Comprobado desde fuera: `/simulador/` 200 sin `Cache-Control` agresivo; `GET /resultat/resum` 200 con `Cache-Control: public, max-age=3600` (el servidor no lo reescribe); `src/` y `tests/` del plugin dan 404; los `.php` por URL directa responden 200 con 0 bytes (guarda `ABSPATH` / `WP_UNINSTALL_PLUGIN`); selector de misiones renderiza, assets `build/` 200; consola sin errores propios (solo un `ViewTransition` del tema/navegador).
- Cierre del despliegue (2026-10-31, comprobado por SSH en solo lectura): `POST /resultat` real con 204 en el log de Apache; tabla `wp_nep_resultats` creada y `nep_db_version` = 3; en producción hay 2 filas reales de prueba (una partida jugada y un envío manual, misión `llissa-01-factura`). Varnish está activo, con `wp-json`, `wp-admin` y `wp-login.php` excluidos de la caché; Apache registra la IP real del cliente, así que el límite por IP no se comparte (no hace falta el filtro `nep_ip_client`). El log de errores solo trae `AH01630` de bots contra `xmlrpc.php`. Aviso: la extensión de Chrome mostró un 503 falso al medir el `fetch` con `keepalive`; fiarse del log del servidor.
- Sin probar: `uninstall.php` en multisite.
- Resumen público: sin rate limit a propósito (solo caché de 1 h; las misiones desconocidas dan 404 sin tocar la BD); si la celda propia del jugador tiene menos de 10 partidas, la frase usa la banda de la opción más elegida.
- Diagnóstico del editor: mensajes legibles ya para `notifica`, `mostra`/`visible`, `bloqueja`/`denuncia`, formularios y `parla`; «Ves-hi» sigue apuntando a la primera aparición del valor en los casos que no tienen clave propia.
- Menores: `diagnostic.js` sin `__()`; guardia de `nep_dispositiu`/`nep_personatge` en publicadas; límite 512 KB distinto en pre_insert y meta; `delete_all` ignorado en la guardia de borrado; el aviso demo sale si hay filas demo de cualquier fecha; `panel-missions.spec.js` no pasa prettier; un Editor-estadísticas sin `nep_gestiona_missions` no abre el menú padre.

### Pendiente tras el corte 4b

- Hecho a mano el 2026-10-30: `Esc` real en Chrome visible y prueba en móvil horizontal.
- Deudas de accesibilidad y tamaño aceptadas (target-size en apps a escala ~0,57, texto ~8 px a 768×1024, borde de botones 1,3:1, estrellas del selector con lector de pantalla, CSS 251 KiB): detalle en `docs/decisions.md`.
- `agrupa.js` usa `DATA_MON='2026-10-29'` fija (mejor `mon.avui` validado); `cerca:` pasa el validador pero es inerte en enlaces de mensaje.

### Pendiente tras el corte 2

- ~~La barra de tareas del PC desborda a ~400 px~~ (resuelto en 4b con el PC escalado).
- Sin tests propios para el `Esc` con `prefers-reduced-motion` de `usePista.js` ni para el `MutationObserver` de `aillament.js`.
- Menores: `IconaCadenat` vive en `llum-clara/Marca` y lo importa `webs/comu`; Envia't reutiliza estilos `nep-lc-*`; el `role="status"` de la web oficial de Envia't debería estar siempre en el DOM; `reset`/`enfocaAdreca` duplicado entre `Navegador` y `NavegadorMobil`; reabrir el mismo xat de Parla no recoloca el foco; el banner de Missatges abre la lista, no la conversación.

### Pendiente tras el corte 3

- Penalización parcial por entregar usuario, contraseña y DNI en la web falsa del banco (hoy solo penaliza enviar el código SMS); exige un efecto nuevo en motor y `valida.js`.
- Parla: `bloquejats`, `enviats` y `descartat` viven en estado local y se pierden al desmontar la app en móvil. La respuesta de Pau no lleva retardo (con retardo se cancelaría la decisión). `NOTIFICACIONS_LLEGIDES` con app `parla` marca también las de móvil.
- Sin test dedicado del timeout de respaldo de `Bloqueig.js` (solo lo cubre el e2e) ni comprobación visual del anillo de foco doble.
- Dominios `bancsolid.cat` y `bancsolid-acces.top` son registrables por terceros (riesgo bajo; opción: subdominio propio de noempesquen.cat).
- Borrar el correo del banco cierra la misión como parcial y ya no se puede marcar phishing (decisión de diseño, fijada en test).
- Menores: error genérico «Omple aquest camp.» en formularios comunes, `h1` fijo en la web del banco, `Object.freeze` de `ESDEVENIMENTS_FORMULARI`, falta test de `codi.envia` con url no coincidente, reutilizar `formulari.js` en la transferencia de la app.

### Pendiente tras el corte 5c

- `Esc` con el menú del navegador abierto y la ventana minimizada: revisar el orden de cierre.
- Contraste de `#137333` en `_navegador-menu.scss` por verificar con axe.
- `MenuNavegador` usa el `document` global para `pointerdown`, mientras `AvisFals` y `DescarregaFicticia` usan `ownerDocument`.
- El `onBlur` del menú del navegador con `relatedTarget` null no lo cierra.
- Avís y diálogo de descarga apilados sin `inert` sobre la capa de debajo.
- `cuinaravui.cat` y `tempsavui.cat` son dominios `.cat` registrables (riesgo bajo, como `bancsolid.cat`).
- Los campos `senyal_*` no se validan como string (un valor no textual se ignora en silencio).
- El `retard_ms` del avís (en ms) se redondea hacia arriba a segundos de juego.
- Elegir «a» sin indicios da 1★ en M9 y 2★ en M10 (coherente con M8).
- Abrir el diálogo de descarga no emite ningún evento: las señales que solo se ven ahí (`origen_top`, `exe_top`) llevan `requereix` con el id del disparador `descarrega.fes`.

### Pendiente tras el corte 5b

- Unicidad de ids ya validada (anuncios de Revenda, xats, mensajes y anuncios del Diari frente a Ullada); no queda nada por hacer.
- M3: exigir señales encontradas para que la decisión «correcta» puntúe completa.
- M7: extraer una `Conversa` compartida entre Parla y Revenda.
- Funciones nuevas propuestas: comprador honesto / anuncio legítimo (contraste), búsqueda con aviso de estafa en el navegador y variante «reembolso al revés» (te pagan de más y piden devolver).
- Revisar las horas de los mensajes de `remei-04` y `remei-05` frente al reloj del juego.
- `.nep-lc-boto` hereda los colores de Llum Clara en las webs nuevas (`cobrament`, `inversio`).
- `revenda-cobra.com` no carga en el navegador del PC desde `llissa-03`.
- Bloqueo compartido por id entre apps: hoy no está unificado.
- La opción «c» de `remei-05` no marca `pescat` en el motor.

### Pendiente tras el corte 5a

- `Publicacio`: el estado «denunciada» es local y se pierde al desmontar; subirlo al estado del motor o de Ullada.
- Validar cruces disparador↔mundo: `publicacio.denuncia` con `id` de publicación existente y `codi.comparteix` con un SMS que contenga código.
- Extraer la decisión de `codi.comparteix` a una función pura testeable (hoy solo la cubre el e2e).
- Limitación: no se detectan códigos troceados ni dichos con palabras; sería una función nueva (documentado en `docs/format-missions.md`).
- `role="status"` de la denuncia en `Publicacio` se monta solo al denunciar; si algún lector no lo anuncia, dejar un único contenedor live en Ullada.

### Pendiente tras el corte 4a (para 4b)

- `propsEnllac` debería validar esquema http/https si las URLs vinieran de una misión.
- `agrupa.js` (Galeria): «Avui»/«Ahir» sin `__()` y con fecha real; cadenas de `Subpantalla` sin `__()`; infinitivos e imperativos mezclados entre apps; `<h1>` en Ullada y `<h2>` en las demás.
- El Diari: todas las secciones enlazan a la portada; ilustración con `role=img` duplica el título; portada sin mensaje si `mon.diari` está vacío.
- Ullada: `split` de `nom` sin guarda, nombre del jugador fijo, borde `is-buida` a 2,7:1. Càmera: comprobar contraste de estados deshabilitados.
- `validaMon` solo se usa en tests. `assets/fonts/README.txt`: añadir procedencia (@fontsource/roboto 5.1.0).

### Antes de abrir la creación de misiones v2 desde el panel (CPT)

- Resueltos: `validaMissio` no lanza con entradas malformadas (test `valida-robustesa.test.js`) y rechaza `apps`/`webs` no objeto; `llegeixProgres` devuelve `{}` si lo guardado no es objeto y descarta valores no numéricos.
- Las misiones remotas v1 o inválidas se ignoran en el juego, pero `diagnostica(remotes, mon)` (`nucli/missions.js`) devuelve cuáles y por qué; el panel/CPT de la Fase 3 debe usarla al guardar y mostrar los errores. La validación está protegida con `try/catch`.

### Mejoras menores anotadas

- Hora de los mensajes de Parla: se calcula cuando Parla ve el mensaje por primera vez; sería más fiel guardar el tiempo de juego en el propio mensaje.
- Orden de tabulación de las ventanas según apertura, no según cuál está delante; la posición de las ventanas no se reajusta al redimensionar.
- Sin _error boundary_ si falla la carga de un trozo de JS (sistema, app o web).
- Navegador: pulsar Enter con la misma URL duplica el historial; `Esc` en la barra de direcciones no restaura el texto.
- Faltan e2e del teclado en la tira de pestañas y tests de componente de Consecuencia/Resultado.

## Rediseño estético «Llotja» (2026-10-31, desplegado)

Dirección lonja: azul de caja de pescado, rojo aviso, amarillo de lote; rótulos Big Shoulders y texto Atkinson Hyperlegible (OFL, locales en `themes/noempesquen/assets/fonts/`). CSS en `assets/tema.css`; plantillas en `templates/`. `PRODUCT.md` recoge el contexto.

Pulido posterior (desplegado el 2026-10-31, tema subido por wp-admin y comprobado en producción: `/compte/` con rótulo y `h1`, `tema.css` con las reglas nuevas): cabecera sin «Entra a jugar» duplicado, menú en tablet alineado a la izquierda, el hilo del anzuelo ya no cuelga del botón en móvil, cebo de la portada más grande, plantilla `page-compte.html` con rótulo y `h1`, sin sombra dura en `.nep-nota`.