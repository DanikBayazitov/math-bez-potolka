/* phys.js - помощники для физики: степени десяти, рисунки зарядов, силовых линий и конденсатора. */
(function () {
  'use strict';
  const M = globalThis.M;
  const F = M.F, MIN = M.MINUS;

  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); }
  // 1,6 · 10⁻¹⁹
  function sci(m, p) { return M.rk(F(m), { dec: true }) + ' · 10' + sup(p); }
  function num(x) { return M.rk(F(x), { dec: true }); }

  /* ---------- рисунки ---------- */
  function svg(w, h, aria, body) {
    return '<svg class="vis phys" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + M.esc(aria) + '">' + body + '</svg>';
  }
  // стрелка с наконечником
  function arrow(x1, y1, x2, y2, cls) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 5;
    const hx = x2 - L * Math.cos(a), hy = y2 - L * Math.sin(a);
    const p1 = (hx + W * Math.sin(a)).toFixed(1) + ',' + (hy - W * Math.cos(a)).toFixed(1), p2 = (hx - W * Math.sin(a)).toFixed(1) + ',' + (hy + W * Math.cos(a)).toFixed(1);
    return '<line class="' + (cls || 'ph-ln') + '" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) + '"/>' +
      '<polygon class="' + (cls || 'ph-ln') + '-h" points="' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' ' + p1 + ' ' + p2 + '"/>';
  }
  // наконечник посреди линии: стрелка по направлению от (x1, y1) к (x2, y2)
  function midHead(x1, y1, x2, y2, cls) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1), L = 8, W = 4.5;
    const tx = mx + L / 2 * Math.cos(a), ty = my + L / 2 * Math.sin(a), hx = mx - L / 2 * Math.cos(a), hy = my - L / 2 * Math.sin(a);
    return '<polygon class="' + (cls || 'ph-ln') + '-h" points="' + tx.toFixed(1) + ',' + ty.toFixed(1) + ' ' + (hx + W * Math.sin(a)).toFixed(1) + ',' + (hy - W * Math.cos(a)).toFixed(1) + ' ' + (hx - W * Math.sin(a)).toFixed(1) + ',' + (hy + W * Math.cos(a)).toFixed(1) + '"/>';
  }
  function ball(cx, cy, r, sign, label) {
    const cls = sign === '+' ? 'pb-pos' : sign === '-' ? 'pb-neg' : 'pb-0';
    return '<circle class="' + cls + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
      (sign ? '<text class="ph-sign" x="' + cx + '" y="' + (cy + 6) + '" text-anchor="middle">' + (sign === '-' ? MIN : '+') + '</text>' : '') +
      (label ? '<text class="ph-lbl" x="' + cx + '" y="' + (cy + r + 18) + '" text-anchor="middle">' + M.esc(label) + '</text>' : '');
  }
  // пары шариков: { a: '+', b: '-' } - стрелки показывают притяжение или отталкивание
  // opt.noForce: без стрелок, когда ответ - именно направление сил
  function svgCharges(rows, aria, opt) {
    opt = opt || {};
    const H = 78 * rows.length + 8;
    let b = '';
    rows.forEach(function (r, i) {
      const y = 42 + i * 78, attract = r.a !== r.b, x1 = 100, x2 = 220;
      b += ball(x1, y, 20, r.a, r.la) + ball(x2, y, 20, r.b, r.lb);
      if (opt.noForce) return;
      if (attract) b += arrow(x1 + 24, y, x1 + 52, y, 'ph-force') + arrow(x2 - 24, y, x2 - 52, y, 'ph-force');
      else b += arrow(x1 - 24, y, x1 - 56, y, 'ph-force') + arrow(x2 + 24, y, x2 + 56, y, 'ph-force');
    });
    return svg(320, H, aria || 'Взаимодействие зарядов', b);
  }
  // палочка рядом с металлическим шаром: заряды в шаре разделились
  // opt.bare: шар без зарядов, когда их знаки и есть ответ
  function svgInduction(sign, aria, opt) {
    opt = opt || {};
    const s = sign === '-' ? '-' : '+', o = s === '+' ? '-' : '+', S = function (c) { return c === '-' ? MIN : '+'; };
    let b = '<rect class="ph-rod" x="14" y="68" width="120" height="24" rx="6"/>';
    for (let i = 0; i < 4; i++) b += '<text class="ph-sign sm" x="' + (34 + i * 26) + '" y="86" text-anchor="middle">' + S(s) + '</text>';
    b += '<circle class="pb-0" cx="230" cy="80" r="52"/>';
    if (!opt.bare) [[192, 62], [186, 82], [192, 102]].forEach(function (p) { b += '<text class="ph-sign sm" x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle">' + S(o) + '</text>'; });
    if (!opt.bare) [[268, 62], [274, 82], [268, 102]].forEach(function (p) { b += '<text class="ph-sign sm" x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle">' + S(s) + '</text>'; });
    b += '<text class="ph-lbl" x="74" y="118" text-anchor="middle">палочка</text><text class="ph-lbl" x="230" y="152" text-anchor="middle">металлический шар</text>';
    return svg(310, 160, aria || 'Электризация через влияние', b);
  }
  // палочка и ткань после трения
  function svgRub(rodSign, rod, cloth, aria) {
    const S = function (c) { return c === '-' ? MIN : '+'; }, o = rodSign === '+' ? '-' : '+';
    let b = '<rect class="ph-rod" x="20" y="40" width="130" height="24" rx="6"/>';
    for (let i = 0; i < 4; i++) b += '<text class="ph-sign sm" x="' + (42 + i * 28) + '" y="58" text-anchor="middle">' + S(rodSign) + '</text>';
    b += '<rect class="ph-cloth" x="186" y="24" width="110" height="56" rx="14"/>';
    for (let i = 0; i < 4; i++) b += '<text class="ph-sign sm" x="' + (206 + i * 24) + '" y="58" text-anchor="middle">' + S(o) + '</text>';
    b += '<text class="ph-lbl" x="85" y="92" text-anchor="middle">' + M.esc(rod) + '</text><text class="ph-lbl" x="241" y="100" text-anchor="middle">' + M.esc(cloth) + '</text>';
    return svg(316, 108, aria || 'Электризация трением', b);
  }
  // силовые линии: kind 'plus', 'minus', 'pair', 'same', 'plates'; pts: [['A', x, y]]
  // opt.bare: шарики серые и без знаков, когда знак заряда надо найти по линиям
  function svgLines(kind, pts, aria, opt) {
    opt = opt || {};
    const sg = function (s) { return opt.bare ? '' : s; };
    let b = '';
    if (kind === 'plus' || kind === 'minus') {
      const cx = 160, cy = 100;
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6, x1 = cx + 24 * Math.cos(a), y1 = cy + 24 * Math.sin(a), x2 = cx + 92 * Math.cos(a), y2 = cy + 92 * Math.sin(a);
        b += '<line class="ph-ln" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
        b += kind === 'plus' ? midHead(x1, y1, x2, y2) : midHead(x2, y2, x1, y1);
      }
      b += ball(cx, cy, 20, sg(kind === 'plus' ? '+' : '-'));
    } else if (kind === 'pair' || kind === 'same') {
      const ax = 100, bx = 220, cy = 100;
      if (kind === 'pair') {
        [-80, -44, 0, 44, 80].forEach(function (d) {
          const c = d * 1.25;
          b += '<path class="ph-ln" d="M' + (ax + 20) + ' ' + (cy + d * 0.18) + ' Q160 ' + (cy + c) + ' ' + (bx - 20) + ' ' + (cy + d * 0.18) + '"/>';
          b += midHead(150, cy + c * 0.5, 170, cy + c * 0.5);
        });
        [150, 180, 210].forEach(function (deg) { const a = deg * Math.PI / 180; b += '<line class="ph-ln" x1="' + (ax + 22 * Math.cos(a)).toFixed(1) + '" y1="' + (cy + 22 * Math.sin(a)).toFixed(1) + '" x2="' + (ax + 80 * Math.cos(a)).toFixed(1) + '" y2="' + (cy + 80 * Math.sin(a)).toFixed(1) + '"/>' + midHead(ax + 22 * Math.cos(a), cy + 22 * Math.sin(a), ax + 80 * Math.cos(a), cy + 80 * Math.sin(a)); });
        [-30, 0, 30].forEach(function (deg) { const a = deg * Math.PI / 180; b += '<line class="ph-ln" x1="' + (bx + 80 * Math.cos(a)).toFixed(1) + '" y1="' + (cy + 80 * Math.sin(a)).toFixed(1) + '" x2="' + (bx + 22 * Math.cos(a)).toFixed(1) + '" y2="' + (cy + 22 * Math.sin(a)).toFixed(1) + '"/>' + midHead(bx + 80 * Math.cos(a), cy + 80 * Math.sin(a), bx + 22 * Math.cos(a), cy + 22 * Math.sin(a)); });
        b += ball(ax, cy, 20, sg('+')) + ball(bx, cy, 20, sg('-'));
      } else {
        [ax, bx].forEach(function (x, k) {
          for (let i = 0; i < 12; i++) {
            const deg = i * 30, a = deg * Math.PI / 180, face = k === 0 ? Math.abs(deg) < 1 || deg === 360 : deg === 180;
            if (face) continue;
            const bend = k === 0 ? -1 : 1, x1 = x + 22 * Math.cos(a), y1 = cy + 22 * Math.sin(a);
            const ux = Math.cos(a) + (Math.abs(Math.sin(a)) > 0.4 ? bend * 0.35 : 0), uy = Math.sin(a), len = Math.sqrt(ux * ux + uy * uy);
            const x2 = x + 22 * Math.cos(a) + 64 * ux / len, y2 = cy + 22 * Math.sin(a) + 64 * uy / len;
            b += '<line class="ph-ln" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>' + midHead(x1, y1, x2, y2);
          }
        });
        b += ball(ax, cy, 20, sg('+')) + ball(bx, cy, 20, sg('+'));
      }
    } else if (kind === 'plates') {
      b += '<rect class="ph-plate" x="54" y="22" width="12" height="156" rx="3"/><rect class="ph-plate" x="254" y="22" width="12" height="156" rx="3"/>';
      for (let i = 0; i < 5; i++) {
        const y = 40 + i * 30;
        b += '<line class="ph-ln" x1="70" y1="' + y + '" x2="250" y2="' + y + '"/>' + midHead(150, y, 170, y);
        b += '<text class="ph-sign sm" x="40" y="' + (y + 5) + '" text-anchor="middle">+</text><text class="ph-sign sm" x="282" y="' + (y + 5) + '" text-anchor="middle">' + MIN + '</text>';
      }
    }
    (pts || []).forEach(function (p) {
      b += '<circle class="ph-pt" cx="' + p[1] + '" cy="' + p[2] + '" r="5"/><text class="ph-lbl" x="' + (p[1] + 9) + '" y="' + (p[2] - 8) + '">' + M.esc(p[0]) + '</text>';
    });
    return svg(320, 200, aria || 'Силовые линии электрического поля', b);
  }
  // поле направлено вправо: сила на плюс вправо, на минус влево
  function svgForce(aria) {
    let b = arrow(40, 30, 280, 30, 'ph-ln') + '<text class="ph-lbl" x="160" y="20" text-anchor="middle">E</text>';
    b += ball(90, 92, 18, '+') + arrow(112, 92, 170, 92, 'ph-force') + '<text class="ph-lbl" x="146" y="82">F</text>';
    b += ball(230, 92, 18, '-') + arrow(208, 92, 150, 92, 'ph-force');
    b += '<text class="ph-lbl" x="90" y="134" text-anchor="middle">плюс</text><text class="ph-lbl" x="230" y="134" text-anchor="middle">минус</text>';
    return svg(320, 146, aria || 'Сила на заряды в поле', b);
  }
  // плоский конденсатор
  function svgCapacitor(aria) {
    let b = '<line class="ph-wire" x1="20" y1="90" x2="110" y2="90"/><line class="ph-wire" x1="210" y1="90" x2="300" y2="90"/>';
    b += '<rect class="ph-diel" x="122" y="26" width="76" height="128" rx="4"/>';
    b += '<rect class="ph-plate" x="110" y="20" width="12" height="140" rx="3"/><rect class="ph-plate" x="198" y="20" width="12" height="140" rx="3"/>';
    for (let i = 0; i < 4; i++) {
      const y = 44 + i * 30;
      b += '<text class="ph-sign sm" x="96" y="' + (y + 5) + '" text-anchor="middle">+</text><text class="ph-sign sm" x="224" y="' + (y + 5) + '" text-anchor="middle">' + MIN + '</text>';
    }
    b += '<text class="ph-lbl" x="160" y="176" text-anchor="middle">диэлектрик</text><text class="ph-lbl" x="116" y="14" text-anchor="middle">обкладка</text><text class="ph-lbl" x="204" y="14" text-anchor="middle">обкладка</text>';
    return svg(320, 186, aria || 'Плоский конденсатор', b);
  }

  /* ---------- механика ---------- */
  // брусок и силы из центра: forces [{ d: 'up'|'down'|'left'|'right', l: 'mg', n: 1..3 }]
  // opt.ground: опора снизу; opt.a: направление ускорения (пунктирная стрелка сбоку)
  function svgBox(forces, aria, opt) {
    opt = opt || {};
    const cx = 160, cy = 100, w = 64, h = 44;
    let b = '';
    if (opt.ground) {
      b += '<line class="ph-ground" x1="40" y1="' + (cy + h / 2) + '" x2="280" y2="' + (cy + h / 2) + '"/>';
      for (let x = 48; x < 280; x += 14) b += '<line class="ph-hatch" x1="' + x + '" y1="' + (cy + h / 2) + '" x2="' + (x - 8) + '" y2="' + (cy + h / 2 + 8) + '"/>';
    }
    b += '<rect class="ph-box" x="' + (cx - w / 2) + '" y="' + (cy - h / 2) + '" width="' + w + '" height="' + h + '" rx="4"/>';
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    forces.forEach(function (f) {
      const v = D[f.d], L = (v[0] ? 40 : 30) + 16 * (f.n || 2), x2 = cx + v[0] * L, y2 = cy + v[1] * L;
      b += arrow(cx, cy, x2, y2, 'ph-force');
      const lx = v[0] > 0 ? x2 + 6 : v[0] < 0 ? x2 - 6 : cx + 8, ly = v[1] > 0 ? y2 - 2 : v[1] < 0 ? y2 + 12 : cy - 8;
      b += '<text class="ph-lbl" x="' + lx + '" y="' + ly + '" text-anchor="' + (v[0] < 0 ? 'end' : 'start') + '">' + M.esc(f.l) + '</text>';
    });
    if (opt.a) {
      const v = D[opt.a];
      const x1 = v[0] ? cx - 30 * v[0] : cx + 86, y1 = v[1] ? cy - 30 * v[1] : cy - 62;
      b += arrow(x1, y1, x1 + 60 * v[0], y1 + 60 * v[1], 'ph-acc');
      b += '<text class="ph-lbl" x="' + (x1 + 30 * v[0] + (v[0] ? 0 : 10)) + '" y="' + (y1 + 30 * v[1] + (v[0] ? -8 : 4)) + '">a</text>';
    }
    return svg(320, 200, aria || 'Силы, действующие на брусок', b);
  }
  function zigzag(x, y1, y2, n) {
    const st = (y2 - y1) / (2 * n);
    let d = 'M' + x + ' ' + y1;
    for (let i = 0; i < 2 * n; i++) d += ' L' + (x + (i % 2 ? -9 : 9)) + ' ' + (y1 + st * (i + 0.5)).toFixed(1);
    return '<path class="ph-spring" d="' + d + ' L' + x + ' ' + y2 + '"/>';
  }
  // пружина без груза и с грузом, Δl - удлинение
  function svgSpring(aria) {
    let b = '<line class="ph-ground" x1="60" y1="16" x2="260" y2="16"/>';
    for (let x = 68; x < 260; x += 14) b += '<line class="ph-hatch" x1="' + x + '" y1="16" x2="' + (x - 8) + '" y2="8"/>';
    b += zigzag(110, 16, 90, 6) + '<line class="ph-dim" x1="90" y1="90" x2="250" y2="90"/>';
    b += zigzag(210, 16, 130, 6) + '<rect class="ph-box" x="188" y="130" width="44" height="34" rx="4"/>';
    b += '<line class="ph-dim" x1="196" y1="130" x2="250" y2="130"/><line class="ph-dim" x1="244" y1="90" x2="244" y2="130"/>';
    b += '<text class="ph-lbl" x="250" y="115">Δl</text><text class="ph-lbl" x="110" y="112" text-anchor="middle">без груза</text><text class="ph-lbl" x="210" y="186" text-anchor="middle">с грузом</text>';
    return svg(320, 196, aria || 'Пружина без груза и с грузом', b);
  }
  // два тела притягиваются: стрелки друг к другу и расстояние r
  function svgMasses(aria) {
    let b = ball(90, 70, 24, '', 'm₁') + ball(230, 70, 18, '', 'm₂');
    b += arrow(116, 70, 152, 70, 'ph-force') + arrow(210, 70, 174, 70, 'ph-force');
    b += '<line class="ph-dim" x1="90" y1="126" x2="230" y2="126"/><line class="ph-dim" x1="90" y1="118" x2="90" y2="134"/><line class="ph-dim" x1="230" y1="118" x2="230" y2="134"/>';
    b += '<text class="ph-lbl" x="160" y="146" text-anchor="middle">r</text>';
    return svg(320, 156, aria || 'Два тела притягиваются', b);
  }
  // два тела толкают друг друга: силы равны и направлены в разные стороны
  function svgPair(aria) {
    let b = '<rect class="ph-box" x="86" y="56" width="74" height="50" rx="4"/><rect class="ph-box" x="160" y="56" width="74" height="50" rx="4"/>';
    b += '<text class="ph-lbl" x="123" y="88" text-anchor="middle">1</text><text class="ph-lbl" x="197" y="88" text-anchor="middle">2</text>';
    b += arrow(123, 40, 63, 40, 'ph-force') + arrow(197, 40, 257, 40, 'ph-force');
    b += '<text class="ph-lbl" x="58" y="32" text-anchor="end">F₁</text><text class="ph-lbl" x="262" y="32">F₂</text>';
    return svg(320, 120, aria || 'Тела действуют друг на друга', b);
  }
  // спутник на круговой орбите
  function svgOrbit(aria) {
    let b = '<circle class="ph-orbit" cx="160" cy="110" r="84"/><circle class="ph-earth" cx="160" cy="110" r="40"/>';
    b += '<text class="ph-lbl" x="160" y="115" text-anchor="middle">Земля</text>';
    b += '<circle class="ph-sat" cx="160" cy="26" r="8"/>';
    b += arrow(168, 26, 236, 26, 'ph-force') + '<text class="ph-lbl" x="240" y="31">v</text>';
    b += arrow(160, 36, 160, 66, 'ph-ln') + '<text class="ph-lbl" x="168" y="60">F</text>';
    return svg(320, 206, aria || 'Спутник на орбите', b);
  }
  // бросок горизонтально с высоты h, дальность s
  function svgThrow(aria) {
    let b = '<rect class="ph-cliff" x="20" y="40" width="40" height="130"/><line class="ph-ground" x1="20" y1="170" x2="300" y2="170"/>';
    let d = 'M60 40';
    for (let i = 1; i <= 20; i++) { const t = i / 20; d += ' L' + (60 + 200 * t).toFixed(1) + ' ' + (40 + 130 * t * t).toFixed(1); }
    b += '<path class="ph-path" d="' + d + '"/><circle class="ph-sat" cx="60" cy="40" r="6"/>';
    b += arrow(66, 40, 116, 40, 'ph-force') + '<text class="ph-lbl" x="96" y="32">v₀</text>';
    b += '<text class="ph-lbl" x="12" y="110" text-anchor="end">h</text><line class="ph-dim" x1="14" y1="40" x2="14" y2="170"/>';
    b += '<line class="ph-dim" x1="60" y1="184" x2="260" y2="184"/><text class="ph-lbl" x="160" y="198" text-anchor="middle">s</text>';
    return svg(320, 204, aria || 'Бросок горизонтально', b);
  }

  /* ---------- рисунки на бумаге в клетку (7 класс) ---------- */
  function grid(cols, rows, C) {
    let b = '';
    for (let i = 0; i <= cols; i++) b += '<line class="ph-grid" x1="' + i * C + '" y1="0" x2="' + i * C + '" y2="' + rows * C + '"/>';
    for (let j = 0; j <= rows; j++) b += '<line class="ph-grid" x1="0" y1="' + j * C + '" x2="' + cols * C + '" y2="' + j * C + '"/>';
    return b;
  }
  // стрелки сил в клетках: rows [{ at: клетка начала, n: длина в клетках, d: 'right'|'left', l: 'F₁' }]
  function svgGridArrows(rows, aria) {
    const C = 16, cols = 20, H = rows.length * 3 + 1;
    let b = grid(cols, H, C);
    rows.forEach(function (r, i) {
      const y = (i * 3 + 2) * C, x1 = r.at * C, x2 = (r.at + (r.d === 'left' ? -r.n : r.n)) * C;
      b += '<circle class="ph-pt" cx="' + x1 + '" cy="' + y + '" r="4"/>' + arrow(x1, y, x2, y, 'ph-force');
      b += '<text class="ph-lbl" x="' + ((x1 + x2) / 2) + '" y="' + (y - 7) + '" text-anchor="middle">' + M.esc(r.l || 'F') + '</text>';
    });
    return svg(cols * C, H * C, aria || 'Силы на бумаге в клетку', b);
  }
  // график F(Δl) для пружины на бумаге в клетку: 1 клетка по оси Δl = 1 см, по оси F = s Н
  // точка (x0 см; F0 Н) отмечена пунктиром
  function svgHooke(s, x0, aria) {
    const C = 16, L = 3, cols = 16, rows = 13, ox = L * C, oy = 11 * C;
    let b = grid(cols, rows, C);
    b += '<line class="ph-axis" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + 12 * C) + '" y2="' + oy + '"/><line class="ph-axis" x1="' + ox + '" y1="' + oy + '" x2="' + ox + '" y2="' + C + '"/>';
    b += '<polygon class="ph-axis-h" points="' + (ox + 12 * C + 6) + ',' + oy + ' ' + (ox + 12 * C - 3) + ',' + (oy - 4) + ' ' + (ox + 12 * C - 3) + ',' + (oy + 4) + '"/>';
    b += '<polygon class="ph-axis-h" points="' + ox + ',' + (C - 6) + ' ' + (ox - 4) + ',' + (C + 3) + ' ' + (ox + 4) + ',' + (C + 3) + '"/>';
    for (let i = 2; i <= 10; i += 2) {
      b += '<text class="ph-tick" x="' + (ox + i * C) + '" y="' + (oy + 14) + '" text-anchor="middle">' + i + '</text>';
      b += '<text class="ph-tick" x="' + (ox - 4) + '" y="' + (oy - i * C + 4) + '" text-anchor="end">' + M.rk(F(s).mul(i), { dec: true }) + '</text>';
    }
    b += '<text class="ph-tick" x="' + (ox - 4) + '" y="' + (oy + 14) + '" text-anchor="end">0</text>';
    b += '<text class="ph-lbl" x="' + (ox + 12 * C) + '" y="' + (oy + 30) + '" text-anchor="end">Δl, см</text><text class="ph-lbl" x="' + (ox + 6) + '" y="' + (C - 2) + '">F, Н</text>';
    b += '<line class="ph-gline" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + 10 * C) + '" y2="' + (oy - 10 * C) + '"/>';
    const px = ox + x0 * C, py = oy - x0 * C;
    b += '<line class="ph-dash" x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + oy + '"/><line class="ph-dash" x1="' + px + '" y1="' + py + '" x2="' + ox + '" y2="' + py + '"/>';
    b += '<circle class="ph-pt" cx="' + px + '" cy="' + py + '" r="4.5"/>';
    return svg(cols * C, rows * C + 18, aria || 'График силы упругости', b);
  }

  M.P = { svgGridArrows: svgGridArrows, svgHooke: svgHooke, sup: sup, sci: sci, num: num, svgCharges: svgCharges, svgInduction: svgInduction, svgRub: svgRub, svgLines: svgLines, svgForce: svgForce, svgCapacitor: svgCapacitor,
    svgBox: svgBox, svgSpring: svgSpring, svgMasses: svgMasses, svgPair: svgPair, svgOrbit: svgOrbit, svgThrow: svgThrow };
})();
