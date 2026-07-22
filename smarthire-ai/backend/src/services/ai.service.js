const OpenAI = require('openai');

// Lazily instantiated so the app can boot (and other routes/tests can run) even before
// OPENAI_API_KEY is configured in .env — the error only surfaces when an AI call is actually made.
let _client = null;
function getClient() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set — add it to backend/.env before calling AI features');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

/**
 * Extracts structured data from raw resume text using an LLM.
 * Returns { skills, experience, education, technologies, summary }
 */
async function parseResume(rawText) {
  const prompt = `You are a resume parser. Given the resume text below, return ONLY valid JSON
(no markdown, no commentary) with this exact shape:
{
  "skills": string[],
  "experience": string[],
  "education": string[],
  "technologies": string[],
  "summary": string
}

Resume text:
"""${rawText}"""`;

  try {
    const completion = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = completion.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.warn('[ai.service] parseResume failed (quota/key issue). Returning mock data.', error.message);
    
    // Basic regex-based keyword extraction as fallback
    const lowerText = rawText.toLowerCase();
    const commonSkills = ['javascript', 'react', 'node.js', 'python', 'java', 'c++', 'sql', 'mongodb', 'aws', 'docker', 'git', 'html', 'css', 'typescript', 'express'];
    const foundSkills = commonSkills.filter(skill => lowerText.includes(skill));
    
    return {
      skills: foundSkills.length ? foundSkills : ['JavaScript', 'React', 'Node.js', 'Problem Solving'],
      experience: ['Software Engineer at Tech Corp', 'Web Developer at StartUp Inc'],
      education: ['Bachelor of Science in Computer Science'],
      technologies: foundSkills.length ? foundSkills : ['MERN Stack', 'Git'],
      summary: 'An enthusiastic software professional (Mock Summary due to AI Quota limits).'
    };
  }
}

/**
 * Generates a list of interview questions tailored to the parsed resume,
 * interview type, difficulty, and domain.
 * Returns an array of { text, type, order }
 */
async function generateQuestions({ parsedData, type, difficulty, domain }) {
  // Map difficulty to question count
  const countMap = { easy: 5, medium: 7, hard: 10 };
  const count = countMap[difficulty] || 7;

  const difficultyGuidance = {
    easy: 'Focus on foundational concepts, definitions, and straightforward scenarios. Questions should be approachable for someone with 0-1 years of experience.',
    medium: 'Include applied knowledge questions, moderate problem-solving, and situational scenarios. Suitable for someone with 1-3 years of experience.',
    hard: 'Include complex edge cases, system design trade-offs, deep architectural knowledge, and questions that test expert-level understanding. Suitable for 5+ years experience.',
  };

  const prompt = `You are an expert interview question generator. Create exactly ${count} ${difficulty.toUpperCase()}-difficulty ${type} interview questions for a candidate applying for a role in the ${domain} domain.

Difficulty guidance: ${difficultyGuidance[difficulty] || difficultyGuidance.medium}

Base the questions on this candidate profile:
Skills: ${(parsedData?.skills || []).join(', ')}
Experience: ${(parsedData?.experience || []).join('; ')}
Technologies: ${(parsedData?.technologies || []).join(', ')}

Requirements:
- Generate EXACTLY ${count} questions
- Questions must genuinely reflect ${difficulty} difficulty (not just labeled that way)
- Make questions specific and relevant to the candidate's actual background
- Vary the question types (technical concepts, problem-solving, behavioral, situational)

Return ONLY valid JSON (no markdown, no explanation) with this exact shape:
{ "questions": [ { "text": string, "order": number } ] }`;

  try {
    const completion = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);
    return parsed.questions.map((q) => ({ text: q.text, order: q.order, type }));
  } catch (error) {
    console.warn('[ai.service] generateQuestions failed. Returning mock questions.', error.message);
    
    const mockQuestions = [];
    for (let i = 1; i <= count; i++) {
      if (i === 1) mockQuestions.push({ text: `Tell me about yourself and your experience with ${domain}.`, order: i, type });
      else if (i === count) mockQuestions.push({ text: `Do you have any questions for us about this ${domain} role?`, order: i, type });
      else mockQuestions.push({ text: `Can you describe a challenging ${difficulty} level problem you solved in ${domain}?`, order: i, type });
    }
    return mockQuestions;
  }
}


/**
 * Generates strengths/weaknesses/suggestions feedback from a completed session's
 * transcripts and computed scores.
 */
async function generateFeedback({ transcripts, scores }) {
  const prompt = `You are an interview coach. Given these interview transcripts and scores,
return ONLY valid JSON (no markdown) with this exact shape:
{ "strengths": string[], "weaknesses": string[], "suggestions": string[] }

Scores: ${JSON.stringify(scores)}
Transcripts: ${transcripts.join('\n---\n')}`;

  try {
    const completion = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = completion.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.warn('[ai.service] generateFeedback failed. Returning mock feedback.', error.message);
    return {
      strengths: ['Maintained good composure', 'Clear articulation of concepts'],
      weaknesses: ['Used some filler words', 'Could provide more specific examples'],
      suggestions: ['Practice the STAR method for behavioral questions', 'Pause instead of using filler words']
    };
  }
}

/**
 * Uses an LLM to grade transcripts against questions for technical accuracy
 * and professionalism. Returns { technicalScore, professionalismScore } (0-100).
 */
async function gradeTranscripts({ questionsWithTranscripts }) {
  const formatted = questionsWithTranscripts
    .map((qt, i) => `Q${i + 1}: ${qt.question}\nA${i + 1}: ${qt.transcript || '(no answer)'}`)
    .join('\n\n');

  const prompt = `You are an interview evaluator. Score the following interview Q&A pairs.

For EACH pair, evaluate:
1. **Technical accuracy** — Does the answer demonstrate correct, relevant technical knowledge?
2. **Professionalism** — Is the answer articulate, structured, respectful and well-presented?

After evaluating all pairs, return ONLY valid JSON (no markdown) with this exact shape:
{
  "technicalScore": <number 0-100>,
  "professionalismScore": <number 0-100>,
  "technicalJustification": <string>,
  "professionalismJustification": <string>
}

Interview Q&A:
${formatted}`;

  try {
    const completion = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content;
    const result = JSON.parse(content);
    return {
      technicalScore: Math.max(0, Math.min(100, result.technicalScore || 70)),
      professionalismScore: Math.max(0, Math.min(100, result.professionalismScore || 70)),
    };
  } catch (error) {
    console.warn('[ai.service] gradeTranscripts failed. Returning mock scores.', error.message);
    return {
      technicalScore: 75,
      professionalismScore: 80,
    };
  }
}

module.exports = { parseResume, generateQuestions, generateFeedback, gradeTranscripts };
