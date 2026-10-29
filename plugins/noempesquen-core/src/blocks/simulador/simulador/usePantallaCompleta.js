import { useState, useEffect, useCallback, useRef } from '@wordpress/element';

const CLASSE_SCROLL = 'nep-so-bloqueja-scroll';

/*
 * Keyboard Lock (Chromium): amb Esc bloquejat, una pulsació curta arriba a la
 * pàgina (pausa o tanca menús) i mantenir-la premuda surt de pantalla completa.
 */
function bloquejaEsc() {
	try {
		window.navigator.keyboard?.lock?.( [ 'Escape' ] )?.catch( () => {} );
	} catch {
		// Sense Keyboard Lock: Esc surt de pantalla completa i en som avisats.
	}
}

function desbloquejaEsc() {
	try {
		window.navigator.keyboard?.unlock?.();
	} catch {
		// Res a desbloquejar.
	}
}

/**
 * Pantalla completa sobre l'element de `ref`, amb capa fixa de reserva.
 *
 * @param {Object}   ref      Ref de l'element arrel.
 * @param {Function} alSortir Es crida quan el navegador surt de pantalla completa
 *                            sense haver-ho demanat nosaltres (la capa fixa
 *                            continua tapant la pàgina).
 * @return {{entra:Function, surt:Function, actiu:boolean, fixa:boolean}} Control.
 */
export function usePantallaCompleta( ref, alSortir ) {
	const [ actiu, setActiu ] = useState( false );
	const [ fixa, setFixa ] = useState( false );
	const sortida = useRef( alSortir );
	const demanatSortir = useRef( false );
	sortida.current = alSortir;

	useEffect( () => {
		const el = ref.current;
		const onChange = () => {
			const dins = document.fullscreenElement === ref.current;
			setActiu( dins );
			if ( dins ) {
				setFixa( false );
			} else if ( ! demanatSortir.current ) {
				desbloquejaEsc();
				setFixa( true );
				sortida.current?.();
			}
		};
		document.addEventListener( 'fullscreenchange', onChange );
		return () => {
			document.removeEventListener( 'fullscreenchange', onChange );
			desbloquejaEsc();
			if ( document.fullscreenElement === el ) {
				document.exitFullscreen?.().catch( () => {} );
			}
		};
	}, [ ref ] );

	useEffect( () => {
		if ( ! fixa ) {
			return undefined;
		}
		const html = document.documentElement;
		html.classList.add( CLASSE_SCROLL );
		return () => html.classList.remove( CLASSE_SCROLL );
	}, [ fixa ] );

	const entra = useCallback( async () => {
		const el = ref.current;
		demanatSortir.current = false;
		if ( ! el?.requestFullscreen ) {
			setFixa( true );
			return;
		}
		if ( document.fullscreenElement === el ) {
			return;
		}
		try {
			await el.requestFullscreen();
		} catch {
			setFixa( true );
			return;
		}
		bloquejaEsc();
	}, [ ref ] );

	const surt = useCallback( async () => {
		demanatSortir.current = true;
		desbloquejaEsc();
		setFixa( false );
		if ( document.fullscreenElement ) {
			try {
				await document.exitFullscreen();
			} catch {
				// El navegador ja ha sortit o no ho permet: no hi ha res més a fer.
			}
		}
	}, [] );

	return { entra, surt, actiu, fixa };
}
