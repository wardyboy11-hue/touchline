// r80: opposition managers, league info, referee prompt. Made-up data only.
const fs=require('fs'),path=require('path'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'../../coach/app.js'),'utf8');
const a=src.indexOf('var OPV='),b=src.indexOf('Object.assign(ACT,{\n opNew');assert.ok(a>0&&b>a,'r80 block present');
const S={matches:{x:{id:'x',date:'2026-11-07',ko:'09:00',opp:'Alpha Town U15 Eagles',ha:'A',status:'plan'}},settings:{}};
const f=new Function('S','CODE','fcUk','isoToday','esc','call','view','render','ctItem','intro','toast','uid',src.slice(a,b)+';return {OPV,oppFor,oppCsv,refWed,refDue,oppTeams};');
const P=f(S,'',d=>d.split('-').reverse().join('/'),()=>'2026-11-02',s=>String(s),()=>Promise.resolve({}),{},()=>{},()=>'',()=>'',()=>{},()=>'id');
P.OPV.rows=[{id:'1',club:'Alpha Town',team:'Alpha Town U15 Eagles',name:'Ann Example',phone:'07000 000000',email:'a@example.com',notes:'x, "y"'}];
assert.ok(P.oppFor('Alpha Town U15 Eagles'),'links fixture to manager');
assert.deepStrictEqual(P.oppTeams(),['Alpha Town U15 Eagles']);
const csv=P.oppCsv(P.OPV.rows,[{name:'Ref Dept',role:'Refs',email:'r@example.com',phone:''}]).split('\r\n');
assert.ok(/^Name,Given Name,Family Name,Group Membership/.test(csv[0]),'Google Contacts header');
assert.ok(csv[1].startsWith('Ann Example,Ann,Example,Opposition managers ::: * myContacts')&&csv[1].includes('"x, ""y"""'));
assert.strictEqual(P.refWed('2026-11-07'),'2026-11-04');
assert.strictEqual(P.refDue(S.matches.x,'2026-11-02'),'soon');assert.strictEqual(P.refDue(S.matches.x,'2026-11-04'),'today');
assert.strictEqual(P.refDue(S.matches.x,'2026-11-06'),'late');assert.strictEqual(P.refDue(S.matches.x,'2026-10-30'),'');
S.settings.refOk={x:'2026-11-07'};assert.strictEqual(P.refDue(S.matches.x,'2026-11-04'),'');
// no phone numbers for league contacts in public files
for(const p of ['coach/app.js','family.html','parents.html','index.html'])assert.ok(!/07999|07388|07429/.test(fs.readFileSync(path.join(__dirname,'../..',p),'utf8')),p+' has no league mobiles');
console.log('opp-league ok');
