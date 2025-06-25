export interface QuizQuestion {
  question: string
  answer: string
  image?: string | null // base64 string lub URL
}

export interface VideoGenerationRequest {
  title: string
  questions: QuizQuestion[]
  enableVoice?: boolean // Nowa opcja dla głosu
  voiceSettings?: VoiceGenerationOptions // Ustawienia głosu
  enableIntro?: boolean // Nowa opcja dla intro
}

export interface VoiceGenerationOptions {
  voiceId?: string
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
  language?: 'pl' | 'en'
}

export interface VideoGenerationJob {
  id: string
  title: string
  questions: QuizQuestion[]
  status: 'waiting' | 'processing' | 'completed' | 'failed'
  progress: number
  message?: string
  videoUrl?: string
  error?: string
  createdAt: Date
  updatedAt: Date
  enableVoice?: boolean // Dodane dla voice
  voiceSettings?: VoiceGenerationOptions // Dodane dla voice
  enableIntro?: boolean // Dodane dla intro
}

export interface VideoRenderOptions {
  width: number
  height: number
  fps: number
  durationPerQuestion: number
  backgroundMusic?: string
  voiceover?: boolean
  language?: 'pl' | 'en'
  voiceSettings?: VoiceGenerationOptions // Dodane dla voice
  enableIntro?: boolean // Dodane dla intro
  introDuration?: number // Długość intro w sekundach
}

export const DEFAULT_RENDER_OPTIONS: VideoRenderOptions = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationPerQuestion: 10, // 10 sekund na pytanie
  voiceover: false,
  language: 'pl',
  enableIntro: true, // Domyślnie włączone
  introDuration: 4 // 4 sekundy intro
} 