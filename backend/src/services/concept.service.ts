import mongoose from 'mongoose';
import Concept, { IConceptDocument } from '../models/Concept';
import User from '../models/User';
import { AppError } from '../utils/helpers';

export class ConceptService {
  async createConcept(
    userId: string,
    conceptData: {
      title: string;
      description: string;
      notes?: string;
      tags?: string[];
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      sourceId?: string;
    }
  ): Promise<IConceptDocument> {
    const concept = await Concept.create({
      userId,
      ...conceptData,
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.totalConcepts': 1 },
    });

    return concept;
  }

  async getConcepts(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      tags?: string[];
      difficulty?: string;
      minConfidence?: number;
      maxConfidence?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      sourceId?: string;
    }
  ): Promise<{ concepts: IConceptDocument[]; total: number; page: number; pages: number }> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId };

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters.minConfidence !== undefined || filters.maxConfidence !== undefined) {
      query.confidenceScore = {};
      if (filters.minConfidence !== undefined) {
        query.confidenceScore.$gte = filters.minConfidence;
      }
      if (filters.maxConfidence !== undefined) {
        query.confidenceScore.$lte = filters.maxConfidence;
      }
    }

    if (filters.sourceId) {
      query.sourceId = filters.sourceId;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Build sort
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    // Execute query
    const [concepts, total] = await Promise.all([
      Concept.find(query).sort(sort).skip(skip).limit(limit).populate('sourceId', 'title type'),
      Concept.countDocuments(query),
    ]);

    return {
      concepts,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getConceptById(userId: string, conceptId: string): Promise<IConceptDocument> {
    const concept = await Concept.findOne({ _id: conceptId, userId }).populate(
      'sourceId',
      'title type url'
    );

    if (!concept) {
      throw new AppError(404, 'Concept not found');
    }

    return concept;
  }

  async updateConcept(
    userId: string,
    conceptId: string,
    updates: Partial<IConceptDocument>
  ): Promise<IConceptDocument> {
    // Don't allow updating certain fields
    const { userId: _, reviewCount, lastReviewed, nextReview, ...allowedUpdates } = updates as any;

    const concept = await Concept.findOneAndUpdate(
      { _id: conceptId, userId },
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!concept) {
      throw new AppError(404, 'Concept not found');
    }

    return concept;
  }

  async deleteConcept(userId: string, conceptId: string): Promise<void> {
    const concept = await Concept.findOneAndDelete({ _id: conceptId, userId });

    if (!concept) {
      throw new AppError(404, 'Concept not found');
    }

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.totalConcepts': -1 },
    });

    // Recalculate average confidence
    await this.updateUserAverageConfidence(userId);
  }

  async getConceptStats(userId: string): Promise<{
    total: number;
    byDifficulty: { beginner: number; intermediate: number; advanced: number };
    byConfidence: { low: number; medium: number; high: number };
    averageConfidence: number;
    dueConcepts: number;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      total,
      byDifficulty,
      byConfidence,
      avgConfidence,
      dueConcepts,
    ] = await Promise.all([
      Concept.countDocuments({ userId }),
      Concept.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      Concept.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$confidenceScore', 40] }, then: 'low' },
                  { case: { $lt: ['$confidenceScore', 70] }, then: 'medium' },
                ],
                default: 'high',
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Concept.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, avg: { $avg: '$confidenceScore' } } },
      ]),
      Concept.countDocuments({ userId, nextReview: { $lte: new Date() } }),
    ]);

    const difficultyMap = byDifficulty.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as any);

    const confidenceMap = byConfidence.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as any);

    return {
      total,
      byDifficulty: {
        beginner: difficultyMap.beginner || 0,
        intermediate: difficultyMap.intermediate || 0,
        advanced: difficultyMap.advanced || 0,
      },
      byConfidence: {
        low: confidenceMap.low || 0,
        medium: confidenceMap.medium || 0,
        high: confidenceMap.high || 0,
      },
      averageConfidence: avgConfidence[0]?.avg || 0,
      dueConcepts,
    };
  }

  async getAllTags(userId: string): Promise<string[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Concept.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
    ]);

    return result.map((item) => item.tag);
  }

  async getLowConfidenceConcepts(userId: string, threshold: number = 40): Promise<IConceptDocument[]> {
    return Concept.find({
      userId,
      confidenceScore: { $lt: threshold },
    })
      .sort({ confidenceScore: 1 })
      .limit(20);
  }

  async getDueConcepts(userId: string): Promise<IConceptDocument[]> {
    return Concept.find({
      userId,
      nextReview: { $lte: new Date() },
    })
      .sort({ nextReview: 1 })
      .limit(20);
  }

  async getConceptsBySource(userId: string, sourceId: string): Promise<IConceptDocument[]> {
    return Concept.find({
      userId,
      sourceId,
    })
      .sort({ createdAt: -1 })
      .populate('sourceId', 'title type url');
  }

  async recordReview(
    conceptId: string,
    userId: string,
    performance: 'perfect' | 'good' | 'struggled' | 'failed'
  ): Promise<IConceptDocument> {
    const concept = await Concept.findOne({ _id: conceptId, userId });

    if (!concept) {
      throw new AppError(404, 'Concept not found');
    }

    // Call the recordReview method on the concept document
    // Note: recordReview() already calls this.save() internally, so no extra save needed
    await concept.recordReview(performance);

    // Update user's average confidence
    await this.updateUserAverageConfidence(userId);

    // Re-fetch with populated sourceId to ensure source data is included in response
    const populatedConcept = await Concept.findById(concept._id).populate(
      'sourceId',
      'title type url'
    );

    return populatedConcept!;
  }

  private async updateUserAverageConfidence(userId: string): Promise<void> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Concept.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, avg: { $avg: '$confidenceScore' } } },
    ]);

    const averageConfidence = result[0]?.avg || 0;

    await User.findByIdAndUpdate(userId, {
      $set: { 'stats.averageConfidence': Math.round(averageConfidence) },
    });
  }
}

export default new ConceptService();
