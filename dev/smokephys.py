"""Физика в браузере: выбор предмета, вход, разведка, все темы главы, тест по главе и процент курса.
В конце переход в математику: прогресс по физике остаётся на месте.
Класс задаётся переменной GRADE: 8 (по умолчанию) или 9."""
import os, sys, time, subprocess, json
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'smoke6.py')).read().split('with sync_playwright() as p:')[0].replace("PORT = 8771", "PORT = 8777"))
shots = {}
GRADE = os.environ.get('GRADE', '8')
CH = {'8': '8.4.1', '9': '9.2.2'}[GRADE]
WANT = {'8': {'ex_e-charge_1', 'ex_e-charge_3', 'ex_e-coulomb_1', 'ex_e-field_4', 'ex_e-lines_1', 'ex_e-lines_4', 'ex_e-capacitor_1'},
        '9': {'ex_d-newton1_4', 'ex_d-forces_2', 'ex_d-forces_3', 'ex_d-newton2_3', 'ex_d-newton3_1', 'ex_d-gravity_1', 'ex_d-weight_2', 'ex_d-gravmotion_3', 'ex_d-satellite_1'}}[GRADE]
P = 'p%s_' % GRADE
log = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    pg.goto('http://127.0.0.1:%d/' % PORT); pg.wait_for_timeout(700)
    pg.screenshot(path=SHOTS + '/' + P + 'start.png')
    pg.click('[data-act="subj"][data-s="phys"]'); pg.wait_for_timeout(150)
    log.append('grades: ' + pg.inner_text('.grades').replace('\n', ' '))
    pg.screenshot(path=SHOTS + '/' + P + 'grade.png')
    pg.click('[data-act="grade"][data-g="%s"]' % GRADE); pg.click('[data-act="to"][data-to="nick"]')
    pg.fill('#nick-in', 'Физик'); pg.click('[data-act="to-diag"]'); pg.click('[data-act="diag-start"]'); pg.wait_for_timeout(200)
    # разведка: ничего не знаем
    for i in range(10):
        dk = pg.query_selector('[data-act="dk"]')
        if not dk: break
        dk.click(); pg.wait_for_timeout(120)
    log.append('after diag: ' + pg.evaluate("JSON.stringify({ subj: MBP.U.st.subj, cur: MBP.E.currentTopic(MBP.U.st), screen: MBP.U.screen })"))
    pg.screenshot(path=SHOTS + '/' + P + 'diag_done.png', full_page=True)
    kinds, units, seen_topics, tests = [], set(), [], []
    for i in range(1500):
        scr = pg.evaluate('window.MBP.U.screen')
        c = pg.evaluate("() => { const c = MBP.U.card; return c ? { type: c.type, kind: c.kind || '', mode: c.mode || '', topic: c.topic || '', step: c.step, pass: c.pass, pct: c.pct, n: c.n } : null; }")
        ctype = c and c['type']
        topic = c and c['topic']
        if topic and (not seen_topics or seen_topics[-1] != topic): seen_topics.append(topic)
        if scr == 'map' and P + 'map' not in shots:
            pg.screenshot(path=SHOTS + '/' + P + 'map.png', full_page=True); shots[P + 'map'] = 1
            log.append('map course: ' + pg.inner_text('.course').replace('\n', ' '))
        if ctype == 'explain':
            key = 'ex_' + str(topic) + '_' + str(c['step'])
            if key in WANT and key not in shots:
                pg.screenshot(path=SHOTS + '/' + P + key + '.png', full_page=True); shots[key] = 1
            o = pg.query_selector('[data-act="w-opt"][data-j="0"]:not([disabled])')
            if o: o.click(); pg.wait_for_timeout(60); continue
            wn = pg.query_selector('[data-act="w-next"]')
            if wn: wn.click(); pg.wait_for_timeout(60); continue
            okb = pg.query_selector('[data-act="ok"]')
            if okb: okb.click(); pg.wait_for_timeout(120); continue
        if ctype == 'ctest-result':
            tests.append(c)
            pg.screenshot(path=SHOTS + '/' + P + 'ctest_result.png', full_page=True)
            nb = pg.query_selector('#next-btn')
            if nb: nb.click(); pg.wait_for_timeout(150); continue
        if ctype == 'info' and c['kind'] == 'ctest-start' and P + 'ctest_intro' not in shots:
            pg.screenshot(path=SHOTS + '/' + P + 'ctest_intro.png'); shots[P + 'ctest_intro'] = 1
        if ctype == 'done':
            pg.screenshot(path=SHOTS + '/' + P + 'done.png', full_page=True); break
        info = pg.evaluate(INFO)
        if info is None:
            nb = pg.query_selector('#next-btn')
            if nb: nb.click(); pg.wait_for_timeout(120); continue
            if scr == 'map':
                cbtn = pg.query_selector('[data-act="continue"]')
                if cbtn: cbtn.click(); pg.wait_for_timeout(150); continue
                log.append('map without continue: ' + pg.inner_text('.dock').replace('\n', ' ')); break
            btn = pg.query_selector('[data-act="after-closed"], [data-act="go-map"].btn-primary, .card .btn-primary, .dock .btn-primary')
            if btn: btn.click(); pg.wait_for_timeout(120); continue
            log.append('stuck at %s %s' % (scr, ctype)); break
        kinds.append(info['inp']['kind'])
        u = pg.evaluate("(document.querySelector('.ans-row .unit') || {}).innerText || ''")
        if u: units.add(u)
        if info['mode'] == 't' and P + 'ctest_q' not in shots:
            pg.screenshot(path=SHOTS + '/' + P + 'ctest_q.png'); shots[P + 'ctest_q'] = 1
        if u and P + 'unit_task' not in shots:
            pg.screenshot(path=SHOTS + '/' + P + 'unit_task.png'); shots[P + 'unit_task'] = 1
        if pg.query_selector('.prompt svg, .q-vis svg, .task svg') and P + 'vis_task' not in shots:
            pg.screenshot(path=SHOTS + '/' + P + 'vis_task.png', full_page=True); shots[P + 'vis_task'] = 1
        answer(pg, info); pg.wait_for_timeout(80)
        res = pg.evaluate('window.MBP.U.att && window.MBP.U.att.res')
        if res not in (2, None) and info['mode'] != 't':
            msg = pg.evaluate("(document.querySelector('.msg.note') || {}).innerText || ''")
            errors.append('not accepted: ' + info['prompt'] + ' -> ' + str(res) + ' ' + msg)
        nb = pg.query_selector('#next-btn')
        if nb: nb.click(); pg.wait_for_timeout(120)
    st = pg.evaluate("JSON.stringify(Object.fromEntries(Object.entries(window.MBP.U.st.topics).map(([k,v])=>[k,v.status+'/'+v.step])))")
    course = pg.evaluate("JSON.stringify(MBP.E.course(MBP.U.st))")
    chap = pg.evaluate("JSON.stringify(MBP.U.st.ch)")
    # карта после главы
    pg.reload(); pg.wait_for_timeout(700)
    log.append('after reload: ' + pg.evaluate("JSON.stringify({ subj: MBP.U.subj, screen: MBP.U.screen })"))
    pg.screenshot(path=SHOTS + '/' + P + 'map_end.png', full_page=True)
    log.append('map end course: ' + (pg.inner_text('.course').replace('\n', ' ') if pg.query_selector('.course') else '-'))
    # в математику через меню: прогресс по физике остаётся
    pg.click('[data-act="menu"]'); pg.wait_for_timeout(150)
    pg.click('[data-act="subjects"]'); pg.wait_for_timeout(200)
    log.append('start tiles: ' + pg.inner_text('.tiles').replace('\n', ' | '))
    pg.screenshot(path=SHOTS + '/' + P + 'start_after.png')
    pg.click('[data-act="subj"][data-s="math"]'); pg.wait_for_timeout(200)
    log.append('math after phys: ' + pg.evaluate("JSON.stringify({ subj: MBP.U.subj, learner: !!MBP.U.st.learner, screen: MBP.U.screen, nick: MBP.U.onb.nick })"))
    log.append('phys saved: ' + pg.evaluate("(() => { const x = MBP.E.load('phys'); return x.learner ? x.learner.nick + ', тем ' + Object.keys(x.topics).length + ', глава ' + JSON.stringify(x.ch['%s'] && x.ch['%s'].pass) : 'none'; })()" % (CH, CH)))
    b.close()
srv.terminate()
print('\n'.join(log))
print('kinds', {k: kinds.count(k) for k in set(kinds)}, 'units', sorted(units))
print('topics', st)
print('course', course)
print('chapter', chap)
print('tests', json.dumps(tests, ensure_ascii=False))
print('order', ' -> '.join(seen_topics))
print('shots', sorted(shots))
print('errors', errors[:10])
