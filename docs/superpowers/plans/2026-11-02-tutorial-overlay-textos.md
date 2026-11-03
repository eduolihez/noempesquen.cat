# Textos dels passos del tutorial (U5)

Per revisar (D7). Generat des de `missions/tutorial-pc.json` i `tutorial-mobil.json`; si no coincideixen, mana el JSON.

Notes:
- `continua: boto` = botó «Entès». Els passos d'acció avancen amb l'esdeveniment real (només és clicable el forat).
- Si el jugador ja ha encès la lupa o ja ha trobat un indici, aquell pas es dona per fet.
- L'àncora `decisio` assenyala «Ja ho tinc clar» fins que s'obre la decisió.

## PC (Llissa)

Resum: La Llissa t'ensenya pas a pas l'ordinador: finestres, avisos, el correu, la lupa i com decidir.

| # | Pas | Àncora | Continua | Títol | Text |
|---|---|---|---|---|---|
| 1 | `benvinguda` | (centrat) | boto | Un ordinador de pràctica | Aquest ordinador és de pràctica. Res del que facis aquí surt de la pantalla, així que pots tocar-ho tot. |
| 2 | `escriptori` | `escriptori` | boto | L'escriptori | Això és l'escriptori, el fons de la pantalla. Les apps s'hi obren a sobre. |
| 3 | `barra` | `barra` | boto | La barra de tasques | A baix tens la barra de tasques. Hi ha les icones de les apps, la lupa, l'hora i els avisos. |
| 4 | `parla` | `finestra-parla` | boto | Parla, el xat | Aquesta finestra és Parla, l'app de xat. Aquí la Llissa, la teva guia, et dona pistes mentre jugues. |
| 5 | `finestra` | `finestra-navegador` | boto | Una finestra | Cada app oberta surt en una finestra. Aquesta és la del Navegador, per veure webs i el correu. |
| 6 | `botons-finestra` | `botons-finestra` | boto | Els botons de la finestra | Cada finestra té tres botons a dalt a la dreta: Minimitza (la ratlla) l'amaga a la barra, Maximitza (el quadre) la fa gran i Tanca (la creu) la tanca. |
| 7 | `tanca` | `finestra-navegador` | finestra.tanca app=navegador | Tanca una finestra | Prova-ho: tanca el Navegador amb el botó Tanca, la creu de dalt a la dreta. Si fas servir el teclat: Tab per moure't, Esc per pausar. |
| 8 | `obre` | `app-navegador` | app.obre app=navegador | Obre una app | Ara torna'l a obrir: fes clic a la icona del Navegador, a la barra de tasques. |
| 9 | `avis` | `avis` | app.obre app=parla | Un avís | La Llissa t'ha enviat un avís a baix a la dreta. Fes-hi clic i passaràs a la finestra de Parla. |
| 10 | `respostes` | `parla-respostes` | boto | Respostes ràpides | Per contestar al xat, fes clic als botons de sota. Ara només hi ha «Ja ho tinc clar»: el faràs servir al final. |
| 11 | `correu-nou` | `avis` | app.obre app=navegador | Un correu nou | T'acaba d'arribar un correu. Fes clic a l'avís i s'obrirà al Navegador. |
| 12 | `campana` | `rellotge` | boto | La campana | Els avisos marxen sols al cap d'una estona. Si se t'escapa algun, el trobaràs a la campana, al costat de l'hora, a baix a la dreta. |
| 13 | `obre-correu` | `correu-primer` | missatge.obre app=posta id=c1 | La safata d'entrada | Aquí arriben els correus. Fes clic al de Premis Fantasia per llegir-lo. |
| 14 | `assumpte` | `correu-obert` | boto | L'assumpte | A dalt de tot hi ha l'assumpte, el tema del correu. Els falsos solen prometre premis o fer-te por. |
| 15 | `remitent` | `remitent` | boto | Qui t'escriu | Aquí veus qui t'envia el correu i des de quina adreça. El nom es pot inventar; l'adreça diu més. |
| 16 | `enllac` | `enllacos` | boto | Els enllaços | Els enllaços porten a una altra web. Si hi passes el ratolí per sobre, o hi arribes amb Tab, a baix del Navegador veuràs on porten de veritat. |
| 17 | `adreca` | `adreca` | boto | L'adreça de la web | Aquí veus a quina web ets. Ara és posta.cat, la de sempre. Si un enllaç et porta a una adreça estranya, no hi posis cap dada. |
| 18 | `lupa` | `lupa` | lupa.activa | La lupa | Fes clic a la lupa per activar-la. Amb la lupa encesa, cada clic marca el que et sembla sospitós. |
| 19 | `indici-remitent` | `remitent` | senyal.troba senyal=remitent | Primer indici: el remitent | Fes clic al remitent. Un premi que ve d'una adreça .xyz que no coneixes fa mala espina. |
| 20 | `indici-premi` | `enllacos` | senyal.troba senyal=premi | Segon indici: el premi | Ara fes clic a la frase del premi. Ningú regala un iot per un sorteig on no t'has apuntat. |
| 21 | `indici-enllac` | `enllacos` | senyal.troba senyal=enllac | Tercer indici: l'enllaç | Per acabar, fes clic a l'enllaç. Porta a premis-fantasia.xyz, una web que no és de ningú que coneguis. |
| 22 | `decisio` | `decisio` | decisio.pren | Decideix | Fes clic a «Ja ho tinc clar» i després a l'opció que surt, «Ja ho tinc clar: és un correu de mentida». A les missions, decidir bé dona més punts que trobar indicis; aquí no puntua. |

