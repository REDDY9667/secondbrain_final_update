import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SourceService } from '../../../core/services/source.service';
import { Source } from '../../../core/models/source.model';
import { ConceptExtractionDialogComponent } from '../concept-extraction-dialog/concept-extraction-dialog.component';

@Component({
  selector: 'app-source-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './source-detail.component.html',
  styleUrls: ['./source-detail.component.scss'],
})
export class SourceDetailComponent implements OnInit {
  source = signal<Source | null>(null);
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sourceService: SourceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSource(id);
    }
  }

  loadSource(id: string): void {
    this.loading.set(true);

    this.sourceService.getSourceById(id).subscribe({
      next: (source) => {
        this.source.set(source);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.snackBar.open('Failed to load source', 'Close', { duration: 3000 });
        this.router.navigate(['/sources']);
      },
    });
  }

  deleteSource(): void {
    if (!this.source()) return;

    if (confirm('Are you sure you want to delete this source?')) {
      this.sourceService.deleteSource(this.source()!._id).subscribe({
        next: () => {
          this.snackBar.open('Source deleted successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/sources']);
        },
        error: (error) => {
          this.snackBar.open('Failed to delete source', 'Close', { duration: 3000 });
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/sources']);
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
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  openUrl(url: string): void {
    window.open(url, '_blank');
  }

  viewLinkedConcepts(): void {
    if (!this.source()) return;
    this.router.navigate(['/concepts'], {
      queryParams: { sourceId: this.source()!._id },
    });
  }

  extractConcepts(): void {
    if (!this.source()) return;

    const dialogRef = this.dialog.open(ConceptExtractionDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        sourceId: this.source()!._id,
        sourceTitle: this.source()!.title,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Reload source to update processed status and concept count
        this.loadSource(this.source()!._id);
      }
    });
  }
}
