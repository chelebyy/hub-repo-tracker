import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..'); // backend dir
const projectRoot = path.resolve(rootDir, '..'); // project root (where README is)
const frontendDir = path.resolve(rootDir, '../frontend');
const backendDistDir = path.join(rootDir, 'dist');
const publicDir = path.join(backendDistDir, 'public');

console.log('🚀 Starting Unified Build Process...');

// 1. Build Frontend
console.log('\n📦 Building Frontend...');
try {
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Frontend build failed!');
    process.exit(1);
}

// 2. Build Backend
console.log('\n📦 Building Backend...');
try {
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Backend build failed!');
    process.exit(1);
}

// 3. Copy Assets (Frontend -> Backend/public)
console.log('\n📂 Copying Frontend assets to Backend...');
try {
    if (fs.existsSync(publicDir)) {
        fs.rmSync(publicDir, { recursive: true, force: true });
    }
    fs.mkdirSync(publicDir, { recursive: true });

    const frontendDist = path.join(frontendDir, 'dist');

    if (!fs.existsSync(frontendDist)) {
        throw new Error(`Frontend dist folder not found at ${frontendDist}`);
    }

    fs.cpSync(frontendDist, publicDir, { recursive: true });
    console.log('✅ Assets copied successfully.');
} catch (error) {
    console.error('❌ Asset copy failed:', error);
    process.exit(1);
}

// 4. Copy Meta Files (README, LICENSE)
console.log('\n📄 Copying Meta Files (README, LICENSE)...');
try {
    const filesToCopy = ['README.md', 'LICENSE'];
    filesToCopy.forEach(file => {
        const source = path.join(projectRoot, file);
        const dest = path.join(rootDir, file);
        if (fs.existsSync(source)) {
            fs.copyFileSync(source, dest);
            console.log(`✅ Copied ${file}`);
        } else {
            console.warn(`⚠️  Warning: ${file} not found in project root.`);
        }
    });
} catch (error) {
    console.error('❌ Meta file copy failed:', error);
    // Don't fail build for this, just warn
}

console.log('\n✨ Unified build complete! Run "npx hub-repo-tracker" to test.');
