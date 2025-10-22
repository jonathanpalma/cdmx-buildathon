import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "~/components/ui/button"
import { formatTimestamp, analyzeAudioChannels, monoAudioBufferToWav } from "~/lib/audio-utils"
import { cn } from "~/lib/utils"

export interface TranscriptEvent {
  timestamp: number
  text: string
  speaker?: "agent" | "customer"
  confidence?: number
  chunkIndex?: number
  sequenceNumber?: number // For ordering responses correctly
  isEmpty?: boolean
}

interface AudioPlaybackSimulatorProps {
  audioFile: File
  onTranscriptUpdate?: (event: TranscriptEvent) => void
  onPlaybackComplete?: () => void
  onPlaybackStateChange?: (isPlaying: boolean) => void
  simulateRealtime?: boolean
  chunkDuration?: number
}

// Helper function to convert AudioBuffer to WAV blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels // Preserve stereo/mono
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numberOfChannels * bytesPerSample

  // Interleave channels for WAV format
  const length = buffer.length * numberOfChannels
  const data = new Float32Array(length)

  if (numberOfChannels === 2) {
    // Stereo: interleave left and right channels
    const left = buffer.getChannelData(0)
    const right = buffer.getChannelData(1)
    for (let i = 0; i < buffer.length; i++) {
      data[i * 2] = left[i]
      data[i * 2 + 1] = right[i]
    }
  } else {
    // Mono: just copy
    const channelData = buffer.getChannelData(0)
    for (let i = 0; i < buffer.length; i++) {
      data[i] = channelData[i]
    }
  }

  const dataLength = data.length * bytesPerSample
  const bufferLength = 44 + dataLength
  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, "RIFF")
  view.setUint32(4, bufferLength - 8, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, "data")
  view.setUint32(40, dataLength, true)

  // PCM data
  let offset = 44
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: "audio/wav" })
}

