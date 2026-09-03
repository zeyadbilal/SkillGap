const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { openApiDocument } = require('../docs/rest-api');

const router = express.Router();

router.get('/specs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiDocument);
});

router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  })
);

module.exports = router;
