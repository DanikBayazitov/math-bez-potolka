import os
HERE = os.path.dirname(os.path.abspath(__file__))
APPDIR = os.environ.get('APP', os.path.join(HERE, '..'))
SHOTS = os.environ.get('SHOTS', '/tmp/mbp-shots')
os.makedirs(SHOTS, exist_ok=True)
import subprocess, time
from playwright.sync_api import sync_playwright
srv = subprocess.Popen(['python3', '-m', 'http.server', '8790', '--bind', '127.0.0.1'], cwd=APPDIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for vp in [{'width': 390, 'height': 844}, {'width': 1280, 'height': 800}]:
        pg = b.new_page(viewport=vp)
        pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
        pg.on('requestfailed', lambda r: errors.append('failed: ' + r.url))
        pg.goto('http://127.0.0.1:8790/'); pg.wait_for_timeout(800)
        n = pg.evaluate('[M.TOPICS.length, M.topicsOf(5).length, M.topicsOf(6).length]')
        pg.click('.tile.on'); pg.wait_for_timeout(200)
        pg.screenshot(path=SHOTS + '/site_grades_%d.png' % vp['width'])
        g = pg.evaluate("Array.from(document.querySelectorAll('[data-act=\"grade\"]')).map(b => b.dataset.g + (b.disabled ? '-off' : ''))")
        print(vp['width'], 'topics', n, 'grade buttons', g)
        pg.close()
    b.close()
srv.terminate()
print('errors', errors)
