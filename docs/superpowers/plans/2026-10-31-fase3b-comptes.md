# Fase 3B — Cuentas opcionales con progreso en servidor

Rama: `feat/fase3b-comptes`. Rúbrica de criterios: `.claude/flujo/rubrica.md` (R1-R12).

## Objetivo

Quien quiera se registra y guarda su progreso en el servidor para recuperarlo en otro dispositivo. Sin cuenta el juego funciona como hoy (localStorage) y, al crear la cuenta o entrar, el progreso local se fusiona con el del servidor.

## Fuera de alcance

Login social, recuperación de contraseña, verificación de email (ver D1), multijugador, IA y voz, ranking.

## Decisiones

| # | Decisión | Por qué |
|---|---|---|
| D0 | Opción A (confirmada por Edu): página `/compte/` con bloque propio `noempesquen/compte`, endpoints REST propios, cookie de WP | Catalán y WCAG completos; wp-admin nunca visible para el jugador |
| D1 | **Sin verificación de email ni recuperación de contraseña en 3B** (a confirmar por Edu). El email solo es el identificador de entrada. La pantalla de registro avisa: «si perds la contrasenya no es pot recuperar» | No enviamos ningún correo desde Dinahosting (SPF/DKIM sin comprobar). Se puede añadir en 3C |
| D2 | `user_login` = `nep_` + 12 caracteres aleatorios; el login busca por email con `get_user_by('email')` y firma con ese `user_login` | El email no aparece en el nombre de usuario |
| D3 | Rol `nep_jugador` sin capacidades (ni `read`). Datos: `user_meta` `nep_progres` (objeto `{id: 0-3}`) y `nep_consentiment` (`{versio, data}`) | Mínimo de datos (R6) |
| D4 | Nonce: tras login/registro la respuesta lleva `wp_create_nonce('wp_rest')` creado después de `wp_set_current_user`. Al recargar, el front lo pide a `admin-ajax.php?action=rest-nonce` (core, sin caché; wp-admin está excluido de Varnish). Nunca va incrustado en el HTML de la página | Sin nonce, la REST trata la cookie como anónima; el HTML de `/simulador/` puede cachearse |
| D5 | Borrado: `DELETE /compte` con contraseña. Destruye sesiones (`WP_Session_Tokens::destroy_all`), borra metas `nep_*` y usa `wp_delete_user` (o `wpmu_delete_user` en multisite) | R7 |
| D6 | Exportación: endpoint `GET /compte/exporta` más exporter y eraser nativos de WP (`wp_privacy_personal_data_exporters` / `_erasers`) | R8 |
| D7 | Límite de intentos con transients `nep_rl_*` y hash salado (`nep_sal_dia`), como en `/resultat`. Mensajes genéricos: login fallido, email duplicado o contraseña floja no distinguen casos sensibles | R9 |
| D8 | El progreso se envía con `credentials: 'same-origin'` y `X-WP-Nonce` a rutas propias; `enviaResultat` (estadísticas) sigue anónimo con `credentials: 'omit'` | R6, R10 |
| D9 | Fusión del progreso = máximo de estrellas por misión, función pura `fusionaProgres` | R5 |

## Tareas

| # | Tarea | Hecho cuando | Ficheros principales |
|---|---|---|---|
| T1 | Rol `nep_jugador`, `NEP_DB_VERSION` → `'4'`, bloqueo de wp-admin y barra de admin para el rol, limpieza de rol y metas en `uninstall.php` (con multisite) | PHPUnit de integración: el rol existe, no entra a wp-admin, uninstall lo limpia | `includes/capacitats.php`, `noempesquen-core.php`, `uninstall.php`, `tests/php/integracio-comptes.php` |
| T2 | Funciones puras: validar email y contraseña (mín. 10), sanear progreso contra misiones publicadas, fusión | PHPUnit + Vitest (`fusionaProgres`) en verde | `includes/comptes-nucli.php`, `SIM/nucli/sincro.js` (+ tests) |
| T3 | Endpoints REST: `registre`, `entra`, `surt`, `GET/PUT progres`, `exporta`, `DELETE compte`; límite de intentos; consentimiento con versión; cabeceras `no-store` | R2, R4, R5, R7, R9 con PHPUnit de integración (400 sin casilla, 429 al exceder, borrado completo) | `includes/comptes.php` |
| T4 | Exporter y eraser nativos de privacidad | Herramientas de privacidad de WP exportan y borran lo nuestro | `includes/comptes-privacitat.php` |
| T5 | Bloque `noempesquen/compte` (formularios de registro y login, panel de cuenta con exportar y borrar), página `/compte/`, enlace en el header, texto de privacidad en catalán | e2e + axe sin violaciones serias (R11); texto pasado por `humanizer-es` | `src/blocks/compte/*`, `themes/noempesquen/parts/header.html`, README |
| T6 | Integración en el simulador: al montar pide el nonce y el estado, fusiona y hace PUT; `onAcaba` sincroniza si hay sesión; sin sesión nada cambia; aviso de «has iniciat sessió» accesible | R1, R4, R5 con e2e (con y sin cuenta, recarga de `/simulador/`) | `SIM/render.php`, `SIM/simulador/App.js`, `SIM/simulador/sincro-compte.js` |
| T7 | Docs: `decisions.md` (sustituye «sense comptes»), comentarios de `rest.php` y `estadistiques.js` sobre datos personales, `estat-del-projecte.md`, `uninstall` multisite probado | Documentos coherentes (R10) | `docs/*`, `includes/rest.php` |
| T8 | Verificación final: lint, test:unit, PHPUnit, build, Playwright completo, revisión de rama (`reviewer` + `security-reviewer`) | R12 con salida real | — |

Orden: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. T4 y T5 pueden ir en paralelo tras T3. Son 8 tareas y más de 8 ficheros: se ejecuta con `orquestar`.

## Riesgos y comprobaciones

- **Nonce tras login en la misma petición**: la documentación oficial no lo cubre. Primera prueba de T3: login y `PUT progres` con el nonce devuelto, sin recargar.
- **`admin-ajax.php?action=rest-nonce` en producción**: comprobar que Varnish no lo cachea y que Dinahosting no lo bloquea. Plan B: endpoint propio `GET /compte/nonce` que valide la cookie con `wp_validate_auth_cookie`.
- **IP detrás de Varnish**: Apache ya registra la IP real del cliente (comprobado en el cierre del despliegue); el límite por IP funciona.
- **Enumeración de emails**: sin verificación de email el registro con un email existente no puede ser indistinguible; se compensa con límite de intentos y mensaje genérico. Aceptado.
- **Dispositivo compartido**: al cerrar sesión no se borra el localStorage (solo contiene estrellas); documentarlo en la página de cuenta.
- **Multisite**: `uninstall.php` y `wpmu_delete_user` sin probar; entra en T1 y T3.
- **Estadísticas**: no se toca `nep_resultats`; revisar en T8 que ningún envío anónimo lleva cookie ni `user_id`.
- **Privacidad**: la premisa «sin datos personales» de `rest.php:3-4` deja de ser cierta; actualizar comentarios y política.

## Pruebas de aceptación (resumen)

- Registro sin casilla de 14 años o sin consentimiento → 400.
- Login → recarga → el progreso sigue ahí.
- Progreso local de 2 misiones + cuenta con 1 misión distinta → quedan las 3, con el máximo en las repetidas.
- Borrado: el usuario, sus metas y sus sesiones desaparecen; `nep_resultats` queda intacta.
- Jugador logueado que abre `/wp-admin/` → redirigido; `/wp-json/wp/v2/users` sin datos.
