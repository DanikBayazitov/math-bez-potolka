/* grades.js - классы и программы по КТП. Загружается после всех файлов с темами. */
(function () {
  'use strict';
  const M = globalThis.M;
  M.TOPICS.forEach(function (t) { if (!t.grade) t.grade = 5; });
  // разделы КТП, которых в приложении ещё нет: на карте они стоят в тумане после готовых тем
  const GRADES = {
    5: { n: 5, title: '5 класс', map: 'Карта 5 класса', about: 'Обыкновенные дроби по КТП 5 класса',
      future: ['Совместная работа', 'Десятичные дроби', 'Множества', 'Проценты', 'Углы', 'Диаграммы'] },
    6: { n: 6, title: '6 класс', map: 'Карта 6 класса', about: 'Рациональные числа и выражения по КТП 6 класса',
      future: ['Уравнения', 'Неравенства', 'Координатная плоскость', 'Статистика', 'Графики', 'Системы уравнений'] }
  };
  const BY = {};
  function topicsOf(g) {
    g = g >= 6 ? 6 : 5;
    if (!BY[g]) BY[g] = M.TOPICS.filter(function (t) { return t.grade === g; });
    return BY[g];
  }
  // номер темы внутри своего класса
  [5, 6].forEach(function (g) { topicsOf(g).forEach(function (t, i) { t.n = i + 1; }); });
  // главы = разделы КТП. full: в приложении есть все уроки раздела, значит в конце главы тест
  const CHAPTERS = {
    5: [
      { id: '5.1C', title: 'Обыкновенные дроби', topics: ['frac-basic', 'frac-property', 'mixed', 'frac-ray'], full: true },
      { id: '5.2A', title: 'Действия над обыкновенными дробями', topics: ['frac-compare', 'frac-addsame', 'frac-adddiff', 'mixed-add', 'frac-mul', 'reciprocal', 'frac-div'], full: true },
      { id: '5.3A', title: 'Текстовые задачи', topics: ['frac-of-number'], full: false }
    ],
    6: [
      { id: '6.1В', title: 'Рациональные числа и действия над ними', topics: ['r-neg', 'r-int', 'r-abs', 'r-cmp', 'r-addline', 'r-add', 'r-sub'], full: true },
      { id: '6.2А', title: 'Действия над рациональными числами', topics: ['r-mul', 'r-mulprop', 'r-div', 'r-period', 'r-ops', 'r-word'], full: true },
      { id: '6.2В', title: 'Алгебраические выражения', topics: ['a-expr', 'a-dom', 'a-brack', 'a-like', 'a-ident', 'a-trans', 'a-make', 'a-solve'], full: true }
    ]
  };
  // часов в году по КТП: от них считается процент курса
  const HOURS = { 5: 170, 6: 170 };
  const CH_OF = {};
  [5, 6].forEach(function (g) {
    const have = {};
    topicsOf(g).forEach(function (t) { have[t.id] = 1; });
    CHAPTERS[g].forEach(function (c, i) {
      c.grade = g; c.k = i + 1;
      c.topics = c.topics.filter(function (id) { return have[id]; });
      c.topics.forEach(function (id) { CH_OF[id] = c; });
    });
    // каждая тема класса должна быть в какой-то главе
    topicsOf(g).forEach(function (t) { if (!CH_OF[t.id]) throw new Error('Тема без главы: ' + t.id); });
  });
  // сколько уроков КТП у темы: '59-62, 65-66' -> 6
  function lessonsOf(t) {
    return String(t.lessons || '').split(',').reduce(function (s, part) {
      const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
      return s + (m ? (m[2] ? Number(m[2]) - Number(m[1]) + 1 : 1) : 0);
    }, 0) || 1;
  }
  M.chaptersOf = function (g) { return CHAPTERS[g >= 6 ? 6 : 5]; };
  M.chapterOf = function (id) { return CH_OF[id] || null; };
  M.courseHours = function (g) { return HOURS[g >= 6 ? 6 : 5]; };
  M.lessonsOf = lessonsOf;
  M.GRADES = GRADES;
  M.topicsOf = topicsOf;
  M.gradeInfo = function (g) { return GRADES[g >= 6 ? 6 : 5]; };
  M.FUTURE = GRADES[5].future;
})();
