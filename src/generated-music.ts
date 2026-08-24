// Original, algorithmically-generated background tracks - synthesized entirely client-side from
// oscillators and envelopes, not sampled or copied from anywhere. That makes them safe to ship
// and use with zero licensing/copyright risk, unlike scraping "free music" sites (whose licenses,
// attribution requirements, and actual copyright status vary and aren't something this app can
// verify automatically). For real produced music, see the links in USER_GUIDE.md and upload the
// track via the existing "Add a music file" button - these generated tracks are a built-in
// fallback for whenever that's not what someone wants or has time for, not a replacement for it.
import type { Language } from './i18n'

export type MusicMoodId = 'calm' | 'uplifting' | 'cinematic' | 'playful' | 'dramatic' | 'lofi' | 'energetic' | 'acoustic'
export const MUSIC_MOODS: readonly { id: MusicMoodId; name: { en: string; ja: string }; description: { en: string; ja: string } }[] = [
  { id: 'calm', name: { en: 'Calm', ja: 'カーム' }, description: { en: 'Slow, warm pad chords', ja: 'ゆったり暖かいパッドコード' } },
  { id: 'uplifting', name: { en: 'Uplifting', ja: 'アップリフティング' }, description: { en: 'Bright chords with a gentle arpeggio', ja: '明るいコードと柔らかいアルペジオ' } },
  { id: 'cinematic', name: { en: 'Cinematic', ja: 'シネマティック' }, description: { en: 'Slow minor-key atmosphere', ja: 'ゆったりとしたマイナー調の情景' } },
  { id: 'playful', name: { en: 'Playful', ja: 'プレイフル' }, description: { en: 'Light plucked notes, a bit of bounce', ja: '軽やかなプラック音、弾むリズム' } },
  { id: 'dramatic', name: { en: 'Dramatic', ja: 'ドラマチック' }, description: { en: 'Driving minor-key pulse, trailer-like', ja: '脈打つマイナー調、予告編のような緊張感' } },
  { id: 'lofi', name: { en: 'Lofi', ja: 'ローファイ' }, description: { en: 'Muffled jazzy 7th chords, relaxed', ja: 'こもったジャジーな7thコード、まったり' } },
  { id: 'energetic', name: { en: 'Energetic', ja: 'エナジェティック' }, description: { en: 'Fast bright chords + busy arpeggio', ja: '速く明るいコード＋忙しいアルペジオ' } },
  { id: 'acoustic', name: { en: 'Acoustic', ja: 'アコースティック' }, description: { en: 'Simple, warm, folk-like strum', ja: 'シンプルで暖かい、フォーク風のストラム' } },
] as const
export function isMusicMoodId(value: string | null): value is MusicMoodId { return MUSIC_MOODS.some(mood => mood.id === value) }
export function getMusicMood(id: MusicMoodId) { return MUSIC_MOODS.find(mood => mood.id === id) ?? MUSIC_MOODS[0] }

// Frequency of a note `semitonesFromA4` half-steps away from A4 (440Hz), i.e. standard 12-tone
// equal temperament - the same math a synthesizer or tuner uses.
function noteFrequency(semitonesFromA4: number): number { return 440 * 2 ** (semitonesFromA4 / 12) }
const MAJOR_TRIAD = [0, 4, 7]
const MINOR_TRIAD = [0, 3, 7]
const MAJOR_SEVENTH = [0, 4, 7, 11]
const MINOR_SEVENTH = [0, 3, 7, 10]
const DOMINANT_SEVENTH = [0, 4, 7, 10]
type ChordStep = { rootOffset: number; triad: readonly number[] }
// texture layers an optional rhythmic element on top of the sustained chord: 'arpeggio' climbs
// through the chord's own notes (bright, melodic), 'pulse' repeats a single low root note like a
// heartbeat (driving, tense) - both reuse schedulePluck, just at different pitches/rates.
// attackRatio overrides how much of each chord's duration is spent swelling in (default below
// suits a slow pad; a snappier mood like Acoustic wants a much shorter attack to read as plucked/
// strummed rather than a synth pad fading up).
type MoodConfig = { keyRoot: number; progression: readonly ChordStep[]; chordSeconds: number; octaveShift: number; cutoffHz: number; texture: 'none' | 'arpeggio' | 'pulse'; volume: number; waveform: OscillatorType; attackRatio?: number }

