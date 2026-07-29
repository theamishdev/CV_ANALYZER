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
  private readonly cvApiUrl = 'http://localhost:3000/api/cv';

  // Signals for auth state management
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  saveActiveCv(userId: string, cvData: any, latexCode?: string): Observable<any> {
    return this.http.post<any>(`${this.cvApiUrl}`, { userId, cvData, latexCode });
  }

  getActiveCv(userId: string): Observable<any> {
    return this.http.get<any>(`${this.cvApiUrl}/${userId}`);
  }

  parseCvToLatex(file?: File | null, cvText?: string): Observable<any> {
    const formData = new FormData();
    if (file) formData.append('cv', file);
    if (cvText) formData.append('cvText', cvText);
    return this.http.post<any>(`${this.cvApiUrl}/latex/parse`, formData);
  }

  downloadLatexFile(latexCode: string, filename?: string): Observable<Blob> {
    return this.http.post(`${this.cvApiUrl}/latex/download-tex`, { latexCode, filename }, {
      responseType: 'blob'
    });
  }

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

  updateProfile(user: User): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, user).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.setCurrentUser(res.user);
        }
      })
    );
  }

  predict(text: string, jobDescription?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/predict`, { text, jobDescription });
  }

  uploadCv(file: File, jobDescription: string): Observable<any> {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('jobDescription', jobDescription);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  downloadOptimizedDocx(file: File, replacements: any): Observable<Blob> {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('replacements', JSON.stringify(replacements));
    return this.http.post(`${this.apiUrl}/download-docx`, formData, {
      responseType: 'blob'
    });
  }

  saveHistory(
    userId: string,
    jobDescription: string,
    matchScore: number,
    predictedTitle: string,
    predictedExperienceLevel: string,
    matchedSkills: string[],
    missingSkills: string[],
    otherSkills: string[],
    suggestions: any[],
    parsedCv: any,
    file?: File | null
  ): Observable<any> {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('jobDescription', jobDescription);
    formData.append('matchScore', matchScore.toString());
    formData.append('predictedTitle', predictedTitle);
    formData.append('predictedExperienceLevel', predictedExperienceLevel);
    formData.append('matchedSkills', JSON.stringify(matchedSkills));
    formData.append('missingSkills', JSON.stringify(missingSkills));
    formData.append('otherSkills', JSON.stringify(otherSkills));
    formData.append('suggestions', JSON.stringify(suggestions));
    formData.append('parsedCv', JSON.stringify(parsedCv));
    if (file) {
      formData.append('cv', file);
    }
    return this.http.post<any>(`${this.apiUrl}/history`, formData);
  }

  getHistory(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/history/${userId}`);
  }

  deleteHistoryItem(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/history/${id}`);
  }

  getHistoryDownloadUrl(id: string): string {
    return `${this.apiUrl}/history/download/${id}`;
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
