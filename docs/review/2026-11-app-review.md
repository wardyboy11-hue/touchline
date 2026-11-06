# Touchline review, November 2026

Reviewed on 6 November 2026. This is release 103, the version live at https://touchline.cipher-training.co.uk/.

This note is for Tim and Deano. It says what is working, what is getting in the way, and where a developer should look. No app code was changed. Release 104 (the voice assistant and the travel alerts) is being built separately and is left alone.

## How this was checked

The coach app, the parent page, the family page, the stretch page, the service workers, and the Apps Script backend were read in full enough to follow each screen. The live site was checked by downloading the published files. Those files are served by GitHub Pages.

Signed-in screens were not clicked through on a phone. That needs a real coach, parent, or player code, and those codes stay private. Where a finding is about a crash or a quiet failure, it comes from the code path, not from a console log captured while signed in.

## How to read the rankings

Each finding has an impact (how much it matters on a Wednesday or a Saturday) and an effort (how big a job it is to put right).

- Small: one careful change, low risk.
- Medium: a release of its own, and a test on a real phone.
- Large: the big files, and a test on a match day before you trust it.

Do the high impact, small and medium items first. The suggested order is in `docs/review/2026-11-roadmap.md`.

## Top 10

1. **The public website contains the squad's full names, and other people's mobile numbers.** Anyone can open the files. Highest impact. Removing them from the current files is a small change. Old copies can remain in GitHub history, so treat the numbers as already seen.
2. **Family and parent pages show other children's names.** Lifts, man of the match, the "your voice" team picker, and one vote list use first names. The coach guide already says shirt numbers only. High impact, medium effort, because the same screen exists twice.
3. **A shirt number is not anonymous while that public squad list exists.** Release 111 must wait until finding 1 is done. Otherwise sending "shirt 8" to an AI service can be joined back to a name from the website.
4. **The parent page and the family page are two copies of the same app.** About 200KB each. A fix in one is easy to miss in the other. High impact on every future change. Medium effort to make them one page.
5. **The coach app is one 612KB file.** Slow to open on a touchline phone, and risky to change on a Friday. High impact, large effort. Split it only when you are not in a run of match days.
6. **Offline is solid for the coach shell, and weak for parents.** A parent who loses signal can lose the page itself. Yes and No answers can queue. High impact on away days. Medium effort.
7. **Match day subs already work, and they are slower than they need to be.** You tap who is coming off and then hunt the bench. The data for a short suggestion list is already on the phone. High impact every game. Medium effort. Design in the roadmap, release 106.
8. **The parent home asks for too many taps and some targets are small.** Contacts sit under Me. The jump bar and shirt chips are under the 44px size that is comfortable with cold hands. High friction, medium effort.
9. **A few accessibility gaps will bite in sunlight and for anyone using a screen reader.** Focus outline is removed, errors are not announced, the badge image has no description, and one pop animation ignores the reduce-motion setting. Medium impact, small to medium effort.
10. **The backend file in the repo is behind the longer snapshot, and that snapshot is the one with the phone numbers.** Easy to deploy the wrong script, or to leave the private numbers on the public site. Medium impact, small effort to stop publishing those snapshots.

## What is already in good shape

Worth keeping as you change things.

- Codes gate the private sheet. Wrong tries are locked out. The Claude key sits in Apps Script properties, not in the website files.
- Family Ask is general football help. The prompt tells the model it knows nothing about individual players, selection, minutes, or ability (`backend/apps-script/Code.gs` around lines 510 to 512 and 518 to 527).
- Role cards for players are shirt numbers only (`f.rolecard` in `Code.gs` around lines 338 to 346).
- Running late already tells coaches a shirt number and a rough number of minutes. Other families do not see it (`cd.js` lines 1 to 5 and 147 to 150).
- Yes, Maybe, and No are large. The page uses UK dates. The coach screen saves on the phone first and syncs when it can.
- Match day already has directions, Waze, roadworks, weather, and a venue tip card you can reuse for the same ground (`family.html` `travelLinks` around line 596, `coach/app.js` `viCard` and `viAll` around lines 1956 and 1963).
- The tour videos have captions. The share sheet has a proper dialog label.

## 1. Performance

### What a phone actually downloads

