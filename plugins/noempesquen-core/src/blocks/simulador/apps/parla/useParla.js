import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { MS_AVIS_PARLA, MS_ESCRIU } from '../../nucli/temps.js';
import { respostesRapides, visible } from '../../nucli/motor';
import { coincideixCodi, extreuCodis } from './codi';
import { menysMoviment } from '../../sistemes/pc/moviment';
import { AvatarXat } from './LlistaXats';
import { contacteDelXat } from './desconegut';
import { xatEscriptible, xatsVisibles } from './xatsMissio';
import {
	agrupaPerDia,
	filtraPerNom,
	ordenaXats,
	parteixHora,
	properPas,
} from './xats';

export const ID_GUIA = 'guia';

/*
 * Hora del rellotge del joc en què es va veure cada missatge del xat del
 * guia. Els missatges són objectes immutables de l'estat del motor (es
 * conserven entre estats), així que fan de clau; un reinici en crea de nous.
 */
const segells = new WeakMap();

function segella( xat, hora ) {
	xat.forEach( ( m ) => {
		if ( ! segells.has( m ) ) {
			segells.set( m, hora );
		}
	} );
}

/**
 * Missatges del guia visibles: els que hi havia en obrir Parla es mostren
 * de cop; cada missatge nou del guia va precedit de «escrivint…».
 *
 * @param {Object[]} xat    Missatges del motor.
 * @param {boolean}  aturat Cert en pausa (o demanant girar): no avança.
 * @return {{visibles:Object[], escriu:boolean}} Què es veu i si escriu.
 */
function useRevelacio( xat, aturat ) {
	const [ mostrats, setMostrats ] = useState( xat.length );
	const pas = properPas( xat, mostrats, ! menysMoviment() );

	// Reinici amb Parla muntada: el xat s'ha escurçat; es desa el recompte
	// nou (ajust durant el render, sense efecte) perquè no quedi enrere.
	if ( mostrats > xat.length ) {
		setMostrats( pas.mostrats );
	}

	useEffect( () => {
		if ( ! pas.escriu || aturat ) {
			return undefined;
		}
		const t = setTimeout(
			() => setMostrats( pas.mostrats + 1 ),
			MS_ESCRIU
		);
		return () => clearTimeout( t );
	}, [ pas.escriu, pas.mostrats, aturat ] );

	return { visibles: xat.slice( 0, pas.mostrats ), escriu: pas.escriu };
}

const missatgeGuia = ( m ) => ( {
	id: m.id,
	propi: m.de === 'jo',
	text: m.text,
	nota: m.nota,
	hora: segells.get( m ) ?? '',
} );

/* L'hora es queda sencera («ahir 18:40»): en surten el separador i l'hora. */
const missatgeFarciment = ( xatId ) => ( m, i ) => ( {
	id: `${ xatId }-${ i }`,
	propi: m.de === 'jo',
	text: m.text,
	hora: m.hora,
	senyal: m.senyal,
} );

/* Hora a la llista de xats: l'hora si és d'avui; si no, el dia. */
function horaLlista( text ) {
	const { dia, hora } = parteixHora( text );
	return dia ? dia.charAt( 0 ).toUpperCase() + dia.slice( 1 ) : hora;
}

/**
 * Estat i lògica de Parla, compartits per l'escriptori i el mòbil.
 *
 * @param {?string} xatInicial Id del xat obert al principi (null: cap, només al mòbil).
 * @return {Object} Llista filtrada, xat actiu, conversa i accions.
 */
