# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Público general, incluidas personas mayores y poco digitales, que quieren aprender a reconocer estafas (phishing, falsos premios, soporte técnico falso, inversiones falsas) jugando. Llegan desde el móvil o el ordenador, a menudo sin conocimiento técnico. El jurado de los Premis Wapps .cat 2026/27 es una audiencia secundaria: no se diseña para él.

## Product Purpose
noempesquen.cat es un simulador de estafas digitales: el jugador vive misiones realistas en un ordenador y un móvil simulados, a pantalla completa, y aprende a detectar señales de fraude sin riesgo. Éxito: que alguien entre a jugar en pocos segundos y salga sabiendo qué mirar la próxima vez.

## Positioning
Un simulador completo de sistemas operativos con marcas inventadas, no un test ni un vídeo: el jugador decide dentro del mundo (denunciar, borrar, bloquear) y ve la consecuencia. Cuentas opcionales con progreso, sin recoger lo que teclea en los formularios falsos.

## Capabilities and Constraints
- WordPress con tema de bloques propio (`themes/noempesquen`) y plugin `noempesquen-core`; el simulador es el bloque `noempesquen/simulador` (React de `@wordpress/element`).
- Home actual vacía: no hay contenido de portada. Páginas existentes: `/simulador/`, `/compte/`.
- Textos en catalán; identificadores en catalán. Sin marcas reales, sin emojis, iconos SVG propios.
- Hosting compartido (Dinahosting) con Varnish; sin Node en producción. El tema se sube por zip desde wp-admin.
- Decidido por Edu: el objetivo de la home es entrar a jugar ya (botón principal al simulador).

## Brand Commitments
Nombre «No em pesquen». Marcas ficticias del juego: Posta, Parla, Llum Clara, Banc Sòlid, Envia't, Ullada, El Diari del Barri, Revenda, Revenda Cobra, Invest Rapid. Personajes: Carla Montsant, Jordi M. Paleta actual del tema (puntos de partida, no vinculantes): fons #F7F4EC, text #14213D, mar #0B5E7A, escuma #DDEFF2.

## Evidence on Hand
10 misiones jugables (`plugins/noempesquen-core/missions/`), estadísticas públicas agregadas (solo con n>=10 partidas). No hay testimonios, casos de usuarios ni prensa: no inventar.

## Product Principles
1. Jugar primero: el camino de la home al simulador es corto y evidente.
2. Confianza y calma: el sitio enseña a desconfiar, así que él mismo no debe parecer una estafa ni asustar.
3. Accesible de verdad: pensado para gente mayor y poco digital, no solo para pasar WCAG.
4. Honestidad: nada de cifras, testimonios ni claims inventados.

## Accessibility & Inclusion
WCAG 2.2 AA obligatorio, también dentro del sistema simulado. Público con personas mayores: texto grande, contraste alto, objetivos táctiles generosos, lenguaje llano en catalán.
