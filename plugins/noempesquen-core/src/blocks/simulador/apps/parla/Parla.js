import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { respostesRapides } from '../../nucli/motor';
import { menysMoviment } from '../../sistemes/pc/moviment';
import { AvatarXat, LlistaXats } from './LlistaXats';
import { Conversa } from './Conversa';
import {
	agrupaPerDia,
	filtraPerNom,
	ordenaXats,
	parteixHora,
	properPas,
} from './xats';

const MS_ESCRIU = 600;
const ID_GUIA = 'guia';

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
 * @param {Object[]} xat Missatges del motor.
 * @return {{visibles:Object[], escriu:boolean}} Què es veu i si escriu.
 */
function useRevelacio( xat ) {
	const [ mostrats, setMostrats ] = useState( xat.length );
	const pas = properPas( xat, mostrats, ! menysMoviment() );

	useEffect( () => {
		if ( ! pas.escriu ) {
			return undefined;
		}
		const t = setTimeout(
			() => setMostrats( pas.mostrats + 1 ),
			MS_ESCRIU
		);
		return () => clearTimeout( t );
	}, [ pas.escriu, pas.mostrats ] );

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
} );

/* Hora a la llista de xats: l'hora si és d'avui; si no, el dia. */
function horaLlista( text ) {
	const { dia, hora } = parteixHora( text );
	return dia ? dia.charAt( 0 ).toUpperCase() + dia.slice( 1 ) : hora;
}

/**
 * Parla d'escriptori: llista de xats (el guia fixat a dalt i els xats de
 * farciment de mon.json) i la conversa oberta. Amb el guia es respon amb
 * respostes ràpides.
 */
export default function Parla() {
	const { missio, mon, estat, dispatch, hora, nomGuia, Avatar } = useJoc();
	const [ actiu, setActiu ] = useState( ID_GUIA );
	const [ cerca, setCerca ] = useState( '' );

	segella( estat.xat, hora );
	const { visibles, escriu } = useRevelacio( estat.xat );

	const nom =
		mon?.contactes?.find( ( c ) => c.id === missio.personatge )?.nom ??
		nomGuia;
	const noLlegits = estat.notificacions.filter(
		( n ) =>
			n.app === 'parla' && n.titol === missio.personatge && ! n.llegida
	).length;
	const farciment = useMemo( () => ordenaXats( mon?.parla?.xats ), [ mon ] );

	const obre = ( id ) => {
		setActiu( id );
		if ( id === ID_GUIA && noLlegits ) {
			dispatch( { tipus: 'NOTIFICACIONS_LLEGIDES', app: 'parla' } );
		}
	};

	const avatarGuia = ( mida ) => (
		<AvatarXat nom={ nom } mida={ mida } Avatar={ Avatar } />
	);
	const darrerGuia = visibles[ visibles.length - 1 ];
	const elements = [
		{
			id: ID_GUIA,
			nom,
			avatar: avatarGuia( 48 ),
			hora: darrerGuia ? segells.get( darrerGuia ) : '',
			darrer: darrerGuia && {
				text: darrerGuia.text,
				propi: darrerGuia.de === 'jo',
			},
			escriu,
			noLlegits,
			fixat: true,
		},
		...farciment.map( ( x ) => {
			const m = x.missatges?.[ x.missatges.length - 1 ];
			return {
				id: x.id,
				nom: x.nom,
				avatar: <AvatarXat nom={ x.nom } mida={ 48 } />,
				hora: m ? horaLlista( m.hora ) : '',
				darrer: m && { text: m.text, propi: m.de === 'jo' },
			};
		} ),
	];

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
			}
		: {
				nom,
				estatContacte: escriu
					? __( 'escrivint…', 'noempesquen' )
					: __( 'en línia', 'noempesquen' ),
				avatar: avatarGuia( 40 ),
				grups: [ { dia: '', missatges: visibles.map( missatgeGuia ) } ],
				escriu,
				respostes: escriu ? [] : respostesRapides( missio, estat ),
				placeholder: __( 'Tria una resposta', 'noempesquen' ),
			};

	return (
		<div className="nep-parla">
			<LlistaXats
				elements={ filtraPerNom( elements, cerca ) }
				actiu={ actiu }
				onObre={ obre }
				cerca={ cerca }
				onCerca={ setCerca }
			/>
			<Conversa
				key={ actiu }
				{ ...conversa }
				onResposta={ ( id ) => dispatch( { tipus: 'RESPOSTA', id } ) }
			/>
		</div>
	);
}
