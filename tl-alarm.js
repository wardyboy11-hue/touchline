/* Matchday wake-up. Not a phone alarm.
   Android Clock link: Chrome intent docs and Android AlarmClock.ACTION_SET_ALARM.
   Chrome only opens an app the user taps, and only if that app allows browser links.
   iPhone has no documented Clock URL for setting an alarm.
   The in-app sound stops when this page is hidden. It does not ring with the screen off.
   No Match of the Day recording is included. */
var TL_ALARM_GAIN_START = 0.02;
var TL_ALARM_GAIN_CAP = 0.35;
var TL_ALARM_RAMP_SEC = 20;

function tlAlarmLondonNow() {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  } catch (e) { return ''; }
}
function tlAlarmPlatform(ua) {
  ua = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  var android = /Android/i.test(ua);
  var chrome = /Chrome\/\d+/i.test(ua) && !/EdgA?\//.test(ua) && !/OPR\//.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua);
  if (android && chrome) return 'android-chrome';
  if (ios) return 'ios';
  return 'other';
}
function tlAlarmIntentUrl(hour, minute, message) {
  var h = Math.max(0, Math.min(23, hour | 0));
  var m = Math.max(0, Math.min(59, minute | 0));
  var msg = encodeURIComponent(String(message || 'Touchline').slice(0, 80));
  var back = '';
  try { back = encodeURIComponent(location.href.split('#')[0] + '#alarm-fallback'); } catch (e) { back = ''; }
  var extra = back ? 'S.browser_fallback_url=' + back + ';' : '';
  return 'intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=' + h + ';i.android.intent.extra.alarm.MINUTES=' + m + ';S.android.intent.extra.alarm.MESSAGE=' + msg + ';' + extra + 'end';
}
function tlAlarmRamp(elapsedSec) {
  var t = Math.max(0, elapsedSec) / TL_ALARM_RAMP_SEC;
  if (t > 1) t = 1;
  return TL_ALARM_GAIN_START + (TL_ALARM_GAIN_CAP - TL_ALARM_GAIN_START) * t;
}
function tlAlarmFixtureLine() {
  try {
    var x = (typeof X === 'function') ? X() : ((window.D && D.x) || {});
    var list = (x.fixtures || []).filter(function (m) { return m && !m.done && !m.pp; });
    list.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    var m = list[0];
    if (!m) return 'No fixture is listed yet. The alarm time is only what you type.';
    return (m.ha === 'A' ? 'Away at ' : 'Home v ') + (m.opp || 'the opposition') + '. Kick-off ' + (m.ko || 'not set') + ', Europe/London' + (m.date ? ', ' + m.date : '') + '.';
  } catch (e) { return 'Fixture details are not on this screen. The alarm time is only what you type.'; }
}
function tlAlarmMessage() {
  return 'Touchline. ' + tlAlarmFixtureLine();
}

var tlAlarmState = { armed: false, snooze: null, fileUrl: '', status: '' };

