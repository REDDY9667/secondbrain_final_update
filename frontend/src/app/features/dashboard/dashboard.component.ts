import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { ConceptService } from '../../core/services/concept.service';
import { User } from '../../core/models/user.model';
import { ConceptStats } from '../../core/models/concept.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  conceptStats = signal<ConceptStats | null>(null);
  loadingStats = signal(false);

  constructor(
    private authService: AuthService,
    private conceptService: ConceptService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });

    // Fetch latest user data
    this.authService.getMe().subscribe();

    // Fetch concept statistics
    this.loadConceptStats();
  }

  loadConceptStats(): void {
    this.loadingStats.set(true);
    this.conceptService.getConceptStats().subscribe({
      next: (stats) => {
        this.conceptStats.set(stats);
        this.loadingStats.set(false);
      },
      error: (err) => {
        console.error('Error loading concept stats:', err);
        this.loadingStats.set(false);
      },
    });
  }

  navigateToAddConcept(): void {
    this.router.navigate(['/concepts/new']);
  }

  navigateToUploadSource(): void {
    this.router.navigate(['/sources/new']);
  }

  navigateToChallenges(): void {
    this.router.navigate(['/challenges']);
  }

  navigateToConcepts(): void {
    this.router.navigate(['/concepts']);
  }

  navigateToSources(): void {
    this.router.navigate(['/sources']);
  }
}
