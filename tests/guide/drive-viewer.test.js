/* Release 72: library and session files open inside the app, never bounced to Drive. */
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','..','coach');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const src=app.slice(app.indexOf('function driveId('),app.indexOf('function dvMsg('));
const driveId=new Function(src+';return driveId;')();
assert.deepStrictEqual(driveId('https://drive.google.com/file/d/18g-XW8tChkNhRYHCmqhsjfhZ1vgOpG5k/view?usp=sharing'),{id:'18g-XW8tChkNhRYHCmqhsjfhZ1vgOpG5k',folder:false});
assert.deepStrictEqual(driveId('https://drive.google.com/drive/folders/18jzpYTavvR7QVlXGYKKvllhOqfDurl2W'),{id:'18jzpYTavvR7QVlXGYKKvllhOqfDurl2W',folder:true});
assert.strictEqual(driveId('https://docs.google.com/presentation/d/1UgtMxQ7oBUMJBuENM2diEI36H-DNAWL8zmMoT12sH1I/edit').id,'1UgtMxQ7oBUMJBuENM2diEI36H-DNAWL8zmMoT12sH1I');
assert.strictEqual(driveId('https://drive.google.com/open?id=1JyN8YA-rH8BIMlr6u-zE8uK6tzDcuXUm').id,'1JyN8YA-rH8BIMlr6u-zE8uK6tzDcuXUm');
assert.strictEqual(driveId('https://drive.google.com/drive/search?q=rondo'),null,'searches stay external');
assert.strictEqual(driveId('https://x.com/a/status/1'),null);
// every Drive item in the library is recognised, so none bounce to Drive
const lib=JSON.parse(fs.readFileSync(path.join(root,'library.json'),'utf8'));const L=Array.isArray(lib)?lib:(lib.items||[]);
const drv=L.filter(x=>/drive\.google\.com/.test(x.url||''));
assert.ok(drv.length>=300,'library has its Drive items');
drv.forEach(x=>assert.ok(driveId(x.url),'opens in app: '+x.url));
// wiring: file.get, a Back button, Drive only as the fallback, the pdf.js viewer is vendored
assert.ok(/call\('file\.get'/.test(app)&&/call\('folder\.list'/.test(app));
assert.ok(/&larr; Back/.test(app));
assert.ok(/data-drive="1"[^>]*>Not showing\? Open in Drive/.test(app)||/data-drive="1"/.test(app));
assert.ok(!/plan\.get/.test(app),'old plan action no longer used by the client');
assert.ok(fs.existsSync(path.join(root,'vendor','pdfjs','pdf.min.mjs'))&&fs.existsSync(path.join(root,'vendor','pdfjs','pdf.worker.min.mjs')));
// the click interceptor lets explicit Drive fallback links through
assert.ok(/a\.dataset\.drive\)return/.test(app));
console.log('drive-viewer tests passed');
