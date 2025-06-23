# TikTok Video Generator Backend

## Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
Create a `.env` file with your API keys:
```bash
# Enable AI Background Generation
AI_IMAGE_ENABLED=true
AI_IMAGE_PROVIDER=openai

# OpenAI API Key (recommended)
OPENAI_API_KEY=your_openai_key_here

# OR Replicate Token (alternative)
REPLICATE_API_TOKEN=your_replicate_token_here

# Optional settings
AI_IMAGE_QUALITY=standard
AI_IMAGE_CACHE_ENABLED=true
```

3. **Test the AI system**
```bash
npm run test:ai
```

4. **Start the server**
```bash
npm run dev
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
- `GET /api/video/status/:jobId` - Check generation status
- `GET /api/video/download/:jobId/:filename` - Download generated video

For detailed AI setup instructions, see [AI_SETUP.md](./AI_SETUP.md). 