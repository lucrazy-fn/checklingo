# Notas para os revisores

## Firefox Add-ons

CheckLingo runs only on `https://duolingo.com/*` and `https://www.duolingo.com/*`.

To test:

1. Sign in to a Duolingo account that has access to Chess.
2. Open a Chess lesson or `/chess-match`.
3. Open the CheckLingo popup and enable the desired features.
4. Make a completed move to verify highlighting and move history.
5. Right-drag on the board to draw a planning arrow.
6. Change a word in the popup and verify the replacement in chess-related page text.

No special test account or external service is required. The add-on does not transmit user data. Preferences are stored with `browser.storage.local`. There is no build step, minification, obfuscation or remote executable code.

## Chrome Web Store

The extension has the same behavior on Chromium browsers. The background file is declared as a Manifest V3 service worker.

The extension reads Duolingo page content only to provide the visible chess features described in the listing. Processing and storage are local. There are no analytics, advertisements, payments, external APIs or developer servers.

