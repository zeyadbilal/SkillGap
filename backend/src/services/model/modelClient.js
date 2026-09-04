const axios = require('axios');
const config = require('../../config');

function serviceError(message, errorCode = 'MODEL_UNAVAILABLE', statusCode = 503) {
  const error = new Error(message);
  error.errorCode = errorCode;
  error.statusCode = statusCode;
  return error;
}

function parsePayload(data) {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  try {
    return JSON.parse(data);
  } catch {
    throw serviceError('Model service returned invalid JSON', 'MODEL_BAD_RESPONSE', 502);
  }
}

async function analyze(input) {
  try {
    const response = await axios.post(`${config.model.baseUrl}/analyze`, input, {
      timeout: config.model.timeoutMs,
    });

    const payload = parsePayload(response.data);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw serviceError('Model service returned an invalid response', 'MODEL_BAD_RESPONSE', 502);
    }
    return payload;
  } catch (error) {
    if (error && error.statusCode) throw error;

    if (axios.isAxiosError(error) && error.response) {
      const payload = parsePayload(error.response.data);
      throw serviceError(
        payload && payload.error ? payload.error : 'Model service request failed',
        payload && payload.errorCode ? payload.errorCode : 'MODEL_UNAVAILABLE',
        error.response.status >= 400 && error.response.status < 500 ? error.response.status : 503
      );
    }
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw serviceError('Model service request timed out');
    }
    throw serviceError('Model service is unavailable');
  }
}

module.exports = { analyze };