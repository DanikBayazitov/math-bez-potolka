"""Тест по главе в браузере: глава 6.1В пройдена, тест не сдан с первого раза, работа над ошибками, второй тест сдан."""
import os, sys, time, subprocess, json
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'smoke6.py')).read().split('with sync_playwright() as p:')[0].replace("PORT = 8771", "PORT = 8776"))
log = []
def nxt(pg):
    nb = pg.query_selector('#next-btn')
    if nb: nb.click()
    pg.wait_for_timeout(110)
def card(pg): return pg.evaluate("() => { const c = MBP.U.card; return c ? { type: c.type, kind: c.kind || '', mode: c.mode || '', topic: c.topic || '', ti: c.ti, tn: c.tn, pass: c.pass, pct: c.pct } : null; }")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    pg.goto('http://127.0.0.1:%d/' % PORT); pg.wait_for_timeout(700)
    pg.click('.tile.on'); pg.click('[data-act="grade"][data-g="6"]'); pg.click('[data-act="to"][data-to="nick"]')
    pg.fill('#nick-in', 'Тестер'); pg.click('[data-act="to-diag"]'); pg.click('[data-act="diag-start"]'); pg.wait_for_timeout(200)
    for i in range(10):
        dk = pg.query_selector('[data-act="dk"]')
        if not dk: break
        dk.click(); pg.wait_for_timeout(120)
    # все темы главы 6.1В пройдены
    pg.evaluate("""() => { const st = MBP.U.st; M.chaptersOf(6)[0].topics.forEach(id => { const s = MBP.E._.ts(st, id); s.status = 'closed'; s.step = 5; }); st.current = null; MBP.E.save(st); }""")
    pg.reload(); pg.wait_for_timeout(600)
    pg.screenshot(path=SHOTS + '/ct_map_due.png', full_page=True)
    course = pg.inner_text('.course')
    dock = pg.inner_text('.dock')
    log.append('map: ' + course.replace('\n', ' ') + ' | dock: ' + dock)
    # нажатие на тему закрытой главы
    pg.click('[data-act="node"][data-id="r-mul"]'); pg.wait_for_timeout(150)
    log.append('locked topic toast: ' + pg.evaluate("(document.querySelector('.toast') || {}).innerText || ''"))
    pg.click('[data-act="continue"]'); pg.wait_for_timeout(200)
    c = card(pg); log.append('first card: ' + json.dumps(c, ensure_ascii=False))
    pg.screenshot(path=SHOTS + '/ct_intro.png')
    pg.click('#next-btn'); pg.wait_for_timeout(200)
    # первый тест: 5 ответов «Не знаю», остальные верно
    wrong = 0; shot_q = False; results = []
    for k in range(200):
        c = card(pg)
        if not c: break
        if c['type'] == 'task' and c['mode'] == 't':
            if not shot_q: pg.screenshot(path=SHOTS + '/ct_question.png'); shot_q = True
            attempt = len([r for r in results if r['type'] == 'ctest-result'])
            if attempt == 0 and wrong < 5:
                pg.click('[data-act="dk"]'); wrong += 1
            else:
                answer(pg, pg.evaluate(INFO))
            pg.wait_for_timeout(150); continue
        if c['type'] == 'ctest-result':
            results.append(c)
            pg.screenshot(path=SHOTS + '/ct_result_%d.png' % len(results), full_page=True)
            if c['pass']: break
            pg.click('#next-btn'); pg.wait_for_timeout(150); continue
        if c['type'] == 'explain':
            o = pg.query_selector('[data-act="w-opt"][data-j="0"]:not([disabled])')
            if o: o.click(); pg.wait_for_timeout(60); continue
            wn = pg.query_selector('[data-act="w-next"]')
            if wn: wn.click(); pg.wait_for_timeout(60); continue
            pg.click('[data-act="ok"]'); pg.wait_for_timeout(120); continue
        if c['type'] == 'task' and c['mode'] == 'f':
            if 'fix' not in [r.get('k') for r in results]: pg.screenshot(path=SHOTS + '/ct_fix.png'); results.append({'type': 'x', 'k': 'fix'})
            answer(pg, pg.evaluate(INFO)); pg.wait_for_timeout(80)
            nxt(pg); continue
        if c['type'] == 'info':
            log.append('info: ' + c['kind']); pg.click('#next-btn'); pg.wait_for_timeout(150); continue
        if c['type'] == 'task':
            answer(pg, pg.evaluate(INFO)); pg.wait_for_timeout(80); nxt(pg); continue
        log.append('stop at ' + json.dumps(c, ensure_ascii=False)); break
    log.append('results: ' + json.dumps([r for r in results if r['type'] == 'ctest-result'], ensure_ascii=False))
    pg.click('#next-btn'); pg.wait_for_timeout(200)
    pg.evaluate("() => { MBP.U.screen = 'map'; MBP.U.card = null; }"); pg.click('[data-act="go-map"]') if pg.query_selector('[data-act="go-map"]') else None
    pg.goto('http://127.0.0.1:%d/' % PORT); pg.wait_for_timeout(600)
    pg.screenshot(path=SHOTS + '/ct_map_after.png', full_page=True)
    log.append('after: ' + pg.inner_text('.course').replace('\n', ' ') + ' | dock: ' + pg.inner_text('.dock'))
    ch = pg.evaluate("JSON.stringify(MBP.E.chapterRows(MBP.U.st).map(c => [c.id, c.state, c.best, c.tries]))")
    log.append('chapters: ' + ch)
    b.close()
srv.terminate()
print('\n'.join(log))
print('errors', errors[:8])
