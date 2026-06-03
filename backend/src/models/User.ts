import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalConcepts: number;
    averageConfidence: number;
    reviewsCompleted: number;
    lastActive: Date;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    stats: {
      totalConcepts: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageConfidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      reviewsCompleted: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastActive: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

const User = mongoose.model<IUserDocument>('User', UserSchema);

export default User;
