# noempesquen.cat

Simulador interactiu per aprendre a detectar estafes digitals (phishing, SMS, malware...).
Projecte per als Premis Wapps .cat 2026/27.

## Estructura

| Carpeta | Contingut |
|---|---|
| `plugins/noempesquen-core/` | Plugin propi: tipus de contingut "Missió", API REST i bloc del simulador |
| `plugins/noempesquen-core/src/` | Codi font del bloc (React via `@wordpress/element`) |
| `themes/noempesquen/` | Tema de blocs propi (`theme.json`) |
| `tests/e2e/` | Proves Playwright (escriptori i mòbil) |
| `docs/` | Decisions i notes del projecte |

## Requisits (Windows)

- Node.js LTS (20 o superior)
- Docker Desktop en marxa
- Git

## Posada en marxa

```bash
npm install
npm run build
npm run env:start      # http://localhost:8888  (admin / password)
npm run start          # recompila en desar
```

Las páginas `/simulador/`, `/compte/` y las de `/ca/` las crea sola la migración de páginas al activar el plugin o en la primera carga tras subir el zip. No hace falta crearlas a mano. Si `/simulador/` da 404, ve a Ajustes > Enlaces permanentes y guarda sin cambiar nada. Detalle en `docs/despliegue-i18n.md`.

La pantalla de compte (alta, entrada, descàrrega i esborrat de dades) va a `/compte/` (`/ca/compte/` en catalán); el jugador hi arriba també si intenta obrir `/wp-admin/`.

La pantalla de compte envia correus (verificació i recuperació de contrasenya) des de `no-reply@<domini>`; es pot canviar amb el filtre `nep_correu_remitent`. Perquè no acabin a la carpeta de brossa, el domini ha de tenir SPF, DKIM i DMARC (per començar, DMARC amb `p=none`).

Aturar: `npm run env:stop` · Esborrar l'entorn: `npm run env:clean`

## Idiomas (ES en raíz, CA en `/ca/`)

El idioma sale de la URL. Español en `/`, catalán en `/ca/`. Guía completa: `docs/i18n-tema.md` (tema) y `docs/despliegue-i18n.md` (despliegue, SEO, rollback). Formato de las misiones por idioma: `docs/format-missions.md`.

| Comando | Qué hace |
|---|---|
| `npm run i18n:pot` | Regenera `languages/noempesquen.pot` desde PHP y JS (requiere `env:start`) |
| `npm run i18n:parts -- <area>` | Crea el esqueleto `languages/parts/es-<area>.po` (áreas: `apps`, `webs`, `resto`, `altres`) |
| `npm run i18n:merge` | Une los `parts/*.po` en `languages/noempesquen-es_ES.po` |
| `npm run i18n:json` | Genera los JSON de traducción de los scripts (`wp.i18n`) |
| `npm run i18n:mo` | Compila `languages/noempesquen-es_ES.mo` (sin `msgfmt`) |
| `npm run missions:valida` | Comprueba que cada misión `ca/` tiene pareja `es/` con la misma lógica |
| `npm run test:e2e:es` | Playwright con `NEP_LANG=es` |
| `npm run test:e2e:ca` | Playwright con `NEP_LANG=ca` |

Orden tras cambiar textos en español: `i18n:pot` → `i18n:merge` → `i18n:json` → `i18n:mo`. Commitea los `.po`, `.json` y `.mo`.

## Producció

- Hosting: Dinahosting (PHP 8.3, Apache, Varnish desactivat durant el desenvolupament)
- Es despleguen només `plugins/noempesquen-core/` (amb `build/`) i `themes/noempesquen/`
- `wp-config.php` és de només lectura (440); no es toca des del repositori
