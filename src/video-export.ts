import { AudioBufferSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality, getFirstEncodableAudioCodec, getFirstEncodableVideoCodec } from 'mediabunny'
import type { AudioCodec, VideoCodec } from 'mediabunny'
import { getMimeType, nextFrameDelayMs } from './reel'

// H.264 first: it's universally playable (unlike the old WebM output, which Safari/iOS can't
// even open) and every modern device has a hardware encoder for it, so encoding stays fast and
// frame-accurate. VP9/AV1 are kept as better-compression fallbacks for browsers that can't do avc.
export const PREFERRED_VIDEO_CODECS: readonly VideoCodec[] = ['avc', 'vp9', 'av1']
// AAC first: it's the codec MP4 players universally expect. Opus is kept as a fallback, though it
// isn't valid inside every MP4 player - only relevant if a browser can't encode AAC at all.
export const PREFERRED_AUDIO_CODECS: readonly AudioCodec[] = ['aac', 'opus']

export function totalFrameCount(durationSeconds: number, fps: number): number {
  return Math.max(0, Math.round(durationSeconds * fps))
}

export type FrameDrawer = (ctx: CanvasRenderingContext2D, elapsedSeconds: number) => void
type EncodableCodecCheck = (codecs: VideoCodec[], options: { width: number; height: number; bitrate: number }) => Promise<VideoCodec | null>
type EncodableAudioCodecCheck = (codecs: AudioCodec[], options: { numberOfChannels: number; sampleRate: number }) => Promise<AudioCodec | null>

// Feature-detects a WebCodecs video codec this browser can actually encode at the target
// resolution/bitrate. Returns null when WebCodecs export isn't available at all (older Firefox),
// in which case callers should fall back to renderWebm.
export async function pickVideoCodec(width: number, height: number, bitrate: number, codecs: readonly VideoCodec[] = PREFERRED_VIDEO_CODECS, check: EncodableCodecCheck = getFirstEncodableVideoCodec): Promise<VideoCodec | null> {
  return check([...codecs], { width, height, bitrate })
}

// Same idea as pickVideoCodec but for the optional background-music track. Returns null when no
// audio codec is encodable, in which case the export should proceed video-only rather than fail.
export async function pickAudioCodec(numberOfChannels: number, sampleRate: number, codecs: readonly AudioCodec[] = PREFERRED_AUDIO_CODECS, check: EncodableAudioCodecCheck = getFirstEncodableAudioCodec): Promise<AudioCodec | null> {
  return check([...codecs], { numberOfChannels, sampleRate })
}

function prepareCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context is unavailable.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

// Frame-exact export via WebCodecs (through mediabunny). Every frame is drawn and encoded with
// an explicit timestamp instead of being captured live off a real-time stream, so a slow draw
// (or a slow machine) can never drop or duplicate a frame - it only makes the export take longer,
// never lower quality. Produces a widely-compatible MP4.
export async function renderMp4(options: { canvas: HTMLCanvasElement; fps: number; bitrate: number; durationSeconds: number; codec: VideoCodec; draw: FrameDrawer; onProgress?: (elapsedSeconds: number) => void; audio?: { buffer: AudioBuffer; codec: AudioCodec } }): Promise<Blob> {
  const ctx = prepareCanvas(options.canvas)
  const target = new BufferTarget()
  const output = new Output({ format: new Mp4OutputFormat(), target })
  // Requesting constant bitrate signals intent to the encoder: with the default variable mode, it's
  // explicitly free to spend fewer bits than the target on easy-to-compress frames (flat colors,
  // blur), so the configured bitrate is only a ceiling, not a guarantee. 'constant' pushes toward
  // spending the full budget - note that in practice, how strictly this is honored still depends on
  // the platform's actual encoder (e.g. a hardware encoder may still scale down for very simple
  // content); measured on macOS, a static scene came in well under the target while a busy one used
  // most of it. That's a reasonable outcome either way (quality tracks complexity), but it means the
  // configured bitrate should be read as a ceiling this encoder is now allowed to fully use, not a
  // hard, always-hit floor across every platform.
  const videoSource = new CanvasSource(options.canvas, { codec: options.codec, quality: new Quality({ bitrate: options.bitrate, bitrateMode: 'constant' }) })
  output.addVideoTrack(videoSource, { frameRate: options.fps })
  // The whole (already trimmed/looped/faded - see audio.ts) buffer is handed to the encoder in one
  // shot rather than chunked per video frame, since AudioBufferSource takes a complete AudioBuffer.
  const audioSource = options.audio ? new AudioBufferSource({ codec: options.audio.codec, bitrate: 192_000 }) : null
  if (audioSource) output.addAudioTrack(audioSource)
  await output.start()
  if (audioSource && options.audio) await audioSource.add(options.audio.buffer)

  const frameDuration = 1 / options.fps
  const frames = totalFrameCount(options.durationSeconds, options.fps)
  for (let frameIndex = 0; frameIndex < frames; frameIndex++) {
    const elapsed = frameIndex * frameDuration
    options.draw(ctx, elapsed)
    await videoSource.add(elapsed, frameDuration)
    options.onProgress?.(elapsed)
  }

  await output.finalize()
  if (!target.buffer) throw new Error('Video export produced no output.')
  return new Blob([target.buffer], { type: 'video/mp4' })
}

// Real-time capture fallback for browsers without WebCodecs encode support. Kept only for that
// case: it's inherently tied to wall-clock time (via MediaRecorder + captureStream), so it can
// still drop/duplicate frames under load. Frame pacing is drift-corrected to minimize that.
export async function renderWebm(options: { canvas: HTMLCanvasElement; fps: number; bitrate: number; durationSeconds: number; draw: FrameDrawer; onProgress?: (elapsedSeconds: number) => void }): Promise<Blob> {
  const ctx = prepareCanvas(options.canvas)
  const stream = options.canvas.captureStream(options.fps)
  const mimeType = getMimeType(MediaRecorder.isTypeSupported)
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: options.bitrate })
  const chunks: Blob[] = []
  recorder.ondataavailable = event => event.data.size && chunks.push(event.data)
  const done = new Promise<void>(resolve => { recorder.onstop = () => resolve() })
  recorder.start(250)

  const start = performance.now()
  let frameIndex = 0
  while (true) {
    const elapsed = (performance.now() - start) / 1000
    if (elapsed >= options.durationSeconds) break
    options.draw(ctx, elapsed)
    options.onProgress?.(elapsed)
    frameIndex++
    const delay = nextFrameDelayMs(start, frameIndex, options.fps, performance.now())
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
  }
  recorder.stop()
  await done
  return new Blob(chunks, { type: mimeType })
}
