const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SkillTrend = sequelize.define(
  'SkillTrend',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    skillId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'skill_id',
      references: { model: 'skills', key: 'id' },
    },
    sector: {
      type: DataTypes.STRING(100),
    },
    month: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    demandScore: {
      type: DataTypes.FLOAT,
      field: 'demand_score',
    },
    avgSalary: {
      type: DataTypes.DECIMAL,
      field: 'avg_salary',
    },
    jobCount: {
      type: DataTypes.INTEGER,
      field: 'job_count',
    },
    trendDirection: {
      type: DataTypes.STRING(10),
      field: 'trend_direction',
      validate: {
        isIn: [['up', 'down', 'stable']],
      },
    },
  },
  {
    tableName: 'skill_trends',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ unique: true, fields: ['skill_id', 'sector', 'month'] }],
  }
);

module.exports = SkillTrend;
