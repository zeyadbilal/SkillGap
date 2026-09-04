const cvRecommendationService = require('../services/recommendation/cvRecommendationService');
const { extractText } = require('../services/cv/cvParserService');
const { trackFromFieldOfStudy } = require('../config/tracks');

function requestError(message, errorCode, statusCode) {
  const error = new Error(message);
  error.errorCode = errorCode;
  error.statusCode = statusCode;
  return error;
}

async function analyzeCv(req, res, next) {
  try {
    const input = { ...req.body };
    const track = trackFromFieldOfStudy(req.user.fieldOfStudy);
    if (track) input.track = track;
    if (req.file) {
      const { text } = await extractText(req.file.path, req.file.originalname);
      const cvText = String(text || '').trim();
      if (!cvText) {
        throw requestError('The uploaded CV contains no extractable text', 'EMPTY_CV_TEXT', 422);
      }
      input.cvText = cvText;
    }

    const result = await cvRecommendationService.analyzeCv(input);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  analyzeCv,
};
