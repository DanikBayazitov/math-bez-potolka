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
  M.GRADES = GRADES;
  M.topicsOf = topicsOf;
  M.gradeInfo = function (g) { return GRADES[g >= 6 ? 6 : 5]; };
  M.FUTURE = GRADES[5].future;
})();
