# Fase 2 · corte 5a: «Has guanyat un sorteig!» y «Em passes el codi?»

Fecha: 2026-10-30 · Estado: pendiente de aprobación (puerta 2)

## Objetivo

Dos misiones móviles nuevas (guía: Remei) sobre el núcleo v2, sin motor nuevo:

- **remei-03-sorteig** — Una publicación de Ullada anuncia un sorteo en el que «has guanyat». El enlace lleva a una web que pide pagar los gastos de envío. Pescat: pagar.
- **remei-04-codi** — Marta (contacto conocido, cuenta robada) escribe por Parla pidiendo el código que acaba de llegar por SMS. Pescat: reenviarle el SMS.

## Decisiones de diseño (con base en el código leído)

| Tema | Decisión | Motivo |
|---|---|---|
| Robo del código | Dos vías de pescat: reenviar el SMS (`missatge.reenvia a:"marta"`, ya existe) **y teclear el código en el chat**: el cliente compara en local lo escrito con el código del SMS y emite `codi.comparteix { contacte }` (nuevo) **sin texto** | Teclear los dígitos es lo más natural; sin esta vía la misión enseñaría lo contrario. Respeta la regla de formularios (el motor no recibe lo escrito, solo un hecho). La comparación vive en una función pura testeable. |
| Enlace en Ullada | `Publicacio.js` pasa a renderizar `cos` opcional con `Cos` (segmentos `{t,senyal}` y `{enllac,senyal}`); sin `cos` sigue pintando `text` | Reutiliza lupa, `propsEnllac` y el patrón de `Missatges` (`enllac.obre` + `obreApp('navegador')`). |
| Web del sorteo | Plantilla nueva `sorteig` (variante `falsa` y `oficial`), marca inventada «Sorteig del Barri» | `enviat/Falsa.js` tiene el texto fijo de paquetes. |
| Evento de pago | `pagament.fes` desde `FormulariFals` (campo `esdeveniment` en el JSON) | Es lo que usa el banco. |
| Perfiles de Ullada | Se añaden a `mon.json` (`p_sorteigs`, `p_botiga`); el validador no comprueba `autor` | Una misión no puede definir perfiles. |
| Denunciar | Evento nuevo `publicacio.denuncia {id}` con un **botón visible «Denuncia»** (≥44 px) en cada publicación, sin menú | Más accesible, no requiere `registraMenu` ni toca la ergonomía del feed; equivale a la opción correcta (las dos vías valen). |
| Plantilla `sorteig` | Solo variante `falsa` | La `oficial` no la usa ninguna misión (sobra). |
| Consecuencia | Tras pagar: pantalla con el cargo de la tarjeta y suscripción oculta; tras compartir el código: cuenta de Parla secuestrada y mensajes a los contactos. El consejo final incluye verificación en dos pasos y avisar a Marta por otro medio | Enseña el daño real. Comprobar en T0 si el módulo de consecuencia/`tancament` soporta texto por pescat; si no, usar `frases.pescat` y `tancament`. |
| Eventos nuevos del corte | `publicacio.denuncia` y `codi.comparteix` | Documentados en `format-missions.md`. |
| Sin acción del jugador | No hay final automático: la misión espera hasta que decida en el chat (igual que las demás) | Coherente con fase 1; las pistas por inactividad guían. |

## Misión 5 · `remei-03-sorteig`

- Mundo: feed con relleno + la publicación de `p_sorteigs` («@sorteigs_barri», casi igual que la botiga real `p_botiga`) con `cos` y enlace `sorteig-barri.top`.
- Señales: cuenta casi idéntica a la oficial, premio desproporcionado y urgencia, «has guanyat» sin haber participado, dominio `.top`, pago para cobrar un premio, campos de más (tarjeta).
- Decisión (solo chat): **a)** Denunciar y no tocar el enlace (correcta) · **b)** Ignorarlo sin más (parcial) · **c)** Pagar los 2,95 € (incorrecta, pescat). Se retira «comentar» (no tiene evento).
- Disparadores: `inici` → guía; `pagament.fes` en la web falsa → `pescat`; `publicacio.denuncia` de la publicación → `decideix a`; `web.carrega` de la falsa → `guia-diu web_falsa`.
- Perfecta = 3 estrellas por camino seguro (con `requereix` en los senyals de la web falsa, como en las otras).

## Misión 6 · `remei-04-codi`

