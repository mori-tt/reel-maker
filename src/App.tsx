import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { generateAiCopy, initialOllamaUrl, isHeicFile, listOllamaModels, supportsVision } from './ai'
import type { OllamaModel } from './ai'
import { chromeAiAvailabilityMessage, generateChromeAiCopy, getChromeAiAvailability } from './chrome-ai'
import type { ChromeAiAvailability } from './chrome-ai'
import { normalizeImageFile } from './image'
import { getFrameState, getMimeType, moveItem } from './reel'

type Slide = { id: string; name: string; url: string; image: HTMLImageElement; blob: Blob }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, scale = 1) {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale
  const w = image.naturalWidth * ratio
  const h = image.naturalHeight * ratio
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h)
}

function drawFrame(ctx: CanvasRenderingContext2D, slide: Slide, progress: number, title: string, cta: string) {
  const { width, height } = ctx.canvas
  ctx.fillStyle = '#09080d'
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  const fade = Math.min(progress / .16, (1 - progress) / .16, 1)
  ctx.globalAlpha = Math.max(.12, fade)
  cover(ctx, slide.image, width, height, 1 + progress * .08)
  ctx.restore()
  const gradient = ctx.createLinearGradient(0, height * .45, 0, height)
  gradient.addColorStop(0, 'rgba(8,7,13,0)')
  gradient.addColorStop(1, 'rgba(8,7,13,.88)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${Math.round(width * .073)}px system-ui, sans-serif`
  ctx.fillText(title || 'My story', width / 2, height * .79, width * .82)
  if (cta) {
    ctx.fillStyle = '#b9ff66'
    ctx.font = `600 ${Math.round(width * .03)}px system-ui, sans-serif`
    ctx.fillText(cta, width / 2, height * .86, width * .72)
  }
}

export default function App() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [title, setTitle] = useState('週末の小さな旅')
  const [cta, setCta] = useState('保存して、次の休日へ')
  const [seconds, setSeconds] = useState(3)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const [notice, setNotice] = useState('')
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiProvider, setAiProvider] = useState<'chrome' | 'ollama'>(() => localStorage.getItem('aiProvider') === 'ollama' ? 'ollama' : 'chrome')
  const [chromeAiStatus, setChromeAiStatus] = useState<ChromeAiAvailability | null>(null)
  const [ollamaUrl, setOllamaUrl] = useState(() => initialOllamaUrl(localStorage.getItem('ollamaUrl')))
  const [ollamaModel, setOllamaModel] = useState(() => localStorage.getItem('ollamaModel') || 'gemma4:e2b')
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [aiDirection, setAiDirection] = useState('温かく、シネマティックに')
  const [aiLoading, setAiLoading] = useState(false)
  const slidesRef = useRef<Slide[]>([])
  const raf = useRef(0)
  const startedAt = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const total = slides.length * seconds
  const frame = getFrameState(time, slides.length, seconds)

  useEffect(() => { slidesRef.current = slides }, [slides])
  useEffect(() => () => slidesRef.current.forEach(slide => URL.revokeObjectURL(slide.url)), [])
  useEffect(() => {
    if (!playing || !total) return
    startedAt.current = performance.now() - time * 1000
    const tick = (now: number) => {
      const next = (now - startedAt.current) / 1000
      if (next >= total) { setTime(0); setPlaying(false); return }
      setTime(next)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, total])

  const addImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(file => file.type.startsWith('image/') || isHeicFile(file))
    if (!files.length) return
    setLoadingImages(true)
    setNotice('')
    try {
      const loaded = await Promise.all(files.map(async file => {
        const blob = await normalizeImageFile(file)
        return new Promise<Slide>((resolve, reject) => {
          const url = URL.createObjectURL(blob)
          const image = new Image()
          image.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, url, image, blob })
          image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name}を読み込めませんでした。`)) }
          image.src = url
        })
      }))
      setSlides(current => [...current, ...loaded])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '画像の変換に失敗しました。')
    } finally {
      setLoadingImages(false)
      event.target.value = ''
    }
  }

  const remove = (index: number) => setSlides(current => {
    URL.revokeObjectURL(current[index].url)
    return current.filter((_, i) => i !== index)
  })

  const checkChromeAi = async () => {
    setNotice('Chrome AIの利用状況を確認しています…')
    const status = await getChromeAiAvailability()
    setChromeAiStatus(status)
    setNotice(chromeAiAvailabilityMessage(status))
  }

  const checkOllama = async () => {
    setNotice('Ollamaへ接続しています…')
    try {
      const models = await listOllamaModels(ollamaUrl)
      setOllamaModels(models)
      const current = models.find(model => model.name === ollamaModel)
      if (!models.length) setNotice('Ollamaにはモデルが登録されていません。')
      else if (!current) setNotice(`接続成功。モデル「${ollamaModel}」は未登録です。利用可能: ${models.map(model => model.name).join(', ')}`)
      else if (!supportsVision(current)) setNotice(`接続成功。ただし「${current.name}」は画像入力に非対応です。画像対応モデルへ変更してください。`)
      else setNotice(`接続成功。「${current.name}」は画像入力に対応しています。`)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Ollamaへ接続できませんでした。') }
  }

  const askAi = async () => {
    if (!slides.length) return
    setAiLoading(true)
    setNotice('')
    localStorage.setItem('aiProvider', aiProvider)
    try {
      const copy = aiProvider === 'chrome'
        ? await generateChromeAiCopy({
            image: slides[0].blob,
            direction: aiDirection,
            onDownloadProgress: progress => setNotice(`Chrome AIモデルを準備中… ${progress}%`),
          })
        : await (async () => {
            localStorage.setItem('ollamaUrl', ollamaUrl)
            localStorage.setItem('ollamaModel', ollamaModel)
            const knownModel = ollamaModels.find(model => model.name === ollamaModel)
            if (knownModel && !supportsVision(knownModel)) throw new Error(`「${ollamaModel}」は画像入力に対応していません。`)
            return generateAiCopy({ baseUrl: ollamaUrl, model: ollamaModel, image: slides[0].blob, direction: aiDirection })
          })()
      setTitle(copy.title)
      setCta(copy.cta)
      setNotice(`${aiProvider === 'chrome' ? 'Chrome AI' : 'Ollama'}の提案をタイトルとCTAに反映しました。`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AIモードでエラーが発生しました。'
      setNotice(aiProvider === 'ollama' ? `${message} Ollamaの起動、モデル名、OLLAMA_ORIGINSを確認してください。` : message)
    } finally { setAiLoading(false) }
  }

  const exportVideo = async () => {
    if (!slides.length || !('MediaRecorder' in window)) return
    setExporting(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1080; canvas.height = 1920
      const ctx = canvas.getContext('2d')!
      const stream = canvas.captureStream(30)
      const mimeType = getMimeType(MediaRecorder.isTypeSupported)
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
      const chunks: Blob[] = []
      recorder.ondataavailable = event => event.data.size && chunks.push(event.data)
      const done = new Promise<void>(resolve => recorder.onstop = () => resolve())
      recorder.start(250)
      const start = performance.now()
      while (true) {
        const elapsed = (performance.now() - start) / 1000
        if (elapsed >= total) break
        const state = getFrameState(elapsed, slides.length, seconds)
        drawFrame(ctx, slides[state.index], state.progress, title, cta)
        setTime(elapsed)
        await sleep(1000 / 30)
      }
      recorder.stop(); await done
      const url = URL.createObjectURL(new Blob(chunks, { type: mimeType }))
      const link = document.createElement('a')
      link.href = url; link.download = 'my-reel.webm'; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      setTime(0)
    } finally { setExporting(false) }
  }

  return <div className="app-shell">
    <header><div className="brand"><span className="brand-mark">F</span><span>Frameflow</span></div><span className="eyebrow">LOCAL REEL STUDIO</span></header>
    <main>
      <section className="intro"><p className="kicker">IMAGES TO MOTION</p><h1>写真から、<em>動く物語</em>を。</h1><p>画像を選ぶだけ。Instagram Reels向けの縦型ショート動画を、ブラウザの中で仕上げます。</p></section>
      <div className="workspace">
        <section className="editor panel">
          <div className="section-head"><div><span>01</span><h2>ストーリーを組み立てる</h2></div><button className="add-small" onClick={() => inputRef.current?.click()}>＋ 画像を追加</button></div>
          <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={addImages} />
          {notice && <p className="notice" role="alert">{notice}</p>}
          {slides.length === 0 ? <button className="dropzone" disabled={loadingImages} onClick={() => inputRef.current?.click()}><span className="upload-icon">↗</span><strong>{loadingImages ? '画像を変換中…' : '写真を選択'}</strong><small>JPG / PNG / WEBP / HEIC / HEIF・複数選択できます</small></button> : <div className="story-list">{slides.map((slide, index) => <article className="story-item" key={slide.id}>
            <img src={slide.url} alt="" /><div className="story-meta"><b>{String(index + 1).padStart(2, '0')}</b><span>{slide.name}</span></div>
            <div className="item-actions"><button disabled={index === 0} aria-label="前へ" onClick={() => setSlides(moveItem(slides, index, index - 1))}>↑</button><button disabled={index === slides.length - 1} aria-label="後ろへ" onClick={() => setSlides(moveItem(slides, index, index + 1))}>↓</button><button aria-label="削除" onClick={() => remove(index)}>×</button></div>
          </article>)}</div>}
          <div className="fields"><label>タイトル<input value={title} maxLength={28} onChange={e => setTitle(e.target.value)} /></label><label>CTA<input value={cta} maxLength={32} onChange={e => setCta(e.target.value)} /></label><label>1枚の表示時間<div className="range-row"><input type="range" min="2" max="6" step="1" value={seconds} onChange={e => setSeconds(Number(e.target.value))}/><output>{seconds}秒</output></div></label></div>
          <section className="ai-card">
            <div className="ai-card-head"><div><span className="ai-spark">✦</span><div><h3>AIコピー提案</h3><p>画像を見てタイトルとCTAを提案</p></div></div><button className={`toggle ${aiEnabled ? 'on' : ''}`} aria-pressed={aiEnabled} aria-label="AIモード" onClick={() => setAiEnabled(!aiEnabled)}><span /></button></div>
            {aiEnabled && <div className="ai-fields">
              <div className="provider-tabs" role="group" aria-label="AIプロバイダー"><button className={aiProvider === 'chrome' ? 'active' : ''} aria-pressed={aiProvider === 'chrome'} onClick={() => setAiProvider('chrome')}>Chrome AI</button><button className={aiProvider === 'ollama' ? 'active' : ''} aria-pressed={aiProvider === 'ollama'} onClick={() => setAiProvider('ollama')}>Ollama</button></div>
              {aiProvider === 'chrome' ? <><button className="ai-check" onClick={checkChromeAi}>Chrome AIの利用状況を確認</button>{chromeAiStatus && <small className="ai-status">{chromeAiAvailabilityMessage(chromeAiStatus)}</small>}</> : <><div className="ai-grid"><label>接続先<input value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} /></label><label>モデル<input list="ollama-models" value={ollamaModel} onChange={e => setOllamaModel(e.target.value)} /><datalist id="ollama-models">{ollamaModels.map(model => <option key={model.name} value={model.name}>{supportsVision(model) ? '画像対応' : 'テキストのみ'}</option>)}</datalist></label></div><button className="ai-check" onClick={checkOllama}>接続とモデルを確認</button></>}
              <label>コピーの方向性<input value={aiDirection} onChange={e => setAiDirection(e.target.value)} /></label><button className="ai-generate" disabled={!slides.length || (aiProvider === 'ollama' && !ollamaModel.trim()) || aiLoading} onClick={askAi}>{aiLoading ? 'AIが考えています…' : '✦ AIにコピーを提案してもらう'}</button><small>{aiProvider === 'chrome' ? 'Chrome組み込みAIで端末内処理します。画像はサーバーへ送信されません。対応Chromeとモデルの準備が必要です。' : ollamaUrl.startsWith('/api/ollama') ? 'Vercelの /api/ollama 経由で接続します。OLLAMA_BASE_URLの設定が必要です。' : '最初の画像を指定したOllamaへ送ります。'}</small>
            </div>}
          </section>
        </section>
        <section className="preview-side"><div className="section-head preview-title"><div><span>02</span><h2>プレビュー</h2></div><small>9 : 16</small></div>
          <div className="phone"><div className="phone-screen">{slides.length ? <><img className="hero-image" src={slides[frame.index]?.url} alt="プレビュー" style={{ transform: `scale(${1 + frame.progress * .08})`, opacity: Math.max(.15, Math.min(frame.progress / .16, (1 - frame.progress) / .16, 1)) }} /><div className="scrim"/><div className="reel-copy"><h3>{title || 'My story'}</h3>{cta && <p>{cta}</p>}</div><div className="counter">{frame.index + 1} / {slides.length}</div></> : <div className="empty-preview"><span>✦</span><p>写真を追加すると<br/>ここにプレビューされます</p></div>}</div></div>
          <div className="transport"><button className="play" disabled={!slides.length} onClick={() => setPlaying(!playing)}>{playing ? 'Ⅱ' : '▶'}</button><input aria-label="再生位置" type="range" min="0" max={total || 1} step="0.01" value={time} onChange={e => { setPlaying(false); setTime(Number(e.target.value)) }}/><time>{Math.floor(time)}s / {total}s</time></div>
          <button className="export" disabled={!slides.length || exporting} onClick={exportVideo}>{exporting ? '動画を生成中…' : '動画を書き出す'}<span>WEBM · 1080 × 1920</span></button>
        </section>
      </div>
    </main>
    <footer><span>FRAMEFLOW / LOCAL EDITION</span><span>データはブラウザの外に送信されません</span></footer>
  </div>
}
