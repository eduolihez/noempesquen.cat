import { useId, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useJoc } from '../../simulador/context';

const APPS_INSTALLADES = [
	[ 'Navegador', '2.4.1' ],
	[ 'Missatges', '3.0.2' ],
	[ 'Parla', '1.8.0' ],
	[ 'Posta', '5.2.3' ],
	[ 'Banc Sòlid', '4.1.0' ],
	[ 'Ullada', '1.2.7' ],
	[ 'Galeria', '2.0.5' ],
];

/* Conmutador local (role=switch); l'estat és del component pare o local. */
function Commutador( { etiqueta, descripcio, marcat, onCanvia, desactivat } ) {
	const idDesc = useId();
	const idEtiqueta = useId();
	return (
		<div className="nep-ajustos__fila">
			<div className="nep-ajustos__fila-text">
				<span id={ idEtiqueta } className="nep-ajustos__fila-titol">
					{ etiqueta }
				</span>
				{ descripcio && (
					<span id={ idDesc } className="nep-ajustos__fila-desc">
						{ descripcio }
					</span>
				) }
			</div>
			<button
				type="button"
				role="switch"
				aria-checked={ marcat }
				aria-labelledby={ idEtiqueta }
				aria-describedby={ descripcio ? idDesc : undefined }
				disabled={ desactivat }
				className="nep-ajustos__commutador"
				onClick={ () => onCanvia( ! marcat ) }
			>
				<span
					className="nep-ajustos__commutador-pom"
					aria-hidden="true"
				/>
			</button>
		</div>
	);
}

function Dada( { etiqueta, valor } ) {
	return (
		<div className="nep-ajustos__fila">
			<div className="nep-ajustos__fila-text">
				<span className="nep-ajustos__fila-titol">{ etiqueta }</span>
				<span className="nep-ajustos__fila-desc">{ valor }</span>
			</div>
		</div>
	);
}

function Wifi() {
	const [ actiu, setActiu ] = useState( true );
	return (
		<>
			<Commutador
				etiqueta={ __( 'Wi-Fi', 'noempesquen' ) }
				marcat={ actiu }
				onCanvia={ setActiu }
			/>
			{ actiu && (
				<>
					<Dada
						etiqueta={ __( 'Xarxa de casa', 'noempesquen' ) }
						valor={ __(
							'Connectada · Senyal excel·lent',
							'noempesquen'
						) }
					/>
					<Dada
						etiqueta={ __( 'Seguretat', 'noempesquen' ) }
						valor={ __( 'WPA2', 'noempesquen' ) }
					/>
				</>
			) }
		</>
	);
}

function Pantalla() {
	const [ brillo, setBrillo ] = useState( 70 );
	const idBrillo = useId();
	return (
		<>
			<div className="nep-ajustos__fila nep-ajustos__fila--bloc">
				<label htmlFor={ idBrillo } className="nep-ajustos__fila-titol">
					{ __( 'Brillantor', 'noempesquen' ) }
				</label>
				<input
					id={ idBrillo }
					type="range"
					min="10"
					max="100"
					value={ brillo }
					className="nep-ajustos__rang"
					onChange={ ( e ) => setBrillo( Number( e.target.value ) ) }
				/>
			</div>
			<Commutador
				etiqueta={ __( 'Mode fosc', 'noempesquen' ) }
				descripcio={ __(
					"No disponible en aquesta versió d'Ajustos.",
					'noempesquen'
				) }
				marcat={ false }
				desactivat
				onCanvia={ () => {} }
			/>
		</>
	);
}

function So( { sons, onSons } ) {
	return (
		<Commutador
			etiqueta={ __( 'Sons de notificació', 'noempesquen' ) }
			descripcio={ __(
				'Reprodueix un so quan arriba una notificació.',
				'noempesquen'
			) }
			marcat={ sons }
			onCanvia={ onSons }
		/>
	);
}

function Aplicacions() {
	return (
		<ul className="nep-ajustos__llista-apps">
			{ APPS_INSTALLADES.map( ( [ nom, versio ] ) => (
				<li key={ nom } className="nep-ajustos__fila">
					<div className="nep-ajustos__fila-text">
						<span className="nep-ajustos__fila-titol">{ nom }</span>
						<span className="nep-ajustos__fila-desc">
							{ __( 'Versió', 'noempesquen' ) } { versio }
						</span>
					</div>
				</li>
			) ) }
		</ul>
	);
}

function Sobre() {
	const { mon } = useJoc();
	return (
		<>
			<Dada
				etiqueta={ __( 'Nom del dispositiu', 'noempesquen' ) }
				valor={ mon?.jugador?.nom ?? '' }
			/>
			<Dada
				etiqueta={ __( 'Model', 'noempesquen' ) }
				valor={ __( 'Mòbil Nova 5', 'noempesquen' ) }
			/>
			<Dada
				etiqueta={ __( 'Versió del sistema', 'noempesquen' ) }
				valor={ __( 'Nova OS 3.2', 'noempesquen' ) }
			/>
			<Dada
				etiqueta={ __( 'Emmagatzematge', 'noempesquen' ) }
				valor={ __( '38 GB usats de 128 GB', 'noempesquen' ) }
			/>
		</>
	);
}

function Apagar() {
	const { dispatch } = useJoc();
	return (
		<div className="nep-ajustos__apagar">
			<p>
				{ __(
					'Apagar el telèfon posa la partida en pausa.',
					'noempesquen'
				) }
			</p>
			<button
				type="button"
				className="nep-ajustos__perill"
				onClick={ () => dispatch( { tipus: 'PAUSA' } ) }
			>
				{ __( 'Apagar', 'noempesquen' ) }
			</button>
		</div>
	);
}

/* Contingut d'una subpantalla segons la vista. */
export function Subpantalla( { vista, sons, onSons } ) {
	switch ( vista ) {
		case 'wifi':
			return <Wifi />;
		case 'pantalla':
			return <Pantalla />;
		case 'so':
			return <So sons={ sons } onSons={ onSons } />;
		case 'aplicacions':
			return <Aplicacions />;
		case 'sobre':
			return <Sobre />;
		case 'apagar':
			return <Apagar />;
		default:
			return null;
	}
}
