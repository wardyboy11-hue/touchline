# Item share, release 108

Share inside Touchline is the default. The phone share sheet is not used. WhatsApp is a separate button, and only for a public team page.

This branch starts at main release 106 (`b16da264`). It does not contain pull request 57.

## What can be sent to a family

| Item | Kind | Where | WhatsApp |
| --- | --- | --- | --- |
| Our 352 in 3D | shape | `/shape/index.html` | Separate button |
| Formation phases on that page | formation | same page | Separate button |
| Stretching | stretch | stretch card and `/stretch/index.html` | Separate button |
| Written guide | guide | guide page and the page share bar | Separate button |
| Family clip | clip | media grid and the clip player | No |
| Session or training item | session, training | coach share on that item | No |
| Position note that is not Coaches Voice | position | coach positions | No |
| Other family resource with a site or YouTube link | resource | coach resources | No |

## What cannot be sent to a family

Coaches Voice, paid packs, welfare, niggles, consent, health, marks, and any coach page that is not a published animation. The server refuses those kinds and paths. The button says the item stays with the coaches.

## Who receives it

A row is stored against the player id from the Families code map. The player code and the parent code for that same player both see it. A shirt number is only the label on the coach's list. It is not the key and it is not a password. A parent cannot address another family. Cancel does not write a row. Offline, the phone keeps a pending copy and says it has not been sent.

## Films

`guide_parents.mp4`, `guide_parents_new.mp4`, `guide_players.mp4`, and `coach/howto/01-tour.mp4` through `04-comms.mp4` are the previous recordings. They have not been re-recorded, so they still show the old phone share.

## Backend

Paste `docs/r108-share-addon.gs` onto v37. Do not replace the script with `docs/Code_v33.gs`. The ShareBox sheet is created on first send.
