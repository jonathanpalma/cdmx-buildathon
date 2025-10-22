/**
 * Audio utilities for processing and chunking audio files
 */

export interface AudioChunk {
  blob: Blob
  startTime: number
  endTime: number
  duration: number
}

/**
 * Convert audio file to WAV format (required by most STT services)
 */
export async function convertToWav(audioFile: File): Promise<Blob> {
  const audioContext = new AudioContext({ sampleRate: 16000 }) // 16kHz is optimal for speech
  const arrayBuffer = await audioFile.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  return audioBufferToWav(audioBuffer)
}

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = 1 // Mono for speech
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  // Get channel data (convert to mono if stereo)
  let samples: Float32Array
  if (audioBuffer.numberOfChannels === 1) {
    samples = audioBuffer.getChannelData(0)
  } else {
    // Mix stereo to mono
    const left = audioBuffer.getChannelData(0)
    const right = audioBuffer.getChannelData(1)
    samples = new Float32Array(left.length)
    for (let i = 0; i < left.length; i++) {
      samples[i] = (left[i] + right[i]) / 2
    }
  }

  // Convert float samples to 16-bit PCM
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true)
  view.setUint16(32, numberOfChannels * (bitDepth / 8), true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)

  // Write PCM samples
  floatTo16BitPCM(view, 44, samples)

  return new Blob([buffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
}

/**
 * Split audio file into chunks for streaming simulation
 */
export async function splitAudioIntoChunks(
  audioFile: File,
  chunkDurationSeconds: number = 2
): Promise<AudioChunk[]> {
  const audioContext = new AudioContext({ sampleRate: 16000 })
  const arrayBuffer = await audioFile.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const chunks: AudioChunk[] = []
  const sampleRate = audioBuffer.sampleRate
  const chunkSamples = Math.floor(sampleRate * chunkDurationSeconds)
  const totalSamples = audioBuffer.length

  for (let offset = 0; offset < totalSamples; offset += chunkSamples) {
    const endOffset = Math.min(offset + chunkSamples, totalSamples)
    const chunkLength = endOffset - offset

    // Create a new AudioBuffer for this chunk
    const chunkBuffer = audioContext.createBuffer(
      1, // mono
      chunkLength,
      sampleRate
    )

    // Copy samples to chunk buffer (convert to mono if needed)
    const chunkData = chunkBuffer.getChannelData(0)
    if (audioBuffer.numberOfChannels === 1) {
      const sourceData = audioBuffer.getChannelData(0)
      chunkData.set(sourceData.subarray(offset, endOffset))
    } else {
      // Mix to mono
      const left = audioBuffer.getChannelData(0)
      const right = audioBuffer.getChannelData(1)
      for (let i = 0; i < chunkLength; i++) {
        chunkData[i] = (left[offset + i] + right[offset + i]) / 2
      }
    }

    // Convert chunk to WAV blob
    const blob = audioBufferToWav(chunkBuffer)

    chunks.push({
      blob,
      startTime: offset / sampleRate,
      endTime: endOffset / sampleRate,
      duration: chunkLength / sampleRate,
    })
  }

  return chunks
}

/**
 * Format timestamp for display (MM:SS)
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get audio file duration
 */
export async function getAudioDuration(audioFile: File): Promise<number> {
  const audioContext = new AudioContext()
  const arrayBuffer = await audioFile.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  return audioBuffer.duration
}
