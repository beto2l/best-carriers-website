import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Reuse MOTUS as the design source so both course surfaces stay identical.
export async function courseSocialProof(root) {
  const css = await readFile(path.join(root, 'src/motus.css'), 'utf8');
  const js = await readFile(path.join(root, 'src/motus.js'), 'utf8');
  const base = css.split('\n').filter(line => line.startsWith('.opinx-social-proof')).join('\n');
  const mobile = css.split('\n').filter(line => line.startsWith('  .opinx-social-proof')).join('\n');
  const tokens = ['ink', 'slate', 'line', 'canvas', 'amber-dark', 'blue-dark'].map(name => {
    const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
    if (!match) throw new Error(`Missing MOTUS social-proof token: ${name}`);
    return `--${name}:${match[1]};`;
  }).join('');
  const start = js.indexOf('  function enhanceSocialProof() {');
  const end = js.indexOf('\n  function ready()', start);
  if (!base || !mobile || start < 0 || end < 0) throw new Error('MOTUS social-proof design source changed; inspect before publishing.');
  return {
    css: `.catalog-proof{${tokens}max-width:1180px;margin-inline:auto;font-size:17px;line-height:1.65;color:var(--ink)}\n${base}\n.catalog-proof .opinx-social-proof__more{text-decoration:underline}\n@media(max-width:760px){\n${mobile}\n}`,
    js: `(() => {\n${js.slice(start, end)}\nenhanceSocialProof();\n})();`
  };
}
