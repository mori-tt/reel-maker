import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })
const consoleErrors = []
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' })
for (const label of ['Instagramリール','Instagramストーリー','フィード縦型','フィード正方形','YouTube Shorts']) {
  const button = page.getByRole('button', { name: new RegExp(label) })
  if (await button.count() !== 1) throw new Error(`missing format: ${label}`)
  await button.click()
  if (await button.getAttribute('aria-pressed') !== 'true') throw new Error(`not selected: ${label}`)
}
const high = page.getByRole('button', { name: /高画質/ })
await high.click()
if (!(await high.textContent())?.includes('高精細')) throw new Error('high quality label not updated')
await page.locator('.toggle').click()
for (const provider of ['Chrome端末内AI','ローカルOllama','Ollama Cloud']) {
  const button = page.getByRole('button', { name: provider })
  if (await button.count() !== 1) throw new Error(`missing provider: ${provider}`)
}
await page.getByRole('button', { name: 'ローカルOllama' }).click()
if (await page.getByRole('button', { name: '接続先とモデルを自動検出' }).count() !== 1) throw new Error('auto discover button missing')
await page.route('http://localhost:11434/api/tags', route => route.fulfill({ status: 503, body: '{}' }))
await page.route('http://127.0.0.1:11434/api/tags', route => route.fulfill({ status: 503, body: '{}' }))
await page.getByRole('button', { name: '接続先とモデルを自動検出' }).click()
const notice = page.locator('.ai-notice')
await notice.waitFor()
await page.waitForFunction(() => document.querySelector('.ai-notice')?.textContent?.includes('自動検出できませんでした'))
if (!(await notice.textContent())?.includes('自動検出できませんでした')) throw new Error('local Ollama error is not shown in AI settings')
if (await page.locator('.editor > .notice').count()) throw new Error('AI error leaked to top-level notice')
const unexpectedErrors = consoleErrors.filter(message => !message.includes('503'))
if (unexpectedErrors.length) throw new Error(`console errors: ${unexpectedErrors.join(' | ')}`)
await page.screenshot({ path: 'artifacts/formats-ai-smoke.png', fullPage: true })
await browser.close()
