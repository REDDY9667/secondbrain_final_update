import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConceptService } from '../../../core/services/concept.service';
import { Concept } from '../../../core/models/concept.model';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';

@Component({
  selector: 'app-concept-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './concept-detail.component.html',
  styleUrls: ['./concept-detail.component.scss'],
})
export class ConceptDetailComponent implements OnInit {
  private conceptService = inject(ConceptService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  concept = signal<Concept | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  reviewing = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadConcept(id);
    }
  }

  loadConcept(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.conceptService.getConceptById(id).subscribe({
      next: (concept) => {
        this.concept.set(concept);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load concept. Please try again.');
        this.loading.set(false);
        console.error('Error loading concept:', err);
      },
    });
  }

  editConcept() {
    if (this.concept()) {
      this.router.navigate(['/concepts', this.concept()?._id, 'edit']);
    }
  }

  deleteConcept() {
    if (this.concept() && confirm('Are you sure you want to delete this concept?')) {
      this.conceptService.deleteConcept(this.concept()!._id).subscribe({
        next: () => {
          this.router.navigate(['/concepts']);
        },
        error: (err) => {
          this.error.set('Failed to delete concept. Please try again.');
          console.error('Error deleting concept:', err);
        },
      });
    }
  }

  goBack() {
    this.router.navigate(['/concepts']);
  }

  getConfidenceClass(score: number): string {
    if (score >= 70) return 'confidence-high';
    if (score >= 40) return 'confidence-medium';
    return 'confidence-low';
  }

  getDifficultyClass(difficulty: string): string {
    return `difficulty-${difficulty}`;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  openReviewDialog(): void {
    if (!this.concept()) return;

    const dialogRef = this.dialog.open(ReviewDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { concept: this.concept() },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((performance) => {
      if (performance) {
        this.submitReview(performance);
      }
    });
  }

  submitReview(performance: 'perfect' | 'good' | 'struggled' | 'failed'): void {
    if (!this.concept()) return;

    this.reviewing.set(true);

    this.conceptService.recordReview(this.concept()!._id, performance).subscribe({
      next: (updatedConcept) => {
        this.concept.set(updatedConcept);
        this.reviewing.set(false);

        const messages = {
          perfect: 'Excellent! Keep up the great work! 🎉',
          good: 'Good job! You\'re making progress! 👍',
          struggled: 'Keep practicing. You\'ll get there! 💪',
          failed: 'No worries! Review this again tomorrow. 📚',
        };

        this.snackBar.open(messages[performance], 'Close', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      },
      error: (err) => {
        this.reviewing.set(false);
        this.snackBar.open('Failed to record review. Please try again.', 'Close', {
          duration: 3000,
        });
        console.error('Error recording review:', err);
      },
    });
  }

  takeChallenge(): void {
    if(!this.concept()) return;
      this.router.navigate(['/challenges', this.concept()!._id]);
  }
}
