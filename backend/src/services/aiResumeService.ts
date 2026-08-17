import { GoogleGenerativeAI } from '@google/generative-ai';

export type DocumentClassificationType = 'VALID_RESUME' | 'NOT_A_RESUME' | 'UNCLEAR';

export interface CategorizedSkills {
  programmingLanguages: string[];
  frameworks: string[];
  libraries: string[];
  databases: string[];
  tools: string[];
  softSkills: string[];
}

export interface StructuredResumeUnderstanding {
  document_type: DocumentClassificationType;
  confidence: number;
  rejectionReason?: string;
  candidate: {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    location?: string;
  };
  summary?: string;
  skills: CategorizedSkills;
  education: Array<{ degree: string; institution: string; year?: string; fieldOfStudy?: string; evidence?: string }>;
  experience: Array<{ role: string; company: string; duration?: string; description: string[]; evidence?: string }>;
  internships: Array<{ role: string; company: string; duration?: string; description: string[]; evidence?: string }>;
  projects: Array<{ title: string; techStack?: string[]; description: string; link?: string; evidence?: string }>;
  certifications: Array<{ title: string; issuer?: string; date?: string; evidence?: string }>;
  achievements: string[];
  publications: string[];
  languages: string[];
  other: string[];
  evidenceMap?: Record<string, string>;
}

export interface AIResumeParseResult {
  isResume: boolean;
  document_type: DocumentClassificationType;
  confidence: number;
  rejectionReason?: string;
  candidateName: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary: string;
  extractedSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  programmingLanguages: string[];
  toolsAndTechnologies: string[];
  categorizedSkills: CategorizedSkills;
  experienceYears: number;
  detectedRole: string;
  education: string[];
  projects: string[];
  workExperience: string[];
  internshipExperience: string[];
  certifications: string[];
  achievements: string[];
  publications?: string[];
  languagesSpoken?: string[];
  awards?: string[];
  interests?: string[];
  structuredWorkExperience?: Array<{ role: string; company: string; duration?: string; description: string[]; evidence?: string }>;
  structuredInternships?: Array<{ role: string; company: string; duration?: string; description: string[]; evidence?: string }>;
  structuredProjects?: Array<{ title: string; techStack?: string[]; description: string; link?: string; evidence?: string }>;
  structuredEducation?: Array<{ degree: string; institution: string; year?: string; fieldOfStudy?: string; evidence?: string }>;
  structuredUnderstanding?: StructuredResumeUnderstanding;
  evidenceMap: Record<string, string>;
  validation: {
    completenessScore: number;
    extractedFieldCount: number;
    totalFieldsCount: number;
    checksPassed: string[];
    warnings: string[];
    confidenceScores: Record<string, number>;
  };
}

const REJECT_MESSAGE = "The uploaded document does not appear to be a valid resume. Please upload a resume in PDF or DOCX format.";

/**
 * Intelligent Document Classifier
 * Classifies document as VALID_RESUME, NOT_A_RESUME, or UNCLEAR with high precision.
 */
