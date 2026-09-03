const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: false,
  },
  pool: {
    max: Number(process.env.PG_POOL_MAX) || 20,
    min: Number(process.env.PG_POOL_MIN) || 0,
    idle: 30000,
    acquire: 5000,
  },
  logging: false,
});

module.exports = { sequelize };
