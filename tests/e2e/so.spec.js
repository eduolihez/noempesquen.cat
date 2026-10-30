const { test, expect } = require( '@playwright/test' );
const { iniciaMissio } = require( './ajudes' );

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

async function entra( page, isMobile ) {
	const { titol, bloqueig } = MISSIONS[ isMobile ? 'mobil' : 'escriptori' ];
	await iniciaMissio( page, titol, bloqueig );
	await page.getByRole( 'button', { name: bloqueig } ).click();
	await expect( page.locator( '.nep-so__sistema' ) ).toBeVisible();
}

const avis = ( page ) => page.locator( '.nep-so [aria-live="polite"]' );
const TRAMPA = { escriptori: /URGENT/, mobil: /paquet/i };

test.describe( 'So de les notificacions', () => {
	test( 'la benvinguda de la guia en desbloquejar no sona', async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		await entra( page, isMobile );
		await expect( avis( page ) ).toContainText( /\S/ );
		await page.clock.runFor( 2000 );
		expect( await osciladors( page ) ).toBe( 0 );
	} );

	test( 'una notificació posterior sona (una nota de 2 tons)', async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		await entra( page, isMobile );
		await expect( avis( page ) ).toContainText( /\S/ );
		const abans = await osciladors( page );
		await page.clock.runFor( 9000 );
		await expect( avis( page ) ).toContainText(
			TRAMPA[ isMobile ? 'mobil' : 'escriptori' ]
		);
		await expect.poll( () => osciladors( page ) ).toBe( abans + 2 );
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
		await expect( avis( page ) ).toContainText( /\S/ );
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
		await expect.poll( () => osciladors( page ) ).toBe( abans + 2 );
	} );
} );
