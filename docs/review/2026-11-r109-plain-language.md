# r109 plain language pass: before and after

Version 109, branch `cursor/plain-language-r109`. Every change below is on screen copy only. No feature was removed.

## 1. Quick fixes Tim asked for

| Where | Before | After | Files |
|---|---|---|---|
| Session page button | data-mode="role">My role | data-mode="role">Just my position | coach/anim/s1111_training.html, tools/anim/s1111/page.html |
| Shape page button | data-m="role">My role | data-m="role">Just my position | shape/index.html |
| Training 11/11 card, players | Tap My role to see your own job. | Tap Just my position to see what you do. | family.html, parents.html |
| Alert text filled in for Send to players | tap My role for your job. | tap Just my position to see what you do. | coach/app.js |
| Session plan PDF | Pick My role to see your own job. | Tap Just my position to see what you do. | tools/anim/s1111/mkpdf.js |
| Me tab button | )">My role | )">My position | positions.js |
| Me tab button | Open my role guide | Open my position guide | positions.js |
| Position page button | Open role guide | Open position guide | positions.js |
| Position page heading | >Role guide< | >Position guide< | positions.js |
| Me tab card heading | forChild?'His role':'My role | forChild?'His position':'My position | positions.js |
| Screen reader label | aria-label','My role | aria-label','My position | positions.js |
| Position page title | My role | My position | positions.js |
| Position page | Local clips that work offline once opened. Includes 3-5-2 in transition where it helps this role. | Short videos for this position. They still work without signal once you have opened them. | positions.js |
| Position page | Public links tagged for this role. Coaches' Voice stays coach-only. Paid items are link-only. | Free links the coaches picked for this position. | positions.js |
| Position page | Nothing tagged for this role yet. | Nothing for this position yet. | positions.js |
| Parent Me card | label:'His role',sub:'Animations, Positions notes, library links and clips sent to his profile. Shirt number only here. | label:'His position',sub:'Videos, notes and clips for his position, plus anything the coaches sent him. Shown by shirt number only. | family.html, parents.html |
| Home card tag | >Your role card | >Your position for the next game | family.html, parents.html |
| Ask suggestion chip | My role | My position | voice.js |
| Ask understands both | ['my role','role card','what is my role','show my role'] | ['my role','my position','role card','what is my role','show my role','what is my position','where do i play'] | voice.js |
| Ask reply | Opening your role card. | Opening your position page. | voice.js |
| Sign out check | if(dirty&&!confirm('Some changes have not synced yet. Sign out anyway?'))return | if(dirty&&!confirm('Some changes have not been saved to the team yet. Sign out anyway?'))return | acct.js |
| Me tab card heading | roleBtn({label:'My role'} | roleBtn({label:'My position'} | family.html, parents.html |
| Phone alert families get | body:'Your role card for the next game is up. Open the app and have a look. | body:'Your position for the next game is in the app. Have a look before the game. | coach/app.js |
| Account menu names (old saved names are read back too) | Player of Rohan' / 'Parent of Rohan | Rohan (player)' / 'Rohan's parent' / 'Coach | acct.js |
| Account menu | Coach: not signed in on this phone' (shown to families | Hidden on family pages. Coach page shows 'No coach code on this phone | acct.js |
| Account menu | Player: not signed in on this phone' / 'Parent: ... | No player code on this phone yet' / 'No parent code on this phone yet | acct.js |
| Account menu | Headings 'Player' / 'Parent | Players' / 'Parents | acct.js |
| Account menu | Signed in as ... | You are signed in as ...' plus 'Tap a name to switch. | acct.js |
| Account menu | Add another account' / 'Type a code' / 'Add and switch | Add someone else' / 'Type their code' / 'Add and open | acct.js |
| Account menu | Refresh the app (get the latest version | Get the latest version of the app | acct.js |
| Account menu | Sign out of this account' / 'Sign out of all accounts on this phone | Sign out' / 'Sign everyone out on this phone | acct.js |

Account names now read naturally in every case (checked with `node /tmp/acct_combo.js` style unit check):

| Who | Before | After |
|---|---|---|
| Coach | Coach | Coach |
| Player called Rohan | Player of Rohan | Rohan (player) |
| Parent of Rohan | Parent of Rohan | Rohan's parent |
| Player, name not known yet | Player | Player |
| Parent, name not known yet | Parent | Parent |
| Names already saved on a phone as "Player of Rohan" or "Parent of Rohan" | shown as saved | read back and shown as "Rohan (player)" or "Rohan's parent" |
| Family page with no coach login | "Coach: not signed in on this phone" greyed row | row hidden (families never need it) |

## 2. Plain language pass

| Where | Before | After | Files |
|---|---|---|---|
| Parent Me card | Animations, Positions notes, library links and clips sent to his profile. | Videos, notes and clips for his position, plus anything the coaches sent him. | positions.js |
| Player Me card | Your 3-5-2 resources: animations, Positions notes, library links and clips sent to you. | Videos, notes and clips for your position, plus anything the coaches sent you. | positions.js |
| Home position card | Pick where you play in our 3-5-2 and you get the guide, clips and drills for it. | Pick where you play and you get the guide, clips and drills for it. | positions.js |
| Loading screen | Welcome to Wigan Junior Latics Blues U15 Touchline Hub | Welcome to the Wigan Junior Latics U15 Blues team app | family.html, parents.html, coach/index.html |
| Top of every tab | Stuck? See the FAQ | Stuck? See common questions | family.html, parents.html |
| Me tab button | >FAQ and help | >Questions and help | family.html, parents.html |
| Home vote card | MoM vote MoM vote opens | Man of the match vote Voting opens | family.html, parents.html |
| Can you come card | If No, you can optionally tell the coaches why further down. | If it is No, you can tell the coaches why below. You do not have to. | family.html, parents.html |
| Player Me card (code clashed with the sign in code) | Our team code optional | Our team rules optional | family.html, parents.html |
| Vote card | Opens from kick-off on your phone. Server sync follows once Tim has deployed the latest script. | Voting opens at kick off. | family.html, parents.html |
| Stretching card | then counts you down. Works offline once opened. | then counts you down. Works without signal once you have opened it. | family.html, parents.html |
| Links list | d:'Official FA learning hub | d:'The FA's own learning website | family.html, parents.html |
| Animation list | Shape and transition in the game", "Watch | Shape, and switching between attack and defence", "Watch | family.html, parents.html |
| Training 11/11 card | 60 minutes. Warm up, rondo, two practices with Tim and Deano, then a game. | 60 minutes. Warm up, a keep ball game (rondo), two practices with Tim and Deano, then a game. | family.html, parents.html |
| Alerts button, same words as the first open prompt | >Turn on notifications | >Turn on alerts | family.html, parents.html |
| Alerts button | >Turn notifications off | >Turn alerts off | family.html, parents.html |
| Home action card | Turn on notifications Without this you will not hear about training, games or attendance requests. | Turn on alerts Without alerts you will not hear when training or a game changes. | family.html, parents.html |
| Me alerts card | Notifications A short message to your phone if a game is off, a kick off time changes or there is something you need to know. Rare, never marketing. | Notifications Alerts are short messages to your phone when a game is off, a kick off time changes or there is something you need to know. Not many, and never ad | family.html, parents.html |
| Help text | Pre-match music on Games has Open in Spotify and Load Spotify player. | Pre match music on Games has Open in Spotify and Play it here. | family.html, parents.html |
| Help text | Games is headed Player matchday or Parent matchday. | Games is headed Match days. | family.html, parents.html |
| Help text | The in-app sound stops if you leave the page. | The sound stops if you leave the page. | family.html, parents.html |
| Games tab music card | The coaches' playlist. Open in Spotify uses the Spotify app or site. Load Spotify player connects to Spotify. Touchline does not see what you play and does not  | The coaches' playlist. Open in Spotify opens the Spotify app. Play it here plays it on this page. We do not see what you play. | tl-spotify.js |
| Games tab music card | style="margin-top:8px">Load Spotify player | style="margin-top:8px">Play it here | tl-spotify.js |
| Games tab heading | player ? 'Player matchday' : 'Parent matchday', 'Next games are first. Kit, directions, lifts and the share button stay on each game. Emergency is on the Home s | Match days', 'Your next game is first in the list below. Each game shows the kit, directions, lifts and a Share button. If something goes wrong on the day, use  | tl-pages.js |
| Media tab heading | player ? 'Player resources' : 'Parent resources', 'Clips and pictures the coaches have checked. Share sits on each clip. Podcasts are under Listen. | Videos and pictures', 'Videos and pictures the coaches have checked. Each one has a Share button. Podcasts are under Listen. | tl-pages.js |
| Games tab | Wake-up | Wake up alarm | tl-alarm.js |
| Games tab | In-app sound | Sound in the app | tl-alarm.js |
| Games tab | >Arm preview | >Set it | tl-alarm.js |
| Games tab | iPhone cannot set a Clock alarm from a website. There is no documented link for it.' : 'This browser cannot open the phone clock. | iPhone does not let a website set a Clock alarm.' : 'This phone does not let a website set an alarm. | tl-alarm.js |
| Games tab | , Europe/London | UK time | tl-alarm.js |
| Games tab | London now: <b | Time now: <b | tl-alarm.js |
| Games tab | . London now is | . The time now is | tl-alarm.js |
| Games tab | It is not a phone alarm and it is not a notification. No Match of the Day recording is included. | It is not a phone alarm. | tl-alarm.js |
| Stretch card | short dynamic warm-up. Tell us any niggles (chips only), we weight the sequence, and save it on your profile to replay. | A short warm up before the game. Tap anything that feels sore and we change the stretches to suit. You can save it and use it again. | prestretch.js |
| Fitness card | Goals, a PT-style plan, and tick sessions off. Saved to your profile. | Set a goal, get a plan like a personal trainer would give you, and tick off each session. Saved to your profile. | fitness.js |
| Coming up cards | Live countdown | Time to go | cd.js |
| Header status | lastMsg='Synced '+new Date( | lastMsg='Saved '+new Date( | coach/app.js |
| Toast | if(manual)toast('Synced | if(manual)toast('Saved | coach/app.js |
| Header button | aria-label="Sunlight mode">Sun | aria-label="Bright screen for sunlight">Bright | coach/app.js |
| Players voice | Waiting for the latest backend update. | Not switched on yet. It needs the latest Google Sheet script. | coach/app.js |
| Head injury page | The head injury part of the backend is not switched on yet. | Head injury records are not switched on in the Google Sheet yet. | coach/app.js |
| Clip table | Clip views need backend version 28. Until it is live this column shows ?. | Clip views are not switched on yet. Until they are, this column shows ?. | coach/app.js |
| Toast after fixture change | Saved. Push: | Saved. Phone alerts: | coach/app.js |
| Toast after attendance request | Posted on their page. Push: | Posted on their page. Phone alerts: | coach/app.js |
| Attendance requests | A push to every family with alerts on | A phone alert to every family with alerts on | coach/app.js |
| Comms heading | Comms hub | Comms: team page and messages | coach/app.js |
| Fixture change | Can push later games back a week | Can move later games back a week | coach/app.js |
| Fixture change | > Push later fixtures back a week | > Move later fixtures back a week | coach/app.js |
| Coach development | The questions part of the backend is not switched on yet (release 75 backend). | Questions are not switched on in the Google Sheet yet. | coach/cdev.js |
| Session page back button, now a real button | Back to the app | ‹ Back to the app | coach/anim/s1111_training.html, tools/anim/s1111/page.html |
| Session page camera buttons get a label |  | View | coach/anim/s1111_training.html, tools/anim/s1111/page.html |
| Shape page back button | id="back">Back to the app | id="back">‹ Back to the app | shape/index.html |
| Shape page chip | n: 'Final third | n: 'Near their goal | shape/data.js |
| Shape page chip | n: 'Defending: mid block | n: 'Defending: hold the middle | shape/data.js |
| Shape page chip | n: 'Pressing triggers | n: 'When to press | shape/data.js |
| Header | Header icons with no words (mic, chat bubble, three dots | Each icon now has a word under it: Ask, Comms, More | coach/app.js, family.html, parents.html |
| Ask for help button on every family and coach page | Round yellow mic button | Yellow button now reads "Ask" next to the mic | voice.js |
| Me tab and Home | Position chips GK RCB CB LCB ... | Same chips plus a key under them: GK goalkeeper, RCB right centre back, and so on | positions.js |

Readability changes (tl-ui.css, applies to family, parents, coach and guide pages; session page and shape page have the same in their own CSS):

| Before | After |
|---|---|
| Small print 13 to 14px | 15px |
| Tags 11px | 13px |
| Bottom tab labels 12px | 13px |
| Header icons 36 to 40px, no words | 48px with a word under each: Ask, Comms, More |
| Ask button: round mic, no words | Yellow pill with mic and "Ask" on every family and coach page |
| Section jump chips 40px, 13px | 44px, 15px |
| Small buttons 38px | 44px |
| Question list rows 35px | 48px |
| "Stuck? See the FAQ" link 16px tall | 44px tap area |
| Session page and shape page "Back to the app" plain text link 19px tall | Outlined button 44px with a back arrow |
| Session page buttons 37px | 44px, camera buttons labelled "View" |
| Position chips GK, RCB, CDM... with no key | Same chips plus a key in words under them, and full names read out to screen readers |
| Turn on alerts sheet appeared on top of the first open privacy note | Waits until privacy note, welcome steps and match day screen are done (one thing at a time) |

## 3. Phone audit numbers (Pixel size, fake data, tools/r109/tour.js)

Text under 14px / tap targets under 44px / buttons with no words or label.

| Screen | Before | After |
|---|---|---|
| coach_today | 68 / 4 / 25 | 39 / 3 / 25 |
| coach_accounts | 73 / 4 / 25 | 43 / 3 / 25 |
| coach_match | 9 / 0 / 0 | 8 / 2 / 0 |
| coach_train | 26 / 3 / 1 | 16 / 2 / 1 |
| coach_pos | 40 / 1 / 0 | 18 / 2 / 0 |
| coach_squad | 17 / 4 / 1 | 10 / 2 / 1 |
| coach_hub | 47 / 3 / 0 | 17 / 3 / 0 |
| coach_more | 47 / 2 / 0 | 34 / 2 / 0 |
| session_page | 9 / 18 / 0 | 7 / 1 / 0 |
| session_page_mode | 9 / 16 / 0 | 7 / 1 / 0 |
| shape | 7 / 18 / 0 | 3 / 4 / 0 |
| family_signin | 1 / 0 / 0 | 1 / 0 / 0 |
| family_first_open | 13 / 0 / 0 | 15 / 0 / 0 |
| family_home | 24 / 1 / 0 | 20 / 0 / 0 |
| family_accounts | 29 / 1 / 0 | 23 / 0 / 0 |
| family_games | 10 / 3 / 1 | 12 / 0 / 1 |
| family_events | 7 / 3 / 1 | 9 / 0 / 1 |
| family_media | 8 / 3 / 1 | 10 / 0 / 1 |
| family_me | 10 / 2 / 0 | 12 / 0 / 0 |
| family_faq | 8 / 18 / 0 | 10 / 0 / 0 |
| family_voice | 7 / 1 / 0 | 9 / 1 / 0 |
| parents_signin | 1 / 0 / 0 | 1 / 0 / 0 |
| parents_first_open | 13 / 0 / 0 | 15 / 0 / 0 |
| parents_home | 23 / 1 / 0 | 20 / 0 / 0 |
| parents_accounts | 28 / 1 / 0 | 23 / 0 / 0 |
| parents_games | 10 / 3 / 1 | 12 / 0 / 1 |
| parents_events | 7 / 4 / 1 | 9 / 0 / 1 |
| parents_media | 8 / 3 / 1 | 10 / 0 / 1 |
| parents_me | 12 / 2 / 0 | 14 / 0 / 0 |
| parents_faq | 8 / 18 / 0 | 10 / 0 / 0 |
| parents_voice | 7 / 0 / 0 | 9 / 0 / 0 |

Notes on what is left: the "icon" count on coach Today is buttons inside closed sections (they have words, the checker cannot see them when folded). Text under 14px left is mainly the sponsor strip, tab labels at 13px, small uppercase section labels and the coach week list. Contrast: no text below 4.5 to 1 was found on any screen, except "Cool down" on one parents card (2.5 to 1, see suggestions).

## 4. Words kept on purpose

* **Comms** (coach only): it is the coach tab name used in the recorded coach video guides (04-comms.mp4) and chapter audio. Renaming it means re recording, so it is a suggestion below.
* **Role cards** (coach only screens): Tim and Deano's name for the brief they write per shirt. Families now only ever see "position".
* **Unit, back unit, attack unit, rondo** on the Training 11/11 page: these words are spoken in 13 voice over clips (10 whole team, 3 position). Changing the words on screen without the voice would not match. The family card now explains rondo as "a keep ball game (rondo)". See suggestions.
* **Respect code**: the FA name. The card already says "our plain English version of the FA Respect code" with a link.
* **Final third, mid block, triggers** inside the shape page voice overs: the chip names are now plain ("Near their goal", "Defending: hold the middle", "When to press"), the spoken words are unchanged.

## 5. Voice overs

"My role" is not spoken in any clip. I searched every narration line in tools/anim/s1111/specs.js and the shape page data. It is only a button label, so no clips needed regenerating. Deano stays spelled Deeno for the voice.

## 6. Full inventories

* strings_inventory_before.md and strings_inventory_after.md: every visible string from 33 app files with jargon flags (6,875 before, 6,894 after; flagged 476 before, 433 after. Most flags left are code words such as "id" or football coaching notes on coach only pages).
* before_audit.json and after_audit.json: per screen text, small text, tap target and contrast findings.
