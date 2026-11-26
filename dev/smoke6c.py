"""6 класс, раздел 6.2В: ученик сразу попадает на «Выражение с переменной» и проходит все 8 тем.
Ответы с буквами вводятся кнопками клавиатуры выражений."""
import sys, time, subprocess, json
from playwright.sync_api import sync_playwright
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'smoke6.py')).read().split('with sync_playwright() as p:')[0].replace("PORT = 8771", "PORT = 8774"))
shots = {}
NEW = ['a-expr', 'a-dom', 'a-brack', 'a-like', 'a-ident', 'a-trans', 'a-make', 'a-solve']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    pg.goto('http://127.0.0.1:%d/' % PORT); pg.wait_for_timeout(700)
    pg.click('.tile.on'); pg.click('[data-act="grade"][data-g="6"]'); pg.click('[data-act="to"][data-to="nick"]')
    pg.fill('#nick-in', 'Алгебра'); pg.click('[data-act="to-diag"]'); pg.click('[data-act="diag-start"]'); pg.wait_for_timeout(200)
    # разведку заменяем: всё до «Выражения с переменной» уже знакомо
    pg.evaluate("""() => { const U = MBP.U, E = MBP.E, M = MBP.M, st = U.st, S = M.topicsOf(6);
      const idx = S.findIndex(t => t.id === 'a-expr'); st.diag.lo = idx; st.diag.hi = idx + 1; st.diag.pr = {}; st.diag.n = 7;
      E.diagFinish(st, Date.now()); st.current = null; E.save(st); }""")
    pg.reload(); pg.wait_for_timeout(600)
    kinds, exprs, partial, walked = [], 0, 0, 0
    seen_topics = []
    for i in range(700):
        scr = pg.evaluate('window.MBP.U.screen')
        ctype = pg.evaluate('window.MBP.U.card && window.MBP.U.card.type')
        topic = pg.evaluate('window.MBP.U.card && window.MBP.U.card.topic')
        if topic and (not seen_topics or seen_topics[-1] != topic): seen_topics.append(topic)
        if ctype == 'explain':
            key = 'ex_' + str(topic) + '_' + str(pg.evaluate('window.MBP.U.card.step'))
            if key in ('ex_a-brack_3', 'ex_a-like_3', 'ex_a-expr_1', 'ex_a-dom_1') and key not in shots:
                pg.screenshot(path=SHOTS + '/%s.png' % key, full_page=True); shots[key] = 1
            o = pg.query_selector('[data-act="w-opt"][data-j="0"]:not([disabled])')
            if o: o.click(); pg.wait_for_timeout(60); continue
            wn = pg.query_selector('[data-act="w-next"]')
            if wn: wn.click(); pg.wait_for_timeout(60); continue
            okb = pg.query_selector('[data-act="ok"]')
            if okb: okb.click(); pg.wait_for_timeout(120); continue
        info = pg.evaluate(INFO)
        if info is None:
            nb = pg.query_selector('#next-btn')
            if nb: nb.click(); pg.wait_for_timeout(120); continue
            if scr == 'map':
                cbtn = pg.query_selector('[data-act="continue"]')
                if cbtn: cbtn.click(); pg.wait_for_timeout(150); continue
                print('map without continue:', pg.inner_text('.dock')); break
            btn = pg.query_selector('[data-act="after-closed"], [data-act="go-map"].btn-primary, .card .btn-primary, .dock .btn-primary')
            if btn: btn.click(); pg.wait_for_timeout(120); continue
            print('stuck at', scr, ctype); break
        kinds.append(info['inp']['kind'])
        if info['inp']['kind'] == 'expr':
            exprs += 1
            if 'expr_task' not in shots:
                pg.screenshot(path=SHOTS + '/expr_task.png'); shots['expr_task'] = 1
                # сначала неприведённая запись: ждём подсказку «приведи подобные» или принятие при any
                answer(pg, info); pg.wait_for_timeout(100)
                pg.screenshot(path=SHOTS + '/expr_done.png'); shots['expr_done'] = 1
                nb = pg.query_selector('#next-btn')
                if nb: nb.click(); pg.wait_for_timeout(120)
                continue
        answer(pg, info); pg.wait_for_timeout(80)
        res = pg.evaluate('window.MBP.U.att && window.MBP.U.att.res')
        msg = pg.evaluate("(document.querySelector('.msg.note') || {}).innerText || ''")
        if res not in (2, None):
            errors.append('not accepted: ' + info['prompt'] + ' -> ' + str(res) + ' ' + msg)
        nb = pg.query_selector('#next-btn')
        if nb: nb.click(); pg.wait_for_timeout(120)
    st = pg.evaluate("JSON.stringify(Object.fromEntries(Object.entries(window.MBP.U.st.topics).filter(([k,v])=>k.startsWith('a-')).map(([k,v])=>[k,v.status+'/'+v.step])))")
    b.close()
srv.terminate()
print('kinds', {k: kinds.count(k) for k in set(kinds)}, 'expr typed', exprs)
print('topics', st)
print('order', ' -> '.join(seen_topics))
print('errors', errors[:10])
