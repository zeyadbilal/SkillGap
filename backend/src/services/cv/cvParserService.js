const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

// Supports: PDF, DOCX, TXT files (max 10MB)

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.txt',
]);

function cvError(message, errorCode, statusCode) {
  const error = new Error(message);

  error.code = errorCode;
  error.errorCode = errorCode;
  error.statusCode = statusCode;

  return error;
}

function validateFileSignature(buffer, extension) {
  /* ================= PDF ================= */

  if (extension === '.pdf') {
    const pdfSignature = buffer
      .subarray(0, 5)
      .toString();

    if (pdfSignature !== '%PDF-') {
      throw cvError(
        'The uploaded file is not a valid PDF',
        'INVALID_FILE_TYPE',
        400,
      );
    }
  }

  /* ================= DOCX ================= */

  if (extension === '.docx') {
    const signature = buffer
      .subarray(0, 4)
      .toString('hex');

    const hasZipSignature = [
      '504b0304',
      '504b0506',
      '504b0708',
    ].includes(signature);

    const hasDocumentEntry = buffer.includes(
      Buffer.from('word/document.xml'),
    );

    if (!hasZipSignature || !hasDocumentEntry) {
      throw cvError(
        'The uploaded file is not a valid DOCX document',
        'INVALID_FILE_TYPE',
        400,
      );
    }
  }
}

async function extractPdfText(buffer) {
  let parser = null;

  try {
    parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    return result.text || '';
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

async function extractText(filePath, originalName) {
  const ext = path
    .extname(originalName)
    .toLowerCase();

  /* ================= FILE TYPE ================= */

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw cvError(
      `Unsupported file type: ${ext}`,
      'INVALID_FILE_TYPE',
      400,
    );
  }

  /* ================= FILE SIZE ================= */

  const stats = fs.statSync(filePath);

  if (stats.size > MAX_FILE_SIZE_BYTES) {
    throw cvError(
      'File exceeds 10MB limit',
      'FILE_TOO_LARGE',
      413,
    );
  }

  /* ================= READ FILE ================= */

  const buffer = fs.readFileSync(filePath);

  validateFileSignature(buffer, ext);

  try {
    let text = '';

    /* ================= PDF ================= */

    if (ext === '.pdf') {
      text = await extractPdfText(buffer);
    }

    /* ================= DOCX ================= */

    if (ext === '.docx') {
      const result =
        await mammoth.extractRawText({
          path: filePath,
        });

      text = result.value || '';
    }

    /* ================= TXT ================= */

    if (ext === '.txt') {
      text = buffer.toString('utf8');
    }

    /* ================= EMPTY CV ================= */

    const cleanedText = text.trim();

    if (!cleanedText) {
      throw cvError(
        'No readable text could be extracted from the CV',
        'CV_TEXT_EMPTY',
        422,
      );
    }

    return {
      text: cleanedText,
      fileSize: stats.size,
    };
  } catch (error) {
    if (error.errorCode) {
      throw error;
    }

    console.error(
      'CV parsing error:',
      error,
    );

    throw cvError(
      'The uploaded CV could not be parsed',
      'CV_PARSE_FAILED',
      422,
    );
  }
}

module.exports = {
  extractText,
};