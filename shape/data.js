/* Touchline 352 shape: data. Pitch is 68 wide (x, 0 = our left) by 105 long (y, 0 = our goal, we attack up).
   Order of our eleven: GK, LCB, CB, RCB, LWB, RWB, CMC (left mid, creator), CMH (holding), CMB (right mid, box to box), ST1 (pin and link), ST2 (runner). */
var SH = {};
SH.ORDER = ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'RWB', 'CMC', 'CMH', 'CMB', 'ST1', 'ST2'];
SH.ROLES = {
  GK: { n: 'Goalkeeper', w: 'build' }, LCB: { n: 'Left centre back', w: 'build' }, CB: { n: 'Middle centre back', w: 'build' }, RCB: { n: 'Right centre back', w: 'build' },
  LWB: { n: 'Left wing back', w: 'final' }, RWB: { n: 'Right wing back', w: 'final' },
  CMC: { n: 'Left midfielder, the creator', w: 'final' }, CMH: { n: 'Holding midfielder', w: 'build' }, CMB: { n: 'Right midfielder, box to box', w: 'final' },
  ST1: { n: 'Striker, pin and link', w: 'final' }, ST2: { n: 'Striker, the runner', w: 'final' }
};
/* Which of the app positions maps to which 352 roles (first is the main one). */
SH.POSMAP = { GK: ['GK'], CB: ['CB', 'LCB', 'RCB'], LB: ['LWB', 'LCB'], RB: ['RWB', 'RCB'], LWB: ['LWB'], RWB: ['RWB'], CDM: ['CMH'], CM: ['CMB', 'CMH', 'CMC'], CAM: ['CMC', 'CMB'], LM: ['LWB', 'CMC'], RM: ['RWB', 'CMB'], LW: ['LWB', 'ST2'], RW: ['RWB', 'ST2'], ST: ['ST1', 'ST2'] };

/* Squad voice overs, one per phase. */
SH.PHASES = [
  { id: 'shape', n: 'The shape', a: 's_shape', t: 'This is our three five two. Three centre backs, two wing backs, three in midfield and two strikers. Picture three lines, with the keeper behind them. When we have the ball, the wing backs are our width, high and wide. When we have not, they drop in and we are a back five. One shape, two jobs. Learn the picture first, then learn your own bit of it.' },
  { id: 'build', n: 'Building from the back', a: 's_build', t: 'Building from the back. The keeper is the spare man, so we always have an extra player. The three centre backs spread out, the holding midfielder drops into the gap, and the wing backs stay high and wide. First thought forward. Second thought across. Third thought back, to keep it. Receive on the half turn and face forward. Break the line with a pass when they press, or a carry when they do not.' },
  { id: 'final', n: 'Final third', a: 's_final', t: 'In the final third, the wing backs give us the width and the midfield runs arrive late. Ball wide, wing back looks up, and the delivery is early. One striker goes near post, one goes far post. A midfielder arrives at the edge of the box for the cut back, and the other wing back comes in at the back post. The back three and the holding midfielder stay back, so one lost ball does not hurt us.' },
  { id: 'defend', n: 'Defending: mid block', a: 's_defend', t: 'Without the ball, we are a five three two in a mid block. The wing backs drop onto the line with the three centre backs. The midfield three stays tight in front of them, and the two strikers screen the middle. The whole shape slides across towards the ball, and the far wing back tucks in. We do not dive in. We delay, show them one way, and win it on the second contact.' },
  { id: 'press', n: 'Pressing triggers', a: 's_press', t: 'We press on triggers. A pass back. A poor first touch. A player receiving with his back to our goal. Or the ball going wide. When the trigger goes, the nearest player presses, and everybody else steps up and across together. Nobody presses on their own. And if the trigger does not go, we drop back into the block and wait for the next one.' },
  { id: 'transA', n: 'We win it: three seconds', a: 's_transA', t: 'We win it. You have three seconds. The player who wins it secures it first. The nearest player supports beyond him, never behind. The wing backs push high straight away, and the strikers show, one short and one in behind. Get out of the trapped area before you try anything clever.' },
  { id: 'transD', n: 'We lose it: five seconds', a: 's_transD', t: 'We lose it. Five seconds. The two or three players nearest the ball squeeze it straight away, so they cannot play forward. Everybody else gets back behind the ball and goal side. The wing backs sprint back to make the five. Nobody stands about complaining. Win it back, or get back.' }
];

