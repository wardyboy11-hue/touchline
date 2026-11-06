/* r105 man of the match close, coach history and card.
   Closing a vote never opens WhatsApp and never sends a message.
   The coach presses Share, picks the chat, and presses Send. */
(function (w) {
  var state = { matchId: '', award: null, tie: null, reason: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function label(c) {
    var name = String((c && c.name) || '').trim();
    var num = c && c.num != null && String(c.num) !== '' ? String(c.num) : '';
    if (name && num) return name + ' · ' + num;
    return name || num || 'Player';
  }
  function caption(a) {
    return 'Man of the Match: ' + (a.winnerName || '') + (a.winnerNum ? ' · ' + a.winnerNum : '') + '\n' + (a.opp ? (a.opp + '\n') : '') + (a.dateUK || a.date || '') + '\nWigan Junior Latics U15 Blues';
  }
  function drawCard(canvas, a) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#06102B';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFB81C';
    ctx.fillRect(0, 0, W, 18);
    ctx.fillStyle = '#F4F6FC';
    ctx.font = '700 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Man of the Match', W / 2, 110);
    function words() {
      ctx.fillStyle = '#FFB81C';
      ctx.font = '700 54px sans-serif';
      ctx.fillText(a.winnerName || 'Player', W / 2, 560);
      ctx.fillStyle = '#F4F6FC';
      ctx.font = '600 36px sans-serif';
      ctx.fillText(a.winnerNum ? ('Shirt ' + a.winnerNum) : '', W / 2, 620);
      ctx.font = '500 28px sans-serif';
      ctx.fillText(a.opp || '', W / 2, 700);
      ctx.fillText(a.dateUK || a.date || '', W / 2, 748);
      ctx.fillStyle = '#A6B2D4';
      ctx.font = '500 22px sans-serif';
      ctx.fillText('Wigan Junior Latics U15 Blues', W / 2, 920);
    }
    function badge() {
      ctx.beginPath();
      ctx.arc(W / 2, 330, 120, 0, Math.PI * 2);
      ctx.fillStyle = '#0E1D45';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#FFB81C';
      ctx.stroke();
      ctx.fillStyle = '#FFB81C';
      ctx.font = '700 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(a.winnerNum || '#', W / 2, 356);
    }
    return new Promise(function (resolve) {
      if (!a.photo || String(a.photo).indexOf('data:image/jpeg;base64,') !== 0) { badge(); words(); resolve(); return; }
      var img = new Image();
      img.onload = function () {
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, 330, 120, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, W / 2 - 120, 210, 240, 240);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(W / 2, 330, 120, 0, Math.PI * 2);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#FFB81C';
        ctx.stroke();
        words();
        resolve();
      };
      img.onerror = function () { badge(); words(); resolve(); };
      img.src = a.photo;
    });
  }
  function copyCaption(text) {
    function done(ok) {
      var n = document.getElementById('tl-motm-note');
      if (n) n.textContent = ok ? 'Caption copied. Open WhatsApp yourself, pick the chat, and press Send.' : 'Copy the caption below, then open WhatsApp yourself.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else done(false);
  }
  function download(canvas) {
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'man-of-the-match.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function share(canvas, a) {
    var text = caption(a);
    var box = document.getElementById('tl-motm-fallback');
    function showFallback() {
      download(canvas);
      copyCaption(text);
      if (box) {
        box.hidden = false;
        box.innerHTML = '<p class="small">Download started. Caption:</p><textarea id="tl-motm-cap" readonly style="min-height:90px">' + esc(text) + '</textarea><button type="button" class="btn block" id="tl-motm-copy">Copy caption</button><p class="small" id="tl-motm-note">Open WhatsApp yourself. Nothing was sent.</p>';
        var b = document.getElementById('tl-motm-copy');
        if (b) b.onclick = function () { copyCaption(text); };
      }
    }
    canvas.toBlob(function (blob) {
      try {
        var file = new File([blob], 'man-of-the-match.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: text, title: 'Man of the Match' }).catch(function (e) {
            if (e && e.name === 'AbortError') return;
            showFallback();
          });
          return;
        }
      } catch (e) {}
      showFallback();
    }, 'image/png');
  }
  function acceptLocal(award, dataUrl, confirmed) {
    if (!award || !award.photoLocal || award.photoFrom === 'server') return { ok: false, photo: '', note: 'A photo from this phone is not used for this result.' };
    if (!confirmed) return { ok: false, photo: '', note: 'Tick that you have checked this photo is allowed. Nothing is added until you do.' };
    var u = String(dataUrl || '');
    if (u.indexOf('data:image/jpeg;base64,') !== 0 || u.length < 30 || u.length > 400000) return { ok: false, photo: '', note: 'That file is not a JPEG the card can use.' };
    return { ok: true, photo: u, note: 'This photo stays on this phone. It has not been uploaded and it has not been sent to the assistant.' };
  }
  function showLocal(award) {
    var box = document.getElementById('tl-motm-local');
    if (!box) return;
    box.hidden = !(award && award.photoLocal && award.photoFrom !== 'server');
  }
  function paint(award) {
    var canvas = document.getElementById('tl-motm-card');
    var note = document.getElementById('tl-motm-photo-note');
    showLocal(award);
    if (!canvas || !award) return;
    if (note) {
      if (award.photo && award.photoFrom === 'local') note.textContent = 'This photo stays on this phone. It has not been uploaded and it has not been sent to the assistant.';
      else if (award.photo) note.textContent = '';
      else note.textContent = award.photoNote || 'No photo is cleared. The card shows the shirt number only. No picture has been made up.';
    }
    drawCard(canvas, award);
  }
  function showTie(tied) {
    var el = document.getElementById('tl-motm-tie');
    if (!el) return;
    el.innerHTML = '<p><b>Tie.</b> Pick the winner. The vote will not choose one for you, and nothing is announced yet.</p>' + (tied || []).map(function (t) {
      return '<button type="button" class="btn block" style="margin-top:8px;min-height:48px" data-motm-resolve="' + esc(t.id) + '">' + esc(label(t)) + ' (' + t.n + ')</button>';
    }).join('');
  }
  function explain(data) {
    var el = document.getElementById('tl-motm-status');
    if (!el || !data) return;
    if (data.reason) el.textContent = data.reason;
    else if (data.auto) el.textContent = 'Parent votes in: ' + data.have + ' of ' + data.need + '. Automatic close runs when every parent code on the Families list has voted. Squad size is not the count.';
    else el.textContent = 'Automatic close is off.';
  }
  function apply(data) {
    if (!data) return;
    state.reason = data.reason || '';
    explain(data);
    var tieBox = document.getElementById('tl-motm-tie');
    if (data.tie) {
      state.tie = data.tied || [];
      state.award = null;
      if (tieBox) tieBox.hidden = false;
      showTie(data.tied);
      return;
    }
    state.tie = null;
    if (tieBox) { tieBox.hidden = true; tieBox.innerHTML = ''; }
    var award = data.award || (data.closed ? data : null);
    if (award && award.closed) {
      award.photoFrom = award.photo ? 'server' : '';
      state.award = award;
      paint(award);
    }
  }
  function call(action, extra) {
    var body = Object.assign({ matchId: state.matchId }, extra || {});
    if (typeof w.tlCall !== 'function') return Promise.reject(new Error('The coach app is still loading.'));
    return w.tlCall(action, body);
  }
  function onClick(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var act = t.getAttribute('data-motm-act');
    var resolveId = t.getAttribute('data-motm-resolve');
    if (t.id === 'tl-awards-load') {
      var awards = (typeof w.tlCall === 'function' ? w.tlCall('motm.awards', {}) : Promise.reject(new Error('Still loading')));
      awards.then(fillDash).catch(function (err) {
        var n = document.getElementById('tl-awards-body');
        if (n) n.textContent = /unknown|not found/i.test(err.message || '') ? 'Awards are not on the server yet. Paste the r105 addon onto the v36 script. Do not replace that script.' : (err.message || 'Could not load awards.');
      });
      return;
    }
    if (!act && !resolveId) return;
    if (!state.matchId) state.matchId = t.getAttribute('data-match') || state.matchId;
    if (t.id === 'tl-motm-local-clear') {
      if (state.award && state.award.photoFrom === 'local') {
        state.award.photo = '';
        state.award.photoFrom = '';
        paint(state.award);
        var cleared = document.getElementById('tl-motm-photo-note');
        if (cleared) cleared.textContent = 'The phone photo was removed. The card shows the shirt number only.';
      }
      return;
    }
    if (act === 'share') {
      if (!state.award) return;
      var canvas = document.getElementById('tl-motm-card');
      if (canvas) share(canvas, state.award);
      return;
    }
    var req;
    if (resolveId) req = call('motm.close', { mode: 'resolve', winnerId: resolveId });
    else if (act === 'close') req = call('motm.close', { mode: 'manual' });
    else if (act === 'auto') req = call('motm.close', { mode: 'auto' });
    else if (act === 'reopen') req = call('motm.reopen', {});
    else if (act === 'status') req = call('motm.status', {});
    else return;
    req.then(function (d) {
      if (d && d.reopened) {
        state.award = null;
        var st = document.getElementById('tl-motm-status');
        if (st) st.textContent = 'Vote reopened. The old result stays in the history.';
        return;
      }
      apply(d);
    }).catch(function (err) {
      var st = document.getElementById('tl-motm-status');
      if (st) st.textContent = err.message || 'Could not update the vote.';
    });
  }
  function fillDash(d) {
    var n = document.getElementById('tl-awards-body');
    if (!n) return;
    var h = '<h4>By fixture</h4>';
    if (!d.fixtures || !d.fixtures.length) h += '<p class="small muted">No closed votes yet.</p>';
    else h += d.fixtures.map(function (f) {
      var who = f.winnerName ? esc(label({ name: f.winnerName, num: f.winnerNum })) : esc(f.status);
      return '<p class="small"><b>' + esc(f.dateUK || f.date) + '</b> ' + esc(f.opp || '') + ' · ' + who + '</p>';
    }).join('');
    h += '<h4>Totals this season</h4><p class="small muted">Counts only. Player of the year is still a separate vote. This list does not pick a winner.</p>';
    (d.seasons || []).forEach(function (s) {
      h += '<p class="small"><b>' + esc(s.season) + '</b></p>';
      h += (s.players || []).map(function (p) { return '<p class="small">' + esc(label(p)) + ' · ' + p.n + '</p>'; }).join('');
    });
    n.innerHTML = h;
  }
  function matchHtml(matchId) {
    state.matchId = matchId || state.matchId;
    setTimeout(boot, 0);
    return '<div class="card" id="tl-motm-box"><h3>Close the vote</h3><p class="small" id="tl-motm-status">Checking who has voted.</p><div class="row wrap2"><button type="button" class="btn grow" data-motm-act="status" data-match="' + esc(state.matchId) + '">Check votes</button><button type="button" class="btn pri grow" data-motm-act="close" data-match="' + esc(state.matchId) + '">Close vote</button></div><div id="tl-motm-tie" hidden></div><canvas id="tl-motm-card" width="800" height="1000" style="width:100%;height:auto;border-radius:12px;margin-top:12px;background:#06102B"></canvas><p class="small" id="tl-motm-photo-note"></p><div id="tl-motm-local" hidden><p class="small">The consent list is not on the server, so no stored photo is used. Add a JPEG you have already checked is allowed. It stays on this phone. It is not uploaded and it is not sent to the assistant.</p><label class="small" style="display:flex;gap:8px;align-items:center;min-height:44px"><input type="checkbox" id="tl-motm-local-ok"> I have checked this photo is allowed for the team.</label><input type="file" id="tl-motm-local-file" accept="image/jpeg,.jpg,.jpeg" style="min-height:44px"><button type="button" class="btn block" id="tl-motm-local-clear" style="margin-top:8px;min-height:44px">Remove the phone photo</button></div><button type="button" class="btn block" data-motm-act="share" style="margin-top:8px;min-height:48px">Share to WhatsApp</button><p class="small muted">You pick the chat and press Send. Closing the vote does not send anything.</p><div id="tl-motm-fallback" hidden></div><button type="button" class="btn block" data-motm-act="reopen" style="margin-top:8px">Reopen vote</button></div>';
  }
  function dashHtml() {
    return '<div class="card" id="tl-awards"><h3>Man of the match history</h3><p class="small muted">Coaches only. Totals by fixture and by season. No automatic player of the year.</p><button type="button" class="btn block" id="tl-awards-load">Show awards</button><div id="tl-awards-body"></div></div>';
  }
  function boot() {
    if (!state.matchId || typeof w.tlCall !== 'function') return;
    call('motm.status').then(apply).catch(function (err) {
      var st = document.getElementById('tl-motm-status');
      if (!st) return;
      st.textContent = /unknown|not found/i.test(String(err && err.message)) ? 'The close action is not on the server yet. Voting still works. Paste the r105 addon onto the live v36 script. Do not replace that script, and do not deploy over r104 until you mean to.' : (err.message || 'Could not check votes.');
    });
  }
  document.addEventListener('click', onClick);
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || !state.award) return;
    if (t.id === 'tl-motm-local-ok') {
      if (!t.checked && state.award.photoFrom === 'local') {
        state.award.photo = '';
        state.award.photoFrom = '';
        paint(state.award);
        var gone = document.getElementById('tl-motm-photo-note');
        if (gone) gone.textContent = 'The phone photo was removed. The card shows the shirt number only.';
      }
      return;
    }
    if (t.id !== 'tl-motm-local-file') return;
    var file = t.files && t.files[0];
    if (!file) return;
    var confirmed = !!(document.getElementById('tl-motm-local-ok') && document.getElementById('tl-motm-local-ok').checked);
    var reader = new FileReader();
    reader.onload = function () {
      var res = acceptLocal(state.award, reader.result, confirmed);
      var note = document.getElementById('tl-motm-photo-note');
      if (!res.ok) {
        if (state.award.photoFrom === 'local') {
          state.award.photo = '';
          state.award.photoFrom = '';
          paint(state.award);
        }
        if (note) note.textContent = res.note;
        return;
      }
      state.award.photo = res.photo;
      state.award.photoFrom = 'local';
      if (note) note.textContent = res.note;
      paint(state.award);
    };
    reader.readAsDataURL(file);
  });
  w.TLMotm = { label: label, caption: caption, drawCard: drawCard, share: share, acceptLocal: acceptLocal, matchHtml: matchHtml, dashHtml: dashHtml, boot: boot };
  var bootedFor = '';
  setInterval(function () {
    if (!document.getElementById('tl-motm-card') || !state.matchId || typeof w.tlCall !== 'function') return;
    if (bootedFor === state.matchId) return;
    bootedFor = state.matchId;
    boot();
  }, 400);
})(window);
