# Tema en ES (raíz) y CA (`/ca/`)

## Plantillas por slug
WordPress elige `page-{post_name}.html` por el slug propio de la página, no por su ruta. Por eso:
- Las páginas CA (hijas de `/ca/`) siguen usando las plantillas catalanas: `page-com-funciona`, `page-missions`, `page-compte`, `page-contacte`, `page-sobre-el-projecte`.
- Las ES tienen una plantilla mínima por slug: `page-como-funciona`, `page-misiones`, `page-cuenta`, `page-contacto`, `page-sobre-el-proyecto`.
- `/ca/` (página `ca`) usa `page-ca.html`, igual que `front-page.html`.
- Todas las plantillas son iguales: header, `<main id="contingut">`, `<!-- wp:pattern {"slug":"noempesquen/…"} /-->` y footer. Un par ES/CA apunta al mismo pattern.

Descartado: el filtro `page_template_hierarchy` (menos visible en el editor de sitio).

## Textos: un pattern PHP por página, no uno por idioma
- Están en `themes/noempesquen/patterns/`: `capcalera`, `peu`, `portada`, `com-funciona`, `missions`, `compte`, `contacte` y `sobre-el-projecte`. Todos llevan `Inserter: no`.
- El msgid es el catalán actual y el contexto es `tema` (`_x`/`esc_html_x`). En `ca`, `__()` devuelve el texto de siempre; en `es`, la traducción.
- El contexto evita choques con cadenas iguales del JS (`Missions`, `Entra a jugar`…) al fusionar los `.po`.
- Las cadenas con enlace usan `sprintf( '<a href="%s">' )` + `wp_kses_post`.
- `<strong>` y `<em>` van dentro del msgid.
- Los títulos y resúmenes de las misiones en ES copian los de `missions/es/*.json`.
- Las cadenas en ES están en `plugins/noempesquen-core/languages/parts/es-tema.po` (113 msgid). Se escribe a mano: `i18n:pot` no escanea el tema.

## Dominio y carga
- El tema usa el dominio `noempesquen`, el mismo catálogo que el plugin (`load_plugin_textdomain` en `init`).
- Se quitó `load_theme_textdomain()`: apuntaba a una carpeta vacía del tema para el mismo dominio y podía tapar el `.mo` del plugin.

## Enlaces
- El mapa clave → slug ES/CA (`inici`, `simulador`, `com-funciona`, `missions`, `compte`, `contacte`, `projecte`) vive en UN sitio: `nep_pagines()` del plugin (`includes/idioma-nucli.php`). `nep_ruta_pagina()` y la migración de páginas lo usan.
- `nep_tema_pagines()` (functions.php) devuelve `nep_pagines()`; su copia local solo sirve de reserva si el plugin no está activo.
- `nep_tema_url( $clau, $idioma, $ancora )` usa `nep_url()` del plugin, con `home_url` como reserva si el plugin no está activo.
- No queda ningún slug fijo en plantillas ni patterns.

## Selector de idioma (header)
- Es un `<nav aria-label="Idioma">` (traducido) con un enlace estático a la página equivalente del otro idioma, que se busca con `nep_tema_clau_actual()`. Si la página no tiene equivalente, el enlace va a la portada del otro idioma.
- El texto visible está en el idioma de destino («Català» / «Castellano»), con `lang` y `hreflang`.
- El `aria-label` va en el `nav` y no en el enlace, para cumplir WCAG 2.5.3 (la etiqueta tiene que coincidir con el texto visible).
- Objetivo de 44 px, foco visible con el `:focus-visible` global y sin JS.
- Los `<link hreflang>` del `<head>` son T10.
