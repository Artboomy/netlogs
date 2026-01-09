#!/usr/bin/env node
/**
 * Strip dev build number from dist/manifest.json and src/api/runtime.ts versions
 * Converts "2.10.0.123" to "2.10.0"
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../dist/manifest.json');
const runtimePath = path.resolve(__dirname, '../src/api/runtime.ts');

let hasChanges = false;

// Process manifest.json
if (!fs.existsSync(manifestPath)) {
    console.log('ℹ️  dist/manifest.json not found, skipping');
} else {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const originalVersion = manifest.version;

        // Check if version has 4 parts (e.g., "2.10.0.123")
        const parts = originalVersion.split('.');

        if (parts.length === 4) {
            // Strip fourth number
            const cleanVersion = parts.slice(0, 3).join('.');
            manifest.version = cleanVersion;
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4) + '\n');
            console.log(`🔧 Stripped dev build number from manifest.json`);
            console.log(`   ${originalVersion} → ${cleanVersion}`);
            hasChanges = true;
        } else if (parts.length === 3) {
            console.log(`ℹ️  manifest.json version already clean: ${originalVersion}`);
        } else {
            console.warn(`⚠️  Unexpected manifest.json version format: ${originalVersion}`);
        }
    } catch (error) {
        console.error('❌ Failed to process manifest.json:', error.message);
        process.exit(1);
    }
}

// Process runtime.ts
if (!fs.existsSync(runtimePath)) {
    console.log('ℹ️  src/api/runtime.ts not found, skipping');
} else {
    try {
        let runtimeContent = fs.readFileSync(runtimePath, 'utf-8');
        const versionMatches = runtimeContent.match(/version: '([^']+)'/g);

        if (versionMatches && versionMatches.length > 0) {
            let runtimeChanged = false;
            const updatedContent = runtimeContent.replace(
                /version: '([^']+)'/g,
                (match, version) => {
                    const parts = version.split('.');
                    if (parts.length === 4) {
                        const cleanVersion = parts.slice(0, 3).join('.');
                        console.log(`🔧 Stripped dev build number from runtime.ts`);
                        console.log(`   ${version} → ${cleanVersion}`);
                        runtimeChanged = true;
                        hasChanges = true;
                        return `version: '${cleanVersion}'`;
                    }
                    return match;
                }
            );

            if (runtimeChanged) {
                fs.writeFileSync(runtimePath, updatedContent);
            } else {
                console.log(`ℹ️  runtime.ts versions already clean`);
            }
        }
    } catch (error) {
        console.error('❌ Failed to process runtime.ts:', error.message);
        process.exit(1);
    }
}

if (!hasChanges) {
    console.log('✅ All versions are clean');
}

process.exit(0);
