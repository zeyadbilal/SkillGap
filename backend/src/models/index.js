const { sequelize } = require("../config/database");
const User = require("./User");
const Skill = require("./Skill");
const UserSkill = require("./UserSkill");
const Report = require("./Report");
const SkillTrend = require("./SkillTrend");

// Users <-> Skills (through user_skills)
User.belongsToMany(Skill, {
  through: UserSkill,
  foreignKey: "user_id",
  otherKey: "skill_id",
  as: "skills",
});
Skill.belongsToMany(User, {
  through: UserSkill,
  foreignKey: "skill_id",
  otherKey: "user_id",
  as: "users",
});

// Join helpers on the through model
UserSkill.belongsTo(User, { foreignKey: "user_id", as: "user" });
UserSkill.belongsTo(Skill, { foreignKey: "skill_id", as: "skill" });

// User -> Reports
User.hasMany(Report, { foreignKey: "user_id", as: "reports" });
Report.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Skill -> SkillTrends

module.exports = {
  sequelize,
  User,
  Skill,
  UserSkill,
  Report,
  SkillTrend,
};
