import dotenv from 'dotenv'
import path from 'path'

// Load .env from parent directory (project root)
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })

import { VoiceService } from './services/voice.js'
import { promises as fs } from 'fs'
import pino from 'pino'

const logger = pino({ name: 'voice-test' })

async function testVoiceService() {
  logger.info('🎙️ Testing VoiceService...')

  const voiceService = new VoiceService()

  // Test 1: Service availability
  logger.info('Test 1: Checking service availability')
  const isAvailable = voiceService.isAvailable()
  logger.info(`VoiceService available: ${isAvailable}`)

  if (!isAvailable) {
    logger.warn('❌ VoiceService not available - check ELEVENLABS_API_KEY')
    return
  }

  // Test 2: Available voices
  logger.info('Test 2: Loading available voices')
  const voices = voiceService.getAvailableVoices()
  logger.info(`Available voices: ${voices.length}`)
  
  if (voices.length > 0) {
    logger.info('First 3 voices:')
    voices.slice(0, 3).forEach(voice => {
      logger.info(`- ${voice.name} (${voice.voice_id}) - ${voice.category}`)
    })
  }

  // Test 3: Generate voice for short text
  logger.info('Test 3: Generating voice for short text')
  try {
    const shortText = "Witaj! To jest test generowania mowy."
    const result1 = await voiceService.generateVoice({
      text: shortText,
      stability: 0.5,
      similarityBoost: 0.75
    })
    
    logger.info(`✅ Short text voice generated: ${result1.audioPath}`)
    
    // Check file exists and size
    const stats = await fs.stat(result1.audioPath)
    logger.info(`File size: ${stats.size} bytes`)
    
  } catch (error) {
    logger.error({ error }, '❌ Failed to generate voice for short text')
  }

  // Test 4: Generate voice for quiz question
  logger.info('Test 4: Generating voice for quiz question')
  try {
    const questionText = "Jaka jest stolica Polski? Odpowiedź: Warszawa"
    const result2 = await voiceService.generateVoice({
      text: questionText,
      stability: 0.4,
      similarityBoost: 0.8,
      style: 0.1
    })
    
    logger.info(`✅ Quiz question voice generated: ${result2.audioPath}`)
    
    const stats = await fs.stat(result2.audioPath)
    logger.info(`File size: ${stats.size} bytes`)
    
  } catch (error) {
    logger.error({ error }, '❌ Failed to generate voice for quiz question')
  }

  // Test 5: Generate voice for multiple questions (cache test)
  logger.info('Test 5: Testing cache with multiple questions')
  try {
    const questions = [
      { question: "Ile wynosi 2 + 2?", answer: "4" },
      { question: "Jaka jest stolica Francji?", answer: "Paryż" },
      { question: "Co to jest HTML?", answer: "Język znaczników" }
    ]
    
    const audioFiles = await voiceService.generateQuizAudio(questions)
    
    logger.info(`✅ Generated ${audioFiles.length} audio files for quiz`)
    
    for (let i = 0; i < audioFiles.length; i++) {
      const stats = await fs.stat(audioFiles[i])
      logger.info(`Question ${i + 1}: ${audioFiles[i]} (${stats.size} bytes)`)
    }
    
  } catch (error) {
    logger.error({ error }, '❌ Failed to generate quiz audio')
  }

  // Test 6: Cache test (regenerate same text)
  logger.info('Test 6: Testing cache (regenerating same text)')
  try {
    const repeatText = "Witaj! To jest test generowania mowy."
    const startTime = Date.now()
    
    const result3 = await voiceService.generateVoice({
      text: repeatText,
      stability: 0.5,
      similarityBoost: 0.75
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    logger.info(`✅ Cached voice generated in ${duration}ms: ${result3.audioPath}`)
    
  } catch (error) {
    logger.error({ error }, '❌ Failed cache test')
  }

  logger.info('🎉 VoiceService testing completed!')
}

// Run tests
testVoiceService().catch(error => {
  logger.error({ error }, 'Voice service test failed')
  process.exit(1)
}) 