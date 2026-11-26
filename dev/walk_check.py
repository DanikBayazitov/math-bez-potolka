import os
HERE = os.path.dirname(os.path.abspath(__file__))
APPDIR = os.environ.get('APP', os.path.join(HERE, '..'))
SHOTS = os.environ.get('SHOTS', '/tmp/mbp-shots')
os.makedirs(SHOTS, exist_ok=True)
import subprocess, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8768', '--bind', '127.0.0.1'], cwd=APPDIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errs, shots, log = [], [], []
def snap(pg, name):
    p = SHOTS + '/w-' + name + '.png'; pg.screenshot(path=p); shots.append(p)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'favicon' not in m.text else None)
    pg.goto('http://127.0.0.1:8768/index.html'); pg.wait_for_timeout(700)
    pg.evaluate("""() => { const {E, M, U} = window.MBP; const st = U.st; let now = Date.now();
      E.onboard(st, {nick: 'Ваня', grade: 5, g: 'm', interests: ['football']}, now);
      const kn = M.TOPICS.findIndex(t => t.id === 'mixed-add');
      for (let i = 0; i < 9; i++) { const c = E.next(st, now); if (c.type !== 'task') break; const idx = M.TOPICS.findIndex(t => t.id === c.topic); E.answer(st, c, {res: idx <= kn ? 2 : -1}, now); }
      E.next(st, now); E.save(st); }""")
    pg.reload(); pg.wait_for_timeout(800)
    pg.click('[data-act="continue"]'); pg.wait_for_timeout(200)
    log.append('lvl0 title: ' + pg.locator('.bar-title').inner_text())
    pg.click('[data-act="simpler"]'); pg.wait_for_timeout(200)
    log.append('after simpler: ' + pg.locator('.bar-title').inner_text() + ' | ' + pg.locator('.banner').first.inner_text())
    snap(pg, '1-simple')
    pg.click('[data-act="simpler"]'); pg.wait_for_timeout(200)
    log.append('after simpler 2: ' + pg.locator('.bar-title').inner_text())
    for i in range(12):
        if pg.locator('[data-act="w-opt"]').count():
            pg.click('[data-act="w-opt"][data-j="%d"]' % (1 if i == 1 else 0)); pg.wait_for_timeout(120)
            if i == 1: snap(pg, '2-walk-wrong')
        if pg.locator('[data-act="w-next"]').count():
            pg.click('[data-act="w-next"]'); pg.wait_for_timeout(120)
        else: break
    snap(pg, '3-walk-end')
    log.append('end buttons: ' + ' | '.join(pg.locator('.stack .btn').all_inner_texts()))
    pg.click('[data-act="ok"]'); pg.wait_for_timeout(200)
    # провалить задачу: все подсказки и решение
    for k in range(4):
        if pg.locator('[data-act="hint"]').count(): pg.click('[data-act="hint"]'); pg.wait_for_timeout(80)
    pg.click('#next-btn'); pg.wait_for_timeout(200)
    log.append('after fail: ' + pg.locator('.bar-title').inner_text() + ' | ' + (pg.locator('.banner').first.inner_text() if pg.locator('.banner').count() else ''))
    pg.click('[data-act="ok"]'); pg.wait_for_timeout(200)
    log.append('next: ' + pg.locator('.bar-title').inner_text() + ' | ' + (pg.locator('.banner').first.inner_text() if pg.locator('.banner').count() else ''))
    snap(pg, '4-easier')
    b.close()
srv.terminate()
print('\n'.join(log)); print('errors:', errs)
ims = [Image.open(s) for s in shots]; w = 390
ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
H = max(im.height for im in ims)
sheet = Image.new('RGB', (len(ims) * (w + 10) + 10, H + 20), (200, 210, 220))
for i, im in enumerate(ims): sheet.paste(im, (10 + i * (w + 10), 10))
sheet.save(SHOTS + '/w-sheet.png'); print('ok')
