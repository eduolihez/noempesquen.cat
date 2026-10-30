# Corte 5b · Comprador falso (Revenda) e inversión con famoso

Estado: revisado por `critico` e incorporado; pendiente de aprobación (puerta 2). Rama: `feat/fase2-corte5b-revenda-inversio` (base: `master` tras el corte 5a).
Spec vigente: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`. Plan anterior: `2026-10-30-fase2-corte5a-sorteig-codi.md`.

## Objetivo
Dos misiones jugables de principio a fin: **7 «Compro la teva bici»** (móvil, nueva app Revenda) y **8 «El truc d'inversió»** (PC, anuncio falso en El Diari del Barri + web de inversión), con marcas inventadas, catalán, WCAG 2.2 AA y sin que lo que teclea el jugador salga del componente.

## Misión 7 · `remei-05-comprador` (móvil, guía Remei, nivel 2, ~5 min)
- App **Revenda** (marketplace inventado): pestañas «Anuncis» y «Xats». El jugador vende una bici de montaña por 120 €; el comprador «Jordi M.» (contacto `comprador`, rol desconegut) escribe dentro de Revenda (chat propio; no depende de Parla).
- Guion del chat (mensajes ocultos con `mostra` y `retard`): «Em va perfecte, la vull. No cal que la vegi.» → «Et pago ara per Revenda Cobra; t'envio un enllaç per cobrar.» (enlace a `https://cobra-revenda.top/cobrament`) → «Si no ho fas avui, ho agafo d'un altre.».
- Web falsa `cobra-revenda.top` (plantilla nueva `cobrament`, solo falsa): «Cobra els 120 €», pide número de tarjeta, caducidad y CVC «per rebre l'ingrés» (cobrar no necesita CVC). `pagament.fes` → `pescat`.
- Señales: no quiere ver la bici, pide cobrar fuera de Revenda (enlace externo), pressa, dominio `.top` (`requereix: web-falsa`), pide datos de tarjeta para cobrar (`requereix: web-falsa`).
- Decisión (menú final): a) Bloquejo el comprador i cobro només en persona (correcta; `contacte.bloqueja` de `comprador` → `decideix a`) · b) Li dic que prefereixo quedar en persona (parcial) · c) Obro l'enllaç i poso les dades (incorrecta, pescat).
- Sin eventos nuevos. Reutiliza `contacte.bloqueja`, `enllac.obre`, `web.carrega`, `pagament.fes`.

## Misión 8 · `llissa-03-inversio` (PC, guía Llissa, nivel 3, ~5 min)
- El Diari del Barri muestra un **anuncio patrocinado** («Contingut patrocinat») con un famoso inventado: la presentadora «Carla Montsant» «revela el truc per multiplicar 250 €». Enlace a `https://invest-rapid.top/carla`. Sin deepfakes ni fotos reales: avatar con iniciales/ilustración propia.
- Web falsa `invest-rapid.top` (plantilla nueva `inversio`, solo falsa): cuenta atrás, falsos testimonios, «×10 en 24 h», formulario nombre + teléfono + tarjeta para «depositar 250 €». `pagament.fes` → `pescat`.
- Señales: «patrocinat» sin fuente, famoso que «recomienda» una inversión, rentabilidad garantizada ×10, pressa/cuenta atrás, dominio `.top`, testimonios sin verificar, pide tarjeta para «invertir».
- Decisión: a) Informo de l'anunci i no toco res (correcta; `publicacio.denuncia {id}` del anuncio → `decideix a`) · b) El tanco i ja està (parcial) · c) Deposito els 250 € (incorrecta, pescat).
- Una mini-pista de contexto en Posta/Parla sobre dinero rápido no es necesaria; no hay móvil vinculado en esta misión.

