# Resource library

Coach: Train, Library mode, Library tab. Player and parent: Library card on the player home page, and "From the library" on the parent's lad page.

## Files
- `coach/topics.js`: the one list of 10 topics plus tags (352 is 3-5-2 / back three). Used by x.js, ig.js, res.js, lib.js and the player page.
- `coach/lib.js`: library rows (audience, format, embed, paid, U15, approved, topic, tags). Loaded only when the Library tab or player page opens.
- `coach/x.js`, `coach/ig.js`: 3-5-2 items added with a fourth field, the tag.
- `coach/res.js`: topics come from topics.js; web items added with new sources (Sport Session Planner, Modern Soccer Coach, The FA, Tifo).
- `backend/apps-script/library.gs`: requests, decisions, gives.

## Rules built in
- Everything new starts NOT approved. Nothing reaches a player until the coach taps Approve and then Publish.
- X and Instagram rows are coach only. Players see them only if the coach gives that item to them (link out, no embed).
- Players see YouTube in privacy mode (youtube-nocookie, no related videos). No comments anywhere.
- Paid sources are links only and say Paid.
- Player and parent pages show shirt numbers only. Coaches see shirt numbers on requests.
- Parents see only what their own lad has been given.

## Test steps
1. Coach app, Train, Library, Library. All 51 rows show. Filters (who can see it, topic, cost, format, collection) change the count.
2. Approve three items (Tifo, FA session, Sport Session Planner), tap Publish. The Players card says 3 approved.
3. Instagram and X tabs: tap the 3-5-2 chip, 20 and 25 items show. Old topics still show their old items.
4. Resources tab: new sources appear in the source chips.
5. Player code: Library card on home. Only published items show. Ask for something typed, then Ask for this on an item.
6. Coach: Library tab shows a Requests badge. Approve, Give (swap) or Decline with a note. Player sees the result and the item under Picked for you.
7. Player taps I tried it. Item shows Tried it.
8. Parent code: lad page shows From the library with only his items.
9. Give an item to shirt numbers "4, 7": both players see it.

## Not done yet
- Push alert to the player when an item is given (the push worker exists, not wired to this).
- "I tried it" is recorded but does not yet feed the marks and needs loop.
- The research table of 51 sources was not in the prompt file, so only the items listed in the prompt are in lib.js. Topics are set to 0 (positional play) unless noted, and U15 suitable is only ticked for items already known to suit.
