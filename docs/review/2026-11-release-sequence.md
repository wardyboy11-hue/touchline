# Release sequence, 6 November 2026

Do not paste `docs/Code_v33.gs` or `docs/Code_v32.gs` over the live script. Those snapshots are older than production v36. Do not create a new Apps Script deployment. Edit the current web app and publish a new version of it.

The live website can stay on release 103 while these backend lines are added. The new actions are not called by release 103. Existing actions are not rewritten.

## 1. Backend, on the real v36 script, before the website moves

### Patch A, from `docs/r104-travel-addon.gs`

After the existing `alert.send` line, which already sits behind `auth_(b.code)`, add only:

```
if (b.action === 'travel.send') return out_({ ok: true, data: travelSend_(b) });
if (b.action === 'travel.list') return out_({ ok: true, data: { rows: travelList_() } });
```

Do not edit the `alert.send` line. Do not put these on the `f.` family branch.

Paste `travelTab_`, `travelLine_`, `travelSend_` and `travelList_` at the end of the script. They call `tab_`, `clean_`, `today_` and `notify_`, which v36 already has. Do not replace those helpers.

`tab_('Travel', ...)` creates the Travel sheet the first time a coach sends a note. There is no separate setup function and no rewrite of existing rows.

### Patch B, from `docs/r105-motm-addon.gs`

After the coach `auth_(b.code)` block, next to the other coach actions, add only:

```
if (b.action === 'motm.status') return out_({ ok: true, data: motmStatus_(b) });
if (b.action === 'motm.close') return out_({ ok: true, data: motmClose_(b) });
if (b.action === 'motm.reopen') return out_({ ok: true, data: motmReopen_(b) });
if (b.action === 'motm.awards') return out_({ ok: true, data: motmAwards_(b) });
```

Do not put these on the `f.` branch.

In the existing `voteState_`, change only the candidate object so it returns `motmCand_(p)`. That adds the shirt number beside the name. Leave the rest of `voteState_` as it is. Release 103 still receives a candidate it can show.

In the existing `f.vote`, after a man of the match vote is saved, add:

```
if (kind === 'motm') { try { motmAuto_(key); } catch (e) {} }
```

The family reply stays `{ ok: true }`. The family caller does not receive the tally, the voter list, or a photo.

Paste the `motm*` functions from that file at the end. They call `auth_`, `tab_`, `players_`, `votes_`, `allDocs_`, `photo_`, `consentRows_` and `consentSeason_`. Do not replace those.

`MotmAward` and `MotmAudit` sheets are created on first use. No migration of old votes. No seed of real people.

### Then

Deploy: Manage deployments, edit the current web app, New version. Same web app address. Do not run `seedSquad` or `setupR80`.

While the website is still release 103, check sign-in, a Yes or No, and that an existing vote still saves. The new actions sit unused.

## 2. Website merge order

The three pull requests are open and GitHub reports each as mergeable. Each child already contains its parent. No rebase was required.

1. https://github.com/wardyboy11-hue/touchline/pull/54 into `main`. The site becomes version 104.
2. Retarget https://github.com/wardyboy11-hue/touchline/pull/55 from `cursor/voice-travel-r104-f49d` onto `main`, then merge it. The site becomes version 105.
3. Retarget https://github.com/wardyboy11-hue/touchline/pull/56 from `cursor/motm-close-card-677f` onto `main`, then merge it. The site becomes version 106.

Phones pick up the new version from `version.json` when the app is opened. Do not merge these from this note. The parent does the merges after the backend version above is live.

## 3. What still works if a patch is missing

Release 104 travel falls back to the existing `alert.send` coach phone alert. It does not write a shared travel row until Patch A is deployed.

Release 105 close, reopen and awards say the action is not on the server until Patch B is deployed. Voting itself still uses `f.vote`.

Release 106 colour, shortcuts, matchday headings, resources headings, wake-up and Spotify do not need a new Apps Script action.

## 4. Not in this release

Player-code personalisation, club news, league line, subs helper, Home backgrounds and parent parking pins are roadmap designs only. They are not in pull requests 54, 55 or 56.

The parent, player and coach films with voice are the previous recordings. They are labelled as not re-recorded. That does not stop the pages working.

A lock-screen alarm needs the phone Clock app, or a future Android app. The preview does not provide that app.
