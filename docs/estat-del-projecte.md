# Estado del proyecto

Última actualización: 2026-10-30

## Dónde estamos

Se está rehaciendo el simulador para que parezca un ordenador y un móvil reales, a pantalla completa, con apps de marcas inventadas y la ayuda del juego integrada en el sistema (la guía es un contacto de Parla y la lupa es una herramienta del sistema). Diseño completo: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`.

| Fase / corte     | Contenido                                                                                                                                                                                           | Estado                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Fase 1 · corte 1 | Núcleo v2, PC simulado, Navegador, Parla, Posta, Llum Clara, misión «La factura de la llum»                                                                                                         | **Hecho** (merge a `master` el 2026-10-29, plan `docs/superpowers/plans/2026-10-29-fase1-corte1-pc-factura.md`) |
| Fase 1 · corte 2 | Sistema móvil (bloqueo, inicio, centro de control, banners), Missatges, Parla móvil, Navegador móvil, webs de Envia't; reescribir «El paquet retingut» a v2; **eliminar el legado v1** (`SIM/app/`) | **Hecho** (merge a `master` el 2026-10-30, plan `docs/superpowers/plans/2026-10-29-fase1-corte2-mobil-paquet.md`) |
| Fase 1 · corte 3 | Banc Sòlid (web real, web falsa, app, móvil vinculado en el PC) → «El banc et bloqueja el compte»; «Hola, he canviat de mòbil» en Parla | **Hecho en la rama `feat/fase1-corte3-banc`** (pendiente de merge a `master`, plan `docs/superpowers/plans/2026-10-30-fase1-corte3-banc.md`) |
| Fase 1 · corte 4 | Apps de relleno (Galeria, Ajustos, Càmera, Calculadora, Rellotge, Ullada, El Diari del Barri), PC en móvil horizontal, selector rediseñado, sonidos, revisión visual y de accesibilidad             | Pendiente                                                                                                       |
| Fase 2 y 3       | Misiones 5-10: sorteo falso en Ullada, robo del código de Parla, comprador falso en Revenda, inversión con famoso, pop-up de soporte técnico, falsa actualización del navegador                     | Pendiente                                                                                                       |

## Cómo retomar

1. `npm install`, `npm run build`, `npm run env:start`. Si `/simulador/` da 404, crea la página (comando en el README).
2. Para un corte nuevo, el flujo que se ha seguido es: plan en `docs/superpowers/plans/AAAA-MM-DD-<corte>.md` (skill `superpowers:writing-plans`) → aprobación del usuario → rama `feat/...` → ejecución con subagentes y revisión por tarea (skill `superpowers:subagent-driven-development`) → revisión final de rama → merge a `master` cuando el usuario lo confirme.
3. El usuario quiere: máximo realismo, marcas inventadas, pantalla completa, sensación de libertad (apps y contenido de relleno que funcionan), público general. Las decisiones de la misión pueden tomarse dentro del mundo (denunciar, borrar, bloquear...) o en el chat con la guía.

## Pendientes conocidos

### Comprobación manual que falta

- En Chrome con ventana visible: `Esc` real durante la misión debe abrir la pausa y mantener el simulador cubriendo la pantalla (los e2e solo simulan `document.exitFullscreen()`). Con «Més» o el candado abiertos, `Esc` los cierra primero.

### Pendiente tras el corte 2

- La barra de tareas del PC desborda a ~400 px (se resuelve con «PC en móvil», corte 4).
- Sin tests propios para el `Esc` con `prefers-reduced-motion` de `usePista.js` ni para el `MutationObserver` de `aillament.js`.
- Móvil: tipografía Roboto empaquetada, Ajustos y apps de relleno (corte 4). «Apagar» (pausa) vive en el centro de control hasta entonces.
- Menores: `IconaCadenat` vive en `llum-clara/Marca` y lo importa `webs/comu`; Envia't reutiliza estilos `nep-lc-*`; el `role="status"` de la web oficial de Envia't debería estar siempre en el DOM; `reset`/`enfocaAdreca` duplicado entre `Navegador` y `NavegadorMobil`; reabrir el mismo xat de Parla no recoloca el foco; el banner de Missatges abre la lista, no la conversación.

### Pendiente tras el corte 3

- Penalización parcial por entregar usuario, contraseña y DNI en la web falsa del banco (hoy solo penaliza enviar el código SMS); exige un efecto nuevo en motor y `valida.js`.
- Parla: `bloquejats`, `enviats` y `descartat` viven en estado local y se pierden al desmontar la app en móvil. La respuesta de Pau no lleva retardo (con retardo se cancelaría la decisión). `NOTIFICACIONS_LLEGIDES` con app `parla` marca también las de móvil.
- Sin test dedicado del timeout de respaldo de `Bloqueig.js` (solo lo cubre el e2e) ni comprobación visual del anillo de foco doble.
- Dominios `bancsolid.cat` y `bancsolid-acces.top` son registrables por terceros (riesgo bajo; opción: subdominio propio de noempesquen.cat).
- Borrar el correo del banco cierra la misión como parcial y ya no se puede marcar phishing (decisión de diseño, fijada en test).
- Menores: error genérico «Omple aquest camp.» en formularios comunes, `h1` fijo en la web del banco, `Object.freeze` de `ESDEVENIMENTS_FORMULARI`, falta test de `codi.envia` con url no coincidente, reutilizar `formulari.js` en la transferencia de la app.

### Antes de abrir la creación de misiones v2 desde el panel (CPT)

- El validador no comprueba que las apps de una misión existan en su dispositivo (`APPS_PC`/`APPS_MOBIL`).
- `validaMissio` puede lanzar con entradas `null` o no-array en `senyals`, `disparadors`, `efectes` u `opcions` (el `.catch` de la carga lo absorbe, pero conviene un `try/catch` en la validación de remotas).
- `llegeixProgres` debería devolver `{}` si lo guardado no es un objeto.
- Las misiones remotas v1 o inválidas se ignoran sin aviso (no se añadió el aviso en consola por la regla de no dejar `console`).

### Mejoras menores anotadas

- Hora de los mensajes de Parla: se calcula cuando Parla ve el mensaje por primera vez; sería más fiel guardar el tiempo de juego en el propio mensaje.
- Orden de tabulación de las ventanas según apertura, no según cuál está delante; la posición de las ventanas no se reajusta al redimensionar.
- Sin _error boundary_ si falla la carga de un trozo de JS (sistema, app o web).
- Navegador: pulsar Enter con la misma URL duplica el historial; `Esc` en la barra de direcciones no restaura el texto.
- Faltan e2e del teclado en la tira de pestañas y tests de componente de Consecuencia/Resultado.
