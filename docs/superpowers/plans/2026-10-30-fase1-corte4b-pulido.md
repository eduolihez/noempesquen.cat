# Fase 1 · corte 4b — Libertad aparente y pulido (parte 2)

Fecha: 2026-10-30 · Escala: L · Spec: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md` · Rama: `feat/fase1-corte4b-pulido`

## Objetivo

Cerrar la Fase 1:

1. Una misión de PC se puede jugar en un móvil en horizontal (escritorio a 1280×720 lógicos escalado, objetivos táctiles de 44 px reales). Arregla el desborde de la barra de tareas a ~400 px.
2. El selector de misiones pasa a ser una pantalla de diseño propio, fuera del sistema simulado, que recomienda primero las misiones del dispositivo en uso.
3. Las notificaciones suenan (tonos con Web Audio, sin assets con copyright) y respetan `noempesquen-sons`.
4. Revisión visual a 1440, 1024, 768 y 400 px con comprobaciones automáticas (desborde, axe, objetivos táctiles) y correcciones.
5. Deudas menores baratas y de bajo riesgo.

## Estado actual relevante

- `SIM/simulador/App.js`: contiene `Selector`, `useEsMobil` (`max-width: 767px`) y `preferit`. Tarjetas `.nep-targeta*` en `SIM/style.scss`.
- `SIM/simulador/Simulador.js`: carcasa. Renderiza `<Sistema />` (lazy `pc/Pc` o `mobil/Mobil`) en `.nep-so__sistema`. Gestiona TICK de 1 s, pantalla completa, `registraMenu` y `Esc`. No hay concepto de «tamaño lógico».
- `estils/_pc.scss` y `_pc-barra.scss`: barra de 48 px fijos; `&__finestres` y `&__capa` usan `inset: 0 0 48px`.
- `sistemes/pc/Finestra.js`: arrastre con deltas de puntero en píxeles de pantalla (hay que dividir por la escala).
- `Toasts` (PC) y `Banners` (móvil) detectan notificaciones nuevas con `vistes`, cada uno con sus reglas.
- `apps/ajustos/preferencies.js`: `CLAU_SONS`, `llegeixSons`, `desaSons`. Nadie lo lee para sonar.
- Los e2e de PC (`factura.spec.js`, `banc.spec.js`) hacen `test.skip( isMobile, 'PC en mòbil: tall 4' )`.
- `tests/e2e/ajudes.js` ya tiene `greusAxe`, `petits` (≥ 44 px), `iniciaMissio`, `escoltaFuites`.
- Ya resueltas (se quitan de `estat-del-projecte.md`): `IconaCadenat` vive en `webs/comu/icones.js`; `assets/fonts/README.txt` cita @fontsource/roboto 5.1.0.

## Decisiones (confirmadas con el usuario el 2026-10-30)

| # | Decisión |
|---|---|
| D1 | Escalan los PC en cualquier viewport menor de 1280×720, con un único camino de código. |
| D2 | PC en vertical (`h > w` y `w < 768`): mensaje «Gira el mòbil» / «Amplia la finestra»; el PC sigue montado (`inert`) y el TICK se para. `screen.orientation.lock` opcional, best-effort, en `try/catch`. |
| D3 | Mínimo lógico 1280×720 (spec). Si T7 muestra texto ilegible, se baja a 1024×576. |
| D4 | Interruptor «So» en el diálogo de `Pausa` (PC y móvil). |
| D5 | Suena una vez por tanda de notificaciones nuevas, también con la app en primer plano; no en bloqueo ni en pausa. |
| D6 | Selector: secciones por dispositivo, tarjeta «Continua per aquí» y nota «Millor en horitzontal». |
| D7 | Entran las 9 deudas de T8; el resto se difiere. |
| D8 | Capturas a 4 anchos en `test-results/`, sin baseline; los fallos reales rompen el test. |

Reglas transversales: lógica nueva en módulos puros sin JSX (`pantalla.js`, `selector.js`, `so-notificacio.js`); Web Audio con pico ≤ 0,12 y ≤ 600 ms; el `AudioContext` se crea tras la primera interacción; el sonido no sustituye al aviso visual (WCAG 1.4.1); `Esc` real manual no es código.

## Arquitectura

```
App.js ──► Selector.js (nuevo, usa nucli/selector.js)
Simulador.js ──► useSoNotificacions() ◄── estat.notificacions + estat.pausa + llegeixSons()
     │              └─ so-notificacio.js (puro) → tones.js (Web Audio)
     └─ <Pantalla dispositiu="pc"> (simulador/Pantalla.js)
            ├─ pantalla.js (puro): calculaPantalla({ w, h, tactil, dispositiu })
            │     → { mode: 'normal' | 'escalat' | 'girar', escala, ample, alt, desplX, desplY }
            ├─ 'girar'   → <PeticioGirar /> encima; PC montado con inert
            └─ 'escalat' → div 1280×720 con transform: scale(escala) y --so-escala
