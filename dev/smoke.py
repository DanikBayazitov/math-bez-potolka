import os
HERE = os.path.dirname(os.path.abspath(__file__))
APPDIR = os.environ.get('APP', os.path.join(HERE, '..'))
SHOTS = os.environ.get('SHOTS', '/tmp/mbp-shots')
os.makedirs(SHOTS, exist_ok=True)
import json, sys, time, subprocess
from playwright.sync_api import sync_playwright
from PIL import Image

srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '--bind', '127.0.0.1'], cwd=APPDIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.0)
errors, shots = [], []
def snap(page, name):
    p = SHOTS + '/' + name + '.png'
    page.screenshot(path=p, full_page=False)
    shots.append(p)

SOLVE = r"""
() => {
  const U = window.MBP.U, M = window.MBP.M, c = U.card;
  if (!c || c.type !== 'task') return null;
  const q = c.q, a = U.att;
  const spec = q.kind === 'steps' ? q.steps[a.sub] : q;
  let inp = null;
  if (spec.kind === 'number') inp = {kind:'number', v: String(spec.answer)};
  else if (spec.kind === 'choice') inp = {kind:'choice', i: spec.answer};
  else if (spec.kind === 'yesno') inp = {kind:'yesno', v: spec.answer ? 1 : 0};
  else if (spec.kind === 'fraction') {
    const f = M.F(spec.answer), form = spec.form || {};
    let w='', n, d;
    if (form.den) { n = f.n * form.den / f.d; d = form.den; }
    else { const r = f.red(); if (form.mixed || (spec.withWhole && r.n > r.d && !form.improper)) { w = String(Math.floor(r.n / r.d)); n = r.n % r.d; d = r.d; if (n === 0) { n=''; d=''; } } else { n = r.n; d = r.d; } }
    inp = {kind:'fraction', w: String(w), n: String(n), d: String(d), whole: !!spec.withWhole};
  }
  return {mode: c.mode, topic: c.topic, step: c.step, steps: q.kind === 'steps', inp: inp};
}
"""

def type_digits(page, s):
    for ch in s:
        page.click('.pad .key[data-k="%s"]' % ch)

def answer(page, info, wrong=False):
    inp = info['inp']
    if inp['kind'] == 'choice':
        idx = inp['i'] if not wrong else (inp['i'] + 1) % page.locator('.opt').count()
        page.click('.opt[data-i="%d"]' % idx)
    elif inp['kind'] == 'yesno':
        v = inp['v'] if not wrong else 1 - inp['v']
        page.click('.opt[data-v="%d"]' % v)
    elif inp['kind'] == 'number':
        type_digits(page, inp['v'] if not wrong else str(int(inp['v']) + 1))
        page.click('[data-act="check"]')
    else:
        if wrong:
            page.click('.box.b-n'); type_digits(page, '1'); page.click('.box.b-d'); type_digits(page, '97')
        else:
            if inp['w'] and inp['whole']:
                page.click('.box.b-w'); type_digits(page, inp['w'])
            if inp['n'] != '':
                page.click('.box.b-n'); type_digits(page, inp['n']); page.click('.box.b-d'); type_digits(page, inp['d'])
        page.click('[data-act="check"]')

def solve_task(page, wrong_first=False):
    first = True
    for _ in range(12):
        info = page.evaluate(SOLVE)
        if not info: return
        if page.locator('#next-btn').count():
            return
        answer(page, info, wrong=(wrong_first and first))
        first = False
        page.wait_for_timeout(60)

