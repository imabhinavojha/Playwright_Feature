const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const HTTPBIN_URL = 'https://httpbin.org';

test.describe('API Request Examples', () => {
  
  // GET Request Examples
  test('GET request - Fetch single resource', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    
    // Status assertions
    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
    
    // Response body assertions
    const data = await response.json();
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('body');
    expect(data).toHaveProperty('userId');
    
    // Response headers assertions
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('GET request - Fetch list of resources', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Assert array structure
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    
    // Assert first item structure
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('title');
  });

  test('GET request - With query parameters', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`, {
      params: {
        userId: 1,
        _limit: 5
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Assert filtered results
    expect(Array.isArray(data)).toBeTruthy();
    data.forEach(post => {
      expect(post.userId).toBe(1);
    });
  });

  test('GET request - Response time assertion', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${BASE_URL}/posts/1`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000); // Response should be under 5 seconds
  });

  // POST Request Examples
  test('POST request - Create new resource', async ({ request }) => {
    const newPost = {
      title: 'Test Post',
      body: 'This is a test post body',
      userId: 1
    };

    const response = await request.post(`${BASE_URL}/posts`, {
      data: newPost,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.status()).toBe(201);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('id');
    expect(responseData.title).toBe(newPost.title);
    expect(responseData.body).toBe(newPost.body);
    expect(responseData.userId).toBe(newPost.userId);
  });

  test('POST request - With custom headers', async ({ request }) => {
    const response = await request.post(`${HTTPBIN_URL}/post`, {
      data: { key: 'value' },
      headers: {
        'X-Custom-Header': 'test-value',
        'Authorization': 'Bearer token123'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Verify headers were sent
    expect(data.headers['X-Custom-Header']).toBe('test-value');
    expect(data.headers['Authorization']).toBe('Bearer token123');
  });

  // PUT Request Examples
  test('PUT request - Update entire resource', async ({ request }) => {
    const updatedPost = {
      id: 1,
      title: 'Updated Title',
      body: 'Updated body content',
      userId: 1
    };

    const response = await request.put(`${BASE_URL}/posts/1`, {
      data: updatedPost
    });
    
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.title).toBe(updatedPost.title);
    expect(responseData.body).toBe(updatedPost.body);
  });

  // PATCH Request Examples
  test('PATCH request - Partial update', async ({ request }) => {
    const partialUpdate = {
      title: 'Partially Updated Title'
    };

    const response = await request.patch(`${BASE_URL}/posts/1`, {
      data: partialUpdate
    });
    
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.title).toBe(partialUpdate.title);
    // Other fields should remain unchanged (in real API)
  });

  // DELETE Request Examples
  test('DELETE request - Remove resource', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/posts/1`);
    
    expect(response.status()).toBe(200);
  });

  // Error Handling Examples
  test('GET request - Handle 404 Not Found', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/99999`);
    
    expect(response.status()).toBe(404);
    expect(response.ok()).toBeFalsy();
  });

  test('POST request - Handle validation errors', async ({ request }) => {
    const invalidData = {
      // Missing required fields
    };

    const response = await request.post(`${BASE_URL}/posts`, {
      data: invalidData
    });
    
    // Note: JSONPlaceholder doesn't validate, but real APIs would return 400
    // This demonstrates how to check for error responses
    if (response.status() === 400) {
      const errorData = await response.json();
      expect(errorData).toHaveProperty('message');
    }
  });

  // Advanced Assertions
  test('Response body - Complex JSON structure validation', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    const data = await response.json();
    
    // Multiple property assertions
    expect(data).toMatchObject({
      id: expect.any(Number),
      userId: expect.any(Number),
      title: expect.any(String),
      body: expect.any(String)
    });
    
    // String content assertions
    expect(typeof data.title).toBe('string');
    expect(data.title.length).toBeGreaterThan(0);
  });

  test('Response headers - Multiple header assertions', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    const headers = response.headers();
    
    expect(headers).toHaveProperty('content-type');
    expect(headers['content-type']).toContain('application/json');
    
    // Check if cache-control exists (if present)
    if (headers['cache-control']) {
      expect(headers['cache-control']).toBeTruthy();
    }
  });

  // Request/Response Interception
  test('API request - Verify request payload', async ({ request }) => {
    const requestData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const response = await request.post(`${HTTPBIN_URL}/post`, {
      data: requestData
    });
    
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    
    
    // Verify the request data was sent correctly
    expect(responseData.json).toMatchObject(requestData);
  });

  // Multiple sequential requests
  test('Multiple API requests - Sequential operations', async ({ request }) => {
    // 1. Create a post
    const createResponse = await request.post(`${BASE_URL}/posts`, {
      data: {
        title: 'New Post',
        body: 'Body content',
        userId: 1
      }
    });
    expect(createResponse.status()).toBe(201);
    const createdPost = await createResponse.json();
    const postId = createdPost.id;
    
    // 2. Fetch the created post
    const getResponse = await request.get(`${BASE_URL}/posts/${postId}`);
    expect(getResponse.status()).toBe(200);
    
    // 3. Update the post
    const updateResponse = await request.put(`${BASE_URL}/posts/${postId}`, {
      data: {
        id: postId,
        title: 'Updated Post',
        body: 'Updated body',
        userId: 1
      }
    });
    expect(updateResponse.status()).toBe(200);
    
    // 4. Delete the post
    const deleteResponse = await request.delete(`${BASE_URL}/posts/${postId}`);
    expect(deleteResponse.status()).toBe(200);
  });

  // Response status code range assertions
  test('Response status - Success range (2xx)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });

  // JSON schema-like validation
  test('Response structure - Validate all required fields exist', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    const data = await response.json();
    
    const requiredFields = ['id', 'title', 'body', 'userId'];
    requiredFields.forEach(field => {
      expect(data).toHaveProperty(field);
    });
    
    // Type checking
    expect(typeof data.id).toBe('number');
    expect(typeof data.title).toBe('string');
    expect(typeof data.body).toBe('string');
    expect(typeof data.userId).toBe('number');
  });

  // Timeout and error handling
  test('Request timeout handling', async ({ request }) => {
    try {
      const response = await request.get(`${BASE_URL}/posts/1`, {
        timeout: 100 // Very short timeout for demonstration
      });
      expect(response.status()).toBe(200);
    } catch (error) {
      // Handle timeout error if it occurs
      expect(error.message).toContain('timeout');
    }
  });
});