| What | Size | Why it matters |
| --- | --- | --- |
| `coach/app.js` | 612KB, 2,896 lines | The whole coach app parses before you can work. |
| `parents.html` | 200KB, 1,097 lines | CSS and the app are inside the HTML, so a normal script cache does not help much. |
| `family.html` | 206KB, 1,134 lines | Same pattern, a second copy. |
| `library.json` | 172KB, and a second copy under `coach/` | Parsed on the main thread when the library opens. |
| `coach/positions.json` | 75KB | Precached with the coach shell. |

GitHub Pages sends `cache-control: max-age=600` on these files (checked on the live site). A new release can take up to 10 minutes to show, on top of the version check in `update.js`.

The coach shell blocks on three stylesheets, then on `topics.js` and `cd.js` without `defer` (`coach/index.html` lines 13 to 31). Other scripts use `defer`. The splash can sit for up to 9 seconds (`coach/index.html` line 19, `parents.html` line 205, `family.html` line 205).

There is no code splitting. Family screens rebuild the whole page with `innerHTML` on each tap (`family.html` `r()` around line 1013). That is fine for a small page and costly for this one.

### Caching

Three service workers, on purpose, with different jobs.

- Coach, scope `/coach/`, `coach/sw.js`. Shell precache. HTML and JS are network first, then the cache. `library.json` is network first. Images with `?v=` are cache first. PDF, video, and audio are not cached here (lines 1 to 28). `version.json` is never cached, which is right.
- Family and parents, scope `/`, `fsw.js`. Precache is shop images plus a handful of scripts (lines 1 to 16). HTML is network first and, apart from `voice.js`, a successful load is not written into this cache. Offline depends on the browser happening to remember the HTML.
- Stretch, scope `/stretch/`, `stretch/ssw.js`. Cache first, and the install list includes audio and video. That can be a large download. Offline fallback is the stretch page itself.

`update.js` compares `version.json` with the copy baked into the file (`RUN` is `103`) and, on a new version, deletes every cache and reloads. That is a good safety net. It also means a release wipes the offline copies until the next visit with signal.

### Lighthouse-style notes (from the code and the live headers)

- Viewport and `lang="en-GB"` are set on the coach, parent, and family pages.
- Fonts are the system fonts. No webfont cost.
- The family CSS is one long block inside the HTML. A lot of it is for screens you are not on.
- Images on the splash and in the header often have no width and height, so the layout can jump.
- There is no `_headers` file in the repo. Caching is whatever GitHub Pages sends (10 minutes).

### Best speed wins

1. Keep one family page and let the service worker cache it (with the network-first safety you already use for JS).
2. Load `library.json` only when someone opens the library.
3. Split `coach/app.js` by area (match day, planning, library) when you have a quiet week.
4. Add `defer` to `topics.js` and `cd.js` on the coach page.
5. Shorten the splash. One second is enough for the badge.

## 2. Accessibility

The pages are in British English, inputs are about 48px tall, and the bottom nav respects the iPhone home bar. The gaps below are the ones a parent will feel.

- Focus outline is switched off and replaced with an amber ring (`parents.html` line 62, same idea in `family.html`). On Sunlight mode (white background) that ring is easy to lose.
- Header icon buttons are 40 by 36px (`parents.html` line 140). Jump links are 40px tall (line 154). Shirt chips are 36px (line 170). Cold hands and a bouncing car want at least 44px.
- The splash badge and the header badge use an empty `alt` (`coach/index.html` line 18). A screen reader gets silence where the club name would help. The club name is also in the heading, so this is a polish item, not a blocker.
- The sign-in error is a plain div (`family.html` around line 1014). It is not marked as a live message, so a screen reader may not announce "that code did not work".
- Parent questions use a clickable card as well as a button (`pq.js`). Keyboard users can miss the card.
- The attendance pop animation (`parents.html` around lines 179 to 180) is not covered by the reduce-motion rule. The splash animation is covered.
- Man of the match chips are buttons with the number as the label, which is the right pattern. Keep that when you add new pickers.

## 3. Bugs and quiet failures

Signed-in consoles were not captured. These are faults the code will hit.

