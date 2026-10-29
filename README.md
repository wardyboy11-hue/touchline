# touchline
## Releasing a new version
The apps refresh themselves when opened or brought back to the front. For that to work, every release must:
1. Bump `version.json` (the `v` value).
2. Bump `RUN` at the top of `update.js` to the same number.
3. Bump the `?v=` numbers in `coach/index.html`, `coach/sw.js`, `family.html` and `parents.html`.
