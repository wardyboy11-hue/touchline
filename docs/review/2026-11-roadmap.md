# Touchline roadmap from release 105

For Tim and Deano. Release 104 (voice assistant and travel alerts) is already in hand and is not redesigned here. This note starts at 105.

Read the review first: `docs/review/2026-11-app-review.md`.

Effort words: **small** is one careful change, **medium** is a release and a phone test, **large** is the big files and a match-day test before you trust it.

## Decisions already made

Signed off for this plan:

- The app, and AI, may use the **shirt number** to personalise a player's Home.
- AI may use that shirt's **positions, marks, and coaching reflections** to choose resources, a short tip, and which news item to pin.
- AI never receives **names, welfare, health, or niggle data**.
- A player may pick a **Home background** from a fixed set. The choice is stored against the shirt number.
- Parents may leave a **one-off parking pin** for a single match. It is opt-in, labelled with the shirt number only, and it expires after the game.

Still true, and not reopened:

- The login stays the private code. A shirt number is not a password. Shirt numbers are easy to guess, and one lad must not be able to open another's page by typing a number.
- Personal data stays in the private Google Sheet. The phone asks Apps Script. Apps Script talks to Claude. The phone never talks to Claude itself.

## Recommended order

| Release | What you get | Effort | Do it after |
| --- | --- | --- | --- |
| 105 | Names and phone numbers off the public site. Family pages show shirt numbers. | Medium | 104, if 104 is still open. This one is urgent either way. |
| 106 | Quicker subs on match day. | Medium | 105. Uses the coach app only. |
| 107 | Arrival notes you keep per ground, plus parent parking pins for that match. | Medium | 104 and 105. Hooks the travel alerts instead of a second ping system. |
| 108 | The player's own Home: targets, role card, next match, background. No AI yet. | Medium | 105. |
| 109 | Their club's news and next game, and a Blues league line you type. | Small to medium | 108. |
| 110 | Pre-match playlist. | Small | None. Can slip in beside 108 if you want the music sooner. |
| 111 | AI tips per shirt, with the safeguards below. | Medium | 105, 108, and 109. |
| 112 | One family page, faster open, bigger taps, stronger offline. | Large | After the match-day tools, so a rewrite does not land on a Saturday. |

If a run of games means you can only do one thing, do **105**. If you can do two, do **105** and **106**.

---

## Design 1. A personal area for each player

### How it would work

The lad signs in with his player code, as now. The page greets him by shirt number ("Number 8") and shows only his stuff:

- Resources you have assigned to that shirt (the library give list already works this way).
- Your reflections on his games and training, once you have marked them as OK to show him. He sees your words, not a ranking against the others.
- His scores and targets: the work-ons you publish (he already sees the words, never the raw scores, unless you later choose to show a score), and the goals he has set with you.
- His role card for the next game, which is already shirt based.

You still see names on the coach screens. Parents still see their own child. Other families see shirt numbers.

The choosing is done in the app and in Apps Script from rules (his positions, what you assigned, what you published). AI is a later layer, release 111, not the thing that decides selection.

### Data

Already in the private sheet:

- Player doc: shirt `num`, positions `pos`, published objective `obj` when `objOn` is on, published `workon` items.
- Library gives, keyed by shirt (`lib.give` with a list of numbers).
- Role card on the match: `rc.cards[shirt]`.
- His own full-time marks, if you want them on his page later: the five corners stored for that player id.
- Coach reflections: `rev` docs. Add a simple "share with this shirt" tick so a private note does not leak by accident.

New: nothing that names him in the family payload. The code still maps to the player id on the server.

### Privacy

- Shirt number on his own screen is fine under your decision.
- Do not build a login that is "type your shirt number".
- Reflections are shared only when you tick them. A note that mentions a knock, a family worry, or another lad's name stays on the coach side.
- Welfare, head injury stages, niggles, date of birth, FAN, and parent phone numbers stay off this page.

### Effort and release

