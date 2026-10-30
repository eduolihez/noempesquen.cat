import { __, sprintf } from '@wordpress/i18n';
import { nomPila as nomPilaMon } from '../../nucli/jugador.js';
import { useJoc } from '../../simulador/context';
import { IconaCorrecte, IconaEscut, IconaMobil, IconaTargeta } from './Marca';

/* Moviments inventats, coherents amb el món: l'SMS de la compra de 24,90 €
 * amb la targeta acabada en 9010 i la factura de setembre de Llum Clara. */
const moviments = () => [
	[
		__( 'Dilluns, 11:20', 'noempesquen' ),
		__( 'Compra amb targeta ·· 9010 · Botiga Verda', 'noempesquen' ),
		'-24,90 €',
	],
	[
		__( "5 d'octubre", 'noempesquen' ),
		__( 'Rebut · Llum Clara Energia, SA', 'noempesquen' ),
		'-62,15 €',
	],
	[
		__( "2 d'octubre", 'noempesquen' ),
		__( 'Compra amb targeta ·· 9010 · Farmàcia del Barri', 'noempesquen' ),
		'-12,35 €',
	],
	[
		__( "1 d'octubre", 'noempesquen' ),
		__( 'Transferència rebuda · Nòmina', 'noempesquen' ),
		'+1.640,00 €',
	],
];

const consells = () => [
	[
		IconaEscut,
		__( 'Mai et demanarem contrasenyes', 'noempesquen' ),
		__(
			'Banc Sòlid no et demanarà mai la contrasenya ni la clau de la banca en línia per correu, SMS, missatge o telèfon.',
			'noempesquen'
		),
	],
	[
		IconaMobil,
		__( 'Els codis SMS són només teus', 'noempesquen' ),
		__(
			'El codi que reps per SMS serveix per confirmar una operació que has fet tu. No el diguis a ningú, tampoc a qui digui que és del banc.',
			'noempesquen'
		),
	],
	[
		IconaTargeta,
		__( 'Entra sempre per bancsolid.cat', 'noempesquen' ),
		__(
			"Escriu tu l'adreça o fes servir l'app. Si tens cap avís, el veuràs a l'Àrea de clients.",
			'noempesquen'
		),
	],
];

function Inici( { enllac, nomPila } ) {
	return (
		<>
			<section className="nep-bs-hero">
				<div className="nep-bs-amplada">
					<h1>
						{ __(
							'La banca de sempre, al costat de casa.',
							'noempesquen'
						) }
					</h1>
					<p>
						{ __(
							'Compte sense comissions, targeta de dèbit i atenció a la teva oficina del barri.',
							'noempesquen'
						) }
					</p>
					<a className="nep-bs-boto" { ...enllac( '/area-clients' ) }>
						{ sprintf(
							/* translators: %s: nom de pila */
							__(
								"Continua a l'Àrea de clients, %s",
								'noempesquen'
							),
							nomPila
						) }
					</a>
				</div>
			</section>
			<section
				className="nep-bs-amplada nep-bs-consells"
				aria-labelledby="nep-bs-consells-titol"
			>
				<h2 id="nep-bs-consells-titol">
					{ __( 'Banca segura', 'noempesquen' ) }
				</h2>
				<ul>
					{ consells().map( ( [ Icona, titol, text ] ) => (
						<li key={ titol } className="nep-bs-consell">
							<Icona mida={ 26 } />
							<h3>{ titol }</h3>
							<p>{ text }</p>
						</li>
					) ) }
				</ul>
			</section>
		</>
	);
}

function AreaClients( { missatge, nomPila } ) {
	return (
		<div className="nep-bs-amplada nep-bs-area">
			<h1>
				{ sprintf(
					/* translators: %s: nom de pila */
					__( 'Hola, %s', 'noempesquen' ),
					nomPila
				) }
			</h1>

			<section
				className="nep-bs-avisos"
				aria-labelledby="nep-bs-avisos-titol"
			>
				<IconaCorrecte mida={ 40 } />
				<div>
					<h2 id="nep-bs-avisos-titol">
						{ __( 'Avisos', 'noempesquen' ) }
					</h2>
					<p className="nep-bs-avisos__text">{ missatge }</p>
					<p>
						{ __(
							'No hi ha cap bloqueig ni cap verificació pendent.',
							'noempesquen'
						) }
					</p>
				</div>
			</section>

			<div className="nep-bs-resum">
				<section
					className="nep-bs-targeta-info"
					aria-labelledby="nep-bs-compte-titol"
				>
					<h2 id="nep-bs-compte-titol">
						{ __( 'Compte corrent', 'noempesquen' ) }
					</h2>
					<p className="nep-bs-xifra">2.348,62 €</p>
					<p className="nep-bs-suau">
						{ __(
							'Saldo disponible · compte acabat en 4821',
							'noempesquen'
						) }
					</p>
				</section>
				<section
					className="nep-bs-targeta-info"
					aria-labelledby="nep-bs-targeta-titol"
				>
					<h2 id="nep-bs-targeta-titol">
						{ __( 'Targeta de dèbit', 'noempesquen' ) }
					</h2>
					<p className="nep-bs-estat">
						<IconaCorrecte mida={ 18 } />
						{ __( 'Activa', 'noempesquen' ) }
					</p>
					<p className="nep-bs-suau">
						{ __( 'Acabada en 9010', 'noempesquen' ) }
					</p>
				</section>
			</div>

			<section
				className="nep-bs-moviments"
				aria-labelledby="nep-bs-moviments-titol"
			>
				<h2 id="nep-bs-moviments-titol">
					{ __( 'Últims moviments', 'noempesquen' ) }
				</h2>
				<table className="nep-bs-taula">
					<thead>
						<tr>
							<th scope="col">{ __( 'Data', 'noempesquen' ) }</th>
							<th scope="col">
								{ __( 'Concepte', 'noempesquen' ) }
							</th>
							<th scope="col" className="nep-bs-taula__import">
								{ __( 'Import', 'noempesquen' ) }
							</th>
						</tr>
					</thead>
					<tbody>
						{ moviments().map( ( [ data, concepte, import_ ] ) => (
							<tr key={ concepte + data }>
								<td>{ data }</td>
								<td>{ concepte }</td>
								<td
									className={ `nep-bs-taula__import${
										import_.startsWith( '+' )
											? ' is-entrada'
											: ''
									}` }
								>
									{ import_ }
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</section>

			<p className="nep-bs-nota">
				{ __(
					'Banc Sòlid no et demanarà mai la contrasenya ni el codi SMS per correu, SMS o telèfon.',
					'noempesquen'
				) }
			</p>
		</div>
	);
}

/**
 * Web oficial: inici públic i Àrea de clients amb la sessió d'Àlex oberta
 * (saldo, moviments i avisos sense res pendent). No hi ha cap formulari.
 *
 * @param {Object}   props
 * @param {string}   props.seccio Secció (vegeu seccioBanc).
 * @param {Object}   props.dades  Dades de la web (missatge).
 * @param {Function} props.enllac (camí) → propietats d'un enllaç intern.
 */
export function Oficial( { seccio, dades, enllac } ) {
	const { mon } = useJoc();
	const nomPila = nomPilaMon( mon );
	const missatge =
		typeof dades?.missatge === 'string' && dades.missatge.trim()
			? dades.missatge
			: __(
					'Cap avís pendent. El teu compte està actiu.',
					'noempesquen'
				);

	if ( seccio === 'area-clients' ) {
		return <AreaClients missatge={ missatge } nomPila={ nomPila } />;
	}
	return <Inici enllac={ enllac } nomPila={ nomPila } />;
}