```

## Tareas

Orden: `T0 → T1 → (T2 ‖ T4 ‖ T6 ‖ T8) → T3 → T5 → T7 → T9 → T10`. Los ficheros compartidos (`Simulador.js`, `App.js`, `style.scss`, `_pc*.scss`, `playwright.config.js`) los toca solo la tarea dueña.

### T0 · Rama y estado
- Rama `feat/fase1-corte4b-pulido` desde `master` (hecho). Corregir `docs/estat-del-projecte.md`: 4a y 3 «Hecho, mergeado».
- Hecho cuando: línea base verde con salida real (lint, test:unit, build, Playwright: 80 OK a 2026-10-30).

### T1 · Módulos puros
Dueña de `SIM/simulador/pantalla.js`, `SIM/nucli/selector.js`, `SIM/simulador/so-notificacio.js` y sus tests. Sin JSX.
- `pantalla.js`: `MINIM = {1280, 720}`. Móvil → normal; PC ≥ 1280×720 → normal; PC `h > w && w < 768` → `girar`; resto → `escalat` con `escala = min(w/1280, h/720)` a 3 decimales y desplazamientos de centrado. Tolera 0, NaN, negativos (→ normal).
- `selector.js`: `agrupaMissions(missions, preferit, progres)` → `{ recomanada, principals, altres }` + resumen `{ jugades, total, estrelles, max }`; orden estable; tolera `progres` corrupto.
- `so-notificacio.js`: `patroTo(tipus)` (notas `{ freq, inici, durada, pic }`), `idsNous(vistes, notificacions)`, `deuSonar({ actiu, interaccio, pausa, silenci, noves })`.
- Tests: 1440×900 normal, 1280×720 normal, 1024×768 escalat 0,8, 915×412 escalat ~0,572, 412×915 girar, 400×800 girar, inválidos; selector (agrupación, recomendada, resumen); sonido (≤ 600 ms, frecuencias audibles, pico ≤ 0,12, `deuSonar` falso en pausa/silencio/sin interacción/sin nuevas).

### T2 · Sonidos reales
Dueña de `SIM/simulador/tones.js`, `SIM/simulador/useSoNotificacions.js`; toca `Simulador.js` (solo el hook) y mueve `apps/ajustos/preferencies.js` (+ test) a `SIM/simulador/preferencies.js` con `git mv`, actualizando imports.
- `creaMotorSo()` → `{ reprodueix, reprèn, tanca }`, `AudioContext` perezoso, osciladores sinusoidales con envolvente, `try/catch` total.
- Hook: listener `pointerdown`/`keydown` en la raíz; `Set` inicial de ya existentes; lee `llegeixSons` en cada sonido; cierra el contexto al desmontar.
- E2E `tests/e2e/so.spec.js` (ambos proyectos) con `AudioContext` espía: suena tras interacción; no con `noempesquen-sons=false`; no en pausa; no antes de interactuar.
- Hecho cuando: los 4 casos pasan y no hay ficheros de audio ni URLs externas.

### T3 · Interruptor «So» en la pausa
Dueña de `SIM/simulador/Pausa.js` y sus estilos. `role="switch"` con `aria-checked`, ≥ 44 px, vía `llegeixSons`/`desaSons`.
- E2E: en `factura` abrir pausa con `Esc`, apagar y comprobar `localStorage`; en `mobil`, Ajustos lo refleja. axe sin violaciones serias.

### T4 · Selector rediseñado
Dueña de `SIM/simulador/Selector.js` (extraído de `App.js`), `SIM/estils/_selector.scss`; retira `.nep-targeta*` de `style.scss`.
- Secciones con `h2` y `aria-labelledby` («Per al teu mòbil/ordinador», «Altres dispositius»), tarjeta «Continua per aquí», estrellas con SVG propio y mismo `aria-label`, etiqueta «Millor en horitzontal» (texto + icono) en PC desde móvil. El foco vuelve a la tarjeta jugada. Contraste ≥ 4,5:1, objetivos ≥ 44 px, `auto-fit` sin desborde a 400 px.
- E2E `tests/e2e/selector.spec.js`: orden por dispositivo, foco, axe, 44 px, sin desborde a 400 px. Los e2e existentes (`getByRole('button', { name: titol })`) pasan sin cambios; se mantiene `data-missio`.

### T5 · PC escalado y petición de girar
Dueña de `SIM/simulador/Pantalla.js`, `PeticioGirar.js`, `usePantalla.js`, `SIM/estils/_pantalla.scss`; toca `Simulador.js`, `sistemes/pc/Finestra.js`, `_pc-barra.scss`, `_pc.scss`, `_pc-notificacions.scss`.
- `usePantalla()` lee `visualViewport ?? window`, `(pointer: coarse)`, y se actualiza con `resize`/`orientationchange`.
- Modo `escalat`: contenedor 1280×720, `transform: scale(var(--so-escala))`, `transform-origin: 0 0`. Modo `girar`: `PeticioGirar` (`role="alertdialog"`, texto catalán, icono SVG propio, botón «Torna al selector»), PC `inert`, TICK parado.
- Objetivos: `--so-tactil: max(1px, calc(44px / var(--so-escala, 1)))`; barra `max(48px, var(--so-tactil))`; botones de barra y de ventana con `min-height/min-width: var(--so-tactil)`; `inset: 0 0 48px` pasa a `--so-alt-barra`.
- Arrastre: dividir deltas por la escala (`moviment.js` puede ganar `delta(dx, dy, escala)` testeable).
- E2E `tests/e2e/pc-mobil.spec.js` (915×412 táctil + caso 412×915): sin desborde y barra ≥ 44 px; `petits(page)` vacío; arrastre fiel (±2 px); en vertical aparece «Gira el mòbil», el reloj no avanza y al volver la partida continúa; axe en ambos modos.

### T6 · Levantar los `skip` de PC en móvil
Dueña de `factura.spec.js`, `banc.spec.js`, `playwright.config.js`. Tercer proyecto `mobil-horitzontal` (Pixel 7 landscape). `factura` y `banc` corren en `escriptori` y `mobil-horitzontal`; `paquet`, `canviat`, `farcit` siguen en `mobil` vertical. Revisar la lista de tests ejecutados para no perder cobertura.

### T7 · Revisión visual a 4 anchos
Dueña de `tests/e2e/visual.spec.js` y de las correcciones CSS. Anchos 1440×900, 1024×768, 768×1024, 400×800; pantallas: selector, bloqueo y primer estado de cada misión, consecuencia y resultado. Rompen el test: desborde horizontal, `greusAxe`, `petits` en móvil, texto cortado. Capturas en `test-results/visual/`. Fase 1: ejecutar y listar hallazgos; fase 2: corregir con commits pequeños. A revisar: borde `is-buida` de Ullada (2,7:1), estados deshabilitados de Càmera, anillo de foco doble, pestañas del navegador a 400 px, y legibilidad a escala ~0,57 (D3).

### T8 · Deudas menores
Un commit por punto, con test donde sea lógica pura:
1. `validaMissio` robusto ante `null`/no-array en `senyals`, `disparadors`, `efectes`, `opcions`.
2. `llegeixProgres` devuelve `{}` si lo guardado no es un objeto.
3. Validar `missio.apps.ullada.publicacions` en `valida.js`.
4. `propsEnllac` acepta solo `http`/`https` (comprobar que es puro).
5. Galeria `agrupa.js`: «Avui»/«Ahir» con `__()` y fecha del mundo.
6. Cadenas de `Subpantalla` con `__()`.
7. Ullada: guarda para `nom.split` y nombre del jugador desde `mon`.
8. `role="status"` siempre en el DOM en la web oficial de Envia't.
9. Navegador: `Enter` con la misma URL no duplica el historial.

Se difieren a un corte posterior: penalización parcial por datos en la web falsa del banco, estado de Parla en móvil y retardo de Pau, hora de los mensajes de Parla, tests de `usePista`/`aillament`/`Bloqueig`, refactors de duplicados, dominios de Banc Sòlid (decisión del usuario), orden de tabulación, error boundary, aviso de remotas v1, pulido de contenido de El Diari y semántica h1/h2, y los menores de bajo valor. Se mantienen como lista en `estat-del-projecte.md`.

### T9 · Textos, regresión y revisión
- Textos catalanes nuevos por `humanizer-es`.
- Regresión completa en los proyectos que correspondan; revisión con `reviewer`; `security-reviewer` sobre `localStorage` y `AudioContext`; medir el tamaño de `view.js` antes y después.
- `verification-before-completion`: `npm run lint:js && npm run lint:css`, `npm run test:unit`, `npm run build`, `npx playwright test`, con salida real.

### T10 · Cierre y verificación manual
- Actualizar `docs/estat-del-projecte.md` y `docs/decisions.md`.
- **Manual:** en Chrome con ventana visible, `Esc` real durante una misión abre la pausa y el simulador sigue cubriendo la pantalla; con «Més» o el candado abiertos, `Esc` los cierra primero. Repetir con un móvil real en horizontal (PC en móvil).
- Merge a `master` solo cuando el usuario lo confirme.

## Criterios de hecho

- `factura` y `banc` se juegan enteras en móvil horizontal (915×412) y en escritorio; en vertical aparece la petición de girar sin perder la partida.
- Sin desborde horizontal a 1440, 1024, 768 y 400 px en el selector ni en ninguna misión.
- Objetivos de 44 px reales en el PC escalado y en el móvil; axe sin violaciones serias en las pantallas nuevas.
- Notificaciones con tonos generados, solo tras interacción, nunca en pausa, respetando `noempesquen-sons`; sin ficheros de audio ni peticiones externas.
- Selector con las misiones del dispositivo primero, con el estilo propio del juego.
- Lint, `test:unit`, build y Playwright (`escriptori`, `mobil`, `mobil-horitzontal`) en verde con la salida real; las 4 misiones existentes sin cambios de comportamiento.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `transform: scale` rompe arrastre o popovers | Dividir deltas por la escala (T5); e2e de arrastre en horizontal |
| Texto ilegible a escala ~0,57 | Capturas de T7; bajar el mínimo a 1024×576 si hace falta |
| Autoplay: el sonido no suena o suena antes de interactuar | `AudioContext` perezoso, `resume()` en la primera interacción, e2e con espía |
| `Pantalla` desmonta el PC al girar | Mantenerlo montado con `inert`; test de «la partida continúa» |
| Mover `preferencies.js` rompe imports en Windows | `git mv` en minúsculas; `grep` antes y después |
| Cambiar proyectos de Playwright pierde cobertura | T6 define qué spec corre dónde; revisar la lista de tests ejecutados |
| El rediseño del selector rompe los e2e | Mantener `data-missio` y el nombre accesible del botón |