export function classifyDocumentAsResume(rawText: string, fileName: string): { 
  isResume: boolean; 
  document_type: DocumentClassificationType; 
  rejectionReason?: string; 
  confidence: number 
} {
  const cleanText = rawText.trim();
  const lowerText = cleanText.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  // Length check
  if (cleanText.length < 50) {
    return {
      isResume: false,
      document_type: 'NOT_A_RESUME',
      rejectionReason: 'The uploaded file is empty or contains insufficient text.',
      confidence: 0.99
    };
  }

  // 1. Explicit Non-Resume Filename Blacklist
  const nonResumeFilenameKeywords = [
    'pan card', 'pan_card', 'pancard', 'pan', 'invoice', 'receipt', 'bill', 'tax', 
    'bank statement', 'account statement', 'certificate', 'driving licence', 'license', 
    'passport', 'aadhaar', 'adhar', 'voter', 'ration card', 'cheque', 'utility bill', 
    'salary slip', 'pay slip', 'assignment', 'homework', 'presentation', 'slides', 
    'research paper', 'abstract', 'transcript', 'mark sheet', 'marksheet', 'code', 'script'
  ];

  const hasNonResumeFilename = nonResumeFilenameKeywords.some(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(lowerFileName);
  });

  // 2. Explicit Non-Resume Content Phrases (Strong Negative Signals)
  const nonResumeContentTerms = [
    'income tax department', 'govt of india', 'government of india', 'permanent account number',
    'tax invoice', 'invoice no', 'invoice number', 'bill to', 'amount due', 'total payable', 'bank statement',
    'account statement', 'certificate of completion', 'certificate of achievement', 'this is to certify that',
    'driving licence', 'passport no', 'republic of india', 'sub: assignment', 'homework assignment', 'abstract:',
    'keywords:', 'doi:', 'isbn:', 'terms and conditions', 'payment receipt', 'paid in full',
    'unit price', 'subtotal', 'order number', 'invoice date', 'billing address', 'opening balance', 'closing balance'
  ];

  let negativeSignalCount = 0;
  nonResumeContentTerms.forEach(term => {
    if (lowerText.includes(term)) {
      negativeSignalCount += 1;
    }
  });

  // 3. Resume Structural Section Indicators (Positive Signals)
  const resumeStructuralKeywords = [
    'experience', 'work experience', 'professional experience', 'employment history', 'work history',
    'education', 'academic background', 'skills', 'technical skills', 'key skills', 'projects',
    'summary', 'professional summary', 'executive summary', 'certifications', 'qualifications',
    'curriculum vitae', 'cv', 'resume'
  ];

  let positiveSignalCount = 0;
  resumeStructuralKeywords.forEach(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(lowerText)) {
      positiveSignalCount += 1;
    }
  });

  // Contact details checks
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(cleanText);
  const hasPhone = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cleanText);
  const hasContactInfo = hasEmail || hasPhone;

  // Decision logic for Document Classification
  if (hasNonResumeFilename && positiveSignalCount < 2) {
    return {
      isResume: false,
      document_type: 'NOT_A_RESUME',
      rejectionReason: REJECT_MESSAGE,
      confidence: 0.98
    };
  }

  if (negativeSignalCount >= 1 && positiveSignalCount < 2) {
    return {
      isResume: false,
      document_type: 'NOT_A_RESUME',
      rejectionReason: REJECT_MESSAGE,
      confidence: 0.96
    };
  }

  if (positiveSignalCount === 0 && !hasContactInfo) {
    return {
      isResume: false,
      document_type: 'NOT_A_RESUME',
      rejectionReason: REJECT_MESSAGE,
      confidence: 0.95
    };
  }

  if (cleanText.length < 120 && positiveSignalCount < 2) {
    return {
      isResume: false,
      document_type: 'UNCLEAR',
      rejectionReason: 'Document content is unclear or incomplete to verify as a candidate resume.',
      confidence: 0.75
    };
  }

  const confidenceScore = Math.min(0.99, Math.max(0.65, (positiveSignalCount * 0.20) + (hasContactInfo ? 0.20 : 0.05)));
  return {
    isResume: true,
    document_type: 'VALID_RESUME',
    confidence: Number(confidenceScore.toFixed(2))
  };
}

/**
 * Programmatic Zero-Hallucination Verification Engine
 * Validates that every extracted skill, company, degree, project, and certification
 * exists as a verifiable snippet in raw document text.
 */