- **Coach render errors.** If a screen throws, `render0` writes the error to the console and shows an error card (`coach/app.js` line 207). You see a card. The console noise is a clue for the next bug, not something parents see.
- **Push check uses the wrong address.** `getRegistration('fsw.js')` is called with a file name (`parents.html` lines 1055 and 1070, `family.html` lines 1092 and 1107). The browser expects a page address. The check can fail with no message, so alerts look on when they are not, or the app keeps trying to switch them on.
- **First sign-in is not saved for offline.** `load()` stores the last good payload in `fam.cache` (`family.html` line 1031). `login()` sets the code and draws the page, and does not write that cache (line 1038). The first session needs another successful load before the phone can open it with no signal.
- **Votes can fall back to a name.** The server builds candidates as a first name plus a last initial, and does not send the shirt number (`Code.gs` `voteState_` lines 438 to 444). The home man of the match chips prefer a number. The older vote card prints the name when the number is missing (`family.html` line 1028).
- **Your voice loads first names for every teammate** (`Code.gs` `voiceSquad_` lines 877 to 883, shown in `family.html` around line 358).
- **Man of the match on a finished game is a first name** (`Code.gs` `pubMatch_` line 559, `family.html` line 371).
- **Event replies can sit on the phone.** The client queues them until a backend build the comment calls Code_v36. If the live script is behind the page, parents think they have replied and the coaches never see it (`parents.html` around the r102 block).
- **Two backends.** `backend/apps-script/Code.gs` is 995 lines and has no niggle code. `docs/Code_v33.gs` is 1,808 lines and is a later snapshot. Deploying the shorter file over the live script would drop features. Publishing the longer file publishes the phone numbers in section 7.

No `TODO` or `FIXME` markers turned up in the hand-written app code. That does not mean the list above is empty.

## 4. Offline

**Coach.** The shell, styles, and core scripts can open from the cache after one good visit. Match data is in `localStorage` (`tl.state.v1`) and syncs when you are back. Apps Script is a different website, so the service worker never caches it (`coach/sw.js` lines 1 to 4). Live answers, photos, and Ask need signal. The squad and the match on the phone still work.

**Parents and players.** Last home payload can redraw from `fam.cache` if the code matches and the HTML itself is still on the phone. Yes, No, and Maybe queue when `navigator.onLine` is false, and send later (`family.html` `ans()` around lines 1039 to 1049). The service worker does not deliberately keep `parents.html` or `family.html`. Shop pictures are the part that is properly cached.

**Stretch.** After install, the stretches and their clips are meant to work offline. The cost is the size of that cache.

**Stale data.** A parent can be looking at yesterday's fixtures with no strong "this is from 9am" label, beyond a small updated line. For kick-off changes that matters. Release 104's alerts are the right place for "this has changed". The page should still show the time of the last successful load in plain language.

## 5. Parents on phones

A parent today: open the home-screen icon, wait on the splash, type the code, accept the privacy note, and on the family link walk a short welcome. Then Home, which is several bands (alerts, this week, training, news, players) plus a sideways jump bar.

What feels heavy:

- Contacts are under Me, then another tap. On match day people want the welfare number faster than that.
- Getting there, lifts, kit, and calendar are spread down the Games card. The direction buttons are good. The lift board is several taps and shows first names (see section 7).
- Copy still talks like the coach app ("same quick jump as the coach three-dots menu"). Parents do not have that menu.
- Words such as MoM, FAN, and 352 appear without a plain explanation on the same screen.
- Sideways strips (jump bar, news shelf, shop) are easy to swipe by accident while you meant to scroll down.
- Sunlight mode exists. Worth a check in a car park, because the amber on white is the weak spot for the focus ring as well.

What feels right: the big Yes, Maybe, and No, the match-day card, Add to calendar, and the late button that does not broadcast your business to the other parents.

## 6. Code health

| File | Lines | Note |
| --- | --- | --- |
| `coach/app.js` | 2,896 | Match, planning, library, welfare, votes, and Ask. |
| `family.html` | 1,134 | Almost the same app as `parents.html`. |
| `parents.html` | 1,097 | The extra family-only piece is the welcome flow. |
| `fitness.js` | 660 | Shared. |
| `cd.js` | 544 | Countdown, match-day screen, late notices. |
| `backend/apps-script/Code.gs` | 995 | Behind `docs/Code_v33.gs`. |

