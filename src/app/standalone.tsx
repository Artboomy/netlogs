import React from 'react';
import { createRoot } from 'react-dom/client';
import { PanelApp } from '../components/PanelApp';
import EventsController from 'controllers/events';

// Subscribe to internal events only (no HostController for devtools)
EventsController.subscribe();

// Render app directly (no iframe, no parent communication)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    const root = createRoot(container!);
    root.render(<PanelApp />);
});