Medium. **Release 108**, after 105 so the page he sees does not also list everyone else's names. The feed of assigned resources can start as soon as 105 is done, because that plumbing exists.

---

## Design 2. His Home

### How it would work

Under the shirt number, five blocks. All of them fit on a phone without a sideways hunt.

1. **Next Blues match.** Opponent, kick-off, meet time, kit, and your arrival notes (design 7). This is the fixture you already enter. No new source.
2. **His role card and targets.** The published card and up to three work-ons.
3. **His club.** He picks a supported club once (for example Wigan Athletic). Home shows that club's latest headlines and, when we can get it cleanly, their next fixture.
4. **Where the Blues sit.** One line you type, such as "4th in Section A", plus the FA Full-Time link you already point people to.
5. **Background.** The look he picked (design 6).

### Which source for his club

Use **BBC Sport RSS** for news. It is free, it needs no account, and the request is only the club slug, for example `https://feeds.bbci.co.uk/sport/football/teams/wigan-athletic/rss.xml`. Apps Script fetches it. The lad's name, code, and shirt number are not sent to the BBC.

Use **football-data.org's free tier** only for the next fixture, and only when that club plays in a competition the free tier covers (Premier League, Championship, and the other big leagues). The free tier needs an API token stored in Apps Script properties, next to the Claude key, not in the website. The request is the club id. Nothing about your players goes out.

If the club is not in that free tier, show the BBC headlines and a link to the club's BBC page. Do not scrape club sites.

### Blues league and fixtures

Touchline already stores your fixtures (opponent, date, kick-off, home or away, score when you finish the game). That stays the source for "our next games".

FA Full-Time is the right place for the official BBDFL table, and this app already tells parents to use it. Full-Time does not offer a simple free feed we can rely on for a junior section. Scraping it would break quietly and could show the wrong table. So: you type the one-line position when it changes (20 seconds on a Sunday), and the button still opens Full-Time. The coach app already keeps opposition and league contacts in the private sheet. It does not keep a league table.

### Data

- Existing match docs and `f.home` fixtures.
- New settings field: `leagueLine` (short text) and `leagueUrl` (defaults to your Full-Time page).
- New per player, stored by shirt number: `clubId` (a slug from a list you approve, not a free typed website).
- Server cache of the BBC feed for a few hours, shared by every lad who picked that club, so you do not hit the BBC once per phone.

### Privacy

The club request contains the club only. League position is team news, not player data. His targets are the ones you have already published to him.

### Effort and release

The Blues blocks are part of **release 108**. Club news and the league line are **release 109** (small to medium), so 108 still ships if the BBC feed needs a tweak.

---

## Design 3. Pre-match playlist

### How it would work

You create the playlist in Spotify and paste the link into the match (or into a season default). On match day the page shows:

- The playlist name.
- A Spotify embed, so families who are online can press play in the page.
- A big button, **Open in Spotify**, which opens the Spotify app if they have it.

You add and remove songs in Spotify. The page updates because it is the same playlist. No account inside Touchline. No one under 16 has to approve an app permission.

Keep it age-appropriate by ownership: it is your playlist. A short line on the screen says the coaches pick the music.

### Spotify's full API, and why the embed is the one to build

The Web API can let a player add tracks to a shared playlist. That needs a Spotify developer app, an OAuth login for each person, and a moderation step so a lad cannot drop an unsuitable song into the team list five minutes before kick-off. Many of the squad are 14 or 15. Asking them to connect a Spotify account to a team tool is a poor fit, and it creates a second place that can leak an email address.

The embed needs none of that. If you later want requests, add a "suggest a song" note that lands with you, and you add it in Spotify if you are happy. Still no OAuth.

### Data

- On the match, or on team settings: a Spotify playlist URL. Accept only `https://open.spotify.com/` links.
- No listening history. No Spotify user ids.

### Privacy

The embed is Spotify's own player. Spotify will see that a phone loaded their player, the same as opening Spotify. Touchline does not send shirt numbers or names to Spotify. Do not put player names in the playlist title.

### Effort and release

