/**
 * Decay Detection Service
 *
 * Analyzes Concept review patterns to identify knowledge decay.
 * NO AI REQUIRED - uses pure mathematical analysis.
 *
 * Detection Methods:
 * 1. Time-based: Concepts not reviewed within expected interval
 * 2. Confidence-based: Concepts with declining confidence scores
 * 3. Performance-based: Concepts with recent poor performance
 * 4. Overdue-based: Concepts past their next review date
 */

import {IConceptDocument } from '../models/Concept';
import Concept from '../models/Concept';
import logger  from '../utils/logger';

export interface DecayAlert {
  ConceptId: string;
  title: string;
  decayType: 'overdue' | 'declining_confidence' | 'poor_performance' | 'long_interval';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: {
    daysSinceLastReview?: number;
    currentConfidence: number;
    confidenceChange?: number;
    recommendedInterval?: number;
    actualInterval?: number;
    daysOverdue?: number;
  };
  recommendedAction: string;
}

export interface DecayAnalysisResult {
  userId: string;
  totalConcepts: number;
  ConceptsAtRisk: number;
  alerts: DecayAlert[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

class DecayDetectionService {
  /**
   * Perform comprehensive decay analysis for a user
   */
  async analyzeUserDecay(userId: string): Promise<DecayAnalysisResult> {
    try {
      logger.info(`Starting decay analysis for user: ${userId}`);

      const Concepts = await Concept.find({ userId });

      const alerts: DecayAlert[] = [];

      // Analyze each Concept for decay signals
      for (const Concept of Concepts) {
        const ConceptAlerts = this.analyzeConcept(Concept);
        alerts.push(...ConceptAlerts);
      }

      // Sort alerts by severity
      const sortedAlerts = this.sortAlertsBySeverity(alerts);

      // Generate summary
      const summary = {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        high: alerts.filter((a) => a.severity === 'high').length,
        medium: alerts.filter((a) => a.severity === 'medium').length,
        low: alerts.filter((a) => a.severity === 'low').length,
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(sortedAlerts);

      const result: DecayAnalysisResult = {
        userId,
        totalConcepts: Concepts.length,
        ConceptsAtRisk: alerts.length,
        alerts: sortedAlerts,
        summary,
        recommendations,
      };

      logger.info(
        `Decay analysis complete. Found ${alerts.length} Concepts at risk for user: ${userId}`
      );

      return result;
    } catch (error) {
      logger.error('Error in decay analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze a single Concept for decay signals
   */
  private analyzeConcept(Concept: IConceptDocument): DecayAlert[] {
    const alerts: DecayAlert[] = [];

    // Check 1: Overdue for review
    const overdueAlert = this.checkOverdue(Concept);
    if (overdueAlert) alerts.push(overdueAlert);

    // Check 2: Declining confidence
    const confidenceAlert = this.checkDecliningConfidence(Concept);
    if (confidenceAlert) alerts.push(confidenceAlert);

    // Check 3: Long interval without review
    const intervalAlert = this.checkLongInterval(Concept);
    if (intervalAlert) alerts.push(intervalAlert);

    // Check 4: Low confidence score
    const lowConfidenceAlert = this.checkLowConfidence(Concept);
    if (lowConfidenceAlert) alerts.push(lowConfidenceAlert);

    return alerts;
  }

  /**
   * Check if Concept is overdue for review
   */
  private checkOverdue(Concept: IConceptDocument): DecayAlert | null {
    const now = new Date();
    if (!Concept.nextReview) {
      return null;
    }
    const nextReview = new Date(Concept.nextReview);

    if (nextReview > now) {
      return null; // Not overdue
    }

    const daysOverdue = Math.floor((now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24));

    // Determine severity based on days overdue
    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (daysOverdue > 30) severity = 'critical';
    else if (daysOverdue > 14) severity = 'high';
    else if (daysOverdue > 7) severity = 'medium';
    else severity = 'low';

    return {
      ConceptId: Concept._id.toString(),
      title: Concept.title,
      decayType: 'overdue',
      severity,
      message: `This Concept is ${daysOverdue} day(s) overdue for review`,
      metrics: {
        daysOverdue,
        currentConfidence: Concept.confidenceScore,
        recommendedInterval: Concept.reviewInterval,
      },
      recommendedAction: `Review this Concept immediately to prevent knowledge decay`,
    };
  }

  /**
   * Check for declining confidence trend
   */
  private checkDecliningConfidence(Concept: IConceptDocument): DecayAlert | null {
    // If confidence is already very low, that's a separate issue
    if (Concept.confidenceScore < 30) {
      return null;
    }

    // Check if Concept has been reviewed before
    if (Concept.reviewCount < 2) {
      return null; // Need at least 2 reviews to detect trend
    }

    // If ease factor is decreasing, it indicates difficulty
    if (Concept.easeFactor < 2.0) {
      const severity: 'low' | 'medium' | 'high' = Concept.easeFactor < 1.5 ? 'high' : 'medium';

      return {
        ConceptId: Concept._id.toString(),
        title: Concept.title,
        decayType: 'declining_confidence',
        severity,
        message: `Ease factor is low (${Concept.easeFactor.toFixed(2)}), indicating struggling retention`,
        metrics: {
          currentConfidence: Concept.confidenceScore,
          recommendedInterval: Concept.reviewInterval,
        },
        recommendedAction: `Review this Concept more frequently to improve retention`,
      };
    }

    return null;
  }

  /**
   * Check if too much time has passed since last review
   */
  private checkLongInterval(Concept: IConceptDocument): DecayAlert | null {
    if (!Concept.lastReviewed) {
      return null; // Never reviewed
    }

    const now = new Date();
    const lastReviewed = new Date(Concept.lastReviewed);
    const daysSinceReview = Math.floor(
      (now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if actual interval is much longer than recommended
    if (daysSinceReview > Concept.reviewInterval * 1.5) {
      const severity: 'low' | 'medium' | 'high' =
        daysSinceReview > Concept.reviewInterval * 2 ? 'high' : 'medium';

      return {
        ConceptId: Concept._id.toString(),
        title: Concept.title,
        decayType: 'long_interval',
        severity,
        message: `Not reviewed in ${daysSinceReview} days (recommended: ${Concept.reviewInterval} days)`,
        metrics: {
          daysSinceLastReview: daysSinceReview,
          currentConfidence: Concept.confidenceScore,
          recommendedInterval: Concept.reviewInterval,
          actualInterval: daysSinceReview,
        },
        recommendedAction: `Schedule a review session for this Concept`,
      };
    }

    return null;
  }

  /**
   * Check for critically low confidence
   */
  private checkLowConfidence(Concept: IConceptDocument): DecayAlert | null {
    if (Concept.confidenceScore >= 30) {
      return null; // Confidence is acceptable
    }

    const severity: 'high' | 'critical' = Concept.confidenceScore < 20 ? 'critical' : 'high';

    return {
      ConceptId: Concept._id.toString(),
      title: Concept.title,
      decayType: 'poor_performance',
      severity,
      message: `Very low confidence score (${Concept.confidenceScore}%)`,
      metrics: {
        currentConfidence: Concept.confidenceScore,
      },
      recommendedAction: `Focus on mastering this Concept - review multiple times this week`,
    };
  }

  /**
   * Sort alerts by severity and type
   */
  private sortAlertsBySeverity(alerts: DecayAlert[]): DecayAlert[] {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    return alerts.sort((a, b) => {
      // Sort by severity first
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by decay type
      const typeOrder = { overdue: 0, poor_performance: 1, declining_confidence: 2, long_interval: 3 };
      return typeOrder[a.decayType] - typeOrder[b.decayType];
    });
  }

  /**
   * Generate actionable recommendations based on alerts
   */
  private generateRecommendations(alerts: DecayAlert[]): string[] {
    const recommendations: string[] = [];

    const critical = alerts.filter((a) => a.severity === 'critical');
    const high = alerts.filter((a) => a.severity === 'high');
    const overdue = alerts.filter((a) => a.decayType === 'overdue');

    if (critical.length > 0) {
      recommendations.push(
        `⚠️ URGENT: You have ${critical.length} Concept(s) in critical condition. Review them immediately to prevent complete knowledge loss.`
      );
    }

    if (high.length > 0) {
      recommendations.push(
        `📌 High Priority: ${high.length} Concept(s) need attention soon to maintain retention.`
      );
    }

    if (overdue.length >= 5) {
      recommendations.push(
        `📅 You have ${overdue.length} overdue Concepts. Consider setting aside dedicated review time this week.`
      );
    }

    if (alerts.length > 10) {
      recommendations.push(
        `💡 Tip: Focus on the top 5 critical/high priority Concepts first, then tackle the rest gradually.`
      );
    }

    if (alerts.length === 0) {
      recommendations.push(`✅ Great job! All your Concepts are up to date with their review schedule.`);
    }

    return recommendations;
  }

  /**
   * Get Concepts that need immediate attention
   */
  async getUrgentConcepts(userId: string, limit: number = 10): Promise<IConceptDocument[]> {
    try {
      const now = new Date();

      const urgentConcepts = await Concept.find({
        userId,
        $or: [
          { nextReview: { $lte: now } }, // Overdue
          { confidenceScore: { $lt: 30 } }, // Low confidence
        ],
      })
        .sort({ confidenceScore: 1, nextReview: 1 }) // Lowest confidence first, then most overdue
        .limit(limit);

      return urgentConcepts;
    } catch (error) {
      logger.error('Error fetching urgent Concepts:', error);
      throw error;
    }
  }
}

export const decayDetectionService = new DecayDetectionService();
