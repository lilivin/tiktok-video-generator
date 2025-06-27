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
      keywords: ['góra', 'rzeka', 'miasto', 'stolica', 'kraj', 'kontynent', 'morze', 'ocean', 'jezioro', 'wyspa', 'pustynia', 'las', 'równina', 'półwysep', 'zatoka', 'cieśnina', 'Warszawa', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódź', 'Rysy', 'Tatry', 'Bałtyk', 'Wisła', 'Odra'],
      englishKeywords: ['mountain', 'river', 'city', 'capital', 'country', 'continent', 'sea', 'ocean', 'lake', 'island', 'desert', 'forest', 'plain', 'peninsula', 'bay', 'strait', 'Warsaw', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan', 'Lodz', 'Rysy', 'Tatras', 'Baltic', 'Vistula', 'Oder']
    },
    [QuestionCategory.HISTORY]: {
      keywords: ['wojna', 'bitwa', 'król', 'królowa', 'władca', 'zamek', 'średniowiecze', 'starożytność', 'rewolucja', 'powstanie', 'traktat', 'dynastia', 'imperium', 'cywilizacja', 'epoka', 'wiek', 'cesarz', 'książę', 'rycerz', 'wojownik'],
      englishKeywords: ['war', 'battle', 'king', 'queen', 'ruler', 'castle', 'medieval', 'ancient', 'revolution', 'uprising', 'treaty', 'dynasty', 'empire', 'civilization', 'era', 'century', 'emperor', 'duke', 'knight', 'warrior']
    },
    [QuestionCategory.SCIENCE]: {
      keywords: ['atom', 'molekuła', 'komórka', 'DNA', 'białko', 'gen', 'enzym', 'reakcja', 'związek', 'pierwiastek', 'planeta', 'gwiazda', 'galaktyka', 'fizyka', 'chemia', 'biologia', 'mikroskop', 'laboratorium', 'eksperyment', 'teoria'],
      englishKeywords: ['atom', 'molecule', 'cell', 'DNA', 'protein', 'gene', 'enzyme', 'reaction', 'compound', 'element', 'planet', 'star', 'galaxy', 'physics', 'chemistry', 'biology', 'microscope', 'laboratory', 'experiment', 'theory']
    },
    [QuestionCategory.SPORTS]: {
      keywords: ['piłka', 'mecz', 'stadion', 'drużyna', 'zawodnik', 'mistrzostwa', 'olimpiada', 'medal', 'rekord', 'trener', 'sędzia', 'liga', 'turniej', 'puchar', 'tenis', 'koszykówka', 'siatkówka', 'pływanie', 'bieganie', 'gimnastyka'],
      englishKeywords: ['ball', 'match', 'stadium', 'team', 'player', 'championship', 'olympics', 'medal', 'record', 'coach', 'referee', 'league', 'tournament', 'cup', 'tennis', 'basketball', 'volleyball', 'swimming', 'running', 'gymnastics']
    },
    [QuestionCategory.CULTURE]: {
      keywords: ['sztuka', 'muzeum', 'galeria', 'obraz', 'rzeźba', 'teatr', 'opera', 'koncert', 'muzyka', 'książka', 'literatura', 'poezja', 'film', 'kino', 'festiwal', 'tradycja', 'obyczaj', 'kultura', 'artysta', 'twórca'],
      englishKeywords: ['art', 'museum', 'gallery', 'painting', 'sculpture', 'theater', 'opera', 'concert', 'music', 'book', 'literature', 'poetry', 'film', 'cinema', 'festival', 'tradition', 'custom', 'culture', 'artist', 'creator']
    },
    [QuestionCategory.NATURE]: {
      keywords: ['zwierzę', 'roślina', 'drzewo', 'kwiat', 'liść', 'owad', 'ptak', 'ssak', 'ryba', 'las', 'park', 'rezerwat', 'środowisko', 'ekologia', 'przyroda', 'gatunek', 'siedlisko', 'fauna', 'flora', 'bioróżnorodność'],
      englishKeywords: ['animal', 'plant', 'tree', 'flower', 'leaf', 'insect', 'bird', 'mammal', 'fish', 'forest', 'park', 'reserve', 'environment', 'ecology', 'nature', 'species', 'habitat', 'fauna', 'flora', 'biodiversity']
    },
    [QuestionCategory.TECHNOLOGY]: {
      keywords: ['komputer', 'internet', 'robot', 'sztuczna inteligencja', 'telefon', 'aplikacja', 'program', 'cyfrowy', 'software', 'hardware', 'procesor', 'pamięć', 'algorytm', 'kod', 'programowanie', 'baza danych', 'sieć', 'blockchain', 'AI', 'machine learning'],
      englishKeywords: ['computer', 'internet', 'robot', 'artificial intelligence', 'phone', 'application', 'program', 'digital', 'software', 'hardware', 'processor', 'memory', 'algorithm', 'code', 'programming', 'database', 'network', 'blockchain', 'AI', 'machine learning']
    },
    [QuestionCategory.FOOD]: {
      keywords: ['jedzenie', 'restauracja', 'kuchnia', 'przepis', 'składnik', 'smak', 'gotowanie', 'piekarnia', 'deser', 'ciasto', 'wino', 'alkohol', 'napój', 'mięso', 'warzywa', 'owoce', 'przyprawa', 'ser', 'chleb', 'tradycyjna'],
      englishKeywords: ['food', 'restaurant', 'kitchen', 'recipe', 'ingredient', 'taste', 'cooking', 'bakery', 'dessert', 'cake', 'wine', 'alcohol', 'drink', 'meat', 'vegetables', 'fruits', 'spice', 'cheese', 'bread', 'traditional']
    },
    [QuestionCategory.ANIMALS]: {
      keywords: ['pies', 'kot', 'słoń', 'lew', 'tygrys', 'wilk', 'niedźwiedź', 'ptak', 'ryba', 'owad', 'ssak', 'gad', 'płaz', 'wieloryb', 'delfin', 'orzeł', 'sowa', 'królik', 'koń', 'krowa', 'świnia', 'owca'],
      englishKeywords: ['dog', 'cat', 'elephant', 'lion', 'tiger', 'wolf', 'bear', 'bird', 'fish', 'insect', 'mammal', 'reptile', 'amphibian', 'whale', 'dolphin', 'eagle', 'owl', 'rabbit', 'horse', 'cow', 'pig', 'sheep']
    },
    [QuestionCategory.GENERAL]: {
      keywords: ['pytanie', 'odpowiedź', 'test', 'quiz', 'wiedza', 'informacja', 'fakt', 'prawda', 'nauka', 'edukacja', 'szkoła', 'uniwersytet', 'student', 'nauczyciel', 'profesor', 'wykład', 'lekcja'],
      englishKeywords: ['question', 'answer', 'test', 'quiz', 'knowledge', 'information', 'fact', 'truth', 'science', 'education', 'school', 'university', 'student', 'teacher', 'professor', 'lecture', 'lesson']
    }
  }

  private readonly stylePrompts = {
    [ImageStyle.PHOTOREALISTIC]: 'ultra-realistic, professional photography, sharp focus, natural lighting, cinematic quality, 4K resolution',
    [ImageStyle.ARTISTIC]: 'artistic illustration, vibrant colors, creative composition, detailed artwork, masterpiece quality',
    [ImageStyle.MINIMALISTIC]: 'clean minimal design, simple elegant composition, modern aesthetic, uncluttered, sophisticated',
    [ImageStyle.DRAMATIC]: 'dramatic lighting, cinematic atmosphere, high contrast, moody shadows, epic composition, film-like quality',
    [ImageStyle.VINTAGE]: 'vintage photography style, retro atmosphere, aged film look, nostalgic mood, period-accurate details'
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
    const qualityPrompt = 'professional photography, sharp focus, detailed, masterpiece quality, award-winning'
    const orientationPrompt = 'vertical 9:16 aspect ratio, mobile-optimized composition, TikTok format'
    const atmospherePrompt = 'cinematic lighting, rich colors, depth of field, visually engaging'
    
    // Dodatkowe słowa kluczowe dla lepszej jakości
    const technicalPrompt = 'no text, no watermarks, clean composition, high resolution'
    
    const fullPrompt = `${basePrompt}, ${stylePrompt}, ${qualityPrompt}, ${orientationPrompt}, ${atmospherePrompt}, ${technicalPrompt}`
    
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
    
    if (question.includes('stolica') || question.includes('miasto')) {
      const cityName = this.extractCityName(question, keywords)
      return `Stunning aerial view of ${cityName || keywordStr} city center, iconic architecture, bustling streets, urban skyline, golden hour lighting, metropolitan atmosphere`
    }
    
    if (question.includes('góra') || question.includes('szczyt') || question.includes('Rysy') || question.includes('Tatry')) {
      return `Breathtaking mountain vista of ${keywordStr}, snow-capped peaks, alpine landscape, dramatic rocky formations, morning mist, pristine wilderness`
    }
    
    if (question.includes('morze') || question.includes('ocean') || question.includes('Bałtyk')) {
      return `Spectacular ocean scenery with ${keywordStr}, crystal-clear turquoise waters, white sandy beach, gentle waves, coastal landscape, sunset reflections`
    }
    
    if (question.includes('rzeka') || question.includes('Wisła') || question.includes('Odra')) {
      return `Scenic river landscape featuring ${keywordStr}, meandering waterway, lush green banks, peaceful countryside, bridge crossing, natural beauty`
    }
    
    if (question.includes('kraj') || question.includes('państwo')) {
      const countryName = this.extractCountryName(question, keywords)
      return `Iconic landscape representing ${countryName || keywordStr}, famous landmarks, cultural heritage sites, natural beauty, national identity`
    }
    
    return `Stunning natural landscape showcasing ${keywordStr}, geographical features, scenic beauty, environmental diversity, pristine nature`
  }

  private createHistoryPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('wojna') || question.includes('bitwa')) {
      return `Historical battlefield scene depicting ${keywordStr}, period-accurate military equipment, dramatic war atmosphere, sepia tones, documentary photography style`
    }
    
    if (question.includes('król') || question.includes('królowa') || question.includes('władca')) {
      return `Majestic royal court scene featuring ${keywordStr}, ornate palace interior, golden decorations, regal atmosphere, Renaissance painting style`
    }
    
    if (question.includes('zamek') || question.includes('forteca')) {
      return `Ancient castle fortress of ${keywordStr}, medieval stone architecture, imposing towers, historical authenticity, misty atmosphere`
    }
    
    if (question.includes('rok') && (question.includes('16') || question.includes('17') || question.includes('18'))) {
      return `Historical scene from the era of ${keywordStr}, period-accurate clothing and architecture, vintage documentary style, sepia coloring`
    }
    
    return `Historical scene depicting ${keywordStr}, authentic period details, vintage documentary photography, aged paper texture, museum quality`
  }

  private createSciencePrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('DNA') || question.includes('komórka') || question.includes('biologia')) {
      return `Detailed scientific visualization of ${keywordStr}, microscopic cellular structures, DNA helix, molecular biology, laboratory research environment`
    }
    
    if (question.includes('atom') || question.includes('elektron') || question.includes('chemia')) {
      return `Advanced chemistry laboratory featuring ${keywordStr}, molecular structures, periodic table elements, scientific equipment, research atmosphere`
    }
    
    if (question.includes('planeta') || question.includes('kosmos') || question.includes('słońce')) {
      return `Spectacular space scene showing ${keywordStr}, cosmic phenomena, stellar formations, nebula colors, astronomical photography, NASA quality`
    }
    
    if (question.includes('fizyka') || question.includes('energia') || question.includes('siła')) {
      return `Modern physics laboratory demonstrating ${keywordStr}, scientific instruments, energy visualization, quantum effects, high-tech environment`
    }
    
    return `Advanced scientific visualization of ${keywordStr}, cutting-edge research facility, modern laboratory equipment, educational diagram style`
  }

  private createSportsPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('piłka nożna') || question.includes('football')) {
      return `Dynamic football match scene featuring ${keywordStr}, packed stadium atmosphere, grass field, crowd excitement, sports photography, action shot`
    }
    
    if (question.includes('koszykówka') || question.includes('basketball')) {
      return `Intense basketball game showing ${keywordStr}, indoor arena, wooden court, dramatic lighting, athletic action, professional sports photography`
    }
    
    if (question.includes('tenis') || question.includes('kort')) {
      return `Professional tennis match at ${keywordStr}, clay court surface, concentrated athlete, crowd in background, sports journalism photography`
    }
    
    if (question.includes('olimpiad') || question.includes('mistrzostwa')) {
      return `Olympic-level sports competition featuring ${keywordStr}, world-class athletes, international arena, ceremonial atmosphere, victory celebration`
    }
    
    return `High-energy sports scene with ${keywordStr}, athletic competition, stadium environment, crowd cheering, professional sports photography`
  }

  private createCulturePrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('muzeum') || question.includes('galeria')) {
      return `Elegant museum interior showcasing ${keywordStr}, artistic masterpieces, classical architecture, sophisticated lighting, cultural heritage`
    }
    
    if (question.includes('teatr') || question.includes('opera')) {
      return `Magnificent theater performance of ${keywordStr}, ornate stage design, dramatic lighting, audience in elegant attire, cultural sophistication`
    }
    
    if (question.includes('książka') || question.includes('literatura')) {
      return `Atmospheric library scene with ${keywordStr}, ancient manuscripts, wooden bookshelves, warm lighting, intellectual atmosphere, literary heritage`
    }
    
    if (question.includes('festiwal') || question.includes('tradycja')) {
      return `Vibrant cultural festival celebrating ${keywordStr}, traditional costumes, folk performances, community gathering, cultural diversity`
    }
    
    return `Rich cultural scene depicting ${keywordStr}, artistic heritage, traditional elements, sophisticated atmosphere, cultural significance`
  }

  private createNaturePrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('las') || question.includes('drzewo')) {
      return `Pristine forest landscape with ${keywordStr}, towering ancient trees, dappled sunlight, moss-covered ground, peaceful wilderness, nature photography`
    }
    
    if (question.includes('ptak') || question.includes('orzeł')) {
      return `Magnificent bird photography featuring ${keywordStr}, natural habitat, detailed feathers, wildlife behavior, National Geographic style`
    }
    
    if (question.includes('kwiat') || question.includes('roślina')) {
      return `Beautiful botanical photography of ${keywordStr}, vibrant flower petals, natural colors, macro detail, garden environment, floral artistry`
    }
    
    if (question.includes('park') || question.includes('rezerwat')) {
      return `Stunning national park scenery with ${keywordStr}, protected wilderness, diverse ecosystems, natural conservation, pristine environment`
    }
    
    return `Breathtaking nature scene featuring ${keywordStr}, wild landscapes, environmental beauty, natural habitat, conservation photography`
  }

  private createTechnologyPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('komputer') || question.includes('laptop')) {
      return `Modern tech workspace featuring ${keywordStr}, sleek design, LED lighting, futuristic interface, high-tech environment, innovation hub`
    }
    
    if (question.includes('telefon') || question.includes('smartphone')) {
      return `Cutting-edge mobile technology showing ${keywordStr}, modern design, touchscreen interface, digital connectivity, tech lifestyle`
    }
    
    if (question.includes('internet') || question.includes('sieć')) {
      return `Digital network visualization of ${keywordStr}, data flow connections, cyber infrastructure, fiber optic cables, technology backbone`
    }
    
    if (question.includes('AI') || question.includes('sztuczna inteligencja')) {
      return `Advanced AI technology lab with ${keywordStr}, neural network visualization, machine learning, robotics, futuristic computing`
    }
    
    return `State-of-the-art technology featuring ${keywordStr}, innovation center, modern design, digital transformation, tech advancement`
  }

  private createFoodPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('restauracja') || question.includes('kuchnia')) {
      return `Professional restaurant kitchen preparing ${keywordStr}, chef at work, culinary artistry, gourmet presentation, fine dining atmosphere`
    }
    
    if (question.includes('deser') || question.includes('ciasto')) {
      return `Exquisite dessert presentation of ${keywordStr}, elegant plating, confectionery art, sweet delicacy, patisserie quality`
    }
    
    if (question.includes('wino') || question.includes('alkohol')) {
      return `Sophisticated wine tasting scene with ${keywordStr}, vineyard setting, elegant glassware, sommelier expertise, luxury atmosphere`
    }
    
    if (question.includes('tradycyjna') || question.includes('narodowa')) {
      return `Traditional cuisine featuring ${keywordStr}, authentic preparation, cultural heritage, family recipes, homestyle cooking`
    }
    
    return `Delicious culinary creation of ${keywordStr}, gourmet food photography, appetizing presentation, restaurant quality, food artistry`
  }

  private createAnimalsPrompt(keywords: string[], question: string): string {
    const keywordStr = keywords.join(' ')
    
    if (question.includes('lew') || question.includes('tygrys') || question.includes('wielkie koty')) {
      return `Majestic big cat photography featuring ${keywordStr}, powerful predator, natural habitat, wildlife behavior, National Geographic quality`
    }
    
    if (question.includes('słoń') || question.includes('safari')) {
      return `African safari scene with ${keywordStr}, savanna landscape, wildlife migration, golden hour lighting, documentary photography`
    }
    
    if (question.includes('pies') || question.includes('kot') || question.includes('pupil')) {
      return `Adorable pet photography of ${keywordStr}, domestic animal, loving companion, home environment, heartwarming scene`
    }
    
    if (question.includes('morski') || question.includes('ocean') || question.includes('wieloryb')) {
      return `Underwater marine life featuring ${keywordStr}, ocean depths, aquatic environment, coral reef, marine biodiversity`
    }
    
    return `Stunning wildlife photography of ${keywordStr}, natural behavior, animal habitat, conservation awareness, nature documentary style`
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

  // Pomocnicze metody do wyciągania nazw
  private extractCityName(question: string, keywords: string[]): string | null {
    const cityPatterns = [
      /stolica\s+(\w+)/,
      /miasto\s+(\w+)/,
      /(Warszawa|Kraków|Gdańsk|Wrocław|Poznań|Łódź)/i
    ]
    
    for (const pattern of cityPatterns) {
      const match = question.match(pattern)
      if (match) return match[1] || match[0]
    }
    
    return null
  }

  private extractCountryName(question: string, keywords: string[]): string | null {
    const countryPatterns = [
      /(Polska|Niemcy|Francja|Hiszpania|Włochy|Rosja|USA|Chiny|Japonia)/i,
      /kraj\s+(\w+)/
    ]
    
    for (const pattern of countryPatterns) {
      const match = question.match(pattern)
      if (match) return match[1] || match[0]
    }
    
    return null
  }
} 