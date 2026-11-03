# Despliegue i18n (ES en raíz, CA en `/ca/`) y vuelta atrás

Producción: Dinahosting, hosting compartido, Varnish delante (no cachea `wp-json`, `wp-admin`, `wp-login.php`), sin WP-CLI, despliegue por zip (`npm run build && npm run empaqueta`). El idioma solo sale de la URL.

Ficheros de apoyo: `docs/i18n-redireccions.htaccess` (301) y `scripts/comprova-i18n.mjs` (smoke).

## Mapa de URLs

Slugs catalanes actuales deducidos de las plantillas `themes/noempesquen/templates/page-*.html` y de los enlaces del tema. `/simulador/`, `/compte/` y las páginas `/ca/…` las crea la migración de páginas (ver abajo); no hay que crearlas a mano ni con WP-CLI.

| Catalán actual (raíz) | Catalán nuevo (301) | Español nuevo |
|---|---|---|
| `/` | `/ca/` | `/` (no se redirige) |
| `/simulador/` | `/ca/simulador/` (página nueva) | `/simulador/` (no se redirige; es la página antigua) |
| `/com-funciona/` | `/ca/com-funciona/` | `/como-funciona/` |
| `/missions/` | `/ca/missions/` | `/misiones/` |
| `/compte/` | `/ca/compte/` | `/cuenta/` |
| `/contacte/` | `/ca/contacte/` | `/contacto/` |
| `/sobre-el-projecte/` | `/ca/sobre-el-projecte/` | `/sobre-el-proyecto/` |

Decidido en T09c: `/ca/simulador/` es una página nueva y la `/simulador/` de siempre pasa a ser la ES (mismo ID); el resto de páginas CA conservan ID y slug al pasar bajo `/ca/`. Duda abierta: Hay más páginas en producción que no salen del código (se crean a mano): revisar en wp-admin > Páginas antes de insertar los 301.

## Verificaciones previas (antes de subir nada)

- **`robots.txt` físico:** si existe un fichero `robots.txt` en la raíz, WordPress/TSF no genera el virtual y no saldrá `Sitemap:`. Comprobar por FTP; si existe, añadir a mano `Sitemap: https://noempesquen.cat/wp-sitemap.xml`.
- **Language pack `es_ES` instalado en producción** (Escritorio > Actualizaciones > Traducciones). Si no, los textos del core y de wp-admin salen en inglés en la parte ES. Los textos del plugin van en el `.mo` del zip.
- **Slugs `/ca/simulador/` y `/ca/compte/`** confirmados con Edu y presentes en la tabla de URLs.
- **Alta de cuenta y correo real** probados en ES y en CA (el correo llega, idioma y enlace correctos).
- **Search Console:** anotar posiciones y consultas de la home antes de desplegar. La raíz pasa de catalán a español sin redirección, así que el cambio de ranking de `/` es esperable y hay que poder medirlo.
- **Compresión:** confirmar que Dinahosting comprime `.js` y `.json` (`curl -sI -H 'Accept-Encoding: gzip' <url del .js> | grep -i content-encoding`).
- **Después del despliegue:** pasar `node scripts/axe-i18n.mjs` y el recorrido móvil ES contra el sitio publicado.

## Orden de despliegue

1. **Exportar antes de subir** (phpMyAdmin/panel de Dinahosting): solo `wp_posts`, `wp_postmeta` y las filas de `wp_options` con `option_name` en `page_on_front`, `show_on_front`, `rewrite_rules`, `nep_versio_pagines`. No la BD entera: restaurarla borraría cuentas y partidas nuevas. Copia también el `.htaccess` actual y `wp-content/plugins/noempesquen-core` + `themes/noempesquen`. Anota el zip actual.
2. **Zip:** `npm ci && npm run build && npm run empaqueta`. Salida en `dist/`. Guarda aparte el zip anterior (rollback).
3. **Subir el TEMA primero y luego el plugin**, y abrir wp-admin (Escritorio) inmediatamente tras el plugin: la migración llama a `delete_pattern_cache()` y, con el tema viejo todavía activo, vaciaría la caché de un tema que va a cambiar. Si por lo que sea se sube el plugin primero, abre wp-admin justo después de subir el tema.
4. **Migración de páginas:** automática (ver abajo). Cargar wp-admin una vez: las páginas públicas pueden salir de Varnish sin llegar a PHP. Comprobar en wp-admin > Páginas que existen los slugs de la tabla y que la página `ca` tiene las seis hijas.
5. **Flush de rewrites:** lo hace la migración (solo si no hubo errores). Si algo da 404, Ajustes > Enlaces permanentes > Guardar.
6. **Smoke sin 301:** `node scripts/comprova-i18n.mjs https://noempesquen.cat --sense-301`. Debe salir 0 (aviso DUBTE aceptable). Si falla, no sigas.
7. **Insertar el bloque htaccess** (`# BEGIN nep-i18n … # END nep-i18n`, con `R=302`) antes de `# BEGIN WordPress`. **Tenerlo copiado y listo para pegar en <=2 min** tras la migración: entre migración y bloque las URLs catalanas de la raíz dan 404, y los enlaces `?verifica=` / `?restableix=` ya enviados pueden romper en ese tramo.
8. **Purgar Varnish** justo después (panel de Dinahosting).
9. **Smoke completo:** `node scripts/comprova-i18n.mjs https://noempesquen.cat` (los 302 salen como DUBTE provisional) y las comprobaciones `curl` de abajo.
10. Probar a mano: login por `/admin/`, REST (`/wp-json/noempesquen/v1/missions?lang=es`), `/cuenta/` y `/ca/compte/`.
11. **1-2 semanas después**, con smoke y Search Console limpios (sin errores de cobertura ni bucles): cambiar `R=302` por `R=301` en el bloque y purgar Varnish. Motivo del 302 inicial: un 301 queda cacheado de forma permanente en navegadores y Google, y no se puede deshacer en los clientes que ya lo vieron.

