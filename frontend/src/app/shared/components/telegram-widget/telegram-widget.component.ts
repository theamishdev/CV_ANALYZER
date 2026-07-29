import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-telegram-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './telegram-widget.component.html',
  styleUrls: ['./telegram-widget.component.scss']
})
export class TelegramWidgetComponent {
  isOpen = signal(false);
  phoneNumber = signal('');

  toggleWidget() {
    this.isOpen.update(v => !v);
  }

  closeWidget(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen.set(false);
  }

  connectTelegram() {
    const rawNumber = this.phoneNumber();
    if (!rawNumber) return;

    // Sanitize phone number to keep only digits
    const sanitized = rawNumber.replace(/\D/g, '');
    
    if (sanitized.length < 5) {
      // Basic validation, phone numbers usually have more than 5 digits
      return;
    }

    const botUrl = `https://t.me/cv_buddy_bot?start=${sanitized}`;
    
    // Open in a new tab
    window.open(botUrl, '_blank');
    
    // Close the widget and clear input
    this.closeWidget();
    this.phoneNumber.set('');
  }
}
