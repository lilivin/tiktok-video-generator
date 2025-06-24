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

  // Test 5: Generate voice for multiple questions (cache test) - UPDATED
  logger.info('Test 5: Testing new question/answer audio generation with timing')
  try {
    const questions = [
      { question: "Ile wynosi 2 + 2?", answer: "4" },
      { question: "Jaka jest stolica Francji?", answer: "Paryż" },
      { question: "Co to jest HTML?", answer: "Język znaczników" }
    ]
    
    const audioResults = await voiceService.generateQuizAudio(questions)
    
    logger.info(`✅ Generated ${audioResults.length} audio result pairs for quiz`)
    
    for (let i = 0; i < audioResults.length; i++) {
      const result = audioResults[i]
      const questionStats = await fs.stat(result.questionAudio)
      const answerStats = await fs.stat(result.answerAudio)
      
      logger.info(`Question ${i + 1}:`)
      logger.info(`  - Question audio: ${result.questionAudio} (${questionStats.size} bytes)`)  
      logger.info(`  - Answer audio: ${result.answerAudio} (${answerStats.size} bytes)`)
    }
    
  } catch (error) {
    logger.error({ error }, '❌ Failed to generate new quiz audio system')
  }

  // Test 6: Test individual question/answer generation
  logger.info('Test 6: Testing individual question/answer audio generation')
  try {
    const singleResult = await voiceService.generateQuestionAnswerAudio({
      question: "Jak nazywa się największa planeta Układu Słonecznego?",
      answer: "Jowisz",
      index: 0
    })
    
    logger.info(`✅ Individual question/answer audio generated`)
    logger.info(`Question audio: ${singleResult.questionAudio}`)
    logger.info(`Answer audio: ${singleResult.answerAudio}`)
    
    // Check timing configuration
    const timingConfig = voiceService.getTimingConfig()
    logger.info(`Timing configuration:`)
    logger.info(`  - Question duration: ${timingConfig.questionDuration}s`)
    logger.info(`  - Pause duration: ${timingConfig.pauseDuration}s`)
    logger.info(`  - Answer duration: ${timingConfig.answerDuration}s`)
    logger.info(`  - Total duration: ${timingConfig.totalDuration}s`)
    
  } catch (error) {
    logger.error({ error }, '❌ Failed individual question/answer generation test')
  }

  // Test 7: Cache test (regenerate same text) - UPDATED
  logger.info('Test 7: Testing cache (regenerating same text)')
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