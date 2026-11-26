"""Клавиатура компьютера в задаче с выражением: цифры, буквы, плюс, минус, запятая, Backspace, Enter."""
import sys, time, subprocess
from playwright.sync_api import sync_playwright
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'smoke6.py')).read().split('with sync_playwright() as p:')[0].replace("PORT = 8771", "PORT = 8775"))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.goto('http://127.0.0.1:%d/' % PORT); pg.wait_for_timeout(600)
    pg.click('.tile.on'); pg.click('[data-act="grade"][data-g="6"]'); pg.click('[data-act="to"][data-to="nick"]')
    pg.fill('#nick-in', 'Клава'); pg.click('[data-act="to-diag"]'); pg.click('[data-act="diag-start"]'); pg.wait_for_timeout(200)
    pg.evaluate("""() => { const U = MBP.U, E = MBP.E, M = MBP.M, st = U.st, S = M.topicsOf(6);
      const idx = S.findIndex(t => t.id === 'a-like'); st.diag.lo = idx; st.diag.hi = idx + 1; st.diag.pr = {}; st.diag.n = 7;
      E.diagFinish(st, Date.now()); st.current = null; E.save(st); }""")
    pg.reload(); pg.wait_for_timeout(500)
    pg.click('[data-act="continue"]'); pg.wait_for_timeout(200)
    # объяснения пропускаем до первой задачи с выражением
    for i in range(40):
        info = pg.evaluate(INFO)
        if info and info['inp']['kind'] == 'expr': break
        if info: answer(pg, info); pg.wait_for_timeout(80); nb = pg.query_selector('#next-btn'); nb and nb.click(); pg.wait_for_timeout(100); continue
        btn = pg.query_selector('[data-act="ok"], #next-btn, [data-act="after-closed"]')
        if btn: btn.click(); pg.wait_for_timeout(120)
    info = pg.evaluate(INFO)
    ans = info['inp']['v']; v0 = info['inp']['vars'][0]
    print('task:', info['prompt'], '| answer', ans, '| vars', info['inp']['vars'])
    # набираем мусор, стираем, потом неприведённую запись через раскладку RU для буквы
    RU = {'a': 'ф', 'b': 'и', 'x': 'ч', 'y': 'н', 'm': 'ь', 'n': 'т', 'k': 'л', 'p': 'з', 'c': 'с'}
    pg.keyboard.type('12'); pg.keyboard.press('Backspace'); pg.keyboard.press('Backspace')
    for ch in ans:
        if ch.isalpha(): pg.evaluate("k => document.dispatchEvent(new KeyboardEvent('keydown', {key: k, bubbles: true}))", RU.get(ch, ch))
        elif ch == '-': pg.keyboard.press('Minus')
        elif ch == '+': pg.keyboard.type('+')
        elif ch == ',': pg.keyboard.type('.')
        else: pg.keyboard.type(ch)
    shown = pg.inner_text('.box.b-expr')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
    res = pg.evaluate('window.MBP.U.att.res')
    print('typed shown as:', shown.replace('\n', ' '), '| result', res)
    pg.screenshot(path=SHOTS + '/kbd_done.png')
    b.close()
srv.terminate()
print('errors', errors)
