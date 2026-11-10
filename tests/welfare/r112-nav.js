/* Every mapped feature is reachable in the stated taps. No live data. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const R = path.resolve(__dirname, '../..');
const sandbox = { window: {}, document: { getElementById() { return null; }, createElement() { return { id: '', textContent: '', appendChild() {} }; }, head: { appendChild() {} } } };
sandbox.window = sandbox;
sandbox.document.head = sandbox.document.head;
vm.runInNewContext(fs.readFileSync(path.join(R, 'tl-nav.js'), 'utf8'), sandbox);
const N = sandbox.TLNav;
assert(N && N.features.length >= 40);
const doc = fs.readFileSync(path.join(R, 'docs/home-map.md'), 'utf8');
const roles = ['coach', 'parent', 'player'];
roles.forEach(function (role) {
  const list = N.forRole(role);
  assert(list.length >= 15, role + ' features');
  list.forEach(function (f) {
    assert(f.taps <= 2, f.id + ' is ' + f.taps + ' taps');
    const got = N.reach(role, f.id);
    assert(got && got.taps === f.taps && got.route === f.route, f.id);
    assert(doc.indexOf(f.label) >= 0, 'map missing ' + f.label);
  });
});
assert(N.search('welfare', 'coach').some(function (x) { return x.route === 'admin'; }));
assert(N.search('lifts', 'parent').some(function (x) { return x.id === 'fam.lifts'; }));
assert(N.search('goals', 'player').some(function (x) { return x.route === 'own'; }));
assert(!N.search('welfare', 'player').some(function (x) { return x.route === 'admin'; }));
const coach = fs.readFileSync(path.join(R, 'coach/app.js'), 'utf8');
const family = fs.readFileSync(path.join(R, 'family.html'), 'utf8');
assert(coach.indexOf('TLNav.bar') > 0);
assert(family.indexOf('TLNav.bar') > 0);
assert(/tl-rcard/.test(family));
assert(/tl-matchday/.test(fs.readFileSync(path.join(R, 'fsw.js'), 'utf8')));
assert(/k!==MATCH/.test(fs.readFileSync(path.join(R, 'coach/sw.js'), 'utf8')));
console.log('nav map ok', { features: N.features.length, coach: N.forRole('coach').length, parent: N.forRole('parent').length, player: N.forRole('player').length });
