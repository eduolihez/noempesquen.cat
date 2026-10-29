# Fase 1 · Corte 1: PC realista + «La factura de la llum» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La misión «La factura de la llum» se juega de principio a fin dentro de un ordenador simulado a pantalla completa (bloqueo → escritorio → Posta en el navegador → web falsa de Llum Clara), con la Llissa integrada como contacto de Parla y la lupa como herramienta del sistema.

**Architecture:** Núcleo puro y testeado (`nucli/`: motor v2 con disparadores, validación, carga de misiones, progreso) + capa de sistema (`sistemes/pc/`: bloqueo, escritorio, barra de tareas, ventanas, notificaciones) + apps (`apps/navegador`, `apps/parla`) + webs por marca (`webs/posta`, `webs/llum-clara`). Las apps se comunican con el motor solo emitiendo eventos (`emet(nom, dades)`) y leyendo el estado a través de `JocContext`. El sistema PC se carga bajo demanda con `lazy()`.

**Tech Stack:** WordPress 7.1 (wp-env), bloque `noempesquen/simulador`, React de `@wordpress/element`, `@wordpress/scripts` 37 (webpack + SCSS), Vitest 5 (unitarios), Playwright 1.64 + `@axe-core/playwright` (e2e).

**Spec:** `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`

## Global Constraints

- Raíz del código: `plugins/noempesquen-core/src/blocks/simulador/` (en adelante `SIM/`). Misiones: `plugins/noempesquen-core/missions/`.
- Identificadores, nombres de archivo y textos del juego en **catalán**, como el código actual. Textos traducibles con `__( '...', 'noempesquen' )`.
- **Ninguna marca real** (Windows, Chrome, Gmail, WhatsApp...): ni nombres, ni logotipos, ni iconos copiados. Marcas: Posta, Parla, Llum Clara, Banc Sòlid, Envia't, El Diari del Barri, Ullada.
- **Formularios falsos:** `onSubmit` hace `preventDefault()`; los valores escritos **nunca** entran en el estado del motor, `localStorage`, consola ni red. El motor solo recibe el evento `formulari.envia` con `{ url, formulari }`.
- Sin trampas de teclado: `Esc` (o salir de pantalla completa) siempre lleva al diálogo de pausa, que tiene «Continua», «Reinicia la missió» y «Surt».
- WCAG 2.2 AA dentro del sistema simulado: todo operable con teclado, foco visible, `aria-live="polite"` para notificaciones y mensajes del guía, contraste AA, `prefers-reduced-motion` desactiva animaciones de ventanas.
- JS inicial del selector < 150 KB gzip; el chunk del sistema PC < 300 KB gzip.
- CSS del simulador bajo la clase raíz `.nep-so` con un _reset_ local; nada fuera de `.wp-block-noempesquen-simulador`.
- **Tareas de UI** (6-11): antes de escribir componentes, cargar el skill `example-skills:frontend-design` y seguir la dirección visual de abajo. Nada de emojis como iconos: SVG propios en `SIM/ui/icones.js`.
- Dirección visual del PC (inspirada en un escritorio Windows 11, sin marca): fuente `"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif` a 14 px; barra de tareas de 48 px centrada con `backdrop-filter: blur(30px) saturate(1.4)` sobre `rgba(243,243,243,.85)`; ventanas con radio de 8 px y sombra `0 8px 32px rgba(0,0,0,.28)`; barra de título de 32 px con botones de 46 px (el de cerrar se pone `#c42b1c` en hover); color de acento del sistema `#005fb8`; fondo de escritorio abstracto en SVG/CSS propio (sin imágenes).
- Navegador (inspirado en un navegador Chromium): franja de pestañas `#dfe3e7`, pestaña activa blanca con radio superior de 8 px, barra de direcciones en píldora `#f1f3f4` de 34 px con candado, barra de estado abajo a la izquierda que muestra la URL al pasar por un enlace.
- Posta (inspirada en un correo web moderno): navegación izquierda de 256 px con botón «Redacta», filas de 40 px, no leídos en negrita, acciones al pasar el ratón; acento `#c8452c`.
- Llum Clara: acento `#f5a300`, texto `#1d2a44`. La web falsa copia la oficial con fallos sutiles (logo algo distinto, pie sin enlaces legales, pide CVV y PIN).
- Commits convencionales en inglés, en la rama de trabajo; **nunca `git push`**.

## Review Focus

1. **Datos escritos en el formulario falso** → no deben aparecer en el estado, en `localStorage` ni en la consola. Test en la Tarea 11.
2. **Doble envío o clics repetidos tras «pescat» o una decisión** (enviar el formulario dos veces, marcar phishing después de pagar) → la primera consecuencia manda y las acciones posteriores se ignoran. Test en la Tarea 4.
3. **Pausa con temporizadores pendientes** (el correo trampa llega a los 8 s; pausar a los 5 s y esperar) → no llega nada ni salta ninguna pista mientras está en pausa. Test en la Tarea 4.
4. **Navegador sin Fullscreen API o que la rechaza** (iframe, Safari iOS, permiso denegado) → el juego funciona igual con la capa fija y el `Esc` lleva a pausa. Test e2e en la Tarea 13 (forzando el _fallback_).
5. **Misión remota inválida o v1 en el CPT** → no vacía el selector ni rompe la v2 incluida. Test en la Tarea 5.

