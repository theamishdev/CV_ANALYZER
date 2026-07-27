import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  get isDark(): boolean {
    return this.themeService.isDarkSignal();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
