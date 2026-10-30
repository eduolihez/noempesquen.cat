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
 * @param page
 * @param sons
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

test.describe( 'So de les notificacions', () => {
	test( 'sona amb una notificació nova després d’interactuar', async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		await entra( page, isMobile );
		// En desbloquejar ja arriba una primera notificació (so legítim).
		await expect.poll( () => osciladors( page ) ).toBeGreaterThan( 0 );
		const abans = await osciladors( page );
		await page.clock.runFor( 9000 );
		await expect.poll( () => osciladors( page ) ).toBeGreaterThan( abans );
	} );

	test( 'no sona amb el so desactivat', async ( { page, isMobile } ) => {
		await espiaAudio( page, false );
		await entra( page, isMobile );
		await page.clock.runFor( 9000 );
		await page.waitForTimeout( 300 );
		expect( await osciladors( page ) ).toBe( 0 );
	} );

	test( 'no sona en pausa', async ( { page, isMobile } ) => {
		await espiaAudio( page, true );
		await entra( page, isMobile );
		await page.waitForTimeout( 300 );
		const abans = await osciladors( page );
		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'dialog', { name: /pausa/i } )
		).toBeVisible();
		await page.clock.runFor( 9000 );
		await page.waitForTimeout( 300 );
		expect( await osciladors( page ) ).toBe( abans );
	} );

	test( 'no sona abans de la primera interacció', async ( {
		page,
		isMobile,
	} ) => {
		await espiaAudio( page, true );
		const { titol, bloqueig } =
			MISSIONS[ isMobile ? 'mobil' : 'escriptori' ];
		await iniciaMissio( page, titol, bloqueig );
		// Encara al bloqueig i sense cap gest dins del simulador.
		await page.clock.runFor( 9000 );
		await page.waitForTimeout( 300 );
		expect( await osciladors( page ) ).toBe( 0 );
	} );
} );
