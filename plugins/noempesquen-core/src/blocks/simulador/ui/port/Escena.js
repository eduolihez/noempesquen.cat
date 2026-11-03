/**
 * Escena del port del selector: fons il·lustrat i els dos vaixells.
 * Presentacional: no té lògica de joc ni elements interactius.
 *
 * Props
 * - activa:       'pc' | 'mobil' | null. Vaixell del dispositiu en ús
 *                 (Pesquer = pc, Pirata = mobil): s'anima més (gavina posada,
 *                 fanal encès).
 * - seleccionada: 'pc' | 'mobil' | null. Activa el zoom de càmera cap a
 *                 aquest vaixell i esvaeix l'altre.
 * - classe:       classes extra per a l'arrel.
 * - children:     es pinten dins de `.nep-port__marc`, damunt de tot. És on
 *                 l'integrador posa els <button> dels vaixells.
 *
 * Estructura
 *   .nep-port                 contenidor `nep-port` de tipus size (cal que
 *                             tingui alçada definida), overflow hidden
 *     .nep-port__marc         proporció fixa --marc-r (16:9; 3:4 quan el
 *                             contenidor és més alt que ample, aspect-ratio
 *                             ≤ 1), absolut i centrat; és el que fa el zoom
 *       svg.nep-port__fons    fons ample i fons alt (només se'n veu un)
 *       svg.nep-port__barca   Pirata i Pesquer, col·locats per CSS
 *       {children}
 *
 * Marc «cover» (_port.scss): --marc-w = min(cover, el que deixa veure la
 * zona segura sencera); --marc-h = --marc-w / --marc-r. Zona segura: el
 * rectangle central de --zona-w × --zona-h del marc (0,84 × 0,75 en ample,
 * 0,96 × 0,85 en alt): barcos, cartells i botons hi han de cabre; fora
 * d'aquí es pot retallar. Si no hi cap amb cover pur, franges de cel (dalt)
 * i mar (baix). La zona no descompta les barres del selector (dalt ~55-67
 * px, baix ~50-70 px).
 *
 * Àncores (custom properties a `.nep-port__marc`, en % del marc; canvien
 * soles amb la disposició):
 *   --pesquer-x, --pesquer-y, --pesquer-w, --pesquer-h
 *   --pirata-x,  --pirata-y,  --pirata-w,  --pirata-h
 * Exemple per a un botó fill del marc:
 *   .boto-pesquer { position: absolute; left: var(--pesquer-x);
 *     top: var(--pesquer-y); width: var(--pesquer-w);
 *     height: var(--pesquer-h); }
 * Són exactes perquè el marc té la mateixa proporció que el viewBox.
 *
 * Càmera: amb `seleccionada`, l'arrel porta `nep-port--zoom` i
 * `nep-port--zoom-pc` | `nep-port--zoom-mobil`; el marc defineix --cam-x i
 * --cam-y (centre del vaixell), transform-origin al mateix punt i
 * transform: translate(...) scale(var(--port-zoom, 2)). Per canviar
 * l'acostament n'hi ha prou amb redefinir --port-zoom en un ancestre.
 */
import { Fons } from './Fons';
import { Pesquer } from './Pesquer';
import { Pirata } from './Pirata';

export function Escena( {
	activa = null,
	seleccionada = null,
	classe = '',
	children,
} ) {
	const arrel = [
		'nep-port',
		activa && `nep-port--activa-${ activa }`,
		seleccionada && 'nep-port--zoom',
		seleccionada && `nep-port--zoom-${ seleccionada }`,
		classe,
	]
		.filter( Boolean )
		.join( ' ' );
	return (
		<div className={ arrel }>
			<div className="nep-port__marc">
				<Fons disposicio="ampla" />
				<Fons disposicio="alta" />
				<Pirata
					classe="nep-port__vaixell nep-port__vaixell--pirata"
					activa={ activa === 'mobil' }
					seleccionada={ seleccionada === 'mobil' }
				/>
				<Pesquer
					classe="nep-port__vaixell nep-port__vaixell--pesquer"
					activa={ activa === 'pc' }
					seleccionada={ seleccionada === 'pc' }
				/>
				{ children }
			</div>
		</div>
	);
}
