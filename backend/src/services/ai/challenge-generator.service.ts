/**
 * Challenge Generator Service
 *
 * Uses AI to generate quiz questions from concepts.
 * LOOSE COUPLING: Uses AI provider interface, not tied to specific AI implementation.
 */

import { getAIProvider, isAIAvailable } from './ai-provider.factory';
import { aiConfig } from '../../config/ai.config';
import {IConceptDocument } from '../../models/Concept';
import Concept  from '../../models/Concept';
import { Challenge, IChallengeDocument } from '../../models/challenge.model';
import logger from '../../utils/logger';
import { AppError } from '../../utils/helpers';

export interface GeneratedChallenge {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ChallengeGenerationRequest {
  conceptId: string;
  userId: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  count?: number;
}

export interface ChallengeGenerationResult {
  challenges: IChallengeDocument[];
  conceptTitle: string;
  generated: number;
  cached: number;
}

class ChallengeGeneratorService {
  /**
   * Generate challenges for a concept
   */
  async generateChallenges(
    request: ChallengeGenerationRequest
  ): Promise<ChallengeGenerationResult> {
    try {
      const { conceptId, userId, difficulty, count = 1 } = request;

      // Fetch the concept
      const concept = await Concept.findOne({ _id: conceptId, userId });

      if (!concept) {
        throw new AppError(404, 'Concept not found');
      }

      logger.info(`Generating ${count} challenge(s) for concept: ${concept.title}`);

      // Check if AI is available
      if (!isAIAvailable()) {
        logger.warn('AI not available, using fallback challenge generation');
        return this.generateFallbackChallenges(concept, userId, count);
      }

      const challenges: IChallengeDocument[] = [];
      let generatedCount = 0;
      let cachedCount = 0;

      for (let i = 0; i < count; i++) {
        // Check if we have existing challenges we can reuse
        const existingChallenge = await this.findExistingChallenge(conceptId, userId);

        if (existingChallenge && Math.random() > 0.5) {
          // 50% chance to reuse existing challenge
          challenges.push(existingChallenge);
          cachedCount++;
        } else {
          // Generate new challenge via AI
          const generated = await this.generateSingleChallenge(
            concept,
            userId,
            difficulty || concept.difficulty
          );
          challenges.push(generated);
          generatedCount++;
        }
      }

      logger.info(
        `Generated ${generatedCount} new challenges, reused ${cachedCount} existing for concept: ${concept.title}`
      );

      return {
        challenges,
        conceptTitle: concept.title,
        generated: generatedCount,
        cached: cachedCount,
      };
    } catch (error) {
      logger.error('Error generating challenges:', error);
      throw error;
    }
  }