Avisos (disparadors `pas.entra`):

- Pas `avis` → avís de parla «Llissa»: Hola, sóc la Llissa. Això és un avís: fes-hi clic i t'obro el xat on parlarem tu i jo.
- Pas `correu-nou` → avís de posta «Premis Fantasia»: Enhorabona! Has guanyat un iot de luxe. Obre el correu per saber com reclamar el teu premi.

Senyals:

- `remitent` Un remitent absurd. Explicació: «Premis Fantasia» des d'una adreça .xyz que no coneixes. Mira sempre qui t'escriu abans de creure't res. Reacció: Això mateix. Mira com ha pujat el comptador «Indicis».
- `premi` Un premi que no has demanat. Explicació: Ningú regala un iot per un sorteig on no t'has apuntat. Un premi que no has demanat és una manera de fer-te picar. Reacció: Ben vist. Un altre indici al comptador.
- `enllac` Un enllaç cap a una web estranya. Explicació: L'enllaç porta a premis-fantasia.xyz, una web que no coneixes. No hi entris ni hi posis cap dada. Reacció: Molt bé, ja els tens tots.

Pistes:

- Fes clic a l'avís de la Llissa per anar a Parla. Si ha marxat, el trobaràs a la campana, a baix a la dreta.
- Fes clic a l'avís del correu de Premis Fantasia, o a la campana, per obrir Posta al Navegador.
- Obre el correu de Premis Fantasia, activa la lupa i fes clic al remitent, al premi i a l'enllaç.
- Quan ho tinguis clar, fes clic a «Ja ho tinc clar», a sota del xat.

Decisió: Ja ho tinc clar: és un correu de mentida i no en faig cas. → Ben fet. Quan decideixes, et dic com ha anat i després veus el resultat. A les missions hi haurà més opcions, i la que triïs és el que més compta a la puntuació.

Consell final: Si alguna cosa et fa pressa o sembla massa bona, para i mira-la amb la lupa.

## Mòbil (Pirata Remei)

Resum: La Pirata Remei t'ensenya pas a pas el mòbil: apps, botons, avisos, SMS, la lupa i com decidir.

