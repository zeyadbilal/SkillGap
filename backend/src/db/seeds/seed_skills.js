require('dotenv').config();
const { pool } = require('../../config/database');
const skillRepository = require('../../repositories/skillRepository');
const logger = require('../../utils/logger');


const SEED_SKILLS = [
  { name: 'Python', category: 'Programming Language' },
  { name: 'Java', category: 'Programming Language' },
  { name: 'JavaScript', category: 'Programming Language' },
  { name: 'TypeScript', category: 'Programming Language' },
  { name: 'React', category: 'Framework' },
  { name: 'Django', category: 'Framework' },
  { name: 'Spring', category: 'Framework' },
  { name: 'Express', category: 'Framework' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'Docker', category: 'DevOps/Infrastructure' },
  { name: 'Kubernetes', category: 'DevOps/Infrastructure' },
  { name: 'AWS', category: 'Cloud Platform' },
  { name: 'Azure', category: 'Cloud Platform' },
  { name: 'GCP', category: 'Cloud Platform' },
  { name: 'Git', category: 'Tool' },
  { name: 'Jenkins', category: 'Tool' },
  { name: 'Figma', category: 'Tool' },
  { name: 'Communication', category: 'Soft Skill' },
  { name: 'Leadership', category: 'Soft Skill' },
  { name: 'English', category: 'Language' },
  { name: 'Arabic', category: 'Language' },
];

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

async function seed() {
  for (const skill of SEED_SKILLS) {
    await skillRepository.upsert({
      name: skill.name,
      normalizedName: normalize(skill.name),
      category: skill.category,
    });
  }
  logger.info(`Seeded ${SEED_SKILLS.length} skills`);
  await pool.end();
}

if (require.main === module) {
  seed().catch((err) => {
    logger.error('Seeding failed', { error: err.message });
    process.exit(1);
  });
}

module.exports = { seed };