  /**
   * Generate a single challenge using AI
   */
  private async generateSingleChallenge(
    concept: IConceptDocument,
    userId: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<IChallengeDocument> {
    try {
      const aiProvider = getAIProvider();
      const model = aiConfig.features.challengeGeneration;

      // Build prompt for AI
      const prompt = this.buildChallengePrompt(concept, difficulty);

      logger.debug(`Calling AI with model: ${model} for challenge generation`);

      // Call AI to generate challenge
      const aiResponse = await aiProvider.generateJSONCompletion<GeneratedChallenge>({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educator creating quiz questions. Generate challenging but fair questions that test understanding, not just memorization.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model,
        temperature: 0.8, // Higher temperature for more varied questions
        maxTokens: 500,
      });

      // Validate AI response
      this.validateChallengeResponse(aiResponse);

      // Create and save challenge
      const challenge = new Challenge({
        userId,
        conceptId: concept._id,
        question: aiResponse.question,
        options: aiResponse.options,
        correctAnswer: aiResponse.correctAnswer,
        explanation: aiResponse.explanation,
        difficulty: aiResponse.difficulty,
        type: 'multiple-choice',
        generatedBy: 'ai',
        aiModel: model,
      });

      await challenge.save();

      logger.info(`Challenge created successfully for concept: ${concept.title}`);

      return challenge;
    } catch (error) {
      logger.error('Error in single challenge generation:', error);
      throw new AppError(500, 'Failed to generate challenge');
    }
  }

  /**
   * Build prompt for AI challenge generation
   */
  private buildChallengePrompt(
    concept: IConceptDocument,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): string {
    const difficultyGuidelines = {
      beginner: 'Focus on basic definitions and simple applications. Questions should be straightforward.',
      intermediate :
        'Require deeper understanding and application. Include some nuance and critical thinking.',
      advanced: 'Test advanced understanding, edge cases, and complex applications. Challenge the learner.',
    };

    return `
Generate a ${difficulty} multiple-choice quiz question for this learning concept:

**Title**: ${concept.title}
**Description**: ${concept.description}
${concept.notes ? `**Additional Notes**: ${concept.notes}` : ''}

**Difficulty Level**: ${difficulty}
**Guidelines**: ${difficultyGuidelines[difficulty]}

Generate a JSON object with this exact structure:
{
  "question": "The quiz question (clear, concise, unambiguous)",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why the correct answer is right and others are wrong (2-3 sentences)",
  "difficulty": "${difficulty}"
}

Requirements:
- Question must be clear and test understanding, not just recall
- Provide exactly 4 options
- correctAnswer must be the index (0-3) of the correct option
- Make incorrect options plausible but clearly wrong
- Explanation should educate, not just state the answer
- Avoid questions that rely on memorizing specific numbers or dates
`.trim();
  }

  /**
   * Validate AI response structure
   */
  private validateChallengeResponse(response: any): void {
    if (!response.question || typeof response.question !== 'string') {
      throw new AppError(500, 'Invalid AI response: missing or invalid question');
    }

    if (!Array.isArray(response.options) || response.options.length < 2) {
      throw new AppError(500, 'Invalid AI response: invalid options array');
    }

    if (
      typeof response.correctAnswer !== 'number' ||
      response.correctAnswer < 0 ||
      response.correctAnswer >= response.options.length
    ) {
      throw new AppError(500, 'Invalid AI response: invalid correctAnswer');
    }

    if (!response.explanation || typeof response.explanation !== 'string') {
      throw new AppError(500, 'Invalid AI response: missing or invalid explanation');
    }
  }

  /**
   * Find existing challenge for concept (for caching)
   */
  private async findExistingChallenge(
    conceptId: string,
    userId: string
  ): Promise<IChallengeDocument | null> {
    try {
      // Find a challenge that hasn't been attempted recently
      const existingChallenges = await Challenge.find({
        userId,
        conceptId,
      })
        .sort({ lastAttempted: 1 }) // Least recently attempted first
        .limit(5);

      if (existingChallenges.length === 0) {
        return null;
      }

      // Return a random challenge from the least attempted ones
      const randomIndex = Math.floor(Math.random() * existingChallenges.length);
      return existingChallenges[randomIndex];
    } catch (error) {
      logger.error('Error finding existing challenge:', error);
      return null;
    }
  }

  /**
   * Fallback challenge generation (when AI is not available)
   */
  private async generateFallbackChallenges(
    concept: IConceptDocument,
    userId: string,
    count: number
  ): Promise<ChallengeGenerationResult> {
    logger.info('Using fallback challenge generation (template-based)');

    const challenges: IChallengeDocument[] = [];

    for (let i = 0; i < count; i++) {
      const challenge = new Challenge({
        userId,
        conceptId: concept._id,
        question: `What is the main purpose of "${concept.title}"?`,
        options: [
          concept.description.substring(0, 100),
          'This is an incorrect option',
          'This is another incorrect option',
          'This is the third incorrect option',
        ],
        correctAnswer: 0,
        explanation: `The correct answer describes the core concept: ${concept.description}`,
        difficulty: concept.difficulty,
        type: 'multiple-choice',
        generatedBy: 'manual',
      });

      await challenge.save();
      challenges.push(challenge);
    }

    return {
      challenges,
      conceptTitle: concept.title,
      generated: count,
      cached: 0,
    };
  }

  /**
   * Get challenges for a concept
   */
  async getChallengesForConcept(
    conceptId: string,
    userId: string,
    limit: number = 10
  ): Promise<IChallengeDocument[]> {
    try {
      const challenges = await Challenge.find({ userId, conceptId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return challenges;
    } catch (error) {
      logger.error('Error fetching challenges:', error);
      throw error;
    }
  }

  /**
   * Record challenge attempt
   */
  async recordChallengeAttempt(
    challengeId: string,
    userId: string,
    selectedAnswer: number
  ): Promise<{ correct: boolean; challenge: IChallengeDocument }> {
    try {
      const challenge = await Challenge.findOne({ _id: challengeId, userId });

      if (!challenge) {
        throw new AppError(404, 'Challenge not found');
      }

      const correct = selectedAnswer === challenge.correctAnswer;
      challenge.recordAttempt(correct);
      await challenge.save();

      logger.info(`Challenge attempt recorded: ${correct ? 'correct' : 'incorrect'}`);

      return { correct, challenge };
    } catch (error) {
      logger.error('Error recording challenge attempt:', error);
      throw error;
    }
  }
}

export const challengeGeneratorService = new ChallengeGeneratorService();
