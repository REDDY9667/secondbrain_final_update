export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    dailyChallengeTime: string;
    challengeFrequency: 'daily' | 'moderate' | 'intensive';
    emailNotifications: boolean;
    darkMode: boolean;
  };
  stats: {
    totalConcepts: number;
    averageConfidence: number;
    challengesCompleted: number;
    currentStreak: number;
    longestStreak: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}
