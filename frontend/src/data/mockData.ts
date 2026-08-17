import { 
  InterviewerPersona, 
  EvaluationReport, 
  UserProfile, 
  Question,
  JobCampaign,
  CandidateApplication
} from '../types';

export const INTERVIEWER_PERSONAS: InterviewerPersona[] = [
  {
    id: 'alex-tech',
    name: 'Alex Vance',
    role: 'Principal Engineer & Tech Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    description: 'Direct, analytical, and probes deeply into code architecture, data structures, and edge-cases.',
    accentColor: '#059669',
    voiceGender: 'male',
    tone: 'analytical'
  },
  {
    id: 'sarah-hr',
    name: 'Sarah Jenkins',
    role: 'Global Talent Acquisition Director',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    description: 'Warm, observant, and focuses on STAR methodology, conflict resolution, leadership, and culture fit.',
    accentColor: '#0284C7',
    voiceGender: 'female',
    tone: 'encouraging'
  },
  {
    id: 'marcus-arch',
    name: 'Marcus Thorne',
    role: 'Distinguished System Architect',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    description: 'Rigorously evaluates distributed systems, scalability, database indexing, caching strategies, and trade-offs.',
    accentColor: '#7C3AED',
    voiceGender: 'male',
    tone: 'rigorous'
  },
  {
    id: 'elena-pm',
    name: 'Elena Rostova',
    role: 'Head of Product & Aptitude Strategy',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    description: 'Focuses on analytical reasoning, product metric decomposition, behavioral agility, and problem solving.',
    accentColor: '#059669',
    voiceGender: 'female',
    tone: 'encouraging'
  }
];

export const INITIAL_USER: UserProfile = {
  id: 'usr-101',
  name: 'Alex Chen',
  email: 'alex.chen@devmail.io',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  role: 'candidate',
  companyName: 'TechCorp Solutions',
  targetRole: 'Senior Full Stack Engineer',
  experienceLevel: '3-5 Years',
  completedInterviewsCount: 14,
  averageScore: 86,
  readinessLevel: 'Senior Engineer Ready',
  resumes: [
    {
      fileName: 'Alex_Chen_Senior_FullStack_Resume.pdf',
      uploadedAt: '2026-08-01',
      candidateName: 'Alex Chen',
      email: 'alex.chen@devmail.io',
      phone: '+1 (555) 234-5678',
      extractedSkills: [
        'React', 'Next.js', 'TypeScript', 'Node.js', 'Express',
        'PostgreSQL', 'Docker', 'AWS S3', 'GraphQL', 'Redis',
        'System Design', 'CI/CD Pipelines'
      ],
      technicalSkills: ['React', 'Next.js', 'Node.js', 'Express', 'GraphQL', 'System Design'],
      softSkills: ['Leadership', 'Problem Solving', 'Communication', 'Agile'],
      programmingLanguages: ['JavaScript', 'TypeScript', 'SQL', 'HTML5', 'CSS3'],
      toolsAndTechnologies: ['Docker', 'AWS', 'PostgreSQL', 'Redis', 'Git'],
      experienceYears: 4,
      detectedRole: 'Senior Full Stack Engineer',
      education: ['B.S. Computer Science - University of Washington (2022)'],
      projects: [
        'Real-time Distributed Collaborative Editor (WebSockets + CRDTs)',
        'High-Throughput E-Commerce Microservice API Gateway',
        'AI Powered Code Quality Scanner CLI'
      ],
      workExperience: [
        'Senior Full Stack Engineer at TechCorp Solutions (2023 - Present)',
        'Software Engineer at CloudScale Systems (2022 - 2023)'
      ],
      internshipExperience: [
        'Frontend Software Engineering Intern at DataViz Labs (2021)'
      ],
      certifications: [
        'AWS Certified Solutions Architect - Associate'
      ],
      achievements: [
        'Reduced database latency by 45% using Redis caching layers'
      ],
      summary: 'Experienced Full-Stack Developer with 4 years building high-concurrency microservices, single-page applications, and cloud databases.',
      validation: {
        completenessScore: 95,
        extractedFieldCount: 14,
        totalFieldsCount: 14,
        checksPassed: [
          '✓ Candidate Full Name Identified',
          '✓ Email Address Extracted',
          '✓ Phone Number Extracted',
          '✓ 12 Technical Skills & Technologies Categorized',
          '✓ Work & Internship History Extracted',
          '✓ Academic Background Identified'
        ],
        warnings: []
      }
    }
  ]
};

