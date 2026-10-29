# Fase 1 · corte 2: sistema móvil y «El paquet retingut» (v2)

Spec: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`. Rama: `feat/fase1-corte2-mobil`. `SIM/` = `plugins/noempesquen-core/src/blocks/simulador/`.

## Objetivo

Que «El paquet retingut» se juegue entera en un móvil simulado a pantalla completa (formato v2, Àlex como dueño del móvil, Remei como contacto de Parla), y eliminar el legado v1 (`SIM/app/`).

## Hecho cuando

- `lint:js`, `lint:css`, `test:unit`, `build` y Playwright pasan con salida real (proyectos `escriptori` y `mobil`).
- La misión se completa por el camino correcto (3 estrellas), por el camino de «pescat» y por la vía parcial, en e2e.
- axe sin violaciones serias en el sistema móvil (escritorio con marco y Pixel 7).
- `SIM/app/` no existe; `view.js` monta la nueva carcasa; el selector sigue funcionando.
- Comprobación manual de `Esc` en Chrome con ventana visible (la hace Edu).

## Decisiones de diseño (revisables)

1. **Un solo `Simulador`.** `SISTEMES` gana `mobil: lazy(() => import('../sistemes/mobil/Mobil'))`. El motor v2 no cambia de fases; solo se amplía el vocabulario de eventos.
2. **Mapa de la decisión del paquete → mundo.** `contacte.bloqueja` (el número del SMS) → `decideix c`. `missatge.reenvia` a «Família» → `decideix d` (parcial). `missatge.respon` → `decideix b`. Abrir el enlace → web falsa de Envia't; `formulari.envia` allí → `pescat` (a).
   - **Esborrar y bloquear, en cualquier orden, llegan a `c`.** «Bloqueja» ofrece «i esborra la conversa» (como los móviles reales) y el bloqueo es accesible también desde la ficha del contacto, que sobrevive al borrado. `missatge.esborra` solo no decide: el guía dice «Bloqueja també el número perquè no insisteixin» y el número sigue localizable desde la ficha.
3. **Lupa y pausa en el móvil.** Lupa en el centro de control (deslizar desde arriba o tocar la barra de estado), con atajo `Alt+Mayús+L` como en el PC. El spec pone el acceso a la pausa en Ajustos, que no existe hasta el corte 4: aquí «Apagar» (pausa) vive en el centro de control y en el corte 4 se añade también en Ajustos.
4. **Ver el enlace entero.** Mantener pulsado (o botón derecho / `Shift+F10`) sobre un enlace de Missatges abre una hoja inferior con la URL completa y «Obre» / «Cancel·la». Sustituye al `FullEnllac` legado. Registra su cierre con `registraMenu`.
5. **Responder a un SMS** no guarda lo escrito: el campo es no controlado, se vacía al enviar y el motor solo recibe `{ app, id }`.
6. **Parla y Navegador se comparten con el PC.** La lógica de `Parla.js` pasa a un hook (`useParla`) y el Navegador se parte en lógica común + dos cáscaras (PC con pestañas en ventana; móvil con barra única + selector de pestañas simple). No se duplica `historial.js`, `infoPagina.js` ni `Pagina.js`.
7. **Plantilla web `enviat`**: oficial (seguimiento: «no tens cap paquet pendent amb aquest número») y falsa (`.top`, pide 1,99 € con tarjeta). Los componentes de formulario falso de `webs/llum-clara/` (`FormulariFals`, `CampSuggerit`, `formulari.js`) suben a `webs/comu/` y las dos marcas los usan.
8. **Compatibilidad.** El legado v1 se borra al final, cuando ya no queda ninguna misión v1 incluida. Las remotas v1 se siguen ignorando (`combinaMissions`).

## Tareas

Cada tarea termina con lint + tests relevantes y un commit convencional en inglés. Orden pensado para que cada paso compile y deje la factura jugable.

### T0 · Base
- Crear la rama; correr la batería completa y anotar el estado de partida (referencia para detectar regresiones).

### T1 · Vocabulario del motor (puro, con tests)
- `nucli/valida.js`: añadir apps `missatges` a `APPS_PC`→`APPS` (renombrar con alias para no romper), plantilla `enviat`, eventos `contacte.bloqueja`, `missatge.esborra`, `missatge.reenvia`, `missatge.respon`, `enllac.mantingut`.
- Validar de paso (pendiente anotado): `mostra.id` existe en algún `apps.*.*[].id` y `notifica.app` pertenece a las **fuentes de notificación**: apps de ambos dispositivos más `posta` (que es una web, como usa `llissa-01-factura.json`) y `enviat` si hace falta. Los tests pasan las dos misiones incluidas por el validador.
- `disparadors.js`: `coincideix` ya compara claves arbitrarias; solo hay que cubrir los casos nuevos con tests.
- Tests: `valida.test.js` (válido/invalido para cada novedad), `disparadors.test.js` (bloqueo → decideix, reenvío → decideix).

### T2 · Contenido: `mon.json` y la misión v2
- `mon.json`: añadir `missatges.fils` de relleno (Jordi→Pau, farmacia, banco, madre), contacto `remei` (guía) y `numero_desconegut`; nombres de contactos coherentes con Parla.
- Reescribir `remei-01-paquet.json` a v2: `dispositiu: "mobil"`, `rellotge: "19:40"`, SMS trampa con segmentos `{ t, senyal }` y enlace, `webs` de `enviat-entrega.top` (falsa) y `enviat.cat` (oficial), `disparadors` según la decisión 2, `pistes`, `frases` (`web_falsa`, `pescat`, `esborra_sol`). Textos de Remei como contacto de Parla, no como dueña del móvil.
- **Marca:** el remitente pasa de «PaqXpres» a **Envia't** (única marca de paquetería inventada del proyecto); se reescriben los textos de las señales `paquet` y `enllac`.
- **Coherencia con el mundo:** `mon.json` ya tiene un pedido de Botiga Verda «en camí», así que la señal `paquet` ya no es «no esperes ningún paquete» sino «el número de seguimiento no coincide con ningún pedido tuyo, y pagar para liberar un paquete es el cebo». La web oficial `enviat.cat` enseña la comprobación correcta («cap paquet amb aquest número»).
- **Llegada:** el SMS trampa va oculto (`ocult: true`, `objectiu: true`, bajo `apps.missatges.missatges`) y llega tras el desbloqueo con `mostra` + `notifica` (banner) desde un disparador `inici` con retardo, como `arriba-trampa` en la factura. Así funcionan `obreObjectiu` y las pistas por inactividad.
- Pasar los textos por `humanizer-es` (catalán de cara al público) antes de cerrarlos.
- Test de misión (`missions.test.js` o nuevo): válida, partida perfecta = 3 estrellas, camino de pescat, ninguna opción inalcanzable.

### T3 · Sistema móvil (`SIM/sistemes/mobil/`)
- `Mobil.js` (raíz, equivalente a `Pc.js`), `Bloqueig.js` (hora/fecha/fondo, primera notificación de la guía; desbloqueo por clic, teclado o deslizar), `Inici.js` (cuadrícula de iconos + dock), `BarraEstat.js` (hora del juego, cobertura, batería), `CentreControl.js` (lupa, apagar), `Banners.js` (notificaciones tipo banner, tocables), `BarraNavegacio.js` (inicio/atrás para teclado y ratón), `context.js` y `pila.js` (reductor puro de la pila de apps: abrir, atrás, inicio; con test).
- Layout: en pantalla móvil, a pantalla completa sin marco; en pantalla grande, marco de teléfono centrado de la altura del viewport sobre un fondo desenfocado. Estilos en `estils/_mobil*.scss` (importar desde `style.scss`).
- `Esc`: cada panel/hoja registra su cierre con `useJoc().registraMenu`. Lupa por `Alt+Mayús+L`.
- Objetivos táctiles ≥ 44 px; foco visible; reduced-motion respetado.
- `registre.js` se divide: `APPS_PC` y `APPS_MOBIL`, con el mismo contrato de componente.

### T4 · Missatges (`SIM/apps/missatges/`)
- Lista de conversaciones (SMS de la misión + relleno de `mon.json`) y conversación con `Cos` / `Inspeccionable`.
- Menú del mensaje: Esborra, Bloqueja el número (con «i esborra la conversa»), Reenvia (selector de destino: Família / Pau / Marta), Respon (campo no controlado). Ficha del contacto con Bloqueja, accesible aunque la conversación se haya borrado.
- Emite `missatge.obre`, `missatge.esborra`, `contacte.bloqueja`, `missatge.reenvia`, `missatge.respon`, `enllac.obre`.
- Hoja de enlace (decisión 4).

### T5 · Parla móvil
- Extraer `useParla` de `Parla.js`; `Parla` (PC) sigue igual en pantalla; `ParlaMobil` = lista ↔ conversación en una sola columna con botón atrás. Banner → abre la conversación con la guía.

### T6 · Navegador móvil
- Separar lógica (`useNavegador`) de la cáscara. `NavegadorMobil`: barra de direcciones arriba con candado, atrás/adelante/recarga, botón de pestañas con contador y vista de lista de pestañas.
- Debe emitir los mismos `web.carrega` / `enllac.obre` / `formulari.envia`. Los enlaces simulados no navegan el navegador real (regla del proyecto).

### T7 · Web de Envia't
- `webs/enviat/` (`Enviat.js`, `Oficial.js`, `Falsa.js`), registro en `webs/registre.js`, tokens/estilos `_enviat*.scss`. Marca inventada, icono SVG propio. La versión falsa usa el formulario común (T7a: mover `FormulariFals`/`CampSuggerit`/`formulari.js` a `webs/comu/` con sus tests y comprobar que Llum Clara sigue verde).

### T8 · Integración y e2e
- `Simulador.js`: `mobil` en `SISTEMES`; `PERSONATGES` pasa a `ui/avatars.js` (el import de `Simulador.js` se actualiza aquí, para que T9 pueda borrar `app/`).
- `tests/e2e/paquet.spec.js`: proyecto `mobil` (Pixel 7) y `escriptori` (marco): camino correcto, pescat, vía parcial, lupa en el centro de control, `Esc` (menú → pausa), axe. Reutilizar helpers de `factura.spec.js` (extraerlos a `tests/e2e/ajudes.js` si se repiten).
- Quitar el `test.skip(isMobile)` solo de lo que ya aplique al móvil; el PC en móvil sigue en el corte 4.

### T9 · Eliminar el legado v1
- Mover el selector y la lógica de `app/App.js` a `simulador/App.js` (solo v2: sin `Joc`, `Mobil`, `Escriptori`, `Pantalles`, `BarraEines`, `Cos`, `motor` v1 ni su test). (`avatars.js` ya se movió a `ui/` en T8.)
- `view.js` importa la nueva `App`.
- `style.scss`: borrar los bloques v1 (`.nep-pc`, `.nep-correu`, `.nep-mobil`, `.nep-xats`, `.nep-xat`, `.nep-full`, `.nep-bombolla`, `.nep-capa`, `.nep-opcio(ns)`, `.nep-xarxa`, `.nep-resultat` viejos, `.nep-indicis`, `.nep-eines`, `.nep-joc*`) comprobando con búsqueda que nada del v2 los usa; conservar botones, selector, `.nep-inspecciona`, `.nep-marcat`.
- Cierra de paso los dos bugs del legado (lupa que se come espacios; «Tranquil»).
- `grep` final: ni una referencia a `app/` ni a `versio: 1` salvo en `combinaMissions`.

### T10 · Arrastres
- `usePista.js`: con `prefers-reduced-motion`, `Esc` dentro de los primeros 450 ms de un tooltip debe cerrarlo, no abrir la pausa.
- `aillament.js`: `MutationObserver` que aplica `inert` a nodos añadidos a `<body>` después de montar.
- Si el tiempo no da, estas dos pasan al corte 3 y se anotan; no bloquean el merge.

### T11 · Documentación, revisión y cierre
- Actualizar `docs/format-missions.md` (eventos, apps móviles, plantilla `enviat`), `docs/estat-del-projecte.md` y el mapa de `CLAUDE.md` (quitar `SIM/app/`, añadir `SIM/sistemes/mobil/`).
- Revisión final de rama (`reviewer` + `security-reviewer`: foco en formularios falsos, enlaces simulados, `localStorage`/consola/red) y verificación con evidencia.
- Merge a `master` solo si Edu lo confirma.

## Fuera del corte 2 (aplazado a propósito)

- Tipografía sans tipo Roboto empaquetada para el móvil (spec, «Aspecto visual»): corte 4. Aquí se usa la pila `system-ui`.
- «Apagar» en Ajustos: corte 4 (aquí, en el centro de control).
- Apps de relleno (Galeria, Ajustos, Càmera, Calculadora, Rellotge, Ullada, El Diari del Barri): corte 4. La pantalla de inicio muestra solo Missatges, Parla y Navegador; el resto de huecos de la cuadrícula quedan vacíos, no con iconos muertos.
- PC en móvil horizontal, selector rediseñado, sonidos: corte 4.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Partir el Navegador rompe la factura | Test de regresión e2e de `factura.spec.js` en cada commit de T6 |
| Mover los formularios comunes rompe Llum Clara | T7a aislado, con `factura.spec.js` verde antes de seguir |
| Gestos táctiles (pulsación larga, deslizar) poco fiables en Playwright | Alternativas por teclado/botón siempre presentes; el e2e usa esas, y la pulsación larga vive en un módulo puro (`pulsacio.js`) con test unitario en Node; el comportamiento del componente se verifica en e2e por la vía de teclado |
| Colisión de nombres en Windows | Nada de `Foo.js`/`foo.js` en la misma carpeta; revisar `webs/comu/` y `mobil/` |
| Borrar CSS v1 que aún usa algo v2 | Búsqueda de cada clase antes de borrarla; captura visual a 1440/1024/768/400 |
| Contexto lleno | Ejecutar con `orquestar` (≥4 tareas, ≥8 ficheros), un implementador y un revisor por tarea |

## Orden y paralelismo

T1 → T2 son puros y van primero. T3 antes que T4–T6. T4, T5 y T6 son independientes entre sí tras T3 (ficheros disjuntos salvo `registre.js` y `style.scss`, que se integran en serie). T7 puede ir en paralelo a T4–T6. T8 → T9 → T10 → T11 en serie.
