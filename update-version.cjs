#!/usr/bin/env node
/* eslint-disable */

const fs = require('fs');
const path = require('path');

// Get the version from command line arguments
const newVersion = process.argv[2];

if (!newVersion) {
    console.error('Error: Please provide a version number as an argument.');
    console.error('Usage: node update-version.js <version>');
    process.exit(1);
}

// Validate version format (optional)
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.warn('Warning: Version does not follow semver format (x.y.z)');
}

// Update package.json
try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    console.log(
        `Updating package.json version from ${packageData.version} to ${newVersion}`
    );
    packageData.version = newVersion;

    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 4) + '\n');
} catch (error) {
    console.error(`Error updating package.json: ${error.message}`);
    process.exit(1);
}

// Update dist/manifest.json
try {
    const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    console.log(
        `Updating manifest.json version from ${manifestData.version} to ${newVersion}`
    );
    manifestData.version = newVersion;

    fs.writeFileSync(
        manifestPath,
        JSON.stringify(manifestData, null, 4) + '\n'
    );
} catch (error) {
    console.error(`Error updating dist/manifest.json: ${error.message}`);
    process.exit(1);
}

// Update src/api/runtime.ts
try {
    const runtimePath = path.join(__dirname, 'src', 'api', 'runtime.ts');
    let runtimeContent = fs.readFileSync(runtimePath, 'utf8');

    // Update SandboxRuntime version
    const sandboxVersionRegex = /(version:\s*['"])([^'"]+)(['"])/;
    const sandboxMatch = runtimeContent.match(sandboxVersionRegex);

    if (sandboxMatch) {
        console.log(
            `Updating SandboxRuntime version from ${sandboxMatch[2]} to ${newVersion}`
        );
        runtimeContent = runtimeContent.replace(
            sandboxVersionRegex,
            `$1${newVersion}$3`
        );
    }

    // Update LocalRuntime version
    const localVersionRegex = /(version:\s*['"])([^'"]+)(['"])/g;
    // Find the second occurrence
    let match;
    let count = 0;
    let lastMatch;

    while ((match = localVersionRegex.exec(runtimeContent)) !== null) {
        count++;
        lastMatch = match;
        if (count === 2) {
            console.log(
                `Updating LocalRuntime version from ${match[2]} to ${newVersion}`
            );
            const beforeMatch = runtimeContent.substring(0, match.index);
            const afterMatch = runtimeContent.substring(
                match.index + match[0].length
            );
            runtimeContent =
                beforeMatch + `version: '${newVersion}'` + afterMatch;
            break;
        }
    }

    fs.writeFileSync(runtimePath, runtimeContent);
} catch (error) {
    console.error(`Error updating src/api/runtime.ts: ${error.message}`);
    process.exit(1);
}

console.log(`Successfully updated version to ${newVersion} in all files.`);
