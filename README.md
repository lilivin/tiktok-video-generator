# TikTok Video Generator

Aplikacja do automatycznego generowania filmów quiz w formacie TikTok (9:16, 1080×1920px) z AI-generowanymi obrazami i profesjonalnym głosem.

## 🚀 US-003 - Generuj Wideo

### Funkcjonalności
- ✅ Formularz do wprowadzania 3-5 pytań z odpowiedziami
- ✅ Walidacja danych wejściowych (max 120 znaków/pytanie)
- ✅ Przycisk "Generuj Wideo" z spinnerem
- ✅ Asynchroniczne generowanie wideo w tle
- ✅ Podgląd wideo i możliwość pobrania MP4
- ✅ Obsługa błędów z opcją ponownej próby
- ✅ Czas generowania ≤ 30 sekund
- ✅ Format zgodny z TikTok (1080×1920, H.264)
- ✅ **NOWE**: Generowanie głosu (Text-to-Speech) z ElevenLabs
- ✅ **NOWE**: Cache system dla plików audio
- ✅ **NOWE**: Konfigurowalny system głosów

### Kryteria akceptacji US-003
- [x] Spinner startuje ≤ 1s po kliknięciu
- [x] 95% generacji kończy się sukcesem < 30s
- [x] W razie błędu pojawia się komunikat z opcją ponów
- [x] **NOWE**: Opcjonalny głos AI czyta pytania i odpowiedzi

## 🎙️ Nowa Funkcjonalność: AI Voice (ElevenLabs)

### Możliwości
- **Text-to-Speech**: Automatyczne generowanie głosu dla pytań i odpowiedzi
- **Wielojęzyczne głosy**: Obsługa polskich i angielskich głosów
- **Cache system**: Inteligentne cache'owanie audio dla optymalizacji kosztów
- **Konfigurowalność**: Dostrojenie stabilności, podobieństwa i stylu głosu
- **Fallback**: Automatyczne przełączanie na ciszę w przypadku problemów

