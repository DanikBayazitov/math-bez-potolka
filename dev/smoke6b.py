"""6 класс: ученик не знает ответы в разведке, потом учится. Проверяем объяснения, разбор по шагам, ввод с запятой."""
import sys, time, subprocess, json
from playwright.sync_api import sync_playwright
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'smoke6.py')).read().split('with sync_playwright() as p:')[0].replace("PORT = 8771", "PORT = 8773"))
shots = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    pg.goto('http://127.0.0.1:%d/' % PORT); pg.wait_for_timeout(700)
    pg.click('.tile.on'); pg.click('[data-act="grade"][data-g="6"]'); pg.click('[data-act="to"][data-to="nick"]')
    pg.fill('#nick-in', 'Тест6'); pg.click('[data-act="to-diag"]'); pg.click('[data-act="diag-start"]'); pg.wait_for_timeout(200)
    print('after start', pg.evaluate('window.MBP.U.screen'), pg.evaluate('window.MBP.U.card && window.MBP.U.card.type'), pg.evaluate("!!document.querySelector('[data-act=dk]')"))
    # разведка: всё «Не знаю»
    for i in range(10):
        dk = pg.query_selector('[data-act="dk"]')
        if not dk: break
        dk.click(); pg.wait_for_timeout(150)
    kinds, decs, walked, explained = [], 0, 0, 0
    for i in range(260):
        scr = pg.evaluate('window.MBP.U.screen')
        info = pg.evaluate(INFO)
        ctype = pg.evaluate('window.MBP.U.card && window.MBP.U.card.type')
        if ctype == 'explain':
            explained += 1
            if 'explain' not in shots: pg.screenshot(path=SHOTS + '/g6_explain.png'); shots['explain'] = 1
            o = pg.query_selector('[data-act="w-opt"][data-j="0"]:not([disabled])')
            if o:
                if not walked: pg.screenshot(path=SHOTS + '/g6_walk.png'); walked = 1
                o.click(); pg.wait_for_timeout(80); continue
            wn = pg.query_selector('[data-act="w-next"]')
            if wn: wn.click(); pg.wait_for_timeout(80); continue
            if not walked and explained < 6 and pg.query_selector('[data-act="simpler"]'):
                pg.click('[data-act="simpler"]'); pg.wait_for_timeout(120); continue
            okb = pg.query_selector('[data-act="ok"]')
            if okb: okb.click(); pg.wait_for_timeout(150); continue
        if info is None:
            nb = pg.query_selector('#next-btn')
            if nb: nb.click(); pg.wait_for_timeout(150); continue
            if scr == 'map':
                cbtn = pg.query_selector('[data-act="continue"]')
                if cbtn: cbtn.click(); pg.wait_for_timeout(150); continue
                print('map without continue:', pg.inner_text('.dock'), pg.evaluate("JSON.stringify({cur: window.MBP.U.st.current, f: window.MBP.U.st.flow})"))
                break
            btn = pg.query_selector('[data-act="after-closed"], [data-act="go-map"].btn-primary, .card .btn-primary, .dock .btn-primary, #app > .btn-primary')
            if btn: btn.click(); pg.wait_for_timeout(150); continue
            print('stuck at', scr, ctype); break
        kinds.append(info['inp']['kind'])
        if info['inp']['kind'] == 'number' and ',' in info['inp']['v']:
            decs += 1
            if 'dec' not in shots:
                answer(pg, info); pg.wait_for_timeout(100); pg.screenshot(path=SHOTS + '/g6_decimal.png'); shots['dec'] = 1
                nb = pg.query_selector('#next-btn')
                if nb: nb.click(); pg.wait_for_timeout(150)
                continue
        answer(pg, info); pg.wait_for_timeout(100)
        res = pg.evaluate('window.MBP.U.att && window.MBP.U.att.res')
        if res not in (2, None): errors.append('not accepted: ' + info['prompt'] + ' -> ' + str(res))
        nb = pg.query_selector('#next-btn')
        if nb: nb.click(); pg.wait_for_timeout(150)
    pg.evaluate("window.MBP.U.screen='map'; window.MBP.U.card=null;"); pg.evaluate("document.querySelector('[data-act=\"go-map\"]') && document.querySelector('[data-act=\"go-map\"]').click()")
    pg.wait_for_timeout(300)
    pg.screenshot(path=SHOTS + '/g6_map2.png', full_page=True)
    st = pg.evaluate("JSON.stringify(Object.fromEntries(Object.entries(window.MBP.U.st.topics).filter(([k,v])=>v.status!=='new').map(([k,v])=>[k,v.status+'/'+v.step])))")
    b.close()
srv.terminate()
print('kinds', {k: kinds.count(k) for k in set(kinds)}, 'decimal typed', decs, 'explains', explained, 'walk shown', walked)
print('topics', st)
print('errors', errors[:8])
