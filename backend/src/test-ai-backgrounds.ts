#!/usr/bin/env tsx

/**
 * Test script for AI Background Generation
 * 
 * Usage: npx tsx src/test-ai-backgrounds.ts
 * 
 * Make sure to set up your environment variables first!
 */

import dotenv from 'dotenv'
import path from 'path'

// Load .env from parent directory (project root)
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })

import { PromptGeneratorService } from './services/prompt-generator.js'
import { AIImageService } from './services/ai-image.js'
import { VideoRenderService } from './services/video-render.js'
import { QuizQuestion } from './types/video.js'
import pino from 'pino'

const logger = pino({ name: 'ai-test' })

// Sample quiz questions for testing
const testQuestions: QuizQuestion[] = [
  {
    question: "Jaka jest najwyższa góra w Polsce?",
    answer: "Rysy"
  },
  {
    question: "Kiedy wybuchła II wojna światowa?",
    answer: "1939"
  },
  {
    question: "Co to jest fotosynteza?",
    answer: "Proces produkcji glukozy w roślinach z CO2 i wody"
  },
  {
    question: "Ile nóg ma pająk?",
    answer: "8"
  },
  {
    question: "Jaka jest stolica Francji?",
    answer: "Paryż"
  }
]

async function testPromptGeneration() {
  logger.info('=== Testing Prompt Generation ===')
  
  const promptService = new PromptGeneratorService()
  const aiImageService = new AIImageService()
  
  const questions = [
    'Jaki film wyreżyserował Spielberg w 1993 roku?',
    'Który aktor zagrał główną rolę w filmie "Gladiator"?',
    'W którym roku powstał pierwszy film "Star Wars"?',
    'Kto napisał scenariusz do filmu "Pulp Fiction"?',
    'Jaki jest najlepszy film Hitchcocka?'
  ]
  
  for (const [index, question] of questions.entries()) {
    logger.info(`\n=== Testing Question ${index + 1} ===`)
    logger.info(`Question: ${question}`)
    
    // Test analizy pytania
    const context = promptService.analyzeQuestion(question)
    logger.info(`Topic: ${context.topic}`)
    logger.info(`Locale: ${context.locale}`)
    
    // Test generowania promptu
    const prompt = promptService.generatePrompt(context, question)
    logger.info(`Generated prompt: ${prompt}`)
    
    // Test generowania obrazu AI (jeśli dostępne)
    if (aiImageService.isAvailable()) {
      try {
        logger.info('Generating AI background...')
        
        const result = await aiImageService.generateImage({
          prompt,
          size: '1024x1792',
          quality: 'standard',
          style: 'natural'
        })
        
        logger.info(`✅ AI background generated: ${result.imagePath}`)
        logger.info(`Provider: ${result.provider}`)
        
        // Sprawdź czy plik został utworzony
        const fs = await import('fs')
        if (fs.existsSync(result.imagePath)) {
          logger.info(`✅ File exists: ${result.imagePath}`)
        } else {
          logger.error(`❌ File not found: ${result.imagePath}`)
        }
        
      } catch (error) {
        logger.error({ error }, `❌ AI generation failed for question ${index + 1}`)
      }
    } else {
      logger.warn('❌ AI image service not available')
    }
  }
}

async function testVideoRenderService() {
  logger.info('\n=== Testing Video Render Service ===')
  
  const videoService = new VideoRenderService()
  
  try {
    logger.info('Generating backgrounds for all test questions...')
    const backgrounds = await videoService.generateBackgrounds(testQuestions)
    
    logger.info(`✅ Generated ${backgrounds.length} backgrounds:`)
    backgrounds.forEach((bg, index) => {
      logger.info(`  ${index + 1}. ${bg}`)
    })
    
  } catch (error) {
    logger.error(`❌ Background generation failed:`, error)
  }
}

async function main() {
  logger.info('🚀 Starting AI Background Generation Tests')
  
  try {
    // Test 1: Prompt Generation (always works)
    await testPromptGeneration()
    
    // Test 2: Full Video Service Integration
    await testVideoRenderService()
    
    logger.info('\n✅ All tests completed!')
    
  } catch (error) {
    logger.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Environment check
function checkEnvironment() {
  logger.info('=== Environment Check ===')
  
  const requiredVars = [
    'AI_IMAGE_ENABLED',
    'AI_IMAGE_PROVIDER'
  ]
  
  const optionalVars = [
    'OPENAI_API_KEY',
    'REPLICATE_API_TOKEN',
    'AI_IMAGE_QUALITY',
    'AI_IMAGE_CACHE_ENABLED'
  ]
  
  logger.info('Required variables:')
  for (const varName of requiredVars) {
    const value = process.env[varName]
    logger.info(`  ${varName}: ${value ? '✅ SET' : '❌ NOT SET'}`)
  }
  
  logger.info('Optional variables:')
  for (const varName of optionalVars) {
    const value = process.env[varName]
    logger.info(`  ${varName}: ${value ? '✅ SET' : '⚠️  NOT SET'}`)
  }
  
  // Specific provider checks
  const provider = process.env.AI_IMAGE_PROVIDER
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    logger.warn('⚠️  OpenAI provider selected but OPENAI_API_KEY not set')
  }
  if (provider === 'replicate' && !process.env.REPLICATE_API_TOKEN) {
    logger.warn('⚠️  Replicate provider selected but REPLICATE_API_TOKEN not set')
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEnvironment()
  main().catch(console.error)
}

export { testPromptGeneration, testVideoRenderService } 