import { I18n } from 'i18n-js';
import enUS from './en-US.json';
import ruRU from './ru-RU.json';
import esES from './es-ES.json';
import zhCN from './zh-CN.json';
import hi from './hi.json';
import deDE from './de-DE.json';
import jaJP from './ja-JP.json';
import frFR from './fr-FR.json';

const translations = {
    'en-US': enUS,
    'ru-RU': ruRU,
    'es-ES': esES,
    'zh-CN': zhCN,
    hi: hi,
    'de-DE': deDE,
    'ja-JP': jaJP,
    'fr-FR': frFR
};

export const LANGUAGES: Record<string, string> = {
    'en-US': 'English',
    'ru-RU': 'Русский',
    'es-ES': 'Español',
    'zh-CN': '中文',
    hi: 'हिन्दी',
    'de-DE': 'Deutsch',
    'ja-JP': '日本語',
    'fr-FR': 'Français'
};

export const i18n = new I18n(translations);