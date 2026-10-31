/**
 * Errors del guió en català planer per al panell. Mòdul pur (sense DOM).
 *
 * Els missatges de `validaMissio` (nucli) no canvien: són els codis estables
 * que fan servir els tests i el simulador. Aquí es tradueixen a «què falla i
 * com arreglar-ho» i se'n dedueix la ruta dins del guió per poder-hi anar.
 */

const CAMPS = {
	id: 'L’id',
	titol: 'El títol',
	dispositiu: 'El dispositiu',
	personatge: 'El personatge',
	intro: 'La introducció',
};

const ARREL = {
	versio: 'Versió',
	id: 'Id',
	titol: 'Títol',
	dispositiu: 'Dispositiu',
	personatge: 'Personatge',
	intro: 'Introducció',
	apps: 'Apps',
	webs: 'Webs',
	senyals: 'Senyals',
	frases: 'Frases',
	disparadors: 'Disparadors',
	decisio: 'Decisió',
};

const LLISTES = {
	disparadors: 'Disparador',
	efectes: 'Efecte',
	opcions: 'Opció',
	senyals: 'Senyal',
	publicacions: 'Publicació',
	anuncis: 'Anunci',
	xats: 'Xat',
	missatges: 'Missatge',
	seccions: 'Secció',
	cos: 'Fragment',
	intro: 'Paràgraf',
};

const curt = ( t ) => ( t.length > 40 ? `${ t.slice( 0, 39 ) }…` : t );

/**
 * Etiqueta llegible d'una ruta: «Decisió › Opció 2 “Faig clic…”».
 *
 * @param {Array<string|number>} ruta Ruta dins del guió.
 * @param {Object}               guio Guió llegit.
 * @return {string} Etiqueta.
 */
export function etiquetaRuta( ruta, guio ) {
	const parts = [];
	let node = guio;
	let pare = null;
	ruta.forEach( ( pas ) => {
		node = node?.[ pas ];
		if ( typeof pas === 'number' ) {
			const nom = LLISTES[ pare ] ?? 'Element';
			const extra = node?.text ?? node?.id;
			const t =
				typeof extra === 'string' && extra
					? ` “${ curt( extra ) }”`
					: '';
			parts.push( `${ nom } ${ pas + 1 }${ t }` );
		} else if ( pare === 'webs' ) {
			parts.push( `Web «${ pas }»` );
		} else if ( pare === 'apps' ) {
			parts.push( `App «${ pas }»` );
		} else if ( ! ( pas in LLISTES ) || parts.length === 0 ) {
			parts.push( ARREL[ pas ] ?? `«${ pas }»` );
		}
		pare = pas;
	} );
	return parts.join( ' › ' );
}

/**
 * Primera ruta on hi ha `valor` (cerca en profunditat), opcionalment només
 * sota la clau `clau`.
 *
 * @param {Object}               node  Node del guió.
 * @param {string}               valor Valor buscat.
 * @param {?string}              clau  Nom de la clau que l'ha de contenir.
 * @param {Array<string|number>} ruta  Ruta del node.
 * @return {?Array<string|number>} Ruta trobada.
 */
export function trobaValor( node, valor, clau = null, ruta = [] ) {
	if ( ! node || typeof node !== 'object' ) {
		return null;
	}
	const entrades = Array.isArray( node )
		? node.map( ( v, i ) => [ i, v ] )
		: Object.entries( node );
	for ( const [ k, v ] of entrades ) {
		if ( v === valor && ( clau === null || k === clau ) ) {
			return [ ...ruta, k ];
		}
		const fill = trobaValor( v, valor, clau, [ ...ruta, k ] );
		if ( fill ) {
			return fill;
		}
	}
	return null;
}

/**
 * Ruta d'una referència del validador («revenda.xats[2].cos[1]», …).
 *
 * @param {string} ref Referència.
 * @return {?Array<string|number>} Ruta.
 */