/* Role voice overs: five paragraphs. Order: with the ball, without it, when we win it, when we lose it, your patch. */
SH.TEXT = {
  GK: ['Goalkeeper. You are the spare man. When we have the ball, stay on your toes, show for the pass, and play the first one forward or wide. Never a lazy one across your own box.', 'When we have not, you are the sweeper behind the back three, so read the ball over the top and come out early.', 'When we win it, look up fast and find the free player.', 'When we lose it, get set and talk. Tell the back three where the space is.', 'Your patch is your box and a bit outside it. Keep out of the middle of the pitch, unless it is a clear sweep.'],
  LCB: ['Left centre back. You are the left side of the back three. When we have the ball, spread wide to make the pitch big, and carry it forward when nobody presses you. Break the line with a pass into midfield.', 'When we have not, defend the left channel, step out to the ball when the wing back is beaten, and the middle centre back covers you. Never both of you step together.', 'When we win it, show a clear option and play forward.', 'When we lose it, drop in, get goal side and talk.', 'Your patch is the left channel. Do not wander across to the right, and do not go beyond halfway unless you are carrying it.'],
  CB: ['Middle centre back. You are the organiser of the back three. When we have the ball, be the free man in the middle and play the passes that break the first line.', 'When we have not, win the first contact, and cover whichever side centre back steps out. Talk all the time. Push the line up together, drop together.', 'When we win it, spread and show.', 'When we lose it, you are the last line, so get goal side and stay calm.', 'Your patch is the middle. Keep out of the wide areas. Those belong to the wing backs and the outside centre backs.'],
  RCB: ['Right centre back. You are the right side of the back three. When we have the ball, spread wide to make the pitch big, and carry it forward when nobody presses you. Break the line with a pass into midfield.', 'When we have not, defend the right channel, step out to the ball when the wing back is beaten, and the middle centre back covers you. Never both of you step together.', 'When we win it, show a clear option and play forward.', 'When we lose it, drop in, get goal side and talk.', 'Your patch is the right channel. Do not wander across to the left, and do not go beyond halfway unless you are carrying it.'],
  LWB: ['Left wing back. You are our width on the left, and the biggest job in the shape. When we have the ball, stay high and wide on the touchline. Wait until the ball is ready to come, then attack the space behind. Deliver early.', 'When we have not, drop onto the line to make the back five, show the winger outside, and do not dive in.', 'When we win it, get high straight away.', 'When we lose it, sprint back.', 'Your patch is the whole left touchline. Keep out of the middle. That is the midfielders\' space.'],
  RWB: ['Right wing back. You are our width on the right, and the biggest job in the shape. When we have the ball, stay high and wide on the touchline. Wait until the ball is ready to come, then attack the space behind. Deliver early.', 'When we have not, drop onto the line to make the back five, show the winger outside, and do not dive in.', 'When we win it, get high straight away.', 'When we lose it, sprint back.', 'Your patch is the whole right touchline. Keep out of the middle. That is the midfielders\' space.'],
  CMC: ['Left midfielder, the creator. When we have the ball, find the pocket between their lines. Show on the back foot of the nearest midfielder, receive on the half turn, and feed the two strikers. Arrive late at the edge of the box.', 'When we have not, press the first pass out, and stay tight so the shape stays tight.', 'When we win it, show for the ball straight away.', 'When we lose it, you are one of the first to squeeze.', 'Your patch is the left half space. Keep out of the touchline strip, and do not drop in between the centre backs.'],
  CMH: ['Holding midfielder. You are the anchor. When we have the ball, receive on the half turn, set the tempo, and drop between the centre backs when we need the extra man.', 'When we have not, screen the back three and pick up the runner coming from deep.', 'When we win it, give a safe pass and settle us down.', 'When we lose it, you are the first line of protection, so get in front of the ball.', 'Your patch is the middle, in front of the back three. Keep out of the box. Leave the arriving to the others.'],
  CMB: ['Right midfielder, box to box. When we have the ball, break the line with a run, support the wing back, and arrive in the box.', 'When we have not, get back, stay close to the holding midfielder, and cover the wing back when he is out of position.', 'When we win it, run beyond the ball.', 'When we lose it, hunt it for five seconds, then drop.', 'Your patch is the right half space, from our box to theirs. Keep out of the touchline strip, and never leave the holding midfielder on his own.'],
  ST1: ['Striker, pin and link. When we have the ball, pin the centre backs, show for the ball with your back to goal, and spin on the second pass, not the first. Finish what comes.', 'When we have not, press the middle centre back and screen the pass into their midfield.', 'When we win it, show short for a quick pass.', 'When we lose it, squeeze straight away. You are the first defender.', 'Your patch is the middle of their half. Keep out of the deep areas. Do not drop into midfield. That is where the others work.'],
  ST2: ['Striker, the runner. When we have the ball, run the channels in behind, and agree with your partner who drops and who runs. Arrive at the far post.', 'When we have not, press the outside centre back, force play wide, then cut off the way back.', 'When we win it, run in behind.', 'When we lose it, squeeze the ball and block the pass back.', 'Your patch is the channels either side of their centre backs. Keep out of the deep areas, and never stand in the same space as your partner.']
};

