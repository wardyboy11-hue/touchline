/* Kit is a saved coach choice. Venue never decides it. Synthetic fixtures only. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const sandbox = {
  document: { addEventListener: function () {}, getElementById: function () { return null; }, querySelector: function () { return null; }, visibilityState: 'visible' },
  navigator: {},
  setInterval: function () { return 1; },
  setTimeout: function () { return 1; },
  localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} }
};
sandbox.window = sandbox;
sandbox.addEventListener = function () {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'cd.js'), 'utf8'), sandbox);
const kit = sandbox.TLCD.kitText;
const key = sandbox.TLCD.kitKey;
let ok = 0, bad = 0;
const T = function (n, c) { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
const away = { ha: 'A', venue: 'Their ground', opp: 'Rivals Athletic' };
T('away venue with no kit is not away kit', kit(away) === 'Kit to be confirmed' && key(away) === '');
T('home venue with no kit is not home kit', kit({ ha: 'H', venue: 'Christopher Park' }) === 'Kit to be confirmed');
T('saved blue stays the home kit', /dark blue/.test(kit({ ha: 'A', kit: 'blue', venue: 'Their ground' })) && !/Away kit/.test(kit({ ha: 'A', kit: 'blue' })));
T('saved home kit stays blue', /dark blue/.test(kit({ ha: 'A', kit: 'H' })));
T('saved away kit stays away', kit({ ha: 'H', kit: 'A' }) === 'Away kit');
const coach = fs.readFileSync(path.join(root, 'coach/app.js'), 'utf8');
T('changing home or away does not write the kit', !/m\.kit=v/.test(coach) && !/m\.kit===m\.ha/.test(coach));
T('a new match does not assume home kit', /kit:''/.test(coach));
T('kit alerts are not sent until a kit is chosen', /Choose the kit before this alert/.test(coach) && /if\(u===null\)/.test(coach));
const fam = fs.readFileSync(path.join(root, 'family.html'), 'utf8');
const par = fs.readFileSync(path.join(root, 'parents.html'), 'utf8');
T('family pages do not guess kit from the venue', !/m\.ha==='A'\?'A':'H'/.test(fam) && !/m\.ha==='A'\?'A':'H'/.test(par) && !/data-kit-for/.test(fam) && !/data-kit-for/.test(par));
console.log(ok + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
