const {
  computeMatchScore,
  extractSkillsFromText,
  getMarketSkills,
  inferTrack,
  normalizeText,
  splitSentences,
} = require('./marketData');
const pyNlpService = require('./pyNlpService');

const PROFICIENCY_LEVELS = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

function inferProficiency(text, skill) {
  const searchableText = normalizeText(text);
  const normalizedSkill = normalizeText(skill);
  const sentences = splitSentences(text);
  const sentence = sentences.find((part) => normalizeText(part).includes(normalizedSkill));
  const windowText = sentence ? normalizeText(sentence) : searchableText;
  const match = windowText.match(/(\d+(?:\.\d+)?)\s*\+?\s*years?/);
  if (!match) return 'Intermediate';

  const years = Number.parseFloat(match[1]);
  if (years < 0.5) return 'Beginner';
  if (years < 2) return 'Intermediate';
  if (years < 5) return 'Advanced';
  return 'Expert';
}

function buildLearningResources(skillName, track) {
  return [
    { title: `${skillName} fundamentals`, type: 'course' },
    { title: `Build a ${skillName} project`, type: 'project' },
    { title: `${track} community resources`, type: 'community' },
  ];
}

function computePriority(demandScore, missing) {
  const gapSeverity = missing ? 1 : 0.35;
  const raw = demandScore * 0.75 + gapSeverity * 0.25;
  return Math.max(1, Math.min(10, Math.round(raw * 10)));
}

function buildRoadmap(skillGaps, monthsCount = 3, skillsPerMonth = 3) {
  const selected = skillGaps.slice(0, monthsCount * skillsPerMonth);
  const roadmap = [];

  for (let month = 1; month <= monthsCount; month += 1) {
    const monthSkills = selected.slice((month - 1) * skillsPerMonth, month * skillsPerMonth);
    if (!monthSkills.length) break;

    const estimatedHours = monthSkills.length * 18;
    roadmap.push({
      month,
      title: `Focus: ${monthSkills.map((item) => item.skill).join(', ')}`,
      skills: monthSkills.map((item) => item.skill),
      projects: monthSkills.map((item) => `Build a small project using ${item.skill}`),
      estimatedHours,
      hoursPerWeek: Math.ceil(estimatedHours / 4),
    });
  }

  return roadmap;
}

function buildSkillGaps(currentSkills, marketSkills, track) {
  const currentSet = new Set(currentSkills.map((skill) => normalizeText(skill.skill)));
  const maxCount = Math.max(...marketSkills.map((skill) => skill.count), 1);

  return marketSkills
    .filter((skill) => !currentSet.has(normalizeText(skill.skill)))
    .map((skill) => {
      const demandScore = Number((skill.count / maxCount).toFixed(2));
      return {
        skill: skill.skill,
        track,
        demandScore,
        count: skill.count,
        marketRank: skill.rank,
        priority: computePriority(demandScore, true),
        reason: `Frequently requested in ${track} roles`,
        learningResources: buildLearningResources(skill.skill, track),
      };
    })
    .sort((a, b) => b.priority - a.priority || b.count - a.count);
}

function summarizeCurrentSkills(detectedSkills, cvText) {
  return detectedSkills.map((item) => {
    const proficiencyLevel = item.proficiencyLevel || inferProficiency(cvText, item.skill);
    return {
      skill: item.skill,
      tracks: item.tracks || [],
      mentions: item.mentions || [],
      confidence: item.confidence || 0.5,
      proficiencyLevel,
      proficiencyRank: PROFICIENCY_LEVELS[proficiencyLevel] || 2,
    };
  });
}

function buildSummary(currentSkills, skillGaps, marketSkills, track) {
  return {
    track,
    matchScore: computeMatchScore(currentSkills, marketSkills),
    detectedSkills: currentSkills.length,
    missingSkills: skillGaps.length,
    marketSkillsReviewed: marketSkills.length,
    bestSkills: marketSkills.slice(0, 5).map((skill) => skill.skill),
  };
}

async function detectSkills(cvText) {
  if (!pyNlpService.isAvailable()) {
    return {
      detectedSkills: extractSkillsFromText(cvText),
      extractor: 'marketData-regex',
    };
  }

  try {
    const pythonResult = await pyNlpService.extract(cvText);
    const detectedSkills = Array.isArray(pythonResult.detectedSkills)
      ? pythonResult.detectedSkills
      : [];

    if (detectedSkills.length) {
      return {
        detectedSkills,
        extractor: 'python-spacy',
      };
    }

    return {
      detectedSkills: extractSkillsFromText(cvText),
      extractor: 'marketData-regex-empty-python',
    };
  } catch (error) {
    return {
      detectedSkills: extractSkillsFromText(cvText),
      extractor: 'marketData-regex-python-error',
    };
  }
}

async function analyzeCv(input) {
  const cvText = String(input.cvText || '').trim();
  if (cvText.length < 20) {
    const error = new Error('cvText must be at least 20 characters');
    error.statusCode = 400;
    error.errorCode = 'INVALID_CV_TEXT';
    throw error;
  }

  const { detectedSkills, extractor } = await detectSkills(cvText);
  const selectedTrack = input.track || inferTrack(detectedSkills);
  const marketSkills = getMarketSkills(selectedTrack, input.topSkillsLimit || 12);
  const currentSkills = summarizeCurrentSkills(detectedSkills, cvText);
  const skillGaps = buildSkillGaps(currentSkills, marketSkills, selectedTrack);
  const learningRoadmap = buildRoadmap(
    skillGaps,
    input.roadmapMonths || 3,
    input.skillsPerMonth || 3
  );

  return {
    profileSummary: buildSummary(currentSkills, skillGaps, marketSkills, selectedTrack),
    currentSkills,
    skillGaps,
    learningRoadmap,
    usefulStuff: {
      topMarketSkills: marketSkills.slice(0, 5).map((skill) => ({
        skill: skill.skill,
        count: skill.count,
        rank: skill.rank,
      })),
      nextActions: skillGaps.slice(0, 3).map((gap) => ({
        action: `Study ${gap.skill}`,
        why: gap.reason,
      })),
    },
    generatedAt: new Date().toISOString(),
    pipeline: {
      extractor,
    },
  };
}

module.exports = {
  analyzeCv,
};