/* Zones per role. lane = [x0, x1]. bands = y range per phase. avoidA = keep out when we have the ball, avoidD = keep out when we have not. */
SH.ZONES = {
  GK:  { lane: [24, 44], bands: { shape: [2, 16], build: [2, 30], final: [20, 40], defend: [2, 20], press: [4, 24], transA: [4, 28], transD: [2, 18] }, avoidA: [[0, 68, 52, 105]], avoidD: [[0, 68, 38, 105]] },
  LCB: { lane: [10, 28], bands: { shape: [14, 34], build: [14, 46], final: [34, 56], defend: [14, 34], press: [20, 42], transA: [24, 50], transD: [14, 36] }, avoidA: [[0, 68, 70, 105], [0, 8, 0, 105]], avoidD: [[0, 9, 0, 105], [34, 68, 0, 105]] },
  CB:  { lane: [26, 42], bands: { shape: [14, 34], build: [14, 46], final: [34, 56], defend: [14, 34], press: [20, 42], transA: [24, 50], transD: [14, 36] }, avoidA: [[0, 68, 66, 105]], avoidD: [[0, 68, 44, 105]] },
  RCB: { lane: [40, 58], bands: { shape: [14, 34], build: [14, 46], final: [34, 56], defend: [14, 34], press: [20, 42], transA: [24, 50], transD: [14, 36] }, avoidA: [[0, 68, 70, 105], [60, 68, 0, 105]], avoidD: [[59, 68, 0, 105], [0, 34, 0, 105]] },
  LWB: { lane: [0, 18], bands: { shape: [24, 66], build: [44, 70], final: [58, 98], defend: [18, 42], press: [34, 62], transA: [44, 80], transD: [20, 46] }, avoidA: [[22, 46, 0, 105]], avoidD: [[30, 68, 0, 105]] },
  RWB: { lane: [50, 68], bands: { shape: [24, 66], build: [44, 70], final: [58, 98], defend: [18, 42], press: [34, 62], transA: [44, 80], transD: [20, 46] }, avoidA: [[22, 46, 0, 105]], avoidD: [[0, 38, 0, 105]] },
  CMC: { lane: [12, 36], bands: { shape: [34, 56], build: [30, 56], final: [58, 92], defend: [34, 52], press: [40, 58], transA: [40, 70], transD: [34, 56] }, avoidA: [[0, 8, 0, 105], [0, 68, 0, 28]], avoidD: [[0, 8, 0, 105], [0, 68, 62, 105]] },
  CMH: { lane: [24, 44], bands: { shape: [30, 52], build: [24, 46], final: [44, 66], defend: [34, 50], press: [36, 52], transA: [34, 56], transD: [30, 48] }, avoidA: [[0, 68, 76, 105]], avoidD: [[0, 68, 62, 105]] },
  CMB: { lane: [32, 56], bands: { shape: [34, 56], build: [36, 64], final: [60, 94], defend: [34, 52], press: [40, 58], transA: [40, 72], transD: [34, 56] }, avoidA: [[60, 68, 0, 105], [0, 68, 0, 28]], avoidD: [[60, 68, 0, 105], [0, 68, 62, 105]] },
  ST1: { lane: [20, 44], bands: { shape: [52, 82], build: [58, 80], final: [78, 104], defend: [48, 64], press: [50, 68], transA: [56, 82], transD: [50, 70] }, avoidA: [[0, 68, 0, 48]], avoidD: [[0, 68, 0, 40]] },
  ST2: { lane: [10, 58], bands: { shape: [52, 82], build: [58, 84], final: [78, 104], defend: [48, 64], press: [50, 68], transA: [58, 86], transD: [50, 70] }, avoidA: [[0, 68, 0, 48]], avoidD: [[0, 68, 0, 40]] }
};
SH.GROUP = { shape: 'A', build: 'A', final: 'A', transA: 'A', defend: 'D', press: 'D', transD: 'D' };

