const { test, expect } = require( './ajudes' );
const {
	greusAxe,
	greusAxePc,
	inspecciona,
	iniciaMissio,
	esHoritzontal,
} = require( './ajudes' );

const BLOQUEIG_PC = /Clica o prem/;
const BLOQUEIG_MOBIL = /Llisca cap amunt/;

const barraTasques = ( page ) =>
	page.getByRole( 'navigation', { name: 'Barra de tasques' } );
const parla = ( page ) => page.getByRole( 'region', { name: 'Parla' } );
const avisLupa = ( page ) => page.locator( '.nep-so p.nep-avis-lupa' );
// Regions vives (status o aria-live) per comprovar que no hi ha doble anunci.
const regionsVives = ( page ) =>
	page.locator( '.nep-so [role="status"], .nep-so [aria-live="polite"]' );

// Amb el rellotge fals, l'animationend del bloqueig no arriba.
test.use( { reducedMotion: 'reduce' } );

test.describe( 'lupa al PC', () => {
	test.beforeEach( ( { page } ) => {
		test.skip( ! esHoritzontal( page ), 'PC en vertical: demana girar' );
	} );

	async function entra( page ) {
		await iniciaMissio( page, /Actualitza el navegador/, BLOQUEIG_PC );
		await page.getByRole( 'button', { name: BLOQUEIG_PC } ).click();
		await expect( parla( page ) ).toBeVisible();
		await parla( page )
			.getByRole( 'button', { name: 'Salta la presentació' } )
			.click();
		await barraTasques( page )
			.getByRole( 'button', { name: /^Navegador/ } )
			.click();
		await page.mouse.move( 0, 0 );
	}

	test( 'botó visible amb comptador, xip i indici que puja', async ( {
		page,
	} ) => {
		await entra( page );
		const lupa = barraTasques( page ).getByRole( 'button', {
			name: 'Lupa, 0 de 4 indicis',
		} );
		await expect( lupa ).toBeVisible();
		await expect( lupa ).toContainText( 'Lupa' );
		await expect( lupa ).toContainText( '0/4' );
		const caixa = await lupa.boundingBox();
		expect( caixa.height ).toBeGreaterThanOrEqual( 24 );
		expect( caixa.width ).toBeGreaterThanOrEqual( 24 );

		await lupa.click();
		await expect( lupa ).toHaveAttribute( 'aria-pressed', 'true' );

		const indici = inspecciona(
			page,
			'El teu navegador està desactualitzat.'
		);
		await indici.click();
		await expect(
			barraTasques( page ).getByRole( 'button', {
				name: 'Lupa, 1 de 4 indicis',
			} )
		).toContainText( '1/4' );
		await expect( indici ).toHaveAttribute( 'data-xip', 'Pista trobada' );
		await expect( avisLupa( page ) ).toHaveText( /^Pista trobada/ );

		await indici.click();
		await expect( indici ).toHaveAttribute( 'data-xip', 'Ja la tenies' );

		const normal = inspecciona( page, 'Matí: sol, 14 °C' );
		await normal.click();
		await expect( normal ).toHaveAttribute( 'data-xip', 'Sembla normal' );
		await expect( indici ).not.toHaveAttribute( 'data-xip' );
		await expect( avisLupa( page ) ).toHaveText( 'Sembla normal' );
		await expect(
			regionsVives( page ).filter( {
				hasText: 'Sembla normal',
			} )
		).toHaveCount( 1 );

		// El xip se'n va sol.
		await page.clock.runFor( 2000 );
		await expect( normal ).not.toHaveAttribute( 'data-xip' );

		expect( await greusAxePc( page ) ).toEqual( [] );
	} );
} );

test.describe( 'lupa al mòbil', () => {
	test.beforeEach( ( { isMobile } ) => {
		test.skip( ! isMobile, 'Només al projecte mòbil' );
	} );

	const ullada = ( page ) => page.getByRole( 'region', { name: 'Ullada' } );

	async function entra( page ) {
		await iniciaMissio( page, /Has guanyat un sorteig!/, BLOQUEIG_MOBIL );
		await page.getByRole( 'button', { name: BLOQUEIG_MOBIL } ).click();
		await page
			.getByRole( 'list', { name: 'Apps', exact: true } )
			.getByRole( 'button', { name: 'Ullada' } )
			.click();
		await expect( ullada( page ) ).toBeVisible();
	}

	test( 'botó visible sense obrir menús, comptador i xip', async ( {
		page,
	} ) => {
		await entra( page );
		const lupa = page.getByRole( 'button', {
			name: 'Lupa, 0 de 7 indicis',
		} );
		await expect( lupa ).toBeVisible();
		await expect( lupa ).toContainText( '0/7' );
		const caixa = await lupa.boundingBox();
		expect( caixa.height ).toBeGreaterThanOrEqual( 44 );
		expect( caixa.width ).toBeGreaterThanOrEqual( 44 );

		await lupa.click();
		await expect( lupa ).toHaveAttribute( 'aria-pressed', 'true' );

		await inspecciona( page, '@cal.roig.botlga' ).click();
		await expect(
			page.getByRole( 'button', { name: 'Lupa, 1 de 7 indicis' } )
		).toContainText( '1/7' );

		const normal = inspecciona( page, 'ha triat el teu número!' );
		await normal.click();
		await expect( normal ).toHaveAttribute( 'data-xip', 'Sembla normal' );
		await expect( avisLupa( page ) ).toHaveText( 'Sembla normal' );

		expect( await greusAxe( page ) ).toEqual( [] );
	} );
} );
