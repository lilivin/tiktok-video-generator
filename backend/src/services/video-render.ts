import { createWriteStream, promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import pino from 'pino'
import { QuizQuestion, VideoRenderOptions, DEFAULT_RENDER_OPTIONS } from '../types/video.js'

const logger = pino({ name: 'video-render-service' })
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class VideoRenderService {
  private readonly outputDir: string
  private readonly tempDir: string

  constructor() {
    this.outputDir = path.join(process.cwd(), 'outputs')
    this.tempDir = path.join(process.cwd(), 'temp')
    this.ensureDirectories()
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true })
    await fs.mkdir(this.tempDir, { recursive: true })
  }

  async generateBackgrounds(questions: QuizQuestion[]): Promise<string[]> {
    logger.info('Generating AI backgrounds for questions')
    
    const backgrounds: string[] = []
    
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
        } else {
          // Generuj tło przez Replicate (jeśli jest API key) lub użyj fallback
          const backgroundPath = await this.generateAIBackground(question.question, i)
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
    // Sprawdź czy jest klucz API do Replicate
    const replicateToken = process.env.REPLICATE_API_TOKEN
    
    if (!replicateToken) {
      logger.info(`No Replicate API key, using fallback background for question ${index}`)
      return this.createFallbackBackground(index)
    }

    try {
      // Tutaj będzie implementacja Replicate API
      logger.info(`Generating AI background for question ${index}: "${questionText}"`)
      
      // Na razie fallback - w następnym kroku dodamy prawdziwe AI
      return this.createFallbackBackground(index)
      
    } catch (error) {
      logger.warn({ error }, 'Failed to generate AI background, using fallback')
      return this.createFallbackBackground(index)
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

  async generateVoiceover(questions: QuizQuestion[]): Promise<string[]> {
    logger.info('Generating voiceover for questions')
    
    const audioFiles: string[] = []
    
    for (let i = 0; i < questions.length; i++) {
      try {
        const question = questions[i]
        const text = `${question.question}. Odpowiedź: ${question.answer}`
        
        // Generuj TTS jeśli jest klucz API, inaczej cisza
        const audioPath = await this.generateTTS(text, i)
        audioFiles.push(audioPath)
      } catch (error) {
        logger.warn({ error, questionIndex: i }, 'Failed to generate TTS, using silence')
        // Fallback - cisza
        audioFiles.push(await this.createSilenceAudio(i))
      }
    }
    
    return audioFiles
  }

  private async generateTTS(text: string, index: number): Promise<string> {
    const elevenlabsKey = process.env.ELEVENLABS_API_KEY
    
    if (!elevenlabsKey) {
      logger.info(`No ElevenLabs API key, using silence for question ${index}`)
      return this.createSilenceAudio(index)
    }

    try {
      // Tutaj będzie implementacja ElevenLabs TTS
      logger.info(`Generating TTS for question ${index}: "${text.substring(0, 50)}..."`)
      
      // Na razie fallback - w następnym kroku dodamy prawdziwe TTS
      return this.createSilenceAudio(index)
      
    } catch (error) {
      logger.warn({ error }, 'Failed to generate TTS, using silence')
      return this.createSilenceAudio(index)
    }
  }

  private async createSilenceAudio(index: number): Promise<string> {
    // Tworzymy pusty plik audio używając FFmpeg
    const audioPath = path.join(this.tempDir, `silence_${index}.mp3`)
    
    try {
      await this.generateSilentAudio(audioPath, 10) // 10 sekund ciszy
    } catch (error) {
      // Fallback - pusty plik
      await fs.writeFile(audioPath, Buffer.alloc(100))
    }
    
    return audioPath
  }

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
    audioFiles: string[]
  }): Promise<string> {
    logger.info('Creating video with FFmpeg')
    logger.info(`Title: ${options.title}`)
    logger.info(`Questions count: ${options.questions.length}`)
    logger.info(`Backgrounds count: ${options.backgrounds.length}`)
    logger.info(`Audio files count: ${options.audioFiles.length}`)
    
    try {
      const outputPath = path.join(this.outputDir, `quiz_video_${Date.now()}.mp4`)
      logger.info(`Output path: ${outputPath}`)
      
      // Check if we have proper backgrounds and questions
      if (options.backgrounds.length > 0 && options.questions.length > 0) {
        logger.info('Creating proper quiz video with backgrounds and text overlays')
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
    audioFiles: string[]
  }): Promise<void> {
    logger.info('Creating quiz video with multiple segments')
    
    // Create individual video segments for each question
    const segmentPaths: string[] = []
    
    for (let i = 0; i < options.questions.length && i < options.backgrounds.length; i++) {
      const segmentPath = path.join(this.tempDir, `segment_${i}.mp4`)
      const question = options.questions[i]
      const background = options.backgrounds[i]
      const audioFile = options.audioFiles[i] || await this.createSilenceAudio(i)
      
      await this.createQuestionSegment(segmentPath, question, background, audioFile, i)
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