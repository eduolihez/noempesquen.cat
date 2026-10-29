# noempesquen.cat — guía para Claude

Simulador de estafas digitales para los Premis Wapps .cat 2026/27. WordPress (tema de bloques + plugin propio), bloque `noempesquen/simulador` con React de `@wordpress/element`.

## Antes de nada

1. Lee `docs/estat-del-projecte.md`: qué está hecho, qué toca después y la lista de pendientes.
2. El diseño vigente es `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`. Es la autoridad: si un plan o el código lo contradicen, manda el spec (o pregunta al usuario).
3. Los planes ejecutados están en `docs/superpowers/plans/`. Cada corte nuevo empieza con su propio plan ahí.

## Mapa del código

`SIM/` = `plugins/noempesquen-core/src/blocks/simulador/`

| Carpeta                              | Qué hay                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `SIM/nucli/`                         | Motor puro (sin JSX): `motor.js` (reductor), `disparadors.js` (eventos → efectos), `valida.js`, `missions.js`, `progres.js` |
| `SIM/simulador/`                     | Carcasa: pantalla completa, pausa, contexto `useJoc()`, consecuencia y resultado, aislamiento de foco                       |
| `SIM/sistemes/pc/`                   | Ordenador simulado: bloqueo, escritorio, barra de tareas, ventanas, notificaciones                                          |
| `SIM/apps/`                          | Apps del sistema (`navegador`, `parla`) y su registro `registre.js`                                                         |
| `SIM/webs/`                          | Webs que carga el navegador (`posta`, `llum-clara`) y su registro                                                           |
| `SIM/ui/`                            | Piezas comunes: `Inspeccionable`, `Cos`, iconos SVG                                                                         |
| `SIM/estils/`                        | Parciales SCSS, importados desde `SIM/style.scss`                                                                           |
| `SIM/app/`                           | **Legado v1**: solo sirve la misión del paquete (móvil). Se elimina en el corte 2                                           |
| `plugins/noempesquen-core/missions/` | Misiones JSON (formato v2 en `docs/format-missions.md`) y `mon.json` (mundo compartido)                                     |
| `tests/e2e/`                         | Playwright (proyectos `escriptori` y `mobil`)                                                                               |

## Comandos

```bash
npm run build          # compila el bloque (wp-env sirve build/ directamente)
npm run env:start      # WordPress en http://localhost:8888 (admin / password)
npm run test:unit      # Vitest (solo plugins/**/test/**/*.test.js)
npm run lint:js && npm run lint:css
npx playwright test    # e2e; necesita wp-env arrancado y la página /simulador/
```

Antes de decir que algo está listo: lint, test:unit, build y Playwright, con la salida real.

## Reglas que han costado revisiones (no repetirlas)

- **Windows no distingue mayúsculas en nombres de archivo**: nunca `Foo.js` y `foo.js` en la misma carpeta.
- **Los tests unitarios corren en Node sin DOM**: solo pueden importar módulos sin JSX. La lógica testeable va en módulos puros; el comportamiento de componentes se verifica con e2e.
- **`Esc` y menús**: todo menú, popover o diálogo registra su cierre con `useJoc().registraMenu( cierra )` (devuelve la función para desregistrar). `Esc` cierra primero el último menú y solo si no hay ninguno abre la pausa.
- **Formularios falsos**: lo que escribe el jugador nunca entra en el estado del motor, `localStorage`, consola ni red. El motor solo recibe `{ url, formulari }`.
- **Enlaces simulados**: nunca deben navegar el navegador real (click, clic central, menú contextual, arrastrar).
- **Sin marcas reales** (Windows, Gmail, WhatsApp, bancos...). Marcas inventadas: Posta, Parla, Llum Clara, Banc Sòlid, Envia't, Ullada, El Diari del Barri. Iconos SVG propios, nunca emojis.
- **WCAG 2.2 AA** también dentro del sistema simulado (contraste, foco visible, objetivos ≥ 24 px, axe en e2e sin violaciones serias).
- Archivos en **UTF-8 con LF**; revisa la codificación si editas con scripts.
- Textos del juego en **catalán**; identificadores en catalán como el código existente; commits en inglés (convencionales).
