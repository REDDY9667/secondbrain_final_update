import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DecayAlert {
  conceptId: string;
  title: string;
  decayType: 'overdue' | 'declining_confidence' | 'poor_performance' | 'long_interval';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: {
    daysSinceLastReview?: number;
    currentConfidence: number;
    confidenceChange?: number;
    recommendedInterval?: number;
    actualInterval?: number;
    daysOverdue?: number;
  };
  recommendedAction: string;
}

export interface DecayAnalysis {
  userId: string;
  totalConcepts: number;
  conceptsAtRisk: number;
  alerts: DecayAlert[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

export interface DecaySummary {
  totalConcepts: number;
  conceptsAtRisk: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  topRecommendation: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DecayService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/decay`;

  /**
   * Get full decay analysis with alerts
   */
  getDecayAnalysis(): Observable<DecayAnalysis> {
    return this.http
      .get<ApiResponse<{ analysis: DecayAnalysis }>>(`${this.apiUrl}/analysis`)
      .pipe(map((response) => response.data.analysis));
  }

  /**
   * Get urgent concepts needing immediate review
   */
  getUrgentConcepts(limit: number = 10): Observable<any[]> {
    return this.http
      .get<ApiResponse<{ concepts: any[]; count: number }>>(
        `${this.apiUrl}/urgent?limit=${limit}`
      )
      .pipe(map((response) => response.data.concepts));
  }

  /**
   * Get quick decay summary
   */
  getDecaySummary(): Observable<DecaySummary> {
    return this.http
      .get<ApiResponse<{ summary: DecaySummary }>>(`${this.apiUrl}/summary`)
      .pipe(map((response) => response.data.summary));
  }
}