Dead code was not deleted as part of this review. The draft seed in `coach/app.js` (`draftSeedData`, from line 735) is still a button a coach can press, and it is also a public list of named players. Treat it as private data first, and as clutter second.

Shared pieces (`share.js`, `voice.js`, `cd.js`, `shop.js`, `fitness.js`) are the right shape. The problem is the two HTML copies and the one giant coach file, not the shared helpers.

## 7. Security and privacy

### Personal data on the public website

Checked live on 6 November 2026. These URLs returned HTTP 200 from GitHub Pages, and the bodies contain the data:

- https://touchline.cipher-training.co.uk/coach/app.js contains the draft messages that address players by full name (`coach/app.js` `draftSeedData` from line 735).
- https://touchline.cipher-training.co.uk/backend/apps-script/Code.gs contains `seedSquad` (lines 134 to 162): shirt number, full name, and positions for the squad.
- https://touchline.cipher-training.co.uk/docs/Code_v33.gs contains `setupR80` (lines 1623 to 1644): mobile numbers and email addresses for league referee contacts and two opposition managers. The same block is in `docs/Code_v32.gs`. The comment just above that function says the numbers live only in the private sheet and never in the public repo (around lines 1603 to 1606). The file is on the public site anyway.

The digits are not repeated in this note. Take the files off the public site. Then tell the adults whose numbers were in them, because GitHub keeps history and anyone may already have saved a copy. Do not put a seed list of real people in the repo again. The private sheet is the right home.

Club welfare and county FA numbers in `parents.html`, `pq.js`, and `coach/app.js` are published safeguarding contacts. Those are meant to be found. They are a different case.

The Apps Script web app address is in `coach/app.js` line 3 and `parents.html` line 209. The backend README already says access is the code, not a hidden address. That is acceptable. Keep the lockout.

No Claude API key, Pushover token, or sheet id was found in the website files. Those stay in Apps Script properties. Keep it that way.

### Names on family views

The rule you already wrote for coaches: shirt numbers only on anything parents or players see (`coach/app.js` coach guide text, the "Shirt numbers only" line in the chapter 1 script).

What the pages do today:

| Where | What people see | Where in the code |
| --- | --- | --- |
| Welcome | The player's own first name | `family.html` line 465, from `f.home` (`Code.gs` lines 272 to 286) |
| Lifts | Other parents' first names | `family.html` line 252, `Code.gs` lines 709 to 710 |
| Finished games | Man of the match as a first name | `family.html` line 371, `Code.gs` line 559 |
| Your voice, pick a team | Every teammate's first name | `family.html` line 358, `Code.gs` lines 877 to 883 |
| Older vote card | Name if the number is missing | `family.html` line 1028, `Code.gs` lines 438 to 444 |
| Home man of the match chips | Shirt numbers | `family.html` around line 966. This one matches the rule. |
| Role card | Shirt number lookup, no names | `Code.gs` lines 338 to 346 |

Showing a lad his own first name, on a phone that is already signed in with his code, is a smaller issue than showing the rest of the squad. Lifts, man of the match, your voice, and votes are the leaks to close. The privacy note on the page currently says teammates' first names appear on Your voice (`family.html` around line 221). Change the page and the note together.

The welcome step that asks a parent for their own name, stored for coaches only (`f.name.set`), can stay. It must not be copied onto the lift board or the pins in the roadmap.

`fam.cache` stores the last home payload on the phone, including that first name and the lift names (`family.html` line 1031). After you stop sending other children's names, the old cache dies on the next online load.

### Health, welfare, and niggles

Niggle records are in the later script snapshot (`docs/Code_v33.gs`), aimed at a private tab. They are not in the shorter `Code.gs`. Head injury return-to-play is parent and coach only. None of that should be added to family lists, AI prompts, or parent pins.

The privacy note says the app holds no phone numbers, and also says emergency contacts can include a phone number (`family.html` around lines 220 to 221). Make those two sentences agree.

### What this means for the new ideas

You have signed off that AI may see a shirt number, plus that player's positions, marks, and coaching reflections, so it can pick resources, tips, and news. Names, welfare, health, and niggles stay out.

Do finding 1 before you switch that on. Until the public squad list is gone, a shirt number on this website is a name.
