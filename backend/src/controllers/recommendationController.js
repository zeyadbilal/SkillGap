const recommendationService = require('../services/recommendationService');

const analyze = async (req, res, next) => {
  try {
    const result = await recommendationService.analyzeCv(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const tracks = (req, res) => {
  res.status(200).json({
    success: true,
    data: recommendationService.getSupportedTracks(),
  });
};

module.exports = { analyze, tracks };
