/* ====================================================
   DUSHYANTH RAMALINGAM — "THE ENCHANTED MAP"
   Interaction engine (no dependencies)
   ==================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var root = document.documentElement;

  /* ---------- Night & day ---------- */
  var toggle = document.getElementById('theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(night) {
    root.classList.toggle('night', night);
    if (toggle) {
      toggle.innerHTML = night
        ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
      toggle.setAttribute('aria-label', night ? 'Switch to parchment (day) mode' : 'Switch to candle-lit (night) mode');
    }
    if (themeMeta) themeMeta.setAttribute('content', night ? '#16100a' : '#efe3c6');
  }
  applyTheme(root.classList.contains('night'));
  if (toggle) {
    toggle.addEventListener('click', function () {
      var night = !root.classList.contains('night');
      applyTheme(night);
      try { localStorage.setItem('dr_theme', night ? 'night' : 'day'); } catch (e) {}
      root.dispatchEvent(new CustomEvent('dr:theme'));
    });
  }

  /* ---------- Background music (opt-in, carries across pages) ----------
     Two decks (#bgm + a second Audio) so the day and night tracks can
     cross-fade when the theme changes. localStorage dr_music = on/off,
     sessionStorage dr_music_t = resume position (plus dr_music_i / dr_music_th
     for the track index and the theme it belongs to). */
  var playChime = null;
  var bgm = document.getElementById('bgm');
  var musicBtn = document.getElementById('music-toggle');
  if (bgm && musicBtn) {
    var VOL = 0.35;
    var lists = {
      day: (bgm.dataset.day || bgm.getAttribute('src') || '').split(',').filter(Boolean),
      night: (bgm.dataset.night || '').split(',').filter(Boolean)
    };
    if (!lists.night.length) lists.night = lists.day;
    var deckB = new Audio(); deckB.preload = 'none';
    var active = bgm, idle = deckB;
    var themeOf = function () { return root.classList.contains('night') ? 'night' : 'day'; };
    var idx = 0, saved = 0, savedTheme = '';
    try {
      idx = parseInt(sessionStorage.getItem('dr_music_i') || '0', 10) || 0;
      saved = parseFloat(sessionStorage.getItem('dr_music_t') || '0') || 0;
      savedTheme = sessionStorage.getItem('dr_music_th') || '';
    } catch (e) {}
    var srcFor = function (theme) { var l = lists[theme]; return l[idx % l.length]; };
    var setBtn = function (on) {
      musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      musicBtn.setAttribute('aria-label', on ? 'Pause the music' : 'Play the music of the hall');
    };
    var fadeTo = function (el, target, done) {
      clearInterval(el._fade);
      el._fade = setInterval(function () {
        var v = el.volume + (target > el.volume ? 0.03 : -0.03);
        if ((target > el.volume && v >= target) || (target <= el.volume && v <= target)) {
          el.volume = target; clearInterval(el._fade); if (done) done(); return;
        }
        el.volume = Math.max(0, Math.min(1, v));
      }, 60);
    };
    var playOn = function (el, src, at) {
      if (el._src !== src) { el._src = src; el.src = src; }
      el.volume = 0;
      return el.play().then(function () { if (at) el.currentTime = at; });
    };
    var isOn = function () { return !active.paused; };
    var start = function () {
      var theme = themeOf(), at = 0;
      if (saved && savedTheme === theme) at = saved;
      saved = 0;
      return playOn(active, srcFor(theme), at).then(function () { setBtn(true); fadeTo(active, VOL); });
    };
    var stop = function () {
      [active, idle].forEach(function (el) { if (!el.paused) fadeTo(el, 0, function () { el.pause(); }); });
      setBtn(false);
    };
    // When a track ends, move on to the next one of the current theme
    [bgm, deckB].forEach(function (el) {
      el.addEventListener('ended', function () {
        if (el !== active) return;
        var l = lists[themeOf()];
        idx = (idx + 1) % l.length;
        playOn(el, srcFor(themeOf()), 0).then(function () { fadeTo(el, VOL); }).catch(function () {});
      });
    });
    // Day <-> night: cross-fade to the other theme's track
    root.addEventListener('dr:theme', function () {
      if (!isOn()) return;
      var from = active, to = idle, src = srcFor(themeOf());
      if (from._src === src) return;
      active = to; idle = from;
      playOn(to, src, 0).then(function () { fadeTo(to, VOL); })
        .catch(function () { active = from; idle = to; });
      fadeTo(from, 0, function () { from.pause(); });
    });
    var remember = function (on) { try { localStorage.setItem('dr_music', on ? 'on' : 'off'); } catch (e) {} };
    musicBtn.addEventListener('click', function () {
      if (!isOn()) { start().catch(function () {}); remember(true); }
      else { stop(); remember(false); }
    });
    window.addEventListener('pagehide', function () {
      try {
        if (isOn()) {
          sessionStorage.setItem('dr_music_t', String(active.currentTime));
          sessionStorage.setItem('dr_music_i', String(idx));
          sessionStorage.setItem('dr_music_th', themeOf());
        }
      } catch (e) {}
    });
    var wanted = false;
    try { wanted = localStorage.getItem('dr_music') === 'on'; } catch (e) {}
    if (wanted) {
      start().catch(function () {
        // Autoplay was blocked: begin on the visitor's first tap or key press
        var go = function () {
          start().catch(function () {});
          ['pointerdown', 'keydown'].forEach(function (t) { window.removeEventListener(t, go, true); });
        };
        ['pointerdown', 'keydown'].forEach(function (t) { window.addEventListener(t, go, true); });
      });
    }
    // A short chime for the golden flier, only while the music is on
    if (bgm.dataset.chime) {
      var chime = new Audio(bgm.dataset.chime); chime.preload = 'none';
      playChime = function () {
        if (!isOn()) return;
        chime.volume = 0.5; chime.currentTime = 0;
        chime.play().catch(function () {});
      };
    }
  }

  /* ---------- Navbar ---------- */
  var navbar = document.getElementById('navbar');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 30);
    var menuOpen = navMenu && navMenu.classList.contains('open');
    navbar.classList.toggle('nav-hidden', y > lastY && y > 320 && !menuOpen);
    lastY = y;
  }
  navbar.addEventListener('focusin', function () { navbar.classList.remove('nav-hidden'); });

  /* ---------- Mobile menu ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  function setMenu(open) {
    navMenu.classList.toggle('open', open);
    navToggle.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () { setMenu(!navMenu.classList.contains('open')); });
    navMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && navMenu.classList.contains('open')) setMenu(false); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Map unfolds on first visit (home only) ---------- */
  var intro = document.getElementById('map-intro');
  if (intro) {
    var seen = false;
    try { seen = Date.now() - parseInt(sessionStorage.getItem('dr_map') || '0', 10) < 30 * 60 * 1000; } catch (e) {}
    if (reduced || seen) {
      intro.remove();
      root.style.setProperty('--ink-delay', '0.15s');
    } else {
      try { sessionStorage.setItem('dr_map', String(Date.now())); } catch (e) {}
      root.style.setProperty('--ink-delay', '1.7s');
      setTimeout(function () { intro.remove(); }, 2600);
    }
  }

  /* ---------- Scroll reveals ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Count-up ledger ---------- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if (reduced || !('IntersectionObserver' in window)) return;
    var target = parseInt(el.dataset.count, 10);
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.textContent = '0';
    var o = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      o.disconnect();
      var start = null;
      (function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1500, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* ---------- Moving portraits: slow cross-fade between photographs ---------- */
  document.querySelectorAll('[data-moving]').forEach(function (box) {
    var imgs = box.querySelectorAll('img');
    if (imgs.length < 2 || reduced) return;
    var i = 0;
    setInterval(function () {
      imgs[i].classList.remove('on');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('on');
    }, 6500);
  });

  /* ---------- Portrait loops: play only in view, poster only under reduced motion ---------- */
  document.querySelectorAll('video[data-autoplay]').forEach(function (v) {
    if (reduced) { v.preload = 'none'; v.pause(); return; }
    v.muted = true;
    var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var r = v.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) tryPlay();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) tryPlay(); else v.pause(); }, { threshold: 0.1 }).observe(v);
    } else { tryPlay(); }
  });

  /* ---------- Lantern follows the cursor ---------- */
  var lantern = document.getElementById('lantern');
  if (lantern && fine && !reduced) {
    window.addEventListener('mousemove', function (e) {
      lantern.style.setProperty('--lx', e.clientX + 'px');
      lantern.style.setProperty('--ly', e.clientY + 'px');
    }, { passive: true });
  } else if (lantern) {
    lantern.remove();
  }

  /* ---------- Footprints that wander toward a target ---------- */
  var FOOT = '<svg viewBox="0 0 14 22" aria-hidden="true"><ellipse cx="7" cy="14.5" rx="5" ry="6.8"/><circle cx="2.8" cy="4.2" r="1.6"/><circle cx="6.4" cy="2.4" r="1.8"/><circle cx="10.2" cy="3.4" r="1.5"/></svg>';
  function walk(layer, from, to, name) {
    var dx = to.x - from.x, dy = to.y - from.y;
    var dist = Math.hypot(dx, dy);
    var n = Math.max(8, Math.min(22, Math.round(dist / 34)));
    var angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    var nx = -dy / dist, ny = dx / dist;
    var label = null;
    if (name) {
      label = document.createElement('span');
      label.className = 'fp-name';
      label.textContent = name;
      layer.parentNode.appendChild(label);
    }
    for (var i = 0; i < n; i++) {
      (function (i) {
        setTimeout(function () {
          var t = i / (n - 1);
          var wobble = Math.sin(t * Math.PI * 1.4) * 26;
          var side = i % 2 ? 7 : -7;
          var x = from.x + dx * t + nx * (wobble + side);
          var y = from.y + dy * t + ny * (wobble + side);
          var fp = document.createElement('span');
          fp.className = 'fp go';
          fp.innerHTML = FOOT;
          fp.style.left = x + 'px';
          fp.style.top = y + 'px';
          fp.style.transform = 'rotate(' + angle + 'deg)';
          layer.appendChild(fp);
          setTimeout(function () { fp.remove(); }, 3600);
          if (label) {
            label.style.left = (x + 16) + 'px';
            label.style.top = (y - 26) + 'px';
            label.classList.add('on');
          }
        }, i * 290);
      })(i);
    }
    if (label) setTimeout(function () { label.classList.remove('on'); setTimeout(function () { label.remove(); }, 700); }, n * 290 + 1400);
  }
  function startWalks(host, targetSel, name, delay) {
    var layer = host.querySelector('.steps-layer');
    var target = host.querySelector(targetSel);
    if (!layer || !target || reduced) return;
    function once() {
      var hb = host.getBoundingClientRect();
      var tb = target.getBoundingClientRect();
      if (hb.bottom < 0 || hb.top > window.innerHeight) return;
      var to = { x: tb.left - hb.left - 24, y: tb.top - hb.top + tb.height / 2 };
      var from = { x: Math.max(10, to.x - 260), y: Math.min(hb.height - 20, to.y + 230) };
      walk(layer, from, to, name);
    }
    setTimeout(function () { once(); setInterval(once, 11000); }, delay);
  }
  var heroHost = document.querySelector('[data-walk]');
  if (heroHost) startWalks(heroHost, heroHost.dataset.walk, 'Dushyanth Ramalingam', parseFloat(heroHost.dataset.walkDelay || '3') * 1000);

  // The site map: footprints wander between rooms
  var map = document.querySelector('.map');
  if (map && !reduced) {
    var mapLayer = map.querySelector('.steps-layer');
    var rooms = map.querySelectorAll('.room');
    var mapVisible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { mapVisible = e[0].isIntersecting; }).observe(map);
    }
    var cur = 0;
    setInterval(function () {
      if (!mapVisible || !rooms.length) return;
      var mb = map.getBoundingClientRect();
      var a = rooms[cur].getBoundingClientRect();
      var nxt = (cur + 1 + Math.floor(Math.random() * (rooms.length - 1))) % rooms.length;
      var b = rooms[nxt].getBoundingClientRect();
      walk(mapLayer,
        { x: a.left - mb.left + a.width / 2, y: a.top - mb.top + a.height / 2 },
        { x: b.left - mb.left + b.width / 2, y: b.top - mb.top + b.height / 2 },
        'R. Dushyanth');
      cur = nxt;
    }, 6500);
  }

  /* ---------- Floating candles ---------- */
  document.querySelectorAll('[data-candles]').forEach(function (host) {
    var box = document.createElement('div');
    box.className = 'candles' + (host.dataset.candles === 'always' ? ' always' : '');
    box.setAttribute('aria-hidden', 'true');
    var count = window.innerWidth < 700 ? 4 : 10;
    for (var i = 0; i < count; i++) {
      var c = document.createElement('span');
      c.className = 'candle';
      // Keep candles in the upper-right air, clear of the headline
      c.style.left = (window.innerWidth < 700 ? 70 : 52) + Math.random() * (window.innerWidth < 700 ? 26 : 44) + '%';
      c.style.top = 'calc(var(--nav-h) + ' + (4 + Math.random() * 30) + '%)';
      c.style.setProperty('--bob', (4 + Math.random() * 4) + 's');
      c.style.animationDelay = (-Math.random() * 6) + 's';
      var s = 0.6 + Math.random() * 0.6;
      c.style.scale = s;
      box.appendChild(c);
    }
    host.insertBefore(box, host.firstChild);
  });

  /* ---------- The golden flier (catch it for house points) ---------- */
  var flier = document.getElementById('flier');
  if (flier && !reduced) {
    var fx = window.innerWidth * 0.8, fy = window.innerHeight * 0.3, tx = fx, ty = fy, vx = 0, vy = 0;
    function retarget() {
      tx = 40 + Math.random() * (window.innerWidth - 80);
      ty = 90 + Math.random() * (window.innerHeight - 160);
    }
    retarget();
    setInterval(retarget, 1800);
    (function fly() {
      vx += (tx - fx) * 0.0016; vy += (ty - fy) * 0.0016;
      vx *= 0.955; vy *= 0.955;
      fx += vx; fy += vy;
      flier.style.transform = 'translate(' + fx + 'px,' + fy + 'px) rotate(' + Math.max(-25, Math.min(25, vx * 3)) + 'deg)';
      if (!flier.classList.contains('caught')) requestAnimationFrame(fly);
    })();
    var toast = document.getElementById('toast');
    flier.addEventListener('click', function () {
      flier.classList.add('caught');
      if (playChime) playChime();
      if (toast) {
        toast.classList.add('on');
        setTimeout(function () { toast.classList.remove('on'); }, 3800);
      }
      setTimeout(function () { flier.remove(); }, 700);
    });
  } else if (flier) {
    flier.remove();
  }

  /* ---------- Owl delivers when the letter comes into view ---------- */
  var owl = document.getElementById('owl');
  if (owl && !reduced && 'IntersectionObserver' in window) {
    var oo = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { owl.classList.add('fly'); oo.disconnect(); }
    }, { threshold: 0.4 });
    oo.observe(owl.parentNode);
  }

  /* ---------- Chronicle tabs ---------- */
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
      tab.setAttribute('aria-pressed', 'true');
      document.querySelectorAll('[data-panel]').forEach(function (p) {
        p.hidden = p.dataset.panel !== tab.dataset.tab;
      });
    });
  });

  /* ---------- Workshop filters ---------- */
  document.querySelectorAll('.filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      var f = btn.dataset.filter;
      document.querySelectorAll('#commissions [data-category]').forEach(function (card) {
        card.hidden = !(f === 'all' || card.dataset.category === f);
        if (!card.hidden) card.classList.add('in');
      });
    });
  });

  /* ---------- Moving pictures (YouTube facades) ---------- */
  document.querySelectorAll('.talk-card').forEach(function (card) {
    card.addEventListener('click', function () {
      if (card.querySelector('iframe')) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + card.dataset.video + '?autoplay=1&rel=0';
      iframe.title = card.dataset.title || 'YouTube video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      var play = card.querySelector('.talk-play');
      if (play) play.hidden = true;
      card.appendChild(iframe);
      iframe.focus();
    });
  });

  /* ---------- The sorting ---------- */
  var result = document.getElementById('sort-result');
  document.querySelectorAll('.sort-opt').forEach(function (opt) {
    opt.addEventListener('click', function () {
      document.querySelectorAll('.sort-opt').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      opt.setAttribute('aria-pressed', 'true');
      var tpl = document.getElementById('sort-' + opt.dataset.house);
      if (!result || !tpl) return;
      result.dataset.house = opt.dataset.house;
      result.innerHTML = tpl.innerHTML;
      result.hidden = false;
      result.focus({ preventScroll: true });
    });
  });
})();
