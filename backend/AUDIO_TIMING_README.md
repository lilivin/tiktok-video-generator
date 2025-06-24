# System Timing Audio dla Quizów

## Przegląd
Nowy system audio implementuje precyzyjny timing dla każdego klipu quizu:
- **Każdy klip: 8 sekund**
- **Timeline: Pytanie (0-2s) → Cisza/Zegar (2-5s) → Odpowiedź (5-8s)**

## Zmiany w VoiceService

### Nowe interfejsy
```typescript
interface QuestionAnswerAudio {
  questionAudio: string  // Plik audio z pytaniem
  answerAudio: string    // Plik audio z odpowiedzią
}

interface TimingConfig {
  questionDuration: number  // Długość pytania (domyślnie 2s)
  pauseDuration: number     // Długość pauzy (domyślnie 3s) 
  answerDuration: number    // Długość odpowiedzi (domyślnie 3s)
  totalDuration: number     // Całkowita długość (domyślnie 8s)
}
```

### Nowe metody
- `generateQuestionAnswerAudio()` - Generuje oddzielne pliki audio dla pytania i odpowiedzi
- `getTimingConfig()` - Pobiera konfigurację timing
- `ensureAudioDuration()` - Zapewnia odpowiednią długość audio (przycinanie/padding)

### Zmodyfikowane metody
- `generateQuizAudio()` - Teraz zwraca `QuestionAnswerAudio[]` zamiast `string[]`

## Zmiany w VideoRenderService

### Nowe metody
- `addVoiceToVideo()` - Tworzy kompozytowy plik audio z timelineiem
- `concatenateAudioFiles()` - Łączy pliki audio w sekwencji
- `ensureTotalAudioDuration()` - Zapewnia dokładną długość 8 sekund

### Zmodyfikowane metody
- `generateVoiceover()` - Zwraca `QuestionAnswerAudio[]`
- `renderVideo()` - Przyjmuje `QuestionAnswerAudio[]` jako parametr
- `createQuizVideo()` - Używa nowego systemu audio

## Konfiguracja ENV

### Nowe zmienne środowiskowe
```bash
# Timing audio (w sekundach)
QUESTION_DURATION=2.0      # Długość pytania
PAUSE_DURATION=3.0         # Długość pauzy/zegara
ANSWER_DURATION=3.0        # Długość odpowiedzi  
TOTAL_CLIP_DURATION=8.0    # Całkowita długość klipu

# Istniejące opcje audio
VOICE_ENABLED=true
VOICE_CACHE_ENABLED=true
ELEVENLABS_API_KEY=your_key
```

## Funkcjonalności

### Automatyczne dostosowanie długości
- **Audio za długie**: Automatycznie przycinane do docelowej długości
- **Audio za krótkie**: Dopełniane ciszą do docelowej długości
- **Fallback**: W przypadku błędu generowania - automatyczna cisza

### System cache
- Zachowano istniejący system cache dla optymalizacji
- Cache działa dla każdego fragmentu audio oddzielnie

### Struktura plików audio
```
temp/
├── voice_question_0.mp3  # Pytanie 1
├── voice_answer_0.mp3    # Odpowiedź 1
├── pause_0.mp3           # Pauza 1
├── composite_audio_0.mp3 # Finalny klip 1 (8s)
├── voice_question_1.mp3  # Pytanie 2
└── ...
```

## Timeline klipu (8 sekund)

```
0s    2s         5s         8s
|-----|----------|----------|
Pytanie  Cisza    Odpowiedź
 (2s)    (3s)      (3s)
```

## Testowanie

Zaktualizowano `test-voice.ts` z nowymi testami:
- Test generowania oddzielnych plików audio
- Test konfiguracji timing
- Test cache dla nowego systemu

## Kompatybilność

Rozwiązanie jest w pełni kompatybilne z istniejącym kodem:
- Zachowano wszystkie istniejące funkcjonalności
- Dodano nowe bez łamania obecnych interfejsów
- Fallback do ciszy w przypadku problemów z audio

## Użycie

```typescript
// Generowanie audio z nowym systemem
const voiceService = new VoiceService()
const audioResult = await voiceService.generateQuestionAnswerAudio({
  question: "Jaka jest stolica Polski?",
  answer: "Warszawa",
  index: 0
})

// Tworzenie kompozytowego audio z timelineiem
const renderService = new VideoRenderService()
const compositeAudio = await renderService.addVoiceToVideo(audioResult, 0)
``` 