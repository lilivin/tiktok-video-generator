# Backend - TikTok Video Generator

Backend aplikacji do generowania filmów typu quiz na TikTok z wykorzystaniem AI.

## Funkcjonalności

- **Generowanie pytań quiz** - automatyczne tworzenie pytań z odpowiedziami
- **Synteza mowy** - lektor AI (ElevenLabs) z polskim głosem  
- **Generowanie teł AI** - automatyczne tła dopasowane do treści pytań
- **Sekcja intro** - "Nie odpowiesz, odpadasz - {tytuł quizu}" na początku filmu
- **Renderowanie wideo** - automatyczne tworzenie filmów w formacie TikTok (9:16)
- **System kolejki** - Redis + BullMQ do przetwarzania zadań

## Konfiguracja

Create a `.env` file with your API keys:

```env
# API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
REPLICATE_API_TOKEN=your_replicate_token_here

# Voice Configuration
VOICE_ENABLED=true
ELEVENLABS_DEFAULT_VOICE=9BWtsMINqrJLrRacOk9x

# Audio Timing
QUESTION_DURATION=3
PAUSE_DURATION=3
ANSWER_DURATION=2
TOTAL_CLIP_DURATION=8
COUNTDOWN_ENABLED=true

# Intro Configuration
INTRO_ENABLED=true

# AI Images
AI_IMAGE_ENABLED=true
AI_IMAGE_PROVIDER=openai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Sekcja Intro

Nowa funkcjonalność dodaje sekcję intro na początku każdego filmu:

- **Tekst**: "Nie odpowiesz, odpadasz - {tytuł quizu}"
- **Długość**: ~4 sekundy
- **Pozycja**: Przed pierwszym pytaniem  
- **Głos**: ElevenLabs z tym samym głosem co pytania
- **Tło**: Gradient kolorowy (#667eea)

### Konfiguracja Intro

```env
# Włącz/wyłącz intro (domyślnie: włączone)
INTRO_ENABLED=true
```

Intro jest automatycznie dodawane gdy:
- `INTRO_ENABLED` != 'false'
- `VOICE_ENABLED` = 'true'  
- ElevenLabs API jest dostępne

## Timeline Wideo

🎯 **Nowy timeline z intro:**

```
0:00-0:04 - Intro: "Nie odpowiesz, odpadasz - {tytuł}"
0:04-0:12 - Pytanie 1 (8s)
0:12-0:20 - Pytanie 2 (8s)
0:20-0:28 - Pytanie 3 (8s)
...
```

## Instalacja

```bash
npm install
```

## Uruchomienie

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Generate Video
```
POST /api/video/generate
Content-Type: application/json

{
  "title": "Quiz o historii",
  "questions": [
    {
      "question": "Kto odkrył Amerykę?",
      "answer": "Krzysztof Kolumb"
    }
  ],
  "enableIntro": true
}
```

### Check Status
```
GET /api/video/status/:jobId
```

### Download Video
```
GET /api/video/download/:jobId/:filename
```

## Architektura

- **Fastify** - Web framework
- **Redis + BullMQ** - Queue system
- **ElevenLabs** - Text-to-speech
- **OpenAI/Replicate** - AI image generation  
- **FFmpeg** - Video processing

## Development

### Basic Setup (.env)
```env
ELEVENLABS_API_KEY=your_key
VOICE_ENABLED=true
INTRO_ENABLED=true
```

### Advanced Setup (.env)
```env
# All voice features
VOICE_ENABLED=true
VOICE_CACHE_ENABLED=true
COUNTDOWN_ENABLED=true
INTRO_ENABLED=true

# AI images  
AI_IMAGE_ENABLED=true
AI_IMAGE_PROVIDER=openai
OPENAI_API_KEY=your_key
```

## Logging

Aplikacja używa structured logging (Pino):

```bash
# Zobacz logi intro
tail -f logs/app.log | grep "intro"

# Zobacz logi voice
tail -f logs/app.log | grep "voice" 
```

## AI Background Generation

The system automatically generates contextual backgrounds for quiz questions using AI:

### Example Questions → AI Backgrounds

- **Geography**: "Jaka jest stolica Francji?" → Beautiful Parisian cityscape
- **History**: "Kiedy wybuchła II wojna światowa?" → Historical WWII scene
- **Science**: "Co to jest fotosynteza?" → Scientific visualization
- **Sports**: "Ile trwa mecz piłki nożnej?" → Dynamic stadium scene

### How It Works

1. **Question Analysis**: Categorizes questions (Geography, History, Science, etc.)
2. **Prompt Generation**: Creates intelligent AI prompts based on content
3. **Image Generation**: Uses OpenAI DALL-E 3 or Replicate to create backgrounds
4. **Smart Caching**: Stores generated images to reduce API costs
5. **Fallback System**: Uses gradients if AI generation fails

## API Providers

### OpenAI DALL-E 3 (Recommended)
- Highest quality images
- Best prompt understanding
- ~$0.04 per image (standard quality)
- Get API key: https://platform.openai.com/api-keys

### Replicate (Alternative)
- More affordable option
- Stable Diffusion models
- ~$0.003-0.01 per image
- Get token: https://replicate.com/account/api-tokens

## Configuration Examples

### Basic Setup (.env)
```bash
AI_IMAGE_ENABLED=true
AI_IMAGE_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_IMAGE_QUALITY=standard
AI_IMAGE_CACHE_ENABLED=true
```

### Advanced Setup (.env)
```bash
AI_IMAGE_ENABLED=true
AI_IMAGE_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_IMAGE_QUALITY=hd
AI_IMAGE_CACHE_ENABLED=true
AI_IMAGE_CACHE_TTL=86400
AI_IMAGE_TIMEOUT=30000
FALLBACK_TO_GRADIENTS=true
```

### Disable AI (fallback to gradients)
```bash
AI_IMAGE_ENABLED=false
```

## Testing

### Test AI Background Generation
```bash
npm run test:ai
```

### Test with Custom Questions
```typescript
import { VideoRenderService } from './services/video-render.js'

const videoService = new VideoRenderService()
const questions = [
  { question: "Jaka jest najwyższa góra w Polsce?", answer: "Rysy" },
  { question: "Co to jest fotosynteza?", answer: "Proces w roślinach" }
]

const backgrounds = await videoService.generateBackgrounds(questions)
```

## Cost Optimization

1. **Enable Caching**: Set `AI_IMAGE_CACHE_ENABLED=true`
2. **Use Standard Quality**: Set `AI_IMAGE_QUALITY=standard`
3. **Monitor Usage**: Check logs for API calls
4. **Smart Fallbacks**: System automatically falls back to gradients on errors

## Troubleshooting

### "No AI image provider available"
- Check if API keys are set correctly
- Verify environment variables are loaded
- Test API key validity

### "AI generation timeout"
- Increase `AI_IMAGE_TIMEOUT` value
- Check internet connection
- Try different provider

### High API costs
- Enable caching
- Use standard quality instead of HD
- Monitor usage with logs

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Test AI functionality
npm run test:ai

# Lint code
npm run lint
```

## Architecture

```
src/
├── services/
│   ├── video-render.ts      # Main video generation service
│   ├── ai-image.ts          # AI image generation service
│   ├── prompt-generator.ts  # Intelligent prompt generation
│   └── queue.ts            # Job queue management
├── types/
│   └── video.ts            # TypeScript types
└── server.ts               # Express server
```

## API Endpoints

- `POST /api/video/generate` - Generate video with AI backgrounds
- `