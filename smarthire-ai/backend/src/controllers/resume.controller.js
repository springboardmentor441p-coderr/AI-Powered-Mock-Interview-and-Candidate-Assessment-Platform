const fs = require('fs');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const { parseResume } = require('../services/ai.service');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'A PDF file is required (field name: resume)' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(fileBuffer);
    const rawText = pdfData.text;

    let parsedData = { skills: [], experience: [], education: [], technologies: [] };
    let summary = '';
    try {
      const aiResult = await parseResume(rawText);
      parsedData = {
        skills: aiResult.skills || [],
        experience: aiResult.experience || [],
        education: aiResult.education || [],
        technologies: aiResult.technologies || [],
      };
      summary = aiResult.summary || '';
    } catch (aiErr) {
      // Don't fail the whole upload if the AI parsing step errors (e.g. missing API key
      // during local dev) — the raw text and file are still saved.
      console.warn('[resume] AI parsing failed, saving raw text only:', aiErr.message);
    }

    const resume = await Resume.create({
      userId: req.user.id,
      fileUrl: `/uploads/${req.file.filename}`,
      rawText,
      parsedData,
      summary,
    });

    res.status(201).json({ resume });
  } catch (err) {
    res.status(500).json({ message: 'Resume upload failed', error: err.message });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    if (resume.userId.toString() !== req.user.id && req.user.role === 'candidate') {
      return res.status(403).json({ message: 'Not authorized to view this resume' });
    }

    res.json({ resume });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resume', error: err.message });
  }
};

/**
 * GET /resume/my — list all resumes belonging to the current user
 */
exports.listMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .select('fileUrl summary parsedData.skills createdAt')
      .sort({ createdAt: -1 });
    res.json({ resumes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list resumes', error: err.message });
  }
};
