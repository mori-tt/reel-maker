// Loops (or trims) a single channel's samples to exactly `targetLength`, with a linear fade-in at
// the start and fade-out at the end so the track neither starts abruptly nor cuts off/pops at a
// loop seam or the video's end. If the two fades would together exceed the clip's length (a very
// short clip with both requested), they're scaled down proportionally rather than overlapping
// unpredictably. Pure function over plain sample arrays (not a real AudioBuffer) so this is
// unit-testable without the Web Audio API.
export function fitChannelDuration(samples: ArrayLike<number>, targetLength: number, fadeInSamples: number, fadeOutSamples: number, volume = 1): Float32Array<ArrayBuffer> {
  const output = new Float32Array(Math.max(0, targetLength))
  const sourceLength = samples.length || 1
  let fadeIn = Math.min(fadeInSamples, targetLength)
  let fadeOut = Math.min(fadeOutSamples, targetLength)
  if (fadeIn + fadeOut > targetLength) { const scale = targetLength / (fadeIn + fadeOut); fadeIn = Math.floor(fadeIn * scale); fadeOut = Math.floor(fadeOut * scale) }
  for (let i = 0; i < targetLength; i++) {
    let value = (samples[i % sourceLength] ?? 0) * volume
    if (fadeIn > 0 && i < fadeIn) value *= i / fadeIn
    if (fadeOut > 0 && i >= targetLength - fadeOut) value *= (targetLength - i) / fadeOut
    output[i] = value
  }
  return output
}

export async function decodeAudioFile(file: Blob, context: BaseAudioContext): Promise<AudioBuffer> {
  return context.decodeAudioData(await file.arrayBuffer())
}

// Fits a decoded audio clip to the export's total duration: shorter clips loop seamlessly, longer
// ones are trimmed, the first ~1.2s fades in and the last ~1.5s fades out (instead of starting or
// cutting off abruptly), and `volume` (0-1) scales loudness since background music usually
// shouldn't play at its source level.
export function fitAudioBuffer(context: BaseAudioContext, buffer: AudioBuffer, durationSeconds: number, volume = 1, fadeInSeconds = 1.2, fadeOutSeconds = 1.5): AudioBuffer {
  const sampleRate = buffer.sampleRate
  const targetLength = Math.max(1, Math.round(durationSeconds * sampleRate))
  const fadeInSamples = Math.round(fadeInSeconds * sampleRate)
  const fadeOutSamples = Math.round(fadeOutSeconds * sampleRate)
  const output = context.createBuffer(buffer.numberOfChannels, targetLength, sampleRate)
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    output.copyToChannel(fitChannelDuration(buffer.getChannelData(channel), targetLength, fadeInSamples, fadeOutSamples, volume), channel)
  }
  return output
}
