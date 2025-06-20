import React, { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { QuizFormData } from '@/types'
import { QuizFormSchema } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ImageUpload'
import { Plus, Trash2 } from 'lucide-react'

export default function QuizForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const onSubmit = async (data: QuizFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Dane formularza:', data)
      // Tutaj będzie logika wysyłania do API
      alert('Quiz został utworzony! (funkcjonalność w trakcie implementacji)')
    } catch (error) {
      console.error('Błąd podczas tworzenia quizu:', error)
      alert('Wystąpił błąd podczas tworzenia quizu.')
    } finally {
      setIsSubmitting(false)
    }
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

  const getCharacterCount = (value: string = '') => value.length
  const isMaxLength = (value: string = '') => value.length >= 120

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">
            Utwórz Quiz TikTok
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Wprowadź 3-5 pytań z odpowiedziami, aby utworzyć automatyczny film quiz
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
                  disabled={fields.length >= 5}
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
                              disabled={isSubmitting}
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

              {/* Komunikat o limitach */}
              {fields.length < 3 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                  <p className="text-sm text-destructive font-medium">
                    Quiz musi zawierać co najmniej 3 pytania
                  </p>
                </div>
              )}

              {fields.length >= 5 && (
                <div className="bg-muted border rounded-md p-4">
                  <p className="text-sm text-muted-foreground">
                    Osiągnięto maksymalną liczbę pytań (5)
                  </p>
                </div>
              )}
            </div>

            {/* Przycisk submit */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || fields.length < 3}
                className="min-w-[200px]"
              >
                {isSubmitting ? 'Tworzenie...' : 'Utwórz Quiz'}
              </Button>
            </div>

            {/* Ogólne błędy formularza */}
            {form.formState.errors.questions && !Array.isArray(form.formState.errors.questions) && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm text-destructive">
                  {form.formState.errors.questions.message}
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 