---

### Task 1: Vitest como runner de unitarios

**Files:**

- Create: `vitest.config.mjs`
- Modify: `package.json` (script `test:unit`)

**Interfaces:**

- Produces: `npm run test:unit` ejecuta solo `plugins/**/test/**/*.test.js` con Vitest.

- [ ] **Step 1:** Crear `vitest.config.mjs` con `test.include: [ 'plugins/**/test/**/*.test.js' ]` y `test.environment: 'node'`.
- [ ] **Step 2:** Cambiar `"test:unit"` a `"vitest run"`.
- [ ] **Step 3:** Run `npm run test:unit`. Expected: `Test Files 1 passed`, 17 tests pass, sin rastro de `tests/e2e`.
- [ ] **Step 4:** Commit `chore: run unit tests with vitest only`.

### Task 2: Formato de misión v2, mundo y validador

**Files:**

- Create: `SIM/nucli/valida.js`, `SIM/nucli/test/valida.test.js`
- Create: `plugins/noempesquen-core/missions/mon.json`
- Create: `plugins/noempesquen-core/missions/llissa-01-factura.v2.json` (después de la Tarea 13 sustituye a la v1; mientras tanto conviven)
- Modify: `docs/format-missions.md` (sección «Format v2»)

**Interfaces:**

- Produces: `validaMissio(m: object): string[]` (vacío = válida; acepta solo `versio: 2`). `APPS_PC = [ 'navegador', 'parla' ]`, `PLANTILLES_WEB = [ 'posta', 'llum-clara' ]` (exportadas y ampliables en cortes posteriores).
- Formato v2 (lo que los demás leen):

```json
{
	"id": "llissa-01-factura",
	"versio": 2,
	"titol": "...",
	"resum": "...",
	"dispositiu": "pc",
	"personatge": "llissa",
	"nivell": 1,
	"durada_minuts": 5,
	"rellotge": "09:12",
	"intro": [ "..." ],
	"instruccions": "...",
	"pistes": [ "...", "..." ],
	"apps": {
		"posta": {
			"correus": [
				{
					"id": "m2",
					"objectiu": true,
					"ocult": true,
					"carpeta": "entrada",
					"llegit": false,
					"data": "09:14",
					"remitent": {
						"nom": "...",
						"adreca": "...",
						"senyal": "remitent"
					},
					"assumpte": "...",
					"assumpte_senyal": "urgencia",
					"cos": [
						[
							{ "t": "..." },
							{
								"enllac": {
									"text": "...",
									"url": "http://..."
								},
								"senyal": "enllac"
							}
						]
					]
				}
			]
		},
		"navegador": { "inici": [ "https://posta.cat/" ] }
	},
	"webs": {
		"llumclara-pagaments.com": {
			"plantilla": "llum-clara",
			"variant": "falsa",
			"https": true,
			"titol": "...",
			"domini_senyal": "domini",
			"formulari": {
				"id": "targeta",
				"boto": "Paga 87,40 €",
				"camps": [
					{
						"id": "numero",
						"etiqueta": "Número de targeta",
						"autoompli": "4000 1234 5678 9010",
						"senyal": "targeta"
					}
				]
			}
		}
	},
	"disparadors": [
		{
			"id": "arriba-trampa",
			"quan": { "esdeveniment": "inici" },
			"retard": 8,
			"efectes": [
				{ "tipus": "mostra", "id": "m2" },
				{
					"tipus": "notifica",
					"app": "posta",
					"titol": "Llum Clara",
					"text": "URGENT: ..."
				}
			]
		},
		{
			"id": "pagat",
			"quan": {
				"esdeveniment": "formulari.envia",
				"url": "llumclara-pagaments.com"
			},
			"efectes": [ { "tipus": "pescat" } ]
		},
		{
			"id": "phishing",
			"quan": {
				"esdeveniment": "correu.marca",
				"id": "m2",
				"com": "phishing"
			},
			"efectes": [ { "tipus": "decideix", "opcio": "c" } ]
		}
	],
	"senyals": [],
	"frases": { "normal": [], "web_falsa": "...", "pescat": "..." },
	"decisio": {},
	"tancament": {}
}
```

