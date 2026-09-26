import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let html=await readFile(path.join(root,'pages/cursos/index.html'),'utf8');
for (const [key,file] of [['best-carriers-course-catalog-es','catalog.html'],['best-carriers-social-proof-es','proof.html']]) {
  const rendered=await readFile(path.join(root,'preview',file),'utf8');
  html=html.replace(new RegExp(`<opinx-component data-opinx-global-content="${key}">[\\s\\S]*?</opinx-component>`),()=>rendered);
}
// The preview is a public-data snapshot, never an indexable duplicate production page.
html=html.replace('content="index,follow,max-image-preview:large"','content="noindex,nofollow"');
await mkdir(path.join(root,'preview'),{recursive:true});
await writeFile(path.join(root,'preview/index.html'),html);
console.log('Preview built from the real WordPress course and Reviews Hub renderers.');
