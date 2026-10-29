#!/usr/bin/env node
/* Build coach/library.json from a Drive export. Node 18+, no dependencies.
   node tools/build-library.mjs <export.csv|export.json> [--overrides tools/library-overrides.json] > coach/library.json
   Input rows: id,name,mimeType,folderPath,url,xUrl (xUrl optional). Links and tags only. Never copy file contents. */
import fs from 'node:fs';
const args=process.argv.slice(2);let file=null,ovf=null;
for(let i=0;i<args.length;i++){if(args[i]==='--overrides')ovf=args[++i];else if(!file)file=args[i];}
if(!file){console.error('Usage: node tools/build-library.mjs <export.csv|json> [--overrides file]');process.exit(1);}
function csv(t){const rows=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'&&t[i+1]==='"'){c+='"';i++;}else if(ch==='"')q=false;else c+=ch;}else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';if(r.length>1||r[0]!=='')rows.push(r);r=[];}else c+=ch;}
 if(c!==''||r.length){r.push(c);rows.push(r);}const h=rows.shift().map(x=>x.trim());return rows.map(x=>Object.fromEntries(h.map((k,i)=>[k,(x[i]||'').trim()])));}
const raw=fs.readFileSync(file,'utf8');
const rows=/\.json$/i.test(file)?JSON.parse(raw):csv(raw);
const ov=ovf&&fs.existsSync(ovf)?JSON.parse(fs.readFileSync(ovf,'utf8')):{};
const KW=[[/build|playing out|from the back|goal ?kick/,['build-up','playing out']],[/press|trap/,['pressing']],[/counter|transition|regain|win it/,['transition','counter-attack']],[/low block|mid block|defend|box|compact|unit/,['defending']],[/overload/,['overloads']],[/wide|width|wing.?back|cross|overlap/,['wide play']],[/finish|shoot|shot/,['finishing']],[/possession|rondo/,['possession']],[/third man/,['third man']],[/between the lines|break|line/,['breaking lines']],[/1v1|turn|dribble/,['1v1']],[/goalkeep|keeper/,['goalkeeping']],[/set piece|corner|free kick/,['set pieces']],[/pass|receive|first touch|support/,['passing']],[/marking/,['marking']],[/strength|conditioning/,['physical']],[/rotation/,['rotations']],[/final third/,['final third']],[/progress|direct/,['progression']]];
const MOM=[[/build|possession|attack|breaking|third man|finish|overload|wide|cross|receive/,'in possession'],[/press|defend|block|compact|marking|box/,'out of possession'],[/counter|transition|regain/,'transition'],[/set piece|corner|free kick/,'set pieces']];
function typeOf(r){const f=(r.folderPath||'').toLowerCase();if(/masterclass|academy/.test(f))return 'masterclass';if(/x sessions|x-sessions/.test(f)||r.xUrl)return 'x';if(/animation/.test(f))return 'animation';return 'pdf';}
function srcOf(t,f){return t==='x'?'x-sessions':t==='animation'?'animations':/coaches/i.test(f)?'coachesvoice':'res';}
const seen=new Map();
for(const r of rows){const id=r.id;if(!id)continue;
 const title=r.name.replace(/\.(pdf|mp4|mov|docx?)$/i,'').replace(/\s*\(\d+\)\s*$/,'').trim();
 const type=typeOf(r),low=title.toLowerCase();
 const age=[...new Set((title.match(/U\d+(?:-U?\d+)?(?:\+)?/gi)||[]).map(x=>x.toUpperCase()))];
 const players=[...new Set((title.match(/\d+v\d+/gi)||[]).map(x=>x.toLowerCase()))];
 const system=[...new Set((title.match(/3-5-2|3-4-3|4-3-3|4-4-2|4-2-3-1|5-3-2/g)||[]).concat(/back three/i.test(title)?['back three']:[]))];
 const theme=[...new Set(KW.flatMap(([re,t])=>re.test(low)?t:[]))];
 const moment=[...new Set(MOM.flatMap(([re,m])=>re.test(low)?[m]:[]))];
 const url=type==='x'?(r.xUrl||r.url):(r.url||`https://drive.google.com/file/d/${id}/view`);
 const key=type+'|'+low;if(seen.has(key))continue;
 const pre={pdf:'cv-',masterclass:'mc-',x:'x-',animation:'an-'}[type];
 const item={id:pre+id,title,url,type,src:srcOf(type,r.folderPath||''),tags:{moment,theme,age,players,system}};
 if(type==='pdf'||type==='masterclass'){item.private=type==='pdf';item.paid=true;}
 seen.set(key,item);}
let items=[...seen.values()];
items=items.filter(i=>{const o=ov[i.id]||ov[i.url];if(o&&o.drop)return false;if(o&&o.tags)for(const k of Object.keys(o.tags))i.tags[k]=[...new Set([...(i.tags[k]||[]),...o.tags[k]])];return true;});
items.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
const out={version:1,built:process.env.LIBRARY_BUILT||new Date().toISOString().slice(0,10),note:"Links only. Coaches' Voice is paid: never rehost.",vocab:{type:['pdf','masterclass','x','video','animation','search'],moment:['in possession','out of possession','set pieces','transition'],system:['3-5-2','3-4-3','4-3-3','4-4-2','4-2-3-1','5-3-2','back three']},items};
process.stdout.write(JSON.stringify(out,null,1)+'\n');