- Tipos de efecto válidos: `guia-diu {text}`, `notifica {app,titol,text}`, `mostra {id}`, `pescat {}`, `decideix {opcio}`. Esdeveniments: `inici`, `app.obre {app}`, `missatge.obre {app,id}`, `enllac.obre {url}`, `web.carrega {url}`, `formulari.envia {url,formulari}`, `correu.marca {id,com: 'phishing'|'brossa'|'esborra'}`.
- `mon.json`: `{ "jugador": { "nom": "Àlex Puig", "correu": "alex.puig@posta.cat" }, "contactes": [...], "parla": { "xats": [ { "id": "marta", "nom": "Marta", "missatges": [ { "de": "ella"|"jo", "text", "hora" } ] } ] }, "posta": { "correus": [ ...6 correos antiguos leídos de relleno... ] } }`.

- [ ] **Step 1: Write the failing tests** en `valida.test.js`:
    - `'la missió factura v2 és vàlida'` → `expect( validaMissio( factura ) ).toEqual( [] )`.
    - `'rebutja versio 1'` → contiene `'versio no suportada'`.
    - `'detecta senyal desconegut a un camp de formulari'` → contiene `'senyal desconegut: xyz'`.
    - `'detecta disparador amb efecte desconegut'` → contiene `'efecte desconegut: vola'`.
    - `'detecta decideix amb opció inexistent'` → contiene `'opció inexistent: z'`.
    - `'exigeix un camí de pescat'` (sin ningún efecto `pescat`) → contiene `'cap camí de pescat'`.
    - `'detecta web amb plantilla desconeguda'` → contiene `'plantilla desconeguda: res'`.
- [ ] **Step 2:** Run `npx vitest run SIM/nucli/test/valida.test.js`. Expected: FAIL (`valida.js` no existe).
- [ ] **Step 3:** Escribir `llissa-01-factura.v2.json`. Reutilizar textos, `senyals`, `decisio` y `tancament` de la v1; añadir el senyal `domini` (la barra de direcciones de la web falsa); 2-3 `pistes`; `frases.web_falsa` (la Llissa al abrir la web falsa) y `frases.pescat` (sustituye a `esquer`); disparadores: llegada de m2 a los 8 s, `web.carrega` de la web falsa → `guia-diu` con `frases.web_falsa`, `formulari.envia` → `pescat`, `correu.marca` m2 phishing → `decideix c`, `correu.marca` m2 esborra o brossa → `decideix d`. Webs: `llumclara.cat` (oficial, «No tens cap factura pendent»), `llumclara-pagaments.com` (falsa, formulario con titular, número, caducidad, CVV y PIN; CVV y PIN llevan `senyal: "targeta"`), `posta.cat` (plantilla `posta`).
- [ ] **Step 4:** Escribir `mon.json` y `validaMissio`. La lógica de senyales existente de `app/motor.js` se mueve aquí; se recorren también `webs.*.formulari.camps[].senyal` y `webs.*.domini_senyal`.
- [ ] **Step 5:** Run `npm run test:unit`. Expected: PASS.
- [ ] **Step 6:** Actualizar `docs/format-missions.md` con el formato v2, eventos y efectos (tabla corta).
- [ ] **Step 7:** Commit `feat: add mission format v2, world data and validator`.

### Task 3: Motor v2: estado, intro en el chat, lupa, decisión y puntuación

**Files:**

- Create: `SIM/nucli/motor.js`, `SIM/nucli/test/motor.test.js`

**Interfaces:**

- Consumes: formato v2 (Tarea 2).
- Produces:
    - `FASE = { BLOQUEIG: 'bloqueig', JOC: 'joc', CONSEQUENCIA: 'consequencia', RESULTAT: 'resultat' }`; `PUNTS` (los mismos valores que v1: senyal 10, correcta 50, parcial 20, incorrecta 0, picar −20); `SEGONS_PISTA = 60`.
    - `estatInicial( missio ) → Estat` con `{ fase, pausa, temps, introPas, introAcabada, lupa, trobats, falsos, pescat, opcio, decisioOberta, xat: [{ id, de: 'guia'|'jo', text, nota? }], notificacions: [{ id, app, titol, text, llegida }], visibles: {}, executats: [], pendents: [{ disparador, quan }], pistesDonades, ultimAvanc, seq }`.
    - `reductor( missio, estat, accio ) → Estat` con las acciones `DESBLOQUEJA`, `RESPOSTA {id}`, `LUPA`, `INSPECCIONA {senyal}`, `PAUSA`, `REPREN`, `NOTIFICACIONS_LLEGIDES {app?}`, `VEURE_RESULTAT`, `REINICIA` (`ESDEVENIMENT` y `TICK` llegan en la Tarea 4).
    - `respostesRapides( missio, estat ) → [{ id, text }]`: derivado, nunca guardado. Ids: `intro:seguent`, `intro:salta`, `decidir`, `decisio:<opcioId>`, `decisio:tornar`.
    - `puntuacio( missio, estat ) → { punts, maxim, estrelles }` (mismas reglas que v1; `estat.pescat` resta 20); `opcioTriada( missio, estat )`; `visible( estat, item ) → boolean` (`! item.ocult || !! estat.visibles[ item.id ]`).
- Cada mensaje del guía añade también una notificación `{ app: 'parla', titol: missio.personatge, text }`.

