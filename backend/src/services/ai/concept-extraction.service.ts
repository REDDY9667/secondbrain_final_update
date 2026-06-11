import { getAIProvider, isAIAvailable } from './ai-provider.factory';
import { textExtractionService } from './text-extraction.service';
import { Types } from 'mongoose';

export interface ExtractedConcept {
  title: string;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
}

export interface ConceptExtractionResult {
  concepts: ExtractedConcept[];
  sourceText: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    extractedAt: Date;
  };
}

export class ConceptExtractionService {
  private readonly MAX_CONCEPTS_PER_CHUNK = 10;
  private readonly MIN_CONCEPT_LENGTH = 20;

  /**
   * Extract concepts from text using AI
   */
  async extractConceptsFromText(
    text: string,
    options?: { maxConcepts?: number; minConceptLength?: number }
  ): Promise<ExtractedConcept[]> {
    if (!isAIAvailable()) {
      throw new Error('AI service is not available. Please configure AI_PROVIDER and API keys.');
    }

    const maxConcepts = options?.maxConcepts || this.MAX_CONCEPTS_PER_CHUNK;
    const minLength = options?.minConceptLength || this.MIN_CONCEPT_LENGTH;

    try {
      const prompt = this.buildExtractionPrompt(text, maxConcepts);

      console.log('PROMPT:', prompt);
      console.log('TEXT SAMPLE:', text.substring(0, 1000));

      const aiProvider = getAIProvider();

      const response = await aiProvider.generateJSONCompletion<{ concepts: ExtractedConcept[] }>({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 2000
      });

      console.log('RAW AI RESPONSE:', response);

      if (!response.concepts || !Array.isArray(response.concepts)) {
        console.error('Invalid AI response:', response);
        throw new Error('AI returned invalid concept extraction format');
      }

      console.log('BEFORE VALIDATION:', response.concepts);

      // Validate and filter concepts
      const validConcepts = response.concepts
        .filter((concept) => this.validateConcept(concept, minLength))
        .slice(0, maxConcepts);

      console.log('AFTER VALIDATION:', validConcepts);

      return validConcepts;
    } catch (error: any) {
      console.error('Concept extraction error:', error);
      throw new Error(`Failed to extract concepts: ${error.message}`);
    }
  }

  /**
   * Extract concepts from a PDF file
   */
  async extractFromPDF(filePath: string): Promise<ConceptExtractionResult> {
    const extractionResult = await textExtractionService.extractFromPDF(filePath);
    const concepts = await this.extractConceptsFromLargeText(extractionResult.text);

    return {
      concepts,
      sourceText: extractionResult.text.substring(0, 1000) + '...', // Preview
      metadata: {
        ...extractionResult.metadata,
        extractedAt: new Date(),
      },
    };
  }

  /**
   * Extract concepts from a URL
   */
  async extractFromURL(url: string): Promise<ConceptExtractionResult> {
    const extractionResult = await textExtractionService.extractFromURL(url);
    const concepts = await this.extractConceptsFromLargeText(extractionResult.text);

    return {
      concepts,
      sourceText: extractionResult.text.substring(0, 1000) + '...',
      metadata: {
        ...extractionResult.metadata,
        extractedAt: new Date(),
      },
    };
  }

  /**
   * Extract concepts from large text by chunking
   */
  async extractConceptsFromLargeText(
    text: string
  ): Promise<ExtractedConcept[]> {

    const chunks =
      textExtractionService.chunkText(
        text.substring(0, 10000),
        4000
      );

    const allConcepts: ExtractedConcept[] = [];

    for (let i = 0; i < chunks.length && i < 2; i++) {
      console.log(`START CHUNK ${i}`);
      try {

        const concepts =
          await this.extractConceptsFromText(
            chunks[i],
            { maxConcepts: 5 }
          );

        allConcepts.push(...concepts);

      } catch (error) {

        console.error(
          `Error processing chunk ${i + 1}:`,
          error
        );

      }
      console.log(`END CHUNK ${i}`);
    } 

    console.log("BEFORE DEDUP");
    const result = this.deduplicateConcepts(allConcepts);
    console.log("AFTER DEDUP");
    return result;
  }

  /**
   * Build prompt for concept extraction
   */
  private buildExtractionPrompt(text: string, maxConcepts: number): string {
    return `Extract the key learning concepts from the following text.

For each concept:
- Title: A clear, concise name (2-6 words)
- Description: A comprehensive explanation (2-4 sentences)
- Tags: 3-5 relevant category tags
- Difficulty: Estimated learning difficulty

Extract up to ${maxConcepts} distinct concepts. Focus on the most important and teachable concepts.

Text to analyze:
"""
${text}
"""

Respond with ONLY this JSON structure (no markdown, no code blocks, no explanation):
{
  "concepts": [
    {
      "title": "Concept Name",
      "description": "Detailed explanation of the concept in 2-4 sentences.",
      "tags": ["tag1", "tag2", "tag3"],
      "difficulty": "beginner"
    }
  ]
}

Important:
- Each title must be unique
- Each description must be substantive and educational
- Difficulty must be one of: beginner, intermediate, advanced
- Extract only clearly defined concepts, not vague topics
- Prioritize concepts that would be useful for future study and review`;
  }

  /**
   * Validate a single concept
   */
  private validateConcept(concept: any, minLength: number): boolean {
    if (!concept || typeof concept !== 'object') {
      return false;
    }

    // Validate title
    if (!concept.title || typeof concept.title !== 'string' || concept.title.trim().length < 3) {
      return false;
    }

    // Validate description
    if (
      !concept.description ||
      typeof concept.description !== 'string' ||
      concept.description.trim().length < minLength
    ) {
      return false;
    }

    // Validate tags
    if (!Array.isArray(concept.tags) || concept.tags.length === 0) {
      concept.tags = ['general']; // Default tag
    }

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(concept.difficulty)) {
      concept.difficulty = 'intermediate'; // Default difficulty
    }

    return true;
  }

  /**
   * Remove duplicate concepts based on title similarity
   */
  private deduplicateConcepts(concepts: ExtractedConcept[]): ExtractedConcept[] {
    const seen = new Set<string>();
    const unique: ExtractedConcept[] = [];

    for (const concept of concepts) {
      const normalizedTitle = concept.title.toLowerCase().trim();

      if (!seen.has(normalizedTitle)) {
        seen.add(normalizedTitle);
        unique.push(concept);
      }
    }

    return unique;
  }

  /**
   * Enhance a manually created concept with AI suggestions
   */
  async enhanceConcept(title: string, description?: string): Promise<Partial<ExtractedConcept>> {
    if (!isAIAvailable()) {
      return {};
    }

    try {
      const prompt = `Given this learning concept, suggest relevant tags and an appropriate difficulty level.

Title: ${title}
${description ? `Description: ${description}` : ''}

Respond with ONLY this JSON (no markdown, no explanation):
{
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty": "beginner"
}`;

      const aiProvider = getAIProvider();
      const response = await aiProvider.generateJSONCompletion<{
        tags: string[];
        difficulty: 'beginner' | 'intermediate' | 'advanced';
      }>({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 200
      });

      return {
        tags: Array.isArray(response.tags) ? response.tags : undefined,
        difficulty: response.difficulty || undefined,
      };
    } catch (error) {
      console.error('Concept enhancement error:', error);
      return {};
    }
  }

  /**
   * Utility: delay function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const conceptExtractionService = new ConceptExtractionService();
