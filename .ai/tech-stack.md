# Tech Stack – TikTok Video Automation Engine

## Frontend
| Technologia | Zastosowanie |
|-------------|--------------|
| Astro 5 | SSR + generacja statycznych stron |
| React 19 | Wyspy interaktywności |
| TypeScript 5 | Statyczne typowanie |
| Tailwind 4 | Narzędzie CSS (utility-first) |
| shadcn/ui | Gotowe komponenty UI React |
| React Hook Form | Zarządzanie formularzami |
| Zod | Walidacja danych wejściowych |

## Backend
| Technologia | Zastosowanie |
|-------------|--------------|
| Node.js 20 + TypeScript | Runtime i typowanie |
| Fastify | Lekki serwer REST API |
| Remotion 4 | Kompozycja i render wideo |
| FFmpeg (CLI) | Enkodowanie / kompresja MP4 |
| Puppeteer | Render klatek dla Remotion |
| BullMQ + Redis OSS | Kolejka zadań renderu |
| pino | Strukturalne logowanie |

## AI / Media
| Usługa | Zastosowanie |
|--------|--------------|
| Openrouter.ai | Dostęp do wielu modeli LLM |
| ElevenLabs TTS | Generacja lektora PL/EN |
| Replicate (Stable Diffusion) | Generacja statycznych teł |
| Pika Labs (opcjonalnie) | Animowane tła wideo |

## CI/CD i hosting
| Narzędzie | Zastosowanie |
|-----------|--------------|
| Docker + docker-compose | Konteneryzacja / lokalny playground |
| GitHub Actions | Pipeline CI/CD (build, test, deploy) |
| DigitalOcean Droplet | Hosting kontenera aplikacji |
| Terraform CLI | Deklaratywna konfiguracja infrastruktury |

## Testy i jakość
| Narzędzie | Zastosowanie |
|-----------|--------------|
| Vitest | Testy jednostkowe |
| React Testing Library | Testy komponentów |
| Playwright | Testy E2E (formularz → MP4) |
| ESLint + Prettier | Styl kodu i formatowanie |
| Husky + Commitlint | Hooki pre-commit i spójne commity |

## Obserwowalność
| Narzędzie | Zastosowanie |
|-----------|--------------|
| Uptime Kuma | Monitoring dostępności endpointów |
| Grafana Cloud (free tier) | Dashboard czasu renderu i logów |