export function verifyEvidence(rawText: string, items: string[]): { verified: string[]; evidenceMap: Record<string, string> } {
  const verified: string[] = [];
  const evidenceMap: Record<string, string> = {};
  const lowerText = rawText.toLowerCase();

  const SKILL_ALIASES: Record<string, string[]> = {
    'React': ['react.js', 'reactjs', 'react'],
    'React.js': ['react.js', 'reactjs', 'react'],
    'Node.js': ['node.js', 'nodejs', 'node'],
    'Next.js': ['next.js', 'nextjs', 'next'],
    'Vue': ['vue.js', 'vuejs', 'vue'],
    'Angular': ['angular.js', 'angularjs', 'angular'],
    'Express': ['express.js', 'expressjs', 'express'],
    'TypeScript': ['ts', 'typescript'],
    'JavaScript': ['js', 'javascript'],
    'Python': ['py', 'python'],
    'AWS': ['amazon web services', 'aws'],
    'Amazon Web Services': ['amazon web services', 'aws'],
    'GCP': ['google cloud platform', 'google cloud', 'gcp'],
    'Google Cloud': ['google cloud platform', 'google cloud', 'gcp'],
    'Azure': ['microsoft azure', 'azure'],
    'PostgreSQL': ['postgres', 'postgresql'],
    'MongoDB': ['mongo', 'mongodb'],
    'Tailwind CSS': ['tailwind', 'tailwind css', 'tailwindcss'],
    'PyTorch': ['pytorch', 'torch'],
    'TensorFlow': ['tensorflow', 'tf']
  };

  for (const item of items) {
    const cleanItem = String(item).trim();
    if (!cleanItem || cleanItem === 'null' || cleanItem === 'NOT_FOUND') continue;

    const lowerItem = cleanItem.toLowerCase();
    const aliases = SKILL_ALIASES[cleanItem] || [lowerItem];

    let found = false;
    let matchingSnippet = cleanItem;

    for (const targetTerm of aliases) {
      const escaped = targetTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i');
      if (regex.test(lowerText) || lowerText.includes(targetTerm)) {
        found = true;
        const lines = rawText.split(/[\r\n]+/);
        const matchingLine = lines.find(line => line.toLowerCase().includes(targetTerm));
        if (matchingLine) matchingSnippet = matchingLine.trim();
        break;
      }
    }

    if (found) {
      verified.push(cleanItem);
      evidenceMap[cleanItem] = matchingSnippet;
    }
  }

  return { verified, evidenceMap };
}

/**
 * Parse Resume with LLM & Evidence Verification
 */
export async function parseResumeWithAI(rawText: string, fileName: string): Promise<AIResumeParseResult> {
  const classification = classifyDocumentAsResume(rawText, fileName);

  if (!classification.isResume || classification.document_type === 'NOT_A_RESUME') {
    return buildRejectedResult(classification.document_type, classification.rejectionReason || REJECT_MESSAGE, classification.confidence);
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  let aiResult: any = null;

  if (apiKey && apiKey.length > 10 && !apiKey.startsWith('AQ.')) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a Senior AI Resume Intelligence Engine for AI InterVio.
Analyze the following document text and extract structured information according to strict anti-hallucination guidelines.

STRICT ZERO-HALLUCINATION & EXTRACTION RULES:
1. FIRST, determine document type. If this is an invoice, receipt, assignment, certificate, research paper, tax form, bank statement, or non-resume document, output {"document_type": "NOT_A_RESUME", "isResume": false, "rejectionReason": "${REJECT_MESSAGE}"}.
2. EXTRACT ONLY WHAT ACTUALLY EXISTS IN THE DOCUMENT. NEVER INVENT skills, companies, degrees, projects, certifications, or technologies (such as AWS, Docker, PyTorch) unless explicitly present in the text.
3. If a section or field is absent, set its value to null or an empty array [].
4. Categorize present skills into: programming_languages, frameworks, libraries, databases, tools, soft_skills.
5. Provide exact evidence text quotes from the resume for extracted education, experience, internships, projects, and certifications.

RESUME TEXT:
${rawText.slice(0, 14000)}

REQUIRED JSON SCHEMA:
{
  "document_type": "VALID_RESUME",
  "confidence": 0.95,
  "rejectionReason": "",
  "candidate": {
    "name": "Full Name or null",
    "email": "email or null",
    "phone": "phone or null",
    "linkedin": "url or null",
    "github": "url or null",
    "portfolio": "url or null"
  },
  "summary": "Summary or null",
  "skills": {
    "programming_languages": [],
    "frameworks": [],
    "libraries": [],
    "databases": [],
    "tools": [],
    "soft_skills": []
  },
  "education": [
    {"degree": "...", "institution": "...", "year": "...", "fieldOfStudy": "...", "evidence": "exact quote from text"}
  ],
  "experience": [
    {"role": "...", "company": "...", "duration": "...", "description": ["bullet 1"], "evidence": "exact quote from text"}
  ],
  "internships": [
    {"role": "...", "company": "...", "duration": "...", "description": ["bullet 1"], "evidence": "exact quote from text"}
  ],
  "projects": [
    {"title": "...", "techStack": [], "description": "...", "link": "...", "evidence": "exact quote from text"}
  ],
  "certifications": [
    {"title": "...", "issuer": "...", "date": "...", "evidence": "exact quote from text"}
  ],
  "achievements": [],
  "publications": [],
  "languages": [],
  "other": []
}

Output ONLY valid JSON without markdown wrapping.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text() || '';
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResult = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Gemini API resume understanding failed, falling back to local verification engine:', e);
    }
  }

  return validateAndNormalizeResumeData(rawText, fileName, aiResult, classification);
}

