const { test, expect } = require('@playwright/test');

// Note: Install axe-core first: npm install -D @axe-core/playwright
const AxeBuilder = require('@axe-core/playwright').default;

/**
 * 11.2 Accessibility Testing with axe-core
 * 
 * 🏦 BANKING: Banks like JPMorgan and Mastercard must comply with
 * ADA and WCAG 2.1 Level AA standards. Failing accessibility audits can
 * result in lawsuits and regulatory fines.
 * 
 * Installation:
 * npm install -D @axe-core/playwright
 */

test.describe('11.2 Accessibility Testing with axe-core', () => {
  

  test('Testing Specific WCAG Criteria - Banking Form', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    if (results.violations.length > 0) {
      console.log('Accessibility Violations:');
      results.violations.forEach(violation => {
        console.log(`- ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Elements: ${violation.nodes.length}`);
        console.log(`  Help: ${violation.helpUrl}`);
      });
    }
    
    expect(results.violations).toEqual([]);
    
    
    // Placeholder test
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('WCAG 2.1 Level AA compliance testing requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility with Exclusions - Exclude Known Issues', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    const results = await new AxeBuilder({ page })
      .exclude('.third-party-widget') // Exclude third-party components
      .disableRules(['color-contrast']) // Temporary exclusion for known issues
      .analyze();
    
    expect(results.violations).toEqual([]);
    
    
    // Placeholder test
    await page.goto('https://the-internet.herokuapp.com/');
    console.log('Exclusion patterns available with @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('WCAG 2.1 Level A Compliance', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a']) // Level A only
      .analyze();
    
    console.log(`WCAG 2.1 Level A violations: ${results.violations.length}`);
    
    if (results.violations.length > 0) {
      results.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('WCAG 2.1 Level A testing requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('WCAG 2.1 Level AA Compliance - Banking Standard', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Banks must comply with WCAG 2.1 Level AA
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa']) // Level AA compliance
      .analyze();
    
    if (results.violations.length > 0) {
      console.log('🚨 WCAG 2.1 Level AA Violations Found:');
      console.log('These violations could result in regulatory fines or lawsuits.');
      
      results.violations.forEach(violation => {
        console.log(`\n❌ ${violation.id}`);
        console.log(`   Description: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Affected Elements: ${violation.nodes.length}`);
        console.log(`   Help: ${violation.helpUrl}`);
        
        // Show first affected element
        if (violation.nodes.length > 0) {
          console.log(`   Example: ${violation.nodes[0].html}`);
        }
      });
    }
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('🏦 Banking compliance (WCAG 2.1 Level AA) requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Critical WCAG Success Criteria - Banking Compliance', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Critical WCAG Success Criteria for Banking:
    // • 1.1.1: Text Alternatives (Level A)
    // • 1.3.1: Info and Relationships (Level A)
    // • 1.4.3: Contrast (Minimum) (Level AA)
    // • 2.1.1: Keyboard (Level A)
    // • 2.4.7: Focus Visible (Level AA)
    // • 3.3.2: Labels or Instructions (Level A)
    
    const results = await new AxeBuilder({ page })
      .withRules([
        'image-alt',           // 1.1.1: Text Alternatives
        'landmark-one-main',   // 1.3.1: Info and Relationships
        'color-contrast',      // 1.4.3: Contrast (Minimum)
        'keyboard',            // 2.1.1: Keyboard
        'focus-visible',       // 2.4.7: Focus Visible
        'label'                // 3.3.2: Labels or Instructions
      ])
      .analyze();
    
    if (results.violations.length > 0) {
      console.log('🚨 Critical WCAG Criteria Violations:');
      results.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('Critical WCAG criteria testing requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - Specific Page Section', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Test only a specific section of the page
    const formSection = page.locator('form');
    
    const results = await new AxeBuilder({ page })
      .include('form') // Test only the form section (use selector string)
      .analyze();
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('Section-specific testing available with @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - Multiple Pages', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    const pages = [
      '/',
      '/login',
      '/secure'
    ];
    
    for (const pagePath of pages) {
      await page.goto(`https://the-internet.herokuapp.com${pagePath}`);
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();
      
      if (results.violations.length > 0) {
        console.log(`Violations on ${pagePath}:`, results.violations.length);
      }
      
      expect(results.violations).toEqual([]);
    }
    
    
    await page.goto('https://the-internet.herokuapp.com/');
    console.log('Multi-page accessibility testing requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - With Custom Options', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        runOnly: {
          type: 'tag',
          values: ['wcag2aa']
        },
        rules: {
          'color-contrast': { enabled: true },
          'image-alt': { enabled: true }
        }
      })
      .analyze();
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/');
    console.log('Custom axe options available with @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - Report Violations in Detail', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    if (results.violations.length > 0) {
      console.log('\n=== ACCESSIBILITY VIOLATIONS REPORT ===\n');
      console.log(`Total Violations: ${results.violations.length}\n`);
      
      results.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}`);
        console.log(`   Description: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Tags: ${violation.tags.join(', ')}`);
        console.log(`   Affected Elements: ${violation.nodes.length}`);
        console.log(`   Help URL: ${violation.helpUrl}`);
        
        // Show affected elements
        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`\n   Element ${nodeIndex + 1}:`);
          console.log(`   - HTML: ${node.html.substring(0, 100)}...`);
          if (node.failureSummary) {
            console.log(`   - Issue: ${node.failureSummary}`);
          }
        });
        
        console.log('\n');
      });
    }
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('Detailed violation reporting requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - CI/CD Integration Pattern', async ({ page }) => {
    // ✅ BEST PRACTICE: Run accessibility tests in CI/CD to catch violations
    // before production. A single lawsuit can cost millions.
    
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    // In CI/CD, fail the build if violations are found
    if (results.violations.length > 0) {
      const violationSummary = results.violations.map(v => ({
        id: v.id,
        description: v.description,
        impact: v.impact,
        count: v.nodes.length
      }));
      
      // Log for CI/CD visibility
      console.error('Accessibility violations found:', JSON.stringify(violationSummary, null, 2));
      
      // Fail the test
      throw new Error(
        `Found ${results.violations.length} accessibility violations. ` +
        `This build cannot be deployed. Fix violations before proceeding.`
      );
    }
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('✅ CI/CD integration pattern ready - install @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - Banking Transfer Form Example', async ({ page }) => {
    // Example: Banking transfer form must be fully accessible
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Login first
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Navigate to transfer page (example)
    // await page.goto('/transfer');
    
    // Test banking form accessibility
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('form') // Test only the form
      .analyze();
    
    if (results.violations.length > 0) {
      console.log('🚨 Banking Form Accessibility Violations:');
      console.log('These must be fixed before production deployment.');
      
      results.violations.forEach(violation => {
        console.log(`\n❌ ${violation.id}`);
        console.log(`   ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Elements: ${violation.nodes.length}`);
      });
    }
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('🏦 Banking form accessibility testing requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - Exclude Third-Party Widgets', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    const results = await new AxeBuilder({ page })
      .exclude('.third-party-widget') // Exclude third-party components
      .exclude('#chatbot') // Exclude chatbot
      .exclude('[data-third-party="true"]') // Exclude any third-party elements
      .withTags(['wcag2aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/');
    console.log('Third-party exclusion available with @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - Disable Specific Rules Temporarily', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Temporarily disable rules for known issues being fixed
    const results = await new AxeBuilder({ page })
      .disableRules([
        'color-contrast', // Known issue, being fixed
        'aria-hidden-focus' // Temporary workaround
      ])
      .withTags(['wcag2aa'])
      .analyze();
    
    // Note: Only disable rules temporarily. Fix issues ASAP.
    expect(results.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/');
    console.log('Rule disabling available with @axe-core/playwright (use temporarily only)');
    expect(page).toBeTruthy();
  });

  test('Accessibility Test - Full Page Scan with All Rules', async ({ page }) => {
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Run all accessibility rules
    const results = await new AxeBuilder({ page })
      .analyze(); // No filters - test everything
    
    console.log(`Total violations: ${results.violations.length}`);
    console.log(`Total passes: ${results.passes.length}`);
    console.log(`Total incomplete: ${results.incomplete.length}`);
    
    // Log summary
    if (results.violations.length > 0) {
      const violationsByImpact = {
        critical: results.violations.filter(v => v.impact === 'critical').length,
        serious: results.violations.filter(v => v.impact === 'serious').length,
        moderate: results.violations.filter(v => v.impact === 'moderate').length,
        minor: results.violations.filter(v => v.impact === 'minor').length
      };
      
      console.log('\nViolations by Impact:');
      console.log(JSON.stringify(violationsByImpact, null, 2));
    }
    
    expect(results.violations).toEqual([]);
    
    await page.goto('https://the-internet.herokuapp.com/');
    console.log('Full page scan available with @axe-core/playwright');
    expect(page).toBeTruthy();
  });
});

test.describe('11.3 Banking Compliance & WCAG Standards', () => {
  
  test('WCAG 2.1 Level AA - Complete Compliance Check', async ({ page }) => {
    // 🏦 BANKING: Complete WCAG 2.1 Level AA compliance check
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();
    
    // Banking compliance requires zero violations
    if (results.violations.length > 0) {
      const criticalViolations = results.violations.filter(v => 
        v.impact === 'critical' || v.impact === 'serious'
      );
      
      if (criticalViolations.length > 0) {
        console.error('🚨 CRITICAL: Banking compliance violation detected!');
        console.error('These must be fixed immediately to avoid regulatory fines.');
        throw new Error(`Found ${criticalViolations.length} critical accessibility violations`);
      }
    }
    
    expect(results.violations).toEqual([]);
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('🏦 Banking compliance check requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });

  test('Critical WCAG Success Criteria - Individual Rule Testing', async ({ page }) => {
    // Test each critical WCAG criterion individually
    // Uncomment after installing @axe-core/playwright
    
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // 1.1.1: Text Alternatives (Level A)
    const textAltResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();
    expect(textAltResults.violations).toEqual([]);
    
    // 1.3.1: Info and Relationships (Level A)
    const relationshipsResults = await new AxeBuilder({ page })
      .withRules(['landmark-one-main', 'page-has-heading-one'])
      .analyze();
    expect(relationshipsResults.violations).toEqual([]);
    
    // 1.4.3: Contrast (Minimum) (Level AA)
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    expect(contrastResults.violations).toEqual([]);
    
    // 2.1.1: Keyboard (Level A)
    const keyboardResults = await new AxeBuilder({ page })
      .withRules(['keyboard'])
      .analyze();
    expect(keyboardResults.violations).toEqual([]);
    
    // 2.4.7: Focus Visible (Level AA)
    const focusResults = await new AxeBuilder({ page })
      .withRules(['focus-visible'])
      .analyze();
    expect(focusResults.violations).toEqual([]);
    
    // 3.3.2: Labels or Instructions (Level A)
    const labelResults = await new AxeBuilder({ page })
      .withRules(['label'])
      .analyze();
    expect(labelResults.violations).toEqual([]);
    
    
    await page.goto('https://the-internet.herokuapp.com/login');
    console.log('Individual WCAG criteria testing requires @axe-core/playwright');
    expect(page).toBeTruthy();
  });
});