function rutaDeRef( ref ) {
	let m = /^ullada\.publicacions\[(\d+)\]$/.exec( ref );
	if ( m ) {
		return [ 'apps', 'ullada', 'publicacions', Number( m[ 1 ] ) ];
	}
	m = /^revenda\.(anuncis|xats)\[(\d+)\](?:\.cos\[(\d+)\])?$/.exec( ref );
	if ( m ) {
		const r = [ 'apps', 'revenda', m[ 1 ], Number( m[ 2 ] ) ];
		return m[ 3 ] === undefined ? r : [ ...r, 'cos', Number( m[ 3 ] ) ];
	}
	m = /^article (.+?)(?:\.seccions\[(\d+)\])?$/.exec( ref );
	if ( m ) {
		const r = [ 'webs', m[ 1 ] ];
		return m[ 2 ] === undefined
			? r
			: [ ...r, 'seccions', Number( m[ 2 ] ) ];
	}
	m = /^([a-z][\w-]*) (\S+)$/.exec( ref );
	if ( m ) {
		return [ 'webs', m[ 2 ] ];
	}
	m = /^(\S+)\.anunci$/.exec( ref );
	if ( m ) {
		return [ 'webs', m[ 1 ], 'anunci' ];
	}
	return null;
}

const CAMP_REF = {
	autor: 'autor',
	contacte: 'contacte',
	anunci: 'anunci',
	'il·lustració': 'il',
};

/**
 * Missatges amb prefix de referència: «<ref>: <detall>».
 *
 * @param {string} codi Missatge del validador.
 * @return {?Object} Ruta i text.
 */
function ambRef( codi ) {
	const sep = codi.indexOf( ': ' );
	if ( sep < 0 ) {
		return null;
	}
	const ruta = rutaDeRef( codi.slice( 0, sep ) );
	if ( ! ruta ) {
		return null;
	}
	const detall = codi.slice( sep + 2 );
	let m = /^camp «(.+)» buit o absent$/.exec( detall );
	if ( m ) {
		return {
			ruta: [ ...ruta, m[ 1 ] ],
			text: `Falta el camp «${ m[ 1 ] }» o és buit. Afegeix-lo amb un text.`,
		};
	}
	m = /^«(.+?)» ha de ser (.+)$/.exec( detall );
	if ( m ) {
		const tipus = m[ 2 ] === 'booleà' ? 'true o false' : m[ 2 ];
		return {
			ruta: [ ...ruta, m[ 1 ] ],
			text: `El camp «${ m[ 1 ] }» ha de ser ${ tipus }.`,
		};
	}
	m = /^id duplicat «(.*)»$/.exec( detall );
	if ( m ) {
		return {
			ruta: [ ...ruta, 'id' ],
			text: `L’id «${ m[ 1 ] }» ja es fa servir en un altre element. Posa’n un de diferent.`,
		};
	}
	m = /^(autor|contacte|anunci|il·lustració) inexistent «(.*)»$/.exec(
		detall
	);
	if ( m ) {
		return {
			ruta: [ ...ruta, CAMP_REF[ m[ 1 ] ] ],
			text: `No hi ha cap ${ m[ 1 ] } amb l’id «${ m[ 2 ] }». Comprova que estigui escrit igual que a la missió o al món compartit.`,
		};
	}
	if ( detall === 'ha de ser un objecte' ) {
		return { ruta, text: 'Ha de ser un objecte JSON ({ … }).' };
	}
	return {
		ruta,
		text: `${ detall[ 0 ].toUpperCase() }${ detall.slice( 1 ) }.`,
	};
}

/**
 * Ruta de l'efecte que compleix `prou` (primer dels disparadors), o la dels
 * disparadors si no n'hi ha cap.
 *
 * @param {Object}                 g    Guió llegit.
 * @param {(e: Object) => boolean} prou Predicat sobre l'efecte.
 * @return {Array<string|number>} Ruta.
 */
function rutaEfecte( g, prou ) {
	const ds = Array.isArray( g.disparadors ) ? g.disparadors : [];
	for ( let i = 0; i < ds.length; i++ ) {
		const es = Array.isArray( ds[ i ]?.efectes ) ? ds[ i ].efectes : [];
		const j = es.findIndex( ( e ) => e && prou( e ) );
		if ( j >= 0 ) {
			return [ 'disparadors', i, 'efectes', j ];
		}
	}
	return [ 'disparadors' ];
}

/**
 * Ruta del primer valor `valor` sota la clau `clau` dels disparadors.
 *
 * @param {Object} g     Guió llegit.
 * @param {string} valor Valor buscat.
 * @param {string} clau  Clau que el conté.
 * @return {Array<string|number>} Ruta.
 */
