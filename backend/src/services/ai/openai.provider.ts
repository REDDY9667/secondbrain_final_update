/**
 * OpenAI Provider Implementation
 *
 * This is the concrete implementation for OpenAI.
 * Can be easily swapped with another provider without changing business logic.
 */

import OpenAI from 'openai';
import { aiConfig } from '../../config/ai.config';
import {
  IAIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIProviderError,
} from './base-ai.provider';
import logger from '../../utils/logger';

export class OpenAIProvider implements IAIProvider {
  readonly name = 'openai';
  private client: OpenAI | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize OpenAI client
   */
  private initialize(): void {
    try {
      if (!aiConfig.openai.apiKey) {
        logger.warn('OpenAI API key not configured. AI features will be disabled.');
        return;
      }

      this.client = new OpenAI({
        apiKey: aiConfig.openai.apiKey,
        timeout: aiConfig.openai.timeout,
        maxRetries: aiConfig.retry.maxAttempts,
      });

      this.isInitialized = true;
      logger.info('OpenAI provider initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI provider:', error);
      throw new AIProviderError('Failed to initialize OpenAI', this.name, error);
    }
  }

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Generate a text completion
   */
  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured()) {
      throw new AIProviderError(
        'OpenAI provider is not configured. Please set OPENAI_API_KEY.',
        this.name
      );
    }

    try {
      const model = request.model || aiConfig.openai.defaultModel;
      const temperature = request.temperature ?? aiConfig.openai.temperature;
      const maxTokens = request.maxTokens || aiConfig.openai.maxTokens;

      logger.debug(`Calling OpenAI API with model: ${model}`);

      const completion = await this.client!.chat.completions.create({
        model,
        messages: request.messages,
        temperature,
        max_tokens: maxTokens,
      });

      const response: AICompletionResponse = {
        content: completion.choices[0]?.message?.content || '',
        model: completion.model,
        finishReason: completion.choices[0]?.finish_reason || undefined,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
      };

      logger.debug(`OpenAI response received. Tokens used: ${response.usage?.totalTokens || 0}`);

      return response;
    } catch (error: any) {
      logger.error('OpenAI API error:', error);

      // Handle specific OpenAI errors
      if (error.status === 401) {
        throw new AIProviderError('Invalid OpenAI API key', this.name, error);
      } else if (error.status === 429) {
        throw new AIProviderError('OpenAI rate limit exceeded', this.name, error);
      } else if (error.status === 500) {
        throw new AIProviderError('OpenAI server error', this.name, error);
      }

      throw new AIProviderError('Failed to generate completion', this.name, error);
    }
  }

  /**
   * Generate a JSON completion (for structured responses)
   */
  async generateJSONCompletion<T = any>(request: AICompletionRequest): Promise<T> {
    // Add JSON instruction to the system message
    const messagesWithJSONInstruction = [
      {
        role: 'system' as const,
        content:
          'You are a helpful assistant that responds ONLY with valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. Output pure JSON only.',
      },
      ...request.messages,
    ];

    const response = await this.generateCompletion({
      ...request,
      messages: messagesWithJSONInstruction,
    });

    try {
      // Clean the response content (remove markdown code blocks if present)
      let cleanContent = response.content.trim();

      // Remove markdown JSON code blocks
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(cleanContent) as T;
    } catch (error) {
      logger.error('Failed to parse JSON from OpenAI response:', response.content);
      throw new AIProviderError('Invalid JSON response from OpenAI', this.name, error);
    }
  }

  /**
   * Test the connection to OpenAI
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.generateCompletion({
        messages: [{ role: 'user', content: 'Say "OK"' }],
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}
