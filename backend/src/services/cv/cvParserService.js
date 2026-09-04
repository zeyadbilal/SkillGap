const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Supports: PDF, DOCX, TXT files (max 10MB)

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

function cvError(message, errorCode, statusCode) {
  const error = new Error(message);
  error.code = errorCode;
  error.errorCode = errorCode;
  error.statusCode = statusCode;
  return error;
}

function validateFileSignature(buffer, extension) {
  if (extension === '.pdf' && !buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    throw cvError('The uploaded file is not a valid PDF', 'INVALID_FILE_TYPE', 400);
  }

  if (extension === '.docx') {
    const signature = buffer.subarray(0, 4).toString('hex');
    const hasZipSignature = ['504b0304', '504b0506', '504b0708'].includes(signature);
    const hasDocumentEntry = buffer.includes(Buffer.from('word/document.xml'));
    if (!hasZipSignature || !hasDocumentEntry) {
      throw cvError('The uploaded file is not a valid DOCX document', 'INVALID_FILE_TYPE', 400);
    }
  }
}

async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw cvError(`Unsupported file type: ${ext}`, 'INVALID_FILE_TYPE', 400);
  }

  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE_BYTES) {
    throw cvError('File exceeds 10MB limit', 'FILE_TOO_LARGE', 413);
  }

  const buffer = fs.readFileSync(filePath);
  validateFileSignature(buffer, ext);

  try {
    if (ext === '.pdf') {
      const data = await pdfParse(buffer);
      return { text: data.text, fileSize: stats.size };
    }

    if (ext === '.docx') {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return { text: value, fileSize: stats.size };
    }

    return { text: buffer.toString('utf8'), fileSize: stats.size };
  } catch (error) {
    if (error.errorCode) throw error;
    throw cvError('The uploaded CV could not be parsed', 'CV_PARSE_FAILED', 422);
  }
}

module.exports = { extractText };
