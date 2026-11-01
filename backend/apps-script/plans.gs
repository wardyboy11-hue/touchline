/**
 * Session plan viewer. Add this as a third file in the Apps Script project (File, New, Script file, name it plans).
 * Coach action `plan.get` (needs a coach or Deano code, already checked by auth_ before this runs).
 * Returns a PDF from the Footy Coaching Drive folder as base64 so the coach app can show it
 * inside Touchline without a Google sign in. Files stay private in Drive.
 *
 * Safety:
 * - PDFs only.
 * - The file must sit somewhere under the Footy Coaching root folder (script property PLAN_ROOT,
 *   defaults to the Footy Coaching folder id). Anything else is refused.
 * - 8 MB cap.
 * First run: in the Apps Script editor run planGetTest once and accept the Drive permission,
 * then Deploy, Manage deployments, edit, New version.
 */
// Superseded: live Code.gs routes plan.get to fileGet_ (VIEW_ROOTS). Kept for reference.
var PLAN_ROOT_DEFAULT = '1qDJbUMhzccy974MLF0xuj8q9-RQrF-aJ'; // main Footy Coaching (My laptop)
var PLAN_ROOT_FALLBACK = '1ahr5GNZuGK2t9S0Wnl9tDkFpPfTY8nI4'; // old cloud copy, during the merge only
var PLAN_MAX_BYTES = 8 * 1024 * 1024;

function planGet_(b) {
  var id = String(b.id || '');
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(id)) throw new Error('That plan link is not valid.');
  var root = PropertiesService.getScriptProperties().getProperty('PLAN_ROOT') || PLAN_ROOT_DEFAULT;
  var f;
  try { f = DriveApp.getFileById(id); } catch (e) { throw new Error('Plan not found in Drive.'); }
  if (f.getMimeType() !== MimeType.PDF) throw new Error('Only PDF plans can be shown here.');
  if (!planInRoot_(f, root) && !planInRoot_(f, PLAN_ROOT_FALLBACK)) throw new Error('That file is not in the Footy Coaching folder.');
  var bytes = f.getBlob().getBytes();
  if (bytes.length > PLAN_MAX_BYTES) throw new Error('That plan is too big to show here. Open it in Drive.');
  return { name: f.getName(), mime: 'application/pdf', size: bytes.length, b64: Utilities.base64Encode(bytes) };
}

/** True if the file is inside the root folder (any depth up to 10 levels). */
function planInRoot_(file, rootId) {
  var seen = {}, level = [], i, p;
  var it = file.getParents();
  while (it.hasNext()) level.push(it.next());
  for (var depth = 0; depth < 10 && level.length; depth++) {
    var next = [];
    for (i = 0; i < level.length; i++) {
      p = level[i];
      if (p.getId() === rootId) return true;
      if (seen[p.getId()]) continue;
      seen[p.getId()] = 1;
      var up = p.getParents();
      while (up.hasNext()) next.push(up.next());
    }
    level = next;
  }
  return false;
}

/** Run once by hand to approve Drive access and check the proxy works. */
function planGetTest_() {
  var r = planGet_({ id: '1JyN8YA-rH8BIMlr6u-zE8uK6tzDcuXUm' });
  Logger.log(r.name + ' ' + r.size + ' bytes');
}

/* Public name so the editor can run it. Run planGetTest once and accept the Drive permission. */
function planGetTest() { planGetTest_(); }
