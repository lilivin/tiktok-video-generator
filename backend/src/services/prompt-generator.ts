import pino from 'pino'

const logger = pino({ name: 'prompt-generator-service' })

export interface PromptContext {
  category: QuestionCategory
  keywords: string[]
  style: ImageStyle
  locale: 'pl' | 'en'
}

export enum QuestionCategory {
  GEOGRAPHY = 'geography',
  HISTORY = 'history',
  SCIENCE = 'science',
  SPORTS = 'sports',
  CULTURE = 'culture',
  NATURE = 'nature',
  TECHNOLOGY = 'technology',
  FOOD = 'food',
  ANIMALS = 'animals',
  GENERAL = 'general'
}

export enum ImageStyle {
  PHOTOREALISTIC = 'photorealistic',
  ARTISTIC = 'artistic',
  MINIMALISTIC = 'minimalistic',
  DRAMATIC = 'dramatic',
  VINTAGE = 'vintage'
}

export class PromptGeneratorService {
  private readonly categoryKeywords = {
    [QuestionCategory.GEOGRAPHY]: {
      keywords: ['góra', 'morze', 'ocean', 'rzeka', 'stolica', 'kraj', 'miasto', 'kontynent', 'wyspa', 'jezioro', 'pustynia', 'las'],
      englishKeywords: ['mountain', 'sea', 'ocean', 'river', 'capital', 'country', 'city', 'continent', 'island', 'lake', 'desert', 'forest']
    },
    [QuestionCategory.HISTORY]: {
      keywords: ['wojna', 'król', 'królowa', 'bitwa', 'zamek', 'imperium', 'rewolucja', 'średniowiecze', 'starożytność', 'monument'],
      englishKeywords: ['war', 'king', 'queen', 'battle', 'castle', 'empire', 'revolution', 'medieval', 'ancient', 'monument']
    },
    [QuestionCategory.SCIENCE]: {
      keywords: ['atom', 'molekuła', 'DNA', 'planeta', 'gwiazda', 'laboratorium', 'mikroskop', 'eksperyment', 'fizyka', 'chemia'],
      englishKeywords: ['atom', 'molecule', 'DNA', 'planet', 'star', 'laboratory', 'microscope', 'experiment', 'physics', 'chemistry']
    },
    [QuestionCategory.SPORTS]: {
      keywords: ['piłka', 'stadion', 'mistrzostwo', 'olimpiada', 'bieganie', 'pływanie', 'tenis', 'koszykówka', 'hokej'],
      englishKeywords: ['ball', 'stadium', 'championship', 'olympics', 'running', 'swimming', 'tennis', 'basketball', 'hockey']
    },
    [QuestionCategory.CULTURE]: {
      keywords: ['sztuka', 'muzyka', 'teatr', 'obraz', 'rzeźba', 'muzeum', 'koncert', 'film', 'książka', 'literatura'],
      englishKeywords: ['art', 'music', 'theater', 'painting', 'sculpture', 'museum', 'concert', 'movie', 'book', 'literature']
    },
    [QuestionCategory.NATURE]: {
      keywords: ['drzewo', 'kwiat', 'zwierzę', 'ptak', 'ryba', 'las', 'łąka', 'góra', 'morze', 'niebo'],
      englishKeywords: ['tree', 'flower', 'animal', 'bird', 'fish', 'forest', 'meadow', 'mountain', 'sea', 'sky']
    },
    [QuestionCategory.TECHNOLOGY]: {
      keywords: ['komputer', 'internet', 'robot', 'sztuczna inteligencja', 'telefon', 'aplikacja', 'program', 'cyfrowy'],
      englishKeywords: ['computer', 'internet', 'robot', 'artificial intelligence', 'phone', 'application', 'program', 'digital']
    },
    [QuestionCategory.FOOD]: {
      keywords: ['jedzenie', 'restauracja', 'kuchnia', 'przepis', 'składnik', 'smak', 'gotowanie', 'piekarnia'],
      englishKeywords: ['food', 'restaurant', 'kitchen', 'recipe', 'ingredient', 'taste', 'cooking', 'bakery']
    },
    [QuestionCategory.ANIMALS]: {
      keywords: ['pies', 'kot', 'słoń', 'lew', 'wilk', 'niedźwiedź', 'ptak', 'ryba', 'owad', 'ssakał'],
      englishKeywords: ['dog', 'cat', 'elephant', 'lion', 'wolf', 'bear', 'bird', 'fish', 'insect', 'mammal']
    },
    [QuestionCategory.GENERAL]: {
      keywords: ['pytanie', 'odpowiedź', 'test', 'quiz', 'wiedza', 'informacja'],
      englishKeywords: ['question', 'answer', 'test', 'quiz', 'knowledge', 'information']
    }
  }

