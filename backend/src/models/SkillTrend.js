const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SkillTrend = sequelize.define(
  "SkillTrend",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    track: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    skillName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "skill_name",
    },

    sampleDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "sample_date",
    },

    frequency: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "skill_trends",
    timestamps: false,
  },
);

module.exports = SkillTrend;
