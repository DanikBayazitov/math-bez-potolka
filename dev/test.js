/* Проверка содержания и движка в Node: node test.js */
'use strict';
const path = require('path');
const APP = process.env.APP || path.join(__dirname, '..');
require(path.join(APP, 'frac.js'));
require(path.join(APP, 'rat.js'));
require(path.join(APP, 'alg.js'));
require(path.join(APP, 'content.js'));
require(path.join(APP, 'content2.js'));
require(path.join(APP, 'content3.js'));
require(path.join(APP, 'content6a.js'));
['content6b.js', 'content6c.js', 'content6d.js'].forEach(function (f) { if (require('fs').existsSync(path.join(APP, f))) require(path.join(APP, f)); });
require(path.join(APP, 'grades.js'));
require(path.join(APP, 'engine.js'));
const M = globalThis.M, E = M.E;

let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; if (fails < 60 || process.env.ALLF) console.log("FAIL:", msg); } }
function bad(s) { return /undefined|NaN|null|\[object|Infinity/.test(String(s)); }
function balanced(s) { let d = 0; for (const ch of String(s)) { if (ch === '{') d++; if (ch === '}') d--; if (d < 0 || d > 1) return false; } return d === 0; }
function zeroDen(s) { return /\{[^{}]*\/0\}/.test(String(s)); }

function correctInput(spec) {
  if (spec.kind === 'number') return typeof spec.answer === 'object' ? M.rk(spec.answer, { dec: true }).replace('−', '-') : String(spec.answer);
  if (spec.kind === 'choice' || spec.kind === 'yesno') return spec.answer;
  if (spec.kind === 'expr') return spec.answer;
  if (spec.kind === 'fraction') {
    const f0 = M.F(spec.answer), s = f0.n < 0 ? '-' : '', f = M.absF(f0), form = spec.form || {};
    if (form.den) { const n = f.n * form.den / f.d; return { n: String(n), d: String(form.den), s: s }; }
    if (form.reduced) { const r = f.red(); return { n: String(r.n), d: String(r.d), s: s }; }
    if (form.mixed) { const r = f.red(); const w = Math.floor(r.n / r.d); return { w: String(w), n: String(r.n % r.d), d: String(r.d), s: s }; }
    return { n: String(f.n), d: String(f.d), s: s };
  }
  return null;
}
function checkSpec(spec, where, top) {
  ok(['choice', 'number', 'fraction', 'yesno', 'steps', 'expr'].indexOf(spec.kind) >= 0, where + ' kind ' + spec.kind);
  const texts = [spec.prompt].concat(spec.hints || [], spec.solution ? [spec.solution] : [], spec.result ? [spec.result] : [], spec.options || []);
  texts.forEach(function (t) {
    ok(typeof t === 'string', where + ' text type');
    ok(!bad(t), where + ' bad text: ' + t);
    ok(balanced(t), where + ' braces: ' + t);
    ok(!zeroDen(t), where + ' zero den: ' + t);
    ok(M.toHTML(t).indexOf('{') < 0, where + ' markup left: ' + t);
    ok(M.speech(t).indexOf('{') < 0, where + ' speech markup: ' + t);
    ok(!/[—–]/.test(t), where + ' long dash: ' + t);
  });
  ok(spec.prompt && spec.prompt.length > 3, where + ' prompt');
  if (spec.kind !== 'steps') ok((spec.hints || []).length === 3, where + ' hints count ' + (spec.hints || []).length + ' ' + spec.prompt);
  if (spec.kind === 'choice') {
    ok(spec.options.length >= 2, where + ' options ' + spec.options.join('|'));
    ok(spec.answer >= 0 && spec.answer < spec.options.length, where + ' answer index ' + spec.answer + ' ' + spec.prompt);
    ok(new Set(spec.options).size === spec.options.length, where + ' unique options');
  }
  if (spec.kind === 'number') {
    if (spec.neg) ok(typeof spec.answer === 'object' ? (Number.isInteger(spec.answer.n) && spec.answer.d > 0 && M.isDecimal(spec.answer)) : (Number.isInteger(spec.answer) && Math.abs(spec.answer) < 1e7), where + ' signed number answer ' + JSON.stringify(spec.answer) + ' ' + spec.prompt);
    else ok(Number.isInteger(spec.answer) && spec.answer >= 0 && spec.answer < 1e7, where + ' number answer ' + spec.answer + ' ' + spec.prompt);
  }
  if (spec.kind === 'yesno') ok(typeof spec.answer === 'boolean', where + ' yesno');
  if (spec.kind === 'fraction') {
    const a = spec.answer;
    ok(Number.isInteger(a.n) && Number.isInteger(a.d) && a.d > 0 && (a.n >= 0 || spec.neg), where + ' frac answer ' + JSON.stringify(a));
    const f = M.absF(M.F(a)), form = spec.form || {};
    if (form.den) ok((f.n * form.den) % f.d === 0, where + ' den form ' + JSON.stringify(a) + ' ' + form.den);
    if (form.mixed) ok(f.n > f.d && f.n % f.d !== 0, where + ' mixed form ' + JSON.stringify(a) + ' ' + spec.prompt);
    if ((f.n > f.d || form.mixed) && top) ok(spec.withWhole, where + ' withWhole ' + spec.prompt);
  }
  if (spec.kind === 'steps') {
    ok(spec.steps.length >= 2, where + ' steps count');
    spec.steps.forEach(function (s, i) { checkSpec(s, where + ' step' + (i + 1), true); });
  } else {
    const r = M.checkAnswer(spec, correctInput(spec));
    ok(r.ok === true, where + ' correct answer rejected: ' + spec.prompt + ' ' + JSON.stringify(spec.answer) + ' ' + JSON.stringify(r));
    if (spec.kind === 'number') {
      const wrong = typeof spec.answer === 'object' ? M.rk(M.F(spec.answer).add(1), { dec: true }) : String(spec.answer + 1);
      ok(M.checkAnswer(spec, wrong).ok === false, where + ' wrong accepted');
      if (spec.neg && (typeof spec.answer === 'object' ? spec.answer.n !== 0 : spec.answer !== 0)) {
        const flip = typeof spec.answer === 'object' ? M.rk(M.F(spec.answer).mul(-1), { dec: true }) : String(-spec.answer);
        ok(M.checkAnswer(spec, flip).ok === false, where + ' wrong sign accepted');
      }
    }
    if (spec.kind === 'expr') {
      const t = M.parseExpr(spec.answer);
      ok(!!t && t.every(function (x) { return M.isDecimal(x.c); }), where + ' expr answer ' + spec.answer);
      ok(Array.isArray(spec.vars) && spec.vars.length >= 1 && spec.vars.length <= 3, where + ' expr vars ' + JSON.stringify(spec.vars));
      if (t) {
        t.forEach(function (x) { if (x.v) ok(spec.vars.indexOf(x.v) >= 0, where + ' expr letter on keypad ' + x.v); });
        // поменяем число в ответе: это должно быть неверно
        const lin = M.ALG.lin(t), keys = Object.keys(lin.k);
        const wrong = M.ALG.ans(Object.assign({ '': lin.c.add(1) }, keys.reduce(function (o, k) { o[k] = lin.k[k]; return o; }, {})));
        ok(M.checkAnswer(spec, wrong).ok === false, where + ' expr wrong accepted ' + wrong);
        if (keys.length) {
          const k0 = keys[0], w2 = {}; keys.forEach(function (k) { w2[k] = k === k0 ? lin.k[k].mul(-1) : lin.k[k]; }); w2[''] = lin.c;
          if (lin.k[k0].n !== 0) ok(M.checkAnswer(spec, M.ALG.ans(w2)).ok === false, where + ' expr wrong sign accepted');
        }
        // запись в другом порядке тоже верна
        const rev = spec.answer.replace(/^\+/, '').match(/[+-]?[^+-]+/g).reverse().map(function (p, i) { return i === 0 ? p.replace(/^\+/, '') : (/^[+-]/.test(p) ? p : '+' + p); }).join('');
        ok(M.checkAnswer(spec, rev).ok === true, where + ' expr other order rejected ' + rev + ' for ' + spec.answer);
      }
    }
    if (spec.kind === 'fraction' && spec.neg && M.F(spec.answer).n !== 0) {
      const ci = correctInput(spec); ci.s = ci.s ? '' : '-';
      ok(M.checkAnswer(spec, ci).ok === false, where + ' fraction wrong sign accepted');
    }
  }
}

/* 1. генераторы */
const INT = ['football', 'games', 'animals', 'drawing', 'music', 'cooking', 'space', 'cars'];
let generated = 0;
M.TOPICS.forEach(function (t) {
  ok(t.codes && t.codes.length, t.id + ' codes');
  ok(t.dates && t.dates.length === 2, t.id + ' dates');
  ok(t.diag && t.steps[t.diag[0]] && t.steps[t.diag[0]].gens[t.diag[1]], t.id + ' diag item');
  t.prereq.forEach(function (p) { ok(M.TOPICS.findIndex(x => x.id === p) < M.TOPICS.indexOf(t), t.id + ' prereq order ' + p); });
  ok(t.steps.length === 5, t.id + ' 5 steps');
  const stepsAll = t.steps.map(function (s) { return s.gens.length; }).concat([t.deep.length]);
  stepsAll.forEach(function (n, si) {
    for (let gi = 0; gi < n; gi++) {
      for (let k = 0; k < 300; k++) {
        const ctx = { interests: INT.filter(() => Math.random() < 0.3).slice(0, 3), g: Math.random() < 0.5 ? 'm' : 'f' };
        const seed = 1 + Math.floor(Math.random() * 2e9);
        let q;
        try { q = M.makeQuestion(t.id, si + 1, ctx, gi, seed); } catch (e) { ok(false, t.id + ' s' + (si + 1) + ' g' + gi + ' throws ' + e.message); continue; }
        generated++;
        checkSpec(q, t.id + ' s' + (si + 1) + ' g' + gi, true);
        if (k < 5) {
          const q2 = M.makeQuestion(t.id, si + 1, ctx, gi, seed);
          ok(q2.prompt === q.prompt && JSON.stringify(q2.answer) === JSON.stringify(q.answer), t.id + ' determinism');
        }
      }
    }
  });
  t.steps.forEach(function (s, si) {
    [[], ['football'], ['games'], ['cars', 'games']].forEach(function (ints) {
      const ex = M.explainFor(t.id, si + 1, { interests: ints, g: 'm' });
      ok(ex.text.length >= 2 && ex.text.every(x => typeof x === 'string' && !bad(x) && balanced(x) && !/[—–]/.test(x)), t.id + ' explain ' + (si + 1));
      ok(typeof ex.visual === 'string', t.id + ' visual');
    });
  });
});
console.log('generated', generated);
ok(!M._lineOut, 'points outside the coordinate line: ' + (M._lineOut || 0));

/* 1б. лестница «проще» */
let walks = 0;
function okText(t, where) {
  ok(typeof t === 'string' && t.length > 0, where + ' text');
  ok(!bad(t) && balanced(t) && !zeroDen(t) && !/[—–]/.test(t), where + ' text quality: ' + t);
  ok(M.toHTML(t).indexOf('{') < 0 && M.speech(t).indexOf('{') < 0, where + ' markup: ' + t);
}
M.TOPICS.forEach(function (t) {
  t.steps.forEach(function (st, i) {
    const w = t.id + ' s' + (i + 1);
    ok(Array.isArray(st.simple) && st.simple.length >= 2, w + ' simple');
    (st.simple || []).forEach(function (x) { okText(x, w + ' simple'); });
    ok(typeof st.walk === 'function', w + ' walk');
    const list = st.walk ? st.walk() : [];
    ok(list.length >= 3, w + ' walk length');
    ok(list.some(function (m) { return m.ask; }), w + ' walk has a question');
    list.forEach(function (m, j) {
      ok(m.say || m.ask, w + ' walk item ' + j);
      if (m.say) okText(m.say, w + ' walk say');
      if (m.vis) ok(typeof m.vis === 'string' && m.vis.indexOf('<svg') >= 0 || m.vis.indexOf('vis-row') >= 0, w + ' walk vis');
      if (m.ask) {
        okText(m.ask.q, w + ' walk q');
        ok(Array.isArray(m.ask.o) && m.ask.o.length >= 2 && new Set(m.ask.o).size === m.ask.o.length, w + ' walk options');
        m.ask.o.forEach(function (o) { okText(o, w + ' walk option'); });
      }
      walks++;
    });
    [0, 1, 2].forEach(function (l) { const L = M.levelFor(t.id, i + 1, l, { interests: ['games'] }); ok(L.lvl === l, w + ' level ' + l); });
  });
});
console.log('walk items', walks);

/* 2. движок: моделируем ученика */
function onlyGrade(st, g) { return Object.keys(st.topics).filter(function (id) { const s = st.topics[id]; return s.status !== 'new' && M.topicById(id).grade !== g; }); }
function sim(opts) {
  const st = E.newState();
  let now = new Date(2026, 10, 21, 16, 0, 0).getTime();
  E.onboard(st, { nick: 'Тест', grade: opts.grade || 5, g: 'm', interests: ['football'] }, now);
  let steps = 0, day = 0, done = false;
  const seen = {};
  while (steps < opts.max && !done) {
    steps++;
    now += 40000;
    E.touch(st, now);
    const card = E.next(st, now);
    seen[card.type + (card.mode ? ':' + card.mode : '')] = (seen[card.type + (card.mode ? ':' + card.mode : '')] || 0) + 1;
    if (card.type === 'task') {
      ok(card.q && card.q.prompt, 'task has q');
      const res = opts.answer(card, st);
      E.answer(st, card, { res: res, wrong: res === 2 ? 0 : res === 1 ? 1 : 3, hints: res === 1 ? 1 : 0, ms: 20000 }, now);
    } else if (card.type === 'explain') {
      ok(typeof card.lvl === 'number' || card.lvl === undefined, 'explain lvl');
      E.explained(st, card, opts.simpler && Math.random() < opts.simpler ? 'simpler' : 'ok', now);
    } else if (card.type === 'closed') {
      const r = Math.random();
      if (r < (opts.deep || 0)) E.choice(st, 'deep', card.topic);
      else if (r < (opts.deep || 0) + (opts.prac || 0)) E.practice(st, card.topic);
      else if (r < (opts.deep || 0) + 2 * (opts.prac || 0)) E.relearn(st, card.topic);
      else E.choice(st, 'next', card.topic);
    } else if (card.type === 'break') {
      if (card.reason === 'time' || Math.random() < 0.5) { now += 20 * 3600000; day++; }
    } else if (card.type === 'done') {
      done = true;
    } else if (card.type === 'info' || card.type === 'diag-done') {
      /* дальше */
    } else ok(false, 'unknown card ' + card.type);
    if (steps % opts.perDay === 0) { now += 20 * 3600000; day++; }
    // инварианты
    Object.keys(st.topics).forEach(function (id) {
      const s = st.topics[id];
      ok(['new', 'learning', 'today', 'closed', 'known'].indexOf(s.status) >= 0, 'status ' + s.status);
      ok(s.step >= 1 && s.step <= 5, 'step range ' + s.step);
      ok(isFinite(s.th), 'theta finite');
    });
  }
  return { st: st, steps: steps, done: done, days: day, seen: seen };
}

// сильный ученик: всегда сразу верно
const strong = sim({ max: 4000, perDay: 60, answer: () => 2 });
const sst = strong.st;
ok(strong.done, 'strong student finishes all topics, steps=' + strong.steps);
ok(sst.diag.n <= 7, 'diag <= 7');
ok(M.topicsOf(5).every(t => ['closed', 'today', 'known'].indexOf(sst.topics[t.id].status) >= 0), 'strong all closed');
ok(M.topicsOf(6).every(t => !sst.topics[t.id]), 'grade 5 student never sees grade 6 topics');
console.log('strong:', strong.steps, 'steps,', strong.days, 'days', JSON.stringify(strong.seen));

// слабый ученик: половина верно, часть с подсказкой, часть с решением
const weak = sim({ max: 6000, perDay: 50, simpler: 0.1, deep: 0.3, prac: 0.2, answer: function () { const r = Math.random(); return r < 0.45 ? 2 : r < 0.75 ? 1 : r < 0.97 ? 0 : -1; } });
console.log('weak:', weak.steps, 'steps,', weak.days, 'days, done=' + weak.done, JSON.stringify(weak.seen));
ok(weak.seen['task:b'] > 0 || weak.seen['info'] > 0, 'weak student sees base checks or infos');
const wst = weak.st;
ok(Object.values(wst.topics).some(s => s.status !== 'new'), 'weak progresses');

// ученик, который учится: умение растёт с каждой задачей по теме
(function () {
  const ab = {};
  const r = sim({ max: 6000, perDay: 45, simpler: 0.03, deep: 0.2, prac: 0.2, answer: function (card) {
    const t = card.topic; ab[t] = ab[t] === undefined ? -1.2 : ab[t] + 0.12;
    const b = card.step === 6 ? 3 : E._.DIFF[card.step - 1];
    const p = 1 / (1 + Math.exp(b - ab[t]));
    const x = Math.random();
    return x < p ? 2 : x < p + (1 - p) * 0.6 ? 1 : 0;
  } });
  const closed = Object.values(r.st.topics).filter(s => s.status === 'closed' || s.status === 'today').length;
  console.log('learner:', r.steps, 'steps,', r.days, 'days, done=' + r.done, 'closed', closed, JSON.stringify(r.seen));
  ok(r.done || closed >= 6, 'learning student progresses');
})();

/* 2б. ученики 6 класса */
(function () {
  const g6 = M.topicsOf(6);
  // сильный: разведка начинается с темы по дате КТП и не трогает 5 класс
  const s6 = sim({ grade: 6, max: 6000, perDay: 60, answer: () => 2 });
  ok(s6.done, 'grade 6 strong finishes, steps=' + s6.steps);
  ok(s6.st.diag.g === 6 && s6.st.diag.n <= 7, 'grade 6 diag');
  ok(g6.every(t => ['closed', 'today', 'known'].indexOf(s6.st.topics[t.id].status) >= 0), 'grade 6 strong all closed');
  ok(onlyGrade(s6.st, 6).length === 0, 'grade 6 strong stays in own grade: ' + onlyGrade(s6.st, 6).join(','));
  console.log('grade6 strong:', s6.steps, 'steps,', s6.days, 'days', JSON.stringify(s6.seen));
  // слабый: может уйти в базу 5 класса и вернуться
  const w6 = sim({ grade: 6, max: 6000, perDay: 50, simpler: 0.15, deep: 0.2, prac: 0.2, answer: function () { const r = Math.random(); return r < 0.4 ? 2 : r < 0.7 ? 1 : r < 0.97 ? 0 : -1; } });
  console.log('grade6 weak:', w6.steps, 'steps,', w6.days, 'days, done=' + w6.done, 'lower-grade topics touched:', onlyGrade(w6.st, 6).join(',') || '-', JSON.stringify(w6.seen));
  ok(Object.values(w6.st.topics).some(s => s.status !== 'new'), 'grade 6 weak progresses');
  // учится постепенно
  const ab = {};
  const l6 = sim({ grade: 6, max: 7000, perDay: 45, simpler: 0.03, deep: 0.2, prac: 0.2, answer: function (card) {
    const t = card.topic; ab[t] = ab[t] === undefined ? -1.2 : ab[t] + 0.12;
    const b = card.step === 6 ? 3 : E._.DIFF[card.step - 1];
    const p = 1 / (1 + Math.exp(b - ab[t])), x = Math.random();
    return x < p ? 2 : x < p + (1 - p) * 0.6 ? 1 : 0;
  } });
  const closed6 = g6.filter(t => l6.st.topics[t.id] && ['closed', 'today'].indexOf(l6.st.topics[t.id].status) >= 0).length;
  console.log('grade6 learner:', l6.steps, 'steps, done=' + l6.done, 'closed', closed6);
  ok(l6.done || closed6 >= 4, 'grade 6 learner progresses');
  // 6 класс, который раньше прошёл разведку по 5 классу, получает новую разведку
  const old = E.newState();
  E.onboard(old, { nick: 'Шестой', grade: 6, g: 'f', interests: [] }, Date.now());
  old.diag.g = undefined; old.diag.done = true;
  const raw = JSON.parse(JSON.stringify(old));
  const migrated = E._.migrate ? E._.migrate(raw) : null;
  if (migrated) ok(migrated.diag.g === 6 && migrated.diag.done === false, 'old grade 6 state gets a new diagnostic');
  // старый прогресс 5 класса (как у Ивана) переживает обновление без потерь
  const s5 = sim({ grade: 5, max: 400, perDay: 40, answer: function () { return Math.random() < 0.8 ? 2 : 0; } }).st;
  delete s5.diag.g;
  const before = JSON.stringify({ d: s5.diag.done, c: s5.current, t: Object.keys(s5.topics).sort().map(k => k + ':' + s5.topics[k].status + '/' + s5.topics[k].step) });
  const m5 = E._.migrate(JSON.parse(JSON.stringify(s5)));
  const after = JSON.stringify({ d: m5.diag.done, c: m5.current, t: Object.keys(m5.topics).sort().map(k => k + ':' + m5.topics[k].status + '/' + m5.topics[k].step) });
  ok(before === after, 'old grade 5 progress is unchanged after migration');
  const n5 = E.next(m5, Date.now());
  ok(n5 && n5.type !== 'onboard' && n5.type !== 'diag', 'old grade 5 learner continues without a new diagnostic: ' + (n5 && n5.type));
  ok(E.scope(m5).every(t => t.grade === 5), 'old grade 5 learner sees only grade 5 topics');
  // ученик 5 класса не получает темы 6 класса на карте
  ok(E.scope({ learner: { grade: 5 } }).every(t => t.grade === 5) && E.scope({ learner: { grade: 6 } }).every(t => t.grade === 6), 'scope by grade');
})();

// разведка: знает темы до «Сложения смешанных чисел» включительно
(function () {
  const st = E.newState();
  const now = new Date(2026, 10, 21, 16, 0, 0).getTime();
  E.onboard(st, { nick: 'Д', grade: 5, g: 'f', interests: [] }, now);
  const kn = M.TOPICS.findIndex(t => t.id === 'mixed-add');
  const log = [];
  for (let i = 0; i < 10; i++) {
    const c = E.next(st, now + i * 1000);
    if (c.type !== 'task') { ok(c.type === 'diag-done', 'diag ends with diag-done'); break; }
    const idx = M.TOPICS.findIndex(t => t.id === c.topic);
    log.push(c.topic + '/' + c.step + '/' + c.kind);
    E.answer(st, c, { res: idx <= kn ? 2 : 0 }, now + i * 1000);
  }
  console.log('diag path:', log.join(' -> '));
  ok(st.diag.n <= 7, 'diag count');
  ok(log[0].indexOf('mixed-add') === 0, 'diag starts from KTP topic');
  const cur = E.currentTopic(st);
  ok(cur === 'frac-mul', 'start topic frac-mul, got ' + cur);
  ok(st.topics['frac-basic'].status === 'known' && st.topics['mixed-add'].status === 'known', 'known topics');
  // ученица ошибается с самого начала
  const st2 = E.newState();
  E.onboard(st2, { nick: 'Б', grade: 5, g: 'f', interests: [] }, now);
  const log2 = [];
  for (let i = 0; i < 10; i++) {
    const c = E.next(st2, now + i * 1000);
    if (c.type !== 'task') break;
    log2.push(c.topic + '/' + c.step + '/' + c.kind);
    const idx = M.TOPICS.findIndex(t => t.id === c.topic);
    E.answer(st2, c, { res: idx <= 0 ? 2 : -1 }, now + i * 1000);
  }
  console.log('diag path 2:', log2.join(' -> '), '=> start', E.currentTopic(st2), 'step', st2.topics[E.currentTopic(st2)].start);
  ok(E.currentTopic(st2) === 'frac-property', 'weak start property, got ' + E.currentTopic(st2));
})();

// неудачи на ступени: проще, полегче, похожая; третья - ступень ниже
(function () {
  const st = E.newState(); let now = new Date(2026, 10, 21, 16, 0, 0).getTime();
  E.onboard(st, { nick: 'Н', grade: 5, g: 'm', interests: [] }, now);
  st.diag.done = true; const s = E._.ts(st, 'frac-compare');
  ['frac-basic', 'frac-property', 'mixed', 'frac-ray'].forEach(function (id) { E._.ts(st, id).status = 'closed'; });
  s.status = 'learning'; s.step = 3; s.explain = false; st.current = 'frac-compare';
  let c = E.next(st, now);
  ok(c.type === 'task' && c.mode === 'l' && c.step === 3, 'start at step 3 task');
  const gi = c.q.gi;
  E.answer(st, c, { res: 0, wrong: 1 }, now);
  c = E.next(st, now); ok(c.type === 'explain' && c.auto && c.lvl === 1, 'fail 1 -> simpler explanation, got ' + c.type + ' ' + c.lvl);
  E.explained(st, c, 'ok', now);
  c = E.next(st, now); ok(c.type === 'task' && c.mode === 'z' && c.step === 2, 'then easier task from step 2, got ' + c.mode + ' ' + c.step);
  E.answer(st, c, { res: 2 }, now);
  c = E.next(st, now); ok(c.type === 'task' && c.mode === 'l' && c.step === 3 && c.q.gi === gi, 'then similar task');
  E.answer(st, c, { res: 0, wrong: 1 }, now);
  c = E.next(st, now); ok(c.type === 'explain' && c.auto && c.lvl === 2, 'fail 2 -> walkthrough');
  E.explained(st, c, 'ok', now);
  c = E.next(st, now); ok(c.mode === 'z', 'easier again');
  E.answer(st, c, { res: 2 }, now);
  c = E.next(st, now); ok(c.mode === 'l' && c.step === 3, 'similar again');
  E.answer(st, c, { res: 0, wrong: 1 }, now);
  c = E.next(st, now); ok(c.type === 'explain' && !c.auto && c.step === 2 && c.lvl === 0, 'fail 3 -> step down to 2, got ' + c.type + ' ' + c.step + ' ' + c.lvl);
  // «Объясни проще» по цепочке
  let r = E.explained(st, c, 'simpler', now); ok(r === 'simpler', 'simpler -> level 1');
  c = E.next(st, now); ok(c.type === 'explain' && c.step === 2 && c.lvl === 1, 'level 1 card');
  r = E.explained(st, c, 'simpler', now); ok(r === 'simpler', 'simpler -> level 2');
  c = E.next(st, now); ok(c.type === 'explain' && c.step === 2 && c.lvl === 2, 'level 2 card');
  r = E.explained(st, c, 'simpler', now); ok(r === 'down', 'simpler at level 2 -> step down');
  c = E.next(st, now); ok(c.type === 'explain' && c.step === 1 && c.lvl === 0, 'step 1 explanation');
  E.explained(st, c, 'simpler', now); c = E.next(st, now); E.explained(st, c, 'simpler', now); c = E.next(st, now);
  r = E.explained(st, c, 'simpler', now); ok(r === 'base', 'deepest at step 1 -> base check, got ' + r);
  c = E.next(st, now); ok(c.type === 'info' && c.kind === 'base', 'base info');
})();

// тренировка и повтор темы напрямую
(function () {
  const st = E.newState(); let now = new Date(2026, 10, 21, 16, 0, 0).getTime();
  E.onboard(st, { nick: 'П', grade: 5, g: 'm', interests: [] }, now);
  for (let i = 0; i < 12; i++) { const c = E.next(st, now); if (c.type !== 'task') break; E.answer(st, c, { res: i % 2 ? 2 : 0, wrong: 3 }, now); now += 30000; }
  E.next(st, now);
  const known = M.TOPICS.find(t => st.topics[t.id] && ['known', 'closed'].indexOf(st.topics[t.id].status) >= 0);
  const target = known ? known.id : M.TOPICS[0].id;
  E.practice(st, target);
  let n = 0, last = null;
  for (let i = 0; i < 30; i++) {
    now += 30000; const c = E.next(st, now); last = c;
    if (c.type === 'task') { ok(c.mode === 'p' || c.prac || c.mode === 'e', 'practice task mode ' + c.mode); n++; E.answer(st, c, { res: i % 3 ? 2 : 0, wrong: i % 3 ? 0 : 3 }, now); }
    else if (c.type === 'info' && c.kind === 'prac-done') break;
    else if (c.type === 'break' || c.type === 'info') continue;
    else break;
  }
  ok(last && last.kind === 'prac-done', 'practice ends with summary, got ' + (last && (last.type + ':' + last.kind)));
  ok(n >= 8, 'practice has 8 tasks, got ' + n);
  E.relearn(st, target);
  ok(st.topics[target].status === 'learning' && st.topics[target].step === 1 && st.current === target, 'relearn');
  const c2 = E.next(st, now);
  ok(c2.type === 'explain' && c2.topic === target && c2.step === 1, 'relearn starts with explanation');
  console.log('weak topics:', JSON.stringify(E.weakTopics(st)));
})();

// код: экспорт и импорт
(async function () {
  const code = await E.exportCode(wst);
  ok(/^MBP[01]/.test(code), 'code prefix');
  const data = await E.importCode(code);
  ok(JSON.stringify(data.topics) === JSON.stringify(wst.topics), 'roundtrip topics');
  ok(data.log.length === wst.log.length, 'roundtrip log');
  console.log('code length', code.length, 'log rows', wst.log.length, 'json', JSON.stringify(wst).length);
  let threw = false; try { await E.importCode('hello'); } catch (e) { threw = /MBP/.test(e.message); } ok(threw, 'bad code message');
  const rep = E.report(data, '2026-11-01', '2026-12-31', Date.now());
  ok(!bad(rep) && rep.length > 50, 'report text');
  console.log('\n' + rep.split('\n').slice(0, 14).join('\n') + '\n...');
  const days = E.days(data);
  ok(days.length > 0, 'days');
  const dt = E.dayTasks(data, days[0].date);
  ok(dt.length > 0 && dt.every(x => x.text && !bad(x.text)), 'day tasks text');
  const gr = E.gapRows(data);
  ok(gr.every(g => g.text), 'gap texts');
  const ser = E.series(data);
  ok(ser.length > 0 && ser.every(p => p.total >= 0 && p.total <= E.maxTotal()), 'series');
  console.log('\nchecks', checks, 'fails', fails);
  process.exit(fails ? 1 : 0);
})();
