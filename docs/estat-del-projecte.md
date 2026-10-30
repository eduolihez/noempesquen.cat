# Estado del proyecto

Última actualización: 2026-10-30 (cortes 3, 4a, 4b, 5a y 5b mergeados a `master`; 5c en curso)

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
| Fase 2 y 3       | Misiones 9-10 (corte 5c): pop-up de soporte técnico, falsa actualización del navegador                     | Pendiente                                                                                                       |

## Cómo retomar

1. `npm install`, `npm run build`, `npm run env:start`. Si `/simulador/` da 404, crea la página (comando en el README).
2. Para un corte nuevo, el flujo que se ha seguido es: plan en `docs/superpowers/plans/AAAA-MM-DD-<corte>.md` (skill `superpowers:writing-plans`) → aprobación del usuario → rama `feat/...` → ejecución con subagentes y revisión por tarea (skill `superpowers:subagent-driven-development`) → revisión final de rama → merge a `master` cuando el usuario lo confirme.
3. El usuario quiere: máximo realismo, marcas inventadas, pantalla completa, sensación de libertad (apps y contenido de relleno que funcionan), público general. Las decisiones de la misión pueden tomarse dentro del mundo (denunciar, borrar, bloquear...) o en el chat con la guía.

## Pendientes conocidos

### Pendiente tras el corte 4b

- Hecho a mano el 2026-10-30: `Esc` real en Chrome visible y prueba en móvil horizontal.
- Deudas de accesibilidad y tamaño aceptadas (target-size en apps a escala ~0,57, texto ~8 px a 768×1024, borde de botones 1,3:1, estrellas del selector con lector de pantalla, CSS 251 KiB): detalle en `docs/decisions.md`.
- `agrupa.js` usa `DATA_MON='2026-10-29'` fija (mejor `mon.avui` validado); `cerca:` pasa el validador pero es inerte en enlaces de mensaje; `llegeixProgres` no filtra que los valores sean números; `validaMissio` no comprueba `typeof m.apps`.

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

- `validaMissio` puede lanzar con entradas `null` o no-array en `senyals`, `disparadors`, `efectes` u `opcions` (el `.catch` de la carga lo absorbe, pero conviene un `try/catch` en la validación de remotas).
- `llegeixProgres` debería devolver `{}` si lo guardado no es un objeto.
- Las misiones remotas v1 o inválidas se ignoran sin aviso (no se añadió el aviso en consola por la regla de no dejar `console`).

### Mejoras menores anotadas

- Hora de los mensajes de Parla: se calcula cuando Parla ve el mensaje por primera vez; sería más fiel guardar el tiempo de juego en el propio mensaje.
- Orden de tabulación de las ventanas según apertura, no según cuál está delante; la posición de las ventanas no se reajusta al redimensionar.
- Sin _error boundary_ si falla la carga de un trozo de JS (sistema, app o web).
- Navegador: pulsar Enter con la misma URL duplica el historial; `Esc` en la barra de direcciones no restaura el texto.
- Faltan e2e del teclado en la tira de pestañas y tests de componente de Consecuencia/Resultado.
