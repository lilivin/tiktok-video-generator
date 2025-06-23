import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { QuizFormData, VideoGenerationStatus } from '@/types'
import { QuizFormSchema } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ImageUpload } from '@/components/ImageUpload'
import { Plus, Trash2, Play, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function VideoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<VideoGenerationStatus | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<QuizFormData>({
    resolver: zodResolver(QuizFormSchema),
    defaultValues: {
      title: '',
      questions: [
        { question: '', answer: '', image: null },
        { question: '', answer: '', image: null },
        { question: '', answer: '', image: null },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  })

  // Polling dla statusu generowania
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (generationStatus && generationStatus.status === 'processing') {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/video/status/${generationStatus.jobId}`)
          const status: VideoGenerationStatus = await response.json()
          
          setGenerationStatus(status)
          
          if (status.status === 'completed' && status.videoUrl) {
            setVideoUrl(status.videoUrl)
            setIsGenerating(false)
          } else if (status.status === 'failed') {
            setError(status.error || 'Wystąpił błąd podczas generowania wideo')
            setIsGenerating(false)
          }
        } catch (err) {
          console.error('Błąd podczas pobierania statusu:', err)
        }
      }, 2000) // Co 2 sekundy
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [generationStatus])

  const onSubmit = async (data: QuizFormData) => {
    setIsGenerating(true)
    setError(null)
    setGenerationStatus(null)
    setVideoUrl(null)

    try {
      // Konwersja plików do base64
      const processedQuestions = await Promise.all(
        data.questions.map(async (question) => {
          if (question.image && question.image instanceof File) {
            const base64 = await fileToBase64(question.image)
            return { ...question, image: base64 }
          }
          return question
        })
      )

      const requestData = {
        title: data.title,
        questions: processedQuestions
      }

      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const result = await response.json()
      setGenerationStatus({
        jobId: result.jobId,
        status: 'processing',
        progress: 0,
        message: 'Rozpoczynanie generowania wideo...'
      })

    } catch (err) {
      console.error('Błąd podczas generowania wideo:', err)
      setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd')
      setIsGenerating(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const addQuestion = () => {
    if (fields.length < 5) {
      append({ question: '', answer: '', image: null })
    }
  }

  const removeQuestion = (index: number) => {
    if (fields.length > 3) {
      remove(index)
    }
  }

  const retryGeneration = () => {
    setError(null)
    setGenerationStatus(null)
    form.handleSubmit(onSubmit)()
  }

  const downloadVideo = () => {
    if (videoUrl) {
      const link = document.createElement('a')
      link.href = videoUrl
      link.download = `${form.getValues('title').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getCharacterCount = (value: string = '') => value.length
  const isMaxLength = (value: string = '') => value.length >= 120

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Formularz */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">
            Generator Wideo TikTok
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Wprowadź 3-5 pytań z odpowiedziami, aby wygenerować automatyczny film quiz
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Tytuł */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Tytuł quizu *
              </label>
              <Input
                id="title"
                placeholder="Np. Quiz wiedzy ogólnej"
                {...form.register('title')}
                className={form.formState.errors.title ? 'border-destructive' : ''}
                disabled={isGenerating}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {getCharacterCount(form.watch('title'))}/100 znaków
              </p>
            </div>

            {/* Pytania */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Pytania ({fields.length}/5)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  disabled={fields.length >= 5 || isGenerating}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Dodaj pytanie
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Pytanie {index + 1}</h4>
                        {fields.length > 3 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            disabled={isGenerating}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Pytanie */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Treść pytania *
                        </label>
                        <Textarea
                          placeholder="Wprowadź pytanie..."
                          {...form.register(`questions.${index}.question`)}
                          className={
                            form.formState.errors.questions?.[index]?.question
                              ? 'border-destructive'
                              : ''
                          }
                          maxLength={120}
                          disabled={isGenerating}
                        />
                        {form.formState.errors.questions?.[index]?.question && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.questions[index]?.question?.message}
                          </p>
                        )}
                        <p className={`text-xs ${
                          isMaxLength(form.watch(`questions.${index}.question`))
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}>
                          {getCharacterCount(form.watch(`questions.${index}.question`))}/120 znaków
                        </p>
                      </div>

                      {/* Odpowiedź */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Poprawna odpowiedź *
                        </label>
                        <Input
                          placeholder="Wprowadź odpowiedź..."
                          {...form.register(`questions.${index}.answer`)}
                          className={
                            form.formState.errors.questions?.[index]?.answer
                              ? 'border-destructive'
                              : ''
                          }
                          maxLength={120}
                          disabled={isGenerating}
                        />
                        {form.formState.errors.questions?.[index]?.answer && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.questions[index]?.answer?.message}
                          </p>
                        )}
                        <p className={`text-xs ${
                          isMaxLength(form.watch(`questions.${index}.answer`))
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}>
                          {getCharacterCount(form.watch(`questions.${index}.answer`))}/120 znaków
                        </p>
                      </div>

                      {/* Obraz (opcjonalny) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Obraz (opcjonalny)
                        </label>
                        <Controller
                          name={`questions.${index}.image`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              error={fieldState.error?.message}
                              disabled={isGenerating}
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          Obraz pomoże w wizualizacji pytania w filmie
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Komunikaty o limitach */}
              {fields.length < 3 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Wymagane minimum pytań</AlertTitle>
                  <AlertDescription>
                    Quiz musi zawierać co najmniej 3 pytania
                  </AlertDescription>
                </Alert>
              )}

              {fields.length >= 5 && (
                <Alert>
                  <AlertTitle>Maksymalna liczba pytań</AlertTitle>
                  <AlertDescription>
                    Osiągnięto maksymalną liczbę pytań (5)
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Przycisk Generate */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                size="lg"
                disabled={isGenerating || fields.length < 3}
                className="min-w-[200px] flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  'Generuj Wideo'
                )}
              </Button>
            </div>

            {/* Ogólne błędy formularza */}
            {form.formState.errors.questions && !Array.isArray(form.formState.errors.questions) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {form.formState.errors.questions.message}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Status generowania */}
      {generationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {generationStatus.status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
              {generationStatus.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {generationStatus.status === 'failed' && <AlertCircle className="h-5 w-5 text-destructive" />}
              Status generowania
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={generationStatus.progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {generationStatus.message || 'Przetwarzanie...'}
            </p>
            {generationStatus.status === 'processing' && (
              <p className="text-xs text-muted-foreground">
                Czas generowania: ≤ 30 sekund
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Błędy */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd generowania</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={retryGeneration}
              className="mt-2"
            >
              Spróbuj ponownie
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Podgląd wideo */}
      {videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Wideo gotowe!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden max-w-sm mx-auto">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-cover"
                poster="/api/video/thumbnail"
              >
                Twoja przeglądarka nie obsługuje odtwarzania wideo.
              </video>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={downloadVideo}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Pobierz MP4
              </Button>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Format: 1080×1920px, H.264, gotowy do TikTok
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 