export function useParla( xatInicial = ID_GUIA ) {
	const { missio, mon, estat, dispatch, emet, hora, nomGuia, Avatar } =
		useJoc();
	const [ actiu, setActiu ] = useState( xatInicial );
	const [ cerca, setCerca ] = useState( '' );
	// Contactes bloquejats: només ids, al motor (sobreviuen en tancar l'app).
	const bloquejats = useMemo(
		() => new Set( estat.bloquejats ?? [] ),
		[ estat.bloquejats ]
	);
	const [ avis, setAvis ] = useState( '' );
	// L'avís s'esborra en canviar de xat o passat un temps, perquè un segon
	// bloqueig es torni a anunciar.
	useEffect( () => {
		if ( ! avis ) {
			return undefined;
		}
		const t = setTimeout( () => setAvis( '' ), MS_AVIS_PARLA );
		return () => clearTimeout( t );
	}, [ avis ] );
	useEffect( () => setAvis( '' ), [ actiu ] );
	// Missatges escrits pel jugador: només estat local de la UI, mai al motor.
	const [ enviats, setEnviats ] = useState( {} );
	// Hora (del joc) en què es va veure cada missatge de missió sense `hora`.
	const horesMissio = useRef( new Map() );

	segella( estat.xat, hora );
	const { visibles, escriu } = useRevelacio( estat.xat, estat.pausa );

	const nom =
		mon?.contactes?.find( ( c ) => c.id === missio.personatge )?.nom ??
		nomGuia;
	const noLlegits = estat.notificacions.filter(
		( n ) =>
			n.app === 'parla' && n.titol === missio.personatge && ! n.llegida
	).length;
	const farciment = ordenaXats(
		xatsVisibles( estat, mon, missio ).map( ( x ) => ( {
			...x,
			missatges: [
				...x.missatges.map( ( m ) => {
					if ( ! m.missio || m.hora ) {
						return m;
					}
					if ( ! horesMissio.current.has( m.id ) ) {
						horesMissio.current.set( m.id, hora );
					}
					return { ...m, hora: horesMissio.current.get( m.id ) };
				} ),
				...( enviats[ x.id ] ?? [] ),
			],
		} ) )
	);

	const marcaLlegits = () => {
		if ( noLlegits ) {
			dispatch( { tipus: 'NOTIFICACIONS_LLEGIDES', app: 'parla' } );
		}
	};
	const obre = ( id ) => {
		setActiu( id );
		if ( id === ID_GUIA ) {
			marcaLlegits();
		}
	};

	const contactes = mon?.contactes;
	const contacteGuia =
		contactes?.find( ( c ) => c.id === missio.personatge ) ?? null;
	const bloqueja = ( contacte ) => {
		if ( ! contacte ) {
			return;
		}
		emet( 'contacte.bloqueja', { id: contacte.id } );
		setAvis( __( 'Has bloquejat aquest número', 'noempesquen' ) );
	};

	const avatarGuia = ( mida ) => (
		<AvatarXat nom={ nom } mida={ mida } Avatar={ Avatar } />
	);
	const avisBloquejat = __( 'Has bloquejat aquest número', 'noempesquen' );
	const darrerGuia = visibles[ visibles.length - 1 ];
	const elements = [
		{
			id: ID_GUIA,
			nom,
			avatar: avatarGuia( 48 ),
			hora: darrerGuia ? segells.get( darrerGuia ) : '',
			darrer: bloquejats.has( contacteGuia?.id )
				? { text: avisBloquejat, propi: false }
				: darrerGuia && {
						text: darrerGuia.text,
						propi: darrerGuia.de === 'jo',
					},
			escriu,
			noLlegits,
			fixat: true,
		},
		...farciment.map( ( x ) => {
			const m = x.missatges?.[ x.missatges.length - 1 ];
			const bloq = bloquejats.has( contacteDelXat( x, contactes )?.id );
			return {
				id: x.id,
				nom: x.nom,
				avatar: <AvatarXat nom={ x.nom } mida={ 48 } />,
				hora: m ? horaLlista( m.hora ) : '',
				darrer: bloq
					? { text: avisBloquejat, propi: false }
					: m && { text: m.text, propi: m.de === 'jo' },
			};
		} ),
	];

	const envia = ( xat, text ) => {
		const contacte = contacteDelXat( xat, contactes );
		if ( ! contacte || ! text.trim() ) {
			return;
		}
		setEnviats( ( e ) => ( {
			...e,
			[ xat.id ]: [
				...( e[ xat.id ] ?? [] ),
				{ de: 'jo', text: text.trim(), hora },
			],
		} ) );
		// Només l'id del contacte: el text no surt de la UI.
		emet( 'missatge.envia', { contacte: contacte.id } );
		// Els codis dels SMS visibles es comparen aquí, en local.
		const codis = extreuCodis(
			( missio?.apps?.missatges?.missatges ?? [] ).filter( ( m ) =>
				visible( estat, m )
			)
		);
		if ( codis.some( ( codi ) => coincideixCodi( text, codi ) ) ) {
			emet( 'codi.comparteix', { contacte: contacte.id } );
		}
	};

	const dadesDesconegut = ( contacte, senyalAvis ) => ( {
		contacte,
		senyalAvis,
		bloquejat: bloquejats.has( contacte?.id ),
		onBloqueja: () => bloqueja( contacte ),
	} );

	const xatObert = farciment.find( ( x ) => x.id === actiu );
	const conversa = xatObert
		? {
				nom: xatObert.nom,
				avatar: <AvatarXat nom={ xatObert.nom } mida={ 40 } />,
				grups: agrupaPerDia(
					( xatObert.missatges ?? [] ).map(
						missatgeFarciment( xatObert.id )
					)
				),
				respostes: [],
				placeholder: __( 'Escriu un missatge', 'noempesquen' ),
				onEnvia: xatEscriptible( xatObert, contactes, bloquejats )
					? ( text ) => envia( xatObert, text )
					: undefined,
				...dadesDesconegut(
					contacteDelXat( xatObert, contactes ),
					xatObert.senyalAvis
				),
			}
		: {
				nom,
				estatContacte: escriu
					? __( 'escrivint…', 'noempesquen' )
					: __( 'en línia', 'noempesquen' ),
				avatar: avatarGuia( 40 ),
				grups: [ { dia: '', missatges: visibles.map( missatgeGuia ) } ],
				escriu,
				respostes:
					escriu || bloquejats.has( contacteGuia?.id )
						? []
						: respostesRapides( missio, estat ),
				placeholder: __( 'Tria una resposta', 'noempesquen' ),
				...dadesDesconegut( contacteGuia ),
			};

	return {
		elements: filtraPerNom( elements, cerca ),
		actiu,
		obre,
		noLlegits,
		marcaLlegits,
		tanca: () => setActiu( null ),
		cerca,
		setCerca,
		conversa,
		avis,
		onResposta: ( id ) => dispatch( { tipus: 'RESPOSTA', id } ),
	};
}
