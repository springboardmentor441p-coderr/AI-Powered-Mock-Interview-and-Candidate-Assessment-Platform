const InterviewSession = require('../models/InterviewSession');
const Question = require('../models/Question');
const Response = require('../models/Response');
const Resume = require('../models/Resume');
const ScoreReport = require('../models/ScoreReport');
const InterviewTemplate = require('../models/InterviewTemplate');
const { generateQuestions, generateFeedback, gradeTranscripts } = require('../services/ai.service');
const { transcribeAudio, analyzeSpeechMetrics } = require('../services/speech.service');
const {
  computeOverallScore,
  ratingFor,
  computeCommunicationScore,
  computeConfidenceScore,
} = require('../services/scoring.service');
const { createNotification } = require('./notification.controller');

exports.generateInterview = async (req, res) => {
  try {
    const { resumeId, type, difficulty, domain, templateId } = req.body;
    if (!resumeId || !type) {
      return res.status(400).json({ message: 'resumeId and type are required' });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // If a template is provided, use its settings
    let finalDifficulty = difficulty || 'medium';
    let finalDomain = domain || 'general';
    let customQuestions = null;

    if (templateId) {
      const template = await InterviewTemplate.findById(templateId);
      if (template) {
        finalDifficulty = template.difficulty;
        finalDomain = template.domain;
        if (template.customQuestions && template.customQuestions.length > 0) {
          customQuestions = template.customQuestions;
        }
      }
    }

    const session = await InterviewSession.create({
      userId: req.user.id,
      resumeId,
      type,
      difficulty: finalDifficulty,
      domain: finalDomain,
      status: 'pending',
    });

    let questionDocs;

    if (customQuestions && customQuestions.length > 0) {
      // Use custom questions from the template
      questionDocs = await Question.insertMany(
        customQuestions.map((text, idx) => ({
          sessionId: session._id,
          text,
          type,
          order: idx + 1,
        }))
      );
    } else {
      // Generate questions via AI
      const generated = await generateQuestions({
        parsedData: resume.parsedData,
        type,
        difficulty: finalDifficulty,
        domain: finalDomain,
      });

      questionDocs = await Question.insertMany(
        generated.map((q) => ({ ...q, sessionId: session._id }))
      );
    }

    session.questionIds = questionDocs.map((q) => q._id);
    await session.save();

    res.status(201).json({ session, questions: questionDocs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate interview', error: err.message });
  }
};

/**
 * GET /interview/:id — returns the session with its questions so the
 * InterviewRoom can fetch them after navigating to the page.
 */
exports.getSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('questionIds');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.userId.toString() !== req.user.id && req.user.role === 'candidate') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ session, questions: session.questionIds });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch session', error: err.message });
  }
};

exports.startSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.status = 'in_progress';
    session.startedAt = new Date();
    await session.save();

    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start session', error: err.message });
  }
};

