import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SecondBrain API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for SecondBrain - AI-powered knowledge management system with spaced repetition, concept extraction, and smart study suggestions.',
      contact: {
        name: 'API Support',
        email: 'support@secondbrain.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.secondbrain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            createdAt: { type: 'string', format: 'date-time' },
            stats: {
              type: 'object',
              properties: {
                totalConcepts: { type: 'number', example: 42 },
                averageConfidence: { type: 'number', example: 75 },
                totalReviews: { type: 'number', example: 156 },
              },
            },
          },
        },
        Concept: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string', example: 'Spaced Repetition Algorithm' },
            description: { type: 'string', example: 'A learning technique that involves reviewing information at increasing intervals' },
            notes: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' }, example: ['memory', 'learning'] },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'intermediate' },
            confidenceScore: { type: 'number', minimum: 0, maximum: 100, example: 75 },
            sourceId: { type: 'string' },
            reviewCount: { type: 'number', example: 5 },
            lastReviewed: { type: 'string', format: 'date-time' },
            nextReview: { type: 'string', format: 'date-time' },
            reviewInterval: { type: 'number', example: 3 },
            easeFactor: { type: 'number', example: 2.5 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Source: {
          type: 'object',
          required: ['title', 'type'],
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string', example: 'Machine Learning Basics' },
            type: { type: 'string', enum: ['pdf', 'article', 'video', 'note', 'code', 'other'], example: 'pdf' },
            url: { type: 'string', format: 'uri' },
            filePath: { type: 'string' },
            fileName: { type: 'string' },
            fileSize: { type: 'number', example: 1024000 },
            content: { type: 'string' },
            metadata: {
              type: 'object',
              properties: {
                author: { type: 'string' },
                publishedDate: { type: 'string', format: 'date' },
                pageCount: { type: 'number' },
                wordCount: { type: 'number' },
              },
            },
            tags: { type: 'array', items: { type: 'string' } },
            conceptCount: { type: 'number', example: 8 },
            processed: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Challenge: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            conceptId: { type: 'string' },
            question: { type: 'string', example: 'What is the primary benefit of spaced repetition?' },
            options: { type: 'array', items: { type: 'string' }, example: ['Option A', 'Option B', 'Option C', 'Option D'] },
            correctAnswer: { type: 'number', minimum: 0, maximum: 3, example: 1 },
            explanation: { type: 'string', example: 'Spaced repetition improves long-term retention by...' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], example: 'medium' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        DecayAlert: {
          type: 'object',
          properties: {
            conceptId: { type: 'string' },
            title: { type: 'string' },
            decayType: { type: 'string', enum: ['overdue', 'declining_confidence', 'poor_performance', 'long_interval'] },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
            message: { type: 'string' },
            metrics: {
              type: 'object',
              properties: {
                currentConfidence: { type: 'number', example: 35 },
                daysOverdue: { type: 'number', example: 5 },
                daysSinceLastReview: { type: 'number', example: 12 },
              },
            },
            recommendedAction: { type: 'string' },
          },
        },
        StudySuggestion: {
          type: 'object',
          properties: {
            conceptId: { type: 'string' },
            title: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
            reason: { type: 'string' },
            estimatedTime: { type: 'number', example: 20 },
            actions: { type: 'array', items: { type: 'string' } },
            metrics: {
              type: 'object',
              properties: {
                confidenceScore: { type: 'number', example: 45 },
              },
            },
          },
        },
        ExtractedConcept: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Neural Networks' },
            description: { type: 'string', example: 'Computational models inspired by biological neural networks' },
            tags: { type: 'array', items: { type: 'string' }, example: ['ai', 'ml', 'deep-learning'] },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'advanced' },
            notes: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Concepts', description: 'Concept management endpoints' },
      { name: 'Sources', description: 'Source management and file upload endpoints' },
      { name: 'Extraction', description: 'AI-powered concept extraction endpoints' },
      { name: 'Challenges', description: 'AI-generated challenge endpoints' },
      { name: 'Study Plan', description: 'Personalized study suggestion endpoints' },
      { name: 'Decay Detection', description: 'Knowledge decay analysis endpoints' },
    ],
  },
  apis: ['./src/**/*.ts'], // Path to API docs
};

export const swaggerSpec = swaggerJsdoc(options);