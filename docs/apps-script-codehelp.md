> Now implemented: see `backend/apps-script/helpdesk.gs` and the dispatcher lines in `Code.gs`. The notes below are the original brief.

# Apps Script: Lost your code request

The family page calls `f.codehelp` with no code. The coach app calls `help.list` and `hub.help.done` with the coach code.
The Apps Script backend is not in this repo, so add these handlers to it. Until they exist the family page shows a polite
"ask Tim or Deano at training" message and the coach app simply shows nothing extra.

Rules the handler must follow:
- `f.codehelp` is open (no code needed) but must be rate limited (for example five per hour) and must never return a code.
- Store only role, shirt number, first name and a timestamp. No contact details.
- `help.list` and `hub.help.done` are coach gated like the other hub actions.

Sketch (adapt the helper names to the existing script):

```js
case 'f.codehelp': {
  var n = String(p.num || '').replace(/\D/g, '').slice(0, 3);
  if (!n) throw new Error('Add the shirt number');
  rateLimit_('codehelp', 5, 3600);
  var sh = sheet_('CodeHelp', ['id', 'at', 'role', 'num', 'first', 'done']);
  sh.appendRow([uid_(), Date.now(), p.role === 'player' ? 'Player' : 'Parent', n, String(p.first || '').slice(0, 30), '']);
  return { ok: true };
}
case 'help.list': {
  requireCoach_();
  return { rows: rows_('CodeHelp').filter(function (r) { return !r.done; }) };
}
case 'hub.help.done': {
  requireCoach_();
  markDone_('CodeHelp', p.id);
  return { ok: true };
}
```

## Training requests (My own training page)

The player page calls `f.trainreq` with the family code and `{topic, note}`. Store it in the same CodeHelp sheet with
`kind: 'train'` so `help.list` returns it and the coach Today card shows it under Training requests.

```js
case 'f.trainreq': {
  var who = whoFromCode_(code); // role and shirt number from the code, never the name
  rateLimit_('trainreq', 6, 3600);
  var sh = sheet_('CodeHelp', ['id', 'at', 'role', 'num', 'first', 'done', 'kind', 'topic', 'note']);
  sh.appendRow([uid_(), Date.now(), who.role, who.num, '', '', 'train',
    String(p.topic || '').slice(0, 20), String(p.note || '').slice(0, 200)]);
  return { ok: true };
}
```

Weekly home links ride on the existing weekly card as `hp: [{t, u}]` (https links only). Make sure the `wc` field or the
`[[wc:...]]` sentinel in `why` passes through to the family `D.posts` unchanged.
