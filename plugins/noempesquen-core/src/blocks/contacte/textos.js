import { __ } from '@wordpress/i18n';

/**
 * Textos de el formulari de contacte. El català és l'msgid; l'idioma el tria
 * `wp_set_script_translations` (JSON generat per `npm run i18n:json`).
 */
export const T = {
	titol: __( 'Escriu-nos', 'noempesquen' ),
	intro: __( 'Tots els camps són obligatoris.', 'noempesquen' ),
	nom: __( 'Nom', 'noempesquen' ),
	correu: __( 'Correu electrònic', 'noempesquen' ),
	ajudaCorreu: __( 'Només el farem servir per respondre’t.', 'noempesquen' ),
	assumpte: __( 'Assumpte', 'noempesquen' ),
	triaAssumpte: __( 'Tria un assumpte', 'noempesquen' ),
	missatge: __( 'Missatge', 'noempesquen' ),
	ajudaMissatge: __( 'Entre 10 i 2000 caràcters.', 'noempesquen' ),
	privacitatInici: __( 'He llegit l’', 'noempesquen' ),
	privacitatEnllac: __( 'avís de privacitat', 'noempesquen' ),
	privacitatFinal: __(
		'i accepto que s’usin aquestes dades per respondre’m',
		'noempesquen'
	),
	enviar: __( 'Envia el missatge', 'noempesquen' ),
	enviant: __( 'S’està enviant…', 'noempesquen' ),
	resumTitol: __( 'Revisa el formulari', 'noempesquen' ),
	fallada: __(
		'No s’ha pogut enviar el missatge. Torna-ho a provar d’aquí una estona.',
		'noempesquen'
	),
	limit: __(
		'Has enviat massa missatges. Torna-ho a provar una mica més tard.',
		'noempesquen'
	),
	confirmacioTitol: __( 'Missatge enviat', 'noempesquen' ),
	confirmacio: __(
		'Gràcies! Hem rebut el teu missatge i et respondrem tan aviat com puguem.',
		'noempesquen'
	),
	// `valor` és el que viatja al servidor (llista blanca, no es tradueix); `text`, el que es veu.
	assumptes: [
		{ valor: 'Dubte', text: __( 'Dubte', 'noempesquen' ) },
		{ valor: 'Suggeriment', text: __( 'Suggeriment', 'noempesquen' ) },
		{
			valor: 'He trobat un error',
			text: __( 'He trobat un error', 'noempesquen' ),
		},
		{ valor: 'Altres', text: __( 'Altres', 'noempesquen' ) },
	],
	errors: {
		nom: __( 'Escriu el teu nom.', 'noempesquen' ),
		nomLlarg: __( 'El nom no pot passar de 80 caràcters.', 'noempesquen' ),
		correu: __( 'Escriu el teu correu electrònic.', 'noempesquen' ),
		correuFormat: __(
			'Escriu un correu vàlid, per exemple nom@exemple.cat.',
			'noempesquen'
		),
		assumpte: __( 'Tria un assumpte de la llista.', 'noempesquen' ),
		missatge: __( 'Escriu el teu missatge.', 'noempesquen' ),
		missatgeCurt: __(
			'El missatge ha de tenir almenys 10 caràcters.',
			'noempesquen'
		),
		missatgeLlarg: __(
			'El missatge no pot passar de 2000 caràcters.',
			'noempesquen'
		),
		privacitat: __(
			'Cal que acceptis l’avís de privacitat per poder enviar el missatge.',
			'noempesquen'
		),
	},
};
