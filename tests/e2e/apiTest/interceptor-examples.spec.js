const { test, expect } = require('@playwright/test');

test.describe('API Interceptor Examples', () => {
  
  test('Mock Login API without external website', async ({ page }) => {
    // 1) Mock API first
    await page.route('**/api/login', async route => {
      const req = route.request();
      const body = JSON.parse(req.postData() || '{}');
  
      console.log('ROUTE HIT', body);
  
      if (body.username === 'abhinav' && body.password === '123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Login successful! Welcome Abhinav.' })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid username or password' })
        });
      }
    }); 
  
    // 2) Inline HTML + JS (no page.goto)
    await page.setContent(`
      <html>
        <body>
          <input id="username" placeholder="Username" />
          <input id="password" placeholder="Password" type="password" />
          <button id="loginBtn">Login</button>
          <div id="result"></div>
  
          <script>
            document.getElementById('loginBtn').onclick = async () => {
              const username = document.getElementById('username').value;
              const password = document.getElementById('password').value;
  
              // Use absolute URL so it goes through the network stack
              const response = await fetch('http://example.com/api/login', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
              });
  
              const data = await response.json();
              document.getElementById('result').innerText = data.message;
            };
          </script>
        </body>
      </html>
    `); 
  
    // Optional debug logs
    page.on('request', r => console.log('>>', r.method(), r.url()));
    page.on('response', r => console.log('<<', r.status(), r.url()));
  
    // 3) Interact with UI
    await page.fill('#username', 'abhinav');
    await page.fill('#password', '123');
    await page.click('#loginBtn');
  
    // 4) Assertion
    await expect(page.locator('#result'))
      .toHaveText('Login successful! Welcome Abhinav.', { timeout: 5000 }); // [web:18]
  })
  
  // Basic GET Interceptor
  test('Intercept GET request and mock response', async ({ page }) => {
    // Setup interceptor before navigation
    await page.route('**/api/users/**', async route => {
      const response = await route.fetch();
      const json = await response.json();
      
      // Mock the response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Mocked User',
          email: 'mocked@example.com'
        })
      });
    });

    // Create a page that makes the API call
    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://jsonplaceholder.typicode.com/users/1')
              .then(res => res.json())
              .then(data => {
                document.getElementById('result').textContent = data.name;
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('Mocked User');
  });

  // POST Interceptor with Request Validation
  test('Intercept POST request and validate payload', async ({ page }) => {
    let interceptedRequest = null;

    await page.route('**/api/posts', async route => {
      const request = route.request();
      interceptedRequest = request;
      const postData = JSON.parse(request.postData() || '{}');
      
      // Validate request payload
      expect(postData).toHaveProperty('title');
      expect(postData).toHaveProperty('body');
      
      // Mock successful response
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 999,
          ...postData,
          userId: 1
        })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://jsonplaceholder.typicode.com/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: 'Test Post',
                body: 'Test Body'
              })
            })
            .then(res => res.json())
            .then(data => {
              document.getElementById('result').textContent = data.id;
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('999');
    expect(interceptedRequest).not.toBeNull();
    // expect(interceptedRequest!.method()).toBe('POST');
  });

  // Conditional Interception based on Request
  test('Intercept with conditional logic based on request data', async ({ page }) => {
    await page.route('**/api/login', async route => {
      const request = route.request();
      const body = JSON.parse(request.postData() || '{}');
      
      if (body.username === 'admin' && body.password === 'admin123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ token: 'mock-token-123', message: 'Login successful' })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' })
        });
      }
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
              })
            })
            .then(res => res.json())
            .then(data => {
              document.getElementById('result').textContent = data.message;
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('Login successful');
  });

  // Intercept and Modify Headers
  test('Intercept and add/modify response headers', async ({ page }) => {
    await page.route('**/api/data', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'mock-value',
          'X-Request-ID': '12345'
        },
        body: JSON.stringify({ data: 'mocked' })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/data')
              .then(res => {
                document.getElementById('result').textContent = 
                  res.headers.get('X-Custom-Header');
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('mock-value');
  });

  // Intercept Multiple Endpoints
  test('Intercept multiple endpoints with different responses', async ({ page }) => {
    // Intercept users endpoint
    await page.route('**/api/users/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'User 1' })
      });
    });

    // Intercept posts endpoint
    await page.route('**/api/posts/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, title: 'Post 1' })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="user"></div>
          <div id="post"></div>
          <script>
            Promise.all([
              fetch('https://example.com/api/users/1').then(r => r.json()),
              fetch('https://example.com/api/posts/1').then(r => r.json())
            ]).then(([user, post]) => {
              document.getElementById('user').textContent = user.name;
              document.getElementById('post').textContent = post.title;
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#user')).toHaveText('User 1');
    await expect(page.locator('#post')).toHaveText('Post 1');
  });

  // Intercept and Assert Request Headers
  test('Intercept and validate request headers', async ({ page }) => {
    let capturedHeaders = null;

    await page.route('**/api/secure', async route => {
      const request = route.request();
      capturedHeaders = request.headers();
      
      // Validate required headers
      expect(capturedHeaders['authorization']).toBe('Bearer token123');
      expect(capturedHeaders['content-type']).toBe('application/json');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/secure', {
              headers: {
                'Authorization': 'Bearer token123',
                'Content-Type': 'application/json'
              }
            })
            .then(res => res.json())
            .then(data => {
              document.getElementById('result').textContent = data.success;
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('true');
  });

  // Intercept PUT Request
  test('Intercept PUT request and mock update response', async ({ page }) => {
    await page.route('**/api/users/1', async route => {
      const request = route.request();
      const updateData = JSON.parse(request.postData() || '{}');
      
      expect(request.method()).toBe('PUT');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          ...updateData,
          updated: true
        })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/users/1', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Updated Name' })
            })
            .then(res => res.json())
            .then(data => {
              document.getElementById('result').textContent = data.name;
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('Updated Name');
  });

  // Intercept DELETE Request
  test('Intercept DELETE request and mock deletion response', async ({ page }) => {
    await page.route('**/api/users/1', async route => {
      const request = route.request();
      expect(request.method()).toBe('DELETE');
      
      await route.fulfill({
        status: 204,
        body: ''
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/users/1', {
              method: 'DELETE'
            })
            .then(res => {
              document.getElementById('result').textContent = res.status;
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('204');
  });

  // Intercept with Latency/Delay
  test('Intercept and add latency to response', async ({ page }) => {
    const startTime = Date.now();
    
    await page.route('**/api/slow', async route => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: 'delayed response' })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/slow')
              .then(res => res.json())
              .then(data => {
                document.getElementById('result').textContent = data.data;
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(2000);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    await expect(page.locator('#result')).toHaveText('delayed response');
    expect(duration).toBeGreaterThanOrEqual(1000);
  });

  // Intercept and Return Error Status
  test('Intercept and return error responses', async ({ page }) => {
    await page.route('**/api/error', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Something went wrong'
        })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="status"></div>
          <div id="error"></div>
          <script>
            fetch('https://example.com/api/error')
              .then(res => {
                document.getElementById('status').textContent = res.status;
                return res.json();
              })
              .then(data => {
                document.getElementById('error').textContent = data.error;
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#status')).toHaveText('500');
    await expect(page.locator('#error')).toHaveText('Internal Server Error');
  });

  // Intercept with URL Pattern Matching
  test('Intercept using URL pattern matching', async ({ page }) => {
    await page.route('**/api/**/details', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ details: 'matched pattern' })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/users/details')
              .then(res => res.json())
              .then(data => {
                document.getElementById('result').textContent = data.details;
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('matched pattern');
  });

  // Unroute - Remove Interceptor
  test('Unroute to remove interceptor', async ({ page }) => {
    // Setup initial interceptor
    await page.route('**/api/data', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: 'mocked' })
      });
    });

    // Remove interceptor
    await page.unroute('**/api/data');

    // Now request will go through normally (or fail if endpoint doesn't exist)
    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/data')
              .catch(err => {
                document.getElementById('result').textContent = 'no-interceptor';
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    // The request will fail since we removed the interceptor and endpoint doesn't exist
  });

  // Intercept and Continue (Modify then Continue)
  test('Intercept, modify request, then continue', async ({ page }) => {
    await page.route('**/api/data', async route => {
      const request = route.request();
      
      // Modify headers
      const headers = {
        ...request.headers(),
        'X-Modified': 'true'
      };
      
      // Continue with modified request
      await route.continue({ headers });
    });

    // Note: This requires the actual endpoint to exist or another interceptor
    // For demo, we'll use a second interceptor to catch the modified request
    await page.route('**/api/data', async route => {
      const request = route.request();
      const modifiedHeader = request.headers()['x-modified'];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ headerModified: modifiedHeader === 'true' })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/api/data')
              .then(res => res.json())
              .then(data => {
                document.getElementById('result').textContent = data.headerModified;
              });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
  });
});

// ============================================================================
// SPECIFIC MOCK IMPLEMENTATION FOR AJIO ORDERS ENDPOINT
// ============================================================================

test.describe('Ajio Orders Mock Implementation', () => {
  
  test('Mock Ajio Orders API - POST /ajio/orders with FastAPI-like response', async ({ page }) => {
    // Mock the masquerader URL creation endpoint (if needed)
    await page.route('**/masquerader/url/create/', async route => {
      const request = route.request();
      const requestData = JSON.parse(request.postData() || '{}');
      
      // Validate the request matches the curl command
      expect(requestData.identifier).toBe('Ajio Mock Bag Confirm Mock');
      expect(requestData.request_type).toBe('POST');
      expect(requestData.url).toBe('/ajio/orders');
      expect(requestData.status_code).toBe(200);
      
      // Mock the creation response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'mock-id-123',
          message: 'Mock URL created successfully'
        })
      });
    });

    // Mock the actual /ajio/orders endpoint
    await page.route('**/ajio/orders', async route => {
      const request = route.request();
      
      // Validate request method
      expect(request.method()).toBe('POST');
      
      // Validate headers
      const headers = request.headers();
      expect(headers['content-type']).toContain('application/json');
      
      // Validate request payload
      const payload = JSON.parse(request.postData() || '{}');
      expect(payload).toHaveProperty('order_id');
      expect(payload).toHaveProperty('status');
      expect(payload).toHaveProperty('order_lines');
      expect(Array.isArray(payload.order_lines)).toBeTruthy();
      
      // Mock the response as defined in the curl command
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          failed_items: [],
          success: [
            {
              order_lines: [
                {
                  order_item_id: 'Ajio251024184425,1',
                  confirmed_quantity: 1,
                  cancelled_quantity: 0
                }
              ],
              order_id: 'Ajio251024184425',
              order_status: 'Acknowledge'
            }
          ]
        })
      });
    });

    // Test page that simulates the API call
    await page.setContent(`
      <html>
        <body>
          <div id="order-status"></div>
          <div id="order-id"></div>
          <div id="order-item-id"></div>
          <div id="confirmed-qty"></div>
          <script>
            // Simulate the order confirmation API call
            fetch('https://example.com/ajio/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                order_id: 'Ajio251024184425',
                status: 'Acknowledge',
                order_lines: [
                  {
                    order_item_id: 'Ajio251024184425.1',
                    confirmed_quantity: 1,
                    cancelled_quantity: 0
                  }
                ]
              })
            })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.success.length > 0) {
                const order = data.success[0];
                document.getElementById('order-status').textContent = order.order_status;
                document.getElementById('order-id').textContent = order.order_id;
                document.getElementById('order-item-id').textContent = order.order_lines[0].order_item_id;
                document.getElementById('confirmed-qty').textContent = order.order_lines[0].confirmed_quantity;
              }
            })
            .catch(err => {
              document.getElementById('order-status').textContent = 'Error: ' + err.message;
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(2000);
    
    // Assertions on the mocked response
    await expect(page.locator('#order-status')).toHaveText('Acknowledge');
    await expect(page.locator('#order-id')).toHaveText('Ajio251024184425');
    await expect(page.locator('#order-item-id')).toHaveText('Ajio251024184425,1');
    await expect(page.locator('#confirmed-qty')).toHaveText('1');
  });

  test('Mock Ajio Orders API - Using request context with browser', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Setup the interceptor
    await page.route('**/ajio/orders', async route => {
      const request = route.request();
      const payload = JSON.parse(request.postData() || '{}');
      
      // Assertions on incoming request
      expect(request.method()).toBe('POST');
      expect(payload.order_id).toBe('Ajio251024184425');
      expect(payload.status).toBe('Acknowledge');
      
      // Return mocked response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          failed_items: [],
          success: [
            {
              order_lines: [
                {
                  order_item_id: 'Ajio251024184425,1',
                  confirmed_quantity: 1,
                  cancelled_quantity: 0
                }
              ],
              order_id: 'Ajio251024184425',
              order_status: 'Acknowledge'
            }
          ]
        })
      });
    });

    // Make the API call through the page context
    const response = await page.request.post('https://example.com/ajio/orders', {
      data: {
        order_id: 'Ajio251024184425',
        status: 'Acknowledge',
        order_lines: [
          {
            order_item_id: 'Ajio251024184425.1',
            confirmed_quantity: 1,
            cancelled_quantity: 0
          }
        ]
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assertions on response
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    
    expect(responseData).toHaveProperty('success');
    expect(Array.isArray(responseData.success)).toBeTruthy();
    expect(responseData.success.length).toBe(1);
    expect(responseData.success[0].order_id).toBe('Ajio251024184425');
    expect(responseData.success[0].order_status).toBe('Acknowledge');
    expect(responseData.success[0].order_lines[0].order_item_id).toBe('Ajio251024184425,1');
    expect(responseData.success[0].order_lines[0].confirmed_quantity).toBe(1);
    expect(responseData.success[0].order_lines[0].cancelled_quantity).toBe(0);
    expect(responseData.failed_items).toEqual([]);
    
    await context.close();
  });

  test('Mock Ajio Orders API - With authentication headers', async ({ page }) => {
    // Mock with authentication headers as per the curl command
    await page.route('**/ajio/orders', async route => {
      const request = route.request();
      const headers = request.headers();
      
      // Validate authentication headers if needed
      // Note: The curl shows Basic auth, but we'll focus on the order endpoint
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          failed_items: [],
          success: [
            {
              order_lines: [
                {
                  order_item_id: 'Ajio251024184425,1',
                  confirmed_quantity: 1,
                  cancelled_quantity: 0
                }
              ],
              order_id: 'Ajio251024184425',
              order_status: 'Acknowledge'
            }
          ]
        })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <div id="result"></div>
          <script>
            fetch('https://example.com/ajio/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ZmxpcGthcnQ6cGFzc3dvcmQ='
              },
              body: JSON.stringify({
                order_id: 'Ajio251024184425',
                status: 'Acknowledge',
                order_lines: [
                  {
                    order_item_id: 'Ajio251024184425.1',
                    confirmed_quantity: 1,
                    cancelled_quantity: 0
                  }
                ]
              })
            })
            .then(res => res.json())
            .then(data => {
              document.getElementById('result').textContent = 
                JSON.stringify(data.success[0].order_status);
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForTimeout(1000);
    await expect(page.locator('#result')).toHaveText('"Acknowledge"');
  });
});

