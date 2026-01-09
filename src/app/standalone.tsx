import React from 'react';
import { createRoot } from 'react-dom/client';
import { PanelApp } from '../components/PanelApp';
import EventsController from 'controllers/events';
import StandaloneShim from 'controllers/standaloneShim';
import { isMacOs } from '../utils';

// Subscribe to internal events only (no HostController for devtools)
EventsController.subscribe();

// Initialize standalone shim to handle parent frame messages locally
new StandaloneShim();

// Keyboard shortcuts (same as sandbox.tsx but for standalone mode)
const F_CODE = 'KeyF';
const U_CODE = 'KeyU';
const L_CODE = 'KeyL';

document.addEventListener('keydown', (e) => {
    const isModifierPressed = isMacOs() ? e.metaKey : e.ctrlKey;

    switch (e.code) {
        case F_CODE:
            if (isModifierPressed) {
                e.preventDefault(); // Prevent browser find dialog
                window.postMessage({ type: 'focusSearch' }, '*');
            }
            break;
        case U_CODE:
            if (isModifierPressed && e.shiftKey) {
                e.preventDefault();
                window.postMessage({ type: 'toggleHideUnrelated' }, '*');
            }
            break;
        case L_CODE:
            if (isModifierPressed) {
                e.preventDefault(); // Prevent browser address bar focus
                window.postMessage({ type: 'clearList' }, '*');
            }
            break;
        default:
            break;
    }
});

// Render app directly (no iframe, no parent communication)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    const root = createRoot(container!);
    root.render(<PanelApp />);
});
