import json
from pathlib import Path
from playwright.sync_api import sync_playwright

KEY = 'formlab.projects.v1'

def saved(page):
    page.wait_for_function('(key) => !!localStorage.getItem(key)', arg=KEY)
    page.wait_for_timeout(850)
    return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))[0]', KEY)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 980}, accept_downloads=True)
    page = context.new_page()
    page.goto('http://127.0.0.1:3000/', wait_until='networkidle')
    before = saved(page)
    assert before['name'] == 'Orbit · 工作台'
    page.get_by_role('button', name='新建项目按钮', exact=True).click()
    page.get_by_role('button', name='指标数值 1', exact=True).click(modifiers=['Shift'])
    assert page.locator('.selection-outline').count() == 2
    primary = page.locator('[data-element="primary-button"]')
    rect = primary.bounding_box()
    page.mouse.move(rect['x'] + rect['width'] / 2, rect['y'] + rect['height'] / 2)
    page.mouse.down()
    page.mouse.move(rect['x'] + rect['width'] / 2 + 22, rect['y'] + rect['height'] / 2 + 17, steps=4)
    page.mouse.up()
    after = saved(page)
    old = {e['id']: e for e in before['elements']}
    new = {e['id']: e for e in after['elements']}
    metric = next(e for e in before['elements'] if e['name'] == '指标数值 1')
    ids = ['primary-button', metric['id']]
    deltas = [(new[i]['x']-old[i]['x'], new[i]['y']-old[i]['y']) for i in ids]
    assert deltas[0] == deltas[1] and deltas[0] != (0,0), deltas
    page.keyboard.press('Control+z')
    restored = {e['id']: e for e in saved(page)['elements']}
    assert all(restored[i]['x'] == old[i]['x'] and restored[i]['y'] == old[i]['y'] for i in ids)
    print('PASS multi-layer drag + single-step undo')
    # Regression: bad stored entry must not discard valid saved projects.
    page.evaluate('(key) => { const projects=JSON.parse(localStorage.getItem(key)); projects.push({version:99,name:"corrupt"}); localStorage.setItem(key, JSON.stringify(projects)); }', KEY)
    page.reload(wait_until='networkidle')
    restored_design = saved(page)
    assert restored_design['id'] == before['id']
    assert page.evaluate('(key) => !!localStorage.getItem(key+".recovery")', KEY)
    print('PASS partial corruption recovery preserves valid project')
    page.get_by_role('button', name='预览', exact=True).click()
    assert page.locator('.left-sidebar').count() == 0
    assert page.locator('.artboard').evaluate('(el) => getComputedStyle(el).overflow') == 'hidden'
    print('PASS preview cropping matches exported HTML')
    page.get_by_role('button', name='分享', exact=True).click()
    page.locator('#share-link').wait_for()
    page.wait_for_function('document.querySelector("#share-link").value.includes("#design=")')
    share_url = page.locator('#share-link').input_value()
    assert len(share_url) < 61000
    page.get_by_role('button', name='关闭', exact=True).click()
    other = context.new_page()
    other.goto(share_url, wait_until='networkidle')
    other.wait_for_function('!document.querySelector(".loading-overlay")')
    assert other.locator('.preview-mode').count() == 1
    assert other.locator('[data-element="primary-button"]').count() == 1
    assert saved(other)['id'] != before['id']
    print('PASS share snapshot opens as independent preview copy')
    page.get_by_role('button', name='导出', exact=False).first.click()
    with page.expect_download() as download_info:
        page.get_by_role('button', name='静态 HTML').click()
    target = Path('/tmp/formlab-regression-export.html')
    download_info.value.save_as(target)
    html = target.read_text()
    assert '<!doctype html>' in html and '<script' not in html
    assert 'pointer-events:none' in html and 'Orbit' in html
    print('PASS browser download is standalone static HTML')
    browser.close()
