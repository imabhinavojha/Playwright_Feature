// extractFail.js
// Fetches the latest workflow run for Playwright Tests from GitHub Actions,
// downloads the job logs, parses pass/fail/skipped test cases,
// and saves them to a .json file.

const fs = require('fs');
const path = require('path');

// Automatically load .env file from project root if present
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const OWNER = 'imabhinavojha';
const REPO = 'Playwright_Feature';
const WORKFLOW_FILE = 'playwright.yml';
const OUTPUT_PATH = path.resolve(__dirname, 'pipeline-test-results.json');

// Optional GitHub Token for authentication (increases rate limits & allows log downloads)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

const headers = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'Playwright-Result-Extractor',
  ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {}),
};

function stripAnsi(str) {
  // Removes ANSI color/formatting escape codes
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

async function fetchJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { credentials: 'omit', redirect: 'follow', headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function extractResults() {
  console.log(`🔎 Checking latest workflow runs for ${OWNER}/${REPO}...`);

  // 1. Get the latest completed or in-progress run
  const runsUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=5`;
  const runsData = await fetchJson(runsUrl);

  const runs = runsData.workflow_runs || [];
  if (runs.length === 0) {
    console.error('❌ No workflow runs found.');
    return;
  }

  // Pick the latest completed run, or fall back to the most recent run
  const run = runs.find(r => r.status === 'completed') || runs[0];
  console.log(`📌 Selected Run: #${run.run_number} (ID: ${run.id})`);
  console.log(`   Status: ${run.status}, Conclusion: ${run.conclusion || 'pending'}`);
  console.log(`   Commit: ${run.head_commit?.message?.split('\n')[0]} (${run.head_sha.substring(0, 7)})`);
  console.log(`   URL: ${run.html_url}`);

  // 2. Fetch jobs for the run
  const jobsUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${run.id}/jobs`;
  const jobsData = await fetchJson(jobsUrl);
  const jobs = jobsData.jobs || [];

  const testJob = jobs.find(j => j.name === 'test' || j.name.toLowerCase().includes('test')) || jobs[0];
  if (!testJob) {
    console.error('❌ No test job found in this run.');
    return;
  }

  console.log(`🎯 Found Job: "${testJob.name}" (ID: ${testJob.id}, Status: ${testJob.status})`);

  // 3. Download job logs
  console.log('📥 Downloading job logs...');
  const logsUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/jobs/${testJob.id}/logs`;
  let rawLogs = '';
  try {
    rawLogs = await fetchText(logsUrl);
  } catch (err) {
    console.error(`❌ Unable to download logs (Job may still be running or logs expired):`, err.message);
    return;
  }

  // 4. Parse test results from log lines
  const cleanLogs = stripAnsi(rawLogs);
  const lines = cleanLogs.split('\n');

  const passedTests = [];
  const failedTests = [];
  const skippedTests = [];

  // Matches lines like:
  // "2026-09-21T07:15:32.1234567Z   ✓  1 [chromium] › example.spec.js:4:5 › test name (1.2s)"
  // "  ✘  2 [chromium] › login.spec.js:10:5 › login failed (500ms)"
  // "  -  3 [chromium] › skip.spec.js:10:5 › skipped test"
  const testRegex = /(?:^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s+)?\s*([✓✔✘✖\-\–])\s+\d+\s+\[([^\]]+)\]\s+›\s+(.+?)(?:\s+\([^)]+\))?\s*$/;

  for (const line of lines) {
    const match = line.match(testRegex);
    if (match) {
      const symbol = match[1];
      const browser = match[2].trim();
      const testPathAndName = match[3].trim();

      const testEntry = {
        browser,
        test: testPathAndName,
      };

      if (symbol === '✓' || symbol === '✔') {
        passedTests.push(testEntry);
      } else if (symbol === '✘' || symbol === '✖') {
        failedTests.push(testEntry);
      } else {
        skippedTests.push(testEntry);
      }
    }
  }

  const outputData = {
    repository: `${OWNER}/${REPO}`,
    workflow: WORKFLOW_FILE,
    runNumber: run.run_number,
    runId: run.id,
    runUrl: run.html_url,
    status: run.status,
    conclusion: run.conclusion,
    commit: {
      sha: run.head_sha,
      message: run.head_commit?.message || '',
    },
    summary: {
      total: passedTests.length + failedTests.length + skippedTests.length,
      passed: passedTests.length,
      failed: failedTests.length,
      skipped: skippedTests.length,
    },
    failed: failedTests,
    passed: passedTests,
    skipped: skippedTests,
    extractedAt: new Date().toISOString(),
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), 'utf8');
  console.log('\n📊 Summary:');
  console.log(`   Total Tests: ${outputData.summary.total}`);
  console.log(`   Passed:      ${outputData.summary.passed}`);
  console.log(`   Failed:      ${outputData.summary.failed}`);
  console.log(`   Skipped:     ${outputData.summary.skipped}`);
  console.log(`\n💾 Results successfully saved to: ${OUTPUT_PATH}`);
}

extractResults().catch(err => {
  console.error('❌ Error executing script:', err);
  process.exit(1);
});
