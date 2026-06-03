/**
 * OCR Provider Factory
 *
 * Creates and manages OCR provider instances.
 * Makes it easy to switch OCR providers without changing business logic.
 *
 * SINGLETON PATTERN: Only one instance of each provider exists.
 *
 * Supported providers:
 * - google-vision: Google Cloud Vision API
 * - (Future) aws-textract: AWS Textract
 * - (Future) tesseract: Tesseract.js (local, no API key needed)
 */

import { IOCRProvider } from './ocr-provider.interface';
import { GoogleVisionOCRProvider } from './google-vision-ocr.provider';
import logger from '../../utils/logger';

class OCRFactory {
  private static instance: OCRFactory;
  private providers: Map<string, IOCRProvider> = new Map();
  private currentProvider: IOCRProvider | null = null;

  private constructor() {
    this.initializeProviders();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OCRFactory {
    if (!OCRFactory.instance) {
      OCRFactory.instance = new OCRFactory();
    }
    return OCRFactory.instance;
  }

  /**
   * Initialize available OCR providers
   */
  private initializeProviders(): void {
    try {
      // Register Google Vision provider
      const googleVisionProvider = new GoogleVisionOCRProvider();
      this.providers.set('google-vision', googleVisionProvider);

      // Future: Add more providers here
      // this.providers.set('aws-textract', new AWSTextractProvider());
      // this.providers.set('tesseract', new TesseractProvider());

      // Set current provider based on env config
      const providerName = process.env.OCR_PROVIDER || 'google-vision';
      const provider = this.providers.get(providerName);

      if (provider && provider.isConfigured()) {
        this.currentProvider = provider;
        logger.info(`OCR Provider set to: ${providerName}`);
      } else {
        logger.warn(
          `OCR Provider '${providerName}' not configured. OCR features will not be available. ` +
            'Set GOOGLE_VISION_API_KEY to enable OCR.'
        );
      }
    } catch (error) {
      logger.error('Failed to initialize OCR providers:', error);
    }
  }

  /**
   * Get the current active OCR provider
   */
  getProvider(): IOCRProvider | null {
    return this.currentProvider;
  }

  /**
   * Get a specific provider by name
   */
  getProviderByName(name: string): IOCRProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Check if OCR features are available
   */
  isAvailable(): boolean {
    return this.currentProvider !== null && this.currentProvider.isConfigured();
  }

  /**
   * Switch to a different OCR provider at runtime
   */
  switchProvider(providerName: string): void {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`OCR Provider '${providerName}' not found`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`OCR Provider '${providerName}' is not properly configured`);
    }

    this.currentProvider = provider;
    logger.info(`Switched to OCR provider: ${providerName}`);
  }

  /**
   * Get all registered OCR provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Export singleton instance
 */
export const ocrFactory = OCRFactory.getInstance();

/**
 * Convenience function to get the current OCR provider
 */
export function getOCRProvider(): IOCRProvider | null {
  return ocrFactory.getProvider();
}

/**
 * Check if OCR is available
 */
export function isOCRAvailable(): boolean {
  return ocrFactory.isAvailable();
}
