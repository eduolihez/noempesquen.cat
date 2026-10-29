# Simulador realista: fase 1

Fecha: 2026-10-29 · Estado: borrador pendiente de aprobación

## Por qué

_No em pesquen_ (Premis Wapps .cat 2026/27) enseña a detectar estafas digitales. Hoy el simulador es una maqueta: una ventana con tres puntos, emojis como iconos y botones de juego encima de la app. Quien juega sabe en todo momento que es un juego y no lo relaciona con su correo o su móvil reales.

Queremos que, al jugar, la persona sienta que está delante de **su** ordenador o de **su** móvil: pantalla completa, apps que se parecen a las de verdad (con marcas inventadas), libertad aparente para tocar cualquier cosa y el engaño escondido entre contenido normal. Cuanto más se parezca a la vida real, más se transfiere lo aprendido.

**Público:** general (adultos de cualquier edad y competencia digital).

## Objetivos

1. Simulador a pantalla completa con dos sistemas: **ordenador** (inspirado en un escritorio Windows 11) y **móvil** (inspirado en Android).
2. Apps con aspecto real y marcas inventadas, navegables aunque no formen parte de la misión ("libertad aparente").
3. Ayuda del juego **integrada en el sistema**: el personaje guía es un contacto que escribe por notificaciones y por chat; la lupa es una herramienta del sistema. No hay barras ni botones de "juego" encima.
4. Motor de misiones basado en eventos y JSON v2, capaz de alojar las misiones de fases posteriores sin tocar el núcleo.
5. Cuatro misiones pulidas en fase 1:
    - **PC · La factura de la llum** (rehecha): correo en Posta, y el enlace abre la web falsa de Llum Clara.
    - **PC · El banc et bloqueja el compte** (nueva): correo, después web clonada de Banc Sòlid que pide usuario, contraseña y código SMS. El código llega como notificación del móvil vinculado en el escritorio.
    - **Móvil · El paquet retingut** (rehecha): SMS, después web falsa de la empresa de mensajería que pide 1,99 € con tarjeta.
    - **Móvil · Hola, he canviat de mòbil** (nueva): mensaje en Parla de un número desconocido que dice ser el hijo/hija; acaba pidiendo un pago urgente.

## No objetivos (fase 1)

- Las misiones 5-10 del catálogo (Ullada, robo de código de Parla, Revenda, inversión, pop-up de soporte técnico, falsa actualización). Llegan en fases 2 y 3 sobre el mismo núcleo.
- IA, cuentas de usuario, voz o llamadas reales.
- Editor visual de misiones en el panel (se sigue usando el JSON en el CPT «Missió»).

## Anti-objetivos (sería un fracaso aunque funcione)

- Que parezca una plantilla genérica o un juguete: iconos emoji, colores de "app educativa", tipografía de web corporativa dentro del sistema simulado.
- Usar logotipos, nombres o elementos de marca reales (Windows, Android, Gmail, WhatsApp, Instagram, bancos reales). Inspirarse en la disposición sí; copiar marca no.
- Enviar, guardar o registrar **cualquier** dato que la persona escriba en los formularios falsos. Nada sale del navegador, ni siquiera en analíticas.
- Trampas de teclado o pantalla completa sin salida: siempre debe haber una forma visible y por teclado de pausar y salir.
- Que la ayuda integrada deje perdida a la gente: si alguien no sabe qué hacer, el sistema le tiene que acabar guiando.

## Restricciones

- **Plataforma:** WordPress (requisito del tutor). Bloque de Gutenberg `noempesquen/simulador` con React de WordPress (`@wordpress/element`), compilado con `wp-scripts`. Tema de bloques propio. Sin constructores.
- **Sin conexión:** las misiones incluidas van en el paquete; la API REST (`noempesquen/v1/missions`) puede sustituirlas si hay misiones publicadas y válidas.
- **Progreso** solo en `localStorage`; sin datos personales en el servidor.
- **Accesibilidad WCAG 2.2 AA** también dentro del sistema simulado: teclado completo, foco gestionado entre ventanas y apps, avisos para lector de pantalla (`aria-live`) en notificaciones, contraste, `prefers-reduced-motion`, objetivos táctiles ≥ 44 px en el móvil.
- **Rendimiento:** la página con el selector debe cargar rápido (JS inicial < 150 KB gzip). El simulador se carga bajo demanda (< 300 KB gzip por sistema, sin contar imágenes). Imágenes en WebP/AVIF con dimensiones explícitas, cargadas en diferido.
- **Idioma:** todo el contenido del juego en catalán; identificadores de código en catalán como el código actual (`motor`, `missio`, `senyal`...).
- **Calidad:** tests unitarios (Vitest, ya instalado) para el motor y validación de misiones; e2e con Playwright en escritorio y Pixel 7 (`playwright.config.js`); lint de `wp-scripts`.

