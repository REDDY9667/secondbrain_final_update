import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'SecondBrain';
  showHeader = false;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((isAuth) => {
      this.showHeader = isAuth;
    });
  }
}
