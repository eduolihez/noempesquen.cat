import { useEffect, useRef } from '@wordpress/element';
import { useJoc } from '../../simulador/context';

/**
 * Comportament comú dels panells desplegables de la barra (inici,
 * notificacions): Esc el tanca, el focus hi entra en obrir-se i torna al
 * botó d'origen en tancar-se, i es tanca si el focus en surt.
 *
 * @param {Function} onTanca Tanca el panell.
 * @param {Object}   origen  Ref del botó que l'ha obert.
 * @return {{panell: Object, onBlur: Function}} Ref del panell i gestor de blur.
 */
export function usePanell( onTanca, origen ) {
	const { registraMenu } = useJoc();
	const panell = useRef( null );
	const tanca = useRef( onTanca );
	tanca.current = onTanca;

	useEffect( () => {
		const el = panell.current;
		const doc = el.ownerDocument;
		const boto = origen.current;
		( el.querySelector( '[data-focus-inicial]' ) ?? el ).focus();
		const desregistra = registraMenu( () => tanca.current() );
		return () => {
			desregistra();
			const actiu = doc.activeElement;
			if ( ! actiu || actiu === doc.body || el.contains( actiu ) ) {
				boto?.focus();
			}
		};
	}, [ registraMenu, origen ] );

	const onBlur = ( e ) => {
		const desti = e.relatedTarget;
		if (
			desti &&
			! e.currentTarget.contains( desti ) &&
			! desti.closest( '.nep-so-barra' )
		) {
			tanca.current();
		}
	};

	return { panell, onBlur };
}
