/**
 * Study Suggestion Service
 *
 * Provides AI-powered study suggestions and daily plans.
 * Combines decay detection, review schedules, and AI intelligence.
 *
 * LOOSE COUPLING: Uses AI provider interface, not tied to specific implementation.
 */

import { getAIProvider, isAIAvailable } from './ai-provider.factory';
import { aiConfig } from '../../config/ai.config';
import { decayDetectionService } from '../decay-detection.service';
import { IConceptDocument } from '../../models/Concept';
import Concept from '../../models/Concept';
import logger from '../../utils/logger';
import { AppError } from '../../utils/helpers';

export interface StudySuggestion {
  conceptId: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedTime: number; // minutes
  actions: string[];
  metrics: {
    confidenceScore: number;
    daysSinceReview?: number;
    daysOverdue?: number;
  };
}

export interface DailyStudyPlan {
  date: Date;
  totalEstimatedTime: number; // minutes
  suggestions: StudySuggestion[];
  focusAreas: string[];
  motivationalMessage: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface FocusArea {
  category: string;
  conceptCount: number;
  averageConfidence: number;
  recommendation: string;
}

class StudySuggestionService {
  /**
   * Generate daily study plan for a user
   */
  async generateDailyStudyPlan(userId: string): Promise<DailyStudyPlan> {
    try {
      logger.info(`Generating daily study plan for user: ${userId}`);

      // Get decay analysis
      const decayAnalysis = await decayDetectionService.analyzeUserDecay(userId);

      // Get concepts due today (increased limit to capture all critical concepts)
      const dueConcepts = await Concept.find({
        userId,
        nextReview: { $lte: new Date() },
      })
        .sort({ confidenceScore: 1, nextReview: 1 })
        .limit(50);

      // Generate suggestions based on decay alerts and due concepts
      const suggestions = await this.generateSuggestions(decayAnalysis.alerts, dueConcepts);

      // Identify focus areas
      const focusAreas = await this.identifyFocusAreas(userId);

      // Generate motivational message
      const motivationalMessage = this.generateMotivationalMessage(
        suggestions.length,
        decayAnalysis.summary
      );

      // Calculate total estimated time
      const totalEstimatedTime = suggestions.reduce((sum, s) => sum + s.estimatedTime, 0);

      const plan: DailyStudyPlan = {
        date: new Date(),

        totalEstimatedTime,
        suggestions, // Include all suggestions so no critical concepts are missed
        focusAreas: focusAreas.map((f) => f.category),
        motivationalMessage,
        summary: {
          critical: suggestions.filter((s) => s.priority === 'critical').length,
          high: suggestions.filter((s) => s.priority === 'high').length,
          medium: suggestions.filter((s) => s.priority === 'medium').length,
          low: suggestions.filter((s) => s.priority === 'low').length,
        },
      };

      logger.info(
        `Generated daily plan with ${plan.suggestions.length} suggestions (${totalEstimatedTime} min)`
      );

      return plan;
    } catch (error) {
      logger.error('Error generating daily study plan:', error);
      throw error;
    }
  }

