/* Training 11/11 (Wed 11 Nov 2026), Wigan Junior Latics U15 Blues, 3-5-2.
   One block per part. To swap a part for one of Tim's Sport Session Planner picks, replace only
   that block (keep id, when, coach) and run: node tools/anim/s1111/build.js
   Positions are metres: x across (minus is the left as you look up from our goal), z up the pitch
   from our goal line (0) to halfway (54). Spoken text says Deeno; on screen it says Deano. */
var BLUE=0x3b82f6, RED=0xef4444, AMBER=0xffb81c, GREEN=0x22c55e, ORANGE=0xf97316, YELLOW=0xfacc15;
function mirror(segs, swap){ return segs.map(function(s){ var p={}; for(var k in s.pos){ p[swap[k]||k]=[-s.pos[k][0], s.pos[k][1]]; } return {t:s.t,pos:p}; }); }
var SESSION_PARTS = [];

/* ===================== SPEC: warmup (DRAFT, swap for Tim's SSP warm up pick) ===================== */
SESSION_PARTS.push({
  id:'warmup', status:'draft', when:'0 to 8', chip:'Warm up', name:'Warm up: pass, follow, open up',
  coach:'Tim and Deano', area:'15m square, 4 cones', numbers:'Groups of 8, two at each cone',
  cam:{tx:0, tz:30, zoom:0.5, zoomWide:0.9},
  box:[-7.5,22.5,7.5,37.5],
  props:{cones:[[-7.5,22.5],[7.5,22.5],[7.5,37.5],[-7.5,37.5]]},
  actors:[['W1',BLUE,'1'],['W2',BLUE,'2'],['W3',BLUE,'3'],['W4',BLUE,'4'],['W5',BLUE,'5'],['W6',BLUE,'6'],['W7',BLUE,'7'],['W8',BLUE,'8'],['coach',AMBER,'COACH']],
  legend:[['#3b82f6','Blues'],['#ffb81c','Coach']],
  base:{W1:[-7.5,22.5],W2:[-9.2,20.8],W3:[7.5,22.5],W4:[9.2,20.8],W5:[7.5,37.5],W6:[9.2,39.2],W7:[-7.5,37.5],W8:[-9.2,39.2],coach:[-14,30],ball:[-6.8,23.2]},
  roles:[{id:'ON',label:'On the cone',ids:['W1','W3','W5','W7']},{id:'Q',label:'In the queue',ids:['W2','W4','W6','W8']}],
  setup:['15 metre square, a cone on each corner, two players on each cone.','Two balls per square once they have it.','Six minutes passing, then two minutes of moves across the square.'],
  points:['Pass and follow your pass.','Back foot to the ball, open up, play it on the side away from where it came.','Talk: say the name of who you are passing to.'],
  harder:['Harder: two touch, then one touch, or add the second ball.','Easier: stop it, then pass.'],
  steps:[
    {chip:'Set up', title:'The square', segs:[],
     text:"Warm up. A fifteen metre square with a cone on each corner and two of you on every cone. Pass and follow your pass. Get the legs going and the touch sharp before the rondo.",
     roles:{ON:"You start on the cone. Ball arrives, open up and move it on.", Q:"You wait behind. When your mate goes, step up onto the cone."}},
    {chip:'Pass and follow', title:'Pass and follow', segs:[
      {t:1.0,pos:{ball:[6.8,23.2],W1:[-2,22.5]}},
      {t:0.9,pos:{W1:[9.2,20.8],W4:[9.6,19.4],W3:[7.2,22.9]}},
      {t:1.0,pos:{ball:[7.0,36.8],W3:[7.5,30]}},
      {t:0.9,pos:{W3:[9.2,39.2],W6:[9.8,40.6],W4:[7.5,22.5]}}],
     text:"One passes along the bottom to three and follows his pass to the back of that queue. Three opens up, plays it up the side to five and follows. Pass, follow, next man steps up.",
     roles:{ON:"Receive, open up, pass it on, then follow it to the next cone.", Q:"Step onto the cone the second it is free. Be ready for the next ball."}},
    {chip:'Open up', title:'Receive on the half turn', from:1, segs:[
      {t:0.6,pos:{W5:[7.3,37.3],W2:[-7.5,22.5]}},
      {t:1.0,pos:{ball:[-6.8,37.0],W5:[0,37.5]}},
      {t:0.5,pos:{W7:[-7.2,36.9]}},
      {t:1.0,pos:{ball:[-7.0,23.2],W5:[-9.2,39.2],W7:[-7.5,30]}}],
     text:"Now the key bit. Back foot to the ball, body open, so one touch takes it round the corner and you are already facing the next pass. Seven takes it across his body and plays it down to two.",
     roles:{ON:"Open your hips before it arrives. First touch round the corner, second touch pass.", Q:"Watch the man on the cone. You are next, so be on your toes."}},
    {chip:'Moves', title:'Two minutes of moves', segs:[
      {t:2.6,pos:{W1:[7.5,37.5],W3:[-7.5,37.5],W5:[-7.5,22.5],W7:[7.5,22.5],W2:[9.2,39.2],W4:[-9.2,39.2],W6:[-9.2,20.8],W8:[9.2,20.8],ball:[-14,31]}},
      {t:2.6,pos:{W1:[-7.5,22.5],W3:[7.5,22.5],W5:[7.5,37.5],W7:[-7.5,37.5],W2:[-9.2,20.8],W4:[9.2,20.8],W6:[9.2,39.2],W8:[-9.2,39.2]}}],
     text:"Last two minutes, no ball. Go across the square to the far cone and back. High knees, side steps, open the hips, then two short sprints. Then straight into the rondo.",
     roles:{ON:"Cross to the far cone and back. Do every move properly, not half a job.", Q:"Same as the cone man. Follow him across and back."}}
  ]
});

