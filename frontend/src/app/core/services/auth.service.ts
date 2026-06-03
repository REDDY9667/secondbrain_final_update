import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router
  ) {
    // Check if user is logged in on init
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = this.storageService.getToken();
    const user = this.storageService.getUser();

    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/register', credentials).pipe(
      tap((response) => {
        if (response.success) {
          this.handleAuthSuccess(response.data.user, response.data.token);
        }
      })
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/login', credentials).pipe(
      tap((response) => {
        if (response.success) {
          this.handleAuthSuccess(response.data.user, response.data.token);
        }
      })
    );
  }

  logout(): void {
    this.apiService.post('auth/logout', {}).subscribe({
      next: () => {
        this.handleLogout();
      },
      error: () => {
        // Logout locally even if API call fails
        this.handleLogout();
      },
    });
  }

  getMe(): Observable<any> {
    return this.apiService.get('auth/me').pipe(
      tap((response: any) => {
        if (response.success) {
          this.currentUserSubject.next(response.data.user);
          this.storageService.setUser(response.data.user);
        }
      })
    );
  }

  updateProfile(updates: Partial<User>): Observable<any> {
    return this.apiService.put('auth/profile', updates).pipe(
      tap((response: any) => {
        if (response.success) {
          this.currentUserSubject.next(response.data.user);
          this.storageService.setUser(response.data.user);
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.apiService.put('auth/password', {
      currentPassword,
      newPassword,
    });
  }

  private handleAuthSuccess(user: User, token: string): void {
    this.storageService.setToken(token);
    this.storageService.setUser(user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.router.navigate(['/dashboard']);
  }

  private handleLogout(): void {
    this.storageService.clear();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return this.storageService.getToken();
  }
}
