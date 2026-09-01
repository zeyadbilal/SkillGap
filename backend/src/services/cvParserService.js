const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');
const skillRepository = require('../repositories/skillRepository');

// Parse CVs and extract skills from them
// Supports: PDF, DOCX, TXT files (max 10MB)

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error(`Unsupported file type: ${ext}`);
    err.code = 'INVALID_FILE_TYPE';
    throw err;
  }

  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE_BYTES) {
    const err = new Error('File exceeds 10MB limit');
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return { text: data.text, fileSize: stats.size };
  }

  if (ext === '.docx') {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return { text: value, fileSize: stats.size };
  }

  // .txt
  return { text: fs.readFileSync(filePath, 'utf8'), fileSize: stats.size };
}

// Find skills in CV by matching keywords against our skill list
// Guess proficiency level based on years of experience mentioned
// Default to Intermediate if no experience info found
async function extractSkills(text) {
  const normalizedText = text.toLowerCase();
  const catalog = await skillRepository.findAll({ limit: 500 });

  const extracted = [];
  for (const skill of catalog) {
    const needle = skill.normalized_name.toLowerCase();
    if (!needle) continue;

    const regex = new RegExp(`\\b${escapeRegex(needle)}\\b`, 'i');
    if (regex.test(normalizedText)) {
      extracted.push({
        skillId: skill.id,
        name: skill.name,
        category: skill.category,
        proficiencyLevel: inferProficiency(normalizedText, needle),
      });
    }
  }
  return extracted;
}

function inferProficiency(text, skillName) {
  // Look for "X years" near the skill name to guess proficiency
  const idx = text.indexOf(skillName);
  if (idx === -1) return 'Intermediate';

  const windowStart = Math.max(0, idx - 40);
  const windowEnd = Math.min(text.length, idx + skillName.length + 40);
  const window = text.slice(windowStart, windowEnd);

  const match = window.match(/(\d+(?:\.\d+)?)\s*\+?\s*years?/);
  if (!match) return 'Intermediate';

  const years = parseFloat(match[1]);
  if (years < 0.5) return 'Beginner';
  if (years < 2) return 'Intermediate';
  if (years < 5) return 'Advanced';
  return 'Expert';
}

function extractEducation(text) {
  // Find degree and graduation year in CV text
  const degreeMatch = text.match(/\b(B\.?Sc\.?|Bachelor|M\.?Sc\.?|Master|Ph\.?D\.?)[^\n]{0,80}/i);
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);

  return {
    degree: degreeMatch ? degreeMatch[0].trim() : null,
    graduationYear: yearMatch ? Number(yearMatch[0]) : null,
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function parseCv(filePath, originalName) {
  const { text, fileSize } = await extractText(filePath, originalName);
  const extractedSkills = await extractSkills(text);
  const extractedEducation = extractEducation(text);

  logger.info('CV parsed', { originalName, skillsFound: extractedSkills.length });

  return {
    fileSize,
    extractedSkills,
    extractedEducation,
    totalSkillsExtracted: extractedSkills.length,
  };
}

module.exports = { parseCv, extractSkills, extractEducation };
