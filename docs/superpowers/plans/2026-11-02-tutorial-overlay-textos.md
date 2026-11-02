# Textos dels passos del tutorial (U5)

Per revisar (D7). Generat des de `missions/tutorial-pc.json` i `tutorial-mobil.json`; si hi ha canvis, el JSON mana.

Notes:
- `continua: boto` = botó «Entès». Els passos d'acció avancen amb l'esdeveniment real.
- Els passos amb àncora `pantalla` deixen fer clic a tot el PC (tancar i reobrir, o obrir un avís que potser ja ha marxat).
- No hi ha esdeveniment per tancar finestra, Enrere/Inici, centre de control, inspeccionar ni decidir: aquests passos són d'explicació.

## PC (Llissa)

| # | Pas | Àncora | Continua | Títol | Text |
|---|---|---|---|---|---|
| 1 | `benvinguda` | (centrat) | boto | Un ordinador de mentida | Aquest ordinador és de pràctica. Res del que facis aquí surt de la pantalla: pots tocar-ho tot sense por. |
| 2 | `escriptori` | `escriptori` | boto | L'escriptori | Això és l'escriptori, el fons de la pantalla. Les apps s'hi obren a sobre. |
| 3 | `barra` | `barra` | boto | La barra de tasques | A baix tens la barra de tasques. Hi ha les icones de les apps, la lupa, l'hora i els avisos. |
| 4 | `finestra` | `finestra-navegador` | boto | Una finestra | Cada app oberta surt en una finestra. Aquesta és la del Navegador, per veure webs i el correu. |
| 5 | `botons-finestra` | `botons-finestra` | boto | Els botons de la finestra | A dalt a la dreta de cada finestra hi ha tres botons. La ratlla l'amaga a la barra, el quadre la fa gran i la creu la tanca. |
| 6 | `tanca-obre` | `pantalla` | app.obre app=navegador | Tanca i torna a obrir | Prova-ho: tanca el Navegador amb la creu. Després torna'l a obrir amb la seva icona de la barra de tasques. |
| 7 | `avis` | `avis` | boto | Un avís | Quan una app et vol dir alguna cosa, surt un avís a baix a la dreta. Aquest te l'envia la Llissa, la teva guia. |
| 8 | `campana` | `rellotge` | boto | La campana | Els avisos se'n van sols al cap d'una estona. Si se t'escapa algun, el trobaràs aquí, a la campana. |
| 9 | `obre-avis` | `pantalla` | app.obre app=parla | Obre l'avís | Fes clic a l'avís de la Llissa per obrir-lo. Si ja ha marxat, obre la campana i fes-hi clic allà. |
| 10 | `parla` | `finestra-parla` | boto | Parla, el xat | Això és Parla, l'app de xat. Aquí la Llissa et dona pistes mentre jugues. |
| 11 | `respostes` | `parla-respostes` | boto | Respostes ràpides | Per contestar al xat, fes clic als botons de sota. Ara només hi ha «Ja ho tinc clar»: el faràs servir al final. |
| 12 | `correu-nou` | `pantalla` | app.obre app=navegador | Un correu nou | T'acaba d'arribar un correu. Fes clic a l'avís, o a la campana, i s'obrirà al Navegador. |
| 13 | `obre-correu` | `llista-correus` | missatge.obre app=posta id=c1 | La safata d'entrada | Aquí arriben els correus. Fes clic al de Premis Fantasia per llegir-lo. |
| 14 | `assumpte` | `correu-obert` | boto | L'assumpte | A dalt de tot hi ha l'assumpte, el tema del correu. Els falsos solen prometre premis o fer-te por. |
| 15 | `remitent` | `remitent` | boto | Qui t'escriu | Aquí veus qui t'envia el correu i des de quina adreça. Fixa-t'hi sempre: el nom es pot inventar, l'adreça costa més d'amagar. |
| 16 | `enllac` | `enllacos` | boto | Els enllaços | Els enllaços et porten a una altra web. Abans de fer-hi clic, passa-hi el ratolí per sobre: a baix del Navegador veuràs on porten de veritat. |
| 17 | `adreca` | `adreca` | boto | L'adreça de la web | Aquí veus a quina web ets. Ara és posta.cat, la de sempre. Si un enllaç et porta a una adreça estranya, no hi posis cap dada. |
| 18 | `lupa` | `lupa` | lupa.activa | La lupa | Fes clic a la lupa per activar-la. Amb la lupa encesa, cada clic serveix per marcar el que et sembla sospitós. |
| 19 | `indicis` | `remitent` | boto | Busca els indicis | Quan acabi la guia, fes clic a les parts del correu que no et quadrin, com el remitent. Cada indici fa pujar el comptador «Indicis». N'hi ha tres. |
| 20 | `decisio` | `parla-respostes` | boto | Decideix | Quan els tinguis, fes clic a «Ja ho tinc clar» per dir què en fas. Ara et toca a tu. |