function rutaDisparador( g, valor, clau ) {
	return (
		trobaValor( g.disparadors, valor, clau, [ 'disparadors' ] ) ?? [
			'disparadors',
		]
	);
}

/**
 * Ruta d'un xat de Parla per id (o la llista de xats).
 *
 * @param {Object} g  Guió llegit.
 * @param {string} id Id del xat o d'un dels seus missatges.
 * @return {Array<string|number>} Ruta.
 */
function rutaXat( g, id ) {
	const xats = g.apps?.parla?.xats;
	const base = [ 'apps', 'parla', 'xats' ];
	if ( ! Array.isArray( xats ) ) {
		return base;
	}
	const i = xats.findIndex(
		( x ) =>
			x?.id === id ||
			( Array.isArray( x?.missatges ) &&
				x.missatges.some( ( m ) => m?.id === id ) )
	);
	return i >= 0 ? [ ...base, i ] : base;
}

const REGLES_EFECTES = [
	[
		/^mostra: element inexistent: (.*)$/,
		( m, g ) => ( {
			ruta: rutaDisparador( g, m[ 1 ], 'id' ),
			text: `L’efecte «mostra» apunta a «${ m[ 1 ] }», que no és cap element de les apps ni de les webs del guió. Corregeix l’id o afegeix l’element.`,
		} ),
	],
	[
		/^notifica: xat només amb app parla o revenda$/,
		( m, g ) => ( {
			ruta: rutaEfecte(
				g,
				( e ) => e.tipus === 'notifica' && 'xat' in e
			),
			text: 'Un «notifica» amb «xat» només funciona amb "app": "parla" o "revenda". Canvia l’app o treu el camp «xat».',
		} ),
	],
	[
		/^notifica: xat inexistent a (\S+): (.*)$/,
		( m, g ) => ( {
			ruta: rutaDisparador( g, m[ 2 ], 'xat' ),
			text: `L’app «${ m[ 1 ] }» no té cap xat amb l’id «${ m[ 2 ] }». Comprova que el xat existeix al guió i que l’id és igual.`,
		} ),
	],
	[
		/^notifica: font invàlida: (.*)$/,
		( m, g ) => ( {
			ruta: rutaDisparador( g, m[ 1 ], 'font' ),
			text: `La font «${ m[ 1 ] }» no és vàlida. Només pot ser "mobil" o no posar-la.`,
		} ),
	],
	[
		/^notifica: font desconeguda: (.*)$/,
		( m, g ) => ( {
			ruta: rutaDisparador( g, m[ 1 ], 'app' ),
			text: `L’app «${ m[ 1 ] }» no pot enviar notificacions des d’aquesta font. Tria’n una altra o revisa "font".`,
		} ),
	],
	[
		/^guia-diu sense text ni frase$/,
		( m, g ) => ( {
			ruta: rutaEfecte(
				g,
				( e ) => e.tipus === 'guia-diu' && ! e.text && ! e.frase
			),
			text: 'L’efecte «guia-diu» necessita un "text" o una "frase" (el nom d’una entrada de «frases»).',
		} ),
	],
	[
		/^efecte invàlid$/,
		() => ( {
			ruta: [ 'disparadors' ],
			text: 'Hi ha un efecte que no és un objecte JSON. Cada efecte ha de ser { "tipus": "…" }.',
		} ),
	],
];

