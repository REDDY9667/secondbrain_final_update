import mongoose, { Schema, Document } from 'mongoose';

export interface ISourceDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: 'pdf' | 'article' | 'video' | 'note' | 'code' | 'other';
  url?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  content?: string;
  metadata: {
    author?: string;
    publishedDate?: Date;
    duration?: number; // for videos, in seconds
    pageCount?: number; // for PDFs
    wordCount?: number;
  };
  tags: string[];
  conceptCount: number;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<ISourceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Source title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    type: {
      type: String,
      enum: ['pdf', 'article', 'video', 'note', 'code', 'other'],
      required: [true, 'Source type is required'],
    },
    url: {
      type: String,
      default: null,
      validate: {
        validator: function (url: string) {
          if (!url) return true;
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format',
      },
    },
    filePath: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
      max: [10485760, 'File size cannot exceed 10MB'], // 10MB
    },
    content: {
      type: String,
      default: '',
      maxlength: [50000, 'Content cannot exceed 50000 characters'],
    },
    metadata: {
      author: { type: String, default: null },
      publishedDate: { type: Date, default: null },
      duration: { type: Number, default: null },
      pageCount: { type: Number, default: null },
      wordCount: { type: Number, default: null },
    },
    tags: {
      type: [String],
      default: [],
    },
    conceptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    processed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SourceSchema.index({ userId: 1, createdAt: -1 });
SourceSchema.index({ userId: 1, type: 1 });
SourceSchema.index({ userId: 1, processed: 1 });

// Method to increment concept count
SourceSchema.methods.incrementConceptCount = function () {
  this.conceptCount += 1;
  return this.save();
};

const Source = mongoose.model<ISourceDocument>('Source', SourceSchema);

export default Source;
