# Redesign P0 to P3: what shipped and how to turn it on

Branches: feature/touchline-p0-shell, p1-marks, p2-voice-media, p3-parent-link (all merged to main).

## Front end (live as soon as GitHub Pages deploys)
- P0: coach/index.html is a bootstrap. CSS in coach/app.css, code in coach/app.js. coach/sw.js v52 precaches the shell, offline fallback to the shell, no PDFs or media cached. Match spine strip (Team sheet, Role cards, Go live, Review). Role cards card on Plan match.
- P1: Full time page has Coach marks. Train, Plan, This week has Needs from match marks with Confirm work ons. Players get a "How did you play?" card and Work on card.
- P2: Your voice has No name or With my shirt number. Pull to refresh on family pages.
- P3: Parents get "Your lad" and a read only player view.

## Backend (needs pasting into the Apps Script, then Deploy, Manage deployments, new version)
1. backend/apps-script/Code.gs (updated dispatcher plus new functions) and helpdesk.gs (rate_ is used by marks and photos).
2. New sheet tabs are created on first use: FtMarks, PhotoQ.
3. New actions: f.rolecard, f.fm.get, f.fm.set, f.workon, f.child, fm.list, photo.q.list, photo.q.ok, photo.q.no. f.voice.add takes named, f.voice.mine returns named questions, f.photo now queues for approval.

## Not done yet (be honest)
- No automatic explicit image detection. Fail closed instead: every family photo waits for a coach.
- Report or remove on published clips, and consent flags on gallery items, are not extended.
- Deeper module split (Vite and Preact) is deliberately left for later.
- Parent to player view uses the shared player id, so no code retyping. Check the family code rows pair the right parent and player.
