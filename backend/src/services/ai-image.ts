import OpenAI from 'openai'
import Replicate from 'replicate'
import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import pino from 'pino'

const logger = pino({ name: 'ai-image-service' })

export interface AIImageOptions {
  prompt: string
  size?: '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  provider?: 'openai' | 'replicate'
}

export interface AIImageResult {
  imagePath: string
  provider: string
  cost?: number
  metadata?: any
}

export interface ImageCacheEntry {
  path: string
  prompt: string
  createdAt: Date
  provider: string
}

export class AIImageService {
  private openai?: OpenAI
  private replicate?: Replicate
  private readonly tempDir: string
  private readonly cacheDir: string
  private readonly cache = new Map<string, ImageCacheEntry>()

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
    this.cacheDir = path.join(process.cwd(), 'cache', 'images')
    this.initializeProviders()
    this.initializeCache()
  }

  private initializeProviders(): void {
    // Inicjalizuj OpenAI jeśli jest klucz API
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
      logger.info('OpenAI provider initialized')
    }

    // Inicjalizuj Replicate jeśli jest token
    if (process.env.REPLICATE_API_TOKEN) {
      this.replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN
      })
      logger.info('Replicate provider initialized')
    }

    if (!this.openai && !this.replicate) {
      logger.warn('No AI image providers configured. Images will fallback to gradients.')
    }
  }

  private async initializeCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      
      // Załaduj cache z dysku (opcjonalnie)
      if (process.env.AI_IMAGE_CACHE_ENABLED === 'true') {
        await this.loadCacheFromDisk()
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize image cache')
    }
  }

  /**
   * Główna metoda do generowania obrazów AI
   */
  async generateImage(options: AIImageOptions): Promise<AIImageResult> {
    logger.info(`Generating AI image with prompt: "${options.prompt.substring(0, 50)}..."`)

    // Sprawdź cache
    const cacheKey = this.generateCacheKey(options)
    const cached = await this.getCachedImage(cacheKey)
    if (cached) {
      logger.info('Returning cached image')
      return {
        imagePath: cached.path,
        provider: cached.provider
      }
    }

    // Wybierz provider
    const provider = this.selectProvider(options.provider)
    if (!provider) {
      throw new Error('No AI image provider available')
    }

    let result: AIImageResult

    try {
      switch (provider) {
        case 'openai':
          result = await this.generateWithOpenAI(options)
          break
        case 'replicate':
          result = await this.generateWithReplicate(options)
          break
        default:
          throw new Error(`Unknown provider: ${provider}`)
      }

      // Zapisz do cache
      await this.cacheImage(cacheKey, result, options.prompt)
      
      logger.info(`Successfully generated image with ${provider}`)
      return result

    } catch (error) {
      logger.error({ error, provider }, 'Failed to generate AI image')
      throw error
    }
  }

  /**
   * Generowanie obrazu przez OpenAI DALL-E 3
   */
  private async generateWithOpenAI(options: AIImageOptions): Promise<AIImageResult> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized')
    }

    logger.info('Generating image with OpenAI DALL-E 3')

    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: options.prompt,
        n: 1,
        size: options.size || "1024x1024",
        quality: options.quality || "standard",
        style: options.style || "vivid",
        response_format: "url"
      })

      const imageUrl = response.data?.[0]?.url
      if (!imageUrl) {
        throw new Error('No image URL received from OpenAI')
      }

      // Pobierz obraz i zapisz lokalnie
      const imagePath = await this.downloadImage(imageUrl, 'openai')

      return {
        imagePath,
        provider: 'openai',
        metadata: {
          revised_prompt: response.data?.[0]?.revised_prompt
        }
      }

    } catch (error) {
      logger.error({ error }, 'OpenAI image generation failed')
      throw new Error(`OpenAI generation failed: ${error}`)
    }
  }

  /**
   * Generowanie obrazu przez Replicate (Stable Diffusion)
   */
  private async generateWithReplicate(options: AIImageOptions): Promise<AIImageResult> {
    if (!this.replicate) {
      throw new Error('Replicate not initialized')
    }

    logger.info('Generating image with Replicate Stable Diffusion')

    try {
      // Używamy SDXL model
      const output = await this.replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: options.prompt,
            width: 1024,
            height: 1792, // Vertical orientation for TikTok
            num_inference_steps: 25,
            guidance_scale: 7.5,
            num_outputs: 1
          }
        }
      ) as string[]

      const imageUrl = output[0]
      if (!imageUrl) {
        throw new Error('No image URL received from Replicate')
      }

      // Pobierz obraz i zapisz lokalnie
      const imagePath = await this.downloadImage(imageUrl, 'replicate')

      return {
        imagePath,
        provider: 'replicate'
      }

    } catch (error) {
      logger.error({ error }, 'Replicate image generation failed')
      throw new Error(`Replicate generation failed: ${error}`)
    }
  }

  /**
   * Pobiera obraz z URL i zapisuje lokalnie
   */
  private async downloadImage(url: string, provider: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 sekund timeout
      })

      const timestamp = Date.now()
      const fileName = `ai_image_${provider}_${timestamp}.png`
      const filePath = path.join(this.tempDir, fileName)

      await fs.writeFile(filePath, Buffer.from(response.data))
      
      logger.info(`Image downloaded and saved: ${filePath}`)
      return filePath

    } catch (error) {
      logger.error({ error, url }, 'Failed to download image')
      throw new Error(`Failed to download image: ${error}`)
    }
  }

  /**
   * Wybiera najlepszy dostępny provider
   */
  private selectProvider(preferredProvider?: string): string | null {
    // Jeśli podano preferowany provider i jest dostępny
    if (preferredProvider) {
      if (preferredProvider === 'openai' && this.openai) return 'openai'
      if (preferredProvider === 'replicate' && this.replicate) return 'replicate'
    }

    // Domyślna kolejność preferencji
    const preference = process.env.AI_IMAGE_PROVIDER || 'openai'
    
    if (preference === 'openai' && this.openai) return 'openai'
    if (preference === 'replicate' && this.replicate) return 'replicate'
    
    // Fallback do pierwszego dostępnego
    if (this.openai) return 'openai'
    if (this.replicate) return 'replicate'
    
    return null
  }

  /**
   * Generuje klucz cache na podstawie opcji
   */
  private generateCacheKey(options: AIImageOptions): string {
    const keyData = {
      prompt: options.prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid'
    }
    
    // Prosty hash (w produkcji użyj crypto.createHash)
    return Buffer.from(JSON.stringify(keyData)).toString('base64')
  }

  /**
   * Sprawdza czy obraz jest w cache
   */
  private async getCachedImage(cacheKey: string): Promise<ImageCacheEntry | null> {
    if (process.env.AI_IMAGE_CACHE_ENABLED !== 'true') {
      return null
    }

    const cached = this.cache.get(cacheKey)
    if (!cached) return null

    // Sprawdź czy plik jeszcze istnieje
    try {
      await fs.access(cached.path)
      
      // Sprawdź czy nie wygasł (domyślnie 24h)
      const ttl = parseInt(process.env.AI_IMAGE_CACHE_TTL || '86400') * 1000
      const isExpired = Date.now() - cached.createdAt.getTime() > ttl
      
      if (isExpired) {
        this.cache.delete(cacheKey)
        await fs.unlink(cached.path).catch(() => {}) // Usuń plik
        return null
      }
      
      return cached
    } catch {
      // Plik nie istnieje
      this.cache.delete(cacheKey)
      return null
    }
  }

  /**
   * Zapisuje obraz do cache
   */
  private async cacheImage(cacheKey: string, result: AIImageResult, prompt: string): Promise<void> {
    if (process.env.AI_IMAGE_CACHE_ENABLED !== 'true') {
      return
    }

    try {
      // Skopiuj do katalogu cache
      const cacheFileName = `${cacheKey.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      const cachePath = path.join(this.cacheDir, cacheFileName)
      
      await fs.copyFile(result.imagePath, cachePath)
      
      const entry: ImageCacheEntry = {
        path: cachePath,
        prompt,
        createdAt: new Date(),
        provider: result.provider
      }
      
      this.cache.set(cacheKey, entry)
      
      logger.info(`Image cached: ${cachePath}`)
    } catch (error) {
      logger.warn({ error }, 'Failed to cache image')
    }
  }

  /**
   * Ładuje cache z dysku (opcjonalne)
   */
  private async loadCacheFromDisk(): Promise<void> {
    // Implementacja ładowania cache z pliku JSON (opcjonalnie)
    // Na razie pomijamy - cache jest tylko w pamięci
    logger.debug('Cache loading from disk not implemented')
  }

  /**
   * Sprawdza czy AI jest dostępne
   */
  isAvailable(): boolean {
    return !!(this.openai || this.replicate)
  }

  /**
   * Zwraca listę dostępnych providerów
   */
  getAvailableProviders(): string[] {
    const providers: string[] = []
    if (this.openai) providers.push('openai')
    if (this.replicate) providers.push('replicate')
    return providers
  }

  /**
   * Czyszczenie starych plików cache
   */
  async cleanupCache(): Promise<void> {
    logger.info('Cleaning up image cache')
    
    try {
      const files = await fs.readdir(this.cacheDir)
      const ttl = parseInt(process.env.AI_IMAGE_CACHE_TTL || '86400') * 1000
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file)
        const stats = await fs.stat(filePath)
        
        if (Date.now() - stats.mtime.getTime() > ttl) {
          await fs.unlink(filePath)
          logger.debug(`Removed expired cache file: ${file}`)
        }
      }
    } catch (error) {
      logger.warn({ error }, 'Cache cleanup failed')
    }
  }
} 