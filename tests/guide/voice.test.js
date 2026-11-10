/* r95 voice intent parser */
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.resolve(__dirname,'../..');
const code=fs.readFileSync(path.join(R,'voice.js'),'utf8');
const sandbox={window:{},document:{getElementById(){return null},createElement(){return {style:{},setAttribute(){},appendChild(){},innerHTML:''};},head:{appendChild(){}},body:{appendChild(){}}},speechSynthesis:null};
sandbox.global=sandbox;sandbox.globalThis=sandbox;sandbox.window=sandbox;
vm.runInNewContext(code,sandbox);
const V=sandbox.window.TLVoice;assert(V&&V.parseIntent);
const ctx={role:'parent',shirt:'7',fixtures:[{date:'2026-11-14',ko:'15:00',opp:'Demo FC',ha:'H',venue:'Christopher Park'}],trainingLine:'Pressing and winning it back at 20:00.'};
assert.equal(V.parseIntent('show fixtures',ctx).intent,'fixtures');
assert.equal(V.parseIntent('what time is the game on Saturday',ctx).intent,'kickoff');
assert.ok(/15:00/.test(V.parseIntent('kick off',ctx).say));
assert.ok(/14:30|Meet/.test(V.parseIntent('meet time',ctx).say+V.meetBy('15:00')));
assert.equal(V.meetBy('15:00'),'14:30');
assert.equal(V.parseIntent('confirm attendance',ctx).intent,'attendance');
assert.equal(V.parseIntent('start the stretch',ctx).intent,'stretch');
assert.equal(V.parseIntent('show me a clip of how to shoot',ctx).intent,'clip');
assert.equal(V.parseIntent('show me a clip of how to shoot',ctx).topic,'shoot');
assert.equal(V.parseIntent('running late',ctx).intent,'late');
assert.equal(V.parseIntent('club shop',ctx).intent,'shop');
assert.equal(V.parseIntent('what are we doing at training tonight',ctx).intent,'training');
assert.equal(V.parseIntent('help',ctx).intent,'help');
assert.equal(V.parseIntent('zzzz unknown xyz',ctx).intent,'unknown');
var kitCtx={role:'parent',today:'2026-11-06',fixtures:[{date:'2026-11-07',ko:'11:00',opp:'Atherton Town Eagles',ha:'A',venue:'Atherton',kit:'H'}]};
var kitSay=V.parseIntent('what kit is it tomorrow',kitCtx);
assert.equal(kitSay.intent,'kit');
assert.ok(/dark blue and white stripes/.test(kitSay.say));
assert.ok(!/Away kit/.test(kitSay.say));
var unset=V.parseIntent('what kit are we wearing tomorrow',{role:'parent',today:'2026-11-06',fixtures:[{date:'2026-11-07',opp:'Atherton Town Eagles',ha:'A',kit:''}]});
assert.equal(unset.intent,'kit');
assert.ok(/not been chosen/.test(unset.say));
assert.ok(!/Away kit/.test(unset.say));
var follow=V.parseIntent('what kit is it',{role:'parent',today:'2026-11-06',fixtures:[],memory:{fixture:kitCtx.fixtures[0]}});
assert.equal(follow.intent,'kit');
assert.ok(/Atherton Town Eagles/.test(follow.say));
assert.equal(V.parseIntent('what kit is it tomorrow',kitCtx).intent,V.parseIntent('what kit is it tomorrow',kitCtx).intent);
assert.equal(V.parseIntent('reply we are running late',ctx).intent,'draft');
assert.equal(V.parseIntent('reply we are running late',ctx).text,'we are running late');
assert.equal(V.parseIntent('reply we are running late',ctx).needConfirm,true);
assert.equal(V.parseIntent('send me a clip of shooting',Object.assign({library:[
 {title:'Shooting drill',url:'https://example.test/shoot',tags:'finishing shooting',src:'X'},
 {title:'Coaches Voice finishing PDF',url:'https://example.test/cv',tags:'finishing',src:'coachesvoice',private:true,coachOnly:true}
]},ctx)).intent,'clip');
var clip=V.parseIntent('send me a clip of shooting',Object.assign({library:[
 {title:'Shooting drill',url:'https://example.test/shoot',tags:'finishing shooting',src:'X'},
 {title:'Coaches Voice finishing PDF',url:'https://example.test/cv',tags:'finishing',src:'coachesvoice',private:true}
]},ctx));
assert.equal(clip.clip.url,'https://example.test/shoot');
assert.equal(V.parseIntent('open the emergency head injury page',ctx).intent,'blocked');
assert.equal(V.parseIntent('show me the niggle list',ctx).intent,'blocked');
var coach=Object.assign({},ctx,{role:'coach'});
assert.equal(V.parseIntent('open the emergency head injury page',coach).intent,'open');
assert.equal(V.parseIntent('open the emergency head injury page',coach).page,'conc');
assert.equal(V.parseIntent('what are we doing at training tonight',ctx).intent,'training');
assert.ok(/Pressing/.test(V.parseIntent('training tonight',ctx).say));
assert.equal(V.isCoachOnlyItem({title:'FA squad list PDF',src:'fa',url:'x'}),true);
assert.equal(V.isCoachOnlyItem({title:'Finishing session',url:'https://learn.englandfootball.com/x',src:'England Football Learning'}),false);
assert.ok(V.fuzzyScore('open welfare','welfare')>=0.9);
// on-device recognition refuses a recogniser that will not stay local
var cloud=0;
function CloudSR(){
 Object.defineProperty(this,'processLocally',{get:function(){return false;},set:function(){}});
 this.start=function(){cloud++;};
}
sandbox.SpeechRecognition=CloudSR;
V.listenOnce(function(){});
assert.equal(cloud,0,'cloud recognition must not start');
assert(!/\u2014/.test(code),'no em dashes');
for(const f of ['family.html','parents.html','coach/index.html'])assert(fs.readFileSync(path.join(R,f),'utf8').includes('voice.js'),f);
console.log('voice ok');
