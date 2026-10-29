# Decisions del projecte

- **Plataforma:** WordPress (requisit del tutor), tema de blocs i plugin propis, sense constructors.
- **Simulador:** bloc de Gutenberg amb React de WordPress; missions com a tipus de contingut amb guió JSON.
- **Personatges:** la Llissa (ordinador) i la Pirata Remei (mòbil).
- **Sense IA de moment:** el comprovador funcionarà amb regles i plantilles en català.
- **Sense comptes d'usuari:** el progrés es desa al navegador; només estadístiques agregades i anònimes al servidor.
- **Entorn local:** wp-env (Docker). Sense staging a Dinahosting.
- **Seguretat del servidor:** capçaleres a `.htaccess`, XML-RPC bloquejat, CSP en mode informe fins que el simulador sigui estable.
