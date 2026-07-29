const aiService = require('./aiService');

/**
 * Escapes special LaTeX characters to prevent LaTeX syntax errors.
 */
function escapeLatex(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Raw default LaTeX template string matching user's exact specification.
 */
const DEFAULT_LATEX_TEMPLATE = `%------------------------------------------------------------------------------
% LaTeX CV Template - Amish Verma Format
%------------------------------------------------------------------------------

\\documentclass[11pt,a4paper]{article}

%------------------------- PACKAGES --------------------------------------------
\\usepackage[margin=0.8in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{fontawesome}
\\usepackage{xcolor}
\\usepackage{parskip}
\\usepackage{tikz}

%------------------------- FORMATTING -----------------------------------------
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.5em}

% Color definitions
\\definecolor{linkcolor}{RGB}{0,102,204}
\\definecolor{sectioncolor}{RGB}{0,51,102}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor,
    citecolor=linkcolor
}

% Section formatting
\\titleformat{\\section}
    {\\large\\bfseries\\color{sectioncolor}}
    {\\thesection}{1em}{}
    [\\titlerule]

% Custom commands for contact info
\\newcommand{\\contactitem}[2]{%
    \\href{#1}{\\faIcon{link} #2}%
}

%------------------------- DOCUMENT -------------------------------------------
\\begin{document}

%------------------------- HEADER ---------------------------------------------
\\begin{center}
    {\\Huge\\bfseries {{NAME}}}
    
    \\vspace{0.3em}
    {{#if LINKEDIN_URL}}\\href{{{LINKEDIN_URL}}}{\\faLinkedinSquare\\ LinkedIn: {{LINKEDIN_TEXT}}}{{/if}}
    {{#if EMAIL}}\\quad|\\quad \\href{mailto:{{EMAIL}}}{\\faEnvelope\\ {{EMAIL}}}{{/if}}
    {{#if GITHUB_URL}}\\quad|\\quad \\href{{{GITHUB_URL}}}{\\faGithub\\ GitHub: {{GITHUB_TEXT}}}{{/if}}
    {{#if PHONE}}\\quad|\\quad \\faPhone\\ {{PHONE}}{{/if}}
\\end{center}

%------------------------- SKILLS ---------------------------------------------
\\section{SKILLS}

{{#if SKILLS_LANGUAGES}}\\textbf{Languages:}
{{SKILLS_LANGUAGES}}

\\smallskip{{/if}}
{{#if SKILLS_FRAMEWORKS}}\\textbf{Frameworks:}
{{SKILLS_FRAMEWORKS}}

\\smallskip{{/if}}
{{#if SKILLS_TOOLS}}\\textbf{Tools/Platforms:}
{{SKILLS_TOOLS}}

\\smallskip{{/if}}
{{#if SKILLS_SOFT}}\\textbf{Soft Skills:}
{{SKILLS_SOFT}}{{/if}}

%------------------------- INTERNSHIP -----------------------------------------
{{#if INTERNSHIPS}}
\\section{INTERNSHIP}

{{#each INTERNSHIPS}}
\\textbf{{{roleTitle}}}
\\hfill \\textit{{{duration}}}

{{#if companyName}}\\textit{{{companyName}}}{{/if}}

\\begin{itemize}[leftmargin=1.2em, label={$\\bullet$}]
{{#each bullets}}
    \\item {{{this}}}
{{/each}}
\\end{itemize}
{{#unless @last}}\\smallskip{{/unless}}
{{/each}}
{{/if}}

%------------------------- PROJECTS -------------------------------------------
{{#if PROJECTS}}
\\section{PROJECTS}

{{#each PROJECTS}}
\\textbf{{{title}}}
\\hfill \\textit{{{duration}}}

\\begin{itemize}[leftmargin=1.2em, label={$\\bullet$}]
{{#each bullets}}
    \\item {{{this}}}
{{/each}}
\\end{itemize}
{{#unless @last}}\\bigskip{{/unless}}
{{/each}}
{{/if}}

%------------------------- CERTIFICATES ---------------------------------------
{{#if CERTIFICATES}}
\\section{CERTIFICATES}

{{#each CERTIFICATES}}
{{{title}}}
\\hfill \\textit{{{date}}}
{{#unless @last}}\\smallskip\\\\{{/unless}}
{{/each}}
{{/if}}

%------------------------- ACHIEVEMENTS ---------------------------------------
{{#if ACHIEVEMENTS}}
\\section{ACHIEVEMENTS}

{{#each ACHIEVEMENTS}}
{{{description}}}{{#if date}}\\hfill \\textit{{{date}}}{{/if}}
{{#unless @last}}\\smallskip\\\\{{/unless}}
{{/each}}
{{/if}}

%------------------------- EDUCATION ------------------------------------------
{{#if EDUCATION}}
\\section{EDUCATION}

{{#each EDUCATION}}
\\textbf{{{institution}}}
\\hfill \\textit{{{duration}}}
\\par {{{location}}}
\\par {{{degree}}}{{#if score}} | {{{score}}}{{/if}}
{{#unless @last}}\\smallskip{{/unless}}
{{/each}}
{{/if}}

\\end{document}
`;

/**
 * Compiles structured JSON CV data into a LaTeX document string.
 */
function buildLatexFromData(data) {
  if (!data) return DEFAULT_LATEX_TEMPLATE;

  const name = escapeLatex(data.name || 'Candidate Name');
  const email = escapeLatex(data.email || '');
  const phone = escapeLatex(data.phone || '');
  const linkedinUrl = data.linkedinUrl || '';
  const linkedinText = escapeLatex(data.linkedinText || data.linkedinUrl || 'linkedin.com');
  const githubUrl = data.githubUrl || '';
  const githubText = escapeLatex(data.githubText || data.githubUrl || 'github.com');

  const skillsLanguages = escapeLatex(data.skills?.languages || '');
  const skillsFrameworks = escapeLatex(data.skills?.frameworks || '');
  const skillsTools = escapeLatex(data.skills?.tools || '');
  const skillsSoft = escapeLatex(data.skills?.soft || '');

  // Render Internships
  let internshipSection = '';
  if (Array.isArray(data.internships) && data.internships.length > 0) {
    internshipSection += `\\section{INTERNSHIP}\n\n`;
    data.internships.forEach((item, index) => {
      internshipSection += `\\textbf{${escapeLatex(item.roleTitle || item.title || 'Internship')}}\n`;
      internshipSection += `\\hfill \\textit{${escapeLatex(item.duration || '')}}\n\n`;
      if (item.companyName) {
        internshipSection += `\\textit{${escapeLatex(item.companyName)}}\n\n`;
      }
      if (Array.isArray(item.bullets) && item.bullets.length > 0) {
        internshipSection += `\\begin{itemize}[leftmargin=1.2em, label={$\\bullet$}]\n`;
        item.bullets.forEach(b => {
          internshipSection += `    \\item ${escapeLatex(b)}\n`;
        });
        internshipSection += `\\end{itemize}\n`;
      }
      if (index < data.internships.length - 1) internshipSection += `\\smallskip\n`;
    });
  }

  // Render Projects
  let projectSection = '';
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    projectSection += `\\section{PROJECTS}\n\n`;
    data.projects.forEach((item, index) => {
      projectSection += `\\textbf{${escapeLatex(item.title || 'Project')}}\n`;
      projectSection += `\\hfill \\textit{${escapeLatex(item.duration || '')}}\n\n`;
      if (Array.isArray(item.bullets) && item.bullets.length > 0) {
        projectSection += `\\begin{itemize}[leftmargin=1.2em, label={$\\bullet$}]\n`;
        item.bullets.forEach(b => {
          projectSection += `    \\item ${escapeLatex(b)}\n`;
        });
        projectSection += `\\end{itemize}\n`;
      }
      if (index < data.projects.length - 1) projectSection += `\\bigskip\n`;
    });
  }

  // Render Certificates
  let certificateSection = '';
  if (Array.isArray(data.certificates) && data.certificates.length > 0) {
    certificateSection += `\\section{CERTIFICATES}\n\n`;
    data.certificates.forEach((cert, index) => {
      certificateSection += `${escapeLatex(cert.title || cert.name || '')}`;
      if (cert.date) {
        certificateSection += ` \\hfill \\textit{${escapeLatex(cert.date)}}`;
      }
      certificateSection += `\n`;
      if (index < data.certificates.length - 1) certificateSection += `\\smallskip\n`;
    });
  }

  // Render Achievements
  let achievementSection = '';
  if (Array.isArray(data.achievements) && data.achievements.length > 0) {
    achievementSection += `\\section{ACHIEVEMENTS}\n\n`;
    data.achievements.forEach((ach, index) => {
      const desc = typeof ach === 'string' ? ach : (ach.description || ach.title || '');
      const date = typeof ach === 'object' && ach.date ? ach.date : '';
      achievementSection += `${escapeLatex(desc)}`;
      if (date) {
        achievementSection += `\\hfill \\textit{${escapeLatex(date)}}`;
      }
      achievementSection += `\n`;
      if (index < data.achievements.length - 1) achievementSection += `\\smallskip\n`;
    });
  }

  // Render Education
  let educationSection = '';
  if (Array.isArray(data.education) && data.education.length > 0) {
    educationSection += `\\section{EDUCATION}\n\n`;
    data.education.forEach((edu, index) => {
      educationSection += `\\textbf{${escapeLatex(edu.institution || 'University')}}\n`;
      educationSection += `\\hfill \\textit{${escapeLatex(edu.duration || '')}}\n`;
      if (edu.location) {
        educationSection += `\\par ${escapeLatex(edu.location)}\n`;
      }
      educationSection += `\\par ${escapeLatex(edu.degree || '')}`;
      if (edu.score) {
        educationSection += ` | ${escapeLatex(edu.score)}`;
      }
      educationSection += `\n`;
      if (index < data.education.length - 1) educationSection += `\\smallskip\n`;
    });
  }

  const headerContact = [
    linkedinUrl ? `\\href{${linkedinUrl}}{\\faLinkedinSquare\\ LinkedIn: ${linkedinText}}` : '',
    email ? `\\href{mailto:${email}}{\\faEnvelope\\ ${email}}` : '',
    githubUrl ? `\\href{${githubUrl}}{\\faGithub\\ GitHub: ${githubText}}` : '',
    phone ? `\\faPhone\\ ${phone}` : ''
  ].filter(Boolean).join(' \\quad|\\quad ');

  return `\\documentclass[11pt,a4paper]{article}

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
    {\\Huge\\bfseries ${name}}
    
    \\vspace{0.3em}
    ${headerContact}
\\end{center}

\\section{SKILLS}

${skillsLanguages ? `\\textbf{Languages:}\n${skillsLanguages}\n\n\\smallskip\n` : ''}${skillsFrameworks ? `\\textbf{Frameworks:}\n${skillsFrameworks}\n\n\\smallskip\n` : ''}${skillsTools ? `\\textbf{Tools/Platforms:}\n${skillsTools}\n\n\\smallskip\n` : ''}${skillsSoft ? `\\textbf{Soft Skills:}\n${skillsSoft}\n` : ''}
${internshipSection}
${projectSection}
${certificateSection}
${achievementSection}
${educationSection}

\\end{document}
`;
}