## Enfoques considerados

1. **Sistema operativo simulado dentro del mismo bloque** _(elegido)_. Núcleo propio (registro de apps, gestor de ventanas/pila de apps, notificaciones, motor de eventos) y misiones en JSON v2. Respeta el requisito de WordPress, conserva lo que ya funciona (CPT, REST, tests, funcionamiento sin conexión) y permite añadir misiones por fases sin tocar el núcleo. Coste: aislar bien el CSS del tema y partir el JS en trozos.
2. **SPA aparte (Vite + React) en un iframe.** Desarrollo más cómodo y aislamiento total, pero se aleja del requisito "bloque de Gutenberg con React de WordPress" y el iframe complica la accesibilidad y la pantalla completa en iOS.
3. **Misiones como código** (un componente por misión). Máxima libertad, pero se pierde la edición desde el panel y la validación automática, y cada misión pasa a ser programación.

El usuario eligió la 1.

## Lo decidido

### Experiencia general

- **Entrada:** la página muestra el selector de misiones (rediseñado, fuera del sistema simulado). Al pulsar una misión, el simulador entra a **pantalla completa** (Fullscreen API sobre el contenedor del bloque; si no está disponible, como en Safari iOS con un elemento que no es vídeo, se usa una capa `position: fixed` que cubre el viewport y bloquea el scroll de la página).
- **Arranque:** pantalla de bloqueo del dispositivo (hora, fecha, fondo) con una primera notificación del guía. Al desbloquear (clic o deslizar) se llega al escritorio o a la pantalla de inicio.
- **Libertad aparente:** todas las apps del dispositivo se pueden abrir y tienen contenido creíble aunque no intervengan en la misión. Lo que la misión necesita está mezclado con lo normal.
- **Salida y pausa:** `Esc` (o salir de la pantalla completa) abre un diálogo de pausa con "Continuar", "Reiniciar misión" y "Salir al selector". En el PC también hay "Apagar" en el menú de inicio y en el móvil un acceso en Ajustes. La pausa detiene los temporizadores de la misión.

### Ayuda integrada en el sistema (elección del usuario: opción A)

- **Guía como contacto.** La Llissa (PC) y la Remei (móvil) escriben como un contacto más por **Parla**, el clon de mensajería: notificación del sistema (toast en el PC, banner en el móvil) y conversación completa en la app.
- **La intro** de la misión llega como mensajes del guía en el chat, con una respuesta rápida ("D'acord", "Som-hi!") para avanzar. Hay también una respuesta rápida para saltarla.
- **Lupa:** herramienta del sistema. En el PC, un icono en la bandeja junto al reloj (y un atajo de teclado que el guía menciona). En el móvil, un botón en el centro de control (deslizar desde arriba o tocar la barra de estado). Con la lupa activa, el cursor cambia y los elementos inspeccionables de cualquier app pasan a ser botones con `aria-pressed`. Cada hallazgo (o elemento normal) dispara una respuesta del guía en el chat/notificación, como ahora la burbuja.
- **Contador y "Ja ho tinc clar"** viven en el chat: el guía dice cuántos indicios llevas cuando encuentras uno, y el chat tiene una respuesta rápida fija "Ja ho tinc clar" que abre la pregunta de decisión **dentro de la conversación** (las opciones son respuestas rápidas).
- **Pistas por inactividad** _(propuesta de Claude)_: si pasan ~60 s sin un avance (abrir algo relevante, encontrar un indicio), el guía envía la siguiente pista de la lista `pistes` de la misión. Las pistas no restan puntos.

### Consecuencias y resultado

- **Abrir el enlace trampa ya no es "pescat"** _(propuesta de Claude, más realista y más didáctico)_: se abre la web falsa en el navegador simulado y el guía avisa ("Uf, ja hi ets dins... no hi escriguis res"). La persona puede marcar indicios también en la web (dominio de la barra de direcciones, campos que piden datos de más, etc.).
- **"T'han pescat"** ocurre al hacer la acción dañina dentro del mundo: enviar el formulario con datos, pagar, enviar el código, transferir dinero. Resta los mismos 20 puntos que hoy y termina la misión.
- **Los formularios falsos** nunca envían nada: el `submit` se intercepta en el cliente y los valores no se guardan en el estado (solo un booleano "ha enviado"). Junto al campo se muestra la sugerencia de autocompletado del navegador con los datos inventados de la persona del juego, para que nadie tenga la tentación de escribir datos reales.
- **Pantalla de consecuencia:** efecto de "te han pescado" (la red actual) o de acierto, y después el **informe de la misión** a pantalla completa como cierre de sesión: estrellas, indicios encontrados y perdidos, aprendizajes y consejo. Sale de la estética del sistema simulado a propósito: es el momento de aprender. Botones: repetir, siguiente misión, volver al selector (sale de pantalla completa).
- **Puntuación:** igual que ahora (10 por indicio, decisión 50/20/0, pescat −20, estrellas al 90 % y 60 %).

