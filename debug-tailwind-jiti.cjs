// Small debug script to probe Tailwind/jiti resolution
const fs = require('fs');
const path = require('path');

function writeLog(payload) {
  const body = JSON.stringify(payload);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/af0c4fbf-758c-4228-916c-2c27258d26cc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {});
  // #endregion

  try {
    const logPath = path.join(
      'c:',
      'Users',
      'Shubham Kumbhar',
      'ai_market_intelligence',
      '.cursor',
      'debug.log',
    );
    fs.appendFileSync(logPath, body + '\n');
  } catch {
    // ignore file logging errors
  }
}

writeLog({
  id: 'log_pre_fix_start',
  runId: 'pre-fix',
  hypothesisId: 'A',
  location: 'debug-tailwind-jiti.cjs:1',
  message: 'Starting Tailwind jiti debug script',
  data: {
    nodeVersion: process.version,
  },
  timestamp: Date.now(),
});

async function main() {
  const hasJiti =
    (() => {
      try {
        require.resolve('jiti');
        return true;
      } catch {
        return false;
      }
    })();

  writeLog({
    id: 'log_pre_fix_has_jiti',
    runId: 'pre-fix',
    hypothesisId: 'A',
    location: 'debug-tailwind-jiti.cjs:32',
    message: 'Checked jiti resolution',
    data: { hasJiti },
    timestamp: Date.now(),
  });

  try {
    require('tailwindcss/lib/lib/load-config.js');

    writeLog({
      id: 'log_pre_fix_loaded_tailwind_load_config',
      runId: 'pre-fix',
      hypothesisId: 'B',
      location: 'debug-tailwind-jiti.cjs:52',
      message: 'Successfully required tailwindcss load-config',
      data: {},
      timestamp: Date.now(),
    });
  } catch (error) {
    writeLog({
      id: 'log_pre_fix_error_tailwind_load_config',
      runId: 'pre-fix',
      hypothesisId: 'B',
      location: 'debug-tailwind-jiti.cjs:63',
      message: 'Error requiring tailwindcss load-config',
      data: { name: error && error.name, message: error && error.message },
      timestamp: Date.now(),
    });
  }
}

main();

