import { promises as fs } from 'fs'
import path from 'path'
import pino from 'pino'
import crypto from 'crypto'
import axios from 'axios'

const logger = pino({ name: 'voice-service' })

export interface VoiceOptions {
  text: string
  voiceId?: string
  modelId?: string
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
}

export interface VoiceResult {
  audioPath: string
  provider: 'elevenlabs'
  cost?: number
  metadata?: any
}

export interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}

export interface VoiceCacheEntry {
  path: string
  text: string
  voiceId: string
  createdAt: Date
  settings: VoiceSettings
}

export class VoiceService {
  private readonly apiKey?: string
  private readonly tempDir: string
  private readonly cacheDir: string
  private readonly cache = new Map<string, VoiceCacheEntry>()
  private availableVoices: any[] = []

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
    this.cacheDir = path.join(process.cwd(), 'cache', 'audio')
    this.apiKey = process.env.ELEVENLABS_API_KEY
    this.initializeService()
  }

  private async initializeService(): Promise<void> {
    if (this.apiKey) {
      logger.info('ElevenLabs provider initialized')
      await this.initializeCache()
      
      // Ładuj dostępne głosy asynchronicznie
      this.loadAvailableVoices().catch(error => {
        logger.warn({ error }, 'Failed to load available voices')
      })
    } else {
      logger.warn('ElevenLabs API key not found. Voice generation will be disabled.')
    }
  }

  private async initializeCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      
      if (process.env.VOICE_CACHE_ENABLED === 'true') {
        await this.loadCacheFromDisk()
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize voice cache')
    }
  }

  private async loadAvailableVoices(): Promise<void> {
    if (!this.apiKey) return

    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey
        }
      })
      
      this.availableVoices = response.data.voices || []
      logger.info(`Loaded ${this.availableVoices.length} available voices`)
    } catch (error) {
      logger.warn({ error }, 'Failed to load available voices')
    }
  }

  /**
   * Główna metoda do generowania głosu
   */
  async generateVoice(options: VoiceOptions): Promise<VoiceResult> {
    logger.info(`Generating voice for text: "${options.text.substring(0, 50)}..."`)

    if (!this.apiKey) {
      throw new Error('ElevenLabs not initialized. Check your API key.')
    }

    // Sprawdź cache
    const cacheKey = this.generateCacheKey(options)
    const cached = await this.getCachedAudio(cacheKey)
    if (cached) {
      logger.info('Returning cached audio')
      return {
        audioPath: cached.path,
        provider: 'elevenlabs'
      }
    }

    try {
      const result = await this.generateWithElevenLabs(options)

      // Zapisz do cache
      await this.cacheAudio(cacheKey, result, options)
      
      logger.info('Successfully generated voice with ElevenLabs')
      return result

    } catch (error) {
      logger.error({ error }, 'Failed to generate voice')
      throw error
    }
  }

  /**
   * Generowanie głosu przez ElevenLabs REST API
   */
  private async generateWithElevenLabs(options: VoiceOptions): Promise<VoiceResult> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs not initialized')
    }

    const voiceId = options.voiceId || this.getDefaultVoice()
    const modelId = options.modelId || 'eleven_multilingual_v2'

    logger.info(`Generating voice with ElevenLabs - Voice: ${voiceId}, Model: ${modelId}`)

    try {
      const voiceSettings = {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: options.style ?? 0.0,
        use_speaker_boost: options.useSpeakerBoost ?? true
      }

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: options.text,
          model_id: modelId,
          voice_settings: voiceSettings
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          responseType: 'arraybuffer'
        }
      )

      // Zapisz audio do pliku
      const audioPath = await this.saveAudioBuffer(response.data, options.text)

      return {
        audioPath,
        provider: 'elevenlabs',
        metadata: {
          voiceId,
          modelId,
          voiceSettings
        }
      }

    } catch (error) {
      logger.error({ error }, 'ElevenLabs voice generation failed')
      throw new Error(`ElevenLabs generation failed: ${error}`)
    }
  }

  /**
   * Zapisuje audio buffer do pliku
   */
  private async saveAudioBuffer(audioBuffer: ArrayBuffer, text: string): Promise<string> {
    const filename = `voice_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.mp3`
    const audioPath = path.join(this.tempDir, filename)

    try {
      await fs.writeFile(audioPath, Buffer.from(audioBuffer))
      
      logger.info(`Voice audio saved to: ${audioPath}`)
      return audioPath

    } catch (error) {
      logger.error({ error }, 'Failed to save audio buffer')
      throw error
    }
  }

  /**
   * Pobiera domyślny głos (preferowane polskie głosy)
   */
  private getDefaultVoice(): string {
    // Domyślne głosy ElevenLabs - można skonfigurować przez zmienne środowiskowe
    const defaultVoice = process.env.ELEVENLABS_DEFAULT_VOICE || '9BWtsMINqrJLrRacOk9x' // Aria (Starter plan)
    
    // Jeśli mamy załadowane głosy, spróbuj znaleźć polski
    if (this.availableVoices.length > 0) {
      const polishVoice = this.availableVoices.find(v => 
        v.name?.toLowerCase().includes('polish') || 
        v.labels?.accent?.toLowerCase().includes('polish')
      )
      
      if (polishVoice) {
        logger.info(`Using Polish voice: ${polishVoice.name} (${polishVoice.voice_id})`)
        return polishVoice.voice_id
      }
    }

    return defaultVoice
  }

  /**
   * Generuje klucz cache na podstawie opcji
   */
  private generateCacheKey(options: VoiceOptions): string {
    const voiceId = options.voiceId || this.getDefaultVoice()
    const settings = {
      text: options.text,
      voiceId,
      modelId: options.modelId || 'eleven_multilingual_v2',
      stability: options.stability ?? 0.5,
      similarityBoost: options.similarityBoost ?? 0.75,
      style: options.style ?? 0.0,
      useSpeakerBoost: options.useSpeakerBoost ?? true
    }
    
    const hash = crypto.createHash('md5')
      .update(JSON.stringify(settings))
      .digest('hex')
    
    return `voice_${hash}`
  }

  /**
   * Pobiera audio z cache
   */
  private async getCachedAudio(cacheKey: string): Promise<VoiceCacheEntry | null> {
    const cached = this.cache.get(cacheKey)
    if (!cached) return null

    try {
      // Sprawdź czy plik nadal istnieje
      await fs.access(cached.path)
      
      // Sprawdź wiek cache (domyślnie 24h)
      const maxAge = parseInt(process.env.VOICE_CACHE_MAX_AGE || '86400000') // 24h in ms
      const age = Date.now() - cached.createdAt.getTime()
      
      if (age > maxAge) {
        logger.info(`Cache entry expired: ${cacheKey}`)
        this.cache.delete(cacheKey)
        return null
      }

      return cached
    } catch (error) {
      // Plik nie istnieje, usuń z cache
      this.cache.delete(cacheKey)
      return null
    }
  }

  /**
   * Zapisuje audio do cache
   */
  private async cacheAudio(cacheKey: string, result: VoiceResult, options: VoiceOptions): Promise<void> {
    if (process.env.VOICE_CACHE_ENABLED !== 'true') return

    try {
      // Kopiuj plik do katalogu cache
      const cacheFilename = `${cacheKey}.mp3`
      const cachePath = path.join(this.cacheDir, cacheFilename)
      
      await fs.copyFile(result.audioPath, cachePath)

      const cacheEntry: VoiceCacheEntry = {
        path: cachePath,
        text: options.text,
        voiceId: options.voiceId || this.getDefaultVoice(),
        createdAt: new Date(),
        settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0.0,
          use_speaker_boost: options.useSpeakerBoost ?? true
        }
      }

      this.cache.set(cacheKey, cacheEntry)
      logger.info(`Audio cached: ${cacheKey}`)

    } catch (error) {
      logger.warn({ error }, 'Failed to cache audio')
    }
  }

  /**
   * Ładuje cache z dysku
   */
  private async loadCacheFromDisk(): Promise<void> {
    // Implementacja ładowania cache z dysku (opcjonalne)
    logger.info('Voice cache loaded from disk')
  }

  /**
   * Sprawdza czy serwis jest dostępny
   */
  isAvailable(): boolean {
    return !!this.apiKey
  }

  /**
   * Pobiera dostępne głosy
   */
  getAvailableVoices(): any[] {
    return this.availableVoices
  }

  /**
   * Czyści stary cache
   */
  async cleanupCache(): Promise<void> {
    try {
      const maxAge = parseInt(process.env.VOICE_CACHE_MAX_AGE || '86400000') // 24h
      const now = Date.now()

      for (const [key, entry] of this.cache.entries()) {
        const age = now - entry.createdAt.getTime()
        if (age > maxAge) {
          try {
            await fs.unlink(entry.path)
            this.cache.delete(key)
            logger.info(`Cleaned up expired cache entry: ${key}`)
          } catch (error) {
            logger.warn({ error, key }, 'Failed to cleanup cache entry')
          }
        }
      }

    } catch (error) {
      logger.warn({ error }, 'Cache cleanup failed')
    }
  }

  /**
   * Generuje audio dla pytań quizu
   */
  async generateQuizAudio(questions: Array<{question: string, answer: string}>): Promise<string[]> {
    const audioFiles: string[] = []
    
    for (let i = 0; i < questions.length; i++) {
      try {
        const question = questions[i]
        const text = `${question.question}. Odpowiedź: ${question.answer}`
        
        logger.info(`Generating audio for question ${i + 1}/${questions.length}`)
        
        const result = await this.generateVoice({
          text,
          voiceId: process.env.ELEVENLABS_DEFAULT_VOICE
        })
        
        audioFiles.push(result.audioPath)
        
      } catch (error) {
        logger.error({ error, questionIndex: i }, 'Failed to generate quiz audio')
        throw error
      }
    }
    
    return audioFiles
  }
} 