import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Concepts', route: '/concepts', icon: 'library_books' },
    { label: 'Sources', route: '/sources', icon: 'source' },
    { label: 'Study Plan', route: '/study-plan', icon: 'calendar_today' },
    { label: 'Decay Alerts', route: '/decay-alerts', icon: 'warning' },
    { label: 'Settings', route: '/settings', icon: 'settings' },
  ];
}
