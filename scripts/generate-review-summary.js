// scripts/generate-review-summary.js
const fs = require('fs');
const path = require('path');

function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function formatDuration(ms) {
  if (isNaN(ms)) return '';
  const totalSec = Math.round(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

function main() {
  const jsonPath = path.resolve(__dirname, '..', 'semgrep-results.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('⚠️ Semgrep results file not found.');
    return;
  }

  let semgrepData;
  try {
    semgrepData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    console.error('Failed to parse semgrep-results.json:', err.message);
    return;
  }

  const results = semgrepData.results || [];
  const errors = results.filter(r => r.extra?.severity === 'ERROR');
  const warnings = results.filter(r => r.extra?.severity === 'WARNING');
  const infos = results.filter(r => r.extra?.severity === 'INFO');

  // Test stats from Playwright JSON report (if exists)
  const testResultsPath = path.resolve(__dirname, '..', 'test-results', 'test-results.json');
  let testStats = {};
  if (fs.existsSync(testResultsPath)) {
    try {
      const testData = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
      testStats = testData.stats || {};
    } catch (e) {
      console.warn('Could not parse test-results.json:', e.message);
    }
  }
  // Fallback to env vars
  const testPass = parseInt(process.env.TEST_PASS || testStats.passed || '0', 10);
  const testFail = parseInt(process.env.TEST_FAIL || testStats.failed || '0', 10);
  const testFlaky = parseInt(process.env.TEST_FLAKY || testStats.flaky || '0', 10);
  const testSkipped = parseInt(process.env.TEST_SKIPPED || testStats.skipped || '0', 10);
  const testDuration = testStats.duration || 0;

  let md = '';
  md += `## 🛡️ Automated Code Quality & Security Review\n\n`;

  // Top Metrics
  md += `| Total Issues | 🔴 Errors | 🟡 Warnings | 🔵 Best Practices / Info |\n`;
  md += `| :---: | :---: | :---: | :---: |\n`;
  md += `| **${results.length}** | **${errors.length}** | **${warnings.length}** | **${infos.length}** |\n\n`;

  // Test Execution Summary Table
  if (testPass + testFail + testFlaky + testSkipped > 0) {
    md += `### 🎭 Playwright Test Execution Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| Total Tests | **${testPass + testFail + testFlaky + testSkipped}** |\n`;
    md += `| Passed 🟢 | **${testPass}** |\n`;
    md += `| Failed ❌ | **${testFail}** |\n`;
    md += `| Flaky ⚠️ | **${testFlaky}** |\n`;
    md += `| Skipped ⏭️ | **${testSkipped}** |\n`;
    md += `| Total Duration ⏱️ | **${formatDuration(testDuration)}** |\n\n`;

    // Test Results Donut Chart (Passed vs Failed)
    if (testPass + testFail > 0) {
      md += `#### 📊 Test Outcome (Passed vs Failed)\n\n`;
      md += `<div id="test-chart-container" style="width:200px;height:200px;"></div>\n`;
      md += `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n`;
      md += `<script>\n`;
      md += `  const ctx = document.getElementById('test-chart-container');\n`;
      md += `  new Chart(ctx, {\n`;
      md += `    type: 'doughnut',\n`;
      md += `    data: {\n`;
      md += `      labels: ['Passed', 'Failed'],\n`;
      md += `      datasets: [{\n`;
      md += `        data: [${testPass}, ${testFail}],\n`;
      md += `        backgroundColor: ['#28a745', '#dc3545'],\n`;
      md += `        borderWidth: 0\n`;
      md += `      }]\n`;
      md += `    },\n`;
      md += `    options: {\n`;
      md += `      responsive: true,\n`;
      md += `      plugins: {\n`;
      md += `        legend: { position: 'bottom' },\n`;
      md += `        tooltip: { enabled: true }\n`;
      md += `      }\n`;
      md += `    }\n`;
      md += `  });\n`;
      md += `</script>\n\n`;
    }
  }

  if (results.length === 0) {
    md += `> ✅ **Clean Code!** No security vulnerabilities or anti-patterns detected in the changed files.\n\n`;
  } else {
    // List Findings
    md += `<details open>\n`;
    md += `<summary><h3>🔍 Detailed Findings (${results.length}) — Click to toggle</h3></summary>\n\n`;
    md += `| Severity | Rule / Check | File & Line | Message |\n`;
    md += `| :---: | :--- | :--- | :--- |\n`;

    results.forEach(r => {
      const severityIcon = r.extra?.severity === 'ERROR' ? '🔴 Error' : r.extra?.severity === 'WARNING' ? '🟡 Warning' : '🔵 Info';
      const checkName = r.check_id ? r.check_id.split('.').pop() : 'Rule';
      const filePath = r.path || 'unknown';
      const lineNum = r.start?.line || 1;
      const message = escapeMarkdown(r.extra?.message || 'Pattern detected');

      md += `| ${severityIcon} | \`${checkName}\` | \`${filePath}:${lineNum}\` | ${message} |\n`;
    });

    md += `\n</details>\n\n`;
  }

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, md, 'utf8');
    console.log('✅ Code review summary written to $GITHUB_STEP_SUMMARY');
  } else {
    console.log(md);
  }

  // Fail CI build if any high-severity ERROR is detected to block merge
  if (errors.length > 0) {
    console.error(`\n❌ Code Review Check Failed: Found ${errors.length} critical error(s) that must be resolved before merging.`);
    process.exit(1);
  }
}

main();