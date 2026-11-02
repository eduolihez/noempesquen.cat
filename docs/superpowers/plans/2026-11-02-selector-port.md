# Selector «Port»: puerto con barcos y mapa lineal de misiones

Rama `feat/selector-port` (base: `feat/tutorial-overlay` @ `35e5910`). Sin push.
SIM = `plugins/noempesquen-core/src/blocks/simulador/`.

## Objetivo

Sustituir la rejilla de tarjetas de `/simulador/` por una escena de puerto ilustrada y animada. Cada barco es un dispositivo:

- **Pesquer** (barco pesquero, la Llissa, pez) = ordenador (`dispositiu: pc`).
- **Vaixell pirata** (la Pirata Remei) = móvil (`dispositiu: mobil`).

Al pulsar un barco, la cámara se acerca al barco y los niveles «saltan» sobre el mar como un mapa de ruta (roadmap): un camino sinuoso con nodos. Ruta lineal: el tutorial abre la misión 1, cada misión completada (≥ 1 estrella) abre la siguiente. Un nodo disponible; los siguientes, bloqueados; los hechos, rejugables. Sin filtros (decisión de Edu).

## Decisiones (Edu, 2026-11-02)

- Desbloqueo lineal con tutorial primero.
- Todo en SVG + CSS animado, sin imágenes raster. Ligero, accesible, `prefers-reduced-motion` respetado.
- Sin filtros: el dispositivo ya es el barco y la ruta es lineal.

## Reglas de dominio

- Orden de la ruta de un dispositivo: tutorial de ese dispositivo primero; después las misiones del dispositivo en el orden del array `missions` (hoy `INCLOSES` en `SIM/simulador/App.js`: llissa-01..05, remei-01..05). Las remotas (CPT) válidas van al final de su dispositivo. Sin campo `ordre` nuevo (`nivell` es dificultad, no secuencia).
- Estado de nodo: `feta` (estrellas ≥ 1; tutorial: `tutorialFet`), `disponible` (la primera no hecha cuyo anterior está hecho o es el inicio), `bloquejada` (resto). Lo calcula un módulo puro sin DOM.
- Progreso: se mantiene `noempesquen-progres-v2` `{id: estrellas}`; sin cambios de servidor. El nodo de una misión ya hecha cuenta como `feta` aunque la anterior no (progreso migrado o de otra cuenta): el desbloqueo es `anterior hecha O ella misma hecha`.
- «Millor en horitzontal»: se conserva para PC visto desde móvil, como etiqueta del barco pesquero.
- Preferencia de dispositivo (`preferit`): el barco del dispositivo en uso lleva la marca «Aquí» y se anima más; ambos se pueden elegir.
- Cuenta con sincro y `EstatCompte` siguen igual (debajo de la escena).
- La misión siguiente tras un resultado (`seguent` en `App.js`) pasa a ser la siguiente de la ruta del mismo dispositivo; al terminar la última, vuelve al mapa.
- Volver de una partida (Pausa → «Surt», o fin de misión) lleva al **mapa del barco** de esa misión, con el foco en su nodo (`data-missio`).

## Contrato que no se rompe (tests existentes)

- Región `role="region"` con nombre «Tria una missió».
- Cada misión sigue siendo un `<button data-missio="id">` con nombre accesible = `titol` (vía `aria-labelledby`). Lo usan muchos e2e a través de `iniciaMissio` en `tests/e2e/ajudes.js` (helper: se actualizará para abrir antes el barco).
- Los nodos bloqueados: `aria-disabled="true"` (siguen enfocables, anuncian «Bloquejada: acaba “X” primer»); no ejecutan `onTria`.
- Estrellas: `role="img"` con «Millor resultat: N de 3 estrelles» / «Encara no l'has jugada». Tutorial: «Fet».
- Objetivos táctiles ≥ 44 px, foco visible, contraste AA, axe sin violaciones serias, sin desbordamiento horizontal a 400 px.
- Textos en catalán; sin marcas reales; sin emojis; iconos SVG propios; UTF-8 LF; no `Foo.js` y `foo.js` juntos.
- Marcas inventadas permitidas ya existentes; nombres nuevos de barcos: «el Pesquer» y «el Pirata» (sin marca real).

## Rúbrica