/* ===================== SPEC: rondo (side on rondo, from the 11 Nov plan) ===================== */
SESSION_PARTS.push({
  id:'rondo', status:'kept', when:'8 to 16', chip:'Rondo', name:'Side on rondo 5v2',
  coach:'Tim and Deano', area:'14m square', numbers:'5 v 2, two rondos if 14 or more',
  cam:{tx:0, tz:31, zoom:0.48, zoomWide:0.85},
  box:[-7,24,7,38],
  props:{cones:[[-7,24],[7,24],[7,38],[-7,38]]},
  actors:[['B4',BLUE,'4'],['B5',BLUE,'5'],['B6',BLUE,'6'],['B8',BLUE,'8'],['B10',BLUE,'10'],['R1',RED,'R'],['R2',RED,'R']],
  legend:[['#3b82f6','Blues round the outside'],['#ef4444','Reds in the middle']],
  base:{B4:[0,24],B5:[-7,28.5],B6:[7,28.5],B8:[-5.5,38],B10:[5.5,38],R1:[-1.5,32],R2:[1.8,29],ball:[0.5,24.7]},
  roles:[{id:'OUT',label:'Blues outside',ids:['B4','B5','B6','B8','B10']},{id:'MID',label:'Reds in the middle',ids:['R1','R2']}],
  setup:['14 metre square. Five blues round the outside, two reds in the middle.','Two touches. Swap the reds every 60 seconds.','A pass that splits the two reds is a point.'],
  points:['Open your body. Back foot to the ball.','Look before it arrives. Two looks.','Pass through the middle when it is on.'],
  harder:['Harder: one touch for a split pass, or a 12 metre square.','Easier: three touches, or one red.'],
  steps:[
    {chip:'The shape', title:'The rondo', segs:[],
     text:"Five round the outside, two reds in the middle, fourteen metre square. Two touches. Stand side on so you can see the whole square, not square on to the ball.",
     roles:{OUT:"Stand side on, half turned, so you can see the ball and the next pass.", MID:"Work as a pair. One presses the ball, the other cuts out the pass through the middle."}},
    {chip:'Open and look', title:'Open and look', segs:[
      {t:1.0,pos:{ball:[-6.4,28.6],R1:[-3.5,30],R2:[-0.5,27]}},
      {t:0.4,pos:{B5:[-6.8,28.9]}},
      {t:1.0,pos:{ball:[-5.2,37.4],R1:[-4,34],R2:[-2,30.5]}}],
     text:"Four plays to five. Five has looked before it arrives, takes it on the back foot and plays it on to eight. Look, open, play. The reds have to keep shifting.",
     roles:{OUT:"Two looks before it arrives. Take it on your back foot and move it on.", MID:"Shift across together. Do not both chase the same ball."}},
    {chip:'Split them', title:'Split pass: a point', from:1, segs:[
      {t:0.5,pos:{B8:[-5.3,37.6]}},
      {t:1.2,pos:{ball:[6.4,28.8],R1:[-2,33],R2:[0,31]}}],
     text:"Eight sees the gap between the two reds and plays it straight through to six. That's a split pass and that's a point. If the gap is there, play through it.",
     roles:{OUT:"If the gap between the reds is on, play through it. That is the pass we want.", MID:"Stay close together so the split pass is never on."}},
    {chip:'Win it, swap', title:'Win it and swap', from:2, segs:[
      {t:1.0,pos:{ball:[4.2,33.2],R2:[4,33]}},
      {t:1.4,pos:{R2:[7,28.5],B6:[2,31],ball:[6.6,28.9]}}],
     text:"Six goes for the pass up to ten but the red reads it and wins it. Straight swap: the red who won it goes out, the blue who lost it goes in the middle. No moaning, just swap and go.",
     roles:{OUT:"Lose it and you go straight in the middle. Sprint in, no sulking.", MID:"Win it and you are out. Read the pass and step in front of it."}}
  ]
});

