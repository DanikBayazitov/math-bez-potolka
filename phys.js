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

  M.P = { sup: sup, sci: sci, num: num, svgCharges: svgCharges, svgInduction: svgInduction, svgRub: svgRub, svgLines: svgLines, svgForce: svgForce, svgCapacitor: svgCapacitor };
})();
