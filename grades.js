/* grades.js - предметы, классы и программы по КТП. Загружается после всех файлов с темами. */
(function () {
  'use strict';
  const M = globalThis.M;
  M.TOPICS.forEach(function (t) { if (!t.grade) t.grade = 5; if (!t.subj) t.subj = 'math'; });
  // курс = предмет и класс. Разделы КТП, которых в приложении ещё нет, стоят на карте в тумане
  const COURSES = {
    math5: { subj: 'math', n: 5, title: '5 класс', map: 'Карта 5 класса', course: 'Курс 5 класса', about: 'Математика 5 класса: обыкновенные дроби по КТП',
      future: ['Совместная работа', 'Десятичные дроби', 'Множества', 'Проценты', 'Углы', 'Диаграммы'] },
    math6: { subj: 'math', n: 6, title: '6 класс', map: 'Карта 6 класса', course: 'Курс 6 класса', about: 'Математика 6 класса: рациональные числа и выражения по КТП',
      future: ['Уравнения', 'Неравенства', 'Координатная плоскость', 'Статистика', 'Графики', 'Системы уравнений'] },
    phys8: { subj: 'phys', n: 8, title: '8 класс', map: 'Физика. Карта 8 класса', course: 'Физика 8 класса', about: 'Физика 8 класса: основы электростатики по КТП',
      future: ['Постоянный ток', 'Электромагнитные явления', 'Световые явления'] },
    phys9: { subj: 'phys', n: 9, title: '9 класс', map: 'Физика. Карта 9 класса', course: 'Физика 9 класса', about: 'Физика 9 класса: основы динамики по КТП',
      future: ['Законы сохранения', 'Колебания и волны', 'Строение атома', 'Атомное ядро'] }
  };
  // классы по предметам: какие уже есть в приложении
  const SUBJ = {
    math: { title: 'Математика', grades: [5, 6], all: [5, 6, 7, 8, 9, 10, 11] },
    phys: { title: 'Физика', grades: [8, 9], all: [7, 8, 9] }
  };
  function cKey(g, subj) {
    subj = subj || 'math';
    if (subj === 'math') return 'math' + (g >= 6 ? 6 : 5);
    return subj + g;
  }
  const BY = {};
  function topicsOf(g, subj) {
    const k = cKey(g, subj);
    if (!BY[k]) { const c = COURSES[k]; BY[k] = c ? M.TOPICS.filter(function (t) { return t.subj === c.subj && t.grade === c.n; }) : []; }
    return BY[k];
  }
  // номер темы внутри своего курса
  Object.keys(COURSES).forEach(function (k) { const c = COURSES[k]; topicsOf(c.n, c.subj).forEach(function (t, i) { t.n = i + 1; }); });
  // главы = разделы КТП. full: в приложении есть все уроки раздела, значит в конце главы тест
  const CHAPTERS = {
    math5: [
      { id: '5.1C', title: 'Обыкновенные дроби', topics: ['frac-basic', 'frac-property', 'mixed', 'frac-ray'], full: true },
      { id: '5.2A', title: 'Действия над обыкновенными дробями', topics: ['frac-compare', 'frac-addsame', 'frac-adddiff', 'mixed-add', 'frac-mul', 'reciprocal', 'frac-div'], full: true },
      { id: '5.3A', title: 'Текстовые задачи', topics: ['frac-of-number'], full: false }
    ],
    math6: [
      { id: '6.1В', title: 'Рациональные числа и действия над ними', topics: ['r-neg', 'r-int', 'r-abs', 'r-cmp', 'r-addline', 'r-add', 'r-sub'], full: true },
      { id: '6.2А', title: 'Действия над рациональными числами', topics: ['r-mul', 'r-mulprop', 'r-div', 'r-period', 'r-ops', 'r-word'], full: true },
      { id: '6.2В', title: 'Алгебраические выражения', topics: ['a-expr', 'a-dom', 'a-brack', 'a-like', 'a-ident', 'a-trans', 'a-make', 'a-solve'], full: true }
    ],
    phys8: [
      { id: '8.4.1', title: 'Основы электростатики', topics: ['e-charge', 'e-conserve', 'e-coulomb', 'e-field', 'e-potential', 'e-lines', 'e-capacitor'], full: true }
    ],
    phys9: [
      { id: '9.2.2', title: 'Основы динамики', topics: ['d-newton1', 'd-forces', 'd-newton2', 'd-newton3', 'd-gravity', 'd-weight', 'd-gravmotion', 'd-satellite'], full: true }
    ]
  };
  // часов в году по КТП: от них считается процент курса
  const HOURS = { math5: 170, math6: 170, phys8: 68, phys9: 68 };
  const CH_OF = {}, WEIGHT = {};
  // уроки темы: '59-62, 65-66' -> [59, 60, 61, 62, 65, 66]
  function lessonList(t) {
    const out = [];
    String(t.lessons || '').split(',').forEach(function (part) {
      const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
      if (!m) return;
      for (let i = Number(m[1]); i <= Number(m[2] || m[1]); i++) out.push(i);
    });
    return out;
  }
  Object.keys(COURSES).forEach(function (k) {
    const c = COURSES[k], list = topicsOf(c.n, c.subj), have = {}, share = {};
    list.forEach(function (t) { have[t.id] = 1; lessonList(t).forEach(function (l) { share[l] = (share[l] || 0) + 1; }); });
    // урок с двумя темами делится между ними поровну
    list.forEach(function (t) { const ls = lessonList(t); WEIGHT[t.id] = ls.length ? ls.reduce(function (s, l) { return s + 1 / share[l]; }, 0) : 1; });
    (CHAPTERS[k] || []).forEach(function (ch, i) {
      ch.course = k; ch.k = i + 1;
      ch.topics = ch.topics.filter(function (id) { return have[id]; });
      ch.topics.forEach(function (id) { CH_OF[id] = ch; });
    });
    if (CHAPTERS[k]) CHAPTERS[k] = CHAPTERS[k].filter(function (ch) { return ch.topics.length > 0; });
    list.forEach(function (t) { if (!CH_OF[t.id]) throw new Error('Тема без главы: ' + t.id); });
  });
  M.COURSES = COURSES;
  M.SUBJ = SUBJ;
  M.courseKey = cKey;
  M.topicsOf = topicsOf;
  M.chaptersOf = function (g, subj) { return CHAPTERS[cKey(g, subj)] || []; };
  M.chapterOf = function (id) { return CH_OF[id] || null; };
  M.courseHours = function (g, subj) { return HOURS[cKey(g, subj)] || 68; };
  M.lessonsOf = function (t) { return WEIGHT[t.id] || 1; };
  M.gradeInfo = function (g, subj) { return COURSES[cKey(g, subj)] || COURSES.math5; };
  M.GRADES = { 5: COURSES.math5, 6: COURSES.math6 };
  M.FUTURE = COURSES.math5.future;
})();
