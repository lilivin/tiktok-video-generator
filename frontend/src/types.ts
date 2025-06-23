import { z } from "zod"

// Funkcja walidacji pliku obrazu
const validateImageFile = (file: File | string | null | undefined): boolean => {
  if (!file || typeof file === 'string') return true // Opcjonalne pole lub URL
  
  // Sprawdź rozmiar (5MB)
  if (file.size > 5 * 1024 * 1024) return false
  
  // Sprawdź typ pliku
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  return allowedTypes.includes(file.type)
}

// Schemat walidacji dla pojedynczego pytania
export const QuizQuestionSchema = z.object({
  question: z
    .string()
    .min(1, "Pytanie nie może być puste")
    .max(120, "Pytanie może mieć maksymalnie 120 znaków"),
  answer: z
    .string()
    .min(1, "Odpowiedź nie może być pusta")
    .max(120, "Odpowiedź może mieć maksymalnie 120 znaków"),
  image: z
    .union([
      z.instanceof(File),
      z.string(),
      z.null(),
      z.undefined()
    ])
    .optional()
    .refine((file) => validateImageFile(file), {
      message: "Nieprawidłowy plik. Akceptowane formaty: JPG, PNG (maks. 5MB)"
    }),
})

// Schemat walidacji dla całego quizu
export const QuizFormSchema = z.object({
  title: z
    .string()
    .min(1, "Tytuł jest wymagany")
    .max(100, "Tytuł może mieć maksymalnie 100 znaków"),
  questions: z
    .array(QuizQuestionSchema)
    .min(3, "Quiz musi zawierać co najmniej 3 pytania")
    .max(5, "Quiz może zawierać maksymalnie 5 pytań"),
})

// Typy TypeScript
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>
export type QuizFormData = z.infer<typeof QuizFormSchema>

// Typy dla generowania wideo
export interface VideoGenerationRequest {
  title: string
  questions: QuizQuestion[]
}

export interface VideoGenerationResponse {
  jobId: string
  message: string
}

export interface VideoGenerationStatus {
  jobId: string
  status: 'waiting' | 'processing' | 'completed' | 'failed'
  progress: number
  message?: string
  videoUrl?: string
  error?: string
}

export interface VideoGenerationError {
  message: string
  code: string
  retryable: boolean
} 