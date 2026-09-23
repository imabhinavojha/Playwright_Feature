// scripts/generate-summary.js
const fs = require('fs');
const path = require('path');

function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function cleanErrorMessage(msg) {
  if (!msg) return '';
  // Remove ANSI escape codes
  const clean = msg.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
  // Take first 2 meaningful lines
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.slice(0, 2).join(' | ');
}

function parseSuites(suites, parentTitle = '', results = { passed: [], failed: [], flaky: [], skipped: [] }) {
  for (const suite of suites) {
    const fullTitle = parentTitle ? `${parentTitle} › ${suite.title}` : suite.title;

    if (suite.specs) {
      for (const spec of suite.specs) {
        const specTitle = fullTitle ? `${fullTitle} › ${spec.title}` : spec.title;
        const file = spec.file || suite.file || '';

        for (const test of spec.tests || []) {
          const browser = test.projectName || 'default';
          const status = test.status; // expected, unexpected, flaky, skipped

          // Compute duration and last error
          let totalDuration = 0;
          let errorMessage = '';
          for (const res of test.results || []) {
            totalDuration += res.duration || 0;
            if (res.error && res.error.message) {
              errorMessage = res.error.message;
            }
          }

          const entry = {
            file,
            title: specTitle,
            browser,
            duration: formatDuration(totalDuration),
            error: cleanErrorMessage(errorMessage)
          };

          if (status === 'unexpected') {
            results.failed.push(entry);
          } else if (status === 'flaky') {
            results.flaky.push(entry);
          } else if (status === 'skipped') {
            results.skipped.push(entry);
          } else if (status === 'expected') {
            results.passed.push(entry);
          }
        }
      }
    }

    if (suite.suites) {
      parseSuites(suite.suites, fullTitle, results);
    }
  }
  return results;
}

function processReport(report) {
  const results = parseSuites(report.suites || []);
  const stats = report.stats || {};
  const totalTests = results.passed.length + results.failed.length + results.flaky.length + results.skipped.length;
  const duration = formatDuration(stats.duration || 0);

  let md = '';

  // 1. Header & Summary Table
  md += `## 🎭 Playwright Test Execution Summary\n\n`;
  md += `| Total Tests | Passed 🟢 | Failed ❌ | Flaky ⚠️ | Skipped ⏭️ | Total Duration ⏱️ |\n`;
  md += `| :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  md += `| **${totalTests}** | **${results.passed.length}** | **${results.failed.length}** | **${results.flaky.length}** | **${results.skipped.length}** | **${duration}** |\n\n`;

  // Add donut chart for test outcomes using quickchart.io
  if (results.passed.length + results.failed.length + results.flaky.length + results.skipped.length > 0) {
    md += `### 📊 Test Outcome Distribution\n\n`;
    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: ['Passed 🟢', 'Failed ❌', 'Flaky ⚠️', 'Skipped ⏭️'],
        datasets: [{
          data: [results.passed.length, results.failed.length, results.flaky.length, results.skipped.length],
          backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#6c757d'],
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: {
                size: 11
              }
            }
          }
        },
        cutout: '65%'
      }
    };
    md += `![Test Outcome Distribution](https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=350&height=250)\n\n`;
  }

  // 2. Failed Tests (Open by default)
  if (results.failed.length > 0) {
    md += `<details open>\n`;
    md += `<summary><h3>❌ Failed Tests (${results.failed.length}) — Click to toggle</h3></summary>\n\n`;
    md += `| # | Browser | File / Test Name | Duration | Error Summary |\n`;
    md += `| :---: | :---: | :--- | :---: | :--- |\n`;
    results.failed.forEach((f, idx) => {
      md += `| ${idx + 1} | \`${f.browser}\` | \`${f.file}\`<br>**${escapeMarkdown(f.title)}** | ${f.duration} | \`${escapeMarkdown(f.error || 'Test failed')}\` |\n`;
    });
    md += `\n</details>\n\n`;
  }

  // 3. Flaky Tests (Collapsed)
  if (results.flaky.length > 0) {
    md += `<details>\n`;
    md += `<summary><h3>⚠️ Flaky Tests (${results.flaky.length}) — Click to expand</h3></summary>\n\n`;
    md += `| # | Browser | File / Test Name | Duration |\n`;
    md += `| :---: | :---: | :--- | :---: |\n`;
    results.flaky.forEach((f, idx) => {
      md += `| ${idx + 1} | \`${f.browser}\` | \`${f.file}\`<br>**${escapeMarkdown(f.title)}** | ${f.duration} |\n`;
    });
    md += `\n</details>\n\n`;
  }

  // 4. Passed Tests (Collapsed so it's NOT bulky, but searchable via browser search)
  if (results.passed.length > 0) {
    md += `<details>\n`;
    md += `<summary><h3>🟢 Passed Tests (${results.passed.length}) — Click to expand & search (Ctrl+F)</h3></summary>\n\n`;
    md += `| # | Browser | File / Test Name | Duration |\n`;
    md += `| :---: | :---: | :--- | :---: |\n`;
    results.passed.forEach((p, idx) => {
      md += `| ${idx + 1} | \`${p.browser}\` | \`${p.file}\`<br>${escapeMarkdown(p.title)} | ${p.duration} |\n`;
    });
    md += `\n</details>\n\n`;
  }

  // 5. Skipped Tests (Collapsed)
  if (results.skipped.length > 0) {
    md += `<details>\n`;
    md += `<summary><h3>⏭️ Skipped Tests (${results.skipped.length}) — Click to expand</h3></summary>\n\n`;
    md += `| # | Browser | File / Test Name |\n`;
    md += `| :---: | :---: | :--- |\n`;
    results.skipped.forEach((s, idx) => {
      md += `| ${idx + 1} | \`${s.browser}\` | \`${s.file}\`<br>${escapeMarkdown(s.title)} |\n`;
    });
    md += `\n</details>\n\n`;
  }

  // Write to GitHub Step Summary file or console
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, md, 'utf8');
    console.log('✅ GitHub Step Summary successfully written!');
  } else {
    console.log('\n--- Generated Markdown Summary ---\n');
    console.log(md);
  }
}

