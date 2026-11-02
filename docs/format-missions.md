# Format d'una missió

Cada missió és un fitxer JSON a `plugins/noempesquen-core/missions/`. El simulador les inclou al paquet (funciona sense connexió) i, si al panell hi ha missions publicades del tipus "Missió", l'API les fa servir en lloc de les incloses.

## Camps principals

| Camp | Tipus | Descripció |
|---|---|---|
| `id` | text | Identificador únic, p. ex. `llissa-01-factura` |
| `versio` | nombre | Versió del format (1) |
| `titol`, `resum` | text | Nom i descripció curta per al selector |
| `dispositiu` | `pc` \| `mobil` | Simulador on es juga |
| `app` | `correu` \| `missatges` | Aplicació simulada |
| `personatge` | `llissa` \| `remei` | Qui guia la missió |
| `nivell`, `durada_minuts` | nombre | Dificultat (1-3) i durada aproximada |
| `intro` | text[] | Diàlegs inicials del personatge, un per pantalla |
| `instruccions` | text | Recordatori breu de què cal fer |
| `missatges` | Missatge[] | Correus o SMS que apareixen a l'aplicació |
| `senyals` | Senyal[] | Indicis d'engany que es poden descobrir amb la lupa |
| `frases` | objecte | `normal`: reservat (la lupa ja no el mostra: la UI diu «no és un senyal» amb un xip); `esquer`: què diu el personatge si piques l'enllaç |
| `decisio` | objecte | Pregunta final i opcions |
| `tancament` | objecte | `aprenentatges` (text[]) i `consell` (text) per a la pantalla de resultat |

## Missatge

```json
{
  "id": "m1",
  "objectiu": true,
  "remitent": { "nom": "Llum Clara", "adreca": "avisos@exemple.com", "senyal": "remitent" },
  "assumpte": "Avís important",
  "assumpte_senyal": "urgencia",
  "hora": "09:14",
  "cos": [
    [ { "t": "Benvolgut client,", "senyal": "salutacio" } ],
    [ { "t": "Text normal. " }, { "enllac": { "text": "Paga ara", "url": "http://domini-fals.com" }, "senyal": "enllac" } ]
  ]
}
```

- `objectiu`: és el missatge trampa de la missió. Els altres fan de context (correus normals).
- `cos`: llista de paràgrafs; cada paràgraf és una llista de segments.
- Segment de text: `{ "t": "..." }`. Si porta `senyal`, és un indici que es pot trobar amb la lupa.
- Segment d'enllaç: `{ "enllac": { "text", "url" } }`. El text és el que es veu; `url` és on porta de veritat i es mostra a la barra d'estat en passar-hi el ratolí o el focus. Fer-hi clic fora del mode lupa és "picar l'ham".

## Senyal

```json
{ "id": "remitent", "titol": "Remitent estrany", "explicacio": "Per què és sospitós", "reaccio": "El que diu el personatge en trobar-lo" }
```

## Decisió

```json
{
  "pregunta": "Què fas?",
  "opcions": [
    { "id": "a", "text": "...", "valor": "correcta" | "parcial" | "incorrecta", "resposta": "Explicació de la conseqüència" }
  ]
}
```

## Puntuació

- 10 punts per senyal trobat.
- Decisió: correcta 50, parcial 20, incorrecta 0.
- Picar l'enllaç resta 20 (mínim 0).
- Estrelles: 3 a partir del 90 % del màxim, 2 a partir del 60 %, 1 la resta.

# Format v2

El simulador realista només juga missions amb `"versio": 2`. El camp `app` desapareix: la missió descriu les apps que hi surten. El validador és `SIM/nucli/valida.js` (`validaMissio`). Exemple complet: `plugins/noempesquen-core/missions/llissa-01-factura.json`. Les dades compartides (contactes, xats i correus de farciment) són a `plugins/noempesquen-core/missions/mon.json`.

