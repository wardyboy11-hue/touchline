# Claude prompt 6: "My club" for players

Repo `wardyboy11-hue/touchline`. The player and parent app is `family.html` at the repo root, and the coach app is `coach/` (live: https://touchline.cipher-training.co.uk/). Team: Wigan Junior Latics U15 Blues. Coaches: Tim and Deano. Work on branch `feature/my-club`, open a PR, and **don't push to main or merge**.

## 1. Goal
Each player can pick **one** club they support. Their Home screen then shows a **My club** card with:
1. **Train like [club]**: drills and training clips from that club, taken from the library, linked to this week's topic where it fits.
2. **Club news**: the latest headlines from a free public feed, with a link out.
3. Results and fixtures, **only** if a free, no-key source really exists (§6).

It's optional and changeable. Parents can see the choice and switch the feed off. The coach side gets a count-only summary of which clubs the squad supports.

## 2. Current-code findings (verify, then extend; don't rebuild)
These come from a read-only look at commit `0b69a58` (29 Oct). Check each one before relying on it.
- **Player and parent app**: `family.html`, one file. `D.role` is `'player'` or `'parent'`, and players sign in with their own player code. Tabs come from `navBar()`: home, games, events, media, me. Render functions are `bodyHome()` and `bodyMe()`, with `r()` to re-render. `g()`/`s()` read and write localStorage, and `call(action, payload)` posts to the Apps Script API.
- **Player's own record**: "Make it yours" (`selfForm`/`selfSave`) saves `{nick, foot, pos, sr}` via `call('f.self.set')` and reads it back with `f.self.get`. **Add `club` to this same record.** Don't create a new store.
- **Backend**: `backend/apps-script/Code.gs` `doPost` routes on `b.action`. Actions starting `f.` go to `fam_(b)`, which handles family and player auth (e.g. `f.home`, `f.clips`, `f.answer`, `f.trainreq`). Coach actions use `auth_(b.code)`. `CacheService.getScriptCache()` and `UrlFetchApp` are already used. Other files: `mydata.gs`, `library.gs`, `plans.gs`, `consent.gs`, and others.
- **Viewers**: in `family.html`, `clipPlay(id)` is a full-screen overlay player for clips served by `backend/cloudflare/clips-worker.js` (tokenised, origin-locked). `openRes(t)` opens a resource via `f.res`. The coach app has `vX`, `vIg` and `vLib`, plus `coach/x.js`, `coach/ig.js` and `coach/res.js`.
- **Approval flow**: media, events and photos from families are checked by a coach first (`photo.q.*`, `media.*`, `ev.*`). Coaches decide library requests with `lib.req.list`/`lib.req.decide`. **I couldn't find a named "explicit-image block" in the code.** If one exists, reuse it. If not, implement the rule in §7: no third-party images except feed thumbnails from the allow-listed hosts, and those only when they pass the existing approval or blur rule.
- **Library**: `library.json` (449 items, `{version, built, note, vocab, items[]}`). Each item has `id, title, url, type, src, tags{moment, theme, age, players, system}, private, coach`. **`library.json` and its builder are not tracked in git yet.** The current builder is `libbuild/build.py` (Python, using `xmap.json`/`overrides.json`). `tools/build-library.mjs` does not exist. See §5.
- **Data page**: `dataPage()` and "What we hold about you" (`HELP`/privacy text around line 100) list everything held. Add the club line there.
- Service workers: `fsw.js` (family) and `coach/sw.js`. Bump the cache versions.

## 3. Club picker (player profile)
- Put it in **Me → Make it yours**, as a new optional step "The club I support". Also add a small "Pick your club" prompt in the empty My club card.
- Use a searchable list with type-ahead on name and aliases. Show the crest dot in club colours, the name and the league. Include a "No club / clear" option.
- **Seed list** in a static `clubs.js` (`window.CLUBS`, about 10–15 KB, lazy-loaded):
  - The Premier League 2026/27 clubs.
  - All EFL Championship, League One and League Two clubs, with **Wigan Athletic** pinned at the top ("Our local club").
  - Europe: Bayern Munich, Borussia Dortmund, PSG, Barcelona, Real Madrid, Atlético Madrid, Athletic Bilbao, Inter, AC Milan, Juventus, Napoli, Atalanta, Ajax, Porto, Benfica, Celtic, Rangers.
  - Claude: check the current league membership. Don't guess promoted or relegated clubs; take them from an official list and note the source in a comment.
- **Schema** for each club:
```js
{ id:'liverpool', name:'Liverpool', short:'LFC', league:'Premier League', country:'ENG',
  colours:['#C8102E','#FFFFFF'], crest:null,               // crest: only a local SVG/initials badge we draw; no hotlinked logos
  aliases:['liverpool','lfc','reds','liverpool fc','liverpool academy','lfcacademy'],
  news:[{src:'bbc', url:'https://feeds.bbci.co.uk/sport/football/teams/liverpool/rss.xml'}] }  // verified feeds only
```
- Club crests are trademarks, so **don't hotlink or rehost them**. Draw a simple initials badge in the club colours.
- **Storage**: save `club: '<id>'` on the player's own record via `f.self.set`, and cache `{id, name, colours}` in localStorage (`tl.club`) for an instant render. Changing the club overwrites it. One club only.
- **Parents**: the parent view of their child shows "Supports: Liverpool", plus a **My club feed on/off** switch, saved as `clubFeed: false` on the same record. The default is on. When it's off, the player sees "Your parent has turned this off" and no feed is fetched. Players can't override it.

## 4. "Train like [club]"
- Add a `clubs: []` tag (club ids) to the library item `tags`, and add `vocab.clubs` to `library.json`.
- **Matching** happens at build time (§5), plus a runtime fallback. Lower-case the title and source text, then match against each club's `name` and `aliases` on word boundaries. "Liverpool Continuous 5v4" gives `['liverpool']`, and "Man City 8v8+4" gives `['man-city']` through aliases `man city`, `city`, `mcfc`. Avoid false positives: "city" alone should only count if the item `src` is a known club source.
- **Card on player Home**: up to 4 items for the player's club, newest first, then ranked by overlap with this week's topic tags. Each item shows the title, type and source. Buttons reuse the **existing** Open/Watch behaviour: `clipPlay` for our own hosted clips and `openRes` for resources. Anything else goes through the external-link interstitial (§7).
  - Show only items with `private !== true` and `coach !== true`. **Coaches' Voice and paid items are never shown to players.** Those are link-only coach resources.
- **Link to this week**: read the current Block 3 week's topic from the existing plan data the family app already gets (`f.home` / `plan.get`). Don't send coach-only fields. If a club item shares a theme with it, show a header line, e.g. "This week we're working on **counter attack**. Here's how **Liverpool** train it."
- **Fallback**: if the club has no items, show "No [club] clips yet. Here are this week's pro club clips" with the top 3 non-private items tagged with any club.
- Block 3 dates: week 1 is Wed 4 Nov 2026, then 11, 18 and 25 Nov, 2 Dec and 9 Dec. Read the topics from the plan data and don't hard-code them.

## 5. Library builder
- Bring the builder into the repo as `tools/build-library.mjs`, written in Node with no dependencies. Port the tagging logic from `libbuild/build.py` (Tim will add `libbuild/` and `library.json` to the PR, see §11). Keep the output schema identical, plus `tags.clubs`.
- **Club source 1**: the X Sessions note Docs (exported as text or markdown into `libbuild/notes/` by Tim's daily X check). Each note now contains a line `Club: Liverpool`, or `Club: none`. Parse `^Club:\s*(.+)$` (case-insensitive), map it to a club id via `clubs.js` names and aliases, and ignore unknown values with a warning.
- **Club source 2**: infer from the title and source using the same matcher as §4.
- Output a short report listing items tagged per club, items with a club line that didn't map, and items where inference and the note disagree (the note wins).
- Add a unit test with at least: "Liverpool Continuous 5v4" → liverpool; "Man City 8v8+4" → man-city; "Bayern rondo breakout" → bayern; "Porto Academy 2v2" → porto; "Wigan" → wigan-athletic; and a generic "City centre run" with no club.

## 6. Club news and results
- **Sources**: use only free, public sources that need no key.
  1. The club's **official** RSS or Atom feed, if it has one.
  2. Otherwise the **BBC Sport team feed**, `https://feeds.bbci.co.uk/sport/football/teams/<slug>/rss.xml`.
  - Claude must **fetch and verify every feed URL** before adding it to `clubs.js`. A club with no verified feed gets `news: []`, and the card says "No news feed for this club". **Don't invent APIs, slugs or endpoints.**
- **Fetch path**: add a new backend action `f.club.news {club}` in `Code.gs`, routed through `fam_` with the existing family auth. It looks up the club id in a server-side allow-list (the ids and feed URLs only) and **never fetches a URL sent by the client**. It fetches with `UrlFetchApp`, parses with `XmlService`, and returns at most 8 items: `{title, link, published, thumb?}`.
  - `thumb` is kept only if it comes from an allow-listed host (e.g. `ichef.bbci.co.uk`). Otherwise drop it.
  - Cache it per club in `CacheService` for 2 hours, under the key `news:<clubId>`. Return the cached copy on a fetch error.
  - The request carries **only the club id**. Don't log the player id against it.
  - A Cloudflare worker cache in front of this is optional. Only do it if Apps Script quotas are a problem, and then it must be key-free and origin-locked like `clips-worker.js`.
- **Display**: headlines, time ago and the source name only. **Don't show article text** and don't copy summaries beyond the feed title. Tapping a headline opens the external-link interstitial.
- **Results and fixtures**: leave them out unless Claude finds a free, no-key, reliable source whose terms allow it, and records it in the PR description. If one exists, show a one-line "Last: W 2–1 v X · Next: Sat v Y". Otherwise don't build it.
- The client caches the response in localStorage for 1 hour, so revisits don't hit the backend.

## 7. Safeguarding (must pass)
- Only the **club id** goes to the news fetch, with no player id, name or code in the payload beyond the existing auth token. Upstream feeds receive nothing from the user.
- **No player data goes to AI or third parties.** The club choice is never included in any `ask`/Anthropic call context.
- Family and parent views use **shirt numbers only** for other players. The coach summary (§8) is counts only.
- **Every link out** goes through a new `extLink(url, label)` interstitial: "You're leaving Touchline to visit bbc.co.uk. Ask a parent if you're unsure." It offers Open and Back, and uses `rel="noopener noreferrer"`. Don't embed third-party pages.
- **Images**: no third-party images except allow-listed feed thumbnails. Reuse the existing explicit-image or approval rule if there is one. Otherwise thumbnails stay off until a coach enables them in coach settings (`clubThumbs: false` by default).
- Parents can turn My club off (§3). When it's off, nothing is fetched.
- **Coach-only data is never exposed**: Reflect, ratings, welfare, notes, private and coach library items, and Coaches' Voice.
- Nothing is published or sent without an explicit tap. This feature sends no posts and no push notifications.
- Update the privacy text in `HELP`/`dataPage()`: "The club your player supports (optional). Used only to show club clips and news. Parents can turn it off." Include it in the My data download, and clear it on delete.
- Add a welfare test in `tests/welfare/` that asserts the `f.club.news` payload has no player fields, and that private or coach items never appear in player club cards.

## 8. Coach side
In the coach app (Squad or Library), add a small optional card, "Clubs the squad supports": `Liverpool 4 · Man Utd 3 · Wigan 2 …`.
- It shows **counts only**: no names and no tap-through to players.
- It's built from a coach action `club.counts`, which returns aggregates only.
- Each club chip links to Library filtered by that club, so coaches can pick pro-club clips the players will love.

## 9. Performance
- Lazy-load `clubs.js` and the My club card **only** when a player opens Home, using `IntersectionObserver` or a deferred dynamic `<script>`. Parents load it only when they open the switch.
- Don't add libraries or frameworks. The added JS should be under 25 KB unminified.
- Render instantly from the `tl.club` and news localStorage caches, then refresh in the background.
- First load of `family.html` must not get slower. Measure Lighthouse before and after on mobile, and put the numbers in the PR.
- Add `clubs.js` to `fsw.js` precache only if that's small, otherwise use runtime cache. Bump the cache versions.

## 10. Acceptance criteria
1. A player can pick, change and clear a club. It persists across devices through `f.self.set`/`f.self.get`.
2. A parent sees the choice and can switch the feed off, which hides the card and stops fetches for that player.
3. A Liverpool fan sees "Train like Liverpool" with the Liverpool 5v4 transition and the PSG/Bayern fallback logic working. The Open/Watch buttons use the existing viewers.
4. The "This week we're working on…" line appears when the themes overlap and is hidden when they don't.
5. News shows ≤8 headlines from a verified feed, cached for 2 h server-side and 1 h client-side. A feed failure shows the cached copy or a friendly message.
6. Every external link shows the interstitial. No article text and no non-allow-listed images.
7. `tools/build-library.mjs` reproduces `library.json` with `tags.clubs`, its tests pass, and the club report prints.
8. The coach club summary shows counts only.
9. No coach-only or private data reaches the family app (welfare tests pass). The privacy text is updated.
10. No new dependencies. Lighthouse performance doesn't drop on `family.html`.

## 11. Test checklist
- [ ] Player: pick Liverpool, reload, open on a second device → still Liverpool.
- [ ] Player: clear club → empty card with "Pick your club".
- [ ] Parent: switch off → player card hidden, no `f.club.news` call in the network tab.
- [ ] Search "spurs", "bilbao", "latics" → correct clubs (aliases).
- [ ] Wigan pinned at the top of the picker.
- [ ] Club with no items → fallback list shown.
- [ ] Club with no verified feed → "No news feed" message, no error.
- [ ] Offline → cached news and cards show, nothing breaks.
- [ ] Inspect the `f.club.news` payload: club id plus auth only.
- [ ] Private, Coaches' Voice and coach-flagged items never appear for players.
- [ ] Interstitial on every headline and external clip.
- [ ] Coach summary counts match, with no names.
- [ ] `node tools/build-library.mjs` and its tests pass.
- [ ] Lighthouse before and after numbers in the PR.

## 12. Setup for Tim and Deano after merge
1. **Redeploy the Apps Script** (Deploy → Manage deployments → edit → new version), keeping the same web app URL. Approve the new `UrlFetchApp` scope for the BBC and club feed hosts if prompted.
2. Commit `libbuild/` and `library.json` (currently untracked) so the builder can run, then run `node tools/build-library.mjs`.
3. Make sure the daily X check writes `Club:` lines into the notes, and export them to `libbuild/notes/`.
4. Optionally enable feed thumbnails in coach settings (off by default).
5. Tell parents in the next update: "Players can now pick the club they support in Me. Parents can turn it off there."

## 13. Matchday quote
On **matchday**, show players and parents **one inspirational football quote** as the opening line of the first matchday alert or of the Home screen.

### Where it shows
- **Matchday** means a fixture dated today in the existing games data.
- **Home screen**: the quote card goes at the top of `bodyHome()`, above the existing match-day cards. It shows the text, `— who`, and a small "Source" link. The Source link opens through `extLink()` from §7.
- **Alerts**: if the app already sends a player/parent matchday alert, the quote is its first line. Only add this to an alert that already exists, and keep using that alert's send path and its explicit coach Send step.
  - **Don't create a new push or alert channel** for this, and don't auto-send anything.
- Show it once per matchday per device (`tl.q.<date>`), with a "Hide" link.

### Data: `quotes.json` (static, in-app, about 8 KB)
```json
{ "version":1, "quotes":[ { "id":"q01", "text":"…", "who":"…", "source":"https://…", "tags":["hard work"], "clubs":["bayern"], "on":true } ] }
```
- The seed is below, with **28 real quotes**. Each one was checked against its linked source, and the wording is exactly as published.
  - Claude must not add, paraphrase or "tidy" any quote. Keep curly quotes and dashes as given.
  - If a quote's source link no longer shows that exact wording, set `on:false` and list it in the PR rather than rewording it.
- **Harry Kane's Ballon d'Or quote** (Tim's request) is included and confirmed:
  - **q01**, "Work hard in silence. Let success be your noise." Kane posted this after winning the 2026 Ballon d'Or and explained it to Sky Sports. Source: The Independent.
  - Two lines from his acceptance speech: **q02** and **q03**. Source: englandfootball.com.

### Rotation
- No repeats until every enabled quote has been shown.
- Keep a shuffled order per season in the coach settings doc: `S.settings.quotes = {order:[ids], i, off:false, custom:[], edits:{}}`.
- Every player and parent on a given matchday sees the **same** team quote. The pick is `order[i]`, and `i` moves on once per matchday.
- **Optional My club bias**: if a player has a club (§3) and an enabled quote has that club in `clubs`, show that quote **once** on that matchday instead of the team quote. Mark it as used in that device's local list so it doesn't repeat for them.
  - This is done entirely in the app. The club choice is never sent anywhere for this.

### Coach controls (coach app, More → Matchday quote)
- A switch to turn the quote off entirely (`off:true`).
- Preview the next quote, or skip it.
- Edit a quote's text, who, source, tags, clubs and on/off. Edits save in `S.settings.quotes.edits` and **override the seed without changing `quotes.json`**.
- Add a quote. **A source URL is required.** Show the hint "Use the exact wording from the source."
- Edits sync through the existing settings sync. Nothing reaches families until the next matchday render, or until a coach presses the existing Send on an alert.

### Safeguarding
- Quotes are about public figures only. **Never put player names, or anything personal about players, in a quote, a custom quote or the "who" field.**
  - Team references in family views follow the shirt-number rule.
  - Validate custom quotes against the squad's first names, and block saving if one matches.
- No AI generates quotes. No player data is used, beyond the local club bias.

### Acceptance
1. On a matchday, the Home screen opens with one quote. On other days it doesn't appear.
2. 28 matchdays in a row show no repeats, then a fresh shuffle.
3. With the coach switch off, no quote appears anywhere.
4. A coach edit appears on the next render. A custom quote without a source can't be saved.
5. Club bias works for one quote per matchday and never repeats.
6. The quote is the first line of any existing matchday alert, and nothing sends without a coach's Send.

### Seed `quotes.json`
```json
{
 "version": 1,
 "note": "Real quotes only, exact wording from the linked source. Do not paraphrase. Coaches can add/edit/disable.",
 "quotes": [
  {
   "id": "q01",
   "text": "Work hard in silence. Let success be your noise.",
   "who": "Harry Kane",
   "source": "https://www.independent.co.uk/sport/football/harry-kane-ballon-dor-lamine-yamal-kylian-mbappe-b3074018.html",
   "tags": [
    "hard work",
    "mindset",
    "ballon-dor"
   ],
   "clubs": [
    "bayern",
    "tottenham"
   ],
   "on": true
  },
  {
   "id": "q02",
   "text": "For any young boy or girl wanting to achieve their dreams, anything is possible with hard work when nobody else is watching, to go through the ups and downs, to learn from resilience, determination and self-belief.",
   "who": "Harry Kane",
   "source": "https://www.englandfootball.com/articles/2026/Oct/26/harry-kane-ballon-d-or-2026-reaction-20262610",
   "tags": [
    "hard work",
    "resilience",
    "self-belief",
    "ballon-dor"
   ],
   "clubs": [
    "bayern",
    "tottenham"
   ],
   "on": true
  },
  {
   "id": "q03",
   "text": "My journey wasn’t straight forward. I wasn’t the kid who went straight to the top - I had to experience the downs, I had to experience a lot of low moods, I had to fight my way to be the very best right now and I hope that can give you inspiration.",
   "who": "Harry Kane",
   "source": "https://www.englandfootball.com/articles/2026/Oct/26/harry-kane-ballon-d-or-2026-reaction-20262610",
   "tags": [
    "resilience",
    "ballon-dor"
   ],
   "clubs": [
    "bayern",
    "tottenham"
   ],
   "on": true
  },
  {
   "id": "q04",
   "text": "I had to bide my time and work hard, a lot of times it was me against my own mind and I had to come through it, I had to show self-belief, determination.",
   "who": "Harry Kane",
   "source": "https://www.bbc.com/sport/football/articles/cqlye4jpzzxyo",
   "tags": [
    "patience",
    "self-belief"
   ],
   "clubs": [
    "bayern",
    "tottenham"
   ],
   "on": true
  },
  {
   "id": "q05",
   "text": "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing or learning to do.",
   "who": "Pelé",
   "source": "https://www.whufc.com/news/articles/2020/december/17-december/how-peles-words-wisdom-inspire-ruby-grant",
   "tags": [
    "hard work",
    "learning",
    "enjoyment"
   ],
   "clubs": [],
   "on": true
  },
  {
   "id": "q06",
   "text": "We have to change from doubters to believers. Now.",
   "who": "Jürgen Klopp",
   "source": "https://www.liverpoolecho.co.uk/incoming/we-must-turn-doubters-believers-10227184",
   "tags": [
    "belief"
   ],
   "clubs": [
    "liverpool",
    "dortmund"
   ],
   "on": true
  },
  {
   "id": "q07",
   "text": "I’ve said before that football always seems the most important of the least important things.",
   "who": "Jürgen Klopp",
   "source": "https://www.thisisanfield.com/clubinfo/classicquotes/",
   "tags": [
    "perspective",
    "enjoyment"
   ],
   "clubs": [
    "liverpool",
    "dortmund"
   ],
   "on": true
  },
  {
   "id": "q08",
   "text": "Playing football is very simple, but playing simple football is the hardest thing there is.",
   "who": "Johan Cruyff",
   "source": "https://www.theguardian.com/football/2016/mar/24/you-play-football-with-your-head-and-your-legs-are-there-to-help-you-johan-cruyff-in-quotes",
   "tags": [
    "technique",
    "simplicity"
   ],
   "clubs": [
    "ajax",
    "barcelona"
   ],
   "on": true
  },
  {
   "id": "q09",
   "text": "You play football with your head, and your legs are there to help you.",
   "who": "Johan Cruyff",
   "source": "https://www.theguardian.com/football/2016/mar/24/you-play-football-with-your-head-and-your-legs-are-there-to-help-you-johan-cruyff-in-quotes",
   "tags": [
    "decision making"
   ],
   "clubs": [
    "ajax",
    "barcelona"
   ],
   "on": true
  },
  {
   "id": "q10",
   "text": "Why couldn’t you beat a richer club? I’ve never seen a bag of money score a goal.",
   "who": "Johan Cruyff",
   "source": "https://www.theguardian.com/football/2016/mar/24/you-play-football-with-your-head-and-your-legs-are-there-to-help-you-johan-cruyff-in-quotes",
   "tags": [
    "underdog",
    "belief"
   ],
   "clubs": [
    "ajax",
    "barcelona"
   ],
   "on": true
  },
  {
   "id": "q11",
   "text": "Technique is not being able to juggle a ball 1000 times. Anyone can do that by practising. Then you can work in the circus. Technique is passing the ball with one touch, with the right speed, at the right foot of your team mate.",
   "who": "Johan Cruyff",
   "source": "https://www.independent.co.uk/sport/football/news/johan-cruyff-the-best-quotes-on-the-dutch-master-a6950011.html",
   "tags": [
    "technique",
    "passing"
   ],
   "clubs": [
    "ajax",
    "barcelona"
   ],
   "on": true
  },
  {
   "id": "q12",
   "text": "Football is a game of mistakes. Whoever makes the fewest mistakes wins.",
   "who": "Johan Cruyff",
   "source": "https://www.independent.co.uk/sport/football/news/johan-cruyff-the-best-quotes-on-the-dutch-master-a6950011.html",
   "tags": [
    "concentration"
   ],
   "clubs": [
    "ajax",
    "barcelona"
   ],
   "on": true
  },
  {
   "id": "q13",
   "text": "You have to fight to reach your dream. You have to sacrifice and work hard for it.",
   "who": "Lionel Messi",
   "source": "https://gulfnews.com/sport/football/lionel-messi-says-sacrifice-took-him-to-the-top-1.1217374",
   "tags": [
    "hard work",
    "dreams"
   ],
   "clubs": [
    "barcelona"
   ],
   "on": true
  },
  {
   "id": "q14",
   "text": "The great fallacy is that the game is first and last about winning. It is nothing of the kind. The game is about glory, it is about doing things in style and with a flourish, about going out and beating the other lot, not waiting for them to die of boredom.",
   "who": "Danny Blanchflower",
   "source": "https://www.spurs-web.com/spurs-news/opinion-five-of-the-best-tottenham-danny-blanchflower-quotes/",
   "tags": [
    "style",
    "attacking"
   ],
   "clubs": [
    "tottenham"
   ],
   "on": true
  },
  {
   "id": "q15",
   "text": "It is better to fail aiming high than to succeed aiming low.",
   "who": "Bill Nicholson (as published by Tottenham; some historians credit Danny Blanchflower)",
   "source": "https://www.tottenhamhotspur.com/news/1055151/the-words-of-bill-nicholson",
   "tags": [
    "ambition"
   ],
   "clubs": [
    "tottenham"
   ],
   "on": true
  },
  {
   "id": "q16",
   "text": "If you are first you are first. If you are second you are nothing.",
   "who": "Bill Shankly",
   "source": "https://www.liverpoolfc.com/news/bill-shanklys-final-season-champions-begin-mixed-august",
   "tags": [
    "winning mentality"
   ],
   "clubs": [
    "liverpool"
   ],
   "on": true
  },
  {
   "id": "q17",
   "text": "For a player to be good enough to play for Liverpool, he must be prepared to run through a brick wall for me then come out fighting on the other side.",
   "who": "Bill Shankly",
   "source": "https://www.thisisanfield.com/clubinfo/classicquotes/",
   "tags": [
    "commitment"
   ],
   "clubs": [
    "liverpool"
   ],
   "on": true
  },
  {
   "id": "q18",
   "text": "Without fans who pay at the turnstile, football is nothing. Sometimes we are inclined to forget that.",
   "who": "Jock Stein",
   "source": "https://www.supporters-direct.scot/football-without-fans-is-nothing/",
   "tags": [
    "supporters"
   ],
   "clubs": [
    "celtic"
   ],
   "on": true
  },
  {
   "id": "q19",
   "text": "What is a club in any case? Not the buildings or the directors or the people who are paid to represent it. It’s not the television contracts, get-out clauses, marketing departments or executive boxes. It’s the noise, the passion, the feeling of belonging, the pride in your city.",
   "who": "Sir Bobby Robson",
   "source": "https://www.chroniclelive.co.uk/sport/football/football-news/sir-bobby-robson-quote-tell-6260751",
   "tags": [
    "belonging",
    "club"
   ],
   "clubs": [
    "newcastle",
    "ipswich"
   ],
   "on": true
  },
  {
   "id": "q20",
   "text": "The legacy of this tournament is a change in society. We’ve brought everyone together, brought people to games.",
   "who": "Leah Williamson",
   "source": "https://www.skysports.com/football/news/12662032/chloe-kelly-savours-englands-historic-moment-as-leah-williamson-sends-powerful-message-after-euro-2022-glory",
   "tags": [
    "togetherness",
    "legacy"
   ],
   "clubs": [
    "arsenal"
   ],
   "on": true
  },
  {
   "id": "q21",
   "text": "Stick to the plan, stick together and keep the noise out.",
   "who": "Sarina Wiegman",
   "source": "https://www.bbc.com/sport/football/articles/czxyv03x1d9o",
   "tags": [
    "focus",
    "togetherness"
   ],
   "clubs": [],
   "on": true
  },
  {
   "id": "q22",
   "text": "I’m telling you right now … England is still a place where a naughty boy who comes from nothing can live his dream.",
   "who": "Raheem Sterling",
   "source": "https://www.theplayerstribune.com/articles/raheem-sterling-england-it-was-all-a-dream",
   "tags": [
    "dreams",
    "resilience"
   ],
   "clubs": [
    "man-city",
    "liverpool",
    "chelsea"
   ],
   "on": true
  },
  {
   "id": "q23",
   "text": "We didn’t win by luck – from start to finish it was an incredible performance.",
   "who": "Roberto Martínez (after Wigan's 2013 FA Cup final win)",
   "source": "https://www.bbc.com/sport/football/22497837",
   "tags": [
    "underdog",
    "performance"
   ],
   "clubs": [
    "wigan-athletic"
   ],
   "on": true
  },
  {
   "id": "q24",
   "text": "If you believe we can do it, we can do it. Give yourselves the chance to be heroes.",
   "who": "Rafael Benítez (Istanbul 2005, half-time)",
   "source": "https://www.bbc.co.uk/sport/football/51018488",
   "tags": [
    "belief",
    "comeback"
   ],
   "clubs": [
    "liverpool"
   ],
   "on": true
  },
  {
   "id": "q25",
   "text": "Love always wins.",
   "who": "Bukayo Saka",
   "source": "https://scroll.in/field/1000324/full-text-love-always-wins-saka-joins-sancho-rashford-in-issuing-statement-against-racial-abuse",
   "tags": [
    "resilience",
    "respect"
   ],
   "clubs": [
    "arsenal"
   ],
   "on": true
  },
  {
   "id": "q26",
   "text": "The pass is what unites the group.",
   "who": "Pep Guardiola",
   "source": "https://www.manchestereveningnews.co.uk/sport/football/football-news/pep-guardiola-man-city-derby-15399407",
   "tags": [
    "passing",
    "team"
   ],
   "clubs": [
    "man-city",
    "barcelona",
    "bayern"
   ],
   "on": true
  },
  {
   "id": "q27",
   "text": "Never giving up is something that when you are in United’s academy, they give it to you from then.",
   "who": "Marcus Rashford",
   "source": "https://www.rte.ie/sport/soccer/2021/0114/1189766-rashford-vows-to-step-up-mission-to-end-food-poverty/",
   "tags": [
    "never give up",
    "academy"
   ],
   "clubs": [
    "man-utd"
   ],
   "on": true
  },
  {
   "id": "q28",
   "text": "It really was tough but all worth it.",
   "who": "Jamie Vardy",
   "source": "https://sports.yahoo.com/articles/jamie-vardy-football-killer-asked-050100826.html",
   "tags": [
    "perseverance"
   ],
   "clubs": [
    "leicester"
   ],
   "on": true
  }
 ]
}
```
