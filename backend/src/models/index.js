const { sequelize } = require('../config/database');
const User = require('./User');
const Analysis = require('./Analysis');

User.hasMany(Analysis, {
  foreignKey: 'userId',
  as: 'analyses',
  onDelete: 'CASCADE',
});

Analysis.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = {
  sequelize,
  User,
  Analysis,
};