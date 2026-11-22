/* content3.js - банк вопросов, часть 2: на каждую ступень новый вид задачи.
   Виды: сюжеты под интересы ребёнка, «найди ошибку», пропущенное число, выбор из вариантов, задачи в два шага. */
(function () {
  'use strict';
  const M = globalThis.M;
  const rint = M.rint, pick = M.pick, shuffle = M.shuffle, gcd = M.gcd, lcm = M.lcm, F = M.F, fr = M.fr, mx = M.mx, mk = M.mk, pl = M.pl,
    bar = M.svgBar, rows = M.svgRows, grid = M.svgGrid, ray = M.svgRay,
    qChoice = M.qChoice, qSign = M.qSign, qNum = M.qNum, qFrac = M.qFrac, qYes = M.qYes, qSteps = M.qSteps, sNum = M.sNum, sFrac = M.sFrac;

  /* ---------- помощники ---------- */
  function proper(maxD, minD, minN) {
    minD = minD || 2; minN = minN || 1;
    for (;;) { const d = rint(minD, maxD), n = rint(Math.min(minN, d - 1), d - 1); if (n >= 1 && gcd(n, d) === 1) return [n, d]; }
  }
  function frSum(f) { return mk(F(f), true); }
  function qFixed(prompt, options, answer, opt) { const q = qChoice(prompt, options, Object.assign({ keepOrder: true }, opt)); q.answer = answer; return q; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function range(a, b) { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; }
  const NAMES = [['Аружан', 'f'], ['Ваня', 'm'], ['Айдос', 'm'], ['Маша', 'f'], ['Ержан', 'm'], ['Даша', 'f'], ['Алихан', 'm'], ['Света', 'f']];
  function person() { return pick(NAMES); }
  function twoPeople() { const a = pick(NAMES); let b = pick(NAMES); while (b[0] === a[0]) b = pick(NAMES); return [a, b]; }
  function vb(p, m, f) { return p[1] === 'f' ? f : m; }
  // сюжет под интересы ребёнка: чаще из его интересов, иногда любой другой для разнообразия
  function theme(ctx, table) {
    const ids = ((ctx && ctx.interests) || []).filter(function (i) { return table[i]; });
    return table[ids.length && Math.random() < 0.75 ? pick(ids) : pick(Object.keys(table))];
  }
  const PARTS = ['равную часть', 'равные части', 'равных частей'];
  const CELLS = ['клетка', 'клетки', 'клеток'];
  const WHOLE = {
    football: { acc: 'Футбольное поле', gen: 'поля', div: 'разделили', act: 'разметили' },
    games: { acc: 'Карту уровня', gen: 'карты', div: 'разделили', act: 'открыли' },
    animals: { acc: 'Вольер для кроликов', gen: 'вольера', div: 'разделили', act: 'почистили' },
    drawing: { acc: 'Лист для рисунка', gen: 'листа', div: 'разделили', act: 'раскрасили' },
    music: { acc: 'Песню', gen: 'песни', div: 'разделили', act: 'выучили' },
    cooking: { acc: 'Пирог', gen: 'пирога', div: 'разрезали', act: 'съели' },
    space: { acc: 'Путь ракеты', gen: 'пути', div: 'разделили', act: 'пролетели' },
    cars: { acc: 'Трассу гонки', gen: 'трассы', div: 'разделили', act: 'проехали' }
  };
  const COLL = {
    football: ['мяч', 'мяча', 'мячей'], games: ['монета', 'монеты', 'монет'], animals: ['наклейка', 'наклейки', 'наклеек'],
    drawing: ['карандаш', 'карандаша', 'карандашей'], music: ['билет', 'билета', 'билетов'], cooking: ['пирожок', 'пирожка', 'пирожков'],
    space: ['значок', 'значка', 'значков'], cars: ['машинка', 'машинки', 'машинок']
  };
  const TIME = {
    football: ['Тренировка', 'длилась'], games: ['Игра', 'длилась'], animals: ['Прогулка с собакой', 'длилась'], drawing: ['Урок рисования', 'длился'],
    music: ['Репетиция', 'длилась'], cooking: ['Готовка пирога', 'длилась'], space: ['Полёт', 'длился'], cars: ['Поездка', 'длилась']
  };
  const yes = 'Это так.';

  const ADD = {
    'frac-basic': [
      function (ctx) {
        const W = theme(ctx, WHOLE), d = rint(3, 10), k = rint(1, d - 1);
        return qFrac(W.acc + ' ' + W.div + ' на ' + pl(d, PARTS) + '. ' + cap(W.act) + ' ' + k + ' из них. Какую часть ' + W.gen + ' ' + W.act + '?', F(k, d), {
          visual: bar(d, k),
          hints: ['Сколько всего равных частей?', 'Внизу пиши число всех частей. Вверху число взятых.', 'Всего ' + d + '. Взяли ' + k + '.'],
          solution: k + ' из ' + d + ': ' + fr(k, d) + '.'
        });
      },
      function () {
        const P = person(), d = rint(3, 9), k = rint(1, d - 1), truth = Math.random() < 0.4;
        const wrong = [fr(d, k), fr(k, d + k)].concat(2 * k !== d ? [fr(d - k, d)] : []);
        const said = truth ? fr(k, d) : pick(wrong);
        return qYes(P[0] + ' ' + vb(P, 'закрасил', 'закрасила') + ' ' + k + ' из ' + d + ' частей полоски. Потом ' + vb(P, 'записал', 'записала') + ': ' + said + '. Верно?', truth, {
          visual: bar(d, k),
          hints: ['Внизу пишут число всех частей.', 'Вверху пишут число закрашенных частей.', 'Всего ' + d + '. Закрашено ' + k + '. Нужно ' + fr(k, d) + '.'],
          solution: truth ? yes : 'Это не так. Нужно ' + fr(k, d) + '.'
        });
      },
      function () {
        const d = rint(5, 12), m = rint(1, d - 2), n = d - m;
        return qFrac('Знаменатель дроби ' + d + '. Числитель на ' + m + ' меньше. Запиши эту дробь.', F(n, d), {
          form: { den: d },
          hints: ['Знаменатель пишут снизу: ' + d + '.', 'Числитель на ' + m + ' меньше: ' + d + ' − ' + m + '.', d + ' − ' + m + ' = ' + n + '.'],
          solution: fr(n, d) + '.'
        });
      },
      function () {
        const d = rint(4, 10), k = rint(1, d - 1);
        return qChoice('Какая дробь показывает ' + pl(k, ['часть', 'части', 'частей']) + ' из ' + d + '?', [fr(k, d), fr(d, k), fr(d - k, d), fr(k, d + k)], {
          hints: ['Внизу число всех частей: ' + d + '.', 'Вверху число взятых частей: ' + k + '.', 'Ищи дробь с ' + k + ' сверху и ' + d + ' снизу.'],
          solution: fr(k, d) + '.'
        });
      },
      function (ctx) {
        const t = theme(ctx, COLL), N = rint(6, 20), k = rint(1, N - 1), rest = N - k;
        return qFrac('В коробке ' + pl(N, t) + '. ' + k + ' из них новые. Какую часть всех ' + t[2] + ' составляют остальные?', F(rest, N), {
          hints: ['Сначала найди число остальных.', 'Остальных: ' + N + ' − ' + k + '.', 'Остальных ' + rest + ' из ' + N + '.'],
          solution: N + ' − ' + k + ' = ' + rest + '. Ответ: ' + fr(rest, N) + '.'
        });
      }
    ],
    'frac-property': [
      function () {
        const P = person(), p = proper(6), a = p[0], b = p[1], k = rint(2, 4), truth = Math.random() < 0.5;
        const text = truth ? vb(P, 'умножил', 'умножила') + ' верх и низ дроби на ' + k + ': ' + fr(a, b) + ' = ' + fr(a * k, b * k)
          : vb(P, 'прибавил', 'прибавила') + ' ' + k + ' к верху и к низу дроби: ' + fr(a, b) + ' = ' + fr(a + k, b + k);
        return qYes(P[0] + ' ' + text + '. Верно?', truth, {
          visual: rows([[b, a], truth ? [b * k, a * k] : [b + k, a + k]]),
          hints: ['Посмотри на рисунок. Закрашено одинаково?', 'Верх и низ можно умножать на одно число. Прибавлять нельзя.', fr(a, b) + ' = ' + fr(a * k, b * k) + '.'],
          solution: truth ? yes : 'Это не так. Прибавление меняет дробь.'
        });
      },
      function () {
        const p = proper(5), a = p[0], b = p[1], k = rint(2, 3), truth = Math.random() < 0.5, d = b * k;
        const c = truth ? a * k : a * k + (Math.random() < 0.5 ? 1 : -1);
        return qYes('Полоски одинаковые. Сверху закрашено ' + fr(a, b) + '. Снизу ' + fr(c, d) + '. Закрашено одинаково?', truth, {
          visual: rows([[b, a], [d, c]]),
          hints: ['Сравни длину закрашенных частей.', 'Приведи ' + fr(a, b) + ' к знаменателю ' + d + '.', fr(a, b) + ' = ' + fr(a * k, d) + '.'],
          solution: truth ? 'Да: ' + fr(a, b) + ' = ' + fr(c, d) + '.' : 'Нет: ' + fr(a, b) + ' = ' + fr(a * k, d) + '.'
        });
      },
      function () {
        const p = proper(7), a = p[0], b = p[1], k = rint(2, 5);
        return qNum(fr(a, b) + ' = ' + fr(a * k, '?') + '. Какое число стоит вместо знака вопроса?', b * k, {
          hints: ['Во сколько раз увеличился числитель?', (a * k) + ' : ' + a + ' = ' + k + '.', 'Знаменатель тоже умножь на ' + k + ': ' + b + ' · ' + k + '.'],
          solution: fr(a, b) + ' = ' + fr(a * k, b * k) + '.'
        });
      },
      function () {
        const p = proper(9), a = p[0], b = p[1], opts = [fr(a, b)];
        while (opts.length < 4) { const q = proper(6), k = rint(2, 4), s = fr(q[0] * k, q[1] * k); if (opts.indexOf(s) < 0) opts.push(s); }
        return qChoice('Какую дробь нельзя сократить?', opts, {
          hints: ['Ищи дробь без общего делителя у верха и низа.', 'Проверь деление на 2, на 3 и на 5.', 'У нужной дроби верх и низ вместе делятся только на 1.'],
          solution: fr(a, b) + ': у чисел ' + a + ' и ' + b + ' нет общего делителя больше 1.'
        });
      },
      function () {
        const pp = twoPeople(), P = pp[0], Q = pp[1], p = proper(5), a = p[0], b = p[1], k = rint(2, 4), same = Math.random() < 0.6;
        const first = Math.random() < 0.5, other = same ? fr(a, b) : fr(a * k + 1, b * k);
        const f1 = first ? fr(a * k, b * k) : other, f2 = first ? other : fr(a * k, b * k);
        const ans = same ? 0 : (first ? 2 : 1), winner = first ? Q[0] : P[0];
        return qFixed(P[0] + ' ' + vb(P, 'прочитал', 'прочитала') + ' ' + f1 + ' книги. ' + Q[0] + ' ' + vb(Q, 'прочитал', 'прочитала') + ' ' + f2 + ' такой же книги. Кто прочитал больше?', ['Поровну', P[0], Q[0]], ans, {
          hints: same ? ['Приведи дроби к одному знаменателю.', 'Знаменатель ' + (b * k) + '.', fr(a, b) + ' = ' + fr(a * k, b * k) + '.']
            : ['Посмотри на знаменатели.', 'Знаменатели одинаковые. Сравни числители.', (a * k + 1) + ' > ' + (a * k) + '.'],
          solution: same ? 'Поровну: ' + fr(a * k, b * k) + ' = ' + fr(a, b) + '.' : winner + ': ' + fr(a * k + 1, b * k) + ' > ' + fr(a * k, b * k) + '.'
        });
      }
    ],
    'mixed': [
      function (ctx) {
        const t = theme(ctx, COLL), d = pick([4, 5, 6, 8, 10]), w = rint(1, 4), r = rint(1, d - 1), n = w * d + r;
        return qFrac('В коробку помещается ' + pl(d, t) + '. У нас ' + pl(n, t) + '. Сколько это коробок? Ответ дай смешанным числом.', F(n, d), {
          form: { mixed: true },
          hints: ['Сколько полных коробок получится?', n + ' : ' + d + ' = ' + w + ' (ост. ' + r + ').', 'Полных коробок ' + w + '. Ещё ' + r + ' из ' + d + ' в неполной.'],
          solution: mx(w, r, d) + ' коробки.'
        });
      },
      function () {
        const P = person(), d = rint(2, 6), w = rint(1, 4), r = rint(1, d - 1), truth = Math.random() < 0.4;
        const n = truth ? w * d + r : w + r;
        return qYes(P[0] + ' ' + vb(P, 'записал', 'записала') + ' ' + mx(w, r, d) + ' неправильной дробью: ' + fr(n, d) + '. Верно?', truth, {
          hints: ['Сколько долей в одной целой?', 'Целую часть умножь на знаменатель. Прибавь числитель.', w + ' · ' + d + ' + ' + r + ' = ' + (w * d + r) + '.'],
          solution: truth ? yes : 'Это не так. Нужно ' + fr(w * d + r, d) + '.'
        });
      },
      function () {
        const d = rint(2, 7), w = rint(1, 4), r = rint(1, d - 1), n = w * d + r;
        return qChoice('Какая дробь равна ' + mx(w, r, d) + '?', [fr(n, d), fr(w + r, d), fr(w * r, d), fr(n + d, d)], {
          hints: ['Сколько долей в одной целой?', 'Целую часть умножь на знаменатель. Прибавь числитель.', w + ' · ' + d + ' + ' + r + ' = ' + n + '.'],
          solution: mx(w, r, d) + ' = ' + fr(n, d) + '.'
        });
      },
      function () {
        const p = proper(9), opts = [fr(p[0], p[1])];
        while (opts.length < 4) { const d = rint(2, 9), n = rint(d, 2 * d + 2), s = fr(n, d); if (opts.indexOf(s) < 0) opts.push(s); }
        return qChoice('Какая дробь правильная?', opts, {
          hints: ['Сравни числитель и знаменатель в каждой дроби.', 'В правильной дроби числитель меньше знаменателя.', 'Посмотри на ' + fr(p[0], p[1]) + '.'],
          solution: fr(p[0], p[1]) + ': ' + p[0] + ' < ' + p[1] + '.'
        });
      },
      function () {
        const d = pick([2, 3, 4, 6, 8]), w = rint(1, 3), r = rint(1, d - 1), n = w * d + r;
        const nm = { 2: ['половинка', 'половинки', 'половинок'], 3: ['треть', 'трети', 'третей'], 4: ['четвертинка', 'четвертинки', 'четвертинок'], 6: ['шестая часть', 'шестые части', 'шестых частей'], 8: ['восьмушка', 'восьмушки', 'восьмушек'] }[d];
        return qSteps('Есть ' + pl(n, nm) + ' пиццы. Из них собирают целые пиццы.', [
          sNum('Сколько целых пицц получится?', w, ['В одной пицце ' + pl(d, nm) + '.', n + ' : ' + d + ' = ?', 'Целых ' + w + '.']),
          sNum('Сколько долей останется?', r, ['Посчитай: ' + n + ' − ' + (w * d) + '.', 'Остаток меньше ' + d + '.', 'Останется ' + r + '.'])
        ], { result: fr(n, d) + ' = ' + mx(w, r, d), solution: n + ' : ' + d + ' = ' + w + ' (ост. ' + r + '). ' + fr(n, d) + ' = ' + mx(w, r, d) + '.' });
      }
    ],
    'frac-ray': [
      function () {
        const d = pick([3, 4, 5, 6, 8]), k = rint(1, d - 1);
        return qNum('Путь от 0 до 1 - это 1 км. Бегун добежал до точки A. Сколько клеток ему осталось до 1?', d - k, {
          visual: ray(d, 1, [{ at: k, label: 'A' }]),
          hints: ['Посчитай клетки от точки A до 1.', 'От 0 до 1 всего ' + pl(d, CELLS) + '. До A ' + k + '.', d + ' − ' + k + ' = ?'],
          solution: d + ' − ' + k + ' = ' + (d - k) + '.'
        });
      },
      function () {
        const d = pick([3, 4, 5, 6, 8]), ks = shuffle(range(1, d - 1)).slice(0, 2), k1 = ks[0], k2 = ks[1];
        return qFrac('Какое число соответствует точке B?', F(k2, d), {
          visual: ray(d, 1, [{ at: k1, label: 'A' }, { at: k2, label: 'B' }]),
          hints: ['Сколько клеток от 0 до 1?', 'Одна клетка - это ' + fr(1, d) + '.', 'От 0 до точки B ' + pl(k2, CELLS) + '.'],
          solution: 'B = ' + fr(k2, d) + '.'
        });
      },
      function () {
        const d = pick([4, 5, 6, 8, 10]), a = rint(2, d - 1), c = rint(1, a - 1);
        return qNum('Единичный отрезок - ' + pl(d, CELLS) + '. На сколько клеток точка ' + fr(a, d) + ' правее точки ' + fr(c, d) + '?', a - c, {
          visual: ray(d, 1, [{ at: c, label: 'A' }, { at: a, label: 'B' }]),
          hints: ['Точка ' + fr(a, d) + ' стоит через ' + pl(a, CELLS) + ' от нуля.', 'Точка ' + fr(c, d) + ' стоит через ' + pl(c, CELLS) + '.', a + ' − ' + c + ' = ?'],
          solution: a + ' − ' + c + ' = ' + (a - c) + '.'
        });
      },
      function () {
        const d = pick([4, 5, 6, 8]), ks = shuffle(range(1, 2 * d - 1).filter(function (x) { return x % d !== 0; })).slice(0, 3);
        const min = Math.min.apply(null, ks);
        return qChoice('Какое число стоит на луче левее всех?', [fr(min, d)].concat(ks.filter(function (x) { return x !== min; }).map(function (x) { return fr(x, d); })), {
          hints: ['Левее на луче стоит меньшее число.', 'Знаменатели одинаковые. Сравни числители.', 'Самый маленький числитель: ' + min + '.'],
          solution: fr(min, d) + '.'
        });
      },
      function () {
        const d = pick([2, 3, 4, 5]), a = rint(1, d - 1), m = rint(1, d + 1), b = a + m;
        return qFrac('Единичный отрезок - ' + pl(d, CELLS) + '. Точка A = ' + fr(a, d) + '. Точка B правее A на ' + pl(m, CELLS) + '. Какое число у точки B?', F(b, d), {
          visual: ray(d, 2, [{ at: a, label: 'A' }]),
          hints: ['Одна клетка - это ' + fr(1, d) + '.', 'Прибавь ' + pl(m, CELLS) + ': ' + fr(a, d) + ' + ' + fr(m, d) + '.', 'Получится ' + fr(b, d) + '.'],
          solution: fr(a, d) + ' + ' + fr(m, d) + ' = ' + frSum(F(b, d)) + '.'
        });
      }
    ],
    'frac-compare': [
      function () {
        const ds = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 3), min = Math.min.apply(null, ds);
        return qChoice('Какая доля больше всех?', [fr(1, min)].concat(ds.filter(function (x) { return x !== min; }).map(function (x) { return fr(1, x); })), {
          hints: ['Представь одну пиццу. Её режут на разное число частей.', 'Меньше частей - больше каждая часть.', 'Ищи самый маленький знаменатель.'],
          solution: fr(1, min) + ': знаменатель ' + min + ' самый маленький.'
        });
      },
      function () {
        const P = person(), n = rint(5, 12), a = rint(1, n - 1); let b = rint(1, n - 1); while (b === a) b = rint(1, n - 1);
        const truth = Math.random() < 0.5, real = a > b ? '>' : '<', sign = truth ? real : (real === '>' ? '<' : '>');
        return qYes(P[0] + ' ' + vb(P, 'написал', 'написала') + ': ' + fr(a, n) + ' ' + sign + ' ' + fr(b, n) + '. Верно?', truth, {
          hints: ['Знаменатели одинаковые.', 'Больше дробь с большим числителем.', 'Сравни ' + a + ' и ' + b + '.'],
          solution: truth ? yes : 'Это не так: ' + fr(a, n) + ' ' + real + ' ' + fr(b, n) + '.'
        });
      },
      function () {
        const b = rint(3, 12), a = rint(1, b - 1), labels = ['Больше', 'Меньше', 'Равно'];
        const s = 2 * a > b ? 0 : 2 * a < b ? 1 : 2;
        return qFixed('Дробь ' + fr(a, b) + ' больше половины или меньше?', labels, s, {
          hints: ['Половина - это ' + fr(1, 2) + '.', 'Удвой числитель и сравни со знаменателем.', a + ' · 2 = ' + (2 * a) + '. Сравни с ' + b + '.'],
          solution: fr(a, b) + [' > ', ' < ', ' = '][s] + fr(1, 2) + '.'
        });
      },
      function () {
        let fs, L, keys;
        do {
          fs = [0, 1, 2].map(function () { const p = proper(8); return F(p[0], p[1]); });
          keys = fs.map(function (f) { return f.n + '/' + f.d; });
          L = fs.reduce(function (x, f) { return lcm(x, f.d); }, 1);
        } while (new Set(keys).size < 3 || L > 60);
        const sorted = fs.slice().sort(function (x, y) { return x.cmp(y); }), min = sorted[0];
        return qChoice('Какая дробь самая маленькая?', [mk(min)].concat(fs.filter(function (f) { return f !== min; }).map(mk)), {
          hints: ['Приведи дроби к общему знаменателю.', 'Общий знаменатель ' + L + '.', fs.map(function (f) { return mk(f) + ' = ' + fr(f.n * L / f.d, L); }).join('. ') + '.'],
          solution: 'Самая маленькая: ' + mk(min) + '.'
        });
      },
      function () {
        const pp = twoPeople(), P = pp[0], Q = pp[1];
        let a, b, c, d, p, q;
        do { p = proper(9); q = proper(9); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (b === d || a * d === c * b || lcm(b, d) > 45);
        const firstBig = F(a, b).cmp(F(c, d)) > 0, L = lcm(b, d);
        return qFixed(P[0] + ' ' + vb(P, 'пробежал', 'пробежала') + ' ' + fr(a, b) + ' дистанции. ' + Q[0] + ' ' + vb(Q, 'пробежал', 'пробежала') + ' ' + fr(c, d) + ' такой же дистанции. Кто ближе к финишу?', [P[0], Q[0]], firstBig ? 0 : 1, {
          hints: ['Больше пробежал - ближе к финишу.', 'Приведи дроби к знаменателю ' + L + '.', fr(a, b) + ' = ' + fr(a * L / b, L) + '. ' + fr(c, d) + ' = ' + fr(c * L / d, L) + '.'],
          solution: (firstBig ? P[0] : Q[0]) + ': ' + fr(a * L / b, L) + (firstBig ? ' > ' : ' < ') + fr(c * L / d, L) + '.'
        });
      }
    ],
    'frac-addsame': [
      function (ctx) {
        const W = theme(ctx, WHOLE), d = rint(5, 12), a = rint(1, d - 2), b = rint(1, d - 1 - a);
        return qFrac('Утром ' + W.act + ' ' + fr(a, d) + ' ' + W.gen + '. Вечером ещё ' + fr(b, d) + '. Какую часть ' + W.gen + ' ' + W.act + ' за день?', F(a + b, d), {
          visual: bar(d, a, b),
          hints: ['Нужно сложить две дроби.', 'Знаменатели одинаковые. Сложи числители.', a + ' + ' + b + ' = ' + (a + b) + '.'],
          solution: fr(a, d) + ' + ' + fr(b, d) + ' = ' + fr(a + b, d) + '.'
        });
      },
      function () {
        const P = person(), d = rint(5, 12), a = rint(1, d - 2), b = rint(1, d - 1 - a), truth = Math.random() < 0.4;
        const said = truth ? fr(a + b, d) : fr(a + b, 2 * d);
        return qYes(P[0] + ' ' + vb(P, 'решил', 'решила') + ': ' + fr(a, d) + ' + ' + fr(b, d) + ' = ' + said + '. Верно?', truth, {
          visual: bar(d, a, b),
          hints: ['При сложении меняется размер частей?', 'Знаменатель показывает размер частей. Он не меняется.', 'Верно так: ' + fr(a, d) + ' + ' + fr(b, d) + ' = ' + fr(a + b, d) + '.'],
          solution: truth ? yes : 'Это не так. Знаменатели не складывают: ' + fr(a + b, d) + '.'
        });
      },
      function () {
        const d = rint(5, 15), c = rint(3, d - 1), a = rint(1, c - 1);
        return qNum(fr(c, d) + ' − ' + fr('?', d) + ' = ' + fr(a, d) + '. Какое число стоит вместо знака вопроса?', c - a, {
          hints: ['Знаменатели одинаковые. Смотри на числители.', c + ' − ? = ' + a + '.', c + ' − ' + a + ' = ' + (c - a) + '.'],
          solution: fr(c, d) + ' − ' + fr(c - a, d) + ' = ' + fr(a, d) + '.'
        });
      },
      function () {
        const d = rint(3, 12), a = rint(1, d - 1);
        return qFrac(fr(a, d) + ' + ? = 1. Какая дробь стоит вместо знака вопроса?', F(d - a, d), {
          hints: ['Запиши 1 дробью со знаменателем ' + d + '.', '1 = ' + fr(d, d) + '.', fr(d, d) + ' − ' + fr(a, d) + ' = ?'],
          solution: '1 − ' + fr(a, d) + ' = ' + fr(d - a, d) + '.'
        });
      },
      function (ctx) {
        const A = theme(ctx, TIME), d = pick([4, 5, 6, 10, 12]), a = rint(1, d - 2), b = rint(1, d - 1 - a);
        return qFrac(A[0] + ' ' + A[1] + ' ' + fr(a, d) + ' часа. Перерыв занял ' + fr(b, d) + ' часа. Сколько времени прошло всего?', F(a + b, d), {
          hints: ['Нужно сложить время.', 'Знаменатели одинаковые. Сложи числители.', a + ' + ' + b + ' = ' + (a + b) + '.'],
          solution: fr(a, d) + ' + ' + fr(b, d) + ' = ' + fr(a + b, d) + ' часа.'
        });
      }
    ],
    'frac-adddiff': [
      function () {
        const a = pick([2, 3, 4, 5]), k = pick([2, 3]), small = a * k;
        const inA = { 2: 'половине', 3: 'трети', 4: 'четверти', 5: 'пятой части' }[a];
        const smallN = { 4: 'четвертей', 6: 'шестых', 8: 'восьмых', 9: 'девятых', 10: 'десятых', 12: 'двенадцатых', 15: 'пятнадцатых' }[small];
        return qNum('Сколько ' + smallN + ' в одной ' + inA + '?', k, {
          visual: rows([[a, 1], [small, k]]),
          hints: ['Посмотри на рисунок.', fr(1, a) + ' = ' + fr('?', small) + '.', small + ' : ' + a + ' = ' + k + '.'],
          solution: fr(1, a) + ' = ' + fr(k, small) + '. Ответ ' + k + '.'
        });
      },
      function () {
        const P = person();
        let a, b, c, d, p, q;
        do { p = proper(6); q = proper(6); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (b === d);
        const truth = Math.random() < 0.35, right = F(a, b).add(F(c, d)), said = truth ? mk(right) : fr(a + c, b + d);
        return qYes(P[0] + ' ' + vb(P, 'решил', 'решила') + ': ' + fr(a, b) + ' + ' + fr(c, d) + ' = ' + said + '. Верно?', truth, {
          hints: ['Можно ли сразу складывать разные доли?', 'Сначала приведи дроби к общему знаменателю.', 'Верно так: ' + fr(a, b) + ' + ' + fr(c, d) + ' = ' + mk(right) + '.'],
          solution: truth ? yes : 'Это не так. Верх и низ складывать нельзя: ' + mk(right) + '.'
        });
      },
      function () {
        let p, q, b, d;
        do { p = proper(10); q = proper(10); b = p[1]; d = q[1]; } while (b === d || lcm(b, d) > 60);
        const L = lcm(b, d), m = Math.max(b, d);
        return qNum('Найди наименьший общий знаменатель дробей ' + fr(p[0], b) + ' и ' + fr(q[0], d) + '.', L, {
          hints: ['Ищи НОК чисел ' + b + ' и ' + d + '.', 'Перебирай ' + m + ', ' + (2 * m) + ', ' + (3 * m) + '. Найди первое кратное числа ' + Math.min(b, d) + '.', 'НОК равен ' + L + '.'],
          solution: 'НОК(' + b + ', ' + d + ') = ' + L + '.'
        });
      },
      function () {
        let a, b, c, d, p, q, L, num, s;
        do {
          p = proper(8); q = proper(8); a = p[0]; b = p[1]; c = q[0]; d = q[1];
          L = lcm(b, d); num = a * L / b + c * L / d; s = F(a, b).add(F(c, d));
        } while (b === d || L > 40 || gcd(num, L) === 1 || s.cmp(F(1, 1)) >= 0);
        return qFrac('Сложи и сократи: ' + fr(a, b) + ' + ' + fr(c, d) + '.', s, {
          form: { reduced: true },
          hints: ['Общий знаменатель ' + L + '.', fr(a, b) + ' + ' + fr(c, d) + ' = ' + fr(num, L) + '.', 'Сократи ' + fr(num, L) + ' на ' + gcd(num, L) + '.'],
          solution: fr(num, L) + ' = ' + mk(s) + '.'
        });
      },
      function (ctx) {
        const W = theme(ctx, WHOLE);
        let a, b, c, d, p, q, s;
        do { p = proper(6); q = proper(6); a = p[0]; b = p[1]; c = q[0]; d = q[1]; s = F(a, b).add(F(c, d)); } while (b === d || lcm(b, d) > 24 || s.cmp(F(1, 1)) >= 0);
        const rest = F(1, 1).sub(s);
        return qSteps('Утром ' + W.act + ' ' + fr(a, b) + ' ' + W.gen + '. Днём ещё ' + fr(c, d) + '. Какая часть ' + W.gen + ' осталась?', [
          sFrac('Сколько ' + W.act + ' всего?', s, {}, ['Сложи ' + fr(a, b) + ' и ' + fr(c, d) + '.', 'Общий знаменатель ' + lcm(b, d) + '.', 'Получится ' + mk(s) + '.']),
          sFrac('Какая часть осталась?', rest, {}, ['Всё целое - это 1.', 'Посчитай 1 − ' + mk(s) + '.', 'Получится ' + mk(rest) + '.'])
        ], { result: 'Осталось ' + mk(rest), solution: '1 − ' + mk(s) + ' = ' + mk(rest) + '.' });
      }
    ],
    'mixed-add': [
      function () {
        const P = person(), d = rint(3, 9), a = rint(1, d - 2), b = rint(1, d - 1 - a), w1 = rint(1, 5), w2 = rint(1, 5), truth = Math.random() < 0.4;
        const said = truth ? mx(w1 + w2, a + b, d) : mx(w1 + w2, a + b, 2 * d);
        return qYes(P[0] + ' ' + vb(P, 'сложил', 'сложила') + ': ' + mx(w1, a, d) + ' + ' + mx(w2, b, d) + ' = ' + said + '. Верно?', truth, {
          hints: ['Целые складывают с целыми. Доли с долями.', 'Знаменатель у долей не меняется.', 'Верно так: ' + mx(w1 + w2, a + b, d) + '.'],
          solution: truth ? yes : 'Это не так: ' + mx(w1, a, d) + ' + ' + mx(w2, b, d) + ' = ' + mx(w1 + w2, a + b, d) + '.'
        });
      },
      function () {
        const d = rint(3, 9), a = rint(1, d - 1), b = rint(d - a, d - 1), w1 = rint(1, 5), w2 = rint(1, 5);
        return qNum(mx(w1, a, d) + ' + ' + mx(w2, b, d) + '. Сколько целых будет в ответе?', w1 + w2 + 1, {
          hints: ['Сложи целые и доли отдельно.', 'Доли: ' + fr(a, d) + ' + ' + fr(b, d) + ' = ' + fr(a + b, d) + '. Это не меньше целого.', 'Из долей выходит ещё одна целая.'],
          solution: (w1 + w2) + ' + 1 = ' + (w1 + w2 + 1) + '.'
        });
      },
      function () {
        const d = rint(3, 9), w = rint(2, 6), a = rint(1, d - 1);
        return qNum(mx(w, a, d) + ' = ' + mx(w - 1, '?', d) + '. Какое число стоит вместо знака вопроса?', a + d, {
          hints: ['Одну целую превратили в доли.', 'Одна целая - это ' + fr(d, d) + '.', a + ' + ' + d + ' = ?'],
          solution: mx(w, a, d) + ' = ' + mx(w - 1, a + d, d) + '.'
        });
      },
      function () {
        const d = rint(2, 8), n = rint(3, 8), w = rint(1, n - 1), a = rint(1, d - 1), v = F(n * d - (w * d + a), d);
        return qFrac(n + ' − ' + mx(w, a, d) + ' = ?', v, {
          hints: ['Займи у числа ' + n + ' одну единицу.', n + ' = ' + mx(n - 1, d, d) + '.', mx(n - 1, d, d) + ' − ' + mx(w, a, d) + ' = ?'],
          solution: mx(n - 1, d, d) + ' − ' + mx(w, a, d) + ' = ' + frSum(v) + '.'
        });
      },
      function (ctx) {
        const A = theme(ctx, TIME);
        let b, d, a, c, w1, w2;
        do { b = pick([2, 3, 4, 6]); d = pick([2, 3, 4, 6]); a = rint(1, b - 1); c = rint(1, d - 1); w1 = rint(1, 2); w2 = rint(1, 2); } while (b === d || gcd(a, b) > 1 || gcd(c, d) > 1);
        const v = F(w1 * b + a, b).add(F(w2 * d + c, d)), L = lcm(b, d);
        return qFrac(A[0] + ' в понедельник ' + A[1] + ' ' + mx(w1, a, b) + ' часа. Во вторник ' + mx(w2, c, d) + ' часа. Сколько часов за два дня?', v, {
          hints: ['Сложи целые отдельно.', 'Дробные части приведи к знаменателю ' + L + '.', mx(w1, a * L / b, L) + ' + ' + mx(w2, c * L / d, L) + ' = ?'],
          solution: 'Всего ' + frSum(v) + ' часа.'
        });
      }
    ],
    'frac-mul': [
      function () {
        const r = rint(2, 4), c = rint(2, 5), sr = rint(1, r - 1), sc = rint(1, c - 1);
        return qFrac('Какая часть прямоугольника тёмная?', F(sr * sc, r * c), {
          visual: grid(r, c, sr, sc),
          hints: ['Сколько всего клеток?', 'Сколько тёмных клеток?', 'Тёмных ' + (sr * sc) + ' из ' + (r * c) + '.'],
          solution: fr(sr, r) + ' · ' + fr(sc, c) + ' = ' + fr(sr * sc, r * c) + '.'
        });
      },
      function () {
        const P = person();
        let a, b, c, d, p, q;
        do { p = proper(5); q = proper(6); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (b === 2 && d === 2);
        const truth = Math.random() < 0.45, said = truth ? fr(a * c, b * d) : fr(a * c, b + d);
        return qYes(P[0] + ' ' + vb(P, 'умножил', 'умножила') + ': ' + fr(a, b) + ' · ' + fr(c, d) + ' = ' + said + '. Верно?', truth, {
          hints: ['Как умножают дроби?', 'Числители умножают. Знаменатели тоже умножают.', 'Верно так: ' + fr(a * c, b * d) + '.'],
          solution: truth ? yes : 'Это не так. Знаменатели тоже умножают: ' + fr(a * c, b * d) + '.'
        });
      },
      function () {
        const b = rint(2, 9), a = rint(1, 9); let c = rint(2, 9); while (c === b) c = rint(2, 9);
        const v = F(a, c);
        return qFrac(fr(a, b) + ' · ' + fr(b, c) + ' = ?', v, {
          hints: ['Запиши всё одной дробью.', 'Число ' + b + ' есть и сверху и снизу. Его можно сократить.', 'Останется ' + fr(a, c) + '.'],
          solution: fr(a * b, b * c) + ' = ' + frSum(v) + '.'
        });
      },
      function () {
        const p = proper(9), a = p[0], b = p[1];
        return qFrac('Сторона квадрата ' + fr(a, b) + ' м. Найди его площадь в квадратных метрах.', F(a * a, b * b), {
          hints: ['Площадь квадрата = сторона · сторона.', 'Посчитай ' + fr(a, b) + ' · ' + fr(a, b) + '.', 'Числители: ' + a + ' · ' + a + '. Знаменатели: ' + b + ' · ' + b + '.'],
          solution: fr(a * a, b * b) + ' кв. м.'
        });
      },
      function () {
        const p = proper(5), a = p[0], b = p[1], q = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]), c = q[0], d = q[1];
        const item = pick(['муки', 'сахара', 'масла']);
        return qFrac('На один пирог нужно ' + fr(a, b) + ' кг ' + item + '. Сколько ' + item + ' нужно на ' + fr(c, d) + ' пирога?', F(a * c, b * d), {
          hints: ['Нужно найти ' + fr(c, d) + ' от ' + fr(a, b) + '.', 'Для этого дроби перемножают.', 'Посчитай ' + fr(a, b) + ' · ' + fr(c, d) + '.'],
          solution: fr(a, b) + ' · ' + fr(c, d) + ' = ' + fr(a * c, b * d) + ' кг.'
        });
      }
    ],
    'reciprocal': [
      function () {
        const p = proper(9), a = p[0], b = p[1];
        return qChoice('Какое число обратно числу ' + fr(a, b) + '?', [fr(b, a), fr(a, b), fr(1, a * b), fr(b - a, b)], {
          hints: ['Обратное число в произведении даёт 1.', 'Переверни дробь.', 'Сверху будет ' + b + '. Снизу ' + a + '.'],
          solution: fr(b, a) + '.'
        });
      },
      function () {
        const p = proper(9, 3, 2), a = p[0], b = p[1];
        return qFrac(fr(a, b) + ' · ? = 1. Какое число стоит вместо знака вопроса?', F(b, a), {
          form: { improper: true },
          hints: ['Ищем обратное число к ' + fr(a, b) + '.', 'Обратное число получают переворотом дроби.', 'Переверни ' + fr(a, b) + '.'],
          solution: fr(a, b) + ' · ' + fr(b, a) + ' = 1.'
        });
      },
      function () {
        const d = rint(2, 7), w = rint(1, 4), r = rint(1, d - 1);
        return qNum('Найди произведение числа ' + mx(w, r, d) + ' и обратного ему числа.', 1, {
          hints: ['Найди обратное число к ' + mx(w, r, d) + '.', 'Произведение взаимно обратных чисел всегда одно и то же.', 'Оно равно 1.'],
          solution: 'Произведение взаимно обратных чисел равно 1.'
        });
      },
      function () {
        const p = proper(9);
        return qChoice('У какого числа нет обратного?', ['0', '1', fr(p[0], p[1]), String(rint(2, 9))], {
          hints: ['Обратное число в произведении даёт 1.', 'Ноль на любое число даёт 0.', 'Поэтому у нуля нет обратного числа.'],
          solution: '0: ноль на любое число даёт 0.'
        });
      },
      function () {
        const p = proper(9), a = p[0], b = p[1];
        return qChoice('Что больше: ' + fr(a, b) + ' или обратное ему число?', [fr(b, a), fr(a, b), 'Они равны'], {
          hints: ['Найди обратное число к ' + fr(a, b) + '.', 'Обратное к правильной дроби больше 1.', fr(b, a) + ' > 1 > ' + fr(a, b) + '.'],
          solution: fr(b, a) + ' > ' + fr(a, b) + '.'
        });
      }
    ],
    'frac-div': [
      function () {
        const k = pick([2, 3, 4, 5]), n = rint(2, 6);
        return qNum('Сколько стаканов по ' + fr(1, k) + ' литра можно налить из ' + n + ' л сока?', n * k, {
          hints: ['Сколько стаканов выходит из одного литра?', 'Из 1 литра выходит ' + pl(k, ['стакан', 'стакана', 'стаканов']) + '.', n + ' · ' + k + ' = ?'],
          solution: n + ' : ' + fr(1, k) + ' = ' + n + ' · ' + k + ' = ' + (n * k) + '.'
        });
      },
      function () {
        const P = person(), n = rint(2, 8), k = pick([2, 3, 4, 5]), truth = Math.random() < 0.4;
        const said = truth ? String(n * k) : fr(n, k);
        return qYes(P[0] + ' ' + vb(P, 'решил', 'решила') + ': ' + n + ' : ' + fr(1, k) + ' = ' + said + '. Верно?', truth, {
          hints: ['Сколько раз ' + fr(1, k) + ' помещается в одной целой?', 'Деление на ' + fr(1, k) + ' заменяют умножением на ' + k + '.', n + ' · ' + k + ' = ' + (n * k) + '.'],
          solution: truth ? yes : 'Это не так: ' + n + ' : ' + fr(1, k) + ' = ' + (n * k) + '.'
        });
      },
      function () {
        let a, b, c, d, p, q;
        do { p = proper(8); q = proper(8); a = p[0]; b = p[1]; c = q[0]; d = q[1]; } while (a * d === b * c);
        return qChoice('Как заменить деление ' + fr(a, b) + ' : ' + fr(c, d) + ' умножением?', [fr(a, b) + ' · ' + fr(d, c), fr(b, a) + ' · ' + fr(c, d), fr(a, b) + ' · ' + fr(c, d), fr(b, a) + ' · ' + fr(d, c)], {
          hints: ['Первую дробь не трогают.', 'Вторую дробь переворачивают.', 'Вместо ' + fr(c, d) + ' пишут ' + fr(d, c) + '.'],
          solution: fr(a, b) + ' : ' + fr(c, d) + ' = ' + fr(a, b) + ' · ' + fr(d, c) + '.'
        });
      },
      function () {
        const p = proper(8), a = p[0], b = p[1], n = rint(2, 6), v = F(a, b * n);
        return qFrac(fr(a, b) + ' : ' + n + ' = ?', v, {
          hints: ['Число ' + n + ' можно записать как ' + fr(n, 1) + '.', 'Деление на ' + n + ' заменяют умножением на ' + fr(1, n) + '.', 'Посчитай ' + fr(a, b) + ' · ' + fr(1, n) + '.'],
          solution: fr(a, b) + ' · ' + fr(1, n) + ' = ' + mk(v.red()) + '.'
        });
      },
      function () {
        const p = proper(6), c = p[0], d = p[1], v = d * rint(2, 6), dist = v * c / d;
        return qNum('Велосипедист проехал ' + dist + ' км за ' + fr(c, d) + ' часа. С какой скоростью он ехал? Ответ в км/ч.', v, {
          hints: ['Скорость = путь : время.', dist + ' : ' + fr(c, d) + ' = ' + dist + ' · ' + fr(d, c) + '.', 'Посчитай ' + dist + ' : ' + c + ' · ' + d + '.'],
          solution: dist + ' · ' + fr(d, c) + ' = ' + v + ' км/ч.'
        });
      }
    ],
    'frac-of-number': [
      function () {
        const k = pick([2, 3, 4, 5, 6, 10, 12, 15, 20, 30]), m = 60 / k;
        return qNum('Сколько минут в ' + fr(1, k) + ' часа?', m, {
          hints: ['В одном часе 60 минут.', 'Найди ' + fr(1, k) + ' от 60.', '60 : ' + k + ' = ?'],
          solution: '60 : ' + k + ' = ' + pl(m, ['минута', 'минуты', 'минут']) + '.'
        });
      },
      function () {
        const k = pick([2, 4, 5, 10, 20, 25]); let a = rint(1, k - 1); while (gcd(a, k) > 1) a = rint(1, k - 1);
        return qNum('Сколько сантиметров в ' + fr(a, k) + ' метра?', 100 * a / k, {
          hints: ['В одном метре 100 сантиметров.', 'Найди ' + fr(a, k) + ' от 100.', '100 : ' + k + ' · ' + a + ' = ?'],
          solution: '100 : ' + k + ' · ' + a + ' = ' + (100 * a / k) + ' см.'
        });
      },
      function () {
        const P = person(), k = rint(3, 8), a = rint(2, k - 1), N = k * a * rint(1, 3), truth = Math.random() < 0.45;
        const right = N / k * a, other = N / a * k;
        const said = truth ? N + ' : ' + k + ' · ' + a + ' = ' + right : N + ' : ' + a + ' · ' + k + ' = ' + other;
        return qYes(P[0] + ' ' + vb(P, 'искал', 'искала') + ' ' + fr(a, k) + ' от ' + N + ' так: ' + said + '. Верно?', truth, {
          hints: ['Сначала делят на знаменатель.', 'Потом умножают на числитель.', N + ' : ' + k + ' · ' + a + ' = ' + right + '.'],
          solution: truth ? yes : 'Это не так. Нужно ' + N + ' : ' + k + ' · ' + a + ' = ' + right + '.'
        });
      },
      function (ctx) {
        const t = theme(ctx, COLL), k = rint(3, 8), a = rint(1, k - 1), X = k * rint(2, 6), part = X / k * a;
        return qNum(cap(pl(part, t)) + ' - это ' + fr(a, k) + ' всех ' + t[2] + '. Сколько всего ' + t[2] + '?', X, {
          hints: ['Известна часть. Нужно найти всё.', 'Одна доля: ' + part + ' : ' + a + ' = ' + (part / a) + '.', 'Всё число: ' + (part / a) + ' · ' + k + ' = ?'],
          solution: part + ' : ' + a + ' · ' + k + ' = ' + X + '.'
        });
      },
      function () {
        const b = rint(2, 6), a = rint(1, b - 1), N = b * rint(4, 7), girls = N / b * a, boys = N - girls;
        return qNum('В классе ' + pl(N, ['ученик', 'ученика', 'учеников']) + '. ' + fr(a, b) + ' класса - девочки. Сколько в классе мальчиков?', boys, {
          hints: ['Сначала найди число девочек.', 'Девочек: ' + N + ' : ' + b + ' · ' + a + ' = ' + girls + '.', 'Мальчиков: ' + N + ' − ' + girls + '.'],
          solution: N + ' − ' + girls + ' = ' + boys + '.'
        });
      }
    ]
  };

  M.TOPICS.forEach(function (t) {
    const add = ADD[t.id];
    if (!add) return;
    add.forEach(function (g, i) { if (g && t.steps[i]) t.steps[i].gens.push(g); });
  });
  M.CONTENT_VERSION = 2;
})();
