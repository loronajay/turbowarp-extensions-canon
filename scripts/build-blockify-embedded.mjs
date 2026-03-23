import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, 'blockify-turbowarp.js');
const outDir = path.join(repoRoot, 'dist');
const outFile = path.join(outDir, 'blockify-turbowarp.embedded.js');

const source = await readFile(sourcePath, 'utf8');
const entry = `
import * as ScratchBlocks from 'scratch-blocks';

globalThis.__blockifyScratchBlocks = ScratchBlocks;

${source}
`;

await mkdir(outDir, { recursive: true });

await build({
  stdin: {
    contents: entry,
    resolveDir: repoRoot,
    sourcefile: 'blockify-turbowarp.embedded.entry.js',
    loader: 'js'
  },
  bundle: true,
  outfile: outFile,
  format: 'iife',
  platform: 'browser',
  target: ['es2020']
});

console.log(`Built ${outFile}`);
