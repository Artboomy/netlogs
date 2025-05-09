# Local development

## 🏗️ Building

1. Install Node.js.
2. Clone `git clone git@github.com:Artboomy/netlogs.git`

3. Install dependencies `cd netlogs && yarn`

4. Build `yarn run build`

5. Enable developer mode in browser at chrome://extensions/ and click **"Load unpacked"** from `dist` folder.

6. You are ready to go! If you don't see the tab in devtools - just reopen it.

7. You can run `yarn run build:watch` for active development.
   _Hot reload won't work, you'll need to manually reopen devtools on every change._
8. Sometimes pressing the "Reload extension" is needed. Usually when modifying background script.

## 📦 Packaging

Run `yarn run package`. This will generate .zip archive, which can be unpacked and installed as development extensions.

Alternatively, run `yarn run bild:prod` and archive `dist` folder manually.

## 🗜️ Zip installation

1. Grab the latest release from [Github](https://github.com/Artboomy/netlogs/releases). Download `netlogs.zip`.

2. Unzip it.

3. Open chrome://extensions/ and toggle developer mode in the header.

4. Click **"Load unpacked"** and select folder from step 2.

5. You are ready to go! If you don't see the tab in devtools - just reopen it.
