/**
 * Base AI Provider Interface
 *
 * This interface defines the contract for any AI provider.
 * Future providers (Anthropic, local models, etc.) must implement this.
 *
 * LOOSE COUPLING: Business logic depends on this interface, not specific implementations.
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AICompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Base interface that all AI providers must implement
 */
export interface IAIProvider {
  /**
   * Provider name (e.g., 'openai', 'anthropic', 'local')
   */
  readonly name: string;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Generate a completion from the AI model
   */
  generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse>;

  /**
   * Generate a JSON completion (for structured data)
   */
  generateJSONCompletion<T = any>(request: AICompletionRequest): Promise<T>;

  /**
   * Test the connection to the AI provider
   */
  testConnection(): Promise<boolean>;
}

/**
 * Error class for AI provider errors
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
