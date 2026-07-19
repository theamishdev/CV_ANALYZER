import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  // Signals for auth state management
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.loadUserFromStorage();
  }

  signup(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, { name, email, password });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.setCurrentUser(res.user);
        }
      })
    );
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('cv_analyzer_user');
    this.router.navigate(['/login']);
  }

  private setCurrentUser(user: User) {
    this.currentUser.set(user);
    localStorage.setItem('cv_analyzer_user', JSON.stringify(user));
  }

  private loadUserFromStorage() {
    const storedUser = localStorage.getItem('cv_analyzer_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        this.currentUser.set(user);
      } catch (e) {
        localStorage.removeItem('cv_analyzer_user');
      }
    }
  }
}
