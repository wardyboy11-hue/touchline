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