exports.submitResponse = async (req, res) => {
  try {
    const { questionId } = req.body;
    let transcript = req.body.transcript || '';
    let visualMetrics = {};
    try {
      visualMetrics = req.body.visualMetrics ? JSON.parse(req.body.visualMetrics) : {};
    } catch (_) {
      visualMetrics = {};
    }
    let speechMetrics = {};
    
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    let audioUrl = undefined;
    if (req.file) {
      audioUrl = `/uploads/${req.file.filename}`;
      // 1. Transcribe audio using Whisper
      if (!transcript) {
         try {
           transcript = await transcribeAudio(req.file.path);
         } catch (whisperErr) {
           console.warn('[interview] Whisper transcription failed:', whisperErr.message);
         }
      }
      
      // 2. Compute speech metrics
      const durationSec = req.body.duration ? parseFloat(req.body.duration) : 0;
      speechMetrics = analyzeSpeechMetrics(transcript, durationSec);
    }

    const response = await Response.create({
      sessionId: session._id,
      questionId,
      transcript,
      audioUrl,
      speechMetrics,
      visualMetrics,
    });

    session.responseIds.push(response._id);
    await session.save();

    res.status(201).json({ response });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit response', error: err.message });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('responseIds')
      .populate('questionIds');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const responses = session.responseIds;
    const questions = session.questionIds;

    const communicationScore = computeCommunicationScore(responses);
    const confidenceScore = computeConfidenceScore(responses);

    // LLM-graded technical + professionalism scoring
    let technicalScore = 70;
    let professionalismScore = 70;
    try {
      const questionsWithTranscripts = questions.map((q) => {
        const matchingResponse = responses.find(
          (r) => r.questionId.toString() === q._id.toString()
        );
        return { question: q.text, transcript: matchingResponse?.transcript || '' };
      });
      const graded = await gradeTranscripts({ questionsWithTranscripts });
      technicalScore = graded.technicalScore;
      professionalismScore = graded.professionalismScore;
    } catch (gradeErr) {
      console.warn('[interview] LLM grading failed, using defaults:', gradeErr.message);
    }

    const overallScore = computeOverallScore({
      communication: communicationScore,
      confidence: confidenceScore,
      technical: technicalScore,
      professionalism: professionalismScore,
    });

    let feedback = { strengths: [], weaknesses: [], suggestions: [] };
    try {
      feedback = await generateFeedback({
        transcripts: responses.map((r) => r.transcript || ''),
        scores: { communicationScore, confidenceScore, technicalScore, professionalismScore, overallScore },
      });
    } catch (aiErr) {
      console.warn('[interview] feedback generation failed:', aiErr.message);
    }

    const report = await ScoreReport.create({
      sessionId: session._id,
      userId: session.userId,
      communicationScore,
      confidenceScore,
      technicalScore,
      professionalismScore,
      overallScore,
      rating: ratingFor(overallScore),
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestions: feedback.suggestions,
    });

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Create notifications for the candidate
    await createNotification({
      userId: session.userId,
      type: 'interview_complete',
      title: 'Interview Completed',
      message: `Your ${session.type} interview has been scored. Overall: ${Math.round(overallScore)} (${ratingFor(overallScore)})`,
      link: `/report/${session._id}`,
    });

    await createNotification({
      userId: session.userId,
      type: 'report_ready',
      title: 'Report Ready',
      message: 'Your detailed interview analysis report is now available. Check your strengths, weaknesses, and improvement suggestions.',
      link: `/report/${session._id}`,
    });

    res.json({ session, report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete session', error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await ScoreReport.findOne({ sessionId: req.params.id });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Fetch session with populated responses so the report page can derive
    // dominant emotion from visualMetrics.emotionScores
    const session = await InterviewSession.findById(req.params.id)
      .populate('responseIds', 'visualMetrics speechMetrics transcript');

    res.json({ report, session });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch report', error: err.message });
  }
};

// ============ Interview Templates ============

/**
 * POST /interview/template
 */
exports.createTemplate = async (req, res) => {
  try {
    const { name, type, difficulty, domain, description, customQuestions, isPublic } = req.body;
    if (!name || !type) {
      return res.status(400).json({ message: 'name and type are required' });
    }

    const template = await InterviewTemplate.create({
      createdBy: req.user.id,
      name,
      type,
      difficulty: difficulty || 'medium',
      domain: domain || 'general',
      description: description || '',
      customQuestions: customQuestions || [],
      isPublic: isPublic || false,
    });

    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create template', error: err.message });
  }
};

/**
 * GET /interview/templates
 */
exports.listTemplates = async (req, res) => {
  try {
    // Show public templates + templates created by the current user
    const templates = await InterviewTemplate.find({
      $or: [{ isPublic: true }, { createdBy: req.user.id }],
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ templates });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list templates', error: err.message });
  }
};

/**
 * DELETE /interview/template/:id
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await InterviewTemplate.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!template) return res.status(404).json({ message: 'Template not found or not authorized' });

    await InterviewTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete template', error: err.message });
  }
};
