// Genera el material del vídeo de mostra (MP4 de 6 s, pòster i subtítols VTT) a
// plugins/noempesquen-core/tests/fixtures/videos/. Cal ffmpeg (al PATH o a FFMPEG).
// Ús: node scripts/genera-video-mostra.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';

const SORTIDA = new URL( '../plugins/noempesquen-core/tests/fixtures/videos/', import.meta.url );
const tema = JSON.parse( readFileSync( new URL( '../themes/noempesquen/theme.json', import.meta.url ), 'utf8' ) );
const color = ( slug ) => tema.settings.color.palette.find( ( c ) => c.slug === slug ).color.replace( '#', '0x' );
const FONS = color( 'mar' );
const SENYAL = color( 'senyal' );
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const ruta = ( nom ) => new URL( nom, SORTIDA ).pathname.replace( /^\/([A-Za-z]:)/, '$1' ).replaceAll( '%20', ' ' );

mkdirSync( SORTIDA, { recursive: true } );
// Fons de color del tema amb una barra "senyal" que avança, i un to suau (volum baix).
const filtre = `drawbox=x=0:y=ih-24:w=iw*t/6:h=24:color=${ SENYAL }:t=fill`;
execFileSync( ffmpeg, [
	'-y', '-loglevel', 'error',
	'-f', 'lavfi', '-i', `color=c=${ FONS }:s=640x360:r=25:d=6`,
	'-f', 'lavfi', '-i', 'sine=frequency=220:sample_rate=44100:duration=6',
	'-t', '6', '-vf', filtre, '-af', 'volume=0.08',
	'-c:v', 'libx264', '-preset', 'veryslow', '-crf', '30', '-pix_fmt', 'yuv420p',
	'-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart',
	ruta( 'mostra.mp4' ),
] );
execFileSync( ffmpeg, [
	'-y', '-loglevel', 'error',
	'-f', 'lavfi', '-i', `color=c=${ FONS }:s=640x360:d=1`,
	'-vf', `drawbox=x=0:y=ih-24:w=iw:h=24:color=${ SENYAL }:t=fill`,
	'-frames:v', '1', ruta( 'poster.png' ),
] );

const vtt = ( linies ) => `WEBVTT\n\n${ linies.map( ( [ a, b, t ], i ) => `${ i + 1 }\n${ a } --> ${ b }\n${ t }\n` ).join( '\n' ) }`;
writeFileSync( ruta( 'subtitols-ca.vtt' ), vtt( [
	[ '00:00:00.500', '00:00:02.500', 'Això és un vídeo de mostra.' ],
	[ '00:00:02.500', '00:00:04.500', 'No té cap contingut real.' ],
	[ '00:00:04.500', '00:00:05.900', 'Serveix per provar la pàgina.' ],
] ), 'utf8' );
writeFileSync( ruta( 'subtitols-es.vtt' ), vtt( [
	[ '00:00:00.500', '00:00:02.500', 'Este es un vídeo de muestra.' ],
	[ '00:00:02.500', '00:00:04.500', 'No tiene ningún contenido real.' ],
	[ '00:00:04.500', '00:00:05.900', 'Sirve para probar la página.' ],
] ), 'utf8' );

for ( const f of [ 'mostra.mp4', 'poster.png' ] ) {
	console.log( f, statSync( ruta( f ) ).size, 'bytes' );
}
