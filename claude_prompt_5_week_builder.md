# Claude prompt 5 (v4): Self-building weekly session guide in Plan

Repo `wardyboy11-hue/touchline`, folder `coach/` (live: https://touchline.cipher-training.co.uk/coach/). Team: Wigan Junior Latics U15 Blues, 3-5-2. Coaches: Tim and Deano. Work on branch `feature/week-guide`, open a PR, and **don't push to main or merge**.

This prompt is self-contained. Everything runs **inside the app**: no assistant, AI service or weekly manual step is needed for the guide to appear. An external weekly routine is **optional** and only tops up `coach/library.json` (§8).

## 1. Goal
Plan → This week shows a guided card for the **next session**, built by the app itself:
1. **Topic and date**, e.g. "Wk 1 · Wed 4 Nov · Shape to receive, first pass forward".
2. **From last week**: both coaches' reflections, side by side, feeding this week (§7).
3. **Build this week's session**: tap/chip guided questions, pre-filled from reflections.
4. **Where to look**: the top 4–8 resources from `library.json`, ranked by tag match, each with a real **Open** button.
5. **Key coaching points**: 4–6 points with plain-English explanations of terms.
6. **Pick the drills** with the **existing** builder/picker, pre-seeded by the answers.

The coach can edit or override anything. Edits save through the existing sync.

## 2. Current-code findings (verify, then extend; don't rebuild)
- `coach/app.js` (minified-style). Plan tabs come from `TM.plan` = Build `sb`, This week `plan`, Attendance `att`, Reflect `rev`.
- **Block builder** `sb*` functions: `sb()` creates or returns `S.settings.sb` = `{topic, free, fmt (weeks in block), mins, start, next, week (current index), weeks[] {s slots, i, lead, split, rc}, intro, learn, time:'20:00', place}`. `sbDate(b,w)` = `start + 7*w`. Others: `sbSlots`, `sbPool`/`sbFill` ("Suggest one"), `sbPickOpen`, `sbSearch`, `sbUse`, `sbOwn`, `sbGroups`, `sbRunCard`, `sbRecord`, `sbPdf`, `sbPublish`. Action names include `sbWeek`, `sbNext`, `sbTopic`, `sbAuto`, `sbAutoAll`, `sbSave`.
  - `sbPool` already takes free tokens (`b.free`) and per-week `rc` hints `[topicIdx, tokens]`. **Feed all generated tags through this hook. Don't write a new drill engine.**
  - **Bug to fix:** `sb()` resets `b.start` to the next Wednesday whenever `b.start <= today`. That makes "which week are we in" impossible once the block starts. Keep a fixed `b.blockStart` (set once when a block is created) and compute week from it. Keep `b.start` behaviour for new, unstarted blocks only.
- Week controls: the existing week selection/next/move and the ran/didn't-run marks stay exactly as they are (whatever they are named in code, e.g. `sbWeek`/`sbNext` and the run-card record). If a "Move week" or "Mark ran" control doesn't exist yet, add it in the guide's ⋯ menu: Mark ran / Didn't run, and Move week (+7 days, optional cascade to later weeks, stored as `w.moved`).
- **Reflect** (`vRev`, `rv*`): reviews live in `S.settings.rev[]`. `rvNew(k)` → `{id, kind:'train'|'match'|…, date, by: who()||'Tim', title, sc:{} sliders 1–5, tx:{} text incl. tx.act actions, c:{}, w:{}, d:{} ticks, at}`. `rvSave()` → `touch('settings')`. `who()` reads `localStorage['tl.who']`.
- **Storage/sync**: state is cached in localStorage (`load()`), and `sync()` → `call('sync', {docs, since})` to the Apps Script web app (`API`), which stores docs in the private Google Sheet (`SSID`). Doc kinds today: `player`, `match`, `idea`, `settings`. **`settings` is one doc with whole-doc last-write-wins**, so two coaches can overwrite each other (fixed in §7.1).
- **Resources**: `res.js` (`window.RD`, `src~age~topic~title~url`, read by `resList()`), `x.js`, `ig.js`, `topics.js` (`TOPICS`: 0 breaking lines … 7 transition …). The embed viewer plays X, Instagram and video.
- **Badges**: tabs already show a count with `<span class="dot">N</span>` (e.g. `RQN` on Library). Reuse this for §9. Push goes via `touchline-push.wardyboy11.workers.dev` and is for families. **Don't use push for this feature.**
- `sw.js`: network-first. Add the new static files and bump the cache version.
- `SESS_SEED` has "Win It, Spring" dated 28 Oct, labelled "Block 3, week 2 of 6". It never ran. Relabel it "Reference idea: lose it, react (28 Oct draft)" and keep its animations.

## 3. Data files and schemas
### 3a. `coach/topic-bank.js` (new, static, about 15 KB): the knowledge the app builds weeks from
```js
/* Topic and coaching-point bank. Coach-only. No player data. */
window.TOPIC_BANK = {
  version: 1,
  common_questions: [ /* used every week unless a topic overrides; see §10 */ ],
  topics: {
    'receive-forward': {
      name: 'Shape to receive, first pass forward', moment: 'in possession', theme: ['build-up','receiving','breaking lines','third man'],
      tagline: 'Show, Support, Stretch, then Spring',
      questions: [ { id:'rec', q:'Who do we want receiving forward most?', type:'chips', opts:['Back three into midfield','Midfield into front two','Wing-backs inside'] } ],
      points: [ { p:'Show for the ball…', term:'Passing lane', means:'a clear line between you and the ball' }, … ],   // 4–6
      drillTags: { topic:0, words:['receive','half turn','forward','third man','rondo','lines'] },
      libTags: { moment:['in possession'], theme:['receiving','breaking lines','third man','build-up'], system:['3-5-2'] }
    },
    …
  }
};
```
- Seed it with the 6 block topics and points in §10, plus at least these extra themes so later blocks work with no help: pressing, defending in a low/mid block, wing-back play, finishing, set pieces, playing out from the keeper.
- Question `type`: `chips` (single), `multi`, `number`, `text` (short, team-level only).

### 3b. `S.settings.sb` additions (synced as now)
```js
blockStart:'2026-11-04', day:3,                 // Wed; fixed once the block starts
plan:[ { wk:1, topic:'receive-forward' }, { wk:2, topic:'counter-3-runners' }, … ], // topic per week; coach can change
weeks[i].ans   = { players:'13-15', moment:'In possession', … },  // guide answers
weeks[i].ovr   = { topicName, tagline, points:[…], addLook:[…], hideLook:[ids], questions:[…] }, // coach overrides
weeks[i].carry = { use:[ids], drop:[ids] },     // reflection items kept or dropped
weeks[i].moved, weeks[i].ran                    // existing / §2
```
Overrides always win over the bank. Clearing an override returns to the bank value.

### 3c. `coach/library.json` (new, static, lazy-loaded)
A seeded file is supplied with this prompt (**`library.json`, 449 items**). Commit it as `coach/library.json`.
```json
{ "version":1, "built":"2026-10-29",
  "note":"Links only. Coaches' Voice is paid: never rehost.",
  "vocab": { "type":["pdf","masterclass","x","video","animation","search"], "moment":["in possession","out of possession","set pieces","transition"], "system":["3-5-2","3-4-3","4-3-3","…","back three"] },
  "items":[ { "id":"cv-<driveId>", "title":"U12-U16 Breaking lines", "url":"https://drive.google.com/file/d/…/view",
              "type":"pdf", "src":"coachesvoice|x-sessions|animations|res",
              "tags":{ "moment":[…], "theme":[…], "age":["U12-U16"], "players":["9v8"], "system":["3-5-2"] },
              "private":true, "paid":true, "length":"12:03", "coach":"…", "note":"<Drive note doc>" } ] }
```
- Contents of the seed: 292 Coaches' Voice session plans (every U12–U16, U17 and related U12+ plan, de-duplicated), 100 CV Academy masterclasses (paid, link only), 44 X Sessions posts (real x.com URLs), and 13 animations (11 session folders plus 2 narrated files).
- **`res.js` items are not duplicated.** At runtime, merge `resList()` items that have a URL into the same ranking, mapping topic index to `theme` via `TOPICS`, `type:'video'` for reel/YouTube links and `'search'` otherwise.

## 4. UI flow (Plan → This week)
- **Week strip**: one chip per block week, "Wk n · date" plus a status dot (not built, outline, built, ran, not run, moved). It defaults to the **next session on or after today** (§5).
- **Guide card**, top to bottom:
  1. Topic line, tagline, split/lead badges and note. An **Edit** pencil on the topic, tagline and points; edits go to `weeks[i].ovr`. A "Change topic" picker lists bank topics.
  2. **From last week** panel (§7).
  3. **Build this week's session**: questions as chips, pre-filled. Answers save to `weeks[i].ans`.
  4. **Where to look**: 4–8 rows, each with title, source badge, a one-line "why" (the matched tags, e.g. "3-5-2 · receiving · U12-U16"), length if known, and a **real button** (min 44px tap target) labelled by type:
     - pdf → "Open PDF"
     - masterclass → "Watch masterclass"
     - x → "Open post"
     - video → "Watch"
     - animation → "Play animation"
     - search → "Search"
     
     X, Instagram and YouTube/video open in the **existing embed viewer**. Everything else opens in a new tab (`target="_blank" rel="noopener"`). Drive and CV Academy links are plain links: no embedding, proxying or caching. Each row has hide (×) and "+ Add link" (title, url, type) which go to `ovr`. A "More" button shows the next 8.
  5. **Key coaching points**: 4–6 bullets with **term — meaning**. They're copied into the run card's coaching points when the session is built.
  6. **Pick drills**: opens the existing Build flow for that week with `b.week` set.
- ⋯ menu: Mark ran / Didn't run, Move week, Reset week to bank.

## 5. Generation logic (deterministic: no AI, no network, no randomness)
1. **Which week:** `wk = floor((today − blockStart) / 7) + 1`, adjusted by `moved`. If today is after this week's session day/time (`b.time`), or that week is marked ran or not run, show the next week. Before the block: week 1. After the last week: a "Block finished. Plan the next block" card using the existing block setup. No manual step.
2. **Topic:** `b.plan[wk].topic` → `TOPIC_BANK.topics[id]`, then apply `weeks[i].ovr`. If no topic is set, the card says "Pick a topic" and offers bank topics ranked by last block's reflections (§7).
3. **Questions:** `common_questions`, plus topic questions, plus `ovr.questions`. Pre-fill from `ans`, then reflection carry-overs (only those in `carry.use`), then topic defaults.
4. **Where to look:** load `library.json` (cached) and merge `resList()`. Score each item:
   - +3 per `theme` overlap with the topic's `libTags.theme`, plus reflection improve tags
   - +3 if the `moment` matches
   - +2 if the `system` matches 3-5-2 or back three
   - +2 if the age band covers U15 (U12-U16, U14-U15, U14U15, U16-U17), +1 for U17, 0 for Adult (masterclasses)
   - +1 per `players` match with the expected numbers
   - +1 if the type isn't already in the top list (diversity)
   - −2 if the item was shown in either of the last 2 weeks
   
   Ties go to type order pdf > animation > x > masterclass > video > search, then title A–Z. Take the top 6 (min 4, max 8), with at most 3 of any one type and at least 1 pdf if any score > 0. Apply `hideLook`/`addLook`.
5. **Points:** bank `points` (4–6), plus `ovr.points` (replace if set).
6. **Drill seed:** `drillTags` + answers + reflection tags → `weeks[i].rc = [topic, tokens]` and `b.free`. This is the existing `sbPool` hook. Answer mapping: players → group size, split → `w.split` + `lead`, moment/area/units/words → tokens.
7. Put the whole function in `coach/guide.js` as `buildGuide(state, bank, lib, today) → guide`. It must be pure, so it can be unit-tested with fixed inputs.

## 6. Reflections: capture

Extend the current `train` review. Do not replace the sliders, text, actions or match/peer reviews.
- `ran`: `'yes' | 'no'`, plus `why` when no. Use chips: weather, pitch, numbers, other.
- `well`: chips drawn from that session's coaching points and drill names (taken from the generated guide and the block builder run card), plus a short note of 140 characters max.
- `improve`: same chip source, plus a note of 140 characters max.
- `stood`: who did well, as shirt numbers and/or unit chips (GK, back 3, wing-backs, midfield, front 2), with an optional note per entry.
- `strug`: who struggled, in the same format. Notes stay inside this coach-only view.
- Marks are kept per coach: the review already has `by`, and each coach writes their own review for the same session (link them with a `sid` = session date/id). Show the reviews side by side and never average them into one.
- `self`: optional player self-marks (1–5 per coaching point). Store them only if a player self-review flow already exists. Otherwise leave a stub field and don't build a player flow.
- Reuse the existing `S.settings.sb` slot/drill ids so that chips map cleanly.

## 7. Reflections: shared storage and "From last week"
### 7.1 Shared storage (required)
- Use the existing backend only (Apps Script plus the Sheet). Add no new services.
- Store each review as its own sync doc, `kind:'rev'`, keyed by `id`, through the same `sync` path as `player`/`match`/`idea`. Add `rev` to the backend dispatcher and accepted kinds. It's coach-code only.
- Migrate `S.settings.rev` once, idempotently, and read the old location as a fallback for one release.
- Fallback if the backend change can't land: merge `rev` by `id` (newest `at` wins) inside `sync()` instead of replacing the settings doc. Say which route you took in the PR.
- Apply the same per-doc safety to `weeks[i].ans`, `ovr` and `carry` if both coaches can edit them: merge per week by `at`.

### 7.2 "From last week" panel
- Take the most recent `train` reviews dated before this week's session. Group them by `sid` and show Tim | Deano columns.
- **Differences:** flag a chip one coach put under well and the other under improve. Flag the same unit or number under stood by one coach and strug by the other. Flag sliders that differ by 2 or more.
- **Pre-fill:** units from `strug` (shirt number → unit via squad positions) become "Units to target". The top `improve` tags become the focus/moment answer and add +3 to matching library themes.
- **Drills:** improve/strug tags go to `sbPool` tokens. Each practice tagged `well` gets "Next: <progression>": the next drill in the same group/level, or one matching progression/overload/+1 keywords, otherwise "Repeat with a constraint".
- Each carried item is a chip with include/drop. Nothing applies until the coach taps "Use these". `carry` is remembered per week.
- With no reviews the panel is hidden. With one coach's review, show one column and "Deano hasn't reflected yet" (or Tim).
- Mapping is a fixed table (`REFLECT_MAP` in `guide.js`), with unit tests.

## 8. Library index: build and refresh (as simple as possible)
- **`tools/build-library.mjs`** (Node 18+, no dependencies): `node tools/build-library.mjs <export.csv|export.json> [--overrides tools/library-overrides.json] > coach/library.json`.
  - Input: a Drive export with one row per file (`id,name,mimeType,folderPath,url,xUrl?`). Tim can make it with any Drive lister, or by exporting a folder listing to CSV.
  - Steps:
    1. Infer `type` from the folder (Coaches Voice → pdf; Masterclasses index rows → masterclass; X Sessions → x, using the post URL from `xUrl` or the note; Animations → animation).
    2. Infer tags from the folder and title keywords using a keyword table (port the table below).
    3. Infer age from `U\d+(-U\d+)?`, players from `\d+v\d+`, and system from `3-5-2|3-4-3|4-3-3|back three`.
    4. De-duplicate copies (`(2)`, `(3)`).
    5. Apply overrides (by id or url: add tags, or `drop:true`).
  - Output is sorted by id, so diffs stay small.
  - Keyword table, starting point: build/playing out → build-up/playing out; press → pressing; counter/transition/regain → transition; low block, mid block, defend, box, compact → out of possession; overload, wide/width, wing-back, cross, finish, possession/rondo, third man, between the lines, break/line → breaking lines; 1v1, turn, dribble, goalkeeper, set piece/corner/free kick, pass, receive, marking, support, progress, direct, strength/conditioning → physical, overlap, rotation, final third.
- **`tools/library-overrides.json`**: hand fixes (`{ "<id>": { "tags": {...}, "drop": true } }`).
- **Optional GitHub Action** (`.github/workflows/library.yml`, weekly plus manual): lists the Drive folders with the Drive API, runs the script and opens a PR if `library.json` changed. **This is optional and needs a Google service account with read access to those Drive folders**, stored as the `GDRIVE_SA_JSON` repo secret, plus the folder ids as repo variables. If the secret is missing, the job exits cleanly.
- **Fallback:** Tim's assistant (Grok Bot) runs the script on an export and opens a PR or hands Tim the file. This is the only part that may involve an assistant, and it is optional.
- Drive folder ids (for the Action or fallback):
  - Coaches Voice `1I1mZb8lWx5VFJ0bWrLh-0Yq87FajtHal` (including subfolders)
  - X Sessions `1ls1UXGWhNTqdVGWf1ljrYe3QjlFD6e1g`
  - Animations `1-ZWRAU8aZj9HkiEzT9Pfi4NTnWff_VUK`
  - Masterclasses come from the CV Academy index (a URL list in the overrides or CSV)

## 9. Notification
Coach-only "Next week's guide ready" using the existing `.dot` badge on the Plan mode and This week tab. Show it from the day after a session (or once that session is marked ran) until a coach opens the new week's guide. The seen state is stored per coach in localStorage (`tl.guideSeen`). No push messages and nothing on family or player pages.

## 10. Seed content for `topic-bank.js` (Block 3, from Wed 4 Nov 2026, 6 weeks: 4, 11, 18, 25 Nov, 2, 9 Dec)
Set `b.blockStart='2026-11-04'`, `day=3`, and `plan` = weeks 1–6 topics below.

Common questions: `players` How many players expected? [10-12, 13-15, 16+] · `split` Split week? [No, Yes] + who leads each part [Tim, Deano] · `moment` Which moment? [In possession, Win it (attacking transition), Lose it (defensive transition), Out of possession] · `area` Which area? [Defensive third, Middle third, Final third, Whole half] · `last` Building on from last week? (text) · `target` Units to target? [Back three, Midfield, Wing-backs, Front two, Keeper] (team-level only) · `kit` Area and kit [Half astro, Full astro, Grass]; goals [Big goals, Mini goals, Gates] · `mins` Session length [60, 75, 90]

### Week 1 · `receive-forward` · Wed 4 Nov · Shape to receive, first pass forward ("Show, Support, Stretch, then Spring")
Extra question: `rec` Who do we want receiving forward most? [Back three into midfield, Midfield into front two, Wing-backs inside]
Coaching points:
1. **Show** for the ball: get into a passing lane, away from your marker, and be seen. A lane is a clear line between you and the ball.
2. **Support** at an angle, not flat. Give the passer a safe option either side or behind.
3. **Stretch** the pitch: wide players stay wide and the front player stays high, so the gaps open up between the lines (the spaces between their defence, midfield and attack).
4. Scan before it arrives: look over your shoulder twice, so you know what's on before your first touch.
5. Open body and half-turn: receive side-on on your back foot (the foot furthest from the ball), so you can see forward and play forward in one or two touches.
6. **Spring**: the first look is forward. If it's on, play it and run beyond. If not, keep it and go again.
Pinned looks (optional `addLook` defaults; ranking fills the rest):
- pdf · U12-U16 Creating space to receive on the half-turn (Coaches Voice): https://drive.google.com/file/d/11Bez-iCWMuIq1gdKa2gacJrPQhmJ4KR6/view (our age band, exactly the receiving skill)
- pdf · U12-U16 Passing and receiving to play forward (Coaches Voice): https://drive.google.com/file/d/1HfUWmaS4awJLh07WxpUJXNSDx_kClU97/view (arrival/technical ideas)
- pdf · u14-u15 Using the third man 1 (Coaches Voice): https://drive.google.com/file/d/1iRgoo8doz0aLMMQ2p9xlJj9gZUXiVSBu/view (U14–U15; how the first pass forward finds a free player)
- pdf · U12-U16 Breaking lines (Coaches Voice): https://drive.google.com/file/d/1swiSAmLi681cFWfCjFEOGQqdBpn4V4m4/view (opposed practice and game)
- masterclass · Xavi: Changing position and the third man (12 min): https://academy.coachesvoice.com/programs/xavi-masterclass-tacics-barcelona-spain (movement to receive)
- masterclass · Cesc Fàbregas: Building up to attack (8 min): https://academy.coachesvoice.com/programs/cesc-fabregas-masterclass-building-up-to-attack (shape to play forward)
- x · Playing through midfield in a 3-5-2, @footballdna_: https://x.com/footballdna_/status/1784124727545463238 (midfield triangles, finding the 8 between the lines)
- animation · Unopposed building patterns, 2D curved + voiceover (our narrated 3-5-2 animation): https://drive.google.com/file/d/1ZtCVqM5GBtc4GmTUtgPJD_hPOqYQSORM/view
drillTags: topic 0 (breaking lines), words [receive, half turn, forward, third man, rondo, lines]

libTags: moment [in possession], theme [receiving, breaking lines, third man, build-up], system [3-5-2]

### Week 2 · `counter-3-runners` · Counter attack: first pass splits the lines, three runners
1. **Win it, look forward**: the first look after winning it is the furthest forward player.
2. **Split pass**: play through or between two opponents, not round them.
3. **Three runners**: one central, one each side. Width stretches the recovering defenders.
4. **Run beyond the ball**: support ahead of the ball, not behind it.
5. **Finish in six passes or fewer**: if the counter is gone, keep it and reset the shape.
drillTags topic 7 [counter, transition, runners, forward] · libTags moment [transition], theme [transition, counter-attack, combinations]

### Week 3 · `counter-press` · Lose it, react: five-second counter press (split week, Deano leads part of practice 2)
1. **Five-second rule**: the nearest three press straight away for five seconds.
2. **Cut the forward pass**: press from the front side, blocking the lane forward.
3. **Compact behind**: the others squeeze in to shrink the space.
4. **Win it or foul-free delay**: if it isn't won in five seconds, drop into shape.
5. **Talk**: one voice calls "Press!" or "Drop!".
drillTags topic 7 [counter press, lose it, react, transition] · libTags moment [transition, out of possession], theme [pressing, transition]

### Week 4 · `build-from-gk` · Build from the keeper into the shape, then break
1. **Width and depth**: outside centre-backs split wide, the wing-backs go high, and a 6 shows centrally.
2. **Keeper as a player**: the keeper is the spare man (+1).
3. **Bait and switch**: draw the press to one side, then switch.
4. **Play through, round or over**: pick the option the press leaves open.
5. **Break the first line**: when it's broken, attack the space at speed.
drillTags topic 0 [build, keeper, playing out, overload] · libTags moment [in possession], theme [build-up, playing out, overloads], system [3-5-2]

### Week 5 · `rotate-roles` · Rotate roles in 8v8 so everyone plays every job (split week)
1. **Rotations**: when a teammate leaves a space, fill it.
2. **Third-man runs**: the run that receives the second pass.
3. **Scan**: know who is behind you before you rotate.
4. **Keep the shape's skeleton**: 3 behind the ball at all times.
5. **Communicate the swap**: "Swap" or "Stay".
drillTags topic 0 [rotation, interchange, 8v8, positional] · libTags theme [rotations, third man, possession]

### Week 6 · `shape-transition-game` · Shape and transition in the game, bridge to the next block (Deano designs a practice; close to Christmas, next block probably January)
1. **Shape first**: get back into the 3-5-2 shape in and out of possession.
2. **Transition triggers**: a loose touch, a backward pass or a bad touch.
3. **Rest defence**: 3 + 1 stay behind the ball when we attack.
4. **Quick decisions**: counter or keep it.
5. **Review it**: players say one thing that worked.
drillTags topic 7 [transition, game, 8v8, shape] · libTags moment [transition], theme [transition, shape]

## 11. Safeguarding and content rules
- The guide, reflections, topic bank and library are **coach-only**, behind the existing coach code. Never in `family.html`, `parents.html`, player views, push, `sbPdf` or `sbPublish`. Parents see shirt numbers only.
- `stood`/`strug` use shirt numbers and units only. No welfare or ability language may appear outside the coach view. Notes go through the existing welfare word check: a hit raises the existing coach alert and is not carried forward.
- Player data is never exported (no CSV, copy-out or printing of reflections).
- Coaches' Voice (session plans and Academy) is paid content: **link only**. Never rehost, proxy, cache, embed or copy text into the repo. `library.json` holds titles, links and tags only.
- Nothing goes out without the existing explicit Publish/Post/Send.

## 12. Performance
- `library.json` (about 170 KB) is **lazy-loaded only when Plan opens**, with `fetch` then an in-memory cache. Add it to `sw.js` runtime caching (network-first, so it works offline after the first load). It is not part of the app-shell precache, and it is never loaded on Run, Squad or family pages.
- `topic-bank.js` and `guide.js` are small and load with the coach shell. Render only the selected week. Generation takes under 50 ms on a mid-range phone.
- Lighthouse is no worse than on main.

## 13. Acceptance criteria
- [ ] With no manual step, on 29 Oct 2026 the guide shows Wk 1 · Wed 4 Nov. On Thu 5 Nov it shows Wk 2. Faking today as 26 Nov 21:00 (after the session) shows Wk 5.
- [ ] `b.start` no longer drifts once the block has started. Move week and Mark ran behave as before, and the cascade works.
- [ ] Each week shows the topic, questions, 4–6 points with term explanations, and 4–8 Where to look items from `library.json` + `res.js`, each with the right Open button label. X/IG/video open in the embed viewer and the rest open a new tab.
- [ ] Week 1 ranking includes at least 2 U12–U16 receiving/breaking-lines PDFs and the 3-5-2 build-up animation. Week 2 includes U17 counter-attacking and an X transition post.
- [ ] `buildGuide` returns identical output for identical inputs (unit test). No network calls during generation.
- [ ] Coach edits (topic, points, add/hide link, answers) persist, sync to the other coach's device, and "Reset week" restores the bank values.
- [ ] Reflections: two coaches saving offline on two devices both survive sync. The panel shows both columns, the difference flags and the pre-fills. Include/drop works and nothing applies before "Use these".
- [ ] The "Next week's guide ready" dot shows the day after a session for coaches only, and clears when the guide is opened.
- [ ] `library.json` loads only after Plan opens (network tab) and works offline after that.
- [ ] Nothing new appears in family/player views, push, PDF or publish output.
- [ ] `node tools/build-library.mjs sample.csv` reproduces the seed format. The Action is skipped cleanly with no secret.
- [ ] Everything on the don't-break list works.

## 14. Test steps
1. Serve `coach/` locally and log in as coach (don't print or commit codes). Open the network tab.
2. Go to Plan → This week: check Wk 1 and that `library.json` was fetched only now. Tap the Open buttons for pdf, x, masterclass and animation.
3. Override today's date (a dev query param such as `?today=2026-11-05` in dev only) and check the week moves forward. Also test 26 Nov at 21:00.
4. Edit the topic and a point, hide a link, add a link, answer the questions. Sync on a second browser as Deano and check the changes are there. Then Reset week.
5. As Tim and Deano, offline, write conflicting reviews for 4 Nov. Go online and sync. Check that week 2 shows both columns, the flags and the pre-fills. Drop a chip, tap Use these, and check the picker tokens and the Suggest one output.
6. Check the badge appears the day after the session and clears when the guide is opened. Log in as a family/player: no badge and no guide.
7. Run the unit tests (`buildGuide`, `REFLECT_MAP`, ranking) twice and confirm the output is identical.
8. Go offline and reload: the guide and library still work.
9. Run `node tools/build-library.mjs` on a 5-row sample CSV and check the output.
10. Run the don't-break list.

## 15. Don't-break list
Match day and the clock, team sheet/Suggest XI, attendance, Reflect (sliders, actions, match/peer reviews), welfare (heading counter, concussion log, Welfare admin), the block builder (Suggest one, search, own idea, library, split, leads, run card, record, PDF, publish), posts and push sends, the Library and requests (`RQN` badge), Sessions, Animations, Listen, Stats, Goals, Fitness, Privacy and data requests, the account switcher, auto-update, embeds (`x.js`, `ig.js`, `res.js`), family/parents/player pages, and offline mode.

## 16. Deliver
A PR from `feature/week-guide` containing:
- `coach/guide.js`, `coach/topic-bank.js` and `coach/library.json` (the supplied seed)
- `tools/build-library.mjs`, `tools/library-overrides.json`, the optional workflow and tests
- the backend `rev` kind
- the `sw.js` bump

Include screenshots of the week strip, the Wk 1 guide (Open buttons visible), the From last week panel with flags, the builder after Pick drills, the badge, and the unchanged family view. Note which §7.1 route you took. **Don't merge or push to main.**
