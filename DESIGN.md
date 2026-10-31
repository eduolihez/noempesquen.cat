---
name: No em pesquen (tema Llotja, web pública)
description: Rotulación de lonja de pescado en azul marino y amarillo de lote, para enseñar a no picar el anzuelo sin asustar.
colors:
  gel: "#F2F6FB"
  escuma: "#DCE8F7"
  etiqueta: "#FFFFFF"
  tinta-de-port: "#0B1E3F"
  blau-llotja: "#0D3FA6"
  blau-de-port: "#07245E"
  numero-de-lot: "#FFD23F"
  numero-de-lot-hover: "#FFE27A"
  numero-de-lot-active: "#F2BD12"
  avis: "#C8201E"
  segur: "#0F7B5F"
typography:
  display:
    fontFamily: "\"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif"
    fontSize: "clamp(4.25rem, 11vw, 9rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "0.01em"
  headline:
    fontFamily: "\"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.25rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "0.01em"
  title:
    fontFamily: "\"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1
  numeral:
    fontFamily: "\"Big Shoulders Stencil Display\", \"Big Shoulders Display\", Impact, sans-serif"
    fontSize: "5.5rem"
    fontWeight: 800
    lineHeight: 0.9
  body:
    fontFamily: "\"Atkinson Hyperlegible\", system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.6
  body-prose:
    fontFamily: "\"Atkinson Hyperlegible\", system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.65
  label-button:
    fontFamily: "\"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  md: "10px"
  lg: "18px"
  pill: "999px"
spacing:
  margen: "clamp(1.25rem, 5vw, 3rem)"
  seccion: "clamp(3rem, 8vw, 6rem)"
  pagina: "clamp(2.5rem, 6vw, 4.5rem)"
  md: "1rem"
  lg: "2rem"
components:
  button-lot:
    backgroundColor: "{colors.numero-de-lot}"
    textColor: "{colors.tinta-de-port}"
    typography: "{typography.label-button}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.75rem"
    height: "3.5rem"
  button-lot-hover:
    backgroundColor: "{colors.numero-de-lot-hover}"
  button-lot-active:
    backgroundColor: "{colors.numero-de-lot-active}"
  button-contorn:
    backgroundColor: "transparent"
    textColor: "{colors.etiqueta}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.75rem"
    height: "3.5rem"
  button-contorn-hover:
    backgroundColor: "{colors.etiqueta}"
    textColor: "{colors.blau-llotja}"
  button-mar:
    backgroundColor: "{colors.blau-llotja}"
    textColor: "{colors.etiqueta}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.75rem"
    height: "3.5rem"
  button-mar-hover:
    backgroundColor: "{colors.blau-de-port}"
  button-gran:
    height: "4.5rem"
    padding: "0.5rem 2.5rem"
  button-petit:
    height: "2.75rem"
    padding: "0.25rem 1.1rem"
  capcalera:
    backgroundColor: "{colors.blau-llotja}"
    textColor: "{colors.etiqueta}"
    padding: "1rem 0"
  menu-item-current:
    backgroundColor: "{colors.etiqueta}"
    textColor: "{colors.blau-llotja}"
    rounded: "8px"
    height: "2.75rem"
  peu:
    backgroundColor: "{colors.blau-de-port}"
    textColor: "{colors.etiqueta}"
  seccio-tauler:
    backgroundColor: "{colors.escuma}"
    textColor: "{colors.tinta-de-port}"
  seccio-garanties:
    backgroundColor: "{colors.blau-de-port}"
    textColor: "{colors.etiqueta}"
  missatge-cebo:
    backgroundColor: "{colors.etiqueta}"
    textColor: "{colors.tinta-de-port}"
    rounded: "{rounded.lg}"
    padding: "1.25rem 1.35rem 1.1rem"
  sell:
    backgroundColor: "{colors.avis}"
    textColor: "{colors.etiqueta}"
    rounded: "50%"
    size: "2.25rem"
  etiqueta:
    backgroundColor: "{colors.etiqueta}"
    textColor: "{colors.tinta-de-port}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.8rem"
  nota:
    backgroundColor: "{colors.etiqueta}"
    textColor: "{colors.tinta-de-port}"
    padding: "1.1rem 1.35rem"
---

# Design System: No em pesquen (tema Llotja, web pública)

