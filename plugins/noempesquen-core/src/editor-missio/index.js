/**
 * Editor del guió d'una missió al panell (pantalla d'edició de `nep_missio`).
 *
 * Valida en viu el JSON amb les mateixes regles que el simulador
 * (`diagnostica` → `validaMissio`, mòduls purs del nucli). DOM sense React:
 * no carrega res del simulador dins del wp-admin.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { errorsGuio } from './diagnostic';
import { guioDesDePlantilla } from './plantilla';
import mon from '../../missions/mon.json';
import './style.scss';

const ESPERA_MS = 300;

// Darrer resultat pintat: si no canvia, no es repinta (el lector de pantalla
// tornaria a anunciar la regió viva).
let darrer = null;

function pinta( caixa, errors ) {
	const clau = JSON.stringify( errors );
	if ( clau === darrer ) {
		return;
	}
	darrer = clau;
	caixa.replaceChildren();
	caixa.classList.toggle( 'nep-guio-diagnostic--error', errors.length > 0 );
	const titol = document.createElement( 'p' );
	titol.className = 'nep-guio-diagnostic__titol';
	if ( ! errors.length ) {
		titol.textContent = __( 'Cap error', 'noempesquen' );
		caixa.append( titol );
		return;
	}
	titol.textContent = sprintf(
		/* translators: %d: nombre d'errors */
		_n(
			'El guió té %d error:',
			'El guió té %d errors:',
			errors.length,
			'noempesquen'
		),
		errors.length
	);
	const llista = document.createElement( 'ul' );
	errors.forEach( ( error ) => {
		const li = document.createElement( 'li' );
		li.textContent = error;
		llista.append( li );
	} );
	caixa.append( titol, llista );
}

function inicia() {
	const textarea = document.getElementById( 'nep-guio' );
	const caixa = document.getElementById( 'nep-guio-diagnostic' );
	if ( ! textarea || ! caixa ) {
		return;
	}
	const dispositiu = document.getElementById( 'nep-dispositiu' );
	const personatge = document.getElementById( 'nep-personatge' );
	const config = window.nepEditorMissio || {};

	let editor = null;
	if ( config.codeEditor && window.wp?.codeEditor ) {
		editor = window.wp.codeEditor.initialize(
			textarea,
			config.codeEditor
		).codemirror;
		editor
			.getInputField()
			.setAttribute( 'aria-labelledby', 'nep-guio-etiqueta' );
		editor
			.getInputField()
			.setAttribute( 'aria-describedby', 'nep-guio-diagnostic' );
	}

	const valida = () =>
		pinta(
			caixa,
			errorsGuio( editor ? editor.getValue() : textarea.value, {
				mon,
				dispositiu: dispositiu?.value,
				personatge: personatge?.value,
				idsExistents: config.idsExistents,
			} )
		);

	let temps = null;
	const programa = () => {
		clearTimeout( temps );
		temps = setTimeout( valida, ESPERA_MS );
	};

	if ( editor ) {
		editor.on( 'change', () => {
			editor.save();
			programa();
		} );
	} else {
		textarea.addEventListener( 'input', programa );
	}
	dispositiu?.addEventListener( 'change', programa );
	personatge?.addEventListener( 'change', programa );
	valida();

	iniciaPlantilla( {
		editor,
		textarea,
		dispositiu,
		personatge,
		config,
		valida,
	} );
}

/**
 * Botó «Nova missió des de plantilla»: omple el guió (no desa res) i valida.
 *
 * @param {Object}     opcions
 * @param {?Object}    opcions.editor     CodeMirror (null: textarea).
 * @param {Element}    opcions.textarea   Camp del guió.
 * @param {?Element}   opcions.dispositiu Selector del dispositiu.
 * @param {?Element}   opcions.personatge Selector del personatge.
 * @param {Object}     opcions.config     Dades de `window.nepEditorMissio`.
 * @param {() => void} opcions.valida     Pinta el diagnòstic ara.
 */
function iniciaPlantilla( {
	editor,
	textarea,
	dispositiu,
	personatge,
	config,
	valida,
} ) {
	const boto = document.getElementById( 'nep-guio-plantilla' );
	if ( ! boto ) {
		return;
	}
	const avis = document.getElementById( 'nep-guio-plantilla-avis' );
	boto.addEventListener( 'click', () => {
		const titol = document.getElementById( 'title' )?.value ?? '';
		const guio = guioDesDePlantilla( titol, [
			...( config.idsInclosos ?? [] ),
			...( config.idsExistents ?? [] ),
		] );
		if ( dispositiu ) {
			dispositiu.value = guio.dispositiu;
		}
		if ( personatge ) {
			personatge.value = guio.personatge;
		}
		const text = JSON.stringify( guio, null, '	' );
		if ( editor ) {
			editor.setValue( text );
			editor.save();
		} else {
			textarea.value = text;
		}
		valida();
		if ( avis ) {
			avis.textContent = sprintf(
				/* translators: %s: id del guió */
				__(
					'Guió omplert amb la plantilla i l’id «%s». Revisa’l i desa l’esborrany quan vulguis.',
					'noempesquen'
				),
				guio.id
			);
		}
		boto.closest( '.nep-guio-plantilla' )?.setAttribute( 'hidden', '' );
		( editor ?? textarea ).focus();
	} );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', inicia );
} else {
	inicia();
}
