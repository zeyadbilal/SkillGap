const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define(
  'Report',
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
      references: { model: 'users', key: 'id' },
    },
    sector: {
      type: DataTypes.STRING(100),
    },
    gapAnalysis: {
      type: DataTypes.JSONB,
      field: 'gap_analysis',
    },
    recommendations: {
      type: DataTypes.JSONB,
    },
    generatedAt: {
      type: DataTypes.DATE,
      field: 'generated_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'reports',
    underscored: true,
    timestamps: false,
  }
);

module.exports = Report;