Avisos (disparadors `pas.entra`):

- Pas `avis` → avís de parla «Llissa»: Hola! Sóc la Llissa. Això és un avís: fes-hi clic i t'obro el xat on parlarem tu i jo.
- Pas `correu-nou` → avís de posta «Premis Fantasia»: Enhorabona! Has guanyat un iot de luxe. Obre el correu per saber com reclamar el teu premi.

Senyals (reacció de la guia):

- `remitent` Un remitent absurd: Això mateix! Mira com ha pujat el comptador «Indicis».
- `premi` Un premi que no has demanat: Ben vist. Un altre indici al comptador.
- `enllac` Un enllaç cap a una web estranya: Molt bé. Quan els tinguis tots, fes clic a «Ja ho tinc clar», a sota del xat.

## Mòbil (Pirata Remei)

| # | Pas | Àncora | Continua | Títol | Text |
|---|---|---|---|---|---|
| 1 | `bloqueig` | (centrat) | boto | Un mòbil de mentida | Aquest mòbil és de pràctica: res del que facis surt d'aquí. Ja has passat la pantalla de bloqueig, la primera que veus en encendre'l. |
| 2 | `inici` | (centrat) | boto | La pantalla d'inici | Aquesta és la pantalla d'inici. Hi tens totes les apps: toca'n una per obrir-la. |
| 3 | `dock` | `dock` | boto | Les apps de sota | A baix de tot tens les apps que més faràs servir, sempre a mà. |
| 4 | `app-missatges` | `app-missatges` | boto | Missatges | Aquesta és Missatges. Aquí t'arriben els SMS, els missatges de text del mòbil. |
| 5 | `obre-parla` | `app-parla-mobil` | app.obre app=parla | Parla, el xat | Parla és l'app de xat. Toca-la per obrir-la: la Remei t'hi espera. |
| 6 | `parla` | `conversa` | boto | La teva guia | Aquí xerres amb la Pirata Remei. Mentre jugues, et dona pistes per aquest xat. |
| 7 | `respostes` | `parla-respostes` | boto | Respostes ràpides | Per contestar, toca els botons de sota. Ara només hi ha «Ja ho tinc clar»: el faràs servir al final. |
| 8 | `nav-enrere` | `nav-enrere` | boto | El botó Enrere | Aquest botó et torna a la pantalla d'abans. Dins d'una app, fa un pas enrere. |
| 9 | `nav-inici` | `nav-inici` | boto | El botó Inici | Aquest et porta a la pantalla d'inici des d'on siguis. L'app es queda oberta al darrere. |
| 10 | `banner` | `banner` | boto | Un avís | Quan t'arriba alguna cosa, surt un avís a dalt. Aquest és un SMS. Si el toques, t'obre l'app que avisa. |
| 11 | `centre-control` | (centrat) | boto | El centre de control | Els avisos marxen sols al cap d'una estona. Si se t'escapa algun, toca la barra de dalt de tot: s'obre el centre de control amb tots els avisos. |
| 12 | `missatges` | (centrat) | boto | Llegeix l'SMS | Quan acabi la guia, obre l'SMS de Premis Fantasia. Toca l'avís o ves a l'inici i obre Missatges. |
| 13 | `lupa` | `lupa` | boto | La lupa | Dins l'SMS, toca la lupa per encendre-la. Amb la lupa encesa, cada toc marca el que et sembla sospitós. |
| 14 | `remitent` | (centrat) | boto | Busca els indicis | Toca el nom de qui t'escriu i la frase del premi. Cada indici fa pujar el comptador «Indicis». N'hi ha dos. |
| 15 | `decisio` | `parla-respostes` | boto | Decideix | Quan els tinguis, torna a Parla i toca «Ja ho tinc clar» per dir què en fas. Ara et toca a tu. |

Avisos (disparadors `pas.entra`):

- Pas `obre-parla` → avís de parla «Remei»: Ei, sóc la Remei! Obre Parla i et faig de guia. Res del que veuràs aquí és de veritat.
- Pas `banner` → avís de missatges «Premis Fantasia»: Enhorabona! Has guanyat un iot de luxe. Obre el missatge per saber com reclamar el premi.

Senyals (reacció de la guia):

- `remitent` Un remitent absurd: Ben vist! Mira com ha pujat el comptador «Indicis». Encara en queda un.
- `premi` Un premi que no has demanat: Tots trobats. Quan ho tinguis clar, toca «Ja ho tinc clar», a sota del xat.
