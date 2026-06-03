export interface Source {
  _id: string;
  userId: string;
  title: string;
  type: 'pdf' | 'article' | 'video' | 'note' | 'code' | 'other';
  url?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  content?: string;
  metadata: {
    author?: string;
    publishedDate?: Date;
    duration?: number;
    pageCount?: number;
    wordCount?: number;
  };
  tags: string[];
  conceptCount: number;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSourceDto {
  title: string;
  type: 'pdf' | 'article' | 'video' | 'note' | 'code' | 'other';
  url?: string;
  content?: string;
  tags?: string[];
  metadata?: {
    author?: string;
    publishedDate?: Date;
    duration?: number;
    pageCount?: number;
    wordCount?: number;
  };
}

export interface UpdateSourceDto {
  title?: string;
  type?: 'pdf' | 'article' | 'video' | 'note' | 'code' | 'other';
  url?: string;
  content?: string;
  tags?: string[];
  metadata?: {
    author?: string;
    publishedDate?: Date;
    duration?: number;
    pageCount?: number;
    wordCount?: number;
  };
}

export interface SourceFilters {
  page?: number;
  limit?: number;
  type?: 'pdf' | 'article' | 'video' | 'note' | 'code' | 'other';
  processed?: boolean;
}

export interface SourceListResponse {
  sources: Source[];
  total: number;
  page: number;
  pages: number;
}
