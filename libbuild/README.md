# libbuild — in-app library builder

Builds `coach/library.json`, the list behind the coach Library: **links and titles only**, plus auto tags (moment, theme, age, players, system).

- `build.py` — tags and merges sources, writes the library JSON.
- `xmap.json` — X Sessions saved posts (Drive note links + source post).
- `anim.json` — private Drive animations.
- `overrides.json` — hand fixes keyed by Drive id or URL; `"drop": true` removes an entry.

## Rebuild
```
python3 libbuild/build.py   # then copy the output to coach/library.json
```
`build.py` reads the Coaches' Voice Drive inventory and masterclass index from the builder's box (`/workspace/cv/...`). Those inputs are not in the repo, so a full rebuild runs there; edit `overrides.json` for small fixes.

## Rules
- Coaches' Voice is paid and personal-licence: link only, never rehost or copy text/media. Items are marked `private`.
- No player data, ever.
- `res.js` items are merged at runtime by `resList()`, not duplicated here.
