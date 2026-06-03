/**
 * AI Service Configuration
 *
 * This file contains all AI-related configurations.
 * Easy to modify without touching any business logic.
 */

export const aiConfig = {
  // OpenAI Configuration
  provider: process.env.AI_PROVIDER || 'openai', // Future: can switch to 'anthropic', 'local', etc.

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini',
    premiumModel: process.env.OPENAI_MODEL_PREMIUM || 'gpt-4o',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000', 10), // 30 seconds
  },

  // Feature-specific model assignments
  features: {
    challengeGeneration: process.env.AI_MODEL_CHALLENGES || 'gpt-4o-mini',
    decayDetection: process.env.AI_MODEL_DECAY || 'none', // No AI needed for decay
    studySuggestions: process.env.AI_MODEL_SUGGESTIONS || 'gpt-4o-mini',
    recommendations: process.env.AI_MODEL_RECOMMENDATIONS || 'gpt-4o-mini',
    learningPaths: process.env.AI_MODEL_PATHS || 'gpt-4o', // Complex task, use premium
  },

  // Retry & Error Handling
  retry: {
    maxAttempts: parseInt(process.env.AI_RETRY_MAX_ATTEMPTS || '3', 10),
    backoffMs: parseInt(process.env.AI_RETRY_BACKOFF_MS || '1000', 10),
  },

  // Rate Limiting for AI calls
  rateLimit: {
    enabled: process.env.AI_RATE_LIMIT_ENABLED !== 'false',
    maxCallsPerMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '20', 10),
  },

  // Caching
  cache: {
    enabled: process.env.AI_CACHE_ENABLED !== 'false',
    ttlSeconds: parseInt(process.env.AI_CACHE_TTL_SECONDS || '3600', 10), // 1 hour
  },

  // Fallback behavior when AI is unavailable
  fallback: {
    enabled: process.env.AI_FALLBACK_ENABLED !== 'false',
    useTemplates: process.env.AI_FALLBACK_USE_TEMPLATES !== 'false',
  },

  // OCR Configuration (for image-based PDFs)
  ocr: {
    provider: process.env.OCR_PROVIDER || 'google-vision',
    googleVision: {
      apiKey: process.env.GOOGLE_VISION_API_KEY || '',
    },
    // Minimum characters from standard text extraction before falling back to OCR
    minTextThreshold: parseInt(process.env.OCR_MIN_TEXT_THRESHOLD || '50', 10),
  },
};

/**
 * Validate AI configuration on startup
 */
export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if API key is provided (only if provider is openai)
  if (aiConfig.provider === 'openai' && !aiConfig.openai.apiKey) {
    errors.push('OPENAI_API_KEY is not set. AI features will be disabled.');
  }

  // Validate temperature range
  if (aiConfig.openai.temperature < 0 || aiConfig.openai.temperature > 2) {
    errors.push('OPENAI_TEMPERATURE must be between 0 and 2');
  }

  // Validate max tokens
  if (aiConfig.openai.maxTokens < 1 || aiConfig.openai.maxTokens > 4000) {
    errors.push('OPENAI_MAX_TOKENS must be between 1 and 4000');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
