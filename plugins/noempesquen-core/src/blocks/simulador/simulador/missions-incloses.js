/**
 * Missions incloses al bundle, per idioma (`missions/<idioma>/`). Mateixos ids
 * i mateixa lògica als dos idiomes (`npm run missions:valida`).
 */
import caLlissa01 from '../../../../missions/ca/llissa-01-factura.json';
import caLlissa02 from '../../../../missions/ca/llissa-02-banc.json';
import caLlissa03 from '../../../../missions/ca/llissa-03-inversio.json';
import caLlissa04 from '../../../../missions/ca/llissa-04-suport.json';
import caLlissa05 from '../../../../missions/ca/llissa-05-actualitzacio.json';
import caMon from '../../../../missions/ca/mon.json';
import caRemei01 from '../../../../missions/ca/remei-01-paquet.json';
import caRemei02 from '../../../../missions/ca/remei-02-canviat.json';
import caRemei03 from '../../../../missions/ca/remei-03-sorteig.json';
import caRemei04 from '../../../../missions/ca/remei-04-codi.json';
import caRemei05 from '../../../../missions/ca/remei-05-comprador.json';
import caTutorialMobil from '../../../../missions/ca/tutorial-mobil.json';
import caTutorialPc from '../../../../missions/ca/tutorial-pc.json';
import esLlissa01 from '../../../../missions/es/llissa-01-factura.json';
import esLlissa02 from '../../../../missions/es/llissa-02-banc.json';
import esLlissa03 from '../../../../missions/es/llissa-03-inversio.json';
import esLlissa04 from '../../../../missions/es/llissa-04-suport.json';
import esLlissa05 from '../../../../missions/es/llissa-05-actualitzacio.json';
import esMon from '../../../../missions/es/mon.json';
import esRemei01 from '../../../../missions/es/remei-01-paquet.json';
import esRemei02 from '../../../../missions/es/remei-02-canviat.json';
import esRemei03 from '../../../../missions/es/remei-03-sorteig.json';
import esRemei04 from '../../../../missions/es/remei-04-codi.json';
import esRemei05 from '../../../../missions/es/remei-05-comprador.json';
import esTutorialMobil from '../../../../missions/es/tutorial-mobil.json';
import esTutorialPc from '../../../../missions/es/tutorial-pc.json';

export const CONJUNTS = {
	ca: {
		mon: caMon,
		missions: [
			caTutorialPc,
			caTutorialMobil,
			caLlissa01,
			caLlissa02,
			caLlissa03,
			caLlissa04,
			caLlissa05,
			caRemei01,
			caRemei02,
			caRemei03,
			caRemei04,
			caRemei05,
		],
	},
	es: {
		mon: esMon,
		missions: [
			esTutorialPc,
			esTutorialMobil,
			esLlissa01,
			esLlissa02,
			esLlissa03,
			esLlissa04,
			esLlissa05,
			esRemei01,
			esRemei02,
			esRemei03,
			esRemei04,
			esRemei05,
		],
	},
};
