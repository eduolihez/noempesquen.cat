/**
 * Ajudes pures de Llum Clara (sense JSX).
 *
 * Privadesa: el que s'escriu als formularis falsos no surt mai del camp.
 * `datesEnviades` és l'única sortida cap al motor i només porta la URL i
 * l'id del formulari.
 */

/**
 * Dades de l'esdeveniment que emet el formulari (`formulari.envia`,
 * `codi.envia` o `pagament.fes`).
 *
 * @param {Object} form           Formulari enviat.
 * @param {string} form.url       URL de la pàgina.
 * @param {Object} form.formulari Definició del formulari ({ id, ... }).
 * @return {{url:string, formulari:string}} Dades sense cap valor escrit.
 */
export function datesEnviades( { url, formulari } ) {
	return { url, formulari: formulari.id };
}

export const ESDEVENIMENTS_FORMULARI = [
	'formulari.envia',
	'codi.envia',
	'pagament.fes',
];

/**
 * Esdeveniment que emet el formulari en enviar-se. Si el JSON no en declara
 * cap o en declara un de no permès, el segur per defecte: `formulari.envia`.
 *
 * @param {Object} formulari Definició del formulari.
 * @return {string} Nom de l'esdeveniment.
 */
export function esdevenimentDe( formulari ) {
	const ev = formulari?.esdeveniment;
	return ESDEVENIMENTS_FORMULARI.includes( ev ) ? ev : 'formulari.envia';
}

/* Compatibilitat: com es comportaven els ids de targeta abans de poder-ho
 * declarar al JSON. */
const PER_DEFECTE = {
	numero: { numeric: true },
	caducitat: { curt: true, numeric: true },
	cvv: { curt: true, amagat: true, numeric: true },
	pin: { amagat: true, numeric: true },
	codi: { curt: true, numeric: true, maxLength: 6, autocomplete: false },
};

/**
 * Opcions de presentació d'un camp: les que declara el JSON i, si no, les
 * de compatibilitat segons l'id. `autocomplete` indica si el navegador
 * simulat hi ofereix el suggeriment (el real sempre queda desactivat).
 *
 * @param {Object} camp Definició del camp ({ id, curt?, amagat?, ... }).
 * @return {{curt:boolean, amagat:boolean, numeric:boolean, maxLength:(number|undefined), autocomplete:boolean}} Opcions.
 */
export function opcionsCamp( camp ) {
	const base = PER_DEFECTE[ camp?.id ] ?? {};
	const tria = ( clau, defecte ) => {
		if ( typeof camp?.[ clau ] === 'boolean' ) {
			return camp[ clau ];
		}
		return base[ clau ] ?? defecte;
	};
	const max = camp?.maxLength ?? base.maxLength;
	return {
		curt: tria( 'curt', false ),
		amagat: tria( 'amagat', false ),
		numeric: tria( 'numeric', false ),
		maxLength: Number.isInteger( max ) && max > 0 ? max : undefined,
		autocomplete: tria( 'autocomplete', true ),
	};
}

/**
 * Textos del formulari que pot declarar el JSON de la web (`processant`,
 * `nota`). Si no hi són o no són text, els per defecte (els de pagament).
 *
 * @param {Object} formulari Definició del formulari.
 * @param {Object} defectes  { processant, nota } per defecte.
 * @return {{processant:string, nota:string}} Textos.
 */
export function textosFormulari( formulari, defectes ) {
	const tria = ( clau ) => {
		const v = formulari?.[ clau ];
		return typeof v === 'string' && v.trim() ? v : defectes[ clau ];
	};
	return { processant: tria( 'processant' ), nota: tria( 'nota' ) };
}

const dos = ( n ) => String( n ).padStart( 2, '0' );

/**
 * Compte enrere «HH:MM:SS» (mai negatiu).
 *
 * @param {number} segons Segons que queden.
 * @return {string} Text.
 */
export function compteEnrere( segons ) {
	const s = Math.max( 0, Math.floor( segons ) );
	return `${ dos( Math.floor( s / 3600 ) ) }:${ dos(
		Math.floor( ( s % 3600 ) / 60 )
	) }:${ dos( s % 60 ) }`;
}

/**
 * Import del text del botó («Paga 87,40 €» → «87,40 €»).
 *
 * @param {string} boto Text del botó.
 * @return {string} Import o ''.
 */
export function importDe( boto ) {
	return String( boto ?? '' ).match( /\d[\d.,]*\s?€/ )?.[ 0 ] ?? '';
}

/**
 * Paràmetre `ref` d'una URL.
 *
 * @param {string} url URL.
 * @return {string} Referència o ''.
 */
export function referencia( url ) {
	try {
		return new URL( url ).searchParams.get( 'ref' ) ?? '';
	} catch {
		return '';
	}
}

export const SECCIONS_OFICIALS = [
	'inici',
	'area-client',
	'tarifes',
	'ajuda',
	'avis-legal',
	'privacitat',
	'cookies',
	'accessibilitat',
];

/**
 * Secció de la web oficial segons el camí; si no existeix, l'inici.
 *
 * @param {string} url URL.
 * @return {string} Secció.
 */
export function seccioOficial( url ) {
	let cami = '';
	try {
		cami = new URL( url ).pathname.replace( /^\/+|\/+$/g, '' );
	} catch {
		return 'inici';
	}
	return SECCIONS_OFICIALS.includes( cami ) ? cami : 'inici';
}