export const RECRUITER_USER: UserProfile = {
  id: 'usr-recruiter-88',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@enterprise-hiring.com',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  role: 'recruiter',
  companyName: 'Apex Enterprise Technologies',
  targetRole: 'Head of Global Talent Acquisition',
  experienceLevel: 'Senior',
  completedInterviewsCount: 240,
  averageScore: 91,
  readinessLevel: 'Hiring Director',
  resumes: []
};

export const SAMPLE_JOB_CAMPAIGNS: JobCampaign[] = [
  {
    id: 'cmp-101',
    title: 'Senior React & Node Fullstack Screening Q3',
    department: 'Core Engineering',
    location: 'San Francisco, CA (Hybrid)',
    track: 'Technical',
    experienceLevel: '3-5 Years',
    difficulty: 'Hard',
    passThresholdScore: 80,
    assignedPersona: INTERVIEWER_PERSONAS[0],
    candidateCount: 28,
    assessmentUrl: 'https://intervio.ai/assess/cmp-101',
    status: 'Active',
    createdAt: '2026-08-01'
  },
  {
    id: 'cmp-102',
    title: 'Distributed Systems Architect Assessment',
    department: 'Cloud Infrastructure',
    location: 'New York, NY (Remote)',
    track: 'System Design',
    experienceLevel: 'Senior',
    difficulty: 'FAANG',
    passThresholdScore: 85,
    assignedPersona: INTERVIEWER_PERSONAS[2],
    candidateCount: 14,
    assessmentUrl: 'https://intervio.ai/assess/cmp-102',
    status: 'Active',
    createdAt: '2026-08-03'
  },
  {
    id: 'cmp-103',
    title: 'Engineering Manager STAR Behavioral Round',
    department: 'Talent Acquisition',
    location: 'Austin, TX',
    track: 'HR',
    experienceLevel: 'Senior',
    difficulty: 'Medium',
    passThresholdScore: 78,
    assignedPersona: INTERVIEWER_PERSONAS[1],
    candidateCount: 19,
    assessmentUrl: 'https://intervio.ai/assess/cmp-103',
    status: 'Active',
    createdAt: '2026-08-04'
  }
];

export const SAMPLE_CANDIDATE_APPLICATIONS: CandidateApplication[] = [];

