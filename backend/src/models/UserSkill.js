const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSkill = sequelize.define(
  'UserSkill',
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
    skillId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'skill_id',
      references: { model: 'skills', key: 'id' },
    },
    proficiencyLevel: {
      type: DataTypes.STRING(20),
      field: 'proficiency_level',
      validate: {
        isIn: [['Beginner', 'Intermediate', 'Advanced', 'Expert']],
      },
    },
    yearsExperience: {
      type: DataTypes.INTEGER,
      field: 'years_experience',
    },
  },
  {
    schema: 'skills',
    tableName: 'user_skills',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ unique: true, fields: ['user_id', 'skill_id'] }],
  }
);

module.exports = UserSkill;