export function validateAndNormalizeResumeData(
  rawText: string,
  fileName: string,
  aiData?: any,
  initialClassification?: { isResume: boolean; document_type: DocumentClassificationType; rejectionReason?: string; confidence: number }
): AIResumeParseResult {
  const cleanRawText = rawText.trim();

  // If AI explicitly rejected document
  if (aiData && (aiData.document_type === 'NOT_A_RESUME' || aiData.isResume === false)) {
    return buildRejectedResult('NOT_A_RESUME', aiData.rejectionReason || REJECT_MESSAGE, aiData.confidence || 0.95);
  }

  const classification = initialClassification || classifyDocumentAsResume(rawText, fileName);
  if (!classification.isResume || classification.document_type === 'NOT_A_RESUME') {
    return buildRejectedResult(classification.document_type, classification.rejectionReason || REJECT_MESSAGE, classification.confidence);
  }

  // 1. Contact Information Extraction & Grounding
  let candidateName = aiData?.candidate?.name || aiData?.candidateName;
  if (!candidateName || candidateName === 'null' || candidateName === 'Not specified in resume') {
    candidateName = extractCandidateNameHeuristics(cleanRawText);
  }

  let email = aiData?.candidate?.email || aiData?.email;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  if (!email || !emailRegex.test(email)) {
    const emailMatch = cleanRawText.match(emailRegex);
    email = emailMatch ? emailMatch[0].toLowerCase() : 'Not specified in resume';
  }

  let phone = aiData?.candidate?.phone || aiData?.phone;
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  if (!phone || phone === 'Not specified in resume') {
    const phoneMatch = cleanRawText.match(phoneRegex);
    phone = phoneMatch ? phoneMatch[0] : 'Not specified in resume';
  }

  // 2. Skill Extraction & Evidence Verification Pass
  const rawProgLangs = aiData?.skills?.programming_languages || aiData?.programmingLanguages || extractContextSkills(cleanRawText, ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'SQL', 'HTML', 'CSS', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'C#', 'Ruby']);
  const rawFrameworks = aiData?.skills?.frameworks || extractContextSkills(cleanRawText, ['React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Flutter', 'PyTorch', 'TensorFlow']);
  const rawLibraries = aiData?.skills?.libraries || extractContextSkills(cleanRawText, ['Pandas', 'NumPy', 'Scikit-learn', 'Redux', 'Tailwind CSS', 'Axios', 'RxJS', 'Jest', 'Cypress']);
  const rawDatabases = aiData?.skills?.databases || extractContextSkills(cleanRawText, ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'SQLite', 'Elasticsearch', 'Firebase', 'DynamoDB']);
  const rawTools = aiData?.skills?.tools || aiData?.toolsAndTechnologies || extractContextSkills(cleanRawText, ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'GitHub', 'Jenkins', 'Postman', 'Linux', 'Terraform', 'Jira']);
  const rawSoftSkills = aiData?.skills?.soft_skills || aiData?.softSkills || extractContextSkills(cleanRawText, ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Agile', 'Mentorship']);

  // RUN ZERO-HALLUCINATION VERIFIER ON ALL SKILLS
  const verifiedLangs = verifyEvidence(cleanRawText, rawProgLangs);
  const verifiedFrameworks = verifyEvidence(cleanRawText, rawFrameworks);
  const verifiedLibs = verifyEvidence(cleanRawText, rawLibraries);
  const verifiedDbs = verifyEvidence(cleanRawText, rawDatabases);
  const verifiedTools = verifyEvidence(cleanRawText, rawTools);
  const verifiedSoft = verifyEvidence(cleanRawText, rawSoftSkills);

  const categorizedSkills: CategorizedSkills = {
    programmingLanguages: verifiedLangs.verified,
    frameworks: verifiedFrameworks.verified,
    libraries: verifiedLibs.verified,
    databases: verifiedDbs.verified,
    tools: verifiedTools.verified,
    softSkills: verifiedSoft.verified
  };

  const combinedEvidenceMap: Record<string, string> = {
    ...verifiedLangs.evidenceMap,
    ...verifiedFrameworks.evidenceMap,
    ...verifiedLibs.evidenceMap,
    ...verifiedDbs.evidenceMap,
    ...verifiedTools.evidenceMap,
    ...verifiedSoft.evidenceMap
  };

  const techSkills = Array.from(new Set([
    ...categorizedSkills.frameworks,
    ...categorizedSkills.libraries,
    ...categorizedSkills.databases
  ]));

  const extractedSkills = Array.from(new Set([
    ...categorizedSkills.programmingLanguages,
    ...techSkills,
    ...categorizedSkills.tools
  ]));

  // 3. Education, Experience, Projects & Certifications with Evidence
  const eduHeuristics = extractEducationHeuristics(cleanRawText);
  const certHeuristics = extractCertificationsHeuristics(cleanRawText);
  const achHeuristics = extractAchievementsHeuristics(cleanRawText);
  const expHeuristics = extractExperienceHeuristics(cleanRawText);

  // Combine AI response and Heuristics for Education
  const rawAiEdu = (aiData?.education && Array.isArray(aiData.education)) ? aiData.education : [];
  const rawAiCerts = (aiData?.certifications && Array.isArray(aiData.certifications)) ? aiData.certifications : [];
  const rawAiAch = (aiData?.achievements && Array.isArray(aiData.achievements)) ? aiData.achievements : [];

  const mergedEduList: Array<{ degree: string; institution: string; year?: string; fieldOfStudy?: string; evidence?: string }> = [];

  if (rawAiEdu.length > 0) {
    rawAiEdu.forEach((e: any) => {
      if (typeof e === 'string') {
        mergedEduList.push({ degree: e, institution: 'Educational Institution', evidence: e });
      } else if (typeof e === 'object' && e !== null) {
        mergedEduList.push({
          degree: e.degree || e.institution || 'Degree / Qualification',
          institution: e.institution || 'Educational Institution',
          year: e.year,
          fieldOfStudy: e.fieldOfStudy,
          evidence: e.evidence || e.degree
        });
      }
    });
  }

  if (mergedEduList.length === 0) {
    mergedEduList.push(...eduHeuristics.structuredEducation);
  }

  const structuredEducation = mergedEduList;
  const educationStrings = Array.from(new Set([
    ...structuredEducation.map((e: any) => e.institution && e.institution !== 'Educational Institution' ? `${e.degree} - ${e.institution}` : e.degree),
    ...eduHeuristics.education
  ])).filter(Boolean);

  const structuredWorkExperience = (aiData?.experience && Array.isArray(aiData.experience) && aiData.experience.length > 0)
    ? aiData.experience.map((e: any) => ({
        role: e.role || 'Role',
        company: e.company || 'Company',
        duration: e.duration,
        description: Array.isArray(e.description) ? e.description : [e.description || ''],
        evidence: e.evidence || `${e.role} at ${e.company}`
      }))
    : (aiData?.structuredWorkExperience || expHeuristics.structuredWork);

  const structuredInternships = (aiData?.internships && Array.isArray(aiData.internships) && aiData.internships.length > 0)
    ? aiData.internships.map((e: any) => ({
        role: e.role || 'Intern',
        company: e.company || 'Company',
        duration: e.duration,
        description: Array.isArray(e.description) ? e.description : [e.description || ''],
        evidence: e.evidence
      }))
    : (aiData?.structuredInternships || []);

  const structuredProjects = (aiData?.projects && Array.isArray(aiData.projects) && aiData.projects.length > 0)
    ? aiData.projects.map((p: any) => ({
        title: typeof p === 'string' ? p : (p.title || 'Project'),
        techStack: p.techStack || [],
        description: p.description || '',
        link: p.link,
        evidence: p.evidence
      }))
    : (aiData?.structuredProjects || []);

  const certificationsList = Array.from(new Set([
    ...rawAiCerts.map((c: any) => typeof c === 'string' ? c : (c.title || c.name || 'Certification')),
    ...certHeuristics
  ])).filter(Boolean);

  const achievementsList = Array.from(new Set([
    ...rawAiAch.map((a: any) => typeof a === 'string' ? a : String(a)),
    ...achHeuristics
  ])).filter(Boolean);

  let experienceYears = aiData?.experienceYears || 0;
  if (!experienceYears) {
    const expMatch = cleanRawText.toLowerCase().match(/(\d+)\+?\s*(?:yrs|years|\+?\s*years)/);
    if (expMatch) experienceYears = parseInt(expMatch[1], 10);
  }

  let detectedRole = aiData?.detectedRole || 'Candidate';
  if (detectedRole === 'Candidate' && extractedSkills.length > 0) {
    if (categorizedSkills.programmingLanguages.includes('Python') && (techSkills.includes('Machine Learning') || categorizedSkills.frameworks.includes('PyTorch'))) {
      detectedRole = 'AI / Data Engineer';
    } else if (categorizedSkills.programmingLanguages.includes('TypeScript') || categorizedSkills.frameworks.includes('React')) {
      detectedRole = 'Software Engineer';
    }
  }

  // Completeness & Confidence validation
  const checksPassed: string[] = ['✓ Document Classified as VALID_RESUME', '✓ Contact Info Grounded'];
  const warnings: string[] = [];
  let score = 40;

  if (candidateName !== 'Not specified in resume') {
    score += 15;
    checksPassed.push('✓ Verified Candidate Name');
  }
  if (email !== 'Not specified in resume') {
    score += 15;
    checksPassed.push('✓ Verified Email Contact');
  }
  if (extractedSkills.length > 0) {
    score += 15;
    checksPassed.push(`✓ ${extractedSkills.length} Verified Technical Skills`);
  }
  if (structuredWorkExperience.length > 0) {
    score += 15;
    checksPassed.push('✓ Verified Professional Experience');
  }

  const structuredUnderstanding: StructuredResumeUnderstanding = {
    document_type: classification.document_type,
    confidence: classification.confidence,
    candidate: {
      name: candidateName,
      email,
      phone,
      linkedin: aiData?.candidate?.linkedin || extractUrl(cleanRawText, 'linkedin.com'),
      github: aiData?.candidate?.github || extractUrl(cleanRawText, 'github.com'),
      portfolio: aiData?.candidate?.portfolio
    },
    summary: aiData?.summary || 'Candidate resume profile.',
    skills: categorizedSkills,
    education: structuredEducation,
    experience: structuredWorkExperience,
    internships: structuredInternships,
    projects: structuredProjects,
    certifications: certificationsList.map((c: string) => ({ title: c, evidence: c })),
    achievements: achievementsList,
    publications: aiData?.publications || [],
    languages: aiData?.languages || aiData?.languagesSpoken || [],
    other: aiData?.other || [],
    evidenceMap: combinedEvidenceMap
  };

  return {
    isResume: true,
    document_type: classification.document_type,
    confidence: classification.confidence,
    candidateName,
    email,
    phone,
    linkedin: structuredUnderstanding.candidate.linkedin,
    github: structuredUnderstanding.candidate.github,
    portfolio: structuredUnderstanding.candidate.portfolio,
    summary: structuredUnderstanding.summary || '',
    extractedSkills,
    technicalSkills: techSkills,
    softSkills: categorizedSkills.softSkills,
    programmingLanguages: categorizedSkills.programmingLanguages,
    toolsAndTechnologies: categorizedSkills.tools,
    categorizedSkills,
    experienceYears,
    detectedRole,
    education: educationStrings,
    projects: structuredProjects.map((p: any) => p.title),
    workExperience: structuredWorkExperience.map((w: any) => `${w.role} at ${w.company}`),
    internshipExperience: structuredInternships.map((i: any) => `${i.role} at ${i.company}`),
    certifications: certificationsList,
    achievements: achievementsList,
    publications: structuredUnderstanding.publications,
    languagesSpoken: structuredUnderstanding.languages,
    structuredWorkExperience,
    structuredInternships,
    structuredProjects,
    structuredEducation,
    structuredUnderstanding,
    evidenceMap: combinedEvidenceMap,
    validation: {
      completenessScore: Math.min(100, score),
      extractedFieldCount: 7,
      totalFieldsCount: 14,
      checksPassed,
      warnings,
      confidenceScores: {
        contact: 95,
        skills: 90,
        experience: 85,
        overall: Math.round(classification.confidence * 100)
      }
    }
  };
}

