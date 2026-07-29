import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

declare var html2pdf: any;

@Component({
  selector: 'app-latex-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ThemeToggleComponent],
  templateUrl: './latex-editor.component.html',
  styleUrls: ['./latex-editor.component.scss']
})
export class LatexEditorComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly latexCode = signal<string>('');
  readonly isParsing = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly activeTab = signal<'editor' | 'form'>('editor');
  readonly selectedFile = signal<File | null>(null);
  readonly dynamicCv = signal<{ name: string; contactItems: Array<{ icon?: string; text: string; link?: string }>; sections: Array<{ title: string; items: Array<{ title?: string; subtitle?: string; duration?: string; date?: string; bullets?: string[]; text?: string }>; bullets?: string[]; paragraphs?: string[] }> }>({
    name: 'Amish Verma',
    contactItems: [],
    sections: []
  });

  // Structured fields for form-based editing
  structuredData = {
    name: 'Amish Verma',
    email: 'amishv20@gmail.com',
    phone: '+91-9608513718',
    linkedinUrl: 'https://www.linkedin.com/in/amish12/',
    linkedinText: 'linkedin.com/in/amish12/',
    githubUrl: 'https://www.github.com/theamishdev',
    githubText: 'github.com/theamishdev',
    skills: {
      languages: 'C, C++, JavaScript, Java, Python, PHP',
      frameworks: 'HTML and CSS, NodeJS, React, Express, TypeScript',
      tools: 'MySQL, POSTGRESQL, MongoDB, VS Code, Git, GitHub, FireBase',
      soft: 'Problem-Solving, Team Player, Adaptability'
    },
    internships: [
      {
        roleTitle: 'DNK Media - Learning Platform',
        duration: "May'25 -- Present",
        companyName: 'Mentor (frontend-HTML, CSS, and Basic JavaScript)',
        bullets: [
          'Providing instruction as a frontend mentor for Diploma students, guiding them through fundamentals of modern web development.',
          'Developing and presenting structured lessons and practical exercises focused on core web design.',
          'Giving one-on-one mentorship and technical support, troubleshooting code issues.'
        ]
      }
    ],
    projects: [
      {
        title: 'DNK Skills (Learning Management system) | TypeScript, PSQL, Node, REST APIs',
        duration: "Jan'26 -- Ongoing",
        bullets: [
          'Developing a scalable learning platform for DNK Media as a full-time intern, focusing on performance, security, and user experience.',
          'Implementing authentication using Firebase, integrating Google Sign-In and GitHub authentication.',
          'Building RESTful APIs for user management, course delivery, and search functionality.'
        ]
      }
    ],
    certificates: [
      { title: 'Software Engineering Job Simulation | JPMORGAN CHASE & Co.', date: "Nov'25" },
      { title: 'Data Structures and Algorithm using Java | Cipher Schools', date: "July'25" }
    ],
    achievements: [
      { description: 'Attained 4 stars in SQL and C on Hacker Rank.', date: '' },
      { description: "Achieved ranking among top 5 performers in Love Babbar's DSA Supreme Batch.", date: "Jan'26" }
    ],
    education: [
      {
        institution: 'Lovely Professional University',
        duration: "Aug'23 -- Present",
        location: 'Punjab, India',
        degree: 'Bachelor of Technology - Computer Science and Engineering',
        score: 'CGPA: 7.99'
      }
    ]
  };

  ngOnInit() {
    this.generateDefaultLatex();
    
    // Attempt to load saved LaTeX CV from MongoDB if logged in
    const user = this.authService.currentUser();
    if (user) {
      const userId = user._id || user.id;
      this.authService.getActiveCv(userId).subscribe({
        next: (res) => {
          if (res.success && res.latexCode) {
            this.latexCode.set(res.latexCode);
            this.parseLatexToPreview(res.latexCode);
            this.toastService.show('Loaded saved LaTeX CV from MongoDB', 'success');
          }
        },
        error: () => {}
      });
    }
  }

  onCodeChange(newCode: string) {
    this.latexCode.set(newCode);
    this.parseLatexToPreview(newCode);
  }

  parseLatexToPreview(code: string) {
    if (!code) return;

    const cleanLatex = (str: string) => {
      if (!str) return '';
      return str
        .replace(/\\%/g, '%')
        .replace(/\\&/g, '&')
        .replace(/\\\$/g, '$')
        .replace(/\\#/g, '#')
        .replace(/\\_/g, '_')
        .replace(/\\\{/g, '{')
        .replace(/\\\}/g, '}')
        .replace(/\\textbackslash\{\}/g, '\\')
        .replace(/\\textasciitilde\{\}/g, '~')
        .replace(/\\textasciicircum\{\}/g, '^')
        .replace(/\\qquad/g, ' ')
        .replace(/\\quad/g, ' ')
        .replace(/\\smallskip/g, '')
        .replace(/\\medskip/g, '')
        .replace(/\\bigskip/g, '')
        .replace(/\\\\/g, ' ')
        .replace(/\\par/g, ' ')
        .replace(/\\hline/g, '')
        .replace(/\\textbf\{([^}]+)\}/g, '$1')
        .replace(/\\textit\{([^}]+)\}/g, '$1')
        .replace(/\\emph\{([^}]+)\}/g, '$1')
        .replace(/\\small\{([^}]+)\}/g, '$1')
        .replace(/\\Large\{([^}]+)\}/g, '$1')
        .replace(/\\Huge\{([^}]+)\}/g, '$1')
        .trim();
    };

    // 1. Candidate Name
    let candidateName = 'Candidate Name';
    const nameMatch = code.match(/\{\\Huge\\bfseries\s+([^}]+)\}/i)
      || code.match(/\\name\{([^}]+)\}/i)
      || code.match(/\\author\{([^}]+)\}/i)
      || code.match(/\{\\huge\\bfseries\s+([^}]+)\}/i)
      || code.match(/\{\\bfseries\s+([^}]+)\}/i);

    if (nameMatch && nameMatch[1]) {
      candidateName = cleanLatex(nameMatch[1]);
    } else {
      const docStart = code.indexOf('\\begin{document}');
      if (docStart !== -1) {
        const lines = code.substring(docStart).split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('\\') && !trimmed.startsWith('%') && trimmed.length > 2) {
            candidateName = cleanLatex(trimmed);
            break;
          }
        }
      }
    }

    // 2. Contact Details
    const contactItems: Array<{ icon?: string; text: string; link?: string }> = [];

    // Extract emails
    const emailMatches = Array.from(code.matchAll(/\\href\{mailto:([^}]+)\}/gi))
      .concat(Array.from(code.matchAll(/\\email\{([^}]+)\}/gi)));
    emailMatches.forEach(m => {
      const email = m[1].trim();
      if (!contactItems.some(c => c.text === email)) {
        contactItems.push({ icon: '✉️', text: email, link: `mailto:${email}` });
      }
    });

    // Extract LinkedIn
    const linkedinMatches = Array.from(code.matchAll(/\\href\{([^}]+linkedin[^}]+)\}(?:\{([^}]+)\})?/gi));
    linkedinMatches.forEach(m => {
      const url = m[1].trim();
      const label = m[2] ? cleanLatex(m[2]) : url.replace(/^https?:\/\/(www\.)?/, '');
      if (!contactItems.some(c => c.link === url)) {
        contactItems.push({ icon: '🔗', text: label.includes('LinkedIn') ? label : `LinkedIn: ${label}`, link: url });
      }
    });

    // Extract GitHub
    const githubMatches = Array.from(code.matchAll(/\\href\{([^}]+github[^}]+)\}(?:\{([^}]+)\})?/gi));
    githubMatches.forEach(m => {
      const url = m[1].trim();
      const label = m[2] ? cleanLatex(m[2]) : url.replace(/^https?:\/\/(www\.)?/, '');
      if (!contactItems.some(c => c.link === url)) {
        contactItems.push({ icon: '💻', text: label.includes('GitHub') ? label : `GitHub: ${label}`, link: url });
      }
    });

    // Extract Phone
    const phoneMatch = code.match(/\\faPhone\\\s+([^\n\\|]+)/i) || code.match(/\\phone\{([^}]+)\}/i);
    if (phoneMatch && phoneMatch[1]) {
      const phoneText = cleanLatex(phoneMatch[1]);
      if (phoneText && !contactItems.some(c => c.text === phoneText)) {
        contactItems.push({ icon: '📞', text: phoneText });
      }
    }

    // 3. Dynamic Section Extractor for ANY LaTeX template
    const sections: Array<{
      title: string;
      items: Array<{ title?: string; subtitle?: string; duration?: string; date?: string; bullets?: string[]; text?: string }>;
      bullets?: string[];
      paragraphs?: string[];
    }> = [];

    const sectionMatches = Array.from(code.matchAll(/\\(?:section|cvsection|heading)\*?\{([^}]+)\}/gi));

    for (let i = 0; i < sectionMatches.length; i++) {
      const currentMatch = sectionMatches[i];
      const title = cleanLatex(currentMatch[1]).toUpperCase();
      const startIndex = currentMatch.index! + currentMatch[0].length;
      const endIndex = (i + 1 < sectionMatches.length) ? sectionMatches[i + 1].index! : code.indexOf('\\end{document}');

      const sectionBody = code.substring(startIndex, endIndex !== -1 ? endIndex : code.length);

      const sectionObj = {
        title: title,
        items: [] as Array<{ title?: string; subtitle?: string; duration?: string; date?: string; bullets?: string[]; text?: string }>,
        bullets: [] as string[],
        paragraphs: [] as string[]
      };

      // Extract bullet items
      const bulletRegex = /\\item\s+([^\n]+)/g;
      let bMatch;
      const extractedBullets: string[] = [];
      while ((bMatch = bulletRegex.exec(sectionBody)) !== null) {
        const bulletText = cleanLatex(bMatch[1]);
        if (bulletText && bulletText.length > 1) {
          extractedBullets.push(bulletText);
        }
      }

      // Split into entry blocks (e.g. \textbf{...} or \cventry or \subsection or \resumeItem)
      const blocks = sectionBody.split(/(?=\\textbf\{|\\cventry\{|\\subsection\*?\{|\\resumeSubheading\{)/g).filter(b => b.trim().length > 0);

      blocks.forEach(block => {
        const itemTitleMatch = block.match(/\\textbf\{([^}]+)\}/) || block.match(/\\subsection\*?\{([^}]+)\}/) || block.match(/\\resumeSubheading\{([^}]+)\}/);
        const itemDateMatch = block.match(/\\hfill\s+\\textit\{([^}]+)\}/) || block.match(/\\hfill\s+([^\n\\]+)/);
        const itemSubMatch = block.match(/\\textit\{([^}]+)\}/);

        const blockBullets: string[] = [];
        let bReg;
        const bRegex = /\\item\s+([^\n]+)/g;
        while ((bReg = bRegex.exec(block)) !== null) {
          const bText = cleanLatex(bReg[1]);
          if (bText && bText.length > 1) blockBullets.push(bText);
        }

        if (itemTitleMatch && itemTitleMatch[1]) {
          sectionObj.items.push({
            title: cleanLatex(itemTitleMatch[1]),
            duration: itemDateMatch ? cleanLatex(itemDateMatch[1]) : '',
            subtitle: itemSubMatch ? cleanLatex(itemSubMatch[1]) : '',
            bullets: blockBullets
          });
        }
      });

      if (sectionObj.items.length === 0 && extractedBullets.length > 0) {
        sectionObj.bullets = extractedBullets;
      }

      if (sectionObj.items.length === 0 && extractedBullets.length === 0) {
        const rawLines = sectionBody
          .split('\n')
          .map(l => cleanLatex(l))
          .filter(l => l.length > 0 && !l.startsWith('%') && !l.startsWith('\\'));
        if (rawLines.length > 0) {
          sectionObj.paragraphs = rawLines;
        }
      }

      if (sectionObj.items.length > 0 || (sectionObj.bullets && sectionObj.bullets.length > 0) || (sectionObj.paragraphs && sectionObj.paragraphs.length > 0)) {
        sections.push(sectionObj);
      }
    }

    this.dynamicCv.set({
      name: candidateName,
      contactItems: contactItems,
      sections: sections
    });
  }

  generateDefaultLatex() {
    const code = `%------------------------------------------------------------------------------
% LaTeX CV Template - Amish Verma Format
%------------------------------------------------------------------------------

\\documentclass[11pt,a4paper]{article}

\\usepackage[margin=0.8in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{fontawesome}
\\usepackage{xcolor}
\\usepackage{parskip}
\\usepackage{tikz}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.5em}

\\definecolor{linkcolor}{RGB}{0,102,204}
\\definecolor{sectioncolor}{RGB}{0,51,102}

\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor,
    citecolor=linkcolor
}

\\titleformat{\\section}
    {\\large\\bfseries\\color{sectioncolor}}
    {\\thesection}{1em}{}
    [\\titlerule]

\\newcommand{\\contactitem}[2]{%
    \\href{#1}{\\faIcon{link} #2}%
}

\\begin{document}

\\begin{center}
    {\\Huge\\bfseries ${this.escapeLatex(this.structuredData.name)}}
    
    \\vspace{0.3em}
    \\href{${this.structuredData.linkedinUrl}}{\\faLinkedinSquare\\ LinkedIn: ${this.structuredData.linkedinText}}
    \\quad|\\quad
    \\href{mailto:${this.structuredData.email}}{\\faEnvelope\\ ${this.structuredData.email}}
    \\quad|\\quad
    \\href{${this.structuredData.githubUrl}}{\\faGithub\\ GitHub: ${this.structuredData.githubText}}
    \\quad|\\quad
    \\faPhone\\ ${this.structuredData.phone}
\\end{center}

\\section{SKILLS}

\\textbf{Languages:}
${this.escapeLatex(this.structuredData.skills.languages)}

\\smallskip
\\textbf{Frameworks:}
${this.escapeLatex(this.structuredData.skills.frameworks)}

\\smallskip
\\textbf{Tools/Platforms:}
${this.escapeLatex(this.structuredData.skills.tools)}

\\smallskip
\\textbf{Soft Skills:}
${this.escapeLatex(this.structuredData.skills.soft)}

\\section{INTERNSHIP}

\\textbf{DNK Media - Learning Platform}
\\hfill \\textit{May'25 -- Present}

Mentor (frontend-HTML, CSS, and Basic JavaScript)

\\begin{itemize}[leftmargin=1.2em, label={$\\bullet$}]
    \\item Providing instruction as a frontend mentor for Diploma students, guiding them through the fundamentals of modern web development.
    \\item Developing and presented structured lessons and practical exercises focused on core web design and implementation principles, successfully facilitating the transfer of essential coding skills.
    \\item Giving one-on-one mentorship and technical support, troubleshooting code issues and guiding students through project development to ensure a comprehensive understanding of frontend techniques.
\\end{itemize}

\\section{PROJECTS}

\\textbf{DNK Skills (Learning Management system) | TypeScript, PSQL, Node, REST APIs | GitHub}
\\hfill \\textit{Jan'26 -- Ongoing}

\\begin{itemize}[leftmargin=1.2em, label={$\\bullet$}]
    \\item Developing a scalable learning platform for DNK Media as a full-time intern, focusing on performance, security, and user experience
    \\item Implementing authentication using Firebase, integrating Google Sign-In and GitHub authentication, along with Google reCAPTCHA to prevent automated abuse and enhance platform security.
    \\item Building a dynamic and SEO-friendly homepage using HTML and JavaScript, improving visibility and user engagement.
    \\item Integrating external APIs such as Judge0 to enable an in-browser code compiler, along with Leet Code question datasets(JSON API) to incorporate structured coding problems.
    \\item Designing and implementing RESTful APIs for user management, course/content delivery, search functionality, and order handling, ensuring smooth communication between frontend and backend.
    \\item Developing an admin panel to manage platform workflows, user activities, and content control efficiently.
\\end{itemize}

\\bigskip
\\textbf{Farm Hive (Agriculture Support Website) | MERN | GitHub | Live Demo}
\\hfill \\textit{Nov'25 -- Dec'25}

\\begin{itemize}[leftmargin=1.2em, label={$\\bullet$}]
    \\item Developed an e-commerce website where a farmer can either sell or buy products as per the need.
    \\item Accomplished secure authentication using Firebase including Google Sign-In, Google reCAPTCHA for safety against Dos attack enabling seamless user onboarding, session management and protected access to platform.
    \\item Applied user authentication, product listing, search, and order management with RESTful APIs, ensuring secure transactions and smooth interaction between frontend and backend services.
\\end{itemize}

\\section{CERTIFICATES}

Software Engineering Job Simulation | JPMORGAN CHASE \\& Co. | Certificate
\\hfill \\textit{Nov'25}

\\smallskip
Data Structures and Algorithm using Java | Cipher Schools | Certificate
\\hfill \\textit{July'25}

\\smallskip
Responsive Web Design | Free Code Camp | Certificate
\\hfill \\textit{Oct'23}

\\section{ACHIEVEMENTS}

Attained 4 stars in SQL and C on Hacker Rank.

\\smallskip
Achieved ranking among top 5 performers in Love Babbar's DSA Supreme Batch.
\\hfill \\textit{Jan'26}

\\section{EDUCATION}

\\textbf{Lovely Professional University}
\\hfill \\textit{Aug'23 -- Present}
\\par Punjab, India
\\par Bachelor of Technology - Computer Science and Engineering | CGPA: 7.99

\\smallskip
\\textbf{Dav Public School}
\\hfill \\textit{Apr'22 -- Mar'23}
\\par Gandhi Nagar, Ranchi
\\par Intermediate | Percentage: 85.2\\%

\\smallskip
\\textbf{Dav Public School}
\\hfill \\textit{Apr'20 -- Mar'21}
\\par Gandhi Nagar, Ranchi
\\par Matriculation | Percentage: 95\\%

\\end{document}
`;
    this.latexCode.set(code);
  }

  escapeLatex(str: string): string {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/&/g, '\\&')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      this.autoParseFile();
    }
  }

  autoParseFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.isParsing.set(true);
    this.toastService.show('Extracting candidate data into LaTeX template...', 'info');

    this.authService.parseCvToLatex(file).subscribe({
      next: (res) => {
        this.isParsing.set(false);
        if (res.success && res.latexCode) {
          this.latexCode.set(res.latexCode);
          if (res.structuredData) {
            this.structuredData = { ...this.structuredData, ...res.structuredData };
          }
          this.toastService.show('Successfully populated LaTeX template with your CV data!', 'success');
        }
      },
      error: (err) => {
        this.isParsing.set(false);
        this.toastService.show('Parsing failed. ' + (err.error?.message || 'Please check your backend connection.'), 'error');
      }
    });
  }

  downloadTexFile() {
    const code = this.latexCode();
    if (!code) return;

    this.authService.downloadLatexFile(code, 'CV_AmishVerma_Template.tex').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CV_AmishVerma_Template.tex';
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastService.show('Downloaded .tex file successfully!', 'success');
      },
      error: () => {
        this.toastService.show('Failed to download .tex file.', 'error');
      }
    });
  }

  exportPdf() {
    const element = document.getElementById('latex-preview-content');
    if (!element) {
      this.toastService.show('Preview element not ready for PDF export', 'error');
      return;
    }

    this.toastService.show('Generating PDF document...', 'info');

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${this.structuredData.name.replace(/\s+/g, '_')}_CV.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(element).save().then(() => {
        this.toastService.show('PDF exported successfully!', 'success');
      }).catch((err: any) => {
        this.toastService.show('PDF export failed: ' + err.message, 'error');
      });
    } else {
      window.print();
    }
  }

  saveToMongoDB() {
    const user = this.authService.currentUser();
    const userId = user ? (user._id || user.id) : null;
    if (!user || !userId) {
      this.toastService.show('Please log in to save your CV to MongoDB', 'error');
      this.router.navigate(['/login']);
      return;
    }

    this.isSaving.set(true);
    this.authService.saveActiveCv(userId, this.structuredData, this.latexCode()).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.toastService.show('LaTeX CV saved to MongoDB successfully! 💾', 'success');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.show('Failed to save to MongoDB: ' + (err.error?.message || 'Server error'), 'error');
      }
    });
  }
}