  /**
   * Generate study suggestions from decay alerts and due concepts
   */
  private async generateSuggestions(
    decayAlerts: any[],
    dueConcepts: IConceptDocument[]
  ): Promise<StudySuggestion[]> {
    const suggestions: StudySuggestion[] = [];
    const processedConceptIds = new Set<string>();

    // Process decay alerts first (highest priority)
    for (const alert of decayAlerts) {
      const alertConceptId = alert.ConceptId.toString();
      if (processedConceptIds.has(alertConceptId)) continue;

      suggestions.push({
        conceptId: alertConceptId,
        title: alert.title,
        priority: alert.severity,
        reason: alert.message,
        estimatedTime: this.estimateReviewTime(alert.severity),
        actions: [alert.recommendedAction, 'Review concept notes', 'Take a practice quiz'],
        metrics: {
          confidenceScore: alert.metrics.currentConfidence,
          daysSinceReview: alert.metrics.daysSinceLastReview,
          daysOverdue: alert.metrics.daysOverdue,
        },
      });

      processedConceptIds.add(alertConceptId);
    }

    // Add due concepts that aren't already in alerts
    for (const concept of dueConcepts) {
      const conceptId = concept._id.toString();
      if (processedConceptIds.has(conceptId)) continue;

      // Determine priority based on confidence
      let priority: 'critical' | 'high' | 'medium' | 'low';
      if (concept.confidenceScore < 40) priority = 'high';
      else if (concept.confidenceScore < 70) priority = 'medium';
      else priority = 'low';

      suggestions.push({
        conceptId: concept._id?.toString(),
        title: concept.title,
        priority,
        reason: 'Scheduled for review today',
        estimatedTime: this.estimateReviewTime(priority),
        actions: ['Review concept', 'Test your understanding', 'Update your notes'],
        metrics: {
          confidenceScore: concept.confidenceScore,
        },
      });

      processedConceptIds.add(conceptId);
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
  }

  /**
   * Estimate review time based on priority
   */
  private estimateReviewTime(priority: 'critical' | 'high' | 'medium' | 'low'): number {
    const timeMap = {
      critical: 20, // 20 minutes for critical concepts
      high: 15, // 15 minutes
      medium: 10, // 10 minutes
      low: 5, // 5 minutes
    };
    return timeMap[priority];
  }

  /**
   * Identify focus areas where user needs improvement
   */
  private async identifyFocusAreas(userId: string): Promise<FocusArea[]> {
    try {
      // Group concepts by tags and analyze
      const concepts = await Concept.find({ userId });

      const tagGroups = new Map<string, IConceptDocument[]>();

      concepts.forEach((concept) => {
        if (concept.tags && concept.tags.length > 0) {
          concept.tags.forEach((tag) => {
            if (!tagGroups.has(tag)) {
              tagGroups.set(tag, []);
            }
            tagGroups.get(tag)!.push(concept);
          });
        }
      });

      const focusAreas: FocusArea[] = [];

      tagGroups.forEach((groupConcepts, tag) => {
        const avgConfidence =
          groupConcepts.reduce((sum, c) => sum + c.confidenceScore, 0) / groupConcepts.length;

        let recommendation: string;
        if (avgConfidence < 40) {
          recommendation = `Critical: Focus heavily on ${tag} concepts`;
        } else if (avgConfidence < 60) {
          recommendation = `Needs work: Spend extra time on ${tag}`;
        } else if (avgConfidence < 80) {
          recommendation = `Good progress: Keep reviewing ${tag} regularly`;
        } else {
          recommendation = `Excellent: Maintain your ${tag} knowledge`;
        }

        focusAreas.push({
          category: tag,
          conceptCount: groupConcepts.length,
          averageConfidence: Math.round(avgConfidence),
          recommendation,
        });
      });

      // Sort by lowest confidence first
      focusAreas.sort((a, b) => a.averageConfidence - b.averageConfidence);

      return focusAreas.slice(0, 5); // Top 5 focus areas
    } catch (error) {
      logger.error('Error identifying focus areas:', error);
      return [];
    }
  }

  /**
   * Generate motivational message
   */
  private generateMotivationalMessage(
    suggestionCount: number,
    summary: { critical: number; high: number; medium: number; low: number }
  ): string {
    if (suggestionCount === 0) {
      return "🎉 Amazing! You're all caught up with your reviews. Great job staying consistent!";
    }

    if (summary.critical > 0) {
      return `⚠️ You have ${summary.critical} concept(s) in critical condition. Let's tackle them today to prevent knowledge loss!`;
    }

    if (summary.high >= 5) {
      return `💪 You have ${summary.high} high-priority concepts. Break them into smaller sessions - you've got this!`;
    }

    if (suggestionCount <= 3) {
      return `✨ Just ${suggestionCount} concept(s) to review today. Quick and focused - let's do it!`;
    }

    return `📚 ${suggestionCount} concepts need attention. Start with the highest priority and work your way down!`;
  }

  /**
   * Get AI-enhanced study suggestions (uses AI for advanced recommendations)
   */
  async getAIEnhancedSuggestions(userId: string): Promise<DailyStudyPlan> {
    try {
      // First get the basic plan
      const basicPlan = await this.generateDailyStudyPlan(userId);

      // If AI is not available, return basic plan
      if (!isAIAvailable()) {
        logger.info('AI not available, returning basic study plan');
        return basicPlan;
      }

      // Use AI to enhance suggestions with personalized insights
      const aiProvider = getAIProvider();
      const model = aiConfig.features.studySuggestions;

      const prompt = this.buildEnhancementPrompt(basicPlan);

      logger.debug(`Calling AI for study suggestion enhancement with model: ${model}`);

      const aiResponse = await aiProvider.generateJSONCompletion<{
        enhancedMessage: string;
        studyTips: string[];
        priorityAdjustments?: string[];
      }>({
        messages: [
          {
            role: 'system',
            content:
              'You are a personalized learning coach. Provide encouraging, actionable study advice based on the user\'s current learning situation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model,
        temperature: 0.7,
        maxTokens: 400,
      });

      // Enhance the plan with AI insights
      if (aiResponse.enhancedMessage) {
        basicPlan.motivationalMessage = aiResponse.enhancedMessage;
      }

      logger.info('Study plan enhanced with AI insights');

      return basicPlan;
    } catch (error) {
      logger.error('Error getting AI-enhanced suggestions:', error);
      // Fallback to basic plan if AI fails
      return this.generateDailyStudyPlan(userId);
    }
  }

  /**
   * Build prompt for AI enhancement
   */
  private buildEnhancementPrompt(plan: DailyStudyPlan): string {
    const topSuggestions = plan.suggestions
      .slice(0, 5)
      .map((s) => `- ${s.title} (${s.priority} priority, ${s.metrics.confidenceScore}% confidence)`)
      .join('\n');

    return `
Analyze this student's current study situation and provide encouragement:

**Today's Study Plan:**
- Total concepts to review: ${plan.suggestions.length}
- Estimated time: ${plan.totalEstimatedTime} minutes
- Critical: ${plan.summary.critical}, High: ${plan.summary.high}, Medium: ${plan.summary.medium}, Low: ${plan.summary.low}

**Top Concepts Needing Review:**
${topSuggestions}

**Focus Areas:**
${plan.focusAreas.join(', ') || 'None identified'}

Generate a JSON response with:
{
  "enhancedMessage": "Personalized, encouraging message (1-2 sentences)",
  "studyTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Make it motivating but realistic. Focus on actionable advice.
`.trim();
  }

  /**
   * Get quick focus areas (lightweight endpoint)
   */
  async getQuickFocusAreas(userId: string): Promise<FocusArea[]> {
    try {
      return await this.identifyFocusAreas(userId);
    } catch (error) {
      logger.error('Error getting focus areas:', error);
      throw error;
    }
  }
}

export const studySuggestionService = new StudySuggestionService();