| # | Pas | Àncora | Continua | Títol | Text |
|---|---|---|---|---|---|
| 1 | `bloqueig` | (centrat) | boto | Un mòbil de pràctica | Aquest mòbil és de pràctica: res del que facis surt d'aquí. Ja has passat la pantalla de bloqueig, la primera que veus en encendre'l. |
| 2 | `inici` | (centrat) | boto | La pantalla d'inici | Aquesta és la pantalla d'inici. Hi tens totes les apps: toca'n una o fes-hi clic per obrir-la. |
| 3 | `dock` | `dock` | app.obre app=navegador | Les apps de sota | A baix tens les apps que més faràs servir. Toca el Navegador o fes-hi clic. |
| 4 | `nav-enrere` | `nav-enrere` | nav.enrere | El botó Enrere | Aquest botó et torna a la pantalla d'abans. Toca'l o fes-hi clic. |
| 5 | `nav-inici` | `nav-inici` | nav.inici | El botó Inici | Aquest et porta a la pantalla d'inici des d'on siguis. Toca'l o fes-hi clic. |
| 6 | `app-missatges` | `app-missatges` | boto | Missatges | Aquesta és Missatges. Aquí t'arriben els SMS, els missatges de text del mòbil. |
| 7 | `parla` | `app-parla-mobil` | app.obre app=parla | Parla, el xat | Parla és l'app de xat. Toca-la o fes-hi clic: la Remei t'hi espera per fer-te de guia. |
| 8 | `respostes` | `parla-respostes` | boto | Respostes ràpides | Per contestar, toca els botons de sota o fes-hi clic. Ara només hi ha «Ja ho tinc clar»: el faràs servir al final. |
| 9 | `banner` | `banner` | app.obre app=missatges | Un avís | T'acaba d'arribar un SMS i surt un avís a dalt. Toca'l o fes-hi clic per obrir Missatges. |
| 10 | `missatges` | `llista-sms` | missatge.obre app=missatges id=s1 | Els teus SMS | Aquí tens els SMS. Toca el de Premis Fantasia o fes-hi clic per llegir-lo. |
| 11 | `lupa` | `lupa` | lupa.activa | La lupa | Toca la lupa o fes-hi clic per encendre-la. Amb la lupa encesa, cada toc o clic marca el que et sembla sospitós. |
| 12 | `indici-remitent` | `conversa` | senyal.troba senyal=remitent | Primer indici: el remitent | Toca el nom de qui t'escriu, a dalt, o fes-hi clic. Cap empresa de debò es diu «Premis Fantasia». |
| 13 | `indici-premi` | `conversa` | senyal.troba senyal=premi | Segon indici: el premi | Ara toca la frase del premi o fes-hi clic. Ningú regala un iot per un sorteig on no t'has apuntat. |
| 14 | `obre-centre` | `barra-estat` | centre.obre | El centre de control | La Remei t'ha escrit. Toca la barra de dalt de tot o fes-hi clic: s'obre el centre de control, amb tots els avisos. |
| 15 | `centre-control` | `centre-control` | app.obre app=parla | Tots els avisos | Aquí queden els avisos que se t'escapen. Toca el de la Remei o fes-hi clic per tornar a Parla. |
| 16 | `decisio` | `decisio` | decisio.pren | Decideix | Toca «Ja ho tinc clar» o fes-hi clic, i després l'opció que surt, «Ja ho tinc clar: és un SMS de mentida». A les missions, decidir bé dona més punts que trobar indicis; aquí no puntua. |

Avisos (disparadors `pas.entra`):

- Pas `parla` → avís de parla «Remei»: Ei, sóc la Remei. Obre Parla i et faig de guia. Res del que veuràs aquí és de veritat.
- Pas `banner` → avís de missatges «Premis Fantasia»: Enhorabona! Has guanyat un iot de luxe. Obre el missatge per saber com reclamar el premi.

Senyals:

- `remitent` Un remitent absurd. Explicació: Cap empresa de debò es diu «Premis Fantasia». Mira sempre qui t'escriu abans de creure't res. Reacció: Ben vist. Mira com ha pujat el comptador «Indicis».
- `premi` Un premi que no has demanat. Explicació: Ningú regala un iot per un sorteig on no t'has apuntat. Un premi que no has demanat és una manera de fer-te picar. Reacció: Tots trobats. Ara torna a Parla per decidir.

Pistes:

- Toca la icona de Parla, a la pantalla d'inici.
- Toca l'avís de l'SMS. Si ha marxat, toca la barra de dalt de tot i el trobaràs al centre de control.
- Obre l'SMS de Premis Fantasia, activa la lupa i toca el remitent i el premi.
- Quan ho tinguis clar, torna a Parla i toca «Ja ho tinc clar».

Decisió: Ja ho tinc clar: és un SMS de mentida i no en faig cas. → Ben fet. Quan decideixes, et dic com ha anat i després veus el resultat. A les missions hi haurà més opcions, i la que triïs és el que més compta a la puntuació.

Consell final: Si un missatge et fa pressa o sembla massa bo, para i mira'l amb la lupa.