## Rollback (secuencia única, ensayable)

Ensayar una vez en un entorno de pruebas con la exportación del paso 1.

1. **Quitar el bloque `nep-i18n`** del `.htaccess` (o restaurar la copia). Purgar Varnish.
2. **Reinstalar los zips anteriores** de tema y plugin (wp-admin > «Reemplaza el instalado»).
3. **Deshacer la migración sin restaurar la BD entera:**
   1. Reparentar a «(sin superior)» las hijas de `ca` que eran antiguas (todas menos `simulador`); borrar las ES nuevas, la página `ca` y `inicio`.
   2. Restaurar la portada: importar las filas `page_on_front` y `show_on_front` exportadas (o Ajustes > Lectura).
   3. Borrar la opción `nep_versio_pagines` (y `nep_migracio_pagines_espera` / `nep_migracio_pagines_bloqueig` si existen). Si el plugin nuevo sigue instalado, la migración volverá a correr.
   4. Solo si el contenido quedó inconsistente: importar `wp_posts` y `wp_postmeta` exportados (no toca usuarios ni tablas del plugin).
4. **Flush de rewrites** (Ajustes > Enlaces permanentes > Guardar; o reimportar la fila `rewrite_rules`) y purgar Varnish.
5. `node scripts/comprova-i18n.mjs` contra la versión anterior: las URLs catalanas en raíz dan 200 de nuevo.

## Migración de páginas (T09c)

Código: `plugins/noempesquen-core/includes/migracio-pagines.php`. Mapa de slugs: `nep_pagines()` (`includes/idioma-nucli.php`), la única fuente; el tema la usa vía `nep_tema_pagines()`.

- **Cuándo corre:** en `init` (prioridad 99) si la opción `nep_versio_pagines` es menor que `NEP_VERSIO_PAGINES`, y al activar el plugin. Sin WP-CLI. No va en `plugins_loaded` porque ahí aún no existen los tipos de contenido ni `$wp_rewrite`.
- **Reintentos:** si hay algún `error:`, no se hace flush ni se vacía la caché de patterns y la migración espera 10 minutos (opción `nep_migracio_pagines_espera`, máximo 3 intentos), para no repetir en cada petición anónima ni inundar `error_log`. Agotados los 3 intentos hay que borrar esa opción tras corregir la causa.
- **Candado:** la opción `nep_migracio_pagines_bloqueig`, tomada con `INSERT IGNORE` (atómico; `add_option` no lo es), evita que dos peticiones simultáneas creen duplicados. Caduca a los 5 minutos y solo se libera si el valor sigue siendo el propio.
- **Sin kses durante la migración:** la primera petición puede ser anónima; reparentar no debe filtrar el HTML de las páginas existentes. Al terminar se restauran los filtros solo si estaban activos.
- **Qué hace, en orden:**
  1. Crea la página `ca` (plantilla `page-ca.html` por slug) si no existe.
  2. Para cada página CA: si `/ca/<slug>/` ya existe, nada. Si existe la antigua `/<slug>/` en raíz, la mueve bajo `ca` conservando ID y contenido. Si no, la crea.
  3. Crea la ES en raíz solo si su ruta no existe. Nunca sobrescribe una página que ya está.
  4. Portada: si el sitio no tiene portada estática válida, crea `inicio` y la fija como portada (`show_on_front=page`). Una portada estática ya configurada se respeta.
  5. `flush_rewrite_rules( false )` y vaciado de la caché de patterns del tema (`delete_pattern_cache()`; además el tema sube a `Version: 0.2.0`).
