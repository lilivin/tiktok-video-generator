import { createWriteStream, promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import pino from 'pino'
import { QuizQuestion, VideoRenderOptions, DEFAULT_RENDER_OPTIONS } from '../types/video.js'
import { PromptGeneratorService } from './prompt-generator.js'
import { AIImageService, AIImageOptions } from './ai-image.js'
import { VoiceService, QuestionAnswerAudio, TimingConfig } from './voice.js'

const logger = pino({ name: 'video-render-service' })
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class VideoRenderService {
  private readonly outputDir: string
  private readonly tempDir: string
  private readonly promptGenerator: PromptGeneratorService
  private readonly aiImageService: AIImageService
  private readonly voiceService: VoiceService

  constructor() {
    this.outputDir = path.join(process.cwd(), 'outputs')
    this.tempDir = path.join(process.cwd(), 'temp')
    this.promptGenerator = new PromptGeneratorService()
    this.aiImageService = new AIImageService()
    this.voiceService = new VoiceService()
    this.ensureDirectories()
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true })
    await fs.mkdir(this.tempDir, { recursive: true })
  }

  async generateBackgrounds(questions: QuizQuestion[]): Promise<string[]> {
    logger.info('Generating AI backgrounds for questions')
    
    const backgrounds: string[] = []
    const isAIEnabled = process.env.AI_IMAGE_ENABLED === 'true'
    const aiAvailable = this.aiImageService.isAvailable()
    
    logger.info(`AI Image Generation - Enabled: ${isAIEnabled}, Available: ${aiAvailable}`)
    
    for (let i = 0; i < questions.length; i++) {
      try {
        const question = questions[i]
        
        // Jeśli pytanie ma obraz, użyj go
        if (question.image) {
          if (question.image.startsWith('data:')) {
            // Base64 image - save to temp file
            const imageBuffer = Buffer.from(question.image.split(',')[1], 'base64')
            const imagePath = path.join(this.tempDir, `question_${i}_image.jpg`)
            await fs.writeFile(imagePath, imageBuffer)
            backgrounds.push(imagePath)
          } else {
            // URL image
            backgrounds.push(question.image)
          }
        } else if (isAIEnabled && aiAvailable) {
          // Generuj tło przez AI
          logger.info(`Generating AI background for question ${i}`)
          const backgroundPath = await this.generateAIBackground(question.question, i)
          backgrounds.push(backgroundPath)
        } else {
          // Fallback - gradient tło
          logger.info(`Using fallback background for question ${i}`)
          const backgroundPath = await this.createFallbackBackground(i)
          backgrounds.push(backgroundPath)
        }
      } catch (error) {
        logger.warn({ error, questionIndex: i }, 'Failed to generate background, using fallback')
        // Fallback - gradient tło
        backgrounds.push(await this.createFallbackBackground(i))
      }
    }
    
    return backgrounds
  }

  private async generateAIBackground(questionText: string, index: number): Promise<string> {
    try {
      logger.info(`Starting AI background generation for question ${index}: "${questionText.substring(0, 50)}..."`)
      
      // Analizuj pytanie i wygeneruj kontekst
      const context = this.promptGenerator.analyzeQuestion(questionText)
      logger.info(`Question analysis complete - Category: ${context.category}, Style: ${context.style}`)
      
      // Wygeneruj prompt dla AI
      const prompt = this.promptGenerator.generatePrompt(context, questionText)
      logger.info(`Generated AI prompt: "${prompt.substring(0, 100)}..."`)
      
      // Przygotuj opcje dla AI
      const aiOptions: AIImageOptions = {
        prompt,
        size: '1024x1792', // Vertical for TikTok
        quality: (process.env.AI_IMAGE_QUALITY as 'standard' | 'hd') || 'standard',
        style: context.style === 'dramatic' ? 'vivid' : 'natural',
        provider: (process.env.AI_IMAGE_PROVIDER as 'openai' | 'replicate') || undefined
      }
      
      // Wygeneruj obraz
      const result = await this.aiImageService.generateImage(aiOptions)
      
      logger.info(`AI background generated successfully for question ${index} using ${result.provider}`)
      
      // Opcjonalnie skaluj obraz do odpowiedniego rozmiaru
      const scaledImagePath = await this.scaleImageIfNeeded(result.imagePath, index)
      
      return scaledImagePath
      
    } catch (error) {
      logger.error({ error, questionIndex: index }, 'AI background generation failed')
      throw error
    }
  }

  private async scaleImageIfNeeded(imagePath: string, index: number): Promise<string> {
    try {
      // Sprawdź wymiary obrazu i przeskaluj jeśli potrzeba
      const scaledPath = path.join(this.tempDir, `ai_background_scaled_${index}.png`)
      
      // Używamy FFmpeg do skalowania obrazu do 1080x1920
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', imagePath,
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
          '-y',
          scaledPath
        ])

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve()
          } else {
            reject(new Error(`FFmpeg scaling failed with code ${code}`))
          }
        })

        ffmpeg.on('error', reject)
      })
      
      logger.info(`Image scaled successfully: ${scaledPath}`)
      return scaledPath
      
    } catch (error) {
      logger.warn({ error }, 'Image scaling failed, using original')
      return imagePath
    }
  }

  private async createFallbackBackground(index: number): Promise<string> {
    const gradients = [
      'gradient:#667eea-#764ba2', // Purple gradient
      'gradient:#f093fb-#f5576c', // Pink gradient  
      'gradient:#4facfe-#00f2fe', // Blue gradient
      'gradient:#43e97b-#38f9d7', // Green gradient
      'gradient:#fa709a-#fee140'  // Orange gradient
    ]
    
    const gradient = gradients[index % gradients.length]
    
    // Tworzymy piękny gradientowy obraz PNG używając ImageMagick
    const backgroundPath = path.join(this.tempDir, `background_${index}.png`)
    
    try {
      // Próbujemy użyć ImageMagick do stworzenia gradientu
      await this.createGradientImage(backgroundPath, gradient, 1080, 1920)
      logger.info(`Created gradient background: ${backgroundPath}`)
    } catch (error) {
      // Fallback - tworzymy prosty kolorowy obraz
      logger.warn('ImageMagick gradient failed, creating simple color background')
      try {
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a']
        const color = colors[index % colors.length]
        await this.createColorImage(backgroundPath, color, 1080, 1920)
      } catch (error2) {
        // Last resort - create a programmatic background
        logger.warn('ImageMagick not available, creating programmatic background')
        await this.createProgrammaticBackground(backgroundPath, index)
      }
    }
    
    return backgroundPath
  }

  private createGradientImage(outputPath: string, gradient: string, width: number, height: number): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Creating gradient image: ${outputPath} with gradient ${gradient}`)
      
      const convert = spawn('magick', [
        '-size', `${width}x${height}`,
        gradient,
        outputPath
      ])

      convert.stdout.on('data', (data) => {
        logger.debug(`ImageMagick gradient stdout: ${data}`)
      })

      convert.stderr.on('data', (data) => {
        logger.debug(`ImageMagick gradient stderr: ${data}`)
      })

      convert.on('close', (code) => {
        logger.info(`ImageMagick gradient process closed with code ${code}`)
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`ImageMagick gradient creation failed with code ${code}`))
        }
      })

      convert.on('error', (error) => {
        logger.error({ error }, 'ImageMagick gradient process error')
        reject(error)
      })
    })
  }

  private async createProgrammaticBackground(outputPath: string, index: number): Promise<void> {
    // Create a simple colored PNG programmatically as last resort
    const colors = [
      { r: 102, g: 126, b: 234 }, // #667eea
      { r: 240, g: 147, b: 251 }, // #f093fb
      { r: 79, g: 172, b: 254 },  // #4facfe
      { r: 67, g: 233, b: 123 },  // #43e97b
      { r: 250, g: 112, b: 154 }  // #fa709a
    ]
    
    const color = colors[index % colors.length]
    
    // Use FFmpeg to create a colored background as backup
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'lavfi',
        '-i', `color=c=#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}:size=1080x1920:duration=1`,
        '-frames:v', '1',
        '-y',
        outputPath
      ])

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg background creation failed with code ${code}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  private createColorImage(outputPath: string, color: string, width: number, height: number): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Creating color image: ${outputPath} with color ${color}`)
      
      const convert = spawn('magick', [
        '-size', `${width}x${height}`,
        `xc:${color}`,
        outputPath
      ])

      convert.stdout.on('data', (data) => {
        logger.debug(`ImageMagick stdout: ${data}`)
      })

      convert.stderr.on('data', (data) => {
        logger.debug(`ImageMagick stderr: ${data}`)
      })

      convert.on('close', (code) => {
        logger.info(`ImageMagick process closed with code ${code}`)
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`ImageMagick convert failed with code ${code}`))
        }
      })

      convert.on('error', (error) => {
        logger.error({ error }, 'ImageMagick process error')
        reject(error)
      })
    })
  }

  async generateVoiceover(questions: QuizQuestion[]): Promise<QuestionAnswerAudio[]> {
    logger.info('Generating voiceover for questions with improved timing')
    
    const audioResults: QuestionAnswerAudio[] = []
    const isVoiceEnabled = process.env.VOICE_ENABLED === 'true'
    const voiceAvailable = this.voiceService.isAvailable()
    
    logger.info(`Voice Generation - Enabled: ${isVoiceEnabled}, Available: ${voiceAvailable}`)
    
    for (let i = 0; i < questions.length; i++) {
      try {
        const question = questions[i]
        
        if (isVoiceEnabled && voiceAvailable) {
          // Generuj oddzielne audio używając nowej metody VoiceService
          logger.info(`Generating separate question/answer audio for question ${i}`)
          const audioResult = await this.voiceService.generateQuestionAnswerAudio({
            question: question.question,
            answer: question.answer,
            voiceId: process.env.ELEVENLABS_DEFAULT_VOICE,
            index: i
          })
          audioResults.push(audioResult)
        } else {
          // Fallback - cisza
          logger.info(`Using silence for question ${i}`)
          const silentAudio = await this.createSilentQuestionAnswerAudio(i)
          audioResults.push(silentAudio)
        }
      } catch (error) {
        logger.warn({ error, questionIndex: i }, 'Failed to generate voice, using silence')
        // Fallback - cisza
        const silentAudio = await this.createSilentQuestionAnswerAudio(i)
        audioResults.push(silentAudio)
      }
    }
    
    return audioResults
  }

  /**
   * Tworzy strukturę audio z ciszą dla fallback
   */
  private async createSilentQuestionAnswerAudio(index: number): Promise<QuestionAnswerAudio> {
    const timingConfig = this.voiceService.getTimingConfig()
    
    const questionPath = path.join(this.tempDir, `silent_question_${index}.mp3`)
    const answerPath = path.join(this.tempDir, `silent_answer_${index}.mp3`)
    
    await this.generateSilentAudio(questionPath, timingConfig.questionDuration)
    await this.generateSilentAudio(answerPath, timingConfig.answerDuration)
    
    return {
      questionAudio: questionPath,
      answerAudio: answerPath
    }
  }

  /**
   * Generuje pojedynczy kompozytowy plik audio z odpowiednim timingiem
   * Timeline: Pytanie (0-2s) → Cisza (2-5s) → Odpowiedź (5-8s)
   */
  async addVoiceToVideo(audioResult: QuestionAnswerAudio, index: number): Promise<string> {
    const timingConfig = this.voiceService.getTimingConfig()
    const outputPath = path.join(this.tempDir, `composite_audio_${index}.mp3`)
    
    try {
      logger.info(`Creating composite audio with timing for question ${index}`)
      logger.debug(`Question audio: ${audioResult.questionAudio}`)
      logger.debug(`Answer audio: ${audioResult.answerAudio}`)
      
      // Sprawdź czy pliki audio istnieją
      try {
        await fs.access(audioResult.questionAudio)
        await fs.access(audioResult.answerAudio)
        logger.debug('Both audio files exist')
      } catch (error) {
        logger.error({ error }, 'Audio files do not exist')
        throw new Error('Required audio files do not exist')
      }
      
      // Twórz plik ciszy dla pauzy
      const pausePath = path.join(this.tempDir, `pause_${index}.mp3`)
      logger.debug(`Creating pause audio: ${pausePath}`)
      await this.generateSilentAudio(pausePath, timingConfig.pauseDuration)
      
      // Sprawdź czy plik pauzy został utworzony
      await fs.access(pausePath)
      logger.debug('Pause audio created successfully')
      
      const audioFilesToConcat = [
        audioResult.questionAudio,
        pausePath,
        audioResult.answerAudio
      ]
      
      logger.info(`Concatenating audio files: ${audioFilesToConcat.join(', ')}`)
      
      // Łącz audio w odpowiedniej kolejności: pytanie + pauza + odpowiedź
      await this.concatenateAudioFiles(audioFilesToConcat, outputPath)
      
      // Sprawdź czy plik wyjściowy został utworzony
      try {
        await fs.access(outputPath)
        const stats = await fs.stat(outputPath)
        logger.info(`Composite audio created successfully: ${outputPath} (${stats.size} bytes)`)
      } catch (error) {
        logger.error({ error }, 'Output composite audio file was not created')
        throw new Error('Output composite audio file was not created')
      }
      
      // Sprawdź czy całkowita długość to 8 sekund i dopasuj jeśli potrzeba
      const finalPath = await this.ensureTotalAudioDuration(outputPath, timingConfig.totalDuration, index)
      
      logger.info(`Created composite audio successfully: ${finalPath}`)
      return finalPath
      
    } catch (error) {
      logger.error({ error, index }, 'Failed to create composite audio, using fallback')
      logger.error(`Error details: ${error instanceof Error ? error.message : String(error)}`)
      
      // Fallback - zwróć ciszę o długości 8 sekund
      await this.generateSilentAudio(outputPath, timingConfig.totalDuration)
      return outputPath
    }
  }

  /**
   * Łączy pliki audio w jeden z re-enkodowaniem (alternatywa gdy copy nie działa)
   */
  private async concatenateAudioFilesWithReencode(audioPaths: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Użyj filter_complex ale z poprawną składnią
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
        '-c:a', 'mp3',  // Force MP3 encoding
        '-b:a', '128k', // Set bitrate
        '-y',
        outputPath
      ]

      logger.info(`Concatenating audio files with re-encode: ${audioPaths.join(', ')}`)
      logger.debug(`FFmpeg args: ${ffmpegArgs.join(' ')}`)

      const ffmpeg = spawn('ffmpeg', ffmpegArgs)

      let stderr = ''
      
      ffmpeg.stdout.on('data', (data) => {
        logger.debug(`FFmpeg concat stdout: ${data}`)
      })

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
        logger.debug(`FFmpeg concat stderr: ${data}`)
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          logger.info('Audio concatenation with re-encode successful')
          resolve()
        } else {
          logger.error(`Audio concatenation with re-encode failed with code ${code}`)
          logger.error(`FFmpeg stderr: ${stderr}`)
          reject(new Error(`Audio concatenation failed with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', (error) => {
        logger.error({ error }, 'FFmpeg concat with re-encode process error')
        reject(error)
      })
    })
  }

  /**
   * Łączy pliki audio w jeden
   */
  private async concatenateAudioFiles(audioPaths: string[], outputPath: string): Promise<void> {
    // Tymczasowo używamy zawsze re-encode dla debugowania
    logger.info('Using re-encode concatenation method for better compatibility')
    await this.concatenateAudioFilesWithReencode(audioPaths, outputPath)
  }

  /**
   * Zapewnia że audio ma dokładnie określoną długość
   */
  private async ensureTotalAudioDuration(audioPath: string, targetDuration: number, index: number): Promise<string> {
    try {
      // Sprawdź aktualną długość
      const currentDuration = await this.getAudioDuration(audioPath)
      
      if (Math.abs(currentDuration - targetDuration) < 0.1) {
        // Długość jest w porządku
        return audioPath
      }

      const adjustedPath = path.join(this.tempDir, `composite_audio_${index}_final.mp3`)

      if (currentDuration > targetDuration) {
        // Za długie - przytnij
        logger.info(`Composite audio too long (${currentDuration}s), trimming to ${targetDuration}s`)
        await this.trimAudio(audioPath, adjustedPath, targetDuration)
      } else {
        // Za krótkie - dodaj ciszę na końcu
        logger.info(`Composite audio too short (${currentDuration}s), padding to ${targetDuration}s`)
        await this.padAudio(audioPath, adjustedPath, targetDuration)
      }

      return adjustedPath

    } catch (error) {
      logger.warn({ error }, 'Failed to adjust total audio duration, using original')
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
   * Generuje ciszę o określonej długości
   */
  private generateSilentAudio(outputPath: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'lavfi',
        '-i', `anullsrc=channel_layout=stereo:sample_rate=48000`,
        '-t', duration.toString(),
        '-y', // overwrite
        outputPath
      ])

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg failed with code ${code}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  async renderVideo(options: {
    title: string
    questions: QuizQuestion[]
    backgrounds: string[]
    audioFiles: QuestionAnswerAudio[]
  }): Promise<string> {
    logger.info('Creating video with FFmpeg using improved audio timing')
    logger.info(`Title: ${options.title}`)
    logger.info(`Questions count: ${options.questions.length}`)
    logger.info(`Backgrounds count: ${options.backgrounds.length}`)
    logger.info(`Audio results count: ${options.audioFiles.length}`)
    
    try {
      const outputPath = path.join(this.outputDir, `quiz_video_${Date.now()}.mp4`)
      logger.info(`Output path: ${outputPath}`)
      
      // Check if we have proper backgrounds and questions
      if (options.backgrounds.length > 0 && options.questions.length > 0) {
        logger.info('Creating proper quiz video with backgrounds and improved audio timing')
        await this.createQuizVideo(outputPath, options)
      } else {
        logger.info('Missing backgrounds or questions, creating fallback video')
        await this.createTextVideo(outputPath, options.title, options.questions)
      }
      
      logger.info(`Video created successfully: ${outputPath}`)
      return outputPath

    } catch (error) {
      logger.error({ error }, 'Video creation failed')
      throw error
    }
  }

  private async createQuizVideo(outputPath: string, options: {
    title: string
    questions: QuizQuestion[]
    backgrounds: string[]
    audioFiles: QuestionAnswerAudio[]
  }): Promise<void> {
    logger.info('Creating quiz video with multiple segments and improved audio timing')
    
    // Create individual video segments for each question
    const segmentPaths: string[] = []
    
    for (let i = 0; i < options.questions.length && i < options.backgrounds.length; i++) {
      const segmentPath = path.join(this.tempDir, `segment_${i}.mp4`)
      const question = options.questions[i]
      const background = options.backgrounds[i]
      const audioResult = options.audioFiles[i] || await this.createSilentQuestionAnswerAudio(i)
      
      // Twórz kompozytowy plik audio z odpowiednim timingiem
      const compositeAudioPath = await this.addVoiceToVideo(audioResult, i)
      
      await this.createQuestionSegment(segmentPath, question, background, compositeAudioPath, i)
      segmentPaths.push(segmentPath)
    }
    
    // Concatenate all segments
    await this.concatenateSegments(segmentPaths, outputPath)
    
    // Cleanup segment files
    await this.cleanup(segmentPaths)
  }

  private async createQuestionSegment(
    outputPath: string, 
    question: QuizQuestion, 
    backgroundPath: string, 
    audioPath: string,
    index: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Creating segment ${index}: ${question.question.substring(0, 50)}...`)
      
      // Escape text for FFmpeg
      const escapedQuestion = this.escapeFFmpegText(question.question)
      const escapedAnswer = this.escapeFFmpegText(question.answer)
      
      // Use available system font with fallback
      const fontPath = '/System/Library/Fonts/Helvetica.ttc'
      
      const ffmpegArgs = [
        '-loop', '1',
        '-i', backgroundPath,
        '-i', audioPath,
        '-filter_complex', `
          [0:v]scale=1080:1920,setsar=1[bg];
          [bg]drawtext=fontfile=${fontPath}:text='${escapedQuestion}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.7:boxborderw=10:x=(w-text_w)/2:y=(h-text_h)/2-100[q];
          [q]drawtext=fontfile=${fontPath}:text='${escapedAnswer}':fontcolor=yellow:fontsize=42:box=1:boxcolor=black@0.7:boxborderw=8:x=(w-text_w)/2:y=(h-text_h)/2+100[v]
        `,
        '-map', '[v]',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-t', '8', // 8 seconds per question
        '-pix_fmt', 'yuv420p',
        '-r', '25',
        '-y',
        outputPath
      ]

      const ffmpeg = spawn('ffmpeg', ffmpegArgs)

      let stderr = ''
      
      ffmpeg.stdout.on('data', (data) => {
        logger.debug(`FFmpeg stdout: ${data}`)
      })

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
        logger.debug(`FFmpeg stderr: ${data}`)
      })

      ffmpeg.on('close', (code) => {
        logger.info(`FFmpeg segment ${index} process closed with code ${code}`)
        if (code === 0) {
          resolve()
        } else {
          logger.error(`FFmpeg stderr: ${stderr}`)
          reject(new Error(`FFmpeg segment creation failed with code ${code}`))
        }
      })

      ffmpeg.on('error', (error) => {
        logger.error({ error }, 'FFmpeg segment process error')
        reject(error)
      })
    })
  }

  private escapeFFmpegText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
  }

  private async concatenateSegments(segmentPaths: string[], outputPath: string): Promise<void> {
    logger.info(`Concatenating ${segmentPaths.length} segments`)
    
    // Create a file list for FFmpeg concat
    const fileListPath = path.join(this.tempDir, 'file_list.txt')
    const fileListContent = segmentPaths.map(p => `file '${p}'`).join('\n')
    await fs.writeFile(fileListPath, fileListContent)
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', fileListPath,
        '-c', 'copy',
        '-y',
        outputPath
      ])

      ffmpeg.stdout.on('data', (data) => {
        logger.debug(`FFmpeg concat stdout: ${data}`)
      })

      ffmpeg.stderr.on('data', (data) => {
        logger.debug(`FFmpeg concat stderr: ${data}`)
      })

      ffmpeg.on('close', (code) => {
        logger.info(`FFmpeg concat process closed with code ${code}`)
        // Cleanup file list
        fs.unlink(fileListPath).catch(() => {})
        
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg concatenation failed with code ${code}`))
        }
      })

      ffmpeg.on('error', (error) => {
        logger.error({ error }, 'FFmpeg concat process error')
        reject(error)
      })
    })
  }

  private async createTextVideo(outputPath: string, title: string, questions: QuizQuestion[]): Promise<void> {
    // Tworzymy bardzo podstawowe wideo z kolorowym tłem
    return new Promise((resolve, reject) => {
      logger.info(`Creating text video: ${outputPath}`)
      
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'lavfi',
        '-i', 'color=c=blue:size=1080x1920:duration=10',
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-y', // overwrite
        outputPath
      ])

      ffmpeg.stdout.on('data', (data) => {
        logger.debug(`FFmpeg stdout: ${data}`)
      })

      ffmpeg.stderr.on('data', (data) => {
        logger.debug(`FFmpeg stderr: ${data}`)
      })

      ffmpeg.on('close', (code) => {
        logger.info(`FFmpeg process closed with code ${code}`)
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg text video creation failed with code ${code}`))
        }
      })

      ffmpeg.on('error', (error) => {
        logger.error({ error }, 'FFmpeg process error')
        reject(error)
      })
    })
  }

  async uploadVideo(videoPath: string, jobId: string): Promise<string> {
    // W rzeczywistej implementacji uploadowałbyś do S3/CloudFlare/etc.
    // Na razie zwracamy lokalną ścieżkę jako URL
    const fileName = path.basename(videoPath)
    const publicUrl = `/api/video/download/${jobId}/${fileName}`
    
    logger.info(`Video available at: ${publicUrl}`)
    return publicUrl
  }

  async cleanup(patterns: string[]): Promise<void> {
    // Usuń pliki tymczasowe
    for (const pattern of patterns) {
      try {
        await fs.unlink(pattern)
      } catch (error) {
        logger.warn({ error, pattern }, 'Failed to cleanup file')
      }
    }
  }
} 