# TikTok Video Generator

Automatyzacja tworzenia filmów na TikTok opartą na tech-stacku: Astro 4 + React 18 + Fastify + TypeScript.

## 🚀 Quick Start

### Wymagania
- Node.js 20+
- npm 10+

### Instalacja

```bash
# Instalacja zależności dla całego projektu
npm install

# Instalacja zależności dla backendu
npm install --workspace=backend

# Instalacja zależności dla frontendu
npm install --workspace=frontend
```

### Uruchomienie

```bash
# Uruchom backend i frontend jednocześnie
npm run dev

# Lub osobno:
npm run dev:backend  # Backend na http://localhost:3000
npm run dev:frontend # Frontend na http://localhost:4321
```

### Build

```bash
npm run build
```

### Testy

```bash
npm run test
```

## 📁 Struktura projektu

```
tiktok-video-generator/
├── backend/          # Node.js + Fastify + TypeScript
│   ├── src/
│   │   └── server.ts # Główny plik serwera
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── package.json
├── frontend/         # Astro 4 + React 18 + Tailwind 3
│   ├── src/
│   │   ├── components/
│   │   │   └── HelloWorld.tsx
│   │   ├── layouts/
│   │   │   └── Layout.astro
│   │   └── pages/
│   │       └── index.astro
│   ├── public/
│   │   └── favicon.svg
│   ├── astro.config.mjs
│   ├── tailwind.config.mjs
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── package.json      # Workspace root
```

## 🛠 Tech Stack

Rzeczywiste wersje używane w projekcie:

**Frontend:** Astro 4.15.0, React 18.3.0, TypeScript 5.3.3, Tailwind CSS 3.4.0  
**Backend:** Node.js 20, Fastify 4.24.3, TypeScript 5.3.3  
**Dev Tools:** ESLint, Prettier, Vitest, tsx (dev server)  
**Container:** Docker, docker-compose z Redis

## 📍 Endpointy

- **Frontend:** http://localhost:4321
- **Backend API:** http://localhost:3000
  - `GET /` - Hello World message
  - `GET /health` - Health check endpoint

## 🐳 Docker

```bash
# Uruchom za pomocą Docker Compose
docker-compose up --build

# W trybie detached
docker-compose up -d --build
```

## ✨ Funkcje

- ✅ **Backend:** Fastify REST API z CORS i security headers
- ✅ **Frontend:** Astro SSR z React islands
- ✅ **Styling:** Tailwind CSS z responsywnym designem
- ✅ **TypeScript:** Pełne typowanie w obu projektach
- ✅ **Dev Tools:** ESLint, Prettier, hot reload
- ✅ **Docker:** Konteneryzacja z Redis
- ✅ **Monorepo:** Workspace z shared scripts

## 📝 Notatki

Projekt jest przygotowany jako podstawa do implementacji user stories dla TikTok Video Generator. Wszystkie funkcje zgodne z tech-stackiem są skonfigurowane i gotowe do rozbudowy. 