- **Contenido:** solo `simulador` (ES/CA) y `cuenta`/`compte` llevan el bloque en el contenido; el resto sale de los patterns (contacto incluye el bloque en el pattern).
- **Log:** una línea `[noempesquen] migració de pàgines: …` en el log de PHP con acciones y slugs (`creada:`, `reparentada:`, `duplicada:`, `error:`). Sin datos personales. Si hay algún `error:`, no se guarda la versión y se reintenta con el margen descrito arriba.
- **`duplicada:<slug>`:** existen a la vez la raíz antigua y `/ca/<slug>/`. No se toca ninguna; el 301 de `.htaccess` tapa la antigua. Revisar a mano en wp-admin.
- **Sin bucles de `redirect_canonical`:** en rutas `/ca/…` se desactiva `redirect_guess_404_permalink`. Así un 404 en `/ca/x/` no se «adivina» como `/x/`, que el 301 devolvería a `/ca/x/`.
- **Rollback de la migración:** las páginas movidas conservan ID. Para deshacer sin restaurar la BD: en wp-admin, poner «Superior: (sin superior)» a las hijas de `ca` que eran antiguas (todas menos `simulador`), borrar las ES nuevas, la página `ca` y `inicio`, volver a Ajustes > Lectura > «Tus últimas entradas» y guardar los enlaces permanentes. Si se reinstala el zip nuevo con la opción `nep_versio_pagines` ya borrada, la migración vuelve a correr.

## Comprobaciones `curl`

```bash
curl -sI https://noempesquen.cat/                 # 200, Vary, Age (Varnish)
curl -sI https://noempesquen.cat/compte/          # 301, Location: /ca/compte/
curl -sI https://noempesquen.cat/ca/compte/       # 200
curl -s  https://noempesquen.cat/ca/ | grep -Eo '<html[^>]*>|rel="canonical"[^>]*|hreflang="[^"]*"[^>]*'
```

- **Vary:** no debe depender de `Cookie`/`Accept-Language` en páginas públicas (el idioma sale de la URL).
- **Age:** crece en las páginas cacheadas; tras purgar, la primera petición da `Age: 0` o ausente.
- **Location** de los 301: ruta `/ca/…` con la barra final y la query intacta.

Tabla de URLs esperadas (el script la usa tal cual):

| URL | status | `html lang` | canonical | hreflang |
|---|---|---|---|---|
| `/` | 200 | `es-ES` | `/` | es → `/`, ca → `/ca/`, x-default → `/` |
| `/ca/` | 200 | `ca` | `/ca/` | idem |
| `/como-funciona/` | 200 | `es-ES` | `/como-funciona/` | es → ella, ca → `/ca/com-funciona/`, x-default → ES |
| `/ca/com-funciona/` | 200 | `ca` | `/ca/com-funciona/` | idem |
| `/misiones/` · `/ca/missions/` | 200 | `es-ES` · `ca` | autorreferenciado | recíproco |
| `/cuenta/` · `/ca/compte/` | 200 | `es-ES` · `ca` | autorreferenciado | recíproco |
| `/contacto/` · `/ca/contacte/` | 200 | `es-ES` · `ca` | autorreferenciado | recíproco |
| `/sobre-el-proyecto/` · `/ca/sobre-el-projecte/` | 200 | `es-ES` · `ca` | autorreferenciado | recíproco |
| `/simulador/` · `/ca/simulador/` | 200 | `es-ES` · `ca` | autorreferenciado | recíproco |
| `/com-funciona/`, `/missions/`, `/compte/`, `/contacte/`, `/sobre-el-projecte/` | 301 | | | Location `/ca/<mismo-slug>/` |
| `/`, `/simulador/` | sin 301 | | | |

## Riesgos conocidos

- Insertar los 301 antes de que existan las páginas `/ca/…` deja 404 en URLs indexadas: respeta el orden.
- `/compte/?verifica=…` y `?restableix=…` llevan token en la query: el 301 la conserva, y `view.js` la limpia al llegar a `/ca/compte/` (ver `docs/decisions.md`). Los correos ya enviados siguen funcionando por el 301.
- **Caché:** `Vary: X-Nep-Lang` solo cubre las respuestas REST del plugin. Confirmar que Varnish no cachea `admin-ajax.php` ni peticiones POST (ahí el idioma lo decide la cabecera o `?lang=`).
- Un `.htaccess` roto da 500 en todo el sitio: tener a mano el acceso por FTP/panel para restaurar la copia.
- Las reglas del htaccess ya no usan `[S=N]`: cada una lleva su `RewriteCond` explícita.
- Slug CA de `/simulador/`: `/ca/simulador/` es la página nueva. TODO: confirmar con Edu antes de desplegar.
- TODO: confirmar que `/ca/compte/` existe antes de insertar los 301 (la migración la crea; comprobar en wp-admin > Páginas).