/* ===================== SPEC: defence (Tim's 'Recover and Play Out', two wing backs, four rotating) ===================== */
(function(){
var SW={LCB:'RCB',RCB:'LCB',LWB:'RWB',RWB:'LWB'};
var S1=[{t:1.8,pos:{ball:[-17,26],A1:[-12,52],A2:[-4,54],LCB:[-15,36],CB:[-3,37],RCB:[12,38],CDM:[0,46],LWB:[-27,46],RWB:[28,48]}}];
var S2=[{t:2.6,pos:{LCB:[-16,25],CB:[-5,31],RCB:[8,32],CDM:[0,38],LWB:[-24,36],RWB:[14,38],A1:[-12,42],A2:[-4,47]}}];
var S3=[{t:1.1,pos:{ball:[-24,36.6]}},{t:2.2,pos:{LWB:[-22,52],ball:[-21.2,52.6],LCB:[-14,32],CB:[-5,38],RCB:[6,38],CDM:[-2,44],RWB:[27,50]}},{t:1.1,pos:{ball:[-10,56.6]}}];
var S4=[{t:1.0,pos:{ball:[-4.2,31.6],LCB:[-15,30]}},{t:1.0,pos:{ball:[12.8,32.6],CB:[-2,32],RCB:[12,32]}},{t:1.0,pos:{ball:[0.8,38.6],CDM:[1,39]}},{t:1.2,pos:{ball:[26.8,44.6],RWB:[26,44],LWB:[-14,44]}},{t:2.0,pos:{RWB:[24,54],ball:[24.8,54.6],LWB:[-8,50]}},{t:1.0,pos:{ball:[10,56.6]}}];
var S5a=mirror(S1,SW), S5b=mirror(S2,SW), S5c=mirror(S3,SW);
S5b[0].pos.A1=[12,33]; S5b[0].pos.A2=[3,38]; S5c[0].pos.A1=[10,40]; S5c[0].pos.A2=[4,44];
var S5=S5a.concat(S5b,S5c);
var S7=[{t:1.6,pos:{LWB:[-33,47],RWB:[33,47]}},{t:0.8,pos:{LWB:[-33.5,47.2],RWB:[33.5,47.2]}},{t:1.6,pos:{LWB:[-28,50],RWB:[28,50]}}];
SESSION_PARTS.push({
  id:'defence', status:'tim', when:'16 to 46', chip:'Defence (Tim)', name:'Recover and play out (Tim)',
  coach:'Tim', area:'Our half, goal to halfway', numbers:'Back three, Calum and two wing backs v two attackers',
  cam:{tx:0, tz:41, zoom:1},
  props:{goals:[[7.32,2.44,2,0xffffff,0,0,0],[3.2,1.3,1,AMBER,10,56,Math.PI+0.35],[3.2,1.3,1,AMBER,-10,56,Math.PI-0.35]],
    mannequins:[[0,44]], cones:[[-28,50],[28,50],[-24,36],[24,36]], poles:[[-33,54],[33,54]]},
  actors:[['LCB',BLUE,'LCB'],['CB',BLUE,'CB'],['RCB',BLUE,'RCB'],['CDM',BLUE,'CDM'],['LWB',BLUE,'LWB'],['RWB',BLUE,'RWB'],['A1',RED,'ATT'],['A2',RED,'ATT'],['coach',AMBER,'COACH']],
  line:['LWB','LCB','CB','RCB','RWB','CDM','CB'],
  legend:[['#3b82f6','Our unit (352)'],['#ef4444','Attackers'],['#ffb81c','Coach']],
  base:{LCB:[-14,40],CB:[0,40],RCB:[14,40],CDM:[0,50],LWB:[-28,50],RWB:[28,50],A1:[-4,60],A2:[4,60],coach:[0,63.5],ball:[0,62]},
  roles:[{id:'LCB',label:'Left CB',ids:['LCB']},{id:'CB',label:'Middle CB',ids:['CB']},{id:'RCB',label:'Right CB',ids:['RCB']},{id:'CDM',label:'Calum (CDM)',ids:['CDM']},{id:'LWB',label:'Left wing back',ids:['LWB']},{id:'RWB',label:'Right wing back',ids:['RWB']},{id:'ATT',label:'Attackers',ids:['A1','A2']}],
  setup:['Our half, full size goal, two mini goals either side of the centre circle as our strikers, a mannequin in the middle.','Five centre backs: three in the line, two as attackers, rotate every round.','Calum stays in the unit. Two of our four wing backs on at a time.','Coach plays it in behind from halfway.'],
  points:['Ball side goes, middle covers, far side tucks, Calum screens.','Nobody stands and watches when it goes in behind.','Win it, touch away from pressure, play out wide or through Calum.','Final pass into a mini goal, like a pass into a striker.'],
  variants:['Four centre backs: three in the line, one attacker plus the coach as the second.','Six centre backs: rotate two in and out every round.','Wing back swap: Ryan and Harry start here, swap sides halfway through their spell, then all four wing backs swap pitches at the halfway whistle.'],
  harder:['Harder: attackers live from the start, or a third attacker.','Easier: attackers at half pace and no tackling.'],
  steps:[
    {chip:'The shape', title:'The shape', segs:[],
     text:"Here's our unit. Three centre backs, Calum just in front of them, and a wing back each side. We start pushed out towards halfway. The two mini goals are our strikers, so that's where the final pass goes. The mannequin is their man in the middle. Learn the picture first, then learn your own bit.",
     roles:{LCB:"Left side of the three. Stay wide of the middle man and keep the line level.",CB:"Middle of the three. You set the line and you set the voice.",RCB:"Right side of the three. Keep the line level and keep an eye on the far side.",CDM:"Calum: sit just in front of the three. You are the screen and the first pass out.",LWB:"Wide and high on the left. You are our width.",RWB:"Wide and high on the right. You are our width.",ATT:"You are their strikers for this one. Stay up by halfway until the coach plays it."}},
    {chip:'Ball in behind', title:'Ball in behind', segs:S1,
     text:"Coach plays it in behind, down the left. The second it goes, we go. Nobody stands and watches. The two attackers chase it, at half pace for now. Notice everyone starts dropping together, as one unit.",
     roles:{LCB:"The ball is on your side. That is your trigger. Go, no waiting.",CB:"It's not yours, but you are straight behind it, ready to cover.",RCB:"Far side. Start tucking in the second it goes.",CDM:"Drop with the ball. Do not stay high and get skipped.",LWB:"Start dropping goalside, ready to be the way out.",RWB:"Far side. Start tucking in towards the middle.",ATT:"Chase the ball at half pace. Make the defenders feel you, no tackling."}},
    {chip:'Recover as a unit', title:'Recover as a unit', from:1, segs:S2,
     text:"Ball side centre back goes to the ball. The middle centre back covers behind him. The far centre back tucks in and keeps an eye on the far post. Calum drops in to screen the middle. The left wing back drops to be the way out, the right wing back tucks in. We finish goalside and compact. Ball side goes, middle covers, far side tucks, Calum screens.",
     roles:{LCB:"You go to the ball. Get goalside and get your body between the ball and the goal.",CB:"Cover behind and inside your left centre back. Talk: 'Cover, I'm here.'",RCB:"Tuck in and hold the far side. Eyes on the far post and the far striker.",CDM:"Drop in front of the line and screen the middle. Show for the pass.",LWB:"Drop back and out wide. Be an easy pass for the way out.",RWB:"Tuck in to make the back five. Stay compact.",ATT:"Keep chasing at half pace. No tackling, just pressure."}},
    {chip:'Win it: play out wide', title:'Pattern A: out wide', from:2, segs:S3,
     text:"Left centre back wins it, takes a touch away from pressure and plays it to the left wing back. The wing back drives past halfway with his head up. As the ball goes out, the right wing back breaks high. The final pass goes into a mini goal, like a pass into a striker.",
     roles:{LCB:"Win it, touch away from pressure, play it to the wing back. Then move up to support.",CB:"Step up behind the ball so the unit stays connected.",RCB:"Squeeze up with the line. Do not get left behind.",CDM:"Move up to be the next option inside.",LWB:"Receive, drive over halfway with your head up. Final pass into the mini goal.",RWB:"Break high and wide as the ball goes out. You are the switch if it's needed.",ATT:"Drop off and let them play. Watch where the gaps are."}},
    {chip:'Win it: through the middle', title:'Pattern B: through the middle', from:2, segs:S4,
     text:"Same recovery, different way out. The ball goes across the back three to the far centre back. Calum shows between the lines, receives on the half turn, then it goes wide to the right wing back. He drives and plays into the other mini goal. The mannequin blocks the direct route, so we have to play around it.",
     roles:{LCB:"Play it across to the middle, then spread wide to keep the angle.",CB:"Take it, open your body, and play it on to the far centre back.",RCB:"Receive across the back and get it up to Calum quickly.",CDM:"Show between the lines, check your shoulder, receive on the half turn and play it wide.",LWB:"Come inside to be the safe option if it goes wrong.",RWB:"Come to receive from Calum, then drive and play into the mini goal.",ATT:"Press the pass across but do not tackle. Make them move it quickly."}},
    {chip:'Attackers go live', title:'Attackers go live', segs:S5,
     text:"Now the attackers press for real. The ball goes down the right this time. Same jobs: ball side goes, middle covers, far side tucks, Calum screens. Win it, play out, and hit a mini goal for a point. If the attackers score in the big goal or win it back, the point is theirs.",
     roles:{LCB:"Far side this time. Tuck in and hold the line.",CB:"Cover the right centre back and keep talking.",RCB:"Ball side now. You go. Win it, then play out.",CDM:"Screen the middle. Do not get dragged out of position.",LWB:"Far side wing back: tuck in, then break high when it goes out.",RWB:"Ball side: drop as the outlet, then drive.",ATT:"Go for real. Win it back or score in the big goal."}},
    {chip:'Rotate the lads', title:'Rotate the lads', segs:S7,
     text:"Five centre backs, so three play in the line and two are the attackers. Rotate every round so everyone plays all three line roles and the attacker job. Calum stays in the unit. We have four wing backs and only two are on here at a time. Ryan and Harry start here and swap sides halfway through their spell. At the halfway whistle all four wing backs swap over: Ryan and Harry go to Deano for the attacking practice, and the other two come in here and do the same.",
     roles:{LCB:"Rotate every round. You will play all three line roles.",CB:"Rotate every round. You will play all three line roles.",RCB:"Rotate every round. You will play all three line roles.",CDM:"Calum: you stay in the unit every round. You are the glue.",LWB:"Two of our four wing backs are on here at a time. Swap sides with your partner halfway through your spell, then at the halfway whistle swap pitches with the other two.",RWB:"Two of our four wing backs are on here at a time. Swap sides with your partner halfway through your spell, then at the halfway whistle swap pitches with the other two.",ATT:"Attackers rotate in and out. Everyone gets a go at both jobs."}}
  ]
});
})();

