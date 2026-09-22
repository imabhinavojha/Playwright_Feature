// scripts/generate-review-summary.js
const fs = require('fs');
const path = require('path');

function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
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

  // Test pass/fail from env vars (set by prior test job)
  const testPass = parseInt(process.env.TEST_PASS || '0', 10);
  const testFail = parseInt(process.env.TEST_FAIL || '0', 10);

  let md = '';
  md += `## 🛡️ Automated Code Quality & Security Review\n\n`;

  // Top Metrics
  md += `| Total Issues | 🔴 Errors | 🟡 Warnings | 🔵 Best Practices / Info |\n`;
  md += `| :---: | :---: | :---: | :---: |\n`;
  md += `| **${results.length}** | **${errors.length}** | **${warnings.length}** | **${infos.length}** |\n\n`;

  // Test Results Donut Chart
  if (testPass + testFail > 0) {
    md += `### 📊 Test Results\n\n`;
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
