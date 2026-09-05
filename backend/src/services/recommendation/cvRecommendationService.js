const modelClient = require('../model/modelClient');

async function analyzeCv(input) {
  const cvText = String(input.cvText || '').trim();
  if (cvText.length < 20) {
    const error = new Error('cvText must be at least 20 characters');
    error.statusCode = 400;
    error.errorCode = 'INVALID_CV_TEXT';
    throw error;
  }

  return modelClient.analyze({
    ...input,
    cvText,
  });
}

module.exports = { analyzeCv };