/* ===================== SPEC: attack (DRAFT redesign, swap for Tim's SSP attacking pick) ===================== */
SESSION_PARTS.push({
  id:'attack', status:'draft', when:'16 to 46', chip:'Attack (Deano)', name:'Wing backs and three runners (Deano)',
  coach:'Deano', area:'Penalty box to 45m out, full width of the box plus wings', numbers:'5 v 2 plus keeper: two wing backs, two strikers and an 8 v two reds',
  cam:{tx:0, tz:22, zoom:0.82, flip:true},
  box:[-30,0,30,46],
  props:{goals:[[7.32,2.44,2,0xffffff,0,0,0],[3.2,1.3,1,AMBER,0,47,Math.PI]], cones:[[-30,46],[30,46],[-30,0.5],[30,0.5]]},
  actors:[['GK',GREEN,'GK'],['D1',RED,'RED'],['D2',RED,'RED'],['ST1',BLUE,'ST'],['ST2',BLUE,'ST'],['M8',BLUE,'8'],['LWB',BLUE,'LWB'],['RWB',BLUE,'RWB'],['coach',AMBER,'COACH']],
  legend:[['#3b82f6','Blues attacking'],['#ef4444','Reds defending'],['#22c55e','Keeper'],['#ffb81c','Coach']],
  base:{GK:[0,1.5],D1:[-5,15],D2:[5,15],ST1:[4,22],ST2:[-4,24],M8:[2,32],LWB:[24,30],RWB:[-24,30],coach:[0,44],ball:[0,43.2]},
  roles:[{id:'WB',label:'Wing backs',ids:['LWB','RWB']},{id:'ST',label:'Strikers',ids:['ST1','ST2']},{id:'M8',label:'The 8',ids:['M8']},{id:'RED',label:'Reds',ids:['D1','D2']},{id:'GK',label:'Keeper',ids:['GK']}],
  setup:['Big goal with our keeper. Mini goal 45 metres out for the reds to counter into.','Blues: two wing backs, two strikers and an 8. Reds: two defenders.','Coach serves into the 8 from the top. Ten seconds to score.'],
  points:['Wing backs high and wide. First look is down the line.','Cross early and low into the corridor between keeper and defenders.','Three runners every time: near post, far post, and the 8 late to the edge or the penalty spot.','Far wing back attacks the back post.','One striker shows, one spins.'],
  variants:['Twelve or fewer: 4 v 1 plus keeper, the 8 plays as a striker as well.','Fourteen: 5 v 2 plus keeper as drawn.','Sixteen: add a second 8 and a third red, so 6 v 3 plus keeper.','Odd number: the spare is a red, so it goes 5 v 3, or a second server next to the coach.','No keeper on this pitch: use two mini goals on the goal line and finish low.'],
  harder:['Harder: third red, or seven seconds to score.','Easier: reds at half pace, or the cross is unopposed.'],
  steps:[
    {chip:'The set up', title:'The set up', segs:[],
     text:"Deano's practice. Two wing backs high and wide, two strikers, and an 8 behind them. Two reds and our keeper defend the big goal. The coach serves into the 8 and we have ten seconds to score. If the reds win it, they counter into the mini goal at the top.",
     roles:{WB:"Start high and wide, nearly on the touchline. You are the width.",ST:"Start on the shoulders of the two reds. One of you will show, the other spins.",M8:"You get the first ball off the coach. Head up before it arrives.",RED:"Defend the box with the keeper. Win it and counter into the mini goal.",GK:"Organise the two reds. Talk to them the whole time."}},
    {chip:'Wide and early', title:'Pattern A: wide and early', segs:[
      {t:0.9,pos:{ball:[1.6,32.6]}},
      {t:1.1,pos:{ball:[23.4,30.4],ST1:[3,19],ST2:[-3,21]}},
      {t:2.0,pos:{LWB:[25,14],ball:[24.4,13.6],D1:[-2,10],D2:[6,10],ST1:[5,12],ST2:[-5,15],M8:[6,22],RWB:[-16,18]}},
      {t:1.0,pos:{ST1:[3.5,5.5],ST2:[-4,6],M8:[6,11.5],RWB:[-12,8]}},
      {t:0.7,pos:{ball:[3.5,6]}},
      {t:0.5,pos:{ball:[1.5,-0.8],GK:[2.2,1.2]}}],
     text:"Coach into the 8, and straight out to the left wing back. He drives down the line and crosses early and low. Three runners: one striker near post, one far post, and the 8 arrives late on the edge. The far wing back attacks the back post. Near post finish.",
     roles:{WB:"Ball side: drive down the line and cross early and low. Far side: get in at the back post.",ST:"One near post, one far post. Time your run so you arrive with the ball.",M8:"Play it wide, then arrive late on the edge for the cut back.",RED:"Drop and protect the six yard box. Defend the near post first.",GK:"Come for anything in the six yard box. Shout early."}},
    {chip:'Show and spin', title:'Pattern B: one shows, one spins', segs:[
      {t:0.9,pos:{ball:[1.6,32.6]}},
      {t:1.0,pos:{ST1:[3,28],D2:[4,22]}},
      {t:0.9,pos:{ball:[3,27.4]}},
      {t:0.8,pos:{ball:[1.8,31.4],ST2:[-6,21]}},
      {t:1.3,pos:{ball:[-6,10],ST2:[-6,10.6],D1:[-4,13]}},
      {t:0.6,pos:{ball:[-2,-0.8],GK:[-1.5,1.3]}}],
     text:"This time it goes through the middle. One striker shows short and drags his red with him. He sets it back to the 8. The other striker spins in behind into the gap, and the 8 slides it through. One shows, one spins. Finish across the keeper.",
     roles:{WB:"Hold your width. You stretch the reds so the gap opens in the middle.",ST:"Talk to each other. One shows short and sets it, the other spins in behind.",M8:"Set and go: take the lay off and slide it through first time if you can.",RED:"Do you follow the striker who drops, or hold? Talk to your partner.",GK:"Off your line when the ball goes through. Make yourself big."}},
    {chip:'Switch it', title:'Pattern C: switch to the free wing back', segs:[
      {t:1.1,pos:{ball:[23.4,30.4]}},
      {t:1.2,pos:{D1:[3,16],D2:[12,18],ST1:[8,20]}},
      {t:0.9,pos:{ball:[2.2,31.6]}},
      {t:1.4,pos:{ball:[-22.6,24.4],RWB:[-23,25]}},
      {t:1.8,pos:{RWB:[-17,8],ball:[-16.6,8.6],D1:[-4,8],D2:[2,9],ST2:[-3,7],ST1:[4,5.5],M8:[-3,15]}},
      {t:0.7,pos:{ball:[-3,14.6]}},
      {t:0.5,pos:{ball:[-1,-0.8],GK:[-0.8,1.2]}}],
     text:"If the reds shift across to the ball, the far wing back is free. Back to the 8, switch it, and the right wing back drives into the box. Strikers attack the posts, so he cuts it back to the 8 on the edge. Make them shift, then go the other way.",
     roles:{WB:"Far side wing back: you are the switch. Stay wide and call for it when the reds shift.",ST:"Keep the reds busy, then attack the posts so the cut back is on.",M8:"Take it back from the wing back and switch it quickly. Then get to the edge.",RED:"Shift together towards the ball, but someone has to watch the far wing back.",GK:"Move across with every pass. Set your feet for the cut back."}},
    {chip:'Go live', title:'Go live: ten seconds', segs:[
      {t:0.9,pos:{ball:[1.6,32.6]}},
      {t:1.1,pos:{ball:[23.4,30.4]}},
      {t:1.4,pos:{LWB:[24,20],ball:[23.4,19.6],D2:[18,20]}},
      {t:0.7,pos:{ball:[18,20.6]}},
      {t:1.8,pos:{D2:[6,40],ball:[6.4,40.6],M8:[5,37],LWB:[14,30],ST1:[6,30]}},
      {t:0.6,pos:{ball:[0.5,47.5]}}],
     text:"Now it is live. Blues get ten seconds from the coach's pass to score. Reds defend for real. Here the red wins it off the wing back and goes for the mini goal. The nearest two blues press straight away for five seconds. Rotate the reds every three minutes.",
     roles:{WB:"If you lose it, chase it straight away for five seconds.",ST:"Score inside ten seconds. If it breaks down, press the ball.",M8:"You are the first to press if we lose it. Stop the counter.",RED:"Defend for real. Win it and score in the mini goal for a point.",GK:"Live now. Save it, then play it out to a red for the counter."}},
    {chip:'Wing back swap', title:'Wing back swap and numbers', segs:[
      {t:1.6,pos:{LWB:[31,38],RWB:[-31,38]}},
      {t:0.8,pos:{LWB:[31.5,38.5],RWB:[-31.5,38.5]}},
      {t:1.6,pos:{LWB:[24,30],RWB:[-24,30]}}],
     text:"We have four wing backs and two are on here at a time. The other two start with Tim on the defending practice. Swap sides left and right halfway through your spell. At the halfway whistle all four wing backs swap pitches, so everyone gets a bit of both. With more players, add a second 8 and a third red. With fewer, play four against one.",
     roles:{WB:"Swap sides with your partner halfway through your spell, then swap pitches with the other two at the halfway whistle.",ST:"You stay on this pitch all the way through. Take turns as a red.",M8:"You stay on this pitch. Take your turn as a red too.",RED:"Reds rotate every three minutes from the strikers and the 8.",GK:"You stay here all session. You are the only keeper we have."}}
  ]
});

