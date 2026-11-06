/* r90: Pre-game stretch. Niggle chips, 2-min programme, private health, coach attendance by shirt #. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const R=path.resolve(__dirname,'../..');
const ps=fs.readFileSync(path.join(R,'prestretch.js'),'utf8');
assert(ps.includes('openPreStretch')&&ps.includes('preStretchExtra')&&ps.includes('niggleCard'));
assert(ps.includes('If it hurts, stop and tell a coach'));
assert(ps.includes('tl.prestretch')&&ps.includes('tl.niggle.q'));
assert(ps.includes("f.niggle")&&ps.includes("f.prestretch.set"));
for(const a of ['hamstrings','calves','groin','hips','quads','lowerback','ankles','none'])assert(ps.includes("k:'"+a+"'")||ps.includes('k:"'+a+'"'),a);
assert(!/fetch\(/.test(ps),'offline queue uses call(), no raw fetch');
const app=fs.readFileSync(path.join(R,'stretch/app.js'),'utf8');
assert(/mode!=='pregame'/.test(app)||/mode!==\"pregame\"/.test(app));
assert(app.includes('tl.prestretch')&&app.includes('If it hurts, stop and tell a coach'));
for(const f of ['family.html','parents.html']){
  const h=fs.readFileSync(path.join(R,f),'utf8');
  assert(h.includes('prestretch.js?v='),f+' loads prestretch');
  assert(/Pre-game stretch/.test(h)&&/preStretchExtra|openPreStretch/.test(h),f+' stretch card');
  assert(h.includes('niggleCard'),f+' private niggle card on profile');
}
const coach=fs.readFileSync(path.join(R,'coach/app.js'),'utf8');
assert(coach.includes('niggle.list')&&coach.includes('coachNiggleForNum')&&coach.includes('coachNiggleBannerHtml'));
assert(coach.includes('tl-niggle-banner'));
const gs=fs.readFileSync(path.join(R,'docs/Code_v32.gs'),'utf8');
assert(gs.includes("f.niggle")&&gs.includes("f.prestretch.set")&&gs.includes('niggle.list'));
assert(gs.includes('function famNiggle_')&&gs.includes('function famPrestretch_')&&gs.includes('function niggleList_'));
assert(gs.includes("cur.niggle")&&gs.includes("cur.prestretch"),'Self sheet keeps health fields');
/* vm smoke: makeProg weights areas and caps length */
const vm=require('vm');
const sandbox={window:{},setTimeout(){},clearTimeout(){},localStorage:{_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=String(v);}},document:{createElement(){return {style:{},setAttribute(){},appendChild(){}};},getElementById(){return null;},head:{appendChild(){}},body:{appendChild(){}}},addEventListener(){},location:{pathname:'/family.html',search:''},navigator:{onLine:true}};
sandbox.window=sandbox;sandbox.document.head=sandbox.document.head;
vm.runInNewContext(ps+'\nthis.__out=this.__preStretch;',sandbox);
const P=sandbox.__out;assert(P&&P.makeProg);
const none=P.makeProg(['none']);assert.strictEqual(JSON.stringify(none.areas),JSON.stringify(['none']));assert(none.ids.length>=3&&none.ids.length<=3);
const ham=P.makeProg(['hamstrings','calves']);assert(ham.ids.includes('ham')&&ham.ids.includes('calf'));assert(ham.hold===15);
const totHold=ham.ids.length*2*ham.hold; /* rough: L+R sides in stretch data */
assert(ham.ids.length<=3,'cap short pre-game');
console.log('prestretch ok');
