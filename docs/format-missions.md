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
