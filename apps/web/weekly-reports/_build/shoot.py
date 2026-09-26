import asyncio, json, sys
from playwright.async_api import async_playwright
ROOT='/workspace/weekly-report-pwa-2026-09-26'
SL=['adcellerant','evolved-pros','evolvex360','gwleith-money']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        # icons
        pg=await b.new_page()
        return_icons=False
        for s in ([] if not return_icons else SL):
            svg=open(f'{ROOT}/{s}/icon.svg').read()
            for n in (192,512):
                await pg.set_viewport_size({'width':n,'height':n})
                await pg.set_content(f'<html><body style="margin:0;background:transparent">{svg.replace("<svg ",f"<svg width={n} height={n} ",1)}</body></html>')
                await pg.screenshot(path=f'{ROOT}/{s}/icon-{n}.png',omit_background=True)
        await pg.close()
        for s in SL:
            json.load(open(f'{ROOT}/{s}/manifest.webmanifest'))
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
            page=await ctx.new_page(); errs=[]
            page.on('console',lambda m,errs=errs: errs.append(f'{m.type}: {m.text}') if m.type in('error','warning') else None)
            page.on('pageerror',lambda e,errs=errs: errs.append(f'pageerror: {e}'))
            await page.goto(f'http://127.0.0.1:8766/{s}/',wait_until='networkidle')
            await page.wait_for_selector('.kpi')
            sw=await page.evaluate("navigator.serviceWorker.ready.then(r=>r.active? r.active.state+' scope='+r.scope : 'none')")
            before=await page.inner_text('#updated')
            await page.click('#refresh'); await page.wait_for_timeout(600)
            toast=await page.inner_text('#toast'); after=await page.inner_text('#updated')
            await page.wait_for_timeout(2000)
            await page.evaluate('window.scrollTo(0,0)')
            txt=await page.evaluate('document.body.innerText'); print(s,'visible sample/mockup text:', any(w in txt.lower() for w in ('sample','mockup')))
            await page.screenshot(path=f'{ROOT}/{s}/screenshot-mobile.png')
            await page.screenshot(path=f'{ROOT}/_build/{s}-full.png',full_page=True)
            for t in ('projects','clients','next'):
                if not await page.query_selector(f'.tab[data-t={t}]'): print(s,'tab hidden:',t); continue
                await page.click(f'.tab[data-t={t}]'); await page.wait_for_timeout(150)
                await page.screenshot(path=f'{ROOT}/_build/{s}-{t}.png',full_page=True)
            # offline check: reload with network off, cached report should render
            await ctx.set_offline(True)
            await page.reload(wait_until='load'); await page.wait_for_timeout(800)
            off=await page.evaluate("document.querySelectorAll('.kpi').length")
            print(s,'| SW:',sw,'| refresh toast:',toast,'| offline kpis:',off,'| errors:',errs or 'none')
            await ctx.close()
        await b.close()
asyncio.run(main())
