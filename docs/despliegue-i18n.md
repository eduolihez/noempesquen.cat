# Despliegue i18n (ES en raíz, CA en `/ca/`) y vuelta atrás

Producción: Dinahosting, hosting compartido, Varnish delante (no cachea `wp-json`, `wp-admin`, `wp-login.php`), sin WP-CLI, despliegue por zip (`npm run build && npm run empaqueta`). El idioma solo sale de la URL.

Ficheros de apoyo: `docs/i18n-redireccions.htaccess` (301) y `scripts/comprova-i18n.mjs` (smoke).

## Mapa de URLs

Slugs catalanes actuales deducidos de las plantillas `themes/noempesquen/templates/page-*.html` y de los enlaces del tema. `/simulador/` y `/compte/` se crean a mano (README).

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

## Orden de despliegue

1. **Copia de BD** (phpMyAdmin/panel de Dinahosting: exportar) y copia del `.htaccess` actual y de `wp-content/plugins/noempesquen-core` y `themes/noempesquen`. Anota el hash/zip actual desplegado.
2. **Zip:** `npm ci && npm run build && npm run empaqueta`. Salida en `dist/`. Guarda aparte el zip anterior (rollback).
3. **Subir plugin y tema** (wp-admin > Plugins/Temas > «Reemplaza el instalado»; completar el paso de confirmación). Activar el plugin si hace falta.
4. **Migración de páginas:** automática (ver «Migración de páginas» abajo). Tras subir el zip, cargar wp-admin (Escritorio) una vez: las páginas públicas pueden salir de Varnish sin llegar a PHP. Comprobar en wp-admin > Páginas que existen los slugs de la tabla y que la página `ca` tiene las seis hijas.
5. **Flush de rewrites:** lo hace la migración. Si algo da 404, wp-admin > Ajustes > Enlaces permanentes > Guardar (sin cambiar nada); repetirlo no daña.
6. **Smoke sin 301:** `node scripts/comprova-i18n.mjs https://noempesquen.cat --sense-301`. Debe salir 0 (aviso DUBTE aceptable). Si falla, no sigas al paso 7.
7. **Insertar 301:** pegar el bloque `# BEGIN nep-i18n … # END nep-i18n` de `docs/i18n-redireccions.htaccess` en el `.htaccess` de la raíz, antes de `# BEGIN WordPress`.
8. **Purgar Varnish** (panel de Dinahosting) para que no sirva respuestas viejas.
9. **Smoke completo:** `node scripts/comprova-i18n.mjs https://noempesquen.cat`. Debe salir 0. Revisar a mano las comprobaciones `curl` de abajo.
10. Probar a mano: login por `/admin/`, REST (`/wp-json/noempesquen/v1/missions?lang=es`), `/cuenta/` y `/ca/compte/`.

## Rollback (en este orden)

1. **Quitar los 301:** borrar el bloque `nep-i18n` del `.htaccess` (o restaurar la copia del paso 1). Purgar Varnish.
2. **Plugin y tema:** reinstalar el zip anterior (wp-admin > «Reemplaza el instalado»).
3. **Restaurar BD** con la exportación del paso 1 (importar en phpMyAdmin). Solo si la migración de páginas dejó el contenido inconsistente: restaura la BD entera borra lo creado después de la copia (cuentas, partidas), así que valora antes exportar tablas puntuales.
4. **Flush de rewrites** (Ajustes > Enlaces permanentes > Guardar) y purgar Varnish.
5. Comprobar con `node scripts/comprova-i18n.mjs` la versión anterior: las URLs catalanas en raíz dan 200 de nuevo.

## Migración de páginas (T09c)

Código: `plugins/noempesquen-core/includes/migracio-pagines.php`. Mapa de slugs: `nep_pagines()` (`includes/idioma-nucli.php`), la única fuente; el tema la usa vía `nep_tema_pagines()`.

- **Cuándo corre:** en `init` (prioridad 99) si la opción `nep_versio_pagines` es menor que `NEP_VERSIO_PAGINES`, y al activar el plugin. Sin WP-CLI. No va en `plugins_loaded` porque ahí aún no existen los tipos de contenido ni `$wp_rewrite`.
- **Candado:** la opción `nep_migracio_pagines_bloqueig`, tomada con `INSERT IGNORE` (atómico; `add_option` no lo es), evita que dos peticiones simultáneas creen duplicados. Caduca a los 5 minutos.
- **Sin kses durante la migración:** la primera petición puede ser anónima; reparentar no debe filtrar el HTML de las páginas existentes.
- **Qué hace, en orden:**
  1. Crea la página `ca` (plantilla `page-ca.html` por slug) si no existe.
  2. Para cada página CA: si `/ca/<slug>/` ya existe, nada. Si existe la antigua `/<slug>/` en raíz, la mueve bajo `ca` conservando ID y contenido. Si no, la crea.
  3. Crea la ES en raíz solo si su ruta no existe. Nunca sobrescribe una página que ya está.
  4. Portada: si el sitio no tiene portada estática válida, crea `inicio` y la fija como portada (`show_on_front=page`). Una portada estática ya configurada se respeta.
  5. `flush_rewrite_rules( false )` y vaciado de la caché de patterns del tema (`delete_pattern_cache()`; además el tema sube a `Version: 0.2.0`).
- **Contenido:** solo `simulador` (ES/CA) y `cuenta`/`compte` llevan el bloque en el contenido; el resto sale de los patterns (contacto incluye el bloque en el pattern).
- **Log:** una línea `[noempesquen] migració de pàgines: …` en el log de PHP con acciones y slugs (`creada:`, `reparentada:`, `duplicada:`, `error:`). Sin datos personales. Si hay algún `error:`, no se guarda la versión y se reintenta en la siguiente petición.
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
- Un `.htaccess` roto da 500 en todo el sitio: tener a mano el acceso por FTP/panel para restaurar la copia.

## Traducciones PHP (`.mo`) y correos (T09b)

- PHP carga `plugins/noempesquen-core/languages/noempesquen-es_ES.mo` (`load_plugin_textdomain` en `init` y filtro `load_textdomain_mofile`, que cubre la recarga tras `switch_to_locale()`). No hace falta WP-CLI ni language packs: el `.mo` viaja en el zip. El catalán es el msgid y no tiene fichero.
- Generar el `.mo`: `npm run i18n:mo` (compila `noempesquen-es_ES.po`; sin `msgfmt`). Orden tras traducir: `i18n:pot` → `i18n:merge` → `i18n:json` → `i18n:mo`, y commit de `.po`, `.json` y `.mo`.
- Los view scripts de `compte` y `contacte` usan `wp_set_script_translations` con el mismo JSON que el simulador (todas las cadenas del `.po` van a un solo fichero).
- Correos de cuenta: idioma = meta de usuario `nep_idioma` (se guarda al registrarse desde la cabecera `X-Nep-Lang` que envía el bloque; sin meta, `ca`, porque las cuentas previas eran catalanas). Se envían con `switch_to_locale()` y el enlace sale de `nep_url_pagina( 'compte', $idioma )`: `/cuenta/` o `/ca/compte/`.
- Las respuestas REST de `noempesquen/v1` llevan `Vary: X-Nep-Lang`.
