/* frac.js - дроби, разметка, озвучка, рисунки, конструкторы задач.
   Работает в браузере и в Node (для тестов). Всё складывается в globalThis.M. */
(function () {
  'use strict';
  const M = (globalThis.M = globalThis.M || {});

  /* ---------- случайные числа ---------- */
  function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- дроби ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return (a / gcd(a, b)) * b; }

  class Frac {
    constructor(n, d) {
      if (d === undefined) d = 1;
      if (d === 0) throw new Error('Знаменатель 0');
      if (d < 0) { n = -n; d = -d; }
      this.n = n; this.d = d;
    }
    red() { const g = gcd(this.n, this.d) || 1; return new Frac(this.n / g, this.d / g); }
    add(o) { o = F(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d).red(); }
    sub(o) { o = F(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d).red(); }
    mul(o) { o = F(o); return new Frac(this.n * o.n, this.d * o.d).red(); }
    div(o) { o = F(o); return new Frac(this.n * o.d, this.d * o.n).red(); }
    eq(o) { o = F(o); return this.n * o.d === o.n * this.d; }
    cmp(o) { o = F(o); return Math.sign(this.n * o.d - o.n * this.d); }
    isInt() { return this.n % this.d === 0; }
    val() { return this.n / this.d; }
  }
  function F(n, d) {
    if (n instanceof Frac) return n;
    if (n && typeof n === 'object') return new Frac(n.n, n.d);
    return new Frac(n, d === undefined ? 1 : d);
  }

  /* ---------- разметка: {3/8} дробь, {2 1/3} смешанное число ---------- */
  function fr(n, d) { return '{' + n + '/' + d + '}'; }
  function mx(w, n, d) { return n === 0 ? String(w) : '{' + w + ' ' + n + '/' + d + '}'; }
  // запись дроби; asMixed - выделить целую часть
  function mk(f, asMixed) {
    f = F(f);
    if (f.d === 1) return String(f.n);
    if (asMixed && f.n > f.d) {
      const w = Math.floor(f.n / f.d), r = f.n % f.d;
      return r ? mx(w, r, f.d) : String(w);
    }
    return fr(f.n, f.d);
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fracHTML(n, d) {
    return '<span class="frac" role="math" aria-label="' + esc(fracWords(n, d)) + '"><span class="num">' + n +
      '</span><span class="den">' + d + '</span></span>';
  }
  // текст с разметкой -> HTML
  function toHTML(text) {
    return esc(text).replace(/\{([^{}]+)\}/g, function (m, inner) {
      const sp = inner.trim().match(/^(\S+)\s+([^\s/]+)\/([^\s/]+)$/);
      if (sp) return '<span class="mixed"><span class="whole">' + sp[1] + '</span>' + fracHTML(sp[2], sp[3]) + '</span>';
      const p = inner.split('/');
      if (p.length === 2) return fracHTML(p[0], p[1]);
      return m;
    });
  }

  /* ---------- склонение ---------- */
  function plural(n, forms) {
    n = Math.abs(n) % 100; const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }
  function pl(n, forms) { return n + ' ' + plural(n, forms); }

  /* ---------- озвучка ---------- */
  const ONES = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять',
    'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать',
    'восемнадцать', 'девятнадцать'];
  const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const HUND = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  function unit(u, fem) { if (fem && u === 1) return 'одна'; if (fem && u === 2) return 'две'; return ONES[u]; }
  function numWords(n, fem) {
    n = Number(n);
    if (!Number.isInteger(n)) return String(n);
    if (n < 0) return 'минус ' + numWords(-n, fem);
    if (n >= 1000) return String(n);
    const h = Math.floor(n / 100), r = n % 100, parts = [];
    if (h) parts.push(HUND[h]);
    if (r < 20) { if (r || !h) parts.push(unit(r, fem)); }
    else { parts.push(TENS[Math.floor(r / 10)]); if (r % 10) parts.push(unit(r % 10, fem)); }
    return parts.join(' ');
  }
  const ORD_U = ['', 'первая', 'вторая', 'третья', 'четвёртая', 'пятая', 'шестая', 'седьмая', 'восьмая', 'девятая'];
  const ORD_TEEN = ['десятая', 'одиннадцатая', 'двенадцатая', 'тринадцатая', 'четырнадцатая', 'пятнадцатая',
    'шестнадцатая', 'семнадцатая', 'восемнадцатая', 'девятнадцатая'];
  const ORD_TENS = ['', '', 'двадцатая', 'тридцатая', 'сороковая', 'пятидесятая', 'шестидесятая', 'семидесятая',
    'восьмидесятая', 'девяностая'];
  function ordFem(n) {
    if (n === 100) return 'сотая';
    if (n < 1 || n > 100) return String(n);
    if (n < 10) return ORD_U[n];
    if (n < 20) return ORD_TEEN[n - 10];
    const t = Math.floor(n / 10), u = n % 10;
    return u === 0 ? ORD_TENS[t] : TENS[t] + ' ' + ORD_U[u];
  }
  function ordGen(n) { return ordFem(n).replace(/ья$/, 'ьих').replace(/ая$/, 'ых'); }
  function speakExpr(s) {
    return String(s).replace(/·/g, ' умножить на ').replace(/\+/g, ' плюс ').replace(/[−-]/g, ' минус ');
  }
  function fracWords(a, b) {
    const na = Number(a), nb = Number(b);
    if (!Number.isInteger(na) || !Number.isInteger(nb) || String(a).trim() !== String(na) || String(b).trim() !== String(nb)) {
      return speakExpr(a) + ', делённое на ' + speakExpr(b);
    }
    const one = na % 10 === 1 && na % 100 !== 11;
    return numWords(na, true) + ' ' + (one ? ordFem(nb) : ordGen(nb));
  }
  function mixedWords(w, a, b) {
    const nw = Number(w);
    const one = nw % 10 === 1 && nw % 100 !== 11;
    return numWords(nw, true) + ' ' + (one ? 'целая' : 'целых') + ' ' + fracWords(a, b);
  }
  function speech(text) {
    return String(text)
      .replace(/\{([^{}]+)\}/g, function (m, inner) {
        const sp = inner.trim().match(/^(\S+)\s+([^\s/]+)\/([^\s/]+)$/);
        if (sp) return mixedWords(sp[1], sp[2], sp[3]);
        const p = inner.split('/');
        return p.length === 2 ? fracWords(p[0], p[1]) : inner;
      })
      .replace(/\s·\s/g, ' умножить на ')
      .replace(/\s:\s/g, ' разделить на ')
      .replace(/\s\+\s/g, ' плюс ')
      .replace(/\s−\s/g, ' минус ')
      .replace(/\s=\s/g, ' равно ')
      .replace(/\s>\s/g, ' больше ')
      .replace(/\s<\s/g, ' меньше ')
      .replace(/\(ост\.\s*(\d+)\)/g, ', остаток $1')
      .replace(/км\/ч/g, 'километров в час')
      .replace(/(\d+),(\d*)\((\d+)\)/g, function (m, w, pre, per) { return w + ' целых ' + (pre ? pre + ' и ' : '') + per + ' в периоде'; })
      .replace(/\|([^|]+)\|/g, ' модуль $1 ')
      .replace(/−(?=[\d(])/g, 'минус ')
      .replace(/ - /g, ', ');
  }

  /* ---------- рисунки (SVG; цвета задаются классами в CSS) ---------- */
  function cls(i, k, k2) { return i < k ? 'sa' : i < k + k2 ? 'sb' : 'se'; }
  function svgBar(d, k, k2, opt) {
    k2 = k2 || 0; opt = opt || {};
    const W = opt.w || 320, H = opt.h || 44, w = W - 4, h = H - 4, cw = w / d;
    let s = '<svg class="vis" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Полоска из ' + d + ' частей">';
    for (let i = 0; i < d; i++) s += '<rect class="' + cls(i, k, k2) + '" x="' + (2 + i * cw).toFixed(2) + '" y="2" width="' + cw.toFixed(2) + '" height="' + h + '"/>';
    for (let i = 1; i < d; i++) s += '<line class="sep" x1="' + (2 + i * cw).toFixed(2) + '" y1="2" x2="' + (2 + i * cw).toFixed(2) + '" y2="' + (2 + h) + '"/>';
    s += '<rect class="frame" x="2" y="2" width="' + w + '" height="' + h + '" rx="3"/>';
    return s + '</svg>';
  }
  // несколько полосок одинаковой длины одна под другой: rows = [[d,k,k2], ...]
  function svgRows(rows) {
    const W = 320, RH = 40, G = 14, H = rows.length * RH + (rows.length - 1) * G + 4;
    let s = '<svg class="vis" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Полоски одинаковой длины">';
    rows.forEach(function (r, ri) {
      const d = r[0], k = r[1] || 0, k2 = r[2] || 0, y = 2 + ri * (RH + G), w = W - 4, cw = w / d;
      for (let i = 0; i < d; i++) s += '<rect class="' + cls(i, k, k2) + '" x="' + (2 + i * cw).toFixed(2) + '" y="' + y + '" width="' + cw.toFixed(2) + '" height="' + RH + '"/>';
      for (let i = 1; i < d; i++) s += '<line class="sep" x1="' + (2 + i * cw).toFixed(2) + '" y1="' + y + '" x2="' + (2 + i * cw).toFixed(2) + '" y2="' + (y + RH) + '"/>';
      s += '<rect class="frame" x="2" y="' + y + '" width="' + w + '" height="' + RH + '" rx="3"/>';
    });
    return s + '</svg>';
  }
  function svgCircle(d, k, k2, opt) {
    k2 = k2 || 0; opt = opt || {};
    const S = opt.s || 140, r = S / 2 - 4, c = S / 2;
    let s = '<svg class="vis" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Круг из ' + d + ' частей">';
    if (d === 1) {
      s += '<circle class="' + (k >= 1 ? 'sa' : 'se') + '" cx="' + c + '" cy="' + c + '" r="' + r + '"/>';
    } else {
      for (let i = 0; i < d; i++) {
        const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / d, a1 = a0 + (2 * Math.PI) / d;
        const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0), x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1);
        s += '<path class="' + cls(i, k, k2) + ' wedge" d="M' + c + ',' + c + ' L' + x0.toFixed(2) + ',' + y0.toFixed(2) +
          ' A' + r + ',' + r + ' 0 0 1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' Z"/>';
      }
    }
    s += '<circle class="frame" cx="' + c + '" cy="' + c + '" r="' + r + '"/>';
    return s + '</svg>';
  }
  // несколько кругов по d частей, закрашено total частей
  function svgCircles(d, total, opt) {
    const S = (opt && opt.s) || 96, n = Math.max(1, Math.ceil(total / d));
    let out = '<div class="vis-row">';
    for (let i = 0; i < n; i++) out += svgCircle(d, Math.max(0, Math.min(d, total - i * d)), 0, { s: S });
    return out + '</div>';
  }
  // модель площади для умножения: rows x cols, закрашены sr строк и sc столбцов
  function svgGrid(rows, cols, sr, sc) {
    const W = 240, H = 160, cw = W / cols, rh = H / rows;
    let s = '<svg class="vis" viewBox="-2 -2 ' + (W + 4) + ' ' + (H + 4) + '" width="' + (W + 4) + '" height="' + (H + 4) + '" role="img" aria-label="Прямоугольник ' + rows + ' на ' + cols + '">';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const inR = r < sr, inC = c < sc;
      const k = inR && inC ? 'sab' : inC ? 'sb' : inR ? 'sa2' : 'se';
      s += '<rect class="' + k + '" x="' + (c * cw).toFixed(2) + '" y="' + (r * rh).toFixed(2) + '" width="' + cw.toFixed(2) + '" height="' + rh.toFixed(2) + '"/>';
    }
    for (let c = 1; c < cols; c++) s += '<line class="sep" x1="' + (c * cw).toFixed(2) + '" y1="0" x2="' + (c * cw).toFixed(2) + '" y2="' + H + '"/>';
    for (let r = 1; r < rows; r++) s += '<line class="sep" x1="0" y1="' + (r * rh).toFixed(2) + '" x2="' + W + '" y2="' + (r * rh).toFixed(2) + '"/>';
    s += '<rect class="frame" x="0" y="0" width="' + W + '" height="' + H + '"/>';
    return s + '</svg>';
  }

  // координатный луч на бумаге в клетку: unit клеток в единичном отрезке, units единиц,
  // points = [{at: число клеток от нуля, label: 'A'}]
  function svgRay(unit, units, points) {
    const C = 16, len = unit * units, cells = len + 3, W = (cells + 1) * C, H = 5 * C, x0 = C, y = 3 * C;
    let s = '<svg class="vis ray" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Координатный луч, единичный отрезок ' + unit + ' клеток">';
    for (let i = 0; i <= cells + 1; i++) s += '<line class="cell" x1="' + i * C + '" y1="0" x2="' + i * C + '" y2="' + H + '"/>';
    for (let j = 0; j <= 5; j++) s += '<line class="cell" x1="0" y1="' + j * C + '" x2="' + W + '" y2="' + j * C + '"/>';
    const xe = x0 + (len + 2) * C;
    s += '<line class="ray-line" x1="' + x0 + '" y1="' + y + '" x2="' + xe + '" y2="' + y + '"/>';
    s += '<path class="ray-arrow" d="M' + (xe + 6) + ',' + y + ' L' + (xe - 4) + ',' + (y - 5) + ' L' + (xe - 4) + ',' + (y + 5) + ' Z"/>';
    for (let i = 0; i <= len + 1; i++) {
      const x = x0 + i * C, big = i % unit === 0, h = big ? 7 : 4;
      s += '<line class="tick' + (big ? ' big' : '') + '" x1="' + x + '" y1="' + (y - h) + '" x2="' + x + '" y2="' + (y + h) + '"/>';
      if (big) s += '<text class="ray-num" x="' + x + '" y="' + (y + C + 5) + '" text-anchor="middle">' + (i / unit) + '</text>';
    }
    (points || []).forEach(function (p) {
      const x = x0 + p.at * C;
      s += '<circle class="ray-pt" cx="' + x + '" cy="' + y + '" r="4.5"/>';
      s += '<text class="ray-lbl" x="' + x + '" y="' + (y - C + 1) + '" text-anchor="middle">' + esc(p.label) + '</text>';
    });
    return s + '</svg>';
  }

  /* ---------- конструкторы задач ---------- */
  function base(opt) {
    opt = opt || {};
    return { visual: opt.visual || '', hints: opt.hints || [], solution: opt.solution || '', unit: opt.unit || '' };
  }
  function uniq(options) {
    const seen = new Set(), out = [];
    options.forEach(function (o) { if (!seen.has(o)) { seen.add(o); out.push(o); } });
    return out;
  }
  // options[0] - верный вариант; порядок перемешивается
  function qChoice(prompt, options, opt) {
    const correct = options[0];
    const list = (opt && opt.keepOrder) ? uniq(options) : shuffle(uniq(options));
    return Object.assign({ kind: 'choice', prompt: prompt, options: list, answer: list.indexOf(correct) }, base(opt));
  }
  function qSign(prompt, sign, opt) {
    const list = ['>', '<', '='];
    return Object.assign({ kind: 'choice', prompt: prompt, options: list, answer: list.indexOf(sign), signs: true }, base(opt));
  }
  function qNum(prompt, value, opt) { return Object.assign({ kind: 'number', prompt: prompt, answer: value }, base(opt)); }
  function qFrac(prompt, f, opt) {
    f = F(f);
    return Object.assign({ kind: 'fraction', prompt: prompt, answer: { n: f.n, d: f.d }, form: (opt && opt.form) || {} }, base(opt));
  }
  function qYes(prompt, v, opt) { return Object.assign({ kind: 'yesno', prompt: prompt, answer: !!v }, base(opt)); }
  function qSteps(prompt, steps, opt) {
    return Object.assign({ kind: 'steps', prompt: prompt, steps: steps, result: (opt && opt.result) || '' }, base(opt));
  }
  function sNum(prompt, value, hints) { return { kind: 'number', prompt: prompt, answer: value, hints: hints || [] }; }
  function sFrac(prompt, f, form, hints) { f = F(f); return { kind: 'fraction', prompt: prompt, answer: { n: f.n, d: f.d }, form: form || {}, hints: hints || [] }; }
  function sSign(prompt, sign, hints) { const list = ['>', '<', '=']; return { kind: 'choice', prompt: prompt, options: list, answer: list.indexOf(sign), signs: true, hints: hints || [] }; }

  /* ---------- проверка ответа ---------- */
  function empty(v) { return v === undefined || v === null || String(v).trim() === ''; }
  function parseNum(s) {
    s = String(s === undefined || s === null ? '' : s).trim().replace(/^[−–]/, '-');
    if (!/^-?\d{1,7}$/.test(s)) return null;
    return parseInt(s, 10);
  }
  // десятичная запись: -2,5 или 2.5 -> Frac
  function parseDec(s) {
    s = String(s === undefined || s === null ? '' : s).trim().replace(/^[−–]/, '-').replace('.', ',');
    const m = s.match(/^(-?)(\d{1,7})(?:,(\d{1,6}))?$/);
    if (!m) return null;
    const frac = m[3] || '', den = Math.pow(10, frac.length);
    const n = parseInt(m[2], 10) * den + (frac ? parseInt(frac, 10) : 0);
    return new Frac(m[1] ? -n : n, den).red();
  }
  function checkAnswer(spec, input) {
    if (spec.kind === 'number') {
      if (spec.dec || (spec.answer && typeof spec.answer === 'object')) {
        const fv = parseDec(input);
        if (fv === null) return { ok: false, invalid: true, msg: 'Введи число. Дробную часть пиши после запятой.' };
        return { ok: fv.eq(F(spec.answer)) };
      }
      const v = parseNum(input);
      if (v === null) return { ok: false, invalid: true, msg: String(input || '').indexOf(',') >= 0 ? 'Здесь ответ без запятой.' : 'Введи число цифрами.' };
      return { ok: v === spec.answer };
    }
    if (spec.kind === 'yesno' || spec.kind === 'choice') return { ok: input === spec.answer };
    if (spec.kind === 'fraction') return checkFrac(spec, input || {});
    return { ok: false };
  }
  function checkFrac(spec, inp) {
    const wE = empty(inp.w), nE = empty(inp.n), dE = empty(inp.d);
    const w = wE ? 0 : parseNum(inp.w);
    if (w === null || w < 0) return { ok: false, invalid: true, msg: 'Целая часть должна быть числом.' };
    let val, n = 0, d = 1;
    if (nE && dE) {
      if (wE) return { ok: false, invalid: true, msg: 'Сначала впиши ответ.' };
      val = F(w, 1);
    } else {
      n = parseNum(inp.n); d = parseNum(inp.d);
      if (n === null || d === null || n < 0) return { ok: false, invalid: true, msg: 'Впиши числитель и знаменатель.' };
      if (d === 0) return { ok: false, invalid: true, msg: 'Знаменатель не может быть нулём.' };
      val = F(w * d + n, d);
    }
    const neg = inp.s === '-' || inp.s === '−';
    if (neg) val = val.mul(-1);
    const exp = F(spec.answer);
    if (!val.eq(exp)) return { ok: false };
    const form = spec.form || {};
    const hasW = !wE && w !== 0;
    if (form.den && !nE && d !== form.den) return { ok: false, partial: true, msg: 'Величина верная. Нужен знаменатель ' + form.den + '.' };
    if (form.reduced && !nE && gcd(n, d) > 1) return { ok: false, partial: true, msg: 'Почти. Эту дробь можно сократить ещё.' };
    if (form.mixed && !nE && n >= d) return { ok: false, partial: true, msg: 'Величина верная. Теперь выдели целую часть.' };
    if (form.improper && hasW) return { ok: false, partial: true, msg: 'Величина верная. Запиши ответ без целой части.' };
    let note = '';
    if (!form.den && !form.improper) {
      const canon = mk(neg ? val.mul(-1).red() : val.red(), true);
      const given = nE ? String(w) : (hasW ? mx(w, n, d) : fr(n, d));
      if (canon !== given) note = 'Можно записать короче: ' + canon + '.';
    }
    return { ok: true, note: note };
  }

  Object.assign(M, {
    rint: rint, pick: pick, shuffle: shuffle, gcd: gcd, lcm: lcm, Frac: Frac, F: F,
    fr: fr, mx: mx, mk: mk, esc: esc, toHTML: toHTML, plural: plural, pl: pl,
    numWords: numWords, ordFem: ordFem, ordGen: ordGen, fracWords: fracWords, speech: speech,
    svgBar: svgBar, svgRows: svgRows, svgCircle: svgCircle, svgCircles: svgCircles, svgGrid: svgGrid, svgRay: svgRay,
    qChoice: qChoice, qSign: qSign, qNum: qNum, qFrac: qFrac, qYes: qYes, qSteps: qSteps,
    sNum: sNum, sFrac: sFrac, sSign: sSign, checkAnswer: checkAnswer, parseNum: parseNum, parseDec: parseDec
  });
})();
