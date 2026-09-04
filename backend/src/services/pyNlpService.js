const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = process.env.CV_NLP_SCRIPT_PATH
  || path.join(__dirname, '..', '..', '..', 'model', 'nlp', 'spacy_extractor.py');
const CONDA_ENV = process.env.CV_NLP_CONDA_ENV || 'myproject';

function isCondaAvailable() {
  const check = spawnSync('conda', ['--version'], { stdio: 'ignore' });
  return check.status === 0;
}

function isAvailable() {
  return fs.existsSync(SCRIPT_PATH) && isCondaAvailable();
}

function extract(cvText, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    if (!isCondaAvailable()) {
      const err = new Error('conda is not available');
      err.code = 'CONDA_NOT_FOUND';
      return reject(err);
    }
    if (!fs.existsSync(SCRIPT_PATH)) {
      const err = new Error(`CV NLP script not found at ${SCRIPT_PATH}`);
      err.code = 'NLP_SCRIPT_NOT_FOUND';
      return reject(err);
    }

    const proc = spawn('conda', ['run', '-n', CONDA_ENV, 'python', SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      const err = new Error('CV NLP extraction timeout');
      err.code = 'NLP_TIMEOUT';
      reject(err);
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const err = new Error(`CV NLP extraction failed: ${stderr || `exit ${code}`}`);
        err.code = 'NLP_PROCESS_FAILED';
        return reject(err);
      }
      try {
        const parsed = JSON.parse(stdout);
        return resolve(parsed);
      } catch (parseErr) {
        const err = new Error(`CV NLP output parse failed: ${parseErr.message}`);
        err.code = 'NLP_OUTPUT_INVALID';
        return reject(err);
      }
    });

    proc.stdin.write(String(cvText || ''));
    proc.stdin.end();
  });
}

module.exports = {
  extract,
  isAvailable,
};
