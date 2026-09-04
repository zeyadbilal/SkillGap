const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = process.env.CV_NLP_SCRIPT_PATH
  || path.join(__dirname, '..', '..', '..', 'model', 'nlp', 'spacy_extractor.py');
const CONDA_ENV = process.env.CV_NLP_CONDA_ENV;
const PYTHON_BIN = process.env.CV_NLP_PYTHON_BIN;

function commandExists(command) {
  const check = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return check.status === 0;
}

function getPythonCommand() {
  if (CONDA_ENV) {
    return {
      command: 'conda',
      args: ['run', '-n', CONDA_ENV, 'python', SCRIPT_PATH],
      missingCode: 'CONDA_NOT_FOUND',
      missingMessage: 'conda is not available',
    };
  }

  const pythonCommand = PYTHON_BIN
    || (commandExists('python3') ? 'python3' : 'python');

  return {
    command: pythonCommand,
    args: [SCRIPT_PATH],
    missingCode: 'PYTHON_NOT_FOUND',
    missingMessage: `${pythonCommand} is not available`,
  };
}

function isAvailable() {
  if (!fs.existsSync(SCRIPT_PATH)) return false;
  return commandExists(getPythonCommand().command);
}

function extract(cvText, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const pythonCommand = getPythonCommand();

    if (!commandExists(pythonCommand.command)) {
      const err = new Error(pythonCommand.missingMessage);
      err.code = pythonCommand.missingCode;
      return reject(err);
    }
    if (!fs.existsSync(SCRIPT_PATH)) {
      const err = new Error(`CV NLP script not found at ${SCRIPT_PATH}`);
      err.code = 'NLP_SCRIPT_NOT_FOUND';
      return reject(err);
    }

    const proc = spawn(pythonCommand.command, pythonCommand.args, {
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
  getPythonCommand,
};
