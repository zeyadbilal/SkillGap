const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../');
const SKILL_DICTIONARY_PATH = path.join(ROOT_DIR, 'DataPipeline/config/skills_dictionary.json');
const TRACK_FREQUENCY_FILES = {
  'Backend Development': 'backend_development_frequency.csv',
  'Frontend Development': 'frontend_development_frequency.csv',
  'Full-Stack Development': 'full-stack_development_frequency.csv',
  'Mobile Development': 'mobile_development_frequency.csv',
  'DevOps & Cloud Engineering': 'devops_&_cloud_engineering_frequency.csv',
  'Network Administration': 'network_administration_frequency.csv',
  'Network Security': 'network_security_frequency.csv',
  'Machine Learning / AI': 'machine_learning___ai_frequency.csv',
};

let cachedDictionary = null;
let cachedMarketData = null;

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#./-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSearchableText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSkillAliases(skill) {
  const base = toSearchableText(skill);
  if (!base) return [];

  const aliases = new Set([base]);
  const compact = base.replace(/\s+/g, '');
  if (compact && compact !== base) aliases.add(compact);

  const punctuationNormalized = base
    .replace(/\bjs\b/g, 'javascript')
    .replace(/\bts\b/g, 'typescript')
    .replace(/\band\b/g, '&');
  aliases.add(punctuationNormalized);

  if (base.includes('node js')) aliases.add('nodejs');
  if (base.includes('express js')) aliases.add('expressjs');
  if (base.includes('vue js')) aliases.add('vuejs');
  if (base.includes('next js')) aliases.add('nextjs');
  if (base.includes('nuxt js')) aliases.add('nuxtjs');
  if (base.includes('rest api')) aliases.add('restful api');
  if (base.includes('ci cd')) aliases.add('cicd');
  if (base.includes('web sockets')) aliases.add('websocket');

  return Array.from(aliases).filter(Boolean);
}

function buildPhrasePattern(phrase) {
  const escaped = escapeRegex(phrase.trim());
  if (!escaped) return null;
  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'i');
}

function phraseExists(text, phrase) {
  const pattern = buildPhrasePattern(phrase);
  return pattern ? pattern.test(text) : false;
}

function parseCsvRows(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  return lines.slice(1).map((line) => {
    const commaIndex = line.lastIndexOf(',');
    if (commaIndex === -1) return null;

    const skill = line.slice(0, commaIndex).trim();
    const count = Number(line.slice(commaIndex + 1).trim());
    if (!skill || Number.isNaN(count)) return null;

    return { skill, count };
  }).filter(Boolean);
}

function loadSkillDictionary() {
  if (cachedDictionary) return cachedDictionary;

  const raw = JSON.parse(fs.readFileSync(SKILL_DICTIONARY_PATH, 'utf8'));
  cachedDictionary = Object.fromEntries(
    Object.entries(raw).map(([track, keywords]) => [
      track,
      Array.from(
        new Set(
          (Array.isArray(keywords) ? keywords : [])
            .map((keyword) => String(keyword).trim().toLowerCase())
            .filter(Boolean)
        )
      ),
    ])
  );

  return cachedDictionary;
}

function loadMarketData() {
  if (cachedMarketData) return cachedMarketData;

  const marketData = {};
  for (const [track, filename] of Object.entries(TRACK_FREQUENCY_FILES)) {
    const rows = parseCsvRows(path.join(ROOT_DIR, 'DataPipeline/data/skills', filename));
    marketData[track] = rows
      .sort((a, b) => b.count - a.count)
      .map((row, index) => ({
        ...row,
        rank: index + 1,
        track,
      }));
  }

  cachedMarketData = marketData;
  return cachedMarketData;
}

function getSupportedTracks() {
  return Object.keys(TRACK_FREQUENCY_FILES);
}

function extractSkillsFromText(text) {
  const searchableText = toSearchableText(text);
  const sentences = splitSentences(text).map((sentence) => ({
    raw: sentence,
    searchable: toSearchableText(sentence),
  }));
  const dictionary = loadSkillDictionary();
  const hits = new Map();

  for (const [track, keywords] of Object.entries(dictionary)) {
    for (const keyword of keywords) {
      const aliases = buildSkillAliases(keyword);
      const matchedSentences = [];

      for (const sentence of sentences) {
        if (aliases.some((alias) => phraseExists(sentence.searchable, alias))) {
          matchedSentences.push(sentence.raw);
        }
      }

      if (!matchedSentences.length && !aliases.some((alias) => phraseExists(searchableText, alias))) {
        continue;
      }

      const existing = hits.get(keyword) || {
        skill: keyword,
        tracks: new Set(),
        mentions: new Set(),
        confidence: 0,
      };

      existing.tracks.add(track);
      const evidence = matchedSentences[0] || text.slice(0, 180).trim();
      if (evidence) existing.mentions.add(evidence);
      existing.confidence = Math.min(
        0.98,
        existing.confidence + 0.25 + Math.min(0.15 * matchedSentences.length, 0.3)
      );
      hits.set(keyword, existing);
    }
  }

  return Array.from(hits.values()).map((item) => ({
    skill: item.skill,
    tracks: Array.from(item.tracks),
    mentions: Array.from(item.mentions).slice(0, 3),
    confidence: Number(item.confidence.toFixed(2)),
  }));
}

function inferTrack(detectedSkills) {
  const marketData = loadMarketData();
  const scores = new Map(getSupportedTracks().map((track) => [track, 0]));

  for (const skill of detectedSkills) {
    for (const track of skill.tracks || []) {
      const trackMarketSkills = marketData[track] || [];
      const marketSkill = trackMarketSkills.find(
        (row) => normalizeText(row.skill) === normalizeText(skill.skill)
      );
      const weight = marketSkill ? marketSkill.count : 1;
      const confidence = skill.confidence || 0.5;
      scores.set(track, (scores.get(track) || 0) + weight * confidence);
    }
  }

  const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  return ranked[0] && ranked[0][1] > 0 ? ranked[0][0] : 'Machine Learning / AI';
}

function getMarketSkills(track, limit = 12) {
  const marketData = loadMarketData();
  const selectedTrack = marketData[track] ? track : inferTrack([]);
  return (marketData[selectedTrack] || []).slice(0, limit);
}

function computeMatchScore(currentSkills, marketSkills) {
  if (!marketSkills.length) return 0;

  const currentSet = new Set(currentSkills.map((skill) => normalizeText(skill.skill)));
  const matchedWeight = marketSkills.reduce(
    (sum, skill) => sum + (currentSet.has(normalizeText(skill.skill)) ? skill.count : 0),
    0
  );
  const totalWeight = marketSkills.reduce((sum, skill) => sum + skill.count, 0);

  return totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
}

module.exports = {
  buildSkillAliases,
  computeMatchScore,
  extractSkillsFromText,
  getMarketSkills,
  getSupportedTracks,
  inferTrack,
  normalizeText,
  splitSentences,
};
