/* engine.js - движок правил: разведка, ступени, контроль, проверка через день, повторы, журнал по датам.
   Правила взяты из раздела 4 проекта. Работает в браузере и в Node (для тестов). */
(function () {
  'use strict';
  const M = globalThis.M;
  const E = (M.E = {});

  const DIFF = [-2, -1, 0, 1, 2];   // сложность ступеней 1-5 (рейтинг задачи, как в Эло)
  const DEEP_DIFF = 3;              // задачи «Глубже»
  const K_LEARN = 1.0, K_DIAG = 1.5, K_EASY = 0.5;
  const DIAG_MAX = 7;
  const REVIEW_DAYS = [3, 7, 21, 60];
  const KEY = 'mbp.v1';
  const TOPS = M.TOPICS, N = TOPS.length;
  const IDX = {}; TOPS.forEach(function (t, i) { IDX[t.id] = i; });

  function T(id) { return TOPS[IDX[id]]; }
  function title(id) { return T(id).title; }
  function short(id) { return T(id).short; }
  const ANC = {};
  function ancestors(id) {
    if (ANC[id]) return ANC[id];
    const out = new Set();
    (function walk(x) { T(x).prereq.forEach(function (p) { if (!out.has(p)) { out.add(p); walk(p); } }); })(id);
    return (ANC[id] = out);
  }

  /* ---------- даты ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dkey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(key, n) { const p = key.split('-').map(Number); return dkey(new Date(p[0], p[1] - 1, p[2] + n, 12).getTime()); }
  function ddmm(key) { if (!key) return ''; const p = key.split('-'); return p[2] + '.' + p[1]; }
  // день учебного года (сентябрь - начало), чтобы КТП работал и в следующем году
  function sy(key) { const p = key.split('-').map(Number); return (p[1] >= 9 ? p[1] - 9 : p[1] + 3) * 31 + p[2]; }

  /* ---------- рейтинг и балл 0-50 ---------- */
  function P(th, b) { return 1 / (1 + Math.exp(b - th)); }
  function score(th) { return Math.round(50 * P(th, DIFF[4])); }
  function zone(sc) {
    if (sc <= 10) return 'самые простые шаги';
    if (sc <= 25) return 'примеры и рисунки';
    if (sc <= 40) return 'можно двигаться дальше';
    return 'можно усложнять';
  }

  /* ---------- состояние ---------- */
  function newState() {
    return {
      v: 1, cv: M.CONTENT_VERSION, learner: null, diag: null, topics: {}, current: null, stack: [], gaps: [],
      sessions: [], log: [], hist: {}, seq: 0,
      settings: { pin: '', sessionMin: 25, audio: true }, notes: {}, students: {}
    };
  }
  function blank() {
    return { th: -1.5, status: 'new', step: 1, start: 1, credit: 0, misses: 0, fails: 0, explain: true, lvl: 0, base: false,
      ctl: null, chk: null, closed: '', due: '', rdue: '', rst: 0, rfail: 0, deep: 0, deepN: 0, diag: '', last: '', passed: [] };
  }
  function ts(st, id) { return st.topics[id] || (st.topics[id] = blank()); }
  function tsr(data, id) { return (data.topics && data.topics[id]) || blank(); }
  function ctx(st) { const l = st.learner || {}; return { interests: l.interests || [], g: l.g || 'm' }; }
  // поток текущего занятия: в память не сохраняется
  function fl(st) {
    if (!st._f) st._f = { queue: [], since: 0, lastGi: {}, deep: null, prac: null, base: null, timeOffered: false, wrongRow: 0, gapsTried: {}, reviewed: {} };
    return st._f;
  }

  /* ---------- занятия и журнал ---------- */
  function sess(st) { return st.sessions[st.sessions.length - 1]; }
  E.touch = function (st, now) {
    let s = sess(st);
    if (!s || now - s.end > 30 * 60000 || s.date !== dkey(now)) {
      s = { date: dkey(now), start: now, end: now, n: 0, c: 0, h: 0, f: 0, dk: 0, ev: [], tp: [] };
      st.sessions.push(s);
      st._f = null;
    }
    s.end = now;
    return s;
  };
  function ev(st, text) { const s = sess(st); if (s) s.ev.push(text); }
  function logA(st, card, out, now) {
    const q = card.q || {};
    st.log.push([Math.round(now / 1000), card.topic, card.step, card.mode, out.res, out.wrong || 0, out.hints || 0,
      Math.round((out.ms || 0) / 1000), q.gi === undefined ? -1 : q.gi, q.seed || 0]);
    if (st.log.length > 6000) st.log.splice(0, st.log.length - 6000);
    const s = sess(st);
    if (s) {
      s.n++;
      if (out.res === 2) s.c++; else if (out.res === 1) s.h++; else if (out.res === 0) s.f++; else s.dk++;
      if (s.tp.indexOf(card.topic) < 0) s.tp.push(card.topic);
    }
  }
  function upd(st, id, step, y, k, now) {
    const s = ts(st, id), b = step === 6 ? DEEP_DIFF : DIFF[step - 1];
    s.th = Math.max(-4, Math.min(6, s.th + k * (y - P(s.th, b))));
    s.last = dkey(now);
    const d = dkey(now);
    (st.hist[d] = st.hist[d] || {})[id] = score(s.th);
  }

  /* ---------- выбор задачи ---------- */
  function mat(st, card) {
    if (card.type !== 'task' || card.q) return card;
    const t = T(card.topic), n = card.step === 6 ? t.deep.length : t.steps[card.step - 1].gens.length;
    const f = fl(st), key = card.topic + ':' + card.step;
    let gi = card.gi;
    if (typeof gi !== 'number' || gi < 0 || gi >= n) {
      gi = Math.floor(Math.random() * n);
      if (n > 1 && gi === f.lastGi[key]) gi = (gi + 1) % n;
    }
    f.lastGi[key] = gi;
    card.q = M.makeQuestion(card.topic, card.step, ctx(st), gi, card.seed);
    card.hints = 'dcnb'.indexOf(card.mode) < 0;     // подсказки разрешены
    card.once = 'dcnb'.indexOf(card.mode) >= 0;     // одна попытка
    card.dk = card.mode === 'd';                    // кнопка «Не знаю»
    return card;
  }

  function avail(st, id) {
    return T(id).prereq.every(function (p) { const x = st.topics[p]; return !!x && ['today', 'closed', 'known'].indexOf(x.status) >= 0; });
  }
  E.avail = function (st, id) { return avail(st, id); };
  function currentTopic(st) {
    if (st.current) { const s = st.topics[st.current]; if (s && (s.status === 'learning' || s.status === 'new')) return st.current; }
    let id = null;
    for (let i = 0; i < N && !id; i++) { const s = st.topics[TOPS[i].id]; if (s && s.status === 'learning') id = TOPS[i].id; }
    for (let i = 0; i < N && !id; i++) { const s = ts(st, TOPS[i].id); if (s.status === 'new' && avail(st, TOPS[i].id)) id = TOPS[i].id; }
    st.current = id;
    return id;
  }
  E.currentTopic = function (st) { return currentTopic(st); };
  function simplerTarget(st, id, lvl) {
    const s = ts(st, id);
    if ((lvl || 0) < M.maxLevel(id, s.step)) return 'level';
    if (s.step > 1) return 'step';
    if (!s.base && T(id).prereq.length) return 'base';
    return 'repeat';
  }

  // Что показать дальше
  E.next = function (st, now) {
    if (!st.learner) return { type: 'onboard' };
    if (!st.diag || !st.diag.done) return E.diagNext(st) || E.diagFinish(st, now);
    const f = fl(st), today = dkey(now);
    if (f.queue.length) return mat(st, f.queue.shift());
    const c = checkCard(st, today);
    if (c) return c;
    if (f.since >= 4 && !f.prac && !f.deep) { const r = reviewCard(st, today); if (r) { f.since = 0; return r; } }
    if (f.prac) {
      if (f.prac.left > 0) {
        const g = gapCard(st, f.prac.topic, true);
        if (g) { g.prac = true; return g; }
        return mat(st, { type: 'task', mode: 'p', topic: f.prac.topic, step: pracStep(st, f.prac.topic) });
      }
      const d = f.prac; f.prac = null;
      ev(st, '«' + short(d.topic) + '»: тренировка, верно ' + d.ok + ' из ' + d.n);
      return { type: 'info', kind: 'prac-done', topic: d.topic, toMap: true,
        text: 'Тренировка по теме «' + title(d.topic) + '»: верно ' + d.ok + ' из ' + d.n + '. ' + (d.ok >= d.n - 1 ? 'Тема держится крепко.' : 'Ещё одна тренировка закрепит тему.') };
    }
    if (f.deep) {
      if (f.deep.left > 0) return mat(st, { type: 'task', mode: 'x', topic: f.deep.topic, step: 6 });
      const d = f.deep; f.deep = null;
      return { type: 'info', kind: 'deep-done', topic: d.topic, toMap: true, text: 'Глубже: решено ' + d.ok + ' из ' + d.n + '. Хорошая работа головой.' };
    }
    const id = currentTopic(st);
    if (!id) { const r = reviewCard(st, today); return r || { type: 'done' }; }
    const s = ts(st, id);
    if (s.status === 'new') {
      s.status = 'learning'; s.step = s.start || 1; s.explain = true;
      ev(st, 'Начата тема «' + short(id) + '»' + (s.step > 1 ? ' со ступени ' + s.step : ''));
    }
    if (s.ctl) return controlCard(st, id);
    if (s.explain) return { type: 'explain', topic: id, step: s.step, lvl: s.lvl || 0, simpler: simplerTarget(st, id, s.lvl) };
    const g = gapCard(st, id, false);
    if (g) return g;
    return mat(st, { type: 'task', mode: 'l', topic: id, step: s.step });
  };

  // Ответ на задачу. out = { res: 2 сразу верно, 1 с подсказкой, 0 решение показано, -1 «Не знаю»; wrong; hints; ms }
  E.answer = function (st, card, out, now) {
    E.touch(st, now);
    const f = fl(st), y = out.res === 2 ? 1 : out.res === 1 ? 0.5 : 0;
    logA(st, card, out, now);
    switch (card.mode) {
      case 'd': diagAnswer(st, card, out, now); break;
      case 'l': upd(st, card.topic, card.step, y, K_LEARN, now); learn(st, card, out, now); f.since++; break;
      case 'c': upd(st, card.topic, card.step, y, K_LEARN, now); controlAnswer(st, card, out, now); break;
      case 'n': upd(st, card.topic, card.step, y, K_LEARN, now); checkAnswer(st, card, out, now); break;
      case 'r': upd(st, card.topic, card.step, y, K_LEARN, now); reviewAnswer(st, card, out, now); break;
      case 'g': upd(st, card.topic, card.step, y, K_LEARN, now); gapAnswer(st, card, out, now); f.since++; break;
      case 'b': upd(st, card.topic, card.step, y, K_LEARN, now); baseAnswer(st, card, out, now); break;
      case 'e': upd(st, card.topic, card.step, y, K_EASY, now); break;
      case 'x': upd(st, card.topic, 6, y, K_LEARN, now); deepAnswer(st, card, out); break;
      case 'p': upd(st, card.topic, card.step, y, K_LEARN, now); if (out.res <= 0) addGap(st, card, 'prac', dkey(now)); break;
      case 'z': upd(st, card.topic, card.step, y, K_EASY, now); break;
    }
    if (f.prac && (card.mode === 'p' || card.prac)) { f.prac.left--; f.prac.n++; if (out.res >= 1) f.prac.ok++; }
    if (card.mode !== 'd') {
      // три ошибки подряд: лёгкая задача на успех и предложение перерыва
      f.wrongRow = out.res >= 1 ? 0 : f.wrongRow + Math.max(1, out.wrong || 0);
      const s = sess(st);
      if (f.wrongRow >= 3 && 'lgrxepz'.indexOf(card.mode) >= 0) {
        f.wrongRow = 0;
        if (f.lastEasy === undefined || s.n - f.lastEasy >= 6) {
          f.lastEasy = s.n;
          const items = card.mode === 'l' && out.res <= 0 ? [] : [easyCard(st, card.topic)];
          if (!f.breakOffered) { f.breakOffered = true; items.push({ type: 'break', reason: 'errors' }); }
          f.queue.unshift.apply(f.queue, items);
          if (items.length) ev(st, 'Три ошибки подряд: ' + items.map(function (x) { return x.type === 'break' ? 'предложение перерыва' : 'лёгкая задача'; }).join(' и '));
        }
      }
      if (!f.timeOffered && s && s.end - s.start >= st.settings.sessionMin * 60000) {
        f.timeOffered = true;
        f.queue.unshift({ type: 'break', reason: 'time' });
      }
    }
    E.save(st);
  };

  /* ---------- учёба по ступеням ---------- */
  function learn(st, card, out, now) {
    const s = ts(st, card.topic);
    if (s.step !== card.step) return;   // задача из очереди после смены ступени
    if (out.res === 2) {
      s.fails = 0;
      s.credit += card.q.kind === 'yesno' ? 0.5 : 1;   // вопросы «да или нет» идут парой
      if (s.credit >= (s.misses > 0 ? 2 : 1) - 1e-9) passStep(st, card.topic, now);
      return;
    }
    s.credit = 0; s.misses++;
    if (out.res === 1) s.fails = 0;
    if (out.res <= 0) {
      s.fails++;
      addGap(st, card, 'task', dkey(now));
      if (s.fails >= 3) { stepDown(st, card.topic, now, 'fails'); return; }
      // не получилось: объяснение проще (потом по шагам), задача полегче, потом похожая задача
      const f = fl(st);
      f.queue.push({ type: 'explain', topic: card.topic, step: s.step, lvl: Math.min(s.fails, M.maxLevel(card.topic, s.step)), auto: true, why: 'fail' });
      f.queue.push({ type: 'task', mode: 'z', topic: card.topic, step: Math.max(1, s.step - 1), banner: 'Задача полегче. Потом вернёмся к трудной.' });
      f.queue.push({ type: 'task', mode: 'l', topic: card.topic, step: s.step, gi: card.q.gi });
      ev(st, '«' + short(card.topic) + '»: задача не получилась, ' + (s.fails === 1 ? 'объяснение проще' : 'разбор по шагам') + ' и задача полегче');
    }
  }
  function dropQueued(st, id) { const f = fl(st); f.queue = f.queue.filter(function (x) { return !(x.topic === id && (x.mode === 'l' || x.mode === 'z' || (x.type === 'explain' && x.auto))); }); }
  function passStep(st, id, now) {
    const s = ts(st, id);
    dropQueued(st, id);
    s.passed[s.step - 1] = dkey(now);
    ev(st, '«' + short(id) + '»: ступень ' + s.step + ' пройдена');
    s.credit = 0; s.misses = 0; s.fails = 0; s.lvl = 0;
    if (s.step >= 5) startControl(st, id);
    else { s.step++; s.explain = true; }
  }
  function stepDown(st, id, now, why) {
    const s = ts(st, id);
    dropQueued(st, id);
    s.credit = 0; s.misses = 0; s.fails = 0; s.lvl = 0;
    const reason = why === 'simpler' ? 'кнопка «Объясни проще»' : 'три задачи подряд с решением';
    if (s.step > 1) {
      s.step--; s.explain = true;
      ev(st, '«' + short(id) + '»: ' + reason + ', ступень ' + (s.step + 1) + ' → ' + s.step);
      return 'down';
    }
    return baseCheck(st, id, reason) ? 'base' : 'again';
  }
  function baseCheck(st, id, reason) {
    const t = T(id), s = ts(st, id), f = fl(st);
    s.explain = true;
    if (s.base || !t.prereq.length) return false;
    f.base = { forTopic: id, left: t.prereq.length };
    f.queue.push({ type: 'info', kind: 'base', topic: id, text: 'Проверим основу этой темы. Это ' + (t.prereq.length > 1 ? t.prereq.length + ' короткие задачи' : 'одна короткая задача') + '.' });
    t.prereq.forEach(function (p) { f.queue.push({ type: 'task', mode: 'b', topic: p, step: T(p).diag[0] + 1, gi: T(p).diag[1], forTopic: id }); });
    ev(st, '«' + short(id) + '»: ' + reason + ' на первой ступени, проверка основы');
    return true;
  }
  function baseAnswer(st, card, out, now) {
    const f = fl(st), b = f.base;
    if (!b) return;
    b.left--;
    if (out.res !== 2) {
      addGap(st, card, 'base', dkey(now));
      f.queue = f.queue.filter(function (x) { return x.mode !== 'b'; });
      const back = b.forTopic, p = card.topic, sp = ts(st, p);
      ts(st, back).base = true;
      if (st.stack.indexOf(back) < 0) st.stack.push(back);
      st.current = p;
      const old = sp.status;
      if (old === 'new') sp.step = sp.start || 1;
      else if (old !== 'learning') sp.step = 3;
      sp.status = 'learning'; sp.explain = true; sp.lvl = 0; sp.credit = 0; sp.misses = 0; sp.fails = 0; sp.ctl = null; sp.chk = null;
      sp.due = ''; sp.closed = ''; sp.rdue = '';
      ev(st, 'Возврат к базовой теме «' + short(p) + '»');
      f.queue.unshift({ type: 'info', kind: 'go-base', topic: p, text: 'Сначала повторим тему «' + title(p) + '». Потом вернёмся.' });
      f.base = null;
      return;
    }
    if (b.left <= 0) {
      const s = ts(st, b.forTopic);
      s.base = true; s.explain = true;
      f.queue.unshift({ type: 'info', kind: 'base-ok', topic: b.forTopic, text: 'Основа на месте. Посмотрим эту ступень ещё раз.' });
      f.base = null;
    }
  }

  // Кнопки на объяснении: 'ok' - «Понятно», 'simpler' - «Объясни проще»
  // Уровни: 0 - обычное объяснение, 1 - проще, 2 - по шагам; дальше - ступень ниже, потом базовая тема
  E.explained = function (st, card, choice, now) {
    E.touch(st, now);
    const s = ts(st, card.topic), f = fl(st), lvl = card.lvl || 0;
    st.log.push([Math.round(now / 1000), card.topic, card.step, choice === 'ok' ? 'u' : 's', lvl, 0, 0, 0, -1, 0]);
    let result = 'ok';
    if (choice === 'ok') {
      if (!card.auto) s.explain = false;
    } else if (lvl < M.maxLevel(card.topic, card.step)) {
      if (card.auto) f.queue.unshift({ type: 'explain', topic: card.topic, step: card.step, lvl: lvl + 1, auto: true });
      else s.lvl = lvl + 1;
      ev(st, '«' + short(card.topic) + '»: «Объясни проще» на ступени ' + card.step + ', ' + (lvl + 1 === 1 ? 'объяснение проще' : 'разбор по шагам'));
      result = 'simpler';
    } else {
      if (card.auto) f.queue = f.queue.filter(function (x) { return x.type === 'closed' || x.topic !== card.topic; });
      result = stepDown(st, card.topic, now, 'simpler');
    }
    E.save(st);
    return result;
  };

  /* ---------- контроль ---------- */
  function startControl(st, id) {
    ts(st, id).ctl = { steps: M.shuffle([3, 4, 5]), i: 0, ok: 0, bad: [], extra: 0, shown: false };
  }
  function controlCard(st, id) {
    const c = ts(st, id).ctl;
    if (!c.shown) {
      const g = gapCard(st, id, true);
      if (g) return g;
      c.shown = true;
      return { type: 'info', kind: 'control', topic: id, text: 'Контроль по теме «' + title(id) + '»: 3 задачи без подсказок.' };
    }
    return mat(st, { type: 'task', mode: 'c', topic: id, step: c.extra || c.steps[c.i] });
  }
  function controlAnswer(st, card, out, now) {
    const s = ts(st, card.topic), c = s.ctl;
    if (!c) return;
    const ok = out.res === 2;
    if (c.extra) {
      if (ok) { ev(st, '«' + short(card.topic) + '»: контроль 3 из 4'); closeToday(st, card.topic, now); }
      else backTo(st, card.topic, c.extra, 'контроль 2 из 4');
      return;
    }
    if (ok) c.ok++; else c.bad.push(card.step);
    c.i++;
    if (c.i < 3) return;
    if (c.ok === 3) { ev(st, '«' + short(card.topic) + '»: контроль 3 из 3'); closeToday(st, card.topic, now); }
    else if (c.ok === 2) c.extra = c.bad[0];
    else backTo(st, card.topic, Math.min.apply(null, c.bad), 'контроль ' + c.ok + ' из 3');
  }
  function backTo(st, id, step, why) {
    const s = ts(st, id);
    s.ctl = null; s.step = step; s.explain = true; s.credit = 0; s.misses = 1; s.fails = 0; s.lvl = 0;
    ev(st, '«' + short(id) + '»: ' + why + ', повтор ступени ' + step);
    fl(st).queue.unshift({ type: 'info', kind: 'back', topic: id, text: 'Давай попробуем проще. Повторим ступень ' + step + '. Потом снова контроль.' });
  }
  function closeToday(st, id, now) {
    const s = ts(st, id), today = dkey(now), f = fl(st);
    s.ctl = null; s.status = 'today'; s.closed = today; s.due = addDays(today, 1); s.chk = null; s.step = 5;
    ev(st, 'Тема «' + short(id) + '» закрыта сегодня');
    let back = null;
    while (st.stack.length && !back) { const b = st.stack.pop(); if (st.topics[b] && st.topics[b].status === 'learning') back = b; }
    st.current = back;
    if (back) ts(st, back).explain = true;
    f.queue.unshift({ type: 'closed', topic: id, back: back, deep: T(id).deep.length > 0 });
  }

  /* ---------- проверка на следующий день ---------- */
  function checkCard(st, today) {
    for (let i = 0; i < N; i++) {
      const id = TOPS[i].id, s = st.topics[id];
      if (s && s.status === 'today' && s.due && s.due <= today) {
        if (!s.chk) s.chk = { n: 0, ok: 0, bad: 0, shown: false };
        if (!s.chk.shown) {
          s.chk.shown = true;
          return { type: 'info', kind: 'check', topic: id, text: 'Проверим тему с прошлого занятия: «' + title(id) + '». Две задачи без подсказок.' };
        }
        return mat(st, { type: 'task', mode: 'n', topic: id, step: s.chk.n === 0 ? 4 : 5 });
      }
    }
    return null;
  }
  function checkAnswer(st, card, out, now) {
    const s = ts(st, card.topic), today = dkey(now), c = s.chk || (s.chk = { n: 0, ok: 0, bad: 0, shown: true });
    c.n++;
    if (out.res === 2) c.ok++; else if (!c.bad) c.bad = card.step;
    if (c.n < 2) return;
    s.chk = null;
    const f = fl(st);
    if (c.ok === 2) {
      s.status = 'closed'; s.due = ''; s.rdue = addDays(today, REVIEW_DAYS[0]); s.rst = 0; s.rfail = 0;
      st.gaps.forEach(function (g) { if (g.topic === card.topic && g.status === 'today') { g.status = 'closed'; g.closed = today; } });
      ev(st, 'Проверка через день: тема «' + short(card.topic) + '» закреплена');
      f.queue.unshift({ type: 'info', kind: 'check-ok', topic: card.topic, text: 'Тема «' + title(card.topic) + '» закреплена. На карте она теперь светится.' });
    } else {
      s.status = 'learning'; s.due = ''; s.closed = ''; s.step = c.bad || 4; s.explain = true; s.lvl = 0; s.credit = 0; s.misses = 1; s.fails = 0;
      ev(st, 'Проверка через день: тема «' + short(card.topic) + '» снова в работе');
      if (st.current && st.current !== card.topic && st.stack.indexOf(st.current) < 0) st.stack.push(st.current);
      st.current = card.topic;
      f.queue.unshift({ type: 'info', kind: 'check-back', topic: card.topic, text: 'Повторим эту тему ещё раз. Так она запомнится крепче.' });
    }
  }

  /* ---------- повторение закрытых тем (вперемешку с новыми задачами) ---------- */
  function reviewCard(st, today) {
    const f = fl(st);
    let best = null;
    for (let i = 0; i < N; i++) {
      const id = TOPS[i].id, s = st.topics[id];
      if (s && (s.status === 'closed' || s.status === 'known') && s.rdue && s.rdue <= today && id !== st.current && !f.reviewed[id]) {
        if (!best || s.rdue < st.topics[best].rdue) best = id;
      }
    }
    if (!best) return null;
    f.reviewed[best] = true;
    const s = st.topics[best];
    return mat(st, { type: 'task', mode: 'r', topic: best, step: s.status === 'known' ? M.pick([4, 5]) : M.pick([3, 4, 5]) });
  }
  function reviewAnswer(st, card, out, now) {
    const s = ts(st, card.topic), today = dkey(now);
    if (out.res === 2) {
      s.rst = Math.min(s.rst + 1, REVIEW_DAYS.length - 1); s.rdue = addDays(today, REVIEW_DAYS[s.rst]); s.rfail = 0;
      if (s.status === 'known') { s.status = 'closed'; ev(st, 'Повторение: тема «' + short(card.topic) + '» подтверждена'); }
    } else if (out.res === 1) {
      s.rdue = addDays(today, 1);
    } else {
      s.rfail++; s.rdue = addDays(today, 1);
      if (s.status === 'known' || s.rfail >= 2) reopen(st, card.topic, 3, 'повторение не получилось');
    }
  }
  function reopen(st, id, step, why) {
    const s = ts(st, id);
    s.status = 'learning'; s.step = step; s.explain = true; s.lvl = 0; s.credit = 0; s.misses = 0; s.fails = 0;
    s.rdue = ''; s.rst = 0; s.rfail = 0; s.due = ''; s.closed = ''; s.ctl = null;
    ev(st, 'Тема «' + short(id) + '» снова в работе: ' + why);
    const cur = st.current;
    if (cur && cur !== id && ancestors(cur).has(id)) {
      if (st.stack.indexOf(cur) < 0) st.stack.push(cur);
      st.current = id;
      fl(st).queue.unshift({ type: 'info', kind: 'go-base', topic: id, text: 'Сначала повторим тему «' + title(id) + '». Потом вернёмся.' });
    }
  }

  /* ---------- пробелы: задачи, которые не получились ---------- */
  function addGap(st, card, src, today) {
    const q = card.q;
    if (!q) return;
    const open = st.gaps.filter(function (g) { return g.topic === card.topic && g.status === 'open'; });
    if (open.length >= 3) return;
    st.gaps.push({ id: ++st.seq, topic: card.topic, step: card.step, gi: q.gi, seed: q.seed, src: src, found: today, status: 'open', tries: 0, cv: M.CONTENT_VERSION });
  }
  function gapCard(st, id, beforeControl) {
    const s = ts(st, id), f = fl(st);
    const g = st.gaps.find(function (x) {
      return x.topic === id && x.status === 'open' && x.tries < 3 && !f.gapsTried[x.id] && (beforeControl ? x.step <= 5 : x.step < s.step);
    });
    if (!g) return null;
    f.gapsTried[g.id] = true;
    return mat(st, { type: 'task', mode: 'g', topic: id, step: g.step, gi: g.gi, seed: g.seed, gap: g.id,
      banner: g.src === 'diag' ? 'Вернёмся к задаче из разведки.' : 'Вернёмся к задаче, которая не получилась раньше.' });
  }
  function gapAnswer(st, card, out, now) {
    const g = st.gaps.find(function (x) { return x.id === card.gap; });
    if (!g) return;
    g.tries++;
    if (out.res >= 1) { g.status = 'today'; g.closed = dkey(now); ev(st, 'Пробел закрыт сегодня: задача по теме «' + short(card.topic) + '»'); }
  }

  /* ---------- лёгкая задача, «Глубже», выбор темы ---------- */
  function easyCard(st, id) {
    const s = ts(st, id);
    if (s.status === 'learning' && s.step > 1) return { type: 'task', mode: 'e', topic: id, step: 1, banner: 'Лёгкая задача для разгона.' };
    for (let i = N - 1; i >= 0; i--) {
      const x = st.topics[TOPS[i].id];
      if (x && (x.status === 'closed' || x.status === 'known' || x.status === 'today')) return { type: 'task', mode: 'e', topic: TOPS[i].id, step: 2, banner: 'Лёгкая задача для разгона.' };
    }
    return { type: 'task', mode: 'e', topic: id, step: 1, banner: 'Лёгкая задача для разгона.' };
  }
  function deepAnswer(st, card, out) {
    const f = fl(st), s = ts(st, card.topic);
    s.deepN++; if (out.res >= 1) s.deep++;
    if (f.deep) { f.deep.left--; f.deep.n++; if (out.res >= 1) f.deep.ok++; }
  }
  // what: 'deep' - «Глубже», 'next' - «Дальше»
  E.choice = function (st, what, id) {
    const f = fl(st);
    if (what === 'deep') { f.deep = { topic: id, left: 5, n: 0, ok: 0 }; ev(st, '«' + short(id) + '»: выбрано «Глубже»'); }
    E.save(st);
  };
  E.stopDeep = function (st) { fl(st).deep = null; };
  // тренировка выбранной темы: 8 задач, сложность по баллу темы
  function pracStep(st, id) {
    const s = ts(st, id), max = s.status === 'learning' ? Math.max(1, s.step) : 5, min = Math.min(2, max);
    let best = min, bd = 9;
    for (let k = min; k <= max; k++) { const dd = Math.abs(P(s.th, DIFF[k - 1]) - 0.7); if (dd < bd) { bd = dd; best = k; } }
    if (Math.random() < 0.3) best = Math.max(min, Math.min(max, best + (Math.random() < 0.5 ? -1 : 1)));
    return best;
  }
  E.practice = function (st, id) {
    const f = fl(st);
    f.deep = null; f.prac = { topic: id, left: 8, n: 0, ok: 0 };
    ev(st, '«' + short(id) + '»: выбрана тренировка');
    E.save(st);
  };
  E.stopPractice = function (st) { fl(st).prac = null; };
  E.pracInfo = function (st) { const p = st._f && st._f.prac; return p ? { n: p.n + 1, total: p.n + p.left } : null; };
  // пройти закрытую тему заново по ступеням
  E.relearn = function (st, id) {
    const s = ts(st, id), f = fl(st);
    f.prac = null; f.deep = null;
    if (s.status !== 'learning') {
      s.status = 'learning'; s.step = 1; s.explain = true; s.lvl = 0; s.credit = 0; s.misses = 0; s.fails = 0; s.ctl = null; s.chk = null;
      s.due = ''; s.closed = ''; s.rdue = ''; s.rst = 0; s.rfail = 0;
      ev(st, 'Тема «' + short(id) + '» заново по ступеням: выбор ученика');
    }
    const cur = st.current;
    if (cur && cur !== id && st.topics[cur] && st.topics[cur].status === 'learning' && st.stack.indexOf(cur) < 0) st.stack.push(cur);
    st.current = id;
    E.save(st);
  };
  // темы, которые даются трудно: открытые пробелы или низкий балл
  E.weakTopics = function (st) {
    return TOPS.map(function (t) {
      const s = st.topics[t.id];
      if (!s || s.status === 'new' || !s.last || t.id === st.current) return null;
      const gaps = st.gaps.filter(function (g) { return g.topic === t.id && g.status === 'open'; }).length;
      return { id: t.id, gaps: gaps, score: score(s.th) };
    }).filter(function (x) { return x && (x.gaps > 0 || x.score < 26); })
      .sort(function (a, b) { return b.gaps - a.gaps || a.score - b.score; }).slice(0, 3);
  };
  E.inDeep = function (st) { return !!(st._f && st._f.deep); };
  E.inPractice = function (st) { return !!(st._f && st._f.prac); };
  // выбор темы на карте
  E.choose = function (st, id) {
    const s = ts(st, id);
    if (s.status === 'learning' || (s.status === 'new' && avail(st, id))) { st.current = id; fl(st).deep = null; fl(st).prac = null; E.save(st); return 'learn'; }
    if (['today', 'closed', 'known'].indexOf(s.status) >= 0 && T(id).deep.length) return 'deep';
    return 'locked';
  };
  E.clearQueue = function (st) { const f = fl(st); f.queue = f.queue.filter(function (x) { return x.type === 'closed'; }); };

  /* ---------- разведка ---------- */
  function ktpIndex(today, grade) {
    if (grade >= 6) return N - 1;
    let idx = 0;
    TOPS.forEach(function (t, i) { if (t.dates && sy(t.dates[0]) <= sy(today)) idx = i; });
    return idx;
  }
  E.onboard = function (st, p, now) {
    st.learner = { id: 'L' + now.toString(36) + Math.floor(Math.random() * 1e6).toString(36), nick: p.nick, grade: p.grade, g: p.g,
      interests: p.interests.slice(0, 3), created: now, lang: 'ru' };
    E.touch(st, now);
    st.diag = { date: dkey(now), n: 0, lo: -1, hi: N, first: ktpIndex(dkey(now), p.grade), pr: {}, done: false };
    ev(st, 'Начало: ник «' + p.nick + '», ' + p.grade + ' класс');
    E.save(st);
  };
  function mainStep(i) { return TOPS[i].diag[0] + 1; }
  function covered(d) {
    const out = new Set();
    Object.keys(d.pr).forEach(function (k) {
      const i = Number(k);
      if (d.pr[i].some(function (p) { return p.ok && p.k === 'main'; })) {
        out.add(i);
        ancestors(TOPS[i].id).forEach(function (a) { out.add(IDX[a]); });
      }
    });
    return out;
  }
  function diagPick(d) {
    const probed = function (i) { return !!(d.pr[i] && d.pr[i].length); };
    if (d.n === 0) return { i: d.first, k: 'main' };
    if (d.hi - d.lo > 1) return { i: d.lo + Math.ceil((d.hi - d.lo) / 2), k: 'main' };
    const cov = covered(d);
    // 1) темы ниже границы, которые не следуют из верных ответов по карте
    for (let i = d.hi - 1; i >= 0; i--) if (!probed(i) && !cov.has(i)) return { i: i, k: 'main' };
    // 2) уточнить ступень старта у первой непонятой темы
    let first = null;
    for (let i = 0; i < N && first === null; i++) if (!cov.has(i)) first = i;
    if (first !== null && probed(first) && d.pr[first].length === 1 && !d.pr[first][0].ok && mainStep(first) > 1) return { i: first, k: 'easy' };
    // 3) подтвердить самую высокую тему, выведенную по карте
    for (let i = d.hi - 1; i >= 0; i--) if (!probed(i) && cov.has(i)) return { i: i, k: 'main' };
    return null;
  }
  E.diagNext = function (st) {
    const d = st.diag;
    if (!d || d.done || d.n >= DIAG_MAX) return null;
    const p = diagPick(d);
    if (!p) return null;
    const t = TOPS[p.i], step = p.k === 'main' ? mainStep(p.i) : Math.max(1, mainStep(p.i) - 1);
    let card = mat(st, { type: 'task', mode: 'd', topic: t.id, step: step, gi: p.k === 'main' ? t.diag[1] : undefined });
    // в разведке без задач по шагам: одна задача - один ответ
    for (let g = 0; card.q.kind === 'steps' && g < t.steps[step - 1].gens.length; g++) card = mat(st, { type: 'task', mode: 'd', topic: t.id, step: step, gi: g });
    card.kind = p.k; card.n = d.n + 1; card.total = DIAG_MAX;
    return card;
  };
  function diagAnswer(st, card, out, now) {
    const d = st.diag, i = IDX[card.topic], ok = out.res === 2;
    (d.pr[i] = d.pr[i] || []).push({ s: card.step, ok: ok, k: card.kind, dk: out.res === -1 });
    d.n++;
    if (card.kind === 'main' && d.hi - d.lo > 1) { if (ok) d.lo = Math.max(d.lo, i); else d.hi = Math.min(d.hi, i); }
    upd(st, card.topic, card.step, ok ? 1 : 0, K_DIAG, now);
    if (!ok) addGap(st, card, 'diag', dkey(now));
  }
  E.diagFinish = function (st, now) {
    const d = st.diag, today = dkey(now), cov = covered(d);
    const wrong = [];
    TOPS.forEach(function (t, i) {
      const s = ts(st, t.id), pr = d.pr[i] || [];
      const past = !!t.dates && sy(t.dates[1]) < sy(today);
      let res, th, start = 1;
      if (pr.length && pr[0].ok) { res = 'known'; th = 2.5; }
      else if (pr.length) {
        wrong.push(t.id);
        const easy = pr.find(function (p) { return p.k === 'easy'; });
        if (easy && easy.ok) { res = 'partial'; th = 0.5; start = Math.min(4, easy.s + 1); }
        else if (easy) { res = 'basics'; th = -1.5; start = 1; }
        else if (past) { res = 'partial'; th = 0; start = 2; }
        else { res = 'basics'; th = -1.5; start = 1; }
      } else if (cov.has(i)) { res = 'known'; th = 1.5; }
      else if (i < d.lo) { res = 'known'; th = 1.0; }
      else { res = 'new'; th = -1.5; }
      s.diag = res; s.th = th; s.start = start; s.step = start; s.explain = true;
      if (res === 'known') { s.status = 'known'; s.rdue = today; s.rst = 0; }
      else s.status = 'new';
    });
    // темы над ошибкой получают минус
    wrong.forEach(function (w) {
      TOPS.forEach(function (t) { if (ancestors(t.id).has(w)) { const s = ts(st, t.id); if (s.status === 'new') s.th = Math.min(s.th, -2); } });
    });
    TOPS.forEach(function (t) { (st.hist[today] = st.hist[today] || {})[t.id] = score(ts(st, t.id).th); });
    d.done = true; d.end = now;
    st.current = null;
    const cur = currentTopic(st);
    ev(st, 'Разведка: ' + d.n + ' задач. Старт: «' + (cur ? short(cur) : '-') + '»' + (cur && ts(st, cur).start > 1 ? ', ступень ' + ts(st, cur).start : ''));
    E.save(st);
    return { type: 'diag-done', topic: cur };
  };

  /* ---------- сохранение и коды ---------- */
  function hasLS() { try { return typeof localStorage !== 'undefined' && localStorage !== null; } catch (e) { return false; } }
  function migrate(st) {
    const b = newState();
    Object.keys(b).forEach(function (k) { if (st[k] === undefined) st[k] = b[k]; });
    Object.keys(b.settings).forEach(function (k) { if (st.settings[k] === undefined) st.settings[k] = b.settings[k]; });
    Object.keys(st.topics).forEach(function (id) { const x = blank(); Object.keys(x).forEach(function (k) { if (st.topics[id][k] === undefined) st.topics[id][k] = x[k]; }); });
    return st;
  }
  E.load = function () {
    try { if (hasLS()) { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } } catch (e) { /* пусто */ }
    return newState();
  };
  E.save = function (st) {
    try {
      if (!hasLS()) return false;
      localStorage.setItem(KEY, JSON.stringify(st, function (k, v) { return k.charAt(0) === '_' ? undefined : v; }));
      return true;
    } catch (e) { return false; }
  };
  E.storageOk = function () {
    try { if (!hasLS()) return false; localStorage.setItem(KEY + '.t', '1'); localStorage.removeItem(KEY + '.t'); return true; } catch (e) { return false; }
  };
  E.newState = newState;

  function learnerData(st) {
    return { v: st.v, cv: M.CONTENT_VERSION, learner: st.learner, diag: st.diag, topics: st.topics, current: st.current, stack: st.stack,
      gaps: st.gaps, sessions: st.sessions, log: st.log, hist: st.hist, seq: st.seq, exported: Date.now() };
  }
  function b64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function pipe(bytes, stream) {
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer();
    return new Uint8Array(buf);
  }
  E.exportCode = async function (st) {
    const bytes = new TextEncoder().encode(JSON.stringify(learnerData(st)));
    if (typeof CompressionStream !== 'undefined') {
      try { return 'MBP1' + b64(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch (e) { /* без сжатия */ }
    }
    return 'MBP0' + b64(bytes);
  };
  E.importCode = async function (code) {
    code = String(code || '').replace(/\s+/g, '');
    const tag = code.slice(0, 4);
    if (tag !== 'MBP1' && tag !== 'MBP0') throw new Error('Это не код из приложения. Код начинается с букв MBP.');
    let bytes;
    try { bytes = unb64(code.slice(4)); } catch (e) { throw new Error('Код повреждён. Скопируйте его целиком ещё раз.'); }
    if (tag === 'MBP1') {
      if (typeof DecompressionStream === 'undefined') throw new Error('Этот браузер не читает сжатый код. Откройте приложение в Chrome.');
      try { bytes = await pipe(bytes, new DecompressionStream('deflate-raw')); } catch (e) { throw new Error('Код повреждён. Скопируйте его целиком ещё раз.'); }
    }
    let data;
    try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch (e) { throw new Error('Код повреждён. Скопируйте его целиком ещё раз.'); }
    if (!data || !data.learner || !data.topics) throw new Error('В коде нет данных ученика.');
    return data;
  };
  // восстановить ученика на этом устройстве
  E.restore = function (st, data) {
    ['learner', 'diag', 'topics', 'current', 'stack', 'gaps', 'sessions', 'log', 'hist', 'seq'].forEach(function (k) { if (data[k] !== undefined) st[k] = data[k]; });
    st._f = null;
    migrate(st);
    E.save(st);
  };
  // учитель: добавить или обновить ученика из кода
  E.addStudent = function (st, data, now) {
    st.students[data.learner.id] = { data: data, imported: now };
    E.save(st);
    return data.learner.id;
  };

  /* ---------- для взрослых: темы, даты, пробелы, отчёт ---------- */
  const STATUS = { new: 'не начата', learning: 'в работе', today: 'закрыта сегодня', closed: 'закрыта', known: 'понятна по разведке' };
  const DIAGL = { known: 'понятна', partial: 'частично понятна', basics: 'начать с основ', new: 'не проверялась' };
  const SRC = { diag: 'разведка', task: 'задача на ступени', base: 'проверка основы', prac: 'тренировка' };
  const RES = { 2: 'сразу верно', 1: 'с подсказкой', 0: 'решение показано', '-1': 'не знаю' };
  const MODE = { d: 'разведка', l: 'ступень', c: 'контроль', n: 'проверка через день', r: 'повторение', g: 'возврат к задаче', b: 'проверка основы', e: 'лёгкая задача', x: 'глубже', p: 'тренировка', z: 'задача полегче' };
  E.labels = { STATUS: STATUS, DIAGL: DIAGL, SRC: SRC, RES: RES, MODE: MODE };
  E.score = score; E.zone = zone; E.dkey = dkey; E.ddmm = ddmm; E.addDays = addDays;

  E.topicRows = function (data, now) {
    const today = dkey(now);
    return TOPS.map(function (t) {
      const s = tsr(data, t.id), sc = score(s.th);
      let st = STATUS[s.status];
      if (s.status === 'learning') st += ', ступень ' + s.step + (s.ctl ? ' (контроль)' : '');
      if (s.status === 'today') st = 'закрыта ' + ddmm(s.closed) + ', проверка ' + (s.due <= today ? 'на ближайшем занятии' : ddmm(s.due));
      return { id: t.id, n: t.n, title: t.title, codes: t.codes, lessons: t.lessons, dates: t.dates, status: s.status, label: st, score: sc, zone: zone(sc),
        diag: DIAGL[s.diag] || '', last: s.last, deep: s.deep, deepN: s.deepN, passed: s.passed.filter(Boolean).length,
        review: s.rdue && (s.status === 'closed' || s.status === 'known') ? s.rdue : '' };
    });
  };
  function minutes(s) { return Math.max(1, Math.round((s.end - s.start) / 60000)); }
  function fmtMin(m) { const h = Math.floor(m / 60), r = m % 60; return h ? h + ' ч ' + (r ? r + ' мин' : '') : m + ' мин'; }
  E.fmtMin = fmtMin;
  E.days = function (data) {
    const by = {};
    (data.sessions || []).forEach(function (s) {
      if (!s.n && !s.ev.length) return;
      const d = by[s.date] || (by[s.date] = { date: s.date, min: 0, n: 0, c: 0, h: 0, f: 0, dk: 0, ev: [], tp: [], sessions: 0 });
      d.min += minutes(s); d.n += s.n; d.c += s.c; d.h += s.h; d.f += s.f; d.dk += s.dk; d.sessions++;
      s.ev.forEach(function (e) { d.ev.push(e); });
      s.tp.forEach(function (t) { if (d.tp.indexOf(t) < 0) d.tp.push(t); });
    });
    return Object.keys(by).sort().reverse().map(function (k) { return by[k]; });
  };
  function lctx(data) { const l = data.learner || {}; return { interests: l.interests || [], g: l.g || 'm' }; }
  // текст задачи заново по зерну
  E.taskText = function (data, topicId, step, gi, seed) {
    try { const q = M.makeQuestion(topicId, step, lctx(data), gi, seed); return q.prompt; } catch (e) { return ''; }
  };
  E.dayTasks = function (data, date) {
    return (data.log || []).filter(function (r) { return dkey(r[0] * 1000) === date && 'dlcnrgbexpz'.indexOf(r[3]) >= 0; }).map(function (r) {
      return { time: r[0] * 1000, topic: r[1], step: r[2], mode: MODE[r[3]], res: RES[r[4]], code: r[4], sec: r[7],
        text: E.taskText(data, r[1], r[2], r[8], r[9]) };
    });
  };
  E.gapRows = function (data) {
    return (data.gaps || []).slice().reverse().map(function (g) {
      return { id: g.id, topic: g.topic, title: short(g.topic), step: g.step, src: SRC[g.src] || g.src, found: g.found,
        status: g.status === 'open' ? 'открыт' : g.status === 'today' ? 'закрыт сегодня' : 'закрыт', code: g.status, tries: g.tries,
        text: E.taskText(data, g.topic, g.step, g.gi, g.seed) };
    });
  };
  // сумма баллов по темам на каждый день (для графика)
  E.series = function (data) {
    const keys = Object.keys(data.hist || {}).sort(), last = {};
    return keys.map(function (k) {
      Object.keys(data.hist[k]).forEach(function (id) { last[id] = data.hist[k][id]; });
      let sum = 0; TOPS.forEach(function (t) { sum += last[t.id] || 0; });
      return { date: k, total: sum };
    });
  };
  E.maxTotal = function () { return 50 * N; };
  function pct(a, b) { return b ? Math.round(100 * a / b) + '%' : '-'; }
  E.report = function (data, fromKey, toKey, now) {
    const l = data.learner || {}, lines = [];
    const ss = (data.sessions || []).filter(function (s) { return s.date >= fromKey && s.date <= toKey; });
    const rows = (data.log || []).filter(function (r) { const d = dkey(r[0] * 1000); return d >= fromKey && d <= toKey && 'lcnrgbexpz'.indexOf(r[3]) >= 0; });
    const c = rows.filter(function (r) { return r[4] === 2; }).length, h = rows.filter(function (r) { return r[4] === 1; }).length;
    const f0 = rows.filter(function (r) { return r[4] === 0; }).length;
    const chk = rows.filter(function (r) { return r[3] === 'n'; }), chkOk = chk.filter(function (r) { return r[4] === 2; }).length;
    let min = 0; ss.forEach(function (s) { min += minutes(s); });
    const days = {}; ss.forEach(function (s) { days[s.date] = 1; });
    lines.push('Ученик: ' + (l.nick || '-') + '. ' + (l.grade || '') + ' класс.');
    lines.push('Период: ' + ddmm(fromKey) + '-' + ddmm(toKey) + '.');
    lines.push('Дней с занятиями: ' + Object.keys(days).length + '. Время: ' + (min ? fmtMin(min) : '0 мин') + '.');
    lines.push('Задач: ' + rows.length + '. Сразу верно: ' + pct(c, rows.length) + '. С подсказкой: ' + pct(h, rows.length) + '. С показанным решением: ' + pct(f0, rows.length) + '.');
    if (chk.length) lines.push('Проверка через день: ' + chkOk + ' из ' + chk.length + ' верно (' + pct(chkOk, chk.length) + ').');
    lines.push('');
    lines.push('Темы:');
    E.topicRows(data, now).forEach(function (r) {
      if (r.status === 'new' && !r.last) return;
      lines.push('- ' + r.title + ': ' + r.label + '. Балл ' + r.score + ' из 50 (' + r.zone + ').' + (r.deep ? ' Глубже: ' + r.deep + ' из ' + r.deepN + '.' : ''));
    });
    const gaps = data.gaps || [];
    const open = gaps.filter(function (g) { return g.status === 'open'; }).length, closed = gaps.length - open;
    lines.push('');
    lines.push('Пробелы: открыто ' + open + ', закрыто ' + closed + '.');
    const evs = [];
    ss.forEach(function (s) { s.ev.forEach(function (e) { if (/закрыта|закреплена|снова в работе|Возврат|подтверждена/.test(e)) evs.push(ddmm(s.date) + ': ' + e + '.'); }); });
    if (evs.length) { lines.push(''); lines.push('Главное по датам:'); evs.forEach(function (e) { lines.push('- ' + e); }); }
    return lines.join('\n');
  };

  // для тестов
  E._ = { DIFF: DIFF, P: P, ktpIndex: ktpIndex, covered: covered, fl: fl, ts: ts, sy: sy, IDX: IDX };
})();
