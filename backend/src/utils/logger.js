const winston = require('winston');
const { WinstonTransport } = require('@axiomhq/winston');

const transports = [new winston.transports.Console()];

if (process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET) {
  transports.push(
    new WinstonTransport({
      dataset: process.env.AXIOM_DATASET,
      token: process.env.AXIOM_TOKEN,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: { error: 0, warn: 1, info: 2, debug: 3 },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'skill-gap-advisor-backend' },
  transports,
});

module.exports = logger;
