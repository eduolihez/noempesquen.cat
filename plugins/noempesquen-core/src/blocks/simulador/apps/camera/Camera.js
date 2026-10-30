import { __ } from '@wordpress/i18n';
import { IconaCanviaCamera, IconaObturador } from './icones';

/*
 * Càmera del mòbil simulat: visor negre amb un avís. El simulador no
 * accedeix mai al dispositivo real (ni getUserMedia ni input de fitxer),
 * així que els controls es veuen però no fan res.
 */
export default function Camera() {
	return (
		<div
			className="nep-camera"
			role="region"
			aria-label={ __( 'Càmera', 'noempesquen' ) }
		>
			<div className="nep-camera__visor">
				<p className="nep-camera__avis" role="status">
					{ __(
						"No s'ha pogut accedir a la càmera en aquest simulador.",
						'noempesquen'
					) }
				</p>
			</div>
			<div className="nep-camera__barra">
				<button
					type="button"
					className="nep-camera__canvia"
					aria-disabled="true"
					aria-label={ __( 'Canvia de càmera', 'noempesquen' ) }
				>
					<IconaCanviaCamera mida={ 22 } />
				</button>
				<button
					type="button"
					className="nep-camera__obturador"
					aria-disabled="true"
					aria-label={ __( 'Fes una foto', 'noempesquen' ) }
				>
					<IconaObturador mida={ 30 } />
				</button>
				<div
					className="nep-camera__mode"
					role="group"
					aria-label={ __( 'Mode de captura', 'noempesquen' ) }
				>
					<button
						type="button"
						className="nep-camera__opcio"
						aria-disabled="true"
						aria-pressed="true"
					>
						{ __( 'Foto', 'noempesquen' ) }
					</button>
					<button
						type="button"
						className="nep-camera__opcio"
						aria-disabled="true"
						aria-pressed="false"
					>
						{ __( 'Vídeo', 'noempesquen' ) }
					</button>
				</div>
			</div>
		</div>
	);
}