const REGLES_DISPARADORS = [
	[
		/^disparador invàlid$/,
		() => ( {
			ruta: [ 'disparadors' ],
			text: 'Hi ha un disparador que no és un objecte JSON. Ha de portar "esdeveniment" i "efectes".',
		} ),
	],
	[
		/^visible: element inexistent: (.*)$/,
		( m, g ) => ( {
			ruta: rutaDisparador( g, m[ 1 ], 'visible' ),
			text: `La condició «visible» apunta a «${ m[ 1 ] }», que no és cap element del guió. Corregeix l’id o afegeix l’element.`,
		} ),
	],
	[
		/^bloqueja: contacte inexistent: (.*)$/,
		( m, g ) => ( {
			ruta: rutaDisparador( g, m[ 1 ], 'id' ),
			text: `El disparador de bloquejar espera un contacte amb l’id «${ m[ 1 ] }», però no és al món compartit ni a la missió.`,
		} ),
	],
	[
		/^denuncia: publicació inexistent: (.*)$/,
		( m, g ) => ( {
			ruta: rutaDisparador( g, m[ 1 ], 'id' ),
			text: `El disparador de denunciar espera una publicació amb l’id «${ m[ 1 ] }», però no n’hi ha cap amb aquest id a Ullada.`,
		} ),
	],
	[
		/^fitxer ha de ser text$/,
		( m, g ) => ( {
			ruta: ( () => {
				const ds = Array.isArray( g.disparadors ) ? g.disparadors : [];
				const i = ds.findIndex(
					( d ) =>
						d?.quan?.fitxer !== undefined &&
						typeof d.quan.fitxer !== 'string'
				);
				return i >= 0
					? [ 'disparadors', i, 'quan', 'fitxer' ]
					: [ 'disparadors' ];
			} )(),
			text: 'La condició «fitxer» ha de ser un text (el nom del fitxer), entre cometes.',
		} ),
	],
	[
		/^(\S+): url sense web article: (.*)$/,
		( m, g ) => ( {
			ruta: rutaDisparador( g, m[ 2 ], 'url' ),
			text: `L’esdeveniment «${ m[ 1 ] }» necessita una url d’una web amb plantilla «article», i «${ m[ 2 ] }» no ho és.`,
		} ),
	],
	[
		/^(\S+): la web (\S+) (.+)$/,
		( m ) => ( {
			ruta: [ 'webs', m[ 2 ] ],
			text: `Per a l’esdeveniment «${ m[ 1 ] }», la web «${ m[ 2 ] }» ${ m[ 3 ] }. Afegeix-ho a la web.`,
		} ),
	],
];

const REGLES_PARLA = [
	[
		/^parla: xats ha de ser una llista$/,
		() => ( {
			ruta: [ 'apps', 'parla', 'xats' ],
			text: '«xats» de Parla ha de ser una llista ([ … ]) de xats.',
		} ),
	],
	[
		/^parla: xat invàlid$/,
		() => ( {
			ruta: [ 'apps', 'parla', 'xats' ],
			text: 'Hi ha un xat de Parla sense "id" o que no és un objecte JSON.',
		} ),
	],
	[
		/^parla: xat duplicat: (.*)$/,
		( m, g ) => ( {
			ruta: rutaXat( g, m[ 1 ] ),
			text: `Hi ha dos xats de Parla amb l’id «${ m[ 1 ] }». Canvia’n un.`,
		} ),
	],
	[
		/^parla: contacte inexistent: (.*)$/,
		( m, g ) => ( {
			ruta: trobaValor( g.apps?.parla, m[ 1 ], 'contacte', [
				'apps',
				'parla',
			] ) ?? [ 'apps', 'parla' ],
			text: `El contacte «${ m[ 1 ] }» no és al món compartit. Comprova l’id o tria’n un d’existent.`,
		} ),
	],
	[
		/^parla: xat sense missatges: (.*)$/,
		( m, g ) => ( {
			ruta: rutaXat( g, m[ 1 ] ),
			text: `El xat «${ m[ 1 ] }» no té missatges. Afegeix-ne almenys un a «missatges».`,
		} ),
	],
	[
		/^parla: missatge invàlid a (.*)$/,
		( m, g ) => ( {
			ruta: rutaXat( g, m[ 1 ] ),
			text: `Hi ha un missatge del xat «${ m[ 1 ] }» sense "id" o sense "text". Cada missatge necessita tots dos.`,
		} ),
	],
	[
		/^parla: remitent invàlid: (.*)$/,
		( m, g ) => ( {
			ruta: rutaXat( g, m[ 1 ] ),
			text: `El missatge «${ m[ 1 ] }» ha de tenir "de": "ells" o "jo".`,
		} ),
	],
	[
		/^parla: missatge duplicat: (.*)$/,
		( m, g ) => ( {
			ruta: rutaXat( g, m[ 1 ] ),
			text: `L’id de missatge «${ m[ 1 ] }» surt més d’una vegada. Cada missatge necessita un id propi.`,
		} ),
	],
];

