import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SourceService } from '../../../core/services/source.service';
import { CreateSourceDto } from '../../../core/models/source.model';

@Component({
  selector: 'app-source-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
  templateUrl: './source-upload.component.html',
  styleUrls: ['./source-upload.component.scss'],
})
export class SourceUploadComponent {
  fileForm: FormGroup;
  urlForm: FormGroup;

  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);

  sourceTypes = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'article', label: 'Article/Blog' },
    { value: 'video', label: 'Video' },
    { value: 'note', label: 'Personal Note' },
    { value: 'code', label: 'Code Snippet' },
    { value: 'other', label: 'Other' },
  ];

  constructor(
    private fb: FormBuilder,
    private sourceService: SourceService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.fileForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      type: ['pdf', Validators.required],
      tags: [''],
    });

    this.urlForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      type: ['article', Validators.required],
      content: [''],
      tags: [''],
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  handleFileSelection(file: File): void {
    // Validate file size (10MB max)
    if (file.size > 10485760) {
      this.snackBar.open('File size cannot exceed 10MB', 'Close', { duration: 3000 });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/json'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
      this.snackBar.open('Only PDF, text, markdown, and JSON files are allowed', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.selectedFile.set(file);

    // Auto-populate title from filename
    if (!this.fileForm.get('title')?.value) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      this.fileForm.patchValue({ title: fileName });
    }

    // Auto-detect type
    if (file.type === 'application/pdf') {
      this.fileForm.patchValue({ type: 'pdf' });
    } else if (file.name.endsWith('.md') || file.type === 'text/markdown') {
      this.fileForm.patchValue({ type: 'note' });
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.fileForm.patchValue({ title: '' });
  }

  uploadFile(): void {
    if (this.fileForm.invalid || !this.selectedFile()) {
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);

    const file = this.selectedFile()!;
    const metadata = {
      title: this.fileForm.value.title,
      type: this.fileForm.value.type,
      tags: this.fileForm.value.tags,
    };

    // Simulate progress (in real app, use HttpEvent progress)
    const progressInterval = setInterval(() => {
      const current = this.uploadProgress();
      if (current < 90) {
        this.uploadProgress.set(current + 10);
      }
    }, 200);

    this.sourceService.uploadFile(file, metadata).subscribe({
      next: (source) => {
        clearInterval(progressInterval);
        this.uploadProgress.set(100);
        this.uploading.set(false);
        this.snackBar.open('File uploaded successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/sources', source._id]);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.snackBar.open(error.error?.message || 'Upload failed', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  submitUrl(): void {
    if (this.urlForm.invalid) {
      return;
    }

    this.uploading.set(true);

    const tagsString = this.urlForm.value.tags;
    const tags = tagsString ? tagsString.split(',').map((t: string) => t.trim()) : [];

    const sourceData: CreateSourceDto = {
      title: this.urlForm.value.title,
      url: this.urlForm.value.url,
      type: this.urlForm.value.type,
      content: this.urlForm.value.content,
      tags,
    };

    this.sourceService.createSource(sourceData).subscribe({
      next: (source) => {
        this.uploading.set(false);
        this.snackBar.open('URL source created successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/sources', source._id]);
      },
      error: (error) => {
        this.uploading.set(false);
        this.snackBar.open(error.error?.message || 'Failed to create source', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/sources']);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}
