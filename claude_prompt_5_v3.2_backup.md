# Claude prompt 5 (v3): Weekly session guide in Plan

Repo `wardyboy11-hue/touchline`, folder `coach/` (live: https://touchline.cipher-training.co.uk/coach/). Team: Wigan Junior Latics U15 Blues. Coaches: Tim and Deano. Work on branch `feature/week-guide`, open a PR, and **don't push to main**.

## 1. Goal
Each week of the block, the Plan page shows a short guided "this week" card that helps a coach plan the session:
1. **Topic and date** up front, e.g. "Wk 1 · 4 Nov · Shape to receive, first pass forward".
2. **Build this week's session**: quick tap/chip questions that shape the outline.
3. **Where to look**: resources to study first. Each one has a proper **Open** button.
4. **Key coaching points**: 4–6 points in coach language, with any terms explained briefly.
5. **Pick the drills** with the app's **existing** builder and picker ("Suggest one", search, own idea, session library). The answers from step 2 pre-filter or pre-seed that picker.

The content comes from a hard-coded weekly data file, `coach/plan-weeks.js`. It works the same way as `x.js`, `ig.js` and `res.js`. Tim's assistant updates it every week, so the app has no Drive access or AI calls. The app shows the **next upcoming week by default**.

No session packs exist yet, so every week starts as not built.

## 2. What already exists (extend it, don't rebuild)
- `coach/app.js`:
  - The Plan tabs come from `TM.plan` = Build (`sb`), This week (`plan`), Attendance, Reflect.
  - The block builder is the `sb*` functions (about lines 935–1110): `sb()` sets `S.settings.sb` (the active block: `start`, `fmt` weeks, `weeks[]` with slots `s`, `lead`, `split`), `sbSlots`, `sbPool`/`sbFill` ("Suggest one"), `sbPickOpen`/`sbSearch`/`sbUse`/`sbOwn`, `sbGroups`, `sbRunCard`, `sbRecord`, `sbPdf`, `sbPublish`.
  - `sbPool` already takes free-text tokens (`b.free`) and per-week `rc` hints (`[topicIdx, tokens]`). **Feed the guide answers and the week's `drillTags` in through this existing hook.** Don't write a new ranking engine.
- `SESS_SEED` has "Win It, Spring" dated 28 Oct, labelled "Block 3, week 2 of 6". It never ran and isn't a finished pack. Leave it in the library as a reference idea, and relabel it "Reference idea: lose it, react (from 28 Oct draft)" so nobody thinks week 3 is built. Keep its animations working.
- `x.js`/`ig.js`/`res.js` play content through official embeds. **Reuse the existing embed viewer** for X, Instagram and video links.
- `sw.js`: network-first. Add `plan-weeks.js` to the shell and bump the cache version.

## 3. Content file: `coach/plan-weeks.js` (the schema Grok fills in each week)
```js
/* Weekly session guide. Filled in weekly by Tim's assistant. Coach-only. No player names or welfare data. */
window.PLAN_WEEKS = {
  block: { id:'b3', name:'Block 3: Shape and Transition (attacking)', start:'2026-11-04', day:'Wed' },
  weeks: [
    { wk:1, date:'2026-11-04',
      topic:'Shape to receive, first pass forward',
      tagline:'Show, Support, Stretch, then Spring',        // optional
      status:'not-built',                                     // not-built | outline | built | ran | not-run | moved
      split:false, leads:{ },                                 // e.g. { p2b:'Deano' } or note:'Deano designs a practice'
      note:'',                                                // optional coach note, e.g. Christmas
      questions:[ { id:'players', q:'How many players?', type:'chips', opts:['10-12','13-15','16+'] }, … ],
      look:[ { type:'pdf'|'masterclass'|'x'|'video'|'animation'|'search',
               title:'…', src:'Coaches Voice', url:'https://…', why:'one line', mins:8 } ],
      points:[ 'Coach-voice point. Term (meaning).', … ],    // 4–6
      drillTags:{ topic:0, words:['receive','forward','half turn','third man'] }  // seeds sbPool
    }
  ]
};
```
Rules for the file: every `look` item **must** have `url` and `type`. Unknown fields are ignored, and missing optional fields simply hide that section. Question types are `chips` (single choice), `multi`, `number` and `text` (short, team-level only).

## 4. UI (Plan → This week card, plus a week strip)
- **Week strip** across the top: one chip per week, showing "Wk n · date" and a status dot. The default selection is the next week on or after today. Tapping a chip shows that week's guide.
- **Guide card**:
  1. Topic line, tagline, split/lead badges (e.g. "Split week", "Deano leads practice 2B") and any note.
  2. **Build this week's session**: render `questions` as chips. Save answers to `S.settings.sb.weeks[i].ans` (coach device and sync, like the other settings).
  3. **Where to look**: one row per item showing the title, a source badge, the `why` line and minutes, plus a **real button** (min 44px tap target, not a text link) labelled by type:
     - pdf → "Open PDF"
     - masterclass → "Watch masterclass"
     - x → "Open post"
     - video → "Watch"
     - animation → "Play animation"
     - search → "Search"
     X, Instagram and YouTube/video URLs open in the **existing embed viewer**. Everything else opens in a new tab (`target="_blank" rel="noopener"`). Private Drive and CV Academy links are just links: no embedding, proxying or caching.
  4. **Key coaching points**: a bulleted list. It's also copied into the run card's coaching points when the session is built (`cpB`).
  5. **Pick drills**: a button that opens the existing Build flow for that week, with `b.week` set. The answers plus `drillTags` go to `sbPool` (players → group size, split → `w.split` + `lead`, moment/area/words → tokens). The existing Suggest one / search / own idea / library work as they do now.
- Small extras: a ⋯ menu for **Mark ran / Didn't run** and **Move week** (+7 days, with an option to move the later weeks too, stored as `w.moved`).

## 5. Rules
- Coach-only. Nothing from this card goes to family/player views. Parents see shirt numbers only.
- Coaches' Voice and other paid content is link-only to Tim's private Drive or the CV Academy page. Never rehost it.
- Nothing goes out without the existing explicit Publish/Post/Send.
- Questions are team-level only, and no player data leaves the device.
- Keep it fast: `plan-weeks.js` is small (under 30 KB). Render only the selected week. It works offline.
- Keep all existing features: match day, the clock, attendance, Reflect, welfare (heading counter, concussion log), the block builder, the run card, PDF, posts, account switcher, auto-update, embeds and animations.

## 6. Acceptance criteria
- [ ] Plan → This week shows the week strip (4, 11, 18, 25 Nov, 2, 9 Dec) and opens the next upcoming week by default (week 1 before 4 Nov).
- [ ] Week 1 shows the topic line, questions, 4–6 coaching points and its "Where to look" list.
- [ ] Every "Where to look" item has a visible button with the right label for its type. X/IG/video open in the embed viewer, and everything else opens in a new tab.
- [ ] Answers persist per week. Pick drills opens the existing builder for that week, and the first "Suggest one" reflects the drill tags and answers. The split answer gives the split slots and leads.
- [ ] Coaching points appear on the run card.
- [ ] Editing only `plan-weeks.js` (e.g. adding a link to week 2) changes the app after a refresh, with no other code changes.
- [ ] All weeks start not built. The 28 Oct "Win It, Spring" shows only as a reference idea.
- [ ] Family/parent view is unchanged. Lighthouse isn't worse than on main, and it works offline.

## 7. Test steps
1. Serve `coach/` locally and log in as a coach (don't print or commit codes).
2. Plan → This week: check the default week, then tap through the week chips.
3. Week 1: answer the questions and tap each Open button (PDF opens a new tab, X opens the embed viewer).
4. Pick drills → Suggest one → check the suggestions are relevant. Build → make the run card → check the coaching points.
5. Mark week 1 ran, then use Move week on week 4 (with the cascade option), then undo it.
6. Add an item to week 2 in `plan-weeks.js`, refresh, and check it shows.
7. Family view: check nothing new appears. Go offline and reload: the guide still shows.

## 8. Deliver
A PR from `feature/week-guide` with screenshots of the week strip, the week 1 guide (Open buttons visible), the builder after Pick drills, and the unchanged family view. **Don't merge or push to main.**

---
## 9. Seed: `coach/plan-weeks.js` content
Common questions for every week (unless a week overrides them):
`players` How many players expected? [10-12, 13-15, 16+] · `split` Split week? [No, Yes] + who leads each part [Tim, Deano] · `moment` Which moment? [In possession, Win it (attacking transition), Lose it (defensive transition), Out of possession] · `area` Which area? [Defensive third, Middle third, Final third, Whole half] · `last` Building on from last week? (text) · `target` Units to target? [Back three, Midfield, Wing-backs, Front two, Keeper] (team-level only) · `kit` Area and kit [Half astro, Full astro, Grass]; goals [Big goals, Mini goals, Gates] · `mins` Session length [60, 75, 90]

### Week 1 · Wed 4 Nov · Shape to receive, first pass forward ("Show, Support, Stretch, then Spring")
Extra question: `rec` Who do we want receiving forward most? [Back three into midfield, Midfield into front two, Wing-backs inside]
Coaching points:
1. **Show** for the ball: get into a passing lane, away from your marker, and be seen. A lane is a clear line between you and the ball.
2. **Support** at an angle, not flat. Give the passer a safe option either side or behind.
3. **Stretch** the pitch: wide players stay wide and the front player stays high, so the gaps open up between the lines (the spaces between their defence, midfield and attack).
4. Scan before it arrives: look over your shoulder twice, so you know what's on before your first touch.
5. Open body and half-turn: receive side-on on your back foot (the foot furthest from the ball), so you can see forward and play forward in one or two touches.
6. **Spring**: the first look is forward. If it's on, play it and run beyond. If not, keep it and go again.
Where to look:
- pdf · U12-U16 Creating space to receive on the half-turn (Coaches Voice): https://drive.google.com/file/d/11Bez-iCWMuIq1gdKa2gacJrPQhmJ4KR6/view (our age band, exactly the receiving skill)
- pdf · U12-U16 Passing and receiving to play forward (Coaches Voice): https://drive.google.com/file/d/1HfUWmaS4awJLh07WxpUJXNSDx_kClU97/view (arrival/technical ideas)
- pdf · u14-u15 Using the third man 1 (Coaches Voice): https://drive.google.com/file/d/1iRgoo8doz0aLMMQ2p9xlJj9gZUXiVSBu/view (U14–U15; how the first pass forward finds a free player)
- pdf · U12-U16 Breaking lines (Coaches Voice): https://drive.google.com/file/d/1swiSAmLi681cFWfCjFEOGQqdBpn4V4m4/view (opposed practice and game)
- masterclass · Xavi: Changing position and the third man (12 min): https://academy.coachesvoice.com/programs/xavi-masterclass-tacics-barcelona-spain (movement to receive)
- masterclass · Cesc Fàbregas: Building up to attack (8 min): https://academy.coachesvoice.com/programs/cesc-fabregas-masterclass-building-up-to-attack (shape to play forward)
- x · Playing through midfield in a 3-5-2, @footballdna_: https://x.com/footballdna_/status/1784124727545463238 (midfield triangles, finding the 8 between the lines)
- animation · Unopposed building patterns, 2D curved + voiceover (our narrated 3-5-2 animation): https://drive.google.com/file/d/1ZtCVqM5GBtc4GmTUtgPJD_hPOqYQSORM/view
drillTags: topic 0 (breaking lines), words [receive, half turn, forward, third man, rondo, lines]

### Week 2 · Wed 11 Nov · Counter attack: first pass splits the lines, three runners (outline)
Points to come. Look:
- pdf · u17 Counter-attacking: https://drive.google.com/file/d/1Yf0Ph5L-JJRX5usTGDkI0zfEybpQHBfh/view
- pdf · U17 Counter-attacking from a 3-5-2: https://drive.google.com/file/d/14K9P1xJlIO1X0Z8VHs7oYbcePYj8QnWc/view
- x · Transition combinations (counter-attack), @TheS_Resource: https://x.com/TheS_Resource/status/2115521229574885625
drillTags: topic 7, words [counter, transition, runners, forward]

### Week 3 · Wed 18 Nov · Lose it, react: five-second counter press (outline; split week, Deano leads part of practice 2)
Look:
- pdf · u17 Counter-pressing: https://drive.google.com/file/d/1Zvww9HfQy_-AU940GVkW0YVFImQ-Im-3/view
- pdf · U17 Defensive transition principles: https://drive.google.com/file/d/1xF0Hfw77GujzL1q-bx0SjVsit60pt9PB/view
- pdf · Reference idea, 28 Oct "Win It Spring" draft (not a finished pack): https://drive.google.com/file/d/1JyN8YA-rH8BIMlr6u-zE8uK6tzDcuXUm/view
drillTags: topic 7, words [counter press, lose it, react, transition]

### Week 4 · Wed 25 Nov · Build from Noden into the shape, then break (outline)
Look:
- pdf · U14-U15 Building out from the back 1: https://drive.google.com/file/d/12qcGWdFX58dkMeKbuycty9kfbgMdyetj/view
- masterclass · Álvaro Benito: Playing through a high press: https://academy.coachesvoice.com/programs/alvarobenito_mc_eng_ep01_v3mp4-c9e60d
- animation · 9v8 position-specific practice, 2D narrated (v3, building out under pressure): https://drive.google.com/file/d/1i2jvOifOM7IyW19OfNMZx-l1n1q-fnkr/view
drillTags: topic 0, words [build, keeper, playing out, overload]

### Week 5 · Wed 2 Dec · Rotate roles in 8v8 so everyone plays every job (outline; split week)
Look:
- pdf · U17 Wide rotations: https://drive.google.com/file/d/1C79a__5w7qlrH9n95_cdeg6SdhV_JM1-/view
- pdf · Block Four Week Six, Small-sided games: https://drive.google.com/file/d/1-MqESUct4ebhndJ_cq9U0vcQFcvJ3b73/view
- masterclass · Xavi: Changing position and the third man: https://academy.coachesvoice.com/programs/xavi-masterclass-tacics-barcelona-spain
drillTags: topic 0, words [rotation, interchange, 8v8, positional]

### Week 6 · Wed 9 Dec · Shape and transition in the game; bridge to the next block (outline; Deano designs a practice)
Note: close to Christmas, so the next block probably starts in January.
Look:
- pdf · Block Six Week Two, Exploiting space in attacking transition: https://drive.google.com/file/d/1TShiuBicwqJN8nI359v8VQQitkdS_PdW/view
- pdf · u17 Defence to attack transition: https://drive.google.com/file/d/19TF0I6kD8u7CJmfPxt2KroijfkHbr9Nb/view
- search · SSP: transition game: https://www.sportsessionplanner.com/search?q=transition%20game
drillTags: topic 7, words [transition, game, 8v8, shape]

---

## Addendum: reflections feed next week

The app should turn Tim's and Deano's Reflect notes into next week's starting point by itself. Grok does not read Reflect. `plan-weeks.js` still holds the topic, links and coaching points, and Grok updates it weekly. Everything below is a layer the app adds on top of that file.

### How Reflect stores data today (verify before changing)
- Reviews live in `S.settings.rev`, which is an array. `rvNew(k)` creates `{id, kind:'train'|'match'|..., date, by: who()||'Tim', title, sc:{} sliders 1–5, tx:{} free text incl. tx.act actions, c:{}, w:{}, d:{} action ticks, at}`. `rvSave()` calls `touch('settings', S.settings)`.
- `touch` marks the doc dirty. It's cached in localStorage (`load()`/KEY) and pushed by `sync()` to the Apps Script backend (`API`, `call('sync')`), which writes to the private Google Sheet (`SSID`). Both coaches' reviews therefore already reach one shared store, tagged `by`.
- **Risk to fix:** `settings` syncs as ONE document with whole-doc last-write-wins on `updatedAt`. If Tim and Deano both write reviews before syncing, one coach's reviews can silently overwrite the other's. That is a real data-loss bug for this feature.

### 1. Shared storage (required)
- Use the existing backend only: Apps Script plus the Sheet. Add no new services.
- Store each review as its own sync doc, `kind:'rev'`, keyed by `id`, using the same `sync` path as `player`/`match`/`idea`. That way two coaches never clobber each other.
- Migrate the existing `S.settings.rev` entries once, idempotently. Keep reading the old location as a fallback for one release.
- Add `rev` to the backend dispatcher and to the doc kinds it accepts. The route is coach-code only.
- If the backend change can't land, a fallback is acceptable: merge `rev` arrays by `id` (newest `at` wins per item) inside `sync()` instead of replacing the whole settings doc. Say which route you took in the PR.

### 2. What Reflect captures for each training review
Extend the current `train` review. Do not replace the sliders, text, actions or match/peer reviews.
- `ran`: `'yes' | 'no'`, plus `why` when no. Use chips: weather, pitch, numbers, other.
- `well`: chips drawn from that session's coaching points and drill names (taken from `plan-weeks.js` and the block builder run card), plus a short note of 140 characters max.
- `improve`: same chip source, plus a note of 140 characters max.
- `stood`: who did well, as shirt numbers and/or unit chips (GK, back 3, wing-backs, midfield, front 2), with an optional note per entry.
- `strug`: who struggled, in the same format. Notes stay inside this coach-only view.
- Marks are kept per coach: the review already has `by`, and each coach writes their own review for the same session (link them with a `sid` = session date/id). Show the reviews side by side and never average them into one.
- `self`: optional player self-marks (1–5 per coaching point). Store them only if a player self-review flow already exists. Otherwise leave a stub field and don't build a player flow.
- Reuse the existing `S.settings.sb` slot/drill ids so that chips map cleanly.

### 3. "From last week" panel (top of next week's guide)
- Find the most recent `train` reviews with a date earlier than this week's date. Group them by `sid` and show Tim | Deano in two columns.
- **Differences:** flag a chip that one coach put under well and the other put under improve. Flag the same unit or shirt number listed under stood by one coach and strug by the other. Flag any slider that differs by 2 or more.
- **Pre-fill the guided questions:** units in `strug` (or units of the shirt numbers in it, taken from the squad's positions) become the "Which units to target?" answer. The top `improve` tags become the "Focus" answer, matched to `topics.js` keywords or `plan-weeks.js` question options.
- **Seed the drill picker:** feed the same tags into the `sbSearch`/`sbPool` filters. For each practice tagged `well`, suggest its next progression: the next slot or level in the same group, or the drill whose keywords match "progression"/"+1"/"overload". If there's no clear match, show "Repeat with a constraint".
- Every carried-forward item is a chip with include/drop. Nothing is applied until the coach taps "Use these". Dropped items are remembered for that week.
- If there are no reviews, hide the panel. If only one coach reviewed, show one column and the note "Deano hasn't reflected yet" (or Tim).

### 4. Deterministic only
- Use a fixed tag and keyword mapping table in code (for example `REFLECT_MAP` in `plan-weeks.js` or a new `reflect-map.js`). There is no AI, no external calls and no randomness, so the same inputs always give the same output.
- Unit tests cover the mapping.

### 5. Safeguarding
- The panel and new fields are coach-only and sit behind the existing coach code. They must never reach `family.html`, `parents.html`, player views, push messages, PDFs (`sbPdf`) or publish (`sbPublish`).
- `stood`/`strug` use shirt numbers and units only. No welfare or ability language may appear outside the coach view.
- Notes run through the existing welfare word check. A hit raises the existing coach alert path and is not carried forward.
- Player data is never exported: no CSV, no copy-out, no inclusion in shared or printed plans.
- Backend routes reject any non-coach role.

### 6. Acceptance criteria
- [ ] Tim and Deano each save a review for the same session on two devices while offline. After both sync, BOTH reviews exist on both devices (no overwrite).
- [ ] Existing reviews migrate and still show, with sliders, actions and ticks unchanged.
- [ ] The new fields (`ran`, `well`, `improve`, `stood`, `strug`, `self`) save and sync, and are optional.
- [ ] The next week's guide shows "From last week" with two columns and correct difference flags.
- [ ] The questions are pre-filled from `strug`/`improve`, and the drill picker is pre-filtered. A `well` practice gets a progression suggestion.
- [ ] Every item can be included or dropped, and nothing applies before "Use these".
- [ ] The same inputs always produce the same output, with no network calls from the mapping (check the DevTools network tab).
- [ ] Nothing from Reflect appears in family/parent/player pages, push, PDF or publish output (grep the rendered HTML and payloads for shirt numbers and note text).
- [ ] All existing features still work, and `plan-weeks.js` content still drives topic, links and points.

### 7. Test steps
1. Open two browsers with the coach code (Tim, Deano), go offline in both and write conflicting reviews for the same session. Go online and sync both. Confirm both reviews are present in each browser and in the Sheet.
2. Tim marks "Third-man run" as well and lists back 3 under struggled. Deano marks it as improve and lists #6 under stood. Open next week and check that the flags, the units pre-fill (back 3) and the focus are correct.
3. Drop one chip and tap "Use these". Check the picker filters, then reload and confirm the drop persists.
4. Run the mapping unit tests twice and confirm the outputs are identical.
5. Log in as a parent and as a player and confirm no Reflect data is visible. Generate the PDF and a publish preview and confirm the same.
6. Enter a welfare trigger word in a note and confirm the coach alert fires and the item isn't carried forward.
7. Run the regression checklist from the main prompt.