- [ ] **Step 1: Write the failing tests**:
    - `'comença bloquejat i desbloquejar porta el primer missatge de la intro al xat'` → `fase === 'joc'`, `xat[0]` es `{ de: 'guia', text: intro[0] }`, y hay 1 notificación de `parla`.
    - `'les respostes ràpides avancen la intro i al final ofereixen «Ja ho tinc clar»'` → tras `intro.length` respuestas `intro:seguent`, `introAcabada === true`, el último mensaje del guía es `instruccions` y `respostesRapides` = `[{ id: 'decidir', text: 'Ja ho tinc clar' }]`.
    - `'decidir obre les opcions com a respostes ràpides i tornar les tanca'`.
    - `'triar una opció afegeix el meu missatge i la resposta, i passa a consequencia'`.
    - `'inspeccionar un senyal nou suma, la nota diu «Indicis: 1 de 7» i es marca avanç'` → `ultimAvanc === temps`.
    - `'un senyal repetit no suma dues vegades'`; `'inspeccionar res fa servir frases.normal en rotació'`.
    - `'la lupa no s\'activa en pausa ni fora de joc'`.
    - `'partida perfecta = 3 estrelles i puntuació màxima'`; `'pescat sense indicis = 0 punts i 1 estrella'`.
- [ ] **Step 2:** Run `npx vitest run SIM/nucli/test/motor.test.js`. Expected: FAIL.
- [ ] **Step 3:** Implementar `motor.js` (reductor inmutable; el `seq` da ids crecientes a los mensajes y notificaciones).
- [ ] **Step 4:** Run `npm run test:unit`. Expected: PASS (los tests v1 de `app/test/motor.test.js` siguen pasando).
- [ ] **Step 5:** Commit `feat: add v2 mission engine with in-chat intro and decisions`.

### Task 4: Disparadores, eventos del mundo, tiempo y pistas

**Files:**

- Create: `SIM/nucli/disparadors.js`, `SIM/nucli/test/disparadors.test.js`
- Modify: `SIM/nucli/motor.js` (acciones `ESDEVENIMENT {nom, dades}` y `TICK {segons = 1}`; `DESBLOQUEJA` procesa el evento `inici`)

**Interfaces:**

- Produces: `coincideix( quan, nom, dades ) → boolean` (la clave `url` coincide si `dades.url === v` o si el _hostname_ de `dades.url` es `v`; las demás claves, por igualdad); `aplicaEfectes( missio, estat, efectes ) → Estat`.
- Reglas: un disparador se ejecuta una sola vez (`executats`); con `retard > 0` entra en `pendents` con `quan = temps + retard`; `TICK` solo avanza si `fase === 'joc' && ! pausa`; el primer `pescat` o `decideix` gana y después se ignoran los eventos (la fase ya no es `joc`); un evento que dispara algo cuenta como avance; la pista llega si `temps - ultimAvanc >= SEGONS_PISTA` y quedan pistas, y entonces reinicia `ultimAvanc`.

- [ ] **Step 1: Write the failing tests**:
    - `'el correu trampa apareix als 8 segons amb notificació de Posta'` → a los 7 TICK, `visible(m2)` es falso; a los 8, verdadero y hay una notificación `{ app: 'posta', titol: 'Llum Clara' }`.
    - `'en pausa no arriba res ni salten pistes'` → PAUSA a los 5 s, 120 TICK, REPREN: `visible(m2)` falso y `pistesDonades === 0`; 3 TICK más: verdadero.
    - `'enviar el formulari fals és pescat'`; `'marcar m2 com a phishing decideix c'`.
    - `'després de pescat, marcar phishing no canvia res'` (Review Focus 2) y `'dos formulari.envia seguits només compten un cop'`.
    - `'60 segons sense avanç envien la primera pista; trobar un senyal reinicia el compte'`.
    - `'coincideix per domini i per url exacta'`.