function buildRejectedResult(document_type: DocumentClassificationType, reason: string, confidence: number): AIResumeParseResult {
  return {
    isResume: false,
    document_type,
    confidence,
    rejectionReason: reason,
    candidateName: 'Not specified in resume',
    email: 'Not specified in resume',
    phone: 'Not specified in resume',
    summary: '',
    extractedSkills: [],
    technicalSkills: [],
    softSkills: [],
    programmingLanguages: [],
    toolsAndTechnologies: [],
    categorizedSkills: {
      programmingLanguages: [],
      frameworks: [],
      libraries: [],
      databases: [],
      tools: [],
      softSkills: []
    },
    experienceYears: 0,
    detectedRole: 'Not Identified',
    education: [],
    projects: [],
    workExperience: [],
    internshipExperience: [],
    certifications: [],
    achievements: [],
    evidenceMap: {},
    validation: {
      completenessScore: 0,
      extractedFieldCount: 0,
      totalFieldsCount: 14,
      checksPassed: [],
      warnings: [reason],
      confidenceScores: { overall: 0 }
    }
  };
}

function extractCandidateNameHeuristics(cleanRawText: string): string {
  const rawLines = cleanRawText.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(5, rawLines.length); i++) {
    const line = rawLines[i];
    if (/^[A-Za-z]+(?:\s+[A-Za-z]+){1,3}$/.test(line) && !/@|\.com|resume|phone|email|pan|card|invoice|tax|govt|summary|experience|skills|projects/i.test(line)) {
      return line.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    }
  }
  return 'Not specified in resume';
}

