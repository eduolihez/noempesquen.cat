const { test, expect } = require( './ajudes' );
const {
	greusAxe,
	iniciaMissio,
	petits,
	saltaIntro,
	senseFullscreen,
} = require( './ajudes' );

const MISSIONS = {
	escriptori: {
		titol: /La factura de la llum/,
		bloqueig: /Clica o prem/,
	},
	mobil: { titol: /El paquet retingut/, bloqueig: /Llisca cap amunt/ },
};

/**
 * AudioContext espia: compta els osciladors creats (abans de carregar).
 * @param {import('@playwright/test').Page} page
 * @param {boolean}                         sons Si el so està activat.
 */
async function espiaAudio( page, sons ) {
	// El so i l'anunci arriben quan l'avís entra a la vista, i fins que el
	// bloqueig no es desmunta no n'entra cap. Amb el rellotge fals l'animació
	// de sortida del bloqueig no acaba: sense moviment es desmunta de seguida.
	await page.emulateMedia( { reducedMotion: 'reduce' } );
	await page.addInitScript( ( valor ) => {
		window.__osciladors = 0;
		class AudioEspia {
			constructor() {
				this.state = 'running';
				this.currentTime = 0;
				this.destination = {};
			}
			createOscillator() {
				window.__osciladors++;
				return {
					type: '',
					frequency: { setValueAtTime() {} },
					connect() {},
					start() {},
					stop() {},
				};
			}
			createGain() {
				return {
					gain: {
						setValueAtTime() {},
						linearRampToValueAtTime() {},
					},
					connect() {},
				};
			}
			resume() {
				return Promise.resolve();
			}
			close() {
				return Promise.resolve();
			}
		}
		window.AudioContext = AudioEspia;
		window.webkitAudioContext = AudioEspia;
		if ( valor === false ) {
			window.localStorage.setItem( 'noempesquen-sons', 'false' );
		}
	}, sons );
}

const osciladors = ( page ) => page.evaluate( () => window.__osciladors );

// Per defecte salta la intro: cap avís programat surt abans de la fi de la
// intro + MS_TRAS_INTRO.
async function entra( page, isMobile, salta = true ) {
	const { titol, bloqueig } = MISSIONS[ isMobile ? 'mobil' : 'escriptori' ];
	await iniciaMissio( page, titol, bloqueig );
	await page.getByRole( 'button', { name: bloqueig } ).click();
	await expect( page.locator( '.nep-so__sistema' ) ).toBeVisible();
	if ( salta ) {
		await saltaIntro( page );
	}
}

// La trampa és un avís de risc: to «alerta» (3 osciladors; «missatge» en té 2).
const NOTES_ALERTA = 3;

const avis = ( page ) => page.locator( '.nep-so [aria-live="polite"]:not(.nep-avis-lupa)' );
const TRAMPA = { escriptori: /URGENT/, mobil: /paquet/i };

