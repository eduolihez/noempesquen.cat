# Despliegue i18n (ES en raíz, CA en `/ca/`) y vuelta atrás

Producción: Dinahosting, hosting compartido, Varnish delante (no cachea `wp-json`, `wp-admin`, `wp-login.php`), sin WP-CLI, despliegue por zip (`npm run build && npm run empaqueta`). El idioma solo sale de la URL.

Ficheros de apoyo: `docs/i18n-redireccions.htaccess` (301) y `scripts/comprova-i18n.mjs` (smoke).

## Mapa de URLs

Slugs catalanes actuales deducidos de las plantillas `themes/noempesquen/templates/page-*.html` y de los enlaces del tema. `/simulador/` y `/compte/` se crean a mano (README).

| Catalán actual (raíz) | Catalán nuevo (301) | Español nuevo |
|---|---|---|
| `/` | `/ca/` | `/` (no se redirige) |
| `/simulador/` | `/ca/simulador/` (por confirmar) | `/simulador/` (no se redirige) |
| `/com-funciona/` | `/ca/com-funciona/` | `/como-funciona/` |
| `/missions/` | `/ca/missions/` | `/misiones/` |
| `/compte/` | `/ca/compte/` | `/cuenta/` |
| `/contacte/` | `/ca/contacte/` | `/contacto/` |
| `/sobre-el-projecte/` | `/ca/sobre-el-projecte/` | `/sobre-el-proyecto/` |

Dudas: (1) el slug de `/simulador/` en catalán (`/ca/simulador/` es una suposición; el script lo marca DUBTE, no falla). (2) Si la migración conserva o cambia el slug `/ca/compte/` etc. (aquí se asume que se conserva, como dice la decisión «`/ca/<slug-catalán>/`»). (3) Hay más páginas en producción que no salen del código (se crean a mano): revisar en wp-admin > Páginas antes de insertar los 301.

## Orden de despliegue

1. **Copia de BD** (phpMyAdmin/panel de Dinahosting: exportar) y copia del `.htaccess` actual y de `wp-content/plugins/noempesquen-core` y `themes/noempesquen`. Anota el hash/zip actual desplegado.
2. **Zip:** `npm ci && npm run build && npm run empaqueta`. Salida en `dist/`. Guarda aparte el zip anterior (rollback).
3. **Subir plugin y tema** (wp-admin > Plugins/Temas > «Reemplaza el instalado»; completar el paso de confirmación). Activar el plugin si hace falta.
4. **Migración de páginas:** ejecutar la rutina idempotente `nep_actualitza` (se dispara al cargar admin con la versión nueva). Crea/renombra/reparenta las ~12 páginas y menús. Comprobar en wp-admin > Páginas que existen los slugs de la tabla.
5. **Flush de rewrites:** wp-admin > Ajustes > Enlaces permanentes > Guardar (sin cambiar nada). Si la migración ya lo hace, repetirlo no daña.
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
| `/simulador/` · `/ca/simulador/` (por confirmar) | 200 | `es-ES` · `ca` | autorreferenciado | recíproco |
| `/com-funciona/`, `/missions/`, `/compte/`, `/contacte/`, `/sobre-el-projecte/` | 301 | | | Location `/ca/<mismo-slug>/` |
| `/`, `/simulador/` | sin 301 | | | |

## Riesgos conocidos

- Insertar los 301 antes de que existan las páginas `/ca/…` deja 404 en URLs indexadas: respeta el orden.
- `/compte/?verifica=…` y `?restableix=…` llevan token en la query: el 301 la conserva, y `view.js` la limpia al llegar a `/ca/compte/` (ver `docs/decisions.md`). Los correos ya enviados siguen funcionando por el 301.
- Un `.htaccess` roto da 500 en todo el sitio: tener a mano el acceso por FTP/panel para restaurar la copia.
