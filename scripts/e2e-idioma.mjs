/**
 * Llança Playwright amb `NEP_LANG` fixat (npm scripts a Windows no accepten
 * `VAR=valor ordre` i no volem dependre de cross-env).
 *
 *   node scripts/e2e-idioma.mjs <es|ca> [arguments de playwright test…]
 */
import { spawnSync } from 'node:child_process';

const [ idioma, ...args ] = process.argv.slice( 2 );
if ( ! [ 'es', 'ca' ].includes( idioma ) ) {
	process.stderr.write( 'Ús: node scripts/e2e-idioma.mjs <es|ca> [args]\n' );
	process.exit( 2 );
}
const r = spawnSync( 'npx', [ 'playwright', 'test', ...args ], {
	stdio: 'inherit',
	shell: process.platform === 'win32',
	env: { ...process.env, NEP_LANG: idioma },
} );
process.exit( r.status ?? 1 );
