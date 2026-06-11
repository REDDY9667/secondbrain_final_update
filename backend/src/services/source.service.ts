import Source, { ISourceDocument } from '../models/Source';
import { AppError } from '../utils/helpers';
import fs from 'fs/promises';
import path from 'path';
import s3Service from './s3.service';

export class SourceService {
  async createSource(
    userId: string,
    sourceData: {
      title: string;
      type: 'pdf' | 'article' | 'video' | 'note' | 'code' | 'other';
      url?: string;
      content?: string;
      tags?: string[];
      metadata?: any;
    }
  ): Promise<ISourceDocument> {
    const source = await Source.create({
      userId,
      ...sourceData,
    });

    return source;
  }

  async createSourceFromFile(
    userId: string,
    file: {
      filename: string;
      path: string;
      size: number;
      mimetype: string;
      s3Key: string;
    },
    metadata: {
      title: string;
      type: 'pdf' | 'article' | 'video' | 'note' | 'code' | 'other';
      tags?: string[];
    }
  ): Promise<ISourceDocument> {
    const source = await Source.create({
      userId,
      title: metadata.title,
      type: metadata.type,
      tags: metadata.tags || [],
      filePath: file.path,
      fileName: file.filename,
      fileSize: file.size,
      s3Key: file.s3Key,
    });

    return source;
  }

  async getSources(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      type?: string;
      processed?: boolean;
    }
  ): Promise<{ sources: ISourceDocument[]; total: number; page: number; pages: number }> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const query: any = { userId };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.processed !== undefined) {
      query.processed = filters.processed;
    }

    const [sources, total] = await Promise.all([
      Source.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Source.countDocuments(query),
    ]);

    return {
      sources,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getSourceById(userId: string, sourceId: string): Promise<ISourceDocument> {
    const source = await Source.findOne({ _id: sourceId, userId });

    if (!source) {
      throw new AppError(404, 'Source not found');
    }

    return source;
  }

  async updateSource(
    userId: string,
    sourceId: string,
    updates: Partial<ISourceDocument>
  ): Promise<ISourceDocument> {
    const { userId: _, conceptCount, ...allowedUpdates } = updates as any;

    const source = await Source.findOneAndUpdate(
      { _id: sourceId, userId },
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!source) {
      throw new AppError(404, 'Source not found');
    }

    return source;
  }

  async deleteSource(userId: string, sourceId: string): Promise<void> {
    const source = await Source.findOneAndDelete({ _id: sourceId, userId });

    if (!source) {
      throw new AppError(404, 'Source not found');
    }

    if (source.s3Key) {

    try {

      await s3Service.deleteFile(source.s3Key);

    } catch (error) {

      console.error(
        'Error deleting S3 object:',
        error
      );

    }
  }
  }

  async markAsProcessed(sourceId: string, conceptCount?: number): Promise<ISourceDocument> {
    const updateFields: any = { processed: true };
    if (conceptCount !== undefined) {
      updateFields.conceptCount = conceptCount;
    }

    const source = await Source.findByIdAndUpdate(
      sourceId,
      { $set: updateFields },
      { new: true }
    );

    if (!source) {
      throw new AppError(404, 'Source not found');
    }

    return source;
  }
}

export default new SourceService();
