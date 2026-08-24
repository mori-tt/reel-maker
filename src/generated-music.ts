// Original, algorithmically-generated background tracks - synthesized entirely client-side from
// oscillators and envelopes, not sampled or copied from anywhere. That makes them safe to ship
// and use with zero licensing/copyright risk, unlike scraping "free music" sites (whose licenses,
// attribution requirements, and actual copyright status vary and aren't something this app can
// verify automatically). For real produced music, see the links in USER_GUIDE.md and upload the
// track via the existing "Add a music file" button - these generated tracks are a built-in
// fallback for whenever that's not what someone wants or has time for, not a replacement for it.
import type { Language } from './i18n'

export type MusicMoodId = 'calm' | 'uplifting' | 'cinematic' | 'playful'
export const MUSIC_MOODS: readonly { id: MusicMoodId; name: { en: string; ja: string }; description: { en: string; ja: string } }[] = [
  { id: 'calm', name: { en: 'Calm', ja: 'カーム' }, description: { en: 'Slow, warm pad chords', ja: 'ゆったり暖かいパッドコード' } },
  { id: 'uplifting', name: { en: 'Uplifting', ja: 'アップリフティング' }, description: { en: 'Bright chords with a gentle arpeggio', ja: '明るいコードと柔らかいアルペジオ' } },
  { id: 'cinematic', name: { en: 'Cinematic', ja: 'シネマティック' }, description: { en: 'Slow minor-key atmosphere', ja: 'ゆったりとしたマイナー調の情景' } },
  { id: 'playful', name: { en: 'Playful', ja: 'プレイフル' }, description: { en: 'Light plucked notes, a bit of bounce', ja: '軽やかなプラック音、弾むリズム' } },
] as const
export function isMusicMoodId(value: string | null): value is MusicMoodId { return MUSIC_MOODS.some(mood => mood.id === value) }
export function getMusicMood(id: MusicMoodId) { return MUSIC_MOODS.find(mood => mood.id === id) ?? MUSIC_MOODS[0] }

// Frequency of a note `semitonesFromA4` half-steps away from A4 (440Hz), i.e. standard 12-tone
// equal temperament - the same math a synthesizer or tuner uses.
function noteFrequency(semitonesFromA4: number): number { return 440 * 2 ** (semitonesFromA4 / 12) }
const MAJOR_TRIAD = [0, 4, 7]
const MINOR_TRIAD = [0, 3, 7]
type ChordStep = { rootOffset: number; triad: readonly number[] }
type MoodConfig = { keyRoot: number; progression: readonly ChordStep[]; chordSeconds: number; octaveShift: number; cutoffHz: number; arpeggio: boolean; volume: number; waveform: OscillatorType }

// Every mood is the same underlying engine (a chord progression of sustained triads, softly
// low-pass filtered, optionally topped with a plucked arpeggio) with different musical choices -
// key/mode, tempo, register, and texture - rather than four separate implementations.
// `volume` values leave headroom below clipping (peak stays under roughly -10dBFS even on the
// arpeggiated moods, where a plucked note can briefly overlap a chord's own peak) while still
// being clearly audible as a soundtrack, since for this app music is the *only* audio - there's
// no dialogue it needs to duck under.
const MOODS: Record<MusicMoodId, MoodConfig> = {
  calm: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_TRIAD }, { rootOffset: 7, triad: MAJOR_TRIAD }, { rootOffset: 9, triad: MINOR_TRIAD }, { rootOffset: 5, triad: MAJOR_TRIAD }], chordSeconds: 4.5, octaveShift: -12, cutoffHz: 900, arpeggio: false, volume: .4, waveform: 'triangle' },
  uplifting: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_TRIAD }, { rootOffset: 5, triad: MAJOR_TRIAD }, { rootOffset: 9, triad: MINOR_TRIAD }, { rootOffset: 7, triad: MAJOR_TRIAD }], chordSeconds: 3, octaveShift: 0, cutoffHz: 2200, arpeggio: true, volume: .3, waveform: 'triangle' },
  cinematic: { keyRoot: -12, progression: [{ rootOffset: 0, triad: MINOR_TRIAD }, { rootOffset: 8, triad: MAJOR_TRIAD }, { rootOffset: 3, triad: MAJOR_TRIAD }, { rootOffset: 10, triad: MAJOR_TRIAD }], chordSeconds: 5.5, octaveShift: -12, cutoffHz: 650, arpeggio: false, volume: .42, waveform: 'sine' },
  playful: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_TRIAD }, { rootOffset: 9, triad: MINOR_TRIAD }, { rootOffset: 5, triad: MAJOR_TRIAD }, { rootOffset: 7, triad: MAJOR_TRIAD }], chordSeconds: 2, octaveShift: 0, cutoffHz: 3200, arpeggio: true, volume: .28, waveform: 'square' },
}

