import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SourceService } from '../../../core/services/source.service';
import { Source, SourceFilters } from '../../../core/models/source.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-source-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './source-list.component.html',
  styleUrls: ['./source-list.component.scss'],
})
export class SourceListComponent implements OnInit {
  sources = signal<Source[]>([]);
  loading = signal(false);
  totalSources = signal(0);
  currentPage = signal(1);
  pageSize = 10;
  totalPages = signal(0);

  selectedType = signal<string>('');
  selectedProcessed = signal<string>('');

  sourceTypes = [
    { value: '', label: 'All Types' },
    { value: 'pdf', label: 'PDF' },
    { value: 'article', label: 'Article' },
    { value: 'video', label: 'Video' },
    { value: 'note', label: 'Note' },
    { value: 'code', label: 'Code' },
    { value: 'other', label: 'Other' },
  ];

  processedOptions = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Processed' },
    { value: 'false', label: 'Not Processed' },
  ];

  constructor(
    private sourceService: SourceService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSources();
  }

  loadSources(): void {
    this.loading.set(true);

    const filters: SourceFilters = {
      page: this.currentPage(),
      limit: this.pageSize,
    };

    if (this.selectedType()) {
      filters.type = this.selectedType() as any;
    }

    if (this.selectedProcessed()) {
      filters.processed = this.selectedProcessed() === 'true';
    }

    this.sourceService.getSources(filters).subscribe({
      next: (response) => {
        this.sources.set(response.sources);
        this.totalSources.set(response.total);
        this.totalPages.set(response.pages);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.snackBar.open('Failed to load sources', 'Close', { duration: 3000 });
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadSources();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadSources();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadSources();
    }
  }

  viewSource(id: string): void {
    this.router.navigate(['/sources', id]);
  }

  deleteSource(id: string, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this source?')) {
      this.sourceService.deleteSource(id).subscribe({
        next: () => {
          this.snackBar.open('Source deleted successfully', 'Close', { duration: 3000 });
          this.loadSources();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete source', 'Close', { duration: 3000 });
        },
      });
    }
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      pdf: 'picture_as_pdf',
      article: 'article',
      video: 'video_library',
      note: 'note',
      code: 'code',
      other: 'insert_drive_file',
    };
    return icons[type] || 'insert_drive_file';
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      pdf: '#f44336',
      article: '#2196f3',
      video: '#ff9800',
      note: '#4caf50',
      code: '#9c27b0',
      other: '#757575',
    };
    return colors[type] || '#757575';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}
