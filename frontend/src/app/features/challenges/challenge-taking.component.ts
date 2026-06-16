import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ChallengeService, Challenge, ChallengeAttemptResult } from '../../core/services/challenge.service';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-challenge-taking',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  templateUrl: './challenge-taking.component.html',
  styleUrls: ['./challenge-taking.component.scss'],
})
export class ChallengeTakingComponent implements OnInit {
  conceptId = signal<string | null>(null);
  challenges = signal<Challenge[]>([]);
  currentChallengeIndex = signal(0);
  selectedAnswer = signal<number | null>(null);
  showResult = signal(false);
  attemptResult = signal<ChallengeAttemptResult | null>(null);
  loading = signal(false);
  generating = signal(false);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private challengeService: ChallengeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('conceptId');
    if (id) {
      this.conceptId.set(id);
      this.loadChallenges();
    }
  }

  loadChallenges(): void {
    if (!this.conceptId()) return;

    this.loading.set(true);
    this.error.set(null);

    this.challengeService.getChallengesForConcept(this.conceptId()!).subscribe({
      next: (challenges) => {
        if (challenges.length === 0) {
          // No existing challenges, generate new ones
          this.loading.set(false);
          this.generateChallenges();
        } else {
          this.challenges.set(challenges);
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading challenges:', err);
        this.error.set('Failed to load challenges. Please try again.');
        this.loading.set(false);
      },
    });
  }

  generateChallenges(): void {
    if (!this.conceptId()) return;

    this.generating.set(true);
    this.error.set(null);

    this.challengeService.generateChallenges(this.conceptId()!, undefined, 3).subscribe({
      next: (result) => {
        this.challenges.set(result.challenges);
        this.loading.set(false);
        this.generating.set(false);
        this.snackBar.open(
          `Generated ${result.generated} new challenge(s)!`,
          'Close',
          { duration: 3000 }
        );
      },
      error: (err) => {
        console.error('Error generating challenges:', err);
        this.error.set('Failed to generate challenges. Please try again.');
        this.generating.set(false);
      },
    });
  }

  getCurrentChallenge(): Challenge | null {
    const challenges = this.challenges();
    const index = this.currentChallengeIndex();
    return challenges[index] || null;
  }

  selectAnswer(index: number): void {
    if (this.showResult()) return; // Don't allow changing answer after submission
    this.selectedAnswer.set(index);
  }

  submitAnswer(): void {
    const challenge = this.getCurrentChallenge();
    const answer = this.selectedAnswer();

    if (!challenge || answer === null) {
      this.snackBar.open('Please select an answer', 'Close', { duration: 2000 });
      return;
    }

    this.loading.set(true);

    this.challengeService.submitChallengeAttempt(challenge._id, answer).subscribe({
      next: (result) => {
        this.attemptResult.set(result);
        this.showResult.set(true);
        this.loading.set(false);

        if (result.correct) {
          this.snackBar.open('Correct! 🎉', 'Close', {
            duration: 2000,
            panelClass: ['success-snackbar'],
          });
        } else {
          this.snackBar.open('Incorrect. Keep learning!', 'Close', {
            duration: 2000,
            panelClass: ['error-snackbar'],
          });
        }
      },
      error: (err) => {
        console.error('Error submitting answer:', err);
        this.snackBar.open('Failed to submit answer. Please try again.', 'Close', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  nextChallenge(): void {
    const challenges = this.challenges();
    const currentIndex = this.currentChallengeIndex();

    if (currentIndex < challenges.length - 1) {
      this.currentChallengeIndex.set(currentIndex + 1);
      this.resetChallenge();
    } else {
      // No more challenges, go back to concept detail
      this.finishChallenges();
    }
  }

  resetChallenge(): void {
    this.selectedAnswer.set(null);
    this.showResult.set(false);
    this.attemptResult.set(null);
  }

  finishChallenges(): void {
    this.snackBar.open('All challenges completed!', 'Close', { duration: 2000 });
    this.router.navigate(['/concepts', this.conceptId()]);
  }

  goBack(): void {
    this.router.navigate(['/concepts', this.conceptId()]);
  }

  getDifficultyClass(difficulty: string): string {
    return `difficulty-${difficulty}`;
  }

  getDifficultyIcon(difficulty: string): string {
    const icons: Record<string, string> = {
      easy: 'trending_down',
      medium: 'trending_flat',
      hard: 'trending_up',
    };
    return icons[difficulty] || 'help';
  }
}
