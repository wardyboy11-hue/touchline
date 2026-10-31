/* ===================== In-app file viewer (release 72) =====================
 * Coach actions (auth_ has already checked the coach or Deano code):
 *   file.get   {id}  -> {name, mime, size, b64, kind}   any library or session file
 *   plan.get   {id}  -> same as file.get (old clients keep working)
 *   folder.list{id}  -> {name, items:[{id,name,mime,kind}]}  browse a library folder in the app
 * Safety guard: the file (or folder) must sit, at any depth, under one of the allowed roots.
 * Roots default to every "Footy Coaching" folder in the owner's Drive plus Coaches Voice and
 * X Sessions; set the script property VIEW_ROOTS (comma separated ids) to override.
 * Ancestry answers are cached for 6 hours per folder. Shortcuts are followed (the shortcut
 * itself or its target must be inside a root). Google Docs, Slides, Sheets and Drawings are
 * exported to PDF. PDFs, images and videos are served as they are. Files stay private in Drive.
 */
var VIEW_ROOTS_DEFAULT = [
  '1qDJbUMhzccy974MLF0xuj8q9-RQrF-aJ', // My laptop / Footy Coaching (the live working folder)
  '1ahr5GNZuGK2t9S0Wnl9tDkFpPfTY8nI4', // My Drive / Footy Coaching
  '1c5vQj9NemzUsDj7ZyQlHYkt0tcpjJCk2', // Footy Coaching (copy)
  '1qNEWXFh-hTHBCJOs-R_GIDbAJRJHnzlE', // Footy Coaching (copy)
  '1t0zC3Pa4sSk0t85stOmC_eYCQYaYm3tG', // Footy Coaching (copy)
  '1p3Gz3Uv3hWOMOKqidKQfStY3_GfZk0rP', // Footy Coaching (copy)
  '1I1mZb8lWx5VFJ0bWrLh-0Yq87FajtHal', // Coaches Voice
  '1ls1UXGWhNTqdVGWf1ljrYe3QjlFD6e1g', // X Sessions
  '1iRW4kqiISUgRd_DiH-Zq4FkgTP3P0Snx'  // Sessions
];
var VIEW_MAX_BYTES = 30 * 1024 * 1024;
function viewMime_(f) {
  var m = f.getMimeType(), n = String(f.getName()).toLowerCase();
  if (m === 'application/octet-stream' || m === 'application/mp4') {
    if (/\.(mp4|m4v)$/.test(n)) return 'video/mp4';
    if (/\.mov$/.test(n)) return 'video/quicktime';
    if (/\.pdf$/.test(n)) return 'application/pdf';
  }
  return m;
}
var VIEW_EXPORT = {
  'application/vnd.google-apps.document': 1,
  'application/vnd.google-apps.presentation': 1,
  'application/vnd.google-apps.spreadsheet': 1,
  'application/vnd.google-apps.drawing': 1
};

function viewRoots_() {
  var p = PropertiesService.getScriptProperties().getProperty('VIEW_ROOTS');
  var l = p ? String(p).split(/[\s,]+/) : VIEW_ROOTS_DEFAULT;
  var o = {};
  for (var i = 0; i < l.length; i++) if (l[i]) o[l[i]] = 1;
  return o;
}

function viewId_(v) {
  var id = String(v || '').trim();
  var m = id.match(/(?:\/d\/|[?&]id=|\/folders\/)([A-Za-z0-9_-]{20,80})/);
  if (m) id = m[1];
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(id)) throw new Error('That file link is not valid.');
  return id;
}

/* True if the folder is a root or sits under one, at any depth. Cached per folder. */
function viewFolderOK_(folder, roots, cache, seen) {
  var id = folder.getId();
  if (roots[id]) return true;
  if (seen[id]) return false;
  seen[id] = 1;
  var key = 'vf_' + id, hit = cache.get(key);
  if (hit === '1') return true;
  if (hit === '0') return false;
  var ok = false, up = folder.getParents();
  while (!ok && up.hasNext()) ok = viewFolderOK_(up.next(), roots, cache, seen);
  try { cache.put(key, ok ? '1' : '0', 21600); } catch (e) {}
  return ok;
}

