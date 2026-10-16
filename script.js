(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- theme ---------- */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var saved = store.get('av-theme');
  if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  if (!root.getAttribute('data-theme') && isDark()) root.setAttribute('data-theme', 'dark');
  $('#themeToggle').addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('av-theme', next);
  });

  /* ---------- nav ---------- */
  var nav = $('#nav'), bar = $('#progressBar'), burger = $('#burger'), links = $('#navLinks');
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('a', links).forEach(function (a) {
    a.addEventListener('click', function () { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
  });

  var timeline = $('#timeline');
  var tls = $$('.tl', timeline);
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    nav.classList.toggle('is-scrolled', y > 10);

    // timeline progress line
    var r = timeline.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
    timeline.style.setProperty('--prog', p.toFixed(3));
    tls.forEach(function (el) {
      el.classList.toggle('lit', el.getBoundingClientRect().top < vh * 0.6);
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // active section link
  var sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$('a', links).forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- reveal (only for elements below the fold at load) ---------- */
  var reveals = $$('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var vh0 = window.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = $$('.reveal.pre', el.parentNode);
        el.style.setProperty('--rd', Math.max(0, sibs.indexOf(el)) * 80 + 'ms');
        el.classList.add('in');
        el.classList.remove('pre');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top > vh0) { el.classList.add('pre'); io.observe(el); }
    });
  }

  /* ---------- counters ---------- */
  function fmt(n, sep) { return sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n); }
  var counters = $$('.count');
  function runCount(el) {
    var to = +el.dataset.to, sep = el.dataset.sep, t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(Math.round(to * e), sep);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!reduce) counters.forEach(runCount);

  /* ---------- hero parallax ---------- */
  var portrait = $('#portrait');
  var depthEls = $$('[data-depth]', portrait);
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', function (e) {
      var cx = e.clientX / window.innerWidth - 0.5, cy = e.clientY / window.innerHeight - 0.5;
      depthEls.forEach(function (el) {
        var d = +el.dataset.depth;
        el.style.transform = 'translate(' + (cx * d).toFixed(1) + 'px,' + (cy * d).toFixed(1) + 'px)';
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + 'px');
      });
      b.addEventListener('mouseleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* ---------- card spotlight ---------- */
  $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--x', (e.clientX - r.left) + 'px');
      c.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- 3P tabs ---------- */
  var P = [
    { t: 'Trả cho vị trí công việc', d: 'Giá trị của vị trí được xác định từ mô tả công việc, trách nhiệm và mức độ ảnh hưởng trong cơ cấu tổ chức.', l: 'sơ đồ tổ chức · chức năng nhiệm vụ · mô tả công việc' },
    { t: 'Trả cho năng lực cá nhân', d: 'Người đảm nhận vị trí được ghi nhận theo kiến thức, kỹ năng và thái độ, đánh giá dựa trên khung năng lực đã thống nhất.', l: 'khung năng lực · tuyển dụng · đánh giá nhân viên' },
    { t: 'Trả cho kết quả công việc', d: 'Thu nhập gắn với mức độ hoàn thành mục tiêu, thông qua KPI, thưởng và hoa hồng theo đặc thù từng bộ phận.', l: 'KPI · thưởng · hoa hồng · cơ chế ghi nhận' }
  ];
  var tabs = $$('.tab'), ink = $('.tabs__ink'), panel = $('#panel-3p'), segs = $$('.bar3 span');
  function setTab(i) {
    tabs.forEach(function (t, j) {
      t.classList.toggle('is-active', i === j);
      t.setAttribute('aria-selected', i === j ? 'true' : 'false');
      t.tabIndex = i === j ? 0 : -1;
    });
    segs.forEach(function (s, j) { s.classList.toggle('is-on', i === j); });
    ink.style.transform = 'translateX(' + (i * 100) + '%)';
    panel.setAttribute('aria-labelledby', tabs[i].id);
    $('.panel__title', panel).textContent = P[i].t;
    $('.panel__text', panel).textContent = P[i].d;
    $('.panel__link', panel).innerHTML = '<span>Gắn với:</span> ' + P[i].l;
    panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
  }
  var cur = 0, auto;
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { cur = i; setTab(i); clearInterval(auto); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        cur = (cur + (e.key === 'ArrowRight' ? 1 : 2)) % 3; setTab(cur); tabs[cur].focus(); clearInterval(auto);
      }
    });
  });
  setTab(0);
  if (!reduce) auto = setInterval(function () { cur = (cur + 1) % 3; setTab(cur); }, 4500);

  /* ---------- steps light up in sequence ---------- */
  var steps = $$('.step');
  if ('IntersectionObserver' in window && !reduce) {
    var so = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      steps.forEach(function (s, i) { setTimeout(function () { s.classList.add('lit'); setTimeout(function () { s.classList.remove('lit'); }, 900); }, 400 + i * 450); });
      so.disconnect();
    }, { threshold: 0.4 });
    so.observe($('#steps'));
  }

  /* ---------- certificate tilt + lightbox ---------- */
  var certBtn = $('#certOpen'), lb = $('#lightbox');
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    certBtn.addEventListener('mousemove', function (e) {
      var r = certBtn.getBoundingClientRect();
      certBtn.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(2) + 'deg');
      certBtn.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(2) + 'deg');
    });
    certBtn.addEventListener('mouseleave', function () { certBtn.style.setProperty('--rx', '0deg'); certBtn.style.setProperty('--ry', '0deg'); });
  }
  function closeLb() { lb.hidden = true; certBtn.focus(); }
  certBtn.addEventListener('click', function () { lb.hidden = false; $('#lbClose').focus(); });
  lb.addEventListener('click', closeLb);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ---------- copy ---------- */
  var toast = $('#toast'), tt;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }
  $$('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.copy;
      var done = function () { showToast('Đã sao chép: ' + v); };
      var fallback = function () {
        var el = b.parentNode.querySelector('.cline__v');
        var range = document.createRange(); range.selectNodeContents(el);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        showToast('Đã chọn sẵn, nhấn Ctrl/⌘ + C để sao chép');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, fallback);
      else fallback();
    });
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- hero canvas: drifting org-network ---------- */
  var cv = $('#heroNet');
  var ctx = cv.getContext('2d');
  var nodes = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), mouse = { x: -999, y: -999 };
  function colors() {
    var cs = getComputedStyle(root);
    return { line: cs.getPropertyValue('--pine').trim(), dot: cs.getPropertyValue('--brass').trim() };
  }
  var col = colors();
  new MutationObserver(function () { col = colors(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  function size() {
    var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(70, W * H / 16000));
    nodes = [];
    for (var i = 0; i < n; i++) {
      nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() < .15 ? 3 : 1.6 });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var max = 130;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      if (!reduce) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
      }
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < max) {
          ctx.globalAlpha = (1 - d / max) * .35;
          ctx.strokeStyle = col.line; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      var md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 160) {
        ctx.globalAlpha = (1 - md / 160) * .6; ctx.strokeStyle = col.dot;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.globalAlpha = .8; ctx.fillStyle = a.r > 2 ? col.dot : col.line;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduce && heroVisible) requestAnimationFrame(draw);
  }
  var heroVisible = true;
  var hero = $('.hero');
  hero.addEventListener('mousemove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -999; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      var was = heroVisible; heroVisible = en[0].isIntersecting;
      if (heroVisible && !was && !reduce) requestAnimationFrame(draw);
    }).observe(hero);
  }
  size(); draw();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (reduce) draw(); }, 200); });
})();