## Decisiones tras la revisión de `critico`
- **Esquema `apps.revenda`**: `{ anuncis[]: { id, titol, preu, il, descripcio }, xats[]: { id, contacte, anunci, missatges[] { id, de: "ells"|"jo", hora?, ocult?, cos[] } } }`. Los mensajes llevan `cos` (segmentos `{t,senyal?}` / `{enllac:{text,url},senyal?}`), no un único `senyal`, para que un mensaje admita varias. Reutiliza `Cos`, `Inspeccionable` y las burbujas de Parla en lo posible (sin duplicar ~300 líneas); `xatsMissio.js` se comparte o se generaliza.
- **`requereix` en todo lo oculto**: cada señal de un mensaje oculto o de la web falsa lleva `requereix: <id>` (mensaje `venda-1/2/3`, `web-falsa`), igual que 5a. Test unitario por misión: «decidir `a` sin pistas ni pescat = 3 estrellas».
- **Bloqueo en Revenda**: botón visible «Bloqueja» (≥44 px) en la cabecera del xat, aviso propio de comprador desconocido (no el de Parla); emite `contacte.bloqueja { id: "comprador" }`. Si abre menú, `registraMenu`. El contacto `comprador` (rol desconegut) se añade a `mon.json` en T1a.
- **Decisiones**: `a` y `b` son opciones de `decisio` (menú final de la guía, como 5a); `c` es la acción en el mundo (`pagament.fes` → `pescat`) y también opción `incorrecta` con `resposta` que no exige haber entrado en la web. En la misión 8 «El tanco i ja està» solo existe como opción.
- **Un evento menos**: el anuncio del Diari se denuncia con `publicacio.denuncia { id }` (id del anuncio). No hay `anunci.denuncia` ni `anunci.obre`.
- **Anuncio del Diari**: `webs["diaridelbarri.cat"] = { plantilla: "diari", https: true, anunci: { id, etiqueta, titol, cos[], enllac... } }` con `cos` por segmentos y señales; se registra también `www.diaridelbarri.cat` o se fija `apps.navegador.inici`; se pinta en portada (y en artículos solo si es trivial). Sin `dades.anunci` el Diari no pinta nada (e2e `farcit.spec.js` intacto).
- **Validador** (`valida.js`): `CAMPS_SENYAL` con los campos nuevos de las webs (`compte_senyal`, `promesa_senyal`, `testimonis[].senyal`); `recullUrlsEnllac` también sobre `m.webs` (exige `http(s)://`); `PLANTILLES_SOLO_FALSES = ['sorteig','cobrament','inversio']`; regla genérica: una señal declarada y no referenciada en ningún sitio falla `validaMissio`; cruces `contacte.bloqueja` (contacto existe) y `publicacio.denuncia` (id existe).
- **Privacidad**: el chat de Revenda es no controlado y emite solo `missatge.envia { contacte }`; el espía de red/consola del e2e cubre lo tecleado en el chat, nombre, teléfono, tarjeta y CVC; `autoompli` de ficheros ficticios; `codi.comparteix` no se emite en Revenda.
- **Accesibilidad**: región `aria-live` siempre en el DOM (también para mensajes entrantes y la denuncia); pestañas con `role=tablist` y flechas; cuenta atrás de la web de inversión como texto estático; botón de informar ≥32 px en PC; `Esc` vía `registraMenu`; inicio a 360 px con 11 apps; foco y atrás con `pila.js`.
- **Contenido**: un mensaje previo normal del comprador (pregunta por el estado de la bici) como ruido de control; la web falsa de cobro usa dominio tipo typosquatting (`revenda-cobra.com`, oficial = `revenda.cat`) y la de inversión `.top`; lista del test de marcas ampliada (Wallapop, Vinted, Milanuncios, Bizum, Revolut…).
- **Cuentas**: hoy 6 misiones (PC 2, móvil 4); tras 5b serán 8 (PC 3, móvil 5). Revenda es la 11.ª app móvil (hoy 10).

