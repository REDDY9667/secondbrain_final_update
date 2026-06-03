import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExtractionService, ExtractedConcept } from '../../../core/services/extraction.service';

export interface ConceptExtractionData {
  sourceId: string;
  sourceTitle: string;
}

interface EditableConcept extends ExtractedConcept {
  selected: boolean;
  editing: boolean;
}

@Component({
  selector: 'app-concept-extraction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: './concept-extraction-dialog.component.html',
  styleUrls: ['./concept-extraction-dialog.component.scss'],
})
export class ConceptExtractionDialogComponent {
  concepts = signal<EditableConcept[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  extractionComplete = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConceptExtractionData,
    private dialogRef: MatDialogRef<ConceptExtractionDialogComponent>,
    private extractionService: ExtractionService,
    private snackBar: MatSnackBar
  ) {
    this.startExtraction();
  }

  startExtraction(): void {
    this.loading.set(true);
    this.error.set(null);

    this.extractionService.extractConcepts(this.data.sourceId).subscribe({
      next: (result) => {
  console.log('Extraction result:', result);

  const concepts = result?.concepts || [];

  const editableConcepts: EditableConcept[] = concepts.map((concept) => ({
    ...concept,
    selected: true,
    editing: false,
  }));

  this.concepts.set(editableConcepts);
  this.extractionComplete.set(true);
  this.loading.set(false);

  this.snackBar.open(
    `Extracted ${concepts.length} concepts!`,
    'Close',
    {
      duration: 3000,
    }
  );
},
      error: (err) => {
        console.error('Extraction error:', err);
        this.error.set(err.error?.message || 'Failed to extract concepts. Please try again.');
        this.loading.set(false);
      },
    });
  }

  toggleSelection(index: number): void {
    const current = this.concepts();
    current[index].selected = !current[index].selected;
    this.concepts.set([...current]);
  }

  toggleEdit(index: number): void {
    const current = this.concepts();
    current[index].editing = !current[index].editing;
    this.concepts.set([...current]);
  }

  removeConcept(index: number): void {
    const current = this.concepts();
    current.splice(index, 1);
    this.concepts.set([...current]);
  }

  addTag(conceptIndex: number, tagInput: HTMLInputElement): void {
    const tag = tagInput.value.trim();
    if (!tag) return;

    const current = this.concepts();
    if (!current[conceptIndex].tags.includes(tag)) {
      current[conceptIndex].tags.push(tag);
      this.concepts.set([...current]);
    }
    tagInput.value = '';
  }

  removeTag(conceptIndex: number, tagIndex: number): void {
    const current = this.concepts();
    current[conceptIndex].tags.splice(tagIndex, 1);
    this.concepts.set([...current]);
  }

  getSelectedCount(): number {
    return this.concepts().filter((c) => c.selected).length;
  }

  selectAll(): void {
    const current = this.concepts();
    current.forEach((c) => (c.selected = true));
    this.concepts.set([...current]);
  }

  deselectAll(): void {
    const current = this.concepts();
    current.forEach((c) => (c.selected = false));
    this.concepts.set([...current]);
  }

  getDifficultyClass(difficulty: string): string {
    return `difficulty-${difficulty}`;
  }

  getDifficultyIcon(difficulty: string): string {
    const icons: Record<string, string> = {
      beginner: 'trending_down',
      intermediate: 'trending_flat',
      advanced: 'trending_up',
    };
    return icons[difficulty] || 'help';
  }

  saveConcepts(): void {
    const selectedConcepts = this.concepts()
      .filter((c) => c.selected)
      .map(({ selected, editing, ...concept }) => concept);

    if (selectedConcepts.length === 0) {
      this.snackBar.open('Please select at least one concept to save', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.saving.set(true);

    this.extractionService.saveConcepts(this.data.sourceId, selectedConcepts).subscribe({
      next: (result) => {
        this.snackBar.open(`Saved ${result.count} concept(s) successfully!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.dialogRef.close(result);
      },
      error: (err) => {
        console.error('Save error:', err);
        this.snackBar.open(
          err.error?.message || 'Failed to save concepts. Please try again.',
          'Close',
          { duration: 3000 }
        );
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  retry(): void {
    this.extractionComplete.set(false);
    this.concepts.set([]);
    this.startExtraction();
  }
}
