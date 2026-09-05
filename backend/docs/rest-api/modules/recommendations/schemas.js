const recommendationsSchemas = {
  AnalyzeCvRequest: {
    type: 'object',
    description: 'CV analysis request. Provide cvText (JSON body or multipart field) and/or an uploaded CV file.',
    properties: {
      cvText: {
        type: 'string',
        minLength: 20,
        example: 'Machine Learning Engineer with 2 years experience building computer vision systems with Python and TensorFlow.',
      },
      file: {
        type: 'string',
        format: 'binary',
        description: 'CV file (PDF, DOCX, or TXT), max 10MB.',
      },
    },
  },

  ProfileSummary: {
    type: 'object',
    properties: {
      track: { type: 'string', example: 'Machine Learning / AI' },
      matchScore: { type: 'integer', minimum: 0, maximum: 100, example: 68 },
      detectedSkills: { type: 'integer', example: 12 },
      missingSkills: { type: 'integer', example: 5 },
      marketSkillsReviewed: { type: 'integer', example: 12 },
      bestSkills: {
        type: 'array',
        items: { type: 'string' },
        example: ['Python', 'TensorFlow'],
      },
    },
  },

  CurrentSkill: {
    type: 'object',
    properties: {
      skill: { type: 'string', example: 'Python' },
      tracks: { type: 'array', items: { type: 'string' } },
      mentions: {
        oneOf: [{ type: 'integer' }, { type: 'array', items: { type: 'string' } }],
      },
      confidence: { type: 'number', minimum: 0, maximum: 1, example: 0.9 },
      proficiencyLevel: {
        type: 'string',
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      proficiencyRank: { type: 'integer', minimum: 1, maximum: 4, example: 2 },
    },
  },

  LearningResource: {
    type: 'object',
    properties: {
      title: { type: 'string', example: 'SQL fundamentals' },
      type: {
        type: 'string',
        enum: ['course', 'project', 'community'],
        example: 'course',
      },
    },
  },

  SkillGap: {
    type: 'object',
    properties: {
      skill: { type: 'string', example: 'SQL' },
      track: { type: 'string', example: 'Backend Development' },
      demandScore: { type: 'number', minimum: 0, maximum: 1, example: 0.71 },
      count: { type: 'integer', example: 412 },
      marketRank: { type: 'integer', example: 1 },
      priority: { type: 'integer', minimum: 1, maximum: 10, example: 8 },
      reason: { type: 'string', example: 'Frequently requested in Backend Development roles' },
      learningResources: {
        type: 'array',
        items: { $ref: '#/components/schemas/LearningResource' },
      },
    },
  },

  RoadmapMonth: {
    type: 'object',
    properties: {
      month: { type: 'integer', example: 1 },
      title: { type: 'string', example: 'Focus: SQL, Docker, AWS' },
      skills: { type: 'array', items: { type: 'string' } },
      projects: { type: 'array', items: { type: 'string' } },
      estimatedHours: { type: 'integer', example: 54 },
      hoursPerWeek: { type: 'integer', example: 14 },
    },
  },

  UsefulStuff: {
    type: 'object',
    properties: {
      topMarketSkills: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            skill: { type: 'string' },
            count: { type: 'integer' },
            rank: { type: 'integer' },
          },
        },
      },
      nextActions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            why: { type: 'string' },
          },
        },
      },
    },
  },

  AnalyzeCvResponse: {
    type: 'object',
    description: 'Successful CV analysis payload.',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          profileSummary: { $ref: '#/components/schemas/ProfileSummary' },
          currentSkills: {
            type: 'array',
            items: { $ref: '#/components/schemas/CurrentSkill' },
          },
          skillGaps: {
            type: 'array',
            items: { $ref: '#/components/schemas/SkillGap' },
          },
          learningRoadmap: {
            type: 'array',
            items: { $ref: '#/components/schemas/RoadmapMonth' },
          },
          usefulStuff: { $ref: '#/components/schemas/UsefulStuff' },
          generatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-09-05T00:00:00.000Z',
          },
          pipeline: {
            type: 'object',
            properties: {
              extractor: { type: 'string', example: 'python-spacy' },
            },
          },
        },
      },
    },
  },

  AnalysisHistoryListItem: {
    type: 'object',
    description: 'Summary of one stored analysis, used by the history list. The full result payload is omitted.',
    properties: {
      id: { type: 'string', format: 'uuid', example: '2f6e60d8-9f5c-4f5b-8c1a-000000000001' },
      track: { type: 'string', nullable: true, example: 'Machine Learning / AI' },
      source: {
        type: 'string',
        enum: ['file', 'text'],
        example: 'file',
      },
      matchScore: { type: 'integer', nullable: true, minimum: 0, maximum: 100, example: 68 },
      detectedSkills: { type: 'integer', nullable: true, example: 12 },
      missingSkills: { type: 'integer', nullable: true, example: 5 },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-05T10:00:00.000Z',
      },
    },
  },

  HistoryListResponse: {
    type: 'object',
    description: 'List of previous analyses for the authenticated user.',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/AnalysisHistoryListItem' },
      },
    },
  },

  HistoryDetailResponse: {
    type: 'object',
    description: 'Full stored analysis for one previous CV analysis.',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '2f6e60d8-9f5c-4f5b-8c1a-000000000001' },
          track: { type: 'string', nullable: true, example: 'Machine Learning / AI' },
          source: {
            type: 'string',
            enum: ['file', 'text'],
            example: 'file',
          },
          result: { type: 'object', additionalProperties: true },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-09-05T10:00:00.000Z',
          },
        },
      },
    },
  },
};

module.exports = { recommendationsSchemas };