function main() {
  // Try multiple possible report locations
  const possiblePaths = [
    path.resolve(__dirname, '..', 'test-results', 'report.json'),
    path.resolve(__dirname, '..', 'test-results', 'report.json', '.last-run.json'),
    path.resolve(__dirname, '..', 'test-results', 'actual-report.json'),
    path.resolve(__dirname, '..', 'test-results', 'actual-report.json', '.last-run.json'),
    path.resolve(__dirname, '..', 'test-results')
  ];

  let jsonPath = null;

  for (const reportPath of possiblePaths) {
    if (fs.existsSync(reportPath)) {
      const stat = fs.statSync(reportPath);
      if (stat.isFile()) {
        jsonPath = reportPath;
        break;
      } else if (stat.isDirectory()) {
        // It's a directory, look for .last-run.json inside
        const lastRunPath = path.join(reportPath, '.last-run.json');
        if (fs.existsSync(lastRunPath)) {
          jsonPath = lastRunPath;
          break;
        } else {
          // Look for any JSON file in the directory
          try {
            const files = fs.readdirSync(reportPath);
            const jsonFile = files.find(f => f.endsWith('.json'));
            if (jsonFile) {
              jsonPath = path.join(reportPath, jsonFile);
              break;
            }
          } catch (e) {
            // Continue to next path
          }
        }
      }
    }
  }

  if (!jsonPath) {
    console.log(`⚠️ JSON report not found in any of the expected locations:`);
    console.log(`  - test-results/report.json`);
    console.log(`  - test-results/report.json/.last-run.json`);
    console.log(`  - test-results/actual-report.json`);
    console.log(`  - test-results/actual-report.json/.last-run.json`);
    console.log(`  - test-results/ (directory)`);
    return;
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const report = JSON.parse(rawData);
  processReport(report);
}

main();