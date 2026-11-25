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
- `r116-week-att-postpone-browser.js`: the This week card on parent and player Home (Wednesday training 20:00 to 21:00 and Saturday's match Yes or No, your answer, change it, stays first until Saturday is over, then rolls on, called off games), and Game off? on the coach's Matchday, live match and Today screens all match day (reason, new date, message, urgent, Check then Send or Cancel, push and news), on a phone and a 1366 wide laptop.
- `r117-share-prompts-browser.js`: the in-app Share sheet (whole team, players, parents only, choose people, coaches only), Check then Send or Cancel, More ways and WhatsApp only for public team pages, coach-only and rating words locked to coaches, the Tuesday 19:00 coach review card and the Friday 18:00 prep card (Approve, Edit, Skip, then Send or Cancel), tap sizes, labels and contrast, on a phone and a 1366 wide laptop.

Tests that depend on the date pin the clock (Wednesday training, Saturday matches). Browser tests serve the version from update.js so the app never refreshes itself in the middle of a test.

Backend tests run the real `.gs` files in Node with a pretend Sheet, to check the rules (stage order, day 15 and day 21, who can see what, retention):

    node tests/welfare/p1-head-injury-backend.js
    node tests/welfare/p1-goals-backend.js
    node tests/welfare/p3-mydata-backend.js
    node tests/welfare/r117-share-backend.js   # tests the full Code_v39.gs if V39 points to it, otherwise docs/r117-share-addon.gs
