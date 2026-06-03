import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DecayService, DecayAnalysis, DecayAlert } from '../../core/services/decay.service';

@Component({
  selector: 'app-decay-alerts',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './decay-alerts.component.html',
  styleUrls: ['./decay-alerts.component.scss'],
})
export class DecayAlertsComponent implements OnInit {
  analysis = signal<DecayAnalysis | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private decayService: DecayService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDecayAnalysis();
  }

  loadDecayAnalysis(): void {
    this.loading.set(true);
    this.error.set(null);

    this.decayService.getDecayAnalysis().subscribe({
      next: (analysis) => {
        this.analysis.set(analysis);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading decay analysis:', err);
        this.error.set('Failed to load decay analysis. Please try again.');
        this.loading.set(false);
      },
    });
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity}`;
  }

  getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'check_circle',
    };
    return icons[severity] || 'info';
  }

  getDecayTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      overdue: 'Overdue',
      declining_confidence: 'Declining Confidence',
      poor_performance: 'Low Confidence',
      long_interval: 'Long Interval',
    };
    return labels[type] || type;
  }

  navigateToConcept(conceptId: string): void {
    this.router.navigate(['/concepts', conceptId]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
