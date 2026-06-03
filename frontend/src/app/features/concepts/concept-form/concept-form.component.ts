import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConceptService } from '../../../core/services/concept.service';
import { SourceService } from '../../../core/services/source.service';
import { Concept } from '../../../core/models/concept.model';
import { Source } from '../../../core/models/source.model';

@Component({
  selector: 'app-concept-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './concept-form.component.html',
  styleUrls: ['./concept-form.component.scss'],
})
export class ConceptFormComponent implements OnInit {
  private conceptService = inject(ConceptService);
  private sourceService = inject(SourceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  conceptForm!: FormGroup;
  isEditMode = signal(false);
  conceptId = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  tagInput = signal('');
  sources = signal<Source[]>([]);
  loadingSources = signal(false);

  ngOnInit() {
    this.initializeForm();
    this.loadSources();

    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.conceptId.set(id);
      this.loadConcept(id);
    }
  }

  initializeForm() {
    this.conceptForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      notes: ['', [Validators.maxLength(5000)]],
      difficulty: ['beginner', Validators.required],
      tags: [[] as string[]],
      sourceId: [''],
    });
  }

  loadSources() {
    this.loadingSources.set(true);
    this.sourceService.getSources({ limit: 100 }).subscribe({
      next: (response) => {
        this.sources.set(response.sources);
        this.loadingSources.set(false);
      },
      error: (err) => {
        console.error('Error loading sources:', err);
        this.loadingSources.set(false);
      },
    });
  }

  loadConcept(id: string) {
    this.loading.set(true);
    this.conceptService.getConceptById(id).subscribe({
      next: (concept) => {
        this.conceptForm.patchValue({
          title: concept.title,
          description: concept.description,
          notes: concept.notes || '',
          difficulty: concept.difficulty,
          tags: concept.tags,
          sourceId: concept.sourceId?._id || '',
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load concept. Please try again.');
        this.loading.set(false);
        console.error('Error loading concept:', err);
      },
    });
  }

  addTag(tag: string) {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !this.getTags().includes(trimmedTag)) {
      const currentTags = this.getTags();
      this.conceptForm.patchValue({
        tags: [...currentTags, trimmedTag],
      });
      this.tagInput.set('');
    }
  }

  removeTag(tag: string) {
    const currentTags = this.getTags();
    this.conceptForm.patchValue({
      tags: currentTags.filter((t) => t !== tag),
    });
  }

  getTags(): string[] {
    return this.conceptForm.get('tags')?.value || [];
  }

  onTagKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag(this.tagInput());
    }
  }

  onSubmit() {
    if (this.conceptForm.invalid) {
      this.conceptForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formData = { ...this.conceptForm.value };

    // Remove empty sourceId to allow concept creation without a source
    if (!formData.sourceId) {
      delete formData.sourceId;
    }

    if (this.isEditMode() && this.conceptId()) {
      // Update existing concept
      this.conceptService.updateConcept(this.conceptId()!, formData).subscribe({
        next: () => {
          this.router.navigate(['/concepts', this.conceptId()]);
        },
        error: (err) => {
          this.error.set('Failed to update concept. Please try again.');
          this.loading.set(false);
          console.error('Error updating concept:', err);
        },
      });
    } else {
      // Create new concept
      this.conceptService.createConcept(formData).subscribe({
        next: (concept) => {
          this.router.navigate(['/concepts', concept._id]);
        },
        error: (err) => {
          this.error.set('Failed to create concept. Please try again.');
          this.loading.set(false);
          console.error('Error creating concept:', err);
        },
      });
    }
  }

  onCancel() {
    if (this.isEditMode() && this.conceptId()) {
      this.router.navigate(['/concepts', this.conceptId()]);
    } else {
      this.router.navigate(['/concepts']);
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.conceptForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return null;
  }
}
