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
  
  for (const [index, question] of testQuestions.entries()) {
    logger.info(`\n--- Question ${index + 1} ---`)
    logger.info(`Question: "${question.question}"`)
    
    const context = promptService.analyzeQuestion(question.question)
    logger.info(`Category: ${context.category}`)
    logger.info(`Style: ${context.style}`) 
    logger.info(`Keywords: ${context.keywords.join(', ')}`)
    
    const prompt = promptService.generatePrompt(context, question.question)
    logger.info(`Generated Prompt: "${prompt}"`)
  }
}

async function testAIImageGeneration() {
  logger.info('\n=== Testing AI Image Generation ===')
  
  const aiService = new AIImageService()
  
  if (!aiService.isAvailable()) {
    logger.warn('No AI providers available. Please check your API keys.')
    logger.info('Available providers:', aiService.getAvailableProviders())
    return
  }
  
  logger.info('Available AI providers:', aiService.getAvailableProviders())
  
  // Test with one question
  const testQuestion = testQuestions[0] // Geography question
  const promptService = new PromptGeneratorService()
  
  try {
    const context = promptService.analyzeQuestion(testQuestion.question)
    const prompt = promptService.generatePrompt(context, testQuestion.question)
    
    logger.info(`Generating image for: "${testQuestion.question}"`)
    logger.info(`Using prompt: "${prompt.substring(0, 100)}..."`)
    
    const result = await aiService.generateImage({
      prompt,
      size: '1024x1792',
      quality: 'standard'
    })
    
    logger.info(`✅ Image generated successfully!`)
    logger.info(`Provider: ${result.provider}`)
    logger.info(`Image path: ${result.imagePath}`)
    
    if (result.metadata?.revised_prompt) {
      logger.info(`Revised prompt: "${result.metadata.revised_prompt}"`)
    }
    
  } catch (error) {
    logger.error(`❌ Image generation failed:`, error)
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
    
    // Test 2: AI Image Generation (requires API keys)
    await testAIImageGeneration()
    
    // Test 3: Full Video Service Integration
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

export { testPromptGeneration, testAIImageGeneration, testVideoRenderService } 