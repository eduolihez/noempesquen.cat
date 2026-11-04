# Vídeo de mostra

Material de prueba (no es contenido real, no va al zip de despliegue):
`mostra.mp4` (6 s, 640x360, h264+aac), `poster.png`, `subtitols-ca.vtt` y `subtitols-es.vtt`.

## Regenerar

Requiere ffmpeg (en PATH o en la variable `FFMPEG`). Usa los colores de `themes/noempesquen/theme.json`.

```bash
node scripts/genera-video-mostra.mjs
```

## Cargar en wp-env

```bash
npm run env:cli -- wp nep demo-videos             # sube los ficheros y crea /videos/video-demo/ y /ca/videos/video-demo/
npm run env:cli -- wp nep demo-videos --esborra   # retira páginas y adjuntos de la demo
```

Es idempotente: repetirlo actualiza las páginas y reutiliza los adjuntos.