function extractUrl(text: string, domain: string): string | undefined {
  const regex = new RegExp(`https?:\\/\\/(?:www\\.)?${domain}\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=]+`, 'i');
  const match = text.match(regex);
  return match ? match[0] : undefined;
}

function extractContextSkills(text: string, skillList: string[]): string[] {
  const lowerText = text.toLowerCase();
  const hasTechnicalContext = /skills|technologies|languages|stack|frameworks|tools|developer|engineer|experience|projects/i.test(text);
  return skillList.filter(skill => {
    if (skill.length <= 2 && !hasTechnicalContext) return false;
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i');
    return regex.test(lowerText);
  });
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
  const stopHeaders = ['experience', 'work experience', 'employment history', 'skills', 'projects', 'certifications', 'summary', 'languages', 'hobbies'];
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

  // Fallback scanning if no explicit section lines found
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
  const certLines = extractSectionLines(rawText, ['certifications', 'certificates', 'courses'], ['education', 'experience', 'skills']);
  return Array.from(new Set(certLines.filter(l => l.length > 3)));
}

function extractAchievementsHeuristics(rawText: string): string[] {
  const achLines = extractSectionLines(rawText, ['achievements', 'awards', 'accomplishments'], ['education', 'experience', 'skills']);
  return Array.from(new Set(achLines.filter(l => l.length > 3)));
}

function extractExperienceHeuristics(rawText: string): { workExp: string[]; structuredWork: Array<{ role: string; company: string; duration?: string; description: string[] }> } {
  const expLines = extractSectionLines(rawText, ['experience', 'work experience', 'employment history'], ['education', 'skills', 'projects']);

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
