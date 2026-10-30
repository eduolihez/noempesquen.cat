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
| `frases` | objecte | `normal`: reaccions quan s'inspecciona una cosa que no és sospitosa; `esquer`: què diu el personatge si piques l'enllaç |
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
- `apps.parla.xats[]` (xats de Parla afegits per la missió): `{ id, contacte?, nom?, missatges[] { id, de: "ells" o "jo", text, hora?, ocult? } }`. Un missatge `ocult` surt quan un efecte `mostra` (amb el `retard` del disparador) el fa visible; el xat apareix a la llista en tenir el primer missatge visible. `contacte` és l'id d'un contacte de `mon.json` (si és de rol `desconegut`, el xat ofereix bloquejar); sense `nom`, es fa servir el del contacte. Si l'`id` coincideix amb un xat de `mon.json` (p. ex. `pau`), els missatges s'hi afegeixen al final. Un missatge pot tenir `senyal` (id d'un senyal de la missió): amb la lupa activa es pot inspeccionar com a Posta o Missatges. El xat pot tenir `senyal_avis` (senyal del banner «Aquest número no és als teus contactes»). Per avisar al mòbil, combina `mostra` amb `notifica` (`app: "parla"`). Als xats de contactes coneguts (no guia ni desconeguts) el camp de text és actiu: el text escrit només es veu a la interfície i s'emet `missatge.envia`.
- `senyals[]` poden dur `requereix: "<id>"` (id d'un element `ocult` o d'un disparador, p. ex. `web-falsa`). **Puntuació:** el màxim és `(senyals disponibles × 10) + 50`; un senyal amb `requereix` només hi compta si el jugador l'ha trobat o l'element ja s'ha mostrat (`mostra`) o el disparador ja s'ha executat. Així, qui decideix bé pel camí segur sense pistes ni pescat arriba a 3 estrelles sense haver d'entrar a la trampa; sense `requereix` (llissa-01, remei-01, paquet) res no canvia.
- `apps.navegador.inici`: URLs que s'obren en iniciar.
- `webs.<domini>`: `plantilla` (`posta`, `llum-clara`, `enviat`, `banc-solid`, `diari` o `sorteig`), `variant` (`oficial` o `falsa`), `https`, `titol`, `domini_senyal?` i, si cal, `formulari { id, boto, camps[] { id, etiqueta, autoompli, senyal? } }`.
- `disparadors[]`: `{ id, quan: { esdeveniment, ...filtres }, retard?, efectes[] }`. `retard` són segons de joc. A `quan`, `visible: "<id>"` fa que el disparador només coincideixi si l'element (p. ex. un correu amb `ocult`) ja s'ha mostrat amb l'efecte `mostra`; si no, no es consumeix.

## Esdeveniments

| Esdeveniment | Dades |
| --- | --- |
| `inici` | |
| `app.obre` | `app` (en obrir una app; al mòbil no s'emet en desbloquejar) |
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

`codi.comparteix` s'emet sense text: només quan el que ha tecleat el jugador coincideix amb un codi d'un SMS visible de `apps.missatges.missatges`. Limitació: no detecta codis trossejats (p. ex. «48 213 7») ni dits amb paraules («quatre-vuit…»); caldria una funció nova per detectar-los.

Si es bloqueja amb la casella «i esborra la conversa», s'emet `contacte.bloqueja` i després `missatge.esborra`.

## Publicacions d'Ullada

`apps.ullada.publicacions[]`: `{ id, autor, text, il, likes, cos? }` (`id` únic; `text`, `il` i `likes` obligatoris).

- `autor`: id d'un perfil de `mon.ullada.perfils` (es valida quan es passa el món al validador).
- `il`: il·lustració existent; `likes`: número.
- `cos` (opcional): llista de paràgrafs, com als correus; cada segment és `{ "t": "...", "senyal"? }` o `{ "enllac": { "text", "url" } }` (url `http(s)://` o `cerca:`). Els senyals i les URL es validen igual que a la resta d'`apps`.

La plantilla web `sorteig` («Sorteig del Barri») només té variant falsa (el validador rebutja qualsevol altra `variant`): dades opcionals `premi`, `premi_senyal`, `compte_enrere` i `formulari` (amb `esdeveniment: "pagament.fes"`).

## Efectes

| Efecte | Dades |
| --- | --- |
| `guia-diu` | `text` (literal) o `frase` (clau de `frases`, p. ex. `web_falsa`) |
| `notifica` | `app` (`missatges`, `parla`, `navegador`, `posta` o `enviat`), `titol`, `text`; `xat` (opcional, només amb `app: "parla"`: id del xat que s'obre en tocar l'avís al mòbil; per defecte el del guia); `font: "mobil"` (opcional) l'envia al mòbil vinculat i `app` ha de ser una app del mòbil |
| `mostra` | `id` |
| `pescat` | |
| `decideix` | `opcio` (id d'una opció de `decisio`) |

El validador exigeix: `versio` 2, senyals referenciats existents (a correus, xats i `webs`, incloent camps de formulari i `domini_senyal`), efectes i esdeveniments coneguts, `decideix` cap a opcions existents, plantilles de web registrades, almenys una opció correcta i almenys un efecte `pescat`.

## Mons compartits (`mon.json`)

`missatges.fils[]`: converses de Missatges, `{ id, nom, missatges[] { de: `ella` o `jo`, text, hora } }`. Els contactes que poden ser remitents (`remei`, `farmacia`, `banc`, `numero_desconegut`) hi són definits; `remitent.contacte` ha de coincidir amb un d'ells.
