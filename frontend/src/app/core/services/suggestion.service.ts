import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface StudySuggestion {
  conceptId: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedTime: number;
  actions: string[];
  metrics: {
    confidenceScore: number;
    daysSinceReview?: number;
    daysOverdue?: number;
  };
}

export interface DailyStudyPlan {
  date: Date;
  totalEstimatedTime: number;
  suggestions: StudySuggestion[];
  focusAreas: string[];
  motivationalMessage: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface FocusArea {
  category: string;
  conceptCount: number;
  averageConfidence: number;
  title: string;

  recommendation?: string;

  recommendations?: string[];

  weakConcepts?: any[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SuggestionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/suggestions`;

  /**
   * Get basic daily study plan
   */
  getDailyStudyPlan(): Observable<DailyStudyPlan> {
    return this.http
      .get<ApiResponse<{ plan: DailyStudyPlan }>>(`${this.apiUrl}/daily`)
      .pipe(map((response) => response.data.plan));
  }

  /**
   * Get AI-enhanced daily study plan
   */
  getEnhancedStudyPlan(): Observable<DailyStudyPlan> {
    return this.http
      .get<ApiResponse<{ plan: DailyStudyPlan }>>(`${this.apiUrl}/daily/enhanced`)
      .pipe(map((response) => response.data.plan));
  }

  /**
   * Get focus areas
   */
  getFocusAreas(): Observable<FocusArea[]> {
    return this.http
      .get<ApiResponse<{ focusAreas: FocusArea[]; count: number }>>(
        `${this.apiUrl}/focus-areas`
      )
      .pipe(map((response) => response.data.focusAreas));
  }
}
