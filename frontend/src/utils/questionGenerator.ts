import { ParsedResume, Question, InterviewTrack } from '../types';
import { SAMPLE_QUESTION_BANK } from '../data/mockData';

/**
 * Generates personalized interview questions based on extracted resume information.
 * Gracefully falls back to general interview track questions if no resume is present.
 */
export function generatePersonalizedQuestions(
  resume: ParsedResume | null,
  track: InterviewTrack = 'Technical'
): Question[] {
  let qIdCounter = 1;

  if (!resume) {
    const trackQuestions = SAMPLE_QUESTION_BANK.filter(q => q.track === track);
    if (trackQuestions.length >= 5) return trackQuestions.slice(0, 5);
    return SAMPLE_QUESTION_BANK.map((q, idx) => ({ ...q, id: `gen-q-${idx + 1}` })).slice(0, 5);
  }

  const personalized: Question[] = [];
  const {
    candidateName,
    detectedRole,
    programmingLanguages = [],
    toolsAndTechnologies = [],
    technicalSkills = [],
    projects = [],
    structuredProjects = [],
    workExperience = [],
    structuredWorkExperience = [],
    internshipExperience = [],
    structuredInternships = [],
    certifications = [],
    education = [],
    structuredEducation = []
  } = resume;

  // 1. Project Deep Dive Question
  const topProject = structuredProjects?.[0]?.title || projects?.[0];
  if (topProject && topProject.length > 3) {
    const techMentioned = structuredProjects?.[0]?.techStack?.join(', ') || programmingLanguages.slice(0, 2).join(' & ') || 'modern technologies';
    personalized.push({
      id: `res-q-${qIdCounter++}`,
      track: track,
      topic: 'Resume Project Deep Dive',
      difficulty: 'Medium',
      text: `I noticed from your resume that you worked on "${topProject}". Could you walk me through the overall system architecture, the role of ${techMentioned}, and the key technical trade-offs you evaluated?`,
      expectedKeyPoints: [
        'High-level architecture explanation',
        'Reasoning for key framework/database choices',
        'Challenges faced and performance optimizations'
      ],
      idealAnswer: `A structured walk-through of "${topProject}" explaining data flow, design patterns used, trade-offs evaluated, and measurable outcomes.`
    });
  }

  // 2. Work History / Internship Incident Response
  const topExp = structuredWorkExperience?.[0]?.role || workExperience?.[0] || structuredInternships?.[0]?.role || internshipExperience?.[0];
  const company = structuredWorkExperience?.[0]?.company || structuredInternships?.[0]?.company || '';
  if (topExp && topExp.length > 3) {
    const expLabel = company ? `as "${topExp}" at ${company}` : `in your role as "${topExp}"`;
    personalized.push({
      id: `res-q-${qIdCounter++}`,
      track: track,
      topic: 'Work Experience & Incident Response',
      difficulty: 'Hard',
      text: `Reflecting on your experience ${expLabel}, tell me about a critical technical bottleneck or production issue you encountered, and step-by-step how you diagnosed and resolved it.`,
      expectedKeyPoints: [
        'Root cause analysis methodology',
        'Debugging and monitoring tools used',
        'Preventative measures implemented post-incident'
      ],
      idealAnswer: `Clear STAR-method explanation detailing the context, diagnostic metrics, fix implemented, and long-term architectural improvements.`
    });
  }

  // 3. Language & Core Stack Technical Question
  if (programmingLanguages.length > 0) {
    const topLang = programmingLanguages[0];
    personalized.push({
      id: `res-q-${qIdCounter++}`,
      track: track,
      topic: `${topLang} Engineering & Execution`,
      difficulty: 'Hard',
      text: `Your resume highlights strong proficiency in ${topLang}. How do you approach asynchronous execution, memory management, and error handling in ${topLang} when building high-throughput applications?`,
      expectedKeyPoints: [
        `Understanding of ${topLang} runtime mechanics & async event loop / concurrency model`,
        'Memory lifecycle and avoiding leaks',
        'Robust error handling and logging standards'
      ],
      idealAnswer: `Comprehensive explanation of ${topLang}'s internal memory management, thread/async execution model, and production error boundary patterns.`
    });
  }

  // 4. Tools & Infrastructure Integration
  if (toolsAndTechnologies.length > 0) {
    const topTool = toolsAndTechnologies[0];
    const secondTool = toolsAndTechnologies[1] || 'Git';
    personalized.push({
      id: `res-q-${qIdCounter++}`,
      track: track,
      topic: 'DevOps & Tooling Integration',
      difficulty: 'Medium',
      text: `You've listed ${topTool} and ${secondTool} in your technical stack. Can you describe how you configure and utilize ${topTool} in your development workflow or deployment pipeline?`,
      expectedKeyPoints: [
        `Deployment or containerization patterns with ${topTool}`,
        'Automated CI/CD integration',
        'Monitoring, observability, or performance tuning'
      ],
      idealAnswer: `Detailed explanation of using ${topTool} for automated deployments, containerization, or database scaling in production environments.`
    });
  }

  // 5. Technical Skill / Certification / Education System Architecture Question
  if (certifications.length > 0) {
    const cert = certifications[0];
    personalized.push({
      id: `res-q-${qIdCounter++}`,
      track: track,
      topic: `Certification & Applied Domain: ${cert}`,
      difficulty: 'Hard',
      text: `You hold a certification in ${cert}. How have you applied the principles from ${cert} to real-world software architecture or production system security?`,
      expectedKeyPoints: [
        'Practical application of certification concepts',
        'Production architecture standards',
        'Security and scalability considerations'
      ],
      idealAnswer: `Clear explanation bridging theoretical knowledge from ${cert} with concrete production engineering practices.`
    });
  } else if (technicalSkills.length > 0) {
    const topTech = technicalSkills[0];
    personalized.push({
      id: `res-q-${qIdCounter++}`,
      track: track,
      topic: `${topTech} & System Design`,
      difficulty: 'Hard',
      text: `Given your experience with ${topTech}, how would you design a scalable service using ${topTech} to handle high concurrency with sub-100ms latency?`,
      expectedKeyPoints: [
        `Architectural patterns for scaling ${topTech}`,
        'Caching, indexing, and load balancing strategies',
        'Fault tolerance and graceful degradation'
      ],
      idealAnswer: `A robust system design outline detailing horizontal scaling, caching strategies, asynchronous worker queues, and database indexing.`
    });
  }

  // Fill up remaining spots to hit exactly 5 questions if needed
  const defaultTrackQuestions = SAMPLE_QUESTION_BANK.filter(q => q.track === track);
  for (const defaultQ of defaultTrackQuestions) {
    if (personalized.length >= 5) break;
    personalized.push({
      ...defaultQ,
      id: `res-q-${qIdCounter++}`
    });
  }

  return personalized;
}