## SEO (T10)

Código: `plugins/noempesquen-core/includes/seo-idioma.php` (hooks), `seo-idioma-nucli.php` (puro, `SeoIdiomaNucliTest`) y `class-nep-sitemap-idioma.php`.

- **The SEO Framework (TSF) ya pone** canonical autorreferenciado, `<title>`, `og:locale` (`es_ES`/`ca_ES`) y JSON-LD con `inLanguage` según el locale de la petición. No se duplican. Sin TSF, el canonical lo pone `rel_canonical` del core y `og:locale` lo pone el plugin.
- **hreflang:** `es`, `ca` y `x-default` (→ ES), URLs absolutas, solo en las páginas de `nep_pagines()` cuya pareja existe y está publicada. La página se reconoce por slug **y** padre (ES en raíz, CA hija de `ca`), así que una página fuera del mapa, un 404 o una raíz antigua con slug catalán no llevan hreflang. También `og:locale:alternate`.
- **Sitemaps:** los del core, uno por idioma: `/wp-sitemap-es-1.xml` y `/wp-sitemap-ca-1.xml`, listados en `/wp-sitemap.xml`. Las páginas del mapa (y las raíces antiguas con slug catalán) se quitan de `wp-sitemap-posts-page-1.xml`; las demás páginas siguen ahí. `robots.txt` apunta a `/wp-sitemap.xml` solo si no hay `robots.txt` físico (lo escribe el core o TSF en el virtual).
- **Decisión:** el plugin fuerza `sitemaps_output = 0` de TSF (filtro `the_seo_framework_get_options`) para usar los sitemaps del core. Por eso `/sitemap.xml` (el de TSF) deja de existir (el bloque htaccess lo redirige a `/wp-sitemap.xml`, 302 -> 301 con la misma política): en Search Console hay que enviar `/wp-sitemap.xml`.
- **Título y description:** no hay textos fijos. El título sale del `post_title` de cada idioma y TSF no genera description en estas páginas. No hacen falta cadenas nuevas.
- **Progreso al cambiar de idioma:** se conserva. `nucli/progres.js` guarda en `localStorage` con la clave `noempesquen-progres-v2` (sin idioma), el origen es el mismo y los ids de misión son iguales en ES y CA.
- **Sugerencia de idioma:** solo en `/` y `/simulador/` en ES. Es un aviso `<aside hidden lang="ca">` en `patterns/capcalera.php` y `assets/suggeriment-idioma.js` lo muestra si `navigator.language` empieza por `ca` y no se ha cerrado (`localStorage` `noempesquen-suggeriment-idioma`). No redirige, no usa cookies ni `role="alert"`. Al cerrarlo, el foco va al selector de idioma.
- **Comprobación:** `node scripts/comprova-i18n.mjs` (canonical único, hreflang y tabla resumen) y `node scripts/axe-i18n.mjs` (axe con el navegador en catalán).

## Traducciones PHP (`.mo`) y correos (T09b)

- PHP carga `plugins/noempesquen-core/languages/noempesquen-es_ES.mo` (`load_plugin_textdomain` en `init` y filtro `load_textdomain_mofile`, que cubre la recarga tras `switch_to_locale()`). No hace falta WP-CLI ni language packs: el `.mo` viaja en el zip. El catalán es el msgid y no tiene fichero.
- Generar el `.mo`: `npm run i18n:mo` (compila `noempesquen-es_ES.po`; sin `msgfmt`). Orden tras traducir: `i18n:pot` → `i18n:merge` → `i18n:json` → `i18n:mo`, y commit de `.po`, `.json` y `.mo`.
- Los view scripts de `compte` y `contacte` usan `wp_set_script_translations` con el mismo JSON que el simulador (todas las cadenas del `.po` van a un solo fichero).
- Correos de cuenta: idioma = meta de usuario `nep_idioma` (se guarda al registrarse desde la cabecera `X-Nep-Lang` que envía el bloque; sin meta, `ca`, porque las cuentas previas eran catalanas). Se envían con `switch_to_locale()` y el enlace sale de `nep_url_pagina( 'compte', $idioma )`: `/cuenta/` o `/ca/compte/`.
- Las respuestas REST de `noempesquen/v1` llevan `Vary: X-Nep-Lang`.
