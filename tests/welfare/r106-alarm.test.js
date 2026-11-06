/* Wake-up helpers. No network, no audio device. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = {
  navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile' },
  location: { href: 'https://touchline.example/parents.html', hash: '' },
  document: { visibilityState: 'visible', addEventListener: function () {}, getElementById: function () { return null; } },
  Intl: Intl, Date: Date, Math: Math, String: String, encodeURIComponent: encodeURIComponent, clearTimeout: clearTimeout, setTimeout: setTimeout, setInterval: setInterval
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../tl-alarm.js'), 'utf8'), ctx);
let ok = 0, bad = 0;
const T = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? ok++ : bad++; };
const intent = ctx.tlAlarmIntentUrl(7, 5, 'Blues v Rivals');
T('android chrome is detected', ctx.tlAlarmPlatform() === 'android-chrome');
T('ios is not given an intent', ctx.tlAlarmPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)') === 'ios');
T('intent uses the documented alarm action', intent.indexOf('action=android.intent.action.SET_ALARM') > 0);
T('hour and minute are the ones supplied', /HOUR=7;/.test(intent) && /MINUTES=5;/.test(intent));
T('clock confirm screen is not skipped', intent.indexOf('SKIP_UI') < 0);
T('fallback url is present', intent.indexOf('browser_fallback_url=') > 0);
T('ramp starts quiet', Math.abs(ctx.tlAlarmRamp(0) - 0.02) < 0.001);
T('ramp stays under the cap', ctx.tlAlarmRamp(100) <= 0.35 && ctx.tlAlarmRamp(20) <= 0.35);
const src = fs.readFileSync(path.resolve(__dirname, '../../tl-alarm.js'), 'utf8');
T('no bundled audio recording', !/\.mp3|\.m4a|data:audio/i.test(src));
console.log(ok + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