### Dispositivos y pantallas reales

- **Misión de móvil en un móvil real:** el móvil simulado ocupa toda la pantalla, sin marco (la barra de estado simulada sustituye visualmente a la real).
- **Misión de móvil en un ordenador:** marco de teléfono centrado, de la altura del viewport, sobre un fondo de escritorio desenfocado. Se usa con ratón y teclado.
- **Misión de PC en un ordenador:** el escritorio ocupa toda la pantalla.
- **Misión de PC en un móvil** _(propuesta de Claude)_: se pide girar a horizontal. En horizontal, el escritorio se renderiza a un tamaño lógico mínimo (1280×720) escalado para encajar, con objetivos táctiles ampliados en la barra de tareas. El selector recomienda primero las misiones del dispositivo que se está usando, como hoy.

### Mundo simulado

- **Persona del juego:** Àlex Puig (nombre neutro), con familia y contactos (madre/padre, el hijo Pau, Marta, el grupo "Família", la biblioteca, la farmacia...). Las misiones de fase 1 que hoy hablan a la Remei como dueña del móvil se reescriben para Àlex. **El dispositivo siempre es de Àlex y el guía es un contacto.**
- **`mon.json`**: datos compartidos por todas las misiones (contactos, conversaciones de relleno, fotos de la galería, noticias, ajustes, fondos). Cada misión puede añadir o sobrescribir contenido.
- **Marcas inventadas** (los nombres de producto los puede pulir el builder, sin acercarse a marcas reales):
    - Sistema PC sin nombre visible de marca (barra de tareas centrada, menú de inicio, bandeja, centro de notificaciones).
    - Sistema móvil sin nombre visible de marca (pantalla de bloqueo, inicio con dock, cajón de apps, centro de control, banners).
    - **Navegador** (PC y móvil): pestañas, barra de direcciones con candado, historial atrás/adelante, página de inicio con accesos directos.
    - **Posta**: correo web (en el navegador del PC y como app en el móvil).
    - **Parla**: mensajería tipo WhatsApp (app en el móvil, app de escritorio en el PC para el chat con el guía).
    - **Missatges**: SMS del móvil.
    - **Banc Sòlid**: web real y app del banco (contrastan con la web falsa).
    - **Llum Clara**: compañía eléctrica (web real y web falsa).
    - **Envia't**: mensajería de paquetes (web real y web falsa `.top`).
    - **El Diari del Barri**: web de noticias de relleno.
    - **Ullada**: app tipo Instagram en el móvil, en fase 1 solo con feed de relleno.
    - Relleno en el móvil: Galeria, Ajustos, Càmera (visor negro con un mensaje), Calculadora, Rellotge.
- **Webs simuladas:** cada web es una plantilla React por marca (`banc-solid`, `llum-clara`, `enviat`, `diari`, `posta`...) que recibe datos del JSON. La versión falsa reutiliza la plantilla de la marca con pequeñas diferencias que dicta la misión (dominio, campos de más, textos con urgencia). Un dominio sin web registrada muestra una página de error del navegador creíble.
- **Candado:** las webs falsas también pueden llevar HTTPS y candado. Es intencionado, para enseñar que el candado no garantiza nada.

### Motor y formato de misión v2

