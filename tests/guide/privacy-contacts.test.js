// Release 71: personal data for Contacts and the FA squad list must never be in the public repo.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..','..');
const skip=/(^|\/)(\.git|node_modules|tests)(\/|$)|\.(png|jpe?g|gif|webp|mp3|mp4|m4a|pdf|ico|woff2?)$/i;
const files=[];(function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f),r=path.relative(root,p);if(skip.test(r))continue;const st=fs.statSync(p);st.isDirectory()?walk(p):files.push(p);}})(root);
assert.ok(!files.some(f=>/\.pdf$/i.test(f)&&/squad/i.test(f)),'no squad list PDF in repo');
// public, allowed addresses (safeguarding, county FA, club info)
const okMail=/@(lancashirefa\.com|thefa\.com|nspcc\.org\.uk|wiganjuniorlaticsfc\.co\.uk|example\.com)$/i;
let bad=[];
for(const f of files){const s=fs.readFileSync(f,'utf8').split('\n').join('\n'); // referee numbers moved to the private sheet (r71)
 // UK mobile numbers
 (s.match(/(?<![\d#])07\d{3}\s?\d{6}(?!\d)/g)||[]).forEach(m=>bad.push(f+': phone '+m));
 // 8 digit FA numbers inside a FAN context
 (s.match(/FAN[^\n]{0,20}?\b\d{8}\b/g)||[]).forEach(m=>bad.push(f+': FAN '+m));
}
// contacts module must not carry personal emails
const app=fs.readFileSync(path.join(root,'coach','app.js'),'utf8');
const sec=app.slice(app.indexOf('/* ---- Contacts + matchday FA squad list'),app.indexOf("window.TLX_sq"));
assert.ok(sec.length>1000,'contacts module present');
(sec.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g)||[]).forEach(m=>{if(!okMail.test(m))bad.push('coach/app.js contacts: email '+m);});
assert.deepStrictEqual(bad,[],bad.join('\n'));
// family pages: only public safeguarding contacts, no private backend actions
for(const p of ['family.html','parents.html']){const s=fs.readFileSync(path.join(root,p),'utf8');
 assert.ok(/rachael\.murphy@lancashirefa\.com/.test(s)&&/0808 800 5000/.test(s)&&/Safeguarding@TheFA\.com/.test(s),p+' safeguarding contacts');
 assert.ok(!/contacts\.get|squad\.get/.test(s),p+' must not call private actions');}
// parser smoke test with made-up names
const S=fs.readFileSync(path.join(root,'coach','app.js'),'utf8');
const fn=S.slice(S.indexOf('var MON='),S.indexOf('function sqMerge'));
const sqParse=new Function(fn+';return sqParse;')();
const r=sqParse('Example FC U15 Squad List\nExported by Test Coach on 23 November 2026 at 09:05\nAlex Sample\nMale\nAge: 14 Reg: 17 Aug 2026\nEmergency Contact:\nPat Sample - 07000000000\nSam Dummy\nAge: 15 Reg: 18 Sep 2026\nEmergency Contact:\nTeam Officials (1)\nTest Coach Team Manager\n');
assert.strictEqual(r.exported,'2026-11-23T09:05');assert.strictEqual(r.rows.length,2);assert.strictEqual(r.rows[0].name,'Alex Sample');assert.strictEqual(r.rows[0].reg,'2026-08-17');assert.strictEqual(r.rows[0].ec_phone,'07000000000');assert.strictEqual(r.rows[1].age,15);
assert.strictEqual(r.officials[0].role,'Team Manager');
console.log('privacy-contacts ok',files.length,'files');
