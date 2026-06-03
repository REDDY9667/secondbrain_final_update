import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import { getOCRProvider, isOCRAvailable } from './ocr.factory';
import logger from '../../utils/logger';

export interface TextExtractionResult {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    author?: string;
    title?: string;
    ocrUsed?: boolean;
    ocrProvider?: string;
  };
}

export class TextExtractionService {
  private readonly MAX_TEXT_LENGTH = 50000; // Limit for AI processing
  private readonly CHUNK_SIZE = 4000; // Characters per chunk for large documents
  private readonly MIN_TEXT_THRESHOLD = 50; // Minimum characters to consider text extraction successful

  /**
   * Extract text from a PDF file.
   * First tries standard text extraction (for selectable-text PDFs).
   * If insufficient text is found, falls back to OCR (for image-based PDFs).
   */
  async extractFromPDF(filePath: string): Promise<TextExtractionResult> {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      const dataBuffer = await fs.readFile(absolutePath);

      // Step 1: Try standard text extraction first
      let data;
      try {
        data = await pdfParse(dataBuffer);
      } catch (parseError: any) {
        logger.warn(`Standard PDF parsing failed for ${filePath}: ${parseError.message}`);
        data = { text: '', numpages: 0, info: {} };
      }

      const cleanedText = this.cleanText(data.text);
      const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

      logger.info(`PDF text extraction: ${cleanedText.length} chars, ${wordCount} words from ${filePath}`);

      // Step 2: If text is insufficient, try OCR fallback
      if (cleanedText.length < this.MIN_TEXT_THRESHOLD && isOCRAvailable()) {
        logger.info(`Insufficient text (${cleanedText.length} chars). Falling back to OCR...`);
        return this.extractFromPDFWithOCR(absolutePath, data);
      }

      // Step 3: If text is insufficient and OCR is not available, warn but return what we have
      if (cleanedText.length < this.MIN_TEXT_THRESHOLD) {
        logger.warn(
          `PDF appears to be image-based but OCR is not configured. ` +
            `Set GOOGLE_VISION_API_KEY to enable OCR for image-based PDFs.`
        );
      }

      return {
        text: cleanedText,
        metadata: {
          pageCount: data.numpages,
          wordCount,
          title: data.info?.Title,
          author: data.info?.Author,
          ocrUsed: false,
        },
      };
    } catch (error: any) {
      logger.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from a PDF using OCR (for image-based PDFs)
   */
  private async extractFromPDFWithOCR(
    absolutePath: string,
    pdfParseData: any
  ): Promise<TextExtractionResult> {
    try {
      const ocrProvider = getOCRProvider();
      if (!ocrProvider) {
        throw new Error('No OCR provider available');
      }

      logger.info(`Using OCR provider '${ocrProvider.name}' for image-based PDF`);

      const ocrResult = await ocrProvider.extractTextFromPDF(absolutePath);

      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        throw new Error('OCR extraction returned no text');
      }

      const cleanedText = this.cleanText(ocrResult.text);
      const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

      logger.info(
        `OCR extracted ${cleanedText.length} chars, ${wordCount} words ` +
          `(confidence: ${ocrResult.confidence ? Math.round(ocrResult.confidence * 100) + '%' : 'N/A'})`
      );

      return {
        text: cleanedText,
        metadata: {
          pageCount: ocrResult.metadata?.pageCount || pdfParseData.numpages,
          wordCount,
          title: pdfParseData.info?.Title,
          author: pdfParseData.info?.Author,
          ocrUsed: true,
          ocrProvider: ocrProvider.name,
        },
      };
    } catch (error: any) {
      logger.error('OCR fallback failed:', error);
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from a URL
   */
  async extractFromURL(url: string): Promise<TextExtractionResult> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        maxRedirects: 5,
      });

      const html = response.data;

      // Simple HTML to text conversion without cheerio
      const text = this.htmlToText(html);
      const cleanedText = this.cleanText(text);
      const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

      return {
        text: cleanedText,
        metadata: {
          wordCount,
          title: this.extractTitle(html),
        },
      };
    } catch (error: any) {
      console.error('URL extraction error:', error);

      if (error.code === 'ENOTFOUND') {
        throw new Error('URL not found or network error');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Request timeout - URL took too long to respond');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - website blocks automated access');
      } else if (error.response?.status === 404) {
        throw new Error('URL not found (404)');
      }

      throw new Error(`Failed to extract text from URL: ${error.message}`);
    }
  }

  /**
   * Extract text from plain text file
   */
  async extractFromTextFile(filePath: string): Promise<TextExtractionResult> {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);
      const exists = await fs.access(filePath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      const text = await fs.readFile(absolutePath, 'utf-8');
      const cleanedText = this.cleanText(text);
      const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

      return {
        text: cleanedText,
        metadata: {
          wordCount,
        },
      };
    } catch (error: any) {
      console.error('Text file extraction error:', error);
      throw new Error(`Failed to extract text from file: ${error.message}`);
    }
  }

  /**
   * Convert HTML to plain text (simple implementation without cheerio)
   */
  private htmlToText(html: string): string {
    // Remove script and style tags with their content
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, '');

    // Add newlines for block elements
    text = text.replace(/<\/?(div|p|br|h[1-6]|li|tr)[^>]*>/gi, '\n');

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&apos;/g, "'");

    return text;
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string | undefined {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }

    // Try og:title meta tag
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      return ogTitleMatch[1].trim();
    }

    return undefined;
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ');

    // Remove leading/trailing whitespace
    text = text.trim();

    // Normalize newlines
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Truncate if too long
    if (text.length > this.MAX_TEXT_LENGTH) {
      console.warn(`Text truncated from ${text.length} to ${this.MAX_TEXT_LENGTH} characters`);
      text = text.substring(0, this.MAX_TEXT_LENGTH) + '...';
    }

    return text;
  }

  /**
   * Split large text into chunks for processing
   */
  chunkText(text: string, chunkSize: number = this.CHUNK_SIZE): string[] {
    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let currentPosition = 0;

    while (currentPosition < text.length) {
      let endPosition = currentPosition + chunkSize;

      // Try to break at sentence boundary
      if (endPosition < text.length) {
        const lastPeriod = text.lastIndexOf('.', endPosition);
        const lastNewline = text.lastIndexOf('\n', endPosition);
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > currentPosition) {
          endPosition = breakPoint + 1;
        }
      }

      chunks.push(text.substring(currentPosition, endPosition).trim());
      currentPosition = endPosition;
    }

    return chunks;
  }

  /**
   * Determine extraction method based on source type
   */
  async extractFromSource(
    sourceType: 'pdf' | 'article' | 'note' | 'other',
    sourceData: { filePath?: string; url?: string; content?: string }
  ): Promise<TextExtractionResult> {
    if (sourceData.content) {
      // Content already provided
      const wordCount = sourceData.content.split(/\s+/).filter(Boolean).length;
      return {
        text: this.cleanText(sourceData.content),
        metadata: { wordCount },
      };
    }

    if (sourceType === 'pdf' && sourceData.filePath) {
      return this.extractFromPDF(sourceData.filePath);
    }

    if (sourceType === 'article' && sourceData.url) {
      return this.extractFromURL(sourceData.url);
    }

    if (sourceData.filePath) {
      // Try as text file
      return this.extractFromTextFile(sourceData.filePath);
    }

    throw new Error('Unable to extract text: no valid source data provided');
  }
}

export const textExtractionService = new TextExtractionService();
