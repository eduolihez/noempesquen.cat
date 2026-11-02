# Retards: `retard` → `retard_ms` (tall E, tasca E-T1)

Unitat real abans: `disparadors[].retard` en **segons de joc** (el motor compta `temps` en segons, un `TICK` per segon); `webs.*.avis.retard` ja era en **mil·lisegons** (`segonsRetard` arrodonia amunt). Conversió: disparadors ×1000, avís de web només canvi de nom. El motor programa amb `ceil(retard_ms / MS_TICK)`, així que el moment resultant és idèntic.

Canvi de comportament comú: cap avís programat surt abans de la fi de la intro + `MS_TRAS_INTRO` (1500 ms → 2 s de joc). Si el jugador salta la intro abans que surti el primer avís menys el marge, els retards no canvien; si s'hi queda més estona, tots els pendents s'endarrereixen el mateix (es conserva el ritme). Cap valor de contingut ha calgut ajustar: tots compleixen el marge d'`inici` i el mínim per nivell (4000 ms al nivell 1; 2500 ms als nivells 2-3, entre avisos del mateix `quan`).

| Missió | Nivell | Disparador | `quan` | Abans | Després | So |
| --- | --- | --- | --- | --- | --- | --- |
| llissa-01-factura | 1 | arriba-trampa | inici | `retard: 8` (s) | `retard_ms: 8000` | alerta |
| llissa-02-banc | 2 | arriba-trampa | inici | `retard: 8` | `retard_ms: 8000` | alerta |
| llissa-02-banc | 2 | arriba-codi | formulari.envia (acces) | `retard: 3` | `retard_ms: 3000` | missatge |
| llissa-04-suport | 3 | web `cuinaravui.cat` avís | (càrrega de la web) | `retard: 8000` (ms) | `retard_ms: 8000` | — (overlay, sense notificació) |
| remei-01-paquet | 1 | arriba-trampa | inici | `retard: 8` | `retard_ms: 8000` | alerta |
| remei-02-canviat | 2 | arriba-1 | inici | `retard: 8` | `retard_ms: 8000` | missatge |
| remei-02-canviat | 2 | arriba-2 | inici | `retard: 22` | `retard_ms: 22000` | — (només `mostra`) |
| remei-02-canviat | 2 | arriba-3 | inici | `retard: 38` | `retard_ms: 38000` | alerta |
| remei-04-codi | 2 | arriba-1 | inici | `retard: 8` | `retard_ms: 8000` | missatge |
| remei-04-codi | 2 | arriba-sms | inici | `retard: 18` | `retard_ms: 18000` | missatge |
| remei-04-codi | 2 | arriba-2 | inici | `retard: 30` | `retard_ms: 30000` | alerta |
| remei-05-comprador | 2 | arriba-0 | inici | `retard: 6` | `retard_ms: 6000` | missatge |
| remei-05-comprador | 2 | arriba-1 | inici | `retard: 20` | `retard_ms: 20000` | missatge |
| remei-05-comprador | 2 | arriba-2 | inici | `retard: 34` | `retard_ms: 34000` | alerta |
| remei-05-comprador | 2 | arriba-3 | inici | `retard: 46` | `retard_ms: 46000` | missatge |
| tutorial-pc | 1 | avis-guia | app.obre navegador | `retard: 6` | `retard_ms: 6000` | missatge |
| tutorial-pc | 1 | arriba-correu | app.obre parla (c1 visible) | `retard: 5` | `retard_ms: 5000` | alerta |
| tutorial-mobil | 1 | avis-guia | app.obre navegador | `retard: 6` | `retard_ms: 6000` | missatge |
| tutorial-mobil | 1 | arriba-sms | app.obre parla (s1 visible) | `retard: 5` | `retard_ms: 5000` | alerta |

Missions sense cap retard (sense canvis): llissa-03-inversio, llissa-05-actualitzacio, remei-03-sorteig, plantilla-missio.

`so: "alerta"` va als avisos que porten la trampa (el correu o SMS trampa, la petició de diners, la petició del codi, l'enllaç de cobrament i el premi fals dels tutorials). La resta continua sonant «missatge».