- [ ] **Step 2:** Run `npx vitest run SIM/nucli/test/disparadors.test.js`. Expected: FAIL.
- [ ] **Step 3:** Implementar `disparadors.js` y las nuevas acciones del motor.
- [ ] **Step 4:** Run `npm run test:unit`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add mission triggers, game clock and idle hints`.

### Task 5: Carga de misiones, progreso v2 y enrutado v1/v2 en App

**Files:**

- Create: `SIM/nucli/missions.js`, `SIM/nucli/progres.js`, `SIM/nucli/test/missions.test.js`, `SIM/nucli/test/progres.test.js`
- Modify: `SIM/app/App.js` (usar `combinaMissions` y `progres.js`; si `missio.versio === 2` monta `<Simulador>` de la Tarea 6, y si no, el `Joc` actual)

**Interfaces:**

- Produces: `combinaMissions( incloses, remotes ) → Missio[]` (las remotas v2 válidas sustituyen por `id` o se añaden; v1 e inválidas se ignoran; mantiene el orden de las incluidas). `llegeixProgres( storage ) → { [id]: estrelles }` (lee `noempesquen-progres-v2`; si no existe, migra `noempesquen-progres-v1` y lo copia); `desaProgres( storage, progres )`. Las dos toleran un `storage` que lanza excepciones.
- Mientras dure el corte: las misiones incluidas son `[ llissa-01-factura.v2, remei-01-paquet (v1) ]`.

- [ ] **Step 1: Write the failing tests**:
    - `'una remota v1 o invàlida no fa desaparèixer les incloses'` (Review Focus 5).
    - `'una remota v2 vàlida amb el mateix id substitueix la inclosa'`; `'una remota nova s\'afegeix al final'`.
    - `'migra les estrelles de v1 a v2'`; `'un storage que llança errors retorna {} i no peta'`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar y conectar en `App.js`.
- [ ] **Step 4:** Run `npm run test:unit && npm run lint:js`. Expected: PASS y 0 errores.
- [ ] **Step 5:** Commit `feat: merge remote missions by id and migrate progress to v2`.

### Task 6: Carcasa del simulador: contexto, pantalla completa, pausa, reloj y carga diferida

**Files:**

- Create: `SIM/simulador/Simulador.js`, `SIM/simulador/context.js`, `SIM/simulador/usePantallaCompleta.js`, `SIM/simulador/Pausa.js`, `SIM/estils/_so.scss`
- Modify: `SIM/style.scss` (importa los parciales de `estils/`)

**Interfaces:**

- Consumes: `estatInicial`, `reductor`, `FASE` (Tareas 3-4).
- Produces:
    - `JocContext` y `useJoc() → { missio, mon, estat, dispatch, emet( nom, dades ), hora: 'HH:MM', nomGuia, Avatar }`. `emet` despacha `ESDEVENIMENT`; `hora` = `missio.rellotge` + `estat.temps`.
    - `<Simulador missio mon onSurt onAcaba seguent />`: crea el reductor, hace `TICK` cada 1000 ms con `setInterval` (solo en `joc` y sin pausa), monta el sistema según `missio.dispositiu` con `lazy( () => import( '../sistemes/pc/Pc' ) )` dentro de `Suspense` (_fallback_: pantalla negra con un spinner del sistema) y llama a `onAcaba( id, estrelles )` al llegar a `RESULTAT`.
    - `usePantallaCompleta( ref ) → { entra(), surt(), actiu, fixa }`: intenta `ref.current.requestFullscreen()`; si no existe o falla, `fixa = true` (clase `.nep-so--fixa`: `position: fixed; inset: 0; z-index: 100000` y `overflow: hidden` en `html`). Si sale de pantalla completa en `joc`, despacha `PAUSA`.
    - `Esc` (`keydown` en la raíz): si algún componente ha registrado un menú abierto con `useJoc().registraMenu( tanca ) → desregistra` (una pila de callbacks; el último registrado se cierra primero), lo cierra; si no, `PAUSA`.
    - `<Pausa>`: `role="dialog"`, `aria-modal`, foco atrapado, botones «Continua» (vuelve a pedir pantalla completa), «Reinicia la missió» y «Surt».
- [ ] **Step 1:** Implementar. El sistema PC de la Tarea 7 aún no existe: crear `SIM/sistemes/pc/Pc.js` como _stub_ que renderiza «Escriptori» para comprobar el chunk.
- [ ] **Step 2:** Run `npm run build`. Expected: OK y un chunk aparte para `Pc` en `plugins/noempesquen-core/build/blocks/simulador/`.
- [ ] **Step 3:** Abrir `http://localhost:8888/simulador/` con Playwright MCP, entrar en la misión factura y comprobar que el chunk carga (sin 404 en la red), que se entra a pantalla completa y que `Esc` abre la pausa. Si el chunk da 404 por `publicPath`, fijar `__webpack_public_path__` en `view.js` a partir de `document.currentScript.src`.
- [ ] **Step 4:** Commit `feat: add fullscreen simulator shell with pause and lazy-loaded systems`.

### Task 7: Sistema PC: bloqueo, escritorio, barra de tareas, ventanas y notificaciones

**Files:**

- Create: `SIM/sistemes/pc/Pc.js` (sustituye al _stub_), `Bloqueig.js`, `Escriptori.js`, `BarraTasques.js`, `MenuInici.js`, `Finestra.js`, `Notificacions.js`, `finestres.js`, `test/finestres.test.js` (todos en `SIM/sistemes/pc/`), `SIM/ui/icones.js`, `SIM/estils/_pc.scss`
- Registry: `SIM/apps/registre.js` → `APPS = { navegador: { nom, Icona, Component: lazy(...) }, parla: {...} }` (en esta tarea, `Component` de cada app es un *stub* con su nombre; las Tareas 9 y 10 lo sustituyen)

**Interfaces:**

