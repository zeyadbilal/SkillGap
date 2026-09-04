const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = process.env.CV_NLP_SCRIPT_PATH
  || path.join(__dirname, '..', '..', '..', 'model', 'nlp', 'spacy_extractor.py');
const CONDA_ENV = process.env.CV_NLP_CONDA_ENV || 'myproject';

function isCondaAvailable() {
  try {
    const which = require('child_process').spawnSync('conda', ['--version']);
    return which.status === 0;
  } catch (e) {
    return false;
  }
}

function isAvailable() {
  return fs.existsSync(SCRIPT_PATH) && isCondaAvailable();
}

function extract(cvText, timeout = 30_000) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(SCRIPT_PATH)) return reject(new Error('Python extractor script not found'));

    const args = ['run', '-n', CONDA_ENV, 'python', SCRIPT_PATH];
    const proc = spawn('conda', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let out = '';
    let err = '';
    proc.stdout.on('data', (chunk) => (out += chunk.toString()));
    proc.stderr.on('data', (chunk) => (err += chunk.toString()));

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('pyNlpService: process timeout'));
    }, timeout);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`pyNlpService failed: ${err || 'exit '+code}`));
      try {
        const parsed = JSON.parse(out);
        return resolve(parsed.detectedSkills || parsed);
      } catch (e) {
        return reject(new Error('pyNlpService: invalid JSON output ' + e.message));
      }
    });

    proc.stdin.write(String(cvText || ''));
    proc.stdin.end();
  });
}

module.exports = { isAvailable, extract };
