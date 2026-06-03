export interface Concept {
  _id: string;
  userId: string;
  title: string;
  description: string;
  notes?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  confidenceScore: number;
  reviewCount: number;
  lastReviewed?: Date;
  nextReview?: Date;
  reviewInterval: number;
  easeFactor: number;
  sourceId?: {
    _id: string;
    title: string;
    type: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isDue?: boolean;
}

export interface CreateConceptDto {
  title: string;
  description: string;
  notes?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  sourceId?: string;
}

export interface UpdateConceptDto {
  title?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  confidenceScore?: number;
}

export interface ConceptFilters {
  page?: number;
  limit?: number;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  minConfidence?: number;
  maxConfidence?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'confidenceScore' | 'nextReview';
  sortOrder?: 'asc' | 'desc';
  sourceId?: string;
}

export interface ConceptStats {
  total: number;
  byDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  byConfidence: {
    low: number;
    medium: number;
    high: number;
  };
  averageConfidence: number;
  dueConcepts: number;
}

export interface ConceptListResponse {
  concepts: Concept[];
  total: number;
  page: number;
  pages: number;
}
