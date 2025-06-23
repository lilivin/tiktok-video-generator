import dotenv from 'dotenv'
import path from 'path';

// Load .env from parent directory (project root)
dotenv.config({ path: path.join(process.cwd(), '..', '.env') })

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import type { VideoGenerationRequest, VideoGenerationJob } from './types/video.js';
import { addVideoGenerationJob, getJobStatus } from './services/queue.js';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  },
});

// Rejestracja pluginów
await fastify.register(import('@fastify/helmet'));
await fastify.register(import('@fastify/cors'), {
  origin: ['http://localhost:4321', 'http://localhost:4322'],
});

// Obsługa multipart/form-data dla upload'ów
await fastify.register(import('@fastify/multipart'));

// Obsługa plików statycznych
await fastify.register(import('@fastify/static'), {
  root: path.join(process.cwd(), 'outputs'),
  prefix: '/api/video/download/',
});

// Upewnij się, że katalog outputs istnieje
const outputDir = path.join(process.cwd(), 'outputs');
await fs.mkdir(outputDir, { recursive: true });

// Hello World route
fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  return { message: 'Hello World from TikTok Video Generator Backend!' };
});

// Health check endpoint
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

// Endpoint do generowania wideo - US-003
fastify.post('/api/video/generate', async (request: FastifyRequest<{
  Body: VideoGenerationRequest
}>, reply: FastifyReply) => {
  try {
    const { title, questions } = request.body;

    // Walidacja danych wejściowych
    if (!title || !questions || questions.length < 3 || questions.length > 5) {
      return reply.status(400).send({
        error: 'Invalid input',
        message: 'Tytuł i 3-5 pytań są wymagane'
      });
    }

    // Walidacja pytań
    for (const question of questions) {
      if (!question.question || !question.answer) {
        return reply.status(400).send({
          error: 'Invalid question',
          message: 'Każde pytanie musi mieć treść i odpowiedź'
        });
      }
      
      if (question.question.length > 120 || question.answer.length > 120) {
        return reply.status(400).send({
          error: 'Question too long',
          message: 'Pytanie i odpowiedź nie mogą przekraczać 120 znaków'
        });
      }
    }

    // Stwórz job
    const jobId = randomUUID();
    const job: VideoGenerationJob = {
      id: jobId,
      title,
      questions,
      status: 'waiting',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Dodaj do kolejki
    await addVideoGenerationJob(job);

    fastify.log.info(`Video generation job created: ${jobId}`);

    return reply.status(202).send({
      jobId,
      message: 'Video generation started',
      status: 'waiting'
    });

  } catch (error) {
    fastify.log.error({ error }, 'Failed to create video generation job');
    
    return reply.status(500).send({
      error: 'Internal server error',
      message: 'Nie udało się rozpocząć generowania wideo'
    });
  }
});

// Endpoint do sprawdzania statusu - US-003
fastify.get('/api/video/status/:jobId', async (request: FastifyRequest<{
  Params: { jobId: string }
}>, reply: FastifyReply) => {
  try {
    const { jobId } = request.params;
    
    const jobStatus = getJobStatus(jobId);
    
    if (!jobStatus) {
      return reply.status(404).send({
        error: 'Job not found',
        message: 'Nie znaleziono zadania o podanym ID'
      });
    }

    return reply.send({
      jobId: jobStatus.id,
      status: jobStatus.status,
      progress: jobStatus.progress,
      message: jobStatus.message,
      videoUrl: jobStatus.videoUrl,
      error: jobStatus.error,
      createdAt: jobStatus.createdAt,
      updatedAt: jobStatus.updatedAt
    });

  } catch (error) {
    fastify.log.error({ error }, 'Failed to get job status');
    
    return reply.status(500).send({
      error: 'Internal server error',
      message: 'Nie udało się pobrać statusu zadania'
    });
  }
});

// Mock endpoint do pobierania wideo - generuje dummy MP4
fastify.get('/api/video/download/:jobId/:filename', async (request: FastifyRequest<{
  Params: { jobId: string; filename: string }
}>, reply: FastifyReply) => {
  try {
    const { jobId, filename } = request.params;
    
    // Sprawdź czy plik istnieje w katalogu outputs
    const videoPath = path.join(outputDir, filename);
    
    try {
      await fs.access(videoPath);
      return reply.sendFile(filename);
    } catch {
      // Plik nie istnieje
      fastify.log.warn(`Video file not found: ${videoPath}`);
      return reply.status(404).send({ 
        error: 'File not found',
        message: 'Plik wideo nie został znaleziony' 
      });
    }
    
  } catch (error) {
    fastify.log.error({ error }, 'Failed to serve video file');
    return reply.status(500).send({ 
      error: 'Internal server error',
      message: 'Nie udało się pobrać pliku wideo' 
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Backend server running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 