export const SAMPLE_QUESTION_BANK: Question[] = [
  // Technical
  {
    id: 'q-tech-1',
    track: 'Technical',
    text: 'How does modern virtual DOM fiber reconciliation optimize state update batching, and how does concurrent rendering prevent UI main thread blockage?',
    topic: 'UI Framework Internals',
    difficulty: 'Hard',
    expectedKeyPoints: [
      'Fiber node hierarchy & double buffering tree',
      'Interruptible rendering priorities (Concurrent mode)',
      'Time-slicing long task execution',
      'Transition hooks & deferred values'
    ],
    idealAnswer: 'Fiber breaks rendering work into incremental units. During concurrent rendering, high-priority user input events pause tree building, avoiding main thread blocking before committing DOM updates.'
  },
  {
    id: 'q-tech-2',
    track: 'Technical',
    text: 'Explain the asynchronous Event Loop execution phases in Node.js. What is the difference between nextTick(), Promise microtasks, and setImmediate()?',
    topic: 'Asynchronous Event Loop',
    difficulty: 'Medium',
    expectedKeyPoints: [
      'Phases of libuv event loop (Timers, I/O Polling, Check, Close)',
      'Microtask queue vs Macrotask queue',
      'nextTick queue runs immediately after current operation before microtask queue'
    ],
    idealAnswer: 'The event loop executes in phases managed by libuv. process.nextTick fires before microtasks like resolved Promises, while setImmediate schedules callbacks for the Check phase after I/O callbacks complete.'
  },

  // System Design
  {
    id: 'q-sys-1',
    track: 'System Design',
    text: 'Design a distributed rate limiter for a public REST API processing 100,000 requests per second across multi-region clusters.',
    topic: 'Distributed Systems & Microservices',
    difficulty: 'FAANG',
    expectedKeyPoints: [
      'Token Bucket / Leaky Bucket / Sliding Window Log algorithm',
      'Centralized vs Distributed Redis store with Lua scripts',
      'Handling Redis cluster latency with local memory burst buffer',
      'HTTP 429 Too Many Requests response with retry headers'
    ],
    idealAnswer: 'I would use a Sliding Window Counter algorithm backed by a clustered Redis deployment running atomic Lua scripts to prevent race conditions. Edge gateways maintain short-lived local token quotas to minimize cross-region latency.'
  },
  {
    id: 'q-sys-2',
    track: 'System Design',
    text: 'How would you scale a transactional PostgreSQL database handling heavy read-and-write traffic while maintaining ACID compliance?',
    topic: 'Database Architecture',
    difficulty: 'Hard',
    expectedKeyPoints: [
      'Read replicas & Connection pooling',
      'Horizontal Sharding by tenant/user ID',
      'Caching layer with Redis (Cache-aside pattern)',
      'Write Ahead Logging (WAL) streaming replication'
    ],
    idealAnswer: 'Scaling Postgres involves adding read replicas for query distribution, implementing connection pooling, caching hot keys in Redis, and partitioning large tables (sharding) by a deterministic partition key when write bottlenecks occur.'
  },

  // HR / Behavioral
  {
    id: 'q-hr-1',
    track: 'HR',
    text: 'Tell me about a time you had a fundamental technical disagreement with a Senior Architect or Product Manager. How did you resolve it?',
    topic: 'STAR Method & Conflict Resolution',
    difficulty: 'Medium',
    expectedKeyPoints: [
      'Situation & Task context',
      'Data-driven evidence & benchmarks presented',
      'Empathetic negotiation and compromise',
      'Positive project outcome & team alignment'
    ],
    idealAnswer: 'I outline the specific Situation, my responsibility (Task), the Action taken using objective metrics and prototypes to evaluate trade-offs, and the final business Result that aligned the engineering team.'
  },

  // Coding
  {
    id: 'q-code-1',
    track: 'Coding',
    text: 'Given an array of integers, find the contiguous subarray with the largest sum and return its sum in O(n) time.',
    topic: 'Dynamic Programming & Array Traversal',
    difficulty: 'Medium',
    codeSnippet: 'function maxSubArray(nums: number[]): number {\n  // Implement Kadane algorithm\n}',
    expectedKeyPoints: [
      'Track current max subarray sum',
      'Reset current sum to num if previous sum is negative',
      'O(n) time complexity and O(1) space complexity'
    ],
    idealAnswer: 'Using Kadane’s algorithm, we iterate through the array maintaining current_sum = max(num, current_sum + num) and max_so_far = max(max_so_far, current_sum).'
  }
];

