import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConceptService } from '../../../core/services/concept.service';
import { Concept, ConceptFilters } from '../../../core/models/concept.model';

@Component({
  selector: 'app-concept-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './concept-list.component.html',
  styleUrls: ['./concept-list.component.scss'],
})
export class ConceptListComponent implements OnInit {
  private conceptService = inject(ConceptService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  concepts = signal<Concept[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalConcepts = signal(0);
  pageSize = 20;

  // Filters
  searchTerm = signal('');
  selectedDifficulty = signal<string>('');
  selectedTags = signal<string[]>([]);
  sortBy = signal<string>('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');
  sourceIdFilter = signal<string>('');

  ngOnInit() {
    // Check for sourceId query param to filter concepts by source
    const sourceId = this.route.snapshot.queryParamMap.get('sourceId');
    if (sourceId) {
      this.sourceIdFilter.set(sourceId);
    }
    this.loadConcepts();
  }

  loadConcepts() {
    this.loading.set(true);
    this.error.set(null);

    const filters: ConceptFilters = {
      page: this.currentPage(),
      limit: this.pageSize,
      sortBy: this.sortBy() as any,
      sortOrder: this.sortOrder(),
    };

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    if (this.selectedDifficulty()) {
      filters.difficulty = this.selectedDifficulty() as any;
    }

    if (this.selectedTags().length > 0) {
      filters.tags = this.selectedTags();
    }

    if (this.sourceIdFilter()) {
      filters.sourceId = this.sourceIdFilter();
    }

    this.conceptService.getConcepts(filters).subscribe({
      next: (response) => {
        this.concepts.set(response.concepts);
        this.totalPages.set(response.pages);
        this.totalConcepts.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load concepts. Please try again.');
        this.loading.set(false);
        console.error('Error loading concepts:', err);
      },
    });
  }

  onSearch(searchTerm: string) {
    this.searchTerm.set(searchTerm);
    this.currentPage.set(1);
    this.loadConcepts();
  }

  onDifficultyChange(difficulty: string) {
    this.selectedDifficulty.set(difficulty);
    this.currentPage.set(1);
    this.loadConcepts();
  }

  onSortChange(sortBy: string) {
    if (this.sortBy() === sortBy) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortBy);
      this.sortOrder.set('desc');
    }
    this.loadConcepts();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadConcepts();
  }

  viewConcept(id: string) {
    this.router.navigate(['/concepts', id]);
  }

  editConcept(id: string) {
    this.router.navigate(['/concepts', id, 'edit']);
  }

  createConcept() {
    this.router.navigate(['/concepts', 'new']);
  }

  deleteConcept(id: string) {
    if (confirm('Are you sure you want to delete this concept?')) {
      this.conceptService.deleteConcept(id).subscribe({
        next: () => {
          this.loadConcepts();
        },
        error: (err) => {
          this.error.set('Failed to delete concept. Please try again.');
          console.error('Error deleting concept:', err);
        },
      });
    }
  }

  getConfidenceClass(score: number): string {
    if (score >= 70) return 'confidence-high';
    if (score >= 40) return 'confidence-medium';
    return 'confidence-low';
  }

  getDifficultyClass(difficulty: string): string {
    return `difficulty-${difficulty}`;
  }
}
