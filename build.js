import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure dist directory exists
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
}

// Copy popup files
console.log('📁 Copying popup files...');
copyFileSync(
    join(__dirname, 'src/popup/popup.html'),
    join(distDir, 'popup.html')
);
copyFileSync(
    join(__dirname, 'src/popup/popup.css'),
    join(distDir, 'popup.css')
);

console.log('✅ Build assets copied successfully!');
