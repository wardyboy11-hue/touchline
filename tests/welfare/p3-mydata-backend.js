const vm=require('vm'),fs=require('fs'),path=require('path');
const wb={};class Sheet{constructor(h){this.h=h;this.rows=[];}getLastRow(){return this.rows.length+1;}getMaxColumns(){return 20;}
 getRange(r,c,n,m){const s=this;return{getValues:()=>s.rows.slice(r-2,r-2+(n||1)).map(x=>{const o=[];for(let i=0;i<(m||1);i++)o.push(x[c-1+i]===undefined?'':x[c-1+i]);return o;}),setNumberFormat(){return this},setValues(v){v.forEach((row,k)=>{const idx=r-2+k;const t=idx>=s.rows.length?(s.rows.push([]),s.rows[s.rows.length-1]):s.rows[idx];row.forEach((val,i)=>{t[c-1+i]=val;});});}}}
 deleteRow(r){this.rows.splice(r-2,1);}appendRow(a){this.rows.push(a.map(String));}}
const get=(n,h)=>wb[n]||(wb[n]=new Sheet(h));
const notes=[];let month=11,year=2026;
const ctx={tab_:(n,h)=>get(n,h),SpreadsheetApp:{openById:()=>({getSheetByName:n=>wb[n]||null})},PropertiesService:{getScriptProperties:()=>({getProperty:()=>'x'})},
 Utilities:{formatDate:(d,tz,f)=>f==='yyyy'?String(year):f==='M'?String(month):`${year}-${month}-01`,getUuid:()=>Math.random().toString(16).slice(2)+'0000000000'},
 rate_(){},notify_(t,m){notes.push(m)},clean_:(v,n)=>String(v==null?'':v).trim().slice(0,n||200),
 players_:()=>({p1:{num:'7',name:'Sam Smith'},p2:{num:'9',name:'Dan Jones'}}),
 allDocs_:()=>({players:{p1:{name:'Sam Smith',num:'7',fan:'123',dob:'2011-05-05',pos:['CB'],obj:'work on passing',objOn:true},p2:{name:'Dan Jones',num:'9',fan:'999'}}}),
 selfAll_:()=>({p1:{nick:'Sammy',foot:'R',pos:['CB']},p2:{nick:'Danny'}}),
 answers_:()=>[{postId:'a',playerId:'p1',answer:'Y'},{postId:'a',playerId:'p2',answer:'N'}],
 consentSeason_:()=>'2026/27'};
vm.createContext(ctx);
const dir=path.resolve(__dirname,'../../backend/apps-script/');
['consent.gs','goals.gs','concussion.gs','mydata.gs'].forEach(f=>vm.runInContext(fs.readFileSync(dir+'/'+f,'utf8'),ctx));
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const call=(fn,...a)=>{ctx.__a=a;try{return {v:vm.runInContext(fn+'(...__a)',ctx)}}catch(e){return {e:e.message}}};
const me1={num:'7',name:'Sam Smith'};
T('parent must type a name',!!call('respectSign_','p1','parent',me1,{name:''}).e);
T('parent signs',call('respectSign_','p1','parent',me1,{name:'Pat Smith'}).v?.ok===true);
T('player signs with first name only',call('respectSign_','p1','player',me1,{}).v?.ok===true&&call('respectGet_','p1','player').v.signed.name==='Sam');
T('signing twice replaces, not duplicates',(call('respectSign_','p1','parent',me1,{name:'Pat S'}),wb.Respect.rows.filter(r=>r[2]==='parent').length===1));
const L=call('respectList_').v;
T('outstanding lists only the other parent',L.outstanding.length===1&&L.outstanding[0].num==='9');
T('stores name and date only',wb.Respect.rows[0].length===5);
T('parent only for my data',!!call('myDataGet_','p1','player').e);
call('consentSave_','p1','parent',{photo:'no',c1n:'Pat',c1p:'07000 111111',c1r:'Mum',med:'inhaler'});
call('consentSave_','p2','parent',{photo:'yes',c1n:'Other',c1p:'07000 222222'});
const D=call('myDataGet_','p1','parent').v;
const txt=JSON.stringify(D);
T('export has own child',D.player.name==='Sam Smith'&&D.photoConsent.photo==='no'&&D.answers.length===1);
T('export has nothing from the other child',!/Dan|Other|999|222222|Danny/.test(txt));
T('request created once',call('myDataDelete_','p1','parent',me1).v.ok===true&&call('myDataDelete_','p1','parent',me1).v.already===true&&wb.DataRequests.rows.length===1);
T('player cannot request',!!call('myDataDelete_','p1','player',me1).e);
const id=call('dataReqList_').v.rows[0].id;
T('queue visible to coach with shirt',call('dataReqList_').v.rows[0].num==='7');
['Answers','Self','FtMarks','Photos','LibReq','LibGive'].forEach(n=>{wb[n]=new Sheet([]);});
wb.Answers.rows=[['a','p1','Y'],['a','p2','N']];wb.Photos.rows=[['p1','data'],['p2','data']];
const er=call('dataErase_',{id,note:'Done with parent'});
T('erase removes this child only',er.v.removed>=4&&wb.Photos.rows.length===1&&wb.Photos.rows[0][0]==='p2'&&wb.Answers.rows.length===1&&wb.Consent.rows.every(r=>r[0]==='p2'));
T('request closed and logged',wb.DataRequests.rows[0][5]==='done'&&wb.RetentionLog.rows.length>=1);
T('cannot erase twice',!!call('dataErase_',{id}).e);
call('respectSign_','p2','parent',{num:'9',name:'Dan Jones'},{name:'Jo Jones'});
year=2027;month=9;
T('respect sign offs reset next season (purge)',call('respectPurge_').v>=1);
console.log(ok,'passed',bad,'failed');
