const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyFile(src, dest) {
    ensureDirectoryExists(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

try {
    // Create necessary directories
    ensureDirectoryExists('public/js');
    ensureDirectoryExists('public/css');

    // Copy dependencies
    copyFile(
        'node_modules/jquery/dist/jquery.min.js',
        'public/js/jquery.min.js'
    );
    copyFile(
        'node_modules/select2/dist/js/select2.min.js',
        'public/js/select2.min.js'
    );
    copyFile(
        'node_modules/select2/dist/css/select2.min.css',
        'public/css/select2.min.css'
    );

    // Build tailwind
    execSync('npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify', {
        stdio: 'inherit'
    });

    console.log('Build completed successfully!');
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}