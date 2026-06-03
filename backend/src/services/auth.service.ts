import jwt from 'jsonwebtoken';
import User, { IUserDocument } from '../models/User';
import { AppError } from '../utils/helpers';
import { JwtPayload } from '../types';

export class AuthService {
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<{ user: IUserDocument; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate JWT token
    const token = this.generateToken(user._id.toString(), user.email);

    return { user, token };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: IUserDocument; token: string }> {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user._id.toString(), user.email);

    // Remove password from user object
    user.password = undefined as any;

    return { user, token };
  }

  async getMe(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updates: Partial<IUserDocument>
  ): Promise<IUserDocument> {
    // Don't allow updating password or email through this method
    const { password, email, ...allowedUpdates } = updates as any;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }

  generateToken(userId: string, email: string): string {
    const payload: JwtPayload = { userId, email };
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_change_this';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(
      payload,
      secret,
      {
        expiresIn: expiresIn as jwt.SignOptions['expiresIn']
      }
    );
  }

  verifyToken(token: string): JwtPayload {
    try {
      const secret = process.env.JWT_SECRET || 'your_jwt_secret_change_this';
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      throw new AppError(401, 'Invalid or expired token');
    }
  }
}

export default new AuthService();