- Consumes: `useJoc()`.
- Produces:
    - `finestresReductor( estat, accio )` con estado `{ finestres: [{ id, app, minimitzada, maximitzada, z, dades }], focus }` y acciones `OBRE {app, dades}` (si la app ya está abierta, la enfoca y le pasa `dades`), `TANCA {id}`, `ENFOCA {id}`, `MINIMITZA {id}`, `MAXIMITZA {id}`.
    - Contexto de sistema `useSistema() → { obreApp( app, dades ), notificacions }`; las apps lo usan para abrir otras (Posta → Navegador con una URL).
    - Bloqueo: hora y fecha grandes, la notificación del guía y «Clica o prem una tecla per entrar» → `DESBLOQUEJA`.
    - Barra de tareas: botón de inicio, apps fijadas (Navegador, Parla) con indicador de abierta/enfocada, bandeja con el **botón de la lupa** (`aria-pressed`, `Alt+Shift+L` → `LUPA`), la campana de notificaciones con contador y el reloj `hora` (con la fecha).
    - Notificaciones: _toast_ abajo a la derecha durante 6 s para cada notificación nueva (las del guía abren Parla al hacer clic, las de Posta abren el navegador en `https://posta.cat/`), centro de notificaciones desde la campana y región `aria-live="polite"` con el último texto.
    - Ventana: barra de título arrastrable (puntero; sin arrastre con teclado), minimizar/maximizar/cerrar con `aria-label`, doble clic maximiza, foco al contenido al abrir. Con `prefers-reduced-motion` no hay animación.
    - Cursor de lupa: con `estat.lupa`, clase `.is-lupa` en la raíz y cursor SVG de lupa.
    - Al desbloquear se abren el navegador (en `missio.apps.navegador.inici`) y Parla, en ese orden y en cascada.
- [ ] **Step 1: Write the failing tests** en `finestres.test.js`: `'obrir una app ja oberta l\'enfoca i no la duplica'`, `'tancar l\'enfocada passa el focus a la de z més alt'`, `'minimitzar treu el focus'`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar `finestres.js`. Run. Expected: PASS.
- [ ] **Step 4:** Implementar los componentes y los estilos según la dirección visual de _Global Constraints_.
- [ ] **Step 5:** Run `npm run build && npm run lint:js && npm run lint:css`. Revisar con Playwright MCP a 1440×900 y 1024×768: bloqueo, escritorio con dos ventanas, _toast_ y centro de notificaciones. Guardar capturas en el _scratchpad_.
- [ ] **Step 6:** Commit `feat: add simulated desktop with taskbar, windows and notifications`.

### Task 8: Inspeccionables y cuerpo de mensajes reutilizables

**Files:**

- Create: `SIM/ui/Inspeccionable.js`, `SIM/ui/Cos.js`, `SIM/estils/_ui.scss`

**Interfaces:**

- Consumes: `useJoc()` (`estat.lupa`, `estat.trobats`, `dispatch`).
- Produces: `<Inspeccionable text senyal as? />` (sin lupa: texto, con la clase `nep-marcat` si ya se ha encontrado; con lupa: `button` con `aria-pressed` y `aria-label="Inspecciona: …"` que despacha `INSPECCIONA`). `<Cos paragrafs onEnllac( url ) onHoverUrl( url|null ) />`: el enlace sin lupa llama a `onEnllac`; con lupa inspecciona; los dos casos informan del _hover_ y del foco.
- Misma API conceptual que `app/Cos.js`, pero leyendo el contexto en lugar de la prop `ctx`. Los archivos v1 no se tocan.
- [ ] **Step 1:** Implementar. Estilo de la lupa: subrayado ondulado ámbar `#b98a00`, fondo `#fff3c4` en _hover_/foco y marcado con un contorno verde `#1e7b45`.
- [ ] **Step 2:** Run `npm run build && npm run lint:js`. Expected: OK.
- [ ] **Step 3:** Commit `feat: add context-aware inspectable text and message body`.

### Task 9: App Parla (escritorio): chat con el guía y respuestas rápidas

**Files:**

- Create: `SIM/apps/parla/Parla.js`, `SIM/estils/_parla.scss`

**Interfaces:**

- Consumes: `useJoc()` (`estat.xat`, `respostesRapides`, `nomGuia`, `Avatar`), `mon.parla.xats`, `NOTIFICACIONS_LLEGIDES`.
- Produces: ventana de Parla con la lista de chats (el guía fijado arriba, con el avatar SVG de `app/avatars.js`, y los chats de relleno de `mon.json`, que se pueden abrir y leer), conversación con burbujas (las del guía a la izquierda, las mías a la derecha en verde `#d9fdd3`), indicador «escrivint…» de 600 ms antes de cada mensaje nuevo del guía (sin él con `reduced-motion`), `nota` en pequeño debajo de la burbuja y respuestas rápidas como botones-píldora encima del campo de texto. El campo de texto está desactivado con el _placeholder_ «Tria una resposta». Abrir el chat del guía marca sus notificaciones como leídas. Lista de mensajes con `role="log"` y `aria-live="polite"`.
- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** Verificar con Playwright MCP: desbloquear, completar la intro con las respuestas rápidas, «Ja ho tinc clar», ver las opciones y «Encara vull mirar».
- [ ] **Step 3:** Commit `feat: add Parla desktop chat with guide quick replies`.