| # | Criterio | Cómo se comprueba |
|---|---|---|
| R1 | Escena de puerto SVG: cielo, sol, faro/costa, mar en capas, muelle, 2 barcos, gaviotas, nubes; nada raster | revisión de código + captura 1280×720 y 390×844 |
| R2 | Animaciones: balanceo de barcos, olas, velas/bandera, gaviotas, parallax suave al mover el ratón/inclinar (opcional); con `prefers-reduced-motion` todo queda estático | e2e `emulateMedia({reducedMotion})` + CSS |
| R3 | Pulsar un barco: transición de cámara (zoom al barco, el puerto se desvanece) y los nodos «saltan» escalonados sobre el mar; botón «Torna al port» invertido | e2e (estado visible) + captura de la secuencia |
| R4 | Mapa lineal: camino sinuoso, nodos numerados, tutorial primero, 1 disponible, hechos con estrellas, bloqueados con candado y razón | unit de ruta + e2e |
| R5 | Módulo puro `nucli/ruta.js` con tests: orden, estados, siguiente, remotas al final, progreso corrupto o desordenado | `npm run test:unit` |
| R6 | Un barco por dispositivo; el barco de `preferit` marcado «Aquí» | e2e |
| R7 | Accesibilidad AA: roles, nombres, foco al entrar al mapa y al volver (nodo jugado), `aria-live` del cambio de vista, teclado completo, Esc vuelve del mapa al puerto sin abrir la pausa del juego | e2e + axe + revisión |
| R8 | Móvil vertical, horizontal y PC sin desbordamientos; el mapa se vuelve vertical-serpentina en estrecho | e2e a 390, 400, 844×390, 1280 |
| R9 | Contrato e2e intacto (ver arriba); helpers y specs actualizados; suite completa en verde | Playwright completo |
| R10 | Rendimiento: sin JS por frame (solo CSS), SVG sin filtros pesados, bloque no crece > 40 KiB gz | build + revisión |
| R11 | Textos catalanes revisados con `humanizer-es`; sin marcas reales ni emojis | revisión |

## Tareas (secuenciales; ficheros dueños disjuntos)

| ID | Qué | Ficheros dueños | Modelo |
|---|---|---|---|
| V1 | Núcleo puro de ruta + tests | `SIM/nucli/ruta.js`, `SIM/nucli/test/ruta.test.js` | sonnet |
| V2 | Escena del puerto y barcos (SVG + CSS animado) | `SIM/ui/port/*` (Escena, Pesquer, Pirata, Gavines…), `SIM/estils/_port.scss` | opus |
| V3 | Mapa de ruta: nodos, camino, animación de salto, estados | `SIM/simulador/Mapa.js`, `SIM/estils/_mapa.scss` | opus |
| V4 | Integración: nuevo `Selector.js` (puerto ↔ mapa), cámara, foco, `App.js` (vaixell activo, `seguent`), retirar tarjetas/estilos viejos, `style.scss` | `SIM/simulador/Selector.js`, `SIM/simulador/App.js`, `SIM/estils/_selector.scss`, `SIM/style.scss` | sonnet |
| V5 | e2e: `ajudes.js`, `selector.spec.js` reescrito, `tutorial.spec.js` y demás specs que clican misiones, specs nuevos (port, mapa, reduced-motion, móvil) | `tests/e2e/*` | sonnet |
| V6 | Revisión ciega (reviewer + accesibilidad), una ronda de arreglos, docs (`estat-del-projecte.md`, `CLAUDE.md` mapa del código), `humanizer-es` de textos | varios | — |

Fases: 1 aclarar (hecha) → 2 investigar (hecha) → 3 V1-V5 → 4 revisión → 5 arreglos → 6 suite completa → 7 cierre.

## Ronda 2 (Edu, 2026-11-02): pantalla completa, mejores gráficos, mapa distinto por barco

- **Pantalla completa**: el selector ocupa toda la ventana (`100dvw × 100dvh`, por encima de cabecera y pie del tema, sin scroll de página), con botón «Pantalla completa» real (Fullscreen API, por gesto) y «Surt» a la web. La escena escala tipo *cover* (se recorta por los bordes, lo esencial en la zona central segura) y funciona de 16:9 a 21:9 y en vertical.
- **Mejores gráficos**: iluminación (resplandor del sol, rim light en barcos), profundidad (parallax por capas, niebla/bruma atmosférica), agua más rica (espuma, cáusticas, reflejos de barcos), texturas (madera, tela de vela, red), sombras proyectadas, detalle extra en cubierta. Sigue siendo solo SVG + CSS, sin raster, `prefers-reduced-motion` y botón de pausa intactos.
- **Mapa propio por barco**: el Pesquer = carta náutica diurna (turquesas/arena, líneas de sondeo, boyas y redes como nodos, bancos de peces); el Pirata = mapa del tesoro al atardecer/noche (pergamino chamuscado sobre mar oscuro, islas como nodos, X roja, brújula, niebla, estrellas, ruta de huellas). Cada uno con su camino, nodos, fondo, tipografía/ornamentos y animaciones. Contrato de accesibilidad y tests intactos (nombre del nodo = titol, contraste AA en ambos).
- Tareas: W1 (marco a pantalla completa, secuencial), luego W2 y W3 en paralelo (ficheros disjuntos), W4 e2e + revisión ciega + verificación.
