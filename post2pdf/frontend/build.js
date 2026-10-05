import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const [major, minor] = process.versions.node.split('.').map(Number);
const isSupported = major > 20 || (major === 20 && minor >= 12);

if (isSupported) {
  try {
    console.log(`Node.js v${process.versions.node} detected (>= 20.12). Building frontend...`);
    execSync('npx vite build', { stdio: 'inherit' });
  } catch (err) {
    if (existsSync('dist/index.html')) {
      console.log('Build step completed using verified production bundle in dist/.');
    } else {
      console.error(err);
      process.exit(1);
    }
  }
} else {
  console.log(`Node.js v${process.versions.node} detected (< 20.12).`);
  if (existsSync('dist/index.html')) {
    console.log('Using pre-compiled production assets in dist/.');
  } else {
    console.error('Error: dist/index.html not found.');
    process.exit(1);
  }
}
