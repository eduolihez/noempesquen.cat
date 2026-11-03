const { execSync } = require( 'node:child_process' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { test, expect, iniciaMissio, senseFullscreen } = require( './ajudes' );
const MISSIO_JSON = require( '../../plugins/noempesquen-core/missions/llissa-05-actualitzacio.json' );

/**
 * Resum públic (GET /resultat/resum): en acabar, el jugador veu què va triar
 * la gent. Al projecte `panell-estadistiques`: publica una còpia de la missió
 * amb id propi i hi posa files reals de prova (que esborra en acabar). El
 * POST /resultat s'intercepta: no escriu cap fila.
 */
test.describe.configure( { mode: 'serial' } );

const POST_RESULTAT = /\/noempesquen\/v1\/resultat$/;
const RESUM = /\/noempesquen\/v1\/resultat\/resum\?missio=/;
const escapa = ( text ) => text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

test.beforeEach( ( {}, testInfo ) => {
	test.skip(
		testInfo.project.name !== 'panell-estadistiques',
		'Només al projecte panell-estadistiques'
	);
} );

// Files de prova a l'entorn que serveix :8888 (contenidor `cli` de wp-env).
const files = ( accio, missio ) =>
	execSync(
		`npm run env:cli -- wp eval-file wp-content/plugins/noempesquen-core/tests/php/e2e-resum.php ${ accio } ${ missio }`,
		{ cwd: `${ __dirname }/../..`, stdio: 'pipe', timeout: 120000 }
	).toString();

const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );

async function entra( page ) {
	await page.goto( '/admin/' );
	await page.locator( '#user_login' ).fill( 'admin' );
	await page.locator( '#user_pass' ).fill( 'password' );
	await page.locator( '#wp-submit' ).click();
	await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
	return (
		await page.request.get( '/wp-admin/admin-ajax.php?action=rest-nonce' )
	).text();
}

async function publica( page, nonce, id, titol ) {
	const creada = await page.request.post( '/wp-json/wp/v2/nep_missio', {
		headers: { 'X-WP-Nonce': nonce },
		data: {
			title: titol,
			status: 'publish',
			meta: {
				nep_dispositiu: MISSIO_JSON.dispositiu,
				nep_personatge: MISSIO_JSON.personatge,
				nep_guio: JSON.stringify( { ...MISSIO_JSON, id, titol } ),
			},
		},
	} );
	expect( creada.status() ).toBe( 201 );
	return ( await creada.json() ).id;
}

// Juga la missió triant l'opció «a» i obre el resultat; torna la resposta del resum.
async function jugaFinsAlResultat( page, titol ) {
	await page.route( POST_RESULTAT, ( route ) =>
		route.fulfill( { status: 204 } )
	);
	// El `test` comú respon també el GET del resum amb 204: aquí ha d'arribar al servidor.
	await page.route( RESUM, ( route ) => route.continue() );
	await senseFullscreen( page );
	await iniciaMissio( page, new RegExp( escapa( titol ) ), /Clica o prem/ );
	await page.getByRole( 'button', { name: /Clica o prem/ } ).click();
	await parla( page )
		.getByRole( 'button', { name: 'Salta la presentació' } )
		.click();
	const { text } = MISSIO_JSON.decisio.opcions.find( ( o ) => o.id === 'a' );
	await parla( page )
		.getByRole( 'button', { name: 'Ja ho tinc clar' } )
		.click();
	await parla( page )
		.getByRole( 'button', { name: new RegExp( `^${ escapa( text ) }` ) } )
		.click();
	const resum = page.waitForResponse( RESUM );
	await page
		.getByRole( 'dialog' )
		.filter( { hasText: 'Veure el resultat' } )
		.getByRole( 'button', { name: 'Veure el resultat' } )
		.click();
	await expect(
		page.getByRole( 'img', { name: /de 3 estrelles/ } )
	).toBeVisible();
	return resum;
}

for ( const ambDades of [ false, true ] ) {
	test(
		ambDades
			? 'amb 20 partides reals el resultat diu quantes persones van triar la mateixa opció'
			: 'sense prou partides el resultat no mostra cap resum',
		async ( { page } ) => {
			test.setTimeout( 240000 );
			const nonce = await entra( page );
			const id = `prova-resum-${ ambDades ? 'dades' : 'buit' }-${ Date.now() }`;
			const titol = `Prova ${ id }`;
			const post = await publica( page, nonce, id, titol );
			try {
				if ( ambDades ) {
					expect( files( 'insereix', id ) ).toContain( 'files: 2' );
				}
				const resposta = await jugaFinsAlResultat( page, titol );
				expect( resposta.status() ).toBe( 200 );
				expect( resposta.request().headers() ).not.toHaveProperty(
					'cookie'
				);
				const comparativa = page.locator( '.nep-res__comparativa' );
				await expect( comparativa ).toHaveAttribute(
					'aria-live',
					'polite'
				);
				if ( ambDades ) {
					// a = 12 de 20 (60 %): franja 60-69 %; b (8 < 10) no surt.
					expect( await resposta.json() ).toStrictEqual( {
						n_banda: '20-49',
						decisions: [ { id: 'a', banda: '60-69 %' } ],
					} );
					await expect( comparativa ).toHaveText(
						'Entre el 60 % i el 69 % de les persones van triar la mateixa opció que tu.'
					);
					await expect( comparativa ).toBeVisible();
					const greus = (
						await new AxeBuilder( { page } )
							.include( '.nep-res' )
							.analyze()
					).violations.filter( ( v ) =>
						[ 'serious', 'critical' ].includes( v.impact )
					);
					expect( greus ).toEqual( [] );
				} else {
					expect( await resposta.json() ).toStrictEqual( {
						prou: false,
					} );
					await expect( comparativa ).toHaveText( '' );
				}
			} finally {
				expect( files( 'neteja', id ) ).toContain( 'files: 0' );
				await page.request.delete(
					`/wp-json/wp/v2/nep_missio/${ post }?force=true`,
					{ headers: { 'X-WP-Nonce': nonce } }
				);
			}
		}
	);
}
