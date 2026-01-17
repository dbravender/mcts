import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const distDir = 'web/dist';

// Create dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build each page's TypeScript
const pages = ['index', 'tictactoe', 'fourinarow'];

for (const page of pages) {
  const entryPoint = `web/src/${page}.ts`;
  if (fs.existsSync(entryPoint)) {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      outfile: `${distDir}/${page}.js`,
      format: 'iife',
      target: ['es2020'],
      minify: false,
      sourcemap: true,
    });
  }
}

// Copy HTML files
const htmlFiles = fs.readdirSync('web/src').filter(f => f.endsWith('.html'));
for (const file of htmlFiles) {
  fs.copyFileSync(`web/src/${file}`, `${distDir}/${file}`);
}

// Copy CSS files
const cssFiles = fs.readdirSync('web/src').filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
  fs.copyFileSync(`web/src/${file}`, `${distDir}/${file}`);
}

console.log('Build complete! Output in web/dist/');
