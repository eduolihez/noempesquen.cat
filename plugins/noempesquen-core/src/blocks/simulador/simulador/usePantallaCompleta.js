import { useState, useEffect, useCallback, useRef } from '@wordpress/element';

const CLASSE_SCROLL = 'nep-so-bloqueja-scroll';

/**
 * Pantalla completa sobre l'element de `ref`, amb capa fixa de reserva.
 *
 * @param {Object}   ref      Ref de l'element arrel.
 * @param {Function} alSortir Es crida quan el navegador surt de pantalla completa
 *                            sense haver-ho demanat nosaltres.
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
				sortida.current?.();
			}
		};
		document.addEventListener( 'fullscreenchange', onChange );
		return () => {
			document.removeEventListener( 'fullscreenchange', onChange );
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
		}
	}, [ ref ] );

	const surt = useCallback( async () => {
		demanatSortir.current = true;
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