export function AudioPlaybackSimulator({
  audioFile,
  onTranscriptUpdate,
  onPlaybackComplete,
  onPlaybackStateChange,
  simulateRealtime = true,
  chunkDuration = 2,
}: AudioPlaybackSimulatorProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastProcessedTimeRef = useRef(0)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chunkIndexRef = useRef(0)
  const sequenceNumberRef = useRef(0) // Global sequence number for ordering

  // Create audio URL from file and decode audio buffer
  useEffect(() => {
    const url = URL.createObjectURL(audioFile)
    setAudioUrl(url)

    // Decode audio file for chunk extraction
    const loadAudioBuffer = async () => {
      try {
        const arrayBuffer = await audioFile.arrayBuffer()
        const audioContext = new AudioContext({ sampleRate: 16000 })
        audioContextRef.current = audioContext
        const buffer = await audioContext.decodeAudioData(arrayBuffer)
        audioBufferRef.current = buffer
      } catch (error) {
        console.error("Error loading audio buffer:", error)
      }
    }

    loadAudioBuffer()

    return () => {
      URL.revokeObjectURL(url)
      audioContextRef.current?.close()
    }
  }, [audioFile])

  // Handle audio metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [])

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [])

  // Handle playback end
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current)
    }
    onPlaybackComplete?.()
  }, [onPlaybackComplete])

  // Extract audio chunks and send to STT during playback
  useEffect(() => {
    if (isPlaying && simulateRealtime && audioBufferRef.current) {
      processingIntervalRef.current = setInterval(async () => {
        const currentPlayTime = audioRef.current?.currentTime || 0

        // Check if we've passed a chunk boundary
        if (currentPlayTime - lastProcessedTimeRef.current >= chunkDuration) {
          const startTime = lastProcessedTimeRef.current
          const endTime = Math.min(startTime + chunkDuration, audioBufferRef.current!.duration)
          lastProcessedTimeRef.current = endTime

          try {
            // Extract chunk from audio buffer
            const audioBuffer = audioBufferRef.current!
            const sampleRate = audioBuffer.sampleRate
            const startSample = Math.floor(startTime * sampleRate)
            const endSample = Math.floor(endTime * sampleRate)
            const chunkLength = endSample - startSample
            const numberOfChannels = audioBuffer.numberOfChannels

            // Create a new buffer for this chunk (preserve stereo if present)
            const chunkBuffer = audioContextRef.current!.createBuffer(
              numberOfChannels,
              chunkLength,
              sampleRate
            )

            // Copy audio data to chunk buffer
            for (let ch = 0; ch < numberOfChannels; ch++) {
              const sourceData = audioBuffer.getChannelData(ch)
              const chunkData = chunkBuffer.getChannelData(ch)
              for (let i = 0; i < chunkLength; i++) {
                chunkData[i] = sourceData[startSample + i]
              }
            }

            // Analyze the chunk to determine what to send
            const analysis = analyzeAudioChannels(chunkBuffer)

            // Skip completely silent chunks
            if (analysis.overall.isSilence) {
              console.log(`Chunk ${chunkIndexRef.current}: Silence detected, skipping`)
              chunkIndexRef.current++
              return
            }

            // Determine what audio to send based on analysis
            let wavBlob: Blob
            let detectedSpeaker: "agent" | "customer" | undefined = analysis.overall.dominantSpeaker
            let channelStrategy: 'mono-left' | 'mono-right' | 'stereo'

            if (numberOfChannels === 1) {
              // Mono audio - send as-is
              wavBlob = audioBufferToWav(chunkBuffer)
              channelStrategy = 'mono-left'
            } else if (analysis.overall.dominantChannel === 'left') {
              // Only agent speaking - send left channel only
              wavBlob = monoAudioBufferToWav(chunkBuffer, 0)
              channelStrategy = 'mono-left'
              console.log(`Chunk ${chunkIndexRef.current}: Agent only (L: ${analysis.leftChannel?.rms.toFixed(4)}, R: ${analysis.rightChannel?.rms.toFixed(4)})`)
            } else if (analysis.overall.dominantChannel === 'right') {
              // Only customer speaking - send right channel only
              wavBlob = monoAudioBufferToWav(chunkBuffer, 1)
              channelStrategy = 'mono-right'
              console.log(`Chunk ${chunkIndexRef.current}: Customer only (L: ${analysis.leftChannel?.rms.toFixed(4)}, R: ${analysis.rightChannel?.rms.toFixed(4)})`)
            } else {
              // Both speakers active (overlapping speech) - send stereo for Deepgram to handle
              wavBlob = audioBufferToWav(chunkBuffer)
              channelStrategy = 'stereo'
              console.log(`Chunk ${chunkIndexRef.current}: Both speakers (L: ${analysis.leftChannel?.rms.toFixed(4)}, R: ${analysis.rightChannel?.rms.toFixed(4)})`)
            }

            // Assign sequence number for ordering responses
            const currentSequence = sequenceNumberRef.current++

            // Send chunk to STT endpoint
            const formData = new FormData()
            formData.append("audio", wavBlob, `chunk-${chunkIndexRef.current}.wav`)
            formData.append("timestamp", startTime.toString())
            formData.append("chunkIndex", chunkIndexRef.current.toString())
            formData.append("sequenceNumber", currentSequence.toString())
            formData.append("channelStrategy", channelStrategy)
            if (detectedSpeaker) {
              formData.append("detectedSpeaker", detectedSpeaker)
            }

            // Send request (don't await - let it process in background)
            fetch("/api/transcribe-chunk", {
              method: "POST",
              body: formData,
            })
              .then(async (response) => {
                if (response.ok) {
                  const result = await response.json()

                  // Emit transcript event with sequence number for proper ordering
                  onTranscriptUpdate?.({
                    timestamp: startTime,
                    text: result.text || "",
                    speaker: result.speaker || detectedSpeaker || "agent",
                    confidence: result.confidence,
                    chunkIndex: chunkIndexRef.current,
                    sequenceNumber: currentSequence,
                    isEmpty: result.isEmpty || false,
                  })
                } else {
                  console.error(`Failed to transcribe chunk ${chunkIndexRef.current}:`, response.statusText)
                }
              })
              .catch((error) => {
                console.error(`Error transcribing chunk ${chunkIndexRef.current}:`, error)
              })

            chunkIndexRef.current++
          } catch (error) {
            console.error("Error processing audio chunk:", error)
          }
        }
      }, 100) // Check every 100ms

      return () => {
        if (processingIntervalRef.current) {
          clearInterval(processingIntervalRef.current)
        }
      }
    }
  }, [isPlaying, simulateRealtime, chunkDuration, onTranscriptUpdate])

  // Notify parent when playback state changes
  useEffect(() => {
    onPlaybackStateChange?.(isPlaying)
  }, [isPlaying, onPlaybackStateChange])

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const handleRestart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      lastProcessedTimeRef.current = 0
      chunkIndexRef.current = 0
      sequenceNumberRef.current = 0
      setCurrentTime(0)
      if (isPlaying) {
        audioRef.current.play()
      }
    }
  }, [isPlaying])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
      lastProcessedTimeRef.current = newTime
    }
  }, [])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!audioUrl) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Compact Status Bar - Live Call Style */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        {/* Left: Status & Timer */}
        <div className="flex items-center gap-3">
          {/* Pulsing Recording Indicator */}
          <div className="flex items-center gap-2">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 bg-red-600 rounded-full animate-pulse" />
              {isPlaying && (
                <div className="absolute inset-0 bg-red-600 rounded-full opacity-75 animate-ping" />
              )}
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-red-600">
              {isPlaying ? "Recording" : "Paused"}
            </span>
          </div>

          {/* Timer with Tabular Numbers */}
          <time className="text-sm font-semibold tabular-nums text-gray-900">
            {formatTimestamp(currentTime)}
          </time>

          {duration > 0 && (
            <span className="text-xs text-gray-500 tabular-nums">
              / {formatTimestamp(duration)}
            </span>
          )}
        </div>

        {/* Right: Controls (subtle, fade on hover when paused) */}
        <div className={cn(
          "flex items-center gap-2 transition-opacity duration-200",
          !isPlaying && "opacity-40 hover:opacity-100"
        )}>
          {/* Restart Button */}
          <Button
            onClick={handleRestart}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!duration}
            aria-label="Restart audio"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Play/Pause Button */}
          <Button
            onClick={togglePlayPause}
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={!duration}
            aria-label={isPlaying ? "Pause playback" : "Play audio"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Seek Bar with Progress (minimal, appears on hover) */}
      <div className={cn(
        "relative group transition-all duration-200",
        "h-1 hover:h-6"
      )}>
        {/* Visual Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-red-600 transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Interactive Seek Input (invisible but functional) */}
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          disabled={!duration}
          className={cn(
            "absolute inset-0 w-full opacity-0 cursor-pointer",
            "disabled:cursor-not-allowed"
          )}
          aria-label="Seek audio position"
          title={`Seek to position: ${formatTimestamp(currentTime)}`}
        />

        {/* Hover State: Show time indicators */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="flex justify-between text-xs text-gray-500 tabular-nums">
            <span>{formatTimestamp(currentTime)}</span>
            <span>{formatTimestamp(duration)}</span>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
        aria-label="Call recording audio"
      />
    </div>
  )
}
