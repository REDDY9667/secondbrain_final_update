import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface ExtractedConcept {
  title: string;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
}

export interface ConceptExtractionResult {
  sourceId: string;
  sourceTitle: string;
  concepts: ExtractedConcept[];
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    extractedAt: Date;
  };
}

export interface SaveConceptsRequest {
  concepts: ExtractedConcept[];
}

export interface SaveConceptsResponse {
  source: any;
  concepts: any[];
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExtractionService {
  private apiUrl = `${environment.apiUrl}/sources`;

  constructor(private http: HttpClient) {}

/**
 * Extract concepts from a source
 */
extractConcepts(sourceId: string): Observable<ConceptExtractionResult> {
  return this.http
    .post<any>(`${this.apiUrl}/${sourceId}/extract`, {})
    .pipe(
      map((response) => response.data)
    );
}

  /**
   * Get already extracted concepts for a source
   */
  getExtractedConcepts(sourceId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${sourceId}/extracted`);
  }

  /**
   * Save selected concepts to database
   */
  saveConcepts(sourceId: string, concepts: ExtractedConcept[]): Observable<SaveConceptsResponse> {
    return this.http.post<SaveConceptsResponse>(`${this.apiUrl}/${sourceId}/save-concepts`, {
      concepts,
    });
  }
}
