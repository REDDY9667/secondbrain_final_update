import mongoose, { Schema, Document } from 'mongoose';

export interface IConceptDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;

  recordReview(
  performance: 'perfect' | 'good' | 'struggled' | 'failed'
): Promise<IConceptDocument>;

  description: string;
  notes?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  confidenceScore: number;
  sourceId?: mongoose.Types.ObjectId;
  reviewCount: number;
  lastReviewed?: Date;
  nextReview?: Date;
  reviewInterval: number;
  easeFactor: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConceptSchema = new Schema<IConceptDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', 
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Concept title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    notes: {
      type: String,
      default: '',
      maxlength: [10000, 'Notes cannot exceed 10000 characters'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    confidenceScore: {
      type: Number,
      default: 50,
      min: [0, 'Confidence score cannot be less than 0'],
      max: [100, 'Confidence score cannot exceed 100'],
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Source',
      default: null,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReviewed: {
      type: Date,
      default: null,
    },
    nextReview: {
      type: Date,
      default: function () {
        // Default to 1 day from now
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      },
    },
    reviewInterval: {
      type: Number,
      default: 1, // days
      min: 1,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
      max: 2.5,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ConceptSchema.index({ userId: 1, createdAt: -1 });
ConceptSchema.index({ userId: 1, tags: 1 });
ConceptSchema.index({ userId: 1, confidenceScore: 1 });
ConceptSchema.index({ userId: 1, nextReview: 1 });

// Virtual for checking if concept is due for review
ConceptSchema.virtual('isDue').get(function () {
  if (!this.nextReview) return false;
  return new Date() >= this.nextReview;
});

// Method to update confidence score
ConceptSchema.methods.updateConfidence = function (change: number) {
  this.confidenceScore = Math.max(0, Math.min(100, this.confidenceScore + change));
  return this.save();
};

// Method to record review
ConceptSchema.methods.recordReview = function (
  performance: 'perfect' | 'good' | 'struggled' | 'failed'
) {
  this.reviewCount += 1;
  this.lastReviewed = new Date();

  // Update confidence based on performance
  const confidenceChanges = {
    perfect: 10,
    good: 5,
    struggled: -5,
    failed: -15,
  };
  this.confidenceScore = Math.max(
    0,
    Math.min(100, this.confidenceScore + confidenceChanges[performance])
  );

  // Calculate next review date using spaced repetition
  let newInterval: number;
  let newEase: number = this.easeFactor;

  switch (performance) {
    case 'perfect':
      newInterval = this.reviewInterval * this.easeFactor * 1.3;
      newEase = Math.min(this.easeFactor + 0.15, 2.5);
      break;
    case 'good':
      newInterval = this.reviewInterval * this.easeFactor;
      newEase = Math.min(this.easeFactor + 0.1, 2.5);
      break;
    case 'struggled':
      newInterval = this.reviewInterval * 0.5;
      newEase = Math.max(this.easeFactor - 0.2, 1.3);
      break;
    case 'failed':
      newInterval = 1; // Reset to 1 day
      newEase = Math.max(this.easeFactor - 0.3, 1.3);
      break;
  }

  this.reviewInterval = Math.round(newInterval);
  this.easeFactor = newEase;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + this.reviewInterval);
  this.nextReview = nextReview;

  return this.save();
};

const Concept = mongoose.model<IConceptDocument>('Concept', ConceptSchema);

export default Concept;
