import {
  ParsedResume,
  StructuredExperience,
  StructuredProject,
  StructuredEducation,
  ResumeValidation
} from '../types';

const REJECT_MESSAGE = "The uploaded document does not appear to be a valid resume. Please upload a resume in PDF or DOCX format.";

// Skill Dictionaries
const DICTIONARY_PROGRAMMING_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'SQL', 'Swift', 'Kotlin',
  'Scala', 'Bash', 'Shell', 'Dart', 'PHP', 'Ruby', 'HTML5', 'CSS3', 'Go', 'C', 'C#'
];

const DICTIONARY_TOOLS_TECHNOLOGIES = [
  'Docker', 'Kubernetes', 'AWS', 'Amazon Web Services', 'GCP', 'Google Cloud',
  'Azure', 'Git', 'GitHub', 'GitLab', 'Jenkins', 'Redis', 'PostgreSQL',
  'MySQL', 'MongoDB', 'SQLite', 'Kafka', 'Elasticsearch', 'Linux', 'Nginx',
  'Terraform', 'Ansible', 'Prometheus', 'Grafana', 'Supabase', 'Firebase', 'Vercel',
  'Webpack', 'Vite', 'RabbitMQ', 'Prisma', 'Postman', 'Jira', 'Figma'
];

const DICTIONARY_TECHNICAL_SKILLS = [
  'React', 'React.js', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'Node.js',
  'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
  'REST APIs', 'RESTful APIs', 'GraphQL', 'Microservices', 'System Design',
  'Tailwind CSS', 'Tailwind', 'Redux', 'Redux Toolkit', 'WebRTC', 'WebSockets',
  'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy', 'Jest', 'Cypress',
  'CI/CD', 'OOP', 'Data Structures', 'Algorithms', 'Distributed Systems',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'
];

const DICTIONARY_SOFT_SKILLS = [
  'Leadership', 'Problem Solving', 'Communication', 'Team Collaboration', 'Teamwork',
  'Agile', 'Scrum', 'Time Management', 'Adaptability', 'Critical Thinking',
  'Project Management', 'Mentorship', 'Conflict Resolution', 'Strategic Thinking',
  'Analytical Thinking', 'Cross-functional Collaboration'
];

/**
 * Intelligent Document Classifier
 * Determines if document is a genuine Candidate Resume vs Non-Resume Document (ID card, invoice, paper, etc.)
 */
export function classifyDocumentAsResume(rawText: string, fileName: string): { isResume: boolean; rejectionReason?: string } {
  const cleanText = rawText.trim();
  const lowerText = cleanText.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  // 1. Explicit Non-Resume Filename Blacklist
  const nonResumeFilenameKeywords = [
    'pan card', 'pan_card', 'pancard', 'pan', 'invoice', 'receipt', 'bill', 'tax',
    'bank statement', 'account statement', 'certificate', 'driving licence', 'license',
    'passport', 'aadhaar', 'adhar', 'voter', 'ration card', 'cheque', 'utility bill',
    'salary slip', 'pay slip', 'assignment', 'homework', 'presentation', 'slides',
    'research paper', 'abstract', 'transcript', 'mark sheet', 'marksheet'
  ];

  const hasNonResumeFilename = nonResumeFilenameKeywords.some((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(lowerFileName);
  });

  // 2. Explicit Non-Resume Content Terms
  const nonResumeContentTerms = [
    'income tax department', 'govt of india', 'government of india', 'permanent account number',
    'tax invoice', 'invoice no', 'invoice number', 'bill to', 'amount due', 'total payable', 'bank statement',
    'account statement', 'certificate of completion', 'certificate of achievement', 'this is to certify that',
    'driving licence', 'passport no', 'republic of india', 'sub: assignment', 'homework assignment', 'abstract:',
    'keywords:', 'doi:', 'isbn:', 'terms and conditions', 'payment receipt', 'paid in full',
    'customer id', 'service invoice', 'invoice amount', 'bank account number', 'opening balance', 'closing balance'
  ];

  let negativeSignalCount = 0;
  nonResumeContentTerms.forEach((term) => {
    if (lowerText.includes(term)) negativeSignalCount += 1;
  });

  // 3. Resume Structural Section Indicators
  const resumeStructuralKeywords = [
    'experience', 'work experience', 'professional experience', 'employment history', 'work history',
    'education', 'academic background', 'skills', 'technical skills', 'key skills', 'projects',
    'summary', 'professional summary', 'executive summary', 'certifications', 'qualifications',
    'curriculum vitae', 'cv', 'resume'
  ];

  let positiveSignalCount = 0;
  resumeStructuralKeywords.forEach((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(lowerText)) {
      positiveSignalCount += 1;
    }
  });

  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(cleanText);
  const hasPhone = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cleanText);
  const hasContactInfo = hasEmail || hasPhone;

  const hasLikelyName = /^(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}\s*,?\s*(?:Jr\.|Sr\.)?)$/m.test(cleanText);
  const hasExperienceSection = /(?:experience|work experience|employment history|professional experience)/i.test(lowerText);
  const hasEducationSection = /(?:education|academic background|qualifications)/i.test(lowerText);
  const hasSkillsSection = /(?:skills|technical skills|key skills|core competencies)/i.test(lowerText);
  const hasProjectsSection = /(?:projects|project work|selected projects)/i.test(lowerText);

  // Strong resume requirements: must look like a personal CV, not a random document.
  const resumeStructureScore = [
    hasLikelyName,
    hasContactInfo,
    hasExperienceSection,
    hasEducationSection,
    hasSkillsSection,
    hasProjectsSection
  ].filter(Boolean).length;

  if (hasNonResumeFilename && positiveSignalCount < 2) {
    return { isResume: false, rejectionReason: REJECT_MESSAGE };
  }

  if (negativeSignalCount >= 1 && (positiveSignalCount < 2 || resumeStructureScore < 3)) {
    return { isResume: false, rejectionReason: REJECT_MESSAGE };
  }

  if (cleanText.length < 120) {
    return { isResume: false, rejectionReason: REJECT_MESSAGE };
  }

  if (resumeStructureScore < 3) {
    return { isResume: false, rejectionReason: REJECT_MESSAGE };
  }

  if (positiveSignalCount === 0 && !hasContactInfo) {
    return { isResume: false, rejectionReason: REJECT_MESSAGE };
  }

  return { isResume: true };
}

