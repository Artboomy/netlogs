#!/usr/bin/env node
/*
 Generic i18n merge script
 - Merges/updates a TARGET i18n key into each language object
 - Appends/moves the key to the end of each language object in
   src/translations/translations.json

 Usage:
   node scripts/merge-switch-to-vertical.cjs

 How to use with a new key:
   1) Set TARGET_KEY below (string).
   2) Fill the newValues map with translations per language code.
      Leave languages you don't have out — they will fall back to English
      (or to the first provided translation if English is not present).

 Notes:
 - Preserves top-level language order and appends TARGET_KEY as the last
   property of each language object.
 - If TARGET_KEY already exists, it will be updated and also moved to the end.
*/

/* eslint-disable */
const fs = require('fs');
const path = require('path');

const translationsDir = path.resolve(__dirname, '..', 'src', 'translations');

function getSupportedLanguages() {
    return fs
        .readdirSync(translationsDir)
        .filter((f) => f.endsWith('.json') && f !== 'translations.json')
        .map((f) => path.basename(f, '.json'));
}

function printHelp() {
    const langs = getSupportedLanguages();
    console.log(`
Usage:
  node scripts/translate-and-merge-key.cjs <TARGET_KEY> '<newValuesJSON>'

Arguments:
  TARGET_KEY      The key to add or update in translations
  newValuesJSON   A JSON string mapping language codes to values

Supported languages:
  ${langs.join(', ')}

Example:
  node scripts/translate-and-merge-key.cjs myNewKey '{"en-US": "Hello", "ru-RU": "Привет"}'
`);
}

function readJson(file) {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
}

function writeJson(file, data) {
    const content = JSON.stringify(data, null, 4) + '\n';
    fs.writeFileSync(file, content, 'utf8');
}

function appendAtEnd(obj, key, value) {
    // Rebuild object to ensure key order and append the target key at the end
    const rebuilt = {};
    for (const k of Object.keys(obj)) {
        if (k === key) continue; // skip existing to re-append later
        rebuilt[k] = obj[k];
    }
    rebuilt[key] = value;
    return rebuilt;
}

function run() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h') || args.length < 2) {
        printHelp();
        process.exit(
            args.length < 2 && !args.includes('--help') && !args.includes('-h')
                ? 1
                : 0
        );
    }

    const TARGET_KEY = args[0];
    let newValues;

    try {
        newValues = JSON.parse(args[1]);
    } catch (e) {
        console.error('Error: newValuesJSON must be a valid JSON string.');
        console.error(e.message);
        process.exit(1);
    }

    const langFiles = fs
        .readdirSync(translationsDir)
        .filter((f) => f.endsWith('.json') && f !== 'translations.json');

    if (langFiles.length === 0) {
        console.error('No language files found in', translationsDir);
        process.exit(1);
    }

    for (const file of langFiles) {
        const lang = path.basename(file, '.json');
        const filePath = path.join(translationsDir, file);
        const langObj = readJson(filePath);

        const fallbackValue = Object.prototype.hasOwnProperty.call(
            newValues,
            'en-US'
        )
            ? newValues['en-US']
            : Object.values(newValues)[0]; // fallback to the first provided translation if English is absent

        const value = Object.prototype.hasOwnProperty.call(newValues, lang)
            ? newValues[lang]
            : fallbackValue; // fallback value may be undefined if newValues is empty (ok for template)

        const updated = appendAtEnd(langObj, TARGET_KEY, value);
        writeJson(filePath, updated);
    }

    console.log(
        `Merged \`${TARGET_KEY}\` into`,
        langFiles.length,
        'languages.'
    );
    console.log(
        'Languages:',
        langFiles.map((f) => path.basename(f, '.json')).join(', ')
    );
}

run();
