import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { SuggestionService, DailyStudyPlan, StudySuggestion, FocusArea } from '../../core/services/suggestion.service';

@Component({
  selector: 'app-study-plan',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
  ],
  templateUrl: './study-plan.component.html',
  styleUrls: ['./study-plan.component.scss'],
})
export class StudyPlanComponent implements OnInit {
  dailyPlan = signal<DailyStudyPlan | null>(null);
  focusAreas = signal<FocusArea[]>([]);
  loading = signal(false);
  loadingFocus = signal(false);
  error = signal<string | null>(null);
  selectedTab = signal(0);

  constructor(
    private suggestionService: SuggestionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDailyPlan();
    this.loadFocusAreas();
  }

  loadDailyPlan(): void {
    this.loading.set(true);
    this.error.set(null);

    this.suggestionService.getEnhancedStudyPlan().subscribe({
      next: (plan) => {
        this.dailyPlan.set(plan);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading study plan:', err);
        this.error.set('Failed to load study plan. Please try again.');
        this.loading.set(false);
      },
    });
  }

  loadFocusAreas(): void {
    this.loadingFocus.set(true);

    this.suggestionService.getFocusAreas().subscribe({
      next: (areas) => {
        this.focusAreas.set(areas);
        this.loadingFocus.set(false);
      },
      error: (err) => {
        console.error('Error loading focus areas:', err);
        this.loadingFocus.set(false);
      },
    });
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      critical: 'error',
      high: 'priority_high',
      medium: 'remove',
      low: 'trending_down',
    };
    return icons[priority] || 'info';
  }

  getTotalEstimatedTime(): number {
    const plan = this.dailyPlan();
    if (!plan) return 0;
    return plan.suggestions.reduce((total, suggestion) => total + suggestion.estimatedTime, 0);
  }

  navigateToConcept(conceptId: string): void {
    this.router.navigate(['/concepts', conceptId]);
  }

  startChallenge(conceptId: string): void {
    this.router.navigate(['/challenges', conceptId]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }
}
