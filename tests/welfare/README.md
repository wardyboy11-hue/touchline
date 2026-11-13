# Welfare tests

Headless checks for the welfare features. They need Node and Playwright (`npm i -D playwright`).

Browser tests start their own tiny web server and fake the Apps Script backend, so they touch nothing real:

    node tests/welfare/p0-browser.js
    node tests/welfare/p1-head-injury-browser.js
    node tests/welfare/p1-heading-browser.js
    node tests/welfare/p1-goals-browser.js
    node tests/welfare/p3-browser.js
- `account-switch-browser.js`: the top corner account menu (switch, add, sign out, greyed roles).
- `auto-update-browser.js`: the app refreshes itself when version.json is newer (not while typing or with unsynced changes).
- `fa-pdf-browser.js`: the matchday FA team sheet PDF on the Team sheet tab (add, show, replace, remove, wiped on sign out).
- `r112-running-browser.js`: Running (Build up to 5k, position runs, build your own, timer blocks, beeps or voice cues) and the Fuel and water card, on a phone and a 1366 wide laptop. Also the direct links (#games, #me, #running, #fuel and so on) and that Running sends nothing to the backend.
- `r113-home-browser.js`: the new Homes for parents, players and coaches (Wednesday 18 Nov, training 20:00 to 21:00, match Saturday 21 Nov), the new nav (Calendar, Videos, Ask or Train), old links like #games and #media, fixtures first, help folded after the first look, Share only where it helps, the offline helper for every family, the account button, MoM names, the consent card, the 1366 laptop rail, and Let's go opening the match.

Tests that depend on the date pin the clock (Wednesday training, Saturday matches). Browser tests serve the version from update.js so the app never refreshes itself in the middle of a test.

Backend tests run the real `.gs` files in Node with a pretend Sheet, to check the rules (stage order, day 15 and day 21, who can see what, retention):

    node tests/welfare/p1-head-injury-backend.js
    node tests/welfare/p1-goals-backend.js
    node tests/welfare/p3-mydata-backend.js
