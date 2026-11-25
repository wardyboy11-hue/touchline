// Tactx entries in the Library and Resources packs: titles and URLs only, link only, coach only, not approved.
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
function load(file, extra){
  const ctx=Object.assign({window:{},console}, extra||{});
  ctx.window=ctx.window||ctx;
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'), ctx, {filename:file});
  return ctx;
}
const topics=load('coach/topics.js');
assert.equal(topics.window.TAGS.tactx, 'Tactx');
const lib=load('coach/lib.js', {window:{TOPICS:topics.window.TOPICS, TAGS:topics.window.TAGS}});
const rows=lib.window.LIBL();
const tx=rows.filter(r=>r.id.startsWith('tx')||r.by==='Tactx'||r.tag==='tactx');
assert.ok(tx.length>=400, 'expected hundreds of Tactx library rows, got '+tx.length);
const free=tx.filter(r=>!r.paid), paid=tx.filter(r=>r.paid);
assert.ok(free.length>=80, 'free catalog titles should be marked free, got '+free.length);
assert.ok(paid.length>free.length, 'most Tactx rows are paid');
for(const r of tx){
  assert.equal(r.aud,'c', r.id+' must be coach only');
  assert.equal(r.emb,'l', r.id+' must be link only');
  assert.equal(r.appr,false, r.id+' must start not approved');
  assert.equal(r.u15,true, r.id+' should be marked suitable for U15 coaching');
  assert.equal(r.by,'Tactx');
  assert.equal(r.tag,'tactx');
  assert.ok(/^https:\/\/tactxcoach\.com\/programs\/[A-Za-z0-9_-]+$/.test(r.url), 'bad url '+r.url);
  assert.ok(!/uscreencdn|thumbnail|short-description/i.test(JSON.stringify(r)), r.id+' must not carry media or copied text fields');
  assert.ok(r.title && !r.title.includes('|') && !r.title.includes('~'), 'packed title not safe: '+r.title);
}
const res=load('coach/res.js', {window:{TOPICS:topics.window.TOPICS, RT:topics.window.TOPICS, RA:["All ages","U8 to U11","U12 to U16","U13 to U16","U17","Not stated"]}});
const rd=res.window.RD.split('|').filter(x=>x.includes('tactxcoach.com'));
assert.equal(rd.length, tx.length, 'Resources pack should match Library Tactx count');
for(const row of rd){
  const p=row.split('~');
  assert.equal(p[0],'9');
  assert.ok(p[4] && p[4].startsWith('https://tactxcoach.com/programs/'));
  assert.ok(!p[3].includes('|'));
}
const app=fs.readFileSync(path.join(root,'coach/app.js'),'utf8');
assert.ok(/Tactx'\]/.test(app)||/Tactx"]/.test(app), 'RSRC should include Tactx');
assert.ok(app.includes("lib.js?v=118") && app.includes("res.js?v=118"));
const ver=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
assert.equal(ver.v,'118');
// No Tactx stills or write-ups in the catalog snapshot
const cat=JSON.parse(fs.readFileSync(path.join(root,'tools/tactx-catalog.json'),'utf8'));
const blob=JSON.stringify(cat);
assert.ok(!/uscreencdn\.com\/images\/programs/.test(blob), 'catalog snapshot must not store thumbnails');
assert.ok(!blob.includes('data-short-description'));
console.log('tactx library ok', tx.length, 'rows,', free.length, 'free,', paid.length, 'paid');
