import { createRef, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { Inspeccionable } from '../../ui/Inspeccionable';
import { CampSuggerit } from './CampSuggerit';
import { IconaCadenat } from './Marca';
import { datesEnviades } from './formulari';

const CURTS = [ 'caducitat', 'cvv' ];
const AMAGATS = [ 'cvv', 'pin' ];
const NUMERICS = [ 'numero', 'caducitat', 'cvv', 'pin' ];

function Processant() {
	return (
		<div className="nep-lc-processa" role="status">
			<svg
				className="nep-lc-processa__roda"
				viewBox="0 0 48 48"
				width="48"
				height="48"
				aria-hidden="true"
			>
				<circle cx="24" cy="24" r="19" />
			</svg>
			<p className="nep-lc-processa__titol">
				{ __( 'Processant el pagament…', 'noempesquen' ) }
			</p>
			<p>
				{ __(
					'No tanquis ni actualitzis aquesta pàgina.',
					'noempesquen'
				) }
			</p>
		</div>
	);
}

/**
 * Formulari de pagament de la web falsa. Cada camp és un <input> no
 * controlat: el que s'hi escriu no surt mai del camp. En enviar-lo, el
 * motor només rep `formulari.envia` amb { url, formulari } i els camps es
 * buiden i es desmunten.
 *
 * @param {Object}    props
 * @param {Object}    props.formulari Definició (id, boto, camps).
 * @param {string}    props.url       URL de la pàgina.
 * @param {?Function} props.onEnvia   Avisa que s'ha enviat.
 */
export function FormulariFals( { formulari, url, onEnvia } ) {
	const { emet, mon } = useJoc();
	const [ errors, setErrors ] = useState( [] );
	const [ processant, setProcessant ] = useState( false );
	const camps = formulari.camps ?? [];
	const refs = useMemo(
		() => camps.map( () => createRef() ),
		[ camps.length ] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const numero = camps.find( ( c ) => c.id === 'numero' )?.autoompli ?? '';
	const suggeriment = {
		titol: sprintf(
			/* translators: 1: titular, 2: quatre darreres xifres */
			__( '%1$s · targeta acabada en %2$s', 'noempesquen' ),
			mon?.jugador?.nom ?? 'Àlex Puig',
			numero.replace( /\D/g, '' ).slice( -4 )
		),
		detall: __( 'Omple aquest camp', 'noempesquen' ),
	};

	const omple = ( i ) => {
		const camp = camps[ i ];
		refs[ i ].current.value = camp.autoompli ?? '';
		setErrors( ( e ) => e.filter( ( id ) => id !== camp.id ) );
		const seguent = refs[ i + 1 ]?.current;
		if ( seguent ) {
			seguent.focus();
		}
	};

	const envia = ( e ) => {
		e.preventDefault();
		const buits = camps
			.filter( ( c, i ) => ! refs[ i ].current?.value.trim() )
			.map( ( c ) => c.id );
		if ( buits.length ) {
			setErrors( buits );
			refs[
				camps.findIndex( ( c ) => c.id === buits[ 0 ] )
			].current?.focus();
			return;
		}
		emet( 'formulari.envia', datesEnviades( { url, formulari } ) );
		refs.forEach( ( r ) => {
			if ( r.current ) {
				r.current.value = '';
			}
		} );
		setProcessant( true );
		onEnvia?.();
	};

	if ( processant ) {
		return <Processant />;
	}

	return (
		<form className="nep-lc-form" noValidate onSubmit={ envia }>
			<div className="nep-lc-form__camps">
				{ camps.map( ( c, i ) => (
					<CampSuggerit
						key={ c.id }
						id={ `nep-lc-${ formulari.id }-${ c.id }` }
						refInput={ refs[ i ] }
						etiqueta={
							<Inspeccionable
								text={ c.etiqueta }
								senyal={ c.senyal }
							/>
						}
						suggeriment={ c.autoompli ? suggeriment : null }
						onTria={ () => omple( i ) }
						onEscriu={ () =>
							setErrors( ( e ) =>
								e.filter( ( id ) => id !== c.id )
							)
						}
						error={
							errors.includes( c.id )
								? __( 'Omple aquest camp.', 'noempesquen' )
								: null
						}
						amaga={ AMAGATS.includes( c.id ) }
						inputMode={
							NUMERICS.includes( c.id ) ? 'numeric' : undefined
						}
						classe={ CURTS.includes( c.id ) ? 'is-curt' : '' }
					/>
				) ) }
			</div>
			<button type="submit" className="nep-lc-boto nep-lc-boto--pagar">
				{ formulari.boto }
			</button>
			<p className="nep-lc-form__segell">
				<IconaCadenat mida={ 16 } />
				{ __( 'Pagament segur i verificat', 'noempesquen' ) }
			</p>
		</form>
	);
}
