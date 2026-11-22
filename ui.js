/* ui.js - экраны ученика и раздел для взрослых. Без библиотек. */
(function () {
  'use strict';
  const M = globalThis.M, E = M.E;
  const root = document.getElementById('app');
  const H = M.toHTML, esc = M.esc;
  const LS_OK = E.storageOk();

  const U = {
    st: E.load(), screen: 'start', prev: 'map', card: null, att: null, key: '',
    onb: { grade: 5, interests: [], nick: '', g: 'm', err: '' },
    ad: { ok: false, tab: 'topics', who: 'self', pin: '', pin1: '', stage: '', err: '', period: 7, open: {}, day: null, sample: {}, imp: '', impMsg: '' },
    menu: false, sheet: null, code: '', codeState: '', rest: '', restMsg: '', exNote: '', toastT: 0, scrollMsg: false
  };
  window.MBP = { U: U, E: E, M: M };   // для проверки и отладки

  /* ---------- иконки ---------- */
  const SW = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  function ic(p) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + '</svg>'; }
  const IC = {
    check: ic('<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
    bulb: ic('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" ' + SW + '/>'),
    sound: ic('<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" ' + SW + '/>'),
    map: ic('<path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4zM9 4v13M15 6.5v13" ' + SW + '/>'),
    menu: ic('<path d="M4 7h16M4 12h16M4 17h16" ' + SW + '/>'),
    lock: ic('<rect x="5" y="11" width="14" height="9" rx="2" ' + SW + '/><path d="M8 11V8a4 4 0 0 1 8 0v3" ' + SW + '/>'),
    clock: ic('<circle cx="12" cy="12" r="8.5" ' + SW + '/><path d="M12 7.5V12l3 2" ' + SW + '/>'),
    sun: ic('<circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" ' + SW + '/>'),
    back: ic('<path d="M10 6l-6 6 6 6M4.5 12H20" ' + SW + '/>'),
    del: ic('<path d="M9 5h11v14H9l-6-7 6-7z" ' + SW + '/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5" ' + SW + '/>'),
    arrow: ic('<path d="M5 12h14M13 6l6 6-6 6" ' + SW + '/>'),
    eye: ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" ' + SW + '/><circle cx="12" cy="12" r="3" ' + SW + '/>'),
    star: ic('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" ' + SW + '/>'),
    copy: ic('<rect x="8" y="8" width="12" height="12" rx="2" ' + SW + '/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" ' + SW + '/>'),
    dot: ic('<circle cx="12" cy="12" r="5" fill="currentColor"/>')
  };
  const FACE = '<svg class="face" viewBox="0 0 48 48" aria-hidden="true"><circle class="f-sun" cx="24" cy="24" r="21"/><circle class="f-ink" cx="17.5" cy="21" r="2.6"/><circle class="f-ink" cx="30.5" cy="21" r="2.6"/><path class="f-line" d="M17 29c3.5 3.4 10.5 3.4 14 0"/></svg>';

  /* ---------- мелочи ---------- */
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function plural(n, f) { return M.plural(n, f); }
  function pct(a, b) { return b ? Math.round(100 * a / b) + '%' : '-'; }
  function ddmm(k) { return E.ddmm(k); }
  function today() { return E.dkey(Date.now()); }
  function ctxOf() { const l = U.st.learner || {}; return { interests: l.interests || [], g: l.g || 'm' }; }
  function fem() { return !!(U.st.learner && U.st.learner.g === 'f'); }
  function T(id) { return M.topicById(id); }
  function weekday(k) { const p = k.split('-').map(Number); return ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][new Date(p[0], p[1] - 1, p[2]).getDay()]; }
  function audioOn() { return TTS.ok && U.st.settings.audio; }

  /* ---------- озвучка ---------- */
  const TTS = {
    ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
    voice: null,
    init: function () {
      if (!this.ok) return;
      const self = this;
      const pv = function () { try { const vs = window.speechSynthesis.getVoices() || []; self.voice = vs.find(function (v) { return /^ru([-_]|$)/i.test(v.lang); }) || null; } catch (e) { /* нет голосов */ } };
      pv();
      try { window.speechSynthesis.addEventListener('voiceschanged', pv); } catch (e) { /* старый браузер */ }
    },
    say: function (parts) {
      if (!this.ok) return;
      try {
        window.speechSynthesis.cancel();
        const u = new window.SpeechSynthesisUtterance(parts.map(function (p) { return M.speech(p); }).join('. '));
        u.lang = 'ru-RU'; if (this.voice) u.voice = this.voice; u.rate = 0.92;
        window.speechSynthesis.speak(u);
      } catch (e) { /* озвучка недоступна */ }
    },
    stop: function () { if (this.ok) { try { window.speechSynthesis.cancel(); } catch (e) { /* пусто */ } } }
  };

  function toast(text) {
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = text; el.classList.add('show');
    clearTimeout(U.toastT);
    U.toastT = setTimeout(function () { el.classList.remove('show'); }, 1700);
  }

  /* ---------- общие куски ---------- */
  function say(text, extra) { return '<div class="say">' + FACE + '<div class="bubble">' + H(text) + (extra || '') + '</div></div>'; }
  function bar(o) { return '<header class="bar">' + (o.left || '<span></span>') + '<div class="bar-title">' + (o.title || '') + '</div>' + (o.right || '<span></span>') + '</header>'; }
  function mapBtn() { return '<button class="ibtn" data-act="go-map" aria-label="Карта">' + IC.map + '<span>Карта</span></button>'; }
  function menuBtn() { return '<button class="ibtn" data-act="menu" aria-label="Меню" aria-expanded="' + U.menu + '">' + IC.menu + '</button>'; }
  function backBtn(to, label) { return '<button class="ibtn" data-act="to" data-to="' + to + '" aria-label="' + (label || 'Назад') + '">' + IC.back + '<span>' + (label || 'Назад') + '</span></button>'; }
  function dots(step) {
    let s = '<div class="dots"><span class="dots-row" aria-hidden="true">';
    for (let i = 1; i <= 5; i++) s += '<i class="' + (i < step ? 'done' : i === step ? 'cur' : '') + '"></i>';
    return s + '</span><span>Ступень ' + step + ' из 5</span></div>';
  }
  function tchip(t) { return '<div class="th"><span class="tchip">' + t.n + '</span><span class="tname">' + esc(t.title) + '</span></div>'; }

  /* ---------- первый вход ---------- */
  function vStart() {
    const tiles = [['Математика', 'Дроби 5 класса', true], ['Физика', 'скоро', false], ['Русский язык', 'скоро', false], ['Информатика', 'скоро', false]];
    return bar({ title: 'Математика без потолка' }) +
      say('Привет! Что будем учить?') +
      '<div class="tiles">' + tiles.map(function (t) {
        return t[2] ? '<button class="tile on" data-act="to" data-to="grade"><b>' + t[0] + '</b><span>' + t[1] + '</span></button>'
          : '<div class="tile fog" aria-disabled="true"><b>' + t[0] + '</b><span>' + t[1] + '</span></div>';
      }).join('') + '</div>' +
      '<div class="seg-row" role="group" aria-label="Язык"><button class="seg on" aria-pressed="true">РУС</button><button class="seg" disabled>ҚАЗ · скоро</button></div>' +
      '<div class="foot-links"><button class="link" data-act="to" data-to="restore">Перенести свой прогресс</button><button class="link" data-act="adult">Учителю и родителям</button></div>';
  }
  function vGrade() {
    return bar({ left: backBtn('start'), title: 'О себе' }) + say('Ты в каком классе?') +
      '<div class="grades">' + [5, 6, 7, 8, 9].map(function (g) {
        return g <= 6 ? '<button class="btn btn-secondary big" data-act="grade" data-g="' + g + '">' + g + '</button>'
          : '<button class="btn btn-fog big" disabled>' + g + '<small>скоро</small></button>';
      }).join('') + '</div>' +
      '<p class="tip">Класс не ограничивает темы. Он помогает найти точку старта.</p>';
  }
  function vInterests() {
    const sel = U.onb.interests;
    return bar({ left: backBtn('grade'), title: 'О себе' }) + say('Что тебе интересно? Выбери до трёх.') +
      '<div class="chips">' + M.INTERESTS.map(function (it) {
        const on = sel.indexOf(it.id) >= 0;
        return '<button class="chip' + (on ? ' on' : '') + '" data-act="int" data-id="' + it.id + '" aria-pressed="' + on + '">' + (on ? IC.check : '') + it.label + '</button>';
      }).join('') + '</div>' +
      '<p class="tip">Интересы меняют примеры в задачах. Числа и шаги остаются теми же.</p>' +
      '<button class="btn btn-primary" data-act="to" data-to="nick">' + (sel.length ? 'Дальше' : 'Пропустить') + ' ' + IC.arrow + '</button>';
  }
  function vNick() {
    const o = U.onb;
    return bar({ left: backBtn('interests'), title: 'О себе' }) + say('Придумай себе ник. Настоящее имя не нужно.') +
      '<section class="card">' +
      '<label class="lbl" for="nick-in">Ник</label><input id="nick-in" class="field" type="text" maxlength="16" autocomplete="off" spellcheck="false" value="' + esc(o.nick) + '" placeholder="Например, Звезда">' +
      '<div class="lbl">Как тебе писать?</div><div class="seg-row two">' +
      '<button class="seg' + (o.g === 'm' ? ' on' : '') + '" data-act="g" data-g="m" aria-pressed="' + (o.g === 'm') + '">Ты решил</button>' +
      '<button class="seg' + (o.g === 'f' ? ' on' : '') + '" data-act="g" data-g="f" aria-pressed="' + (o.g === 'f') + '">Ты решила</button></div>' +
      (o.err ? '<div class="msg note">' + esc(o.err) + '</div>' : '') +
      '</section><button class="btn btn-primary" data-act="to-diag">Дальше ' + IC.arrow + '</button>';
  }
  function vDiagIntro() {
    return bar({ left: backBtn('nick'), title: 'Разведка' }) + say('Найдём точку старта. Это не контрольная.') +
      '<section class="card"><p>Будет до 7 коротких задач.</p><p>Не знаешь ответ? Нажми «Не знаю». Это честно и помогает найти нужную тему.</p></section>' +
      '<button class="btn btn-primary" data-act="diag-start">Начать ' + IC.arrow + '</button>';
  }

  /* ---------- задача ---------- */
  function blankInp() { return { v: '', w: '', n: '', d: '' }; }
  function firstBox(spec) { return spec.kind === 'fraction' ? 'n' : 'v'; }
  function curSpec() { const q = U.card.q; return q.kind === 'steps' ? q.steps[U.att.sub] : q; }
  function startAttempt() {
    const spec = curSpec0(U.card.q);
    U.att = { sub: 0, subs: [], wrong: 0, shown: 0, totalWrong: 0, totalHints: 0, dis: [], inp: blankInp(), focus: firstBox(spec),
      msg: null, pic: false, revealed: false, specDone: false, done: false, res: null, t0: Date.now() };
  }
  function curSpec0(q) { return q.kind === 'steps' ? q.steps[0] : q; }
  function answerText(spec) {
    if (spec.kind === 'number') return String(spec.answer);
    if (spec.kind === 'yesno') return spec.answer ? 'Да' : 'Нет';
    if (spec.kind === 'choice') return spec.options[spec.answer];
    if (spec.kind === 'fraction') {
      const f = M.F(spec.answer), form = spec.form || {};
      if (form.den) return M.fr(f.n * form.den / f.d, form.den);
      if (form.improper) return M.mk(f.red(), false);
      return M.mk(f.red(), true);
    }
    return '';
  }
  function praise(res) {
    if (res === 2) return pick(['Верно.', 'Точно.', 'Так и есть.', 'Верно. Идём дальше.']);
    if (U.att.wrong > 0) return fem() ? 'Ты нашла ошибку и исправила. Так и учатся.' : 'Ты нашёл ошибку и исправил. Так и учатся.';
    return 'С подсказкой получилось. Это тоже учёба.';
  }
  function picFor(card) {
    if (card.step > 5) return '';
    try {
      const own = M.explainFor(card.topic, card.step, ctxOf()).visual;
      if (own) return own;
      for (let s = card.step - 1; s >= 1; s--) { const v = M.explainFor(card.topic, s, ctxOf()).visual; if (v) return v; }
    } catch (e) { /* без рисунка */ }
    return '';
  }

  function submit(value) {
    const c = U.card, a = U.att;
    if (!a || a.done || a.specDone) return;
    const spec = curSpec(), r = M.checkAnswer(spec, value);
    if (r.invalid || r.partial) { a.msg = { type: 'note', html: esc(r.msg) }; render(); return; }
    if (r.ok) {
      const res = a.wrong === 0 && a.shown === 0 ? 2 : 1;
      a.msg = { type: 'ok', html: esc(praise(res)) + (r.note ? '<div class="sub">' + H(r.note) + '</div>' : '') };
      endSpec(res);
    } else {
      a.wrong++; a.totalWrong++;
      if (c.once) {
        a.msg = { type: 'note', html: c.mode === 'd' ? 'Принято.' : 'Посмотри решение.' };
        if (c.mode !== 'd') a.revealed = true;
        if (c.q.kind === 'steps') { a.subs[a.sub] = { res: 0 }; finishTask(0); } else endSpec(0);
      } else if (a.wrong >= 3) {
        a.revealed = true;
        a.msg = { type: 'note', html: 'Вот как решать.' };
        endSpec(0);
      } else {
        if (spec.kind === 'choice') a.dis.push(value);
        if (spec.kind === 'yesno') a.dis.push(value ? 1 : 0);
        const before = a.shown;
        a.shown = Math.min((spec.hints || []).length, Math.max(a.shown, a.wrong));
        a.totalHints += a.shown - before;
        a.pic = a.wrong === 2 && !!picFor(c);
        a.msg = { type: 'hint', html: a.pic ? 'Вот пример с картинкой.' : 'Давай попробуем проще.' };
        a.inp = blankInp(); a.focus = firstBox(spec);
      }
    }
    U.scrollMsg = true;
    render();
  }
  function endSpec(res) {
    const c = U.card, a = U.att, q = c.q;
    if (q.kind === 'steps') {
      a.subs[a.sub] = { res: res };
      if (a.sub < q.steps.length - 1) {
        a.sub++; a.wrong = 0; a.shown = 0; a.dis = []; a.pic = false; a.revealed = false; a.specDone = false;
        a.inp = blankInp(); a.focus = firstBox(curSpec());
        a.msg = null;
        return;
      }
      res = a.subs.some(function (s) { return s.res === 0; }) ? 0 : a.subs.some(function (s) { return s.res === 1; }) ? 1 : 2;
      if (res < 2 && a.msg && a.msg.type === 'ok') a.msg = { type: 'ok', html: res === 1 ? 'Задача решена. С подсказкой это тоже учёба.' : 'Задача разобрана. Дальше будет похожая.' };
    }
    a.specDone = true;
    finishTask(res);
  }
  function finishTask(res) {
    const c = U.card, a = U.att;
    a.specDone = true; a.done = true; a.res = res;
    E.answer(U.st, c, { res: res, wrong: a.totalWrong, hints: a.totalHints, ms: Date.now() - a.t0 }, Date.now());
    if (c.mode === 'd') { toast(res === 2 ? 'Верно' : 'Принято'); nextCard(); }
  }

  function vInput(spec) {
    const a = U.att, dis = a.specDone || a.done;
    if (spec.kind === 'choice') {
      return '<div class="opts' + (spec.signs ? ' signs' : '') + (spec.options.length > 3 ? ' many' : '') + '">' + spec.options.map(function (o, i) {
        const off = dis || a.dis.indexOf(i) >= 0, right = a.done && i === spec.answer && (a.res === 2 || a.res === 1 || a.revealed);
        return '<button class="opt' + (right ? ' right' : '') + '" data-act="opt" data-i="' + i + '"' + (off ? ' disabled' : '') + '>' +
          (right ? IC.check : '') + (spec.signs ? '<span class="sign">' + esc(o) + '</span>' : '<span>' + H(o) + '</span>') + '</button>';
      }).join('') + '</div>';
    }
    if (spec.kind === 'yesno') {
      return '<div class="opts two">' + [[1, 'Да'], [0, 'Нет']].map(function (p) {
        const off = dis || a.dis.indexOf(p[0]) >= 0, right = a.done && (spec.answer ? 1 : 0) === p[0];
        return '<button class="opt' + (right ? ' right' : '') + '" data-act="yn" data-v="' + p[0] + '"' + (off ? ' disabled' : '') + '>' + (right ? IC.check : '') + '<span>' + p[1] + '</span></button>';
      }).join('') + '</div>';
    }
    let h = '<div class="ans-row">';
    if (spec.kind === 'number') h += box('v', dis);
    else {
      h += '<div class="fin">' + (spec.withWhole ? '<div class="fin-w">' + box('w', dis) + '<span class="cap">целая часть</span></div>' : '') +
        '<div class="fin-f">' + box('n', dis) + '<i class="fin-bar"></i>' + box('d', dis) + '</div></div>';
    }
    h += '</div>';
    if (!dis) h += keypad(spec.kind === 'fraction');
    return h;
  }
  function box(k, dis) {
    const a = U.att, v = a.inp[k] || '';
    const name = { v: 'Ответ', w: 'Целая часть', n: 'Числитель', d: 'Знаменатель' }[k];
    return '<button class="box b-' + k + (a.focus === k && !dis ? ' focus' : '') + '" data-act="focus" data-box="' + k + '"' + (dis ? ' disabled' : '') + ' aria-label="' + name + (v ? ': ' + esc(v) : '') + '">' +
      (v ? esc(v) : '<span class="ph">' + (k === 'w' ? '' : '?') + '</span>') + '</button>';
  }
  function keypad(frac) {
    let h = '<div class="pad" role="group" aria-label="Цифры">';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(function (k) { h += '<button class="key" data-act="key" data-k="' + k + '">' + k + '</button>'; });
    h += '<button class="key fn" data-act="key" data-k="del" aria-label="Стереть">' + IC.del + '</button>';
    h += '<button class="key" data-act="key" data-k="0">0</button>';
    h += frac ? '<button class="key fn" data-act="key" data-k="tab" aria-label="Следующее окошко">' + IC.arrow + '</button>' : '<span></span>';
    return h + '</div><button class="btn btn-primary" data-act="check">Проверить</button>';
  }
  function vMsg() {
    const a = U.att;
    if (!a.msg) return '';
    const icon = a.msg.type === 'ok' ? IC.check : a.msg.type === 'hint' ? IC.bulb : '';
    return '<div class="msg ' + a.msg.type + '" role="status">' + icon + '<div>' + a.msg.html + '</div></div>';
  }
  function vHints(spec) {
    const a = U.att;
    let h = '';
    for (let i = 0; i < a.shown && i < (spec.hints || []).length; i++) h += '<div class="hint">' + IC.bulb + '<div><span class="lbl-in">Подсказка ' + (i + 1) + '.</span> ' + H(spec.hints[i]) + '</div></div>';
    if (a.pic && !a.done) { const v = picFor(U.card); if (v) h += '<div class="vis-wrap pic">' + v + '</div>'; }
    return h;
  }
  function vSteps(c) {
    const a = U.att, q = c.q;
    let h = '<ol class="steps">';
    q.steps.forEach(function (s, i) {
      const r = a.subs[i];
      if (r) {
        h += '<li class="st-done' + (r.res === 0 ? ' shown' : '') + '"><div class="st-q">' + H(s.prompt) + '</div><div class="st-a">' +
          (r.res === 0 ? IC.eye + '<span>Ответ: ' + H(answerText(s)) + '</span>' : IC.check + '<span>' + H(answerText(s)) + '</span>') + '</div></li>';
      } else if (i === a.sub && !a.done) {
        h += '<li class="st-cur"><div class="st-ask">' + (i === 0 ? 'Что сделаем первым?' : 'Что дальше?') + '</div><div class="st-q">' + H(s.prompt) + '</div>' +
          vInput(s) + vMsg() + vHints(s) + '</li>';
      } else {
        h += '<li class="st-next"><div class="st-q">Шаг ' + (i + 1) + '</div></li>';
      }
    });
    h += '</ol>';
    if (a.done) {
      if (q.result) h += '<div class="result">' + H(q.result) + '</div>';
      h += vMsg();
      if (a.res < 2 && q.solution) h += '<div class="sol"><div class="lbl">Решение</div>' + H(q.solution) + '</div>';
    }
    return h;
  }
  function headTask(c) {
    const t = T(c.topic), s = U.st.topics[c.topic];
    if (c.mode === 'd') {
      return '<div class="prog"><div class="prog-txt">Задача ' + c.n + ' из ' + c.total + '</div><div class="prog-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + c.total + '" aria-valuenow="' + c.n + '"><i style="width:' + Math.round(100 * c.n / c.total) + '%"></i></div></div>';
    }
    let h = tchip(t);
    if (c.mode === 'l' || c.mode === 'g') h += dots(c.step);
    else if (c.mode === 'c') { const k = s && s.ctl; h += '<div class="sub">' + (k && k.extra ? 'Ещё одна задача.' : 'Задача ' + ((k ? k.i : 0) + 1) + ' из 3.') + ' Без подсказок.</div>'; }
    else if (c.mode === 'n') { const k = s && s.chk; h += '<div class="sub">Задача ' + ((k ? k.n : 0) + 1) + ' из 2. Без подсказок.</div>'; }
    else if (c.mode === 'x') h += '<div class="sub">Задачи выше уровня класса. Подсказки есть.</div>';
    else if (c.mode === 'b') h += '<div class="sub">Короткая проверка основы.</div>';
    if (c.mode === 'p' || c.prac) h += '<div class="sub">Тренировка' + (c.pi ? ': задача ' + c.pi.n + ' из ' + c.pi.total : '') + '. Подсказки есть.</div>';
    return h;
  }
  function taskTitle(c) {
    if (c.prac) return 'Тренировка';
    return { d: 'Разведка', l: 'Ступень ' + c.step, c: 'Контроль', n: 'Проверка', r: 'Повторение', g: 'Возврат к задаче', b: 'Проверка основы', e: 'Разгон', x: 'Глубже', p: 'Тренировка', z: 'Полегче' }[c.mode] || '';
  }
  function vTask(c) {
    const a = U.att, q = c.q;
    let h = bar({ left: c.mode === 'd' ? '<span></span>' : mapBtn(), title: taskTitle(c), right: c.mode === 'd' ? '<span></span>' : menuBtn() });
    h += '<section class="card task">' + headTask(c);
    let banner = c.banner || (c.mode === 'r' ? 'Вспомним тему «' + T(c.topic).short + '».' : '');
    if (banner) h += '<div class="banner">' + esc(banner) + '</div>';
    h += '<div class="prompt">' + H(q.prompt) + '</div>';
    if (q.visual) h += '<div class="vis-wrap">' + q.visual + '</div>';
    if (q.kind === 'steps') h += vSteps(c);
    else {
      h += '<div class="answer">' + vInput(q) + '</div>' + vMsg() + vHints(q);
      if (a.done && (a.revealed || a.res === 0) && q.solution) h += '<div class="sol"><div class="lbl">Решение</div>' + H(q.solution) + '</div>';
      else if (a.done && a.res === 1 && q.solution) h += '<div class="sol soft"><div class="lbl">Решение</div>' + H(q.solution) + '</div>';
    }
    if (a.done) h += '<button class="btn btn-primary" data-act="next" id="next-btn">Дальше ' + IC.arrow + '</button>';
    h += '</section>';
    if (!a.done) {
      h += '<div class="tools">';
      const spec = curSpec();
      if (c.hints) h += a.shown < (spec.hints || []).length ? '<button class="btn btn-soft" data-act="hint">' + IC.bulb + ' Подсказка</button>' : '<button class="btn btn-soft" data-act="hint">' + IC.eye + ' Покажи решение</button>';
      if (audioOn()) h += '<button class="btn btn-soft" data-act="say-task">' + IC.sound + ' Повтори</button>';
      if (c.dk) h += '<button class="btn btn-soft" data-act="dk">Не знаю</button>';
      if (c.mode === 'x') h += '<button class="btn btn-soft" data-act="stop-deep">' + IC.map + ' Хватит</button>';
      if (c.mode === 'p' || c.prac) h += '<button class="btn btn-soft" data-act="stop-prac">' + IC.map + ' Хватит</button>';
      h += '</div>';
    }
    return h;
  }

  /* ---------- объяснение и другие карточки ---------- */
  function vExplain(c) {
    const t = T(c.topic), ex = M.levelFor(c.topic, c.step, c.lvl || 0, ctxOf());
    const banner = U.exNote || (ex.lvl === 1 ? 'Давай попробуем проще.' : ex.lvl === 2 ? 'Разберём по шагам. Отвечай на маленькие вопросы.' : '');
    let h = bar({ left: mapBtn(), title: ex.lvl === 2 ? 'По шагам' : ex.lvl === 1 ? 'Проще' : 'Объяснение', right: menuBtn() });
    if (ex.lvl === 2) return h + vWalk(c, t, ex, banner);
    h += '<section class="card explain swipe">' + tchip(t) + dots(c.step) + (banner ? '<div class="banner">' + esc(banner) + '</div>' : '') + '<h2>' + esc(ex.title) + '</h2>' +
      ex.text.map(function (x) { return '<p>' + H(x) + '</p>'; }).join('') +
      (ex.visual ? '<div class="vis-wrap">' + ex.visual + '</div>' : '') + '</section>';
    h += '<div class="stack"><button class="btn btn-primary" data-act="ok">Понятно</button><button class="btn btn-secondary" data-act="simpler">Объясни проще</button>' +
      (audioOn() ? '<button class="btn btn-soft" data-act="say-ex">' + IC.sound + ' Послушать</button>' : '') + '</div>';
    h += '<p class="tip">Можно и свайпом: влево - «Понятно», вправо - «Объясни проще».</p>';
    return h;
  }
  function vWalk(c, t, ex, banner) {
    const w = U.walk || (U.walk = { i: 0, picked: null, order: null }), list = ex.walk, n = list.length;
    let h = '<section class="card explain walk">' + tchip(t) + dots(c.step) + (banner ? '<div class="banner">' + esc(banner) + '</div>' : '') + '<h2>' + esc(ex.title) + '</h2><div class="wsteps">';
    for (let i = 0; i < Math.min(w.i, n); i++) {
      const m = list[i];
      h += '<div class="wdone">' + (m.say ? '<p>' + H(m.say) + '</p>' : '') + (m.ask ? '<div class="wqa">' + IC.check + '<span>' + H(m.ask.q) + ' ' + H(m.ask.o[0]) + '</span></div>' : '') + '</div>';
    }
    if (w.i < n) {
      const m = list[w.i];
      h += '<div class="wcur"><div class="sub">Шаг ' + (w.i + 1) + ' из ' + n + '</div>' + (m.say ? '<p class="wsay">' + H(m.say) + '</p>' : '') + (m.vis ? '<div class="vis-wrap">' + m.vis + '</div>' : '');
      if (m.ask) {
        if (!w.order) { const idx = m.ask.o.map(function (x, j) { return j; }); w.order = m.ask.k ? idx : M.shuffle(idx); }
        const picked = w.picked !== null;
        h += '<div class="wq">' + H(m.ask.q) + '</div><div class="opts' + (m.ask.o.length === 2 ? ' two' : '') + '">' + w.order.map(function (j) {
          const right = picked && j === 0;
          return '<button class="opt' + (right ? ' right' : '') + '" data-act="w-opt" data-j="' + j + '"' + (picked ? ' disabled' : '') + '>' + (right ? IC.check : '') + '<span>' + H(m.ask.o[j]) + '</span></button>';
        }).join('') + '</div>';
        if (picked) h += (w.picked === 0 ? '<div class="msg ok">' + IC.check + '<div>Верно.</div></div>' : '<div class="msg hint">' + IC.bulb + '<div>Смотри: верный ответ ' + H(m.ask.o[0]) + '.</div></div>') +
          '<button class="btn btn-primary" data-act="w-next" id="next-btn">Дальше ' + IC.arrow + '</button>';
      } else h += '<button class="btn btn-primary" data-act="w-next" id="next-btn">Дальше ' + IC.arrow + '</button>';
      h += '</div>';
    }
    h += '</div></section>';
    if (w.i >= n) h += say('Теперь попробуй сам.') + '<div class="stack"><button class="btn btn-primary" data-act="ok" id="next-btn">Попробую сам ' + IC.arrow + '</button><button class="btn btn-secondary" data-act="simpler">Объясни проще</button></div>';
    else if (audioOn()) h += '<div class="tools"><button class="btn btn-soft" data-act="say-walk">' + IC.sound + ' Послушать</button></div>';
    return h;
  }
  function vInfo(c) {
    return bar({ left: mapBtn(), title: '', right: menuBtn() }) + say(c.text) +
      '<button class="btn btn-primary" data-act="' + (c.toMap ? 'go-map' : 'next') + '" id="next-btn">Дальше ' + IC.arrow + '</button>';
  }
  function vClosed(c) {
    const t = T(c.topic);
    let h = bar({ left: mapBtn(), title: 'Итог', right: menuBtn() });
    h += '<section class="card closed"><div class="glow">' + IC.sun + '</div><h2>Молодец, идём дальше.</h2>' +
      '<p>Тема «' + esc(t.title) + '» закрыта сегодня. На карте она загорелась.</p>' +
      '<p class="plan">' + IC.clock + '<span>На следующем занятии начнём с 2 задач на эту тему.</span></p>' +
      (c.back ? '<p>Основа готова. Вернёмся к теме «' + esc(T(c.back).title) + '».</p>' : '') + '</section>';
    h += say('Дальше или глубже?');
    h += '<div class="stack"><button class="btn btn-primary" data-act="after-closed">Дальше ' + IC.arrow + '</button>' +
      (c.deep ? '<button class="btn btn-secondary" data-act="deep" data-id="' + c.topic + '">' + IC.star + ' Глубже: задачи выше класса</button>' : '') + '</div>';
    return h;
  }
  function vBreak(c) {
    const text = c.reason === 'time' ? 'Ты занимаешься уже ' + U.st.settings.sessionMin + ' минут. Хорошая работа. Можно закончить на сегодня.'
      : 'Сложный участок. Можно отдохнуть и вернуться позже.';
    return bar({ left: mapBtn(), title: 'Перерыв?', right: menuBtn() }) + say(text) +
      '<div class="stack"><button class="btn btn-primary" data-act="end">Закончить на сегодня</button><button class="btn btn-secondary" data-act="next">Продолжим</button></div>';
  }
  function vDiagDone(c) {
    const t = c.topic ? T(c.topic) : null;
    return bar({ title: 'Разведка' }) + say('Готово! Точка старта найдена.') +
      '<section class="card">' + (t ? '<p>Начнём с темы «' + esc(t.title) + '».</p>' : '<p>Все темы на карте уже светятся.</p>') +
      '<p class="muted">Знакомые темы уже светятся на карте. По ходу дела мы проверим их ещё раз.</p></section>' +
      '<button class="btn btn-primary" data-act="go-map">Открыть карту ' + IC.arrow + '</button>';
  }
  function vAllDone() {
    let h = bar({ left: mapBtn(), title: 'Всё пройдено', right: menuBtn() }) + say('Все темы на карте светятся. Новые земли скоро появятся.');
    h += '<section class="card"><p>Пока можно идти глубже. Там задачи выше уровня класса.</p><div class="stack">' +
      M.TOPICS.filter(function (t) { return t.deep.length; }).map(function (t) { return '<button class="btn btn-secondary" data-act="deep" data-id="' + t.id + '">' + IC.star + ' ' + esc(t.short) + '</button>'; }).join('') + '</div></section>';
    return h;
  }

  /* ---------- карта ---------- */
  function nodeState(id, cur, td) {
    const s = U.st.topics[id];
    if (s && s.status === 'closed') return 'closed';
    if (s && s.status === 'known') return 'known';
    if (s && s.status === 'today') return 'today';
    if (id === cur) return 'current';
    if (s && s.status === 'learning') return 'learning';
    return E.avail(U.st, id) ? 'open' : 'locked';
  }
  function nodeLabel(state, id, td) {
    const s = U.st.topics[id];
    return { closed: 'светится', known: 'знакома', today: s && s.due && s.due <= td ? 'проверка сегодня' : 'проверка завтра', current: 'сейчас', learning: 'в работе', open: 'можно начать', locked: 'позже' }[state];
  }
  function dueCheck() { const td = today(); return M.TOPICS.find(function (t) { const s = U.st.topics[t.id]; return s && s.status === 'today' && s.due && s.due <= td; }); }
  function vMap() {
    const st = U.st, l = st.learner, td = today(), cur = E.currentTopic(st);
    const items = M.TOPICS.map(function (t) { return { t: t, state: nodeState(t.id, cur, td) }; }).concat(M.FUTURE.map(function (n) { return { fog: n }; }));
    const X = [50, 76, 50, 24], STEP = 124, TOP = 44, HGT = TOP + (items.length - 1) * STEP + 96;
    const pts = items.map(function (it, i) { return [X[i % 4], TOP + i * STEP]; });
    function seg(upto) {
      let d = 'M' + pts[0][0] + ' ' + pts[0][1];
      for (let i = 1; i <= upto; i++) { const p = pts[i - 1], q = pts[i], m = (p[1] + q[1]) / 2; d += ' C' + p[0] + ' ' + m + ' ' + q[0] + ' ' + m + ' ' + q[0] + ' ' + q[1]; }
      return d;
    }
    let lit = -1;
    items.forEach(function (it, i) { if (it.t && ['closed', 'known', 'today'].indexOf(it.state) >= 0 && lit === i - 1) lit = i; });
    const check = dueCheck();
    let greet = 'Привет, ' + l.nick + '! Продолжим?';
    if (check) greet = 'Привет, ' + l.nick + '! Сегодня начнём с проверки темы «' + check.short + '».';
    else if (!cur) greet = 'Привет, ' + l.nick + '! Все темы светятся. Выбирай тему и иди глубже.';
    let h = bar({ left: '<span class="nick">' + esc(l.nick) + '</span>', title: 'Карта дробей', right: menuBtn() });
    h += say(greet);
    if (!LS_OK) h += '<div class="msg note">Этот браузер не сохраняет прогресс. Открой ссылку в обычном окне Chrome или Safari.</div>';
    const lastExp = st.settings.lastExport || '';
    if (st.sessions.length > 3 && (!lastExp || E.addDays(lastExp, 7) <= td)) h += '<button class="remind" data-act="send">' + IC.copy + '<span>Пора отправить код учителю. Это займёт минуту.</span></button>';
    const weak = E.weakTopics(st);
    if (weak.length) h += '<section class="card weak"><div class="lbl">Темы для тренировки</div><div class="stack">' +
      weak.map(function (w) { return '<button class="btn btn-soft" data-act="prac" data-id="' + w.id + '">' + IC.bulb + ' ' + esc(T(w.id).short) + '</button>'; }).join('') + '</div></section>';
    h += '<p class="tip">Нажми на тему на карте. Её можно продолжить, потренировать или пройти глубже.</p>';
    h += '<div class="map" style="height:' + HGT + 'px"><svg class="path" viewBox="0 0 100 ' + HGT + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="trail" d="' + seg(pts.length - 1) + '"/>' + (lit > 0 ? '<path class="lit" d="' + seg(lit) + '"/>' : '') + '</svg>';
    items.forEach(function (it, i) {
      const pos = 'left:' + pts[i][0] + '%;top:' + pts[i][1] + 'px';
      if (it.fog) { h += '<button class="node n-fog" style="' + pos + '" data-act="fog" aria-label="' + esc(it.fog) + ', скоро"><span class="disc">' + IC.lock + '</span><span class="nlabel">' + esc(it.fog) + '<small>скоро</small></span></button>'; return; }
      const t = it.t, s = st.topics[t.id], sc = s ? E.score(s.th) : 0, len = 2 * Math.PI * 35;
      const inner = it.state === 'closed' ? IC.sun : it.state === 'today' ? IC.clock : it.state === 'known' ? IC.check : it.state === 'locked' ? IC.lock : '<span>' + t.n + '</span>';
      const ring = '<svg class="ring" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="35" class="ring-bg"/><circle cx="40" cy="40" r="35" class="ring-fg" stroke-dasharray="' + (len * sc / 50).toFixed(1) + ' ' + len.toFixed(1) + '"/></svg>';
      h += '<button class="node n-' + it.state + '" style="' + pos + '" data-act="node" data-id="' + t.id + '" aria-label="Тема ' + t.n + '. ' + esc(t.title) + '. ' + nodeLabel(it.state, t.id, td) + '"' + (it.state === 'current' ? ' id="cur-node"' : '') + '>' +
        '<span class="disc">' + ring + inner + '</span><span class="nlabel">' + esc(t.short) + '<small>' + nodeLabel(it.state, t.id, td) + '</small></span></button>';
    });
    h += '</div>';
    const label = check ? 'Начать проверку' : cur ? 'Продолжить: ' + T(cur).short : 'Глубже';
    h += '<div class="dock"><button class="btn btn-primary" data-act="' + (cur || check ? 'continue' : 'all-done') + '">' + esc(label) + ' ' + IC.arrow + '</button></div>';
    return h;
  }

  /* ---------- конец дня, код ---------- */
  function planTomorrow() {
    const td = today();
    const chk = M.TOPICS.find(function (t) { const s = U.st.topics[t.id]; return s && s.status === 'today'; });
    if (chk) return 'В следующий раз начнём с проверки темы «' + chk.short + '».';
    const cur = E.currentTopic(U.st);
    if (cur) return 'В следующий раз продолжим тему «' + T(cur).short + '».';
    return 'В следующий раз выбирай тему на карте.' + (td ? '' : '');
  }
  function vSummary() {
    const td = today(), ss = U.st.sessions.filter(function (s) { return s.date === td; });
    let n = 0, c = 0, hh = 0, evs = [];
    ss.forEach(function (s) { n += s.n; c += s.c; hh += s.h; evs = evs.concat(s.ev); });
    const steps = evs.filter(function (e) { return /ступень \d пройдена/.test(e); }).length;
    const closed = evs.filter(function (e) { return /закрыта сегодня/.test(e); }).length;
    let h = bar({ left: mapBtn(), title: 'На сегодня всё', right: menuBtn() }) + say(n ? 'Хорошо поработали. Вот итог дня.' : 'До встречи! Возвращайся завтра.');
    h += '<section class="card sum"><div class="sum-grid">' +
      '<div><b>' + n + '</b><span>' + plural(n, ['задача', 'задачи', 'задач']) + '</span></div>' +
      '<div><b>' + c + '</b><span>сразу верно</span></div>' +
      '<div><b>' + hh + '</b><span>с подсказкой</span></div>' +
      '<div><b>' + steps + '</b><span>' + plural(steps, ['ступень', 'ступени', 'ступеней']) + '</span></div></div>' +
      (closed ? '<p class="plan">' + IC.sun + '<span>Закрыто тем: ' + closed + '.</span></p>' : '') +
      '<p class="plan">' + IC.clock + '<span>' + esc(planTomorrow()) + '</span></p></section>';
    h += '<div class="stack"><button class="btn btn-primary" data-act="go-map">На карту</button><button class="btn btn-secondary" data-act="send">Отправить учителю</button></div>';
    return h;
  }
  function vSend() {
    let h = bar({ left: backBtn(U.prev || 'map'), title: 'Код для учителя' }) + say('Скопируй код и отправь учителю. Например, в WhatsApp.');
    h += '<section class="card">';
    if (U.codeState === 'busy') h += '<p>Готовлю код…</p>';
    else if (U.codeState === 'err') h += '<div class="msg note">Не получилось сделать код. Попробуй ещё раз.</div>';
    else {
      h += '<textarea class="code" id="code-out" readonly rows="5" aria-label="Код">' + esc(U.code) + '</textarea>' +
        '<button class="btn btn-primary" data-act="copy-code">' + IC.copy + ' Скопировать</button>' +
        '<p class="muted">В коде только ник и прогресс по темам. Имени и оценок в нём нет. Этот же код переносит прогресс на другой телефон.</p>';
    }
    return h + '</section>';
  }
  function vRestore() {
    return bar({ left: backBtn(U.st.learner ? 'map' : 'start'), title: 'Восстановить' }) + say('Вставь код, который ты сохранял раньше.') +
      '<section class="card"><textarea class="code" id="rest-in" rows="5" placeholder="MBP1..." aria-label="Код">' + esc(U.rest) + '</textarea>' +
      (U.restMsg ? '<div class="msg note">' + esc(U.restMsg) + '</div>' : '') +
      '<button class="btn btn-primary" data-act="do-restore">Восстановить</button></section>' +
      '<p class="tip">Здесь ученик переносит свой прогресс на этот телефон. Учитель вставляет код ученика в разделе для взрослых.</p>' +
      '<button class="btn btn-secondary" data-act="adult">Я учитель: раздел для взрослых</button>';
  }
  function vMenu() {
    if (!U.menu) return '';
    return '<div class="sheet-bg" data-act="menu"></div><div class="sheet" role="dialog" aria-label="Меню">' +
      (U.st.learner && U.st.diag && U.st.diag.done ? '<button class="btn btn-secondary" data-act="go-map">' + IC.map + ' Карта</button><button class="btn btn-secondary" data-act="end">Закончить на сегодня</button><button class="btn btn-secondary" data-act="send">' + IC.copy + ' Отправить учителю</button>' : '') +
      (TTS.ok ? '<button class="btn btn-secondary" data-act="toggle-audio">' + IC.sound + ' Озвучка: ' + (U.st.settings.audio ? 'включена' : 'выключена') + '</button>' : '') +
      '<button class="btn btn-quiet" data-act="adult">Для взрослых</button><button class="btn btn-quiet" data-act="menu">Закрыть</button></div>';
  }
  function vSheet() {
    const s = U.sheet;
    if (!s) return '';
    if (s.opts) {
      return '<div class="sheet-bg" data-act="sheet-no"></div><div class="sheet" role="dialog" aria-label="Выбор"><p>' + esc(s.text) + '</p>' +
        s.opts.map(function (o, i) { return '<button class="btn ' + (o.primary ? 'btn-primary' : 'btn-secondary') + '" data-act="sheet-opt" data-i="' + i + '">' + (o.icon || '') + '<span>' + esc(o.label) + '</span></button>'; }).join('') +
        '<button class="btn btn-quiet" data-act="sheet-no">Отмена</button></div>';
    }
    return '<div class="sheet-bg" data-act="sheet-no"></div><div class="sheet" role="dialog" aria-label="Подтверждение"><p>' + esc(s.text) + '</p>' +
      '<button class="btn ' + (s.danger ? 'btn-danger' : 'btn-primary') + '" data-act="sheet-yes">' + esc(s.yes) + '</button>' +
      '<button class="btn btn-secondary" data-act="sheet-no">' + esc(s.no || 'Отмена') + '</button></div>';
  }

  /* ---------- раздел для взрослых ---------- */
  function adData() {
    if (U.ad.who !== 'self' && U.st.students[U.ad.who]) return U.st.students[U.ad.who].data;
    return U.st.learner ? U.st : null;
  }
  function vPin() {
    const st = U.st, a = U.ad;
    let title = 'Введите PIN';
    if (!st.settings.pin) title = a.stage === 'new2' ? 'Повторите PIN' : 'Придумайте PIN из 4 цифр';
    else if (a.stage === 'new1') title = 'Новый PIN';
    else if (a.stage === 'new2') title = 'Повторите новый PIN';
    let h = bar({ left: '<button class="ibtn" data-act="ad-exit">' + IC.back + '<span>Назад</span></button>', title: 'Для взрослых' });
    h += '<section class="card pin"><h2>' + title + '</h2><div class="pin-dots" aria-label="Введено цифр: ' + a.pin.length + '">' +
      [0, 1, 2, 3].map(function (i) { return '<i class="' + (i < a.pin.length ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      (a.err ? '<div class="msg note">' + esc(a.err) + '</div>' : '') + '<div class="pad">';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(function (k) { h += '<button class="key" data-act="pin-key" data-k="' + k + '">' + k + '</button>'; });
    h += '<span></span><button class="key" data-act="pin-key" data-k="0">0</button><button class="key fn" data-act="pin-key" data-k="del" aria-label="Стереть">' + IC.del + '</button></div>' +
      '<p class="muted small">Раздел для учителя и родителей: прогресс по датам, пробелы, отчёт и настройки.</p></section>';
    return h;
  }
  const TABS = [['topics', 'Темы'], ['days', 'По датам'], ['gaps', 'Пробелы'], ['report', 'Отчёт'], ['code', 'Код'], ['content', 'Содержание'], ['rules', 'Правила'], ['settings', 'Настройки']];
  function vAdult() {
    if (!U.ad.ok) return vPin();
    const data = adData();
    let h = bar({ left: '<button class="ibtn" data-act="ad-exit">' + IC.back + '<span>Выйти</span></button>', title: 'Для взрослых' });
    const who = [];
    if (U.st.learner) who.push(['self', 'Этот телефон: ' + U.st.learner.nick]);
    Object.keys(U.st.students).forEach(function (id) { const s = U.st.students[id]; who.push([id, s.data.learner.nick + ' · код от ' + ddmm(E.dkey(s.imported))]); });
    if (who.length) h += '<div class="who" role="group" aria-label="Чьи данные">' + who.map(function (w) { return '<button class="chip' + (U.ad.who === w[0] ? ' on' : '') + '" data-act="who" data-id="' + w[0] + '" aria-pressed="' + (U.ad.who === w[0]) + '">' + esc(w[1]) + '</button>'; }).join('') + '</div>';
    h += '<nav class="tabs" aria-label="Разделы">' + TABS.map(function (t) { return '<button class="tab' + (U.ad.tab === t[0] ? ' on' : '') + '" data-act="tab" data-tab="' + t[0] + '" aria-current="' + (U.ad.tab === t[0] ? 'page' : 'false') + '">' + t[1] + '</button>'; }).join('') + '</nav>';
    let body;
    const needData = ['topics', 'days', 'gaps', 'report'].indexOf(U.ad.tab) >= 0;
    if (needData && !data) body = '<p class="muted">Данных ученика пока нет. На телефоне ученика пройдите первый вход. На телефоне учителя загрузите код во вкладке «Код».</p>';
    else body = { topics: tTopics, days: tDays, gaps: tGaps, report: tReport, code: tCode, content: tContent, rules: tRules, settings: tSettings }[U.ad.tab](data);
    return h + '<div class="ad">' + body + '</div>';
  }
  function kpi(v, l) { return '<div class="kpi"><b>' + v + '</b><span>' + l + '</span></div>'; }
  function statusIcon(s) { return { closed: IC.sun, today: IC.clock, known: IC.check, learning: IC.dot, new: '' }[s] || ''; }
  function tTopics(data) {
    const rows = E.topicRows(data, Date.now());
    const closed = rows.filter(function (r) { return r.status === 'closed' || r.status === 'today'; }).length;
    const known = rows.filter(function (r) { return r.status === 'known'; }).length, work = rows.filter(function (r) { return r.status === 'learning'; }).length;
    let min = 0; E.days(data).forEach(function (d) { min += d.min; });
    let h = '<div class="kpis">' + kpi(closed + ' из ' + rows.length, 'тем закрыто') + kpi(known, 'знакомы по разведке') + kpi(work, 'в работе') + kpi(min ? E.fmtMin(min) : '0 мин', 'время занятий') + '</div>';
    h += chart(E.series(data));
    h += '<div class="trows">' + rows.map(function (r) {
      const w = Math.round(100 * r.score / 50);
      return '<div class="trow"><div class="tr-top"><span class="tchip">' + r.n + '</span><div class="tr-name"><div>' + esc(r.title) + '</div>' +
        '<div class="muted small">Уроки ' + r.lessons + ' (' + ddmm(r.dates[0]) + '-' + ddmm(r.dates[1]) + '). Цели: ' + r.codes.join(', ') + '</div></div></div>' +
        '<div class="tr-mid"><span class="pill p-' + r.status + '">' + statusIcon(r.status) + '<span>' + esc(r.label) + '</span></span>' + (r.diag ? '<span class="muted small">Разведка: ' + r.diag + '</span>' : '') + '</div>' +
        '<div class="meter" role="img" aria-label="Балл ' + r.score + ' из 50"><i style="width:' + w + '%"></i></div>' +
        '<div class="tr-foot"><span>Балл ' + r.score + ' из 50: ' + r.zone + '</span>' + (r.last ? '<span>Занятие ' + ddmm(r.last) + '</span>' : '') +
        (r.deepN ? '<span>Глубже: ' + r.deep + ' из ' + r.deepN + '</span>' : '') + (r.review ? '<span>Повторение ' + ddmm(r.review) + '</span>' : '') + '</div></div>';
    }).join('') + '</div>';
    return h;
  }
  function dayNum(k) { const p = k.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]) / 86400000; }
  function chart(series) {
    const title = '<h3>Заполнение карты по дням</h3><p class="muted small">Сумма баллов по 12 темам в процентах от максимума. Баллы растут только от верных ответов.</p>';
    if (series.length < 2) return title + '<div class="chart-empty">График появится после второго дня занятий.</div>';
    const W = 640, Hh = 220, L = 44, R = 56, Tp = 16, B = 30, max = E.maxTotal();
    const d0 = dayNum(series[0].date), d1 = dayNum(series[series.length - 1].date), span = Math.max(1, d1 - d0);
    const pts = series.map(function (p) {
      const v = Math.round(100 * p.total / max);
      return { x: L + (W - L - R) * (dayNum(p.date) - d0) / span, y: Tp + (Hh - Tp - B) * (1 - v / 100), v: v, date: p.date, total: p.total };
    });
    let g = '';
    [0, 25, 50, 75, 100].forEach(function (v) { const y = Tp + (Hh - Tp - B) * (1 - v / 100); g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text class="axis" x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '%</text>'; });
    const line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');
    const area = line + ' L' + pts[pts.length - 1].x.toFixed(1) + ' ' + (Hh - B) + ' L' + pts[0].x.toFixed(1) + ' ' + (Hh - B) + ' Z';
    let marks = '';
    pts.forEach(function (p, i) { marks += '<circle class="mk' + (i === pts.length - 1 ? ' end' : '') + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (i === pts.length - 1 ? 5.5 : 4) + '"/>'; });
    const lp = pts[pts.length - 1];
    const xl = '<text class="axis" x="' + pts[0].x + '" y="' + (Hh - 8) + '" text-anchor="start">' + ddmm(pts[0].date) + '</text><text class="axis" x="' + lp.x + '" y="' + (Hh - 8) + '" text-anchor="end">' + ddmm(lp.date) + '</text>';
    const svg = '<svg class="chart-svg" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Заполнение карты: с ' + pts[0].v + '% ' + ddmm(pts[0].date) + ' до ' + lp.v + '% ' + ddmm(lp.date) + '">' +
      g + '<path class="area" d="' + area + '"/><path class="ln" d="' + line + '"/>' + marks +
      '<text class="endlbl" x="' + (lp.x + 9) + '" y="' + (lp.y + 5) + '">' + lp.v + '%</text>' + xl +
      '<line class="cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (Hh - B) + '" style="display:none"/></svg>';
    const table = '<details class="ttable"><summary>Таблица</summary><table><thead><tr><th>Дата</th><th>Заполнение</th><th>Сумма баллов</th></tr></thead><tbody>' +
      pts.map(function (p) { return '<tr><td>' + ddmm(p.date) + '</td><td>' + p.v + '%</td><td>' + p.total + ' из ' + max + '</td></tr>'; }).join('') + '</tbody></table></details>';
    return title + '<div class="chart" data-pts="' + esc(JSON.stringify(pts.map(function (p) { return [p.x, p.y, p.v, ddmm(p.date), p.total]; }))) + '" data-w="' + W + '" data-max="' + max + '">' + svg + '<div class="tip-box" hidden></div></div>' + table;
  }
  function tDays(data) {
    const days = E.days(data);
    if (!days.length) return '<p class="muted">Занятий пока нет.</p>';
    return days.map(function (d) {
      const open = U.ad.day === d.date;
      let h = '<div class="day"><button class="day-h" data-act="day" data-d="' + d.date + '" aria-expanded="' + open + '"><b>' + weekday(d.date) + ', ' + ddmm(d.date) + '</b>' +
        '<span>' + E.fmtMin(d.min) + ' · ' + d.n + ' ' + plural(d.n, ['задача', 'задачи', 'задач']) + ' · сразу верно ' + pct(d.c, d.n) + '</span></button>';
      if (d.tp.length) h += '<div class="small">Темы: ' + d.tp.map(function (id) { return esc(T(id).short); }).join(', ') + '</div>';
      if (d.ev.length) h += '<ul class="evs">' + d.ev.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>';
      if (open) {
        const list = E.dayTasks(data, d.date);
        h += '<ol class="tasks">' + list.map(function (x) {
          const tm = new Date(x.time), hm = (tm.getHours() < 10 ? '0' : '') + tm.getHours() + ':' + (tm.getMinutes() < 10 ? '0' : '') + tm.getMinutes();
          const cls = x.code === 2 ? 'ok' : x.code === 1 ? 'hint' : 'note';
          return '<li><div class="small muted">' + hm + ' · ' + esc(T(x.topic).short) + ' · ' + esc(x.mode) + (x.step <= 5 ? ', ступень ' + x.step : '') + (x.sec ? ' · ' + x.sec + ' с' : '') + '</div>' +
            '<div>' + H(x.text) + '</div><span class="pill p-r' + cls + '">' + (x.code === 2 ? IC.check : x.code === 1 ? IC.bulb : IC.eye) + '<span>' + esc(x.res) + '</span></span></li>';
        }).join('') + '</ol>';
      }
      return h + '</div>';
    }).join('');
  }
  function tGaps(data) {
    const rows = E.gapRows(data);
    if (!rows.length) return '<p class="muted">Пробелов нет.</p>';
    const open = rows.filter(function (r) { return r.code === 'open'; }).length;
    return '<p>Открыто: ' + open + '. Закрыто: ' + (rows.length - open) + '. Пробел - задача, которая не получилась. Её показывают снова после следующей ступени.</p>' +
      rows.map(function (r) {
        return '<div class="gap"><div class="gap-top"><span class="pill p-g' + r.code + '">' + (r.code === 'open' ? IC.bulb : r.code === 'today' ? IC.clock : IC.check) + '<span>' + r.status + '</span></span>' +
          '<span class="muted small">' + esc(r.title) + ', ступень ' + r.step + '. Найден ' + ddmm(r.found) + ': ' + r.src + '.' + (r.tries ? ' Попыток: ' + r.tries + '.' : '') + '</span></div><div class="gap-q">' + H(r.text) + '</div></div>';
      }).join('');
  }
  function reportText(data) {
    const td = today();
    let from = E.addDays(td, -(U.ad.period - 1));
    if (U.ad.period === 0) from = (data.sessions && data.sessions[0] && data.sessions[0].date) || td;
    return E.report(data, from, td, Date.now());
  }
  function tReport(data) {
    return '<div class="seg-row">' + [[7, '7 дней'], [30, '30 дней'], [0, 'Всё время']].map(function (p) { return '<button class="seg' + (U.ad.period === p[0] ? ' on' : '') + '" data-act="period" data-p="' + p[0] + '" aria-pressed="' + (U.ad.period === p[0]) + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<textarea id="report-out" class="code report" readonly rows="16" aria-label="Отчёт">' + esc(reportText(data)) + '</textarea>' +
      '<button class="btn btn-primary" data-act="copy-report">' + IC.copy + ' Скопировать отчёт</button><p class="muted small">В отчёте только ник ученика.</p>';
  }
  function tCode() {
    let h = '';
    if (U.st.learner) h += '<h3>Код ученика с этого телефона</h3><p class="muted">Код сохраняет прогресс. Его стоит отправлять учителю раз в неделю.</p><button class="btn btn-secondary" data-act="send">Сделать код</button>';
    h += '<h3>Добавить ученика по коду</h3><p class="muted">Для телефона учителя. Вставьте код, который прислал ученик. Ученик появится в списке сверху. Новый код того же ученика заменит старый.</p>' +
      '<textarea id="imp-in" class="code" rows="4" placeholder="MBP1..." aria-label="Код ученика">' + esc(U.ad.imp) + '</textarea>' +
      (U.ad.impMsg ? '<div class="msg note">' + esc(U.ad.impMsg) + '</div>' : '') +
      '<button class="btn btn-primary" data-act="import-student">Загрузить код</button>';
    h += '<h3>Восстановить на этом телефоне</h3><p class="muted">Если прогресс пропал. Код заменит данные ученика на этом телефоне.</p><button class="btn btn-secondary" data-act="to" data-to="restore">Восстановить из кода</button>';
    return h;
  }
  function sampleHTML(t, step, gi) {
    const key = t.id + ':' + step + ':' + gi, seed = U.ad.sample[key] || 7 + gi * 101 + step * 13;
    let q;
    try { q = M.makeQuestion(t.id, step, { interests: [], g: 'm' }, gi, seed); } catch (e) { return '<div class="sample">Ошибка примера</div>'; }
    let h = '<div class="sample"><div class="muted small">Пример задачи ' + (gi + 1) + '</div><div class="prompt sm">' + H(q.prompt) + '</div>' + (q.visual ? '<div class="vis-wrap">' + q.visual + '</div>' : '');
    if (q.kind === 'steps') h += '<ol class="steps sm">' + q.steps.map(function (s) { return '<li>' + H(s.prompt) + ' <span class="ansx">' + H(answerText(s)) + '</span><div class="muted small">Подсказки: ' + s.hints.map(H).join(' / ') + '</div></li>'; }).join('') + '</ol>';
    else h += '<div class="small">Ответ: <span class="ansx">' + H(answerText(q)) + '</span></div><div class="muted small">Подсказки: ' + q.hints.map(H).join(' / ') + '</div>';
    return h + '<div class="small">Решение: ' + H(q.solution || '') + '</div><button class="btn btn-quiet sm" data-act="resample" data-k="' + key + '">Другой пример</button></div>';
  }
  function tContent() {
    const notes = U.st.notes;
    let reviewed = 0;
    Object.keys(notes).forEach(function (k) { if (notes[k].ok) reviewed++; });
    let h = '<p>Здесь все объяснения и примеры задач. Отметьте проверенные ступени. Замечания можно скопировать и прислать для правки.</p>' +
      '<p class="small">Проверено ступеней: ' + reviewed + ' из ' + (M.TOPICS.length * 5) + '.</p>' +
      '<button class="btn btn-secondary" data-act="copy-notes">' + IC.copy + ' Скопировать замечания</button>';
    M.TOPICS.forEach(function (t) {
      const open = !!U.ad.open[t.id];
      h += '<details class="ct" data-tid="' + t.id + '"' + (open ? ' open' : '') + '><summary><span class="tchip">' + t.n + '</span><span>' + esc(t.title) + '<span class="muted small"> · ' + t.codes.join(', ') + '</span></span></summary>';
      if (open) {
        t.steps.forEach(function (s, si) {
          const step = si + 1, key = t.id + ':' + step, nt = notes[key] || {};
          h += '<div class="cs"><h4>Ступень ' + step + '. ' + esc(s.title) + '</h4>' + s.text.map(function (x) { return '<p>' + H(x) + '</p>'; }).join('') +
            (s.visual ? '<div class="vis-wrap">' + s.visual() + '</div>' : '');
          if (s.wrap) Object.keys(s.wrap).forEach(function (k) {
            const lab = (M.INTERESTS.find(function (i) { return i.id === k; }) || {}).label || k;
            h += '<div class="wrapx"><div class="muted small">Вариант для интереса «' + lab + '»</div>' + s.wrap[k].text.map(function (x) { return '<p>' + H(x) + '</p>'; }).join('') + '</div>';
          });
          if (s.simple) h += '<div class="wrapx"><div class="muted small">Объяснение проще</div>' + s.simple.map(function (x) { return '<p>' + H(x) + '</p>'; }).join('') + '</div>';
          if (s.walk) h += '<div class="wrapx"><div class="muted small">Разбор по шагам</div><ol class="walkx">' + s.walk().map(function (m) {
            return '<li>' + (m.say ? H(m.say) : '') + (m.ask ? ' <span class="muted">' + H(m.ask.q) + '</span> <span class="ansx">' + H(m.ask.o[0]) + '</span>' : '') + '</li>';
          }).join('') + '</ol></div>';
          s.gens.forEach(function (g, gi) { h += sampleHTML(t, step, gi); });
          h += '<label class="chk"><input type="checkbox" data-rev="' + key + '"' + (nt.ok ? ' checked' : '') + '><span>Проверено учителем' + (nt.ok ? ' ' + ddmm(nt.ok) : '') + '</span></label>' +
            '<textarea class="note" data-note="' + key + '" rows="2" placeholder="Замечание к ступени" aria-label="Замечание">' + esc(nt.note || '') + '</textarea></div>';
        });
        if (t.deep.length) { h += '<div class="cs"><h4>Глубже</h4>'; t.deep.forEach(function (g, gi) { h += sampleHTML(t, 6, gi); }); h += '</div>'; }
      }
      h += '</details>';
    });
    return h;
  }
  const RULES = [
    ['Разведка', 'До 7 задач. Первая задача из темы, которая идёт по КТП сейчас. Верный ответ ведёт выше по карте. Ошибка или «Не знаю» ведёт ниже. Темы под верным ответом считаются знакомыми. Потом их проверяют задачами повторения.'],
    ['Ступени', 'У темы 5 ступеней: бытовой пример, рисунок и числа, правило на числах, правило из учебника, применение. Кнопка «Понятно» открывает задачи ступени. Уровень поднимают только верные ответы.'],
    ['Переход выше', 'Нужен 1 верный ответ без подсказки. После ошибки на этой ступени нужно 2 верных ответа подряд. Вопросы «да или нет» идут парой.'],
    ['Ошибка в задаче', 'Первая ошибка даёт подсказку. Вторая даёт подсказку с рисунком. Третья показывает решение.'],
    ['Задача не получилась', 'Сначала идёт объяснение проще. Потом задача полегче со ступени ниже. Потом похожая задача. Вторая неудача даёт разбор по шагам с маленькими вопросами. Третья ведёт на ступень ниже.'],
    ['Объясни проще', 'Каждое нажатие делает объяснение проще: обычное, проще, по шагам, ступень ниже. С первой ступени путь идёт к базовой теме: короткая проверка основы. Если основа не держится, ученик повторяет базовую тему и возвращается.'],
    ['Три ошибки подряд', 'Ученик получает лёгкую задачу на успех. Один раз за занятие приходит предложение перерыва.'],
    ['Контроль', 'После 5 ступени идут 3 задачи без подсказок. 3 из 3 закрывают тему сегодня. 2 из 3 дают ещё одну задачу. Иначе ученик повторяет ступень с ошибкой.'],
    ['Проверка на следующий день', '2 задачи без подсказок в начале следующего занятия. Обе верны: тема закреплена. Ошибка возвращает тему в работу.'],
    ['Повторение', 'Закреплённые темы возвращаются через 3, 7, 21 и 60 дней. Одна задача идёт вперемешку с новыми.'],
    ['Пробелы', 'Задача с показанным решением становится пробелом. Её показывают снова после следующей ступени. Решил - пробел закрыт сегодня. После проверки через день он закрыт совсем.'],
    ['Балл 0-50', 'Балл описывает тему. О самом ребёнке он ничего не говорит. Балл равен 50, умноженному на вероятность верного ответа на задачу 5 ступени. Зоны: 0-10 самые простые шаги, 11-25 примеры и рисунки, 26-40 можно двигаться дальше, 41-50 можно усложнять.'],
    ['Тренировка', 'Ученик сам выбирает тему на карте. Тренировка - это 8 задач с подсказками. Сложность подбирается по баллу темы. Сначала идут старые пробелы этой темы. Задача с показанным решением становится пробелом.'],
    ['Объяснения заново', 'Закрытую тему можно пройти заново по ступеням. Потом снова идут контроль и проверка на следующий день.'],
    ['Длина занятия', 'Через 25 минут приходит предложение закончить. Время меняется в настройках. Таймеров на экране нет.']
  ];
  function tRules() { return RULES.map(function (r) { return '<div class="rule"><h4>' + r[0] + '</h4><p>' + esc(r[1]) + '</p></div>'; }).join(''); }
  function tSettings() {
    const s = U.st.settings;
    return '<h3>Длина занятия</h3><p class="muted">После этого времени приходит предложение закончить.</p><div class="seg-row">' +
      [15, 20, 25, 30, 40].map(function (m) { return '<button class="seg' + (s.sessionMin === m ? ' on' : '') + '" data-act="set-min" data-m="' + m + '" aria-pressed="' + (s.sessionMin === m) + '">' + m + ' мин</button>'; }).join('') + '</div>' +
      '<h3>Озвучка</h3>' + (TTS.ok ? '<button class="btn btn-secondary" data-act="toggle-audio">' + IC.sound + ' Озвучка: ' + (s.audio ? 'включена' : 'выключена') + '</button>' : '<p class="muted">Этот браузер не умеет читать вслух.</p>') +
      '<h3>PIN-код</h3><button class="btn btn-secondary" data-act="change-pin">Сменить PIN</button>' +
      '<h3>Где хранятся данные</h3><p>Прогресс хранится только в браузере этого телефона. В ИИ ничего не уходит. Вместо имени используется ник.</p>' +
      '<p>' + (LS_OK ? 'Этот браузер сохраняет прогресс.' : 'Этот браузер не сохраняет прогресс. Откройте ссылку в обычном окне Chrome или Safari.') + '</p>' +
      '<p class="muted">Очистка данных браузера стирает прогресс. Поэтому раз в неделю нужен код для учителя.</p>' +
      (U.st.learner ? '<h3>Сброс</h3><button class="btn btn-danger" data-act="wipe">Удалить прогресс ученика на этом телефоне</button>' : '') +
      '<p class="muted small">Версия 1. Темы: дроби 5 класса, 12 тем по КТП.</p>';
  }

  /* ---------- переходы ---------- */
  function nextCard() {
    const now = Date.now();
    TTS.stop();
    E.touch(U.st, now);
    U.card = E.next(U.st, now);
    U.att = null; U.exNote = ''; U.menu = false; U.walk = null;
    if (U.card.type === 'task') { startAttempt(); if (U.card.mode === 'p' || U.card.prac) U.card.pi = E.pracInfo(U.st); }
    if (U.card.type === 'onboard') { U.screen = 'start'; render(); return; }
    U.screen = 'card';
    render();
  }
  function goMap() {
    TTS.stop();
    U.menu = false; U.card = null; U.att = null;
    if (U.st.learner && U.st.diag && U.st.diag.done) U.screen = 'map';
    else if (U.st.learner) { nextCard(); return; }
    else U.screen = 'start';
    render();
  }
  function copyText(text, el) {
    function fallback() {
      try { if (el) { el.focus(); el.select(); } const ok = document.execCommand && document.execCommand('copy'); toast(ok ? 'Скопировано' : 'Выдели текст и скопируй вручную'); }
      catch (e) { toast('Выдели текст и скопируй вручную'); }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('Скопировано'); }, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }
  function openSend() {
    U.prev = U.screen === 'adult' ? 'adult' : U.screen === 'summary' ? 'summary' : 'map';
    U.menu = false; U.screen = 'send'; U.codeState = 'busy'; render();
    E.exportCode(U.st).then(function (code) {
      U.code = code; U.codeState = 'ok';
      U.st.settings.lastExport = today(); E.save(U.st);
      if (U.screen === 'send') render();
    }, function () { U.codeState = 'err'; if (U.screen === 'send') render(); });
  }
  function typeKey(k) {
    const a = U.att;
    if (!a || a.done || a.specDone) return;
    const spec = curSpec();
    if (k === 'tab' || k === 'back-tab') {
      if (spec.kind !== 'fraction') return;
      const order = spec.withWhole ? ['w', 'n', 'd'] : ['n', 'd'];
      const i = order.indexOf(a.focus);
      a.focus = order[(i + (k === 'tab' ? 1 : order.length - 1)) % order.length];
    } else if (k === 'del') {
      a.inp[a.focus] = (a.inp[a.focus] || '').slice(0, -1);
    } else {
      const max = spec.kind === 'number' ? 7 : 4, cur = a.inp[a.focus] || '';
      if (cur.length < max) a.inp[a.focus] = (cur === '0' ? '' : cur) + k;
    }
    if (a.msg && a.msg.type === 'note') a.msg = null;
    renderBoxes();
  }
  function renderBoxes() {
    const a = U.att;
    root.querySelectorAll('.box').forEach(function (el) {
      const k = el.dataset.box, v = a.inp[k] || '';
      el.innerHTML = v ? esc(v) : '<span class="ph">' + (k === 'w' ? '' : '?') + '</span>';
      el.classList.toggle('focus', a.focus === k);
    });
    const m = root.querySelector('.msg.note');
    if (m && !a.msg) m.remove();
  }
  function confirmSheet(o) { U.sheet = o; render(); }

  const ACT = {
    to: function (el) {
      const to = el.dataset.to;
      if (to === 'map') { goMap(); return; }
      if (to === 'adult') { U.screen = 'adult'; render(); return; }
      U.screen = to; render();
    },
    grade: function (el) { U.onb.grade = Number(el.dataset.g); U.screen = 'interests'; render(); },
    int: function (el) {
      const id = el.dataset.id, a = U.onb.interests, i = a.indexOf(id);
      if (i >= 0) a.splice(i, 1); else if (a.length < 3) a.push(id); else toast('Можно выбрать до трёх');
      render();
    },
    g: function (el) { U.onb.g = el.dataset.g; render(); },
    'to-diag': function () {
      const v = (U.onb.nick || '').trim();
      if (!v) { U.onb.err = 'Придумай ник. Подойдёт любое слово.'; render(); return; }
      U.onb.nick = v; U.onb.err = ''; U.screen = 'diag-intro'; render();
    },
    'diag-start': function () { E.onboard(U.st, { nick: U.onb.nick, grade: U.onb.grade, g: U.onb.g, interests: U.onb.interests }, Date.now()); nextCard(); },
    key: function (el) { typeKey(el.dataset.k); },
    focus: function (el) { if (U.att && !U.att.done) { U.att.focus = el.dataset.box; renderBoxes(); } },
    check: function () {
      const a = U.att, spec = curSpec();
      submit(spec.kind === 'number' ? a.inp.v : { w: a.inp.w, n: a.inp.n, d: a.inp.d });
    },
    opt: function (el) { submit(Number(el.dataset.i)); },
    yn: function (el) { submit(el.dataset.v === '1'); },
    hint: function () {
      const a = U.att, spec = curSpec();
      if (!a || a.done) return;
      if (a.shown < (spec.hints || []).length) { a.shown++; a.totalHints++; if (a.msg && a.msg.type !== 'hint') a.msg = null; }
      else { a.revealed = true; a.msg = { type: 'note', html: 'Вот как решать.' }; endSpec(0); }
      U.scrollMsg = true;
      render();
    },
    dk: function () {
      const a = U.att;
      if (!a || a.done) return;
      a.done = true;
      E.answer(U.st, U.card, { res: -1, wrong: 0, hints: 0, ms: Date.now() - a.t0 }, Date.now());
      toast('Хорошо. Идём дальше');
      nextCard();
    },
    'say-task': function () { const q = U.card.q; const parts = [q.prompt]; if (q.kind === 'steps') parts.push(curSpec().prompt); TTS.say(parts); },
    'say-ex': function () { const ex = M.levelFor(U.card.topic, U.card.step, U.card.lvl || 0, ctxOf()); TTS.say([ex.title].concat(ex.text || [])); },
    'say-walk': function () {
      const ex = M.levelFor(U.card.topic, U.card.step, 2, ctxOf()), m = ex.walk && ex.walk[(U.walk || {}).i || 0];
      if (m) TTS.say([m.say || '', m.ask ? m.ask.q : ''].filter(Boolean));
    },
    'w-opt': function (el) { const w = U.walk; if (!w || w.picked !== null) return; w.picked = Number(el.dataset.j); U.scrollWalk = true; render(); },
    'w-next': function () { const w = U.walk; if (!w) return; w.i++; w.picked = null; w.order = null; U.scrollWalk = true; render(); },
    next: function () { nextCard(); },
    ok: function () { if (!U.card || U.card.type !== 'explain') return; E.explained(U.st, U.card, 'ok', Date.now()); nextCard(); },
    simpler: function () {
      if (!U.card || U.card.type !== 'explain') return;
      const keep = U.card, r = E.explained(U.st, keep, 'simpler', Date.now());
      if (r === 'again') {
        U.walk = null; U.exNote = 'Вот пример с картинкой. Посмотри ещё раз. Можно нажать «Послушать».'; U.card = keep; render();
        const ex = M.levelFor(keep.topic, keep.step, keep.lvl || 0, ctxOf());
        if (audioOn() && ex.text) TTS.say(ex.text);
        return;
      }
      nextCard();
    },
    'after-closed': function () { const c = U.card; E.choice(U.st, 'next', c.topic); if (c.back) nextCard(); else goMap(); },
    deep: function (el) { E.choice(U.st, 'deep', el.dataset.id); nextCard(); },
    'stop-deep': function () { E.stopDeep(U.st); goMap(); },
    'go-map': function () { goMap(); },
    continue: function () { nextCard(); },
    'all-done': function () { U.card = { type: 'done' }; U.screen = 'card'; render(); },
    node: function (el) {
      const id = el.dataset.id, t = T(id), s = U.st.topics[id], status = s ? s.status : 'new', opts = [];
      if (status === 'learning' || (status === 'new' && E.avail(U.st, id))) opts.push({ label: status === 'learning' ? 'Продолжить тему' : 'Начать тему', primary: true, icon: IC.arrow, act: function () { E.choose(U.st, id); nextCard(); } });
      if (['learning', 'today', 'closed', 'known'].indexOf(status) >= 0) opts.push({ label: 'Тренировка: 8 задач', primary: !opts.length, icon: IC.bulb, act: function () { E.practice(U.st, id); nextCard(); } });
      if (['today', 'closed', 'known'].indexOf(status) >= 0) {
        opts.push({ label: 'Объяснения заново по ступеням', icon: IC.eye, act: function () { E.relearn(U.st, id); nextCard(); } });
        if (t.deep.length) opts.push({ label: 'Глубже: задачи выше класса', icon: IC.star, act: function () { E.choice(U.st, 'deep', id); nextCard(); } });
      }
      if (opts.length === 1) { opts[0].act(); return; }
      if (opts.length > 1) { U.sheet = { text: 'Тема «' + t.title + '». Что выберешь?', opts: opts }; render(); return; }
      const miss = T(id).prereq.filter(function (p) { const s = U.st.topics[p]; return !s || ['today', 'closed', 'known'].indexOf(s.status) < 0; });
      toast(miss.length ? 'Сначала тема «' + T(miss[0]).short + '»' : 'Пока закрыто');
    },
    fog: function () { toast('Скоро появится'); },
    menu: function () { U.menu = !U.menu; render(); },
    end: function () { TTS.stop(); U.menu = false; E.save(U.st); U.screen = 'summary'; U.card = null; U.att = null; render(); },
    send: function () { openSend(); },
    'copy-code': function () { copyText(U.code, document.getElementById('code-out')); },
    'do-restore': function () {
      const text = (document.getElementById('rest-in') || {}).value || U.rest;
      E.importCode(text).then(function (data) {
        const apply = function () { E.restore(U.st, data); U.rest = ''; U.restMsg = ''; toast('Прогресс восстановлен'); goMap(); };
        if (U.st.learner && U.st.learner.id !== data.learner.id) confirmSheet({ text: 'На этом телефоне уже есть ученик «' + U.st.learner.nick + '». Заменить его прогресс прогрессом «' + data.learner.nick + '»?', yes: 'Заменить', danger: true, act: apply });
        else apply();
      }, function (e) { U.restMsg = e.message; render(); });
    },
    'toggle-audio': function () { U.st.settings.audio = !U.st.settings.audio; E.save(U.st); TTS.stop(); render(); },
    adult: function () { U.menu = false; U.ad.ok = false; U.ad.pin = ''; U.ad.err = ''; U.ad.stage = ''; U.screen = 'adult'; if (!U.st.learner && Object.keys(U.st.students).length === 0) U.ad.tab = 'code'; render(); },
    'ad-exit': function () { U.ad.ok = false; U.ad.stage = ''; U.ad.pin = ''; goMap(); },
    'pin-key': function (el) {
      const k = el.dataset.k, a = U.ad, st = U.st;
      if (k === 'del') a.pin = a.pin.slice(0, -1); else if (a.pin.length < 4) a.pin += k;
      a.err = '';
      if (a.pin.length === 4) {
        if (!st.settings.pin || a.stage === 'new1' || a.stage === 'new2') {
          if (a.stage !== 'new2') { a.pin1 = a.pin; a.pin = ''; a.stage = 'new2'; }
          else if (a.pin === a.pin1) { st.settings.pin = a.pin; E.save(st); a.pin = ''; a.pin1 = ''; a.stage = ''; a.ok = true; toast('PIN сохранён'); }
          else { a.pin = ''; a.pin1 = ''; a.stage = st.settings.pin ? 'new1' : ''; a.err = 'PIN не совпал. Попробуйте ещё раз.'; }
        } else if (a.pin === st.settings.pin) { a.ok = true; a.pin = ''; }
        else { a.pin = ''; a.err = 'PIN не подошёл. Попробуйте ещё раз.'; }
      }
      render();
    },
    who: function (el) { U.ad.who = el.dataset.id; U.ad.day = null; render(); },
    tab: function (el) { U.ad.tab = el.dataset.tab; render(); },
    day: function (el) { U.ad.day = U.ad.day === el.dataset.d ? null : el.dataset.d; render(); },
    period: function (el) { U.ad.period = Number(el.dataset.p); render(); },
    'copy-report': function () { copyText(reportText(adData()), document.getElementById('report-out')); },
    'import-student': function () {
      const text = (document.getElementById('imp-in') || {}).value || U.ad.imp;
      E.importCode(text).then(function (data) {
        if (U.st.learner && data.learner.id === U.st.learner.id) { U.ad.impMsg = 'Это код ученика с этого же телефона.'; render(); return; }
        const id = E.addStudent(U.st, data, Date.now());
        U.ad.imp = ''; U.ad.impMsg = ''; U.ad.who = id; U.ad.tab = 'topics';
        toast('Ученик «' + data.learner.nick + '» загружен'); render();
      }, function (e) { U.ad.impMsg = e.message; render(); });
    },
    resample: function (el) { U.ad.sample[el.dataset.k] = 1 + Math.floor(Math.random() * 2e9); render(); },
    'copy-notes': function () {
      const lines = [];
      M.TOPICS.forEach(function (t) {
        for (let s = 1; s <= 5; s++) { const n = U.st.notes[t.id + ':' + s]; if (n && n.note && n.note.trim()) lines.push('Тема ' + t.n + ' «' + t.title + '», ступень ' + s + ' «' + t.steps[s - 1].title + '»: ' + n.note.trim()); }
      });
      if (!lines.length) { toast('Замечаний пока нет'); return; }
      copyText(lines.join('\n'), null);
    },
    'set-min': function (el) { U.st.settings.sessionMin = Number(el.dataset.m); E.save(U.st); render(); },
    'change-pin': function () { U.ad.ok = false; U.ad.stage = 'new1'; U.ad.pin = ''; render(); },
    wipe: function () {
      confirmSheet({ text: 'Удалить прогресс ученика на этом телефоне? Сначала сохраните код во вкладке «Код».', yes: 'Удалить', danger: true, act: function () {
        const keep = { settings: U.st.settings, notes: U.st.notes, students: U.st.students };
        U.st = E.newState(); Object.assign(U.st, keep); E.save(U.st); window.MBP.U = U;
        U.ad.who = 'self'; U.screen = 'adult'; toast('Прогресс удалён'); render();
      } });
    },
    'sheet-opt': function (el) { const s = U.sheet; U.sheet = null; const o = s && s.opts && s.opts[Number(el.dataset.i)]; if (o) o.act(); else render(); },
    prac: function (el) { E.practice(U.st, el.dataset.id); nextCard(); },
    'stop-prac': function () { E.stopPractice(U.st); goMap(); },
    'sheet-yes': function () { const s = U.sheet; U.sheet = null; if (s && s.act) s.act(); else render(); },
    'sheet-no': function () { U.sheet = null; render(); }
  };

  /* ---------- отрисовка ---------- */
  function view() {
    switch (U.screen) {
      case 'start': return vStart();
      case 'grade': return vGrade();
      case 'interests': return vInterests();
      case 'nick': return vNick();
      case 'diag-intro': return vDiagIntro();
      case 'map': return vMap();
      case 'summary': return vSummary();
      case 'send': return vSend();
      case 'restore': return vRestore();
      case 'adult': return vAdult();
      case 'card': {
        const c = U.card;
        if (!c) return vMap();
        if (c.type === 'task') return vTask(c);
        if (c.type === 'explain') return vExplain(c);
        if (c.type === 'info') return vInfo(c);
        if (c.type === 'closed') return vClosed(c);
        if (c.type === 'break') return vBreak(c);
        if (c.type === 'diag-done') return vDiagDone(c);
        return vAllDone();
      }
    }
    return vStart();
  }
  function render() {
    const key = U.screen + '|' + (U.card ? (U.card.type + (U.card.q ? U.card.q.seed : '') + (U.card.step || '')) : '') + '|' + (U.screen === 'adult' ? U.ad.tab + U.ad.ok : '');
    const y = window.scrollY;
    root.innerHTML = view() + vMenu() + vSheet();
    root.classList.toggle('adult-mode', U.screen === 'adult');
    if (key !== U.key) {
      window.scrollTo(0, 0);
      U.key = key;
      if (U.screen === 'map') { const n = document.getElementById('cur-node'); if (n && n.scrollIntoView) n.scrollIntoView({ block: 'center' }); }
    } else window.scrollTo(0, y);
    if (U.scrollWalk) {
      U.scrollWalk = false;
      const wc = root.querySelector('.wcur') || root.querySelector('#next-btn');
      if (wc && wc.scrollIntoView) wc.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    if (U.scrollMsg) {
      U.scrollMsg = false;
      const m = root.querySelector('.task .msg, .task .hint:last-of-type, #next-btn');
      if (m && m.scrollIntoView) m.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    bindCharts();
  }
  function bindCharts() {
    root.querySelectorAll('.chart').forEach(function (ch) {
      let pts;
      try { pts = JSON.parse(ch.dataset.pts); } catch (e) { return; }
      const svg = ch.querySelector('svg'), tip = ch.querySelector('.tip-box'), cross = svg.querySelector('.cross'), W = Number(ch.dataset.w);
      function show(ev) {
        const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width;
        let best = pts[0];
        pts.forEach(function (p) { if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p; });
        cross.setAttribute('x1', best[0]); cross.setAttribute('x2', best[0]); cross.style.display = '';
        tip.hidden = false;
        tip.innerHTML = '<b>' + best[3] + '</b><span>' + best[2] + '% · ' + best[4] + ' из ' + ch.dataset.max + '</span>';
        const px = best[0] * r.width / W;
        tip.style.left = Math.max(4, Math.min(r.width - 150, px - 70)) + 'px';
      }
      function hide() { tip.hidden = true; cross.style.display = 'none'; }
      svg.addEventListener('pointermove', show);
      svg.addEventListener('pointerdown', show);
      svg.addEventListener('pointerleave', hide);
    });
  }

  /* ---------- события ---------- */
  root.addEventListener('click', function (e) {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const f = ACT[el.dataset.act];
    if (f) { e.preventDefault(); f(el, e); }
  });
  root.addEventListener('input', function (e) {
    const t = e.target;
    if (t.id === 'nick-in') U.onb.nick = t.value;
    else if (t.id === 'rest-in') U.rest = t.value;
    else if (t.id === 'imp-in') U.ad.imp = t.value;
    else if (t.dataset && t.dataset.note) {
      const k = t.dataset.note, n = U.st.notes[k] || (U.st.notes[k] = { ok: '', note: '' });
      n.note = t.value;
      clearTimeout(U.noteT); U.noteT = setTimeout(function () { E.save(U.st); }, 400);
    }
  });
  root.addEventListener('change', function (e) {
    const t = e.target;
    if (t.dataset && t.dataset.rev) {
      const k = t.dataset.rev, n = U.st.notes[k] || (U.st.notes[k] = { ok: '', note: '' });
      n.ok = t.checked ? today() : '';
      E.save(U.st); render();
    }
  });
  document.addEventListener('toggle', function (e) {
    const d = e.target;
    if (d && d.classList && d.classList.contains('ct')) {
      const id = d.dataset.tid, was = !!U.ad.open[id];
      U.ad.open[id] = d.open;
      if (d.open && !was) render();
    }
  }, true);
  root.addEventListener('submit', function (e) { e.preventDefault(); });
  document.addEventListener('keydown', function (e) {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      if (e.key === 'Enter' && e.target.id === 'nick-in') { e.preventDefault(); ACT['to-diag'](); }
      return;
    }
    if (U.sheet || U.menu) { if (e.key === 'Escape') { U.sheet = null; U.menu = false; render(); } return; }
    if (U.screen === 'adult' && !U.ad.ok) {
      if (/^\d$/.test(e.key)) { e.preventDefault(); ACT['pin-key']({ dataset: { k: e.key } }); }
      else if (e.key === 'Backspace') { e.preventDefault(); ACT['pin-key']({ dataset: { k: 'del' } }); }
      return;
    }
    if (U.screen !== 'card' || !U.card) return;
    if (U.card.type !== 'task' || !U.att) {
      const nb = document.getElementById('next-btn');
      if (e.key === 'Enter' && nb) { e.preventDefault(); nb.click(); }
      return;
    }
    const a = U.att;
    if (a.done) { if (e.key === 'Enter') { e.preventDefault(); nextCard(); } return; }
    const spec = curSpec();
    if (spec.kind === 'number' || spec.kind === 'fraction') {
      if (/^\d$/.test(e.key)) { e.preventDefault(); typeKey(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); typeKey('del'); }
      else if (e.key === 'Enter') { e.preventDefault(); ACT.check(); }
      else if (spec.kind === 'fraction' && (e.key === '/' || e.key === 'ArrowRight' || e.key === ' ')) { e.preventDefault(); typeKey('tab'); }
      else if (spec.kind === 'fraction' && e.key === 'ArrowLeft') { e.preventDefault(); typeKey('back-tab'); }
    } else if (spec.kind === 'choice' && /^[1-4]$/.test(e.key)) {
      const i = Number(e.key) - 1;
      if (i < spec.options.length && a.dis.indexOf(i) < 0) submit(i);
    }
  });
  let sx = 0, sy = 0, swiping = false;
  document.addEventListener('touchstart', function (e) {
    const el = e.target.closest && e.target.closest('.swipe');
    swiping = !!el;
    if (swiping) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!swiping) return;
    swiping = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy)) { if (dx < 0) ACT.ok(); else ACT.simpler(); }
  }, { passive: true });

  /* ---------- старт ---------- */
  function init() {
    TTS.init();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* пусто */ }
    if (U.st.learner) {
      E.touch(U.st, Date.now()); E.save(U.st);
      if (!U.st.diag || !U.st.diag.done) { nextCard(); return; }
      U.screen = 'map';
    } else U.screen = 'start';
    render();
  }
  init();
})();
