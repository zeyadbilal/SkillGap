const cvRecommendationService = require('../services/cvRecommendationService');

async function analyzeCv(req, res, next) {
  try {
    const result = await cvRecommendationService.analyzeCv(req.body);
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
