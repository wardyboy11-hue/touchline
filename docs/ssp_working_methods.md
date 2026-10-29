# SSP working methods

Log of what works in Sport Session Planner (SSP). Updated in place. Last update: Thu 29 Oct 2026, 10:40.

## Access
- SSP signed in fine in the Chrome window used overnight. In the Chrome window used at 10:30 on 29 Oct it asked for a sign in (login box on the home page). Claude does not enter passwords. Tim signs in, then Claude carries on.
- My Sessions: https://www.sportsessionplanner.com/my.mpl?a=my_session_library
- Session view: https://www.sportsessionplanner.com/my.mpl?a=session_view&id=SESSIONID
- Session editor: https://www.sportsessionplanner.com/my.mpl?a=session_edit&id=SESSIONID
- Session IDs: Week 1 is 3515453 (Public). Week 2 is 3516533 (Private).
- Tim has said yes to cloning both as v2 so the originals stay untouched. Not done yet (sign in needed).

## Reading sessions (TESTED, works)
- Open the session view URL in a new tab, then get page text. Returns every screen's comment text in order.
- The My Sessions list loads late ("Retrieving Sessions"). Wait 3 seconds before finding links.

## Editing sessions (TESTED, works with care)
- The editor is a canvas app. 5 to 8 seconds to load. Screenshot first.
- Each drill is a Screen tab. Comments box sits under the pitch. Click in it and type. About 700 characters typed fine in one go.
- Press SAVE (top right). Wait 6 seconds. SSP returns to My Sessions with status=edited.
- Check the result on the view page with get page text.

## Screen size problem (RESEARCHED, not yet tested live)
Problem: the editor window was 1280 by 495. Pitch, comments and toolbars are cramped.

What the research found
- Claude in Chrome resize_window only changes the OS window, not the page viewport. The extension side panel eats width. Reports say it can report success and change nothing. Do not rely on it.
- Browser zoom shortcuts (cmd or ctrl plus and minus) are blocked in the tool.
- SSP has a full screen mode (icon top right of the editor, next to the gear). SSP says set up tools withdraw into the side of the screen to maximise the pitch.
- Left tool tabs and the right pitch picker can be collapsed with their arrow buttons.
- SSP view pages give clean text, so edit in the editor only for diagrams and comments. Do all reading on view pages.

What to do (in order)
1. Tim: before an overnight run, maximise Chrome, close the Claude side panel, set browser zoom to 100 percent, and use a full monitor. Biggest single fix, only Tim can do it.
2. Claude: screenshots at scale 0.5 for orientation, and the zoom action on small regions instead of full screenshots.
3. Claude: use browser_batch to chain click, type, wait and screenshot in one go.
4. Claude: try the SSP full screen icon, collapse left and right panels, then screenshot.
5. Claude: test resize_window once, check size with a screenshot. If unchanged, stop and note it here.
6. Claude: do text work (comments, scripts) in the editor Comments box, and leave diagram dragging until the window is bigger.
7. Fallback: if the window stays small, build diagrams as HTML in the Touchline style and attach them as images or links.

## Limits and rules
- Comment text does not show the diagram. If the text says two grids, the diagram must show two grids.
- Week 1 is Public already. Do not change visibility. Ask Tim first.
- No delete. Clone from the view page to make a version.
- Never enter passwords. If SSP shows a sign in box, stop that item, record it as blocked, tell Tim.

## Not yet tested
- Animation Library and the animation tool in the editor.
- Whether our plan has 3D, video or image upload (an Upgrade to Club Platform link shows, so some may be locked). SSP lists 3D and full screen as Club features.
- Clone, Print and PDF buttons.

## Blockers right now
- SSP sign in needed in the Chrome window Claude is using (Tim to sign in). Everything live in SSP waits for this.
- Drive and animations work not started.
