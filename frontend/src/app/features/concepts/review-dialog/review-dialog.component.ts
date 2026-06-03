import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Concept } from '../../../core/models/concept.model';

export interface ReviewDialogData {
  concept: Concept;
}

type PerformanceLevel = 'perfect' | 'good' | 'struggled' | 'failed';

interface PerformanceOption {
  value: PerformanceLevel;
  label: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './review-dialog.component.html',
  styleUrls: ['./review-dialog.component.scss'],
})
export class ReviewDialogComponent {
  showAnswer = signal(false);
  selectedPerformance = signal<PerformanceLevel | null>(null);

  performanceOptions: PerformanceOption[] = [
    {
      value: 'perfect',
      label: 'Perfect',
      description: 'Recalled everything without hesitation',
      icon: 'sentiment_very_satisfied',
      color: '#4caf50',
    },
    {
      value: 'good',
      label: 'Good',
      description: 'Recalled most of it, minor gaps',
      icon: 'sentiment_satisfied',
      color: '#8bc34a',
    },
    {
      value: 'struggled',
      label: 'Struggled',
      description: 'Had difficulty recalling, needed hints',
      icon: 'sentiment_neutral',
      color: '#ff9800',
    },
    {
      value: 'failed',
      label: 'Failed',
      description: "Couldn't recall at all",
      icon: 'sentiment_dissatisfied',
      color: '#f44336',
    },
  ];

  constructor(
    public dialogRef: MatDialogRef<ReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReviewDialogData
  ) {}

  toggleAnswer(): void {
    this.showAnswer.set(!this.showAnswer());
  }

  selectPerformance(performance: PerformanceLevel): void {
    this.selectedPerformance.set(performance);
  }

  submitReview(): void {
    if (this.selectedPerformance()) {
      this.dialogRef.close(this.selectedPerformance());
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  getPerformanceColor(value: PerformanceLevel): string {
    const option = this.performanceOptions.find((opt) => opt.value === value);
    return option?.color || '#757575';
  }

  getConfidenceClass(score: number): string {
    if (score < 40) return 'low';
    if (score < 70) return 'medium';
    return 'high';
  }
}