### Task 10: App Navegador: pestañas, barra de direcciones, historial y registro de webs

**Files:**

- Create: `SIM/apps/navegador/Navegador.js`, `SIM/apps/navegador/navegador.js` (reductor), `SIM/apps/navegador/test/navegador.test.js`, `SIM/apps/navegador/PaginaError.js`, `SIM/apps/navegador/NovaPestanya.js`, `SIM/webs/registre.js`, `SIM/estils/_navegador.scss`

**Interfaces:**

- Consumes: `useJoc().emet`, `missio.webs`, `useSistema()`.
- Produces:
    - `navegadorReductor( estat, accio )` con estado `{ pestanyes: [{ id, historial: [url], index }], activa }` y acciones `OBRE_PESTANYA {url}`, `TANCA_PESTANYA {id}`, `ACTIVA {id}`, `NAVEGA {url}`, `ENRERE`, `ENDAVANT`. `normalitzaUrl( text ) → url` (añade `https://` si falta; el texto sin punto pasa a ser una búsqueda que muestra `PaginaError`).
    - `resolWeb( url, missio ) → { plantilla, dades } | null`: busca por _hostname_ en `missio.webs`. `posta.cat` siempre resuelve a la plantilla `posta`. `WEBS = { posta: lazy(...), 'llum-clara': lazy(...) }` en `webs/registre.js`.
    - Cada vez que cambia la URL activa, emite `web.carrega {url}`. Abrir una pestaña desde un enlace emite antes `enllac.obre {url}`.
    - Barra de direcciones: candado (o «No segur» si `https` es falso), dominio en negro y resto en gris; al recibir el foco muestra la URL completa y seleccionable. Con lupa, el dominio es un `<Inspeccionable senyal={ web.domini_senyal }>`.
    - Barra de estado abajo a la izquierda con la URL del enlace bajo el puntero o con foco (`onHoverUrl`).
    - Las webs reciben las props `{ dades, url, navega( url ), obrePestanya( url ), onHoverUrl }`.
- [ ] **Step 1: Write the failing tests**: `'navegar trunca l\'historial endavant'`, `'enrere i endavant mouen l\'índex'`, `'tancar l\'última pestanya obre la nova pestanya'`, `'normalitzaUrl afegeix https i reconeix cerques'`.
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implementar el reductor. Run. Expected: PASS.
- [ ] **Step 4:** Implementar los componentes (nueva pestaña con accesos directos a Posta, Llum Clara y El Diari del Barri; este último da la página de error en este corte).
- [ ] **Step 5:** Commit `feat: add simulated browser with tabs, address bar and site registry`.

### Task 11: Webs de Posta y Llum Clara (oficial y falsa)

**Files:**

- Create: `SIM/webs/posta/Posta.js`, `SIM/webs/llum-clara/LlumClara.js`, `SIM/webs/llum-clara/FormulariFals.js`, `SIM/webs/test/formulari.test.js`, `SIM/estils/_posta.scss`, `SIM/estils/_llum-clara.scss`

**Interfaces:**

- Consumes: props de web (Tarea 10), `useJoc()`, `visible()`, `<Cos>`, `<Inspeccionable>`, `mon.posta.correus` + `missio.apps.posta.correus`.
- Produces:
    - Posta: bandeja con los correos visibles ordenados por `data` (los nuevos arriba; los que llegan entran con una animación sutil), carpetas Entrada/Destacats/Enviats/Brossa/Paperera con contadores reales, lectura con remitente (nombre + `<adreça>` inspeccionable), asunto inspeccionable, `<Cos>` (enlace → `obrePestanya( url )` del navegador) y barra de acciones: «Arxiva», «Elimina» (`correu.marca com: 'esborra'`), «Marca com a brossa» (`'brossa'`) y, en el menú «Més», «Denuncia pesca (phishing)» (`'phishing'`, con un diálogo de confirmación como el de un correo real). El correo marcado pasa a la carpeta correspondiente. Abrir un correo emite `missatge.obre {app: 'posta', id}`.
    - Llum Clara: plantilla con cabecera, menú, _hero_ de tarifa, área de cliente y pie. `variant: 'oficial'` muestra «No tens cap factura pendent» tras «Entra» (credenciales con autocompletado de Àlex). `variant: 'falsa'` muestra el aviso de deuda y el `<FormulariFals>`.
    - `<FormulariFals formulari url onEnvia />`: cada campo es un `input` **no controlado por el motor** (estado local y efímero), con la sugerencia de autocompletado bajo el campo enfocado («Àlex Puig · targeta acabada en 9010») que lo rellena con `autoompli`. Con lupa, cada etiqueta con `senyal` es un `<Inspeccionable>`. `onSubmit` → `preventDefault()` y `emet( 'formulari.envia', { url, formulari: formulari.id } )`.
