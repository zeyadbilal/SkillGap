const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PGDATABASE || 'skill_gap_advisor',
  process.env.PGUSER || 'skill_gap_app',
  process.env.PGPASSWORD || 'password',
  {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    dialect: 'postgres',
    pool: {
      max: Number(process.env.PG_POOL_MAX) || 20,
      min: Number(process.env.PG_POOL_MIN) || 0,
      idle: 30000,
      acquire: 5000,
    },
  }
);


module.exports = { sequelize };
