# AI Image Generation Setup

## Overview

This system uses AI-generated images as backgrounds for TikTok quiz videos instead of simple gradients. The system intelligently analyzes quiz questions and generates contextually appropriate backgrounds.

## Environment Configuration

Add these variables to your `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# AI Image Generation APIs
# Choose one or multiple providers (system will try in order of preference)

# OpenAI DALL-E 3 (Recommended - highest quality, good speed)
OPENAI_API_KEY=your_openai_api_key_here

# Replicate (Alternative - Stable Diffusion models)
REPLICATE_API_TOKEN=your_replicate_token_here

# Midjourney (Future implementation)
MIDJOURNEY_API_KEY=your_midjourney_key_here

# ElevenLabs TTS
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# AI Image Generation Settings
AI_IMAGE_ENABLED=true
AI_IMAGE_PROVIDER=openai # openai, replicate, midjourney
AI_IMAGE_QUALITY=standard # standard, hd (OpenAI), or equivalent for other providers
AI_IMAGE_SIZE=1024x1024 # Image dimensions
AI_IMAGE_CACHE_ENABLED=true
AI_IMAGE_CACHE_TTL=86400 # Cache TTL in seconds (24 hours)
AI_IMAGE_MAX_RETRIES=3
AI_IMAGE_TIMEOUT=30000 # Timeout in milliseconds

# Fallback Strategy
FALLBACK_TO_GRADIENTS=true
FALLBACK_TO_COLORS=true

# Server Configuration  
PORT=3001
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

## How It Works

### 1. Question Analysis
The system analyzes quiz questions to determine:
- **Category**: Geography, History, Science, Sports, Culture, Nature, Technology, Food, Animals, or General
- **Keywords**: Extracts relevant keywords from the question
- **Style**: Selects appropriate visual style based on category

### 2. Prompt Generation
Based on the analysis, the system generates intelligent prompts for AI:

**Examples:**
- Geography: "Jaka jest stolica Francji?" → "Beautiful cityscape of Paris Francji, aerial view, urban landscape, modern architecture, photorealistic, high quality, 4K, professional, vertical orientation, 9:16 aspect ratio, mobile optimized"
- History: "Kiedy wybuchła II wojna światowa?" → "Historical scene depicting wojna światowa, vintage atmosphere, period accurate, documentary style, vintage style, retro, nostalgic, aged photography effect, high quality, 4K, professional, vertical orientation, 9:16 aspect ratio, mobile optimized"
- Science: "Co to jest H2O?" → "Scientific visualization of H2O, modern laboratory, research environment, educational, minimalistic design, clean, simple, modern, high quality, 4K, professional, vertical orientation, 9:16 aspect ratio, mobile optimized"

### 3. AI Providers

#### OpenAI DALL-E 3 (Recommended)
- **Pros**: Highest quality, good understanding of prompts, fast generation
- **Cons**: More expensive per image
- **Setup**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)

#### Replicate (Stable Diffusion)
- **Pros**: More control over parameters, often cheaper
- **Cons**: May require more prompt engineering
- **Setup**: Get token from [Replicate](https://replicate.com/account/api-tokens)

### 4. Caching System
- Images are cached locally to avoid regenerating identical backgrounds
- Cache expires after 24 hours by default (configurable)
- Significantly reduces API costs for repeated questions

### 5. Fallback Strategy
If AI generation fails or is disabled:
1. **Primary Fallback**: Colorful gradients (current system)
2. **Secondary Fallback**: Solid colors
3. **Final Fallback**: Default blue background

## Usage Examples

### Basic Quiz Questions

```javascript
const questions = [
  {
    question: "Jaka jest najwyższa góra w Polsce?",
    answer: "Rysy"
  },
  {
    question: "Kiedy Polska odzyskała niepodległość?", 
    answer: "1918"
  },
  {
    question: "Co to jest fotosynteza?",
    answer: "Proces produkcji glukoza w roślinach"
  }
]
```

**Generated Backgrounds:**
1. **Geography**: Mountain landscape of Polish Tatras with dramatic peaks
2. **History**: Historical Polish independence scene with vintage styling  
3. **Science**: Scientific visualization of photosynthesis process

### Advanced Configuration

```javascript
// Disable AI for specific questions
const questionWithCustomImage = {
  question: "Jak wygląda flaga Polski?",
  answer: "Biało-czerwona",
  image: "data:image/jpeg;base64,..." // Custom image
}

// System will use the provided image instead of generating AI background
```

## API Costs Estimation

### OpenAI DALL-E 3
- **Standard Quality**: ~$0.040 per image
- **HD Quality**: ~$0.080 per image

### Replicate (SDXL)
- **Per Generation**: ~$0.003-0.01 per image
- **Varies by model**: Different models have different pricing

### Cost Optimization Tips
1. **Enable Caching**: Reduces repeated generations
2. **Use Standard Quality**: Unless HD is specifically needed
3. **Batch Processing**: Generate multiple images in parallel
4. **Smart Fallbacks**: Let system fallback to gradients when appropriate

## Monitoring and Logging

The system provides comprehensive logging:

```bash
# View AI generation logs
tail -f logs/video-render.log | grep "AI"

# Monitor costs and usage
tail -f logs/ai-image.log | grep "cost\|provider"
```

## Troubleshooting

### Common Issues

1. **"No AI image provider available"**
   - Check if API keys are set correctly
   - Verify API key validity
   - Check network connectivity

2. **"AI generation timeout"**
   - Increase `AI_IMAGE_TIMEOUT` value
   - Check provider status
   - Try different provider

3. **Poor image quality**
   - Adjust prompt generation logic
   - Try different AI provider
   - Increase quality setting

4. **High API costs**
   - Enable caching
   - Use standard quality
   - Implement rate limiting

### Debugging

Enable debug logging:
```bash
LOG_LEVEL=debug
```

Check AI service status:
```bash
curl localhost:3001/api/ai/status
```

## Performance Optimization

### Parallel Processing
The system generates multiple backgrounds in parallel when possible:

```typescript
// Multiple questions processed simultaneously
const backgrounds = await Promise.all(
  questions.map((q, i) => this.generateAIBackground(q.question, i))
)
```

### Smart Caching
- **Memory Cache**: Fast access to recently generated images
- **Disk Cache**: Persistent storage for frequently used backgrounds
- **Cache Invalidation**: Automatic cleanup of expired images

### Rate Limiting
Built-in rate limiting prevents API quota exhaustion:
- Maximum concurrent requests: 3
- Retry logic with exponential backoff
- Graceful degradation to fallbacks

## Future Enhancements

1. **Additional Providers**: Midjourney API integration
2. **Custom Models**: Fine-tuned models for specific content types
3. **Smart Preprocessing**: Image optimization and compression
4. **Analytics**: Usage tracking and cost monitoring
5. **A/B Testing**: Compare AI vs gradient backgrounds performance 