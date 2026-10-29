# Decisions del projecte

- **Plataforma:** WordPress (requisit del tutor), tema de blocs i plugin propis, sense constructors.
- **Simulador:** bloc de Gutenberg amb React de WordPress; missions com a tipus de contingut amb guió JSON.
- **Personatges:** la Llissa (ordinador) i la Pirata Remei (mòbil).
- **Sense IA de moment:** el comprovador funcionarà amb regles i plantilles en català.
- **Sense comptes d'usuari:** el progrés es desa al navegador; només estadístiques agregades i anònimes al servidor.
- **Entorn local:** wp-env (Docker). Sense staging a Dinahosting.
- **Seguretat del servidor:** capçaleres a `.htaccess`, XML-RPC bloquejat, CSP en mode informe fins que el simulador sigui estable.
- **Simulador realista (2026-10-29):** ordinador i mòbil simulats a pantalla completa, amb apps de marques inventades i llibertat aparent. Disseny a `docs/superpowers/specs/2026-10-29-simulador-realista-design.md`; estat a `docs/estat-del-projecte.md`.
- **Ajuda integrada:** la guia és un contacte de Parla (notificacions i xat) i la lupa és una eina del sistema; no hi ha barres de joc a sobre.
- **Decisions dins del món:** denunciar, esborrar o bloquejar dins les apps compta igual que triar l'opció al xat. Obrir l'enllaç trampa no és «pescat»; ho és enviar dades o pagar.
- **El dispositiu és de l'Àlex Puig** (nom neutre); la Llissa i la Remei són contactes.
- **Missions v2:** només es juguen missions `versio: 2`; les remotes del CPT es combinen per `id` amb les incloses.
- **Per talls:** cada tall s'entrega jugable de principi a fi.
