/**
 * Lògica pura de la Calculadora. Interna: nombres amb punt decimal;
 * a pantalla (`mostra`) es fa servir la coma.
 */
export const MAX_DIGITS = 12;
export const ERROR_ZERO = 'No es pot dividir per zero';
export const ERROR_GRAN = 'Número massa gran';

const OPERADORS = [ '+', '−', '×', '÷' ];

export function estatInicial() {
	return { actual: '0', anterior: null, op: null, nou: true, error: null };
}

function digitsDe( text ) {
	return text.replace( /[-.]/g, '' ).length;
}

/* Arrodoneix a 10 xifres significatives i dona text. */
function formata( valor ) {
	if ( ! Number.isFinite( valor ) ) {
		return null;
	}
	const arrodonit = Number( valor.toPrecision( 10 ) );
	let text = String( arrodonit );
	if ( /e/i.test( text ) || digitsDe( text ) > MAX_DIGITS ) {
		text = arrodonit.toExponential( 5 ).replace( /\.?0+e/, 'e' );
	}
	return text;
}

function opera( a, op, b ) {
	switch ( op ) {
		case '+':
			return a + b;
		case '−':
			return a - b;
		case '×':
			return a * b;
		default:
			return b === 0 ? null : a / b;
	}
}

/* Resol `anterior op actual`; torna estat amb el resultat a `actual`. */
function resol( estat ) {
	const res = opera( estat.anterior, estat.op, Number( estat.actual ) );
	if ( res === null ) {
		return { ...estatInicial(), error: ERROR_ZERO };
	}
	const text = formata( res );
	if ( text === null ) {
		return { ...estatInicial(), error: ERROR_GRAN };
	}
	return { ...estat, actual: text, anterior: null, op: null, nou: true };
}

export function calcula( estat, tecla ) {
	if ( tecla === 'C' ) {
		return estatInicial();
	}
	const esDigit = /^[0-9]$/.test( tecla );
	if ( estat.error ) {
		// Només un dígit o la coma reinicien després d'un error.
		if ( esDigit || tecla === ',' ) {
			return calcula( estatInicial(), tecla );
		}
		return estat;
	}
	if ( esDigit ) {
		if ( estat.nou ) {
			return { ...estat, actual: tecla, nou: false };
		}
		if ( digitsDe( estat.actual ) >= MAX_DIGITS ) {
			return estat;
		}
		return {
			...estat,
			actual: estat.actual === '0' ? tecla : estat.actual + tecla,
		};
	}
	if ( tecla === ',' ) {
		if ( estat.nou ) {
			return { ...estat, actual: '0.', nou: false };
		}
		if ( estat.actual.includes( '.' ) ) {
			return estat;
		}
		return { ...estat, actual: estat.actual + '.' };
	}
	if ( OPERADORS.includes( tecla ) ) {
		if ( estat.op && estat.nou ) {
			return { ...estat, op: tecla };
		}
		const base = estat.op ? resol( estat ) : estat;
		if ( base.error ) {
			return base;
		}
		return {
			...base,
			anterior: Number( base.actual ),
			op: tecla,
			nou: true,
		};
	}
	if ( tecla === '=' ) {
		return estat.op && ! estat.nou ? resol( estat ) : estat;
	}
	if ( tecla === '⌫' ) {
		if ( estat.nou ) {
			return estat;
		}
		const resta = estat.actual.slice( 0, -1 );
		return {
			...estat,
			actual: resta === '' || resta === '-' ? '0' : resta,
		};
	}
	if ( tecla === '±' ) {
		if ( Number( estat.actual ) === 0 ) {
			return estat;
		}
		return {
			...estat,
			actual: estat.actual.startsWith( '-' )
				? estat.actual.slice( 1 )
				: '-' + estat.actual,
		};
	}
	if ( tecla === '%' ) {
		// Simple: només divideix entre 100 (no és "percentatge de" l'anterior).
		const text = formata( Number( estat.actual ) / 100 );
		return { ...estat, actual: text, nou: true };
	}
	return estat;
}

/* Classe de mida de la pantalla segons la longitud del text mostrat. */
export function classeMida( text ) {
	const n = text.length;
	if ( n <= 7 ) {
		return 'is-mida-1';
	}
	if ( n <= 10 ) {
		return 'is-mida-2';
	}
	if ( n <= 12 ) {
		return 'is-mida-3';
	}
	return 'is-mida-4';
}

export function mostra( estat ) {
	return estat.error ?? estat.actual.replace( '.', ',' );
}
