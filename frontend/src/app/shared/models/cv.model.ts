export interface CVData {
  contact: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    portfolio: string;
    location: string;
  };
  summary: string;
  experience: Array<{
    role: string;
    company: string;
    location: string;
    duration: string;
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location: string;
    duration: string;
    gpa: string;
  }>;
  projects: Array<{
    title: string;
    technologies: string[];
    description: string;
    link: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  achievements?: string[];
}
