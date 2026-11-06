/* r95: stretching player. 15s min holds, 15s rests, Alice voice, animated starts, timeline sync helpers. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const R=path.resolve(__dirname,'../..');
const d=fs.readFileSync(path.join(R,'stretch/data.js'),'utf8');
const S=JSON.parse(d.slice(d.indexOf('=')+1).trim().replace(/;$/,''));
assert(S.items.length>=15);
assert(S.voice&&/Alice/i.test(S.voice.name),'Alice voice metadata');
for(const a of ['welcome','finish','count','switch','relax',...S.items.map(i=>i.a)])assert(fs.existsSync(path.join(R,'stretch/audio',a+'.mp3')),a);
for(const i of S.items){
 assert(i.secs>=15&&i.how.length&&i.why&&i.more,i.name);
 assert(fs.existsSync(path.join(R,'stretch/img',i.pose+'.webp')),i.pose);
 assert(fs.existsSync(path.join(R,'stretch/img',i.pose+'_s.webp')),i.pose+' start');
 assert(fs.existsSync(path.join(R,'stretch/vid',i.pose+'.mp4')),i.pose+' mp4');
 assert(fs.existsSync(path.join(R,'stretch/vid',i.pose+'.webm')),i.pose+' webm');
 assert(fs.statSync(path.join(R,'stretch/vid',i.pose+'.mp4')).size<400000);
 assert(fs.statSync(path.join(R,'stretch/img',i.pose+'.webp')).size<200000);
}
assert(!/\u2014/.test(d),'no em dashes');
const sw=fs.readFileSync(path.join(R,'stretch/ssw.js'),'utf8');
for(const i of S.items){assert(sw.includes('audio/'+i.a+'.mp3'));assert(sw.includes('img/'+i.pose+'_s.webp'));}
assert(sw.includes('audio/relax.mp3')&&sw.includes('touchline-stretch-v96'));
assert(sw.includes('vid/quad.mp4')&&sw.includes('vid/quad.webm'));
const app=fs.readFileSync(path.join(R,'stretch/app.js'),'utf8');
assert(/Escape/.test(app),'Esc closes');
assert(!/fetch\(/.test(app),'no network fetch from stretch player');
assert(/HOLD_MIN\s*=\s*15/.test(app)&&/REST\s*=\s*15/.test(app));
assert(/awaitingAudio|onplaying|playClip/.test(app),'audio-gated timeline');
assert(/openHow|howto/.test(app),'tap image how-to');
assert(/badgeHtml|restwrap/.test(app),'rest badge countdown');
assert(/hasVid|stretch-vid|vidSrc/.test(app),'video clips');
assert(/playbackRate\s*=\s*0\.5|playbackRate=0\.5/.test(app)||/rate:0\.5/.test(app),'howto slow demo');
assert((app.match(/localStorage\.getItem/g)||[]).length===1,'only pregame reads localStorage');
assert(/tl\.prestretch/.test(app));
assert(/mode!=='pregame'/.test(app)||/mode!==\"pregame\"/.test(app));
for(const f of ['family.html','parents.html'])assert(/function stretchCard\(\)/.test(fs.readFileSync(path.join(R,f),'utf8')),f);
assert(fs.readFileSync(path.join(R,'coach/app.js'),'utf8').includes('../stretch/index.html'));
assert(app.includes("k:'rest'")||app.includes('k:"rest"')||/k:'rest'/.test(app));
console.log('stretch ok');
console.log('stretch images ok');
