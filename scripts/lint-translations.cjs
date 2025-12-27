#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const translationsDir = path.resolve(__dirname, '..', 'src', 'translations');

function readJson(file) {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
}

function run() {
    const langFiles = fs
        .readdirSync(translationsDir)
        .filter((f) => f.endsWith('.json') && f !== 'translations.json');

    if (langFiles.length === 0) {
        console.error('No language files found in', translationsDir);
        process.exit(1);
    }

    const translations = langFiles.map((file) => ({
        name: file,
        content: readJson(path.join(translationsDir, file))
    }));

    const allKeys = new Set();
    translations.forEach((t) => {
        Object.keys(t.content).forEach((key) => allKeys.add(key));
    });

    let hasErrors = false;
    const sortedKeys = Array.from(allKeys).sort();

    translations.forEach((t) => {
        const missingKeys = sortedKeys.filter(
            (key) => !Object.prototype.hasOwnProperty.call(t.content, key)
        );
        if (missingKeys.length > 0) {
            hasErrors = true;
            console.error(`\x1b[31m[ERROR]\x1b[0m ${t.name} is missing keys:`);
            missingKeys.forEach((key) => {
                console.error(`  - ${key}`);
            });
            console.error('');
        }
    });

    if (hasErrors) {
        process.exit(1);
    } else {
        console.log(
            '\x1b[32m[SUCCESS]\x1b[0m All translation files have consistent keys.'
        );
    }
}

run();