- Mundo: SMS oculto de «Parla»: «Codi per entrar a Parla des d'un dispositiu nou: 482 913. No el comparteixis amb ningú.» (el motivo del código hace verificable que Marta no esperaba nada); xat `marta` (contacto de `mon.json`) con mensajes ocultos de `id` propio (`codi-*`) para no alterar remei-01/02.
- Secuencia: tras el desbloqueo, Marta escribe («Ei! Em pots fer un favor?») → a los N s llega el SMS (`notifica` en Missatges, `font: "mobil"`) → Marta insiste («Me'l passes? és urgent, el necessito ara»).
- Señales: mensaje fuera de su estilo, urgencia, petición de un código recibido, el SMS avisa de no compartirlo, Marta no estaba esperando ningún código (hora/contexto).
- Decisión (solo chat; borrar el SMS **no** puntúa): **a)** No enviar el código y avisar a Marta por otro medio (correcta) · **b)** Decirle que no ha llegado nada (parcial) · **c)** Pasarle el código (incorrecta, pescat).
- Disparadores: `missatge.reenvia {app:'missatges', id:<sms>, a:'marta'}` con `visible` → `pescat`; `codi.comparteix {contacte:'marta'}` con `visible` → `pescat`; resto igual que arriba.

## Tareas (≥4 → `orquestar`)

| # | Tarea | Ficheros | Hecho cuando |
|---|---|---|---|
| T0 | Comprobar cómo `Consecuencia`/`tancament` muestran el pescat y si admiten un texto de daño por misión; correr la suite actual como línea base | `simulador/Consecuencia*`, `format-missions.md` | Nota en el plan con el resultado; suite base en verde |
| T1 | `Publicacio.js` acepta `cos` (enlace → `enllac.obre` + navegador) y botón «Denuncia» → `publicacio.denuncia`; función pura `coincideixCodi(escrit, codi)` y emisión de `codi.comparteix` en Parla (`useParla`/`Conversa`) | `apps/ullada/*`, `apps/parla/*`, `estils/_ullada.scss` | Unit de `coincideixCodi` y del filtrado; e2e en T5 |
| T2 | Eventos `publicacio.denuncia` y `codi.comparteix` en `ESDEVENIMENTS`; validar `cos` de publicaciones y que `autor` exista en `mon.ullada.perfils`; doc (eventos, `apps.ullada`, plantilla `sorteig`) | `nucli/valida.js`, `nucli/test/valida.test.js`, `docs/format-missions.md` | Tests de validación en verde |
| T3 | Plantilla `sorteig` (solo falsa) en `webs/registre.js` y `PLANTILLES_WEB`; perfiles y relleno de Ullada en `mon.json` | `webs/sorteig/*`, `estils/_sorteig.scss`, `style.scss`, `mon.json` | La web carga, el formulario emite `pagament.fes` |
| T4 | Misiones `remei-03-sorteig.json` y `remei-04-codi.json` (mensajes de Marta con ids `codi-*`) + registro en `App.js` + `selector.spec` | `missions/*.json`, `simulador/App.js` | `validaMissio` = [] y remei-01/02 siguen verdes |
| T5 | Tests: unit por misión (3 estrellas, pescat por cada vía, borrar el SMS no puntúa) y e2e por misión (correcto, pescat, axe, `petits`, `sensePistes`, espía de red y consola que demuestra que lo tecleado no sale) | `nucli/test/sorteig.test.js`, `codi.test.js`, `tests/e2e/sorteig.spec.js`, `codi.spec.js` | Todo en verde |

`petits` y `sensePistes` son helpers existentes de `tests/e2e/ajudes.js` (objetivos <44 px y que lo tecleado no aparezca en estado/red/consola).

Orden **secuencial** T0 → T1 → T2 → T3 → T4 → T5 (T2 depende del esquema de T1; T3 y T4 editan `mon.json`). Con `orquestar`: un implementador y un revisor por tarea.

## Criterios de hecho

Los globales del flujo más: `npm run lint:js`, `lint:css`, `test:unit`, `build`, `npx playwright test` con salida real; axe sin violaciones serias en Pixel 7; e2e que demuestra que lo tecleado (incluido el código) no está en estado, consola ni red; test de que los JSON nuevos no contienen marcas reales; textos de las misiones pasados por `humanizer-es` antes de cerrar; selector con 7 misiones; remei-01/02 y llissa-01/02 siguen verdes.

## Riesgos

- `Ullada` no filtra `ocult`: no usar `mostra` con publicaciones (se evita: la publicación del sorteo es visible desde el inicio).
- `ESDEVENIMENTS_FORMULARI` está duplicado en `formulari.js` y `valida.js`: al usar `pagament.fes` no se toca, pero comprobar que sigue sincronizado.
- Windows: `Falsa.js` existe en varias webs, cada una en su carpeta; nada de `Sorteig.js`/`sorteig.js` juntos.
- Las deudas de `docs/estat-del-projecte.md:49` están desfasadas (`valida.js` ya valida `apps.ullada.publicacions`): corregirlo al cerrar.

## Fuera de alcance del corte

Revenda, inversión, pop-up, falsa actualización (cortes 5b y 5c); `Cos` con `ocult` en Ullada; deudas menores anteriores.