Small. **Release 110.** Can move earlier if you want it on a Saturday before the Home work. It does not depend on AI or on the privacy cleanup, as long as the screen around it is not showing other children's names.

---

## Design 4. Quick subs helper

### How it would work

You already have this on the live match screen: Substitution mode, tap who is coming off, tap who is coming on, confirm. The bench is ordered by minutes played. A banner asks you to look at changes on your sub timer (`coach/app.js` `vLive` around lines 462 to 477, `subSheet` around lines 1529 to 1534).

The helper adds one step so you are not scanning the whole bench in the rain.

1. Tap the lad coming off (the same big pitch button as now).
2. A sheet opens with **two or three suggestions**, each a full-width row at least 56px tall: shirt number, position fit, minutes so far, and one short reason. Example: "12 min so far. Can play CM. Not been on yet."
3. Tap a row to confirm the change you already confirm today. Or tap **Someone else** to see the full bench.
4. You still make the decision. The app does not change the game on its own.

Suggestions use only the squad marked available for that match (`avail` on the match, which you can fill from the parents' Yes answers with the button you already have). Lads on a head injury plan stay unavailable, as they do now.

Order of the suggestion, in plain rules, no AI:

1. Can play the position (`fit()` in `coach/app.js` line 66). Natural and close fits first.
2. Fair minutes. Prefer lads under half the game (`mins()` line 131, half length already on the match). Grassroots game time matters more than a perfect positional twin who has already played 50 minutes.
3. Not yet been on, ahead of a lad who has been on and off.
4. A coaching reflection you have tagged for match day, one short line, if it is on the phone. If you have no signal, skip the line. The rest still works, because the match, the clock, and the bench are stored on the phone.

A welfare or niggle flag can show as a coach-only marker, "Check before you send him on", with no injury words on the button. Those words stay in the welfare screen.

### Data

All already on the coach phone during a match:

- `match.avail`, `lineup`, `stints`, `formation` (3-5-2 slots).
- Player `pos`.
- Minutes from `stints`.
- Optional: coach marks `match.cm` and a published reflection. Marks can break a tie. They must not override fair minutes. A higher mark does not jump a lad who has barely played, unless you tap Someone else and pick him yourself.

### Privacy

Coach screen only. It is the same screen as the team sheet, which already shows names to you. Nothing from this helper is pushed to parents. Do not send the suggestion list to Claude. Niggle text is not printed on the big button.

### Effort and release

Medium. **Release 106.** Build it inside `vLive` and `subSheet`. Do not make a second match screen.

---

## Design 5. Other improvements, including sensible AI

### Fix first (these are the review, scheduled above)

- 105 covers public names, public phone numbers, and shirt numbers on family pages.
- 112 covers one family page, the 9 second splash, tiny tap targets, offline HTML, the push registration bug, and loading the library only when it is opened.

### AI you already have

Keep it.

- Family Ask: general help, no player data, web search off. The prompt already refuses medical advice and refuses to rank children.
- Coach Ask: drills and explanations, web search on, for you and Deano. Keep names out of what you paste in.
- "Write the why for parents" already asks for plain lines with no names and no scores.

### AI to add in release 111

**Personalised tip and resource order**, for one shirt at a time. Details under "Which AI" below.

**A coach briefing the night before**, optional and separate. You press a button. Claude gets the opponent name, home or away, the 3-5-2, and this week's training theme. It returns a short brief for you. It does not get the squad list, minutes, marks, or welfare. You already have coach Ask with web search for this kind of question. This is a saved button, not a new vendor.

### AI to leave

- No AI scouting report that ranks the lads.
- No AI summary of niggles, head injuries, or parent welfare messages.
- No AI in the subs helper. The rules are clearer and they work offline.
- No AI writing to parents in your voice without you pressing Send, which is already how drafts work.

---

## Design 6. Home background

### How it would work

On his Home, a button **Look**. He picks one of about eight colour themes and four simple patterns shipped with the app: navy and gold, pitch green, home-kit stripes, a quiet badge watermark, and a plain dark or light background. The choice is saved. Next time, that Home opens in his look.

Parents' pages stay on the team theme. This is the player Home only.

There is no photo upload. A photo of his bedroom, his mates, or himself is personal data and a moderation job you do not need.

### Data

A short code stored against the shirt number in the private sheet, for example `theme: navy-gold`. The pictures are files in the app, the same for everyone. The sheet stores the code only.

Offline: remember the code on the phone with the rest of his home cache.

### Privacy

The code is not a name. It is not sent to AI, to the BBC, or to Spotify. Another player cannot read it, because home data is loaded with his own code.

### Effort and release

Small, and it rides along with **release 108**.

---

## Design 7. Matchday travel tips

### How it would work

Two different jobs. They sit together under **Getting there**, which already shows your postcode, parking line, directions, Waze, roadworks, and weather.

**A. Arrival notes you keep.**

For each ground you add: the entrance that actually works, where to park, a what3words address, the sat nav postcode, and a short note ("do not follow the postcode, it stops on the main road"). The next time that ground comes up, the notes are already there. You can edit them.

You already have a lighter version: postcode, parking, and good to know, plus **Use for every game at this ground** (`coach/app.js` lines 1956 and 1963). That copies the tip onto every match with the same address text. The new notes live once per ground, and each match looks them up. Old matches keep a copy so a phone that is offline still shows the last notes.

what3words is three words you type, shown as text and as a link (`https://what3words.com/...`). No what3words account and no player location sent to them.

**B. A parent pin for this match only.**

On the match card, **Share a parking tip**. It is opt-in. Nothing is collected until they tap it. The first screen says, in plain words: this shares a spot near the ground with the other families, labelled as "#7's parent". It does not share your name, your phone number, or your home. We do not follow the car.

Then they either:

- tap **Use my location once**, which asks the phone for a single fix, or
- tap the map and drop the pin themselves (this still works if they say no to location).

They add a short tip, 140 characters, such as "Better entrance is the blue gate. Do not use the postcode." They tap Send. They can delete their own tip. You can delete any tip. One current tip per family per match. Sending again replaces the old one.

Everyone else sees, on that fixture only: the tip, **#7's parent**, and **Open in Maps**. A simple map when online is an OpenStreetMap view centred on the ground, with the pins as links. Do not add a paid Google Maps embed. You already link out to Google Maps and Waze, and that stays.

### How this fits release 104

Release 104's travel alerts are the "look at your phone" messages: running late, traffic, a pitch change, a new kick-off, a postponement. Keep that.

- **Running late** stays coach-only, shirt number and minutes, as in `cd.js`. A pin is the opposite: it is shared with families, and it is about a place, not about a person being late.
- **Directions, Waze, roadworks, and weather** stay as they are (`family.html` `travelLinks` around line 596).
- Pins do not send a notification on their own. Ten parents dropping pins would be ten pings. If one tip is worth shouting about, you tap **Tell parents** and it goes out through the same match-day alert path 104 uses. One message, in your voice.
- The pin list sits under your arrival notes, under any 104 alert banner. It does not replace the banner.

### Data

Arrival notes, in the private sheet, one row per ground:

- Key: a cleaned venue name plus postcode.
- Entrance, parking, what3words, postcode, note, who edited, when.

Pins, one row per tip:

- Match id, shirt number (taken from the code on the server, not typed by the parent), rounded latitude and longitude, tip text, time.
- No name, no phone, no raw GPS trail.

Expiry: when you mark full time, or three hours after kick-off, whichever is later. The next home load deletes expired pins. Arrival notes do not expire.

Offline: show the last arrival notes and the last pin list from the family cache. Dropping a new pin needs signal. The one-shot location check needs signal or a GPS fix. If it fails, the map tap still works when the map is on screen, and if the map cannot load they can still type a tip without a pin ("Park by the clubhouse, ignore the postcode").

### Privacy

- Opt-in every time. No background location. The code uses a single `getCurrentPosition`. It never watches the phone.
- Round the point (about four decimal places, roughly a car length to a small car park). Reject a point that is more than about 2km from the ground's postcode, using the postcode lookup you already use on the coach side (`coach/app.js` around line 633). That stops a home address being saved by mistake. The check runs in Apps Script.
- The label is the shirt number from the family code. The parent cannot type a different name or a different number.
- Before save, reject tips that contain a phone number, an email address, or a squad name from the player list. Ask them to rephrase.
- Pins are not sent to AI, to Spotify, or to the BBC.
- You can turn pins off for a match (a cup final at a ground you already know, or a safeguarding worry).
- Delete on expiry. Do not build a history of where parents parked.

### Effort and release

Medium. **Release 107.** Depends on 104 for the "tell parents" alert, and on 105 so the label is a shirt number and does not copy the lift board's first names.

---

## Which AI, and the safeguards

### Use the Claude account you already have

Apps Script already calls Anthropic (`claude_` in `backend/apps-script/Code.gs` lines 518 to 527). The key is in script properties. The default model is `claude-sonnet-5-5`. Family Ask and coach Ask use this path.

Stay with that. One key, one prompt style, one place to check what left the building. The phone keeps asking your script, as it does for Ask.

Use **rules in Apps Script first**, then Claude only to phrase the tip and to order a shortlist you already built.

1. The script picks up to five resources he is allowed to see: ones you assigned, plus public library items tagged for his positions.
2. It builds a small note. The note is an allow-list, not a dump of the player record.
3. Claude returns: the order of those resource ids, a tip of under 60 words, and which BBC headline to put at the top (chosen from headlines you already fetched).
4. You can preview shirt by shirt, and switch a shirt off. Nothing shows to him until you are happy, for the first few weeks. After that you can leave it on and spot-check.

Web search stays **off** for this call. Coach Ask can keep web search. Personalisation must not.

### What may be in the note

- Shirt number.
- Positions (CB, CM, and so on).
- The five mark numbers (technical, physical, psychological, social, effort), because you signed that off. They are 1 to 5, with no sentence attached.
- Coaching reflection text, only if you ticked "OK for his Home", and only after the cleaner below.
- Resource titles and ids from your library.
- BBC headlines already fetched for his club (the headlines, not a fresh search).

### What must not be in the note

- Names of players, parents, coaches, or opponents' contacts.
- Welfare notes, head injury records, niggles, injuries, medication, or anything from emergency contacts.
- Date of birth, age, FAN number, photo, address, phone, email.
- The raw mark note if it mentions a knock or a name. The five numbers can go. The sentence beside them goes only if the cleaner leaves it intact and you have ticked it.
- Other players' marks, minutes, or selection talk.
- A copy of the public website, or a list of the squad.

### The cleaner

Before the call, Apps Script:

- Deletes any squad name, parent name, or phone-shaped number it finds in the reflection text. If the sentence is then empty, it sends no reflection.
- Drops the whole reflection if it matches the welfare word list you already use on Your voice (hurt, scared, bully, and the rest of that list in `Code.gs` around line 874).
- Sends JSON fields from the list above, nothing else.
- Writes a coach-only log: time, shirt number, and which fields were included (for example "marks, two resources"). You can read that log. It does not need to store the full prompt.

If the key is missing, or Claude fails, Home still shows the rule-based list. The lad never sees an error from the AI vendor.

### Why the public squad list blocks this until release 105

You have agreed that a shirt number may go to AI. That is safe only if the number cannot be turned back into a name from your own website. Today it can. Release 105 removes those lists from the published files. Turn the AI switch on after that release is live. Say so to the squad's parents in the privacy note: we may send your son's shirt number and his coaching targets to our writing tool, we do not send his name or health information, and you can ask us to switch it off for him.

### Preview habit

For the first month, leave the per-shirt preview on. Read one tip. If it names a child or talks about an injury, switch that shirt off and treat it as a bug in the cleaner, not as a reason to paste a bigger prompt.
