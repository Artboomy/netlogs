#!/usr/bin/env node
/**
 * Check if dist/manifest.json and src/api/runtime.ts contain dev build numbers
 * Prevents committing versions like "2.10.0.123"
 * Exit code 0: OK to commit (3-part versions like "2.10.0")
 * Exit code 1: Found dev build number (4-part version), blocked
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../dist/manifest.json');
const runtimePath = path.resolve(__dirname, '../src/api/runtime.ts');

let hasErrors = false;

// Check manifest.json
if (!fs.existsSync(manifestPath)) {
    console.log('ℹ️  dist/manifest.json not found, skipping check');
} else {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const version = manifest.version;

        // Check if version has 4 parts (e.g., "2.10.0.123")
        const parts = version.split('.');

        if (parts.length === 4) {
            console.error('❌ ERROR: manifest.json has 4-part dev build version');
            console.error(`   Found version: ${version}`);
            hasErrors = true;
        } else if (parts.length === 3) {
            console.log(`✅ manifest.json version OK: ${version}`);
        } else {
            console.warn(`⚠️  Unexpected manifest.json version format: ${version}`);
            hasErrors = true;
        }
    } catch (error) {
        console.error('❌ Failed to check manifest.json:', error.message);
        hasErrors = true;
    }
}

// Check runtime.ts
if (!fs.existsSync(runtimePath)) {
    console.log('ℹ️  src/api/runtime.ts not found, skipping check');
} else {
    try {
        const runtimeContent = fs.readFileSync(runtimePath, 'utf-8');
        const versionMatches = runtimeContent.match(/version: '([^']+)'/g);

        if (versionMatches && versionMatches.length > 0) {
            let runtimeOK = true;
            versionMatches.forEach((match) => {
                const version = match.match(/version: '([^']+)'/)[1];
                const parts = version.split('.');

                if (parts.length === 4) {
                    console.error('❌ ERROR: runtime.ts has 4-part dev build version');
                    console.error(`   Found version: ${version}`);
                    hasErrors = true;
                    runtimeOK = false;
                } else if (parts.length !== 3) {
                    console.warn(`⚠️  Unexpected runtime.ts version format: ${version}`);
                    hasErrors = true;
                    runtimeOK = false;
                }
            });

            if (runtimeOK) {
                console.log(`✅ runtime.ts versions OK`);
            }
        }
    } catch (error) {
        console.error('❌ Failed to check runtime.ts:', error.message);
        hasErrors = true;
    }
}

if (hasErrors) {
    console.error('');
    console.error('   Run the following command to fix:');
    console.error('   node scripts/strip-manifest-timestamp.cjs');
    console.error('');
    console.error('   Or the pre-commit hook will auto-fix it.');
    process.exit(1);
}

process.exit(0);