Camps nous respecte de la v1: `rellotge` (hora inicial), `pistes` (llista d'ajudes), `apps`, `webs` i `disparadors`. Es mantenen `senyals`, `frases`, `decisio` i `tancament`; `frases.esquer` passa a `frases.pescat` i s'hi afegeix `frases.web_falsa`.

- `apps.posta.correus[]`: `id`, `objectiu`, `ocult` (no surt fins que un efecte `mostra` el mostra), `carpeta`, `llegit`, `data`, `remitent { nom, adreca, senyal? }`, `assumpte`, `assumpte_senyal?`, `cos` (segments com a la v1).
- `apps.missatges.missatges[]` (SMS, només al mòbil): `id`, `objectiu`, `ocult`, `hora`, `remitent { nom, contacte?, senyal? }`, `cos` (segments com a la v1). `remitent.contacte` és l'id d'un contacte de `mon.json`; amb ell el missatge es pot bloquejar, esborrar, respondre o reenviar.
- `apps.parla.xats[]` (xats de Parla afegits per la missió): `{ id, contacte?, nom?, missatges[] { id, de: "ells" o "jo", text, hora?, ocult? } }`. Un missatge `ocult` surt quan un efecte `mostra` (amb el `retard_ms` del disparador) el fa visible; el xat apareix a la llista en tenir el primer missatge visible. `contacte` és l'id d'un contacte de `mon.json` (si és de rol `desconegut`, el xat ofereix bloquejar); sense `nom`, es fa servir el del contacte. Si l'`id` coincideix amb un xat de `mon.json` (p. ex. `pau`), els missatges s'hi afegeixen al final. Un missatge pot tenir `senyal` (id d'un senyal de la missió): amb la lupa activa es pot inspeccionar com a Posta o Missatges. El xat pot tenir `senyal_avis` (senyal del banner «Aquest número no és als teus contactes»). Per avisar al mòbil, combina `mostra` amb `notifica` (`app: "parla"`). Als xats de contactes coneguts (no guia ni desconeguts) el camp de text és actiu: el text escrit només es veu a la interfície i s'emet `missatge.envia`.
- `senyals[]` poden dur `requereix: "<id>"` (id d'un element `ocult` o d'un disparador, p. ex. `web-falsa`). **Puntuació:** el màxim és `(senyals disponibles × 10) + 50`; un senyal amb `requereix` només hi compta si el jugador l'ha trobat o l'element ja s'ha mostrat (`mostra`) o el disparador ja s'ha executat. Així, qui decideix bé pel camí segur sense pistes ni pescat arriba a 3 estrelles sense haver d'entrar a la trampa; sense `requereix` (llissa-01, remei-01, paquet) res no canvia.
- `apps.revenda` (només mòbil; app de compravenda inventada): `{ anuncis[], xats[] }`, amb `xats` obligatori (llista).
  - `anuncis[]`: `{ id, titol, preu, il, descripcio }`. `id` únic; `titol` i `descripcio` són text; `preu` és un número >= 0; `il` és una il·lustració existent.
  - `xats[]`: `{ id, contacte, anunci, missatges[] }`. `id` únic; `contacte` és l'id d'un contacte de `mon.json` (de rol `desconegut`, el xat ofereix bloquejar); `anunci` és l'id d'un anunci d'`anuncis`; cal almenys un missatge.
  - `missatges[]`: `{ id, de: "ells" o "jo", ocult?, hora?, cos[] }`. `id` únic a tota l'app; `ocult` (booleà) surt quan un efecte `mostra` el fa visible, i el xat apareix en tenir el primer missatge visible. `cos` és una llista no buida de segments: `{ "t", "senyal"? }` o `{ "enllac": { "text", "url" } }` (aquí la url ha de ser `http(s)://`, no s'admet `cerca:`).
  - El text que escriu el jugador no surt del component: al motor només li arriben `contacte.bloqueja`, `missatge.envia { contacte }` i `enllac.obre`. Per avisar, combina `mostra` amb `notifica` (`app: "revenda"`, `xat`, `font: "mobil"`).
- `apps.navegador.inici`: URLs que s'obren en iniciar.
- `webs.<domini>`: `plantilla` (`posta`, `llum-clara`, `enviat`, `banc-solid`, `diari`, `sorteig`, `cobrament`, `inversio` o `article`), `variant` (`oficial` o `falsa`), `https`, `titol`, `domini_senyal?` i, si cal, `formulari { id, boto, camps[] { id, etiqueta, autoompli, senyal? } }`.
- Normalització de `www.`: el navegador cerca primer la web amb el host exacte i, si no hi és, la mateixa entrada sense `www.` (així `www.exemple.cat` obre la web declarada com `exemple.cat`; una missió pot declarar un `www.` a propòsit). Al filtre `url` d'un disparador passa igual: coincideix si és idèntica o si els hosts coincideixen un cop tret el `www.` (en aquest cas `url` és el host).
- `disparadors[]`: `{ id, quan: { esdeveniment, ...filtres }, retard_ms?, efectes[] }`. `retard_ms` és un enter ≥ 0 en **mil·lisegons** de joc (es compta en segons de joc arrodonint amunt: `8000` → 8 s) i només corre amb la partida en joc i sense pausa. El camp vell `retard` (segons) es rebutja: el validador demana «usa retard_ms». Vegeu «Ritme dels avisos». A `quan`, `visible: "<id>"` fa que el disparador només coincideixi si l'element (p. ex. un correu amb `ocult`) ja s'ha mostrat amb l'efecte `mostra`; si no, no es consumeix.

## Esdeveniments

| Esdeveniment | Dades |
| --- | --- |
| `inici` | |
| `app.obre` | `app` (en obrir una app; al mòbil no s'emet en desbloquejar; al PC tampoc s'emet en les obertures automàtiques del desbloqueig, només quan el jugador obre l'app) |
| `missatge.obre` | `app`, `id` |
| `enllac.obre` | `url` |
| `web.carrega` | `url` |
| `formulari.envia` | `url`, `formulari` |
| `codi.envia` | `url`, `formulari` (codi SMS d'un segon pas) |
| `pagament.fes` | `url`, `formulari` |
| `correu.marca` | `id`, `com`: `phishing`, `brossa` o `esborra` |
| `contacte.bloqueja` | `id` (contacte) |
| `missatge.esborra` | `app`, `id` |
| `missatge.reenvia` | `app`, `id`, `a` (id del xat de destí, p. ex. `familia`) |
| `missatge.respon` | `app`, `id` |
| `missatge.envia` | `contacte` (id del contacte; mai el text escrit) |
| `enllac.mantingut` | `url` (pulsació llarga o Maj+F10 sobre un enllaç) |
| `publicacio.denuncia` | `id` (publicació d'Ullada denunciada) |
| `codi.comparteix` | `contacte` (id del contacte a qui es dona el codi; mai el text escrit) |
| `telefon.truca` | `url` (el jugador prem «Truca ara» o el telèfon d'una web falsa) |
| `descarrega.fes` | `url`, `fitxer` (obre o executa el fitxer descarregat fictici; al filtre `quan`, `fitxer` és obligatori) |
| `avis.apareix` | `url` (l'avís d'una web `article` es mostra; un sol cop per web i partida) |
| `lupa.activa` | (sense dades) El jugador encén la lupa per primer cop a la partida; un sol cop per partida |

`telefon.truca`, `descarrega.fes` i `avis.apareix` no porten mai text escrit pel jugador. Al filtre `quan`, la seva `url` (host o URL, amb la mateixa normalització de `www.`) ha de ser una web `article` de la missió: amb `avis` per a `telefon.truca` i `avis.apareix`, i amb `avis.instal_la` o `barra` per a `descarrega.fes`.

`codi.comparteix` s'emet sense text: només quan el que ha tecleat el jugador coincideix amb un codi d'un SMS visible de `apps.missatges.missatges`. Limitació: no detecta codis trossejats (p. ex. «48 213 7») ni dits amb paraules («quatre-vuit…»); caldria una funció nova per detectar-los.

Si es bloqueja amb la casella «i esborra la conversa», s'emet `contacte.bloqueja` i després `missatge.esborra`.

## Publicacions d'Ullada

`apps.ullada.publicacions[]`: `{ id, autor, text, il, likes, cos? }` (`id` únic; `text`, `il` i `likes` obligatoris).

- `autor`: id d'un perfil de `mon.ullada.perfils` (es valida quan es passa el món al validador).
- `il`: il·lustració existent; `likes`: número.
- `cos` (opcional): llista de paràgrafs, com als correus; cada segment és `{ "t": "...", "senyal"? }` o `{ "enllac": { "text", "url" } }` (url `http(s)://` o `cerca:`). Els senyals i les URL es validen igual que a la resta d'`apps`.

La plantilla web `sorteig` («Sorteig del Barri») només té variant falsa (el validador rebutja qualsevol altra `variant`): dades opcionals `premi`, `premi_senyal`, `compte_enrere` i `formulari` (amb `esdeveniment: "pagament.fes"`).

## Plantilles només falses

`sorteig`, `cobrament` i `inversio` només tenen variant falsa (`PLANTILLES_SOLO_FALSES` a `valida.js`; el validador rebutja qualsevol altra `variant`). Cap lletra d'aquests formularis no surt del component.

- `cobrament` («Revenda Cobra»): obligatoris `import` (text, p. ex. `"120 €"`) i `formulari` amb `camps` (almenys un) i `esdeveniment` (habitualment `pagament.fes`). Opcionals: `concepte` (text sota l'import) i `ingres_senyal` (senyal del text «Introdueix les dades de la targeta per rebre l'ingrés»: cobrar no demana targeta). Exemple: `plugins/noempesquen-core/missions/remei-05-comprador.json`.
- `inversio` («Invest Rapid»): obligatoris `promesa` (títol) i `formulari` com a `cobrament`. Opcionals: `promesa_senyal`, `avatar { nom, inicials }`, `compte_enrere { text, senyal? }` (text fix, sense temporitzador viu), `testimonis[] { nom, text, senyal? }` i `domini_senyal`. Exemple: `plugins/noempesquen-core/missions/llissa-03-inversio.json`.
- `sorteig`: vegeu més amunt.

## Anunci patrocinat a El Diari del Barri

`webs.<host>.anunci` només és vàlid a la plantilla `diari` (en una altra, el validador dóna error). La portada hi pinta un anunci que el jugador pot denunciar.

- `id` (únic, també respecte de les publicacions d'Ullada), `etiqueta` (p. ex. «Contingut patrocinat»), `titol` i `avatar { nom, inicials }` són obligatoris. L'avatar són inicials, mai una foto.
- Opcionals: `etiqueta_senyal` (senyal de l'etiqueta), `boto_denuncia` (text del botó; per defecte «Informa d'aquest anunci») i `cos` (paràgrafs com a les publicacions d'Ullada, amb `senyal` i enllaços `http(s)://`).
- Denunciar-lo emet `publicacio.denuncia` amb l'`id` de l'anunci; el validador l'accepta com a publicació denunciable.

## Plantilla `article` (web de contingut amb avís o barra falsos)

Web neutra de contingut (receptes, el temps...) amb un logotip propi. Obligatoris: `nom_lloc`, `titol` i `seccions[]` (llista no buida de `{ titol, cos }` o `{ titol, llista }`, només un dels dos; `cos` són paràgrafs de segments i `llista` és una llista de segments `{ "t", "senyal"? }`, sense `enllac`). Opcional: `entradeta` (paràgrafs). `avis` i `barra` van a l'arrel de `webs.<host>` i **només** s'admeten en aquesta plantilla.

- `avis` (overlay fals a sobre de la pàgina, `role="alertdialog"`):
  - Obligatoris: `retard_ms` (enter ≥ 0, en **mil·lisegons**; el camp vell `retard` es rebutja), `titol`, `cos` (segments o paràgrafs), `telefon`, `etiquetaTelefon` i `contador` (text estàtic, p. ex. «Temps restant: 04:59»; no compta enrere, WCAG 2.2.2).
  - Opcionals: `senyal_telefon` (senyal del número; amb la lupa es pot inspeccionar), `reobre` (booleà: el botó «Tanca» no tanca i mostra «No s'ha pogut tancar») i `instal_la { fitxer, origen, text_boto, senyal_fitxer?, senyal_origen? }` (afegeix un botó que obre el diàleg de descàrrega ficticia).
  - `retard_ms`: es converteix a segons de joc arrodonint amunt (`8000` → 8 s; `1` → 1 s) i només compta mentre la pestanya és l'activa, la intro ha acabat i la partida no està en pausa. L'avís només es munta a la pestanya activa. `Esc` sempre el tanca (també amb `reobre`, perquè el jugador no quedi mai atrapat) i ja no torna a sortir en aquella web.
  - Quan l'avís es mostra, s'emet `avis.apareix { url }` un sol cop per web (és el moment de fer parlar la guia, no un retard des de l'`inici`). Si el jugador surt de la web abans que surti, el retard torna a començar; si ja havia sortit, en tornar-hi surt de seguida.
  - «Truca ara» o el número emeten `telefon.truca { url }`.
- `barra` (barra falsa d'actualització a dalt de la pàgina): obligatoris `text` (llista no buida de segments, amb `senyal` opcional i sense `enllac`), `boto`, `fitxer` i `origen`; opcionals `senyal_fitxer` i `senyal_origen`. El botó obre el diàleg de descàrrega ficticia; «Tanca la barra» l'amaga.
- **Tancat es queda tancat**: l'avís i la barra tancats es guarden a l'estat del motor (`tancats`, claus `host:avis` i `host:barra`, amb el host sense `www.`; acció `TANCA_WEB`), igual que `avisosVistos` per a `avis.apareix`. Sobreviuen a canviar de pestanya, navegar a una altra web i tornar-hi o recarregar; només `REINICIA` els buida. El diàleg de descàrrega no es guarda: en tornar a la web sempre és tancat. Navegar a una altra URL a la mateixa pestanya torna a muntar la web (estat local nou).
- Diàleg de descàrrega ficticia: mostra `fitxer` i `origen` (inspeccionables si porten senyal). «Obre» emet `descarrega.fes { url, fitxer }`; «Cancel·la» o `Esc` el tanquen sense emetre res. No es crea cap fitxer, `Blob` ni petició de xarxa.
- Cada disparador `descarrega.fes` porta `quan.fitxer`, i la parella `url`+`fitxer` ha de ser un fitxer declarat d'aquella web (`avis.instal_la.fitxer` o `barra.fitxer`). A l'inrevés, cada fitxer declarat necessita almenys un disparador `descarrega.fes` amb la seva parella.
- Els senyals que només es veuen al diàleg de descàrrega porten `requereix` amb l'id del disparador `descarrega.fes` (no hi ha cap esdeveniment en obrir el diàleg): així no compten al màxim si el jugador no l'obre.
- Exemples: `llissa-04-suport.json` (Cuina Avui, avís de «suport tècnic» de Suport Segur Digital amb `reobre` i `instal_la`) i `llissa-05-actualitzacio.json` (Temps Avui, barra d'actualització; la comprovació bona és «Quant a Brúixola» al menú del navegador).


## Efectes

| Efecte | Dades |
| --- | --- |
| `guia-diu` | `text` (literal) o `frase` (clau de `frases`, p. ex. `web_falsa`) |
| `notifica` | `app` (`missatges`, `parla`, `navegador`, `posta`, `enviat` o `revenda`), `titol`, `text`; `xat` (opcional, només amb `app: "parla"` o `"revenda"`: id d'un xat d'aquella app, que s'obre en tocar l'avís al mòbil; a Parla, per defecte el del guia); `font: "mobil"` (opcional) l'envia al mòbil vinculat i `app` ha de ser una app del mòbil |
| `mostra` | `id` |
| `pescat` | |
| `decideix` | `opcio` (id d'una opció de `decisio`) |

El validador exigeix: `versio` 2, senyals referenciats existents (a correus, xats i `webs`, incloent camps de formulari i `domini_senyal`), efectes i esdeveniments coneguts, `decideix` cap a opcions existents, plantilles de web registrades, almenys una opció correcta i almenys un efecte `pescat` (excepte als tutorials).

### Tutorials (`tutorial: true`)

Camp opcional booleà. Una missió amb `tutorial: true` ensenya a fer servir el sistema simulat i no puntua.

- **Validació**: `tutorial` ha de ser booleà (`tutorial invàlid`). Si és `true`, `decisio.opcions` ha de tenir **una sola opció** i amb `valor: "correcta"` (p. ex. «Ja ho tinc clar», sense penalització possible); `senyals` ha de ser una llista, que pot ser buida (si el guió fa servir la lupa, hi ha d'haver almenys un senyal referenciat); no cal cap efecte `pescat`. Les missions normals es validen igual que abans.
- **No puntua**: ni estrelles ni punts a la pantalla final («Ja estàs a punt» i, si n'hi ha, `tancament.consell`), ni estadístiques: el client no envia res a `POST /resultat` i el servidor rebutja un resultat d'un tutorial (400 `nep_missio_tutorial`).
- **Progrés**: un tutorial fet es desa al mateix mapa del progrés (`{ id: 1 }`, local i al compte). L'1 no són estrelles, només vol dir «fet»; així la fusió per màxim i el progrés antic (sense la clau = no fet) funcionen sense canvis.
- **Passos (`passos`)**: només vàlid amb `tutorial: true`; llista no buida. Cada pas té exactament `id` (únic, `[a-z0-9-]+`), `ancora` (una clau d'`ANCORES`, a `nucli/ancores.js`, o `null` per a una targeta centrada), `titol` (1-60 caràcters), `text` (1-280) i `continua`. Es rebutgen ids duplicats, àncores desconegudes, `continua` mal format, camps desconeguts i textos buits. `ANCORES`: `pantalla`, `escriptori`, `barra`, `inici`, `rellotge`, `lupa`, `app-navegador`, `app-parla`, `finestra-navegador`, `finestra-parla`, `botons-finestra`, `parla-xat`, `parla-respostes`, `avis`, `llista-correus`, `correu-obert`, `remitent`, `enllacos`, `adreca`, `decisio`, `bloqueig`, `dock`, `app-missatges`, `app-parla-mobil`, `banner`, `centre-control`, `nav-enrere`, `nav-inici`, `conversa` (la interfície les posa com a `data-tut`).

  Anclas (`data-tut`): si una clave coincide con varios elementos, el overlay elige la primera visible. `decisio` solo existe mientras la decisión está abierta (antes, el botón «Decidir» lleva `parla-respostes`). La ventana enfocada lleva además `data-tut-foc="true"` (`[data-tut="finestra-parla"][data-tut-foc]`) y su `botons-finestra` está dentro. `conversa` solo existe en móvil.
  - **`continua`**: `"boto"` (l'acció `PAS_SEGUENT` avança) o `{ "esdeveniment": "...", ...claus }` amb la mateixa semàntica que `quan` dels disparadors (`PAS_SEGUENT` no avança un pas d'esdeveniment). Un esdeveniment del jugador que hi coincideix avança com a màxim un pas.
  - **Estat**: `estat.pas` és l'índex del pas actual (comença a 0); `estat.pas === passos.length` vol dir acabat. `PAS_SALTA` acaba el tutorial.
  - **Esdeveniment `pas.entra`**: en entrar en un pas (el 0 en desbloquejar, i en cada avanç) el motor processa `{ esdeveniment: "pas.entra", pas: "<id>" }` contra els disparadors; així `quan: { "esdeveniment": "pas.entra", "pas": "x" }` pot fer `mostra`, `notifica`, `guia-diu`... Aquest esdeveniment sintètic no avança passos (no hi ha bucles). El `pas` d'un disparador ha d'existir.
  - **Salt**: `PAS_SALTA` aplica, en ordre, els `pas.entra` dels passos que quedaven perquè el correu, les notificacions, etc. existeixin (cada disparador només s'executa una vegada) i deixa `pas = passos.length`.
  - **Intro opcional**: amb `passos`, `intro` pot faltar o ser buida (la substitueix l'overlay); el motor arrenca amb `introAcabada = true` i no mostra `intro[0]` pel xat. Sense `passos`, `intro` continua sent obligatòria.
  - **`continua` d'esdeveniment**: ha de ser un esdeveniment que el jugador emet (de `ESDEVENIMENTS`); `inici` i `pas.entra` es rebutgen (el tutorial quedaria encallat; per això el pas 0 no pot esperar `inici`). Si hi ha `app`, ha de ser una app del dispositiu. Un disparador `pas.entra` exigeix `passos` i un `pas` (text) existent.
  - **Pas saltat**: `PAS_SALTA` no executa els efectes d'esdeveniments reals dels passos saltats; un disparador no ha de dependre d'accions prèvies del jugador.
  - **Pistes**: mentre `pas < passos.length` no hi ha pistes automàtiques per temps.

  ```json
  "passos": [
    { "id": "barra", "ancora": "barra", "titol": "La barra", "text": "Aquí tens les teves apps.", "continua": "boto" },
    { "id": "obre-navegador", "ancora": "app-navegador", "titol": "Obre el navegador", "text": "Fes clic a la icona.",
      "continua": { "esdeveniment": "app.obre", "app": "navegador" } }
  ],
  "disparadors": [
    { "id": "correu", "quan": { "esdeveniment": "pas.entra", "pas": "obre-navegador" },
      "efectes": [ { "tipus": "mostra", "id": "correu-benvinguda" } ] }
  ]
  ```

- **Selector**: els tutorials surten primer, al grup «Tutorial» (el del dispositiu en ús abans). La primera vegada (cap tutorial fet i cap missió jugada) es recomana el tutorial del dispositiu («Comença per aquí»); després ja no. No compten al resum d'estrelles. Un tutorial fet mostra «Fet». Sempre es pot jugar qualsevol missió sense fer el tutorial, i a la pausa hi ha «Salta el tutorial».

## Mons compartits (`mon.json`)

`missatges.fils[]`: converses de Missatges, `{ id, nom, missatges[] { de: `ella` o `jo`, text, hora } }`. Els contactes que poden ser remitents (`remei`, `farmacia`, `banc`, `numero_desconegut`) hi són definits; `remitent.contacte` ha de coincidir amb un d'ells.

## Ritme dels avisos

Constants a `nucli/temps.js`. Un «avís» és un disparador amb algun efecte `notifica` o `mostra`.

- **Res abans de la intro.** Cap avís programat des de l'`inici` (disparador d'`inici` amb `retard_ms`) surt mentre la intro no ha acabat; els d'altres esdeveniments (p. ex. els dels tutorials, que porten el jugador cap a la presentació) no s'hi esperen. En acabar-la (seguint-la o saltant-la), si el primer pendent sortiria abans de `fi de la intro + MS_TRAS_INTRO` (1500 ms, 2 s de joc), tots els pendents s'endarrereixen el mateix: es conserva el ritme entre avisos. Qui salta la intro de seguida veu els retards tal com són. L'avís de les webs `article` tampoc no compta temps durant la intro.
- **Avisos d'`inici`.** Un disparador d'`inici` que avisa ha de tenir `retard_ms ≥ MS_TRAS_INTRO`; si no, el validador el rebutja.
- **Ritme per nivell.** Entre avisos consecutius d'un mateix origen (mateix `quan`), ordenats per `retard_ms`, hi ha d'haver com a mínim `MS_MIN_AVISOS_NIVELL_1` (4000 ms) al nivell 1, que respira més, i `MS_MIN_AVISOS_NIVELL_2_3` (2500 ms) als nivells 2 i 3. Avisos d'orígens diferents no es comparen (depenen del que faci el jugador).
- **Avisos d'una mateixa escena.** Quan n'entren diversos alhora a la vista, la cua de toasts i banners els escalona `MS_ENTRE_AVISOS` (700 ms).
- **So.** `notifica` admet `so: "alerta"` per als avisos de risc (els que porten la trampa); sense `so` sona «missatge». El to sona quan l'avís entra de debò a la vista (toast o banner), no quan arriba a l'estat; si l'app de l'avís ja és oberta no hi ha toast ni so.
