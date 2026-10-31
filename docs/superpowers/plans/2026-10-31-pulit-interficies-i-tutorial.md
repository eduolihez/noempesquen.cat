# Plan: pulido de las interfaces PC/móvil, tutorial y replanteamiento de la lupa

Fecha: 2026-10-31. Origen: petición de Edu tras el despliegue del tema. Autoridad de diseño: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`. Si algo de aquí lo contradice, manda el spec (o se pregunta).

## Objetivo

1. Que el jugador sepa usar el PC, el móvil y la lupa **antes** de la primera misión.
2. Que cada aviso, notificación y transición llegue en el momento justo y se vea bien.
3. Que PC y móvil tengan un único lenguaje de movimiento, capas y color.

## Diagnóstico (auditoría del código, 2026-10-31)

| Área | Hallazgo | Dónde |
|---|---|---|
| Lupa | No existe ninguna explicación ni tutorial. Solo menciones sueltas en las intros. | `nucli/motor.js`, intros de misiones |
| Lupa móvil | Solo se activa desde el Centro de control, que se cierra al pulsar: hay que reabrirlo cada vez. Sin botón en pantalla. | `mobil/CentreControl.js:80-95` |
| Lupa PC | Botón de 18 px en la bandeja; sin resalte ni pista la primera vez. | `pc/BarraTasques.js:148-158` |
| Lupa feedback | Toda inspección genera mensaje de la guía + toast/banner + sonido, incluso para «Res d'estrany». Nada inline en el texto clicado. | `motor.js:125-147`, `227-249` |
| Cursor lupa | SVG de 32 px duplicado en PC y móvil; en táctil no se ve. | `_pc.scss:5`, `_mobil.scss:6` |
| Retardos | `disparadors[].retard` en segundos; `avis.retard` de webs en milisegundos. Valores arbitrarios (3, 6, 8, 18, 22, 30, 34, 38, 46). | `disparadors.js`, `docs/format-missions.md:152` |
| Solape con intro | Un aviso a los 8 s puede llegar mientras el jugador sigue leyendo la intro. | `motor.js`, misiones |
| Duraciones de aviso | Toast/banner 6 s fijos; otros avisos 2,5 / 4 / 7 s sin criterio común. | `Banners.js`, `Notificacions.js`, `Posta.js` |
| Apilado | Varias notificaciones a la vez (guía + disparador) se apilan sin escalonar; el tope (3 PC / 2 móvil) recorta. | `Notificacions.js`, `Banners.js` |
| Salida | Toasts y banners desaparecen de golpe, sin animación de salida. | `_pc-notificacions.scss`, `_mobil-centre.scss` |
| Easing | PC usa `$corba-entrada`; móvil usa `ease` genéricos; curva del bloqueo hardcodeada; entrada del toast PC 0,32 s frente a 0,25 s en móvil. | `_pc*.scss`, `_mobil*.scss` |
| Sonido | Sonido «alerta» definido y sin uso; el aviso suena antes de que el texto esté visible en Parla (tecleo 600 ms). | `so-notificacio.js`, `useSoNotificacions.js:71` |
| Capas | z-index sin escala (1, 2, 3, 4, 10, 14, 15, 20, 900, 1000, 100000); `consequencia` y `girar` ambos en 900. | varios `_*.scss` |
| Toast PC | Centro de notificaciones (z 4) tapa los toasts (z 3); ancho fijo 364 px sin `max-width`. | `_pc-notificacions.scss:15,124-131` |
| Color | Hex repetidos (`#3b3b3b`, `#1a1a1a`, `#0b57d0`, `#b98a00`, `#1e7b45`, `#fff3c4`) en vez de tokens. | varios `_*.scss` |

Aviso para quien lea: «sin reduced-motion» no es un problema; las 20 hojas con animación ya lo respetan. No tocarlo salvo en lo nuevo.

## Decisiones propuestas (Edu confirma antes del corte A)

1. **Dos tutoriales cortos, no uno**: `tutorial-pc` y `tutorial-mobil` (2-3 min cada uno), porque una misión tiene un único `dispositiu`. Salen en el selector como «Primer pas», antes del nivel 1. Saltables y marcados como hechos (progreso local y, si hay sesión, cuenta).
2. **La lupa pasa a ser un botón siempre visible** en ambos sistemas, con contador «Indicis n/N» al lado. En móvil se queda también en el Centro de control, pero ya no es el único sitio.
3. **Feedback de la lupa en dos niveles**: micro-respuesta inline anclada al texto (rápida, silenciosa) y mensaje de la guía solo cuando hay pista nueva. «Res d'estrany» no genera toast ni sonido.
4. **Un solo reloj de tiempos** en `nucli/temps.js`, en milisegundos, y unidades unificadas (`retard_ms`). Migración con el validador avisando de los campos viejos.

## Cortes

Cada corte acaba con lint, unit, build y Playwright, con salida real. Un plan corto por corte si crece.

### Corte A · Base de tiempos, capas y movimiento (sin cambio de contenido)

