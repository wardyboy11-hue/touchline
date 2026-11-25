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
assert.ok(app.includes("lib.js?v=119") && app.includes("res.js?v=119"));
const ver=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
assert.equal(ver.v,'119');
// No Tactx stills or write-ups in the catalog snapshot
const cat=JSON.parse(fs.readFileSync(path.join(root,'tools/tactx-catalog.json'),'utf8'));
const blob=JSON.stringify(cat);
assert.ok(!/uscreencdn\.com\/images\/programs/.test(blob), 'catalog snapshot must not store thumbnails');
assert.ok(!blob.includes('data-short-description'));
const gk=[
  ['https://tactxcoach.com/programs/gkpo01-9870dd','GOALKEEPING / PLAYING OUT / PRACTICE 1'],
  ['https://tactxcoach.com/programs/gkpo02-c0f087','GOALKEEPING / PLAYING OUT / PRACTICE 2'],
  ['https://tactxcoach.com/programs/gkpo03-6ab41d','GOALKEEPING / PLAYING OUT / PRACTICE 3'],
  ['https://tactxcoach.com/programs/gkpo04-3deb41','GOALKEEPING / PLAYING OUT / PRACTICE 4'],
  ['https://tactxcoach.com/programs/gk-in-possession-talkover-b82eb3','RUBEN AMORIM / IN POSSESSION / GOALKEEPING / TALK-OVER'],
  ['https://tactxcoach.com/programs/ederson-the-best-ball-playing-goalkeeper-in-world-football','EDERSON - THE BEST BALL-PLAYING GOALKEEPER IN WORLD FOOTBALL']
];
for(const [url,title] of gk){
  const r=tx.find(x=>x.url===url);
  assert.ok(r, 'missing '+url);
  assert.equal(r.title,title);
  assert.equal(r.t,5,'goalkeeping topic for '+url);
  assert.equal(r.aud,'c');assert.equal(r.emb,'l');assert.equal(r.appr,false);
  assert.equal(r.paid,true);
}
assert.ok(!tx.some(r=>/futsal/i.test(r.title+' '+r.url)), 'futsal GK class must stay out');
const appSrc=fs.readFileSync(path.join(root,'coach/app.js'),'utf8');
assert.ok(appSrc.includes("libIsTactx(r)?'Members, link only':'Paid, link only'"), 'coach Library shows Members on Tactx paid rows');
assert.ok(appSrc.includes("Paid sources are links only. Tactx items marked Members are included with your Tactx membership"));
const fam=fs.readFileSync(path.join(root,'family.html'),'utf8');
const par=fs.readFileSync(path.join(root,'parents.html'),'utf8');
assert.ok(fam.includes("r.paid?'Paid, link only':'Free'"), 'family wording stays Paid if a paid item is ever shown there');
assert.ok(par.includes("r.paid?'Paid, link only':'Free'"), 'parents wording stays Paid');
console.log('tactx library ok', tx.length, 'rows,', free.length, 'free,', paid.length, 'paid');
