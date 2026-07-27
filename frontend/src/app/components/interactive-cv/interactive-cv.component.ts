import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CVData } from '../../shared/models/cv.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-interactive-cv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interactive-cv.component.html',
  styleUrls: ['./interactive-cv.component.scss']
})
export class InteractiveCvComponent implements OnInit {
  @Input() cvData!: CVData;

  private readonly http = inject(HttpClient);
  protected readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  ngOnInit(): void {}

  trackByFn(index: any, item: any) {
    return index;
  }

  addHighlight(expIndex: number) {
    this.cvData.experience[expIndex].highlights.push('');
  }

  addExperience() {
    this.cvData.experience.push({ role: '', company: '', location: '', duration: '', highlights: [''] });
  }

  addEducation() {
    this.cvData.education.push({ degree: '', institution: '', location: '', duration: '', gpa: '' });
  }

  addTech(projectIndex: number) {
    this.cvData.projects[projectIndex].technologies.push('');
  }

  addProject() {
    this.cvData.projects.push({ title: '', technologies: [], description: '', link: '' });
  }

  addSkillItem(categoryIndex: number) {
    this.cvData.skills[categoryIndex].items.push('');
  }

  addSkillCategory() {
    this.cvData.skills.push({ category: '', items: [] });
  }

  addCertification() {
    this.cvData.certifications.push({ name: '', issuer: '', date: '' });
  }

  addAchievement() {
    if (!this.cvData.achievements) {
      this.cvData.achievements = [];
    }
    this.cvData.achievements.push('');
  }

  generatePDF() {
    this.http.post('http://localhost:3000/api/cv/generate', this.cvData, { responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.cvData.contact.fullName.replace(/\s+/g, '_')}_CV.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Puppeteer generation failed:', err);
        }
      });
  }

  saveCV() {
    const user = this.authService.currentUser();
    if (!user || !user.id) {
      this.toastService.error('You must be logged in to save your CV.', 4000);
      return;
    }

    this.authService.saveActiveCv(user.id, this.cvData).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success('Active CV saved to MongoDB successfully!', 4000);
        }
      },
      error: (err) => {
        console.error('Failed to save CV to MongoDB:', err);
        this.toastService.error('Failed to save CV to MongoDB.', 4000);
      }
    });
  }
}
