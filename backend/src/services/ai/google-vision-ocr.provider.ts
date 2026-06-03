/**
 * Google Vision OCR Provider
 *
 * Implements the IOCRProvider interface using Google Cloud Vision API.
 * Handles both single images and multi-page PDFs.
 *
 * Setup:
 * 1. Set GOOGLE_VISION_API_KEY in environment variables
 *    OR set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file path
 * 2. Enable Cloud Vision API in Google Cloud Console
 */

import fs from 'fs/promises';
import path from 'path';
import { IOCRProvider, OCRResult, OCRPageResult } from './ocr-provider.interface';
import logger from '../../utils/logger';

export class GoogleVisionOCRProvider implements IOCRProvider {
  readonly name = 'google-vision';
  private apiKey: string;
  private apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';

  constructor() {
    this.apiKey = process.env.GOOGLE_VISION_API_KEY || '';
  }

  /**
   * Check if Google Vision API key is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  /**
   * Extract text from an image file
   */
  async extractTextFromImage(imagePath: string): Promise<OCRResult> {
    try {
      const absolutePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.join(process.cwd(), imagePath);

      const imageBuffer = await fs.readFile(absolutePath);
      return this.extractTextFromBuffer(imageBuffer, 'image/png');
    } catch (error: any) {
      logger.error('Google Vision image extraction error:', error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  /**
   * Extract text from a PDF file using Google Vision OCR
   * For PDFs, we read the file and send it as a document
   */
  async extractTextFromPDF(pdfPath: string): Promise<OCRResult> {
    try {
      const absolutePath = path.isAbsolute(pdfPath)
        ? pdfPath
        : path.join(process.cwd(), pdfPath);

      const pdfBuffer = await fs.readFile(absolutePath);
      return this.extractTextFromBuffer(pdfBuffer, 'application/pdf');
    } catch (error: any) {
      logger.error('Google Vision PDF extraction error:', error);
      throw new Error(`Failed to OCR PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from a buffer using Google Vision API
   */
  async extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<OCRResult> {
    try {
      if (!this.isConfigured()) {
        throw new Error(
          'Google Vision OCR is not configured. Set GOOGLE_VISION_API_KEY or GOOGLE_APPLICATION_CREDENTIALS.'
        );
      }

      const base64Content = buffer.toString('base64');

      // Use DOCUMENT_TEXT_DETECTION for better text extraction
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Content,
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      };

      const url = `${this.apiEndpoint}?key=${this.apiKey}`;

      // Dynamic import for fetch (Node 18+) or use axios
      const axios = (await import('axios')).default;

      const response = await axios.post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // 60 second timeout for OCR
      });

      const result = response.data;

      if (!result.responses || result.responses.length === 0) {
        return {
          text: '',
          confidence: 0,
          metadata: {
            provider: this.name,
            processedAt: new Date(),
          },
        };
      }

      const annotation = result.responses[0];

      // Check for errors in the response
      if (annotation.error) {
        throw new Error(`Google Vision API error: ${annotation.error.message}`);
      }

      const fullTextAnnotation = annotation.fullTextAnnotation;
      const extractedText = fullTextAnnotation?.text || '';

      // Build page results if available
      const pages: OCRPageResult[] = [];
      if (fullTextAnnotation?.pages) {
        fullTextAnnotation.pages.forEach((page: any, index: number) => {
          const pageText = page.blocks
            ?.map((block: any) =>
              block.paragraphs
                ?.map((para: any) =>
                  para.words
                    ?.map((word: any) =>
                      word.symbols?.map((s: any) => s.text).join('')
                    )
                    .join(' ')
                )
                .join('\n')
            )
            .join('\n\n');

          pages.push({
            pageNumber: index + 1,
            text: pageText || '',
            confidence: page.confidence,
          });
        });
      }

      // Calculate average confidence
      const avgConfidence =
        pages.length > 0
          ? pages.reduce((sum, p) => sum + (p.confidence || 0), 0) / pages.length
          : undefined;

      logger.info(
        `Google Vision OCR extracted ${extractedText.length} characters from ${pages.length || 1} page(s)`
      );

      return {
        text: extractedText,
        confidence: avgConfidence,
        pages,
        metadata: {
          provider: this.name,
          processedAt: new Date(),
          pageCount: pages.length || 1,
        },
      };
    } catch (error: any) {
      logger.error('Google Vision OCR error:', error);

      if (error.response?.status === 403) {
        throw new Error(
          'Google Vision API access denied. Check your API key and ensure Cloud Vision API is enabled.'
        );
      }
      if (error.response?.status === 429) {
        throw new Error('Google Vision API rate limit exceeded. Please try again later.');
      }

      throw new Error(`Google Vision OCR failed: ${error.message}`);
    }
  }
}
