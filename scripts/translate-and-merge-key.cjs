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

const fs = require('fs');
const path = require('path');

const translationsPath = path.resolve(__dirname, '..', 'src', 'translations', 'translations.json');

// LLM: set the key you want to merge into translations
const TARGET_KEY = '';

/**
 * LLM: Provide translations for TARGET_KEY per language code, e.g.
 * {
 *   'en-US': 'English text',
 *   'ru-RU': 'Русский текст',
 *   ...
 * }
 */
const newValues = {
  // LLM: place new translations here
};

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
  if (!fs.existsSync(translationsPath)) {
    console.error('translations.json not found at', translationsPath);
    process.exit(1);
  }

  const original = readJson(translationsPath);

  const out = {};
  for (const lang of Object.keys(original)) {
    const langObj = original[lang] || {};
    const fallbackValue = Object.prototype.hasOwnProperty.call(newValues, 'en-US')
      ? newValues['en-US']
      : Object.values(newValues)[0]; // fallback to the first provided translation if English is absent

    const value = Object.prototype.hasOwnProperty.call(newValues, lang)
      ? newValues[lang]
      : fallbackValue; // fallback value may be undefined if newValues is empty (ok for template)

    const updated = appendAtEnd(langObj, TARGET_KEY, value);
    out[lang] = updated;
  }

  writeJson(translationsPath, out);

  console.log(`Merged \`${TARGET_KEY}\` into`, Object.keys(original).length, 'languages.');
  console.log('Languages:', Object.keys(original).join(', '));
}

run();
