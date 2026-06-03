import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Challenge {
  _id: string;
  userId: string;
  conceptId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  timesAttempted: number;
  timesCorrect: number;
  successRate: number;
  lastAttempted?: Date;
  generatedBy: 'ai' | 'manual';
  aiModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeGenerationResult {
  challenges: Challenge[];
  conceptTitle: string;
  generated: number;
  cached: number;
}

export interface ChallengeAttemptResult {
  correct: boolean;
  correctAnswer: number;
  explanation: string;
  successRate: number;
  success: boolean;

  pointsEarned?: number;

  newConfidence?: number;

  confidenceChange?: number;

  nextReview?: Date | string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChallengeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/challenges`;

  /**
   * Generate AI challenges for a concept
   */
  generateChallenges(
    conceptId: string,
    difficulty?: 'easy' | 'medium' | 'hard',
    count: number = 1
  ): Observable<ChallengeGenerationResult> {
    return this.http
      .post<ApiResponse<ChallengeGenerationResult>>(`${this.apiUrl}/generate`, {
        conceptId,
        difficulty,
        count,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Get challenges for a specific concept
   */
  getChallengesForConcept(conceptId: string, limit: number = 10): Observable<Challenge[]> {
    return this.http
      .get<ApiResponse<{ challenges: Challenge[]; count: number }>>(
        `${this.apiUrl}/concept/${conceptId}?limit=${limit}`
      )
      .pipe(map((response) => response.data.challenges));
  }

  /**
   * Submit answer to a challenge
   */
  submitChallengeAttempt(
    challengeId: string,
    selectedAnswer: number
  ): Observable<ChallengeAttemptResult> {
    return this.http
      .post<ApiResponse<ChallengeAttemptResult>>(`${this.apiUrl}/${challengeId}/attempt`, {
        selectedAnswer,
      })
      .pipe(map((response) => response.data));
  }
}