- [ ] **Step 1: Write the failing test** en `formulari.test.js` (Review Focus 1), contra el motor: después de `ESDEVENIMENT formulari.envia`, `JSON.stringify( estat )` no contiene `'4000 1234'` ni ningún valor de `autoompli`. Además, `FormulariFals` exporta `datesEnviades( form ) → { url, formulari }` como única salida, y el test comprueba que no lleva valores.
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implementar. Run. Expected: PASS.
- [ ] **Step 4:** Revisar con Playwright MCP a 1440×900: Posta con el correo trampa, _hover_ sobre el enlace (barra de estado), web falsa y web oficial una al lado de la otra en pestañas. Capturas en el _scratchpad_.
- [ ] **Step 5:** Commit `feat: add Posta webmail and Llum Clara official and fake sites`.

### Task 12: Consecuencia y resultado dentro de la carcasa

**Files:**

- Create: `SIM/simulador/Consequencia.js`, `SIM/simulador/Resultat.js`, `SIM/estils/_resultat.scss`

**Interfaces:**

- Consumes: `estat.fase`, `estat.pescat`, `opcioTriada`, `puntuacio`, `missio.frases.pescat`, `missio.tancament`.
- Produces: en `CONSEQUENCIA`, una capa sobre el sistema (si es pescat: la red que cae, reutilizando `.nep-xarxa`, y el texto `frases.pescat`; si no, el título «Molt bé!» o «Gairebé!» con `opcio.resposta`) y el botón «Veure el resultat». En `RESULTAT`, un informe a pantalla completa con estrellas, puntos, indicios trobats/perduts, aprendizajes, consejo y los botones «Torna-ho a provar» (`REINICIA`), «Següent missió» y «Totes les missions» (sale de pantalla completa → `onSurt`). El foco va al título en cada paso.
- [ ] **Step 1:** Implementar a partir de `app/Pantalles.js`, sin modificar ese archivo.
- [ ] **Step 2:** Commit `feat: add consequence and results screens to simulator shell`.

### Task 13: E2E de la misión, sustitución de la v1 y verificación final del corte

**Files:**

- Create: `tests/e2e/factura.spec.js`
- Modify: `package.json` (devDependency `@axe-core/playwright`), `SIM/app/App.js` (las incluidas pasan a ser la v2 de factura y la v1 del paquete), `README.md` (precondición: página `/simulador/` con el bloque)
- Delete: `missions/llissa-01-factura.json` (v1), renombrar `llissa-01-factura.v2.json` → `llissa-01-factura.json`; adaptar `app/test/motor.test.js` para que use solo la de remei.

**Interfaces:**

- Consumes: todo lo anterior. Los tests se saltan en el proyecto `mobil` (`test.skip( isMobile, 'PC en mòbil: tall 4' )`).

- [ ] **Step 1: Write the e2e tests** (`page.goto( '/simulador/' )`, `page.clock.install()` para controlar el tiempo de juego):
    - `'camí correcte: denunciar el correu com a pesca dona 3 estrelles amb tots els indicis'`: desbloquear, saltar la intro, avanzar el reloj 8 s, abrir Posta, activar la lupa, marcar los 7 indicios (incluido el dominio en la web falsa abierta desde el enlace), volver a Posta, «Més» → «Denuncia pesca» → confirmar, «Veure el resultat» → 3 estrellas.
    - `'camí de pescat: pagar a la web falsa'` → la capa dice «T'han pescat» y el resultado tiene 1 estrella.
    - `'decidir pel xat amb «Ja ho tinc clar»'` → la opción c da «Molt bé!».
    - `'Esc obre la pausa i Surt torna al selector'`.
    - `'sense Fullscreen API el joc funciona amb la capa fixa'` (Review Focus 4): `page.addInitScript` borra `Element.prototype.requestFullscreen`; la raíz tiene `.nep-so--fixa` y `Esc` abre la pausa.
    - `'sense violacions axe greus a l\'escriptori'` → `AxeBuilder` con `withTags( [ 'wcag2a', 'wcag2aa', 'wcag22aa' ] )`, sin violaciones `serious` ni `critical`.
- [ ] **Step 2:** Run `npm run build && npx playwright test tests/e2e/factura.spec.js --project=escriptori`. Expected: PASS (6 tests).
- [ ] **Step 3:** Sustituir la misión v1 y adaptar el test v1 (mover el archivo).
- [ ] **Step 4: Verificación completa** — `npm run lint:js && npm run lint:css && npm run test:unit && npm run build && npx playwright test`. Expected: todo en verde (e2e del móvil: el test de portada pasa y los de factura salen como _skipped_). Medir el tamaño gzip de los chunks (`gzip -c archivo | wc -c`) y anotarlo en el mensaje de commit.
- [ ] **Step 5:** Commit `test: cover the realistic electricity bill mission end to end`.
