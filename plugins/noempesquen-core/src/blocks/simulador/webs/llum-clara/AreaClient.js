import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';
import { CampSuggerit } from './CampSuggerit';
import { IconaCorrecte, IconaFactura } from './Marca';

/* Contrasenya inventada que «recorda» el navegador simulat (es veu amb punts). */
const CONTRASENYA_DESADA = 'clara-2026';

function Compte( { nom, missatge, onSurt } ) {
	const titol = useRef( null );
	useEffect( () => titol.current?.focus(), [] );
	const nomPila = nom.split( ' ' )[ 0 ];

	return (
		<div className="nep-lc-compte">
			<div className="nep-lc-compte__cap">
				<h1 ref={ titol } tabIndex={ -1 }>
					{ sprintf(
						/* translators: %s: nom de pila */
						__( 'Hola, %s', 'noempesquen' ),
						nomPila
					) }
				</h1>
				<button
					type="button"
					className="nep-lc-boto nep-lc-boto--fluix"
					onClick={ onSurt }
				>
					{ __( 'Surt', 'noempesquen' ) }
				</button>
			</div>

			<section
				className="nep-lc-estat"
				aria-label={ __( 'Estat dels pagaments', 'noempesquen' ) }
			>
				<IconaCorrecte mida={ 40 } />
				<div>
					<p className="nep-lc-estat__titol">{ missatge }</p>
					<p>
						{ __(
							'Tens els pagaments al dia. Cobrem les factures per domiciliació bancària.',
							'noempesquen'
						) }
					</p>
				</div>
			</section>

			<section className="nep-lc-factura">
				<h2>{ __( 'Última factura', 'noempesquen' ) }</h2>
				<div className="nep-lc-factura__fila">
					<IconaFactura mida={ 24 } />
					<span className="nep-lc-factura__nom">
						{ __( 'Factura de setembre de 2026', 'noempesquen' ) }
					</span>
					<span className="nep-lc-factura__import">62,15 €</span>
					<span className="nep-lc-factura__estat">
						{ __( "Pagada el 5 d'octubre", 'noempesquen' ) }
					</span>
				</div>
				<dl className="nep-lc-factura__dades">
					<div>
						<dt>{ __( 'Tarifa', 'noempesquen' ) }</dt>
						<dd>{ __( 'Clara 24 h · 4,6 kW', 'noempesquen' ) }</dd>
					</div>
					<div>
						<dt>{ __( 'Forma de pagament', 'noempesquen' ) }</dt>
						<dd>
							{ __(
								'Domiciliació · compte acabat en 4821',
								'noempesquen'
							) }
						</dd>
					</div>
					<div>
						<dt>{ __( 'Propera factura', 'noempesquen' ) }</dt>
						<dd>{ __( 'Cap al 6 de novembre', 'noempesquen' ) }</dd>
					</div>
				</dl>
			</section>

			<p className="nep-lc-nota">
				{ __(
					'Llum Clara no et demanarà mai les dades de la targeta ni el PIN per correu electrònic, SMS o telèfon.',
					'noempesquen'
				) }
			</p>
		</div>
	);
}

/**
 * Àrea de client de la web oficial: inici de sessió amb el suggeriment del
 * navegador i, després d'«Entra», el compte (sense cap factura pendent).
 * Les credencials no surten dels camps.
 *
 * @param {Object} props
 * @param {string} props.missatge Missatge de l'estat de pagaments.
 */
export function AreaClient( { missatge } ) {
	const { mon } = useJoc();
	const [ entrat, setEntrat ] = useState( false );
	const [ errors, setErrors ] = useState( [] );
	const correu = useRef( null );
	const clau = useRef( null );
	const nom = mon?.jugador?.nom ?? 'Àlex Puig';
	const adreca = mon?.jugador?.correu ?? 'alex.puig@posta.cat';

	const suggeriment = {
		titol: adreca,
		detall: __( 'Contrasenya desada per a llumclara.cat', 'noempesquen' ),
	};
	const omple = () => {
		correu.current.value = adreca;
		clau.current.value = CONTRASENYA_DESADA;
		setErrors( [] );
	};

	if ( entrat ) {
		return (
			<Compte
				nom={ nom }
				missatge={ missatge }
				onSurt={ () => setEntrat( false ) }
			/>
		);
	}

	const entra = ( e ) => {
		e.preventDefault();
		const buits = [
			[ 'correu', correu ],
			[ 'clau', clau ],
		].filter( ( [ , r ] ) => ! r.current.value.trim() );
		if ( buits.length ) {
			setErrors( buits.map( ( [ id ] ) => id ) );
			buits[ 0 ][ 1 ].current.focus();
			return;
		}
		correu.current.value = '';
		clau.current.value = '';
		setEntrat( true );
	};
	const error = ( id ) =>
		errors.includes( id )
			? __( 'Omple aquest camp.', 'noempesquen' )
			: null;

	return (
		<form className="nep-lc-login" noValidate onSubmit={ entra }>
			<h1>{ __( 'Àrea client', 'noempesquen' ) }</h1>
			<p className="nep-lc-login__intro">
				{ __(
					'Consulta les factures, els consums i el teu contracte.',
					'noempesquen'
				) }
			</p>
			<CampSuggerit
				id="nep-lc-login-correu"
				etiqueta={ __( 'Correu electrònic', 'noempesquen' ) }
				refInput={ correu }
				suggeriment={ suggeriment }
				onTria={ omple }
				onEscriu={ () => setErrors( [] ) }
				error={ error( 'correu' ) }
			/>
			<CampSuggerit
				id="nep-lc-login-clau"
				etiqueta={ __( 'Contrasenya', 'noempesquen' ) }
				refInput={ clau }
				suggeriment={ suggeriment }
				onTria={ omple }
				onEscriu={ () => setErrors( [] ) }
				error={ error( 'clau' ) }
				amaga
			/>
			<button type="submit" className="nep-lc-boto">
				{ __( 'Entra', 'noempesquen' ) }
			</button>
		</form>
	);
}