/* ===================== SPEC: game (DRAFT adaptable game, swap for Tim's SSP game pick) ===================== */
SESSION_PARTS.push({
  id:'game', status:'draft', when:'48 to 58', chip:'Game', name:'Unit v unit game, one keeper',
  coach:'Tim and Deano', area:'50m x 44m, big goal one end, two mini goals the other', numbers:'7 v 7 with one keeper, adapt on the night',
  cam:{tx:0, tz:26, zoom:0.95, zoomWide:0.85},
  box:[-22,0,22,50],
  props:{goals:[[7.32,2.44,2,0xffffff,0,0,0],[3.2,1.3,1,AMBER,12,50,Math.PI],[3.2,1.3,1,AMBER,-12,50,Math.PI]], cones:[[-22,0.5],[22,0.5],[-22,50],[22,50],[-22,25],[22,25]]},
  actors:[['GK',GREEN,'GK'],['LCB',BLUE,'LCB'],['CB',BLUE,'CB'],['RCB',BLUE,'RCB'],['CDM',BLUE,'CDM'],['LWB',BLUE,'LWB'],['RWB',BLUE,'RWB'],
          ['S1',ORANGE,'ST'],['S2',ORANGE,'ST'],['A8',ORANGE,'8'],['A10',ORANGE,'10'],['A6',ORANGE,'6'],['AL',ORANGE,'WB'],['AR',ORANGE,'WB'],['F',YELLOW,'FLOAT']],
  line:['LWB','LCB','CB','RCB','RWB','CDM','CB'],
  legend:[['#3b82f6','Back unit'],['#f97316','Attack unit (bibs)'],['#22c55e','Keeper'],['#facc15','Floater if odd numbers']],
  base:{GK:[0,1.5],LCB:[-10,12],CB:[0,11],RCB:[10,12],CDM:[0,20],LWB:[-18,24],RWB:[18,24],S1:[-4,16],S2:[5,16],A8:[8,28],A10:[-8,28],A6:[0,36],AL:[19,32],AR:[-19,32],F:[-24.5,30],ball:[0.5,35.3]},
  roles:[{id:'BACK',label:'Back three',ids:['LCB','CB','RCB']},{id:'CDM',label:'Calum (CDM)',ids:['CDM']},{id:'WB',label:'Back unit wing backs',ids:['LWB','RWB']},{id:'GK',label:'Keeper',ids:['GK']},{id:'ATT',label:'Attack unit',ids:['S1','S2','A8','A10','A6','AL','AR']},{id:'F',label:'Floater',ids:['F']}],
  setup:['50m long, 44m wide. Big goal with our only keeper at one end, two mini goals at the other.','Back unit: keeper, back three, Calum and two wing backs. They defend the big goal and score in the mini goals.','Attack unit in bibs: two strikers, three mids and two wing backs. They attack the big goal.','Two halves of five minutes. Restart from the attack unit at the top.'],
  points:['Back unit: ball side goes, middle covers, far side tucks, Calum screens. Win it and play out.','Attack unit: wide and early, three runners, one shows and one spins.','Lose it: nearest two press for five seconds.'],
  variants:['Twelve (6 v 6): back unit drops a centre back to a back two, attack unit drops the 6.','Thirteen: 6 v 6 plus a floater in a yellow bib who plays for whoever has the ball.','Fourteen (7 v 7): as drawn.','Fifteen: 7 v 7 plus the floater.','Sixteen (8 v 8): back unit adds an 8 next to Calum, attack unit adds a third striker or a 10.','Ten or eleven: 5 v 5, no wing backs on the back unit, mini goals 30 metres out.','No keeper: shrink the big goal to two cones three metres apart, goals must be below knee height.','Coach can play as a floater too if numbers are tight.'],
  harder:['Harder: attack unit two touch, or the back unit must make three passes before a mini goal.','Easier: free touches, or the back unit can also score by dribbling over the top line.'],
  steps:[
    {chip:'The game', title:'Unit v unit, one keeper', segs:[],
     text:"The game brings both practices together. The back unit is our keeper, the back three, Calum and two wing backs. They defend the big goal and score in either mini goal. The attack unit in bibs is two strikers, three mids and two wing backs, and they attack the big goal. Seven against seven with our one keeper.",
     roles:{BACK:"Same jobs as Tim's practice. Ball side goes, middle covers, far side tucks.",CDM:"Calum: screen the middle, then be the first pass out.",WB:"You are the way out when we win it. Drop, then drive.",GK:"You are the only keeper. Talk to your back three the whole time.",ATT:"Same ideas as Deano's practice. Wide and early, three runners.",F:"Only on if we have odd numbers. You play for whoever has the ball."}},
    {chip:'Attack unit goes', title:'Attack unit goes', segs:[
      {t:1.0,pos:{ball:[7.6,28.4]}},
      {t:1.1,pos:{ball:[18.6,31.4],RWB:[17,27]}},
      {t:1.6,pos:{AL:[19,18],ball:[18.6,17.6],RWB:[17.5,17],RCB:[11,11],CB:[4,9],LCB:[-4,9],LWB:[-12,12],CDM:[5,15],S1:[-2,9],S2:[5,9],A8:[10,16]}},
      {t:0.8,pos:{ball:[6,9.5],CB:[5.6,9.2]}}],
     text:"The attack unit go wide early to their wing back. The back unit do what they learned with Tim. Our wing back goes to the ball, the right centre back covers, the middle and left centre backs tuck in and Calum screens. The cross comes in and the middle centre back cuts it out.",
     roles:{BACK:"Read the cross. Middle centre back attacks the ball, the other two cover the posts.",CDM:"Drop in and screen the edge of the box for the cut back.",WB:"Ball side goes to the ball. Far side tucks in to make a back five.",GK:"Talk early. Keeper's ball or away, nothing in between.",ATT:"Wide and early, then three runners into the box.",F:"Stay outside until we have odd numbers."}},
    {chip:'Win it, play out', title:'Win it and play out', from:1, segs:[
      {t:0.9,pos:{ball:[-3.6,9.6],CB:[3,10]}},
      {t:1.0,pos:{LWB:[-18,22],LCB:[-8,12]}},
      {t:1.1,pos:{ball:[-17.6,22.4],A10:[-12,26]}},
      {t:1.8,pos:{LWB:[-14,40],ball:[-13.6,40.6],A10:[-12,34],AR:[-16,36],CDM:[-4,26]}},
      {t:0.7,pos:{ball:[-12,50.6]}}],
     text:"Win it and go. Across to the left centre back, out to the left wing back, he drives and scores in the mini goal. That's the play out from Tim's practice in a real game. The attack unit have five seconds to win it back before it gets out.",
     roles:{BACK:"Win it, touch away from pressure, and find the wing back early.",CDM:"Show for the pass inside if the wing back is blocked.",WB:"Drop to receive, then drive and finish in the mini goal.",GK:"If you catch it, roll it out to a wing back quickly.",ATT:"Lose it: nearest two press for five seconds.",F:"If you are on, show for the back unit when they win it."}},
    {chip:'Win it back', title:'Scoring and the five second press', segs:[
      {t:0.1,pos:{ball:[-9.4,12.6]}},
      {t:1.0,pos:{ball:[-17.6,24.4],A10:[-14,26]}},
      {t:0.8,pos:{A10:[-17,25.2],ball:[-16.8,25.6]}},
      {t:1.1,pos:{ball:[-4,15],S1:[-4,15.5]}},
      {t:0.6,pos:{ball:[-1.5,-0.8],GK:[-1,1.3]}}],
     text:"Scoring. A goal in the big goal is one point, or two if the attack unit win it back and score inside ten seconds. A mini goal is one point for the back unit. Here the 10 presses the pass out, wins it, and the striker finishes. Swap the jobs at half time if you want both units to do both.",
     roles:{BACK:"When it goes out to the wing back, get spread out but be ready if we lose it.",CDM:"If we lose it, get back in front of the three straight away.",WB:"Check your shoulder before it arrives so you are not caught.",GK:"Set yourself early when they win it back.",ATT:"Press the pass out. Win it inside five seconds and it's a quick chance for two points.",F:"Play for whoever has it. Two touches."}},
    {chip:'Numbers', title:'Odd numbers: the floater', segs:[
      {t:1.5,pos:{F:[-3,28]}},
      {t:0.9,pos:{ball:[-2.6,28.4]}},
      {t:0.9,pos:{ball:[7.6,28.4]}}],
     text:"Numbers on the night. Fourteen is seven against seven as drawn. Thirteen or fifteen, add a floater in a yellow bib who plays for whoever has the ball. Sixteen, add an 8 to the back unit and a third striker to the attack. Twelve, drop a centre back and the 6. No keeper, shrink the big goal to two cones.",
     roles:{BACK:"Fewer players: play a back two with Calum.",CDM:"Same job whatever the numbers.",WB:"Fewer players: wing backs stay, they are our way out.",GK:"If you are missing, the big goal becomes two cones.",ATT:"More players: add a striker. Fewer: drop the 6.",F:"Play for whoever has the ball. Two touches, keep it moving."}}
  ]
});

