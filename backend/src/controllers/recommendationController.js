const cvRecommendationService = require('../services/recommendation/cvRecommendationService');
const analysisHistoryService = require('../services/analysisHistoryService');
const { extractText } = require('../services/cv/cvParserService');
const { TRACK_NAMES } = require('../config/tracks');

async function analyzeCv(req, res, next) {
  try {
    const input = { ...req.body };
    const track = req.user.fieldOfStudy;
    if (track && TRACK_NAMES.includes(track)) {
      input.track = track;
    }
    if (req.file) {
      const { text } = await extractText(req.file.path, req.file.originalname);
      input.cvText = text;
    }

    const result = await cvRecommendationService.analyzeCv(input);

    await analysisHistoryService.createForUser(req.user.id, {
      result,
      track: input.track,
      source: req.file ? 'file' : 'text',
    });

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
