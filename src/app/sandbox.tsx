import React from 'react';
import ReactDOM from 'react-dom';
import { PanelMain } from 'components/PanelMain';
import { callParent, callParentVoid } from '../utils';
callParent('onIframeReady').then(() => {
    ReactDOM.render(<PanelMain />, document.getElementById('root'));
});

const F5_CODE = 'F5';

// Since we are in iframe, F5 event for inspected page should be hoisted manually
document.addEventListener('keydown', (e) => {
    if (e.code === F5_CODE) {
        callParentVoid('devtools.inspectedWindow.reload');
    }
});
