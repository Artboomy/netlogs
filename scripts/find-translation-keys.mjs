/* eslint-disable */
import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Regular expression to match i18n.t() calls
// Handles both i18n.t('key') and i18n.t<string>('key') patterns
const i18nKeyRegex = /i18n\.t(?:<string>)?\(['"]([\w.]+)['"]/g;

async function findFiles(dir) {
    const files = await fs.readdir(dir);
    const results = [];

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
            results.push(...(await findFiles(filePath)));
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
            results.push(filePath);
        }
    }

    return results;
}

async function extractKeys(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const keys = new Set();
    let match;

    while ((match = i18nKeyRegex.exec(content)) !== null) {
        keys.add(match[1]);
    }

    return Array.from(keys);
}

async function loadTranslations() {
    const translationsDir = path.join(__dirname, 'src', 'translations');
    const langFiles = (await fs.readdir(translationsDir)).filter(
        (f) => f.endsWith('.json') && f !== 'translations.json'
    );

    const translations = {};
    for (const file of langFiles) {
        const lang = path.basename(file, '.json');
        const content = await fs.readFile(
            path.join(translationsDir, file),
            'utf-8'
        );
        translations[lang] = JSON.parse(content);
    }
    return translations;
}

async function main() {
    try {
        // Get all translation keys from the code
        const sourceDir = path.join(__dirname, 'src');
        const files = await findFiles(sourceDir);
        const usedKeys = new Set();

        for (const file of files) {
            const keys = await extractKeys(file);
            keys.forEach((key) => usedKeys.add(key));
        }

        // Load translations file
        const translations = await loadTranslations();
        const definedKeys = new Set(Object.keys(translations['en-US']));

        // Find unused keys
        const unusedKeys = new Set(
            [...definedKeys].filter((x) => !usedKeys.has(x))
        );

        // Find undefined keys (used in code but not in translations)
        const undefinedKeys = new Set(
            [...usedKeys].filter((x) => !definedKeys.has(x))
        );

        console.log('=== Translation Keys Analysis ===');
        console.log('\nUsed keys:', usedKeys.size);
        console.log([...usedKeys]);

        console.log('\nUnused keys:', unusedKeys.size);
        console.log([...unusedKeys]);

        if (undefinedKeys.size > 0) {
            console.log('\nWARNING - Undefined keys:', undefinedKeys.size);
            console.log([...undefinedKeys]);
        }

        // Create a new translations object without unused keys
        const cleanTranslations = {};
        for (const [lang, trans] of Object.entries(translations)) {
            cleanTranslations[lang] = {};
            for (const [key, value] of Object.entries(trans)) {
                if (usedKeys.has(key)) {
                    cleanTranslations[lang][key] = value;
                }
            }
        }

        // Save clean translations to new files
        const translationsDir = path.join(__dirname, 'src', 'translations');
        for (const [lang, trans] of Object.entries(cleanTranslations)) {
            const filePath = path.join(translationsDir, `${lang}.json`);
            await fs.writeFile(filePath, JSON.stringify(trans, null, 4) + '\n');
        }

        console.log('\nClean translations files have been saved.');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