/* Opposition 4 4 2. d = y of their back line (they attack down the page), s = sideways shift. */
SH.opp = function (d, s) {
  var c = function (v) { return Math.max(3, Math.min(65, v)); };
  var bx = [10, 26, 42, 58], mx = [8, 25, 43, 60], fx = [26, 42], o = [[c(34 + s * 0.1), Math.min(d + 22, 102)]], i;
  for (i = 0; i < 4; i++) o.push([c(bx[i] + s * 0.5), d]);
  for (i = 0; i < 4; i++) o.push([c(mx[i] + s * 0.6), d - 18]);
  for (i = 0; i < 2; i++) o.push([c(fx[i] + s * 0.5), d - 34]);
  return o;
};
/* Frames. t is 0 to 1 through the phase. us has eleven [x,y]. ball: {u:i} on our player, {o:i} on theirs, {xy:[x,y],arc:1}. */
SH.FR = {
  shape: [
    { t: 0, us: [[34,6],[20,26],[34,24],[48,26],[6,60],[62,60],[24,46],[34,42],[44,46],[28,76],[40,78]], ball: { u: 1 } },
    { t: 0.4, us: [[34,8],[22,24],[34,22],[46,24],[12,28],[56,28],[24,42],[34,40],[44,42],[30,56],[40,56]], ball: { u: 1 } },
    { t: 0.75, us: [[34,6],[20,26],[34,24],[48,26],[6,60],[62,60],[24,46],[34,42],[44,46],[28,76],[40,78]], ball: { u: 1 } },
    { t: 1, us: [[34,6],[20,26],[34,24],[48,26],[6,60],[62,60],[24,46],[34,42],[44,46],[28,76],[40,78]], ball: { u: 1 } }
  ],
  build: [
    { t: 0, us: [[34,7],[20,24],[34,22],[48,24],[6,52],[62,52],[24,42],[34,36],[44,44],[28,70],[40,70]], opp: [70,0], ball: { u: 0 } },
    { t: 0.3, us: [[34,8],[12,26],[34,22],[56,26],[5,60],[63,60],[24,44],[34,30],[44,46],[28,72],[40,72]], opp: [70,-6], ball: { u: 1 } },
    { t: 0.6, us: [[34,8],[14,34],[34,24],[54,26],[5,62],[63,62],[22,46],[34,32],[44,50],[28,72],[40,74]], opp: [70,-8], ball: { u: 6 } },
    { t: 0.85, us: [[34,8],[14,36],[34,26],[54,28],[5,72],[63,64],[24,50],[34,36],[46,60],[28,68],[42,76]], opp: [66,-8], ball: { u: 9 } },
    { t: 1, us: [[34,8],[14,38],[34,28],[54,30],[5,74],[63,66],[26,52],[34,40],[46,62],[28,68],[46,84]], opp: [66,-4], ball: { u: 8 } }
  ],
  final: [
    { t: 0, us: [[34,18],[18,40],[34,40],[50,40],[5,70],[63,70],[24,64],[34,56],[44,62],[30,86],[42,86]], opp: [92,0], ball: { u: 6 } },
    { t: 0.4, us: [[34,18],[18,40],[34,40],[50,40],[6,78],[62,76],[28,74],[34,56],[42,82],[30,90],[52,90]], opp: [92,-6], ball: { u: 4 } },
    { t: 0.75, us: [[34,20],[18,42],[34,42],[50,42],[8,84],[58,88],[26,82],[34,60],[38,84],[30,96],[46,95]], opp: [94,-4], ball: { xy: [34,95], arc: 1 } },
    { t: 1, us: [[34,20],[18,42],[34,42],[50,42],[8,84],[58,88],[26,82],[34,60],[38,86],[30,97],[46,96]], opp: [94,-4], ball: { xy: [34,105.5], arc: 1 } }
  ],
  defend: [
    { t: 0, us: [[33,10],[18,26],[30,26],[42,26],[10,34],[50,28],[20,44],[31,44],[43,42],[24,58],[38,58]], opp: [76,-14], ball: { o: 5 } },
    { t: 0.45, us: [[35,10],[26,26],[38,26],[50,26],[22,28],[58,36],[28,44],[39,44],[50,44],[36,58],[48,58]], opp: [76,14], ball: { o: 8 } },
    { t: 0.8, us: [[34,10],[22,26],[34,26],[46,26],[14,30],[54,30],[24,44],[34,44],[44,44],[30,58],[42,58]], opp: [76,0], ball: { o: 7 } },
    { t: 1, us: [[34,10],[22,26],[34,26],[46,26],[14,30],[54,30],[24,44],[34,44],[44,44],[30,58],[42,58]], opp: [76,0], ball: { o: 7 } }
  ],
  press: [
    { t: 0, us: [[34,10],[22,26],[34,26],[46,26],[14,30],[54,30],[24,44],[34,44],[44,44],[30,58],[42,58]], opp: [78,6], ball: { o: 3 } },
    { t: 0.4, us: [[35,12],[28,36],[38,34],[50,38],[30,40],[58,70],[30,52],[40,52],[52,56],[38,70],[48,72]], opp: [78,6], ball: { o: 4 }, flash: 1 },
    { t: 0.75, us: [[35,12],[28,36],[38,34],[50,38],[30,40],[58,70],[30,52],[40,52],[52,58],[38,70],[48,72]], opp: [78,6], ball: { u: 5 } },
    { t: 1, us: [[35,12],[28,36],[38,34],[50,38],[30,40],[58,68],[30,54],[40,54],[52,60],[38,70],[48,74]], opp: [78,6], ball: { u: 8 } }
  ],
  transA: [
    { t: 0, us: [[34,12],[22,28],[34,28],[46,28],[12,34],[54,34],[24,44],[34,44],[44,44],[30,58],[40,58]], opp: [60,0], ball: { u: 7 } },
    { t: 0.35, us: [[34,14],[22,32],[34,32],[46,32],[8,52],[60,52],[26,48],[34,46],[46,58],[30,64],[42,68]], opp: [62,0], ball: { u: 7 } },
    { t: 0.7, us: [[34,16],[22,36],[34,36],[46,36],[6,64],[62,66],[27,52],[35,50],[47,60],[30,64],[46,76]], opp: [66,0], ball: { u: 8 } },
    { t: 1, us: [[34,18],[22,38],[34,38],[46,38],[6,70],[62,70],[28,56],[36,52],[48,66],[30,66],[46,80]], opp: [72,0], ball: { u: 10 } }
  ],
  transD: [
    { t: 0, us: [[34,20],[18,42],[34,42],[50,42],[5,72],[63,72],[24,66],[34,58],[44,66],[30,86],[42,86]], opp: [90,8], ball: { o: 7 } },
    { t: 0.35, us: [[34,24],[20,46],[34,44],[48,46],[14,60],[56,60],[28,70],[40,66],[46,70],[36,80],[48,76]], opp: [86,8], ball: { o: 7 } },
    { t: 0.7, us: [[34,12],[22,30],[34,28],[46,30],[12,40],[56,42],[26,48],[34,46],[44,48],[32,62],[42,62]], opp: [84,0], ball: { o: 5 } },
    { t: 1, us: [[34,10],[22,26],[34,26],[46,26],[14,30],[54,30],[24,44],[34,44],[44,44],[30,58],[42,58]], opp: [78,0], ball: { o: 8 } }
  ]
};