  private readonly stylePrompts = {
    [ImageStyle.PHOTOREALISTIC]: 'photorealistic, high resolution, detailed, professional photography',
    [ImageStyle.ARTISTIC]: 'artistic illustration, beautiful colors, creative composition',
    [ImageStyle.MINIMALISTIC]: 'minimalistic design, clean, simple, modern',
    [ImageStyle.DRAMATIC]: 'dramatic lighting, cinematic, epic composition, high contrast',
    [ImageStyle.VINTAGE]: 'vintage style, retro, nostalgic, aged photography effect'
  }

  /**
   * Analizuje pytanie i generuje kontekst dla tworzenia promptu
   */
  analyzeQuestion(question: string): PromptContext {
    logger.info(`Analyzing question: "${question.substring(0, 50)}..."`)
    
    const normalizedQuestion = question.toLowerCase()
    
    // Kategoryzacja pytania
    const category = this.categorizeQuestion(normalizedQuestion)
    
    // Wyodrębnienie kluczowych słów
    const keywords = this.extractKeywords(normalizedQuestion, category)
    
    // Wybór stylu na podstawie kategorii
    const style = this.selectStyleForCategory(category)
    
    const context: PromptContext = {
      category,
      keywords,
      style,
      locale: 'pl'
    }
    
    logger.info(`Question categorized as: ${category}, style: ${style}, keywords: ${keywords.join(', ')}`)
    
    return context
  }

  /**
   * Generuje prompt dla AI na podstawie kontekstu
   */
  generatePrompt(context: PromptContext, question: string): string {
    logger.info(`Generating prompt for category: ${context.category}`)
    
    const basePrompt = this.createBasePrompt(context, question)
    const stylePrompt = this.stylePrompts[context.style]
    const qualityPrompt = 'high quality, 4K, professional'
    const orientationPrompt = 'vertical orientation, 9:16 aspect ratio, mobile optimized'
    
    const fullPrompt = `${basePrompt}, ${stylePrompt}, ${qualityPrompt}, ${orientationPrompt}`
    
    logger.info(`Generated prompt: "${fullPrompt.substring(0, 100)}..."`)
    
    return fullPrompt
  }

  private categorizeQuestion(question: string): QuestionCategory {
    // Sprawdzamy słowa kluczowe dla każdej kategorii
    for (const [category, data] of Object.entries(this.categoryKeywords)) {
      const keywords = data.keywords
      const foundKeywords = keywords.filter(keyword => 
        question.includes(keyword.toLowerCase())
      )
      
      if (foundKeywords.length > 0) {
        return category as QuestionCategory
      }
    }
    
    // Dodatkowa logika kategoryzacji na podstawie wzorców
    if (this.containsGeographyPatterns(question)) {
      return QuestionCategory.GEOGRAPHY
    }
    
    if (this.containsHistoryPatterns(question)) {
      return QuestionCategory.HISTORY
    }
    
    if (this.containsSciencePatterns(question)) {
      return QuestionCategory.SCIENCE
    }
    
    return QuestionCategory.GENERAL
  }

  private extractKeywords(question: string, category: QuestionCategory): string[] {
    const categoryData = this.categoryKeywords[category]
    if (!categoryData) return []
    
    const foundKeywords = categoryData.keywords.filter((keyword: string) => 
      question.includes(keyword.toLowerCase())
    )
    
    // Dodaj słowa kluczowe z pytania (prostka analiza)
    const questionWords = question.split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['który', 'która', 'które', 'gdzie', 'kiedy', 'dlaczego', 'jak'].includes(word.toLowerCase()))
      .slice(0, 3) // Max 3 dodatkowe słowa
    
