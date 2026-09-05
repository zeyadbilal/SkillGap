const analysisHistoryService = require('../services/analysisHistoryService');

async function listHistory(req, res, next) {
  try {
    const { limit } = req.query;
    const analyses = await analysisHistoryService.listForUser(req.user.id, { limit });

    return res.status(200).json({
      success: true,
      data: analyses.map((analysis) => ({
        id: analysis.id,
        track: analysis.track,
        source: analysis.source,
        matchScore: analysis.matchScore,
        detectedSkills: analysis.detectedSkills,
        missingSkills: analysis.missingSkills,
        createdAt: analysis.createdAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function getHistoryDetail(req, res, next) {
  try {
    const { id } = req.params;

    const analysis = await analysisHistoryService.getByIdForUser(req.user.id, id);

    if (!analysis) {
      const error = new Error('Analysis not found');
      error.statusCode = 404;
      error.errorCode = 'NOT_FOUND';
      return next(error);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: analysis.id,
        track: analysis.track,
        source: analysis.source,
        result: analysis.result,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listHistory,
  getHistoryDetail,
};