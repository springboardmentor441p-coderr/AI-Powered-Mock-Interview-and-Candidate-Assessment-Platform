/**
 * companyCatalog.js
 * Static catalog of companies and job roles used for:
 *  - Live Simulation company → role → apply flow
 *  - Search overlay suggestions
 *  - Notification bell job opportunity seeding
 */

export const COMPANIES = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '🛒',
    color: '#FF9900',
    hq: 'Seattle, WA',
    description: 'E-commerce and cloud computing giant, home to AWS.',
    isNew: false,
    roles: [
      { id: 'sde2', title: 'Software Development Engineer II', domain: 'Backend Systems', type: 'Technical', difficulty: 'Hard', isNew: true },
      { id: 'data-engineer', title: 'Data Engineer', domain: 'Data Engineering', type: 'Technical', difficulty: 'Medium', isNew: false },
      { id: 'pm', title: 'Product Manager', domain: 'Product Management', type: 'Behavioral', difficulty: 'Medium', isNew: false },
      { id: 'ml-scientist', title: 'Applied ML Scientist', domain: 'Machine Learning', type: 'Technical', difficulty: 'Hard', isNew: true },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    logo: '🔍',
    color: '#4285F4',
    hq: 'Mountain View, CA',
    description: 'Search, cloud, and AI leader powering the internet.',
    isNew: false,
    roles: [
      { id: 'swe-l4', title: 'Software Engineer L4', domain: 'Full Stack Web Development', type: 'Technical', difficulty: 'Hard', isNew: false },
      { id: 'ux-researcher', title: 'UX Researcher', domain: 'User Experience Research', type: 'Behavioral', difficulty: 'Medium', isNew: true },
      { id: 'devrel', title: 'Developer Advocate', domain: 'Developer Relations', type: 'Behavioral', difficulty: 'Medium', isNew: false },
      { id: 'sre', title: 'Site Reliability Engineer', domain: 'Systems Engineering', type: 'Technical', difficulty: 'Hard', isNew: false },
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: '🪟',
    color: '#00A4EF',
    hq: 'Redmond, WA',
    description: 'Enterprise software, Azure cloud, and Xbox gaming.',
    isNew: false,
    roles: [
      { id: 'frontend', title: 'Frontend Engineer', domain: 'Frontend Development', type: 'Technical', difficulty: 'Medium', isNew: false },
      { id: 'cloud-arch', title: 'Azure Cloud Architect', domain: 'Cloud Architecture', type: 'System Design', difficulty: 'Hard', isNew: true },
      { id: 'pm-teams', title: 'Product Manager – Teams', domain: 'Product Management', type: 'Behavioral', difficulty: 'Medium', isNew: false },
      { id: 'security', title: 'Security Engineer', domain: 'Cybersecurity', type: 'Technical', difficulty: 'Hard', isNew: false },
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    logo: '♾️',
    color: '#0082FB',
    hq: 'Menlo Park, CA',
    description: 'Social media, VR, and the metaverse.',
    isNew: false,
    roles: [
      { id: 'android', title: 'Android Engineer', domain: 'Android Development', type: 'Technical', difficulty: 'Hard', isNew: false },
      { id: 'infra', title: 'Production Engineer', domain: 'Infrastructure Engineering', type: 'Technical', difficulty: 'Hard', isNew: true },
      { id: 'data-analyst', title: 'Data Analyst', domain: 'Data Analytics', type: 'Technical', difficulty: 'Medium', isNew: false },
      { id: 'content', title: 'Content Strategist', domain: 'Content Strategy', type: 'HR', difficulty: 'Easy', isNew: false },
    ],
  },
  {
    id: 'netflix',
    name: 'Netflix',
    logo: '🎬',
    color: '#E50914',
    hq: 'Los Gatos, CA',
    description: 'Global streaming platform with 260M+ subscribers.',
    isNew: true,
    roles: [
      { id: 'backend-java', title: 'Senior Backend Engineer (Java)', domain: 'Backend Systems', type: 'Technical', difficulty: 'Hard', isNew: true },
      { id: 'ios', title: 'iOS Engineer', domain: 'iOS Development', type: 'Technical', difficulty: 'Medium', isNew: false },
      { id: 'data-science', title: 'Data Scientist', domain: 'Data Science', type: 'Technical', difficulty: 'Hard', isNew: false },
      { id: 'recruiter', title: 'Technical Recruiter', domain: 'HR & Talent Acquisition', type: 'HR', difficulty: 'Easy', isNew: false },
    ],
  },
  {
    id: 'uber',
    name: 'Uber',
    logo: '🚗',
    color: '#000000',
    hq: 'San Francisco, CA',
    description: 'Ride-hailing and delivery at global scale.',
    isNew: false,
    roles: [
      { id: 'maps', title: 'Maps Infrastructure Engineer', domain: 'Geospatial Systems', type: 'Technical', difficulty: 'Hard', isNew: false },
      { id: 'ml-platform', title: 'ML Platform Engineer', domain: 'Machine Learning', type: 'Technical', difficulty: 'Hard', isNew: true },
      { id: 'ops-manager', title: 'City Operations Manager', domain: 'Operations Management', type: 'Behavioral', difficulty: 'Medium', isNew: false },
      { id: 'fullstack', title: 'Full Stack Engineer', domain: 'Full Stack Web Development', type: 'Technical', difficulty: 'Medium', isNew: false },
    ],
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: '🛍️',
    color: '#2874F0',
    hq: 'Bengaluru, India',
    description: "India's leading e-commerce marketplace.",
    isNew: true,
    roles: [
      { id: 'sde1', title: 'SDE-1', domain: 'Full Stack Web Development', type: 'Technical', difficulty: 'Easy', isNew: true },
      { id: 'sde2-flip', title: 'SDE-2', domain: 'Backend Systems', type: 'Technical', difficulty: 'Medium', isNew: false },
      { id: 'category', title: 'Category Manager', domain: 'Product Management', type: 'Behavioral', difficulty: 'Medium', isNew: false },
      { id: 'analyst', title: 'Business Analyst', domain: 'Business Analysis', type: 'Behavioral', difficulty: 'Easy', isNew: false },
    ],
  },
  {
    id: 'infosys',
    name: 'Infosys',
    logo: '💼',
    color: '#007CC3',
    hq: 'Bengaluru, India',
    description: 'Global IT services and consulting firm.',
    isNew: false,
    roles: [
      { id: 'sse', title: 'Senior Systems Engineer', domain: 'Full Stack Web Development', type: 'Technical', difficulty: 'Medium', isNew: false },
      { id: 'java-dev', title: 'Java Developer', domain: 'Backend Systems', type: 'Technical', difficulty: 'Medium', isNew: true },
      { id: 'qa', title: 'QA Engineer', domain: 'Quality Assurance', type: 'Technical', difficulty: 'Easy', isNew: false },
      { id: 'ba-infosys', title: 'Business Analyst', domain: 'Business Analysis', type: 'Behavioral', difficulty: 'Easy', isNew: false },
    ],
  },
  {
    id: 'tcs',
    name: 'TCS',
    logo: '🏢',
    color: '#00ADEF',
    hq: 'Mumbai, India',
    description: 'Tata Consultancy Services — largest IT firm in India.',
    isNew: false,
    roles: [
      { id: 'developer', title: 'Application Developer', domain: 'Full Stack Web Development', type: 'Technical', difficulty: 'Easy', isNew: false },
      { id: 'cloud-tcs', title: 'Cloud Engineer', domain: 'Cloud Architecture', type: 'Technical', difficulty: 'Medium', isNew: true },
      { id: 'consulting', title: 'Technology Consultant', domain: 'IT Consulting', type: 'Behavioral', difficulty: 'Medium', isNew: false },
      { id: 'devops', title: 'DevOps Engineer', domain: 'DevOps', type: 'Technical', difficulty: 'Medium', isNew: false },
    ],
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    logo: '💳',
    color: '#3395FF',
    hq: 'Bengaluru, India',
    description: `India's leading fintech payments platform.`,
    isNew: true,
    roles: [
      { id: 'fintech-sde', title: 'Backend Engineer – Payments', domain: 'Fintech & Payments', type: 'Technical', difficulty: 'Hard', isNew: true },
      { id: 'frontend-rp', title: 'Frontend Engineer', domain: 'Frontend Development', type: 'Technical', difficulty: 'Medium', isNew: false },
      { id: 'product-rp', title: 'Product Manager', domain: 'Product Management', type: 'Behavioral', difficulty: 'Medium', isNew: true },
      { id: 'risk', title: 'Risk Analyst', domain: 'Risk & Compliance', type: 'Behavioral', difficulty: 'Medium', isNew: false },
    ],
  },
];

/** Flat list of all roles with company context — used by search */
export const ALL_ROLES = COMPANIES.flatMap(c =>
  c.roles.map(r => ({ ...r, companyId: c.id, companyName: c.name, companyLogo: c.logo, companyColor: c.color }))
);

/** Seed notifications from new companies/roles */
export const SEED_NOTIFICATIONS = [
  ...COMPANIES.filter(c => c.isNew).map(c => ({
    id: `company-${c.id}`,
    type: 'company',
    title: `${c.name} is now on Nexiq`,
    body: `Practice and live interview sessions for ${c.name} roles are now available.`,
    icon: c.logo,
    time: Date.now() - 1000 * 60 * 30,
    read: false,
  })),
  ...ALL_ROLES.filter(r => r.isNew).map(r => ({
    id: `role-${r.companyId}-${r.id}`,
    type: 'role',
    title: `New role: ${r.title} at ${r.companyName}`,
    body: `${r.domain} · ${r.difficulty} difficulty — apply now for a live simulation.`,
    icon: r.companyLogo,
    time: Date.now() - 1000 * 60 * 10,
    read: false,
  })),
];
