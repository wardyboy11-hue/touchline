# Welfare tests

Headless checks for the welfare features. They need Node and Playwright (`npm i -D playwright`).

Browser tests start their own tiny web server and fake the Apps Script backend, so they touch nothing real:

    node tests/welfare/p0-browser.js
    node tests/welfare/p1-head-injury-browser.js
    node tests/welfare/p1-heading-browser.js
    node tests/welfare/p1-goals-browser.js
    node tests/welfare/p3-browser.js

Backend tests run the real `.gs` files in Node with a pretend Sheet, to check the rules (stage order, day 15 and day 21, who can see what, retention):

    node tests/welfare/p1-head-injury-backend.js
    node tests/welfare/p1-goals-backend.js
    node tests/welfare/p3-mydata-backend.js
