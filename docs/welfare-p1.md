# Welfare P1: head injury plan, heading counter, personal goals

Branch `feature/welfare-p1`, stacked on `feature/welfare-p0` (PR #4), which is stacked on PR #2. Merge in that order.

## 1. Suspected head injury and return to play
Follows the UK concussion guidelines for grassroots sport (Sport and Recreation Alliance, with the FA): remove from play at once, NHS 111 within 24 hours, 999 for red flags, 24 to 48 hours of rest, six stages, no stage shorter than a day, training with possible head contact from day 15 at the earliest, no return to matches before day 21. Children and teenagers can take longer. This is a log and a checklist, not medical advice and not a clearance.

- **Coach, one tap.** "Suspected head injury" sits on the live match page and on Train, Tonight. Pick the shirt, read the 111 and 999 lines, confirm. He comes off the pitch, is marked unavailable for this match and every future match, and cannot be picked or switched back on. The block works with no signal because the record is kept on the coach phone and pushed when there is signal. Cleared on sign out.
- **Team, Head injury tab.** Open plans with the six stages and the dates the parent confirmed them, plus the earliest match date. "Entered by mistake" removes a record only until a parent has confirmed a stage.
- **Parent, Home.** Return to play plan card. Confirms each stage in order. The backend refuses out of order stages, a stage inside a day of the last one, stage 5 before day 15 and stage 6 before day 21. "Symptoms are back" steps back one stage.
- **Player.** Sees only "Not available for now". No date, no reason, no stages.
- **Data.** Player id, shirt, injury date, stage dates, return date. No symptoms or notes. Sheet tab `Concussion`. Deleted a year after the return date by the monthly job.

### Decision for Tim
The block lifts only when a parent confirms all six stages in the family app, and a coach cannot override. A family that does not use the app would block their lad for good. If you want a fallback (for example two coaches agree after a written note from the parent), say so and I will add it with a record of who did it.

## 2. Heading counter
FA guidance for under 14s to under 18s: heading is a low priority, one heading session a week at most, no more than 10 headers a player.
- On the Run card and on the last Build step, tap each practice to count its headers a player (none, 5, 10, 15).
- Warns when a session goes over 10 a player, and when a second session in the same week has heading. Weeks run Monday to Sunday.
- Players and parents see a plain "Heading this week" tick on Home when a session has heading. Counts only, no names, no health data.

## 3. Personal goals on the Four Corners
- Player sets one or two goals per half term (technical and tactical, physical, psychological, social), in their own words, from Home.
- Coach, Team, Goals: agree, change the words and agree, or decline with a kind note. A worrying word raises a quiet alert and flags the goal for a careful read.
- Agreed goals appear in the player's Work on card. The marks and needs loop is unchanged.
- At the end of a half term the player reviews each goal: done, still working, parked.
- Parent sees the goals read only. Other players and parents never do. No scores or comparisons.
- Goals older than last season are deleted by the monthly job.

## Apps Script steps (Tim)
1. Add `concussion.gs` and `goals.gs` as new files (and `consent.gs` from P0 if not done).
2. `Code.gs` gains dispatcher lines for `conc.*`, `goals.*`, `f.conc.*`, `f.goals.*`, a merged `f.workon` and a `head` field on `f.home`.
3. Deploy, Manage deployments, edit, New version. The monthly trigger from P0 covers the new clean ups.

## Test steps
Run `tests/welfare` (see the README there). By hand:
1. Live match, Suspected head injury, pick a shirt, confirm: he leaves the pitch, the Plan chip says not available and will not switch on, the Head injury tab shows six stages.
2. Parent code, Home: confirm stage 1 tomorrow, try stage 5 early and read the refusal.
3. Player code, Home: only "Not available for now".
4. Phone in flight mode: the block still holds and the Head injury tab still opens.
5. Run, tap practices under Heading to reach 15: warning. Make a second heading session the same week: warning.
6. Player, Home, My goals: add one. Coach, Team, Goals: change the words and agree. Player, Work on: the goal shows.