function viewInRoots_(item, roots) {
  if (roots[item.getId()]) return true;
  var cache = CacheService.getScriptCache(), seen = {}, up = item.getParents();
  while (up.hasNext()) if (viewFolderOK_(up.next(), roots, cache, seen)) return true;
  return false;
}

function viewKind_(mime) {
  if (mime === 'application/pdf' || VIEW_EXPORT[mime]) return 'pdf';
  if (/^image\//.test(mime)) return 'image';
  if (/^video\//.test(mime) || mime === 'application/mp4') return 'video';
  if (mime === 'application/vnd.google-apps.folder') return 'folder';
  if (mime === 'application/vnd.google-apps.shortcut') return 'shortcut';
  return '';
}

function fileGet_(b) {
  var id = viewId_(b.id), roots = viewRoots_(), f;
  try { f = DriveApp.getFileById(id); } catch (e) { throw new Error('File not found in Drive.'); }
  var guardOK = viewInRoots_(f, roots);
  if (f.getMimeType() === 'application/vnd.google-apps.shortcut') {
    var tid = f.getTargetId();
    try { f = DriveApp.getFileById(tid); } catch (e2) { throw new Error('That shortcut points to a file that has gone.'); }
    guardOK = guardOK || viewInRoots_(f, roots);
  }
  if (!guardOK) throw new Error('That file is not in the Footy Coaching folder.');
  var mime = viewMime_(f), kind = viewKind_(mime), blob;
  if (!kind || kind === 'folder' || kind === 'shortcut') throw new Error('This type of file cannot be shown in the app yet.');
  if (VIEW_EXPORT[mime]) { blob = f.getAs('application/pdf'); mime = 'application/pdf'; }
  else {
    if (f.getSize() > VIEW_MAX_BYTES) throw new Error('That file is too big to show in the app.');
    blob = f.getBlob();
  }
  var bytes = blob.getBytes();
  if (bytes.length > VIEW_MAX_BYTES) throw new Error('That file is too big to show in the app.');
  return { name: f.getName(), mime: mime, kind: kind, size: bytes.length, b64: Utilities.base64Encode(bytes) };
}

function folderList_(b) {
  var id = viewId_(b.id), roots = viewRoots_(), d;
  try { d = DriveApp.getFolderById(id); } catch (e) { throw new Error('Folder not found in Drive.'); }
  if (!viewInRoots_(d, roots)) throw new Error('That folder is not in the Footy Coaching folder.');
  var items = [], it = d.getFolders(), x;
  while (it.hasNext() && items.length < 300) { x = it.next(); items.push({ id: x.getId(), name: x.getName(), mime: 'folder', kind: 'folder' }); }
  it = d.getFiles();
  while (it.hasNext() && items.length < 600) {
    x = it.next();
    var m = x.getMimeType(), k = viewKind_(m);
    if (k === 'shortcut') { try { k = viewKind_(DriveApp.getFileById(x.getTargetId()).getMimeType()); } catch (e3) { k = ''; } }
    if (k) items.push({ id: x.getId(), name: x.getName(), mime: m, kind: k });
  }
  items.sort(function (a, c) { return (a.kind === 'folder' ? 0 : 1) - (c.kind === 'folder' ? 0 : 1) || a.name.localeCompare(c.name); });
  return { name: d.getName(), items: items };
}

/* Run once by hand in the editor to approve Drive access and check the viewer. */
function fileGetTest() {
  var r = fileGet_({ id: '1JyN8YA-rH8BIMlr6u-zE8uK6tzDcuXUm' });
  Logger.log(r.name + ' ' + r.size + ' bytes ' + r.kind);
  var l = folderList_({ id: '1I1mZb8lWx5VFJ0bWrLh-0Yq87FajtHal' });
  Logger.log(l.name + ': ' + l.items.length + ' items');
}
