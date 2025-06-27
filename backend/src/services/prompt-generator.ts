import pino from 'pino'

const logger = pino({ name: 'prompt-generator-service' })

export interface PromptContext {
  topic: string
  question: string
  locale: 'pl' | 'en'
}

export class PromptGeneratorService {
  /**
   * Analizuje pytanie i wyciąga podstawowy temat
   */
  analyzeQuestion(question: string): PromptContext {
    logger.info(`Analyzing question: "${question.substring(0, 50)}..."`)
    
    // Wyciągnij główny temat z pytania
    const topic = this.extractTopic(question)
    
    const context: PromptContext = {
      topic,
      question,
      locale: 'pl'
    }
    
    logger.info(`Question analyzed: topic="${topic}"`)
    
    return context
  }

  /**
   * Generuje prosty prompt edukacyjny
   */
  generatePrompt(context: PromptContext, question: string): string {
    logger.info(`Generating simple prompt for topic: ${context.topic}`)
    
    // Bardzo prosty template
    const basePrompt = `Create a high-quality, detailed illustration related to ${context.topic} that visually represents the concept or ideas behind the following question: "${question}". The image should be conceptually meaningful, visually engaging, and suitable for use in an educational or thought-provoking context. Use a realistic or semi-realistic art style unless otherwise required by the topic.`
    
    // Dodaj format TikToka
    const formatPrompt = 'vertical 9:16 aspect ratio, mobile-optimized, TikTok format'
    
    // Techniczne wymagania
    const technicalPrompt = 'high resolution, professional quality, no text overlays, no watermarks, clean composition'
    
    const fullPrompt = `${basePrompt} ${formatPrompt}, ${technicalPrompt}`
    
    logger.info(`Generated simple prompt: "${fullPrompt.substring(0, 100)}..."`)
    
    return fullPrompt
  }

  private extractTopic(question: string): string {
    // Usuń typowe słowa pytające i wybierz główne słowa kluczowe
    const questionWords = ['co', 'kto', 'gdzie', 'kiedy', 'jak', 'dlaczego', 'który', 'która', 'które', 'ile', 'jaki', 'jaka', 'jakie']
    const commonWords = ['jest', 'są', 'ma', 'to', 'się', 'w', 'na', 'z', 'do', 'od', 'przez', 'przy', 'za', 'pod', 'nad', 'o', 'i', 'a', 'ale', 'oraz', 'czy']
    
    const words = question.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !questionWords.includes(word))
      .filter(word => !commonWords.includes(word))
      .slice(0, 3) // Weź maksymalnie 3 najważniejsze słowa
    
    if (words.length === 0) {
      return 'general topic'
    }
    
    return words.join(' ')
  }
} 