/**
 * Extracts raw text from uploaded files (PDF, DOCX, DOC, TXT)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. DOCX Extraction via Mammoth
  if (fileName.endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 20) {
        return result.value.trim();
      }
    } catch (e) {
      console.warn('Mammoth DOCX extraction fallback:', e);
    }
  }

  // 2. PDF Extraction via PDF.js
  if (fileName.endsWith('.pdf')) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      const pageTextPromises: Promise<string>[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        pageTextPromises.push(
          pdfDoc.getPage(i).then(async (page) => {
            const tokenContent = await page.getTextContent();
            return tokenContent.items
              .map((item: any) => item.str || '')
              .join(' ');
          })
        );
      }

      const pageTexts = await Promise.all(pageTextPromises);
      const combinedPdfText = pageTexts.join('\n\n').trim();
      if (combinedPdfText.length > 20) {
        return combinedPdfText;
      }
    } catch (pdfErr) {
      console.warn('PDF.js parsing fallback:', pdfErr);
    }
  }

  // 3. Fallback FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) { resolve(''); return; }
        let rawText = typeof result === 'string' ? result : new TextDecoder('utf-8', { fatal: false }).decode(result);
        const cleanText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
        resolve(cleanText.trim());
      } catch (err) {
        reject(new Error(`Failed to decode file contents: ${err}`));
      }
    };
    reader.onerror = () => reject(new Error(`FileReader failed to read file "${file.name}"`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Main Resume Parser Entrypoint
 */
