/**
 * Missions de prova per a l'overlay del tutorial (`guia-tutorial.spec.js`).
 * Són els tutorials inclosos amb uns `passos` propis. El spec les serveix
 * amb `page.route` sobre `noempesquen/v1/missions`: `combinaMissions` les
 * accepta (si són vàlides) i substitueixen la inclosa pel mateix id. No hi
 * ha cap mecanisme de producció nou. `guia-tutorial-fixture.test.js` comprova
 * que són vàlides (una remota invàlida es descartaria en silenci).
 */
const tutorialPc = require( '../../plugins/noempesquen-core/missions/tutorial-pc.json' );
const tutorialMobil = require( '../../plugins/noempesquen-core/missions/tutorial-mobil.json' );

const copia = ( m ) => JSON.parse( JSON.stringify( m ) );

/** PC: explicació centrada, acció a la icona del Navegador, explicació de la barra. */
function guiaPc() {
	return {
		...copia( tutorialPc ),
		passos: [
			{
				id: 'benvinguda',
				ancora: null,
				titol: 'Benvingut',
				text: 'Et mostrarem les parts de l’ordinador pas a pas.',
				continua: 'boto',
			},
			{
				id: 'obre-navegador',
				ancora: 'app-navegador',
				titol: 'Obre el Navegador',
				text: 'Fes clic a la icona del Navegador, a la barra de tasques.',
				continua: { esdeveniment: 'app.obre', app: 'navegador' },
			},
			{
				id: 'barra',
				ancora: 'barra',
				titol: 'La barra de tasques',
				text: 'Aquí tens les apps i el rellotge.',
				continua: 'boto',
			},
		],
	};
}

/** Mòbil: explicació centrada, acció a Parla, explicació del botó d'inici. */
function guiaMobil() {
	return {
		...copia( tutorialMobil ),
		passos: [
			{
				id: 'benvinguda',
				ancora: null,
				titol: 'Benvingut',
				text: 'Et mostrarem les parts del mòbil pas a pas.',
				continua: 'boto',
			},
			{
				id: 'obre-parla',
				ancora: 'app-parla-mobil',
				titol: 'Obre Parla',
				text: 'Toca la icona de Parla per obrir els xats.',
				continua: { esdeveniment: 'app.obre', app: 'parla' },
			},
			{
				id: 'inici',
				ancora: 'nav-inici',
				titol: 'Torna a l’inici',
				text: 'Amb aquest botó tornes a la pantalla d’inici.',
				continua: 'boto',
			},
		],
	};
}

module.exports = { guiaPc, guiaMobil };
