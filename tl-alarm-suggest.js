/* Parent suggestion for one linked player. Not a phone alarm.
   The server row is the source of truth. This phone only keeps a copy of the
   time until the account changes. Confirm, arm and Clock stay as separate taps. */
var TL_ALARM_PREF_KEY = 'tl.alarm.pref';
var tlAlarmSuggestState = { time: '', loaded: false, from: '' };

function tlAlarmPrefClear() {
  tlAlarmSuggestState = { time: '', loaded: false, from: '' };
  try { localStorage.removeItem(TL_ALARM_PREF_KEY); } catch (e) {}
  var box = document.getElementById('tl-alarm-suggest');
  if (box) box.remove();
  var input = document.getElementById('tl-alarm-time');
  if (input && input.getAttribute('data-tl-suggest') === '1') {
    input.value = '';
    input.removeAttribute('data-tl-suggest');
  }
  if (window.tlAlarmStop) { try { tlAlarmStop(); } catch (e2) {} }
}

function tlAlarmPrefRemember(time) {
  var safe = /^\d{2}:\d{2}$/.test(time || '') ? time : '';
  tlAlarmSuggestState.time = safe;
  tlAlarmSuggestState.loaded = true;
  tlAlarmSuggestState.from = 'server';
  try { localStorage.setItem(TL_ALARM_PREF_KEY, JSON.stringify({ time: safe, zone: 'Europe/London' })); } catch (e) {}
}

function tlAlarmPrefLocal() {
  try {
    var o = JSON.parse(localStorage.getItem(TL_ALARM_PREF_KEY) || 'null');
    if (o && /^\d{2}:\d{2}$/.test(o.time || '')) return o.time;
  } catch (e) {}
  return '';
}

function tlAlarmSuggestNote(text) {
  var el = document.getElementById('tl-alarm-parent-note');
  if (el) el.textContent = text || '';
}

function tlAlarmParentCard() {
  if (!window.D || D.role !== 'parent') return '';
  var time = tlAlarmSuggestState.time || '';
  return '<div class="card" id="tl-alarm-parent"><h3>Suggested wake-up</h3><p class="small">A preference for your own player, in Europe/London. Saving this does not set his phone alarm, does not arm a sound, and does not open Clock. He confirms it on his own phone.</p><p class="small" id="tl-alarm-parent-state">' + (time ? ('Saved suggestion: ' + time + ' Europe/London. Not armed. Not a device alarm.') : 'No suggestion is saved.') + '</p><label for="tl-alarm-parent-time">Suggested time</label><input id="tl-alarm-parent-time" type="time" value="' + time + '" style="min-height:44px"><button type="button" class="btn pri block" id="tl-alarm-parent-save" style="margin-top:8px;min-height:44px" onclick="tlAlarmParentSave()">Save suggestion</button><button type="button" class="btn block" id="tl-alarm-parent-clear" style="margin-top:8px;min-height:44px" onclick="tlAlarmParentClear()">Clear suggestion</button><p class="small" id="tl-alarm-parent-note" role="status"></p></div>';
}

function tlAlarmParentSave() {
  var el = document.getElementById('tl-alarm-parent-time');
  var v = el && el.value;
  if (!/^\d{2}:\d{2}$/.test(v || '')) { tlAlarmSuggestNote('Choose a time first. Nothing was saved.'); return; }
  if (typeof window.call !== 'function') { tlAlarmSuggestNote('Still loading. Nothing was saved.'); return; }
  window.call('f.alarm.set', { time: v }).then(function (d) {
    tlAlarmPrefRemember(d && d.time ? d.time : v);
    tlAlarmSuggestNote('Saved as a suggestion. His phone alarm is not set. He confirms it on his own phone.');
    var st = document.getElementById('tl-alarm-parent-state');
    if (st) st.textContent = 'Saved suggestion: ' + tlAlarmSuggestState.time + ' Europe/London. Not armed. Not a device alarm.';
  }).catch(function (e) {
    tlAlarmSuggestNote(/unknown|not found/i.test(e.message || '') ? 'The suggestion is not on the server yet. Nothing was saved.' : (e.message || 'Could not save.'));
  });
}