// Every mood is the same underlying engine (a chord progression of sustained triads/sevenths,
// softly low-pass filtered, optionally topped with a plucked arpeggio or a pulsing bass) with
// different musical choices - key/mode, chord quality, tempo, register, and texture - rather than
// eight separate implementations.
// `volume` values leave headroom below clipping (peak stays under roughly -10dBFS even on the
// arpeggiated moods, where a plucked note can briefly overlap a chord's own peak) while still
// being clearly audible as a soundtrack, since for this app music is the *only* audio - there's
// no dialogue it needs to duck under.
const MOODS: Record<MusicMoodId, MoodConfig> = {
  calm: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_TRIAD }, { rootOffset: 7, triad: MAJOR_TRIAD }, { rootOffset: 9, triad: MINOR_TRIAD }, { rootOffset: 5, triad: MAJOR_TRIAD }], chordSeconds: 4.5, octaveShift: -12, cutoffHz: 900, texture: 'none', volume: .4, waveform: 'triangle' },
  uplifting: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_TRIAD }, { rootOffset: 5, triad: MAJOR_TRIAD }, { rootOffset: 9, triad: MINOR_TRIAD }, { rootOffset: 7, triad: MAJOR_TRIAD }], chordSeconds: 3, octaveShift: 0, cutoffHz: 2200, texture: 'arpeggio', volume: .3, waveform: 'triangle' },
  cinematic: { keyRoot: -12, progression: [{ rootOffset: 0, triad: MINOR_TRIAD }, { rootOffset: 8, triad: MAJOR_TRIAD }, { rootOffset: 3, triad: MAJOR_TRIAD }, { rootOffset: 10, triad: MAJOR_TRIAD }], chordSeconds: 5.5, octaveShift: -12, cutoffHz: 650, texture: 'none', volume: .42, waveform: 'sine' },
  playful: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_TRIAD }, { rootOffset: 9, triad: MINOR_TRIAD }, { rootOffset: 5, triad: MAJOR_TRIAD }, { rootOffset: 7, triad: MAJOR_TRIAD }], chordSeconds: 2, octaveShift: 0, cutoffHz: 3200, texture: 'arpeggio', volume: .28, waveform: 'square' },
  dramatic: { keyRoot: -12, progression: [{ rootOffset: 0, triad: MINOR_TRIAD }, { rootOffset: 8, triad: MAJOR_TRIAD }, { rootOffset: 10, triad: MAJOR_TRIAD }, { rootOffset: 3, triad: MINOR_TRIAD }], chordSeconds: 2.8, octaveShift: -12, cutoffHz: 1100, texture: 'pulse', volume: .36, waveform: 'sawtooth' },
  lofi: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_SEVENTH }, { rootOffset: 9, triad: MINOR_SEVENTH }, { rootOffset: 5, triad: MAJOR_SEVENTH }, { rootOffset: 7, triad: DOMINANT_SEVENTH }], chordSeconds: 4, octaveShift: -12, cutoffHz: 550, texture: 'none', volume: .4, waveform: 'triangle' },
  energetic: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_TRIAD }, { rootOffset: 5, triad: MAJOR_TRIAD }, { rootOffset: 7, triad: MAJOR_TRIAD }, { rootOffset: 9, triad: MINOR_TRIAD }], chordSeconds: 1.6, octaveShift: 0, cutoffHz: 2800, texture: 'arpeggio', volume: .28, waveform: 'triangle' },
  acoustic: { keyRoot: -9, progression: [{ rootOffset: 0, triad: MAJOR_TRIAD }, { rootOffset: 5, triad: MAJOR_TRIAD }, { rootOffset: 7, triad: MAJOR_TRIAD }, { rootOffset: 0, triad: MAJOR_TRIAD }], chordSeconds: 3.2, octaveShift: -12, cutoffHz: 1300, texture: 'none', volume: .38, waveform: 'triangle', attackRatio: .04 },
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
// One sustained chord - a triad's (or seventh chord's) worth of oscillators sharing a soft
// attack/release envelope so chord changes fade into each other instead of clicking. A shorter
// attackRatio reads more like a plucked/strummed instrument than a synth pad swelling in.
function scheduleChord(context: BaseAudioContext, destination: AudioNode, frequencies: number[], startTime: number, duration: number, waveform: OscillatorType, attackRatio = .3) {
  const attack = Math.min(.8, duration * attackRatio); const release = Math.min(.8, duration * .3)
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
    scheduleChord(context, filter, chord.triad.map(interval => noteFrequency(chordRoot + interval)), time, chordDuration, config.waveform, config.attackRatio)
    if (config.texture === 'arpeggio') {
      const notes = [0, ...chord.triad, 12]; const noteDuration = chordDuration / notes.length
      notes.forEach((interval, i) => schedulePluck(context, filter, noteFrequency(chordRoot + interval + 12), time + i * noteDuration, noteDuration * 1.6, .5))
    } else if (config.texture === 'pulse') {
      // A repeated low root note (one octave below the chord) at a steady rate, like a driving
      // heartbeat under the sustained harmony - distinct from the arpeggio's ascending melody.
      const pulseCount = Math.max(2, Math.round(chordDuration / .55)); const pulseDuration = chordDuration / pulseCount
      for (let i = 0; i < pulseCount; i++) schedulePluck(context, filter, noteFrequency(chordRoot - 12), time + i * pulseDuration, pulseDuration * .92, .6)
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
