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
    const translationsPath = path.join(
        __dirname,
        'src',
        'translations',
        'translations.json'
    );
    const content = await fs.readFile(translationsPath, 'utf-8');
    return JSON.parse(content);
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

        // Save clean translations to a new file
        const cleanTranslationsPath = path.join(
            __dirname,
            'clean-translations.json'
        );
        await fs.writeFile(
            cleanTranslationsPath,
            JSON.stringify(cleanTranslations, null, 4)
        );

        console.log(
            '\nClean translations file has been saved to:',
            cleanTranslationsPath
        );
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
