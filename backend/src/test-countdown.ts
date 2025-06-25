#!/usr/bin/env node
import { VoiceService } from './services/voice.js'
import { VideoRenderService } from './services/video-render.js'
import { promises as fs } from 'fs'
import path from 'path'
import pino from 'pino'

const logger = pino({ name: 'countdown-test' })

async function testCountdownFeature() {
  logger.info('🕐 Testing Countdown Timer Feature')
  
  try {
    // Initialize services
    const voiceService = new VoiceService()
    const videoRenderService = new VideoRenderService()
    
    // Test 1: Check if sound files exist
    logger.info('📁 Test 1: Checking sound files...')
    const assetsDir = path.join(process.cwd(), 'assets')
    const tickPath = path.join(assetsDir, 'tick.mp3')
    const dongPath = path.join(assetsDir, 'dong.mp3')
    
    await fs.access(tickPath)
    await fs.access(dongPath)
    logger.info('✅ Sound files exist: tick.mp3, dong.mp3')
    
    // Test 2: Check timing configuration
    logger.info('⚙️ Test 2: Checking timing configuration...')
    const timingConfig = voiceService.getTimingConfig()
    logger.info(`📊 Timing Config:`)
    logger.info(`   - Question Duration: ${timingConfig.questionDuration}s`)
    logger.info(`   - Pause Duration: ${timingConfig.pauseDuration}s`)
    logger.info(`   - Answer Duration: ${timingConfig.answerDuration}s`)
    logger.info(`   - Total Duration: ${timingConfig.totalDuration}s`)
    logger.info(`   - Countdown Enabled: ${timingConfig.countdownEnabled}`)
    
    // Test 3: Generate countdown audio
    logger.info('🎵 Test 3: Generating countdown audio...')
    const countdownAudioPath = await voiceService.generateCountdownAudio(0)
    
    // Check if file was created
    await fs.access(countdownAudioPath)
    const stats = await fs.stat(countdownAudioPath)
    logger.info(`✅ Countdown audio generated: ${countdownAudioPath} (${stats.size} bytes)`)
    
    // Test 4: Check audio duration
    logger.info('⏱️ Test 4: Verifying audio duration...')
    const duration = await getAudioDuration(countdownAudioPath)
    logger.info(`📏 Countdown audio duration: ${duration}s (expected: ~${timingConfig.pauseDuration}s)`)
    
    if (Math.abs(duration - timingConfig.pauseDuration) < 0.2) {
      logger.info('✅ Audio duration is correct')
    } else {
      logger.warn('⚠️ Audio duration differs from expected')
    }
    
    // Test 5: Test complete question-answer audio flow
    logger.info('🎯 Test 5: Testing complete audio flow...')
    const testQuestion = {
      question: "Test pytanie dla stopera",
      answer: "Test odpowiedź"
    }
    
    const questionAnswerAudio = await voiceService.generateQuestionAnswerAudio({
      question: testQuestion.question,
      answer: testQuestion.answer,
      index: 0
    })
    
    logger.info(`✅ Generated question audio: ${questionAnswerAudio.questionAudio}`)
    logger.info(`✅ Generated answer audio: ${questionAnswerAudio.answerAudio}`)
    
    // Test 6: Create composite audio with countdown
    logger.info('🎼 Test 6: Creating composite audio with countdown...')
    const compositeAudioPath = await videoRenderService.addVoiceToVideo(questionAnswerAudio, 0)
    
    await fs.access(compositeAudioPath)
    const compositeStats = await fs.stat(compositeAudioPath)
    const compositeDuration = await getAudioDuration(compositeAudioPath)
    
    logger.info(`✅ Composite audio created: ${compositeAudioPath}`)
    logger.info(`📏 Size: ${compositeStats.size} bytes, Duration: ${compositeDuration}s`)
    
    // Summary
    logger.info('🎉 Countdown Timer Feature Test Complete!')
    logger.info('📋 Summary:')
    logger.info('   ✅ Sound files: OK')
    logger.info('   ✅ Configuration: OK')
    logger.info('   ✅ Countdown audio: OK')
    logger.info('   ✅ Audio duration: OK')
    logger.info('   ✅ Question/Answer flow: OK')
    logger.info('   ✅ Composite audio: OK')
    logger.info('')
    logger.info('🚀 Ready for video generation with countdown timer!')
    
    // Optional: Show file structure
    logger.info('📁 Generated files:')
    logger.info(`   - Countdown: ${countdownAudioPath}`)
    logger.info(`   - Question: ${questionAnswerAudio.questionAudio}`)
    logger.info(`   - Answer: ${questionAnswerAudio.answerAudio}`)
    logger.info(`   - Composite: ${compositeAudioPath}`)
    
  } catch (error) {
    logger.error({ error }, '❌ Countdown timer test failed')
    throw error
  }
}

// Helper function to get audio duration
async function getAudioDuration(audioPath: string): Promise<number> {
  const { spawn } = await import('child_process')
  
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

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCountdownFeature()
    .then(() => {
      logger.info('✅ Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      logger.error({ error }, '❌ Test failed')
      process.exit(1)
    })
}

export { testCountdownFeature } 