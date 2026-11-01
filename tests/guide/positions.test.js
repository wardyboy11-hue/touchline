// Release 74: position resources. Family copy must never carry Coaches' Voice material; coach copy flags it.
const fs=require('fs'),path=require('path'),assert=require('assert');
const R=path.join(__dirname,'..','..');
const fam=JSON.parse(fs.readFileSync(path.join(R,'positions.json'),'utf8'));
const co=JSON.parse(fs.readFileSync(path.join(R,'coach','positions.json'),'utf8'));
const famS=JSON.stringify(fam).toLowerCase();
assert.strictEqual(fam.slots.length,11);assert.strictEqual(co.slots.length,11);
assert.deepStrictEqual(fam.slots.map(s=>s.k),['GK','RCB','CB','LCB','RWB','LWB','CDM','RCM','LCM','RST','LST']);
assert(!famS.includes('coachesvoice')&&!famS.includes("coaches' voice")&&!famS.includes('cv academy'),'no CV in family file');
assert(!famS.includes('"cv":1')&&!famS.includes('"ty":"masterclass"')&&!famS.includes('drive-folder')&&!famS.includes('drive-pdf'));
assert(!('folder' in fam.slots[0])&&!('pdfs' in fam.slots[0]),'family file has no Drive folder ids');
const cv=co.slots.flatMap(s=>Object.values(s.sec).flat()).filter(i=>i.cv);
assert(cv.length>20,'coach copy keeps CV items, flagged');
// no player data: no emails, phone numbers or DOB-like strings
for(const s of [JSON.stringify(fam),JSON.stringify(co)]){assert(!/[\w.+-]+@[\w-]+\.[\w.]+/.test(s.replace(/https?:\/\/\S+?"/g,'"')),'no emails');assert(!/\b0\d{10}\b|\+44\d{9,10}/.test(s),'no phones');}
// family page: cards are player only, coach page: share never auto-sends
const pj=fs.readFileSync(path.join(R,'positions.js'),'utf8');
assert(/D\.role!=='player'\)return ''/.test(pj));assert(pj.includes("call('f.pos.file'"));assert(!/call\('file\.get'/.test(pj));
const cj=fs.readFileSync(path.join(R,'coach','positions.js'),'utf8');
assert(cj.includes('navigator.share'));assert(/it\.cv\?'':/.test(cj),'CV items have no share button');
const fh=fs.readFileSync(path.join(R,'family.html'),'utf8');assert(fh.includes('positions.js?v='));assert(!fh.includes('coach/positions.json'));
// family suggestions matched on the phone, using the shared tag list
assert.deepStrictEqual(co.tags,fam.tags);
console.log('positions: ok');