/* ===================== SPEC: cooldown ===================== */
SESSION_PARTS.push({
  id:'cooldown', status:'kept', when:'58 to 60', chip:'Cool down', name:'Cool down and three questions',
  coach:'Tim and Deano', area:'Centre circle', numbers:'Everyone',
  cam:{tx:0, tz:30, zoom:0.55, zoomWide:0.9},
  props:{},
  actors:[['P1',BLUE,'1'],['P2',BLUE,'2'],['P3',BLUE,'3'],['P4',BLUE,'4'],['P5',BLUE,'5'],['P6',BLUE,'6'],['coach',AMBER,'COACH']],
  balls:[],
  legend:[['#3b82f6','Players'],['#ffb81c','Coach']],
  base:{P1:[-8,22],P2:[-4,22],P3:[0,22],P4:[4,22],P5:[8,22],P6:[12,22],coach:[0,38]},
  roles:[{id:'ALL',label:'Everyone',ids:['P1','P2','P3','P4','P5','P6']}],
  setup:['Light jog, then stretch with the stretching card.','Three questions, one line each from Tim and Deano for Reflect in Touchline later.'],
  points:['When we win it at the back, where does the first pass go?','Wing backs: when do you drive and when do you tuck in?','Who are the three runners in the box?'],
  steps:[
    {chip:'Jog and stretch', title:'Jog and stretch', segs:[
      {t:3.0,pos:{P1:[-10,36],P2:[-6,38],P3:[-2,39],P4:[2,39],P5:[6,38],P6:[10,36]}},
      {t:3.0,pos:{P1:[-8,30],P2:[-5,33],P3:[-1.7,34.5],P4:[1.7,34.5],P5:[5,33],P6:[8,30]}}],
     text:"Cool down. A light jog, nice and easy, then stretch with the stretching card. Get your breath back.",
     roles:{ALL:"Easy jog, then hold each stretch for twenty seconds."}},
    {chip:'Three questions', title:'Three questions', from:0, segs:[],
     text:"Three questions. When we win it at the back, where does the first pass go? Wing backs, when do you drive and when do you tuck in? And who are the three runners in the box? Well done tonight lads.",
     roles:{ALL:"Have an answer ready for each question. Short and honest."}}
  ]
});
if(typeof module !== 'undefined') module.exports = SESSION_PARTS;