- El motor pasa de un reductor por fases cerradas a un **reductor + bus de eventos**: las apps emiten eventos (`app.obre`, `missatge.obre`, `enllac.obre`, `web.carrega`, `formulari.envia`, `pagament.fes`, `codi.envia`, `lupa.inspecciona`, `xat.respon`...) y la misión declara **disparadores** con condición y efectos (`notifica`, `entrega-missatge`, `guia-diu`, `pescat`, `obre-decisio`...), con retrasos opcionales en segundos de juego.
- Siguen igual: `senyals`, `decisio`, `tancament`, `frases`, la puntuación y la validación. Se añaden `pistes`, `disparadors`, contenido por app (`apps.posta`, `apps.parla`, `apps.missatges`...) y `webs`.
- **Acciones en el mundo que cierran la misión** (decisión del usuario: «como consideres»; elegido que valgan las dos vías): además de la decisión en el chat, la misión declara acciones del mundo que equivalen a una opción de `decisio` mediante el efecto `decideix` con el `id` de la opción. Ejemplos: marcar como spam o borrar el correo, bloquear el número, entrar en la web o app _real_ de Banc Sòlid y comprobar que no hay ningún aviso, escribir a Pau a su número de siempre. Puntúan exactamente igual que elegir esa opción en el chat. El chat sigue disponible para quien no quiera tocar nada.
- El validador (`validaMissio`) comprueba que todo `senyal` referenciado exista, que los disparadores apunten a apps/webs registradas y a opciones existentes, y que haya al menos una opción correcta y un camino de "pescat".
- **Compatibilidad v1** _(decisión de Claude)_: el simulador nuevo solo juega misiones v2. Las 2 misiones v1 incluidas se reescriben a v2. Las misiones remotas del CPT **se combinan por `id`** con las incluidas (si una remota v2 válida tiene el mismo `id`, sustituye a la incluida; si no, se añade); las remotas v1 o inválidas se ignoran con un aviso en consola en modo depuración. Así no hay que tocar datos de producción y una misión antigua del panel no puede vaciar el selector.
- Los segmentos inspeccionables (`{ "t": "...", "senyal": "..." }`) se pueden usar en cualquier contenido: correos, SMS, chats, perfiles, campos de formulario, dominio de la barra de direcciones.
- `docs/format-missions.md` se actualiza al formato v2.
- El progreso pasa a la clave `noempesquen-progres-v2`, migrando las estrellas de la v1.

### Aspecto visual

- Fidelidad alta: tipografía del sistema por plataforma (pila `Segoe UI Variable`/`system-ui` en el PC; una sans tipo Roboto con licencia libre empaquetada en el móvil), iconos SVG propios con estilo coherente por sistema, sombras, desenfoques (_acrylic/mica_), animaciones de apertura y cierre de ventanas y apps (desactivadas con `prefers-reduced-motion`), modo claro como estándar.
- Los iconos de las apps inventadas se diseñan para que se reconozca la función (sobre de correo, bocadillo verde, cámara...) sin copiar ningún logotipo real.
- El CSS del simulador vive bajo un prefijo propio y un _reset_ local para que el tema no se cuele, y viceversa.
- Fotos (galería, Ullada, noticias): imágenes con licencia libre (Unsplash o propias), en WebP optimizado, servidas desde `plugins/noempesquen-core/assets/` y no incluidas en el JS.

### Calidad y verificación

- Runner de tests unitarios: `test:unit` pasa a ejecutar Vitest (los tests ya importan `vitest`, pero el script actual lanza Jest de `wp-scripts`).
- Tests unitarios: motor v2 (disparadores, pistas, pescat, puntuación), validación v1/v2, migración del progreso y cada misión incluida (válida, partida perfecta = 3 estrellas, camino de pescat).
- E2e Playwright: cada misión de fase 1 de principio a fin (camino correcto y camino de pescat), pausa y salida con `Esc`, y comprobación axe en escritorio y Pixel 7.
- Revisión visual con capturas a 1440, 1024, 768 y 400 px.

## Orden de entrega dentro de la fase 1 _(decisión de Claude)_

Sin fecha cerrada (el usuario: «hay tiempo, por fases»), pero se entrega por cortes jugables de principio a fin, para poder enseñar avances:

1. **Corte vertical PC:** núcleo (motor v2, eventos, pantalla completa, pausa), sistema PC mínimo (bloqueo, escritorio, barra de tareas, notificaciones, lupa), Navegador, Posta, Parla de escritorio, webs de Llum Clara → misión _La factura de la llum_ jugable entera.
2. **Corte vertical móvil:** sistema móvil (bloqueo, inicio, centro de control, banners), Missatges, Parla, Navegador móvil, webs de Envia't → _El paquet retingut_.
3. **Misiones nuevas:** Banc Sòlid (web real, web falsa, app, móvil vinculado en el PC) → _El banc_; Parla con número desconocido y pago → _Hola, he canviat de mòbil_.
4. **Libertad aparente y pulido:** apps de relleno (Galeria, Ajustos, Càmera, Calculadora, Rellotge, Ullada, El Diari del Barri), PC en móvil horizontal, selector rediseñado, sonidos, revisión visual y de accesibilidad.

## Lo que queda en manos del builder

- Estructura de carpetas dentro de `src/blocks/simulador/` (propuesta: `nucli/`, `sistemes/pc/`, `sistemes/mobil/`, `apps/<app>/`, `webs/<marca>/`, `ui/`).
- Mecanismo de carga diferida con `wp-scripts` (comprobar `import()` dinámico y `publicPath` en un `viewScript`).
- Nombres exactos de eventos y efectos, siempre que el formato quede documentado.
- Textos concretos de las misiones nuevas, revisados después con _humanizer_ (el contenido del juego es catalán de cara al público).
- Sonidos de notificación (opcionales, silenciables en Ajustes, solo después de la primera interacción).
- Orden de las fases 2 y 3.
