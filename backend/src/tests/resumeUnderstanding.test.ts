import { classifyDocumentAsResume, verifyEvidence, validateAndNormalizeResumeData } from '../services/aiResumeService';

function runTests() {
  console.log('=====================================================');
  console.log('AI INTERVIO - RESUME UNDERSTANDING SYSTEM TEST SUITE');
  console.log('=====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  // TEST 1: Valid Software Engineer Resume
  console.log('--- TEST GROUP 1: Valid Candidate Resumes ---');
  const validSoftwareDevResume = `
  ALEX RIVERA
  San Francisco, CA | alex.rivera@email.com | +1 (555) 234-5678 | linkedin.com/in/alexrivera | github.com/alexrivera
  
  PROFESSIONAL SUMMARY
  Full Stack Software Engineer with 4+ years of experience building web applications using TypeScript, React, Node.js, and PostgreSQL.

  WORK EXPERIENCE
  Senior Frontend Engineer | TechCorp Inc. | 2022 - Present
  • Architected scalable web interfaces using React, Next.js, and TypeScript, serving 500k active users.
  • Integrated PostgreSQL and Redis databases to reduce query latency by 40%.
  • Utilized Docker for local development and CI/CD pipelines.

  Software Developer Intern | Innovate Labs | 2020 - 2021
  • Built REST APIs using Node.js and Express.

  TECHNICAL SKILLS
  Programming Languages: TypeScript, JavaScript, Python, SQL, HTML, CSS
  Frameworks & Libraries: React, Next.js, Express, Tailwind CSS
  Databases & Tools: PostgreSQL, Redis, Docker, Git, Linux

  EDUCATION
  Bachelor of Technology in Computer Science & Engineering
  University of California, Berkeley | Graduated 2021

  PROJECTS
  AI Mock Interviewer Platform
  • Developed real-time interview simulator using WebSockets and Next.js.
  
  CERTIFICATIONS
  AWS Certified Developer Associate
  `;

  const classification1 = classifyDocumentAsResume(validSoftwareDevResume, 'alex_rivera_resume.pdf');
  assert(classification1.isResume === true && classification1.document_type === 'VALID_RESUME', 'Classifies genuine Developer Resume as VALID_RESUME', `Got isResume=${classification1.isResume}, type=${classification1.document_type}`);

  const parsed1 = validateAndNormalizeResumeData(validSoftwareDevResume, 'alex_rivera_resume.pdf');
  assert(parsed1.candidateName === 'Alex Rivera', 'Extracts correct candidate name', `Got name: ${parsed1.candidateName}`);
  assert(parsed1.email === 'alex.rivera@email.com', 'Extracts candidate email', `Got email: ${parsed1.email}`);
  assert(parsed1.programmingLanguages.includes('TypeScript') && parsed1.programmingLanguages.includes('Python'), 'Extracts verified programming languages', `Got: ${parsed1.programmingLanguages.join(', ')}`);
  assert(parsed1.categorizedSkills.databases.includes('PostgreSQL') && parsed1.toolsAndTechnologies.includes('Docker'), 'Extracts verified tools & databases', `Databases: ${parsed1.categorizedSkills.databases.join(', ')} | Tools: ${parsed1.toolsAndTechnologies.join(', ')}`);
  
  // ZERO-HALLUCINATION CHECK: Ensure PyTorch, AWS (if not in text as skill), C# or Java are NOT fabricated
  assert(!parsed1.extractedSkills.includes('PyTorch') && !parsed1.extractedSkills.includes('Java'), 'Zero Hallucination Rule: Does NOT invent absent skills (PyTorch/Java)', `Skills extracted: ${parsed1.extractedSkills.join(', ')}`);
  assert(parsed1.evidenceMap['TypeScript'] !== undefined, 'Tracks evidence source snippet for extracted skills', `Evidence for TypeScript: ${parsed1.evidenceMap['TypeScript']}`);


  // TEST 2: Valid Data Science Resume (Academic / Multi-page)
  console.log('\n--- TEST GROUP 2: Academic & Research CV ---');
  const validDataScientistResume = `
  Dr. Eleanor Vance
  Email: eleanor.vance@university.edu | Phone: +1-415-555-0199
  
  EDUCATION
  Ph.D. in Computer Science | Stanford University (2018 - 2023)
  Bachelor of Science in Mathematics | MIT (2014 - 2018)

  RESEARCH & EXPERIENCE
  Senior AI Research Scientist | OpenAI Research | 2023 - Present
  • Trained Large Language Models using PyTorch and Distributed Computing.
  
  PUBLICATIONS
  • Vance et al., "Transformers in Large Scale Natural Language Processing", NeurIPS 2022.

  SKILLS
  Python, PyTorch, TensorFlow, C++, Pandas, NumPy, Scikit-learn
  `;

  const classification2 = classifyDocumentAsResume(validDataScientistResume, 'eleanor_vance_cv.pdf');
  assert(classification2.isResume === true && classification2.document_type === 'VALID_RESUME', 'Classifies Academic CV as VALID_RESUME');
  const parsed2 = validateAndNormalizeResumeData(validDataScientistResume, 'eleanor_vance_cv.pdf');
  assert(parsed2.categorizedSkills.frameworks.includes('PyTorch'), 'Extracts PyTorch framework correctly');


  // TEST 3: Tax Invoice Document (MUST REJECT)
  console.log('\n--- TEST GROUP 3: Non-Resume Document Safety Checks ---');
  const taxInvoiceDoc = `
  TAX INVOICE
  Invoice No: INV-2024-9941
  Date: 12/05/2024
  Bill To: Acme Corporation
  Services Rendered: Cloud Infrastructure Consulting
  Unit Price: $150/hr | Hours: 40 | Total Payable: $6,000.00
  Payment Receipt: Paid in Full via Wire Transfer
  Terms and Conditions apply.
  `;

  const classification3 = classifyDocumentAsResume(taxInvoiceDoc, 'invoice_9941.pdf');
  assert(classification3.isResume === false && classification3.document_type === 'NOT_A_RESUME', 'Rejects Tax Invoice PDF as NOT_A_RESUME', `Got isResume=${classification3.isResume}`);
  const parsed3 = validateAndNormalizeResumeData(taxInvoiceDoc, 'invoice_9941.pdf');
  assert(parsed3.extractedSkills.length === 0, 'Does NOT extract fake resume skills from Tax Invoice');


  // TEST 4: Homework Assignment PDF (MUST REJECT)
  const homeworkAssignmentDoc = `
  SUB: ASSIGNMENT 3 - DATA STRUCTURES & ALGORITHMS
  Course Code: CS101 | Instructor: Prof. Alan Turing
  Student ID: ST-88201
  Problem Statement 1: Implement a Binary Search Tree in C++.
  Submission Date: Oct 15, 2024
  `;

  const classification4 = classifyDocumentAsResume(homeworkAssignmentDoc, 'assignment_3.pdf');
  assert(classification4.isResume === false && classification4.document_type === 'NOT_A_RESUME', 'Rejects Homework Assignment PDF as NOT_A_RESUME');


  // TEST 5: Certificate of Completion (MUST REJECT)
  const certificateDoc = `
  CERTIFICATE OF COMPLETION
  This is to certify that John Smith has successfully completed the course
  "Advanced AWS Cloud Architecture" on Coursera.
  Certificate ID: AWS-99201-XYZ
  Date of Issuance: Jan 2024
  `;

  const classification5 = classifyDocumentAsResume(certificateDoc, 'certificate.pdf');
  assert(classification5.isResume === false && classification5.document_type === 'NOT_A_RESUME', 'Rejects standalone Certificate of Completion as NOT_A_RESUME');


  // TEST 6: Empty or Corrupted Document (MUST REJECT)
  const emptyDoc = `   `;
  const classification6 = classifyDocumentAsResume(emptyDoc, 'corrupt.pdf');
  assert(classification6.isResume === false, 'Rejects empty/corrupted document');


  // TEST 7: Zero-Hallucination Evidence Verifier Module
  console.log('\n--- TEST GROUP 4: Zero-Hallucination Evidence Verifier ---');
  const sampleText = "Candidate has hands-on experience with Python, React, PostgreSQL, and Docker.";
  const inputSkills = ["Python", "React", "PostgreSQL", "Docker", "TensorFlow", "Kubernetes", "AWS"];
  const verification = verifyEvidence(sampleText, inputSkills);

  assert(verification.verified.length === 4, 'Evidence verifier keeps exactly the 4 skills present in raw text', `Verified count: ${verification.verified.length}`);
  assert(!verification.verified.includes('TensorFlow') && !verification.verified.includes('AWS'), 'Purges unverified skills (TensorFlow & AWS)');
  assert(verification.evidenceMap['Python'] !== undefined, 'Maps evidence quote for Python');


  // TEST 8: Two-Column / Complex Layout Resume
  console.log('\n--- TEST GROUP 5: Complex Resume Layouts & Missing Sections ---');
  const twoColumnResume = `
  MARCUS CHEN
  Email: marcus.chen@tech.io | Phone: +1-206-555-0144 | Seattle, WA
  
  [COLUMN 1: SKILLS & EDUCATION]
  Technical Skills: TypeScript, Go, Docker, Kubernetes, GraphQL
  Education: B.Tech in Computer Science, University of Washington (2020)

  [COLUMN 2: EXPERIENCE & PROJECTS]
  Cloud Engineer | CloudNative Inc. | 2021 - Present
  • Deployed microservices architecture using Go, Docker, and Kubernetes.
  • Designed GraphQL APIs serving 10M daily requests.
  
  Projects:
  Microservice Telemetry Mesh - Built observability proxy using Go and Kubernetes.
  `;

  const classification8 = classifyDocumentAsResume(twoColumnResume, 'marcus_chen_cv.pdf');
  assert(classification8.isResume === true && classification8.document_type === 'VALID_RESUME', 'Classifies Two-Column Resume as VALID_RESUME');
  const parsed8 = validateAndNormalizeResumeData(twoColumnResume, 'marcus_chen_cv.pdf');
  assert(parsed8.programmingLanguages.includes('Go') && parsed8.toolsAndTechnologies.includes('Kubernetes'), 'Extracts skills from two-column layout correctly');
  assert(parsed8.certifications.length === 0, 'Leaves missing sections (Certifications) empty/null without hallucinating values');


  // TEST 9: Standalone Research Paper (MUST REJECT)
  const researchPaperDoc = `
  Abstract: We present an empirical study of low-rank adaptation techniques in transformer models.
  DOI: 10.1109/TPAMI.2024.3391021 | ISSN: 0162-8828
  Keywords: Deep Learning, Parameter Efficient Fine-Tuning, LoRA
  1. Introduction
  Recent advances in large language models have shown unprecedented capabilities...
  2. Related Work
  Previous work by Hu et al. introduced LoRA...
  `;

  const classification9 = classifyDocumentAsResume(researchPaperDoc, 'paper_lora.pdf');
  assert(classification9.isResume === false && classification9.document_type === 'NOT_A_RESUME', 'Rejects Standalone Research Paper as NOT_A_RESUME');


  // TEST 10: Bank Account Statement (MUST REJECT)
  const bankStatementDoc = `
  ACCOUNT STATEMENT - FIRST NATIONAL BANK
  Account Holder: John Doe
  Account Number: XXXX-XXXX-4819
  Statement Period: 01/01/2024 to 01/31/2024
  Opening Balance: $12,450.00 | Closing Balance: $14,120.00
  Transaction Details:
  01/05/2024 - Direct Deposit Salary - $4,500.00
  01/10/2024 - Utility Bill Payment - -$180.00
  `;

  const classification10 = classifyDocumentAsResume(bankStatementDoc, 'bank_statement_jan.pdf');
  assert(classification10.isResume === false && classification10.document_type === 'NOT_A_RESUME', 'Rejects Bank Account Statement as NOT_A_RESUME');


  console.log('\n=====================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('=====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests();
