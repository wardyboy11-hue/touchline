/* r84: stretching player. Audio present, no em dashes, no player data, linked from family, parents and coach Run. */
const fs=require('fs'),path=require('path'),assert=require('assert');const R=path.resolve(__dirname,'../..');
const d=fs.readFileSync(path.join(R,'stretch/data.js'),'utf8');const S=JSON.parse(d.slice(d.indexOf('=')+1).trim().replace(/;$/,''));
assert(S.items.length>=15);for(const a of ['welcome','finish','count','switch',...S.items.map(i=>i.a)])assert(fs.existsSync(path.join(R,'stretch/audio',a+'.mp3')),a);
for(const i of S.items){assert(i.intro>=15&&i.secs>=30&&i.how.length&&i.why&&i.more);}
assert(!/\u2014/.test(d),'no em dashes');
const sw=fs.readFileSync(path.join(R,'stretch/ssw.js'),'utf8');for(const i of S.items)assert(sw.includes('audio/'+i.a+'.mp3'));
for(const f of ['family.html','parents.html'])assert(/function stretchCard\(\)/.test(fs.readFileSync(path.join(R,f),'utf8')),f);
assert(fs.readFileSync(path.join(R,'coach/app.js'),'utf8').includes('../stretch/index.html'));
const app=fs.readFileSync(path.join(R,'stretch/app.js'),'utf8');assert(/Escape/.test(app),'Esc closes');
assert(!/fetch\(/.test(app),'no network fetch from stretch player');
/* r90 pregame may read tl.prestretch from localStorage; cool-down path still stores nothing about the player */
const appNoPre=app.replace(/\/\* r90 pregame[\s\S]*?\}\)\(\);/,'');
assert(!/localStorage/.test(appNoPre),'cool-down path stores no player data');
console.log('stretch ok');

for(const i of S.items){assert(fs.existsSync(path.join(R,'stretch/img',i.pose+'.webp')),i.pose);assert(fs.statSync(path.join(R,'stretch/img',i.pose+'.webp')).size<120000);assert(sw.includes('img/'+i.pose+'.webp'));assert(sw.includes('img/'+i.pose+'_t.webp'));}
console.log('stretch images ok');
