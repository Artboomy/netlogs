import { Theme } from './types';
import { google } from 'base16';

export const theme: Theme = {
    name: 'light',
    mainBg: '#FEFEFE',
    mainFont: google.base00,
    dateColor: google.base02,
    panelColor: 'rgb(243, 243, 243)',
    borderColor: '#ccc',
    icon: {
        normal: '#6e6e6e',
        hover: '#5a5a5a'
    },
    section: {
        key: 'rgb(33% 33% 33%)'
    },
    accent: 'rgb(26, 115, 232)',
    rowHover: '#1a73e81a',
    graphql: '#e535ab',
    phoenixLiveView: '#ee765d', // '#634872',
    oddRowBg: 'rgba(245, 245, 245)',
    inactiveTag: google.base00,
    linkColor: '',
    linkVisitedColor: '',
    valueNumber: 'rgb(28, 0, 207)',
    valueString: 'rgb(196, 26, 22)',
    kbdBg: '#eee'
};
