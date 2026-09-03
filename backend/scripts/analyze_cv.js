const fs = require('fs');
const path = require('path');
const recommendationService = require('../src/services/recommendationService');

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function printUsage() {
  console.log([
    'Usage:',
    '  node scripts/analyze_cv.js --text="..." [--track="Backend Development"]',
    '  node scripts/analyze_cv.js --file=/path/to/cv.txt [--track="Backend Development"]',
  ].join('\n'));
}

async function main() {
  const text = readArg('text');
  const file = readArg('file');
  const track = readArg('track');

  if (!text && !file) {
    printUsage();
    process.exit(1);
  }

  const input = { track };

  if (file) {
    const filePath = path.resolve(file);
    input.cvText = fs.readFileSync(filePath, 'utf8');
  } else {
    input.cvText = text;
  }

  const result = await recommendationService.analyzeCv(input);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
