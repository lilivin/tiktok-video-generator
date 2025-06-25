import { promises as fs } from 'fs'
import path from 'path'
import pino from 'pino'
import crypto from 'crypto'
import axios from 'axios'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const logger = pino({ name: 'voice-service' })
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface VoiceOptions {
  text: string
  voiceId?: string
  modelId?: string
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
  timing?: {
    maxDuration?: number // maksymalna długość audio w sekundach
  }
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

export interface QuestionAnswerAudio {
  questionAudio: string
  answerAudio: string
}

export interface TimingConfig {
  questionDuration: number
  pauseDuration: number
  answerDuration: number
  totalDuration: number
  countdownEnabled: boolean
}

export class VoiceService {
  private readonly apiKey?: string
  private readonly tempDir: string
  private readonly cacheDir: string
  private readonly assetsDir: string
  private readonly cache = new Map<string, VoiceCacheEntry>()
  private availableVoices: any[] = []
  private timingConfig: TimingConfig

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
    this.cacheDir = path.join(process.cwd(), 'cache', 'audio')
    this.assetsDir = path.join(process.cwd(), 'assets')
    this.apiKey = process.env.ELEVENLABS_API_KEY
    
    // Konfiguracja timing z ENV variables
    this.timingConfig = {
      questionDuration: parseFloat(process.env.QUESTION_DURATION || '3'),
      pauseDuration: parseFloat(process.env.PAUSE_DURATION || '3'),
      answerDuration: parseFloat(process.env.ANSWER_DURATION || '2'),
      totalDuration: parseFloat(process.env.TOTAL_CLIP_DURATION || '8'),
      countdownEnabled: process.env.COUNTDOWN_ENABLED !== 'false' // Default: enabled
    }
    
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
   * Generuje oddzielne audio dla pytania i odpowiedzi z kontrolą czasu
   */
  async generateQuestionAnswerAudio(options: {
    question: string
    answer: string
    voiceId?: string
    index?: number
  }): Promise<QuestionAnswerAudio> {
    logger.info(`Generating separate question/answer audio for index ${options.index || 0}`)
    
    const baseIndex = options.index || 0
    
    try {
      // Generuj audio dla pytania (bez słowa "Odpowiedź:")
      const questionResult = await this.generateVoice({
        text: options.question,
        voiceId: options.voiceId,
        timing: {
          maxDuration: this.timingConfig.questionDuration
        }
      })

      // Generuj audio dla odpowiedzi (bez słowa "Odpowiedź:")
      const answerResult = await this.generateVoice({
        text: options.answer,
        voiceId: options.voiceId,
        timing: {
          maxDuration: this.timingConfig.answerDuration
        }
      })

      // Przenieś pliki audio do właściwych nazw
      const questionAudioPath = path.join(this.tempDir, `voice_question_${baseIndex}.mp3`)
      const answerAudioPath = path.join(this.tempDir, `voice_answer_${baseIndex}.mp3`)

      await fs.copyFile(questionResult.audioPath, questionAudioPath)
      await fs.copyFile(answerResult.audioPath, answerAudioPath)

      // Sprawdź i przytnij audio jeśli za długie
      const finalQuestionAudio = await this.ensureAudioDuration(
        questionAudioPath, 
        this.timingConfig.questionDuration,
        baseIndex,
        'question'
      )
      
      const finalAnswerAudio = await this.ensureAudioDuration(
        answerAudioPath, 
        this.timingConfig.answerDuration,
        baseIndex,
        'answer'
      )

      logger.info(`Generated question/answer audio successfully for index ${baseIndex}`)
      
      return {
        questionAudio: finalQuestionAudio,
        answerAudio: finalAnswerAudio
      }

    } catch (error) {
      logger.error({ error, index: baseIndex }, 'Failed to generate question/answer audio')
      
      // Fallback - twórz ciszę
      const silentQuestionAudio = await this.createSilentAudio(
        `voice_question_${baseIndex}.mp3`, 
        this.timingConfig.questionDuration
      )
      const silentAnswerAudio = await this.createSilentAudio(
        `voice_answer_${baseIndex}.mp3`, 
        this.timingConfig.answerDuration
      )
      
      return {
        questionAudio: silentQuestionAudio,
        answerAudio: silentAnswerAudio
      }
    }
  }

  /**
   * Sprawdza długość audio i przycina jeśli za długie, lub dodaje ciszę jeśli za krótkie
   */
  private async ensureAudioDuration(
    audioPath: string, 
    targetDuration: number, 
    index: number,
    type: 'question' | 'answer'
  ): Promise<string> {
    try {
      // Sprawdź długość audio używając ffprobe
      const duration = await this.getAudioDuration(audioPath)
      
      if (Math.abs(duration - targetDuration) < 0.1) {
        // Długość jest w porządku
        return audioPath
      }

      const adjustedPath = path.join(this.tempDir, `voice_${type}_${index}_adjusted.mp3`)

      if (duration > targetDuration) {
        // Audio za długie - przytnij
        logger.info(`Audio too long (${duration}s), trimming to ${targetDuration}s`)
        await this.trimAudio(audioPath, adjustedPath, targetDuration)
      } else {
        // Audio za krótkie - dodaj ciszę na końcu
        logger.info(`Audio too short (${duration}s), padding to ${targetDuration}s`)
        await this.padAudio(audioPath, adjustedPath, targetDuration)
      }

      return adjustedPath

    } catch (error) {
      logger.warn({ error }, `Failed to adjust audio duration, using original`)
      return audioPath
    }
  }

  /**
   * Pobiera długość audio w sekundach
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        audioPath
      ])

      let output = ''
      ffprobe.stdout.on('data', (data) => {
        output += data.toString()
      })

      ffprobe.on('close', (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim())
          resolve(duration)
        } else {
          reject(new Error(`ffprobe failed with code ${code}`))
        }
      })

      ffprobe.on('error', reject)
    })
  }

  /**
   * Przycina audio do określonej długości
   */
  private async trimAudio(inputPath: string, outputPath: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-t', duration.toString(),
        '-c', 'copy',
        '-y',
        outputPath
      ])

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Audio trimming failed with code ${code}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  /**
   * Dodaje ciszę na końcu audio
   */
  private async padAudio(inputPath: string, outputPath: string, targetDuration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
        '-filter_complex', `[0:a][1:a]concat=n=2:v=0:a=1[out]`,
        '-map', '[out]',
        '-t', targetDuration.toString(),
        '-y',
        outputPath
      ])

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Audio padding failed with code ${code}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  /**
   * Tworzy ciszę o określonej długości
   */
  private async createSilentAudio(filename: string, duration: number): Promise<string> {
    const outputPath = path.join(this.tempDir, filename)
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'lavfi',
        '-i', `anullsrc=channel_layout=stereo:sample_rate=48000`,
        '-t', duration.toString(),
        '-y',
        outputPath
      ])

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath)
        } else {
          reject(new Error(`Silent audio creation failed with code ${code}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  /**
   * Pobiera konfigurację timing
   */
  getTimingConfig(): TimingConfig {
    return this.timingConfig
  }

  /**
   * Generuje audio stopera: tick-tick-dong dla odliczania 3-2-1
   */
  async generateCountdownAudio(index: number): Promise<string> {
    const outputPath = path.join(this.tempDir, `countdown_${index}.mp3`)
    
    if (!this.timingConfig.countdownEnabled) {
      logger.info('Countdown disabled, generating silent audio')
      await this.createSilentAudio(`countdown_${index}.mp3`, this.timingConfig.pauseDuration)
      return outputPath
    }

    try {
      logger.info(`Generating countdown audio for question ${index}`)
      
      // Ścieżki do plików dźwiękowych
      const tickPath = path.join(this.assetsDir, 'tick.mp3')
      const dongPath = path.join(this.assetsDir, 'dong.mp3')
      
      // Sprawdź czy pliki istnieją
      await fs.access(tickPath)
      await fs.access(dongPath)
      
      // Stwórz dodatkową ciszę między dźwiękami (0.9s ciszy + 0.1s dźwięk = 1s na cyfrę)
      const silenceShortPath = path.join(this.tempDir, `silence_short_${index}.mp3`)
      const silenceMediumPath = path.join(this.tempDir, `silence_medium_${index}.mp3`)
      
      await this.createSilentAudio(`silence_short_${index}.mp3`, 0.9) // 0.9s ciszy
      await this.createSilentAudio(`silence_medium_${index}.mp3`, 0.7) // 0.7s ciszy
      
      // Utwórz sekwencję: tick + cisza + tick + cisza + dong
      // Timeline: tick (0-1s), tick (1-2s), dong (2-3s)
      const audioSequence = [
        tickPath,        // 0.1s - cyfra "3"
        silenceShortPath, // 0.9s - cisza
        tickPath,        // 0.1s - cyfra "2" 
        silenceShortPath, // 0.9s - cisza
        dongPath,        // 0.3s - cyfra "1"
        silenceMediumPath // 0.7s - cisza do pełnych 3s
      ]
      
      // Połącz audio w sekwencję
      await this.concatenateCountdownAudio(audioSequence, outputPath)
      
      logger.info(`Countdown audio generated successfully: ${outputPath}`)
      return outputPath
      
    } catch (error) {
      logger.error({ error, index }, 'Failed to generate countdown audio, using fallback silence')
      await this.createSilentAudio(`countdown_${index}.mp3`, this.timingConfig.pauseDuration)
      return outputPath
    }
  }

  /**
   * Łączy pliki audio dla stopera
   */
  private async concatenateCountdownAudio(audioPaths: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const inputs = []
      for (let i = 0; i < audioPaths.length; i++) {
        inputs.push('-i', audioPaths[i])
      }
      
      const filterInputs = audioPaths.map((_, i) => `[${i}:a]`).join('')  
      const filterComplex = `${filterInputs}concat=n=${audioPaths.length}:v=0:a=1[out]`
      
      const ffmpegArgs = [
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[out]',
        '-c:a', 'mp3',
        '-b:a', '128k',
        '-y',
        outputPath
      ]

      logger.debug(`Concatenating countdown audio: ${ffmpegArgs.join(' ')}`)

      const ffmpeg = spawn('ffmpeg', ffmpegArgs)

      let stderr = ''
      
      ffmpeg.stdout.on('data', (data) => {
        logger.debug(`FFmpeg countdown stdout: ${data}`)
      })

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
        logger.debug(`FFmpeg countdown stderr: ${data}`)
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          logger.info('Countdown audio concatenation successful')
          resolve()
        } else {
          logger.error(`Countdown audio concatenation failed with code ${code}`)
          logger.error(`FFmpeg stderr: ${stderr}`)
          reject(new Error(`Countdown audio concatenation failed: ${stderr}`))
        }
      })

      ffmpeg.on('error', (error) => {
        logger.error({ error }, 'FFmpeg countdown process error')
        reject(error)
      })
    })
  }

  /**
   * Generuje audio intro z tekstem "Nie odpowiesz, odpadasz - {title}"
   */
  async generateIntroAudio(title: string, voiceId?: string): Promise<VoiceResult> {
    const introText = `Nie odpowiesz, odpadasz - ${title}`
    
    logger.info(`Generating intro audio: "${introText}"`)
    
    const options: VoiceOptions = {
      text: introText,
      voiceId: voiceId || process.env.ELEVENLABS_DEFAULT_VOICE,
      timing: {
        maxDuration: 5 // Maksymalnie 5 sekund dla intro
      }
    }
    
    return await this.generateVoice(options)
  }

  /**
   * Generuje audio dla pytań quizu - zmodyfikowana wersja używająca nowej metody
   */
  async generateQuizAudio(questions: Array<{question: string, answer: string}>): Promise<QuestionAnswerAudio[]> {
    const audioResults: QuestionAnswerAudio[] = []
    
    for (let i = 0; i < questions.length; i++) {
      try {
        const question = questions[i]
        
        logger.info(`Generating separate audio for question ${i + 1}/${questions.length}`)
        
        const result = await this.generateQuestionAnswerAudio({
          question: question.question,
          answer: question.answer,
          voiceId: process.env.ELEVENLABS_DEFAULT_VOICE,
          index: i
        })
        
        audioResults.push(result)
        
      } catch (error) {
        logger.error({ error, questionIndex: i }, 'Failed to generate quiz audio')
        throw error
      }
    }
    
    return audioResults
  }
} 