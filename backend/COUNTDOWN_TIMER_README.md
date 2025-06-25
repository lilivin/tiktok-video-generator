# 🕐 Stoper z Dźwiękiem - Dokumentacja

## 📋 Opis Funkcjonalności

Nowa funkcja **stopera z dźwiękiem** dodaje wizualny i audio countdown podczas przerwy między pytaniem a odpowiedzią w quizach TikTok.

### Timeline Audio/Video:
```
0-3s:  Pytanie (audio + tekst)
3-6s:  STOPER 3→2→1 (audio: tick-tick-dong + wizualny countdown)
6-8s:  Odpowiedź (audio + tekst)
```

## 🎯 Implementacja

### 1. Audio Stoper (VoiceService)
- **Nowa metoda**: `generateCountdownAudio(index: number)`
- **Dźwięki**: 
  - `tick.mp3` dla cyfr 3 i 2 (800Hz, 0.1s)
  - `dong.mp3` dla cyfry 1 (1000Hz, 0.3s)
- **Timeline audio**: tick (0-1s) + tick (1-2s) + dong (2-3s)
- **Fallback**: Cisza jeśli stoper wyłączony

### 2. Wizualny Stoper (VideoRenderService)
- **Metoda**: `createQuestionSegment()` - dodano animowany countdown
- **Animacja**: 
  - Cyfra "3" (czerwona, 3-4s)
  - Cyfra "2" (pomarańczowa, 4-5s) 
  - Cyfra "1" (zielona, 5-6s)
- **Styl**: Duża czcionka (120px), czarne tło, wyśrodkowana

### 3. Pliki Assets
```
backend/assets/
├── tick.mp3    # 800Hz sine wave, 0.1s
└── dong.mp3    # 1000Hz sine wave, 0.3s
```

## ⚙️ Konfiguracja ENV

Dodaj do pliku `.env`:

```bash
# Countdown Timer Configuration
COUNTDOWN_ENABLED=true                # Włącz/wyłącz stoper (default: true)
COUNTDOWN_TICK_SOUND=tick.mp3        # Plik dźwięku tick (opcjonalne)
COUNTDOWN_DONG_SOUND=dong.mp3        # Plik dźwięku dong (opcjonalne)

# Istniejące zmienne timing (wymagane)
QUESTION_DURATION=3                   # Czas pytania w sekundach
PAUSE_DURATION=3                      # Czas stopera w sekundach  
ANSWER_DURATION=2                     # Czas odpowiedzi w sekundach
TOTAL_CLIP_DURATION=8                # Całkowity czas klipu
```

## 🔧 Kontrola Funkcjonalności

### Włączenie stopera:
```bash
COUNTDOWN_ENABLED=true
```

### Wyłączenie stopera (tylko cisza):
```bash
COUNTDOWN_ENABLED=false
```

## 📁 Zmodyfikowane Pliki

1. **`backend/src/services/voice.ts`**:
   - ✅ Dodano `TimingConfig.countdownEnabled`
   - ✅ Dodano `generateCountdownAudio()`
   - ✅ Dodano `concatenateCountdownAudio()`
   - ✅ Zmodyfikowano konstruktor - obsługa assets

2. **`backend/src/services/video-render.ts`**:
   - ✅ Zmodyfikowano `addVoiceToVideo()` - countdown zamiast ciszy
   - ✅ Zmodyfikowano `createQuestionSegment()` - wizualny stoper
   - ✅ Dodano animowane filtry FFmpeg

3. **`backend/assets/`**:
   - ✅ Dodano `tick.mp3`
   - ✅ Dodano `dong.mp3`

## 🎬 Rezultat

### Z stoperem włączonym (COUNTDOWN_ENABLED=true):
- **Audio**: tick w 3s, tick w 4s, dong w 5s
- **Video**: czerwona "3", pomarańczowa "2", zielona "1"
- **UX**: Dynamiczny, angażujący countdown

### Ze stoperem wyłączonym (COUNTDOWN_ENABLED=false):
- **Audio**: Cicha pauza 3 sekundy
- **Video**: Standardowy layout bez countdown
- **UX**: Klasyczny quiz bez dodatkowej animacji

## 🚀 Status Implementacji

- ✅ **Audio stopera**: Gotowe
- ✅ **Wizualny stoper**: Gotowe  
- ✅ **Pliki dźwiękowe**: Utworzone
- ✅ **Konfiguracja ENV**: Dodana
- ✅ **Dokumentacja**: Kompletna
- 🎯 **Gotowe do testowania**!

## 🧪 Testowanie

Uruchom test generacji wideo z nowymi funkcjonalnościami:

```bash
cd backend
npm run test:voice        # Test audio stopera
npm run build && npm start # Uruchom serwer z nową funkcjonalnością
```

Timeline będzie teraz: **Pytanie → Stoper 3-2-1 → Odpowiedź** 🎯