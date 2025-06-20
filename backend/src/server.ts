import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

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
  origin: ['http://localhost:4321'],
});

// Hello World route
fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  return { message: 'Hello World from TikTok Video Generator Backend!' };
});

// Health check endpoint
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
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