// A single short, decaying note - used for the arpeggio layer so it reads as "plucked" rather
// than a sustained tone competing with the pad chords underneath it.
function schedulePluck(context: BaseAudioContext, destination: AudioNode, frequency: number, startTime: number, duration: number, peakGain: number) {
  const osc = context.createOscillator(); osc.type = 'sine'; osc.frequency.value = frequency
  const gain = context.createGain()
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peakGain, startTime + .015)
  gain.gain.exponentialRampToValueAtTime(.0001, startTime + duration)
  osc.connect(gain); gain.connect(destination)
  osc.start(startTime); osc.stop(startTime + duration)
}
// One sustained chord - a triad's worth of oscillators sharing a soft attack/release envelope so
// chord changes fade into each other instead of clicking.
function scheduleChord(context: BaseAudioContext, destination: AudioNode, frequencies: number[], startTime: number, duration: number, waveform: OscillatorType) {
  const attack = Math.min(.8, duration * .3); const release = Math.min(.8, duration * .3)
  const perNoteGain = .8 / frequencies.length
  for (const frequency of frequencies) {
    const osc = context.createOscillator(); osc.type = waveform; osc.frequency.value = frequency
    const gain = context.createGain()
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(perNoteGain, startTime + attack)
    gain.gain.setValueAtTime(perNoteGain, startTime + duration - release)
    gain.gain.linearRampToValueAtTime(0, startTime + duration)
    osc.connect(gain); gain.connect(destination)
    osc.start(startTime); osc.stop(startTime + duration)
  }
}
export async function synthesizeMusic(mood: MusicMoodId, durationSeconds: number, sampleRate = 48000): Promise<AudioBuffer> {
  const config = MOODS[mood]
  const length = Math.max(1, Math.ceil(durationSeconds * sampleRate))
  const context = new OfflineAudioContext(2, length, sampleRate)
  const master = context.createGain(); master.gain.value = config.volume; master.connect(context.destination)
  const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = config.cutoffHz; filter.connect(master)
  let time = 0; let stepIndex = 0
  while (time < durationSeconds) {
    const chord = config.progression[stepIndex % config.progression.length]
    const chordDuration = Math.min(config.chordSeconds, durationSeconds - time)
    const chordRoot = config.keyRoot + chord.rootOffset + config.octaveShift
    scheduleChord(context, filter, chord.triad.map(interval => noteFrequency(chordRoot + interval)), time, chordDuration, config.waveform)
    if (config.arpeggio) {
      const notes = [0, ...chord.triad, 12]; const noteDuration = chordDuration / notes.length
      notes.forEach((interval, i) => schedulePluck(context, filter, noteFrequency(chordRoot + interval + 12), time + i * noteDuration, noteDuration * 1.6, .5))
    }
    time += chordDuration; stepIndex++
  }
  return context.startRendering()
}

// Encodes an AudioBuffer as a standard 16-bit PCM WAV file, so a synthesized track can be handed
// to the exact same upload/trim/loop/fade/export pipeline (audio.ts + App.tsx) as a user-provided
// file, instead of needing a separate code path.
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels; const sampleRate = buffer.sampleRate; const bytesPerSample = 2
  const blockAlign = numberOfChannels * bytesPerSample; const dataSize = buffer.length * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataSize); const view = new DataView(arrayBuffer)
  const writeString = (offset: number, text: string) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)) }
  writeString(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeString(8, 'WAVE')
  writeString(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true)
  writeString(36, 'data'); view.setUint32(40, dataSize, true)
  const channels = Array.from({ length: numberOfChannels }, (_, channel) => buffer.getChannelData(channel))
  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += bytesPerSample
    }
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}
export async function generateMusicFile(mood: MusicMoodId, durationSeconds: number, language: Language = 'ja'): Promise<File> {
  const buffer = await synthesizeMusic(mood, durationSeconds)
  const blob = audioBufferToWavBlob(buffer)
  const name = getMusicMood(mood).name[language]
  return new File([blob], `${name}.wav`, { type: 'audio/wav' })
}
