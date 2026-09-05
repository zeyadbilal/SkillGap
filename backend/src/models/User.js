const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    fullName: {
      type: DataTypes.STRING(255),
      field: 'full_name',
    },
    fieldOfStudy: {
      type: DataTypes.STRING(100),
      field: 'field_of_study',
    },
    graduationYear: {
      type: DataTypes.INTEGER,
      field: 'graduation_year',
      validate: {
        min: { args: [2000], msg: 'graduation year too early' },
      },
    },
  },
  {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = User;
