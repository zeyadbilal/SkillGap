const { authPaths } = require('./auth');
const { systemPaths } = require('./system');
const { recommendationsPaths } = require('./recommendations');
const { authSchemas } = require('./auth/schemas');
const { systemSchemas } = require('./system/schemas');
const { recommendationsSchemas } = require('./recommendations/schemas');
const { commonSchemas } = require('../components/schemas/common');
const { userSchemas } = require('../components/schemas/user');

const modulePaths = {
  ...authPaths,
  ...systemPaths,
  ...recommendationsPaths,
};

const moduleSchemas = {
  ...commonSchemas,
  ...userSchemas,
  ...authSchemas,
  ...systemSchemas,
  ...recommendationsSchemas,
};

module.exports = { modulePaths, moduleSchemas };
