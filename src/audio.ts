// Loops (or trims) a single channel's samples to exactly `targetLength`, with a linear fade-out
// over the last `fadeSamples` so a loop seam or a hard cut at the video's end doesn't pop. Pure
// function over plain sample arrays (not a real AudioBuffer) so this is unit-testable without the
// Web Audio API.
export function fitChannelDuration(samples: ArrayLike<number>, targetLength: number, fadeSamples: number, volume = 1): Float32Array<ArrayBuffer> {
  const output = new Float32Array(Math.max(0, targetLength))
  const sourceLength = samples.length || 1
  const fade = Math.min(fadeSamples, targetLength)
  for (let i = 0; i < targetLength; i++) {
    let value = (samples[i % sourceLength] ?? 0) * volume
    if (fade > 0 && i >= targetLength - fade) value *= (targetLength - i) / fade
    output[i] = value
  }
  return output
}

export async function decodeAudioFile(file: Blob, context: BaseAudioContext): Promise<AudioBuffer> {
  return context.decodeAudioData(await file.arrayBuffer())
}

// Fits a decoded audio clip to the export's total duration: shorter clips loop seamlessly, longer
// ones are trimmed, either way the last ~1.5s fades out instead of cutting off abruptly, and
// `volume` (0-1) scales loudness since background music usually shouldn't play at its source level.
export function fitAudioBuffer(context: BaseAudioContext, buffer: AudioBuffer, durationSeconds: number, volume = 1, fadeOutSeconds = 1.5): AudioBuffer {
  const sampleRate = buffer.sampleRate
  const targetLength = Math.max(1, Math.round(durationSeconds * sampleRate))
  const fadeSamples = Math.round(fadeOutSeconds * sampleRate)
  const output = context.createBuffer(buffer.numberOfChannels, targetLength, sampleRate)
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    output.copyToChannel(fitChannelDuration(buffer.getChannelData(channel), targetLength, fadeSamples, volume), channel)
  }
  return output
}