    return [...foundKeywords, ...questionWords]
  }

  private selectStyleForCategory(category: QuestionCategory): ImageStyle {
    switch (category) {
      case QuestionCategory.GEOGRAPHY:
        return ImageStyle.PHOTOREALISTIC
      case QuestionCategory.HISTORY:
        return ImageStyle.VINTAGE
      case QuestionCategory.SCIENCE:
        return ImageStyle.MINIMALISTIC
      case QuestionCategory.SPORTS:
        return ImageStyle.DRAMATIC
      case QuestionCategory.CULTURE:
        return ImageStyle.ARTISTIC
      default:
        return ImageStyle.PHOTOREALISTIC
    }
  }

  private createBasePrompt(context: PromptContext, question: string): string {
    const keywords = context.keywords.slice(0, 3) // Max 3 słowa kluczowe
    
    switch (context.category) {
      case QuestionCategory.GEOGRAPHY:
        return this.createGeographyPrompt(keywords, question)
      case QuestionCategory.HISTORY:
        return this.createHistoryPrompt(keywords, question)
      case QuestionCategory.SCIENCE:
        return this.createSciencePrompt(keywords, question)
      case QuestionCategory.SPORTS:
        return this.createSportsPrompt(keywords, question)
      case QuestionCategory.CULTURE:
        return this.createCulturePrompt(keywords, question)
      case QuestionCategory.NATURE:
        return this.createNaturePrompt(keywords, question)
      case QuestionCategory.TECHNOLOGY:
        return this.createTechnologyPrompt(keywords, question)
      case QuestionCategory.FOOD:
        return this.createFoodPrompt(keywords, question)
      case QuestionCategory.ANIMALS:
        return this.createAnimalsPrompt(keywords, question)
      default:
        return this.createGeneralPrompt(keywords, question)
    }
  }

  private createGeographyPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('stolica')) {
      return `Beautiful cityscape of ${keywordStr}, aerial view, urban landscape, modern architecture`
    }
    
    if (question.includes('góra') || question.includes('szczyt')) {
      return `Majestic mountain landscape featuring ${keywordStr}, dramatic peaks, natural beauty`
    }
    
    if (question.includes('morze') || question.includes('ocean')) {
      return `Stunning ocean view with ${keywordStr}, blue waters, horizon, seascape`
    }
    
    return `Beautiful landscape featuring ${keywordStr}, natural scenery, geographic location`
  }

  private createHistoryPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Historical scene depicting ${keywordStr}, vintage atmosphere, period accurate, documentary style`
  }

  private createSciencePrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Scientific visualization of ${keywordStr}, modern laboratory, research environment, educational`
  }

  private createSportsPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Dynamic sports scene featuring ${keywordStr}, athletic action, stadium environment, competitive`
  }

  private createCulturePrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Cultural scene showcasing ${keywordStr}, artistic environment, creative atmosphere, elegant`
  }

  private createNaturePrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Beautiful nature scene with ${keywordStr}, wildlife, natural environment, serene landscape`
  }

  private createTechnologyPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Modern technology featuring ${keywordStr}, futuristic design, digital environment, innovation`
  }

  private createFoodPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Delicious food presentation of ${keywordStr}, culinary art, appetizing, restaurant quality`
  }

  private createAnimalsPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Beautiful animal photography featuring ${keywordStr}, wildlife, natural habitat, detailed`
  }

  private createGeneralPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    return `Beautiful scene related to ${keywordStr}, high quality composition, engaging visual`
  }

  // Pomocnicze metody rozpoznawania wzorców

  private containsGeographyPatterns(question: string): boolean {
    const patterns = [
      /gdzie (się )?znajduje/,
      /jaka jest stolica/,
      /który kontynent/,
      /najwyższa góra/,
      /największe jezioro/,
      /najdłuższa rzeka/
    ]
    
    return patterns.some(pattern => pattern.test(question))
  }

  private containsHistoryPatterns(question: string): boolean {
    const patterns = [
      /kiedy (się )?(rozpoczęła|zakończyła|wybuchła)/,
      /w którym roku/,
      /kto (był|była)/,
      /pierwsza|druga wojna światowa/,
      /średniowiecze|starożytność/
    ]
    
    return patterns.some(pattern => pattern.test(question))
  }

  private containsSciencePatterns(question: string): boolean {
    const patterns = [
      /co to jest/,
      /jaki jest wzór/,
      /ile (ma|wynosi)/,
      /pierwiastek chemiczny/,
      /układ słoneczny/,
      /teoria|prawo/
    ]
    
    return patterns.some(pattern => pattern.test(question))
  }
} 