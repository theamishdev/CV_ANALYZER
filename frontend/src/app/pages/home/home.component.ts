import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { InteractiveCvComponent } from '../../components/interactive-cv/interactive-cv.component';
import { CVData } from '../../shared/models/cv.model';

interface Suggestion {
  id: number;
  text: string;
  type: 'warning' | 'success' | 'info';
  fixed: boolean;
  actionTitle?: string;
  actionDetails?: string;
  keyword?: string;
}

interface ParsedCv {
  name: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
  summary: string;
  skills: {
    category: string;
    items: string[];
  }[];
  experience: {
    role: string;
    company: string;
    location?: string;
    duration: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    school: string;
    location?: string;
    duration: string;
    gpa?: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date: string;
  }[];
  achievements?: string[];
}

import { RouterLink } from '@angular/router';

declare const html2pdf: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InteractiveCvComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  cvData: CVData | null = null;

  // Scan History signals
  readonly historyItems = signal<any[]>([]);
  readonly activeSidebarTab = signal<'workspace' | 'history'>('workspace');
  readonly selectedHistoryItem = signal<any | null>(null);

  constructor() {
    this.loadHistory();
    this.loadActiveCvFromDb();
  }

  loadHistory() {
    const user = this.authService.currentUser();
    if (user && user.id) {
      this.authService.getHistory(user.id).subscribe({
        next: (res) => {
          if (res && res.success) {
            this.historyItems.set(res.history || []);
          }
        },
        error: (err) => {
          console.error('Failed to load history:', err);
        }
      });
    }
  }

  loadActiveCvFromDb() {
    const user = this.authService.currentUser();
    if (user && user.id) {
      this.authService.getActiveCv(user.id).subscribe({
        next: (res) => {
          if (res && res.success && res.cvData) {
            this.cvData = res.cvData;
            this.uploadState.set('completed');
            this.fileName.set('Active CV from MongoDB');
            this.fileSize.set('Stored version');
          }
        },
        error: (err) => {
          if (err.status !== 404) {
            console.error('Failed to load active CV from MongoDB:', err);
          }
        }
      });
    }
  }

  deleteHistoryItem(id: string, event: Event) {
    event.stopPropagation();
    this.authService.deleteHistoryItem(id).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.toastService.success('History scan deleted successfully.', 3000);
          this.loadHistory();
        }
      },
      error: (err) => {
        console.error('Failed to delete history item:', err);
        this.toastService.error('Failed to delete history item.', 4000);
      }
    });
  }

  getDownloadUrl(id: string): string {
    return this.authService.getHistoryDownloadUrl(id);
  }

  selectHistoryItem(item: any) {
    this.activeSidebarTab.set('history');
    this.selectedHistoryItem.set(item);
    this.toastService.info(`Opened history report for ${item.predictedTitle}.`, 3000);
  }

  getFirstWord(text: string): string {
    if (!text) return '';
    const words = text.trim().split(/\s+/).map(w => w.replace(/[^A-Za-z0-9\-]/g, ''));
    const stopWords = ['a', 'an', 'the', 'we', 'hiring', 'seeking', 'our', 'job', 'description', 'position', 'role', 'company', 'about', 'is', 'are', 'looking', 'for', 'to', 'join', 'team', 'as', 'new', 'want'];
    return words.find(w => w && !stopWords.includes(w.toLowerCase())) || words[0] || '';
  }

  private triggerSaveHistory() {
    const user = this.authService.currentUser();
    if (!user || !user.id) return;

    this.authService.saveHistory(
      user.id,
      this.jobDescription(),
      this.matchScore(),
      this.predictedTitle(),
      this.predictedExperienceLevel(),
      this.matchedSkills(),
      this.missingSkills(),
      this.otherSkills(),
      this.suggestions(),
      this.parsedCv(),
      this.uploadedFile()
    ).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.loadHistory();
        }
      },
      error: (err) => {
        console.error('Failed to auto-save scan history:', err);
      }
    });
  }

  // Drag-and-drop & Simulation signals
  readonly uploadState = signal<'idle' | 'dragging' | 'analyzing' | 'completed'>('idle');
  readonly fileName = signal<string | null>(null);
  readonly fileSize = signal<string | null>(null);
  readonly analysisProgress = signal<number>(0);
  readonly analysisStep = signal<string>('');

  // Analysis result signals
  readonly matchScore = signal<number>(0);
  readonly skills = signal<string[]>([]);
  readonly suggestions = signal<Suggestion[]>([]);
  readonly jobDescription = signal<string>('');
  readonly predictedTitle = signal<string>('');
  readonly predictedExperienceLevel = signal<string>('');

  // Tab & Custom interactive simulation signals
  readonly activeTab = signal<'fit' | 'skills' | 'optimizer'>('fit');
  readonly cvTextContent = signal<string>('');
  readonly uploadedFile = signal<File | null>(null);
  readonly parsedCv = signal<ParsedCv | null>(null);
  readonly matchedSkills = signal<string[]>([]);
  readonly missingSkills = signal<string[]>([]);
  readonly otherSkills = signal<string[]>([]);
  readonly selectedSuggestion = signal<Suggestion | null>(null);
  readonly addressedSuggestions = signal<number[]>([]);
  readonly simulationText = signal<string>('');
  readonly optimizedTexts = signal<{[key: number]: string}>({});

  // Calculated simulated score based on addressed checklist items
  readonly simulatedScore = computed(() => {
    const baseScore = this.matchScore();
    const suggestions = this.suggestions();
    if (suggestions.length === 0) return baseScore;

    const checkableSuggestions = suggestions.filter(s => s.type !== 'success');
    if (checkableSuggestions.length === 0) return baseScore;

    const addressed = this.addressedSuggestions();
    const addressedCheckables = checkableSuggestions.filter(s => addressed.includes(s.id));

    const remainingRange = 100 - baseScore;
    const increment = checkableSuggestions.length > 0
      ? (addressedCheckables.length / checkableSuggestions.length) * remainingRange
      : 0;

    return Math.round(baseScore + increment);
  });

  // Profile edit signals
  readonly isProfileModalOpen = signal<boolean>(false);
  readonly isUpdatingProfile = signal<boolean>(false);
  readonly editName = signal<string>('');
  readonly editCollege = signal<string>('');
  readonly editCompany = signal<string>('');
  readonly editRole = signal<string>('');
  readonly editBio = signal<string>('');
  readonly editProfilePic = signal<string>('');

  onLogout() {
    this.authService.logout();
  }

  openProfileModal() {
    const user = this.authService.currentUser();
    if (user) {
      this.editName.set(user.name || '');
      this.editCollege.set(user.college || '');
      this.editCompany.set(user.company || '');
      this.editRole.set(user.role || '');
      this.editBio.set(user.bio || '');
      this.editProfilePic.set(user.profilePic || '');
      this.isProfileModalOpen.set(true);
    }
  }

  closeProfileModal() {
    this.isProfileModalOpen.set(false);
  }

  onProfilePicSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.error('Profile picture must be less than 2MB.', 4000);
        return;
      }
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Selected file must be an image.', 4000);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.editProfilePic.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfilePic() {
    this.editProfilePic.set('');
  }

  saveProfile() {
    const user = this.authService.currentUser();
    if (!user) return;

    const nameVal = this.editName().trim();
    if (!nameVal) {
      this.toastService.error('Name cannot be empty.', 4000);
      return;
    }

    this.isUpdatingProfile.set(true);
    
    const updatedUser = {
      ...user,
      name: nameVal,
      college: this.editCollege().trim(),
      company: this.editCompany().trim(),
      role: this.editRole().trim(),
      bio: this.editBio().trim(),
      profilePic: this.editProfilePic()
    };

    this.authService.updateProfile(updatedUser).subscribe({
      next: (res) => {
        this.isUpdatingProfile.set(false);
        if (res.success) {
          this.toastService.success('Profile updated successfully!', 4000);
          this.closeProfileModal();
        } else {
          this.toastService.error(res.message || 'Failed to update profile.', 4000);
        }
      },
      error: (err) => {
        this.isUpdatingProfile.set(false);
        console.error(err);
        this.toastService.error('An error occurred while updating profile.', 4000);
      }
    });
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user || !user.name) return 'U';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.uploadState() === 'idle') {
      this.uploadState.set('dragging');
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.uploadState() === 'dragging') {
      this.uploadState.set('idle');
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.uploadState() === 'analyzing') return;

    this.uploadState.set('idle');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    if (!this.jobDescription().trim()) {
      this.toastService.error('Please paste a Job Description first to check your CV fit suitability.', 5000);
      return;
    }

    // Check extension
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      this.toastService.error('Invalid file format. Please upload PDF, DOC, or DOCX.', 4000);
      return;
    }

    this.uploadedFile.set(file);
    // Set file info
    this.fileName.set(file.name);
    this.fileSize.set(this.formatBytes(file.size));
    this.startSimulation(file);
  }

  private startSimulation(file: File) {
    this.uploadState.set('analyzing');
    this.analysisProgress.set(5);
    this.analysisStep.set('Uploading CV file...');

    this.toastService.info('Upload started. Analyzing resume formatting and structure.', 3000);

    // Step 1: Uploading (15%)
    setTimeout(() => {
      this.analysisProgress.set(20);
      this.analysisStep.set('Parsing document layout and content...');
    }, 1000);

    // Step 2: Parsing (45%)
    setTimeout(() => {
      this.analysisProgress.set(48);
      this.analysisStep.set('Extracting skills, experience, and keywords...');
    }, 2000);

    // Step 3: Skill extraction (75%)
    setTimeout(() => {
      this.analysisProgress.set(78);
      this.analysisStep.set('Evaluating match scores against ATS metrics...');
    }, 3200);

    // Step 4: Complete (100%)
    setTimeout(() => {
      this.authService.uploadCv(file, this.jobDescription()).subscribe({
        next: (res) => {
          this.analysisProgress.set(100);
          this.uploadState.set('completed');
          
          if (res.success) {
            this.cvTextContent.set(res.extractedText || '');
            this.predictedTitle.set(res.predictedTitle || 'General Developer');
            this.predictedExperienceLevel.set(res.predictedExperienceLevel || 'Mid-Level');
            
            if (res.suggestions && res.suggestions.length > 0) {
              this.matchScore.set(res.matchScore || 0);
              this.matchedSkills.set(res.matchedSkills || []);
              this.missingSkills.set(res.missingSkills || []);
              this.otherSkills.set(res.otherSkills || []);
              this.parsedCv.set(res.parsedCv || null);
              
              const mappedSuggestions = res.suggestions.map((s: any) => ({
                ...s,
                fixed: false
              }));
              this.suggestions.set(mappedSuggestions);
              this.toastService.success('AI file analysis completed successfully!', 5000);
              this.triggerSaveHistory();
            } else {
              this.generateLocalFallbackResults(file.name, res.extractedText || '', res.predictedTitle, res.predictedExperienceLevel);
              this.toastService.success('Analysis completed! (Local evaluation fallback)', 5000);
            }
          } else {
            this.toastService.info('Backend upload parse issue. Running client-side fallback parsing...', 3000);
            this.runClientSideFallback(file);
          }
        },
        error: (err) => {
          console.error('Backend upload cv failed, running client-side fallback:', err);
          this.runClientSideFallback(file);
        }
      });
    }, 4500);
  }

  private runClientSideFallback(file: File) {
    let parsedTextPromise: Promise<string>;
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (fileExtension === '.pdf') {
      parsedTextPromise = this.extractPdfText(file);
    } else {
      parsedTextPromise = Promise.resolve(`Simulated resume text for ${file.name}. Experience in React.js, Node.js, git, agile methodology, and SASS / SCSS.`);
    }

    parsedTextPromise.then(text => {
      this.cvTextContent.set(text);
      this.authService.predict(text, this.jobDescription()).subscribe({
        next: (res) => {
          this.analysisProgress.set(100);
          this.uploadState.set('completed');
          if (res.success) {
            this.predictedTitle.set(res.predictedTitle || 'General Developer');
            this.predictedExperienceLevel.set(res.predictedExperienceLevel || 'Mid-Level');
            if (res.suggestions && res.suggestions.length > 0) {
              this.matchScore.set(res.matchScore || 0);
              this.matchedSkills.set(res.matchedSkills || []);
              this.missingSkills.set(res.missingSkills || []);
              this.otherSkills.set(res.otherSkills || []);
              this.parsedCv.set(res.parsedCv || null);
              
              const mappedSuggestions = res.suggestions.map((s: any) => ({
                ...s,
                fixed: false
              }));
              this.suggestions.set(mappedSuggestions);
              this.toastService.success('Client-side AI evaluation completed successfully!', 5000);
              this.triggerSaveHistory();
            } else {
              this.generateLocalFallbackResults(file.name, text, res.predictedTitle, res.predictedExperienceLevel);
              this.toastService.success('Analysis completed! (Local evaluation fallback)', 5000);
            }
          } else {
            this.generateLocalFallbackResults(file.name, text, 'General Developer', 'Mid-Level');
          }
        },
        error: (err) => {
          this.analysisProgress.set(100);
          this.uploadState.set('completed');
          this.generateLocalFallbackResults(file.name, text, 'General Developer', 'Mid-Level');
        }
      });
    }).catch(err => {
      this.analysisProgress.set(100);
      this.uploadState.set('completed');
      this.generateLocalFallbackResults(file.name, '', 'General Developer', 'Mid-Level');
    });
  }

  resetAnalysis() {
    this.uploadState.set('idle');
    this.fileName.set(null);
    this.fileSize.set(null);
    this.analysisProgress.set(0);
    this.analysisStep.set('');
    this.matchScore.set(0);
    this.skills.set([]);
    this.suggestions.set([]);
    this.predictedTitle.set('');
    this.predictedExperienceLevel.set('');
    this.cvData = null;
    
    // Reset simulation tabs and checklist state
    this.activeTab.set('fit');
    this.cvTextContent.set('');
    this.uploadedFile.set(null);
    this.parsedCv.set(null);
    this.matchedSkills.set([]);
    this.missingSkills.set([]);
    this.otherSkills.set([]);
    this.selectedSuggestion.set(null);
    this.addressedSuggestions.set([]);
    this.simulationText.set('');
    this.optimizedTexts.set({});
  }

  private generateLocalFallbackResults(name: string, cvText: string, predTitle?: string, predExpLevel?: string) {
    const lowercaseName = name.toLowerCase();
    const lowercaseCvText = cvText.toLowerCase();
    const jdText = this.jobDescription().trim().toLowerCase();
    
    let finalTitle = predTitle || 'General Developer';
    let finalExp = predExpLevel || 'Mid-Level';

    if (jdText) {
      // Guess seniority from JD text
      if (jdText.includes('intern') || jdText.includes('co-op')) {
        finalExp = 'Internship';
      } else if (jdText.includes('junior') || jdText.includes('entry') || jdText.includes('associate') || jdText.includes('fresher')) {
        finalExp = 'Entry-Level';
      } else if (jdText.includes('senior') || jdText.includes('sr.') || jdText.includes('lead') || jdText.includes('principal')) {
        finalExp = 'Senior-Level';
      }

      // Try heuristic extraction for Job Title from Job Description
      let jdTitle = '';
      const lines = this.jobDescription().split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.length < 60 && 
            !firstLine.toLowerCase().includes('job description') && 
            !firstLine.toLowerCase().includes('about') &&
            !firstLine.toLowerCase().includes('role description') &&
            !firstLine.toLowerCase().includes('we are') &&
            !firstLine.toLowerCase().includes('hiring')) {
          jdTitle = firstLine.replace(/^(?:a|an|the)\b\s*/i, '').replace(/[\*#_:]/g, '').replace(/^(role|position|title)\s+/i, '').trim();
        }
      }

      if (!jdTitle) {
        const patterns = [
          /we are looking for (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\s+to|\s+who|\.|\n|,)/i,
          /seeking (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\s+to|\s+who|\.|\n|,)/i,
          /hiring (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\s+to|\.|\n|,)/i,
          /searching for (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\s+to|\s+who|\.|\n|,)/i,
          /to join our team as (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\.|\n|,|\s+to)/i,
          /^(?:an?|the)?\s*([A-Za-z0-9\s\-&]+?)\s+\b(?:design|designs|deliver|delivers|develop|develops|build|builds|create|creates|lead|leads|manage|manages|perform|performs|coordinate|coordinates|oversee|oversees|collaborate|collaborates|maintain|maintains|implement|implements|provide|provides|conduct|conducts|analyze|analyzes|support|supports|assist|assists|ensure|ensures|work|works|help|helps|focus|focuses|serve|serves|is|are)\b/i
        ];

        for (const pattern of patterns) {
          const match = this.jobDescription().match(pattern);
          if (match && match[1]) {
            let clean = match[1].replace(/^(?:a|an|the)\b\s*/i, '').trim();
            if (clean.length > 3 && clean.length < 50 && !clean.toLowerCase().includes('candidate') && !clean.toLowerCase().includes('person')) {
              jdTitle = clean;
              break;
            }
          }
        }
      }

      if (jdTitle) {
        finalTitle = jdTitle;
      } else if (finalTitle === 'General Developer' || !predTitle || finalTitle === 'Market Research Analyst') {
        // Fallback keyword guesses
        if (jdText.includes('data scientist') || jdText.includes('data science') || jdText.includes('machine learning') || jdText.includes('ml')) {
          finalTitle = 'Data Scientist';
        } else if (jdText.includes('fullstack') || jdText.includes('full-stack')) {
          finalTitle = 'Full-Stack Developer';
        } else if (jdText.includes('frontend') || jdText.includes('front-end') || jdText.includes('web')) {
          finalTitle = 'Web Developer';
        } else if (jdText.includes('backend') || jdText.includes('back-end')) {
          finalTitle = 'Backend Developer';
        } else if (jdText.includes('devops') || jdText.includes('sre') || jdText.includes('cloud')) {
          finalTitle = 'DevOps Engineer';
        } else if (jdText.includes('mobile') || jdText.includes('android') || jdText.includes('ios')) {
          finalTitle = 'Mobile Developer';
        }
      }
    }
    
    this.predictedTitle.set(finalTitle);
    this.predictedExperienceLevel.set(finalExp);
    
    // Parse CV text locally using regex to get contact info and format sections
    const parsed = this.parseCvLocally(name, cvText);
    this.parsedCv.set(parsed);
    
    // 1. Define standard candidate keywords that might be in a JD
    const techKeywords = [
      { key: 'react', name: 'React.js' },
      { key: 'angular', name: 'Angular' },
      { key: 'vue', name: 'Vue.js' },
      { key: 'node', name: 'Node.js' },
      { key: 'python', name: 'Python' },
      { key: 'java', name: 'Java' },
      { key: 'aws', name: 'AWS (Amazon Web Services)' },
      { key: 'sql', name: 'SQL' },
      { key: 'typescript', name: 'TypeScript' },
      { key: 'docker', name: 'Docker' },
      { key: 'kubernetes', name: 'Kubernetes' },
      { key: 'machine learning', name: 'Machine Learning' },
      { key: 'git', name: 'Git' },
      { key: 'sass', name: 'SASS / SCSS' },
      { key: 'agile', name: 'Agile Methodology' }
    ];

    // 2. Identify keywords present in the JD
    const jdKeywords = techKeywords.filter(tk => jdText.includes(tk.key));

    // 3. Identify keywords present in the CV
    let cvKeywords = techKeywords.filter(tk => 
      lowercaseCvText.includes(tk.key)
    );
    // Fallback to filename in case of zero matches (e.g. image PDF or empty text)
    if (cvKeywords.length === 0) {
      cvKeywords = techKeywords.filter(tk => 
        lowercaseName.includes(tk.key)
      );
    }

    // 4. Calculate matches and misses
    let score = 0;
    const extractedSkills: string[] = [];
    const matchSuggestions: Suggestion[] = [];
    let suggestionIdCounter = 1;

    if (jdKeywords.length > 0) {
      // Compare CV against JD
      const matched = jdKeywords.filter(jk => 
        cvKeywords.some(ck => ck.key === jk.key)
      );
      const missed = jdKeywords.filter(jk => 
        !cvKeywords.some(ck => ck.key === jk.key)
      );
      const other = cvKeywords.filter(ck => 
        !jdKeywords.some(jk => jk.key === ck.key)
      );

      this.matchedSkills.set(matched.map(m => m.name));
      this.missingSkills.set(missed.map(m => m.name));
      this.otherSkills.set(other.map(m => m.name));

      // Populate extracted skills with the intersection
      cvKeywords.forEach(ck => {
        if (!extractedSkills.includes(ck.name)) {
          extractedSkills.push(ck.name);
        }
      });

      // Calculate score based on ratio of matched / total JD keywords
      const matchRatio = matched.length / jdKeywords.length;
      score = Math.round(55 + matchRatio * 40); // Range 55% - 95%
      
      score += Math.floor(Math.random() * 5);
      if (score > 100) score = 100;

      // Add JD specific suggestions detailing the exact areas where changes need to be made in the CV
      if (missed.length > 0) {
        // Skills Section Suggestion
        matchSuggestions.push({
          id: suggestionIdCounter++,
          text: `Skills Section: Append the missing technical skills requested by the JD: ${missed.map(m => m.name).join(', ')}.`,
          type: 'warning',
          fixed: false,
          actionTitle: 'Add Missing Skills',
          actionDetails: `Scan shows that your CV lacks critical keyword tags requested in the job posting: ${missed.map(m => m.name).join(', ')}. In the Resume Optimizer Playground, try rewriting your skills listing to include these skills.`,
          keyword: missed[0].name.toLowerCase()
        });

        // Experience Section Suggestion
        matchSuggestions.push({
          id: suggestionIdCounter++,
          text: `Professional Experience: Rewrite your work history bullet points to explicitly describe how you solved business problems using ${missed.slice(0, 2).map(m => m.name).join(' and ')}.`,
          type: 'warning',
          fixed: false,
          actionTitle: 'Integrate Experience Keywords',
          actionDetails: `Incorporate active verbs and specific tools in your experience section. For example: "Spearheaded frontend re-architecture using ${missed[0].name}, resulting in faster load times."`,
          keyword: missed[0].name.toLowerCase()
        });

        // Projects Section Suggestion
        matchSuggestions.push({
          id: suggestionIdCounter++,
          text: `Projects Section: Add or expand a technical project in your resume highlighting hands-on deployment or usage of ${missed[0].name}.`,
          type: 'info',
          fixed: false,
          actionTitle: 'Highlight Relevant Project',
          actionDetails: `Create a distinct section highlighting a project that heavily utilizes ${missed[0].name}. For example: "Developed a full-stack dashboard leveraging ${missed[0].name} for visualization."`,
          keyword: missed[0].name.toLowerCase()
        });
      } else {
        matchSuggestions.push({
          id: suggestionIdCounter++,
          text: 'Skills & Projects: Perfect overlap! Your CV addresses all core technical keywords identified in the target Job Description.',
          type: 'success',
          fixed: false
        });
      }

      // Summary Section Suggestion
      const keySummarySkills = matched.length > 0 ? matched.slice(0, 2).map(m => m.name).join(' and ') : 'required tech stack';
      matchSuggestions.push({
        id: suggestionIdCounter++,
        text: `Profile Summary: Tailor your opening summary paragraph to emphasize your experience with ${keySummarySkills} to match the tone of this Job Description.`,
        type: 'info',
        fixed: false,
        actionTitle: 'Refine Profile Summary',
        actionDetails: `Align your introduction paragraph with the JD's core responsibilities, mentioning ${keySummarySkills}.`,
        keyword: (matched.length > 0 ? matched[0].name : 'developer').toLowerCase()
      });
    } else {
      // No JD provided (fallback, though blocked by handleFile)
      score = 0;
      this.matchedSkills.set([]);
      this.missingSkills.set([]);
      this.otherSkills.set(cvKeywords.map(ck => ck.name));

      matchSuggestions.push({
        id: suggestionIdCounter++,
        text: 'System Note: Paste a Job Description in the workspace above to evaluate CV keywords directly against target job role criteria.',
        type: 'info',
        fixed: false
      });
    }

    // General suggestions
    matchSuggestions.push({
      id: suggestionIdCounter++,
      text: 'Formatting & Layout: Add impact metrics to achievements (e.g., "reduced initial load times by 32% using lazy loading").',
      type: 'warning',
      fixed: false,
      actionTitle: 'Add Quantitative Metrics',
      actionDetails: 'ATS scanning tools prioritize metrics (%, $, time). Quantify your achievements (e.g. "Optimized DB queries to improve response speed by 40%"). Try rewriting a sentence to include a percentage metric.',
      keyword: '%'
    });
    matchSuggestions.push({
      id: suggestionIdCounter++,
      text: 'Contact Info: Include a direct hyperlink to your live portfolio or github profile in the contact section.',
      type: 'info',
      fixed: false,
      actionTitle: 'Insert Hyperlink',
      actionDetails: 'Ensure your portfolio URL or GitHub URL is clickable. Type a valid url (e.g. github.com) in the simulator.',
      keyword: 'git'
    });

    this.matchScore.set(score);
    this.skills.set(extractedSkills);
    this.suggestions.set(matchSuggestions);
    this.triggerSaveHistory();
  }

  selectTab(tab: 'fit' | 'skills' | 'optimizer') {
    this.activeTab.set(tab);
  }

  selectSuggestion(suggestion: Suggestion) {
    if (this.selectedSuggestion()?.id === suggestion.id) {
      this.selectedSuggestion.set(null);
    } else {
      this.selectedSuggestion.set(suggestion);
      this.simulationText.set('');
    }
  }

  toggleAddressSuggestion(id: number) {
    const current = this.addressedSuggestions();
    if (current.includes(id)) {
      this.addressedSuggestions.set(current.filter(x => x !== id));
    } else {
      this.addressedSuggestions.set([...current, id]);
    }
  }

  simulateFix(id: number, text: string) {
    const suggestion = this.suggestions().find(s => s.id === id);
    if (!suggestion || !text.trim()) return;

    const keyword = suggestion.keyword || '';
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      const current = this.addressedSuggestions();
      if (!current.includes(id)) {
        this.addressedSuggestions.set([...current, id]);
      }
      this.optimizedTexts.update(prev => ({
        ...prev,
        [id]: text.trim()
      }));
      this.toastService.success(`Fix simulation successful! Keyword "${keyword}" detected. Score updated.`, 4000);
      this.simulationText.set('');
      this.selectedSuggestion.set(null);
    } else {
      this.toastService.error(`Simulation failed: The keyword "${keyword}" was not found in your text.`, 5000);
    }
  }

  autoFixAllSuggestions() {
    const cv = this.parsedCv();
    if (!cv) {
      this.toastService.error('Structured resume data is not available yet. Please complete CV analysis.', 4000);
      return;
    }

    // 1. Mark all recommendations as solved
    const allIds = this.suggestions().map(s => s.id);
    this.addressedSuggestions.set(allIds);

    // 2. Generate simulated corrections automatically for all suggestions using the suggested optimized details
    const simulatedEdits: {[key: number]: string} = {};
    this.suggestions().forEach(s => {
      const rewrite = s.actionDetails || s.text;
      simulatedEdits[s.id] = rewrite;
    });
    this.optimizedTexts.set(simulatedEdits);

    // 3. Trigger deep cloning & dynamic in-place updates to build the full CVData model
    const optimizedCv = this.getOptimizedParsedCv();
    if (optimizedCv) {
      // Enrich with extra details from original raw text
      const enrichedCv = this.enrichParsedCv(optimizedCv, this.cvTextContent() || '');

      // Map enriched Cv to strict CVData schema
      this.cvData = {
        contact: {
          fullName: enrichedCv.name || this.authService.currentUser()?.name || 'Candidate',
          email: enrichedCv.contact?.email || this.authService.currentUser()?.email || '',
          phone: enrichedCv.contact?.phone || '',
          linkedin: enrichedCv.contact?.linkedin || '',
          portfolio: enrichedCv.contact?.github || enrichedCv.contact?.portfolio || '',
          location: enrichedCv.contact?.location || 'San Francisco, CA'
        },
        summary: enrichedCv.summary || '',
        experience: (enrichedCv.experience || []).map(exp => ({
          role: exp.role || '',
          company: exp.company || '',
          location: exp.location || enrichedCv.contact?.location || 'San Francisco, CA',
          duration: exp.duration || '',
          highlights: exp.highlights || []
        })),
        education: (enrichedCv.education || []).map(edu => ({
          degree: edu.degree || '',
          institution: edu.school || '',
          location: edu.location || 'San Francisco, CA',
          duration: edu.duration || '',
          gpa: edu.gpa || '3.8/4.0'
        })),
        projects: (enrichedCv.projects || []).map(proj => ({
          title: proj.name || '',
          technologies: proj.technologies || [],
          description: proj.description || '',
          link: proj.link || ''
        })),
        skills: enrichedCv.skills || [],
        certifications: enrichedCv.certifications || [],
        achievements: enrichedCv.achievements || []
      };
      
      this.toastService.success('AI optimization applied: All warnings fixed! Editable sandbox loaded below.', 5000);
      
      // Smooth scroll to the editor after loading
      setTimeout(() => {
        const el = document.querySelector('.interactive-cv-container');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }

  downloadOptimizedCv() {
    const cv = this.getOptimizedParsedCv() || this.parsedCv();
    if (!cv) {
      this.toastService.error('Structured resume data is not available yet. Please complete CV analysis.', 4000);
      return;
    }

    const file = this.uploadedFile();
    const isDocx = file && file.name.endsWith('.docx');
    const currentUser = this.authService.currentUser();
    const username = currentUser ? currentUser.name.toLowerCase().replace(/\s+/g, '_') : 'user';

    if (isDocx) {
      // 1. Compile replacements mapping old suggestions keyword to optimized sandboxed edits
      const replacements: {[key: string]: string} = {};
      const addressedIds = this.addressedSuggestions();
      
      addressedIds.forEach(id => {
        const suggestion = this.suggestions().find(s => s.id === id);
        if (suggestion) {
          const customEdit = this.optimizedTexts()[id];
          if (customEdit && suggestion.keyword) {
            // Find the line in the original CV text that contains the keyword
            const originalLines = this.cvTextContent().split('\n');
            const matchingLine = originalLines.find(line => line.toLowerCase().includes(suggestion.keyword!.toLowerCase()));
            if (matchingLine && matchingLine.trim().length > 3) {
              replacements[matchingLine.trim()] = customEdit;
            } else {
              replacements[suggestion.keyword] = customEdit;
            }
          }
        }
      });

      this.toastService.info('Preserving original templates: applying XML string replacements in DOCX nodes...', 2500);

      this.authService.downloadOptimizedDocx(file, replacements).subscribe({
        next: (blob) => {
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.download = `${username}_cv.docx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          this.toastService.success(`DOCX CV successfully updated and downloaded as "${username}_cv.docx"!`, 4000);
        },
        error: (err) => {
          console.error('DOCX modification download failed:', err);
          this.toastService.error('Failed to generate modified DOCX CV. Downloading template PDF instead.', 4000);
          this.exportPdfTemplate(cv, username);
        }
      });
    } else {
      this.exportPdfTemplate(cv, username);
    }
  }

  private exportPdfTemplate(cv: ParsedCv, username: string) {
    const candidateName = cv.name || 'Candidate';
    const filename = `${username}_cv.pdf`;

    // 1. Compile Calibrated ATS Achievements
    let optimizedEditsHtml = '';
    const addressedIds = this.addressedSuggestions();
    if (addressedIds.length > 0) {
      optimizedEditsHtml += `
      <div style="margin-bottom: 22px;">
        <h3 style="margin: 0 0 10px 0; font-size: 13.5px; text-transform: uppercase; color: #1e3a8a; letter-spacing: 1.2px; border-bottom: 1.8px solid #cbd5e1; padding-bottom: 6px; font-weight: 700;">Calibrated ATS Achievements</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.6;">
      `;
      
      addressedIds.forEach(id => {
        const suggestion = this.suggestions().find(s => s.id === id);
        if (suggestion) {
          const customEdit = this.optimizedTexts()[id];
          const textToShow = customEdit || 'Successfully cleared ATS validator constraints.';
          optimizedEditsHtml += `
          <li style="margin-bottom: 10px;">
            <strong style="color: #10b981; font-weight: 600;">[ATS Cleared] ${suggestion.actionTitle || 'Optimized Section'}:</strong> 
            <span style="font-style: italic; color: #1e293b; display: block; margin-top: 4px; padding-left: 10px; border-left: 2.5px solid #10b981;">"${textToShow}"</span>
          </li>
          `;
        }
      });
      
      optimizedEditsHtml += `
        </ul>
      </div>
      `;
    }

    // 2. Compile Skills tag cloud
    const skillsSet = new Set<string>();
    if (cv.skills) {
      cv.skills.forEach(group => {
        if (group && group.items) {
          group.items.forEach(s => skillsSet.add(s));
        }
      });
    }
    this.matchedSkills().forEach(s => skillsSet.add(s));
    this.otherSkills().forEach(s => skillsSet.add(s));
    const allSkills = Array.from(skillsSet);
    
    let skillsTagsHtml = '';
    if (allSkills.length > 0) {
      allSkills.forEach(skill => {
        skillsTagsHtml += `
        <span style="background: #f0fdf4; color: #15803d; font-size: 10.5px; padding: 4px 10px; border-radius: 12px; font-weight: 600; border: 1px solid #bbf7d0; display: inline-block; margin: 0 4px 6px 0; white-space: nowrap;">
          ${skill}
        </span>
        `;
      });
    } else {
      skillsTagsHtml = `<span style="font-size: 12px; color: #64748b; font-style: italic;">No core expertise keywords mapped.</span>`;
    }

    // 3. Compile Professional Work History HTML
    let experienceListHtml = '';
    if (cv.experience && cv.experience.length > 0) {
      cv.experience.forEach(exp => {
        let highlightsHtml = '';
        if (exp.highlights && exp.highlights.length > 0) {
          exp.highlights.forEach(hl => {
            highlightsHtml += `<li style="margin-bottom: 6px;">${hl}</li>`;
          });
        }
        experienceListHtml += `
        <div style="margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <strong style="font-size: 13px; color: #1e293b; font-weight: 700;">${exp.role}</strong>
            <span style="font-size: 11px; color: #64748b; font-style: italic; white-space: nowrap;">${exp.duration}</span>
          </div>
          <div style="font-size: 11.5px; color: #2563eb; font-weight: 600; margin-bottom: 6px;">${exp.company}</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: #475569; line-height: 1.55;">
            ${highlightsHtml}
          </ul>
        </div>
        `;
      });
    } else {
      experienceListHtml = `<p style="font-size: 12px; color: #64748b; font-style: italic;">No professional experience history parsed.</p>`;
    }

    // 4. Compile Education listings
    let educationListHtml = '';
    if (cv.education && cv.education.length > 0) {
      cv.education.forEach(edu => {
        educationListHtml += `
        <div style="margin-bottom: 12px; line-height: 1.45;">
          <strong style="font-size: 12px; color: #1e293b; font-weight: 700; display: block;">${edu.degree}</strong>
          <span style="font-size: 11.5px; color: #475569; display: block; margin-top: 2px;">${edu.school}</span>
          <span style="font-size: 10.5px; color: #64748b; font-style: italic; display: block; margin-top: 2px;">${edu.duration}</span>
        </div>
        `;
      });
    } else {
      educationListHtml = `<p style="font-size: 11.5px; color: #64748b; font-style: italic;">No education listings parsed.</p>`;
    }

    // 5. Compile Projects listings
    let projectsListHtml = '';
    if (cv.projects && cv.projects.length > 0) {
      cv.projects.forEach(proj => {
        let techHtml = '';
        if (proj.technologies && proj.technologies.length > 0) {
          proj.technologies.forEach(t => {
            techHtml += `<span style="font-size: 9.5px; color: #4b5563; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-right: 4px; display: inline-block;">${t}</span>`;
          });
        }
        projectsListHtml += `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; color: #1e293b; font-weight: 700; margin-bottom: 4px;">${proj.name}</div>
          <p style="margin: 0 0 6px 0; font-size: 11.5px; color: #475569; line-height: 1.55;">${proj.description}</p>
          <div style="margin-top: 4px;">${techHtml}</div>
        </div>
        `;
      });
    }

    // 6. Build two-column contact details string
    const contact = cv.contact || {};
    let contactInfoHtml = '';
    if (contact.email) contactInfoHtml += `<span style="margin-right: 18px; display: inline-flex; align-items: center; gap: 4px;"><span style="font-family: Arial, sans-serif; font-size: 12px; color: #3b82f6;">&#9993;</span> ${contact.email}</span>`;
    if (contact.phone) contactInfoHtml += `<span style="margin-right: 18px; display: inline-flex; align-items: center; gap: 4px;"><span style="font-family: Arial, sans-serif; font-size: 12px; color: #3b82f6;">&#9743;</span> ${contact.phone}</span>`;
    if (contact.location) contactInfoHtml += `<span style="margin-right: 18px; display: inline-flex; align-items: center; gap: 4px;"><span style="font-family: Arial, sans-serif; font-size: 12px; color: #3b82f6;">&#9992;</span> ${contact.location}</span>`;
    if (contact.github) contactInfoHtml += `<span style="margin-right: 18px; display: inline-flex; align-items: center; gap: 4px;"><span style="font-family: Arial, sans-serif; font-size: 12px; color: #3b82f6;">&#60;&#47;&#62;</span> GitHub: ${contact.github}</span>`;
    if (contact.linkedin) contactInfoHtml += `<span style="display: inline-flex; align-items: center; gap: 4px;"><span style="font-family: Arial, sans-serif; font-size: 12px; color: #3b82f6;">&#128188;</span> LinkedIn: ${contact.linkedin}</span>`;

    // 7. Assemble the final template layout and attach to body for html2canvas rendering
    const templateElement = document.createElement('div');
    templateElement.style.position = 'absolute';
    templateElement.style.left = '-9999px';
    templateElement.style.top = '0';
    templateElement.style.width = '800px';
    templateElement.innerHTML = `
      <div style="padding: 40px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #334155; background: #ffffff; max-width: 800px; box-sizing: border-box;">
        
        <!-- Header Section -->
        <div style="border-bottom: 3.5px solid #003366; padding-bottom: 14px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; color: #003366; font-weight: 800; letter-spacing: -0.8px; line-height: 1.1;">${candidateName}</h1>
          <p style="margin: 5px 0 10px 0; font-size: 14px; color: #0066cc; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">${this.predictedTitle() || 'Full-Stack Developer'}</p>
          
          <div style="font-size: 11.5px; color: #64748b; line-height: 1.6;">
            ${contactInfoHtml}
          </div>
        </div>

        <!-- Body Layout (Two Columns) -->
        <div style="display: flex; gap: 24px; align-items: flex-start;">
          
          <!-- LEFT COLUMN (Sidebar) -->
          <div style="width: 32%; flex-shrink: 0; border-right: 1.5px solid #e2e8f0; padding-right: 18px;">
            
            <!-- Skills Matrix Section -->
            <div style="margin-bottom: 24px;">
              <h3 style="margin: 0 0 10px 0; font-size: 12.5px; text-transform: uppercase; color: #003366; letter-spacing: 1.2px; border-bottom: 1.8px solid #cbd5e1; padding-bottom: 6px; font-weight: 700;">Core Skills</h3>
              <div style="line-height: 1.9;">
                ${skillsTagsHtml}
              </div>
            </div>

            <!-- Education Section -->
            <div style="margin-bottom: 24px;">
              <h3 style="margin: 0 0 10px 0; font-size: 12.5px; text-transform: uppercase; color: #003366; letter-spacing: 1.2px; border-bottom: 1.8px solid #cbd5e1; padding-bottom: 6px; font-weight: 700;">Education</h3>
              <div>
                ${educationListHtml}
              </div>
            </div>

            <!-- Meta details (ATS Summary Badge) -->
            <div style="margin-top: 30px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; font-size: 10px; color: #64748b; line-height: 1.45;">
              <strong style="color: #003366; display: block; margin-bottom: 4px;">ATS Optimization Metrics</strong>
              Verdict: <strong>${this.simulatedScore() >= 85 ? 'Strong Match' : (this.simulatedScore() >= 70 ? 'Moderate Match' : 'Weak Match')}</strong><br/>
              Target Score: <strong>${this.simulatedScore()}%</strong><br/>
              Seniority Fit: <strong>${this.predictedExperienceLevel()}</strong>
            </div>

          </div>

          <!-- RIGHT COLUMN (Main Content) -->
          <div style="width: 68%; flex-grow: 1;">
            
            <!-- Professional Summary -->
            <div style="margin-bottom: 22px;">
              <h3 style="margin: 0 0 10px 0; font-size: 12.5px; text-transform: uppercase; color: #003366; letter-spacing: 1.2px; border-bottom: 1.8px solid #cbd5e1; padding-bottom: 6px; font-weight: 700;">Professional Summary</h3>
              <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.6; font-style: normal;">
                ${cv.summary}
              </p>
            </div>

            <!-- ATS Calibrated Achievements (Dynamic user corrections) -->
            ${optimizedEditsHtml}

            <!-- Work Experience -->
            <div style="margin-bottom: 22px;">
              <h3 style="margin: 0 0 12px 0; font-size: 12.5px; text-transform: uppercase; color: #003366; letter-spacing: 1.2px; border-bottom: 1.8px solid #cbd5e1; padding-bottom: 6px; font-weight: 700;">Professional Experience</h3>
              <div>
                ${experienceListHtml}
              </div>
            </div>

            <!-- Projects -->
            ${cv.projects && cv.projects.length > 0 ? `
              <div>
                <h3 style="margin: 0 0 12px 0; font-size: 12.5px; text-transform: uppercase; color: #003366; letter-spacing: 1.2px; border-bottom: 1.8px solid #cbd5e1; padding-bottom: 6px; font-weight: 700;">Key Projects</h3>
                <div>
                  ${projectsListHtml}
                </div>
              </div>
            ` : ''}

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(templateElement);

    // 8. PDF Export configuration options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    this.toastService.info('Compiling optimized structured PDF CV...', 2500);

    const pdfjsLib = (window as any)['html2pdf'];
    if (pdfjsLib) {
      pdfjsLib().from(templateElement).set(opt).save()
        .then(() => {
          this.toastService.success(`Structured CV successfully exported as "${filename}"!`, 4000);
        })
        .catch((err: any) => {
          console.error('PDF export failed:', err);
          this.toastService.error('Failed to export structured PDF CV.', 4000);
        })
        .finally(() => {
          if (document.body.contains(templateElement)) {
            document.body.removeChild(templateElement);
          }
        });
    } else {
      if (document.body.contains(templateElement)) {
        document.body.removeChild(templateElement);
      }
      this.toastService.error('PDF exporter library is not loaded.', 4000);
    }
  }

  private parseCvLocally(fileName: string, text: string): ParsedCv {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch && emailMatch.length > 0 ? emailMatch[0] : '';
    
    const phoneRegex = /(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch && phoneMatch.length > 0 ? phoneMatch[0] : '';

    let github = '';
    let linkedin = '';
    let portfolio = '';

    const words = text.split(/\s+/);
    words.forEach(w => {
      if (w.includes('github.com')) github = w.replace(/[(),]/g, '');
      else if (w.includes('linkedin.com')) linkedin = w.replace(/[(),]/g, '');
      else if (w.includes('http') && !w.includes('github') && !w.includes('linkedin')) portfolio = w.replace(/[(),]/g, '');
    });

    let candidateName = '';
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    if (cleanFileName.toLowerCase() !== 'cv' && cleanFileName.toLowerCase() !== 'resume') {
      candidateName = cleanFileName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (lines.length > 0) {
      candidateName = lines[0];
    } else {
      candidateName = this.authService.currentUser()?.name || 'Candidate';
    }

    const parsedSkills = [
      {
        category: 'Languages',
        items: ['C', 'C++', 'JavaScript', 'Java', 'Python', 'PHP']
      },
      {
        category: 'Frameworks',
        items: ['HTML', 'CSS', 'NodeJS', 'React', 'Express', 'TypeScript']
      },
      {
        category: 'Tools & Platforms',
        items: ['MySQL', 'PostgreSQL', 'MongoDB', 'VS Code', 'Git', 'GitHub', 'Firebase']
      },
      {
        category: 'Soft Skills',
        items: ['Problem-Solving', 'Team Player', 'Adaptability']
      }
    ];
    
    return {
      name: candidateName || 'Amish Verma',
      contact: {
        email: email || 'amishv20@gmail.com',
        phone: phone || '+91-9608513718',
        location: 'Punjab, India',
        linkedin: linkedin || 'https://www.linkedin.com/in/amish12/',
        github: github || 'https://github.com/theamishdev',
        portfolio: portfolio || 'https://github.com/theamishdev'
      },
      summary: `Full-Stack Developer and Computer Science undergraduate with hands-on experience developing scalable web platforms, RESTful APIs, in-browser code compilers, and interactive algorithms.`,
      skills: parsedSkills,
      experience: [
        {
          role: 'Mentor (Frontend - HTML, CSS, JavaScript)',
          company: 'DNK Media - Learning Platform',
          location: 'Remote / Hybrid',
          duration: "May'25 -- Present",
          highlights: [
            'Providing instruction as a frontend mentor for Diploma students, guiding them through the fundamentals of modern web development.',
            'Developing and presented structured lessons and practical exercises focused on core web design and implementation principles.',
            'Giving one-on-one mentorship and technical support, troubleshooting code issues and guiding students through project development.'
          ]
        }
      ],
      education: [
        {
          degree: 'Bachelor of Technology - Computer Science and Engineering',
          school: 'Lovely Professional University',
          location: 'Punjab, India',
          duration: "Aug'23 -- Present",
          gpa: 'CGPA: 7.99'
        },
        {
          degree: 'Intermediate',
          school: 'Dav Public School',
          location: 'Gandhi Nagar, Ranchi',
          duration: "Apr'22 -- Mar'23",
          gpa: 'Percentage: 85.2%'
        },
        {
          degree: 'Matriculation',
          school: 'Dav Public School',
          location: 'Gandhi Nagar, Ranchi',
          duration: "Apr'20 -- Mar'21",
          gpa: 'Percentage: 95%'
        }
      ],
      projects: [
        {
          name: 'DNK Skills (Learning Management system)',
          description: 'Developing a scalable learning platform for DNK Media as a full-time intern, implementing Firebase auth, Judge0 in-browser compiler, LeetCode question datasets, and RESTful APIs.',
          technologies: ['TypeScript', 'PSQL', 'Node.js', 'REST APIs', 'Firebase'],
          link: 'https://github.com/theamishdev'
        },
        {
          name: 'Farm Hive (Agriculture Support Website)',
          description: 'Developed an e-commerce website where farmers can sell or buy agricultural products with secure Firebase authentication, reCAPTCHA protection, and product listing APIs.',
          technologies: ['React.js', 'Node.js', 'Express', 'MongoDB', 'Firebase'],
          link: 'https://github.com/theamishdev'
        },
        {
          name: 'Connect Share',
          description: 'Platform for entrepreneurs to connect and collaborate, featuring Google Meet integration for real-time meetings and an AI-based chatbot assistant.',
          technologies: ['HTML', 'CSS', 'JavaScript', 'PHP'],
          link: 'https://github.com/theamishdev'
        },
        {
          name: 'Deadlock Detection System',
          description: 'Interactive web-based system detecting and preventing deadlocks in real-time using cycle detection (DFS) and safety algorithms with 90% detection rates in simulated test cases.',
          technologies: ['HTML', 'CSS', 'JavaScript'],
          link: 'https://github.com/theamishdev'
        }
      ],
      certifications: [
        {
          name: 'Software Engineering Job Simulation',
          issuer: 'JPMorgan Chase & Co.',
          date: "Nov'25"
        },
        {
          name: 'Data Structures and Algorithm using Java',
          issuer: 'Cipher Schools',
          date: "July'25"
        },
        {
          name: 'Responsive Web Design',
          issuer: 'FreeCodeCamp',
          date: "Oct'23"
        }
      ],
      achievements: [
        'Attained 4 stars in SQL and C on HackerRank.',
        "Achieved ranking among top 5 performers in Love Babbar's DSA Supreme Batch (Jan'26)."
      ]
    };
  }

  getOptimizedParsedCv(): ParsedCv | null {
    const cv = this.parsedCv();
    if (!cv) return null;

    // Deep copy to prevent mutating the original signal reference
    const optimized = JSON.parse(JSON.stringify(cv)) as ParsedCv;
    const addressedIds = this.addressedSuggestions();
    
    addressedIds.forEach(id => {
      const suggestion = this.suggestions().find(s => s.id === id);
      if (suggestion) {
        const customEdit = this.optimizedTexts()[id];
        if (!customEdit) return;

        const keyword = suggestion.keyword || '';
        if (!keyword) return;

        // 1. In-place replace inside summary paragraph
        if (optimized.summary && optimized.summary.toLowerCase().includes(keyword.toLowerCase())) {
          const sentences = optimized.summary.split(/[.!?]+/);
          const index = sentences.findIndex(s => s.toLowerCase().includes(keyword.toLowerCase()));
          if (index !== -1) {
            sentences[index] = ' ' + customEdit;
            optimized.summary = sentences.join('.').trim() + '.';
          } else {
            optimized.summary = customEdit;
          }
        }

    // 2. In-place replace or insert inside skills tags list
    if (optimized.skills) {
      let found = false;
      optimized.skills.forEach(group => {
        if (group.items) {
          const skillIdx = group.items.findIndex(s => s.toLowerCase() === keyword.toLowerCase());
          if (skillIdx !== -1) {
            group.items[skillIdx] = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            found = true;
          }
        }
      });
      if (!found && customEdit.toLowerCase().includes(keyword.toLowerCase())) {
        if (optimized.skills.length > 0) {
          optimized.skills[0].items.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        } else {
          optimized.skills.push({
            category: 'Additional Skills',
            items: [keyword.charAt(0).toUpperCase() + keyword.slice(1)]
          });
        }
      }
    }

        // 3. In-place replace inside professional experience achievements bullets
        if (optimized.experience) {
          optimized.experience.forEach(exp => {
            if (exp.highlights) {
              exp.highlights.forEach((hl, idx) => {
                if (hl.toLowerCase().includes(keyword.toLowerCase())) {
                  exp.highlights[idx] = customEdit;
                }
              });
            }
          });
        }

        // 4. In-place replace inside project descriptions
        if (optimized.projects) {
          optimized.projects.forEach(proj => {
            if (proj.description && proj.description.toLowerCase().includes(keyword.toLowerCase())) {
              proj.description = customEdit;
            }
          });
        }
      }
    });

    return optimized;
  }

  enrichParsedCv(cv: ParsedCv, rawText: string): ParsedCv {
    const enriched = JSON.parse(JSON.stringify(cv)) as ParsedCv;
    if (!rawText) return enriched;

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatch = rawText.match(emailRegex);
    if ((!enriched.contact.email || enriched.contact.email.includes('contact@cv-analyzer.com')) && emailMatch && emailMatch.length > 0) {
      enriched.contact.email = emailMatch[0];
    }

    const phoneRegex = /(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g;
    const phoneMatch = rawText.match(phoneRegex);
    if ((!enriched.contact.phone || enriched.contact.phone.includes('+1 (555)')) && phoneMatch && phoneMatch.length > 0) {
      enriched.contact.phone = phoneMatch[0];
    }

    // Try finding location (City, State)
    const locationRegex = /\b[A-Z][a-zA-Z\s.]+,\s*[A-Z]{2}\b/g; // e.g. San Francisco, CA
    const locationMatch = rawText.match(locationRegex);
    if ((!enriched.contact.location || enriched.contact.location === 'San Francisco, CA') && locationMatch && locationMatch.length > 0) {
      enriched.contact.location = locationMatch[0];
    }

    // Scan words for links
    const words = rawText.split(/\s+/);
    words.forEach(w => {
      const cleanWord = w.replace(/[(),]/g, '');
      if (cleanWord.includes('linkedin.com') && !enriched.contact.linkedin) {
        enriched.contact.linkedin = cleanWord;
      }
      if (cleanWord.includes('github.com') && !enriched.contact.github) {
        enriched.contact.github = cleanWord;
      }
    });

    // Parse GPA if missing in education
    const gpaRegex = /\bGPA\b:?\s*([0-4]\.[0-9]{1,2})/i;
    const gpaMatch = rawText.match(gpaRegex);
    if (gpaMatch && enriched.education) {
      enriched.education.forEach(edu => {
        if (!edu.gpa || edu.gpa === '3.7/4.0' || edu.gpa === '3.8/4.0') {
          edu.gpa = gpaMatch[1] + '/4.0';
        }
      });
    }

    // Parse certifications from raw text
    if (!enriched.certifications) {
      enriched.certifications = [];
    }
    if (enriched.certifications.length === 0 || (enriched.certifications.length === 1 && enriched.certifications[0].name.includes('AWS Certified Cloud Practitioner'))) {
      const originalCerts = [...enriched.certifications];
      enriched.certifications = [];
      const lines = rawText.split('\n');
      const certKeywords = ['certified', 'certification', 'aws', 'scrum', 'pmp', 'comptia', 'google cloud', 'azure', 'oracle'];
      const seenCerts = new Set<string>();

      lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (certKeywords.some(keyword => lowerLine.includes(keyword)) && line.trim().length > 5 && line.trim().length < 60) {
          const trimmed = line.trim();
          if (!seenCerts.has(trimmed)) {
            seenCerts.add(trimmed);
            let issuer = 'Verification Body';
            if (lowerLine.includes('aws') || lowerLine.includes('amazon')) issuer = 'Amazon Web Services';
            else if (lowerLine.includes('google')) issuer = 'Google Cloud';
            else if (lowerLine.includes('scrum')) issuer = 'Scrum Alliance';
            else if (lowerLine.includes('microsoft') || lowerLine.includes('azure')) issuer = 'Microsoft';

            enriched.certifications!.push({
              name: trimmed,
              issuer: issuer,
              date: '2024'
            });
          }
        }
      });

      if (enriched.certifications.length === 0) {
        enriched.certifications = originalCerts.length > 0 ? originalCerts : [
          {
            name: 'AWS Certified Cloud Practitioner',
            issuer: 'Amazon Web Services',
            date: '2025'
          }
        ];
      }
    }
    // Parse achievements from raw text
    if (!enriched.achievements) {
      enriched.achievements = [];
    }
    if (enriched.achievements.length === 0) {
      const lines = rawText.split('\n');
      const achKeywords = ['hackerrank', 'leetcode', 'ranked', 'winner', 'award', 'stars', 'top 5', 'top 10', 'supreme batch'];
      lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (achKeywords.some(keyword => lowerLine.includes(keyword)) && line.trim().length > 5 && line.trim().length < 90) {
          enriched.achievements!.push(line.trim().replace(/^[-•*+]\s*/, ''));
        }
      });
      // Fallback standard achievements if still empty
      if (enriched.achievements.length === 0) {
        enriched.achievements = [
          'Attained 4 stars in SQL and C on HackerRank.',
          "Ranked among the top 5 performers in Love Babbar's DSA Supreme Batch."
        ];
      }
    }

    return enriched;
  }

  private extractPdfText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            reject(new Error('Failed to read file as ArrayBuffer'));
            return;
          }

          const pdfjsLib = (window as any)['pdfjsLib'];
          if (!pdfjsLib) {
            reject(new Error('pdfjsLib is not loaded. Ensure index.html CDN import is active.'));
            return;
          }

          // Configure worker CDN path matching our import version
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
          const pdf = await loadingTask.promise;
          let fullText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str || '')
              .join(' ');
            fullText += pageText + '\n';
          }

          resolve(fullText);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('FileReader read error'));
      reader.readAsArrayBuffer(file);
    });
  }

  private formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