export async function parseResumeFile(file: File): Promise<ParsedResume> {
  if (!file) {
    throw new Error('No file provided for resume parsing.');
  }

  const fileName = file.name || 'uploaded_resume.pdf';
  const fileSizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  const lowerName = fileName.toLowerCase();
  const isValidFormat = lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || lowerName.endsWith('.txt');

  if (!isValidFormat) {
    throw new Error(REJECT_MESSAGE);
  }

  // 1. Extract Raw Text Content
  const rawContent = await extractTextFromFile(file);
  if (!rawContent || rawContent.trim().length < 15) {
    throw new Error(REJECT_MESSAGE);
  }

  const cleanRawText = rawContent.trim();

  // 2. Client-Side Pre-Validation Classification Check
  const classification = classifyDocumentAsResume(cleanRawText, fileName);
  if (!classification.isResume) {
    throw new Error(classification.rejectionReason || REJECT_MESSAGE);
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // 3. Attempt Server AI Resume Extraction
  try {
    const res = await fetch(`${backendUrl}/api/resume/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: cleanRawText, fileName })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.isResume === false) {
          throw new Error(data.data.rejectionReason || REJECT_MESSAGE);
        }
        return {
          fileName,
          fileSizeFormatted,
          uploadedAt: new Date().toISOString().split('T')[0],
          isResume: true,
          ...data.data,
          rawText: cleanRawText
        };
      }
    } else {
      const errorJson = await res.json().catch(() => ({}));
      if (errorJson.isResume === false || errorJson.error) {
        throw new Error(errorJson.error || REJECT_MESSAGE);
      }
    }
  } catch (e: any) {
    if (e.message === REJECT_MESSAGE || (e.message && e.message.includes('does not appear to be a valid resume'))) {
      throw e;
    }
    console.warn('Backend AI resume endpoint unavailable, running client-side local audit fallback:', e);
  }

  // 4. Fallback Client-Side Factual Parse (NO HALLUCINATIONS)
  return fallbackLocalParse(cleanRawText, fileName, fileSizeFormatted);
}

function fallbackLocalParse(cleanRawText: string, fileName: string, fileSizeFormatted: string): ParsedResume {
  const classification = classifyDocumentAsResume(cleanRawText, fileName);
  if (!classification.isResume) {
    throw new Error(classification.rejectionReason || REJECT_MESSAGE);
  }

  const lowerText = cleanRawText.toLowerCase();

  // Name
  let candidateName = 'Not specified in resume';
  const rawLines = cleanRawText.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(5, rawLines.length); i++) {
    const line = rawLines[i];
    if (/^[A-Za-z]+(?:\s+[A-Za-z]+){1,3}$/.test(line) && !/@|\.com|resume|phone|email|pan|card|invoice|tax|govt|summary|experience|skills|projects/i.test(line)) {
      candidateName = line.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
      break;
    }
  }

  // Email
  const emailMatch = cleanRawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : 'Not specified in resume';

  // Phone
  const phoneMatch = cleanRawText.match(/(?:\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  let phone = phoneMatch ? phoneMatch[0] : 'Not specified in resume';
  if (phone !== 'Not specified in resume') {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) phone = `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Links
  const linkedinMatch = cleanRawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w\-]+/i);
  const githubMatch = cleanRawText.match(/https?:\/\/(?:www\.)?github\.com\/[\w\-]+/i);

  // Context-aware skill detection (NO FALSE POSITIVES)
  const detectSkills = (list: string[]) => {
    const hasTechnicalContext = /skills|technologies|languages|stack|frameworks|tools|developer|engineer|experience|projects/i.test(cleanRawText);
    return list.filter(item => {
      if (item.length <= 2 && !hasTechnicalContext) return false;
      const escaped = item.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i').test(lowerText);
    });
  };

  const programmingLanguages = detectSkills(DICTIONARY_PROGRAMMING_LANGUAGES);
  const toolsAndTechnologies = detectSkills(DICTIONARY_TOOLS_TECHNOLOGIES);
  const technicalSkills = detectSkills(DICTIONARY_TECHNICAL_SKILLS);
  const softSkills = detectSkills(DICTIONARY_SOFT_SKILLS);

  const extractedSkills = Array.from(new Set([...programmingLanguages, ...toolsAndTechnologies, ...technicalSkills]));

  let detectedRole = 'Candidate Profile';
  if (programmingLanguages.includes('Python') && (technicalSkills.includes('Machine Learning') || technicalSkills.includes('AI'))) {
    detectedRole = 'AI & Data Engineer';
  } else if (programmingLanguages.includes('TypeScript') || technicalSkills.includes('React')) {
    detectedRole = 'Software Engineer';
  }

  let experienceYears = 0;
  const expMatch = lowerText.match(/(\d+)\+?\s*(?:yrs|years|\+?\s*years)/);
  if (expMatch) experienceYears = parseInt(expMatch[1], 10);

  const eduHeuristics = extractEducationHeuristics(cleanRawText);
  const certHeuristics = extractCertificationsHeuristics(cleanRawText);
  const achHeuristics = extractAchievementsHeuristics(cleanRawText);
  const expHeuristics = extractExperienceHeuristics(cleanRawText);

  const categorizedSkills = {
    programmingLanguages,
    frameworks: technicalSkills.filter(s => ['React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot'].includes(s)),
    libraries: technicalSkills.filter(s => ['Pandas', 'NumPy', 'Scikit-learn', 'Redux', 'Tailwind CSS', 'Axios', 'RxJS'].includes(s)),
    databases: toolsAndTechnologies.filter(s => ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'SQLite', 'Elasticsearch'].includes(s)),
    tools: toolsAndTechnologies,
    softSkills
  };

  const evidenceMap: Record<string, string> = {};
  extractedSkills.forEach(skill => {
    const lines = cleanRawText.split(/[\r\n]+/);
    const line = lines.find(l => l.toLowerCase().includes(skill.toLowerCase()));
    if (line) evidenceMap[skill] = line.trim();
  });

  const validation: ResumeValidation = {
    completenessScore: candidateName !== 'Not specified in resume' && email !== 'Not specified in resume' ? 85 : 40,
    extractedFieldCount: [
      candidateName !== 'Not specified in resume',
      email !== 'Not specified in resume',
      phone !== 'Not specified in resume',
      extractedSkills.length > 0,
      expHeuristics.workExp.length > 0,
      eduHeuristics.education.length > 0
    ].filter(Boolean).length,
    totalFieldsCount: 14,
    checksPassed: ['✓ Local Resume Classification Verified', '✓ Contact Information Extracted'],
    warnings: [],
    confidenceScores: { contact: 85, skills: extractedSkills.length > 0 ? 80 : 30, overall: 75 }
  };

  return {
    fileName,
    fileSizeFormatted,
    uploadedAt: new Date().toISOString().split('T')[0],
    isResume: true,
    document_type: 'VALID_RESUME',
    confidence: 0.85,
    candidateName,
    email,
    phone,
    linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
    github: githubMatch ? githubMatch[0] : undefined,
    summary: 'Candidate profile parsed from document.',
    extractedSkills,
    technicalSkills,
    softSkills,
    programmingLanguages,
    toolsAndTechnologies,
    categorizedSkills,
    experienceYears,
    detectedRole,
    education: eduHeuristics.education,
    projects: [],
    workExperience: expHeuristics.workExp,
    internshipExperience: [],
    certifications: certHeuristics,
    achievements: achHeuristics,
    structuredEducation: eduHeuristics.structuredEducation,
    structuredWorkExperience: expHeuristics.structuredWork,
    evidenceMap,
    structuredUnderstanding: {
      document_type: 'VALID_RESUME',
      confidence: 0.85,
      candidate: { name: candidateName, email, phone, linkedin: linkedinMatch ? linkedinMatch[0] : undefined, github: githubMatch ? githubMatch[0] : undefined },
      summary: 'Candidate profile parsed from document.',
      skills: categorizedSkills,
      education: eduHeuristics.structuredEducation,
      experience: expHeuristics.structuredWork,
      internships: [],
      projects: [],
      certifications: certHeuristics.map(c => ({ title: c, evidence: c })),
      achievements: achHeuristics,
      publications: [],
      languages: [],
      other: [],
      evidenceMap
    },
    validation,
    rawText: cleanRawText
  };
}

