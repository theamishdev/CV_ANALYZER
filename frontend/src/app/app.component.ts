import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { TelegramWidgetComponent } from './shared/components/telegram-widget/telegram-widget.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, ThemeToggleComponent, TelegramWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'cv-analyzer-auth';
  private readonly themeService = inject(ThemeService);
}