export const MOCK_PAST_REPORTS: EvaluationReport[] = [
  {
    id: 'rpt-8821',
    config: {
      id: 'cfg-8821',
      title: 'Senior Full Stack Technical Screening',
      track: 'Technical',
      subCategory: 'Distributed Architecture & State Engines',
      experienceLevel: '3-5 Years',
      difficulty: 'Hard',
      durationMinutes: 30,
      persona: INTERVIEWER_PERSONAS[0],
      preferredLanguage: 'English',
      enableProctoring: true
    },
    createdAt: '2026-08-06T14:30:00Z',
    candidateName: 'Alex Chen',
    candidateEmail: 'alex.chen@devmail.io',
    overallScore: 89,
    readinessRating: 'Senior Engineer Ready',
    categoryScores: {
      technicalKnowledge: 92,
      communicationSkills: 88,
      behavioralSkills: 85,
      bodyLanguage: 90,
      deliveryAndPacing: 87
    },
    strengths: [
      'Deep architectural knowledge of Fiber double-buffering and concurrent priorities.',
      'Articulate explanation of Event Loop microtask vs macrotask execution order.',
      'Clear, confident vocal posture with minimal filler words (under 2 per minute).'
    ],
    weaknesses: [
      'Could elaborate more on edge failure modes in distributed sliding window rate limiters.',
      'Slight pause while calculating database sharding partition keys.'
    ],
    recommendedImprovements: [
      'Review Lua script atomicity patterns in Redis cluster failover scenarios.',
      'Practice 2-minute concise STAR summaries for system outage anecdotes.'
    ],
    answers: [
      {
        questionId: 'q-tech-1',
        questionText: 'How does modern virtual DOM fiber reconciliation optimize state update batching, and how does concurrent rendering prevent UI main thread blockage?',
        topic: 'UI Framework Internals',
        candidateResponse: 'Fiber represents rendering work as a linked list of nodes. During concurrent rendering, priority levels are assigned to updates. If a high priority event like keyboard entry occurs, reconciliation yields the main thread, handles the input, and then resumes work.',
        audioDurationSeconds: 110,
        score: 94,
        technicalAccuracy: 95,
        communicationFluency: 92,
        problemSolvingDepth: 93,
        bodyLanguageConfidence: 94,
        aiFeedback: 'Outstanding response. Excellent technical depth covering double-buffering, time slicing, and main thread yield mechanisms.',
        strengths: ['Precise technical terminology', 'Logical flow from Fiber representation to user experience benefits'],
        areasToImprove: ['Mention compiler optimization hints briefly if time permits'],
        idealAnswerComparison: '95% match with ideal staff engineer explanation.'
      },
      {
        questionId: 'q-sys-1',
        questionText: 'Design a distributed rate limiter for a public REST API processing 100,000 requests per second across multi-region clusters.',
        topic: 'Distributed Systems',
        candidateResponse: 'I would use a Sliding Window Counter algorithm. Redis running Lua scripts guarantees atomic updates across cluster nodes. Edge API proxies hold local token buckets that resynchronize periodically with central Redis.',
        audioDurationSeconds: 145,
        score: 85,
        technicalAccuracy: 88,
        communicationFluency: 84,
        problemSolvingDepth: 86,
        bodyLanguageConfidence: 85,
        aiFeedback: 'Solid system architecture overview. Great inclusion of edge proxy local token buckets to mitigate cross-region roundtrip latency.',
        strengths: ['Identified cross-region latency bottleneck', 'Selected correct atomic Redis primitives'],
        areasToImprove: ['Address edge cases when Redis cluster experiences node partition or network split'],
        idealAnswerComparison: '88% match with senior architecture blueprint.'
      }
    ],
    proctoringEvents: [
      {
        id: 'proc-1',
        timestamp: '00:08:14',
        type: 'TAB_SWITCH',
        severity: 'warning',
        message: 'Browser window lost focus for 3 seconds.'
      }
    ],
    learningResources: [
      { title: 'Designing Data-Intensive Applications (Distributed Consensus)', url: 'https://martinfowler.com', category: 'System Design' },
      { title: 'Advanced Concurrent Rendering Patterns', url: 'https://developer.mozilla.org', category: 'Frontend' }
    ],
    videoRecordingAvailable: true,
    totalDurationSeconds: 1540
  }
];
