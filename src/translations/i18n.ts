import { I18n } from 'i18n-js';
import enUS from './en-US.json';
import ruRU from './ru-RU.json';
import esES from './es-ES.json';
import zhCN from './zh-CN.json';
import hi from './hi.json';
import deDE from './de-DE.json';
import jaJP from './ja-JP.json';

const translations = {
    'en-US': enUS,
    'ru-RU': ruRU,
    'es-ES': esES,
    'zh-CN': zhCN,
    hi: hi,
    'de-DE': deDE,
    'ja-JP': jaJP
};

export const i18n = new I18n(translations);
