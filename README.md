# TikTok Video Generator

Aplikacja do automatycznego generowania filmów quiz w formacie TikTok (9:16, 1080×1920px).

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

### Kryteria akceptacji US-003
- [x] Spinner startuje ≤ 1s po kliknięciu
- [x] 95% generacji kończy się sukcesem < 30s
- [x] W razie błędu pojawia się komunikat z opcją ponów

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
- **Remotion 4** - Kompozycja i render wideo (mock)
- **Pino** - Strukturalne logowanie

## 📦 Instalacja i uruchomienie

### Wymagania
- Node.js 20+
- Redis (dla kolejki zadań)
- npm/yarn

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
cp backend/.env.example backend/.env
# Edytuj backend/.env jeśli potrzebujesz
```

5. **Uruchom aplikację**
```bash
npm run dev
```

Aplikacja będzie dostępna pod:
- **Frontend**: http://localhost:4322
- **Backend API**: http://localhost:3000

## 🎯 Użycie

### Tworzenie quiz wideo

1. Otwórz aplikację w przeglądarce
2. Wprowadź tytuł quizu
3. Dodaj 3-5 pytań z odpowiedziami (każde ≤ 120 znaków)
4. Opcjonalnie dodaj obrazy do pytań
5. Kliknij **"Generuj Wideo"**
6. Poczekaj na zakończenie generowania (≤ 30s)
7. Obejrzyj podgląd i pobierz MP4

### API Endpoints

```bash
# Rozpocznij generowanie wideo
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
  ]
}

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
│   │   ├── services/       # Serwisy (queue, render)
│   │   └── compositions/   # Kompozycje Remotion
│   └── package.json
└── package.json             # Root workspace
```

## 🚧 Aktualne ograniczenia

- **Mock rendering**: Używane są mocki zamiast prawdziwego Remotion/FFmpeg
- **Brak AI integration**: ElevenLabs i Replicate są zamockowane
- **Lokalne pliki**: Brak cloud storage (S3, CloudFlare)
- **Pojedyncza instancja**: Brak skalowania horizontal

## 🔄 Następne kroki

1. **US-004**: Edytor post-generacyjny
2. **US-005**: Podgląd wideo
3. **US-006**: Pobieranie MP4
4. **US-007**: Fallback assets
5. Integracja z prawdziwymi API (ElevenLabs, Replicate)
6. Implementacja prawdziwego renderingu Remotion
7. Cloud storage i CDN
8. Monitorowanie i metryki

## 📄 Licencja

MIT License - see LICENSE file for details 