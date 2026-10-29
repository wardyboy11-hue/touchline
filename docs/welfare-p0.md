# Welfare P0: minutes watch, consent and emergency card

Built from the "Touchline, what else to add" review and the welfare addendum. Branch `feature/welfare-p0`, stacked on `feature/resource-library` (PR #2), so merge that first.

## What it does
- **Minutes watch** (coach, Team, Team sheet). Lists shirts under a line (default 50%) of match time across the last 4 finished games. Only games the player was available for count. Line and number of games can be changed. It sits in its own card, not in the FA list you show the referee. Nothing about how minutes are recorded has changed.
- **Photos and emergency contacts** (parent, Me tab). Once a season: photo choice (yes, team only, no), up to two emergency contacts, an optional short note the parent chooses to write. Players never see this card. Parents see only their own child's.
- **Emergency card** (coach, Team, Emergency). Pulled from the backend when you have signal, kept on the coach phone only, opens with no signal, and is wiped when you sign out. Players with no card are listed so you can chase before you travel.
- **Photo "no"**. Coaches tap the shirts in a picture when approving it in Comms, Media. A tagged picture is hidden from every family while that parent's choice is "no", including a direct fetch. Profile photos are unchanged and still only go to that player's own family.

## Data rules kept
- Stored in a restricted `Consent` tab of the existing Sheet. Not in the repo, not in any data file, never in a push alert.
- Coach and the linked parent only. Rate limited on save.
- Deleted at season end: `consentPurgeJob_` runs monthly, removes any earlier season and logs the count in a `RetentionLog` tab.
- No diagnoses asked for, no heights or weights.
- The parents' privacy page now says the card exists and who sees it.

## Apps Script steps (Tim)
1. Add `consent.gs` as a new file.
2. In `Code.gs` the dispatcher gains `consent.list`, `f.consent.get`, `f.consent.save`, and the Media tab gains a `shirts` column (added automatically).
3. Run `consentInstallTrigger_` once from the editor and accept the permission.
4. Deploy, Manage deployments, edit, New version.

## Test steps
1. Team, Team sheet: with a finished game where a shirt played little, the Minutes watch lists it with a percentage. A shirt marked unavailable for a game is not penalised for it.
2. Parent code, Me: fill the card, Save, reload: it shows as done with your answers. Try a bad phone number: your typing stays.
3. Player code, Me: no consent card.
4. Coach, Team, Emergency: card shows contacts and "NO PHOTOS" where chosen. Turn off wifi and data, reopen the app, it still opens.
5. Comms, More, Sign out: reopen, Emergency says "Not saved on this phone yet".
6. Comms, Media: tag a pending picture with a "no photos" shirt, approve it, check it is missing on that family's Media tab and on every other family's.
7. Sheet: a `Consent` tab holds one row per child per season; `RetentionLog` fills after the monthly job.

## Not in P0 yet
Cached emergency data is held by the browser store on the coach phone. It is not encrypted beyond the phone's own lock, so a screen lock is expected. Clips (highlights) have no shirt tags yet; they still rely on the existing consent tick when uploading.