const REGLES_FORMULARI = [
	[
		/^formulari: esdeveniment invàlid a (\S+): (.*)$/,
		( m ) => ( {
			ruta: [ 'webs', m[ 1 ] ],
			text: `L’esdeveniment de formulari «${ m[ 2 ] }» de la web «${ m[ 1 ] }» no existeix. Ha de ser formulari.envia, codi.envia o pagament.fes.`,
		} ),
	],
	[
		/^formulari: (\S+) ha de ser text a (\S+)$/,
		( m ) => ( {
			ruta: [ 'webs', m[ 2 ] ],
			text: `El camp «${ m[ 1 ] }» del formulari de la web «${ m[ 2 ] }» ha de ser un text entre cometes.`,
		} ),
	],
];

// Missatges sense prefix: [ patró, ( coincidència, guió ) => { ruta, text } ].
const REGLES = [
	[
		/^versio no suportada$/,
		() => ( {
			ruta: [ 'versio' ],
			text: 'La versió del format ha de ser 2. Escriu "versio": 2 (un número, sense cometes).',
		} ),
	],
	[
		/^falta (id|titol|dispositiu|personatge|intro)$/,
		( m ) => ( {
			ruta: [ m[ 1 ] ],
			text: `${ CAMPS[ m[ 1 ] ] } és obligatori i no hi és. Afegeix «${ m[ 1 ] }» al principi del guió.`,
		} ),
	],
	[
		/^id invàlid$/,
		() => ( {
			ruta: [ 'id' ],
			text: 'L’id només pot tenir minúscules sense accents, xifres i guions entre paraules (p. ex. «llissa-09-factura»).',
		} ),
	],
	[
		/^titol invàlid$/,
		() => ( {
			ruta: [ 'titol' ],
			text: 'El títol ha de ser un text que no sigui només espais.',
		} ),
	],
	[
		/^dispositiu invàlid$/,
		() => ( {
			ruta: [ 'dispositiu' ],
			text: 'El dispositiu ha de ser «pc» (ordinador) o «mobil».',
		} ),
	],
	[
		/^personatge invàlid$/,
		() => ( {
			ruta: [ 'personatge' ],
			text: 'El personatge ha de ser «llissa» o «remei».',
		} ),
	],
	[
		/^(apps|webs) invàlid$/,
		( m ) => ( {
			ruta: [ m[ 1 ] ],
			text: `«${ m[ 1 ] }» ha de ser un objecte JSON ({ … }).`,
		} ),
	],
	[
		/^senyal duplicada: (.*)$/,
		( m, g ) => {
			const i = ( g.senyals ?? [] )
				.map( ( s ) => s?.id )
				.lastIndexOf( m[ 1 ] );
			return {
				ruta: i >= 0 ? [ 'senyals', i, 'id' ] : [ 'senyals' ],
				text: `Hi ha dues senyals amb l’id «${ m[ 1 ] }». Canvia’n una o esborra la repetida.`,
			};
		},
	],
	[
		/^senyal desconegut: (.*)$/,
		( m, g ) => ( {
			ruta: trobaValor( g, m[ 1 ] ) ?? [ 'senyals' ],
			text: `Es fa servir la senyal «${ m[ 1 ] }», però no és a la llista «senyals». Afegeix-la-hi o corregeix el nom.`,
		} ),
	],
	[
		/^senyal sense referència: (.*)$/,
		( m, g ) => {
			const i = ( g.senyals ?? [] ).findIndex(
				( s ) => s?.id === m[ 1 ]
			);
			return {
				ruta: i >= 0 ? [ 'senyals', i ] : [ 'senyals' ],
				text: `La senyal «${ m[ 1 ] }» no surt enlloc (apps, webs, frases ni decisió). Marca-la en algun element o treu-la de «senyals».`,
			};
		},
	],
	[
		/^url d'enllaç no permesa: (.*)$/,
		( m, g ) => ( {
			ruta: trobaValor( g, m[ 1 ], 'url' ),
			text: `L’enllaç «${ m[ 1 ] }» no és vàlid. Ha de començar per https:// (o cerca: als missatges de les apps).`,
		} ),
	],
	[
		/^app inexistent al dispositiu (\w+): (.*)$/,
		( m, g ) => ( {
			ruta:
				g.apps && m[ 2 ] in g.apps
					? [ 'apps', m[ 2 ] ]
					: trobaValor( g.disparadors, m[ 2 ], 'app', [
							'disparadors',
						] ),
			text: `L’app «${ m[ 2 ] }» no existeix al dispositiu «${ m[ 1 ] }». Fes servir una app d’aquest dispositiu o canvia el dispositiu.`,
		} ),
	],
	[
		/^web invàlida: (.*)$/,
		( m ) => ( {
			ruta: [ 'webs', m[ 1 ] ],
			text: `La web «${ m[ 1 ] }» ha de ser un objecte JSON amb «plantilla».`,
		} ),
	],
	[
		/^plantilla desconeguda: (.*)$/,
		( m, g ) => ( {
			ruta: trobaValor( g.webs, m[ 1 ], 'plantilla', [ 'webs' ] ),
			text: `No hi ha cap plantilla de web «${ m[ 1 ] }». Revisa el nom a docs/format-missions.md.`,
		} ),
	],
	[
		/^(\S+) només admet variant falsa: (.*)$/,
		( m ) => ( {
			ruta: [ 'webs', m[ 2 ], 'variant' ],
			text: `La plantilla «${ m[ 1 ] }» només té versió falsa. Posa "variant": "falsa".`,
		} ),
	],
	[
		/^esdeveniment desconegut: (.*)$/,
		( m, g ) => ( {
			ruta: trobaValor( g.disparadors, m[ 1 ], 'esdeveniment', [
				'disparadors',
			] ),
			text: `L’esdeveniment «${ m[ 1 ] }» no existeix. Mira la llista d’esdeveniments a docs/format-missions.md.`,
		} ),
	],
	[
		/^efecte desconegut: (.*)$/,
		( m, g ) => ( {
			ruta: trobaValor( g.disparadors, m[ 1 ], 'tipus', [
				'disparadors',
			] ),
			text: `L’efecte «${ m[ 1 ] }» no existeix. Ha de ser guia-diu, notifica, mostra, pescat o decideix.`,
		} ),
	],
	[
		/^frase inexistent: (.*)$/,
		( m, g ) => ( {
			ruta: trobaValor( g.disparadors, m[ 1 ], 'frase', [
				'disparadors',
			] ),
			text: `La frase «${ m[ 1 ] }» no és a «frases». Afegeix-la o corregeix el nom.`,
		} ),
	],
	[
		/^opció inexistent: (.*)$/,
		( m, g ) => ( {
			ruta: trobaValor( g.disparadors, m[ 1 ], 'opcio', [
				'disparadors',
			] ),
			text: `L’efecte «decideix» apunta a l’opció «${ m[ 1 ] }», que no és a «decisio.opcions».`,
		} ),
	],
	[
		/^cap camí de pescat$/,
		() => ( {
			ruta: [ 'disparadors' ],
			text: 'Cap disparador acaba amb l’efecte «pescat». Afegeix-ne almenys un perquè el jugador pugui caure a la trampa.',
		} ),
	],
	[
		/^cap opció correcta$/,
		() => ( {
			ruta: [ 'decisio', 'opcions' ],
			text: 'Cap opció de la decisió té "valor": "correcta". Marca’n almenys una.',
		} ),
	],
	...REGLES_EFECTES,
	...REGLES_DISPARADORS,
	...REGLES_PARLA,
	...REGLES_FORMULARI,
];

/**
 * Error llegible a partir del missatge del validador.
 *
 * @param {string} codi Missatge de `validaMissio` (codi estable).
 * @param {Object} guio Guió llegit.
 * @return {{ codi: string, text: string, on: ?string, ruta: ?Array }} Error.
 */
export function errorLlegible( codi, guio ) {
	let r = null;
	for ( const [ patro, fes ] of REGLES ) {
		const m = patro.exec( codi );
		if ( m ) {
			r = fes( m, guio );
			break;
		}
	}
	r = r ?? ambRef( codi );
	const ruta = r?.ruta?.length ? r.ruta : null;
	return {
		codi,
		text: r?.text ?? `${ codi[ 0 ].toUpperCase() }${ codi.slice( 1 ) }.`,
		on: ruta ? etiquetaRuta( ruta, guio ) : null,
		ruta,
	};
}
