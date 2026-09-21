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

  let md = '';
  md += `## 🛡️ Automated Code Quality & Security Review\n\n`;

  // Top Metrics
  md += `| Total Issues | 🔴 Errors | 🟡 Warnings | 🔵 Best Practices / Info |\n`;
  md += `| :---: | :---: | :---: | :---: |\n`;
  md += `| **${results.length}** | **${errors.length}** | **${warnings.length}** | **${infos.length}** |\n\n`;

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
}

main();
