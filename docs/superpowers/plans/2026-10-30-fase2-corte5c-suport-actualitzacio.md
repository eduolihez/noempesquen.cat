# Corte 5c · Pop-up de soporte técnico y falsa actualización del navegador

Estado: aprobado, en ejecución. Rama prevista: `feat/fase2-corte5c-suport-actualitzacio` (base: `master`, que ya incluye 5a y 5b).
Spec vigente: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`. Plan anterior: `2026-10-30-fase2-corte5b-revenda-inversio.md`.

## Objetivo
Dos misiones jugables de principio a fin en el PC, con la guía Llissa: **9 «Virus detectat!»** (pop-up de soporte técnico falso) y **10 «Actualitza el navegador»** (falsa actualización con descarga ficticia). Marcas inventadas, catalán, WCAG 2.2 AA, y sin que lo que teclea el jugador salga del componente. No se descarga ningún archivo real.

## Misión 9 · `llissa-04-suport` (PC, nivel 3, ~5 min)
- El jugador lee una web normal (receptas en `cuinaravui.cat`, inventada). Al cabo de unos segundos (disparador por `web.carrega` + `retard`) salta un **overlay a pantalla completa dentro de la página**: «Virus detectat! El teu ordinador està en perill», alarma visual, contador, teléfono «900 000 000» (ficticio) y botones «Tanca» (trampa: reabre) y «Truca ara».
- La marca falsa del «soporte»: **Suport Segur Digital** (inventada). Segundo paso opcional: «Instal·la l'eina de suport» (descarga ficticia `suport-remot.exe`).
- Decisión (menú final de la guía): a) Tanco la pestanya sense tocar res (correcta; `decideix a`) · b) Ignoro l'avís i segueixo mirant la web (parcial) · c) Truco al telèfon o instal·lo l'eina (incorrecta, `pescat`).
- Señales: un aviso de una web no puede detectar virus en tu equipo; pide llamar a un teléfono en vez de usar el antivirus; urgencia/alarma/contador; botón «Tanca» que no cierra; dominio raro (`windows-alerta.top`-estilo, sin marcas reales: `alerta-equip.top`); pide instalar un programa para «arreglar».

## Misión 10 · `llissa-05-actualitzacio` (PC, nivel 3, ~4 min)
- En una web de noticias (reutiliza `diaridelbarri.cat` o una web nueva `tempsavui.cat`; decidir en T3 según coste), aparece una **barra superior** «El teu navegador està desactualitzat. Actualitza ara» con botón «Descarrega l'actualització».
- Pulsar el botón muestra un diálogo de descarga ficticio `actualitzacio-navegador.exe` desde `descarrega-navegador.top` y un botón «Obre». Abrirlo es el pescat.
- Decisión: a) Ignoro la barra i comprovo la versió a Ajustos del navegador (correcta; `decideix a`) · b) Tanco la barra i ja està (parcial) · c) Descarrego i obro el fitxer (incorrecta, `pescat`).
- Señales: una web no actualiza tu navegador (lo hace el propio navegador); instalador `.exe` desde dominio `.top`; urgencia; barra que imita el navegador pero está dentro de la página.
- Requiere un apartado mínimo «Quant a» en el navegador del PC para la opción a) (versión + «està al dia»). Si ya existe algo equivalente, se reutiliza.

## Piezas nuevas
| Pieza | Detalle |
|---|---|
| Overlay de pop-up | Componente `webs/comu/AvisFals.js`: `role="alertdialog"`, foco atrapado dentro de la página simulada, `Esc` registrado con `useJoc().registraMenu` (cierra el overlay y lo reabre si la misión lo indica), sin sonido que no se pueda silenciar; el contador es texto estático (WCAG 2.2.2). |
| Barra falsa de actualización | Componente `webs/comu/BarraActualitzacio.js`, `role="region"` con nombre, botón ≥ 24 px. |
| Diálogo de descarga ficticio | `webs/comu/DescarregaFicticia.js`: no crea `Blob` ni `<a download>`; solo UI. |
| Plantillas web | `avis` (solo falsa, `alerta-equip.top`), `descarrega` (solo falsa, `descarrega-navegador.top`) y web neutra de receptas (`cuina`) con `dades.avis` que dispara el overlay. Registro en `webs/registre.js` y `PLANTILLES_SOLO_FALSES`. |
| Eventos de motor | `telefon.truca` `{ url }` (pulsar «Truca ara» o el teléfono) y `descarrega.fes` `{ url, fitxer }` (abrir/ejecutar). Ambos en `ESDEVENIMENTS` de `valida.js` y en `docs/format-missions.md`. Nunca llevan texto tecleado. |
| Validador | Plantillas nuevas, campos de señal nuevos en `CAMPS_SENYAL`, regla «señal declarada y no referenciada falla», cruces `descarrega.fes`↔fichero declarado en la web. |

## Tareas (orquestar, estrictamente secuenciales: `valida.js` y `style.scss` los tocan varias)
| Tarea | Contenido | Ficheros dueños | Dep. |
|---|---|---|---|
| T0 | Línea base: lint, unit, build y **Playwright completo**; nota «Resultado T0» aquí. Corregir además el estado desfasado de 5a/5b en `estat-del-projecte.md`. | este plan, `docs/estat-del-projecte.md` | — |
| T1 | Eventos `telefon.truca` y `descarrega.fes` en `valida.js` + `docs/format-missions.md` + test unitario del validador. | `nucli/valida.js`, tests, doc | T0 |
| T2 | Componentes comunes `AvisFals`, `BarraActualitzacio`, `DescarregaFicticia` + `_avis.scss` (+ `style.scss`), con `registraMenu` y aria-live. | `webs/comu/*`, estils | T1 |
| T3 | Plantillas `avis`, `descarrega` y `cuina`, registro, `PLANTILLES_SOLO_FALSES`, `CAMPS_SENYAL`; «Quant a» del navegador. | `webs/*`, `apps/navegador/*`, `valida.js` | T2 |
| T4 | Misiones `llissa-04-suport` y `llissa-05-actualitzacio` + registro en `App.js` + `selector.spec.js` (PC 5, móvil 5). | misiones, `App.js`, `selector.spec.js` | T3 |
| T5a | Tests misión 9: unit (3 estrellas por `a` sin pistas; `pescat` por llamar o instalar; negativos) + e2e PC (correcto, pescat, axe, `Esc`, foco, fugas). | `nucli/test/suport.test.js`, `tests/e2e/suport.spec.js` | T4 |
| T5b | Tests misión 10: igual (descarga ficticia no crea archivo ni petición de red). | `nucli/test/actualitzacio.test.js`, `tests/e2e/actualitzacio.spec.js` | T5a |
| T6 | Cierre: revisión de rama (`reviewer`, `security-reviewer`, `silent-failure-hunter`, `critico`), tabla Arreglar/Mejora, copy por `humanizer-es`, docs, evidencia completa. | — | T5b |

## Criterios de hecho
- `validaMissio(m, mon)` = [] para ambas; unit (3 estrellas y pescat por misión) y e2e (correcto + pescat) en verde.
- `lint:js` (0 errores), `lint:css`, `test:unit`, `build` y `npx playwright test` completo, con salida real; axe sin violaciones serias.
- Selector con 10 misiones (PC 5, móvil 5); doc del formato actualizada.
- Test de marcas reales verde con el contenido nuevo (ni Windows, Microsoft, Chrome, Firefox, Norton, McAfee…).
- Ningún `Blob`, `download`, `window.open` ni `location` real en el código nuevo; lo tecleado no sale.

## Fuera de alcance
Fase 3 (IA, cuentas, CPT), sonido de alarma real, fingir un bloqueo real del navegador (el overlay vive dentro de la página simulada), deudas menores de cortes anteriores salvo bloqueo.

## Riesgos
- El overlay no debe atrapar al jugador de verdad: `Esc`, cerrar pestaña y el menú de pausa siempre funcionan (aislamiento de foco de `aillament.js`).
- Accesibilidad de un overlay "agresivo": nada que parpadee más de 3 veces/s, contador sin `aria-live` asertivo.
- Cuenta de apps/misiones en `selector.spec.js` y en el inicio del PC a anchos pequeños.
- Dominios `.top` inventados: comprobar que no sean de marcas reales.

## Resultado T0
lint:js 0 errores (134 warnings jsdoc), lint:css 0, unit 503/503, build OK (aviso de tamaño). Playwright: 234 pasados, 106 skipped, 1 fallo en `farcit.spec.js:143` (`mobil-horitzontal`, timeout de carga) que **pasa en aislamiento** (flaky, no de esta rama).
