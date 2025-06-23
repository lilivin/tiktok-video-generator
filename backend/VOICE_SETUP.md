# 🎙️ Konfiguracja Głosu (ElevenLabs) - Voice Setup

Kompletny przewodnik po konfiguracji funkcjonalności text-to-speech używając ElevenLabs API.

## 🔧 Wymagane Zmienne Środowiskowe

Dodaj następujące zmienne do swojego pliku `.env` w katalogu głównym projektu:

```bash
# === ELEVENLABS VOICE CONFIGURATION ===

# Podstawowe ustawienia
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VOICE_ENABLED=true

# Cache ustawienia
VOICE_CACHE_ENABLED=true
VOICE_CACHE_MAX_AGE=86400000  # 24h w milisekundach

# Domyślny głos (opcjonalne)
ELEVENLABS_DEFAULT_VOICE=pNInz6obpgDQGcFmaJgB  # Adam (English)

# Ustawienia głosu (opcjonalne - dostrojenie jakości)
ELEVENLABS_STABILITY=0.5           # 0.0-1.0, stabilność głosu
ELEVENLABS_SIMILARITY_BOOST=0.75   # 0.0-1.0, podobieństwo do oryginalnego głosu
ELEVENLABS_STYLE=0.0               # 0.0-1.0, stylizacja głosu
ELEVENLABS_USE_SPEAKER_BOOST=true  # true/false, wzmocnienie mówcy
```

## 📝 Jak Uzyskać API Key

1. Zarejestruj się na [ElevenLabs.io](https://elevenlabs.io)
2. Przejdź do [Settings > API Keys](https://elevenlabs.io/api)
3. Skopiuj swój API key
4. Wklej go jako wartość `ELEVENLABS_API_KEY` w pliku `.env`

## 🎯 Popularne Głosy ElevenLabs

### Angielskie Głosy
- **Adam** (`pNInz6obpgDQGcFmaJgB`) - Męski, głęboki, narrator
- **Bella** (`EXAVITQu4vr4xnSDxMaL`) - Żeński, młody, przyjazny
- **Antoni** (`ErXwobaYiN019PkySvjV`) - Męski, głęboki, profesjonalny
- **Elli** (`MF3mGyEYCl7XYWbV9V6O`) - Żeński, energiczny, młody
- **Josh** (`TxGEqnHWrfWFTfGW9XjX`) - Męski, spokojny, narrator

### Wielojęzyczne Głosy
- **Charlotte** (`XB0fDUnXU5powFXDhCwa`) - Żeński, wielojęzyczny
- **Daniel** (`onwK4e9ZLuTAKqWW03F9`) - Męski, wielojęzyczny
- **Liam** (`TX3LPaxmHKxFdv7VOQHJ`) - Męski, wielojęzyczny

## 🚀 Testowanie Konfiguracji

### 1. Test podstawowy
```bash
cd backend
npm run test:voice
```

### 2. Test przez API
```bash
# Status głosu
curl http://localhost:3000/api/voice/status

# Lista dostępnych głosów
curl http://localhost:3000/api/voice/voices

# Test generowania głosu
curl -X POST http://localhost:3000/api/voice/test \
  -H "Content-Type: application/json" \
  -d '{"text": "Witaj! To jest test generowania mowy."}'
```

## 🎛️ Ustawienia Jakości Głosu

### Stability (Stabilność): 0.0-1.0
- **0.0-0.3**: Bardziej ekspresyjny, różnorodny
- **0.4-0.6**: Zbalansowany (zalecane)
- **0.7-1.0**: Bardzo stabilny, monotonny

### Similarity Boost: 0.0-1.0
- **0.0-0.5**: Mniej podobny do oryginalnego głosu
- **0.6-0.8**: Zbalansowany (zalecane)
- **0.9-1.0**: Bardzo podobny do oryginalnego

### Style: 0.0-1.0
- **0.0**: Neutralny styl
- **0.5**: Lekka stylizacja
- **1.0**: Silna stylizacja

## 📁 Struktura Plików

Po prawidłowej konfiguracji, system utworzy następujące katalogi:

```
backend/
├── cache/audio/          # Cache plików audio
├── temp/                 # Tymczasowe pliki audio
└── outputs/             # Finalne wideo z audio
```

## 🔄 Integracja z Video Generation

### Włączenie głosu w video
```javascript
// Frontend request
const response = await fetch('/api/video/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Mój Quiz",
    questions: [
      { question: "Ile wynosi 2+2?", answer: "4" }
    ],
    enableVoice: true,          // Włącz głos
    voiceSettings: {
      voiceId: "pNInz6obpgDQGcFmaJgB",
      stability: 0.5,
      similarityBoost: 0.75
    }
  })
});
```

## 🐛 Rozwiązywanie Problemów

### Problem: "ElevenLabs not initialized"
**Rozwiązanie**: Sprawdź czy `ELEVENLABS_API_KEY` jest ustawiony w `.env`

### Problem: "Voice service unavailable"
**Rozwiązanie**: 
1. Sprawdź czy API key jest poprawny
2. Sprawdź czy masz kredyty na ElevenLabs
3. Sprawdź połączenie internetowe

### Problem: Cache nie działa
**Rozwiązanie**: Ustaw `VOICE_CACHE_ENABLED=true` w `.env`

### Problem: Błąd "Text too long"
**Rozwiązanie**: ElevenLabs ma limit znaków. Skróć tekst pytania/odpowiedzi.

## 💰 Limity i Koszty ElevenLabs

### Free Tier
- 10,000 znaków miesięcznie
- 3 custom voices
- Standardowa jakość

### Starter Plan ($5/miesiąc)
- 30,000 znaków miesięcznie
- 10 custom voices
- Wysoka jakość

### Creator Plan ($22/miesiąc)
- 100,000 znaków miesięcznie
- 30 custom voices
- Najwyższa jakość

## 📊 Monitoring i Logi

System automatycznie loguje:
- Liczba wygenerowanych audio
- Cache hits/misses
- Błędy API
- Czasy generowania

Sprawdź logi w konsoli serwera dla szczegółów.

## 🔧 Zaawansowana Konfiguracja

### Custom Voice Models
```bash
# Dodaj do .env
ELEVENLABS_MODEL_ID=eleven_multilingual_v2  # Dla języków innych niż angielski
```

### Performance Tuning
```bash
# Równoległe generowanie (experymentalne)
VOICE_PARALLEL_GENERATION=true
VOICE_MAX_CONCURRENT=3
```

### Cache Management
```bash
# Automatyczne czyszczenie cache
VOICE_AUTO_CLEANUP=true
VOICE_CLEANUP_INTERVAL=3600000  # 1h w milisekundach
```

## ✅ Checklist Konfiguracji

- [ ] Dodano `ELEVENLABS_API_KEY` do `.env`
- [ ] Ustawiono `VOICE_ENABLED=true`
- [ ] Skonfigurowano cache (`VOICE_CACHE_ENABLED=true`)
- [ ] Wybrano domyślny głos (`ELEVENLABS_DEFAULT_VOICE`)
- [ ] Przetestowano konfigurację (`npm run test:voice`)
- [ ] Sprawdzono API endpoints (`/api/voice/status`)
- [ ] Wygenerowano testowe wideo z głosem

Po wykonaniu wszystkich kroków, system będzie gotowy do generowania filmów TikTok z profesjonalnym głosem! 