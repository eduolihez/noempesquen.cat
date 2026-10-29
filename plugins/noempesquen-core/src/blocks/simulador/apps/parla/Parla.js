import { LlistaXats } from './LlistaXats';
import { Conversa } from './Conversa';
import { useParla } from './useParla';

/**
 * Parla d'escriptori: llista de xats (el guia fixat a dalt i els xats de
 * farciment de mon.json) i la conversa oberta. Amb el guia es respon amb
 * respostes ràpides.
 */
export default function Parla() {
	const { elements, actiu, obre, cerca, setCerca, conversa, onResposta } =
		useParla();

	return (
		<div className="nep-parla">
			<LlistaXats
				elements={ elements }
				actiu={ actiu }
				onObre={ obre }
				cerca={ cerca }
				onCerca={ setCerca }
			/>
			<Conversa key={ actiu } { ...conversa } onResposta={ onResposta } />
		</div>
	);
}
