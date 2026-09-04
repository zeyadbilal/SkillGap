const config = require('../../src/config');
const { modulePaths, moduleSchemas } = require('./modules');
const { securitySchemes } = require('./components/securitySchemes');

const openApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SkillGap API',
    version: '1.0.0',
    description:
      'Job-Market Skill-Gap Advisor API — register, authenticate, analyze CVs, and generate skill-gap recommendations.',
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'User registration and authentication' },
    { name: 'Recommendations', description: 'CV analysis and skill-gap recommendations' },
    { name: 'System', description: 'System-level endpoints' },
  ],
  paths: modulePaths,
  components: {
    securitySchemes,
    schemas: moduleSchemas,
  },
};

module.exports = { openApiDocument };