test.describe( 'So de les notificacions', () => {
	test( 'la benvinguda de la guia en desbloquejar no sona', async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		await entra( page, isMobile, false );
		await page.clock.runFor( 500 );
		await page.clock.runFor( 2000 );
		expect( await osciladors( page ) ).toBe( 0 );
	} );

	test( 'la notificació trampa sona amb el to «alerta» (3 notes)', async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		await entra( page, isMobile );
		await page.clock.runFor( 500 );
		const abans = await osciladors( page );
		await page.clock.runFor( 9000 );
		await expect( avis( page ) ).toContainText(
			TRAMPA[ isMobile ? 'mobil' : 'escriptori' ]
		);
		await expect.poll( () => osciladors( page ) ).toBe( abans + NOTES_ALERTA );
	} );

	test( 'no sona amb el so desactivat', async ( { page, isMobile } ) => {
		await espiaAudio( page, false );
		await entra( page, isMobile );
		await page.clock.runFor( 9000 );
		await expect( avis( page ) ).toContainText(
			TRAMPA[ isMobile ? 'mobil' : 'escriptori' ]
		);
		expect( await osciladors( page ) ).toBe( 0 );
	} );

	test( 'en pausa no sona i en continuar sí', async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		await entra( page, isMobile );
		await page.clock.runFor( 500 );
		const abans = await osciladors( page );
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'dialog', { name: /pausa/i } )
		).toBeVisible();
		await page.clock.runFor( 9000 );
		expect( await osciladors( page ) ).toBe( abans );
		await page.getByRole( 'button', { name: /Continua/ } ).click();
		await page.clock.runFor( 9000 );
		await expect( avis( page ) ).toContainText(
			TRAMPA[ isMobile ? 'mobil' : 'escriptori' ]
		);
		await expect.poll( () => osciladors( page ) ).toBe( abans + NOTES_ALERTA );
	} );

	test( "l'interruptor de la pausa apaga el so i ho recorda", async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		await entra( page, isMobile );
		await page.clock.runFor( 500 );
		await page.keyboard.press( 'Escape' );
		const pausa = page.getByRole( 'dialog', { name: /pausa/i } );
		await expect( pausa ).toBeVisible();
		const so = pausa.getByRole( 'switch', {
			name: /So de les notificacions/,
		} );
		await expect( so ).toHaveAttribute( 'aria-checked', 'true' );
		expect( await greusAxe( page ) ).toEqual( [] );
		expect( await petits( page ) ).toEqual( [] );
		await so.click();
		await expect( so ).toHaveAttribute( 'aria-checked', 'false' );
		expect(
			await page.evaluate( () =>
				window.localStorage.getItem( 'noempesquen-sons' )
			)
		).toBe( 'false' );
		await pausa.getByRole( 'button', { name: /Continua/ } ).click();
		await expect( pausa ).toBeHidden();
		await page.keyboard.press( 'Escape' );
		await expect( pausa ).toBeVisible();
		await expect( so ).toHaveAttribute( 'aria-checked', 'false' );
		await so.focus();
		await page.keyboard.press( 'Space' );
		await expect( so ).toHaveAttribute( 'aria-checked', 'true' );
		await page.keyboard.press( 'Space' );
		await expect( so ).toHaveAttribute( 'aria-checked', 'false' );
		await pausa.getByRole( 'button', { name: /Continua/ } ).click();
		await expect( pausa ).toBeHidden();
		await page.clock.runFor( 9000 );
		await expect( avis( page ) ).toContainText(
			TRAMPA[ isMobile ? 'mobil' : 'escriptori' ]
		);
		expect( await osciladors( page ) ).toBe( 0 );
		if ( isMobile ) {
			await page
				.getByRole( 'list', { name: 'Apps', exact: true } )
				.getByRole( 'button', { name: 'Ajustos' } )
				.click();
			const a = page.getByRole( 'region', { name: 'Ajustos' } );
			await a.getByRole( 'button', { name: 'So', exact: true } ).click();
			await expect(
				a.getByRole( 'switch', { name: 'Sons de notificació' } )
			).toHaveAttribute( 'aria-checked', 'false' );
		}
	} );

	test( 'sense cap interacció prèvia no sona', async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		const { titol, bloqueig } =
			MISSIONS[ isMobile ? 'mobil' : 'escriptori' ];
		await iniciaMissio( page, titol, bloqueig );
		// Només l'esdeveniment click: cap pointerdown ni tecla dins del joc.
		await page
			.getByRole( 'button', { name: bloqueig } )
			.dispatchEvent( 'click' );
		await expect( page.locator( '.nep-so__sistema' ) ).toBeVisible();
		await saltaIntro( page, { nomesClick: true } );
		await page.clock.runFor( 9000 );
		await expect( avis( page ) ).toContainText(
			TRAMPA[ isMobile ? 'mobil' : 'escriptori' ]
		);
		expect( await osciladors( page ) ).toBe( 0 );
	} );

	test( 'PC demanant girar: no sona ni en tornar, i després sí', async ( {
		page,
	}, testInfo ) => {
		test.skip(
			! testInfo.project.name.includes( 'horitzontal' ),
			'Només al projecte mòbil horitzontal'
		);
		await page.setViewportSize( { width: 915, height: 412 } );
		await senseFullscreen( page );
		await espiaAudio( page, true );
		await entra( page, false );
		await page.clock.runFor( 500 );
		await page.clock.runFor( 2000 );
		const abans = await osciladors( page );

		await page.setViewportSize( { width: 412, height: 915 } );
		const girar = page.getByRole( 'alertdialog', {
			name: 'Gira el mòbil',
		} );
		await expect( girar ).toBeVisible();
		// Si el joc no s'aturés, el correu trampa arribaria ara (i en
		// silenci, perquè compta com a pausa).
		await page.clock.runFor( 20000 );
		expect( await osciladors( page ) ).toBe( abans );

		await page.setViewportSize( { width: 915, height: 412 } );
		await expect( girar ).toBeHidden();
		expect( await osciladors( page ) ).toBe( abans );
		await page.clock.runFor( 9000 );
		await expect( avis( page ) ).toContainText( TRAMPA.escriptori );
		await expect.poll( () => osciladors( page ) ).toBe( abans + NOTES_ALERTA );
	} );
} );
