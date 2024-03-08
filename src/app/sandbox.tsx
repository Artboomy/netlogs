import React from 'react';
import ReactDOM from 'react-dom';
import { PanelMain } from 'components/PanelMain';
import { callParent, callParentVoid, isMacOs } from '../utils';

import EventsController from 'controllers/events';

EventsController.subscribe();

callParent('onIframeReady').then(() => {
    ReactDOM.render(<PanelMain />, document.getElementById('root'));
});

const F5_CODE = 'F5';
const F_CODE = 'KeyF';
const U_CODE = 'KeyU';
const L_CODE = 'KeyL';
const P_CODE = 'KeyP';

// Since we are in iframe, F5 event for inspected page should be hoisted manually
document.addEventListener('keydown', (e) => {
    const isModifierPressed = isMacOs() ? e.metaKey : e.ctrlKey;
    let hotkeyType = '';
    switch (e.code) {
        case F5_CODE:
            callParentVoid('devtools.inspectedWindow.reload');
            hotkeyType = 'reload';
            break;
        case 'KeyR':
            if (isModifierPressed) {
                callParentVoid('devtools.inspectedWindow.reload');
                hotkeyType = 'reload';
            }
            break;
        case F_CODE:
            if (isModifierPressed) {
                window.postMessage({ type: 'focusSearch' }, '*');
                hotkeyType = 'search';
            }
            break;
        case U_CODE:
            if (isModifierPressed && e.shiftKey) {
                window.postMessage({ type: 'toggleHideUnrelated' }, '*');
                hotkeyType = 'toggleHideUnrelated';
            }
            break;
        case L_CODE:
            if (isModifierPressed) {
                window.postMessage({ type: 'clearList' }, '*');
                hotkeyType = 'clearList';
            }
            break;
        case P_CODE:
            if (isModifierPressed) {
                window.postMessage({ type: 'togglePreserveLog' }, '*');
                hotkeyType = 'togglePreserveLog';
            }
            break;
        default:
        // console.log(e);
        // pass
    }
    if (hotkeyType) {
        callParentVoid('analytics.hotkey', hotkeyType);
    }
});
