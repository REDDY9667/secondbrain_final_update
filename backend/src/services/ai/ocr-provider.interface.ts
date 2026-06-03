/**
 * OCR Provider Interface
 *
 * Abstraction layer for OCR services.
 * Any OCR provider (Google Vision, AWS Textract, Tesseract, etc.)
 * must implement this interface.
 *
 * LOOSE COUPLING: Business logic depends on this interface,
 * not specific OCR implementations.
 */

export interface OCRResult {
  text: string;
  confidence?: number;
  pages?: OCRPageResult[];
  metadata?: {
    provider: string;
    processedAt: Date;
    pageCount?: number;
    language?: string;
  };
}

export interface OCRPageResult {
  pageNumber: number;
  text: string;
  confidence?: number;
}

/**
 * Base interface that all OCR providers must implement
 */
export interface IOCRProvider {
  /**
   * Provider name (e.g., 'google-vision', 'aws-textract', 'tesseract')
   */
  readonly name: string;

  /**
   * Check if the provider is properly configured (API keys, etc.)
   */
  isConfigured(): boolean;

  /**
   * Extract text from an image file (single page)
   */
  extractTextFromImage(imagePath: string): Promise<OCRResult>;

  /**
   * Extract text from a PDF file (multi-page)
   */
  extractTextFromPDF(pdfPath: string): Promise<OCRResult>;

  /**
   * Extract text from a buffer (image or PDF bytes)
   */
  extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<OCRResult>;
}
