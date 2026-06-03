/**
 * AI Provider Factory
 *
 * This factory creates and manages AI provider instances.
 * Makes it easy to switch providers without changing code.
 *
 * SINGLETON PATTERN: Only one instance of each provider exists.
 */

import { aiConfig } from '../../config/ai.config';
import { IAIProvider } from './base-ai.provider';
import { OpenAIProvider } from './openai.provider';
import  logger from '../../utils/logger';

class AIProviderFactory {
  private static instance: AIProviderFactory;
  private providers: Map<string, IAIProvider> = new Map();
  private currentProvider: IAIProvider | null = null;

  private constructor() {
    this.initializeProviders();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }

  /**
   * Initialize available providers
   */
  private initializeProviders(): void {
    try {
      // Register OpenAI provider
      const openaiProvider = new OpenAIProvider();
      this.providers.set('openai', openaiProvider);

      // Future: Add more providers here
      // this.providers.set('anthropic', new AnthropicProvider());
      // this.providers.set('local', new LocalModelProvider());

      // Set current provider based on config
      const providerName = aiConfig.provider;
      this.currentProvider = this.providers.get(providerName) || null;

      if (this.currentProvider) {
        logger.info(`AI Provider set to: ${providerName}`);
      } else {
        logger.warn(`AI Provider '${providerName}' not found. AI features may not work.`);
      }
    } catch (error) {
      logger.error('Failed to initialize AI providers:', error);
    }
  }

  /**
   * Get the current active AI provider
   */
  getProvider(): IAIProvider {
    if (!this.currentProvider) {
      throw new Error(
        `No AI provider configured. Please set AI_PROVIDER in environment variables.`
      );
    }

    if (!this.currentProvider.isConfigured()) {
      throw new Error(
        `AI provider '${this.currentProvider.name}' is not properly configured. Please check your API keys.`
      );
    }

    return this.currentProvider;
  }

  /**
   * Get a specific provider by name
   */
  getProviderByName(name: string): IAIProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Check if AI features are available
   */
  isAvailable(): boolean {
    return this.currentProvider !== null && this.currentProvider.isConfigured();
  }

  /**
   * Switch to a different provider
   */
  switchProvider(providerName: string): void {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`);
    }

    this.currentProvider = provider;
    logger.info(`Switched to AI provider: ${providerName}`);
  }

  /**
   * Get all registered providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Export singleton instance
 */
export const aiProviderFactory = AIProviderFactory.getInstance();

/**
 * Convenience function to get the current provider
 */
export function getAIProvider(): IAIProvider {
  return aiProviderFactory.getProvider();
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return aiProviderFactory.isAvailable();
}