### Konfiguracja
1. **Uzyskaj API Key** na [ElevenLabs.io](https://elevenlabs.io)
2. **Dodaj do .env**:
```bash
ELEVENLABS_API_KEY=your_api_key_here
VOICE_ENABLED=true
VOICE_CACHE_ENABLED=true
```
3. **Przetestuj**: `npm run test:voice`

📖 **Pełna dokumentacja**: [backend/VOICE_SETUP.md](backend/VOICE_SETUP.md)

## 🛠 Tech Stack

### Frontend
- **Astro 5** - SSR + generacja statycznych stron
- **React 19** - Wyspy interaktywności
- **TypeScript 5** - Statyczne typowanie
- **Tailwind 4** - Utility-first CSS
- **shadcn/ui** - Komponenty UI
- **React Hook Form + Zod** - Zarządzanie formularzami

### Backend
- **Node.js 20 + TypeScript** - Runtime i typowanie
- **Fastify** - Lekki serwer REST API
- **BullMQ + Redis** - Kolejka zadań
- **Remotion 4** - Kompozycja i render wideo
- **ElevenLabs API** - 🆕 Text-to-Speech AI
- **OpenAI DALL-E / Replicate** - AI obrazy
- **Pino** - Strukturalne logowanie

## 📦 Instalacja i uruchomienie

### Wymagania
- Node.js 20+
- Redis (dla kolejki zadań)
- npm/yarn
- 🆕 **ElevenLabs API Key** (opcjonalne, dla głosu)

### Szybki start

1. **Sklonuj repozytorium**
```bash
git clone <repository-url>
cd tiktok-video-generator
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Uruchom Redis (wymagane)**
```bash
# macOS z Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run --name redis -p 6379:6379 -d redis:alpine
```

4. **Skonfiguruj środowisko**
```bash
# Skopiuj przykładowy plik .env
cp .env.example .env

# Edytuj .env i dodaj klucze API:
# ELEVENLABS_API_KEY=your_elevenlabs_key (dla głosu)
# OPENAI_API_KEY=your_openai_key (dla AI obrazów)
```

5. **Uruchom aplikację**
```bash
npm run dev
```

Aplikacja będzie dostępna pod:
- **Frontend**: http://localhost:4322
- **Backend API**: http://localhost:3000

## 🎯 Użycie

### Tworzenie quiz wideo z głosem

1. Otwórz aplikację w przeglądarce
2. Wprowadź tytuł quizu
3. Dodaj 3-5 pytań z odpowiedziami (każde ≤ 120 znaków)
4. Opcjonalnie dodaj obrazy do pytań
5. **🆕 Włącz opcję głosu** (jeśli skonfigurowane)
6. **🆕 Wybierz głos** z dostępnej listy
7. Kliknij **"Generuj Wideo"**
8. Poczekaj na zakończenie generowania (≤ 30s)
9. Obejrzyj podgląd z głosem i pobierz MP4

### API Endpoints

```bash
# Rozpocznij generowanie wideo (z głosem)
POST /api/video/generate
Content-Type: application/json
{
  "title": "Mój Quiz",
  "questions": [
    {
      "question": "Jakie jest największe miasto w Polsce?",
      "answer": "Warszawa",
      "image": "data:image/jpeg;base64,..." // opcjonalnie
    }
  ],
  "enableVoice": true,  // 🆕 Włącz głos
  "voiceSettings": {    // 🆕 Ustawienia głosu
    "voiceId": "pNInz6obpgDQGcFmaJgB",
    "stability": 0.5,
    "similarityBoost": 0.75
  }
}

# 🆕 Voice API endpoints
GET /api/voice/status          # Status serwisu głosu
GET /api/voice/voices          # Lista dostępnych głosów
POST /api/voice/test           # Test generowania głosu

# Sprawdź status generowania
GET /api/video/status/{jobId}

# Pobierz wideo
GET /api/video/download/{jobId}/{filename}
```

## 🧪 Testowanie

```bash
# Testy jednostkowe
npm test

# Testy E2E
npm run test:e2e

# 🆕 Test AI obrazów
npm run test:ai

# 🆕 Test głosu
npm run test:voice

# Linting
npm run lint
```

## 📁 Struktura projektu

```
tiktok-video-generator/
├── frontend/                 # Aplikacja Astro + React
│   ├── src/
│   │   ├── components/      # Komponenty React
│   │   │   ├── ui/         # shadcn/ui komponenty
│   │   │   └── VideoGenerator.tsx
│   │   ├── pages/          # Strony Astro
│   │   ├── layouts/        # Layouty Astro
│   │   └── types.ts        # Typy TypeScript
│   └── package.json
├── backend/                  # Serwer Node.js
│   ├── src/
│   │   ├── server.ts       # Główny serwer Fastify
│   │   ├── types/          # Typy backend
│   │   ├── services/       # Serwisy (queue, render, voice, ai-image)
│   │   │   ├── voice.ts    # 🆕 ElevenLabs integration
│   │   │   ├── ai-image.ts # AI obrazy
│   │   │   └── video-render.ts
│   │   └── compositions/   # Kompozycje Remotion
│   ├── cache/              # 🆕 Cache plików (audio, obrazy)
│   ├── VOICE_SETUP.md      # 🆕 Dokumentacja głosu
│   └── package.json
└── package.json             # Root workspace
```

## 🚧 Obecne możliwości

### ✅ Działające funkcje
- **Podstawowe generowanie wideo**: Quiz format, TikTok wymiary
- **AI obrazy**: OpenAI DALL-E 3 + Replicate Stable Diffusion
- **🆕 AI głos**: ElevenLabs Text-to-Speech z cache systemem
- **Queue system**: BullMQ + Redis dla asynchronicznego przetwarzania
- **Cache system**: Inteligentne cache'owanie AI assets
- **Error handling**: Fallback na gradient backgrounds i ciszę

### 🔧 W trakcie rozwijania
- UI controls dla ustawień głosu
- Zaawansowane opcje głosu (tempo, ton)
- Więcej języków i głosów

## 🔄 Następne kroki

1. **US-004**: Edytor post-generacyjny
2. **US-005**: Podgląd wideo z kontrolą głosu
3. **US-006**: Zaawansowane pobieranie MP4
4. **US-007**: Fallback assets optimization
5. **🆕 Voice UI**: Frontend controls dla głosu
6. **🆕 Voice Analytics**: Monitoring użycia i kosztów
7. Cloud storage i CDN
8. Monitorowanie i metryki

## 💡 Szybki Test

Po skonfigurowaniu wszystkich API keys:

```bash
# 1. Test AI obrazów
cd backend && npm run test:ai

# 2. Test głosu
npm run test:voice

# 3. Uruchom aplikację
cd .. && npm run dev

# 4. Utwórz quiz z głosem w przeglądarce
```

## 📄 Licencja

MIT License - see LICENSE file for details 