/**
 * Challenge Model
 *
 * Stores AI-generated challenges (quiz questions) for concepts.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge {
  userId: mongoose.Types.ObjectId;
  conceptId: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-3)
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  timesAttempted: number;
  timesCorrect: number;
  successRate: number; // Percentage
  lastAttempted?: Date;
  generatedBy: 'ai' | 'manual';
  aiModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChallengeDocument extends IChallenge, Document {
  recordAttempt(correct: boolean): void;
}

const challengeSchema = new Schema<IChallengeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conceptId: {
      type: Schema.Types.ObjectId,
      ref: 'Concept',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (options: string[]) {
          return options.length >= 2 && options.length <= 6;
        },
        message: 'Options must have between 2 and 6 choices',
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (this: IChallengeDocument, value: number) {
          return value < this.options.length;
        },
        message: 'Correct answer index must be valid for the number of options',
      },
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'fill-blank'],
      default: 'multiple-choice',
    },
    timesAttempted: {
      type: Number,
      default: 0,
      min: 0,
    },
    timesCorrect: {
      type: Number,
      default: 0,
      min: 0,
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAttempted: {
      type: Date,
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'manual'],
      default: 'ai',
    },
    aiModel: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
challengeSchema.index({ userId: 1, conceptId: 1 });
challengeSchema.index({ userId: 1, successRate: 1 });
challengeSchema.index({ createdAt: -1 });

/**
 * Record a challenge attempt
 */
challengeSchema.methods.recordAttempt = function (correct: boolean): void {
  this.timesAttempted += 1;
  if (correct) {
    this.timesCorrect += 1;
  }
  this.successRate = (this.timesCorrect / this.timesAttempted) * 100;
  this.lastAttempted = new Date();
};

export const Challenge = mongoose.model<IChallengeDocument>('Challenge', challengeSchema);
