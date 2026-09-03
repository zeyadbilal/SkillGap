const { authPaths } = require('./auth');
const { systemPaths } = require('./system');
const { authSchemas } = require('./auth/schemas');
const { systemSchemas } = require('./system/schemas');
const { commonSchemas } = require('../components/schemas/common');
const { userSchemas } = require('../components/schemas/user');

const modulePaths = {
  ...authPaths,
  ...systemPaths,
};

const moduleSchemas = {
  ...commonSchemas,
  ...userSchemas,
  ...authSchemas,
  ...systemSchemas,
};

module.exports = { modulePaths, moduleSchemas };