Alcance: solo la web pública del tema `themes/noempesquen` (portada, páginas interiores, cabecera, pie). El simulador tiene su propio sistema y queda fuera. Los colores y las familias tipográficas nacen en `theme.json`; `assets/tema.css` los consume como `--nep-*`.

## Overview

**Creative North Star: "La Llotja"**

El sitio es la lonja de pescado de un puerto: rotulación grande y estrecha, azul marino de puerto, números de lote amarillos, cuerda de amarre como separador y un anzuelo con cebo como emblema. La metáfora cubre el nombre («No em pesquen», «No et deixis pescar», «Mira l'esquer abans de mossegar») y deja la estafa como lo que es en este mundo: un cebo. La lonja es ruidosa en tipografía pero ordenada en estructura, así que el sitio enseña a desconfiar sin parecer él mismo una estafa.

La densidad es baja y la escala, generosa: titulares de 4 a 9 rem, texto de cuerpo de 1.1875 a 1.3 rem, objetivos de 44 a 72 px. Es una decisión de accesibilidad para público mayor y poco digital, no un gesto estético. Los bloques de color plano (azul, azul de puerto, espuma) se alternan a ancho completo; las divisiones son reglas gruesas y discontinuas, no sombras.

**Key Characteristics:**
- Rotulación en mayúsculas condensadas (Big Shoulders Display 800 y 900) para todo titular, botón y menú; Atkinson Hyperlegible para el texto corrido.
- Azul marino dominante, amarillo de lote reservado a la acción principal y al énfasis del h1, rojo solo para señales de fraude.
- Plano y sin sombras: profundidad por bloques de color, reglas de 4 px y trazos discontinuos.
- Tipografía estarcida (stencil) únicamente para números de lote y sellos numerados.
- Texto y contraste altos, foco visible de 4 px, objetivos táctiles mínimos de 44 px.

## Colors

Paleta marítima y contenida: un azul de lonja, su versión de puerto más oscura, una espuma clara, un amarillo de lote y dos colores de significado (rojo de aviso, verde de seguro). Fuente: `theme.json` (`defaultPalette: false`).

### Primary
- **Blau llotja** (#0D3FA6): fondo de cabecera, hero, bloque final y página-rótulo; color de enlaces, botón `mar`, números de lote y de pasos.

### Secondary
- **Número de lot** (#FFD23F): fondo del botón principal `lot`, palabra destacada del h1 del hero, `dt` de garantías, selección de texto y enlace de salto. Es el único color de acción.

### Tertiary
- **Avís** (#C8201E): señales de fraude: sellos numerados del cebo, subrayado del enlace falso, contadores de pistas. Nunca decorativo.
- **Segur** (#0F7B5F): solo el filo superior de 8 px de la nota informativa.

### Neutral
- **Gel** (#F2F6FB): fondo de página.
- **Escuma** (#DCE8F7): fondo del tablero de misiones; estado activo del botón contorno.
- **Etiqueta** (#FFFFFF): tarjetas, etiquetas, texto sobre azul.
- **Tinta de port** (#0B1E3F): texto, reglas gruesas, color de foco sobre fondos claros.
- **Blau de port** (#07245E): pie, bloque de garantías, cuerda, hover del botón `mar`.
- **Hover y active del lote** (#FFE27A, #F2BD12): estados del botón `lot`, definidos en CSS fuera de `theme.json`.

### Named Rules
**La regla del lote único.** El amarillo de lote marca la acción de entrar a jugar y poco más. Si dos cosas amarillas compiten en la misma pantalla, sobra una.

**La regla del rojo de fraude.** El rojo (#C8201E) significa «señal de estafa». No se usa para errores de interfaz genéricos ni como adorno.

**La regla de la pareja azul.** Cada bloque a ancho completo en azul lleva `--nep-focus` en blanco; cada bloque claro lo deja en tinta. El foco se redefine por superficie, no se hereda a ciegas.

## Typography

**Display Font:** Big Shoulders Display (800 y 900, con Arial Narrow, Impact, sans-serif)
**Body Font:** Atkinson Hyperlegible (400 y 700, con system-ui, sans-serif)
**Numeral Font:** Big Shoulders Stencil Display (800, con Big Shoulders Display, Impact)

**Character:** una voz de rótulo de lonja contra un texto pensado para legibilidad máxima. Las fuentes se sirven en local en woff2 con `font-display: swap`. Todos los titulares, botones y entradas de menú van en mayúsculas.

### Hierarchy
- **Display** (900, clamp(4.25rem, 11vw, 9rem), 0.88): h1 del hero, con mayúsculas; el `em` va en amarillo de lote y en bloque propio.
- **Headline** (900, clamp(2.5rem, 6vw, 4.25rem), 0.95): h2 de sección; `text-wrap: balance`. En prosa baja a clamp(2.25rem, 5vw, 3.25rem). H1 de página interior: 900, clamp(3.5rem, 9vw, 7rem), 0.9.
- **Title** (800, 2rem, 1): h3 de pasos y garantías; títulos de lote 800, clamp(1.5rem, 2.8vw, 2rem); títulos de nivel 900, clamp(2.25rem, 4.5vw, 3.25rem).
- **Numeral** (stencil 800, 5.5rem en pasos, 2.6rem en lotes, 1.35rem en sellos): únicamente números.
- **Body** (400, 1.1875rem, 1.6): base del tema. Prosa interior 1.25rem con interlineado 1.65 y columna máxima de 44rem; lead del hero clamp(1.25rem, 2.2vw, 1.5rem) con 34rem máximo.
- **Label** (800, 1.5rem botón, 1.25rem menú, 1.15rem botón pequeño; tracking 0.04 a 0.05em; mayúsculas): botones, menú, pestañas de cuenta.

### Named Rules
**La regla del rótulo.** Todo lo que el visitante pulsa o que titula una sección va en Big Shoulders Display en mayúsculas; todo lo que se lee en frases va en Atkinson. Las frases dentro de un rótulo (resúmenes de lote, subtítulos de nivel) vuelven a Atkinson en minúsculas y 400.

**La regla del estarcido.** El stencil solo se usa en cifras. Nunca para palabras.

## Layout

Contenedor `.nep-dins`: ancho `min(100% - 2 × margen, 74rem)` centrado, con margen lateral fluido clamp(1.25rem, 5vw, 3rem). Las secciones son bandas a ancho completo con relleno vertical clamp(3rem, 8vw, 6rem); las páginas interiores usan clamp(2.5rem, 6vw, 4.5rem). Las rejillas son de 7/5 (hero, contacto), 4/8 (nivel y lotes), 6/4 (pie) y 3 columnas iguales (pasos, garantías), con `minmax(0, …)`.

La prosa interior se limita a 44rem y se alinea a la izquierda, no se centra. Cabecera: marca a la izquierda, menú y botón «Entra a jugar» a la derecha; entre 40 y 78 rem el menú pasa a su propia fila; por debajo de 40rem el botón de cabecera se oculta y vive dentro del menú desplegable (fondo azul de puerto). Todas las rejillas colapsan a una columna entre 52 y 56 rem. `scroll-padding-top: 1rem`; enlace «Salta al contingut» visible al recibir foco.

Cada cambio de banda importante lo separa la cuerda (`.nep-corda`, 10 px, patrón de aspas blancas semitransparentes sobre azul de puerto): bajo la cabecera, sobre el pie y tras los rótulos interiores.

### Named Rules
**La regla de la cuerda.** Las bandas de color no se tocan en seco bajo la cabecera ni junto al pie: la cuerda las separa. Es el único ornamento repetido.

## Elevation & Depth

Sistema plano. No hay `box-shadow` en el CSS. La profundidad sale de tres recursos: bloques de color a ancho completo, reglas gruesas de tinta (4 px) y trazos discontinuos (2 px) para repartir filas. La única profundidad simulada es el mensaje de cebo del hero, una tarjeta blanca inclinada (-2.5° con balanceo de 6 s), colgada de un hilo; su movimiento se anula con `prefers-reduced-motion`.

### Named Rules
**La regla del plano.** Ninguna superficie lleva sombra. Lo que se separa, se separa con color o con regla.

## Shapes

Esquinas moderadas y una familia clara: botones de 10 px, elementos de menú de 8 px, enlaces de pie de 6 px, foco de 4 px, tarjeta de cebo de 18 px, etiquetas y sellos totalmente redondos (999 px y 50%). La nota informativa es la excepción recta: caja de 2 px sin radio, con filo superior de 8 px. Las cajas rectas son estructura; lo redondo es lo que se puede pulsar o lo que señala.

Regla de borde: las reglas de sección son de 4 px en tinta, las divisorias internas de 2 px discontinuas (`rgb(11 30 63 / 0.35)` sobre claro, `rgb(255 255 255 / 0.4)` sobre azul), los botones llevan 3 px de borde (2 px en el pequeño) del mismo color que el fondo, para que el hover no mueva la caja.

## Components

### Buttons
Rótulos pulsables, grandes y planos.
- **Shape:** esquina de 10 px, mínimo 3.5rem de alto (3rem de cuerpo de 1.5rem), mayúsculas de rótulo.
- **Lot (principal):** fondo amarillo de lote, texto tinta. Hover #FFE27A, active #F2BD12 y desplazamiento de 2 px hacia abajo.
- **Contorn (secundario sobre azul):** borde y texto blancos; hover invierte a blanco con texto azul; active en espuma.
- **Mar (secundario sobre claro):** azul de lonja con texto blanco; hover azul de puerto; active tinta.
- **Tamaños:** `gran` 4.5rem y cuerpo clamp(1.75rem, 3.2vw, 2.25rem), a ancho completo por debajo de 30rem; `petit` 2.75rem con borde de 2 px.
- **Focus:** contorno de 4 px en `--nep-focus`, desfase de 3 px.

### Navigation
Barra azul con entradas en rótulo de 1.25rem (1.1rem en pantallas anchas), altura mínima de 2.75rem y esquina de 8 px. Hover con blanco al 16%; página actual en blanco con texto azul (`aria-current="page"`). Móvil: superposición en azul de puerto con entradas de 2rem y objetivos de 3.5rem.

### Hero y cebo (componente firma)
Hero azul 7/5: h1 en rótulo con la palabra clave en amarillo; a la derecha, el mensaje falso en una tarjeta blanca inclinada colgada de un hilo SVG, con tres sellos rojos numerados que apuntan a las pistas y una lista de pistas debajo. Un pez ilustrado adorna la esquina (se oculta bajo 56rem).

### Pasos y lotes
Pasos: tres columnas bajo regla de 4 px, separadas por trazo discontinuo, con cifra stencil de 5.5rem en azul. Lotes: filas en rejilla (cifra, título con resumen opcional, etiqueta pill de plataforma) agrupadas por nivel en bandas con regla de 4 px arriba (y abajo en el último). La etiqueta (`Ordinador` / `Mòbil`) es blanca con borde de 2 px en tinta.

### Garantías, nota y pista numerada
Garantías: bloque azul de puerto con `dt` amarillo de rótulo y `dd` blanco. Nota: caja blanca con filo superior verde. Lista de pistas: contadores rojos redondos en stencil sobre filas discontinuas.

### Pie
Azul de puerto, marca en 2.5rem, enlaces de 2.75rem de alto con hover blanco al 16%, línea inferior con trazo discontinuo.

## Do's and Don'ts

### Do:
- **Do** usar los colores del `theme.json` mediante `--nep-*`; los únicos valores fuera son los dos estados del botón de lote.
- **Do** poner el botón de lote como acción principal de cada pantalla, y repetirlo al cierre de la portada.
- **Do** mantener objetivos de al menos 2.75rem (44 px) y foco de 4 px, redefiniendo `--nep-focus` en blanco sobre fondos azules.
- **Do** separar bandas con la cuerda y repartir filas con trazo discontinuo de 2 px o regla de 4 px.
- **Do** respetar `prefers-reduced-motion` en cualquier animación nueva.
- **Do** escribir los textos en catalán, sin marcas reales y sin emojis; iconos SVG propios.

### Don't:
- **Don't** añadir sombras: el sistema es plano.
- **Don't** usar el rojo como adorno ni como color de error genérico.
- **Don't** usar el stencil para palabras ni Big Shoulders para frases largas.
- **Don't** centrar la prosa larga ni pasar de 44rem de columna.
- **Don't** usar el amarillo de lote en más de una acción por pantalla.
- **Don't** inventar cifras, testimonios ni afirmaciones: el sitio enseña a desconfiar y no puede parecer una estafa.