- Crear `nucli/temps.js` con constantes con nombre: `MS_TICK`, `MS_TOAST`, `MS_BANNER`, `MS_ESCRIU`, `MS_ENTRE_AVISOS`, `MS_TRAS_INTRO`, etc. Todo literal de tiempo del JS pasa a importar de aquí.
- Escalonado de notificaciones: cola en el motor con separación mínima (propuesta: 700 ms entre avisos) y duración según longitud del texto (propuesta: 4 s + 60 ms por carácter, tope 9 s). Sin perder ninguno por el tope.
- Variables SCSS/CSS compartidas en `estils/_moviment.scss`: duraciones (`$t-rapid` 120 ms, `$t-normal` 220 ms, `$t-lent` 360 ms) y curvas (`$corba-entrada`, `$corba-sortida`). PC y móvil usan las mismas.
- Animación de **salida** de toasts y banners (retardar el desmontaje lo justo; respetar reduced-motion).
- Escala de capas en `estils/_capes.scss` y sustitución de los z-index sueltos. Arreglar centro de notificaciones sobre toasts y el choque `consequencia`/`girar`.
- Toast PC con `max-width: calc(100% - 24px)`.
- Tokens de color para los hex repetidos.
- Tests unitarios de la cola de avisos (módulo puro, sin DOM).

### Corte B · Lupa replanteada

- Botón de lupa visible: PC (bandeja, objetivo ≥ 24 px, con etiqueta) y móvil (barra de estado o dock, objetivo ≥ 44 px). Contador «Indicis n/N» junto al botón.
- Feedback inline: al inspeccionar, el texto clicado muestra una marca y un chip breve («Pista trobada» / «Sembla normal»). Mensaje de la guía y sonido solo en pista nueva.
- Primer uso guiado: evento `lupa.activa` en el motor para que las misiones (y los tutoriales) reaccionen.
- Cursor: único SVG compartido; en táctil, sin cursor y con un halo al tocar.
- Estado vacío claro cuando no quedan indicios («Has trobat tots els indicis»).
- Revisión de las 11 misiones: quitar menciones sueltas de la lupa que repitan el tutorial.

### Corte C · Tutoriales de PC y móvil

- `missions/tutorial-pc.json` y `missions/tutorial-mobil.json` (formato v2). Guion de cada uno:
  1. Desbloquear y moverse (escritorio o inicio, abrir y cerrar una app).
  2. Recibir y leer una notificación (la guía manda una a propósito y se ve cómo llega y cómo se abre).
  3. Parla: hablar con la guía y usar las respuestas rápidas.
  4. Lupa: activarla, marcar una señal en un correo o SMS de mentira con una pista evidente, ver el contador.
  5. Decidir: el botón «Ja ho tinc clar» y qué pasa después.
- Sin puntuación que cuente para el resultado; mensaje final: «Ja estàs a punt».
- El selector los muestra primero y los recomienda la primera vez; se pueden saltar.
- Texto en catalán, tono de la guía existente; pasa por `humanizer-es` si se publica fuera del juego.
- Revisar que `selector.js`, `valida.js` y el progreso aceptan misiones sin puntuación.
- e2e: ambos tutoriales de principio a fin en proyectos `escriptori` y `mobil`.

### Corte D · Pulido visual de PC y móvil

- Revisión con capturas a los viewports reales (1440, 1024, 768 y 390 vertical/horizontal) de: bloqueo, escritorio, barra, menú de inicio, ventanas, centro de notificaciones, inicio móvil, centro de control, banners, barra de navegación.
- Corrección de lo que salga: jerarquía, espaciados, tamaños táctiles, ventanas PC en pantallas bajas, banner móvil que tapa cabeceras.
- Pasada de `impeccable` (polish) sobre el sistema simulado. Respetar la regla del proyecto: sin marcas reales, iconos SVG propios.
- Accesibilidad: axe en e2e sin violaciones serias; foco visible; objetivos ≥ 24 px.

### Corte E · Retardos de las misiones

- Migrar `retard` a milisegundos en disparadores y webs (`retard_ms`), con el validador rechazando el campo viejo.
- Criterio nuevo y documentado en `docs/format-missions.md`: ningún aviso antes de que acabe la intro + `MS_TRAS_INTRO`; los avisos de una misma escena se separan por `MS_ENTRE_AVISOS`; ritmo por nivel (el nivel 1 respira más).
- Pasada misión a misión con una tabla antes/después y una partida cronometrada por tipo de misión.
- Sonido: usar «alerta» en avisos de riesgo o quitarlo; sincronizar el sonido con la aparición visible (en Parla, tras el tecleo).

## Orden y esfuerzo

A → B → C → E → D. A primero porque lo demás se apoya en ella; D al final para pulir con todo en su sitio. Escala L en total; usar `orquestar` (≥ 4 tareas): un implementador por corte, revisión de rama única al final con `reviewer` y `security-reviewer`.

## Criterios de hecho

- Un jugador nuevo puede completar el tutorial sin ayuda externa y activar la lupa en menos de 10 s en PC y móvil.
- Ningún aviso solapa la intro ni otro aviso; ninguna pérdida por el tope de apilado.
- Cero literales de tiempo, z-index y colores repetidos fuera de los tokens (comprobable con grep).
- lint:js, lint:css, test:unit, build y Playwright en verde, con la salida real pegada en el estado del proyecto.
- axe sin violaciones serias en tutoriales y en las pantallas retocadas.

## Riesgos

- Migrar `retard` toca las 11 misiones: hacerlo con el validador y tests antes de editar contenido.
- La cola de avisos cambia el orden percibido; hay que revisar los tests e2e que esperan un aviso a un tiempo concreto.
- El tutorial no debe parecer una misión más: sin puntuación y con salida visible a «Saltar».

## Pendiente de Edu antes de empezar

- Confirmar las 4 decisiones propuestas.
- Confirmar los tiempos propuestos (700 ms entre avisos, 4 s + 60 ms/carácter, tope 9 s) o cambiarlos tras probarlos.
