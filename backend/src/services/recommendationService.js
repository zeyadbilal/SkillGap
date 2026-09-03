const cvParserService = require('./cvParserService');
const pyNlp = require('./pyNlpService');
const {
  computeMatchScore,
  extractSkillsFromText,
  getMarketSkills,
  getSupportedTracks,
  inferTrack,
  normalizeText,
  splitSentences,
} = require('./marketData');

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

function buildSummary(currentSkills, skillGaps, marketSkills, track, cvText) {
  const matchScore = computeMatchScore(currentSkills, marketSkills);
  const education = cvParserService.extractEducation(cvText);
  const bestSkills = marketSkills.slice(0, 5).map((skill) => skill.skill);

  return {
    track,
    matchScore,
    detectedSkills: currentSkills.length,
    missingSkills: skillGaps.length,
    marketSkillsReviewed: marketSkills.length,
    bestSkills,
    education,
  };
}

function buildSkillGaps(currentSkills, marketSkills, track) {
  const currentSet = new Set(currentSkills.map((skill) => normalizeText(skill.skill)));
  const maxCount = Math.max(...marketSkills.map((skill) => skill.count), 1);

  return marketSkills
    .filter((skill) => !currentSet.has(normalizeText(skill.skill)))
    .map((skill) => {
      const demandScore = Number((skill.count / maxCount).toFixed(2));
      const priority = computePriority(demandScore, true);

      return {
        skill: skill.skill,
        track,
        demandScore,
        count: skill.count,
        marketRank: skill.rank,
        priority,
        reason: `Frequently requested in ${track} roles`,
        learningResources: buildLearningResources(skill.skill, track),
      };
    })
    .sort((a, b) => b.priority - a.priority || b.count - a.count);
}

function summarizeCurrentSkills(detectedSkills, cvText) {
  return detectedSkills.map((item) => ({
    skill: item.skill,
    tracks: item.tracks,
    mentions: item.mentions,
    confidence: item.confidence,
    proficiencyLevel: inferProficiency(cvText, item.skill),
    proficiencyRank: PROFICIENCY_LEVELS[inferProficiency(cvText, item.skill)] || 2,
  }));
}

async function analyzeCv(input) {
  const parsed = input.filePath
    ? await cvParserService.parseCv(input.filePath, input.originalName || input.filePath)
    : { text: input.cvText || '' };

  const cvText = String(parsed.text || input.cvText || '').trim();
  if (cvText.length < 20) {
    const error = new Error('CV text is required for analysis');
    error.statusCode = 400;
    error.errorCode = 'INVALID_CV_TEXT';
    throw error;
  }

  let detectedSkills;
  // prefer Python/spaCy extractor when available for higher accuracy
  try {
    if (pyNlp && pyNlp.isAvailable()) {
      const pyRes = await pyNlp.extract(cvText);
      // pyRes expected to be array of {skill, tracks, mentions, confidence, proficiencyLevel}
      detectedSkills = Array.isArray(pyRes) ? pyRes : (pyRes.detectedSkills || []);
    } else {
      detectedSkills = extractSkillsFromText(cvText);
    }
  } catch (e) {
    // fallback to JS extractor on any failure
    detectedSkills = extractSkillsFromText(cvText);
  }

  const selectedTrack = input.track || inferTrack(detectedSkills);
  const marketSkills = getMarketSkills(selectedTrack, input.topSkillsLimit || 12);
  const currentSkills = summarizeCurrentSkills(detectedSkills, cvText);
  const skillGaps = buildSkillGaps(currentSkills, marketSkills, selectedTrack);
  const learningRoadmap = buildRoadmap(
    skillGaps,
    input.roadmapMonths || 3,
    input.skillsPerMonth || 3
  );

  const profileSummary = buildSummary(currentSkills, skillGaps, marketSkills, selectedTrack, cvText);
  const usefulStuff = {
    topMarketSkills: marketSkills.slice(0, 5).map((skill) => ({
      skill: skill.skill,
      count: skill.count,
      rank: skill.rank,
    })),
    nextActions: skillGaps.slice(0, 3).map((gap) => ({
      action: `Study ${gap.skill}`,
      why: gap.reason,
    })),
  };

  return {
    profileSummary,
    currentSkills,
    skillGaps,
    learningRoadmap,
    usefulStuff,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  analyzeCv,
  buildRoadmap,
  buildSkillGaps,
  getSupportedTracks,
  inferProficiency,
};
