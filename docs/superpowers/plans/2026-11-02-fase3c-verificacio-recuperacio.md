# Fase 3C · verificación de email y recuperación de contraseña

Fecha: 2026-11-02. Continúa 3B (decisión D1 diferida). Spec vigente: `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`.

## Objetivo

Que un jugador pueda **verificar su correo** y **recuperar su contraseña** sin pasar por el flujo nativo de WordPress, sin enumerar cuentas y sin guardar nada sensible en claro.

## Criterios de hecho (rúbrica)

| # | Criterio | Cómo se comprueba |
|---|---|---|
| R1 | El alta envía un correo de verificación; la cuenta funciona sin verificar (no se bloquea el juego) | integración PHP + e2e con `pre_wp_mail` |
| R2 | El enlace de verificación marca `nep_email_verificat`, es de un solo uso y caduca a las 48 h | integración PHP |
| R3 | `POST /compte/recupera` responde siempre igual (200 genérico) exista o no el correo, esté o no verificado, y solo envía correo si es jugador verificado | integración PHP |
| R4 | `POST /compte/restableix` cambia la contraseña con token válido, destruye todas las sesiones y invalida el token; token caducado (1 h), usado o manipulado → 400 genérico | integración PHP |
| R5 | Tokens guardados solo como hash (`wp_hash`/`hash_hmac`), comparación con `hash_equals`, nunca en logs, consola ni respuestas REST | revisión + test |
| R6 | Límites con transients como en 3B (por IP y por email) en recupera, restableix y reenvío | integración PHP |
| R7 | El token sale de la URL del navegador al cargar `/compte/` (`history.replaceState`) y la página lleva `Referrer-Policy: no-referrer` | e2e |
| R8 | Textos en catalán; aviso «no es pot recuperar» sustituido; lista de datos actualizada (el correo ahora se usa para enviar mensajes) | revisión |
| R9 | WCAG 2.2 AA en los formularios nuevos (axe sin violaciones serias, foco, errores asociados) | e2e axe |
| R10 | lint:js, lint:css, test:unit, test:php, build y Playwright en verde con salida real | comandos |

Fuera de alcance: login social, 2FA, purga automática de cuentas sin verificar, cambio de correo, panel de jugadores en wp-admin.

## Decisiones

- **D1 Cuenta sin verificar sigue activa.** La verificación solo es requisito para recuperar contraseña. Evita frenar a los jugadores y el riesgo de correo en spam.
- **D2 Token `id.secreto`.** `id` = ID de usuario, `secreto` = 32 bytes aleatorios en hex. Se guarda `hash_hmac('sha256', secreto, wp_salt)` y la caducidad en user meta (`nep_token_verifica`, `nep_token_recupera`). Un solo token vivo por tipo; pedir otro invalida el anterior. `user_login` ya es aleatorio, así que exponer el ID no revela nada.
- **D3 El flujo nativo de WP sigue bloqueado** para jugadores (`nep_filtra_recuperacio`). Usamos endpoints propios.
- **D4 Respuesta anti-enumeración.** `recupera` siempre 200 con el mismo cuerpo y tiempo parecido (trabajo ficticio cuando no hay usuario). El alta con correo existente sigue como en 3B.
- **D5 Correo:** `wp_mail`, texto plano, catalán, sin pixeles ni enlaces de seguimiento. Remitente por filtro `nep_correu_remitent` (por defecto `no-reply@noempesquen.cat`). SPF y DKIM existen; falta DMARC (lo añade Edu en Dinahosting).
- **D6 Enlaces:** `/compte/?verifica=<token>` y `/compte/?restableix=<token>`. Si el bloque detecta el parámetro lo manda por POST y lo borra de la URL con `history.replaceState` antes de nada más.
- **D7 Consentimiento:** el cambio de texto no sube `NEP_VERSIO_CONSENTIMENT` (el propósito de los datos no cambia: el correo ya era el identificador). Se anota en `docs/decisions.md`.
- **D8 Reenvío** de verificación: `POST /compte/reenvia-verificacio` (logueado, límite 3 por hora).

## Tareas

| ID | Tarea | Ficheros | Hecho cuando |
|---|---|---|---|
| T01 | Núcleo puro: generación/parseo de tokens, hash, caducidad, validación de entrada | `includes/comptes-nucli.php`, `tests/php/ComptesNucliTest.php` | PHPUnit puro cubre R5 y caducidades |
| T02 | Correo y verificación: plantillas, envío en el alta, `POST /compte/verifica`, `POST /compte/reenvia-verificacio` | `includes/comptes.php`, nuevo `includes/comptes-correu.php`, `tests/php/integracio-comptes.php` | R1, R2, R6 |
| T03 | Recuperación: `POST /compte/recupera`, `POST /compte/restableix`, cierre de sesiones, límites | `includes/comptes.php`, `integracio-comptes.php` | R3, R4, R6 |
| T04 | Cliente y UI: métodos en `client.js`, pantallas «He oblidat la contrasenya», «Nova contrasenya», banner «Verifica el correu», lectura y borrado del token en URL, `textos.js` | `src/compte/client.js`, `src/blocks/compte/*`, tests Vitest | R7, R8, R9 |
| T05 | e2e: alta con verificación, recuperación completa, token reutilizado y caducado, axe | `tests/e2e/compte-recuperacio.spec.js` | R7, R9 |
| T06 | Docs y cierre: `decisions.md`, `estat-del-projecte.md`, README (DMARC y remitente) | `docs/*` | R8 |

Orden: T01 → T02 → T03 → T04 → T05 → T06. Un commit por tarea, mensajes convencionales en inglés. Revisión de rama única al final (reviewer + security-reviewer), una ronda de arreglos.

## Riesgos

- **Entregabilidad:** sin DMARC los correos pueden caer en spam. Mitigación: texto plano, remitente del propio dominio, DMARC `p=none` recomendado.
- **Token en URL:** puede quedar en historial o logs de acceso. Mitigación: TTL corto, un solo uso, `replaceState`, `Referrer-Policy`.
- **Enumeración por tiempo:** trabajo ficticio en la rama sin usuario, y respuesta idéntica.
- **Producción:** el despliegue y la prueba real los hace Edu (crear cuentas y contraseñas no lo hace Claude).
