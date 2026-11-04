# Añadir un vídeo

Cada vídeo es una página hija de «Vídeos», una en castellano y otra en catalán, con el mismo slug. No hay código que tocar: el bloque `noempesquen/video` pinta la página y la galería de `/videos/` recoge sola las hijas publicadas.

## Antes de subir nada (una sola vez en producción)

1. Límite de subida. Dinahosting suele limitar `upload_max_filesize` y `post_max_size`. En Medios > Añadir nuevo, el «Tamaño máximo de subida» debe ser mayor que el MP4. Si no lo es, súbelo por FTP a `wp-content/uploads/` y regístralo con un plugin de importación, o pide a Dinahosting que suba el límite.
2. CSP y `media-src`. Hoy el sitio no envía ninguna cabecera `Content-Security-Policy`. Si Dinahosting o el `.htaccess` añaden una, comprueba que `media-src 'self'` (o `default-src 'self'`) permite el MP4 y los `.vtt`, y que `img-src 'self'` permite el póster. Con la CSP puesta, abre una página de vídeo con la consola del navegador: no debe salir ningún «Refused to load media».
3. Tipos de archivo. WordPress ya acepta `.mp4` y `.vtt`. El plugin reconoce además los `.vtt` que el servidor detecta como `text/plain`.
4. Sin terceros. Los vídeos se sirven desde nuestro dominio, sin YouTube ni embeds. Si lo cambias, falla el test e2e «sin terceros ni cookies».

## Preparar los archivos

- **Vídeo:** MP4, códec H.264 (vídeo) y AAC (audio), como máximo 1280×720, y de unos 15 MB como mucho. Ejemplo con ffmpeg:
  `ffmpeg -i original.mov -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 24 -preset slow -c:a aac -b:a 128k -movflags +faststart vídeo.mp4`
  (`+faststart` hace que empiece a reproducirse antes de bajarlo entero).
- **Póster:** una imagen 16:9 (por ejemplo 1280×720, JPG o PNG).
- **Subtítulos:** dos archivos `.vtt` (WebVTT), uno en castellano y otro en catalán. Los subtítulos son obligatorios: sin ellos el editor avisa y la página no cumple WCAG.
- **Transcripción:** el texto completo del vídeo, por idioma.

## Pasos en wp-admin

1. En Medios > Añadir nuevo, sube el MP4, el póster y los dos `.vtt`.
2. En Páginas > Añadir nueva (castellano), pon el título del vídeo, elige «Vídeos» en «Página superior» y decide el slug (por ejemplo `phishing-banco`).
3. Inserta el bloque Vídeo (`noempesquen/video`) y rellena el panel lateral:
   - *Fitxers*: vídeo, imagen de portada y los subtítulos de cada idioma.
   - *Dades*: duración en segundos (solo como respaldo: la duración se toma de los metadatos del MP4 y este campo solo se usa si WordPress no puede leerla), tema y el id de la misión del simulador a la que enlaza (por ejemplo `llissa-01-factura`; opcional).
4. Escribe la transcripción dentro del bloque. Sale abierta bajo el vídeo y se puede plegar. Si es larga, divídela con encabezados `h3`.
5. Publica.
6. Repite en catalán: crea la página con el mismo slug, con «Vídeos» como página superior (el que cuelga de `ca`, `/ca/videos/`), título y transcripción en catalán, y el mismo vídeo con el póster. El slug idéntico es lo que enlaza las dos páginas (selector de idioma, hreflang, sitemap).
7. Comprueba en las dos URL (`/videos/<slug>/` y `/ca/videos/<slug>/`) que:
   - se ve el vídeo y su tarjeta en `/videos/` y `/ca/videos/`;
   - el selector de idioma lleva a la pareja;
   - los subtítulos del idioma de la página salen activados por defecto;
   - la transcripción se pliega y se despliega con el teclado.

Si una de las dos páginas no está publicada, la otra sigue funcionando pero sin hreflang ni enlace de pareja.

## Verificar cómo se sirven los archivos

`scripts/verifica-videos.sh <url-mp4> [url-vtt]` comprueba con curl el HEAD del MP4, `Accept-Ranges: bytes`, que un `Range` devuelva 206 (sin él, no se puede saltar en el vídeo) y que el `.vtt` salga como `text/vtt`. Pásalo contra producción tras subir el vídeo.

La página ya no ofrece la descarga de los `.vtt`: la única descarga es el MP4 (dentro del `<video>`, para navegadores sin soporte).

## Cómo encaja al desplegar

La migración de páginas pasó a la versión 2 (`NEP_VERSIO_PAGINES`): crea las páginas `videos` y `ca/videos` con la galería la primera vez que se carga wp-admin tras subir el plugin. Es idempotente y no crea vídeos. Detalles y rollback en `docs/despliegue-i18n.md`.

## Material de desarrollo

`wp nep demo-videos` crea (o actualiza) las páginas `video-demo` en los dos idiomas con un MP4 de muestra y subtítulos de prueba; `--esborra` las borra. Los tests e2e de vídeos (`tests/e2e/videos.spec.js` y `tests/e2e/es/videos.spec.js`) lo llaman solos si no las encuentran. No lo ejecutes en producción: la galería enseñaría el vídeo de muestra.
