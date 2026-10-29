const vm=require('vm'),fs=require('fs');
let rowsData=[];let today='2026-11-10';
const sheet={getLastRow:()=>rowsData.length+1,getRange(r,c,n,m){return{getValues:()=>rowsData.slice(r-2,r-2+(n||1)).map(x=>x.slice()),setNumberFormat(){return this},setValues(v){if(r-2>=rowsData.length)rowsData.push(v[0].slice());else rowsData[r-2]=v[0].slice();}}},deleteRow(r){rowsData.splice(r-2,1);}};
const notified=[];
const ctx={tab_:()=>sheet,Utilities:{formatDate:(d,tz,f)=>today},players_:()=>({p1:{num:'7'},p2:{num:'9'}}),rate_(){},notify_(t,m){notified.push(m)},ScriptApp:{}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').resolve(__dirname,'../../backend/apps-script/')+'/concussion.gs','utf8'),ctx);
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const run=(f,...a)=>{try{return {v:vm.runInContext(f,Object.assign(ctx,{__a:a}))}}catch(e){return {e:e.message}}};
const call=(fn,...a)=>{ctx.__a=a;try{return {v:vm.runInContext(fn+'(...__a)',ctx)}}catch(e){return {e:e.message}}};
today='2026-11-01';
call('concUpsert_',{id:'rec00001',pid:'p1',inj:'2026-11-01',st:{},closed:''});
T('record created',call('concList_').v.rows.length===1);
T('player sees only open true',JSON.stringify(call('concGet_','p1','player').v)==='{"open":true}');
T('player cannot confirm',!!call('concConfirm_','p1','player',{stage:1}).e);
T('stage 1 refused on day 0',/24 hours/.test(call('concConfirm_','p1','parent',{stage:1}).e||''));
today='2026-11-02';
T('stage 1 ok day 1',call('concConfirm_','p1','parent',{stage:1}).v?.ok===true);
T('stage 2 refused same day',/less than a day/.test(call('concConfirm_','p1','parent',{stage:2}).e||''));
T('skipping stages refused',/in order/.test(call('concConfirm_','p1','parent',{stage:3}).e||''));
for(let d=3;d<=5;d++){today='2026-11-0'+d;call('concConfirm_','p1','parent',{stage:d-1});}
// stages 1..4 done by 2026-11-05 (day 4)
today='2026-11-06';
T('stage 5 refused before day 15',/day 15/.test(call('concConfirm_','p1','parent',{stage:5}).e||''));
today='2026-11-16';
T('stage 5 ok on day 15',call('concConfirm_','p1','parent',{stage:5}).v?.ok===true);
today='2026-11-17';
T('stage 6 refused before day 21',/day 21/.test(call('concConfirm_','p1','parent',{stage:6}).e||''));
call('concBack_','p1','parent');
T('symptoms back removes stage 5',!call('concList_').v.rows[0].st[5]);
today='2026-11-22';
call('concConfirm_','p1','parent',{stage:5});
today='2026-11-23';
const r6=call('concConfirm_','p1','parent',{stage:6});
T('stage 6 ok on day 22 and closes',r6.v?.closed===true&&call('concList_').v.rows[0].closed==='2026-11-23');
T('after close, parent view says not open',call('concGet_','p1','parent').v.open===false);
T('void refused once confirmed',!!call('concVoid_',{id:'rec00001'}).e);
call('concUpsert_',{id:'rec00002',pid:'p2',inj:'2026-11-23',st:{},closed:''});
T('void ok when nothing confirmed',call('concVoid_',{id:'rec00002'}).v?.ok===true&&call('concList_').v.rows.length===1);
// merge cannot reopen or overwrite stage dates
call('concUpsert_',{id:'rec00001',pid:'p1',inj:'2026-11-01',st:{1:'2026-12-01'},closed:''});
T('upsert never rewrites a confirmed date',call('concList_').v.rows[0].st[1]==='2026-11-02');
// purge
today='2027-11-25';
T('purge keeps record at 367 days? deletes',call('concPurge_').v===1||call('concList_').v.rows.length===0);
console.log(ok,'passed',bad,'failed');
