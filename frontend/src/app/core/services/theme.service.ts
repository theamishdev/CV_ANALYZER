import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  readonly isDarkSignal = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
    
    // Automatically apply class and save theme to localstorage when signal changes
    effect(() => {
      const isDark = this.isDarkSignal();
      this.updateThemeClass(isDark);
      localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
    });
  }

  private initializeTheme() {
    // Check local storage first
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      this.isDarkSignal.set(savedTheme === 'dark');
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkSignal.set(prefersDark);
    }
  }

  private updateThemeClass(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }

  toggleTheme() {
    this.isDarkSignal.update(current => !current);
  }

  setTheme(theme: 'light' | 'dark') {
    this.isDarkSignal.set(theme === 'dark');
  }

  get isDark() {
    return this.isDarkSignal();
  }
}
