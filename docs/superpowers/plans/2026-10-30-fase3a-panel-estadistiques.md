# Fase 3A — Panel de misiones y estadísticas agregadas

Rama: `feat/fase3a-panel-estadistiques`. Las cuentas de usuario (T4, T5, T6) quedan para la entrega 3B con su propio plan.

## Objetivo

Un administrador crea y valida misiones v2 desde el panel de WordPress, y el panel muestra estadísticas anónimas por misión.

## Criterios de hecho

- Crear, editar y probar una misión v2 en el panel. Al guardar se muestran los errores y no se puede publicar una misión inválida. Una misión creada así se juega en `/simulador/`.
- Por misión: partidas, resultado medio y decisión más elegida. Agregado, sin `user_id` ni IP, solo visible con la capacidad `nep_veu_estadistiques`. Celdas con menos de 10 partidas ocultas.
- Resumen público (N1, 2026-10-31): al terminar, el jugador ve en bandas qué opción eligió la mayoría (`GET /resultat/resum`). Solo partidas reales de la versión actual, n≥10 total y por decisión; nunca el panel ni datos demo. Ver `docs/decisions.md`.
- lint, test:unit, build y Playwright en verde con la salida real; PHPUnit mínimo en verde; WCAG 2.2 AA en las pantallas nuevas.

## Fuera de alcance

Cuentas, IA, simulador embebido en wp-admin, cron, editor visual.

## Decisiones tomadas (investigación)

- Validación en el servidor mínima en PHP; la completa es `validaMissio`/`diagnostica` en JS, mostrada en vivo en el editor. Fixtures JSON compartidos (válidos e inválidos) corren en Vitest y en PHPUnit para evitar deriva.
- Bloqueo de publicación: `rest_pre_insert_nep_missio` (editor de bloques) y `wp_insert_post_data` forzando borrador con aviso en transient (guardado clásico). `wp_slash` antes de `update_post_meta` con el JSON.
- Capacidades propias `nep_gestiona_missions` y `nep_veu_estadistiques`, concedidas al administrador en activación y en cada upgrade.
- Tabla de agregados con `dbDelta`, `db_version` comparado en `plugins_loaded`, UPSERT con `INSERT ... ON DUPLICATE KEY UPDATE`. Fecha por día. Hash del guion en la clave para no mezclar versiones.
- `POST /resultat` anónimo sin nonce ni cookies: valida misión publicada, estrellas 0-3 y decisión del conjunto de la misión; rate limit con hash salado y rotado diariamente en transient.

## Tareas

| # | Tarea | Hecho cuando |
|---|---|---|
| T0 | Actualizar `docs/decisions.md` (cambia «sense comptes»: cuentas llegan en 3B) y comprobar si el hosting cachea `/simulador/` y `/wp-json/` | decisions.md coherente; resultado de la comprobación anotado para 3B |
| T1 | Capacidades, activación/upgrade, `uninstall.php`, `db_version` | admin con acceso al CPT; desinstalar borra tablas, opciones y capacidades |
| T2 | Validación PHP al guardar + bloqueo de publicación + fixtures compartidos + PHPUnit mínimo en wp-env | misión inválida no se publica por REST ni por guardado clásico; fixtures pasan en Vitest y PHPUnit |
| T3 | Editor del guion (`wp.codeEditor`) con diagnóstico en vivo (`diagnostica`) y enlace «probar» | errores visibles mientras se edita; el enlace abre `/simulador/` con la misión |
| T7 | Tabla de agregados, `POST /resultat`, llamada desde `onAcaba` (no bloquea el resultado, un envío por partida), pantalla admin con umbral k≥10 | partida terminada suma una fila; panel muestra datos con la capacidad y los oculta con n<10 |

Orden: T0 → T1 → T2 → T3 → T7. Cada tarea lleva su e2e o test y la salida real de lint, test:unit y build.

## Riesgos

- `build/` debe viajar en el paquete de despliegue (no hay Node en el servidor); comprobar `.gitignore`.
- `valida.js` en un entry de wp-scripts: verificar que no importa JSX ni DOM.
- El orden de las misiones remotas nuevas es el de `menu_order` y van detrás de las incluidas.
