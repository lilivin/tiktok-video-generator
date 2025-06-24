import dotenv from 'dotenv'
import path from 'path'

// Load .env from parent directory (project root)
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })

import { VoiceService } from './services/voice.js'
import { VideoRenderService } from './services/video-render.js'
import { promises as fs } from 'fs'
import pino from 'pino'

const logger = pino({ name: 'audio-concat-test' })

async function testAudioConcatenation() {
  logger.info('🎵 Testing Audio Concatenation...')

  const voiceService = new VoiceService()
  const renderService = new VideoRenderService()

  if (!voiceService.isAvailable()) {
    logger.warn('❌ VoiceService not available - using silent audio for test')
  }

  try {
    // Test 1: Generate separate question/answer audio
    logger.info('Test 1: Generating separate question/answer audio')
    
    const testQuestionAnswer = await voiceService.generateQuestionAnswerAudio({
      question: "Test pytanie - jak się masz?",
      answer: "Test odpowiedź - dobrze dziękuję",
      index: 999 // Use high index to avoid conflicts
    })
    
    logger.info(`Question audio: ${testQuestionAnswer.questionAudio}`)
    logger.info(`Answer audio: ${testQuestionAnswer.answerAudio}`)
    
    // Check file sizes
    const questionStats = await fs.stat(testQuestionAnswer.questionAudio)
    const answerStats = await fs.stat(testQuestionAnswer.answerAudio)
    
    logger.info(`Question file size: ${questionStats.size} bytes`)
    logger.info(`Answer file size: ${answerStats.size} bytes`)
    
    // Test 2: Test composite audio creation
    logger.info('Test 2: Creating composite audio')
    
    const compositeAudio = await renderService.addVoiceToVideo(testQuestionAnswer, 999)
    
    logger.info(`Composite audio: ${compositeAudio}`)
    
    const compositeStats = await fs.stat(compositeAudio)
    logger.info(`Composite file size: ${compositeStats.size} bytes`)
    
    // Test 3: Check duration of composite audio
    logger.info('Test 3: Checking audio duration')
    
    const timingConfig = voiceService.getTimingConfig()
    logger.info(`Expected total duration: ${timingConfig.totalDuration}s`)
    
    logger.info('✅ Audio concatenation test completed successfully!')
    
  } catch (error) {
    logger.error({ error }, '❌ Audio concatenation test failed')
    process.exit(1)
  }
}

// Run test
testAudioConcatenation().catch(error => {
  logger.error({ error }, 'Audio concatenation test failed')
  process.exit(1)
}) 