import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Textos de la pantalla de compte. El català és l'msgid; l'idioma el tria
 * `wp_set_script_translations` (JSON generat per `npm run i18n:json`).
 */
export const T = {
	obligatoris: __( 'Tots els camps són obligatoris.', 'noempesquen' ),
	carregant: __( 'Carregant el teu compte…', 'noempesquen' ),
	pestanyes: __( 'Accés al compte', 'noempesquen' ),
	crea: __( 'Crea un compte', 'noempesquen' ),
	entra: __( 'Entra', 'noempesquen' ),
	correu: __( 'Correu electrònic', 'noempesquen' ),
	contrasenya: __( 'Contrasenya', 'noempesquen' ),
	ajudaContrasenya: __( 'Entre 10 i 128 caràcters.', 'noempesquen' ),
	avisContrasenya: __(
		"Si perds la contrasenya, només la podràs recuperar si has verificat el correu. T'enviarem un missatge per fer-ho.",
		'noempesquen'
	),
	majoriaEdat: __( 'Tinc 14 anys o més', 'noempesquen' ),
	acepta: __(
		'Accepto que es desin el meu correu i el meu progrés per poder recuperar-lo en un altre dispositiu',
		'noempesquen'
	),
	quinesDades: __( 'Quines dades es guarden', 'noempesquen' ),
	dades: [
		__(
			"Només el teu correu electrònic. L'usem per entrar i per enviar-te els missatges de verificació i de recuperació de la contrasenya, res més.",
			'noempesquen'
		),
		__(
			'La contrasenya, guardada xifrada (amb hash): ningú no la pot llegir.',
			'noempesquen'
		),
		__(
			'El progrés de les missions (les estrelles de cada missió).',
			'noempesquen'
		),
		__(
			'La data i la versió del consentiment que acceptes ara.',
			'noempesquen'
		),
		__(
			'Res del que escriguis als formularis falsos del simulador: no surt mai del teu navegador.',
			'noempesquen'
		),
		__(
			"Pots descarregar-ho i esborrar-ho tot des d'aquesta pàgina.",
			'noempesquen'
		),
		__(
			'Les estadístiques anònimes de les partides són a part i no porten cap dada teva.',
			'noempesquen'
		),
	],
	botoCrea: __( 'Crea el compte', 'noempesquen' ),
	botoEntra: __( 'Entra', 'noempesquen' ),
	enviant: __( 'Enviant…', 'noempesquen' ),
	errCorreu: __( 'Escriu un correu electrònic vàlid.', 'noempesquen' ),
	errContrasenya: __(
		'La contrasenya ha de tenir entre 10 i 128 caràcters.',
		'noempesquen'
	),
	errContrasenyaBuida: __( 'Escriu la contrasenya.', 'noempesquen' ),
	errMajoriaEdat: __(
		'Cal que tinguis 14 anys o més per crear un compte.',
		'noempesquen'
	),
	errAcepta: __(
		'Cal que acceptis que es desin les dades per crear un compte.',
		'noempesquen'
	),
	errResum: __( 'Revisa els camps marcats.', 'noempesquen' ),
	creat: __( 'Compte creat. Ja tens la sessió iniciada.', 'noempesquen' ),
	dins: __( 'Has entrat al teu compte.', 'noempesquen' ),
	elTeuCompte: __( 'El teu compte', 'noempesquen' ),
	progres: __( 'Progrés de les missions', 'noempesquen' ),
	senseProgres: __(
		'Encara no hi ha cap missió desada. Juga al simulador amb la sessió iniciada.',
		'noempesquen'
	),
	estrelles: ( n ) =>
		sprintf(
			/* translators: %d: nombre d'estrelles (de 3). */
			_n( '%d estrella de 3', '%d estrelles de 3', n, 'noempesquen' ),
			n
		),
	anarSimulador: __( 'Ves al simulador', 'noempesquen' ),
	descarrega: __( 'Descarrega les meves dades', 'noempesquen' ),
	descarregat: __( 'Dades descarregades.', 'noempesquen' ),
	tanca: __( 'Tanca la sessió', 'noempesquen' ),
	tancada: __( 'Has tancat la sessió.', 'noempesquen' ),
	esborra: __( 'Esborra el compte', 'noempesquen' ),
	esborraTitol: __( 'Esborrar el compte', 'noempesquen' ),
	esborraText: __(
		"S'esborraran el teu correu, la contrasenya i el progrés. No es pot desfer.",
		'noempesquen'
	),
	esborraConfirma: __( 'Esborra el compte definitivament', 'noempesquen' ),
	cancella: __( 'Cancel·la', 'noempesquen' ),
	esborrat: __( "El compte s'ha esborrat.", 'noempesquen' ),
	oblidat: __( 'He oblidat la contrasenya', 'noempesquen' ),
	recuperaTitol: __( 'Recupera la contrasenya', 'noempesquen' ),
	recuperaText: __(
		"Escriu el correu del teu compte. Si és d'un compte amb el correu verificat, t'hi enviarem un enllaç per triar una contrasenya nova.",
		'noempesquen'
	),
	recuperaBoto: __( "Envia'm l'enllaç", 'noempesquen' ),
	recuperaEnviat: __(
		"Si hi ha un compte amb aquest correu verificat, t'hem enviat un enllaç. Mira també la carpeta de correu brossa. L'enllaç caduca d'aquí a 1 hora.",
		'noempesquen'
	),
	tornaEntra: __( "Torna a l'entrada", 'noempesquen' ),
	restableixTitol: __( 'Tria una contrasenya nova', 'noempesquen' ),
	contrasenyaNova: __( 'Contrasenya nova', 'noempesquen' ),
	restableixBoto: __( 'Desa la contrasenya nova', 'noempesquen' ),
	restablert: __(
		'Contrasenya canviada. Ja pots entrar amb la nova.',
		'noempesquen'
	),
	errToken: __(
		"L'enllaç no és vàlid o ha caducat. Demana'n un de nou.",
		'noempesquen'
	),
	verificat: __( 'Correu verificat. Gràcies!', 'noempesquen' ),
	bannerTitol: __( 'Verifica el correu', 'noempesquen' ),
	bannerText: __(
		"T'hem enviat un enllaç per confirmar el correu. Sense verificar, no podràs recuperar la contrasenya si la perds. El compte funciona igualment.",
		'noempesquen'
	),
	reenvia: __( 'Reenvia el correu', 'noempesquen' ),
	reenviat: __(
		"T'hem tornat a enviar el correu. Mira també la carpeta de correu brossa.",
		'noempesquen'
	),
	noReenviat: __(
		"No s'ha pogut enviar el correu. Torna-ho a provar més tard.",
		'noempesquen'
	),
};
