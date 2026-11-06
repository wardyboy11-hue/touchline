/* Touchline share helper. Vanilla JS, works offline once cached.
   navigator.share when available; otherwise a small sheet with Copy link, WhatsApp and Email.
   Paid or copyrighted items: pass the source URL only. Coach-only items: set coachOnly true. */
(function (w) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function toast(m) {
    try {
      if (typeof w.attToast === 'function') { w.attToast(m); return; }
      if (typeof w.toast === 'function') { w.toast(m); return; }
    } catch (e) {}
    var t = document.getElementById('tl-share-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'tl-share-toast';
      t.className = 'tl-share-toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = m;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { try { t.classList.remove('on'); } catch (e) {} }, 2200);
  }

  function absUrl(u) {
    if (!u) return (location.href.split('#')[0]);
    if (/^https?:\/\//i.test(u)) return u;
    try { return new URL(u, location.href).href; } catch (e) { return u; }
  }

  function fallbackCopy(s) {
    var ta = document.createElement('textarea');
    ta.value = s;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('Link copied'); } catch (e) { toast('Could not copy'); }
    ta.remove();
  }

  function copyText(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(s).then(function () {
        toast('Link copied');
      }).catch(function () { fallbackCopy(s); });
    }
    fallbackCopy(s);
    return Promise.resolve();
  }

  function closeSheet() {
    var s = document.getElementById('tl-share-sheet');
    if (s) s.remove();
    document.removeEventListener('keydown', onEsc, true);
  }

  function onEsc(e) {
    if (e.key === 'Escape') { closeSheet(); }
  }

  function openFallback(opts) {
    closeSheet();
    var title = opts.title || 'Touchline';
    var text = opts.text || '';
    var url = absUrl(opts.url);
    var note = opts.note || '';
    var msg = (text ? (text + '\n\n') : '') + url;
    var d = document.createElement('div');
    d.id = 'tl-share-sheet';
    d.className = 'tl-share-sheet';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.setAttribute('aria-label', 'Share');
    d.innerHTML =
      '<div class="tl-share-sheet-in" tabindex="-1">' +
        '<h2 id="tl-share-h">Share</h2>' +
        (note ? '<p class="small muted">' + esc(note) + '</p>' : '') +
        '<p class="small tl-share-url">' + esc(url) + '</p>' +
        '<button type="button" class="btn pri block tl-share-tap" data-a="copy" aria-label="Copy link">Copy link</button>' +
        '<a class="btn block tl-share-tap" data-a="wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" aria-label="Share on WhatsApp">WhatsApp</a>' +
        '<a class="btn block tl-share-tap" data-a="em" href="mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(msg) + '" aria-label="Share by email">Email</a>' +
        '<button type="button" class="btn block tl-share-tap" data-a="close" aria-label="Close share">Close</button>' +
      '</div>';
    d.addEventListener('click', function (e) {
      if (e.target === d) { closeSheet(); return; }
      var t = e.target.closest('[data-a]');
      if (!t) return;
      var a = t.getAttribute('data-a');
      if (a === 'copy') { e.preventDefault(); copyText(url); }
      if (a === 'close') { e.preventDefault(); closeSheet(); }
    });
    document.body.appendChild(d);
    document.addEventListener('keydown', onEsc, true);
    setTimeout(function () {
      var b = d.querySelector('[data-a="copy"]');
      if (b) b.focus();
    }, 30);
  }

  function share(opts) {
    opts = opts || {};
    if (opts.blocked) { toast(opts.blocked); return Promise.resolve(); }
    var title = opts.title || 'Touchline';
    var text = opts.text || '';
    var url = absUrl(opts.url);
    var note = opts.note || '';
    if (opts.coachOnly) {
      note = (note ? note + ' ' : '') + 'Coach only. Do not share with parents or players.';
    }
    var body = text + (note ? ('\n' + note) : '');
    var payload = { title: title, text: body, url: url };
    if (typeof navigator.share === 'function') {
      return navigator.share(payload).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        openFallback({ title: title, text: body, url: url, note: note });
      });
    }
    openFallback({ title: title, text: body, url: url, note: note });
    return Promise.resolve();
  }

  function pageUrl(hash) {
    var base = location.href.split('#')[0];
    if (!hash) return base + (location.hash || '');
    return base + (hash.charAt(0) === '#' ? hash : '#' + hash);
  }

  function clipDeepLink(id, who) {
    /* who: 'parents' | 'family' | 'coach' — parents/family open the clip player */
    var origin = location.origin || 'https://touchline.cipher-training.co.uk';
    var page = who === 'family' ? '/family.html' : '/parents.html';
    if (who === 'coach') page = '/coach/index.html';
    return origin + page + '#clip/' + encodeURIComponent(id);
  }

  function btnHtml(o) {
    o = o || {};
    var label = o.label || 'Share';
    var aria = o.aria || label;
    var extra = o.extra || '';
    var cls = o.cls || 'btn tl-share-btn';
    return '<button type="button" class="' + cls + '" aria-label="' + esc(aria) + '" ' + extra + '>' + esc(label) + '</button>';
  }

  function pageBarHtml(o) {
    o = o || {};
    var label = o.label || 'Share this page';
    var aria = o.aria || label;
    return '<div class="tl-share-bar" role="region" aria-label="Share this page">' +
      '<button type="button" class="btn pri block tl-share-btn" data-tlshare-page="1" aria-label="' + esc(aria) + '">' + esc(label) + '</button>' +
      '</div>';
  }

  function bind(root, getPageOpts) {
    root = root || document;
    if (root.__tlShareBound) return;
    root.__tlShareBound = 1;
    root.addEventListener('click', function (e) {
      var pageBtn = e.target.closest('[data-tlshare-page]');
      if (pageBtn) {
        e.preventDefault();
        var o = typeof getPageOpts === 'function' ? (getPageOpts() || {}) : (getPageOpts || {});
        share(Object.assign({ title: document.title || 'Touchline', text: '', url: pageUrl() }, o));
        return;
      }
      var item = e.target.closest('[data-tlshare]');
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();
      var o = {
        title: item.getAttribute('data-title') || 'Touchline',
        text: item.getAttribute('data-text') || '',
        url: item.getAttribute('data-url') || pageUrl(),
        note: item.getAttribute('data-note') || '',
        coachOnly: item.getAttribute('data-coach-only') === '1'
      };
      if (item.getAttribute('data-blocked')) o.blocked = item.getAttribute('data-blocked');
      share(o);
    });
  }

  w.TLShare = {
    share: share,
    copy: copyText,
    pageUrl: pageUrl,
    clipDeepLink: clipDeepLink,
    btnHtml: btnHtml,
    pageBarHtml: pageBarHtml,
    bind: bind,
    toast: toast,
    absUrl: absUrl,
    closeSheet: closeSheet
  };
})(window);
