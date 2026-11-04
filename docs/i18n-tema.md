# Tema en ES (raíz) y CA (`/ca/`)

## Plantillas por slug
WordPress elige `page-{post_name}.html` por el slug propio de la página, no por su ruta. Por eso:
- Las páginas CA (hijas de `/ca/`) siguen usando las plantillas catalanas: `page-com-funciona`, `page-missions`, `page-compte`, `page-contacte`, `page-sobre-el-projecte`.
- Las ES tienen una plantilla mínima por slug: `page-como-funciona`, `page-misiones`, `page-cuenta`, `page-contacto`, `page-sobre-el-proyecto`.
- `videos` usa `page-videos.html` en los dos idiomas (mismo slug, así que una sola plantilla) y el pattern `noempesquen/videos` con la galería. Los vídeos individuales (hijas de `videos`) no tienen plantilla propia: usan `page.html` y llevan el bloque `noempesquen/video` en el contenido, con el `<h1>` dentro del bloque.
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
- Cabecera en tres zonas (desde 72 rem): logo a la izquierda, páginas centradas y, a la derecha del todo, icono de cuenta y selector de idioma. Por debajo, el menú pasa a una segunda fila centrada; en móvil (≤ 37,4 rem) quedan logo, idioma y hamburguesa, y «El meu compte» y «Entra a jugar» van dentro de la hamburguesa. «Entra a jugar» ya no es un botón de la cabecera.
- Es un `<nav aria-label="Idioma">` con un `<details>` desplegable. El botón (`summary`) enseña el idioma actual («Castellano» / «Català»; «ES» / «CA» en móvil) y la lista ofrece los dos idiomas como enlaces estáticos a la página equivalente (`nep_tema_clau_actual()`), con `lang`, `hreflang` y `aria-current="true"` en el actual. Si la página no tiene equivalente, el enlace va a la portada del otro idioma.
- `assets/idioma-desplegable.js` cierra con Esc (devolviendo el foco al botón), con clic fuera y al salir el foco. Sin JS el `<details>` se abre y se cierra igualmente.
- El `aria-label` va en el `nav`, no en el botón. Objetivos de 44 px, foco visible con el `:focus-visible` global y flecha sin animación si `prefers-reduced-motion`.
- Clase del icono de cuenta: `nep-capcalera__compte` (no `nep-compte`, que es del bloque de cuenta).
- Los `<link hreflang>` del `<head>` los pone el plugin (ver `docs/despliegue-i18n.md`, sección SEO).

## Caché de patterns
- Los patterns se cachean. La migración llama a `delete_pattern_cache()` y el tema sube de `Version`.
- Si cambias un pattern sin subir la versión del tema, borra la caché (`delete_pattern_cache()` o subir versión) o el cambio no se verá.
