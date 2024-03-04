const title = navigator.userAgent.includes('Edg') ? 'Net logs' : '📜 Net logs';
chrome.devtools.panels.create(title, 'icons/16', 'panel.html');
