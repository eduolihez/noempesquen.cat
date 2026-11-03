# Tutoriales en formato overlay + ventanas lado a lado

Fecha: 2026-11-02. Origen: una persona de 22 años probó los tutoriales y no le quedó claro cómo funciona el juego. Spec vigente: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md` (si algo choca, manda el spec o se pregunta a Edu).

## Problema

- Hoy el tutorial se explica solo por el chat de Parla; no hay guía visual de «qué hago ahora».
- Los conceptos (barra de tareas, ventanas, notificaciones, correo, remitente, enlaces, lupa, decisión) no se explican uno a uno.
- Navegador (1120×576) y Parla (860×552) se abren centrados con cascada de 36 px y se tapan casi del todo (`Finestra.js:38-50`, `_pc.scss:236-270`).

## Objetivo

1. **Overlay con foco**: todo el sistema se atenúa en gris y un recuadro resaltado señala el elemento que toca, con una tarjeta que explica el concepto.
2. **Cada concepto explicado**, un paso por concepto, en catalán claro.
3. **Chat y correo no se solapan**: al abrirse las dos ventanas del PC se colocan lado a lado (en todas las misiones, no solo en el tutorial).

Fuera de alcance: voz, vídeo, misiones que no sean tutorial (salvo la disposición de ventanas), cambiar la puntuación.

## Criterios de hecho (rúbrica)

| # | Criterio | Cómo se comprueba |
|---|---|---|
| U1 | A 1280×720, 1024×768 y en el PC escalado de móvil horizontal, Navegador y Parla abiertos juntos no se tapan (intersección de rectángulos ≤ 4 px); las dos son usables (Parla ≥ 420 px lógicos de ancho) | e2e con `boundingBox` + unit del cálculo de disposición |
| U2 | Una ventana movida o redimensionada a mano por el jugador no se recoloca sola | unit + e2e |
| U3 | El tutorial define `passos` en el JSON; el validador rechaza pasos sin `id` único, ancla desconocida o `continua` inválido | Vitest de `valida.js` |
| U4 | El motor guarda el paso actual, avanza por botón o por el evento real que pide el paso, y emite `pas.entra` con `{ pas }` para que los disparadores existentes reaccionen (sin temporizadores para el flujo del tutorial) | Vitest de `motor.js`/`disparadors.js` |
| U5 | El overlay atenúa todo menos el recuadro del objetivo; en pasos de acción el hueco es clicable y lo demás no; en pasos de explicación solo funciona la tarjeta | e2e |
| U6 | El recuadro sigue al elemento si cambia de sitio (ventana arrastrada, escala del PC, giro del móvil, reloj) | e2e con escala y viewport distinto |
| U7 | Cada paso explica un solo concepto: título corto, 1-2 frases, botón «Entès» o la instrucción de la acción; contador «Pas n de N»; «Salta el tutorial» siempre visible | revisión de textos + e2e |
| U8 | Lista de conceptos cubiertos (PC): escritorio y barra de tareas, ventana (minimizar, maximizar, cerrar), Navegador, Parla y la guía, respuestas rápidas, campana/avisos, correo nuevo, remitente y asunto, enlaces y dirección, lupa e indicios, decisión final. Móvil: bloqueo, inicio, dock, banner de aviso, centro de control, Missatges, Parla, botones Enrere/Inici, lupa, decisión | revisión del JSON |
| U9 | Accesibilidad: `role="region"` con nombre (nunca `dialog`), texto anunciado por `aria-live="polite"`, foco en el botón de la tarjeta en pasos de explicación, contraste AA, objetivos ≥ 44 px en móvil, axe sin violaciones serias, respeta `prefers-reduced-motion` | e2e axe |
| U10 | Sin regresiones: lint:js, lint:css, test:unit, build y Playwright (escriptori, mobil, mobil-horitzontal) en verde con salida real | comandos |

## Decisiones de diseño

- **D1 Pasos en el JSON de la misión** (`passos`), no en código. Cada paso: `id`, `ancora` (clave `data-tut` o `null` para pasos centrados), `titol`, `text`, `continua` (`"boto"` o `{ esdeveniment, ...datos }` con la misma sintaxis que `quan`). Formato documentado en `docs/format-missions.md`.
- **D2 Estado en el motor**: `estat.pas` (índice) y acción `PAS_SEGUENT`/`PAS_SALTA`. Al entrar en un paso se emite `pas.entra { pas: id }`; los disparadores existentes (`mostra`, `notifica`, `guia-diu`) se enganchan a ese evento. Así «aparece el correo» ocurre cuando el paso lo pide, sin esperar segundos. Los `retard_ms` del tutorial desaparecen.
- **D3 Anclas con `data-tut`** en los elementos objetivo (barra, botones de app, reloj/campana, lupa, ventana y sus botones, Parla, toast, lista de correos, dock y barra de navegación móvil). No se usan clases ni `aria-label` (cambian).
- **D4 Overlay** es un componente `GuiaTutorial` hermano de `div.nep-so__sistema` dentro de `.nep-so`. Capa nueva en `_capes.scss` entre el bloqueo (PC 10, móvil 20) y la pausa (1000). Atenuado con cuatro paneles alrededor del hueco (no `box-shadow` gigante), de modo que el hueco pueda ser clicable. El rectángulo sale de `getBoundingClientRect()` (ya en píxeles reales, compensa la escala del PC) relativo al de `.nep-so`; se recalcula con `ResizeObserver`, `scroll` y un `requestAnimationFrame` mientras el paso está activo.
- **D5 Pasos de acción** dejan pasar el clic solo por el hueco; **pasos de explicación** bloquean todo menos la tarjeta. Esc sigue abriendo la pausa. «Salta el tutorial» reutiliza la acción de salto existente.
- **D6 Disposición de ventanas** (todas las misiones): función pura `disposicioInicial()` en `finestres.js`. Con una sola ventana, como hoy. Al abrirse la segunda y mientras ninguna esté movida/redimensionada/maximizada por el jugador, se reparten el área: Navegador a la izquierda (~60 %), Parla a la derecha (~40 %, mínimo 420 px). Posiciones y tamaños se pasan a `Finestra` por estilo en línea; la bandera `manual` se activa al arrastrar o redimensionar.
- **D7 Textos** en catalán, tono cercano, frases cortas, sin marcas reales. Pasan por revisión de Edu antes de dar por cerrado el contenido.

## Tareas (en secuencia; comparten ficheros)

| ID | Tarea | Ficheros principales | Hecho cuando |
|---|---|---|---|
| U1 | Disposición lado a lado de ventanas + bandera `manual` + tests | `sistemes/pc/finestres.js`, `Finestra.js`, `Pc.js`, `estils/_pc.scss`, tests unit y e2e | U1, U2 |
| U2 | Modelo de pasos: validador, motor, evento `pas.entra`, doc de formato | `nucli/valida.js`, `motor.js`, `disparadors.js`, `docs/format-missions.md`, tests Vitest | U3, U4 |
| U3 | Anclas `data-tut` en PC y móvil (sin cambiar comportamiento) | `BarraTasques.js`, `Finestra.js`, `Notificacions.js`, `BotoLupa.js`, `Inici.js`, `BarraNavegacio.js`, banners, webs/posta | todos los objetivos localizables |
| U4 | Componente `GuiaTutorial` + estilos + capa + a11y + reposicionado | `simulador/GuiaTutorial.js`, `Simulador.js`, `estils/_tutorial.scss`, `_capes.scss` | U5, U6, U9 |
| U5 | Contenido: `tutorial-pc.json` y `tutorial-mobil.json` con `passos`, disparadores por `pas.entra` | `missions/tutorial-*.json` | U7, U8 |
| U6 | e2e: reescribir `tutorial.spec.js`, añadir comprobaciones de solape y axe | `tests/e2e/tutorial.spec.js`, `ajudes.js` | U1, U5, U6, U9, U10 |
| U7 | Revisión de rama (reviewer, security-reviewer, accesibilidad), una ronda de arreglos, docs y estado | `docs/estat-del-projecte.md` | U10 |

Rama: `feat/tutorial-overlay` desde `master`. Un commit por tarea, mensajes convencionales en inglés. Sin push ni despliegue.

## Riesgos

- Los e2e actuales avanzan el tutorial por eventos reales y por pulsar «Següent» en Parla; los pasos nuevos cambian ese guion y hay que reescribirlos.
- Un velo con `pointer-events` activo bloquearía a Playwright; por eso los cuatro paneles y el hueco libre.
- Parla a 420-496 px puede apretar la interfaz del chat; se comprueba visualmente en U1.
- El texto sobre fondo atenuado debe cumplir contraste: la tarjeta lleva fondo sólido.
