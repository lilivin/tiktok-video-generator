import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import type { VideoGenerationJob } from '../types/video.js'
import { VideoRenderService } from './video-render.js'
import { QuestionAnswerAudio } from './voice.js'
import pino from 'pino'

const logger = pino({ name: 'queue-service' })

// Konfiguracja Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
}

const connection = new IORedis(redisConfig)

// Kolejka dla generowania wideo
export const videoQueue = new Queue('video-generation', { connection })

// Mapa jobów dla statusu
const jobsMap = new Map<string, VideoGenerationJob>()

// Worker do przetwarzania zadań
const videoWorker = new Worker(
  'video-generation',
  async (job: Job<VideoGenerationJob>) => {
    const jobData = job.data
    logger.info(`Starting video generation for job ${jobData.id}`)

    try {
      // Aktualizuj status
      updateJobStatus(jobData.id, {
        status: 'processing',
        progress: 10,
        message: 'Inicjowanie generowania wideo...'
      })

      const renderService = new VideoRenderService()
      
      // Krok 1: Generowanie teł AI (jeśli potrzebne)
      updateJobStatus(jobData.id, {
        progress: 20,
        message: 'Generowanie teł AI...'
      })
      
      const backgrounds = await renderService.generateBackgrounds(jobData.questions)
      
      // Krok 2: Generowanie lektora z nowym systemem timing (opcjonalnie)
      updateJobStatus(jobData.id, {
        progress: 40,
        message: 'Generowanie lektora z poprawnym timingiem...'
      })
      
      const audioFiles: QuestionAnswerAudio[] = await renderService.generateVoiceover(jobData.questions)
      
      // Krok 3: Kompozycja wideo
      updateJobStatus(jobData.id, {
        progress: 60,
        message: 'Kompozycja wideo z poprawnym timingiem audio...'
      })
      
      const videoPath = await renderService.renderVideo({
        title: jobData.title,
        questions: jobData.questions,
        backgrounds,
        audioFiles
      })
      
      // Krok 4: Finalizacja
      updateJobStatus(jobData.id, {
        progress: 90,
        message: 'Finalizacja...'
      })
      
      const videoUrl = await renderService.uploadVideo(videoPath, jobData.id)
      
      // Sukces
      updateJobStatus(jobData.id, {
        status: 'completed',
        progress: 100,
        message: 'Wideo gotowe!',
        videoUrl
      })
      
      logger.info(`Video generation completed for job ${jobData.id}`)
      
    } catch (error) {
      logger.error({ error, jobId: jobData.id }, 'Video generation failed')
      
      updateJobStatus(jobData.id, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Nieznany błąd',
        message: 'Generowanie nie powiodło się'
      })
      
      throw error
    }
  },
  {
    connection,
    concurrency: 1, // Jedna instancja na raz
    removeOnComplete: { count: 5 },
    removeOnFail: { count: 10 },
  }
)

// Event handlers
videoWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`)
})

videoWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Job failed')
})

// Funkcje pomocnicze
export function addVideoGenerationJob(jobData: VideoGenerationJob): Promise<void> {
  jobsMap.set(jobData.id, jobData)
  return videoQueue.add('generate-video', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  }).then(() => {})
}

export function getJobStatus(jobId: string): VideoGenerationJob | null {
  return jobsMap.get(jobId) || null
}

function updateJobStatus(jobId: string, updates: Partial<VideoGenerationJob>): void {
  const currentJob = jobsMap.get(jobId)
  if (currentJob) {
    const updatedJob = {
      ...currentJob,
      ...updates,
      updatedAt: new Date()
    }
    jobsMap.set(jobId, updatedJob)
  }
}

// Cleanup funkcja
export async function closeQueue(): Promise<void> {
  await videoWorker.close()
  await videoQueue.close()
  connection.disconnect()
} 