function tlAlarmParentClear() {
  if (typeof window.call !== 'function') { tlAlarmSuggestNote('Still loading. Nothing was cleared.'); return; }
  window.call('f.alarm.set', { clear: true }).then(function () {
    tlAlarmPrefRemember('');
    var el = document.getElementById('tl-alarm-parent-time');
    if (el) el.value = '';
    var st = document.getElementById('tl-alarm-parent-state');
    if (st) st.textContent = 'No suggestion is saved.';
    tlAlarmSuggestNote('Suggestion cleared. Nothing was armed.');
  }).catch(function (e) {
    tlAlarmSuggestNote(e.message || 'Could not clear.');
  });
}

function tlAlarmUseSuggestion() {
  var time = tlAlarmSuggestState.time;
  var input = document.getElementById('tl-alarm-time');
  if (!time || !input) return;
  input.value = time;
  input.setAttribute('data-tl-suggest', '1');
  if (window.tlAlarmSetStatus) tlAlarmSetStatus(time + ' Europe/London is in the box. Nothing is armed. This is not a phone alarm. Tap Arm preview, or Try Android Clock, if you want it on this phone. You still confirm any clock alarm yourself.');
}

function tlAlarmSuggestPaint() {
  var host = document.getElementById('tl-alarm');
  if (!host || !window.D || D.role !== 'player') return;
  var old = document.getElementById('tl-alarm-suggest');
  if (!tlAlarmSuggestState.time) { if (old) old.remove(); return; }
  var label = tlAlarmSuggestState.from === 'phone'
    ? 'Last suggestion kept on this phone. It may be out of date. It is not armed and it is not a device alarm.'
    : 'Parent suggestion, not an alarm.';
  if (old && old.getAttribute('data-time') === tlAlarmSuggestState.time && old.getAttribute('data-from') === tlAlarmSuggestState.from) return;
  var html = '<div id="tl-alarm-suggest" data-time="' + tlAlarmSuggestState.time + '" data-from="' + tlAlarmSuggestState.from + '"><p class="small"><b>' + label + '</b> ' + tlAlarmSuggestState.time + ' Europe/London. Nothing is armed and the phone clock has not been changed.</p><button type="button" class="btn block" id="tl-alarm-use" style="min-height:44px" onclick="tlAlarmUseSuggestion()">Use this suggested time</button></div>';
  if (old) old.outerHTML = html;
  else {
    var input = document.getElementById('tl-alarm-time');
    if (input && input.parentNode) {
      var wrap = document.createElement('div');
      wrap.innerHTML = html;
      input.parentNode.insertBefore(wrap.firstChild, input);
    }
  }
}

function tlAlarmPrefLoad() {
  if (tlAlarmSuggestState.loaded) return;
  if (!window.D || (D.role !== 'player' && D.role !== 'parent')) return;
  if (typeof window.call !== 'function') return;
  tlAlarmSuggestState.loaded = true;
  window.call('f.alarm.get', {}).then(function (d) {
    tlAlarmPrefRemember(d && d.time);
    tlAlarmSuggestPaint();
    if (window.D && D.role === 'parent' && document.getElementById('tl-alarm-parent') && typeof window.r === 'function') window.r();
  }).catch(function () {
    var local = tlAlarmPrefLocal();
    tlAlarmSuggestState.time = local;
    tlAlarmSuggestState.from = local ? 'phone' : '';
    tlAlarmSuggestState.loaded = true;
    tlAlarmSuggestPaint();
  });
}

if (typeof document !== 'undefined') {
  setInterval(function () {
    if (document.getElementById('tl-alarm') && window.D && D.role === 'player') tlAlarmSuggestPaint();
    tlAlarmPrefLoad();
  }, 700);
}
