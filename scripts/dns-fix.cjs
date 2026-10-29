/**
 * wp-env comprova la connexió amb dns.resolve() (c-ares), que en alguns
 * Windows falla tot i tenir Internet. Si falla, provem amb dns.lookup()
 * (el resolutor del sistema, el mateix que fan servir curl i el navegador).
 */
const dns = require( 'dns' );
const original = dns.promises.resolve.bind( dns.promises );

dns.promises.resolve = async ( hostname, ...rest ) => {
	try {
		return await original( hostname, ...rest );
	} catch ( error ) {
		const { address } = await dns.promises.lookup( hostname );
		return [ address ];
	}
};
