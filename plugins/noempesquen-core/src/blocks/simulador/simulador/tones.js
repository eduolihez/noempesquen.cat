import { patroTo } from './so-notificacio';

/**
 * Motor de so amb Web Audio: osciladors sinusoïdals amb envolvent lineal.
 * Cap fitxer d'àudio ni petició; si no hi ha AudioContext no fa res.
 */
export function creaMotorSo() {
	let ctx = null;

	const obtingues = () => {
		if ( ctx ) {
			return ctx;
		}
		try {
			const Classe =
				window.AudioContext ?? window.webkitAudioContext ?? null;
			ctx = Classe ? new Classe() : null;
		} catch {
			ctx = null;
		}
		return ctx;
	};

	return {
		reprodueix( tipus ) {
			try {
				const c = obtingues();
				if ( ! c ) {
					return;
				}
				if ( c.state === 'suspended' ) {
					c.resume?.()?.catch?.( () => {} );
				}
				const base = c.currentTime;
				for ( const nota of patroTo( tipus ) ) {
					const osc = c.createOscillator();
					const guany = c.createGain();
					const ini = base + nota.inici;
					const fi = ini + nota.durada;
					const atac = Math.min( 0.02, nota.durada / 2 );
					osc.type = 'sine';
					osc.frequency.setValueAtTime( nota.freq, ini );
					guany.gain.setValueAtTime( 0, ini );
					guany.gain.linearRampToValueAtTime( nota.pic, ini + atac );
					guany.gain.linearRampToValueAtTime( 0, fi );
					osc.connect( guany );
					guany.connect( c.destination );
					osc.start( ini );
					osc.stop( fi + 0.02 );
				}
			} catch {
				// Sense so: no passa res.
			}
		},
		reprèn() {
			try {
				const c = obtingues();
				if ( c && c.state === 'suspended' ) {
					c.resume?.()?.catch?.( () => {} );
				}
			} catch {
				// Ignorat.
			}
		},
		tanca() {
			try {
				const c = ctx;
				ctx = null;
				c?.close?.()?.catch?.( () => {} );
			} catch {
				// Ignorat.
			}
		},
	};
}
