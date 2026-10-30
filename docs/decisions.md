# Decisions del projecte

- **Plataforma:** WordPress (requisit del tutor), tema de blocs i plugin propis, sense constructors.
- **Simulador:** bloc de Gutenberg amb React de WordPress; missions com a tipus de contingut amb guió JSON.
- **Personatges:** la Llissa (ordinador) i la Pirata Remei (mòbil).
- **Sense IA de moment:** el comprovador funcionarà amb regles i plantilles en català.
- **Comptes d'usuari (revisat 2026-10-30):** opcionals i només a l'entrega 3B de la Fase 3 (comptes natius de WordPress, rol `nep_jugador`, formulari fora de la carcassa del simulador, consentiment explícit amb casella de 14 anys). Fins llavors el progrés es desa al navegador; al servidor només hi ha estadístiques agregades i anònimes (sense `user_id` ni IP).
- **Límit d'enviaments de `/resultat` (2026-10-31):** no és «sense IP». Per comptar enviaments es guarda un transient `nep_rl_*` amb clau `HMAC-SHA256(IP, sal auth del lloc + sal diària)` que caduca en ≤ 1 h; és seudonimització transitòria, no anonimització, i no es relaciona amb les files de la taula. La desinstal·lació esborra aquests transients.
- **Entorn local:** wp-env (Docker). Sense staging a Dinahosting.
- **Seguretat del servidor:** capçaleres a `.htaccess`, XML-RPC bloquejat, CSP en mode informe fins que el simulador sigui estable.
- **Simulador realista (2026-10-29):** ordinador i mòbil simulats a pantalla completa, amb apps de marques inventades i llibertat aparent. Disseny a `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`; estat a `docs/estat-del-projecte.md`.
- **Ajuda integrada:** la guia és un contacte de Parla (notificacions i xat) i la lupa és una eina del sistema; no hi ha barres de joc a sobre.
- **Decisions dins del món:** denunciar, esborrar o bloquejar dins les apps compta igual que triar l'opció al xat. Obrir l'enllaç trampa no és «pescat»; ho és enviar dades o pagar.
- **El dispositiu és de l'Àlex Puig** (nom neutre); la Llissa i la Remei són contactes.
- **Missions v2:** només es juguen missions `versio: 2`; les remotes del CPT es combinen per `id` amb les incloses.
- **Per talls:** cada tall s'entrega jugable de principi a fi.
- **Roboto local (corte 4a):** empaquetada en `assets/fonts/` (woff2 latin 400/500/700), licencia Apache-2.0 (`LICENSE-Roboto.txt`); sin CDN.
- **Apps de relleno no emiten eventos:** no afectan al motor ni a la puntuación; solo dan sensación de libertad.
- **Sons (corte 4b):** Web Audio sintetizado, sin ficheros; suena solo tras una interacción, nunca en pausa ni en la petición de girar, y la preferencia `noempesquen-sons` se cambia desde Ajustos y desde la Pausa. Lo que llega durante pausa/girar se marca visto y no suena al reanudar (en la práctica no llega nada: el TICK está parado).
- **`apps/claus.js`** es la fuente de verdad de los ids de app por dispositivo; el validador de misiones la importa.
- **`diaridelbarri.cat`** se resuelve por defecto a la plantilla `diari`; una misión puede sobrescribirlo declarando la web.

## Corte 4b · pulido (2026-10-30)

- **D3 · tamaño de diseño del PC: 1280×720.** Bajar a 1024×576 solo sube la escala a 0,63-0,75 en móviles de 360-430 px de alto y no llega a 24 px de target-size.
- **PC en pantalla pequeña:** modo `normal` (≥1280×720), `escalat` (transform sobre un contenedor 1280×720) y `girar` (petición de girar el móvil o ampliar la ventana; el PC queda `inert` y el TICK parado). Se mide con `window.innerWidth/innerHeight` (layout viewport), no con `visualViewport`: el teclado o el zoom no deben reescalar.
- **Táctil:** `--so-tactil` y `--so-objectiu` solo bajo `.is-escalat.is-tactil`; el modo normal no cambia aunque la pantalla sea táctil.
- **Selector** agrupado por dispositivo, con «recomanada», estrellas y orden por progreso; `PantallaSistema.js` (no `Pantalla.js`, colisiona con `pantalla.js` en Windows).
- **Playwright:** tercer proyecto `mobil-horitzontal` (Pixel 7 en landscape). Capturas visuales sin baseline en `test-results/visual/`.
- **`.claude/`** va a `.gitignore` (orquestación y registros locales).

### Deudas aceptadas

- target-size en el contenido de las apps a escala ~0,57 (cerrar pestaña 13,7 px, nueva pestaña 16 px, barra de Posta 20,6 px): sigue el filtro `greusAxePc` en `tests/e2e/ajudes.js`. Propuesta: objetivos ≥42 px lógicos con `.is-tactil`.
- Texto del PC ~8 px reales a 768×1024 (escala 0,6); toast de Posta tapa una respuesta de Parla ~6 s en 915×412.
- Borde de botones del sistema ~1,3:1 (WCAG 1.4.11, global).
- Estrellas del selector (`role="img"` dentro de button) solo llegan por `aria-describedby`: verificar con lector de pantalla.
- CSS 128 KiB / entrypoint 251 KiB (aviso de webpack > 244 KiB): recortar CSS.
