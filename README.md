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

Les proves e2e necessiten una pàgina `/simulador/` amb el bloc. Crea-la un cop, amb l'entorn en marxa:

```bash
npm run env:cli -- wp post create --post_type=page --post_title=Simulador --post_name=simulador --post_status=publish --post_content='<!-- wp:noempesquen/simulador {"align":"wide"} /-->'
```

La pantalla de compte (alta, entrada, descàrrega i esborrat de dades) va a `/compte/`; el jugador hi arriba també si intenta obrir `/wp-admin/`. Crea-la igual:

```bash
npm run env:cli -- wp post create --post_type=page --post_name=compte --post_title="El meu compte" --post_status=publish --post_content='<!-- wp:noempesquen/compte /-->'
```

Aturar: `npm run env:stop` · Esborrar l'entorn: `npm run env:clean`

## Producció

- Hosting: Dinahosting (PHP 8.3, Apache, Varnish desactivat durant el desenvolupament)
- Es despleguen només `plugins/noempesquen-core/` (amb `build/`) i `themes/noempesquen/`
- `wp-config.php` és de només lectura (440); no es toca des del repositori
