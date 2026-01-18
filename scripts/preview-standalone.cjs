#!/usr/bin/env node
/**
 * Simple HTTP server for previewing the standalone build
 * Serves files from the standalone directory with proper MIME types
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STANDALONE_DIR = 'standalone';
const ROOT_DIR = path.resolve(STANDALONE_DIR);

// Test API routes for E2E testing of request interception
const API_ROUTES = {
    // GET endpoint - returns JSON after small delay
    'GET /api/test/get': (_req, res) => {
        setTimeout(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
                JSON.stringify({
                    success: true,
                    method: 'GET',
                    timestamp: Date.now()
                })
            );
        }, 100);
    },

    // POST endpoint - echoes body
    'POST /api/test/post': (req, res) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            setTimeout(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                    JSON.stringify({
                        success: true,
                        method: 'POST',
                        body,
                        timestamp: Date.now()
                    })
                );
            }, 100);
        });
    },

    // Slow endpoint for testing pending state visibility (2 second delay)
    'GET /api/test/slow': (_req, res) => {
        setTimeout(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
                JSON.stringify({ success: true, method: 'GET', slow: true })
            );
        }, 2000);
    }
};

const CONTENT_TYPES = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    mjs: 'application/javascript',
    json: 'application/json',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    ico: 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, 'http://localhost');

    // Check API routes first
    const routeKey = `${req.method} ${requestUrl.pathname}`;
    if (API_ROUTES[routeKey]) {
        API_ROUTES[routeKey](req, res);
        return;
    }

    const pathname =
        requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const safePath = path.resolve(ROOT_DIR, '.' + pathname);

    if (safePath !== ROOT_DIR && !safePath.startsWith(ROOT_DIR + path.sep)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(safePath).slice(1);
    const contentType = CONTENT_TYPES[ext] || 'text/plain';

    fs.readFile(safePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Standalone preview at http://localhost:${PORT}`);
});
