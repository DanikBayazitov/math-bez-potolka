"""Проверка в браузере: ученик 6 класса проходит вход, разведку и несколько задач.
Ответы вводятся кнопками, включая минус и запятую."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
APPDIR = os.environ.get('APP', os.path.join(HERE, '..'))
SHOTS = os.environ.get('SHOTS', '/tmp/mbp-shots')
os.makedirs(SHOTS, exist_ok=True)
import sys, time, subprocess, json
from playwright.sync_api import sync_playwright

ROOT = sys.argv[1] if len(sys.argv) > 1 else APPDIR
PORT = 8771
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.0)
errors = []

INFO = r"""
() => {
  const U = window.MBP.U, M = window.MBP.M, c = U.card;
  if (!c || c.type !== 'task') return null;
  const q = c.q, a = U.att;
  const spec = q.kind === 'steps' ? q.steps[a.sub] : q;
  let inp = null;
  if (spec.kind === 'number') {
    const s = typeof spec.answer === 'object' ? M.rk(spec.answer, {dec: true}) : String(spec.answer);
    inp = {kind: 'number', neg: s.startsWith('−') || s.startsWith('-'), v: s.replace(/^[−-]/, '')};
  } else if (spec.kind === 'expr') inp = {kind: 'expr', v: spec.answer, vars: spec.vars};
  else if (spec.kind === 'choice') inp = {kind: 'choice', i: spec.answer};
  else if (spec.kind === 'yesno') inp = {kind: 'yesno', v: spec.answer ? 1 : 0};
  else if (spec.kind === 'fraction') {
    const f0 = M.F(spec.answer), neg = f0.n < 0, f = M.absF(f0).red(), form = spec.form || {};
    let w = '', n = f.n, d = f.d;
    if (form.den) { n = f.n * form.den / f.d; d = form.den; }
    else if (spec.withWhole && f.n > f.d && !form.improper) { w = String(Math.floor(f.n / f.d)); n = f.n % f.d; d = f.d; if (n === 0) { n = ''; d = ''; } }
    inp = {kind: 'fraction', neg: neg, w: String(w), n: String(n), d: String(d), whole: !!spec.withWhole};
  }
  return {mode: c.mode, topic: c.topic, step: c.step, prompt: spec.prompt, inp: inp, keys: Array.from(document.querySelectorAll('.pad .key')).map(k => k.dataset.k)};
}
"""

def press(page, ch):
    k = {'−': 'neg', ',': 'comma'}.get(ch, ch)
    page.click('.pad .key[data-k="%s"]' % k)

def answer(page, info):
    inp = info['inp']
    if inp['kind'] == 'choice':
        page.click('.opt[data-i="%d"]' % inp['i'])
    elif inp['kind'] == 'yesno':
        page.click('.opt[data-v="%d"]' % inp['v'])
    elif inp['kind'] == 'expr':
        for ch in inp['v']:
            k = {'+': 'plus', '-': 'minus', ',': 'comma'}.get(ch, ('v-' + ch) if ch.isalpha() else ch)
            page.click('.pad .key[data-k="%s"]' % k)
        page.click('[data-act="check"]')
    elif inp['kind'] == 'number':
        if inp['neg']: press(page, '−')
        for ch in inp['v']: press(page, ch)
        page.click('[data-act="check"]')
    else:
        if inp['neg']: press(page, '−')
        if inp['whole'] and inp['w']:
            page.click('.box[data-box="w"]')
            for ch in inp['w']: press(page, ch)
        if inp['n']:
            page.click('.box[data-box="n"]')
            for ch in inp['n']: press(page, ch)
            page.click('.box[data-box="d"]')
            for ch in inp['d']: press(page, ch)
        page.click('[data-act="check"]')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    pg.goto('http://127.0.0.1:%d/' % PORT)
    pg.wait_for_timeout(800)
    pg.click('.tile.on')
    pg.wait_for_timeout(200)
    pg.screenshot(path=SHOTS + '/g6_grade.png')
    pg.click('[data-act="grade"][data-g="6"]')
    pg.click('[data-act="to"][data-to="nick"]')
    pg.fill('#nick-in', 'Солнышко')
    pg.click('[data-act="to-diag"]')
    pg.wait_for_timeout(200)
    pg.click('[data-act="diag-start"]')
    pg.wait_for_timeout(300)
    seen, signed, decimal, n = [], 0, 0, 0
    for i in range(60):
        info = pg.evaluate(INFO)
        scr = pg.evaluate('window.MBP.U.screen')
        if info is None:
            nb = pg.query_selector('#next-btn')
            if scr == 'map':
                break
            if nb:
                nb.click(); pg.wait_for_timeout(150); continue
            btn = pg.query_selector('[data-act="w-next"], [data-act="ok-explain"], .card [data-act="next"], .btn-primary')
            if btn: btn.click(); pg.wait_for_timeout(150); continue
            break
        n += 1
        if info['inp'] and info['inp'].get('neg'): signed += 1
        if info['inp'] and info['inp']['kind'] == 'number' and ',' in info['inp']['v']: decimal += 1
        if n == 2: pg.screenshot(path=SHOTS + '/g6_task.png')
        if info['inp'] and info['inp'].get('neg') and signed == 1:
            pass
        seen.append('%s/%s/%s' % (info['topic'], info['step'], info['mode']))
        if info['inp']['kind'] in ('number', 'fraction'):
            assert 'neg' in info['keys'], 'no minus key in 6th grade: ' + json.dumps(info['keys'])
        answer(pg, info)
        pg.wait_for_timeout(120)
        if n == 1 or (info['inp'].get('neg') and signed == 1):
            pg.screenshot(path=SHOTS + '/g6_answered.png')
        res = pg.evaluate('window.MBP.U.att && window.MBP.U.att.res')
        msg = pg.evaluate('window.MBP.U.att && window.MBP.U.att.msg && window.MBP.U.att.msg.type')
        if info['mode'] != 'd' and res not in (2, None):
            errors.append('correct answer not accepted: %s -> res %s msg %s' % (info['prompt'], res, msg))
        nb = pg.query_selector('#next-btn')
        if nb: nb.click(); pg.wait_for_timeout(150)
        if n >= 25: break
    scr = pg.evaluate('window.MBP.U.screen')
    st = pg.evaluate('JSON.stringify({g: window.MBP.U.st.learner.grade, diag: window.MBP.U.st.diag.g, done: window.MBP.U.st.diag.done, cur: window.MBP.U.st.current})')
    pg.evaluate("window.MBP.U.screen='map'; window.MBP.U.card=null;")
    pg.evaluate("document.querySelector('[data-act=\"go-map\"]') && document.querySelector('[data-act=\"go-map\"]').click()")
    pg.wait_for_timeout(300)
    title = pg.evaluate("document.querySelector('.bar-title') && document.querySelector('.bar-title').textContent")
    pg.screenshot(path=SHOTS + '/g6_map.png', full_page=False)
    b.close()
srv.terminate()
print('tasks', n, 'signed answers typed', signed, 'decimal answers typed', decimal)
print('path', ' -> '.join(seen[:14]))
print('state', st, 'map title', title)
print('errors', errors[:10])
