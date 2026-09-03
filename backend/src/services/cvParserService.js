const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

function normalizeExtractedText(text) {
  return String(text || '')
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function scoreTextQuality(text) {
  const value = String(text || '');
  const length = value.length || 1;
  const printable = value.replace(/[^\x20-\x7E\u00A0-\u024F]/g, '');
  const letters = value.replace(/[^A-Za-z]/g, '');
  const replacementChars = (value.match(/�/g) || []).length;
  const tokens = value.split(/\s+/).filter(Boolean);
  const readableTokens = tokens.filter((token) => /[A-Za-z]{2,}/.test(token));
  const cleanWords = tokens.filter((token) => /^[A-Za-z][A-Za-z'&/.\-+]*$/.test(token));
  const anchors = [
    'technical skills',
    'projects',
    'education',
    'activities',
    'programming languages',
    'frameworks',
    'tools',
    'experience',
  ].reduce((count, phrase) => count + (value.toLowerCase().includes(phrase) ? 1 : 0), 0);

  return {
    printableRatio: printable.length / length,
    letterRatio: letters.length / length,
    replacementRatio: replacementChars / length,
    readableTokenRatio: tokens.length ? readableTokens.length / tokens.length : 0,
    cleanWordRatio: tokens.length ? cleanWords.length / tokens.length : 0,
    anchors,
  };
}

function looksGarbage(text) {
  const cleaned = String(text || '').trim();
  if (cleaned.length < 50) return true;

  const { printableRatio, letterRatio, replacementRatio, readableTokenRatio, cleanWordRatio } =
    scoreTextQuality(cleaned);
  return (
    replacementRatio > 0.01 ||
    printableRatio < 0.55 ||
    letterRatio < 0.3 ||
    readableTokenRatio < 0.35 ||
    cleanWordRatio < 0.35
  );
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stderr = stderr;
        return reject(error);
      }
      resolve(stdout);
    });
  });
}

async function extractTextWithPdfJs(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await pdfjs.getDocument({ data: buffer, useWorkerFetch: false }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => (typeof item.str === 'string' ? item.str : ''))
      .filter(Boolean)
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n');
}

async function extractTextWithOcr(filePath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillgap-ocr-'));
  const renderScript = [
    'from pathlib import Path',
    'import fitz',
    'import sys',
    '',
    'pdf_path = Path(sys.argv[1])',
    'out_dir = Path(sys.argv[2])',
    'doc = fitz.open(str(pdf_path))',
    'for i, page in enumerate(doc):',
    '    if i >= 3:',
    '        break',
    '    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)',
    '    pix.save(str(out_dir / f"page_{i+1}.png"))',
  ].join('\n');

  try {
    await runCommand('python', ['-c', renderScript, filePath, tempDir]);
    const images = fs
      .readdirSync(tempDir)
      .filter((name) => name.endsWith('.png'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const pages = [];

    for (const image of images) {
      const imagePath = path.join(tempDir, image);
      const ocr = await runCommand('tesseract', [imagePath, 'stdout', '--psm', '6']);
      pages.push(ocr.trim());
    }

    return pages.join('\n');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error(`Unsupported file type: ${ext}`);
    err.statusCode = 400;
    err.errorCode = 'INVALID_FILE_TYPE';
    throw err;
  }

  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE_BYTES) {
    const err = new Error('File exceeds 10MB limit');
    err.statusCode = 400;
    err.errorCode = 'FILE_TOO_LARGE';
    throw err;
  }

  if (ext === '.pdf') {
    const ocr = normalizeExtractedText(await extractTextWithOcr(filePath));
    if (!looksGarbage(ocr)) {
      return { text: ocr, fileSize: stats.size, parser: 'ocr' };
    }

    const buffer = fs.readFileSync(filePath);
    const parsed = normalizeExtractedText((await pdfParse(buffer)).text);
    if (!looksGarbage(parsed)) {
      return { text: parsed, fileSize: stats.size, parser: 'pdf-parse' };
    }

    const fallback = normalizeExtractedText(await extractTextWithPdfJs(filePath));
    return { text: fallback || parsed || ocr, fileSize: stats.size, parser: 'pdfjs-dist' };
  }

  if (ext === '.docx') {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return { text: normalizeExtractedText(value), fileSize: stats.size, parser: 'mammoth' };
  }

  return { text: normalizeExtractedText(fs.readFileSync(filePath, 'utf8')), fileSize: stats.size, parser: 'text' };
}

function extractEducation(text) {
  const degreeMatch = text.match(/\b(B\.?Sc\.?|Bachelor|M\.?Sc\.?|Master|Ph\.?D\.?)[^\n]{0,80}/i);
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);

  return {
    degree: degreeMatch ? degreeMatch[0].trim() : null,
    graduationYear: yearMatch ? Number(yearMatch[0]) : null,
  };
}

async function parseCv(filePath, originalName) {
  const { text, fileSize, parser } = await extractText(filePath, originalName);
  const extractedEducation = extractEducation(text);

  logger.info('CV parsed', { originalName, fileSize, parser });

  return {
    fileSize,
    text,
    parser,
    extractedEducation,
    totalCharacters: text.length,
  };
}

module.exports = { parseCv, extractText, extractEducation };
