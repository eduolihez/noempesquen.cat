# Fase 1 · corte 4a — Libertad aparente (apps de relleno)

Fecha: 2026-10-30 · Escala: L · Spec: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md` (secciones «Mundo simulado», «Aspecto visual»)

## Objetivo

Que el móvil simulado se sienta como un móvil real: todas las apps del spec se abren, tienen contenido creíble y no intervienen en ninguna misión. Se añade además la web «El Diari del Barri» al navegador (PC y móvil).

## Criterios de hecho

- Desde la pantalla de inicio del móvil se abren Galeria, Ajustos, Càmera, Calculadora, Rellotge y Ullada; el botón/gesto «Enrere» funciona dentro y fuera de ellas.
- `diaridelbarri.cat` carga una web de noticias en el navegador del PC y del móvil (hoy da página de error).
- Ajustos incluye «Apagar» (abre la pausa) y se conserva el de Centro de control.
- Roboto empaquetada (licencia OFL) como tipografía del móvil, sin peticiones externas.
- Las 3 misiones existentes siguen pasando (sin cambios de comportamiento).
- Lint, `test:unit`, build y Playwright (proyectos `escriptori` y `mobil`) en verde, con la salida real.
- axe sin violaciones serias en cada app nueva; objetivos ≥ 24 px (44 px en móvil).

## No entra (va a 4b)

PC en móvil horizontal, selector rediseñado, sonidos (Ajustos solo guarda la preferencia «Sons»), revisión visual a 4 anchos, `Esc` real manual, deudas menores de corte 2 y 3.

## Decisiones fijadas

- Imágenes: **ilustraciones SVG propias** (componente `Ilustracio`), sin WebP ni descargas. Sin caras reales, sin marcas.
- Las apps de relleno viven solo en `APPS_MOBIL` (el PC no tiene apps nuevas en este corte).
- Ninguna app de relleno emite eventos al motor salvo el `app.obre` que ya emite el sistema.
- Estado de las apps de relleno: local al componente. La única preferencia persistida es `sons` en `localStorage` (clave `noempesquen-sons`), con `try/catch`. Nada de lo que escriba el jugador se guarda.
- Datos del mundo en `mon.json`, claves nuevas `galeria`, `diari`, `ullada`, validadas por un `validaMon` nuevo.
- Textos del juego en catalán, identificadores en catalán, commits en inglés.

## Tareas

Cada tarea la ejecuta un implementador con contexto limpio + un revisor. Las T2–T8 son independientes entre sí; **los ficheros compartidos (`registre.js`, `style.scss`, `mon.json`, `Inici.js`) los toca solo T1 y T9** para evitar conflictos.

### T0 · Rama

`git checkout -b feat/fase1-corte4a-farcit` desde `master`.

### T1 · Mundo y utilidades comunes

Ficheros: `missions/mon.json`, `SIM/nucli/valida-mon.js` (+ test), `SIM/ui/ilustracions.js`, `SIM/ui/test/`.

- `mon.galeria`: ~12 fotos `{ id, titol, data, il·lustracio }` (paisajes, comida, mascota, calle del barrio), ordenadas por fecha.
- `mon.diari`: ~8 noticias `{ id, titol, entradeta, cos, seccio, data, il }` del barrio (mercado, obras, fiestas, biblioteca), tono neutro.
- `mon.ullada`: ~8 perfiles y ~10 publicaciones `{ id, autor, text, il, likes }`. Sin enlaces a sorteos (eso es fase 2).
- `validaMon(mon)`: devuelve lista de errores (ids únicos, ilustración existente, campos obligatorios). Test con mon real y casos rotos.
- `Ilustracio({ id, ... })`: SVG decorativo (`aria-hidden`, el alt lo pone quien la usa) generado por id (gradientes y formas). Lista de ids exportada para validar.

Hecho cuando: `validaMon(mon)` devuelve `[]` y los tests pasan.

### T2 · Calculadora

`SIM/apps/calculadora/`: `calc.js` (lógica pura: reductor de teclas, errores de división por cero, decimales, encadenado), `Calculadora.js`, `icones.js`, `test/calc.test.js`. Teclado físico (dígitos, `+-*/`, Enter, Backspace). Resultado en `role="status"`.

### T3 · Rellotge

`SIM/apps/rellotge/`: pestañas Hora (hora del juego vía `useJoc().hora` + 3 ciudades), Cronòmetre, Temporitzador. Lógica pura en `temps.js` (+ test). Los temporizadores de la app **respetan la pausa** (se paran con `PAUSA`).

### T4 · Càmera

`SIM/apps/camera/`: visor negro, mensaje «No s'ha pogut accedir a la càmera en aquest simulador.», botones decorativos desactivados con `aria-disabled`. **No** llama a `getUserMedia` (regla: nada del dispositivo real).

### T5 · Galeria

`SIM/apps/galeria/`: cuadrícula por fechas, visor a pantalla completa con anterior/siguiente, atrás interno con `registraEnrere`, cierre con `registraMenu`. Alt de cada foto desde `titol`.

### T6 · Ajustos

`SIM/apps/ajustos/`: lista (Wi-Fi, Pantalla, So, Aplicacions, Sobre el telèfon) con subpantallas de solo lectura y conmutadores locales. «So» → interruptor «Sons» (persistido, ver decisiones). **«Apagar»** → `dispatch({ tipus: 'PAUSA' })`. «Sobre el telèfon» muestra a Àlex Puig y un modelo inventado.

### T7 · Ullada

`SIM/apps/ullada/`: feed de publicaciones de relleno, historias decorativas, «m'agrada» local, pestañas Inici/Cerca/Perfil. Estructura de datos lista para que la fase 2 añada el sorteo falso sin tocar el componente base (prop `publicacions` desde el mundo + las de la misión).

### T8 · El Diari del Barri (web)

`SIM/webs/diari/`: `Diari.js` (portada + artículo según `url`), `Marca.js`, estilos `nep-dv-*` propios (no reutilizar `nep-lc-*`). Registrar en `WEBS`.

- `resolWeb` (`apps/navegador/historial.js`): fallback por host `diaridelbarri.cat` → plantilla `diari`, igual que `posta.cat`. Test del caso en `apps/navegador/test/`.
- Enlaces internos con `propsEnllac` (nunca navegan el navegador real).

### T9 · Integración

Ficheros compartidos: `apps/registre.js`, `sistemes/mobil/Inici.js`, `SIM/style.scss`, parciales `estils/_*.scss`.

- Registrar las 6 apps en `APPS_MOBIL`; dock `missatges`, `navegador` se mantiene; cuadrícula en orden: Parla, Banc Sòlid, Galeria, Càmera, Ullada, Calculadora, Rellotge, Ajustos.
- Añadir los parciales SCSS (`_galeria`, `_ajustos`, `_camera`, `_calculadora`, `_rellotge`, `_ullada`, `_diari`) y el `@use`.
- **Validador**: `validaMissio` comprueba que las `apps` de una misión existan en el dispositivo (cierra la deuda de «Antes de abrir la creación de misiones v2»). Lista de ids en un módulo puro `apps/claus.js` (sin JSX) para poder testearlo; un test e2e comprueba que coincide con `registre.js`.

### T10 · Roboto empaquetada

- Añadir `@fontsource/roboto` como devDependency, copiar `latin-400/500/700 .woff2` a `plugins/noempesquen-core/assets/fonts/` junto con la licencia OFL.
- `@font-face` en `estils/_mobil.scss` (con `font-display: swap`) y pila `Roboto, system-ui, sans-serif` en el móvil.
- Comprobar que el catalán se ve bien (`à è é í ò ó ú ç ï ü ·`) y que no hay peticiones a dominios externos.

### T11 · E2E y accesibilidad

`tests/e2e/farcit.spec.js` (proyecto `mobil`; `test.skip(!isMobile)` en lo propio del móvil):

- Abrir cada app desde Inici, comprobar región con nombre, volver con «Enrere» y con «Inici».
- Galeria: abrir visor, siguiente/anterior, `Esc` cierra el visor antes de abrir la pausa.
- Calculadora: `7 × 6 =` → `42` por teclado.
- Ajustos → Apagar abre el diálogo de pausa.
- Diari en `escriptori` y `mobil`: escribir la URL en la barra, ver la portada, abrir un artículo.
- axe sin violaciones serias en cada app; objetivos táctiles de 44 px.
- Regresión: `factura`, `paquet`, `banc`, `canviat` sin cambios.

### T12 · Textos, revisión y cierre

- Pasar todos los textos catalanes públicos (noticias, ajustes, publicaciones) por **`humanizer-es`**.
- Revisión: `reviewer` sobre la rama; `security-reviewer` solo en lo que toca `localStorage`, enlaces simulados y la web del diario.
- Verificación con `verification-before-completion`: lint, `test:unit`, build, Playwright, con la salida real.
- Actualizar `docs/estat-del-projecte.md` (corte 4a hecho, 4b pendiente) y `docs/decisions.md`.
- Merge a `master` **solo cuando Edu lo confirme**.

## Orden y paralelismo

`T0 → T1 → (T2 T3 T4 T5 T6 T7 T8 en paralelo, ficheros disjuntos) → T9 → T10 → T11 → T12`.
Se ejecuta con la skill `orquestar` (≥ 4 tareas y ≥ 8 ficheros).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Conflictos en `registre.js` / `style.scss` | Solo T1 y T9 los tocan; las apps entregan su parcial sin enlazarlo |
| Temporizadores del Rellotge ignoran la pausa | Test de lógica pura + e2e de pausa |
| Texto de relleno que parezca una pista de misión | Revisar que ninguna noticia/publicación mencione bancos, paquetes ni electricidad |
| Ilustraciones SVG pesadas | Generadas por código a partir de pocos parámetros; medir el tamaño del `view.js` antes y después (hoy 78,7 KiB) |
| Nombre con mayúsculas en Windows | Nombres de carpeta en minúscula y sin duplicados |
