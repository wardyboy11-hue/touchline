# Touchline backend

Google Apps Script web app that stores and serves everything the Touchline coach, parents and players pages need.

## Files
- `apps-script/Code.gs`: the main backend.
- `apps-script/helpdesk.gs`: lost code and training request handlers (second file in the same Apps Script project).
- `apps-script/appsscript.json`: manifest. Runs as the owner (`USER_DEPLOYING`), open to anyone with the link (`ANYONE_ANONYMOUS`). Access is controlled by codes inside the script.

## Script properties (Project Settings, Script properties)
Not in the code. Set these in Apps Script.

| Property | Used for |
|---|---|
| `COACH_CODE` | Tim's access code |
| `DEANO_CODE` | Deano's access code |
| `SSID` | ID of the private Google Sheet used as the data store |
| `CLAUDE_KEY`, `CLAUDE_MODEL` | Anthropic API, used by the Ask feature |
| `PUSHOVER_APP` | Pushover application token for coach alerts |
| `ALERT_URL` | Link opened from an alert (defaults to the coach app) |

Run `setup()` once after setting the properties.

## How the app calls it
- `GET ?cal=...`: calendar feed.
- `POST` with a JSON body `{action, code, ...}`. Coach actions: `ev.*`, `lift.*`, `media.*`, `photo.*`, `res.*`, `voice.*`, `vote.coach`, `clip.*`, `alert.send`, `fam.codes`, `self.list`. Family and player actions begin `f.` (for example `f.home`, `f.answer`, `f.lift`, `f.self.get`, `f.self.set`, `f.voice.add`, `f.ask`).
- `auth_()` allows 8 wrong tries then locks out for 15 minutes.

## Review notes
- No keys, tokens or codes are stored in the code.
- Rotate `COACH_CODE` and `DEANO_CODE` if either is ever shared by mistake.
- `f.codehelp` (open, rate limited 10 an hour overall and 3 an hour per shirt number, never returns a code), `f.trainreq` (needs a family or player code), `help.list` and `hub.help.done` (coach only) live in `helpdesk.gs`. They store role, shirt number, first name (lost code only), topic, a short note and a time in a `CodeHelp` sheet.
- To install: add `helpdesk.gs` as a new file, add the four dispatcher lines in `Code.gs` (see the repo copy), then Deploy, Manage deployments, edit, New version.

## Resource library (`library.gs`)
- Third file in the same Apps Script project, plus the dispatcher lines in `Code.gs`. Needs `helpdesk.gs` (for `rate_`).
- Coach actions: `lib.req.list`, `lib.req.decide` (approve, swap or decline with a note), `lib.give` (to shirt numbers).
- Player and parent actions: `f.lib.get` (published item ids, items given to this player, own requests), `f.lib.req` (players, 5 an hour), `f.lib.used` (players mark an item as tried).
- Sheets created on first use: `LibReq` (requests) and `LibGive` (items given). Shirt numbers only, no names.
- Which items players can see comes from the coach app: Approve, then Publish. The published ids sit in the settings doc as `libPub`.
- Free text requests that look like a welfare worry are held for review and trigger a coach alert, same words list as Your voice.
- To install: add `library.gs`, add the six dispatcher lines (see the repo copy), then Deploy, Manage deployments, edit, New version.

## Cloudflare workers (`cloudflare/`)
- `push-worker.js` (`touchline-push.wardyboy11.workers.dev`): web push. Endpoints `/vapid`, `/latest`, `/subscribe` (checks the family code with the backend), `/unsubscribe`, `/send` (checks a coach code with the backend). Needs a KV binding named `SUBS`. It creates and stores its own VAPID keys in KV on first use. The contact email in the VAPID subject is a placeholder in this copy.
- `clips-worker.js` (`touchline-clips.wardyboy11.workers.dev`): private match clip storage and playback. Paths `/v/<id>?t=<token>` to play and `/u/<id>?t=<token>` to upload or delete. Every call is checked with the backend (`clip.chk`). Needs an R2 binding named `CLIPS`. Clips are capped at 95MB.
- Both contain the public Apps Script web app address. Access is controlled by codes and tokens, not by hiding that address.