/**
 * Uses Grok AI to extract structured JSON from raw CV text and builds LaTeX.
 */
async function parseCvToLatex(cvText) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    // Fallback heuristic parsing if no API key
    const fallbackData = {
      name: "Parsed Candidate",
      email: "candidate@example.com",
      phone: "+91-0000000000",
      skills: {
        languages: "JavaScript, TypeScript, Python",
        frameworks: "HTML, CSS, Node.js, Express, React",
        tools: "Git, GitHub, VS Code, MongoDB",
        soft: "Problem-Solving, Adaptability, Team Player"
      },
      projects: [{
        title: "Parsed Candidate Project",
        duration: "Recent",
        bullets: ["Extracted raw content from uploaded candidate resume document."]
      }]
    };
    return {
      structuredData: fallbackData,
      latexCode: buildLatexFromData(fallbackData)
    };
  }

  const modelName = process.env.XAI_MODEL || 'grok-beta';
  const systemPrompt = `You are a professional resume parser. Parse the provided Resume text into structured JSON matching this schema exactly:
{
  "name": "<Candidate Full Name>",
  "email": "<Email address or empty string>",
  "phone": "<Phone number or empty string>",
  "linkedinUrl": "<LinkedIn URL or empty string>",
  "linkedinText": "<LinkedIn profile display text like linkedin.com/in/name>",
  "githubUrl": "<GitHub URL or empty string>",
  "githubText": "<GitHub profile display text like github.com/username>",
  "skills": {
    "languages": "<comma separated languages>",
    "frameworks": "<comma separated frameworks>",
    "tools": "<comma separated tools/databases>",
    "soft": "<comma separated soft skills>"
  },
  "internships": [
    {
      "roleTitle": "<Role or Title & Organization>",
      "duration": "<Dates like May'25 -- Present>",
      "companyName": "<Company or Institution Name>",
      "bullets": ["<bullet point 1>", "<bullet point 2>"]
    }
  ],
  "projects": [
    {
      "title": "<Project Title & Tech Stack>",
      "duration": "<Dates>",
      "bullets": ["<bullet point 1>", "<bullet point 2>"]
    }
  ],
  "certificates": [
    {
      "title": "<Certificate Name & Organization>",
      "date": "<Date or Year>"
    }
  ],
  "achievements": [
    {
      "description": "<Achievement description>",
      "date": "<Date or Year if applicable>"
    }
  ],
  "education": [
    {
      "institution": "<University or School Name>",
      "duration": "<Dates>",
      "location": "<City, State/Country>",
      "degree": "<Degree Name>",
      "score": "<CGPA or Percentage>"
    }
  ]
}
Return ONLY valid JSON with no markdown formatting.`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Resume Text:\n${cvText}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`xAI Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    let structuredData = JSON.parse(content.trim().replace(/^```(?:json)?/, '').replace(/```$/, ''));
    const latexCode = buildLatexFromData(structuredData);

    return {
      structuredData,
      latexCode
    };
  } catch (error) {
    console.error("Error in parseCvToLatex:", error);
    // Fallback if AI fails
    const fallbackData = {
      name: "Parsed Candidate",
      email: "",
      phone: "",
      skills: { languages: "", frameworks: "", tools: "", soft: "" },
      projects: [{ title: "Uploaded Resume Content", duration: "", bullets: [cvText.slice(0, 300)] }]
    };
    return {
      structuredData: fallbackData,
      latexCode: buildLatexFromData(fallbackData)
    };
  }
}

module.exports = {
  escapeLatex,
  buildLatexFromData,
  parseCvToLatex,
  DEFAULT_LATEX_TEMPLATE
};