## Tareas (orquestar, estrictamente secuenciales: T1a → T1b → T2 → T3 → …; `valida.js` y `style.scss` los tocan varias)
| Tarea | Contenido | Ficheros dueños | Dep. |
|---|---|---|---|
| T0 | Línea base con **Playwright completo** (lint, unit, build, e2e) y nota «Resultado T0» en este plan | este plan | — |
| T1a | Revenda lógica: módulo puro `apps/revenda/anuncis.js` + test, `claus.js`, `registre.js` (+ placeholder), `valida.test.js` (lista APPS_MOBIL), `validaRevenda` en `valida.js` (esquema, contacto, ids, `PLANTILLES_SOLO_FALSES`, `CAMPS_SENYAL`, recoger `m.webs` en `recullUrlsEnllac`, señal no referenciada), `mon.json` (contacto `comprador`, perfil/avatar de la presentadora) | `apps/revenda/anuncis.js`, `claus.js`, `registre.js`, `valida.js`, `mon.json`, tests | T0 |
| T1b | Revenda UI: `Revenda.js` (pestañas Anuncis/Xats, chat, Bloqueja, aviso, aria-live), `icones.js`, `_revenda.scss`, `style.scss` | `apps/revenda/*` UI, estils | T1a |
| T2 | Plantillas web `cobrament` e `inversio` + registro + estilos; cuenta atrás estática; testimonios con señal | `webs/cobrament/*`, `webs/inversio/*`, `webs/registre.js`, estils | T1b |
| T3 | Anuncio patrocinado en El Diari (`Diari.js`, `_diari.scss`), botón «Informa d'aquest anunci» con `publicacio.denuncia`, host `www.`, cruces disparador↔mundo en el validador | `webs/diari/*`, `valida.js` (cruces/anuncio) | T2 |
| T4 | `docs/format-missions.md` (Revenda, plantillas, anuncio, plantillas solo falsas) y `docs/estat-del-projecte.md` | docs | T3 |
| T5 | Misiones `remei-05-comprador` y `llissa-03-inversio` + registro en `App.js` + listas de `selector.spec.js` (PC 3, móvil 5) | misiones, `App.js`, `selector.spec.js` | T4 |
| T6a | Tests de remei-05: unit (3 estrellas por camino seguro sin pistas, pescat por cada vía, negativos) + e2e móvil (correcto, pescat, axe, `petits`, `sensePistes`, fugas del chat y del formulario) | `nucli/test/comprador.test.js`, `tests/e2e/comprador.spec.js` | T5 |
| T6b | Tests de llissa-03: unit + e2e PC (anuncio visible, denuncia, pescat, axe, fugas de nombre/teléfono/tarjeta, portada normal intacta) | `nucli/test/inversio.test.js`, `tests/e2e/inversio.spec.js` | T6a |
| T7 | Cierre: revisión de rama (`reviewer`, `security-reviewer`, `silent-failure-hunter`, `critico`), tabla Arreglar/Mejora, `humanizer-es`, evidencia completa | — | T6b |

## Criterios de hecho
- `validaMissio(m, mon)` = [] para ambas; unit (3 estrellas y pescat por misión) y e2e (correcto + pescat) en verde.
- lint:js (0 errores), lint:css, test:unit, build y `npx playwright test` completo, con salida real; axe sin violaciones serias.
- Selector con 8 misiones (PC 3, móvil 5); doc del formato actualizada.
- Lo tecleado en los formularios falsos y en cualquier chat no sale (red/consola/estado); test de marcas reales sigue verde con las misiones nuevas; copy por `humanizer-es`.

## Fuera de alcance
Corte 5c (pop-up y falsa actualización); IA, cuentas, CPT; detección de códigos troceados; deudas menores de cortes anteriores salvo bloqueo; el famoso no usa imagen de personas reales.

## Riesgos
- `Diari.js` hoy ignora `dades`: hay que mantener la portada normal intacta (e2e de `farcit.spec.js`).
- Revenda es la 11.ª app móvil: revisar la cuadrícula del inicio a 360 px.
- Marca «Revenda Cobra» debe verse como falsa por dominio/diseño, no por parecerse a un servicio real de pago.
