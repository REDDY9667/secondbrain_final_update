import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Source,
  CreateSourceDto,
  UpdateSourceDto,
  SourceFilters,
  SourceListResponse,
} from '../models/source.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SourceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sources`;

  getSources(filters?: SourceFilters): Observable<SourceListResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.type) params = params.set('type', filters.type);
      if (filters.processed !== undefined) {
        params = params.set('processed', filters.processed.toString());
      }
    }

    return this.http
      .get<ApiResponse<SourceListResponse>>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  getSourceById(id: string): Observable<Source> {
    return this.http
      .get<ApiResponse<{ source: Source }>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data.source));
  }

  createSource(source: CreateSourceDto): Observable<Source> {
    return this.http
      .post<ApiResponse<{ source: Source }>>(this.apiUrl, source)
      .pipe(map((response) => response.data.source));
  }

  uploadFile(file: File, metadata?: { title?: string; type?: string; tags?: string }): Observable<Source> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata?.title) formData.append('title', metadata.title);
    if (metadata?.type) formData.append('type', metadata.type);
    if (metadata?.tags) formData.append('tags', metadata.tags);

    return this.http
      .post<ApiResponse<{ source: Source }>>(`${this.apiUrl}/upload`, formData)
      .pipe(map((response) => response.data.source));
  }

  updateSource(id: string, updates: UpdateSourceDto): Observable<Source> {
    return this.http
      .put<ApiResponse<{ source: Source }>>(`${this.apiUrl}/${id}`, updates)
      .pipe(map((response) => response.data.source));
  }

  deleteSource(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
