const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Analysis = sequelize.define(
  'Analysis',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    track: {
      type: DataTypes.STRING(60),
    },
    source: {
      type: DataTypes.STRING(10),
      validate: {
        isIn: [['file', 'text']],
      },
    },
    matchScore: {
      type: DataTypes.INTEGER,
      field: 'match_score',
    },
    detectedSkills: {
      type: DataTypes.INTEGER,
      field: 'detected_skills',
    },
    missingSkills: {
      type: DataTypes.INTEGER,
      field: 'missing_skills',
    },
    result: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: 'analyses',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['user_id', 'created_at'],
        name: 'analyses_user_id_created_at_idx',
      },
    ],
  }
);

module.exports = Analysis;