function tlAlarmReadTime() {
  var el = document.getElementById('tl-alarm-time');
  var v = el && el.value;
  var m = /^(\d{2}):(\d{2})$/.exec(v || '');
  if (!m) return null;
  return { h: +m[1], m: +m[2], text: m[1] + ':' + m[2] };
}
function tlAlarmSetStatus(text) {
  tlAlarmState.status = text || '';
  var el = document.getElementById('tl-alarm-status');
  if (el) el.textContent = tlAlarmState.status;
}
function tlAlarmStop() {
  tlAlarmState.armed = false;
  if (tlAlarmState.snooze) { clearTimeout(tlAlarmState.snooze); tlAlarmState.snooze = null; }
  var a = tlAlarmState.audio;
  tlAlarmState.audio = null;
  if (!a) return;
  try { a.gain.gain.cancelScheduledValues(0); a.gain.gain.value = 0; } catch (e) {}
  try { if (a.src && a.src.stop) a.src.stop(); } catch (e2) {}
  try { a.ctx.close(); } catch (e3) {}
}
function tlAlarmStartGraph(ctx, buffer) {
  var gain = ctx.createGain();
  gain.gain.value = TL_ALARM_GAIN_START;
  gain.connect(ctx.destination);
  var src;
  if (buffer) {
    src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(gain);
    src.start();
  } else {
    src = ctx.createOscillator();
    src.type = 'sine';
    src.frequency.value = 494;
    var o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = 659;
    o2.connect(gain);
    src.connect(gain);
    src.start();
    o2.start();
    src._extra = o2;
  }
  var t0 = ctx.currentTime;
  gain.gain.setValueAtTime(TL_ALARM_GAIN_START, t0);
  gain.gain.linearRampToValueAtTime(TL_ALARM_GAIN_CAP, t0 + TL_ALARM_RAMP_SEC);
  tlAlarmState.audio = { ctx: ctx, gain: gain, src: src };
}
function tlAlarmArm() {
  var when = tlAlarmReadTime();
  if (!when) { tlAlarmSetStatus('Choose a time first. Nothing has been set.'); return; }
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
    tlAlarmSetStatus('This browser cannot play the preview. Use your clock app and the copied time.');
    return;
  }
  tlAlarmStop();
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = new AC();
  tlAlarmState.armed = true;
  var begin = function (buf) {
    if (!tlAlarmState.armed) { try { ctx.close(); } catch (e) {} return; }
    tlAlarmStartGraph(ctx, buf);
    tlAlarmSetStatus('Preview is armed for ' + when.text + '. It plays only while this page stays open and awake. London now is ' + (tlAlarmLondonNow() || 'unavailable') + '. This is not the Match of the Day theme, and it will not ring with the screen locked.');
  };
  if (tlAlarmState.fileBuffer) begin(tlAlarmState.fileBuffer);
  else begin(null);
}
function tlAlarmSnooze() {
  tlAlarmStop();
  tlAlarmSetStatus('Snooze for 5 minutes only if you leave this page open. It is not a phone alarm.');
  tlAlarmState.snooze = setTimeout(function () {
    tlAlarmState.snooze = null;
    if (document.visibilityState === 'hidden') {
      tlAlarmSetStatus('Snooze did not play. The page was not on screen.');
      return;
    }
    tlAlarmArm();
  }, 5 * 60 * 1000);
}
function tlAlarmOnFile(input) {
  var file = input.files && input.files[0];
  if (!file) { tlAlarmState.fileBuffer = null; tlAlarmSetStatus('Using the Touchline whistle. No recording is uploaded.'); return; }
  var reader = new FileReader();
  reader.onload = function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { tlAlarmSetStatus('This browser cannot read that file.'); return; }
    var ctx = new AC();
    ctx.decodeAudioData(reader.result.slice(0), function (buf) {
      tlAlarmState.fileBuffer = buf;
      try { ctx.close(); } catch (e) {}
      tlAlarmSetStatus('Your file stays on this phone. It is not uploaded. Arm the preview when you want to hear it.');
    }, function () { tlAlarmSetStatus('That file could not be read. The Touchline whistle is still available.'); });
  };
  reader.readAsArrayBuffer(file);
}
function tlAlarmCopy() {
  var when = tlAlarmReadTime();
  var text = (when ? ('Wake at ' + when.text + '. ') : 'Choose a time. ') + tlAlarmMessage() + ' Set this in your clock app. Touchline cannot set it for you on this phone.';
  function done(ok) { tlAlarmSetStatus(ok ? 'Copied. Open Clock yourself and add that time.' : text); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
  else done(false);
}
function tlAlarmClockHref() {
  var when = tlAlarmReadTime();
  if (!when || tlAlarmPlatform() !== 'android-chrome') return '';
  return tlAlarmIntentUrl(when.h, when.m, 'Touchline ' + (tlAlarmFixtureLine() || '').slice(0, 60));
}
function tlAlarmCard() {
  var plat = tlAlarmPlatform();
  var clock = plat === 'android-chrome'
    ? '<a class="btn block" id="tl-alarm-clock" href="#" onclick="return tlAlarmOpenClock(event)">Try Android Clock</a><p class="small">Chrome may open the clock app only if that app allows browser links. You still confirm the alarm there. If nothing opens, use Copy time.</p>'
    : '<p class="small">' + (plat === 'ios' ? 'iPhone cannot set a Clock alarm from a website. There is no documented link for it.' : 'This browser cannot open the phone clock.') + ' Copy the time and add it in Clock yourself.</p>';
  return '<section class="tl-simple" id="tl-alarm"><h2>Wake-up</h2><p class="small">You choose the time. Nothing is set until you tap a button. London now: <b id="tl-alarm-london">' + (tlAlarmLondonNow() || '') + '</b></p><p class="small" id="tl-alarm-fixture">' + tlAlarmFixtureLine() + '</p><label for="tl-alarm-time">Alarm time</label><input id="tl-alarm-time" type="time" value="">' + clock + '<button type="button" class="btn block" id="tl-alarm-copy" onclick="tlAlarmCopy()">Copy time</button><h3>In-app sound</h3><p class="small">This plays only while Touchline stays open, awake, and allowed to make sound. It stops if you leave the page or lock the screen. It is not a phone alarm and it is not a notification. No Match of the Day recording is included.</p><label for="tl-alarm-file">Your own audio file, kept on this phone</label><input id="tl-alarm-file" type="file" accept="audio/*"><div class="row wrap2" style="margin-top:8px"><button type="button" class="btn pri" id="tl-alarm-arm" onclick="tlAlarmArm()">Arm preview</button><button type="button" class="btn" id="tl-alarm-stop" onclick="tlAlarmStop();tlAlarmSetStatus(\'Stopped.\')">Stop</button><button type="button" class="btn" id="tl-alarm-snooze" onclick="tlAlarmSnooze()">Snooze 5 min</button></div><p class="small" id="tl-alarm-status" role="status"></p></section>';
}
function tlAlarmOpenClock(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  var href = tlAlarmClockHref();
  if (!href) { tlAlarmCopy(); return false; }
  tlAlarmSetStatus('If the clock app does not open, Chrome blocked the link. Copy the time and set it yourself. Touchline has not created an alarm.');
  try { location.href = href; } catch (e) { tlAlarmCopy(); }
  return false;
}
function tlAlarmBind() {
  if (typeof document === 'undefined') return;
  var file = document.getElementById('tl-alarm-file');
  if (file && !file._tl) { file._tl = 1; file.addEventListener('change', function () { tlAlarmOnFile(file); }); }
  if (location.hash === '#alarm-fallback') tlAlarmSetStatus('The clock app did not open. Copy the time and set it in Clock. This page cannot ring with the screen off.');
  if (!tlAlarmBind._vis) {
    tlAlarmBind._vis = 1;
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && tlAlarmState.armed) {
        tlAlarmStop();
        tlAlarmSetStatus('Preview stopped because the page is not on screen. A website cannot keep an alarm going on the lock screen.');
      }
    });
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', tlAlarmBind);
  setInterval(function () { if (document.getElementById('tl-alarm') && !document.getElementById('tl-alarm')._bound) { document.getElementById('tl-alarm')._bound = 1; tlAlarmBind(); } }, 500);
}
