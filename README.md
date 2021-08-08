# 📜 Net logs

![license](https://img.shields.io/github/license/Artboomy/netlogs?cacheSeconds=86400)
![version](https://img.shields.io/chrome-web-store/v/cjdmhjppaehhblekcplokfdhikmalnaf)
![chrome installs](https://img.shields.io/chrome-web-store/users/cjdmhjppaehhblekcplokfdhikmalnaf?cacheSeconds=43200)
[![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2F?cacheSeconds=86400)](https://twitter.com/intent/tweet?url=https%3A%2F%2Fgithub.com%2FArtboomy%2Fnetlogs&text=%20&hashtags=netlogs%2Cdevtools%2Cdebugging)

[Install for Chrome/Edge](https://chrome.google.com/webstore/detail/net-logs/cjdmhjppaehhblekcplokfdhikmalnaf)

This is extendable network request viewer extension for Chromium-based browsers.

## 💡 Features

The extension will appear in devtools as a `📜 Net logs` tab.

* 🔍 **Search:** Filter by url and search by params/result.
* ⛰️ **Integration:** View Next.js & NuxtJS hydration state.
* 🛠️ **Customization:** Transform name, parameters, and response with javascript.
* ✨ **Universality:** View live logs or load
  from [`*.har` file](https://developer.chrome.com/docs/devtools/network/reference/#save-as-har).
* 🤝 **Team-oriented:** Export logs and share them with others.

![main.gif](./img/main.gif)

## 🚀 Installation

You can find a version for
Chrome/Edge [here](https://chrome.google.com/webstore/detail/net-logs/cjdmhjppaehhblekcplokfdhikmalnaf).

To install from zip or source, see [local development](LOCAL_DEVELOPMENT.md).

## 🎨 Presets

*You can disable presets in the settings.*

### [GraphQL](https://graphql.org/)

Features: query name extraction, result unwrapping, colored tag.

![graphql.png](./img/graphql.png)

### [JSON-RPC](https://www.jsonrpc.org/)

Features: method extraction, result unwrapping, coloring for error responses.

![json-rpc.png](./img/json-rpc.png)

## ⛰️ [Next.js](https://nextjs.org/) and [NuxtJS](https://nuxtjs.org/) debugging

![next.png](./img/next.png)
![nuxt.png](./img/nuxt.png)

Extension will pull data from `window.__NEXT_DATA__` or `window.__NUXT__`, if available.

*You can disable this in settings.*

## 💾 Saving and loading logs

![saveload.gif](./img/saveload.gif)

To export logs, click ⬇️ button in the header.

To load logs, simply drag and drop the file in the extension.

Extension supports `*.netlogs.zip` and `*.har` files.

## ⛓️ Preserve log

If you want to preserve logs on page reload - click `expand` button in the header, then mark checkbox.

![preserve logs](./img/preserve.png)

## 🦄 Custom events

You can send custom events to extension from page with `window.netlogs` function.

_Note that function might not always be available._

Usage:
`window.netlogs(event)` or `window.netlogs('Hello world')`

Example:

`window?.netlogs({ tag: 'TEST', content: { message: 'Hello world' } }`

![custom events](./img/custom.gif)

Event signature is either `IItemContentOnlyCfg`:

```typescript
type IItemContentOnlyCfg = {
    // by default new Date().getTime() will be used
    timestamp?: number;
    // small bit of text next to date
    tag?: string;
    // viewable on date click
    meta?: {
        key: {
            items: [{ name: string, value: string }]
        }
    }

    content: object | string;
}
```

or `IItemTransactionCfg`

```typescript
type IItemTransactionCfg = {
    // by default new Date().getTime() will be used
    timestamp?: number;
    // small bit of text next to date
    tag?: string;
    name?: string;
    // viewable on date click
    meta?: {
        key: {
            items: [{ name: string, value: string }]
        }
    }

    params: object;

    result: object;
}
```

To get help message in console, invoke `window?.netlogs.help()`.

## 🛠️ Configuration

Open the devtools in any webpage, and navigate to "Net logs" tab. Click the "Options" button to open the **Options
page**.

## 🐜Troubleshooting

If something goes wrong and functions crash the view, do the following:

1. [Export a *.har log](https://developer.chrome.com/docs/devtools/network/reference/#save-as-har) from network tab
2. Open options page
3. Drop exported log in the interactive demo
4. Open console

You should see the errors in the console.

Alternatively, you can open a devtools on the devtools. To do so, undock the devtools and press `Ctrl+Shift+J`, or press
right-click and choose `Inpsect`.

This will open new debugger window, where you can find console log with errors.

## 🔐 Security & privacy

All your custom javascript runs in
a [sandbox environment](https://developer.chrome.com/docs/extensions/mv2/manifest/sandbox/).

Extension does not transmit any data to the servers.

All settings are stored locally.

## 🤝 Permissions

* `storage` - used to store your custom settings. Does not sync.
* `content_scripts` - used to extract nextjs/nuxtjs data from page.

The list may extend in the future.

## 🏗️ Development

Please see the [dedicated documentation](LOCAL_DEVELOPMENT.md).

## 🚧 Disclaimer

This is software in its early stages of development, which is developed in the free time. You can report a bug or
suggestion in the [Issues tab](https://github.com/Artboomy/netlogs/issues). I may or may not fix it 😉.
