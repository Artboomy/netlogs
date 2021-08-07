import React from 'react';
import ReactDOM from 'react-dom';
import { PanelMain } from 'components/PanelMain';
import { callParent, callParentVoid } from '../utils';

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
    switch (e.code) {
        case F5_CODE:
            callParentVoid('devtools.inspectedWindow.reload');
            break;
        case F_CODE:
            if (e.ctrlKey) {
                window.postMessage({ type: 'focusSearch' }, '*');
            }
            break;
        case U_CODE:
            if (e.ctrlKey) {
                window.postMessage({ type: 'toggleHideUnrelated' }, '*');
            }
            break;
        case L_CODE:
            if (e.ctrlKey) {
                window.postMessage({ type: 'clearList' }, '*');
            }
            break;
        case P_CODE:
            if (e.ctrlKey) {
                window.postMessage({ type: 'togglePreserveLog' }, '*');
            }
            break;
        default:
            console.log(e);
        // pass
    }
});
