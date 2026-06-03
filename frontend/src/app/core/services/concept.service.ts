import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Concept,
  CreateConceptDto,
  UpdateConceptDto,
  ConceptFilters,
  ConceptStats,
  ConceptListResponse,
} from '../models/concept.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConceptService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/concepts`;

  getConcepts(filters?: ConceptFilters): Observable<ConceptListResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.tags && filters.tags.length > 0) {
        params = params.set('tags', filters.tags.join(','));
      }
      if (filters.difficulty) params = params.set('difficulty', filters.difficulty);
      if (filters.minConfidence !== undefined) {
        params = params.set('minConfidence', filters.minConfidence.toString());
      }
      if (filters.maxConfidence !== undefined) {
        params = params.set('maxConfidence', filters.maxConfidence.toString());
      }
      if (filters.search) params = params.set('search', filters.search);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
      if (filters.sourceId) params = params.set('sourceId', filters.sourceId);
    }

    return this.http
      .get<ApiResponse<ConceptListResponse>>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  getConceptById(id: string): Observable<Concept> {
    return this.http
      .get<ApiResponse<{ concept: Concept }>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data.concept));
  }

  createConcept(concept: CreateConceptDto): Observable<Concept> {
    return this.http
      .post<ApiResponse<{ concept: Concept }>>(this.apiUrl, concept)
      .pipe(map((response) => response.data.concept));
  }

  updateConcept(id: string, updates: UpdateConceptDto): Observable<Concept> {
    return this.http
      .put<ApiResponse<{ concept: Concept }>>(`${this.apiUrl}/${id}`, updates)
      .pipe(map((response) => response.data.concept));
  }

  deleteConcept(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  getConceptStats(): Observable<ConceptStats> {
    return this.http
      .get<ApiResponse<{ stats: ConceptStats }>>(`${this.apiUrl}/stats`)
      .pipe(map((response) => response.data.stats));
  }

  getAllTags(): Observable<string[]> {
    return this.http
      .get<ApiResponse<{ tags: string[] }>>(`${this.apiUrl}/tags`)
      .pipe(map((response) => response.data.tags));
  }

  getLowConfidenceConcepts(threshold: number = 40): Observable<Concept[]> {
    const params = new HttpParams().set('threshold', threshold.toString());
    return this.http
      .get<ApiResponse<{ concepts: Concept[] }>>(`${this.apiUrl}/low-confidence`, { params })
      .pipe(map((response) => response.data.concepts));
  }

  getDueConcepts(): Observable<Concept[]> {
    return this.http
      .get<ApiResponse<{ concepts: Concept[] }>>(`${this.apiUrl}/due`)
      .pipe(map((response) => response.data.concepts));
  }

  recordReview(
    id: string,
    performance: 'perfect' | 'good' | 'struggled' | 'failed'
  ): Observable<Concept> {
    return this.http
      .post<ApiResponse<{ concept: Concept }>>(`${this.apiUrl}/${id}/review`, { performance })
      .pipe(map((response) => response.data.concept));
  }
}