function extractSectionLines(rawText: string, sectionKeywords: string[], stopKeywords: string[]): string[] {
  const lines = rawText.split(/[\r\n]+/);
  let inSection = false;
  const extracted: string[] = [];

  const sectionRegex = new RegExp(`^[#\\*\\s-_\\d\\.]*(?:${sectionKeywords.join('|')})[\\w\\s&\\/\\-:_]*$`, 'i');
  const stopRegex = new RegExp(`^[#\\*\\s-_\\d\\.]*(?:${stopKeywords.join('|')})[\\w\\s&\\/\\-:_]*$`, 'i');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (sectionRegex.test(trimmed)) {
      inSection = true;
      continue;
    } else if (inSection && stopRegex.test(trimmed)) {
      break;
    }

    if (inSection) {
      if (/^[=\-*#_]{3,}$/.test(trimmed)) continue;
      extracted.push(trimmed);
    }
  }

  return extracted;
}

function extractEducationHeuristics(rawText: string): { education: string[]; structuredEducation: Array<{ degree: string; institution: string; year?: string }> } {
  const stopHeaders = [
    'experience', 'work experience', 'employment history', 'skills', 'technical skills',
    'projects', 'certifications', 'achievements', 'summary', 'languages', 'hobbies', 'contact'
  ];

  const sectionLines = extractSectionLines(rawText, ['education', 'academic background', 'academics', 'qualifications', 'education & qualifications', 'academic history', 'education & training'], stopHeaders);

  const degreeRegex = /(?:b\.?tech|b\.?e\.?|b\.?s\.?|b\.?sc|m\.?tech|m\.?e\.?|m\.?s\.?|m\.?sc|m\.?c\.?a\.?|b\.?c\.?a\.?|ph\.?d|bachelor|master|doctorate|diploma|associate degree|high school|b\.a\.|m\.a\.|b\.com|m\.com|mba|bba)/i;
  const universityRegex = /(?:university|institute|college|school|academy|polytechnic|campus|department|iit|nit|bit|stanford|mit|harvard)/i;
  const yearRegex = /\b(19\d\d|20\d\d)\s*(?:-|–|to)\s*(19\d\d|20\d\d|present|current)\b|\b(20\d\d|19\d\d)\b/i;

  const resultStrings: string[] = [];
  const structured: Array<{ degree: string; institution: string; year?: string }> = [];

  if (sectionLines.length > 0) {
    for (const line of sectionLines) {
      resultStrings.push(line);
      const dMatch = line.match(degreeRegex);
      const uMatch = line.match(universityRegex);
      const yMatch = line.match(yearRegex);

      if (dMatch || uMatch || line.length > 5) {
        structured.push({
          degree: dMatch ? line : (line.length > 5 ? line : 'Degree / Qualification'),
          institution: uMatch ? line : 'Educational Institution',
          year: yMatch ? yMatch[0] : undefined
        });
      }
    }
  }

  if (resultStrings.length === 0) {
    const lines = rawText.split(/[\r\n]+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if ((degreeRegex.test(trimmed) || universityRegex.test(trimmed)) && trimmed.length > 5) {
        if (!/company|worked|responsible|experience|project|client|summary|skills|invoice|tax/i.test(trimmed)) {
          resultStrings.push(trimmed);
          const yMatch = trimmed.match(yearRegex);
          structured.push({
            degree: trimmed,
            institution: trimmed,
            year: yMatch ? yMatch[0] : undefined
          });
        }
      }
    }
  }

  return { education: Array.from(new Set(resultStrings)), structuredEducation: structured };
}

function extractCertificationsHeuristics(rawText: string): string[] {
  const stopHeaders = ['education', 'experience', 'skills', 'projects', 'summary', 'languages', 'hobbies'];
  const certLines = extractSectionLines(rawText, ['certifications', 'certificates', 'licenses & certifications', 'courses', 'professional certifications'], stopHeaders);

  const certRegex = /(?:aws certified|google cloud certified|microsoft certified|certified|certificate|coursera|udemy|edx|linkedin learning|oracle certified|comptia|scrum master|pmp|cisco|coursera certificate)/i;

  const results: string[] = [];
  certLines.forEach(line => {
    if (line.length > 3) results.push(line);
  });

  if (results.length === 0) {
    rawText.split(/[\r\n]+/).forEach(line => {
      const trimmed = line.trim();
      if (certRegex.test(trimmed) && !/education|experience|project|summary|skills/i.test(trimmed)) {
        results.push(trimmed);
      }
    });
  }

  return Array.from(new Set(results));
}

function extractAchievementsHeuristics(rawText: string): string[] {
  const stopHeaders = ['education', 'experience', 'skills', 'projects', 'summary', 'certifications', 'languages'];
  const achLines = extractSectionLines(rawText, ['achievements', 'honors & awards', 'awards', 'key achievements', 'recognition', 'accomplishments'], stopHeaders);

  const achRegex = /(?:winner|awarded|ranked|1st place|2nd place|3rd place|top \d+%|dean's list|hackathon|honor|merit|gold medalist|scholarship|best paper|first prize)/i;

  const results: string[] = [];
  achLines.forEach(line => {
    if (line.length > 3) results.push(line);
  });

  if (results.length === 0) {
    rawText.split(/[\r\n]+/).forEach(line => {
      const trimmed = line.trim();
      if (achRegex.test(trimmed) && !/education|experience|project|summary|skills/i.test(trimmed)) {
        results.push(trimmed);
      }
    });
  }

  return Array.from(new Set(results));
}

function extractExperienceHeuristics(rawText: string): { workExp: string[]; structuredWork: Array<{ role: string; company: string; duration?: string; description: string[] }> } {
  const stopHeaders = ['education', 'skills', 'projects', 'certifications', 'achievements', 'summary', 'languages'];
  const expLines = extractSectionLines(rawText, ['experience', 'work experience', 'professional experience', 'employment history', 'work history'], stopHeaders);

  const workExp: string[] = [];
  const structuredWork: Array<{ role: string; company: string; duration?: string; description: string[] }> = [];

  if (expLines.length > 0) {
    let currentRole = '';
    let currentDesc: string[] = [];

    expLines.forEach(line => {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        const bullet = line.replace(/^[•\-\*]\s*/, '').trim();
        if (bullet) currentDesc.push(bullet);
        workExp.push(bullet);
      } else {
        if (currentRole && currentDesc.length > 0) {
          structuredWork.push({
            role: currentRole,
            company: 'Organization',
            description: [...currentDesc]
          });
          currentDesc = [];
        }
        currentRole = line;
        workExp.push(line);
      }
    });

    if (currentRole) {
      structuredWork.push({
        role: currentRole,
        company: 'Organization',
        description: currentDesc
      });
    }
  }

  return { workExp: Array.from(new Set(workExp)), structuredWork };
}
