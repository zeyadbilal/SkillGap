const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Skill = sequelize.define(
  'Skill',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    skillName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'skill_name',
    },
    category: {
      type: DataTypes.STRING(50),
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    schema: 'skills',
    tableName: 'skills',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Skill;
