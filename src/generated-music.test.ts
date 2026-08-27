import { describe, expect, it } from 'vitest'
import { audioBufferToWavBlob, getMusicMood, isMusicMoodId, MUSIC_MOODS } from './generated-music'

// synthesizeMusic()/generateMusicFile() need a real OfflineAudioContext, which jsdom doesn't
// implement - those are covered by browser-based verification instead (see PR notes). This file
// covers everything that doesn't need the Web Audio API itself: the mood catalog and the WAV
// encoder, exercised against a hand-built fake AudioBuffer (same shape, no real audio backend).
function fakeAudioBuffer(channels: number[][], sampleRate = 48000) {
  return {
    numberOfChannels: channels.length,
    length: channels[0]?.length ?? 0,
    sampleRate,
    getChannelData: (channel: number) => new Float32Array(channels[channel]),
  } as unknown as AudioBuffer
}
function readWavHeader(blob: Blob) {
  return blob.arrayBuffer().then(buffer => {
    const view = new DataView(buffer)
    const readString = (offset: number, length: number) => String.fromCharCode(...new Uint8Array(buffer, offset, length))
    return {
      riff: readString(0, 4), wave: readString(8, 4), fmt: readString(12, 4),
      channels: view.getUint16(22, true), sampleRate: view.getUint32(24, true), bitsPerSample: view.getUint16(34, true),
      dataTag: readString(36, 4), dataSize: view.getUint32(40, true),
      samples: (offset: number) => view.getInt16(44 + offset * 2, true),
    }
  })
}

describe('background music mood catalog', () => {
  it('exposes a stable set of mood ids with localized names', () => {
    expect(MUSIC_MOODS.map(mood => mood.id)).toEqual(['calm', 'uplifting', 'cinematic', 'playful', 'dramatic', 'lofi', 'energetic', 'acoustic', 'jazz', 'electronic', 'classical'])
    for (const mood of MUSIC_MOODS) { expect(mood.name.en).toBeTruthy(); expect(mood.name.ja).toBeTruthy() }
  })

  it('validates mood ids', () => {
    expect(isMusicMoodId('calm')).toBe(true)
    expect(isMusicMoodId('lofi')).toBe(true)
    expect(isMusicMoodId('synthwave')).toBe(false)
    expect(isMusicMoodId(null)).toBe(false)
  })

  it('falls back to the first mood for an unrecognized id rather than throwing', () => {
    expect(getMusicMood('does-not-exist' as never)).toEqual(MUSIC_MOODS[0])
  })
})

describe('WAV encoding for synthesized tracks', () => {
  it('writes a valid RIFF/WAVE header matching the buffer shape', async () => {
    const buffer = fakeAudioBuffer([[0, .5, -.5, 1, -1]], 44100)
    const blob = audioBufferToWavBlob(buffer)
    const header = await readWavHeader(blob)
    expect(header.riff).toBe('RIFF'); expect(header.wave).toBe('WAVE'); expect(header.fmt).toBe('fmt ')
    expect(header.dataTag).toBe('data')
    expect(header.channels).toBe(1)
    expect(header.sampleRate).toBe(44100)
    expect(header.bitsPerSample).toBe(16)
    expect(header.dataSize).toBe(5 * 2) // 5 samples * 16-bit mono
  })

  it('round-trips sample values through 16-bit PCM without gross distortion', async () => {
    const buffer = fakeAudioBuffer([[0, .5, -.5, 1, -1]])
    const header = await readWavHeader(audioBufferToWavBlob(buffer))
    expect(header.samples(0)).toBe(0)
    expect(header.samples(1)).toBeCloseTo(0.5 * 0x7fff, -1)
    expect(header.samples(2)).toBeCloseTo(-0.5 * 0x8000, -1)
    expect(header.samples(3)).toBe(0x7fff)
    expect(header.samples(4)).toBe(-0x8000)
  })

  it('clamps out-of-range samples instead of wrapping/overflowing', async () => {
    const buffer = fakeAudioBuffer([[1.4, -1.4]])
    const header = await readWavHeader(audioBufferToWavBlob(buffer))
    expect(header.samples(0)).toBe(0x7fff)
    expect(header.samples(1)).toBe(-0x8000)
  })

  it('interleaves stereo channels sample-by-sample', async () => {
    const buffer = fakeAudioBuffer([[1, 0], [-1, 0]]) // left: [1,0], right: [-1,0]
    const blob = audioBufferToWavBlob(buffer)
    const header = await readWavHeader(blob)
    expect(header.channels).toBe(2)
    expect(header.dataSize).toBe(2 * 2 * 2) // 2 frames * 2 channels * 16-bit
    expect(header.samples(0)).toBe(0x7fff) // left, frame 0
    expect(header.samples(1)).toBe(-0x8000) // right, frame 0
  })

  it('produces a blob with the audio/wav mime type', () => {
    expect(audioBufferToWavBlob(fakeAudioBuffer([[0]])).type).toBe('audio/wav')
  })
})
