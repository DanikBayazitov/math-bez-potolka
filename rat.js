/* rat.js - рациональные числа для 6 класса.
   Запись чисел со знаком, задачи с ответом со знаком, координатная прямая и термометр на бумаге в клетку. */
(function () {
  'use strict';
  const M = globalThis.M;
  const F = M.F, Frac = M.Frac, esc = M.esc;
  const MINUS = '−';

  /* ---------- запись ---------- */
  // десятичная запись неотрицательной дроби или null, если она бесконечная
  function decBody(a) {
    let k = 0, p = 1;
    while (k <= 7 && (p % a.d) !== 0) { k++; p *= 10; }
    if (k > 7) return null;
    const v = a.n * (p / a.d);
    if (k === 0) return String(v);
    const s = String(v).padStart(k + 1, '0');
    return (s.slice(0, s.length - k) + ',' + s.slice(s.length - k)).replace(/,?0+$/, '');
  }
  // число со знаком: -5, −{3/4}, −{2 1/3}, −2,5 (opt.dec), opt.mixed=false - без выделения целой части
  function rk(x, opt) {
    opt = opt || {};
    const f = F(x).red(), neg = f.n < 0, a = new Frac(Math.abs(f.n), f.d);
    let body = null;
    if (opt.dec) body = decBody(a);
    if (body === null) body = M.mk(a, opt.mixed !== false);
    return (neg ? MINUS : '') + body;
  }
  // то же, но отрицательное число в скобках: (−3)
  function rp(x, opt) { const s = rk(x, opt); return F(x).n < 0 ? '(' + s + ')' : s; }
  function isDecimal(x) { return decBody(new Frac(Math.abs(F(x).red().n), F(x).red().d)) !== null; }
  function absF(x) { const f = F(x).red(); return new Frac(Math.abs(f.n), f.d); }
  function neg(x) { return F(x).mul(-1); }
  // десятичная дробь из числа с запятой: D('2,5') или D(25, 1) -> 25/10
  function D(s, k) {
    if (typeof s === 'number' && k !== undefined) return new Frac(s, Math.pow(10, k)).red();
    return M.parseDec(String(s));
  }

  /* ---------- задачи с ответом со знаком ---------- */
  function qInt(prompt, v, opt) { const q = M.qNum(prompt, v, opt); q.neg = true; return q; }
  function qDec(prompt, f, opt) { f = F(f).red(); const q = M.qNum(prompt, { n: f.n, d: f.d }, opt); q.neg = true; q.dec = true; return q; }
  function qRat(prompt, f, opt) { const q = M.qFrac(prompt, f, opt); q.neg = true; return q; }
  function sInt(prompt, v, hints) { const s = M.sNum(prompt, v, hints); s.neg = true; return s; }
  function sDec(prompt, f, hints) { f = F(f).red(); const s = M.sNum(prompt, { n: f.n, d: f.d }, hints); s.neg = true; s.dec = true; return s; }
  function sRat(prompt, f, form, hints) { const s = M.sFrac(prompt, f, form, hints); s.neg = true; return s; }

  /* ---------- координатная прямая в клетку ---------- */
  // o: { from, to, unit (клеток на единицу), points: [{x, label}], jumps: [{from, to, label}], every (подписи через) }
  function svgLine(o) {
    const C = 16, unit = o.unit || 2, from = o.from, to = o.to;
    const padL = 2, padR = 3, span = (to - from) * unit, cells = span + padL + padR;
    const jumps = o.jumps || [], up = jumps.length > 1 ? 4 : jumps.length ? 3 : 1;
    const W = cells * C, rows = 4 + up, Hh = rows * C, y = (up + 2) * C;
    const X = function (v) { return (padL + (F(v).val() - from) * unit) * C; };
    // всё, что рисуем, должно поместиться на прямой
    (o.points || []).concat(jumps.map(function (j) { return { x: j.from }; }), jumps.map(function (j) { return { x: j.to }; })).forEach(function (p) {
      const v = F(p.x).val();
      if (v < from - 1e-9 || v > to + 1e-9) M._lineOut = (M._lineOut || 0) + 1;
    });
    const every = o.every || (unit >= 2 ? 1 : 2);
    let s = '<svg class="vis ray line" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-label="' + esc(o.aria || 'Координатная прямая') + '">';
    for (let i = 0; i <= cells; i++) s += '<line class="cell" x1="' + i * C + '" y1="0" x2="' + i * C + '" y2="' + Hh + '"/>';
    for (let j = 0; j <= rows; j++) s += '<line class="cell" x1="0" y1="' + j * C + '" x2="' + W + '" y2="' + j * C + '"/>';
    const xs = C, xe = W - C;
    s += '<line class="ray-line" x1="' + xs + '" y1="' + y + '" x2="' + xe + '" y2="' + y + '"/>';
    s += '<path class="ray-arrow" d="M' + (xe + 6) + ',' + y + ' L' + (xe - 4) + ',' + (y - 5) + ' L' + (xe - 4) + ',' + (y + 5) + ' Z"/>';
    for (let i = 0; i <= span; i++) {
      const v = from + i / unit, x = X(v), big = i % unit === 0, zero = Math.abs(v) < 1e-9, h = zero ? 9 : big ? 7 : 4;
      s += '<line class="tick' + (big ? ' big' : '') + (zero ? ' zero' : '') + '" x1="' + x + '" y1="' + (y - h) + '" x2="' + x + '" y2="' + (y + h) + '"/>';
      if (big && (zero || Math.round(v) % every === 0)) s += '<text class="ray-num' + (zero ? ' zero' : '') + '" x="' + x + '" y="' + (y + C + 5) + '" text-anchor="middle">' + (v < 0 ? MINUS + Math.abs(Math.round(v)) : Math.round(v)) + '</text>';
    }
    const lev = [];
    jumps.forEach(function (j, k) {
      // прыжок поднимаем выше, если он перекрывает предыдущие
      const a = Math.min(F(j.from).val(), F(j.to).val()), b = Math.max(F(j.from).val(), F(j.to).val());
      let L = 0;
      for (let i = 0; i < k; i++) {
        const c = Math.min(F(jumps[i].from).val(), F(jumps[i].to).val()), d = Math.max(F(jumps[i].from).val(), F(jumps[i].to).val());
        if (Math.min(b, d) - Math.max(a, c) > 1e-9) L = Math.max(L, lev[i] + 1);
      }
      lev.push(L);
      // вершина квадратичной кривой лежит посередине между краем и управляющей точкой
      const x1 = X(j.from), x2 = X(j.to), dir = x2 >= x1 ? 1 : -1, cy = y - C * (2.2 + 3 * Math.min(L, 1)), apex = (y - 6 + cy) / 2;
      s += '<path class="jump" d="M' + x1 + ',' + (y - 6) + ' Q' + ((x1 + x2) / 2) + ',' + cy + ' ' + x2 + ',' + (y - 6) + '"/>';
      s += '<path class="jump-head" d="M' + x2 + ',' + (y - 5) + ' L' + (x2 - dir * 7) + ',' + (y - 11) + ' L' + (x2 - dir * 1) + ',' + (y - 13) + ' Z"/>';
      if (j.label) s += '<text class="jump-lbl" x="' + ((x1 + x2) / 2) + '" y="' + (apex - 5) + '" text-anchor="middle">' + esc(j.label) + '</text>';
    });
    (o.points || []).forEach(function (p) {
      const x = X(p.x);
      s += '<circle class="ray-pt" cx="' + x + '" cy="' + y + '" r="4.5"/>';
      if (p.label) s += '<text class="ray-lbl" x="' + x + '" y="' + (y - C + 1 - (jumps.length ? C * (up - 0.8) : 0)) + '" text-anchor="middle">' + esc(p.label) + '</text>';
    });
    return s + '</svg>';
  }
  // термометр: шкала от lo до hi, t - температура
  function svgThermo(t, lo, hi) {
    lo = lo === undefined ? -10 : lo; hi = hi === undefined ? 10 : hi;
    const C = 14, n = hi - lo, W = 7 * C, Hh = (n + 4) * C, x = 2 * C, yOf = function (v) { return (hi - v + 1.5) * C; };
    let s = '<svg class="vis thermo" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-label="Термометр показывает ' + esc(rk(t)) + ' градусов">';
    for (let i = 0; i <= 7; i++) s += '<line class="cell" x1="' + i * C + '" y1="0" x2="' + i * C + '" y2="' + Hh + '"/>';
    for (let j = 0; j <= n + 4; j++) s += '<line class="cell" x1="0" y1="' + j * C + '" x2="' + W + '" y2="' + j * C + '"/>';
    s += '<rect class="th-tube" x="' + (x - 5) + '" y="' + (yOf(hi) - 6) + '" width="10" height="' + (yOf(lo) - yOf(hi) + 12) + '" rx="5"/>';
    s += '<rect class="th-fill' + (t < 0 ? ' cold' : '') + '" x="' + (x - 3) + '" y="' + yOf(t) + '" width="6" height="' + (yOf(lo) - yOf(t) + 4) + '"/>';
    s += '<circle class="th-bulb' + (t < 0 ? ' cold' : '') + '" cx="' + x + '" cy="' + (yOf(lo) + 10) + '" r="9"/>';
    for (let v = lo; v <= hi; v++) {
      const yy = yOf(v), big = v % 5 === 0;
      s += '<line class="tick' + (big ? ' big' : '') + (v === 0 ? ' zero' : '') + '" x1="' + (x + 7) + '" y1="' + yy + '" x2="' + (x + (big ? 17 : 12)) + '" y2="' + yy + '"/>';
      if (big) s += '<text class="ray-num' + (v === 0 ? ' zero' : '') + '" x="' + (x + 22) + '" y="' + (yy + 4) + '">' + (v < 0 ? MINUS + (-v) : v) + '</text>';
    }
    return s + '</svg>';
  }

  Object.assign(M, {
    MINUS: MINUS, rk: rk, rp: rp, decBody: decBody, isDecimal: isDecimal, absF: absF, neg: neg, D: D,
    qInt: qInt, qDec: qDec, qRat: qRat, sInt: sInt, sDec: sDec, sRat: sRat, svgLine: svgLine, svgThermo: svgThermo
  });
})();
