# Guide and video inventory, November 2026

Written for the r106 preview. The filmed tours were not re-recorded. A silent walkthrough of the new Home is a separate file, with no voice.

## What changed on screen

Home for parents starts with Parent home, then Playing?, Fixtures, Emergency, Clips.
Home for players starts with Player home, then Playing?, Fixtures, My page, Clips.
Games is headed Parent matchday or Player matchday. The fixture cards, lifts, kit and directions are still there.
Media is headed Parent resources or Player resources. Clips, listen, pictures and Share are still there.
Coach matchday has a Coach matchday heading above the clock. Alerts and the checklist stay on the same screen.
Coach resources has a Coach resources heading above search. Favourites and share stay on each practice.
Man of the match still shows the name and the shirt number.
Buttons are at least 44px. The kit colour is dark blue #021945 with gold, not purple fills.

## Routes kept

| Route | Still there |
| --- | --- |
| Parent and player: Home, Games, Events, Media, Me, contacts, help, voice, clips | Yes |
| Attendance Yes, Maybe, No, including the offline queue | Yes |
| Share bar and clip share | Yes |
| Emergency contacts, including 999 | Yes |
| Man of the match name and shirt number | Yes |
| Coach: Today, Match, live clock, subs, goals, Resources, Favourites, Guides | Yes |
| Offline family answer queue `fam.attq` | Yes |

## Pages that explain the app

| Where | What it is | Updated for this preview |
| --- | --- | --- |
| `guide.html` | Parent, what's new, and player chapter videos | Note added that the films show the previous screens. Silent preview linked only because the file was recorded. |
| `parents.html` and `family.html` help text | How to use this page | Shortcut names match the buttons. |
| `coach/app.js` `vHelp` and `vHowTo` | Coach how to | Points at the same coach films. Chapter 1 text now matches the man of the match decision. |
| `coach/app.js` `howCard` | Per-page How this page works | Left as it was. The page names are unchanged. |
| `docs/guide/guide.html` | Printable coach guide | Not a screen tour. Left as it was. |

## Videos

| File | Sound | Status |
| --- | --- | --- |
| `guide_parents.mp4` plus `guide_parents.vtt` | Tim's voice | Out of date for the new Home row. Not re-recorded. |
| `guide_parents_new.mp4` plus captions | Tim's voice | Out of date for the new shortcuts. Not re-recorded. |
| `guide_players.mp4` plus captions | Tim's voice | Out of date for Player home and My page. Not re-recorded. |
| `coach/howto/01-tour.mp4` to `04-comms.mp4`, with captions and posters | Coach voice | Out of date wherever a button moved. Not re-recorded. |
| `guide_preview_silent.webm` | None | New silent Home. Not a replacement for Tim's voice. |
| `guide_preview_matchday_silent.webm` | None | New silent matchday. Not a replacement for Tim's voice. |
| `guide_preview_resources_silent.webm` | None | New silent resources. Not a replacement for Tim's voice. |

Stretch clips, tactic animations, and podcast audio are practice material, not app tours. They were not changed.

## Still to produce, if Tim wants new sound

1. A new parent tour that says Playing?, Fixtures, Emergency, and Clips.
2. A new player film that says My page.
3. New coach films if the coach tabs should be walked again.

Until those exist, the app keeps the old films and says they show the previous screens.
