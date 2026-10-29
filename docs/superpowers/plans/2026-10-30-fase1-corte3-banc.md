# Fase 1 · corte 3 — Banc Sòlid y dos misiones nuevas

Spec: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`. `SIM/` = `plugins/noempesquen-core/src/blocks/simulador/`.

**Objetivo:** Banc Sòlid (web real, web falsa, app móvil), móvil vinculado en el PC y las misiones v2 «El banc et bloqueja el compte» (PC, guía Llissa) y «Hola, he canviat de mòbil» (móvil, guía Remei).

## Decisiones
- Móvil vinculado = notificación con `font: 'mobil'` en un PC (sin segundo dispositivo en el estado). El PC la pinta como «Mòbil d'Àlex · Missatges».
- Código SMS fijo en el JSON (482913). Lo escrito nunca entra en el estado: `codi.envia` solo lleva `{url, formulari}` y, en la web falsa, siempre es «pescat».
- Pago de la misión del móvil: formulario de transferencia de la app Banc Sòlid (`pagament.fes`), 380 € a un IBAN inventado.
- Descartado: estado con dos dispositivos simultáneos.

## Criterios de hecho
- `webs/banc-solid` con real y falsa desde una plantilla; la falsa no envía nada.
- App Banc Sòlid en móvil; entrar en la real y comprobar que no hay aviso cierra como acierto (`decideix`).
- Código SMS llega como toast/centro de notificaciones del PC.
- Ambas misiones pasan `validaMissio` y tienen guía, indicios, pistas, decisión y camino de «pescat».
- «Hola, he canviat de mòbil» se resuelve bloqueando el número o escribiendo a Pau a su número de siempre.
- Lint, unit, build, Playwright (escriptori + mobil) y axe en verde con salida real.

## Tareas
| # | Tarea | Hecho cuando | Depende |
|---|---|---|---|
| T0 | Helpers e2e compartidos en `tests/e2e/ajudes.js` | Specs actuales en verde | — |
| T1 | Motor: eventos `codi.envia`, `pagament.fes`; `font` en `notifica`; `valida.js` | Unit de `valida` y `disparadors` | — |
| T2 | PC: toast y centro con origen «mòbil vinculat»; `descriu` de `missatges` | Test de UI pura | T1 |
| T3 | `webs/comu`: formularios de login y de código; campos parametrizados desde JSON | `formulari.test.js` ampliado; nada en estado | T1 |
| T4 | `webs/banc-solid`: Marca, Oficial, Falsa y registro | Renderiza en el navegador simulado | T3 |
| T5 | Misión «El banc et bloqueja el compte» (JSON v2, `mon.json`) | `validaMissio` y unit del flujo | T2, T4 |
| T6 | Parla: bloquear contacto desconocido, emitir `contacte.bloqueja` | Unit y e2e | T1 |
| T7 | App Banc Sòlid móvil (compte, moviments, transferència) en `APPS_MOBIL` | UI pura y `valida` | T1, T3 |
| T8 | Misión «Hola, he canviat de mòbil» | `validaMissio` y unit | T6, T7 |
| T9 | E2E de las dos misiones (3 estrellas, pescat, vía parcial, Esc, axe, 44 px) | Playwright verde | T5, T8 |
| T10 | Docs (`estat-del-projecte.md`, `format-missions.md`) y revisión final | Lint, unit, build, Playwright | T9 |

Paralelizable: T6/T7 con T3-T5 (ficheros distintos).

## Riesgos
- Mayúsculas en nombres de archivo (Windows).
- Validador: una opción correcta y un camino de «pescat» por misión.
- Reglas del `CLAUDE.md`: sin marcas reales, WCAG 2.2 AA, UTF-8 con LF, textos en catalán.