def pass_tests(page):
    # тест по главе, которую разведка засчитала: отвечаем верно
    for k in range(90):
        c = page.evaluate("() => { const c = window.MBP.U.card; return c ? { type: c.type, kind: c.kind || '', mode: c.mode || '' } : null }")
        if not c: return
        if c['type'] == 'info' and c['kind'] == 'ctest-start':
            snap(page, '5a-test'); page.click('#next-btn'); page.wait_for_timeout(150); continue
        if c['type'] == 'task' and c['mode'] == 't':
            info = page.evaluate(SOLVE)
            if k == 2: snap(page, '5b-test-q')
            answer(page, info); page.wait_for_timeout(150); continue
        if c['type'] == 'ctest-result':
            snap(page, '5c-test-result'); page.click('#next-btn'); page.wait_for_timeout(150); continue
        return

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='ru-RU')
    page = ctx.new_page()
    page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.goto('http://127.0.0.1:8765/index.html')
    page.wait_for_timeout(1500)
    snap(page, '1-start')
    page.click('.tile.on'); page.click('[data-act="grade"][data-g="5"]')
    page.click('[data-act="int"][data-id="football"]'); page.click('[data-act="int"][data-id="games"]')
    page.click('[data-act="to"][data-to="nick"]')
    page.fill('#nick-in', 'Ваня'); page.click('[data-act="to-diag"]'); page.click('[data-act="diag-start"]')
    page.wait_for_timeout(200)
    order = page.evaluate("() => window.MBP.M.TOPICS.map(t => t.id)")
    kn = order.index('mixed-add')
    diag_shot = False
    for i in range(8):
        info = page.evaluate(SOLVE)
        if not info or info['mode'] != 'd': break
        if not diag_shot:
            snap(page, '2-diag'); diag_shot = True
        if order.index(info['topic']) <= kn: answer(page, info)
        else: page.click('[data-act="dk"]')
        page.wait_for_timeout(120)
    snap(page, '3-diagdone')
    page.click('[data-act="go-map"]'); page.wait_for_timeout(300)
    snap(page, '4-map')
    page.click('[data-act="continue"]'); page.wait_for_timeout(200)
    pass_tests(page)
    snap(page, '5-explain')
    page.click('[data-act="ok"]'); page.wait_for_timeout(200)
    solve_task(page, wrong_first=True) if False else None
    # одна ошибка для показа подсказки
    info = page.evaluate(SOLVE)
    if info:
        answer(page, info, wrong=True); page.wait_for_timeout(200)
        snap(page, '6-hint')
        solve_task(page)
        snap(page, '7-solved')
    # пройти дальше пару десятков экранов
    for k in range(40):
        c = page.evaluate("() => { const c = window.MBP.U.card; return c ? c.type : (window.MBP.U.screen) }")
        if c == 'task':
            if page.locator('#next-btn').count(): page.click('#next-btn')
            else: solve_task(page)
        elif c == 'explain': page.click('[data-act="ok"]')
        elif c in ('info', 'diag-done'): page.click('#next-btn') if page.locator('#next-btn').count() else page.click('[data-act="go-map"]')
        elif c == 'closed':
            snap(page, '8-closed'); page.click('[data-act="after-closed"]')
        elif c == 'break': page.click('[data-act="next"]')
        elif c == 'map': page.click('[data-act="continue"]')
        else: break
        page.wait_for_timeout(60)
    page.evaluate("() => { const U = window.MBP.U; U.screen='map'; U.card=null; }")
    page.click('[data-act="menu"]') if page.locator('[data-act="menu"]').count() else None
    page.wait_for_timeout(100)
    page.click('[data-act="adult"]')
    for d in '12341234': page.click('[data-act="pin-key"][data-k="%s"]' % d)
    page.wait_for_timeout(300)
    snap(page, '9-adult')
    page.click('[data-act="tab"][data-tab="days"]'); page.wait_for_timeout(150)
    page.click('.day-h'); page.wait_for_timeout(150)
    page.click('[data-act="tab"][data-tab="content"]'); page.wait_for_timeout(150)
    page.click('.ct summary'); page.wait_for_timeout(300)
    page.click('[data-act="tab"][data-tab="report"]'); page.wait_for_timeout(150)
    rep = page.input_value('#report-out')
    page.click('[data-act="tab"][data-tab="code"]'); page.wait_for_timeout(150)
    page.click('[data-act="tab"][data-tab="settings"]'); page.wait_for_timeout(150)
    page.click('[data-act="tab"][data-tab="topics"]'); page.wait_for_timeout(150)
    page.evaluate("() => window.scrollTo(0, 0)")
    state = page.evaluate("() => { const s = window.MBP.U.st; return { cur: s.current, n: s.log.length, sessions: s.sessions.length, topics: Object.fromEntries(Object.entries(s.topics).map(([k,v]) => [k, v.status + ':' + v.step])) } }")
    ls = page.evaluate("() => (localStorage.getItem('mbp.v1') || '').length")
    b.close()
srv.terminate()
print('ERRORS:', len(errors)); [print(' ', e) for e in errors[:20]]
print('STATE:', json.dumps(state, ensure_ascii=False))
print('LS bytes:', ls)
print('REPORT:\n' + rep[:900])
# сборка в одну картинку
ims = [Image.open(s) for s in shots]
w = 390; ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
cols = 5; rows = (len(ims) + cols - 1) // cols
H = max(im.height for im in ims)
sheet = Image.new('RGB', (cols * (w + 10) + 10, rows * (H + 10) + 10), (200, 210, 220))
for i, im in enumerate(ims):
    sheet.paste(im, (10 + (i % cols) * (w + 10), 10 + (i // cols) * (H + 10)))
sheet.save(SHOTS + '/sheet.png')
print('shots:', [s.split('/')[-1] for s in shots])
