import playwright from '/opt/homebrew/lib/node_modules/@playwright/test/node_modules/playwright-core/index.js'
const { chromium } = playwright
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const root = resolve(process.argv[2] || '/Users/qinxiaoqiang/Downloads/aosd-workbench')
const url = pathToFileURL(resolve(root, 'prototypes/v0.2/index.html')).href
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
const results = []
/* 全量路由：与 app.js 的 ROUTES 一一对应；新增页面必须同步，否则 check-probe-coverage 会红。 */
const views = ['dashboard', 'voices', 'day', 'documents', 'metrics', 'medications', 'visit', 'resources']

for (const width of [1280, 760, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  const errors = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(300)

  for (const profile of ['A', 'B']) {
    await page.click(`[data-profile="${profile}"]`)
    await page.waitForTimeout(120)
    for (const view of views) {
      await page.click(`[data-view="${view}"]`)
      await page.waitForTimeout(120)
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        h1: document.querySelector('.main h1')?.textContent?.trim() || '',
        text: document.querySelector('.main')?.innerText?.slice(0, 60) || '',
        cards: document.querySelectorAll('.main .card').length,
        empties: document.querySelectorAll('.main .empty').length,
      }))
      results.push({ width, profile, view, ...info })
    }
  }
  results.push({ width, errors })
  await page.close()
}

/* 整页详情：从报告页打开第一份文档，检查返回/关闭与焦点 */
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const pageErrors = []
page.on('pageerror', (err) => pageErrors.push(String(err)))
await page.goto(url)
await page.click('[data-view="documents"]')
await page.waitForTimeout(150)
await page.click('[data-doc]')
await page.waitForTimeout(300)
const opened = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('.pv-head .pv-btn')]
  return {
    overlay: Boolean(document.querySelector('.pv-overlay:not([hidden])')),
    title: document.querySelector('.pv-title')?.textContent?.trim() || '',
    bodyText: document.querySelector('.pv-body, .pv-inner')?.innerText?.slice(0, 80) || '',
    hash: location.hash,
    buttons: buttons.map((b) => ({ text: b.textContent.trim(), label: b.getAttribute('aria-label') || '' })),
    back: buttons.some((b) => /返回/.test(b.textContent)),
    close: buttons.some((b) => /关闭/.test(b.getAttribute('aria-label') || '')),
  }
})

await page.keyboard.press('Escape')
await page.waitForTimeout(250)
const afterEsc = await page.evaluate(() => ({
  open: Boolean(document.querySelector('.pv-overlay:not([hidden])')),
  hash: location.hash,
  focus: document.activeElement?.getAttribute('data-doc') || document.activeElement?.textContent?.trim().slice(0, 20) || '',
}))
await page.close()

/* 疾病概要 */
const p3 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const primerErrors = []
p3.on('pageerror', (err) => primerErrors.push(String(err)))
await p3.goto(url)
await p3.click('#topbar [data-primer-open]')
await p3.waitForTimeout(350)
const primer = await p3.evaluate(() => ({
  open: Boolean(document.querySelector('.dp-overlay:not([hidden])')),
  sections: [...document.querySelectorAll('.dp-section h3')].map((h) => h.textContent.trim()),
  localLinks: [...document.querySelectorAll('.dp-link')].length,
  hash: location.hash,
}))
await p3.close()

await browser.close()
console.log(JSON.stringify({ results, opened, afterEsc, primer, pageErrors, primerErrors }, null, 2))
