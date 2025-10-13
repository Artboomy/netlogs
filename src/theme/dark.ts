// source: https://github.com/PlusMinus0/base16-darcula-scheme/blob/master/scheme.yaml
// "Matthias Brandt (github.com/PlusMinus0) based on Darcula theme by Konstantin Bulenkov (github.com/bulenkov/Darcula)"
import { Theme } from './types';

export const base16Darcula = {
    base00: '#2B2B2B', // Default Background
    base01: '#323232', // Lighter Background (Used for status bars)
    base02: '#214283', // Selection Background
    base03: '#808080', // Comments, Invisibles, Line Highlighting
    base04: '#D0D0D0', // Dark Foreground (Used for status bars)
    base05: '#D8D8D8', // Default Foreground, Caret, Delimiters, Operators
    base06: '#E8E8E8', // Light Foreground (Not often used)
    base07: '#F8F8F8', // Light Background (Not often used)
    base08: '#79ABFF', // Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
    base09: '#9876AA', // Integers, Boolean, Constants, XML Attributes, Markup Link Url
    base0A: '#A9B7C6', // Classes, Markup Bold, Search Text Background
    base0B: '#A5C25C', // Strings, Inherited Class, Markup Code, Diff Inserted
    base0C: '#629755', // Support, Regular Expressions, Escape Characters, Markup Quotes
    base0D: '#FFC66D', // Functions, Methods, Attribute IDs, Headings
    base0E: '#CC7832', // Keywords, Storage, Selector, Markup Italic, Diff Changed
    base0F: '#D25252' // Deprecated, Opening/Closing Embedded Language Tags, e.g. <?php ?>
};

export const theme: Theme = {
    name: 'dark',
    mainBg: base16Darcula.base00,
    mainFont: base16Darcula.base05,
    dateColor: base16Darcula.base0B,
    panelColor: base16Darcula.base01,
    borderColor: 'rgb(71, 71, 71)',
    // TODO
    icon: {
        normal: '#6e6e6e',
        hover: '#5a5a5a'
    },
    section: {
        key: base16Darcula.base03
    },
    accent: base16Darcula.base08,
    rowHover: '#1a73e81a',
    graphql: '#e535ab',
    phoenixLiveView: '#ee765d',
    oddRowBg: base16Darcula.base01,
    inactiveTag: base16Darcula.base03,
    linkColor: base16Darcula.base08,
    linkVisitedColor: base16Darcula.base09,
    valueNumber: base16Darcula.base08,
    valueString: base16Darcula.base0F,
    kbdBg: base16Darcula.base00
};
