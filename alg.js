/* alg.js - выражения с буквами для 6 класса.
   Запись выражений, разбор ответа ученика, задачи с вводом выражения. */
(function () {
  'use strict';
  const M = globalThis.M;
  const F = M.F, MIN = M.MINUS;

  /* ---------- разбор ввода ---------- */
  // '8a-5', '-a+2,5b', '3' -> слагаемые [{v, c, one, zero}] или null
  function parseExpr(s) {
    s = String(s === undefined || s === null ? '' : s).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/\./g, ',');
    if (!s) return null;
    const out = [];
    let i = 0;
    while (i < s.length) {
      let sign = 1;
      if (s[i] === '+' || s[i] === '-') { sign = s[i] === '-' ? -1 : 1; i++; }
      else if (out.length) return null;
      const m = /^(\d{1,7}(?:,\d{1,6})?)?([a-z])?/.exec(s.slice(i));
      if (!m[0]) return null;
      const num = m[1] ? M.parseDec(m[1]) : null;
      if (m[1] && !num) return null;
      out.push({ v: m[2] || '', c: (num || F(1)).mul(sign), one: !!(m[1] && m[2] && num.eq(F(1))), zero: !!(num && num.n === 0) });
      i += m[0].length;
    }
    return out;
  }
  // слагаемые -> {k: {a: Frac}, c: Frac}
  function linOf(terms) {
    const k = {};
    let c = F(0);
    terms.forEach(function (t) { if (t.v) k[t.v] = (k[t.v] || F(0)).add(t.c); else c = c.add(t.c); });
    return { k: k, c: c };
  }
  function linEq(A, B) {
    const vs = Object.keys(A.k).concat(Object.keys(B.k));
    for (let i = 0; i < vs.length; i++) if (!(A.k[vs[i]] || F(0)).eq(B.k[vs[i]] || F(0))) return false;
    return A.c.eq(B.c);
  }

  /* ---------- запись ---------- */
  function num(x) { return M.rk(M.absF(x), { dec: true }); }
  // одно слагаемое без знака: 3a, a, 0,5x, 7
  function body(c, v) {
    const a = M.absF(c);
    if (v) return (a.n === a.d ? '' : num(a)) + v;
    return num(a);
  }
  // список [[коэффициент, буква], ...] в порядке записи: 3a + 5a − 2
  function ex(list) {
    const parts = list.filter(function (p) { return F(p[0]).n !== 0; });
    if (!parts.length) return '0';
    return parts.map(function (p, i) {
      const c = F(p[0]), neg = c.n < 0;
      return (i === 0 ? (neg ? MIN : '') : (neg ? ' ' + MIN + ' ' : ' + ')) + body(c, p[1] || '');
    }).join('');
  }
  // словарь {a: 3, b: -2, '': 5} -> список в обычном порядке: буквы по алфавиту, потом число
  function listOf(map) {
    const vs = Object.keys(map).filter(function (v) { return v !== ''; }).sort();
    const list = vs.map(function (v) { return [map[v], v]; });
    if (map[''] !== undefined) list.push([map[''], '']);
    return list;
  }
  function show(map) { return ex(listOf(map)); }
  // ответ в записи ввода: 3a-2b+5; ansList сохраняет порядок слагаемых: 24-c
  function ansList(list) {
    const l = list.filter(function (p) { return F(p[0]).n !== 0; });
    if (!l.length) return '0';
    return l.map(function (p, i) {
      const c = F(p[0]), b = body(c, p[1] || '');
      if (b.indexOf('{') >= 0) throw new Error('Ответ должен быть десятичной дробью: ' + ex(list));
      return (c.n < 0 ? '-' : (i ? '+' : '')) + b;
    }).join('');
  }
  function ans(map) { return ansList(listOf(map)); }
  // запись ввода -> текст: 3a - 2b+5 -> 3a − 2b + 5
  function pretty(s) {
    const t = parseExpr(s);
    if (!t) return String(s);
    return ex(t.map(function (x) { return [x.c, x.v]; }));
  }
  // множитель перед скобкой: 3(a + 4), −2(x − 1), −(b + 5)
  function mulBr(k, list) {
    const c = F(k);
    const head = c.eq(F(1)) ? '' : c.eq(F(-1)) ? MIN : (c.n < 0 ? MIN : '') + num(c);
    return head + '(' + ex(list) + ')';
  }
  // значение выражения при значениях букв
  function valueOf(map, vals) {
    let s = F(0);
    Object.keys(map).forEach(function (v) { s = s.add(v === '' ? F(map[v]) : F(map[v]).mul(F(vals[v]))); });
    return s;
  }
  // сложение словарей: add({a: 2}, {a: 3, '': 1}, -1) -> {a: -1, '': -1}
  function addMap(A, B, k) {
    const out = {}, kk = F(k === undefined ? 1 : k);
    Object.keys(A).forEach(function (v) { out[v] = F(A[v]); });
    Object.keys(B).forEach(function (v) { out[v] = (out[v] || F(0)).add(F(B[v]).mul(kk)); });
    return out;
  }
  function scale(A, k) { return addMap({}, A, k); }

  // буквы для клавиатуры: из условия и из ответа, по алфавиту
  function varsOf(prompt, answer, extra) {
    const set = {};
    String(prompt + ' ' + answer).replace(/(^|[^A-Za-z])([a-z]{1,3})(?![A-Za-z])/g, function (m, p, w) { w.split('').forEach(function (l) { set[l] = 1; }); return m; });
    (extra || []).forEach(function (l) { set[l] = 1; });
    return Object.keys(set).sort().slice(0, 3);
  }

  /* ---------- задачи с вводом выражения ---------- */
  // answer: словарь {a: 3, '': -5} или запись ввода '3a-5'; opt.any - подойдёт любая равная запись
  function qExpr(prompt, answer, opt) {
    opt = opt || {};
    const a = typeof answer === 'string' ? answer : ans(answer);
    return { kind: 'expr', prompt: prompt, answer: a, vars: varsOf(prompt, a, opt.vars), form: { any: !!opt.any },
      visual: opt.visual || '', hints: opt.hints || [], solution: opt.solution || '', unit: '' };
  }
  function sExpr(prompt, answer, hints, opt) {
    opt = opt || {};
    const a = typeof answer === 'string' ? answer : ans(answer);
    return { kind: 'expr', prompt: prompt, answer: a, vars: varsOf(prompt, a, opt.vars), form: { any: !!opt.any }, hints: hints || [] };
  }
  // шаг с выбором: верный вариант первый, порядок перемешивается
  function sChoice(prompt, options, hints, keep) {
    const q = M.qChoice(prompt, options, { keepOrder: !!keep, hints: hints });
    return { kind: 'choice', prompt: prompt, options: q.options, answer: q.answer, hints: hints || [] };
  }
  function sYes(prompt, v, hints) { return { kind: 'yesno', prompt: prompt, answer: !!v, hints: hints || [] }; }

  // в задаче по шагам буквы для клавиатуры берём и из общего условия
  const qSteps0 = M.qSteps;
  function qSteps(prompt, steps, opt) {
    steps.forEach(function (s) { if (s.kind === 'expr') s.vars = varsOf(prompt + ' ' + s.prompt, s.answer, s.vars); });
    return qSteps0(prompt, steps, opt);
  }

  function checkExpr(spec, input) {
    const s = String(input === undefined || input === null ? '' : input).trim();
    if (!s) return { ok: false, invalid: true, msg: 'Сначала впиши ответ.' };
    const t = parseExpr(s);
    if (!t) return { ok: false, invalid: true, msg: 'Запиши выражение до конца.' };
    const got = linOf(t), exp = linOf(parseExpr(spec.answer));
    if (!linEq(got, exp)) return { ok: false };
    if (!(spec.form && spec.form.any)) {
      const seen = {};
      let rep = false;
      t.forEach(function (x) { const key = x.v || '#'; if (seen[key]) rep = true; seen[key] = 1; });
      if (rep) return { ok: false, partial: true, msg: 'Выражение верное. Теперь приведи подобные слагаемые.' };
      if (t.some(function (x) { return x.zero; }) && (t.length > 1 || t[0].v)) return { ok: false, partial: true, msg: 'Выражение верное. Слагаемое с нулём не пишут.' };
    }
    const note = t.some(function (x) { return x.one; }) ? 'Коэффициент 1 обычно не пишут: ' + pretty(spec.answer) + '.' : '';
    return { ok: true, note: note };
  }

  /* ---------- рисунки ---------- */
  // таблица значений: rows = [['a', 1, 2, 3], ['5a', 5, 10, 15]]; '?' - пустая клетка
  function vtab(rows, aria) {
    return '<div class="vis-row"><table class="vtab" aria-label="' + M.esc(aria || 'Таблица значений') + '">' + rows.map(function (r) {
      return '<tr>' + r.map(function (c, i) {
        const t = typeof c === 'string' ? c : M.rk(c, { dec: true });
        return i === 0 ? '<th>' + M.toHTML(t) + '</th>' : '<td' + (t === '?' ? ' class="q"' : '') + '>' + M.toHTML(t) + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</table></div>';
  }
  // плитки на бумаге в клетку: rows = [[{k: 3, v: 'a'}, '+', {k: 2, v: 'a'}], ['=', {k: 5, v: 'a'}]]
  // буква - квадрат 2 на 2 клетки, число - одна клетка; минус - белая плитка с красной рамкой
  function svgTiles(rows, aria) {
    const C = 14;
    const widthOf = function (it) {
      if (typeof it === 'string') return 2;
      const n = Math.abs(it.k);
      return it.v ? n * 2 + (n - 1) * 0.5 : n + (n - 1) * 0.5;
    };
    const rowW = rows.map(function (r) { return r.reduce(function (s, it, i) { return s + widthOf(it) + (i ? 1 : 0); }, 0); });
    const cols = Math.ceil(Math.max.apply(null, rowW)) + 2, H = rows.length * 3 + 1;
    let s = '<svg class="vis tiles" viewBox="0 0 ' + cols * C + ' ' + H * C + '" width="' + cols * C + '" height="' + H * C + '" role="img" aria-label="' + M.esc(aria || 'Плитки') + '">';
    for (let i = 0; i <= cols; i++) s += '<line class="cell" x1="' + i * C + '" y1="0" x2="' + i * C + '" y2="' + H * C + '"/>';
    for (let j = 0; j <= H; j++) s += '<line class="cell" x1="0" y1="' + j * C + '" x2="' + cols * C + '" y2="' + j * C + '"/>';
    rows.forEach(function (r, ri) {
      let x = 1;
      const top = (ri * 3 + 1) * C;
      r.forEach(function (it, i) {
        if (i) x += 1;
        if (typeof it === 'string') {
          s += '<text class="ts" x="' + (x + 1) * C + '" y="' + (top + C + 6) + '" text-anchor="middle">' + M.esc(it === '-' ? MIN : it) + '</text>';
          x += 2; return;
        }
        const n = Math.abs(it.k), neg = it.k < 0;
        for (let t = 0; t < n; t++) {
          if (it.v) {
            s += '<rect class="' + (neg ? 'tvn' : 'tv') + '" x="' + x * C + '" y="' + top + '" width="' + 2 * C + '" height="' + 2 * C + '" rx="3"/>';
            s += '<text class="tl" x="' + (x + 1) * C + '" y="' + (top + C + 6) + '" text-anchor="middle">' + (neg ? MIN : '') + it.v + '</text>';
            x += 2;
          } else {
            s += '<rect class="' + (neg ? 'tun' : 'tu') + '" x="' + x * C + '" y="' + (top + C / 2) + '" width="' + C + '" height="' + C + '" rx="2"/>';
            if (neg) s += '<line class="tun-m" x1="' + (x * C + 3) + '" y1="' + (top + C) + '" x2="' + (x * C + C - 3) + '" y2="' + (top + C) + '"/>';
            x += 1;
          }
          if (t < n - 1) x += 0.5;
        }
      });
    });
    return s + '</svg>';
  }

  Object.assign(M, {
    qSteps: qSteps, vtab: vtab, svgTiles: svgTiles,
    parseExpr: parseExpr, checkExpr: checkExpr, prettyExpr: pretty, qExpr: qExpr, sExpr: sExpr, sChoice: sChoice, sYes: sYes,
    ALG: { parse: parseExpr, lin: linOf, linEq: linEq, ex: ex, show: show, ans: ans, ansList: ansList, pretty: pretty, mulBr: mulBr, valueOf: valueOf,
      addMap: addMap, scale: scale, listOf: listOf, num: num, body: body }
  });
})();
